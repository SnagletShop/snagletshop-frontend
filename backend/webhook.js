//start3
/**
 * GitHub webhook deployer (push -> reset to origin/main -> npm ci -> pm2 restart)
 *
 * Endpoint: POST /webhook      (matches your GitHub URL: http://91.99.147.194:9000/webhook)
 * Health:   GET  /health
 * Status:   GET  /status
 *
 * Required env:
 *   WEBHOOK_SECRET=...          (must match GitHub webhook secret)
 *
 * Optional env:
 *   WEBHOOK_PORT=9000
 *   REPO_DIR=/root/snagletshop-backend
 *   PM2_PROCESS_NAME=server
 *   DEPLOY_BRANCH=main
 *   ALLOWED_REPO_FULLNAME=SnagletShop/snagletshop-backend   (recommended)
 *   LOCK_FILE=/tmp/snagletshop-deploy.lock
 *   STALE_LOCK_MS=900000        (15 minutes)
 *   CMD_TIMEOUT_MS=600000       (10 minutes per command)
 *
 * Notes:
 * - Run this webhook under the SAME OS user that owns your PM2 process list.
 * - GitHub webhook "Content type" can be JSON or form; this handles both.
 * - Responds immediately (202) to avoid GitHub timeouts.
 */

"use strict";

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const util = require("util");
const querystring = require("querystring");
const { execFile } = require("child_process");
const execFileAsync = util.promisify(execFile);

const app = express();

const PORT = Number(process.env.WEBHOOK_PORT || 9000);
const SECRET = String(process.env.WEBHOOK_SECRET || "");

const REPO_DIR = String(process.env.REPO_DIR || "/root/snagletshop-backend");
const PM2_PROCESS_NAME = String(process.env.PM2_PROCESS_NAME || "server");
const DEPLOY_BRANCH = String(process.env.DEPLOY_BRANCH || "main");

const ALLOWED_REPO_FULLNAME = String(process.env.ALLOWED_REPO_FULLNAME || "");
const LOCK_FILE = String(process.env.LOCK_FILE || "/tmp/snagletshop-deploy.lock");
const STALE_LOCK_MS = Number(process.env.STALE_LOCK_MS || 15 * 60 * 1000);
const CMD_TIMEOUT_MS = Number(process.env.CMD_TIMEOUT_MS || 10 * 60 * 1000);

const MAX_BUFFER = 10 * 1024 * 1024;

const state = {
  last: null, // { id, startedAt, endedAt, ok, sha, ref, error, logs[] }
  running: false,
};

function nowIso() {
  return new Date().toISOString();
}

function timingSafeEqualStr(a, b) {
  const aa = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}

function computeExpectedSig(secret, rawBodyBuf) {
  return (
    "sha256=" +
    crypto.createHmac("sha256", secret).update(rawBodyBuf).digest("hex")
  );
}

function parseGitHubPayload(rawBodyBuf) {
  const raw = rawBodyBuf.toString("utf8");

  // GitHub can send either JSON or application/x-www-form-urlencoded (payload=...).
  // Try JSON first; if it fails, try urlencoded with "payload".
  try {
    return JSON.parse(raw);
  } catch {
    const parsed = querystring.parse(raw);
    if (!parsed || typeof parsed.payload !== "string") {
      throw new Error("INVALID_JSON_OR_FORM");
    }
    return JSON.parse(parsed.payload);
  }
}

function isStaleLock(lockPath) {
  try {
    const st = fs.statSync(lockPath);
    const age = Date.now() - st.mtimeMs;
    return age > STALE_LOCK_MS;
  } catch {
    return false;
  }
}

function acquireLock(lockPath) {
  try {
    const fd = fs.openSync(lockPath, "wx");
    const payload = JSON.stringify(
      { pid: process.pid, host: os.hostname(), createdAt: nowIso() },
      null,
      2
    );
    fs.writeFileSync(fd, payload, "utf8");
    return fd;
  } catch (e) {
    if (e && e.code === "EEXIST") {
      if (isStaleLock(lockPath)) {
        try {
          fs.unlinkSync(lockPath);
        } catch {}
        // retry once
        const fd = fs.openSync(lockPath, "wx");
        const payload = JSON.stringify(
          { pid: process.pid, host: os.hostname(), createdAt: nowIso(), recovered: true },
          null,
          2
        );
        fs.writeFileSync(fd, payload, "utf8");
        return fd;
      }
      return null;
    }
    throw e;
  }
}

function releaseLock(fd, lockPath) {
  try {
    if (typeof fd === "number") fs.closeSync(fd);
  } catch {}
  try {
    fs.unlinkSync(lockPath);
  } catch {}
}

async function runCmd(cmd, logs) {
  const started = Date.now();

  const { stdout, stderr } = await execFileAsync("bash", ["-lc", cmd], {
    cwd: REPO_DIR,
    maxBuffer: MAX_BUFFER,
    timeout: CMD_TIMEOUT_MS,
    env: process.env,
  });

  const tookMs = Date.now() - started;

  if (stdout && stdout.trim()) {
    const out = stdout.trim();
    console.log(out);
    logs.push(out);
  }
  if (stderr && stderr.trim()) {
    const err = stderr.trim();
    console.error(err);
    logs.push(err);
  }

  logs.push(`[cmd] took ${tookMs}ms: ${cmd}`);
}

async function deploy(payload, meta) {
  const logs = meta.logs;

  await runCmd("git fetch --all --prune", logs);
  await runCmd(`git reset --hard origin/${DEPLOY_BRANCH}`, logs);
  await runCmd("git clean -fd", logs);

  await runCmd(
    "if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi",
    logs
  );

  await runCmd(`pm2 restart ${PM2_PROCESS_NAME} --update-env`, logs);

  await runCmd("git log -1 --oneline --decorate", logs);
}

app.post(
  "/webhook",
  // Accept any content-type so signature verification doesn't break if GitHub is set to form.
  express.raw({ type: "*/*", limit: "2mb" }),
  async (req, res) => {
    const logs = [];
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    try {
      if (!SECRET) {
        return res.status(500).json({
          ok: false,
          error: "WEBHOOK_SECRET_NOT_SET",
          message: "Set WEBHOOK_SECRET in .env and in GitHub webhook settings.",
        });
      }

      const sig = String(req.header("x-hub-signature-256") || "");
      const event = String(req.header("x-github-event") || "");
      const expected = computeExpectedSig(SECRET, req.body);

      if (!sig || !timingSafeEqualStr(sig, expected)) {
        return res.status(401).json({ ok: false, error: "BAD_SIGNATURE" });
      }

      let payload;
      try {
        payload = parseGitHubPayload(req.body);
      } catch {
        return res.status(400).json({ ok: false, error: "INVALID_PAYLOAD" });
      }

      if (event === "ping") {
        return res.json({ ok: true, message: "pong" });
      }

      if (event !== "push") {
        return res.json({ ok: true, skipped: true, reason: `event=${event}` });
      }

      const ref = String(payload.ref || "");
      const wantRef = `refs/heads/${DEPLOY_BRANCH}`;
      if (ref !== wantRef) {
        return res.json({
          ok: true,
          skipped: true,
          reason: `ref=${ref} (only ${wantRef} deploys)`,
        });
      }

      const repoFullName = String(payload?.repository?.full_name || "");
      if (ALLOWED_REPO_FULLNAME && repoFullName !== ALLOWED_REPO_FULLNAME) {
        return res.status(403).json({
          ok: false,
          error: "REPO_NOT_ALLOWED",
          message: `repo=${repoFullName}`,
        });
      }

      const lockFd = acquireLock(LOCK_FILE);
      if (!lockFd) {
        return res.status(409).json({
          ok: false,
          error: "DEPLOY_IN_PROGRESS",
          message: "Deploy already running.",
        });
      }

      const shaFull = String(payload.after || "");
      const sha = shaFull ? shaFull.slice(0, 12) : "";

      state.running = true;
      state.last = {
        id,
        startedAt: nowIso(),
        endedAt: null,
        ok: null,
        sha,
        ref,
        error: null,
        logs,
      };

      // ACK immediately to avoid GitHub timeout.
      res.status(202).json({ ok: true, accepted: true, id, ref, sha });

      setImmediate(async () => {
        try {
          console.log(`[webhook] deploy accepted id=${id} ref=${ref} after=${sha}`);
          logs.push(`[webhook] deploy accepted id=${id} ref=${ref} after=${sha}`);

          await deploy(payload, { logs });

          state.last.endedAt = nowIso();
          state.last.ok = true;
          state.running = false;
          console.log(`[webhook] deploy success id=${id}`);
          logs.push(`[webhook] deploy success id=${id}`);
        } catch (err) {
          state.last.endedAt = nowIso();
          state.last.ok = false;
          state.last.error = String(err && err.message ? err.message : err);
          state.running = false;
          console.error(`[webhook] deploy failed id=${id}:`, err);
          logs.push(`[webhook] deploy failed id=${id}: ${state.last.error}`);
        } finally {
          releaseLock(lockFd, LOCK_FILE);
        }
      });
    } catch (err) {
      console.error("[webhook] handler error:", err);
      if (!res.headersSent) {
        return res.status(500).json({
          ok: false,
          error: "INTERNAL_ERROR",
          message: String(err && err.message ? err.message : err),
        });
      }
    }
  }
);

app.get("/health", (_req, res) => {
  res.json({ ok: true, time: nowIso(), running: state.running, port: PORT });
});

app.get("/status", (_req, res) => {
  res.json({
    ok: true,
    time: nowIso(),
    running: state.running,
    last: state.last,
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Webhook listening on 0.0.0.0:${PORT} (POST /webhook)`);
});
