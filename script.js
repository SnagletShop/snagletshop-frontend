
// ---- Global helper fallbacks (to prevent mount() crashes) ----
window.q = window.q || function (sel, root) { return (root || document).querySelector(sel); };
window.el = window.el || function (tag, cls) { const n = document.createElement(tag); if (cls) n.className = cls; return n; };
window.injectCssOnce = window.injectCssOnce || function () {
  if (document.getElementById("mgmt-topbar-css")) return;
  const st = document.createElement("style");
  st.id = "mgmt-topbar-css";
  st.textContent = `
    .mgmt-topbar-container{display:flex;align-items:center;gap:12px}
    .mgmt-brand-wrap{display:flex;align-items:center}
    .mgmt-topbar-actions{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
    .mgmt-btn{border:1px solid #e5e7eb;background:#fff;border-radius:10px;padding:8px 10px;font-weight:700;cursor:pointer}
    .mgmt-btn.primary{background:#111827;color:#fff;border-color:#111827}
    .mgmt-btn.danger{border-color:#fecaca;color:#b91c1c;background:#fff5f5}
    .mgmt-sep{width:1px;height:28px;background:#e5e7eb;margin:0 6px}
  `;
  document.head.appendChild(st);
};

// ---- Project selector (multi-server profiles) ----
const MG_PROJECTS_KEY = "mgmt_projects_v1";
const MG_ACTIVE_PROJECT_KEY = "mgmt_active_project_id";

function mgLoadProjects() {
  try {
    const raw = localStorage.getItem(MG_PROJECTS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}


// ---- Global action runner fallback (ensures buttons work even if topbar-scoped actionRunner isn't in global scope) ----
if (typeof window.actionRunner !== "function") {
  window.actionRunner = async function (fn, label) {
    try {
      // Execute action
      return await fn();
    } catch (e) {
      // Surface in console; UI may also show errors elsewhere.
      console.error(label ? `[actionRunner] ${label} failed` : "[actionRunner] failed", e);
      throw e;
    }
  };
}
// Provide a global binding for code that calls `actionRunner(...)`
try { window.actionRunnerGlobal = window.actionRunner; } catch { }

var actionRunner = window.actionRunner;
function mgSaveProjects(list) {
  localStorage.setItem(MG_PROJECTS_KEY, JSON.stringify(Array.isArray(list) ? list : []));
}

function mgEnsureDefaultProject() {
  const projects = mgLoadProjects();
  if (projects.length) return projects;

  const p = {
    id: "default",
    name: "Default",
    api_base: localStorage.getItem("api_base") || "",
    admin_code: localStorage.getItem("admin_code") || "",
    api_token: localStorage.getItem("api_token") || "",
    // optional remembered creds
    admin_user: localStorage.getItem("admin_user") || "",
    admin_pass: localStorage.getItem("admin_pass") || "",
  };
  mgSaveProjects([p]);
  localStorage.setItem(MG_ACTIVE_PROJECT_KEY, p.id);
  return [p];
}

function mgGetActiveProjectId() {
  return localStorage.getItem(MG_ACTIVE_PROJECT_KEY) || "default";
}

function mgSetActiveProjectId(id) {
  localStorage.setItem(MG_ACTIVE_PROJECT_KEY, String(id || "default"));
}

function mgApplyProjectToLocalStorage(project) {
  if (!project) return;
  if (project.api_base != null) localStorage.setItem("api_base", String(project.api_base || ""));
  if (project.admin_code != null) localStorage.setItem("admin_code", String(project.admin_code || ""));
  if (project.api_token != null) localStorage.setItem("api_token", String(project.api_token || ""));
  if (project.admin_user != null) localStorage.setItem("admin_user", String(project.admin_user || ""));
  if (project.admin_pass != null) localStorage.setItem("admin_pass", String(project.admin_pass || ""));
}

function mgPersistActiveProjectFromLocalStorage() {
  const projects = mgEnsureDefaultProject();
  const activeId = mgGetActiveProjectId();
  const idx = projects.findIndex(p => p.id === activeId);
  if (idx < 0) return;
  const p = projects[idx];
  p.api_base = localStorage.getItem("api_base") || "";
  p.admin_code = localStorage.getItem("admin_code") || "";
  p.api_token = localStorage.getItem("api_token") || "";
  p.admin_user = localStorage.getItem("admin_user") || "";
  p.admin_pass = localStorage.getItem("admin_pass") || "";
  projects[idx] = p;
  mgSaveProjects(projects);
}

async function mgSwitchProject(projectId, { forceLogin = false } = {}) {
  const projects = mgEnsureDefaultProject();
  const p = projects.find(x => x.id === projectId) || projects[0];
  mgSetActiveProjectId(p.id);
  mgApplyProjectToLocalStorage(p);

  // Clear current session and re-auth
  try { clearAdminSession?.(); } catch { }

  if (forceLogin) {
    // wipe token to force credentials prompt
    localStorage.removeItem("api_token");
  }

  // Ensure login, then refresh orders UI
  if (typeof ensureLogin === "function") {
    await ensureLogin();
    try { await refreshCatalogFileModeUi(); } catch { }

  }
  try {
    if (typeof loadOrdersFromServer === "function") {
      state.orders = await loadOrdersFromServer();
      render?.();
    }

    // Accounting tab
    const __ab = btn("accounting");
    if (__ab) {
      __ab._mgWired = true;
      __ab.onclick = () => actionRunner(async () => {
        await safeEnsureLogin();
        try { tariffsUiHide?.(); } catch { }
        try { productsUiHide?.(); } catch { }
        try { window.graphEngine?.close?.(); } catch { }
        localStorage.setItem("mgmt_active_tab", "accounting");
        try { updateMgmtTabButtons?.(); } catch { }
        try { renderFilters(true); } catch { }
        try { const groups = document.getElementById("groups"); if (groups) groups.innerHTML = ""; } catch { }
        if (typeof accountingUiShow === "function") await accountingUiShow();
      }, "Accounting");
    }
  } catch { }
}

// === Admin API config (wired to server.js) ===
// This file is meant to work both when hosted on your domain (same-origin as server.js)
// and when opened from a local dev server (via localStorage overrides).


/**
 * API base resolution for the admin UI.
 * Goal: always talk to https://api.snagletshop.com in production, while still allowing localhost dev.
 */
function _isIpv4Host(hostname) {
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname || "");
}

function _normalizeApiBase(input) {
  let s = String(input || "").trim();
  if (!s) return "";
  s = s.replace(/\/+$/, "");
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(s)) {
    if (s.startsWith("localhost") || s.startsWith("127.") || s.startsWith("0.0.0.0")) s = "http://" + s;
    else s = "https://" + s;
  }
  try {
    const u = new URL(s);
    return u.origin;
  } catch {
    return "";
  }
}

function getApiBase(opts = {}) {
  const preferStored = opts.preferStored !== false;

  const storedRaw = preferStored ? localStorage.getItem("api_base") : "";
  const metaRaw =
    (document.querySelector('meta[name="api-base"]') &&
      document.querySelector('meta[name="api-base"]').getAttribute("content")) ||
    "";
  const origin = (location && location.origin) ? String(location.origin) : "";
  const host = (location && location.hostname) ? String(location.hostname) : "";
  const originUsable = !!origin && origin !== "null" && !origin.startsWith("file:");

  const candidates = [];
  if (storedRaw) candidates.push(storedRaw);
  if (metaRaw) candidates.push(metaRaw);

  // Use same-origin API only if the admin UI is served from api.* or localhost (dev).
  if (originUsable && (host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0" || host.startsWith("api."))) {
    candidates.push(origin);
  }

  // Final fallback: production API
  candidates.push("https://api.snagletshop.com");

  for (const raw of candidates) {
    const normalized = _normalizeApiBase(raw);
    if (!normalized) continue;

    try {
      const u = new URL(normalized);

      // Never use https://<IP> because it will fail TLS (cert CN mismatch). Force the proper hostname.
      if (u.protocol === "https:" && _isIpv4Host(u.hostname)) {
        if (storedRaw) localStorage.setItem("api_base", "https://api.snagletshop.com");
        return "https://api.snagletshop.com";
      }

      // If someone accidentally stored the storefront origin, rewrite to API origin.
      if (u.hostname === "snagletshop.com" || u.hostname === "www.snagletshop.com") {
        if (storedRaw) localStorage.setItem("api_base", "https://api.snagletshop.com");
        return "https://api.snagletshop.com";
      }

      return normalized;
    } catch {
      // ignore
    }
  }

  return "https://api.snagletshop.com";
}

(function bootstrapAdminApi() {
  // Ensure a stable object identity (do not replace window.adminApi if it already exists).
  window.adminApi = window.adminApi || {};
  const api = window.adminApi;

  // ---- Base URL ----
  api.setApiBase = api.setApiBase || function setApiBase(base) {
    const b = String(base || "").trim().replace(/\/+$/, "");
    if (b) localStorage.setItem("api_base", b);
    return b;
  };

  // Try localStorage override first, otherwise use current origin if usable.
  const resolvedBase = getApiBase({ preferStored: true });
  if (resolvedBase) api.setApiBase(resolvedBase);

  // ---- Optional admin code ----
  api.setAdminCode = api.setAdminCode || function setAdminCode(code) {
    const c = String(code || "").trim();
    if (c) localStorage.setItem("admin_code", c);
    else localStorage.removeItem("admin_code");
    return c;
  };
  const storedCode = localStorage.getItem("admin_code");
  if (storedCode && storedCode !== "null") api.setAdminCode(storedCode);

  // ---- Token helpers (shared with _adminHeaders below) ----
  api.tokenValid = api.tokenValid || function tokenValid() {
    const tok = localStorage.getItem("api_token") || "";
    if (!tok) return false;

    const expMs = Number(localStorage.getItem("api_token_exp_ms") || 0);
    if (expMs > 0) return Date.now() < expMs;

    // If exp wasn't stored (older versions), assume ~55 minutes from set time.
    const setAt = Number(localStorage.getItem("api_token_set_at_ms") || 0);
    if (setAt > 0) return (Date.now() - setAt) < (55 * 60 * 1000);

    return true;
  };

  api.login = api.login || async function login(username, password, adminCodeOverride) {
    const base = getApiBase();
    if (!base || base === "null") throw new Error("Missing api_base. Set localStorage.api_base to your server origin.");

    const adminCode = String(adminCodeOverride || localStorage.getItem("admin_code") || "").trim();
    const res = await fetch(`${base}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        password,
        adminCode: adminCode || undefined
      })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error || `Login failed (${res.status})`);
    }

    const token = String(data.token || "");
    const expiresIn = Number(data.expiresIn || 0);

    if (!token) throw new Error("Login failed: missing token in response.");

    localStorage.setItem("api_token", token);
    localStorage.setItem("api_token_set_at_ms", String(Date.now()));
    if (expiresIn > 0) {
      // small safety margin
      localStorage.setItem("api_token_exp_ms", String(Date.now() + (expiresIn * 1000) - 15000));
    } else {
      localStorage.removeItem("api_token_exp_ms");
    }

    return data;
  };

  // Minimal client methods if your page doesn't include an external adminApi library
  api.listOrders = api.listOrders || async function listOrders({ from, to, limit = 1000, includeUnpaid = true } = {}) {
    const base = getApiBase();
    const qs = new URLSearchParams();
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    if (limit != null) qs.set("limit", String(limit));
        if (includeUnpaid) qs.set("includeUnpaid", "1");
const r = await fetch(`${base}/admin/orders?${qs.toString()}`, {
      method: "GET",
      headers: _adminHeaders(false)
    });
    const out = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(out?.error || `listOrders failed (${r.status})`);
    return out;
  };

  api.patchOrder = api.patchOrder || async function patchOrder(orderId, payload) {
    if (!orderId) throw new Error("patchOrder: orderId required");
    const base = getApiBase();
    const r = await fetch(`${base}/admin/orders/${encodeURIComponent(orderId)}`, {
      method: "PATCH",
      headers: _adminHeaders(true),
      body: JSON.stringify(payload || {})
    });
    const out = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(out?.error || `patchOrder failed (${r.status})`);
    return out;
  };

  api.resend = api.resend || async function resend(orderId) {
    if (!orderId) throw new Error("resend: orderId required");
    const base = getApiBase();
    const r = await fetch(`${base}/admin/orders/${encodeURIComponent(orderId)}/resend-confirmation`, {
      method: "POST",
      headers: _adminHeaders(true),
      body: "{}"
    });
    const out = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(out?.error || `resend failed (${r.status})`);
    return out;
  };


  api.sendShippedEmail = api.sendShippedEmail || async function sendShippedEmail(orderId) {
    if (!orderId) throw new Error("sendShippedEmail: orderId required");
    const base = getApiBase();
    const r = await fetch(`${base}/admin/orders/${encodeURIComponent(orderId)}/send-shipped-email`, {
      method: "POST",
      headers: _adminHeaders(true),
      body: "{}"
    });
    const out = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(out?.error || `sendShippedEmail failed (${r.status})`);
    return out;
  };
})();

// ---- API base helper (fix: legacy API_BASE usages) ----

let _ensureLoginPromise = null;

function clearAdminSession() {
  localStorage.removeItem("api_token");
  localStorage.removeItem("api_token_exp_ms");
  localStorage.removeItem("api_token_set_at_ms");
}


function clearRememberedLogin() {
  // Optional convenience: allows automatic re-login when the short-lived API token expires.
  // WARNING: if you enable "remember password", it is stored in this browser on this device.
  localStorage.removeItem("admin_remember_password");
  localStorage.removeItem("admin_saved_password");
  try { if (navigator.credentials && navigator.credentials.preventSilentAccess) navigator.credentials.preventSilentAccess(); } catch { }
}

async function maybeRememberLogin(username, password, adminCode) {
  const u = String(username || "").trim();
  const p = (password == null) ? null : String(password);
  const code = String(adminCode || localStorage.getItem("admin_code") || "").trim();
  if (!u || p == null) return;

  // Respect "Remember on this device" if present, otherwise default ON.
  const rememberEl = document.getElementById("rememberCreds");
  const remember = rememberEl ? !!rememberEl.checked : (localStorage.getItem("admin_remember_password") !== "0");

  if (!remember) {
    clearRememberedLogin();
    localStorage.setItem("admin_last_user", u);
    if (code) localStorage.setItem("admin_code", code);
    return;
  }

  localStorage.setItem("admin_remember_password", "1");
  localStorage.setItem("admin_last_user", u);
  localStorage.setItem("admin_saved_password", p);
  if (code) localStorage.setItem("admin_code", code);

  // Best-effort: also store in the browser password manager (if available).
  try {
    if (navigator.credentials && window.PasswordCredential) {
      const cred = new PasswordCredential({ id: u, name: u, password: p });
      await navigator.credentials.store(cred);
    }
  } catch { }
}


async function tryAutoLoginIfConfigured() {
  // 1) Try Credential Management API (password manager) silently.
  try {
    if (navigator.credentials && navigator.credentials.get) {
      const cred = await navigator.credentials.get({ password: true, mediation: "silent" });
      if (cred && cred.id && cred.password) {
        localStorage.setItem("admin_last_user", String(cred.id));
        await adminApi.login(String(cred.id), String(cred.password));
        return true;
      }
    }
  } catch { }

  // 2) Try local remembered password (explicit opt-in).
  try {
    if (localStorage.getItem("admin_remember_password") === "1") {
      const u = (localStorage.getItem("admin_last_user") || "").trim();
      const p = localStorage.getItem("admin_saved_password");
      if (u && p) {
        await adminApi.login(u, p);
        return true;
      }
    }
  } catch { }

  return false;
}

function isAdminAuthError(err) {
  const msg = String(err?.message || err || "");
  return (
    /\b(401|403)\b/.test(msg) ||
    /missing token|invalid token|bad admin code|missing or invalid admin code/i.test(msg)
  );
}

// Confirms the saved token is accepted by the server (not just "valid by time").
async function probeAdminSession() {
  const base = getApiBase({ preferStored: true });
  if (!base || base === "null") return true;

  try {
    const headers = (typeof _adminHeaders === "function") ? _adminHeaders(false) : {};
    const r = await fetch(`${base}/admin/orders?limit=1`, { method: "GET", headers });
    if (r.status === 401 || r.status === 403) return false;
    return true;
  } catch {
    // Network/down: don't force relogin just because probe failed to reach server
    return true;
  }
}


// ======= Login UI (no prompts) =======
let _loginUiInited = false;
let _loginWaitPromise = null;
let _loginWaitResolve = null;

function _loginEl(id) { return document.getElementById(id); }

function _setLoginStatus(msg, type) {
  const el = _loginEl("loginStatus");
  if (!el) return;
  el.classList.remove("error", "ok");
  if (type) el.classList.add(type);
  el.textContent = String(msg || "");
}

function _getMetaApiBase() {
  try {
    const el = document.querySelector('meta[name="api-base"]');
    const v = el ? String(el.getAttribute("content") || "").trim() : "";
    return v;
  } catch {
    return "";
  }
}

function _saveApiBaseFromUI(raw) {
  const r = String(raw || "").trim();
  const normalized = _normalizeApiBase(r);
  if (!normalized) return false;
  try {
    if (window.adminApi && typeof window.adminApi.setApiBase === "function") {
      window.adminApi.setApiBase(normalized);
    } else {
      localStorage.setItem("api_base", normalized);
    }
    return true;
  } catch {
    return false;
  }
}

function _prefillLoginFields() {
  const uEl = _loginEl("loginUsername");
  const pEl = _loginEl("loginPassword");
  const cEl = _loginEl("loginAdminCode");
  const rememberEl = _loginEl("rememberCreds");

  const aEl = _loginEl("loginApiBase");
  if (uEl) uEl.value = String(localStorage.getItem("admin_last_user") || "");
  if (pEl) pEl.value = String(localStorage.getItem("admin_saved_password") || "");
  if (cEl) cEl.value = String(localStorage.getItem("admin_code") || "");

  // Server URL (api_base) override
  if (aEl) {
    const stored = String(localStorage.getItem("api_base") || "").trim();
    const meta = _getMetaApiBase();
    aEl.value = stored || meta || "https://api.snagletshop.com";
  }

  if (rememberEl) {
    const stored = localStorage.getItem("admin_remember_password");
    rememberEl.checked = (stored === "1") || (stored == null); // default ON
  }
}

function initLoginUI() {
  if (_loginUiInited) return;
  _loginUiInited = true;

  const screen = _loginEl("loginScreen");
  if (!screen) return;

  _prefillLoginFields();

  const form = _loginEl("loginForm");
  const toggle = _loginEl("togglePw");
  const logout = _loginEl("logoutBtn");
  const rememberEl = _loginEl("rememberCreds");

  const apiBaseEl = _loginEl("loginApiBase");
  if (toggle) {
    toggle.addEventListener("click", () => {
      const pEl = _loginEl("loginPassword");
      if (!pEl) return;
      const isPw = pEl.type === "password";
      pEl.type = isPw ? "text" : "password";
      toggle.textContent = isPw ? "Hide" : "Show";
    });
  }

  if (rememberEl) {
    rememberEl.addEventListener("change", () => {
      if (rememberEl.checked) {
        localStorage.setItem("admin_remember_password", "1");
      } else {
        clearRememberedLogin();
      }
    });
  }


  if (apiBaseEl) {
    const apply = () => {
      const ok = _saveApiBaseFromUI(apiBaseEl.value);
      if (ok) _setLoginStatus("Server URL saved.", "ok");
      else _setLoginStatus("Invalid Server URL.", "error");
    };
    apiBaseEl.addEventListener("blur", apply);
    apiBaseEl.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        apply();
      }
    });
  }

  if (logout) {
    logout.addEventListener("click", () => {
      try { clearAdminSession(); } catch { }
      showLoginScreen({ autoAttempt: false });
      _setLoginStatus("Signed out.", "ok");
    });
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const u = String(_loginEl("loginUsername")?.value || "").trim();
      const p = String(_loginEl("loginPassword")?.value || "");
      const code = String(_loginEl("loginAdminCode")?.value || "").trim();
      const remember = !!_loginEl("rememberCreds")?.checked;
      const apiBase = String(_loginEl("loginApiBase")?.value || "").trim();
      if (apiBase) _saveApiBaseFromUI(apiBase);
      await loginWithCreds({ username: u, password: p, adminCode: code, remember, silent: false });
    });
  }
}

function showLoginScreen({ autoAttempt = false } = {}) {
  initLoginUI();
  const screen = _loginEl("loginScreen");
  if (!screen) return;

  screen.classList.remove("hidden");
  screen.setAttribute("aria-hidden", "false");
  _prefillLoginFields();

  // optional: attempt background sign-in using remembered creds
  if (autoAttempt) {
    const u = String(localStorage.getItem("admin_last_user") || "").trim();
    const p = localStorage.getItem("admin_saved_password");
    const code = String(localStorage.getItem("admin_code") || "").trim();
    const remember = (localStorage.getItem("admin_remember_password") === "1") || (localStorage.getItem("admin_remember_password") == null);
    if (u && p) {
      loginWithCreds({ username: u, password: String(p), adminCode: code, remember, silent: true });
    }
  }
}

function hideLoginScreen() {
  const screen = _loginEl("loginScreen");
  if (!screen) return;
  screen.classList.add("hidden");
  screen.setAttribute("aria-hidden", "true");
}

function _resolveLoginWaiter() {
  if (_loginWaitResolve) {
    _loginWaitResolve();
    _loginWaitResolve = null;
  }
  _loginWaitPromise = null;
}

function waitForInteractiveLogin() {
  showLoginScreen({ autoAttempt: false });
  if (_loginWaitPromise) return _loginWaitPromise;

  _loginWaitPromise = new Promise((resolve) => {
    _loginWaitResolve = resolve;
  });
  return _loginWaitPromise;
}

async function loginWithCreds({ username, password, adminCode, remember = true, silent = false } = {}) {
  const u = String(username || "").trim();
  const p = (password == null) ? "" : String(password);
  const code = String(adminCode || "").trim();

  if (!u || !p) {
    if (!silent) _setLoginStatus("Enter username and password.", "error");
    return false;
  }

  // ensure api_base is set + in sync
  const base = getApiBase({ preferStored: true });
  adminApi.setApiBase(base);

  // persist admin code for auto-login if provided
  if (code) adminApi.setAdminCode(code);

  try {
    if (!silent) _setLoginStatus("Signing in…");
    else _setLoginStatus("Signing in…");

    localStorage.setItem("admin_last_user", u);

    // attempt login
    await adminApi.login(u, p, code || undefined);

    // remember credentials (requested behavior)
    if (remember) {
      localStorage.setItem("admin_remember_password", "1");
      localStorage.setItem("admin_saved_password", p);
      if (code) localStorage.setItem("admin_code", code);

      // Persist credentials/API base into the active project profile (if projects are used)
      try { mgPersistActiveProjectFromLocalStorage(); } catch { }

      // best-effort: also store in browser password manager
      try {
        if (navigator.credentials && window.PasswordCredential) {
          const cred = new PasswordCredential({ id: u, name: u, password: p });
          await navigator.credentials.store(cred);
        }
      } catch { }
    } else {
      // still keep last username for convenience
      clearRememberedLogin();
      localStorage.setItem("admin_last_user", u);
      if (code) localStorage.setItem("admin_code", code);
    }

    _setLoginStatus("Signed in.", "ok");
    hideLoginScreen();
    _resolveLoginWaiter();
    return true;
  } catch (e) {
    const msg = String(e?.message || e || "Login failed");
    if (/admin code|x-admin-code|missing or invalid admin code/i.test(msg)) {
      if (!silent) _setLoginStatus("Admin code required or invalid. Enter it and try again.", "error");
      else _setLoginStatus("Admin code required.", "error");
    } else {
      if (!silent) _setLoginStatus(msg, "error");
      else _setLoginStatus("Sign-in failed. Open the login screen to retry.", "error");
    }
    showLoginScreen({ autoAttempt: false });
    return false;
  }
}



async function ensureLogin() {
  if (_ensureLoginPromise) return _ensureLoginPromise;

  _ensureLoginPromise = (async () => {
    // Do NOT flash the login UI during normal actions.
    // The login screen is shown on initial load and only shown again if interactive auth is required.

    // Ensure api_base is set (in case user changed it in the login screen)
    const base = getApiBase({ preferStored: true });
    adminApi.setApiBase(base);

    // If we have a token, verify the server actually accepts it.
    if (adminApi.tokenValid()) {
      const ok = await probeAdminSession().catch(() => false);
      if (ok) {
        hideLoginScreen();
        return;
      }
      clearAdminSession(); // token rejected by server -> force login below
    }

    // Auto-login if configured: refresh session without prompting when token expires.
    try {
      const ok = await tryAutoLoginIfConfigured();
      if (ok) {
        hideLoginScreen();
        return;
      }
    } catch (e) {
      if (isAdminAuthError(e)) clearRememberedLogin();
    }

    // Wait for interactive login in the embedded login UI.
    await waitForInteractiveLogin();
    hideLoginScreen();
  })();

  try {
    return await _ensureLoginPromise;
  } finally {
    _ensureLoginPromise = null;
  }
}



// ======= Utilities & constants =======
const TZ = "Europe/Bratislava";
const DEFAULT_ROW_ORDER = ["orderMeta", "products", "shipping", "financials", "customer", "actions"];
const DEFAULT_SETTINGS = {
  defaultSince: "today",
  defaultTill: "startOfYear",
  tillRollToCurrentYear: true,
  rowOrder: DEFAULT_ROW_ORDER,
  doneBgHighlight: true,
  doneTextHighlight: true,
  // Where to open product tabs from the Orders "Open products" button.
  // - newWindow: dedicate a separate (best-effort) window per order
  // - sameWindow: open as tabs in the same browser window as the admin UI
  openProductsTarget: "newWindow", // newWindow | sameWindow
  openProductsMode: "launcher", // launcher | direct
  openProductsPreferWindow: true, // best-effort (browser may still open a tab)
  openProductsIncludeSummaryTab: false
};

function loadSettings() {
  try { return { ...DEFAULT_SETTINGS, ...(JSON.parse(localStorage.getItem("shop_settings") || "null") || {}) }; }
  catch (e) { return DEFAULT_SETTINGS; }
}
function saveSettings(s) { localStorage.setItem("shop_settings", JSON.stringify(s)); }

function loadOrders() {
  try {
    const saved = localStorage.getItem("shop_orders");
    if (saved) { return JSON.parse(saved); }
  } catch (e) { }
  return fakeOrders();
}
function saveOrders(orders) { localStorage.setItem("shop_orders", JSON.stringify(orders)); }

function toLocalDateKey(date) {
  const d = new Date(date);
  const y = d.toLocaleString("en-CA", { timeZone: TZ, year: "numeric" });
  const m = d.toLocaleString("en-CA", { timeZone: TZ, month: "2-digit" });
  const da = d.toLocaleString("en-CA", { timeZone: TZ, day: "2-digit" });
  return `${y}-${m}-${da}`;
}
function parseQuickDate(token) {
  const now = new Date();
  if (!token) return now;
  const t = (typeof token === "string" ? token : token.value).trim().toLowerCase();
  if (t === "today") return now;
  if (t === "yesterday") { const d = new Date(); d.setDate(d.getDate() - 1); return d; }
  const d = new Date(t);
  return isNaN(d.valueOf()) ? now : d;
}
function startOfYear(d = new Date()) { return new Date(d.getFullYear(), 0, 1); }
function daysBetween(a, b) {
  const A = new Date(toLocalDateKey(a));
  const B = new Date(toLocalDateKey(b));
  return Math.abs(Math.round((A - B) / (1000 * 60 * 60 * 24)));
}
function niceDateTime(date) {
  return new Date(date).toLocaleString("sk-SK", { timeZone: TZ });
}

// ---- Security helpers ----
function escHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Alias used by the products launcher (kept for backwards compatibility)
function escapeHtml(s) {
  return escHtml(s);
}

function safeHref(url) {
  const u = String(url ?? "").trim();
  if (!u) return "";
  // Only allow http(s). Block javascript:, data:, etc.
  if (/^https?:\/\//i.test(u)) return u;
  return "";
}

// ---- Options helpers (multi-variant support) ----
function formatSelectedOptions(selectedOptions, legacySelectedOption) {
  const arr = Array.isArray(selectedOptions) ? selectedOptions : [];
  const parts = [];
  for (const o of arr) {
    const label = String(o?.label ?? "").trim();
    const value = String(o?.value ?? "").trim();
    if (!value) continue;
    if (!label) { parts.push(value); continue; }
    const cleanLabel = label.endsWith(":") ? label.slice(0, -1) : label;
    parts.push(`${cleanLabel}: ${value}`);
  }
  if (parts.length) return parts.join(", ");
  const legacy = String(legacySelectedOption ?? "").trim();
  return legacy || "";
}

function niceDate(date) {
  return new Date(date).toLocaleDateString("sk-SK", { timeZone: TZ });
}
function labelForDate(dateLike) {
  const d = new Date(dateLike);
  const today = new Date(), yd = new Date(); yd.setDate(yd.getDate() - 1);
  const k = toLocalDateKey(d);
  if (k === toLocalDateKey(today)) return "Today";
  if (k === toLocalDateKey(yd)) return "Yesterday";
  return niceDate(d);
}

// ======= Fake data =======
function fakeOrders() {
  const now = new Date();
  function mk(i, offsetDays = 0) {
    const d = new Date(now); d.setDate(now.getDate() - offsetDays);
    return {
      id: `ORD-${1000 + i}`,
      createdAt: d.toISOString(),
      customer: {
        name: ["Andrej", "Marta", "Peter", "Lucia"][i % 4],
        surname: ["Novák", "Kováč", "Lanting", "Horváth"][i % 4],
        address: `Hlavná ${10 + i}`,
        postalCode: `0${i}200`,
        city: ["Bratislava", "Košice", "Žilina", "Trnava"][i % 4],
        country: "Slovakia"
      },
      currency: "EUR",
      emailSentAt: null,
      shippedEmailSentAt: null,
      doneAt: null,
      products: [
        { name: "Product Alpha", amount: 3, unitPrice: 12.49, totalSale: 37.47, url: "https://www.aliexpress.com/item/123", expectedPurchase: 3.33 },
        { name: "Product Beta", amount: 1, unitPrice: 10, totalSale: 10, url: "https://www.aliexpress.com/item/456", expectedPurchase: 8.156 }
      ],
      shipping: { aliExpress: 0, thirdParty1: 0, thirdParty2: 0 },
      notes: ""
    };
  }
  return [mk(1, 0), mk(2, 0), mk(3, 1), mk(4, 2), mk(5, 10)];
}

// ======= State =======
const state = {
  settings: loadSettings(),
  orders: [],                   // will be filled from server
  filters: { since: null, till: null, daysBack: 0, statusChecks: { done: true, notDone: true, paid: true, notPaid: true } },
  openOrderId: null
};

// Map API order -> UI order structure
function mapApiToUi(o) {
  // server returns { orderId, createdAt, customer{firstName,lastName,...}, items[{quantity,unitPriceEUR,...}], pricing{totalPaidEUR,currency}, status, emailSentAt }
  const saleTotal = Number(o?.pricing?.totalPaidEUR || 0);
  return {
    id: o.orderId || o.id,
    createdAt: o.createdAt,
    status: o.status || null,
    paidAt: (o.paidAt ?? o?.stripe?.paidAt ?? null),
    customer: {
      name: o.customer?.firstName || '',
      surname: o.customer?.lastName || '',
      address: o.customer?.address1 || '',
      postalCode: o.customer?.postalCode || '',
      city: o.customer?.city || '',
      country: o.customer?.countryCode || '',
      phone: o.customer?.phone || '',
      region: o.customer?.region || ''
    },

    currency: "EUR",
    paymentCurrency: o.pricing?.currency || "EUR",
    paidEUR: Number(o?.pricing?.totalPaidEUR || 0),
    baseTotalEUR: Number(o?.pricing?.baseTotalEUR || 0),
    tariffPct: Number(o?.pricing?.tariffPct || 0),
    fxFetchedAt: o?.pricing?.fxFetchedAt || null,
    paidOriginalAmount: ((o?.stripe?.amountMinor != null) ? Number(o.stripe.amountMinor) : Number(o?.pricing?.amountCents || 0)) / 100,
    stripeFeeEUR: Number(o?.costs?.stripeFeeEUR || 0),
    emailSentAt: o.emailSentAt || null,
    shippedEmailSentAt: o.shippedEmailSentAt || null,
    doneAt: (o?.operator?.doneAt ?? null),
    // Derive product lines for UI display; use quantity + unit price when present
    products: (o.items || []).map(it => {
      const selectedOptions = Array.isArray(it.selectedOptions) ? it.selectedOptions : [];
      const legacySelectedOption = it.selectedOption || '';
      return {
        name: it.name || '',
        amount: Number(it.quantity || 1),
        unitPrice: Number(it.unitPriceEUR || 0),
        totalSale: null, // keep null; UI derives total from amount*unit
        url: it.productLink || it.url || '',
        expectedPurchase: Number(it.expectedPurchase || 0),
        selectedOptions,
        selectedOption: legacySelectedOption,
        selected: formatSelectedOptions(selectedOptions, legacySelectedOption)
      };
    }),

    // Shipping is stored server-side in order.operator.shipping
    shipping: {
      aliExpress: Number(o?.operator?.shipping?.aliExpress || 0),
      thirdParty1: Number(o?.operator?.shipping?.thirdParty1 || 0),
      thirdParty2: Number(o?.operator?.shipping?.thirdParty2 || 0)
    },
    notes: ''
  };
}

function getOrdersRangeIso() {
  // UI semantics: "Since (latest)" is the newest date, "To (oldest)" is the oldest date.
  // Backend semantics: from = oldest (>=), to = newest (<=). Normalize to avoid empty results when dates are reversed.
  const latest = state.filters.since;
  const oldest = state.filters.till;

  const a = (latest instanceof Date) ? latest : (latest ? new Date(latest) : null);
  const b = (oldest instanceof Date) ? oldest : (oldest ? new Date(oldest) : null);

  if (a && b) {
    const fromD = a < b ? a : b;
    const toD = a < b ? b : a;
    return { from: fromD.toISOString(), to: toD.toISOString() };
  }
  if (b) return { from: b.toISOString(), to: undefined };
  if (a) return { from: undefined, to: a.toISOString() };
  return { from: undefined, to: undefined };
}

async function loadOrdersFromServer() {
  const { from, to } = getOrdersRangeIso();
  const list = await adminApi.listOrders({ from, to, limit: 5000 });
  return list.map(mapApiToUi);
}

function toast(title, description) {
  const t = document.createElement("div");
  t.className = "t";
  const ttl = document.createElement("div");
  ttl.className = "title";
  ttl.textContent = String(title || "");
  t.appendChild(ttl);
  if (description) {
    const d = document.createElement("div");
    d.textContent = String(description);
    t.appendChild(d);
  }
  const root = document.getElementById("toast");
  root.appendChild(t);
  setTimeout(() => { t.remove(); }, 2200);
}


// ===== Order product URL quick-edit (kebab button next to product name) =====
let __mg_catalogUpdateLock = false;

async function mgFetchCatalogFile() {
  await ensureLogin();
  const r = await fetch(`${_adminBase()}/admin/catalog/file`, { headers: _adminHeaders(false) });
  const out = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(out?.error || `GET /admin/catalog/file failed (${r.status})`);
  return out;
}

async function mgPutCatalogFile(bundle) {
  await ensureLogin();
  const r = await fetch(`${_adminBase()}/admin/catalog/file`, {
    method: "PUT",
    headers: _adminHeaders(true),
    body: JSON.stringify(bundle)
  });
  const out = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(out?.error || `PUT /admin/catalog/file failed (${r.status})`);
  return out;
}

function mgUpdateBundleProductUrls(bundle, productName, oldUrl, newUrl) {
  const targetName = String(productName || "").trim().toLowerCase();
  if (!targetName) return 0;

  const maps = [
    bundle?.productsById,
    bundle?.products_by_id,
    bundle?.products,
    bundle?.productsByID
  ].filter(Boolean);

  // In case the payload is wrapped differently
  if (!maps.length && bundle?.bundle) {
    maps.push(bundle.bundle.productsById, bundle.bundle.products_by_id, bundle.bundle.products);
  }

  const shouldMatchOld = String(oldUrl || "").trim() !== "";
  const normOld = String(oldUrl || "").trim();
  let updated = 0;

  for (const mp of maps) {
    if (Array.isArray(mp)) {
      for (const p of mp) {
        const nm = String(p?.name || "").trim().toLowerCase();
        if (nm !== targetName) continue;
        const current = String(p?.link || p?.url || p?.productLink || "").trim();
        if (shouldMatchOld && current && current !== normOld) continue;
        if ("link" in p) p.link = newUrl;
        if ("url" in p) p.url = newUrl;
        if ("productLink" in p) p.productLink = newUrl;
        updated++;
      }
    } else if (mp && typeof mp === "object") {
      for (const k of Object.keys(mp)) {
        const p = mp[k];
        const nm = String(p?.name || "").trim().toLowerCase();
        if (nm !== targetName) continue;
        const current = String(p?.link || p?.url || p?.productLink || "").trim();
        if (shouldMatchOld && current && current !== normOld) continue;
        if ("link" in p) p.link = newUrl;
        if ("url" in p) p.url = newUrl;
        if ("productLink" in p) p.productLink = newUrl;
        updated++;
      }
    }
  }
  return updated;
}

async function mgUpdateCatalogProductUrlByName(productName, oldUrl, newUrl) {
  if (__mg_catalogUpdateLock) throw new Error("Catalog update already running; try again in a moment.");
  __mg_catalogUpdateLock = true;
  try {
    const bundle = await mgFetchCatalogFile();
    const updated = mgUpdateBundleProductUrls(bundle, productName, oldUrl, newUrl);
    if (!updated) return { updated: 0 };
    await mgPutCatalogFile(bundle);
    return { updated };
  } finally {
    __mg_catalogUpdateLock = false;
  }
}

function applyDefaultDates() {
  const s = state.settings;
  if (s.defaultSince === "today" || s.defaultSince === "yesterday") {
    state.filters.since = parseQuickDate(s.defaultSince);
  } else if (typeof s.defaultSince === "string") {
    state.filters.since = parseQuickDate(s.defaultSince);
  } else { state.filters.since = new Date(); }

  if (s.defaultTill === "startOfYear") {
    const ref = new Date();
    if (s.tillRollToCurrentYear && typeof s.defaultTillDate === "string") {
      const md = s.defaultTillDate.split("-").slice(1).join("-");
      const d = new Date(`${ref.getFullYear()}-${md}T00:00:00`);
      if (!isNaN(d.valueOf())) { state.filters.till = d; }
      else { state.filters.till = startOfYear(ref); }
    } else {
      state.filters.till = startOfYear(ref);
    }
  } else if (s.defaultTill === "specific" && s.defaultTillDate) {
    if (s.tillRollToCurrentYear) {
      const md = s.defaultTillDate.split("-").slice(1).join("-");
      const d = new Date(`${new Date().getFullYear()}-${md}T00:00:00`);
      state.filters.till = isNaN(d.valueOf()) ? new Date(s.defaultTillDate) : d;
    } else {
      state.filters.till = new Date(s.defaultTillDate);
    }
  } else {
    state.filters.till = startOfYear(new Date());
  }
  state.filters.daysBack = daysBetween(state.filters.since, state.filters.till);
}
async function init() {
  // Default landing tab
  try { localStorage.setItem("mgmt_active_tab", "orders"); } catch { }// Ensure the advanced topbar buttons exist + are wired (Products ⬇/⬆, Tariffs ⬇/⬆, Sync, Ping, etc.)
  try { mount(); } catch (e) { console.error("mount() failed:", e); }

  // Wire Settings modal buttons (Close/Save) now that the modal exists in index.html
  try { setupSettingsModal(); } catch (e) { console.error("setupSettingsModal() failed:", e); }

  applyDefaultDates();
  renderFilters(true);
  render(); // render empty list quickly

  // Ensure overlays aren't covering Orders on first load
  try { productsUiHide?.(); } catch { }
  try { tariffsUiHide?.(); } catch { }
  try { window.graphEngine?.close?.(); } catch { }
  try { updateMgmtTabButtons?.(); } catch { }

  await ensureLogin();

  // Keep Products tab file-mode selector in sync with the server as soon as auth is available.
  try { await refreshCatalogFileModeUi(); } catch { }



  // Graphs tab (safe if graphEngine.js is missing)
  try {
    if (window.graphEngine?.install) {
      await window.graphEngine.install({ adminApi: window.adminApi });
    }
  } catch (e) {
    console.error("graphEngine.install failed:", e);
  }

  try {
    state.orders = await loadOrdersFromServer();
  } catch (e) {
    if (isAdminAuthError(e)) {
      clearAdminSession();
      await ensureLogin();
      state.orders = await loadOrdersFromServer();
    } else {
      throw e;
    }
  }
  render();


}

document.addEventListener("DOMContentLoaded", () => {
  try { showLoginScreen({ autoAttempt: true }); } catch (e) { console.error("showLoginScreen failed:", e); }

  // Prevent stale service workers on the API origin from interfering with the admin UI.
  try {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations()
        .then((regs) => Promise.all((regs || []).map(r => r.unregister())))
        .catch(() => { });
    }
  } catch { }

  // Wire modal buttons + save handler (no-op if modal not present).
  try { setupSettingsModal(); } catch (e) { console.error("setupSettingsModal failed:", e); }

  // UX: allow Esc to close the settings modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      try { closeSettingsModal(); } catch { }
    }
  });

  init().catch(console.error);
});

async function sendEmail(order, opts = {}) {
  const showToast = opts.showToast !== false;
  const rerender = opts.rerender !== false;

  try {
    await ensureLogin();
    const res = await adminApi.sendShippedEmail(order.id);  // POST /admin/orders/:id/send-shipped-email
    order.shippedEmailSentAt = res?.shippedEmailSentAt || new Date().toISOString();
    saveOrders(state.orders); // keep your local cache logic
    if (showToast) toast("Email sent", `Shipped email sent for ${esc(order.id)}`);
    if (rerender) render();
    return { ok: true, res };
  } catch (e) {
    if (showToast) toast("Error", String(e?.message || e));
    return { ok: false, error: e };
  }
}
async function toggleDone(order) {
  const now = order.doneAt ? null : new Date().toISOString();
  try {
    await ensureLogin();
    const patch = { operator: { doneAt: now } };
    await adminApi.patchOrder(order.id, patch);   // PATCH /admin/orders/:id
    order.doneAt = now;
    saveOrders(state.orders);
    render();
  } catch (e) {
    toast("Error", String(e?.message || e));
  }
}



// ======= Done highlighting + helpers =======
function applyDoneDecorations(card, order) {
  try {
    const done = !!order?.doneAt;
    const bgOn = state?.settings?.doneBgHighlight !== false;
    const txOn = state?.settings?.doneTextHighlight !== false;

    const btn = card?.querySelector?.('#TopBarDiv_C_A_C_DoneCheckButton');
    // Use the existing "Time done" box as the status text
    const txt = card?.querySelector?.('#TopBarDiv_C_B_B');

    [btn, txt].forEach((el) => {
      if (!el) return;
      // background
      el.classList.toggle('done-bg-green', bgOn && done);
      el.classList.toggle('done-bg-red', bgOn && !done);
      // text color
      el.classList.toggle('done-text-green', txOn && done);
      el.classList.toggle('done-text-red', txOn && !done);
    });
  } catch { /* ignore */ }
}

function appendQueryParams(url, params) {
  const u = String(url || '').trim();
  if (!u) return '';
  try {
    const obj = new URL(u);
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v == null || v === '') return;
      obj.searchParams.set(k, String(v));
    });
    return obj.toString();
  } catch {
    const qs = Object.entries(params || {})
      .filter(([, v]) => v != null && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    if (!qs) return u;
    return u + (u.includes('?') ? '&' : '?') + qs;
  }
}


// Expose launcher helper for debugging / reuse.
// rows: Array<{url:string,label?:string,i?:number}>
window.mgOpenProductsWindowWithOpenAll = function(rows, title, opts = {}) {
  const safeRows = Array.isArray(rows)
    ? rows.filter(r => r && typeof r.url === 'string' && /^https?:\/\//i.test(String(r.url).trim()))
    : [];
  if (!safeRows.length) { alert('No URLs provided.'); return null; }

  const orderStub = { id: title || 'products' };
  const fakeOrder = {
    id: orderStub.id,
    products: safeRows.map(r => ({
      url: String(r.url),
      amount: '',
      selected: r.label || '',
      unitPrice: ''
    }))
  };

  // Force launcher mode by default for this helper.
  const merged = {
    mode: opts.mode || 'launcher',
    preferWindow: (opts.preferWindow != null) ? !!opts.preferWindow : !!(state?.settings?.openProductsPreferWindow),
    target: (opts.target != null) ? String(opts.target) : (state?.settings?.openProductsTarget || 'newWindow')
  };

  try {
    return openOrderProductsTabs(fakeOrder, merged);
  } catch (e) {
    console.error(e);
    alert('Failed to open launcher: ' + (e?.message || e));
    return null;
  }
};


function _mgOpenProductsHost(preferWindow, windowName) {
  // Best-effort: try opening a separate browser window.
  // Note: browsers may still choose to open a new tab based on user settings/policies.
  const name = (windowName && String(windowName).trim()) ? String(windowName).trim() : "_blank";

  if (preferWindow) {
    // Stronger request for a separate browser window (popup). Whether it becomes a tab or a
    // new window is ultimately decided by the browser.
    //
    // IMPORTANT (Edge): do NOT include noopener/noreferrer in the *features* string.
    // In some Edge builds that causes the call to be blocked even when pop-ups are allowed.
    const candidates = [
      // Explicit popup request (MDN: popup).
      "popup=yes,width=1400,height=900",
      "popup=yes,width=1400,height=900,scrollbars=yes,resizable=yes",

      // Legacy-style features that often trigger popup behavior.
      "width=1400,height=900,scrollbars=yes,resizable=yes",
      "width=1400,height=900,menubar=no,toolbar=no,location=no,status=no,scrollbars=yes,resizable=yes"
    ];
    for (const f of candidates) {
      try {
        const w = window.open("", name, f);
        if (w) {
          try { w.focus(); } catch {}
          try { w.opener = null; } catch {}
          try { w.resizeTo(1400, 900); } catch {}
          try { w.moveTo(40, 40); } catch {}
          return w;
        }
      } catch { /* ignore */ }
    }
  }

  try {
    const w = window.open("", name);
    if (w) { try { w.focus(); } catch {} }
    return w;
  } catch {
    return null;
  }
}


function _mgCreateOrderSummaryBlobUrl(order) {
  try {
    const esc = (typeof escHtml === "function") ? escHtml : (s) => String(s ?? "").replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]));
    const o = order || {};
    const id = String(o.id || "");
    const currency = String(o.currency || "EUR");
    const customer = (o.customer && typeof o.customer === "object") ? o.customer : {};
    const prods = Array.isArray(o.products) ? o.products : [];

    const fmt = (n) => {
      const x = Number(n || 0);
      return (Number.isFinite(x) ? x : 0).toFixed(2);
    };

    const createdAt = o.createdAt ? (typeof niceDateTime === "function" ? niceDateTime(o.createdAt) : String(o.createdAt)) : "";
    const doneAt = o.doneAt ? (typeof niceDateTime === "function" ? niceDateTime(o.doneAt) : String(o.doneAt)) : "";
    const emailAtRaw = o.shippedEmailSentAt || o.emailSentAt || o.confirmationEmailSentAt || "";
    const emailAt = emailAtRaw ? (typeof niceDateTime === "function" ? niceDateTime(emailAtRaw) : String(emailAtRaw)) : "";

    const items = prods.map((p) => {
      const qty = Number(p?.amount || 0);
      const unit = Number(p?.unitPrice || 0);
      const total = (p?.totalSale != null) ? Number(p.totalSale || 0) : (qty * unit);
      return {
        name: String(p?.name || p?.productName || ""),
        selected: String(p?.selected || p?.selectedOption || ""),
        qty,
        unit,
        total,
        url: String(p?.url || "")
      };
    });

    const saleTotal = (o.paidEUR != null)
      ? Number(o.paidEUR || 0)
      : items.reduce((s, it) => s + (Number(it.total) || 0), 0);

    const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Order ${esc(id || "Summary")}</title>
<style>
  :root { color-scheme: light; }
  body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; margin: 24px; }
  .wrap { max-width: 1100px; margin: 0 auto; }
  .top { display:flex; justify-content: space-between; align-items: baseline; gap: 16px; flex-wrap: wrap; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .meta { opacity: .75; font-size: 13px; }
  .pill { display:inline-block; padding: 2px 10px; border-radius: 999px; background: #f2f2f2; font-size: 12px; margin-left: 8px; }
  .grid { display:grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 18px; }
  .card { border: 1px solid #e5e5e5; border-radius: 12px; padding: 14px; box-shadow: 0 1px 2px rgba(0,0,0,.04); }
  .card h2 { font-size: 14px; margin: 0 0 10px; opacity: .8; text-transform: uppercase; letter-spacing: .06em; }
  .kv { font-size: 14px; line-height: 1.55; }
  .kv b { font-weight: 600; }
  table { width: 100%; border-collapse: collapse; margin-top: 14px; }
  th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid #eee; font-size: 14px; vertical-align: top; }
  th { font-size: 12px; text-transform: uppercase; letter-spacing: .06em; opacity: .7; }
  .right { text-align: right; }
  .small { font-size: 12px; opacity: .75; }
  .sum { margin-top: 14px; display:flex; justify-content: flex-end; gap: 18px; font-size: 15px; }
  .sum .label { opacity: .75; }
  .copy { cursor: pointer; user-select: all; }
  .copy:hover { text-decoration: underline; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="top">
      <div>
        <h1>Order <span class="copy" id="oid">${esc(id)}</span>${doneAt ? `<span class="pill">DONE</span>` : ``}</h1>
        <div class="meta">
          ${createdAt ? `Created: <b>${esc(createdAt)}</b>` : ``}
          ${emailAt ? ` • Email: <b>${esc(emailAt)}</b>` : ``}
        </div>
      </div>
      <div class="sum">
        <div><span class="label">Total paid</span> <b>${fmt(saleTotal)} ${esc(currency)}</b></div>
      </div>
    </div>

    <div class="grid">
      <div class="card">
        <h2>Customer</h2>
        <div class="kv">
          <div><b>Name:</b> ${esc((customer.name || "") + (customer.surname ? (" " + customer.surname) : ""))}</div>
          ${customer.email ? `<div><b>Email:</b> ${esc(customer.email)}</div>` : ``}
          ${customer.phone ? `<div><b>Phone:</b> ${esc(customer.phone)}</div>` : ``}
        </div>
      </div>

      <div class="card">
        <h2>Address</h2>
        <div class="kv">
          ${customer.address ? `<div>${esc(customer.address)}</div>` : ``}
          <div>
            ${customer.postalCode ? esc(customer.postalCode) : ``}
            ${customer.city ? (customer.postalCode ? " " : "") + esc(customer.city) : ``}
          </div>
          ${customer.country ? `<div>${esc(customer.country)}</div>` : ``}
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:16px;">
      <h2>Products</h2>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Product</th>
            <th>Selected</th>
            <th class="right">Qty</th>
            <th class="right">Unit</th>
            <th class="right">Total</th>
            <th>URL</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((it, idx) => `
            <tr>
              <td>${idx + 1}</td>
              <td>${esc(it.name)}</td>
              <td>${esc(it.selected)}</td>
              <td class="right">${esc(String(it.qty || 0))}</td>
              <td class="right">${fmt(it.unit)} ${esc(currency)}</td>
              <td class="right">${fmt(it.total)} ${esc(currency)}</td>
              <td>${it.url ? `<a href="${esc(it.url)}" target="_blank" rel="noreferrer noopener" class="small">open</a>` : `<span class="small">—</span>`}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>

    <script>
      // Copy order id
      (function(){
        var el = document.getElementById('oid');
        if (!el) return;
        el.addEventListener('click', function(){
          try { navigator.clipboard.writeText(el.textContent || ''); } catch {}
        });
      })();
    </script>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    return URL.createObjectURL(blob);
  } catch (e) {
    console.error("summary blob failed:", e);
    return "";
  }
}

function openOrderProductsTabs(order, opts = {}) {
  const prods = Array.isArray(order?.products) ? order.products : [];
  const rows = prods
    .map((p) => ({
      url: String(p?.url || "").trim(),
      amount: p?.amount,
      selected: p?.selected || p?.selectedOption || "",
      unitPrice: p?.unitPrice
    }))
    .filter(r => r.url && /^https?:\/\//i.test(r.url));

  if (!rows.length) {
    alert("No product URLs found on this order.");
    return;
  }

  const mode = String(opts?.mode || state?.settings?.openProductsMode || "launcher").toLowerCase(); // launcher | direct

  // Target: separate order window vs same browser window (tabs)
  const targetRaw = String(opts?.target || state?.settings?.openProductsTarget || "newWindow").toLowerCase();
  const targetIsSame = (targetRaw === "same" || targetRaw === "samewindow" || targetRaw === "current" || targetRaw === "currentwindow");

  // When the user selects "newWindow", we always attempt a popup-style window first.
  // (Browsers may still choose to open a tab; but we should not silently fall back to tab-only behavior.)
  const preferWindowRaw = (opts?.preferWindow != null) ? !!opts.preferWindow : !!(state?.settings?.openProductsPreferWindow);
  const preferWindow = (!targetIsSame) ? true : false;
  const includeSummary = (opts?.includeSummary != null) ? !!opts.includeSummary : !!(state?.settings?.openProductsIncludeSummaryTab);

  const winName = (() => {
    if (targetIsSame) return "_blank";
    const base = String(order?.id || Date.now());
    const safe = base.replace(/[^a-zA-Z0-9_]+/g, "_").slice(0, 80);
    return "mg_order_" + safe;
  })();

  // IMPORTANT (Edge/Chrome): window.open must be called directly inside the click gesture.
  const host = _mgOpenProductsHost(preferWindow, winName);

  if (!host) {
    alert("Popup blocked. Allow popups for this page and try again.");
    return;
  }

  const metaRows = rows.map((r, idx) => {
    const metaUrl = appendQueryParams(r.url, {
      mg_order: order?.id || "",
      mg_amt: r.amount ?? "",
      mg_sel: r.selected || "",
      mg_paid_unit: (r.unitPrice != null ? Number(r.unitPrice).toFixed(2) : "")
    });
    return {
      i: idx + 1,
      url: metaUrl,
      label: `#${idx + 1} • ${r.amount ?? ""}× ${r.selected || ""}`.trim()
    };
  });

  if (includeSummary) {
    const summaryUrl = _mgCreateOrderSummaryBlobUrl(order);
    if (summaryUrl) {
      metaRows.push({
        i: metaRows.length + 1,
        url: summaryUrl,
        label: "ORDER SUMMARY"
      });
    }
  }

  if (mode === "direct") {
    // Direct mode: open every URL immediately.
    // IMPORTANT: Do NOT navigate the host window to a product URL, otherwise it becomes cross-origin
    // and we lose the ability to open subsequent tabs in that window.
    let hostWin = host;

    // If we are targeting a dedicated order window, ensure the host is writable (same-origin).
    // If it's not (e.g., reused window is currently on a product page), open a fresh order window name.
    if (!targetIsSame) {
      try {
        void hostWin.document; // access check
      } catch {
        const freshName = winName + "_" + Date.now();
        hostWin = _mgOpenProductsHost(true, freshName) || _mgOpenProductsHost(false, freshName);
      }
      if (!hostWin) {
        alert("Popup blocked. Allow popups for this page and try again.");
        return;
      }

      // Provide a simple "home" page in the order window for context.
      try {
        hostWin.document.open();
        hostWin.document.write(`<!doctype html><html><head><meta charset="utf-8">
<title>Order ${escapeHtml(order?.id || "")} • Products</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;margin:24px;}
  h1{margin:0 0 10px;font-size:18px;}
  .hint{opacity:.75;margin:0 0 14px;}
  .list{border:1px solid #eee;border-radius:12px;overflow:hidden;}
  .item{padding:10px 12px;border-top:1px solid #f0f0f0;}
  .item:first-child{border-top:none;}
  a{color:#0b5fff;text-decoration:none;word-break:break-all;}
  a:hover{text-decoration:underline;}
</style></head><body>
<h1>Order ${escapeHtml(order?.id || "")}</h1>
<p class="hint">Product tabs for this order were opened in this window. Keep this window as the “home” for this order.</p>
<div class="list">
  ${metaRows.map((r, idx) => `<div class="item"><b>${idx+1}.</b> <a href="${escapeHtml(r.url)}" target="_blank" rel="noreferrer noopener">${escapeHtml(r.label || r.url)}</a></div>`).join("")}
</div>
</body></html>`);
        hostWin.document.close();
      } catch { /* ignore */ }
    }

    const openFn = (u) => {
      try {
        // Open tabs in the targeted window context.
        return targetIsSame ? window.open(u, "_blank") : hostWin.open(u, "_blank");
      } catch {
        // Fallback: open in current window context if the host disallows scripting.
        try { return window.open(u, "_blank"); } catch { return null; }
      }
    };

    // Open all product URLs (and optional summary) as tabs.
    for (let i = 0; i < metaRows.length; i++) {
      openFn(metaRows[i].url);
    }

    try { hostWin.focus(); } catch {}
    return hostWin;
  }

  // Launcher page mode (safe option if many tabs get blocked):
  // We open a single about:blank, write a navigation page, and let the user open tabs from there.
  try {
    const payload = { metaRows };
    const payloadJson = JSON.stringify(payload).replace(/</g, "\u003c");

    const doc = `<!doctype html><html><head><meta charset="utf-8">
<title>Open Products • ${escapeHtml(order?.id || "")}</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;margin:24px;}
  h1{margin:0 0 12px;font-size:18px;}
  .hint{opacity:.75;margin:0 0 14px;}
  .row{display:flex;gap:10px;align-items:center;margin:10px 0;}
  button{padding:10px 12px;border-radius:10px;border:1px solid #ddd;background:#fff;cursor:pointer;}
  button:hover{background:#f7f7f7;}
  .list{border:1px solid #eee;border-radius:12px;overflow:hidden;}
  .item{display:flex;justify-content:space-between;gap:10px;padding:10px 12px;border-top:1px solid #f0f0f0;}
  .item:first-child{border-top:none;}
  a{color:#0b5fff;text-decoration:none;}
  a:hover{text-decoration:underline;}
  .meta{opacity:.75;font-size:12px;}
  .status{margin-top:12px;opacity:.75;font-size:12px;}
</style>
</head><body>
<h1>Order ${escapeHtml(order?.id || "")}</h1>
<p class="hint">Use “Open all” if popups are allowed. If some tabs get blocked, try opening fewer at a time.</p>

<div class="row">
  <button id="openAllBtn">Open all</button>
  <button id="open5Btn">Open next 5</button>
  <button id="open1Btn">Open next 1</button>
</div>

<div class="list" id="list"></div>
<div class="status" id="status"></div>

<script>
  const payload = ${payloadJson};
  const rows = payload.metaRows || [];
  const list = document.getElementById('list');
  const status = document.getElementById('status');
  let cursor = 0;

  function render(){
    list.innerHTML = '';
    rows.forEach((r, idx) => {
      const div = document.createElement('div');
      div.className = 'item';
      const left = document.createElement('div');
      left.innerHTML = '<div><b>' + (idx+1) + '.</b> ' + (r.label || '') + '</div><div class="meta">' + (r.url || '') + '</div>';
      const right = document.createElement('div');
      const a = document.createElement('a');
      a.href = r.url;
      a.target = '_blank';
      a.rel = 'noreferrer noopener';
      a.textContent = 'open';
      right.appendChild(a);
      div.appendChild(left);
      div.appendChild(right);
      list.appendChild(div);
    });
    status.textContent = cursor >= rows.length ? 'All opened.' : ('Next index: ' + (cursor+1) + ' / ' + rows.length);
  }

  function openBatch(n){
    let opened = 0;
    const end = Math.min(rows.length, cursor + n);
    for (; cursor < end; cursor++) {
      const u = rows[cursor]?.url;
      if (!u) continue;
      try {
        const w = window.open(u, '_blank');
        if (w) opened++;
      } catch (e) { /* ignore */ }
    }
    status.textContent = (cursor >= rows.length)
      ? ('All opened. (' + rows.length + '/' + rows.length + ')')
      : ('Opened ' + opened + ' • Progress: ' + cursor + ' / ' + rows.length);
  }

  document.getElementById('openAllBtn').onclick = () => openBatch(rows.length - cursor);
  document.getElementById('open5Btn').onclick = () => openBatch(5);
  document.getElementById('open1Btn').onclick = () => openBatch(1);

  render();
</script>
</body></html>`;

    host.document.open();
    host.document.write(doc);
    host.document.close();
    try { host.focus(); } catch {}
    return host;
  } catch (e) {
    // Fallback: navigate to first product if writing is blocked
    try { host.location.href = metaRows[0].url; } catch {}
    return host;
  }
}

// ======= Filters UI =======
function getActiveMgmtTab() {
  return localStorage.getItem("mgmt_active_tab") || "orders";
}


function updateMgmtTabButtons() {
  const active = getActiveMgmtTab();
  const o = document.getElementById("mgOrdersTabBtn");
  const g = document.getElementById("mgGraphsTabBtn");
  const p = document.getElementById("mgProductsTabBtn");
  const t = document.getElementById("mgTariffsTabBtn");
  const a = document.getElementById("mgAccountingTabBtn");

  const set = (el, on) => {
    if (!el) return;
    el.classList.toggle("primary", !!on);
  };

  // Keep Excel primary (not a tab), so only mark actual tabs.
  set(o, active === "orders");
  set(g, active === "graphs");
  set(p, active === "products");
  set(t, active === "tariffs");
  set(a, active === "accounting");
}

let __mg_statusDdDocHandler = null;
function _statusDdDetach() {
  if (__mg_statusDdDocHandler) {
    document.removeEventListener("click", __mg_statusDdDocHandler, true);
    __mg_statusDdDocHandler = null;
  }
}
function _statusChecksEnsure() {
  if (!state.filters.statusChecks || typeof state.filters.statusChecks !== "object") {
    state.filters.statusChecks = { done: true, notDone: true, paid: true, notPaid: true };
  }
  const sc = state.filters.statusChecks;
  if (sc.done == null) sc.done = true;
  if (sc.notDone == null) sc.notDone = true;
  if (sc.paid == null) sc.paid = true;
  if (sc.notPaid == null) sc.notPaid = true;
  return sc;
}
function _statusChecksLabel(sc) {
  const all = sc.done && sc.notDone && sc.paid && sc.notPaid;
  if (all) return "All";
  const parts = [];
  if (sc.done) parts.push("Done");
  if (sc.notDone) parts.push("Not done");
  if (sc.paid) parts.push("Paid");
  if (sc.notPaid) parts.push("Not paid");
  return parts.length ? parts.join(", ") : "None";
}

function renderFilters(force = false) {
  const root = document.getElementById("filters");
  if (!root) return;

  const active = getActiveMgmtTab();
  const show = active === "orders";

  // Remove orders-specific chrome in other tabs (prevents "filters" UI leaking)
  root.classList.toggle("filters", show);
  root.classList.toggle("filters-hidden", !show);

  if (!show) {
    _statusDdDetach();
    if (force) root.innerHTML = "";
    else if (root.innerHTML.trim()) root.innerHTML = "";
    return;
  }
  const sc = _statusChecksEnsure();
  root.innerHTML = `
        <div class="row">
          <div class="field" style="grid-column:span 3;">
            <label>Since (latest)</label>
            <input type="date" id="fSince" value="${toLocalDateKey(state.filters.since)}"/>
            <div style="display:flex;gap:8px;margin-top:6px;">
              <button class="Buttony" id="sinceToday">Today</button>
              <button class="Buttony" id="sinceYesterday">Yesterday</button>
            </div>
          </div>
          <div class="field" style="grid-column:span 3;">
            <label>To (oldest)</label>
            <input type="date" id="fTill" value="${toLocalDateKey(state.filters.till)}"/>
            <div style="display:flex;gap:8px;margin-top:6px;">
              <button class="Buttony" id="tillSOY">Start of year</button>
            </div>
          </div>
          <div class="field" style="grid-column:span 2;">
            <label>Days back</label>
            <input type="number" id="fDays" min="0" value="${state.filters.daysBack}"/>
          </div>
          
          <div class="field" style="grid-column:span 2;">
            <label>Status filter</label>
            <div class="mg-dd" id="fStatusDd">
              <button class="mg-dd-btn" type="button" id="fStatusBtn">${_statusChecksLabel(sc)}</button>
              <div class="mg-dd-panel hidden" id="fStatusPanel">
                <label class="mg-dd-item"><input type="checkbox" id="stDone" ${sc.done ? "checked" : ""}/> Done</label>
                <label class="mg-dd-item"><input type="checkbox" id="stNotDone" ${sc.notDone ? "checked" : ""}/> Not done</label>
                <div class="mg-dd-sep"></div>
                <label class="mg-dd-item"><input type="checkbox" id="stPaid" ${sc.paid ? "checked" : ""}/> Paid</label>
                <label class="mg-dd-item"><input type="checkbox" id="stNotPaid" ${sc.notPaid ? "checked" : ""}/> Not paid</label>
                <div class="mg-dd-hint">Done = check icon / “Time done”. Paid = paidAt present.</div>
              </div>
            </div>
          </div>
          <div class="right" style="grid-column:span 2;">
            <div style="display:flex;gap:8px;align-items:end;">
              <button class="Buttony" id="refreshBtn">Refresh</button>
              <button class="Buttony" id="downloadAllBtn">Excel</button>
              <button class="icon-btn" id="settingsBtn" title="Settings">⚙</button>
            </div>
          </div>
        </div>
      `;

  root.querySelector("#sinceToday").onclick = () => { state.filters.since = parseQuickDate("today"); syncDays(); renderFilters(); render(); };
  root.querySelector("#sinceYesterday").onclick = () => { state.filters.since = parseQuickDate("yesterday"); syncDays(); renderFilters(); render(); };
  root.querySelector("#tillSOY").onclick = () => { state.filters.till = startOfYear(new Date()); syncDays(); renderFilters(); render(); };
  root.querySelector("#refreshBtn").onclick = () => { location.reload(); };
  root.querySelector("#downloadAllBtn").onclick = () => {
    const { from, to } = getOrdersRangeIso();
    adminApi.exportExcel({ from, to, limit: 10000 });
  };

  root.querySelector("#settingsBtn").onclick = () => openSettingsModal();

  root.querySelector("#fSince").onchange = (e) => { state.filters.since = parseQuickDate(e.target.value); syncDays(); render(); };
  root.querySelector("#fTill").onchange = (e) => { state.filters.till = parseQuickDate(e.target.value); syncDays(); render(); };
  root.querySelector("#fDays").oninput = (e) => { const v = Math.max(0, Number(e.target.value || 0)); setDaysBack(v); renderFilters(); render(); };

  // Status dropdown (checkboxes)
  const dd = root.querySelector("#fStatusDd");
  const btn = root.querySelector("#fStatusBtn");
  const panel = root.querySelector("#fStatusPanel");
  const updateStatusLabel = () => {
    if (btn) btn.textContent = _statusChecksLabel(sc);
  };
  updateStatusLabel();

  if (btn && panel) {
    btn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); panel.classList.toggle("hidden"); };
    panel.onclick = (e) => { e.stopPropagation(); };
  }

  function bindStatusChk(sel, key) {
    const el = root.querySelector(sel);
    if (!el) return;
    el.onchange = (e) => {
      sc[key] = !!e.target.checked;
      updateStatusLabel();
      render();
    };
  }
  bindStatusChk("#stDone", "done");
  bindStatusChk("#stNotDone", "notDone");
  bindStatusChk("#stPaid", "paid");
  bindStatusChk("#stNotPaid", "notPaid");

  _statusDdDetach();
  if (dd && panel) {
    __mg_statusDdDocHandler = (e) => {
      if (!dd.contains(e.target)) panel.classList.add("hidden");
    };
    document.addEventListener("click", __mg_statusDdDocHandler, true);
  }
}

function syncDays() { state.filters.daysBack = daysBetween(state.filters.since, state.filters.till); }
function setDaysBack(v) {
  const newTill = new Date(state.filters.since);
  newTill.setDate(newTill.getDate() - v);
  state.filters.till = newTill;
  state.filters.daysBack = v;
}
function currentFiltered() {
  const arr = state.orders.filter(o => {
    const d = new Date(toLocalDateKey(o.createdAt));
    const inRange = d >= new Date(toLocalDateKey(state.filters.till)) && d <= new Date(toLocalDateKey(state.filters.since));
    if (!inRange) return false;
    const sc = _statusChecksEnsure();
    const isDone = !!o.doneAt;
    const s = String(o.status || "").toUpperCase();
    const isPaid = !!o.paidAt || (s && (s.includes("PAID") || s.includes("FULFILL") || s.includes("SHIPP") || s.includes("DONE") || s.includes("COMPLET")));
    const doneOk = (sc.done && isDone) || (sc.notDone && !isDone);
    const paidOk = (sc.paid && isPaid) || (sc.notPaid && !isPaid);
    return doneOk && paidOk;
  });
  return arr;
}

// ======= Render =======
function render() {
  saveOrders(state.orders);
  const container = document.getElementById("groups");
  if (!container) return;

  // If a non-Orders tab is active, keep Orders view cleared so Orders-only UI cannot leak.
  try {
    if (typeof getActiveMgmtTab === "function" && getActiveMgmtTab() !== "orders") {
      container.innerHTML = "";
      return;
    }
  } catch (e) { }
  container.innerHTML = "";
  const filtered = currentFiltered();

  // group by day
  const g = {};
  filtered.forEach(o => {
    const key = toLocalDateKey(o.createdAt);
    if (!g[key]) g[key] = [];
    g[key].push(o);
  });
  const entries = Object.entries(g).sort((a, b) => a[0] < b[0] ? 1 : -1);

  if (entries.length === 0) {
    container.innerHTML = `<div style="text-align:center;margin:48px 0;color:#6b7280">No orders in this period.</div>`;
    return;
  }

  for (const [dateKey, arr] of entries) {
    // centered day divider that matches styles.css (.tag + .tag__label)
    const divider = document.createElement("div");
    divider.className = "tag";
    divider.innerHTML = `<span class="tag__label">${labelForDate(dateKey)}</span>`;
    container.appendChild(divider);

    arr.sort((a, b) => a.id < b.id ? 1 : -1).forEach(o => {
      container.appendChild(renderOrderCard(o));
    });
  }
}

// Compute and set extra gap for an open card
function _setExtraGap(card) {
  const drop = card.querySelector('#DropdownDiv');
  if (!drop) return;

  const mult = parseFloat(getComputedStyle(document.documentElement)
    .getPropertyValue('--expand-gap-mult')) || 0.18;
  const minG = parseFloat(getComputedStyle(document.documentElement)
    .getPropertyValue('--expand-gap-min')) || 16;
  const maxG = parseFloat(getComputedStyle(document.documentElement)
    .getPropertyValue('--expand-gap-max')) || 180;

  const h = drop.scrollHeight || 0;
  const px = Math.max(minG, Math.min(maxG, Math.round(h * mult)));
  card.style.setProperty('--extra-gap', px + 'px');
}
function _attachGapObserver(card) {
  const drop = card.querySelector('#DropdownDiv');
  if (!drop || card._gapObserver) return;
  card._gapObserver = new ResizeObserver(() => _setExtraGap(card));
  card._gapObserver.observe(drop);
}
function _detachGapObserver(card) {
  if (card._gapObserver) {
    card._gapObserver.disconnect();
    card._gapObserver = null;
  }
}

// ======= Order card =======
function renderOrderCard(order) {
  const esc = escHtml;
  const money = n => Number(n || 0).toFixed(2);
  const saleTotal0 = Number(order.paidEUR != null ? order.paidEUR : order.products.reduce((s, p) => s + (p.totalSale ?? p.amount * p.unitPrice), 0));
  const purchaseTotal0 = order.products.reduce((s, p) => s + Number(p.expectedPurchase || p.purchasePrice || 0) * p.amount, 0);
  const shippingSum0 = Number(order.shipping.aliExpress || 0) + Number(order.shipping.thirdParty1 || 0) + Number(order.shipping.thirdParty2 || 0);
  const stripeFee0 = Number(order.stripeFeeEUR || 0);
  const shippingPlusFees0 = shippingSum0 + stripeFee0;
  const expectedProfit0 = saleTotal0 - (purchaseTotal0 + shippingPlusFees0);

  // Keep all financial texts in sync (top bar, shipping rows, equation)
  function applyFinancialTexts(saleTotal, purchaseTotal, shippingTotal, profit) {
    let el;

    const shipOnly = Number(order.shipping.aliExpress || 0) + Number(order.shipping.thirdParty1 || 0) + Number(order.shipping.thirdParty2 || 0);
    const stripeFee = Number(order.stripeFeeEUR || 0);

    // --- TOP BAR ---
    el = card.querySelector("#TopBarDiv_B_A_B_TopBarExpectedPurchasePriceText");
    if (el) el.textContent = `Expected purchase price: ${money(purchaseTotal)} ${order.currency}`;

    el = card.querySelector("#TopBarDiv_B_A_C_TopBarShippingText");
    if (el) {
      const extra = stripeFee ? ` (Stripe fee: ${money(stripeFee)} ${order.currency})` : "";
      el.textContent = `Shipping: ${money(shipOnly)} ${order.currency}${extra}`;
    }

    el = card.querySelector("#TopBarDiv_B_B_A_TopBarProfitText");
    if (el) el.textContent = `Profit: ${money(profit)} ${order.currency}`;


    // --- Shipping total box on the “Shipping cost:” row (shipOnly; fees shown in top bar) ---
    el = card.querySelector("#DropdownDiv_C_B_B_ShippingCostSumText");
    if (el) el.textContent = `${money(shipOnly)} ${order.currency}`;

    // Inline copy next to "Shipping cost" label
    el = card.querySelector("#DropdownDiv_C_A_B_A_ShippingInlineSum");
    if (el) el.textContent = `${money(shipOnly)} ${order.currency}`;

    // --- Total sale / total purchase (there are TWO copies of each ID) ---
    card.querySelectorAll("#DropdownDiv_C_B_C_TotalPriceText").forEach(node => {
      node.textContent = `${money(saleTotal)} ${order.currency}`;
    });

    card.querySelectorAll("#DropdownDiv_C_B_D_TotalPurchasePriceText").forEach(node => {
      node.textContent = `${money(purchaseTotal)} ${order.currency}`;
    });

    // --- Profit equation + pill ---
    el = card.querySelector("#DropdownDiv_C_C_B_ProfitCalculationText");
    if (el) {
      el.textContent =
        `${money(saleTotal)} − (${money(purchaseTotal)} + ${money(shippingTotal)})`;
    }

    el = card.querySelector("#DropdownDiv_C_C_D_ProfitText");
    if (el) el.textContent = `${money(profit)} ${order.currency}`;
  }


  const card = document.createElement("div");
  card.id = "OrderCardDiv";
  card.className = "OrderCardDiv";
  card.dataset.id = order.id;

  // Done indicator classes (controlled by Settings)
  const _isDone = !!order.doneAt;
  card.classList.toggle("mg-done", _isDone);
  card.classList.toggle("mg-not-done", !_isDone);
  card.classList.toggle("mg-done-bg", state?.settings?.doneBgHighlight !== false);
  card.classList.toggle("mg-done-text", state?.settings?.doneTextHighlight !== false);
  // ---------- TOP BAR ----------
  const head = document.createElement("div");
  head.id = "TopBarDiv";
  head.className = "TopBarDiv";

  const confirmationEmailText = order.emailSentAt
    ? `Confirmation email: ${niceDateTime(order.emailSentAt)}`
    : "Confirmation email: Not yet";

  const shippedEmailText = order.shippedEmailSentAt
    ? `Shipped email: ${niceDateTime(order.shippedEmailSentAt)}`
    : "Shipped email: Not yet";

  const emailTimeText = `${confirmationEmailText}<br>${shippedEmailText}`;

  const doneTimeText = order.doneAt
    ? `Time done: ${niceDateTime(order.doneAt)}`
    : "Time done: Not yet";

  head.innerHTML = `
    <!-- Left: Order ID + Date & Time -->
    <div id="TopBarDiv_A" class="TopBarDiv_A">
      <div id="TopBarDiv_A_A" class="TopBarDiv_A_A">
        <button
          id="TopBarDiv_A_A_OrderIdText"
          class="TopBarDiv_A_A_OrderIdText copyableOrderId"
          type="button"
          title="Copy order ID"
          data-copy="${esc(order.id)}"
        >
          Order ID: ${esc(order.id)}
        </button>
      </div>
      <div id="TopBarDiv_A_B" class="TopBarDiv_A_B">
        <span
          id="TopBarDiv_A_B_DateTimeText"
          class="TopBarDiv_A_B_DateTimeText"
        >
          Date and Time: ${niceDateTime(order.createdAt)}
        </span>
             </div>
      <div id="TopBarDiv_C_B" class="TopBarDiv_C_B">
        <div id="TopBarDiv_C_B_A" class="TopBarDiv_C_B_A">
          ${emailTimeText}
        </div>
        <div id="TopBarDiv_C_B_B" class="TopBarDiv_C_B_B">
          <span id="DoneStatusText" class="DoneStatusText">${doneTimeText}</span>
        </div>
      </div>
    </div>
      </div>
      
    </div>

    <!-- Middle: price summary + profit -->
    <div id="TopBarDiv_B" class="TopBarDiv_B">
      <div id="TopBarDiv_B_A" class="TopBarDiv_B_A">
        <div id="TopBarDiv_B_A_A" class="TopBarDiv_B_A_A">
          <span
            id="TopBarDiv_B_A_A_TopBarTotalPricePaidText"
            class="TopBarDiv_B_A_A_TopBarTotalPricePaidText"
          >
            Price paid: ${money(saleTotal0)} ${order.currency}${(order.paymentCurrency && order.paymentCurrency !== "EUR" && Number(order.paidOriginalAmount || 0) > 0) ? ` (≈${money(order.paidOriginalAmount)} ${esc(order.paymentCurrency)})` : ""}
          </span>
        </div>
        <div id="TopBarDiv_B_A_B" class="TopBarDiv_B_A_B">
          <span
            id="TopBarDiv_B_A_B_TopBarExpectedPurchasePriceText"
            class="TopBarDiv_B_A_B_TopBarExpectedPurchasePriceText"
          >
            Expected purchase price: ${money(purchaseTotal0)} ${order.currency}
          </span>
        </div>
        <div id="TopBarDiv_B_A_C" class="TopBarDiv_B_A_C">
          <span
            id="TopBarDiv_B_A_C_TopBarShippingText"
            class="TopBarDiv_B_A_C_TopBarShippingText"
          >
            Shipping: ${money(shippingSum0)} ${order.currency}
          </span>
        </div>
      </div>
      <div id="TopBarDiv_B_B" class="TopBarDiv_B_B">
        <div id="TopBarDiv_B_B_A" class="TopBarDiv_B_B_A">
          <span
            id="TopBarDiv_B_B_A_TopBarProfitText"
            class="TopBarDiv_B_B_A_TopBarProfitText"
          >
            Profit: ${money(expectedProfit0)} ${order.currency}
          </span>
        </div>
      </div>
    </div>

    <!-- Right: buttons + times -->
    <div id="TopBarDiv_C" class="TopBarDiv_C">
<div id="TopBarDiv_C_A" class="TopBarDiv_C_A">
  <button
    id="TopBarDiv_C_A_A_TopBarDownloadButton"
    class="TopBarDiv_C_A_A"
    type="button"
  ></button>
  <button
    id="TopBarDiv_C_A_B_SendEmailButton"
    class="TopBarDiv_C_A_B"
    type="button"
  ></button>
  <button
    id="TopBarDiv_C_A_C_DoneCheckButton"
    class="TopBarDiv_C_A_C"
    type="button"
  ></button>
  <button
    id="TopBarDiv_C_A_D_RefundButton"
    class="TopBarDiv_C_A_D"
    type="button"
  >
    Refund
  </button>
</div>

<div id="TopBarDiv_C_C" class="TopBarDiv_C_C">
  <button
    id="TopBarDiv_C_C_OpenProductsTabsButton"
    class="TopBarDiv_C_C_OpenProductsTabsButton"
    type="button"
  >
    Open products tabs
  </button>
</div>

 
  `;
  card.appendChild(head);


  // ---------- DROPDOWN ----------
  const drop = document.createElement("div");
  drop.id = "DropdownDiv"; drop.className = "DropdownDiv";

  drop.innerHTML = `
  <div id="DropdownDiv_A" class="DropdownDiv_A">
    <div id="DropdownDiv_A_A" class="DropdownDiv_A_A">
      <span id="DropdownDiv_A_A_ProductNameText" class="DropdownDiv_A_A_ProductNameText">
        Product name
      </span>
    </div>
    <div id="DropdownDiv_A_B" class="DropdownDiv_A_B">
      <span id="DropdownDiv_A_B_SelectedProductText" class="DropdownDiv_A_B_SelectedProductText">
        Selected product
      </span>
    </div>
    <div id="DropdownDiv_A_C" class="DropdownDiv_A_C">
      <span id="DropdownDiv_A_C_ProductAmountText" class="DropdownDiv_A_C_ProductAmountText">
        Amount
      </span>
    </div>
    <div id="DropdownDiv_A_D" class="DropdownDiv_A_D">
      <span id="DropdownDiv_A_D_ProductUnitPriceText" class="DropdownDiv_A_D_ProductUnitPriceText">
        Unit price
      </span>
    </div>
    <div id="DropdownDiv_A_E" class="DropdownDiv_A_E">
      <span id="DropdownDiv_A_E_TotalRowPriceTexT" class="DropdownDiv_A_E_TotalRowPriceTexT">
        Total sale price
      </span>
    </div>
    <div id="DropdownDiv_A_F" class="DropdownDiv_A_F">
      <span id="DropdownDiv_A_F_ProductPurchasePriceText" class="DropdownDiv_A_F_ProductPurchasePriceText">
        Purchase price
      </span>
    </div>
  </div>

  <div id="ProductsContainer" class="ProductsContainer"></div>

  <div id="DropdownDiv_B" class="DropdownDiv_B" aria-hidden="true"></div>

  <div id="DropdownDiv_C" class="DropdownDiv_C">
    <!-- C_A: shipping cost row with 3 providers + inline sum -->
    <div id="DropdownDiv_C_A" class="DropdownDiv_C_A">
      <!-- label row: AliExpress + Third party 1 + Third party 2 -->
      <div id="DropdownDiv_C_A_A" class="DropdownDiv_C_A_A">
        <div id="DropdownDiv_C_A_A_A" class="DropdownDiv_C_A_A_A">
          <span id="DropdownDiv_C_A_A_A_AliexpressText" class="DropdownDiv_C_A_A_A_AliexpressText">AliExpress</span>
        </div>
        <div id="DropdownDiv_C_A_A_X1" class="DropdownDiv_C_A_A_X_Plus">
          <span id="DropdownDiv_C_A_A_X1_PlusText" class="DropdownDiv_C_A_A_X_PlusText">+</span>
        </div>
        <div id="DropdownDiv_C_A_A_B" class="DropdownDiv_C_A_A_B">
          <span id="DropdownDiv_C_A_A_B_ThirdPartyText" class="DropdownDiv_C_A_A_B_ThirdPartyText">Third party 1</span>
        </div>
        <div id="DropdownDiv_C_A_A_X2" class="DropdownDiv_C_A_A_X_Plus">
          <span id="DropdownDiv_C_A_A_X2_PlusText" class="DropdownDiv_C_A_A_X_PlusText">+</span>
        </div>
        <div id="DropdownDiv_C_A_A_C" class="DropdownDiv_C_A_A_C">
          <span id="DropdownDiv_C_A_A_C_ThirdParty2Text" class="DropdownDiv_C_A_A_C_ThirdParty2Text">Third party 2</span>
        </div>
      </div>
      <!-- input row: shipping inputs (cols 1-4) + totals aligned to header (cols 5-6) -->
      <div id="DropdownDiv_C_A_B_Aligned" class="DropdownDiv_C_A_B_Aligned">
        <div id="DropdownDiv_C_A_B" class="DropdownDiv_C_A_B">
          <div id="DropdownDiv_C_A_B_A" class="DropdownDiv_C_A_B_A">
            <span id="DropdownDiv_C_A_B_A_ShippingCostText" class="DropdownDiv_C_A_B_A_ShippingCostText">Shipping cost</span>
          </div>
          <div id="DropdownDiv_C_A_B_B" class="DropdownDiv_C_A_B_B">
            <input id="DropdownDiv_C_A_B_B_AliexpressInput" class="DropdownDiv_C_A_B_B_AliexpressInput commit" type="text" value="${money(order.shipping.aliExpress || 0)}">
          </div>
          <div id="DropdownDiv_C_A_B_X1" class="DropdownDiv_C_A_B_X_Plus">
            <span id="DropdownDiv_C_A_B_X1_PlusText" class="DropdownDiv_C_A_B_X1_PlusText">+</span>
          </div>
          <div id="DropdownDiv_C_A_B_C" class="DropdownDiv_C_A_B_C">
            <input id="DropdownDiv_C_A_B_C_ThirdParty1Input" class="DropdownDiv_C_A_B_C_ThirdParty1Input commit" type="text" value="${money(order.shipping.thirdParty1 || 0)}">
          </div>
          <div id="DropdownDiv_C_A_B_X2" class="DropdownDiv_C_A_B_X_Plus">
            <span id="DropdownDiv_C_A_B_X2_PlusText" class="DropdownDiv_C_A_B_X2_PlusText">+</span>
          </div>
          <div id="DropdownDiv_C_A_B_D" class="DropdownDiv_C_A_B_D">
            <input id="DropdownDiv_C_A_B_D_ThirdParty2Input" class="DropdownDiv_C_A_B_D_ThirdParty2Input commit" type="text" value="${money(order.shipping.thirdParty2 || 0)}">
          </div>
          <div id="DropdownDiv_C_A_B_E" class="DropdownDiv_C_A_B_E"><span id="DropdownDiv_C_A_B_E_ShippingCostSumLabel" class="DropdownDiv_C_A_B_E_ShippingCostSumLabel"></span></div>
          <div id="DropdownDiv_C_A_B_F" class="DropdownDiv_C_A_B_F"><span id="DropdownDiv_C_A_B_F_ShippingCostSumText" class="DropdownDiv_C_A_B_F_ShippingCostSumText"></span></div>
        </div>

        <!-- Totals aligned with header columns: Total sale price / Purchase price -->
        <div id="DropdownDiv_C_A_TotalSale" class="DropdownDiv_C_A_TotalSale">
          <span id="DropdownDiv_C_B_C_TotalPriceText" class="DropdownDiv_C_B_C_TotalPriceText">${money(saleTotal0)} ${order.currency}</span>
        </div>
        <div id="DropdownDiv_C_A_TotalPurchase" class="DropdownDiv_C_A_TotalPurchase">
          <span id="DropdownDiv_C_B_D_TotalPurchasePriceText" class="DropdownDiv_C_B_D_TotalPurchasePriceText">${money(purchaseTotal0)} ${order.currency}</span>
        </div>
      </div>
    </div>
<!-- C_B: row under the dashed line → “Shipping cost: Sum of …” + totals -->
    <div id="DropdownDiv_C_B" class="DropdownDiv_C_B">
      <div id="DropdownDiv_C_B_A" class="DropdownDiv_C_B_A">
        <span id="DropdownDiv_C_B_A_ShippingText" class="DropdownDiv_C_B_A_ShippingText">Shipping cost:</span>
        <span id="DropdownDiv_C_A_B_A_ShippingInlineSum" class="DropdownDiv_C_B_B_ShippingCostSumText">${money(shippingSum0)} ${order.currency}</span>
        <span id="DropdownDiv_C_B_A_ShippingSumLabel" class="DropdownDiv_C_B_A_ShippingSumLabel"></span>
      </div>

      <div id="DropdownDiv_C_B_B" class="DropdownDiv_C_B_B">
        <span id="DropdownDiv_C_B_B_ShippingCostSumText" class="DropdownDiv_C_B_B_ShippingCostSumText">${money(shippingSum0)} ${order.currency}</span>
      </div>

      <!-- Duplicate totals aligned to header columns (same IDs on purpose; update code uses querySelectorAll) -->
      <div id="DropdownDiv_C_B_C" class="DropdownDiv_C_B_C">
        <span id="DropdownDiv_C_B_C_TotalPriceText" class="DropdownDiv_C_B_C_TotalPriceText">${money(saleTotal0)} ${order.currency}</span>
      </div>
      <div id="DropdownDiv_C_B_D" class="DropdownDiv_C_B_D">
        <span id="DropdownDiv_C_B_D_TotalPurchasePriceText" class="DropdownDiv_C_B_D_TotalPurchasePriceText">${money(purchaseTotal0)} ${order.currency}</span>
      </div>
    </div>

<!-- C_C: expected profit equation -->
    <div id="DropdownDiv_C_C" class="DropdownDiv_C_C">
      <div id="DropdownDiv_C_C_A" class="DropdownDiv_C_C_A">
        <span id="DropdownDiv_C_C_A_ShippingCostText" class="DropdownDiv_C_C_A_ShippingCostText">
          Expected profit
        </span>
      </div>
      <div id="DropdownDiv_C_C_B" class="DropdownDiv_C_C_B">
        <span id="DropdownDiv_C_C_B_ProfitCalculationText" class="DropdownDiv_C_C_B_ProfitCalculationText">
          ${money(saleTotal0)} − (${money(purchaseTotal0)} + ${money(shippingSum0)})
        </span>
      </div>
      <div id="DropdownDiv_C_C_C" class="DropdownDiv_C_C_C">
        <span id="DropdownDiv_C_C_C_EqualsSign" class="DropdownDiv_C_C_C_EqualsSign">=</span>
      </div>
      <div id="DropdownDiv_C_C_D" class="DropdownDiv_C_C_D">
        <span id="DropdownDiv_C_C_D_ProfitText" class="DropdownDiv_C_C_D_ProfitText">
          ${money(expectedProfit0)} ${order.currency}
        </span>
      </div>
    </div>

    <!-- C_C_D: bottom band (name / address / currency + button) -->
    <div id="DropdownDiv_C_C_D" class="DropdownDiv_C_C_D">
      <div id="DropdownDiv_C_C_D_A" class="DropdownDiv_C_C_D_A">
        <div id="DropdownDiv_C_C_D_A_A" class="DropdownDiv_C_C_D_A_A">
          <span
            id="DropdownDiv_C_C_D_A_A_UserName"
            class="DropdownDiv_C_C_D_A_A_UserName copyable"
            data-copy="${esc(order.customer.name)}"
          >
            Name: ${esc(order.customer.name)}
          </span>
        </div>
        <div id="DropdownDiv_C_C_D_A_B" class="DropdownDiv_C_C_D_A_B">
          <span
            id="DropdownDiv_C_C_D_A_B_UserSurname"
            class="DropdownDiv_C_C_D_A_B_UserSurname copyable"
            data-copy="${esc(order.customer.surname)}"
          >
            Surname: ${esc(order.customer.surname)}
          </span>
        </div>
      </div>

      <div id="DropdownDiv_C_C_D_B" class="DropdownDiv_C_C_D_B">
        <div id="DropdownDiv_C_C_D_B_A" class="DropdownDiv_C_C_D_B_A">
          <span
            id="DropdownDiv_C_C_D_B_A_UserCountry"
            class="DropdownDiv_C_C_D_B_A_UserCountry copyable"
            data-copy="${esc(order.customer.country)}"
          >
            Country: ${esc(order.customer.country)}
          </span>
        </div>
        <div id="DropdownDiv_C_C_D_B_B" class="DropdownDiv_C_C_D_B_B">
          <span
            id="DropdownDiv_C_C_D_B_B_UserCity"
            class="DropdownDiv_C_C_D_B_B_UserCity copyable"
            data-copy="${esc(order.customer.city)}"
          >
            City: ${esc(order.customer.city)}
          </span>
        </div>
        <div id="DropdownDiv_C_C_D_B_C" class="DropdownDiv_C_C_D_B_C">
          <span
            id="DropdownDiv_C_C_D_B_C_UserAddress"
            class="DropdownDiv_C_C_D_B_C_UserAddress copyable"
            data-copy="${esc(order.customer.address)}"
          >
            Address: ${esc(order.customer.address)}
          </span>
        </div>
        <div id="DropdownDiv_C_C_D_B_D" class="DropdownDiv_C_C_D_B_D">
          <span
            id="DropdownDiv_C_C_D_B_D_UserPostalCode"
            class="DropdownDiv_C_C_D_B_D_UserPostalCode copyable"
            data-copy="${esc(order.customer.postalCode)}"
          >
            Postal code: ${esc(order.customer.postalCode)}
          </span>
        </div>
      </div>

      <div id="DropdownDiv_C_C_D_C" class="DropdownDiv_C_C_D_C">
        <div id="DropdownDiv_C_C_D_C_A" class="DropdownDiv_C_C_D_C_A">
          <span id="DropdownDiv_C_C_D_C_A_UserCurrencyText" class="DropdownDiv_C_C_D_C_A_UserCurrencyText">
            User currency: ${order.currency}
          </span>
        </div>
        <div id="DropdownDiv_C_C_D_C_B" class="DropdownDiv_C_C_D_C_B">
          <button
            id="DropdownDiv_C_C_D_C_B_SubmitSendEmailMarkDoneButton"
            class="DropdownDiv_C_C_D_C_B_SubmitSendEmailMarkDoneButton"
            type="button"
          >
            Submit + Send + Mark done
          </button>
        </div>
      </div>
    </div>
  </div>
`;



  card.appendChild(drop);
  applyFinancialTexts(saleTotal0, purchaseTotal0, shippingPlusFees0, expectedProfit0);
  // ---------- PRODUCTS ----------
  const pc = drop.querySelector("#ProductsContainer");
  pc.innerHTML = "";
  order.products.forEach((p, i) => {
    const row = document.createElement("div");
    row.id = `ProductDiv_${i}`; row.className = "ProductDiv";
    // Build row safely (no innerHTML / no inline attributes)
    const a = document.createElement("div");
    a.id = `ProductDiv_A_${i}`;
    a.className = "ProductDiv_A";

    const btn = document.createElement("button");
    btn.id = `ProductDiv_A_A_ProductNameText_${i}`;
    btn.className = "ProductDiv_A_A_ProductNameText copyable";
    btn.title = "Copy AliExpress URL";
    btn.dataset.copy = String(p.url || "");
    btn.textContent = String(p.name || "");
    a.appendChild(btn);

    // ⋮ menu: edit product URL and persist to catalog
    const menuBtn = document.createElement("button");
    menuBtn.type = "button";
    menuBtn.className = "ProductDiv_A_MenuBtn";
    menuBtn.textContent = "⋮";
    menuBtn.title = "Edit product URL";
    menuBtn.onclick = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const oldUrl = String(p.url || "").trim();
      const next = prompt(`Edit URL for:\n${String(p.name || "").trim()}`, oldUrl);
      if (next == null) return; // cancelled
      const newUrl = String(next || "").trim();

      // Basic sanity (allow empty to clear)
      if (newUrl && !/^https?:\/\//i.test(newUrl)) {
        alert("URL must start with http:// or https://");
        return;
      }

      // Update UI/runtime immediately
      p.url = newUrl;
      btn.dataset.copy = newUrl;

      // Persist to catalog
      try {
        const res = await mgUpdateCatalogProductUrlByName(String(p.name || ""), oldUrl, newUrl);
        if (!res?.updated) {
          toast("Saved locally", "No matching product found in catalog (name match).");
        } else {
          toast("Catalog updated", `Updated ${res.updated} item(s)`);
        }
      } catch (err) {
        // Roll back local URL if server fails
        p.url = oldUrl;
        btn.dataset.copy = oldUrl;
        alert(`Failed to update catalog URL.\n\n${String(err?.message || err)}`);
      }
    };
    a.appendChild(menuBtn);

    const b = document.createElement("div");
    b.id = `ProductDiv_B_${i}`;
    b.className = "ProductDiv_B";
    const sel = document.createElement("span");
    sel.id = `ProductDiv_B_SelectedProductText_${i}`;
    sel.className = "ProductDiv_B_SelectedProductText";
    sel.textContent = String(p.selected || "");
    b.appendChild(sel);

    const c = document.createElement("div");
    c.id = `ProductDiv_C_${i}`;
    c.className = "ProductDiv_C";
    const amt = document.createElement("span");
    amt.id = `ProductDiv_C_ProductAmountText_${i}`;
    amt.className = "ProductDiv_C_ProductAmountText";
    amt.textContent = String(p.amount ?? "");
    c.appendChild(amt);

    const d = document.createElement("div");
    d.id = `ProductDiv_D_${i}`;
    d.className = "ProductDiv_D";
    const unit = document.createElement("span");
    unit.id = `ProductDiv_D_ProductUnitPriceText_${i}`;
    unit.className = "ProductDiv_D_ProductUnitPriceText";
    unit.textContent = money(p.unitPrice);
    d.appendChild(unit);

    const e = document.createElement("div");
    e.id = `ProductDiv_E_${i}`;
    e.className = "ProductDiv_E";
    const total = document.createElement("span");
    total.id = `ProductDiv_E_ProductTotalPrice_${i}`;
    total.className = "ProductDiv_E_ProductTotalPrice";
    total.textContent = money(p.totalSale ?? p.amount * p.unitPrice);
    e.appendChild(total);

    const f = document.createElement("div");
    f.id = `ProductDiv_F_${i}`;
    f.className = "ProductDiv_F";
    const inp = document.createElement("input");
    inp.id = `ProductDiv_F_ProductPurchasePriceInputText_${i}`;
    inp.className = "ProductDiv_F_ProductPurchasePriceInputText commit";
    inp.type = "text";
    inp.value = money(p.expectedPurchase ?? p.purchasePrice ?? 0);
    inp.dataset.kind = "expectedPurchase";
    inp.dataset.index = String(i);
    f.appendChild(inp);

    row.appendChild(a);
    row.appendChild(b);
    row.appendChild(c);
    row.appendChild(d);
    row.appendChild(e);
    row.appendChild(f);

    pc.appendChild(row);
  });

  // ---------- BEHAVIOUR ----------
  head.addEventListener("click", (e) => {
    if (e.target.closest("button")) return;
    // Do not toggle the card when copying values (e.g., Order ID)
    if (e.target.closest("[data-copy]")) return;
    if (state.openOrderId === order.id) { closeDropbar(card); state.openOrderId = null; }
    else { openDropbar(card); state.openOrderId = order.id; }
  });

  // copy-on-click (ID, name, address, ALI URL, etc.)
  card.addEventListener("click", (e) => {
    const v = e.target?.dataset?.copy;
    if (v != null) {
      navigator.clipboard.writeText(String(v));
      toast("Copied", String(v));
      e.stopPropagation();
    }
  });

  // icon buttons
  const downloadBtn = card.querySelector("#TopBarDiv_C_A_A_TopBarDownloadButton");
  if (downloadBtn) {
    downloadBtn.onclick = (e) => {
      e.stopPropagation();
      downloadOrderExcel(order);
    };
  }

  const sendBtn = card.querySelector("#TopBarDiv_C_A_B_SendEmailButton");
  if (sendBtn) {
    sendBtn.onclick = (e) => {
      e.stopPropagation();
      sendEmail(order);
    };
  }

  const doneBtn = card.querySelector("#TopBarDiv_C_A_C_DoneCheckButton");
  if (doneBtn) {
    doneBtn.onclick = (e) => {
      e.stopPropagation();
      toggleDone(order);
    };
  }

  const refundBtn = card.querySelector("#TopBarDiv_C_A_D_RefundButton");
  if (refundBtn) {
    refundBtn.onclick = async (e) => {
      e.stopPropagation();
      await handleRefund(order);
    };
  }

  // open all product links (one tab per product)
  const openTabsBtn = card.querySelector("#TopBarDiv_C_C_OpenProductsTabsButton");
  if (openTabsBtn) {
    openTabsBtn.onclick = (e) => {
      e.stopPropagation();
      openOrderProductsTabs(order);
    };
  }



  // submit + send + mark done
  const submitBtn = card.querySelector("#DropdownDiv_C_C_D_C_B_SubmitSendEmailMarkDoneButton");
  if (submitBtn) {
    submitBtn.onclick = async () => {
      try {
        await ensureLogin();

        // 1) Save edits (purchase + shipping)
        await persistEdits(order);

        // 2) Update catalog purchase prices (best-effort)
        await applyPricesAndSave(order);

        // 3) Send shipped email and confirm result from server
        let mailSent = false;
        let shippedAt = null;
        try {
          const res = await adminApi.sendShippedEmail(order.id);
          mailSent = !!(res?.mailSent ?? res?.ok);
          shippedAt = res?.shippedEmailSentAt || null;
          if (mailSent) {
            order.shippedEmailSentAt = shippedAt || new Date().toISOString();
            saveOrders(state.orders);
          }
        } catch (err) {
          mailSent = false;
          alert(`Email NOT sent.\n\n${String(err?.message || err)}`);
          return;
        }

        // Popup: user must click OK
        alert(mailSent ? "Email sent successfully." : "Email was NOT sent.");

        if (!mailSent) return;

        // 4) Mark done (only if mail was sent)
        try {
          const now = new Date().toISOString();
          await adminApi.patchOrder(order.id, { operator: { doneAt: now } });
          order.doneAt = now;
          saveOrders(state.orders);
        } catch (err) {
          alert(`Email sent, but marking done failed.\n\n${String(err?.message || err)}`);
          return;
        }

        // 5) Close card + rerender as done
        closeDropbar(card);
        state.openOrderId = null;
        render();

      } catch (e) {
        alert(`Action failed.\n\n${String(e?.message || e)}`);
      }
    };
  }


  // commit on Enter (purchase & shipping)
  // commit on Enter (purchase & shipping)
  card.querySelectorAll("input.commit").forEach(input => {
    input.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;

      // 1) update underlying data
      if (input.dataset.kind === "expectedPurchase") {
        const idx = Number(input.dataset.index);
        order.products[idx].expectedPurchase = Number(input.value || 0);
      }

      if (input.id === "DropdownDiv_C_A_B_B_AliexpressInput") {
        order.shipping.aliExpress = Number(input.value || 0);
      }
      if (input.id === "DropdownDiv_C_A_B_C_ThirdParty1Input") {
        order.shipping.thirdParty1 = Number(input.value || 0);
      }
      if (input.id === "DropdownDiv_C_A_B_D_ThirdParty2Input") {
        order.shipping.thirdParty2 = Number(input.value || 0);
      }

      // 2) recompute totals from updated data
      const saleTotal = Number(order.paidEUR || 0);
      const purchaseTotal = order.products.reduce(
        (s, p) => s + Number(p.expectedPurchase || p.purchasePrice || 0) * p.amount,
        0
      );
      const shipOnly =
        Number(order.shipping.aliExpress || 0) +
        Number(order.shipping.thirdParty1 || 0) +
        Number(order.shipping.thirdParty2 || 0);
      const stripeFee = Number(order.stripeFeeEUR || 0);
      const shipPlusFees = shipOnly + stripeFee;
      const profit = saleTotal - (purchaseTotal + shipPlusFees);

      // 3) update ALL visuals for this card
      applyFinancialTexts(saleTotal, purchaseTotal, shipPlusFees, profit);

      // 4) persist + UX
      saveOrders(state.orders);
      input.blur();
      toast("Saved", "Values committed");
      persistEdits(order).catch(console.error);
    });

    input.addEventListener("click", () => input.select());
  });


  // Apply done highlighting (settings-controlled)
  applyDoneDecorations(card, order);

  return card;
}

// OPEN/CLOSE helpers
function openDropbar(card) {
  closeAllDropbars();
  card.classList.add('open');
  const db = card.querySelector('#DropdownDiv');
  if (db) { db.style.maxHeight = db.scrollHeight + 'px'; }
  _setExtraGap(card);
  _attachGapObserver(card);
  state.openOrderId = card.dataset.id || state.openOrderId;
}
function closeDropbar(card) {
  card.classList.remove('open');
  const db = card.querySelector('#DropdownDiv');
  if (db) { db.style.maxHeight = '0px'; }
  card.style.setProperty('--extra-gap', '0px');
  _detachGapObserver(card);
}
function closeAllDropbars() {
  document.querySelectorAll(".OrderCardDiv.open").forEach(c => closeDropbar(c));
}
async function adminDownloadLocalServerProducts() {
  const r = await fetch(`${_adminBase()}/admin/products/local/download`, {
    method: "GET",
    headers: _adminHeaders(false)
  });
  if (!r.ok) throw new Error(`Download failed (${r.status})`);

  const blob = await r.blob();
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "ServerProducts.js";
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

async function adminReplaceLocalServerProductsFromFile(file) {
  if (!file) throw new Error("No file selected");

  const text = await file.text();
  const headers = _adminHeaders(false);
  headers["Content-Type"] = "text/plain; charset=utf-8";

  const r = await fetch(`${_adminBase()}/admin/products/local/replace`, {
    method: "POST",
    headers,
    body: text
  });

  const out = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(out.error || `Upload failed (${r.status})`);
  return out;
}

// Load the bundled Management Frontend/ServerProducts.js, extract the exported object, and upload as strict JSON.
// This avoids backend 400s caused by non-JSON formats such as `const products = {...}; module.exports = products;`.
function _parseServerProductsModuleToObject(jsText) {
  const src = String(jsText || "").replace(/^\uFEFF/, "");

  // Allow simple ESM form too.
  const code = src.replace(/\bexport\s+default\b/g, "module.exports =");

  const module = { exports: undefined };
  const exports = {};
  const require = () => { throw new Error("require() is disabled in ServerProducts parser"); };

  // Evaluate in a minimal sandbox.
  const fn = new Function("module", "exports", "require", `${code}\n; return (module.exports !== undefined ? module.exports : exports);`);
  const out = fn(module, exports, require);
  const obj = (module.exports !== undefined ? module.exports : out);
  if (!obj || typeof obj !== "object") {
    throw new Error("Bundled ServerProducts.js did not export an object");
  }
  return obj;
}

async function adminReplaceLocalServerProductsFromBundledFile() {
  const r = await fetch("./ServerProducts.js", { cache: "no-store" });
  if (!r.ok) throw new Error(`Failed to load bundled ServerProducts.js (${r.status})`);
  const jsText = await r.text();
  const obj = _parseServerProductsModuleToObject(jsText);
  const jsonText = JSON.stringify(obj, null, 2);

  const headers = _adminHeaders(false);
  headers["Content-Type"] = "text/plain; charset=utf-8";

  const up = await fetch(`${_adminBase()}/admin/products/local/replace`, {
    method: "POST",
    headers,
    body: jsonText
  });
  const out = await up.json().catch(() => ({}));
  if (!up.ok) throw new Error(out.error || `Upload failed (${up.status})`);
  return out;
}

window.adminApi = window.adminApi || {}; Object.assign(window.adminApi, {
  downloadLocalServerProducts: adminDownloadLocalServerProducts,
  replaceLocalServerProductsFromFile: adminReplaceLocalServerProductsFromFile,
  replaceLocalServerProductsFromBundledFile: adminReplaceLocalServerProductsFromBundledFile
});

// ===== Refund API adapter =====
async function adminRefundOrder(orderId, { amount, reason, note } = {}) {
  if (!orderId) throw new Error("refundOrder: orderId is required");

  const body = {};
  if (amount != null) body.amount = Number(amount);
  if (reason) body.reason = String(reason);
  if (note) body.note = String(note);

  const r = await fetch(`${_adminBase()}/admin/orders/${encodeURIComponent(orderId)}/refund`, {
    method: "POST",
    headers: _adminHeaders(true),
    body: JSON.stringify(body)
  });

  if (!r.ok) {
    let msg = `refundOrder HTTP ${r.status}`;
    try {
      const t = await r.text();
      if (t) msg += `: ${t}`;
    } catch (_) { }
    throw new Error(msg);
  }

  return r.json();
}
async function handleRefund(order) {
  if (!order || !order.id) return;

  // Use server-paid total (EUR) for refunds/info
  const saleTotal = Number(order.paidEUR || 0);
  const amountText = saleTotal > 0
    ? `${saleTotal.toFixed(2)} ${order.currency || "EUR"} (full remaining amount)`
    : "full remaining amount";

  const msg =
    `Do you really want to send a REFUND for order ${esc(order.id)}?\n\n` +
    `Amount: ${amountText}\n\n` +
    `Press OK to create the refund in Stripe.\n` +
    `Press Cancel to abort and do nothing.`;

  const ok = window.confirm(msg);
  if (!ok) {
    toast("Cancelled", "Refund not sent");
    return;
  }

  try {
    await ensureLogin();
    // Full refund (no explicit amount) – server will use remaining amount
    const res = await adminApi.refundOrder(order.id, {});

    const refund = res?.refund || {};
    const orderFromServer = res?.order || {};

    // Nice amount text from minor units
    let refundAmountText = "";
    if (typeof refund.amountMinor === "number" && refund.amountMinor > 0) {
      const dec = (refund.amountMinor / 100).toFixed(2);
      const cur = (refund.currency || order.currency || "EUR").toUpperCase();
      refundAmountText = `${dec} ${cur}`;
    }

    toast(
      "Refund created",
      refundAmountText
        ? `Refund ${refund.id || ""} for ${refundAmountText}`
        : `Refund ${refund.id || ""} created`
    );

    // Optionally update local order state with status from backend
    if (orderFromServer.status) {
      order.status = orderFromServer.status;
    }
    if (orderFromServer.stripe) {
      order.stripe = orderFromServer.stripe;
    }

    saveOrders(state.orders);
    render();
  } catch (e) {
    toast("Error", String(e?.message || e));
  }
}

// expose on global adminApi
window.adminApi = window.adminApi || {}; Object.assign(window.adminApi, {
  refundOrder: adminRefundOrder
});


// Excel exports
async function downloadOrderExcel(order) {
  const rows = [];
  rows.push(["Order ID", order.id]);
  rows.push(["Created", niceDateTime(order.createdAt)]);
  rows.push(["Customer", `${esc(order.customer.name)} ${esc(order.customer.surname)}`]);
  rows.push(["Address", order.customer.address]);
  rows.push(["City", order.customer.city]);
  rows.push(["Postal Code", order.customer.postalCode]);
  rows.push(["Country", order.customer.country]);
  rows.push([]);
  rows.push(["Products"]);
  rows.push(["Name", "Qty", "Unit Price", "Sale Total", "Expected Purchase", "URL"]);
  order.products.forEach(p => rows.push([p.name, p.amount, p.unitPrice, p.totalSale, p.expectedPurchase, p.url]));
  const shippingTotal = Object.values(order.shipping).reduce((a, b) => a + Number(b || 0), 0);
  const expectedPurchaseTotal = order.products.reduce((s, p) => s + Number(p.expectedPurchase || 0) * p.amount, 0);
  const saleTotal = order.products.reduce((s, p) => s + (p.totalSale ?? (p.amount * p.unitPrice)), 0);

  const expectedProfit = saleTotal - (expectedPurchaseTotal + shippingTotal);
  rows.push([]);
  rows.push(["Shipping Total", shippingTotal]);
  rows.push(["Expected Purchase Total", expectedPurchaseTotal]);
  rows.push(["Sale Total", saleTotal]);
  rows.push(["Expected Profit", expectedProfit]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Order");
  XLSX.writeFile(wb, `${esc(order.id)}.xlsx`);
}
async function downloadOrdersExcel(orders, label = "orders") {
  const rows = [["Order ID", "Date", "Customer", "Sale Total", "Expected Purchase Total", "Shipping Total", "Expected Profit", "Done At", "Email Sent At"]];
  for (const o of orders) {
    const shippingTotal = Object.values(o.shipping).reduce((a, b) => a + Number(b || 0), 0);
    const expectedPurchaseTotal = o.products.reduce((s, p) => s + Number(p.expectedPurchase || 0) * p.amount, 0);
    const saleTotal = o.products.reduce((s, p) => s + p.totalSale, 0);
    const expectedProfit = saleTotal - (expectedPurchaseTotal + shippingTotal);
    rows.push([
      o.id,
      niceDate(o.createdAt),
      `${o.customer.name} ${o.customer.surname}`,
      saleTotal,
      expectedPurchaseTotal,
      shippingTotal,
      expectedProfit,
      o.doneAt ? niceDateTime(o.doneAt) : "",
      o.emailSentAt ? niceDateTime(o.emailSentAt) : ""
    ]);
  }
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Orders");
  XLSX.writeFile(wb, `${label}.xlsx`);
}

// ======= Settings modal (drag order + defaults) =======
// ======= Settings modal (drag order + defaults + API base/admin code) =======
function setupSettingsModal() {
  const m = document.getElementById("settingsModal");
  if (!m) return;

  // Close handlers
  m.querySelectorAll("[data-close-modal]").forEach(b => {
    b.addEventListener("click", closeSettingsModal);
  });

  const closeBtn = document.getElementById("settingsClose");
  const saveBtn = document.getElementById("settingsSave");
  if (closeBtn) closeBtn.onclick = closeSettingsModal;

  if (saveBtn) {
    saveBtn.onclick = () => {
      // 1) Save UI preferences (row order + default dates)
      const items = Array.from(document.querySelectorAll("#dragList .drag-item")).map(el => el.dataset.id).filter(Boolean);
      if (items.length) state.settings.rowOrder = items;

      const defSince = document.querySelector("input[name='defSince']:checked")?.value || "today";
      state.settings.defaultSince =
        defSince === "specific"
          ? (document.getElementById("defSinceDate")?.value || "today")
          : defSince;

      const defTill = document.querySelector("input[name='defTill']:checked")?.value || "startOfYear";
      state.settings.defaultTill = defTill;
      state.settings.defaultTillDate = document.getElementById("defTillDate")?.value || undefined;
      state.settings.tillRollToCurrentYear = !!document.getElementById("rollYear")?.checked;

      // Done highlighting toggles
      // (support both legacy ids and the current Settings UI ids)
      const bgEl = document.getElementById("doneIndicatorBg") || document.getElementById("doneBgHighlightToggle");
      const txtEl = document.getElementById("doneIndicatorText") || document.getElementById("doneTextHighlightToggle");
      state.settings.doneBgHighlight = !!bgEl?.checked;
      state.settings.doneTextHighlight = !!txtEl?.checked;

      // Open-products button behavior
      const opMode = document.querySelector("input[name='openProdMode']:checked")?.value || "launcher";
      state.settings.openProductsMode = (opMode === "direct") ? "direct" : "launcher";

      const opTarget = document.querySelector("input[name='openProdTarget']:checked")?.value || state.settings.openProductsTarget || "newWindow";
      state.settings.openProductsTarget = (opTarget === "sameWindow") ? "sameWindow" : "newWindow";

      state.settings.openProductsPreferWindow = !!document.getElementById("openProductsPreferWindow")?.checked;
      state.settings.openProductsIncludeSummaryTab = !!document.getElementById("openProductsIncludeSummaryTab")?.checked;

      saveSettings(state.settings);

      // 2) Save API wiring (used by ensureLogin/adminApi)
      try {
        const apiBaseEl = document.getElementById("apiBaseInput");
        const adminCodeEl = document.getElementById("adminCodeInput");
        try { window.graphEngine?.setAdminApi?.(window.adminApi); } catch { }

        const rawBase = String(apiBaseEl?.value || "").trim().replace(/\/+$/, "");
        if (rawBase) {
          window.adminApi?.setApiBase?.(rawBase);
        } else {
          localStorage.removeItem("api_base");
        }

        const rawCode = String(adminCodeEl?.value || "").trim();
        if (rawCode) {
          window.adminApi?.setAdminCode?.(rawCode);
        } else {
          localStorage.removeItem("admin_code");
        }
      } catch (e) {
        console.error("Saving API settings failed:", e);
      }

      closeSettingsModal();
      render();
      toast("Saved", "Settings updated");
    };
  }
}

function openSettingsModal() {
  const m = document.getElementById("settingsModal");
  if (!m) return;

  // Populate drag list
  const list = document.getElementById("dragList");
  if (list) {
    list.innerHTML = "";
    (state.settings.rowOrder || DEFAULT_ROW_ORDER).forEach(id => {
      const el = document.createElement("div");
      el.className = "drag-item";
      el.dataset.id = id;
      el.innerHTML = `<span>${labelize(id)}</span><span class="meta">drag</span>`;
      list.appendChild(el);
    });

    // Init Sortable once (if library is present)
    try {
      if (window.Sortable && !list._sortableInstance) {
        list._sortableInstance = new Sortable(list, { animation: 150, ghostClass: "drag-ghost" });
      }
    } catch (e) {
      console.warn("Sortable init failed:", e);
    }
  }

  // Populate default since
  const sinceVal = state.settings.defaultSince;
  document.querySelectorAll("input[name='defSince']").forEach(r => {
    const v = r.value;
    r.checked = (v === sinceVal) || (v === "specific" && sinceVal !== "today" && sinceVal !== "yesterday");
  });
  const defSinceDate = document.getElementById("defSinceDate");
  if (defSinceDate) {
    defSinceDate.value =
      (sinceVal && sinceVal !== "today" && sinceVal !== "yesterday")
        ? toLocalDateKey(sinceVal)
        : toLocalDateKey(new Date());
  }

  // Populate default till
  document.querySelectorAll("input[name='defTill']").forEach(r => {
    r.checked = (r.value === state.settings.defaultTill);
  });
  const defTillDate = document.getElementById("defTillDate");
  if (defTillDate) {
    defTillDate.value = state.settings.defaultTillDate
      ? toLocalDateKey(state.settings.defaultTillDate)
      : toLocalDateKey(startOfYear(new Date()));
  }
  const roll = document.getElementById("rollYear");
  if (roll) roll.checked = !!state.settings.tillRollToCurrentYear;

  // Populate done highlighting toggles (support both legacy + current ids)
  const bgT = document.getElementById("doneIndicatorBg") || document.getElementById("doneBgHighlightToggle");
  if (bgT) bgT.checked = state.settings.doneBgHighlight !== false;
  const txT = document.getElementById("doneIndicatorText") || document.getElementById("doneTextHighlightToggle");
  if (txT) txT.checked = state.settings.doneTextHighlight !== false;

  // Populate open-products behavior
  const mode = (state.settings.openProductsMode || "launcher");
  document.querySelectorAll("input[name='openProdMode']").forEach(r => {
    r.checked = (r.value === mode) || (mode !== "direct" && r.value === "launcher");
  });

  const target = (state.settings.openProductsTarget || "newWindow");
  document.querySelectorAll("input[name='openProdTarget']").forEach(r => {
    r.checked = (r.value === target) || (target !== "sameWindow" && r.value === "newWindow");
  });

  const preferW = document.getElementById("openProductsPreferWindow");
  if (preferW) preferW.checked = !!state.settings.openProductsPreferWindow;

  const opSum = document.getElementById("openProductsIncludeSummaryTab");
  if (opSum) opSum.checked = !!state.settings.openProductsIncludeSummaryTab;


  // Populate API wiring fields
  const apiBaseEl = document.getElementById("apiBaseInput");
  if (apiBaseEl) apiBaseEl.value = String(localStorage.getItem("api_base") || "").trim();

  const adminCodeEl = document.getElementById("adminCodeInput");
  if (adminCodeEl) adminCodeEl.value = String(localStorage.getItem("admin_code") || "").trim();

  m.classList.remove("hidden");
  m.setAttribute("aria-hidden", "false");
}

function closeSettingsModal() {
  const m = document.getElementById("settingsModal");
  if (!m) return;
  m.classList.add("hidden");
  m.setAttribute("aria-hidden", "true");
}
function labelize(key) {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, m => m.toUpperCase());
}
// --- drop-in replacements in scriptA.js ---
// Helper URLs/headers (use your existing ones if already present)
function _adminBase() {
  // Use the same API-base resolver as the rest of the admin UI (supports <meta name="api-base"> and stored base).
  try {
    if (typeof getApiBase === "function") {
      const b = getApiBase({ preferStored: true });
      if (b) return String(b).replace(/\/\/+$/, "");
    }
  } catch { /* ignore */ }

  // Legacy fallback
  return (localStorage.getItem("api_base") || location.origin).replace(/\/\/+$/, "");
}
function _adminHeaders(json = true) {
  const h = json ? { "Content-Type": "application/json" } : {};
  const token = localStorage.getItem("api_token") || "";
  const code = localStorage.getItem("admin_code") || "";
  if (token) h.Authorization = `Bearer ${token}`;
  if (code) h["X-Admin-Code"] = code;
  return h;
}

// ---- authHeaders() compatibility alias (older code paths) ----
function authHeaders(json = false) {
  try { return _adminHeaders(!!json); } catch { return {}; }
}


// Drop-in replacement
async function adminUpdateProductPrice({ productLink, name, newRetailPriceEUR, purchasePriceEUR }) {
  const body = { productLink, name };
  if (purchasePriceEUR != null) body.purchasePriceEUR = Number(purchasePriceEUR) || 0;
  if (newRetailPriceEUR != null) body.newRetailPriceEUR = Number(newRetailPriceEUR) || 0;

  if (!body.productLink && !body.name) {
    throw new Error("updateProductPrice: productLink or name is required");
  }

  const r = await fetch(`${_adminBase()}/admin/product-price`, {
    method: "PATCH",
    headers: _adminHeaders(true),
    body: JSON.stringify(body)
  });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error(`updateProductPrice HTTP ${r.status} ${t}`);
  }
  return r.json();
}

// Expose on the global adapter
window.adminApi = window.adminApi || {}; Object.assign(window.adminApi, {
  updateProductPrice: adminUpdateProductPrice
});
async function adminExportExcel({ from, to, limit = 10000 } = {}) {
  await ensureLogin();
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (limit) params.set("limit", String(limit));
  // The route is auth-protected, so we pass the bearer token via a temporary fetch+blob download
  const r = await fetch(`${_adminBase()}/admin/export/orders.xlsx?${params}`, {
    headers: _adminHeaders(false)
  });
  if (!r.ok) throw new Error(`exportExcel HTTP ${r.status}`);
  const blob = await r.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "orders.xlsx";
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  a.remove();
}
window.adminApi = window.adminApi || {}; Object.assign(window.adminApi, { exportExcel: adminExportExcel });

async function applyPricesAndSave(order) {
  await ensureLogin();

  for (const p of order.products) {
    const purchaseEUR = Number(p.expectedPurchase || p.purchasePrice || 0);
    if (!purchaseEUR) continue;

    // Prefer product link when you have it; fallback to name.
    const payload = {
      productLink: p.url || undefined,
      name: p.name || undefined,
      purchasePriceEUR: purchaseEUR
      // newRetailPriceEUR: computeNewRetailEUR(purchaseEUR) ?? undefined
    };

    try {
      await adminApi.updateProductPrice(payload);
    } catch (err) {
      console.warn("updateProductPrice failed for", p.name, err);
    }
  }
}



async function persistEdits(order) {
  await ensureLogin();

  // Accounting currency is EUR; do not overwrite server-paid totals.
  const saleTotalEUR = Number(order.paidEUR || 0);

  const purchaseTotalEUR = order.products.reduce(
    (s, p) => s + (Number(p.expectedPurchase || p.purchasePrice || 0) * Number(p.amount || 1)),
    0
  );

  const shippingOnlyEUR =
    Number(order.shipping?.aliExpress || 0) +
    Number(order.shipping?.thirdParty1 || 0) +
    Number(order.shipping?.thirdParty2 || 0);

  const stripeFeeEUR = Number(order.stripeFeeEUR || 0);
  const profitPreviewEUR = saleTotalEUR - (purchaseTotalEUR + shippingOnlyEUR + stripeFeeEUR);

  // Encode a compact internal note for quick review
  const note = [
    `expectedPurchaseTotal=${purchaseTotalEUR.toFixed(2)}`,
    `shippingOnly=${shippingOnlyEUR.toFixed(2)}`,
    `stripeFee=${stripeFeeEUR.toFixed(2)}`,
    `profitPreview=${profitPreviewEUR.toFixed(2)}`,
    `editedAt=${new Date().toISOString()}`
  ].join(";");

  const itemsPatch = order.products.map((p, index) => ({
    index,
    expectedPurchase: Number((Number(p.expectedPurchase || 0)).toFixed(2))
  }));

  const patch = {
    pricing: { note },
    operator: {
      shipping: {
        aliExpress: Number(order.shipping?.aliExpress || 0),
        thirdParty1: Number(order.shipping?.thirdParty1 || 0),
        thirdParty2: Number(order.shipping?.thirdParty2 || 0)
      }
    },
    itemsPatch
  };

  await adminApi.patchOrder(order.id, patch);
}


async function getProducts() {
  const r = await fetch(`${_adminBase()}/products`, { headers: _adminHeaders(false) });
  if (!r.ok) throw new Error(`getProducts HTTP ${r.status}`);
  const payload = await r.json();

  // New shape: { catalog, config }
  if (payload && typeof payload === "object" && payload.catalog && typeof payload.catalog === "object") {
    return payload.catalog;
  }
  return payload;
}
// expose (without overwriting updateProductPrice)
window.adminApi = window.adminApi || {}; Object.assign(window.adminApi, { getProducts });



async function updateProductPrice({ productId, slug, sku, pricePath, newPrice }) {
  const payload = { newPrice: Number(newPrice) };
  if (productId) payload.productId = String(productId);
  else if (slug) payload.slug = String(slug);
  else if (sku) payload.sku = String(sku);
  if (pricePath) payload.path = String(pricePath);
  const r = await fetch(u("product-price"), { method: "PATCH", headers: headers(), body: JSON.stringify(payload) });
  if (!r.ok) throw new Error(`updateProductPrice HTTP ${r.status}`);
  return r.json();
}
window.adminApi = window.adminApi || {}; Object.assign(window.adminApi, {
  updateProductPrice: adminUpdateProductPrice
});




// ===== Generic admin helpers (non-conflicting) =====
async function _adminFetchJson(url, { method = "GET", headers, body } = {}) {
  const r = await fetch(url, { method, headers, body });
  const out = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(out?.error || `HTTP ${r.status}`);
  return out;
}

async function _adminFetchText(url, { method = "GET", headers, body } = {}) {
  const r = await fetch(url, { method, headers, body });
  const t = await r.text().catch(() => "");
  if (!r.ok) throw new Error(t || `HTTP ${r.status}`);
  return t;
}

function _adminDownloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ===== Tariffs (data/tariffs/tariffs.json) =====
async function adminFetchLocalTariffsText() {
  return _adminFetchText(`${_adminBase()}/admin/tariffs/download`, {
    method: "GET",
    headers: _adminHeaders(false)
  });
}

async function adminDownloadLocalTariffs() {
  const r = await fetch(`${_adminBase()}/admin/tariffs/download`, {
    method: "GET",
    headers: _adminHeaders(false)
  });
  if (!r.ok) throw new Error(`Download failed (${r.status})`);

  const blob = await r.blob();
  _adminDownloadBlob(blob, "tariffs.json");
}

async function adminReplaceLocalTariffsFromText(jsonText) {
  if (typeof jsonText !== "string" || !jsonText.trim()) {
    throw new Error("replaceTariffs: jsonText is required");
  }

  // Validate JSON before sending
  JSON.parse(jsonText);

  const headers = _adminHeaders(false);
  headers["Content-Type"] = "text/plain; charset=utf-8";

  return _adminFetchJson(`${_adminBase()}/admin/tariffs/replace`, {
    method: "POST",
    headers,
    body: jsonText
  });
}

async function adminReplaceLocalTariffsFromObject(obj) {
  if (!obj || typeof obj !== "object") {
    throw new Error("replaceTariffs: object is required");
  }
  return _adminFetchJson(`${_adminBase()}/admin/tariffs/replace`, {
    method: "POST",
    headers: _adminHeaders(true),
    body: JSON.stringify(obj)
  });
}

async function adminReplaceLocalTariffsFromFile(file) {
  if (!file) throw new Error("No file selected");
  const text = await file.text();
  return adminReplaceLocalTariffsFromText(text);
}

// ===== Catalog reconcile (local vs canonical) =====
async function adminSyncProductsWithCanonical() {
  return _adminFetchJson(`${_adminBase()}/admin/products/sync`, {
    method: "POST",
    headers: _adminHeaders(true),
    body: "{}"
  });
}

// ===== Ops/status =====
async function adminHealthz() {
  return _adminFetchJson(`${_adminBase()}/healthz`, { method: "GET" });
}

async function adminGetRates() {
  return _adminFetchJson(`${_adminBase()}/rates`, { method: "GET" });
}

// ===== Fulfillment controls =====
async function adminGetOrderFulfillment(orderId) {
  if (!orderId) throw new Error("getFulfillment: orderId required");
  return _adminFetchJson(
    `${_adminBase()}/admin/orders/${encodeURIComponent(orderId)}/fulfillment`,
    { method: "GET", headers: _adminHeaders(false) }
  );
}

async function adminPatchOrderFulfillment(orderId, { method, packages, customs, self } = {}) {
  if (!orderId) throw new Error("patchFulfillment: orderId required");
  const body = {};
  if (method != null) body.method = method;
  if (packages != null) body.packages = packages;
  if (customs != null) body.customs = customs;
  if (self != null) body.self = self;

  return _adminFetchJson(
    `${_adminBase()}/admin/orders/${encodeURIComponent(orderId)}/fulfillment`,
    { method: "PATCH", headers: _adminHeaders(true), body: JSON.stringify(body) }
  );
}

async function adminQuoteOrderFulfillment(orderId, { method = "AGENT", packages = [], customs = {} } = {}) {
  if (!orderId) throw new Error("quoteFulfillment: orderId required");
  return _adminFetchJson(
    `${_adminBase()}/admin/orders/${encodeURIComponent(orderId)}/fulfillment/quote`,
    {
      method: "POST",
      headers: _adminHeaders(true),
      body: JSON.stringify({ method, packages, customs })
    }
  );
}

async function adminPlaceOrderFulfillment(orderId, { method = "AGENT", packages = [], customs = {}, self = {} } = {}) {
  if (!orderId) throw new Error("placeFulfillment: orderId required");
  return _adminFetchJson(
    `${_adminBase()}/admin/orders/${encodeURIComponent(orderId)}/fulfillment/place`,
    {
      method: "POST",
      headers: _adminHeaders(true),
      body: JSON.stringify({ method, packages, customs, self })
    }
  );
}

async function adminCancelOrderFulfillment(orderId) {
  if (!orderId) throw new Error("cancelFulfillment: orderId required");
  return _adminFetchJson(
    `${_adminBase()}/admin/orders/${encodeURIComponent(orderId)}/fulfillment/cancel`,
    { method: "POST", headers: _adminHeaders(true), body: "{}" }
  );
}

// ===== Expose on global adapter =====
window.adminApi = window.adminApi || {};
Object.assign(window.adminApi, {
  fetchLocalTariffsText: adminFetchLocalTariffsText,
  downloadLocalTariffs: adminDownloadLocalTariffs,
  replaceLocalTariffsFromText: adminReplaceLocalTariffsFromText,
  replaceLocalTariffsFromObject: adminReplaceLocalTariffsFromObject,
  replaceLocalTariffsFromFile: adminReplaceLocalTariffsFromFile,

  syncProductsWithCanonical: adminSyncProductsWithCanonical,

  healthz: adminHealthz,
  getRates: adminGetRates,

  getOrderFulfillment: adminGetOrderFulfillment,
  patchOrderFulfillment: adminPatchOrderFulfillment,
  quoteOrderFulfillment: adminQuoteOrderFulfillment,
  placeOrderFulfillment: adminPlaceOrderFulfillment,
  cancelOrderFulfillment: adminCancelOrderFulfillment
});
; (() => {
  // ===== Tariffs UI (editor + history) =====
  let _tariffsUi = {
    installed: false,
    panel: null,
    rawText: "",
    obj: null,
    rows: [],       // [{id, code, value}]
    filter: "",
    dirty: false,
    jsonEditing: false,
    history: { items: [], index: -1 }, // snapshots
    _editDebounce: null,
    _baseline: null // snapshot of last server refresh
  };

  function _tariffsNewRow(code = "", value = "") {
    const id = (typeof crypto !== "undefined" && crypto.randomUUID)
      ? crypto.randomUUID()
      : ("r_" + Date.now() + "_" + Math.random().toString(16).slice(2));
    return { id, code: String(code || ""), value: String(value ?? "") };
  }

  function _tariffsRowsFromObject(obj) {
    const rows = [];
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return rows;
    // preserve insertion order
    for (const [k, v] of Object.entries(obj)) {
      rows.push(_tariffsNewRow(String(k || ""), String(v)));
    }
    return rows;
  }

  function _tariffsIsFiniteNumberString(s) {
    const v = Number(String(s).trim());
    return Number.isFinite(v);
  }

  function _tariffsNormalizeCode(s) {
    return String(s || "").trim().toUpperCase();
  }

  function _tariffsNormalizeNumber(v) {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
      const s = v.trim().replace(",", ".");
      const n = Number(s);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  }

  function _tariffsParseLooseJson(raw) {
    const s0 = String(raw || "").trim();
    if (!s0) return null;

    // First try strict JSON
    try { return JSON.parse(s0); } catch (_) { }

    // Attempt small, safe repairs:
    let s = s0;

    // Replace commas in numbers (12,5 -> 12.5) without touching separators
    s = s.replace(/(\d),(\d)/g, "$1.$2");

    // Quote bare keys: { US: 12.5 } -> { "US": 12.5 }
    s = s.replace(/([{,]\s*)([A-Za-z0-9_]+)\s*:/g, '$1"$2":');

    // Insert missing commas between adjacent properties:
    // "US": 12.5\n"UK": 7.5  => "US": 12.5,\n"UK": 7.5
    s = s.replace(/("([^"\\]|\\.)*"\s*:\s*[^,\n\r\}]+)\s*[\r\n]+\s*(")/g, "$1,\n$3");

    // Remove trailing commas before } or ]
    s = s.replace(/,\s*([}\]])/g, "$1");

    // Final attempt
    return JSON.parse(s);
  }

  function _tariffsObjectToRows(obj) {
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
      throw new Error('Top-level JSON must be an object like { "US": 12.5 }');
    }
    const rows = [];

    const toValueString = (x) => {
      if (typeof x === "number" && Number.isFinite(x)) return String(x);
      if (typeof x === "string") return x.trim().replace(/,/g, ".");
      return "";
    };

    for (const [kRaw, v] of Object.entries(obj)) {
      const code = _tariffsNormalizeCode(kRaw);
      if (!code) continue;

      let valueStr = "";

      // support value as number/string or {tariff: ...} / {value: ...}
      if (typeof v === "object" && v && !Array.isArray(v)) {
        valueStr = toValueString(v.tariff ?? v.rate ?? v.value);
      } else {
        valueStr = toValueString(v);
      }

      rows.push(_tariffsNewRow(code, valueStr));
    }

    rows.sort((a, b) => String(a.code).localeCompare(String(b.code)));
    return rows;
  }
  function _tariffsRowsToObject(rows) {
    const obj = {};
    for (const r of (rows || [])) {
      const code = _tariffsNormalizeCode(r.code);
      const raw = String(r.value ?? "").trim();
      if (!code) continue;
      if (!raw) continue; // don't serialize empty values
      const val = Number(raw);
      if (!Number.isFinite(val)) continue;
      obj[code] = val;
    }
    return obj;
  }

  function _tariffsValidateRows(rows) {
    const dupCodes = new Set();
    const seen = new Map(); // code -> count
    const emptyCodes = new Set();
    const invalidValues = new Set();

    for (const r of rows || []) {
      const code = _tariffsNormalizeCode(r.code);
      if (!code) emptyCodes.add(r.id);
      else seen.set(code, (seen.get(code) || 0) + 1);

      const valStr = String(r.value ?? "").trim();
      if (!valStr || !_tariffsIsFiniteNumberString(valStr)) invalidValues.add(r.id);
    }

    for (const [code, count] of seen.entries()) {
      if (count > 1) dupCodes.add(code);
    }

    const dupRowIds = new Set();
    if (dupCodes.size) {
      for (const r of rows || []) {
        const code = _tariffsNormalizeCode(r.code);
        if (code && dupCodes.has(code)) dupRowIds.add(r.id);
      }
    }

    const ok = dupCodes.size === 0 && emptyCodes.size === 0 && invalidValues.size === 0;
    return { ok, dupCodes, dupRowIds, emptyCodes, invalidValues };
  }

  function _tariffsHistoryReset(rows, reason = "Loaded") {
    const snap = {
      t: Date.now(),
      reason,
      rows: (rows || []).map(r => ({ id: r.id, code: r.code, value: r.value }))
    };
    _tariffsUi.history.items = [snap];
    _tariffsUi.history.index = 0;
    _tariffsUi._baseline = snap;
    tariffsUiRenderHistory();
    tariffsUiRenderHistoryButtons();
  }

  function _tariffsHistoryPush(reason = "Edit") {
    const snap = {
      t: Date.now(),
      reason,
      rows: (_tariffsUi.rows || []).map(r => ({ id: r.id, code: r.code, value: r.value }))
    };

    const h = _tariffsUi.history;
    if (h.index < h.items.length - 1) h.items = h.items.slice(0, h.index + 1);

    h.items.push(snap);
    if (h.items.length > 120) {
      const baseline = h.items[0];
      h.items = [baseline].concat(h.items.slice(-119));
    }
    h.index = h.items.length - 1;
    tariffsUiRenderHistory();
    tariffsUiRenderHistoryButtons();
  }

  function _tariffsHistorySchedule(reason = "Edit") {
    if (_tariffsUi._editDebounce) clearTimeout(_tariffsUi._editDebounce);
    _tariffsUi._editDebounce = setTimeout(() => {
      _tariffsUi._editDebounce = null;
      _tariffsHistoryPush(reason);
    }, 650);
  }

  function _tariffsHistoryGoTo(idx) {
    const h = _tariffsUi.history;
    if (!h.items.length) return;
    const i = Math.max(0, Math.min(Number(idx), h.items.length - 1));
    h.index = i;
    const snap = h.items[i];
    _tariffsUi.rows = (snap.rows || []).map(r => ({ id: r.id, code: r.code, value: r.value }));
    _tariffsUiSetDirty(true);
    tariffsUiRender();
    tariffsUiRenderHistory();
    tariffsUiRenderHistoryButtons();
  }

  function _tariffsHistoryUndo() {
    const h = _tariffsUi.history;
    if (h.index <= 0) return;
    _tariffsHistoryGoTo(h.index - 1);
  }

  function _tariffsHistoryRedo() {
    const h = _tariffsUi.history;
    if (h.index >= h.items.length - 1) return;
    _tariffsHistoryGoTo(h.index + 1);
  }

  function _tariffsUiEnsurePanel() {
    if (_tariffsUi.panel) return _tariffsUi.panel;

    let panel = document.getElementById("tariffsTab");
    if (!panel) {
      panel = document.createElement("section");
      panel.id = "tariffsTab";
      panel.className = "container tariffs-hidden";
      const main = document.querySelector("section.container");
      if (main && main.parentNode) main.parentNode.insertBefore(panel, main.nextSibling);
      else document.body.appendChild(panel);
    } else {
      // Use the placeholder panel from index.html. Ensure toggle logic treats it as hidden initially.
      panel.classList.add("tariffs-hidden");
    }

    panel.innerHTML = `
    <div class="tariffs-top">
      <div class="tariffs-title">Tariffs <span class="mg-badge" id="tariffsStatusBadge">not loaded</span></div>
      <div class="tariffs-actions">
        <button class="mgmt-btn" id="tariffsRefreshBtn">Refresh</button>
        <button class="mgmt-btn" id="tariffsDownloadBtn">Download</button>
        <button class="mgmt-btn" id="tariffsUploadBtn">Upload</button>
        <button class="mgmt-btn" id="tariffsCloseBtn" title="Close">✕</button>
      </div>
    </div>

    <div class="tariffs-body">
      <div class="tariffs-note" id="tariffsNote"></div>

      <div class="tariffs-layout">
  <div class="tariffs-main">
    <div class="tariffs-toolbar">
      <input class="tariffs-search" id="tariffsSearch" placeholder="Search country code…" />
      <div class="tariffs-count" id="tariffsCount"></div>
    </div>

    <div class="tariffs-editor" id="tariffsEditorView">
      <div class="tariffs-table-wrap">
        <table class="tariffs-table">
          <thead>
            <tr>
              <th style="width: 240px;">Country code</th>
              <th style="width: 240px;">Tariff</th>
              <th style="width: 90px;"></th>
            </tr>
          </thead>
          <tbody id="tariffsTbody"></tbody>
        </table>
      </div>

      <div class="tariffs-bottombar">
        <button class="mgmt-btn primary" id="tariffsAddRowBtn">+ Add row</button>
        <div class="tariffs-bottombar-right">
          <button class="mgmt-btn" id="tariffsCancelBtn" disabled>Cancel</button>
          <button class="mgmt-btn primary" id="tariffsSaveBtn" disabled>Save</button>
        </div>
      </div>
      <div class="tariffs-add-hint tariffs-add-hint-bottom">Changes are local until you click <b>Save</b>.</div>
    </div>
  </div>

  <aside class="tariffs-history">
          <div class="tariffs-history-head">
            <div class="tariffs-history-title">History</div>
            <div class="tariffs-history-nav">
              <button class="mgmt-btn" id="tariffsHistBackBtn" title="Back">◀</button>
              <button class="mgmt-btn" id="tariffsHistFwdBtn" title="Forward">▶</button>
            </div>
          </div>
          <div class="tariffs-history-list" id="tariffsHistoryList"></div>
          <div class="tariffs-history-hint">Click an entry to jump. Use ◀/▶ to navigate.</div>
        </aside>
</div>

      <details class="tariffs-jsondrop" id="tariffsJsonDetails">
      <summary class="tariffs-jsondrop-summary"><span>Raw JSON (auto-updates)</span><button class="mgmt-btn mgmt-btn-ghost" id="tariffsApplyJsonBtn" type="button" title="Overwrite rows from JSON">Sync rows from JSON</button></summary>
      <textarea class="tariffs-raw" id="tariffsJsonText" spellcheck="false" ></textarea>
      <div class="tariffs-raw-hint">This JSON view reflects your rows immediately. Use <b>Refresh</b> to load the latest server version.</div>
    </details>

</div>
  `;

    _tariffsUi.panel = panel;

    const byId = (id) => panel.querySelector("#" + id);

    byId("tariffsCloseBtn")?.addEventListener("click", () => tariffsUiHide());

    byId("tariffsRefreshBtn")?.addEventListener("click", async () => {
      await actionRunner(async () => { await tariffsUiRefresh(); }, "Tariffs refresh");
    });

    byId("tariffsDownloadBtn")?.addEventListener("click", async () => {
      await actionRunner(async () => {
        await safeEnsureLogin();
        if (!window.adminApi?.downloadLocalTariffs) throw new Error("downloadLocalTariffs() not found");
        await window.adminApi.downloadLocalTariffs();
        ttoast("Tariffs", "Download started");
      }, "Tariffs download");
    });

    byId("tariffsUploadBtn")?.addEventListener("click", async () => {
      await actionRunner(async () => {
        await safeEnsureLogin();
        if (!window.adminApi?.replaceLocalTariffsFromFile) throw new Error("replaceLocalTariffsFromFile() not found");
        const file = await pickFile({ accept: ".json,application/json" });
        if (!file) return;
        await window.adminApi.replaceLocalTariffsFromFile(file);
        ttoast("Tariffs", "Uploaded & replaced");
        await tariffsUiRefresh();
      }, "Tariffs upload");
    });

    byId("tariffsSaveBtn")?.addEventListener("click", async () => {
      await actionRunner(async () => { await tariffsUiSave(); }, "Tariffs save");
    });

    byId("tariffsCancelBtn")?.addEventListener("click", () => {
      tariffsUiCancel();
    });

    byId("tariffsHistBackBtn")?.addEventListener("click", () => _tariffsHistoryUndo());
    byId("tariffsHistFwdBtn")?.addEventListener("click", () => _tariffsHistoryRedo());

    byId("tariffsSearch")?.addEventListener("input", (e) => {
      _tariffsUi.filter = String(e.target?.value || "");
      tariffsUiRenderTableBody();
    });
    tariffsUiSyncJson();

    byId("tariffsAddRowBtn")?.addEventListener("click", () => {
      _tariffsUi.rows.push(_tariffsNewRow("", ""));
      _tariffsUiSetDirty(true);
      _tariffsHistoryPush("Add row");
      tariffsUiRenderTableBody();
    });
    tariffsUiSyncJson();

    // Row events (delegation)
    // Raw JSON -> Rows (bi-directional sync)
    const jsonTa = panel.querySelector("#tariffsJsonText");
    if (jsonTa) {
      const applyJson = () => {
        if (_tariffsUi.jsonUpdating) return false;
        const raw = String(jsonTa.value || "").trim();
        if (!raw) return false;
        try {
          const parsed = _tariffsParseLooseJson(raw);
          if (parsed === null) return;
          const rows = _tariffsObjectToRows(parsed);
          _tariffsUi.rows = rows;
          _tariffsUiSetDirty(true);
          _tariffsHistoryPush("Apply JSON");
          jsonTa.classList.remove("tariffs-json-invalid");
          tariffsUiValidate();
          tariffsUiRenderTableBody();
          tariffsUiRenderCount();
          tariffsUiRenderHistory();
        } catch (e) {
          jsonTa.classList.add("tariffs-json-invalid");
          // keep rows as-is; show a readable error in the banner if available
          const msg = (e && e.message) ? e.message : "Invalid JSON";
          const banner = panel.querySelector("#tariffsErrBanner");
          if (banner) {
            banner.hidden = false;
            banner.textContent = msg;
          }
        }
      };

      jsonTa.addEventListener("focus", () => { _tariffsUi.jsonEditing = true; });
      jsonTa.addEventListener("blur", () => { _tariffsUi.jsonEditing = false; tariffsUiSyncJson(true); });

      const applyBtn = panel.querySelector("#tariffsApplyJsonBtn");
      if (applyBtn) {
        applyBtn.addEventListener("click", (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          clearTimeout(_tariffsUi.jsonDebounce);
          const ok = applyJson();
          if (ok) { tariffsUiSyncJson(true); ttoast("Tariffs", "Rows overwritten from JSON"); }
        });
      }

      jsonTa.addEventListener("input", () => {
        if (_tariffsUi.jsonUpdating) return false;
        clearTimeout(_tariffsUi.jsonDebounce);
        _tariffsUi.jsonDebounce = setTimeout(() => {
          applyJson();
          // if JSON is valid, also sync JSON formatting back (pretty print)
          if (!jsonTa.classList.contains("tariffs-json-invalid")) tariffsUiSyncJson(true);
        }, 350);
      });

      jsonTa.addEventListener("keydown", (ev) => {
        if ((ev.ctrlKey || ev.metaKey) && ev.key === "Enter") {
          ev.preventDefault();
          clearTimeout(_tariffsUi.jsonDebounce);
          applyJson();
          if (!jsonTa.classList.contains("tariffs-json-invalid")) tariffsUiSyncJson(true);
        }
      });
    }

    panel.querySelector("#tariffsTbody")?.addEventListener("click", (e) => {
      const btn = e.target?.closest("[data-delrow]");
      if (!btn) return;
      const id = String(btn.getAttribute("data-delrow") || "");
      _tariffsUi.rows = (_tariffsUi.rows || []).filter(r => r.id !== id);
      _tariffsUiSetDirty(true);
      _tariffsHistoryPush("Delete row");
      tariffsUiRenderTableBody();
      tariffsUiRenderCount();
      tariffsUiRenderHistory();
      tariffsUiSyncJson();
    });

    panel.querySelector("#tariffsTbody")?.addEventListener("input", (e) => {
      const inp = e.target?.closest("input[data-rowid][data-field]");
      if (!inp) return;
      const id = String(inp.getAttribute("data-rowid") || "");
      const field = String(inp.getAttribute("data-field") || "");
      const row = (_tariffsUi.rows || []).find(r => r.id === id);
      if (!row) return;

      if (field === "code") row.code = String(inp.value || "");

      if (field === "value") {
        // replace comma with dot automatically
        let v = String(inp.value || "");
        if (v.includes(",")) {
          v = v.replace(/,/g, ".");
          inp.value = v;
        }
        row.value = v;
      }

      _tariffsUiSetDirty(true);
      _tariffsHistorySchedule("Edit");
      tariffsUiRenderValidationOnly();
      tariffsUiRenderCount();
      tariffsUiSyncJson();
    });

    // keyboard shortcuts while panel visible
    panel.addEventListener("keydown", (e) => {
      const visible = !_tariffsUi.panel?.classList.contains("tariffs-hidden");
      if (!visible) return;
      const isMac = /Mac|iPhone|iPad/.test(navigator.platform || "");
      const ctrl = isMac ? e.metaKey : e.ctrlKey;
      if (!ctrl) return;
      if (e.key.toLowerCase() === "z") { e.preventDefault(); _tariffsHistoryUndo(); }
      if (e.key.toLowerCase() === "y") { e.preventDefault(); _tariffsHistoryRedo(); }
    });

    return panel;
  }

  function _tariffsUiSetBadge(text) {
    const el = _tariffsUi.panel?.querySelector("#tariffsStatusBadge");
    if (el) el.textContent = String(text || "");
  }

  function _tariffsUiSetNote(text, level) {
    const el = _tariffsUi.panel?.querySelector("#tariffsNote");
    if (!el) return;
    const msg = String(text || "");
    el.textContent = msg;
    el.className = "tariffs-note" + (level ? ` tariffs-note-${level}` : "");
    if (msg) el.style.display = "block";
    else el.style.display = "none";
  }

  function _tariffsUiSetDirty(isDirty) {
    _tariffsUi.dirty = !!isDirty;
    const saveBtn = _tariffsUi.panel?.querySelector("#tariffsSaveBtn");
    const cancelBtn = _tariffsUi.panel?.querySelector("#tariffsCancelBtn");
    if (saveBtn) saveBtn.disabled = !_tariffsUi.dirty;
    if (cancelBtn) cancelBtn.disabled = !_tariffsUi.dirty;
    tariffsUiRenderHistoryButtons();
  }

  function tariffsUiRenderHistoryButtons() {
    const h = _tariffsUi.history;

    const backBtn = _tariffsUi.panel?.querySelector("#tariffsHistBackBtn");
    const fwdBtn = _tariffsUi.panel?.querySelector("#tariffsHistFwdBtn");
    if (backBtn) backBtn.disabled = !(h.items.length && h.index > 0);
    if (fwdBtn) fwdBtn.disabled = !(h.items.length && h.index < h.items.length - 1);
  }

  function tariffsUiRenderHistory() {
    const list = _tariffsUi.panel?.querySelector("#tariffsHistoryList");
    if (!list) return;
    const h = _tariffsUi.history;
    const items = h.items || [];
    const cur = h.index;

    const fmt = (t) => {
      try {
        const d = new Date(t);
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      } catch { return ""; }
    };

    list.innerHTML = items.map((it, i) => {
      const active = (i === cur) ? "tariffs-history-item-active" : "";
      return `
      <button class="tariffs-history-item ${active}" data-hidx="${i}">
        <span class="tariffs-history-time">${escHtml(fmt(it.t))}</span>
        <span class="tariffs-history-reason">${escHtml(it.reason || "Edit")}</span>
      </button>
    `;
    }).join("");

    list.querySelectorAll("[data-hidx]").forEach(btn => {
      btn.addEventListener("click", () => {
        const i = Number(btn.getAttribute("data-hidx"));
        _tariffsHistoryGoTo(i);
      });
    });
  }

  function tariffsUiShow() {
    _tariffsUiEnsurePanel();
    const p = _tariffsUi.panel;
    p.classList.remove("tariffs-hidden");
    p.classList.remove("hidden");
    p.setAttribute("aria-hidden", "false");
    localStorage.setItem("mgmt_active_tab", "tariffs");
    try { const groups = document.getElementById("groups"); if (groups) groups.innerHTML = ""; } catch (e) { }
    try { renderFilters(true); } catch (e) { }
    try { updateMgmtTabButtons(); } catch (e) { }
    tariffsUiRenderHistoryButtons();
  }

  function tariffsUiHide() {
    if (!_tariffsUi.panel) return;
    const p = _tariffsUi.panel;
    p.classList.add("tariffs-hidden");
    p.classList.add("hidden");
    p.setAttribute("aria-hidden", "true");
    const active = localStorage.getItem("mgmt_active_tab");
    if (active === "tariffs") localStorage.setItem("mgmt_active_tab", "orders");
    try { renderFilters(true); } catch (e) { }
  }

  async function tariffsUiToggle() {
    _tariffsUiEnsurePanel();
    const hidden = _tariffsUi.panel.classList.contains("tariffs-hidden");
    if (hidden) {
      tariffsUiShow();
      await tariffsUiRefresh();
    } else {
      tariffsUiHide();
    }
  }

  function tariffsUiCancel() {
    const base = _tariffsUi._baseline;
    if (!base) return;
    _tariffsUi.rows = (base.rows || []).map(r => ({ id: r.id, code: r.code, value: r.value }));
    _tariffsHistoryReset(_tariffsUi.rows, "Cancelled");
    _tariffsUiSetDirty(false);
    tariffsUiRender();
    tariffsUiSyncJson(true);
    ttoast("Tariffs", "Changes cancelled");
  }

  async function tariffsUiRefresh() {
    try { _tariffsUiEnsurePanel(); } catch (e) { console.error("tariffsUiRefresh: ensurePanel failed", e); }

    try { _tariffsUiSetBadge("loading…"); } catch { }
    try { _tariffsUiSetNote("", ""); } catch { }
    try { _tariffsUiSetDirty(false); } catch { }

    let text = "";
    try {
      // Prefer admin (editable) only if the whole stack exists
      const canAdmin =
        window.adminApi &&
        typeof window.adminApi.fetchLocalTariffsText === "function" &&
        typeof safeEnsureLogin === "function";

      if (canAdmin) {
        await safeEnsureLogin();
        text = await window.adminApi.fetchLocalTariffsText();
      } else {
        // Robust base resolution (never throws)
        let base = "";
        try { base = (typeof getApiBase === "function" ? getApiBase({ preferStored: true }) : ""); } catch { }
        if (!base) {
          base =
            (document.querySelector('meta[name="api-base"]')?.getAttribute("content") || "") ||
            (localStorage.getItem("api_base") || "") ||
            "https://api.snagletshop.com";
        }
        base = String(base || "https://api.snagletshop.com").trim().replace(/\/+$/, "");

        const url = `${base}/tariffs?__mg=${Date.now()}`;
        const res = await window.fetch(url, {
          method: "GET",
          cache: "no-store",
          headers: { "Accept": "application/json" }
        });
        if (!res.ok) throw new Error(`Tariffs fetch failed: ${res.status} ${res.statusText || ""}`.trim());
        text = await res.text();
        try { _tariffsUiSetNote("Loaded from public /tariffs endpoint (read-only). Upload/Save requires admin API.", "info"); } catch { }
      }

      _tariffsUi.rawText = String(text || "").trim();

      let obj = null;
      try { obj = JSON.parse(_tariffsUi.rawText || "{}"); } catch (e) { obj = null; }
      _tariffsUi.obj = obj;

      if (obj && typeof obj === "object" && !Array.isArray(obj)) {
        _tariffsUi.rows = _tariffsRowsFromObject(obj);
        try { _tariffsUiSetBadge(`loaded: ${_tariffsUi.rows.length}`); } catch { }
        try {
          if (_tariffsUi.rows.length === 0) _tariffsUiSetNote("Tariffs are currently empty.", "info");
        } catch { }
        try { _tariffsHistoryReset(_tariffsUi.rows, "Loaded"); } catch { }
        try { _tariffsUiSetDirty(false); } catch { }
      } else {
        _tariffsUi.rows = [];
        try { _tariffsUiSetBadge(obj ? "loaded (non-object)" : "invalid JSON"); } catch { }
        try { _tariffsUiSetNote("Tariffs JSON is not a plain object.", "warn"); } catch { }
        try { _tariffsHistoryReset(_tariffsUi.rows, "Loaded"); } catch { }
        try { _tariffsUiSetDirty(false); } catch { }
      }
    } catch (e) {
      try { _tariffsUiSetBadge("error"); } catch { }
      try { _tariffsUiSetNote(String(e?.message || e), "warn"); } catch { }
      console.error("tariffsUiRefresh failed:", e);
    }

    try { tariffsUiRender(); } catch (e) { console.error("tariffsUiRender failed:", e); }
    try { tariffsUiSyncJson(true); } catch { }
  }

  function tariffsUiRenderCount() {
    const el = _tariffsUi.panel?.querySelector("#tariffsCount");
    if (!el) return;
    const total = (_tariffsUi.rows || []).length;
    const q = String(_tariffsUi.filter || "").trim().toUpperCase();
    if (!q) { el.textContent = `${total} entries`; return; }
    const shown = (_tariffsUi.rows || []).filter(r => _tariffsNormalizeCode(r.code).includes(q)).length;
    el.textContent = `${shown}/${total} shown`;
  }

  function tariffsUiRenderValidationOnly() {
    const v = _tariffsValidateRows(_tariffsUi.rows || []);
    const panel = _tariffsUi.panel;
    if (!panel) return;

    panel.querySelectorAll("#tariffsTbody input.tariffs-invalid").forEach(el => el.classList.remove("tariffs-invalid"));

    const _ce = (s) => (window.CSS && CSS.escape)
      ? CSS.escape(String(s))
      : String(s).replace(/[^a-zA-Z0-9_\-]/g, "\\$&");

    const mark = (rowId, field) => {
      const q = `#tariffsTbody input[data-rowid="${_ce(rowId)}"][data-field="${field}"]`;
      const el = panel.querySelector(q);
      if (el) el.classList.add("tariffs-invalid");
    };

    for (const id of v.emptyCodes) mark(id, "code");
    for (const id of v.invalidValues) mark(id, "value");
    for (const id of v.dupRowIds) mark(id, "code");

    if (!v.ok) {
      if (v.dupCodes.size) {
        _tariffsUiSetNote(`Duplicate country codes: ${Array.from(v.dupCodes).join(", ")}. Each country code must be unique.`, "warn");
      } else if (v.emptyCodes.size) {
        _tariffsUiSetNote("Some country codes are empty. Fill them in or delete the rows.", "warn");
      } else if (v.invalidValues.size) {
        _tariffsUiSetNote("Some tariff values are missing or not numbers.", "warn");
      }
    } else {
      _tariffsUiSetNote("", "");
    }

    tariffsUiRenderHistoryButtons();
  }

  function tariffsUiRenderTableBody() {
    const panel = _tariffsUi.panel;
    if (!panel) return;
    const tbody = panel.querySelector("#tariffsTbody");
    if (!tbody) return;

    const q = String(_tariffsUi.filter || "").trim().toUpperCase();
    const rows = (_tariffsUi.rows || []).slice(); // keep existing order

    const shown = rows.filter(r => !q || _tariffsNormalizeCode(r.code).includes(q));

    tbody.innerHTML = shown.map(r => {
      return `
      <tr class="tariffs-row" data-rowid="${escHtml(r.id)}">
        <td>
          <input class="tariffs-input tariffs-code-input" data-rowid="${escHtml(r.id)}" data-field="code" value="${escHtml(r.code)}" placeholder="e.g. US" />
        </td>
        <td>
          <input class="tariffs-input tariffs-val" data-rowid="${escHtml(r.id)}" data-field="value" value="${escHtml(r.value)}" placeholder="e.g. 12.5" inputmode="decimal" />
        </td>
        <td class="tariffs-row-actions">
          <button class="mgmt-btn" data-delrow="${escHtml(r.id)}" title="Delete">🗑</button>
        </td>
      </tr>`;
    }).join("");

    if (!shown.length) tbody.innerHTML = `<tr><td colspan="3" class="tariffs-empty">No entries.</td></tr>`;

    tariffsUiRenderValidationOnly();
    tariffsUiRenderCount();
  }


  function tariffsUiSyncJson(force = false) {
    const ta = _tariffsUi.panel?.querySelector("#tariffsJsonText");
    if (!ta) return;

    if (_tariffsUi.jsonEditing && !force) return;
    const obj = _tariffsRowsToObject(_tariffsUi.rows || []);
    const text = JSON.stringify(obj, null, 2);
    if (!force && document.activeElement === ta) return; // don't fight the user while typing
    if (force || String(ta.value || "") !== text) {
      _tariffsUi.jsonUpdating = true;
      ta.value = text;
      _tariffsUi.jsonUpdating = false;
      ta.classList.remove("tariffs-json-invalid");
    }
  }

  function tariffsUiRender() {
    if (!_tariffsUi.panel) return;
    tariffsUiRenderTableBody();
    tariffsUiSyncJson();
    tariffsUiRenderHistory();
    tariffsUiRenderHistoryButtons();
  }

  async function tariffsUiSave() {
    _tariffsUiEnsurePanel();
    await safeEnsureLogin();

    const v = _tariffsValidateRows(_tariffsUi.rows || []);
    if (!v.ok) {
      tariffsUiRenderValidationOnly();
      throw new Error("Fix duplicates/empty codes/invalid values before saving.");
    }

    const obj = _tariffsRowsToObject(_tariffsUi.rows || []);
    if (!window.adminApi?.replaceLocalTariffsFromObject) throw new Error("replaceLocalTariffsFromObject() not found");
    await window.adminApi.replaceLocalTariffsFromObject(obj);

    ttoast("Tariffs", "Saved");
    _tariffsUiSetDirty(false);
    await tariffsUiRefresh();
  }

  // ================================
  // Management Frontend Toolkit (v1)
  // Pure frontend QoL utilities; no server changes required.
  // Exposes: window.mgmtTools
  // ================================

  if (window.mgmtTools && window.mgmtTools.__v === 1) return;

  const LS_VIEWS = "mgmt_saved_views_v1";
  const LS_NOTES = "mgmt_order_notes_v1";
  const SS_ORDERS_CACHE = "mgmt_orders_cache_v1";

  const TOOL = (window.mgmtTools = window.mgmtTools || {});
  TOOL.__v = 1;

  // ---------- base / headers adapters ----------
  function _base() {
    if (typeof window._adminBase === "function") return window._adminBase();
    const b = String(localStorage.getItem("api_base") || location.origin || "").replace(/\/+$/, "");
    return b || String(location.origin || "").replace(/\/+$/, "");
  }
  function _headers(json = true) {
    if (typeof window._adminHeaders === "function") return window._adminHeaders(json);
    const h = json ? { "Content-Type": "application/json" } : {};
    const token = localStorage.getItem("api_token") || "";
    const code = localStorage.getItem("admin_code") || "";
    if (token) h.Authorization = `Bearer ${token}`;
    if (code) h["X-Admin-Code"] = code;
    return h;
  }

  async function _fetchJson(url, { method = "GET", headers, body } = {}) {
    const r = await fetch(url, { method, headers, body });
    const out = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(out?.error || `HTTP ${r.status}`);
    return out;
  }

  async function _fetchBlob(url, { method = "GET", headers, body } = {}) {
    const r = await fetch(url, { method, headers, body });
    if (!r.ok) {
      const t = await r.text().catch(() => "");
      throw new Error(t || `HTTP ${r.status}`);
    }
    return r.blob();
  }

  function _downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function _safeStr(v) {
    return (v == null) ? "" : String(v);
  }
  function _normStr(v) {
    return _safeStr(v).trim();
  }
  function _lower(v) {
    return _normStr(v).toLowerCase();
  }
  function _num(v, fallback = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }

  // ---------- order normalization ----------
  function orderId(order) {
    return _normStr(order?.orderId || order?.id || order?._id || order?.stripe?.paymentIntentId || "");
  }

  function orderStatus(order) {
    return _normStr(order?.status || "").toUpperCase() || "UNKNOWN";
  }

  function orderCreatedAt(order) {
    const cands = [
      order?.createdAt,
      order?.created_at,
      order?.paidAt,
      order?.stripe?.paidAt,
      order?.stripe?.createdAt,
      order?.stripe?.created,
      order?.updatedAt
    ];
    for (const x of cands) {
      if (!x) continue;
      const d = (x instanceof Date) ? x : new Date(x);
      if (!isNaN(d.getTime())) return d;
    }
    return null;
  }

  function orderCustomer(order) {
    // server.js schema uses order.customer; older admin UIs may use userDetails/shipping
    return order?.customer || order?.userDetails || order?.shipping || {};
  }

  function customerName(order) {
    const c = orderCustomer(order);
    const full =
      _normStr(c?.fullName) ||
      _normStr([c?.firstName, c?.lastName].filter(Boolean).join(" ")) ||
      _normStr(order?.name) ||
      _normStr(order?.customerName);
    return full;
  }

  function customerEmail(order) {
    const c = orderCustomer(order);
    return _normStr(c?.email || order?.email || order?.customerEmail);
  }

  function customerPhone(order) {
    const c = orderCustomer(order);
    return _normStr(c?.phone || order?.phone);
  }

  function customerCountry(order) {
    const c = orderCustomer(order);
    return _normStr(c?.countryCode || c?.country || order?.countryCode || order?.country) || "";
  }

  function orderCurrency(order) {
    const cur = _normStr(order?.pricing?.currency || order?.currency || order?.stripe?.currency || "");
    return cur ? cur.toUpperCase() : "EUR";
  }

  function orderItems(order) {
    if (Array.isArray(order?.items)) return order.items;
    if (Array.isArray(order?.products)) return order.products;
    if (Array.isArray(order?.productsFull)) return order.productsFull;
    return [];
  }

  function itemQty(it) {
    return _num(it?.quantity ?? it?.amount ?? it?.qty ?? 1, 1);
  }

  function itemSaleEUR(it) {
    // server.js items often store unitPriceEUR
    if (it?.unitPriceEUR != null) return _num(it.unitPriceEUR, 0);
    if (it?.unitPrice != null) return _num(it.unitPrice, 0);
    if (it?.priceEUR != null) return _num(it.priceEUR, 0);
    return 0;
  }

  function itemExpectedPurchaseEUR(it) {
    return _num(it?.expectedPurchase ?? it?.purchasePriceEUR ?? it?.expectedPurchaseEUR ?? 0, 0);
  }

  function orderTotalsEUR(order) {
    const items = orderItems(order);

    let sale = 0;
    let purchase = 0;

    for (const it of items) {
      const q = itemQty(it);
      sale += q * itemSaleEUR(it);
      purchase += q * itemExpectedPurchaseEUR(it);
    }

    const totalPaidEUR =
      (order?.pricing?.totalPaidEUR != null)
        ? _num(order.pricing.totalPaidEUR, 0)
        : (sale || 0);

    const marginEUR = (sale || totalPaidEUR) - purchase;

    return {
      saleEUR: sale,
      purchaseEUR: purchase,
      totalPaidEUR,
      marginEUR,
      marginPct: (sale > 0) ? (marginEUR / sale) : null
    };
  }

  function orderSearchText(order) {
    const c = orderCustomer(order);
    const items = orderItems(order);

    const parts = [
      orderId(order),
      orderStatus(order),
      customerName(order),
      customerEmail(order),
      customerPhone(order),
      customerCountry(order),
      orderCurrency(order),
      _normStr(c?.address1),
      _normStr(c?.address2),
      _normStr(c?.city),
      _normStr(c?.region),
      _normStr(c?.postalCode),
      _normStr(order?.websiteOrigin),
      _normStr(order?.pricing?.note),
      _normStr(order?.stripe?.paymentIntentId),
      _normStr(order?.stripe?.chargeId)
    ];

    for (const it of items) {
      parts.push(
        _normStr(it?.name),
        _normStr(it?.selectedOption),
        _normStr(it?.productLink),
        _normStr(it?.description)
      );
    }

    return _lower(parts.filter(Boolean).join(" | "));
  }

  // ---------- attention flags ----------
  function attentionFlags(order) {
    const s = orderStatus(order);
    const c = orderCustomer(order);
    const items = orderItems(order);
    const createdAt = orderCreatedAt(order);

    const paidLike =
      s.includes("PAID") || s.includes("FULFILL") || s.includes("SHIPP") || s.includes("DONE") || s.includes("COMPLET");

    const missing = {
      email: !customerEmail(order),
      phone: !customerPhone(order),
      address: !_normStr(c?.address1) || !_normStr(c?.city) || !_normStr(c?.postalCode) || !_normStr(c?.countryCode),
      items: !Array.isArray(items) || items.length === 0,
      paymentIntentId: paidLike && !_normStr(order?.stripe?.paymentIntentId),
      paidAt: paidLike && !order?.paidAt
    };

    const reasons = [];
    if (missing.email) reasons.push("Missing email");
    if (missing.phone) reasons.push("Missing phone");
    if (missing.address) reasons.push("Missing address fields");
    if (missing.items) reasons.push("No items");
    if (missing.paymentIntentId) reasons.push("Paid-like status but missing Stripe paymentIntentId");
    if (missing.paidAt) reasons.push("Paid-like status but missing paidAt");

    // classic "stuck" pending payment: old + pending-like status
    const ageDays = (createdAt && !isNaN(createdAt)) ? ((Date.now() - createdAt.getTime()) / 86400000) : null;
    const stuckPending =
      (ageDays != null && ageDays > 2) &&
      (s.includes("PENDING") || s.includes("REQUIRES") || s.includes("PAYMENT"));

    if (stuckPending) reasons.push("Old pending-payment order");

    const score = reasons.length + (stuckPending ? 1 : 0);
    return { score, reasons, missing, stuckPending, ageDays };
  }

  // ---------- filtering / searching ----------
  function filterOrders(orders, filters = {}) {
    const q = _lower(filters.query || "");
    const status = filters.status ? _upperList(filters.status) : null;
    const country = filters.country ? _upperList(filters.country) : null;
    const currency = filters.currency ? _upperList(filters.currency) : null;

    const since = filters.since ? new Date(filters.since) : null;
    const till = filters.till ? new Date(filters.till) : null;

    const minTotal = (filters.minTotal != null) ? _num(filters.minTotal, null) : null;
    const maxTotal = (filters.maxTotal != null) ? _num(filters.maxTotal, null) : null;

    const attentionOnly = !!filters.attentionOnly;
    const missingAddressOnly = !!filters.missingAddressOnly;
    const missingEmailOnly = !!filters.missingEmailOnly;
    const missingPhoneOnly = !!filters.missingPhoneOnly;

    const out = [];
    for (const o of (orders || [])) {
      if (!o) continue;

      const s = orderStatus(o);
      const cc = customerCountry(o).toUpperCase();
      const cur = orderCurrency(o).toUpperCase();
      const at = orderCreatedAt(o);
      const totals = orderTotalsEUR(o);
      const flags = attentionFlags(o);

      if (status && status.length && !status.includes(s)) continue;
      if (country && country.length && !country.includes(cc)) continue;
      if (currency && currency.length && !currency.includes(cur)) continue;

      if (since && at && at < since) continue;
      if (till && at && at > till) continue;

      if (minTotal != null && totals.totalPaidEUR < minTotal) continue;
      if (maxTotal != null && totals.totalPaidEUR > maxTotal) continue;

      if (attentionOnly && flags.score <= 0) continue;
      if (missingAddressOnly && !flags.missing.address) continue;
      if (missingEmailOnly && !flags.missing.email) continue;
      if (missingPhoneOnly && !flags.missing.phone) continue;

      if (q) {
        const hay = o.__mgmtSearch || (o.__mgmtSearch = orderSearchText(o));
        if (!hay.includes(q)) continue;
      }

      out.push(o);
    }
    return out;
  }

  function _upperList(v) {
    if (Array.isArray(v)) return v.map(x => _normStr(x).toUpperCase()).filter(Boolean);
    return _normStr(v).split(",").map(x => x.trim().toUpperCase()).filter(Boolean);
  }

  function sortOrders(orders, { by = "createdAt", dir = "desc" } = {}) {
    const mul = (String(dir).toLowerCase() === "asc") ? 1 : -1;
    const arr = Array.isArray(orders) ? [...orders] : [];
    arr.sort((a, b) => {
      if (by === "totalPaidEUR") {
        const ta = orderTotalsEUR(a).totalPaidEUR;
        const tb = orderTotalsEUR(b).totalPaidEUR;
        return mul * (ta - tb);
      }
      if (by === "marginEUR") {
        const ma = orderTotalsEUR(a).marginEUR;
        const mb = orderTotalsEUR(b).marginEUR;
        return mul * (ma - mb);
      }
      if (by === "attention") {
        const sa = attentionFlags(a).score;
        const sb = attentionFlags(b).score;
        return mul * (sa - sb);
      }
      // default: createdAt
      const da = orderCreatedAt(a);
      const db = orderCreatedAt(b);
      const ta = da ? da.getTime() : 0;
      const tb = db ? db.getTime() : 0;
      return mul * (ta - tb);
    });
    return arr;
  }

  // ---------- saved views ----------
  function _loadViews() {
    try {
      const raw = localStorage.getItem(LS_VIEWS);
      if (!raw) return {};
      const obj = JSON.parse(raw);
      if (!obj || typeof obj !== "object") return {};
      return obj;
    } catch {
      return {};
    }
  }
  function _saveViews(viewsObj) {
    localStorage.setItem(LS_VIEWS, JSON.stringify(viewsObj || {}));
  }

  function listViews() {
    const v = _loadViews();
    return Object.keys(v).sort().map(name => ({ name, filters: v[name]?.filters || {}, meta: v[name]?.meta || {} }));
  }

  function setView(name, filters, meta = {}) {
    const n = _normStr(name);
    if (!n) throw new Error("setView: name required");
    const views = _loadViews();
    views[n] = { filters: filters || {}, meta: { ...meta, updatedAt: new Date().toISOString() } };
    _saveViews(views);
    return { ok: true, name: n, view: views[n] };
  }

  function deleteView(name) {
    const n = _normStr(name);
    const views = _loadViews();
    if (views[n]) delete views[n];
    _saveViews(views);
    return { ok: true, name: n };
  }

  function runView(orders, name, { sortBy, sortDir } = {}) {
    const n = _normStr(name);
    const views = _loadViews();
    const v = views[n];
    if (!v) throw new Error(`View not found: ${n}`);
    const filtered = filterOrders(orders, v.filters || {});
    return sortOrders(filtered, { by: sortBy || "createdAt", dir: sortDir || "desc" });
  }

  // ---------- action queue (rate-limited + retries) ----------
  class ActionQueue {
    constructor({ concurrency = 1, minIntervalMs = 250, maxRetries = 1, onProgress } = {}) {
      this.concurrency = Math.max(1, _num(concurrency, 1));
      this.minIntervalMs = Math.max(0, _num(minIntervalMs, 0));
      this.maxRetries = Math.max(0, _num(maxRetries, 0));
      this.onProgress = typeof onProgress === "function" ? onProgress : null;
      this._q = [];
      this._running = 0;
      this._done = 0;
      this._failed = 0;
      this._started = 0;
      this._lastRunAt = 0;
    }

    stats() {
      return {
        queued: this._q.length,
        running: this._running,
        done: this._done,
        failed: this._failed,
        started: this._started
      };
    }

    add(taskFn, { label = "", retries = this.maxRetries } = {}) {
      if (typeof taskFn !== "function") throw new Error("queue.add: taskFn must be a function");
      const item = { taskFn, label: _normStr(label), retriesLeft: Math.max(0, _num(retries, 0)) };
      return new Promise((resolve, reject) => {
        item.resolve = resolve;
        item.reject = reject;
        this._q.push(item);
        this._pump();
      });
    }

    clear() {
      this._q.length = 0;
      return this.stats();
    }

    async _waitSpacing() {
      const now = Date.now();
      const dt = now - this._lastRunAt;
      if (dt < this.minIntervalMs) {
        await new Promise(r => setTimeout(r, this.minIntervalMs - dt));
      }
    }

    _emit() {
      if (this.onProgress) {
        try {
          this.onProgress(this.stats());
        } catch { }
      }
    }

    _pump() {
      this._emit();
      while (this._running < this.concurrency && this._q.length) {
        const item = this._q.shift();
        this._run(item);
      }
    }

    async _run(item) {
      this._running++;
      this._started++;
      this._emit();

      try {
        await this._waitSpacing();
        this._lastRunAt = Date.now();

        const res = await item.taskFn();
        this._done++;
        item.resolve(res);
      } catch (e) {
        if (item.retriesLeft > 0) {
          item.retriesLeft--;
          // push back (simple retry)
          this._q.push(item);
        } else {
          this._failed++;
          item.reject(e);
        }
      } finally {
        this._running--;
        this._emit();
        // spacing handled per task start; pump next
        this._pump();
      }
    }
  }

  // ---------- server action wrappers ----------
  async function patchOrder(orderIdValue, payload) {
    const id = _normStr(orderIdValue);
    if (!id) throw new Error("patchOrder: orderId required");
    if (window.adminApi?.patchOrder) return window.adminApi.patchOrder(id, payload || {});
    return _fetchJson(`${_base()}/admin/orders/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: _headers(true),
      body: JSON.stringify(payload || {})
    });
  }

  async function resendConfirmation(orderIdValue) {
    const id = _normStr(orderIdValue);
    if (!id) throw new Error("resendConfirmation: orderId required");
    if (window.adminApi?.resend) return window.adminApi.resend(id);
    return _fetchJson(`${_base()}/admin/orders/${encodeURIComponent(id)}/resend-confirmation`, {
      method: "POST",
      headers: _headers(true),
      body: "{}"
    });
  }

  async function refundOrder(orderIdValue, { amount, reason, note } = {}) {
    const id = _normStr(orderIdValue);
    if (!id) throw new Error("refundOrder: orderId required");
    const body = {};
    if (amount != null) body.amount = amount;
    if (reason != null) body.reason = reason;
    if (note != null) body.note = note;
    return _fetchJson(`${_base()}/admin/orders/${encodeURIComponent(id)}/refund`, {
      method: "POST",
      headers: _headers(true),
      body: JSON.stringify(body)
    });
  }

  async function listOrdersFromServer({ from, to, limit = 1000 } = {}) {
    if (window.adminApi?.listOrders) return window.adminApi.listOrders({ from, to, limit });
    const qs = new URLSearchParams();
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    if (limit != null) qs.set("limit", String(limit));
    return _fetchJson(`${_base()}/admin/orders?${qs.toString()}`, { method: "GET", headers: _headers(false) });
  }

  // ---------- bulk actions ----------
  async function bulkPatchStatus(orderIds, status, { queue } = {}) {
    const ids = (Array.isArray(orderIds) ? orderIds : []).map(_normStr).filter(Boolean);
    const q = queue || TOOL.queue || new ActionQueue();
    const results = [];
    for (const id of ids) {
      const p = q.add(() => patchOrder(id, { status }), { label: `patch:${id}` })
        .then(r => ({ ok: true, id, result: r }))
        .catch(e => ({ ok: false, id, error: _safeStr(e?.message || e) }));
      results.push(p);
    }
    return Promise.all(results);
  }

  async function bulkResendConfirmation(orderIds, { queue } = {}) {
    const ids = (Array.isArray(orderIds) ? orderIds : []).map(_normStr).filter(Boolean);
    const q = queue || TOOL.queue || new ActionQueue();
    const results = [];
    for (const id of ids) {
      const p = q.add(() => resendConfirmation(id), { label: `resend:${id}` })
        .then(r => ({ ok: true, id, result: r }))
        .catch(e => ({ ok: false, id, error: _safeStr(e?.message || e) }));
      results.push(p);
    }
    return Promise.all(results);
  }

  async function bulkRefund(orderIds, refundPayload, { queue } = {}) {
    const ids = (Array.isArray(orderIds) ? orderIds : []).map(_normStr).filter(Boolean);
    const q = queue || TOOL.queue || new ActionQueue();
    const results = [];
    for (const id of ids) {
      const p = q.add(() => refundOrder(id, refundPayload || {}), { label: `refund:${id}` })
        .then(r => ({ ok: true, id, result: r }))
        .catch(e => ({ ok: false, id, error: _safeStr(e?.message || e) }));
      results.push(p);
    }
    return Promise.all(results);
  }

  // ---------- caching ----------
  function cacheOrders(orders) {
    try {
      sessionStorage.setItem(SS_ORDERS_CACHE, JSON.stringify({
        cachedAt: Date.now(),
        orders: Array.isArray(orders) ? orders : []
      }));
      return { ok: true };
    } catch (e) {
      return { ok: false, error: _safeStr(e?.message || e) };
    }
  }

  function loadCachedOrders() {
    try {
      const raw = sessionStorage.getItem(SS_ORDERS_CACHE);
      if (!raw) return { ok: true, cachedAt: null, orders: [] };
      const obj = JSON.parse(raw);
      return {
        ok: true,
        cachedAt: obj?.cachedAt || null,
        orders: Array.isArray(obj?.orders) ? obj.orders : []
      };
    } catch (e) {
      return { ok: false, cachedAt: null, orders: [], error: _safeStr(e?.message || e) };
    }
  }

  async function fetchOrdersWithCache(opts = {}) {
    // Non-invasive: just fetch and store; caller decides what to do with the orders
    const orders = await listOrdersFromServer(opts);
    cacheOrders(orders);
    return orders;
  }

  // ---------- private notes (local only) ----------
  function _loadNotesObj() {
    try {
      const raw = localStorage.getItem(LS_NOTES);
      if (!raw) return {};
      const obj = JSON.parse(raw);
      return (obj && typeof obj === "object") ? obj : {};
    } catch {
      return {};
    }
  }
  function _saveNotesObj(obj) {
    localStorage.setItem(LS_NOTES, JSON.stringify(obj || {}));
  }

  function setOrderNote(orderIdValue, text) {
    const id = _normStr(orderIdValue);
    if (!id) throw new Error("setOrderNote: orderId required");
    const notes = _loadNotesObj();
    const t = _normStr(text);
    if (!t) {
      delete notes[id];
    } else {
      notes[id] = { text: t, updatedAt: new Date().toISOString() };
    }
    _saveNotesObj(notes);
    return { ok: true, id, note: notes[id] || null };
  }

  function getOrderNote(orderIdValue) {
    const id = _normStr(orderIdValue);
    const notes = _loadNotesObj();
    return notes[id] || null;
  }

  function listOrderNotes() {
    const notes = _loadNotesObj();
    return Object.keys(notes).sort().map(id => ({ id, ...notes[id] }));
  }

  // ---------- duplicate detection ----------
  function findPotentialDuplicates(orders, { windowMinutes = 30 } = {}) {
    const winMs = Math.max(1, _num(windowMinutes, 30)) * 60 * 1000;
    const buckets = new Map();

    for (const o of (orders || [])) {
      const email = _lower(customerEmail(o));
      if (!email) continue;

      const totals = orderTotalsEUR(o);
      const total = Math.round(_num(totals.totalPaidEUR, 0) * 100) / 100;

      const key = `${email}__${total.toFixed(2)}`;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(o);
    }

    const out = [];
    for (const [key, arr] of buckets.entries()) {
      if (arr.length < 2) continue;
      const sorted = sortOrders(arr, { by: "createdAt", dir: "asc" });

      let grp = [sorted[0]];
      for (let i = 1; i < sorted.length; i++) {
        const prev = grp[grp.length - 1];
        const a = orderCreatedAt(prev);
        const b = orderCreatedAt(sorted[i]);
        const dt = (a && b) ? (b.getTime() - a.getTime()) : Infinity;

        if (dt <= winMs) grp.push(sorted[i]);
        else {
          if (grp.length >= 2) out.push(_dupGroup(grp, key));
          grp = [sorted[i]];
        }
      }
      if (grp.length >= 2) out.push(_dupGroup(grp, key));
    }

    return out;

    function _dupGroup(group, keyStr) {
      const first = group[0];
      const last = group[group.length - 1];
      const atA = orderCreatedAt(first);
      const atB = orderCreatedAt(last);
      return {
        key: keyStr,
        count: group.length,
        email: customerEmail(first),
        totalPaidEUR: orderTotalsEUR(first).totalPaidEUR,
        from: atA ? atA.toISOString() : null,
        to: atB ? atB.toISOString() : null,
        ids: group.map(orderId),
        orders: group
      };
    }
  }

  // ---------- dashboard stats ----------
  function summarizeOrders(orders) {
    const rows = Array.isArray(orders) ? orders : [];
    const byStatus = {};
    const byCountry = {};
    const byCurrency = {};
    let totalPaidEUR = 0;
    let saleEUR = 0;
    let purchaseEUR = 0;

    for (const o of rows) {
      const s = orderStatus(o);
      const c = (customerCountry(o) || "??").toUpperCase();
      const cur = orderCurrency(o);

      byStatus[s] = (byStatus[s] || 0) + 1;
      byCountry[c] = (byCountry[c] || 0) + 1;
      byCurrency[cur] = (byCurrency[cur] || 0) + 1;

      const t = orderTotalsEUR(o);
      totalPaidEUR += _num(t.totalPaidEUR, 0);
      saleEUR += _num(t.saleEUR, 0);
      purchaseEUR += _num(t.purchaseEUR, 0);
    }

    const marginEUR = (saleEUR || totalPaidEUR) - purchaseEUR;

    return {
      count: rows.length,
      byStatus,
      byCountry,
      byCurrency,
      totals: {
        totalPaidEUR,
        saleEUR,
        purchaseEUR,
        marginEUR,
        marginPct: (saleEUR > 0) ? (marginEUR / saleEUR) : null
      }
    };
  }

  // ---------- print/copy helpers ----------
  async function copyText(text) {
    const t = _safeStr(text);
    if (!t) return false;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(t);
      return true;
    }

    // fallback
    const ta = document.createElement("textarea");
    ta.value = t;
    ta.setAttribute("readonly", "true");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }

  function formatAddress(order) {
    const c = orderCustomer(order);
    const name = customerName(order);
    const lines = [
      name,
      _normStr(c?.address1),
      _normStr(c?.address2),
      [_normStr(c?.postalCode), _normStr(c?.city)].filter(Boolean).join(" "),
      _normStr(c?.region),
      _normStr((c?.countryCode || c?.country || "").toUpperCase()),
      customerPhone(order) ? `Phone: ${customerPhone(order)}` : "",
      customerEmail(order) ? `Email: ${customerEmail(order)}` : ""
    ].filter(Boolean);

    return lines.join("\n");
  }

  function formatOrderSummary(order) {
    const id = orderId(order);
    const s = orderStatus(order);
    const cur = orderCurrency(order);
    const totals = orderTotalsEUR(order);
    const items = orderItems(order);

    const lines = [];
    lines.push(`Order: ${id}`);
    lines.push(`Status: ${s}`);
    lines.push(`Customer: ${customerName(order) || "—"} (${customerEmail(order) || "—"})`);
    lines.push(`Country: ${(customerCountry(order) || "—").toUpperCase()}`);
    lines.push(`Currency: ${cur}`);
    lines.push(`Total (EUR): ${totals.totalPaidEUR.toFixed(2)}`);
    lines.push(`Margin (EUR): ${_num(totals.marginEUR, 0).toFixed(2)}`);

    lines.push("");
    lines.push("Items:");
    if (!items.length) {
      lines.push("  (none)");
    } else {
      for (const it of items) {
        const q = itemQty(it);
        const name = _normStr(it?.name) || "(item)";
        const opt = _normStr(it?.selectedOption);
        const link = _normStr(it?.productLink);
        const sale = (q * itemSaleEUR(it)).toFixed(2);
        const pur = (q * itemExpectedPurchaseEUR(it)).toFixed(2);
        lines.push(`  - ${name}${opt ? ` (${opt})` : ""} x${q} | saleEUR ${sale} | buyEUR ${pur}${link ? ` | ${link}` : ""}`);
      }
    }

    return lines.join("\n");
  }

  function openPrintWindowFromText(title, text) {
    const safeTitle = _safeStr(title || "Print");
    const body = _safeStr(text).replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
    const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>${safeTitle}</title>
<style>
  body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;padding:20px;line-height:1.4}
  .box{white-space:normal}
</style></head>
<body><div class="box">${body}</div>
<script>window.onload=()=>{window.print();}</script>
</body></html>`;
    const w = window.open("", "_blank", "noopener,noreferrer");
    if (!w) throw new Error("Popup blocked");
    w.document.open();
    w.document.write(html);
    w.document.close();
  }

  // ---------- guardrails ----------
  async function confirmTyped({ message = "Confirm action", phrase = "CONFIRM" } = {}) {
    const msg = _safeStr(message);
    const p = _safeStr(phrase);
    const ans = prompt(`${msg}\n\nType exactly: ${p}`);
    return _normStr(ans) === p;
  }

  function validateJsonText(jsonText, { maxBytes = 5_000_000, requireObjectOrArray = true } = {}) {
    const text = _safeStr(jsonText);
    if (!text.trim()) return { ok: false, error: "Empty JSON" };

    const bytes = new Blob([text]).size;
    if (bytes > maxBytes) return { ok: false, error: `JSON too large (${bytes} bytes)` };

    try {
      const parsed = JSON.parse(text);
      if (requireObjectOrArray) {
        const okType = (parsed && typeof parsed === "object");
        if (!okType) return { ok: false, error: "Top-level JSON must be an object or array" };
      }
      return { ok: true, parsed };
    } catch (e) {
      return { ok: false, error: _safeStr(e?.message || e) };
    }
  }

  function jsonDiffSummary(oldJsonText, newJsonText, { maxPaths = 200, maxDepth = 6 } = {}) {
    const a = validateJsonText(oldJsonText, { requireObjectOrArray: false });
    const b = validateJsonText(newJsonText, { requireObjectOrArray: false });

    if (!a.ok || !b.ok) {
      return {
        ok: false,
        oldOk: a.ok,
        newOk: b.ok,
        oldError: a.ok ? null : a.error,
        newError: b.ok ? null : b.error
      };
    }

    const oldObj = a.parsed;
    const newObj = b.parsed;

    const changed = [];
    const added = [];
    const removed = [];
    let truncated = false;

    function pushLimited(arr, v) {
      if (arr.length >= maxPaths) { truncated = true; return; }
      arr.push(v);
    }

    function walk(path, x, y, depth) {
      if (depth > maxDepth) {
        if (JSON.stringify(x) !== JSON.stringify(y)) pushLimited(changed, path || "(root)");
        return;
      }

      const xType = _type(x);
      const yType = _type(y);
      if (xType !== yType) {
        pushLimited(changed, path || "(root)");
        return;
      }

      if (xType === "array") {
        // array diff: detect length changes, then shallow compare by index (bounded)
        if ((x?.length || 0) !== (y?.length || 0)) pushLimited(changed, `${path || "(root)"} (length)`);
        const n = Math.min(x.length, y.length, 50);
        for (let i = 0; i < n; i++) {
          if (JSON.stringify(x[i]) !== JSON.stringify(y[i])) pushLimited(changed, `${path || "(root)"}[${i}]`);
        }
        return;
      }

      if (xType === "object") {
        const xKeys = Object.keys(x || {});
        const yKeys = Object.keys(y || {});
        const xSet = new Set(xKeys);
        const ySet = new Set(yKeys);

        for (const k of xKeys) {
          if (!ySet.has(k)) pushLimited(removed, _join(path, k));
        }
        for (const k of yKeys) {
          if (!xSet.has(k)) pushLimited(added, _join(path, k));
        }
        for (const k of yKeys) {
          if (!xSet.has(k)) continue;
          walk(_join(path, k), x[k], y[k], depth + 1);
        }
        return;
      }

      // primitive
      if (x !== y) pushLimited(changed, path || "(root)");
    }

    walk("", oldObj, newObj, 0);

    // line-level rough diff (fast)
    const line = _lineDiffCounts(_safeStr(oldJsonText), _safeStr(newJsonText));

    return {
      ok: true,
      addedKeys: added,
      removedKeys: removed,
      changedPaths: changed,
      truncated,
      lineDiff: line
    };

    function _type(v) {
      if (Array.isArray(v)) return "array";
      if (v && typeof v === "object") return "object";
      return "primitive";
    }
    function _join(p, k) {
      return p ? `${p}.${k}` : k;
    }
    function _lineDiffCounts(oldText, newText) {
      const aLines = oldText.split(/\r?\n/);
      const bLines = newText.split(/\r?\n/);
      const aSet = new Set(aLines);
      const bSet = new Set(bLines);
      let added = 0, removed = 0;
      for (const l of bSet) if (!aSet.has(l)) added++;
      for (const l of aSet) if (!bSet.has(l)) removed++;
      return { addedUniqueLines: added, removedUniqueLines: removed, oldLines: aLines.length, newLines: bLines.length };
    }
  }

  // ---------- client-side export (selected orders) ----------
  function exportOrdersToCSV(orders, filename = "orders.csv") {
    const rows = Array.isArray(orders) ? orders : [];
    const cols = [
      "orderId",
      "createdAt",
      "status",
      "email",
      "name",
      "country",
      "currency",
      "totalPaidEUR",
      "saleEUR",
      "purchaseEUR",
      "marginEUR"
    ];

    function csvEscape(v) {
      const s = _safeStr(v);
      if (/["\n,]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    }

    const lines = [];
    lines.push(cols.join(","));

    for (const o of rows) {
      const id = orderId(o);
      const at = orderCreatedAt(o);
      const totals = orderTotalsEUR(o);
      const line = [
        id,
        at ? at.toISOString() : "",
        orderStatus(o),
        customerEmail(o),
        customerName(o),
        customerCountry(o).toUpperCase(),
        orderCurrency(o),
        totals.totalPaidEUR.toFixed(2),
        totals.saleEUR.toFixed(2),
        totals.purchaseEUR.toFixed(2),
        _num(totals.marginEUR, 0).toFixed(2)
      ].map(csvEscape);
      lines.push(line.join(","));
    }

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    _downloadBlob(blob, filename);
    return { ok: true, rows: rows.length, filename };
  }

  // ---------- expose ----------
  TOOL.ActionQueue = ActionQueue;
  TOOL.queue = TOOL.queue || new ActionQueue();

  TOOL.order = {
    id: orderId,
    status: orderStatus,
    createdAt: orderCreatedAt,
    customer: orderCustomer,
    totalsEUR: orderTotalsEUR,
    attention: attentionFlags,
    searchText: orderSearchText
  };

  TOOL.filterOrders = filterOrders;
  TOOL.sortOrders = sortOrders;

  TOOL.views = {
    list: listViews,
    set: setView,
    delete: deleteView,
    run: runView
  };

  TOOL.server = {
    listOrders: listOrdersFromServer,
    fetchOrdersWithCache,
    patchOrder,
    resendConfirmation,
    refundOrder,
    bulkPatchStatus,
    bulkResendConfirmation,
    bulkRefund
  };

  TOOL.cache = {
    cacheOrders,
    loadCachedOrders
  };

  TOOL.notes = {
    set: setOrderNote,
    get: getOrderNote,
    list: listOrderNotes
  };

  TOOL.duplicates = {
    find: findPotentialDuplicates
  };

  TOOL.stats = {
    summarizeOrders
  };

  TOOL.copy = {
    copyText,
    formatAddress,
    formatOrderSummary,
    openPrintWindowFromText
  };

  TOOL.guardrails = {
    confirmTyped,
    validateJsonText,
    jsonDiffSummary
  };

  TOOL.export = {
    ordersToCSV: exportOrdersToCSV
  };

  // Expose tariffs UI controls for code outside this IIFE
  window.tariffsUiToggle = tariffsUiToggle;
  window.tariffsUiShow = tariffsUiShow;
  window.tariffsUiHide = tariffsUiHide;
  window.tariffsUiRefresh = tariffsUiRefresh;

})();
/* ===========================
   TOPBAR ACTIONS (drop-in)
   Paste anywhere AFTER `state`, `ensureLogin()`, `loadOrdersFromServer()`, `render()`, `toast()`,
   and `openSettingsModal()` are defined (safest: paste at the very end of script.js).
   =========================== */
(function mgmtTopbarMount() {
  if (window.__mgmtTopbarMounted) return;
  window.__mgmtTopbarMounted = true;

  // Expose `mount()` so init() can call it safely.
  // `mount` is a function declaration (hoisted), so this assignment is valid here.
  window.mount = mount;

  function ttoast(title, desc) {
    try { if (typeof toast === "function") return toast(title, desc); } catch { }
    console.log(title, desc);
  }

  function injectCssOnce() {
    if (document.getElementById("mgmt-topbar-css")) return;
    const style = document.createElement("style");
    style.id = "mgmt-topbar-css";
    style.textContent = `
        header.top-topbar { position: sticky; top: 0; z-index: 50; backdrop-filter: blur(8px); }
        header.top-topbar .mgmt-topbar-container{
          display:flex; align-items:center; justify-content:space-between; gap:12px;
          padding: 10px 12px;
        }
        header.top-topbar .mgmt-brand-wrap{ display:flex; align-items:center; gap:10px; min-width:120px; }
        header.top-topbar .brand { font-weight: 750; letter-spacing: .2px; }
        .mgmt-topbar-actions{
          display:flex; align-items:center; gap:8px;
          overflow-x:auto; overscroll-behavior-x: contain;
          -webkit-overflow-scrolling: touch;
          padding: 2px 2px;
          scrollbar-width: thin;
        }
        .mgmt-topbar-actions::-webkit-scrollbar{ height: 8px; }
        .mgmt-topbar-actions::-webkit-scrollbar-thumb{ border-radius: 999px; }
        .mgmt-sep{ width:1px; height: 26px; opacity:.35; margin: 0 2px; }
        .mgmt-btn{
          appearance:none; border: 1px solid rgba(255,255,255,.12);
          background: rgba(255,255,255,.06);
          color: inherit;
          padding: 8px 10px; border-radius: 12px;
          font: inherit; line-height: 1;
          cursor: pointer;
          display:inline-flex; align-items:center; gap:8px;
          user-select:none; white-space:nowrap;
          transition: transform .06s ease, background .12s ease, border-color .12s ease, opacity .12s ease;
        }
        .mgmt-btn:hover{ background: rgba(255,255,255,.10); border-color: rgba(255,255,255,.18); }
        .mgmt-btn:active{ transform: translateY(1px); }
        .mgmt-btn[disabled]{ opacity:.55; cursor:not-allowed; }
        .mgmt-btn.primary{
          border-color: rgba(79, 158, 255, .55);
          background: rgba(79, 158, 255, .20);
        }
        .mgmt-btn.danger{
          border-color: rgba(255, 90, 90, .55);
          background: rgba(255, 90, 90, .18);
        }
        .mgmt-pill{
          display:inline-flex; align-items:center; justify-content:center;
          min-width: 22px; height: 22px; padding: 0 6px;
          border-radius: 999px; font-size: 12px; font-weight: 700;
          border: 1px solid rgba(255,255,255,.14);
          background: rgba(255,255,255,.06);
        }
      `;
    document.head.appendChild(style);
  }

  function q(sel) { return document.querySelector(sel); }
  function el(tag, cls) { const e = document.createElement(tag); if (cls) e.className = cls; return e; }

  function getActiveOrder() {
    try {
      const id = state?.openOrderId;
      if (!id) return null;
      return (state.orders || []).find(o => o && o.id === id) || null;
    } catch { return null; }
  }

  function orderTotalEUR(uiOrder) {
    const prods = uiOrder?.products || [];
    let sum = 0;
    for (const p of prods) sum += (Number(p?.amount || 1) * Number(p?.unitPrice || 0));
    return sum;
  }

  function formatAddress(uiOrder) {
    const c = uiOrder?.customer || {};
    const nm = [c.name, c.surname].filter(Boolean).join(" ").trim();
    const lines = [
      nm || "(no name)",
      (c.address || "").trim(),
      [c.postalCode, c.city].filter(Boolean).join(" ").trim(),
      (c.region || "").trim(),
      (c.country || "").trim(),
      c.phone ? `Phone: ${c.phone}` : ""
    ].filter(Boolean);
    return lines.join("\n");
  }

  function formatSummary(uiOrder) {
    const c = uiOrder?.customer || {};
    const nm = [c.name, c.surname].filter(Boolean).join(" ").trim();
    const lines = [];
    lines.push(`Order: ${uiOrder?.id || ""}`);
    lines.push(`Created: ${uiOrder?.createdAt || ""}`);
    lines.push(`Customer: ${nm || "—"}`);
    lines.push(`Country: ${(c.country || "—")}`);
    lines.push(`Currency: ${(uiOrder?.currency || "EUR")}`);
    lines.push(`Total (EUR): ${orderTotalEUR(uiOrder).toFixed(2)}`);
    lines.push("");
    lines.push("Items:");
    const items = uiOrder?.products || [];
    if (!items.length) lines.push("  (none)");
    for (const p of items) {
      const q = Number(p?.amount || 1);
      const name = String(p?.name || "(item)");
      const url = String(p?.url || "");
      const sale = (q * Number(p?.unitPrice || 0)).toFixed(2);
      lines.push(`  - ${name} x${q} | saleEUR ${sale}${url ? ` | ${url}` : ""}`);
    }
    return lines.join("\n");
  }

  async function copyToClipboard(text) {
    const t = String(text || "");
    if (!t) return false;
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(t);
      return true;
    }
    const ta = document.createElement("textarea");
    ta.value = t;
    ta.setAttribute("readonly", "true");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }

  function downloadTextFile(filename, text, mime = "text/plain;charset=utf-8") {
    const blob = new Blob([String(text || "")], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function findPotentialDupes(orders, windowMinutes = 30) {
    const winMs = Math.max(1, Number(windowMinutes || 30)) * 60 * 1000;

    // signature: name+address+postal+city+country + totalEUR(rounded)
    const buckets = new Map();
    for (const o of (orders || [])) {
      if (!o) continue;
      const c = o.customer || {};
      const sig = [
        (c.name || ""), (c.surname || ""),
        (c.address || ""), (c.postalCode || ""),
        (c.city || ""), (c.country || "")
      ].join("|").toLowerCase().replace(/\s+/g, " ").trim();

      if (!sig) continue;
      const total = Math.round(orderTotalEUR(o) * 100) / 100;
      const key = `${sig}__${total.toFixed(2)}`;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(o);
    }

    const groups = [];
    for (const [key, arr] of buckets.entries()) {
      if (arr.length < 2) continue;
      const sorted = [...arr].sort((a, b) => {
        const ta = new Date(a.createdAt || 0).getTime() || 0;
        const tb = new Date(b.createdAt || 0).getTime() || 0;
        return ta - tb;
      });

      let g = [sorted[0]];
      for (let i = 1; i < sorted.length; i++) {
        const prev = g[g.length - 1];
        const dt = (new Date(sorted[i].createdAt || 0).getTime() || 0) - (new Date(prev.createdAt || 0).getTime() || 0);
        if (dt <= winMs) g.push(sorted[i]);
        else {
          if (g.length >= 2) groups.push(g);
          g = [sorted[i]];
        }
      }
      if (g.length >= 2) groups.push(g);
    }

    return groups.map(g => ({
      count: g.length,
      ids: g.map(x => x.id),
      from: g[0]?.createdAt || null,
      to: g[g.length - 1]?.createdAt || null,
      totalEUR: orderTotalEUR(g[0]),
      customer: g[0]?.customer || {}
    }));
  }

  async function safeEnsureLogin() {
    if (typeof ensureLogin === "function") return ensureLogin();
    if (window.ensureLogin && typeof window.ensureLogin === "function") return window.ensureLogin();
  }

  function pickFile({ accept = "*" } = {}) {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = accept;
      input.style.display = "none";
      input.onchange = () => resolve(input.files && input.files[0] ? input.files[0] : null);
      document.body.appendChild(input);
      input.click();
      setTimeout(() => input.remove(), 0);
    });
  }

  async function actionRunner(fn, label) {
    const btns = Array.from(document.querySelectorAll(".mgmt-topbar-actions .mgmt-btn"));
    btns.forEach(b => (b.disabled = true));

    try {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          await fn();
          break;
        } catch (e) {
          if (attempt === 0 && isAdminAuthError(e)) {
            clearAdminSession();
            ttoast("Session expired", "Re-authenticating...");
            // Try to refresh session (may be silent if auto-login is enabled)
            await ensureLogin();
            continue; // retry action once
          }
          throw e;
        }
      }
    } catch (e) {
      ttoast("Error", `${label || "Action"}: ${String(e?.message || e)}`);
    } finally {
      btns.forEach(b => (b.disabled = false));
    }
  }

  function mount() {
    injectCssOnce();

    const headerContainer = q("header.top-topbar > .container");
    if (!headerContainer) return;

    headerContainer.classList.add("mgmt-topbar-container");

    // Wrap brand for flex stability + preserve existing brand node
    const brand = headerContainer.querySelector(".brand");
    let brandWrap = headerContainer.querySelector(".mgmt-brand-wrap");
    if (!brandWrap) {
      brandWrap = el("div", "mgmt-brand-wrap");
      if (brand) brandWrap.appendChild(brand);
      headerContainer.insertBefore(brandWrap, headerContainer.firstChild);
    }

    // Project selector (multi-server profiles)
    let projWrap = headerContainer.querySelector(".mgmt-project-wrap");
    if (!projWrap) {
      projWrap = el("div", "mgmt-project-wrap");
      const sel = el("select", "mgmt-project-select");
      sel.id = "mgProjectSelect";
      const manage = el("button", "mgmt-project-btn");
      manage.id = "mgProjectManage";
      manage.title = "Manage projects";
      manage.textContent = "⋯";
      projWrap.appendChild(sel);
      projWrap.appendChild(manage);
      // Insert before brand for top-left placement
      headerContainer.insertBefore(projWrap, headerContainer.firstChild);
    }

    // Populate selector
    const pList = mgEnsureDefaultProject();
    const pSel = projWrap.querySelector("#mgProjectSelect");
    if (pSel) {
      pSel.innerHTML = "";
      const activeId = mgGetActiveProjectId();
      for (const p of pList) {
        const opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = p.name || p.id;
        if (p.id === activeId) opt.selected = true;
        pSel.appendChild(opt);
      }

      pSel.onchange = () => actionRunner(async () => {
        const id = String(pSel.value || "");
        await mgSwitchProject(id, { forceLogin: false });
      }, "Switch project");
    }

    const pManageBtn = projWrap.querySelector("#mgProjectManage");
    if (pManageBtn) {
      pManageBtn.onclick = () => actionRunner(async () => {
        const projects = mgEnsureDefaultProject();
        const activeId = mgGetActiveProjectId();
        const choice = prompt(
          "Projects:\n1 = Add new\n2 = Rename active\n3 = Remove active\n\nEnter 1, 2, or 3:",
          "1"
        );
        if (!choice) return;

        if (choice.trim() === "1") {
          const name = prompt("New project name:", "New project");
          if (!name) return;
          const apiBase = prompt("API base (optional, e.g. https://api.example.com):", localStorage.getItem("api_base") || "");
          const id = "p_" + Date.now();
          projects.push({ id, name, api_base: apiBase || "", admin_code: "", api_token: "" });
          mgSaveProjects(projects);
          // Force a fresh login for the new project
          await mgSwitchProject(id, { forceLogin: true });
          // Re-render selector
          try { mount(); } catch { }
          return;
        }

        if (choice.trim() === "2") {
          const idx = projects.findIndex(p => p.id === activeId);
          if (idx < 0) return;
          const newName = prompt("Rename active project:", projects[idx].name || activeId);
          if (!newName) return;
          projects[idx].name = newName;
          mgSaveProjects(projects);
          try { mount(); } catch { }
          return;
        }

        if (choice.trim() === "3") {
          if (projects.length <= 1) {
            alert("Cannot remove the last project.");
            return;
          }
          const idx = projects.findIndex(p => p.id === activeId);
          if (idx < 0) return;
          const ok = confirm(`Remove project "${projects[idx].name || activeId}"?`);
          if (!ok) return;
          projects.splice(idx, 1);
          mgSaveProjects(projects);
          // Switch to first remaining
          await mgSwitchProject(projects[0].id, { forceLogin: false });
          try { mount(); } catch { }
          return;
        }
      }, "Manage projects");
    }

    let actions = headerContainer.querySelector(".mgmt-topbar-actions");
    if (!actions) {
      actions = el("div", "mgmt-topbar-actions");
      headerContainer.appendChild(actions);
    }

    // Build buttons (idempotently)
    // Keep topbar compact: move rarely-used tools into a popover.
    actions.innerHTML = `
 <button class="mgmt-btn" data-act="refresh">Refresh</button>
<button class="mgmt-btn" data-act="orders" id="mgOrdersTabBtn">Orders</button>
<button class="mgmt-btn" data-act="graphs" id="mgGraphsTabBtn">Graphs</button>
<button class="mgmt-btn" data-act="settings" title="Settings">⚙</button>

        <div class="mgmt-sep"></div>
  
        <button class="mgmt-btn" data-act="products" id="mgProductsTabBtn">Products</button>
        <button class="mgmt-btn" data-act="accounting" id="mgAccountingTabBtn">Accounting</button>
        <button class="mgmt-btn" data-act="tariffs" id="mgTariffsTabBtn">Tariffs</button>
  
        <button class="mgmt-btn" data-act="sync">Sync</button>

        <div class="mgmt-sep"></div>

        <button class="mgmt-btn" data-act="tools" id="mgToolsBtn">Tools ▾</button>
          
        <div class="mgmt-sep"></div>
  
        <button class="mgmt-btn danger" data-act="logout">Logout</button>

        <div class="mgmt-tools-pop" id="mgToolsPop" hidden>
          <button class="mgmt-btn" data-tool="health">Health</button>
          <button class="mgmt-btn" data-tool="rates">Rates</button>
          <button class="mgmt-btn" data-tool="dupes">Dupes</button>
          <button class="mgmt-btn" data-tool="excel">Excel</button>
          <button class="mgmt-btn" data-tool="print">Print slip</button>
          <div class="mgmt-tools-sep"></div>
          <button class="mgmt-btn" data-tool="copy-addr">Copy address</button>
          <button class="mgmt-btn" data-tool="copy-sum">Copy summary</button>
        </div>
      `;

    function btn(act) { return actions.querySelector(`[data-act="${act}"]`); }
    function tbtn(tool) { return actions.querySelector(`[data-tool="${tool}"]`); }

    // Tools popover
    const toolsBtn = btn("tools");
    const toolsPop = actions.querySelector("#mgToolsPop");
    const closeTools = () => { if (toolsPop) toolsPop.hidden = true; };
    const toggleTools = () => { if (toolsPop) toolsPop.hidden = !toolsPop.hidden; };
    if (toolsBtn && toolsPop) {
      toolsBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleTools();
      };
      document.addEventListener("click", (e) => {
        if (!toolsPop.hidden) {
          const t = e.target;
          if (t === toolsBtn) return;
          if (toolsPop.contains(t)) return;
          closeTools();
        }
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeTools();
      });
    }

    btn("refresh").onclick = () => actionRunner(async () => {
      await safeEnsureLogin();
      try {
        state.orders = await loadOrdersFromServer();
      } catch (e) {
        if (isAdminAuthError(e)) {
          clearAdminSession();
          await ensureLogin();
          state.orders = await loadOrdersFromServer();
        } else {
          throw e;
        }
      }
      render();

      ttoast("Refreshed", `Loaded ${state.orders.length} orders`);
    }, "Refresh");

    tbtn("excel").onclick = () => actionRunner(async () => {
      await safeEnsureLogin();
      const { from, to } = getOrdersRangeIso();
      if (!window.adminApi?.exportExcel) throw new Error("adminApi.exportExcel not available");
      await window.adminApi.exportExcel({ from, to, limit: 10000 });
      ttoast("Export", "orders.xlsx download started");
    }, "Excel export");


    const obtn = btn("orders");
    if (obtn) {
      obtn._mgWired = true;
      obtn.onclick = () => actionRunner(async () => {
        await safeEnsureLogin();

        // Close other panels if open
        try { tariffsUiHide(); } catch (e) { }
        try { productsUiHide?.(); } catch (e) { }
        try { accountingUiHide?.(); } catch (e) { }
        try { window.graphEngine?.close?.(); } catch (e) { }

        localStorage.setItem("mgmt_active_tab", "orders");
        try { renderFilters(true); } catch (e) { }

        // Ensure orders-only empty placeholder does not leak into other tabs
        try {
          const groups = document.getElementById("groups");
          if (groups) groups.style.display = "";
        } catch (e) { }

        render();
      }, "Orders");
    }
    const gbtn = btn("graphs");
    if (gbtn) {
      // Prevent graphEngine from attaching its own click handler (we control it here)
      gbtn._mgWired = true;

      gbtn.onclick = () => actionRunner(async () => {
        await safeEnsureLogin();

        if (window.graphEngine?.install) {
          await window.graphEngine.install({ adminApi: window.adminApi });
        }

        // Close other overlays so graphs are visible
        try { productsUiHide?.(); } catch (e) { }
        try { accountingUiHide?.(); } catch (e) { }
        try { tariffsUiHide?.(); } catch (e) { }

        const panel = document.getElementById("graphsTab");
        const isOpen = panel && !panel.classList.contains("mg-graphs-hidden");

        if (isOpen) {
          window.graphEngine?.close?.();
          localStorage.setItem("mgmt_active_tab", "orders");
        } else {
          window.graphEngine?.open?.();
          localStorage.setItem("mgmt_active_tab", "graphs");
          try { const groups = document.getElementById("groups"); if (groups) groups.innerHTML = ""; } catch (e) { }
        }
        try { renderFilters(true); } catch (e) { }
      }, "Graphs");
    }

    btn("settings").onclick = () => {
      try { openSettingsModal(); } catch (e) { ttoast("Error", String(e?.message || e)); }
    };

    // Products tab
    const __pb = btn("products");
    if (__pb) {
      __pb._mgWired = true;
      __pb.onclick = () => actionRunner(async () => {
        await safeEnsureLogin();
        try { tariffsUiHide?.(); } catch { }
        try { accountingUiHide?.(); } catch { }
        try { window.graphEngine?.close?.(); } catch { }
        localStorage.setItem("mgmt_active_tab", "products");
        try { updateMgmtTabButtons?.(); } catch { }
        try { renderFilters(true); } catch { }
        try { const groups = document.getElementById("groups"); if (groups) groups.innerHTML = ""; } catch { }
        if (typeof productsUiShow === "function") productsUiShow();
      }, "Products");
    }

    // Accounting tab
    const __ab = btn("accounting");
    if (__ab) {
      __ab._mgWired = true;
      __ab.onclick = () => actionRunner(async () => {
        await safeEnsureLogin();
        try { tariffsUiHide?.(); } catch { }
        try { productsUiHide?.(); } catch { }
        try { window.graphEngine?.close?.(); } catch { }
        localStorage.setItem("mgmt_active_tab", "accounting");
        try { updateMgmtTabButtons?.(); } catch { }
        try { renderFilters(true); } catch { }
        try { const groups = document.getElementById("groups"); if (groups) groups.innerHTML = ""; } catch { }
        if (typeof accountingUiShow === "function") await accountingUiShow();
      }, "Accounting");
    }


    const __pdl = btn("prod-dl"); if (__pdl) __pdl.onclick = () => actionRunner(async () => {
      await safeEnsureLogin();
      if (!window.adminApi?.downloadLocalServerProducts) throw new Error("downloadLocalServerProducts() not found");
      await window.adminApi.downloadLocalServerProducts();
      ttoast("Products", "Download started");
    }, "Products download");

    const __pul = btn("prod-ul"); if (__pul) __pul.onclick = () => actionRunner(async () => {
      await safeEnsureLogin();
      if (!window.adminApi?.replaceLocalServerProductsFromFile) throw new Error("replaceLocalServerProductsFromFile() not found");
      const file = await pickFile({ accept: ".js,.mjs,text/javascript" });
      if (!file) return;
      await window.adminApi.replaceLocalServerProductsFromFile(file);
      ttoast("Products", "Uploaded & replaced");
    }, "Products upload");
    btn("tariffs").onclick = () => actionRunner(async () => {
      await safeEnsureLogin();
      // Hide other tabs/panels so tariffs are visible
      try { productsUiHide?.(); } catch (e) { }
      try { accountingUiHide?.(); } catch (e) { }
      try { window.graphEngine?.close?.(); } catch (e) { }
      localStorage.setItem("mgmt_active_tab", "tariffs");
      try { updateMgmtTabButtons?.(); } catch (e) { }
      try { renderFilters(true); } catch (e) { }
      try { const groups = document.getElementById("groups"); if (groups) groups.innerHTML = ""; } catch (e) { }
      const toggle = window.tariffsUiToggle || (typeof tariffsUiToggle === "function" ? tariffsUiToggle : null);
      if (!toggle) throw new Error("tariffsUiToggle not available");
      await toggle();
    }, "Tariffs");


    btn("sync").onclick = () => actionRunner(async () => {
      await safeEnsureLogin();
      if (!window.adminApi?.syncProductsWithCanonical) throw new Error("syncProductsWithCanonical() not found (add sync API function first)");
      const out = await window.adminApi.syncProductsWithCanonical();
      ttoast("Sync", out?.ok ? "Synced" : "Done");
    }, "Sync");

    // Tools popover actions
    const healthBtn = tbtn("health");
    if (healthBtn) healthBtn.onclick = () => actionRunner(async () => {
      await safeEnsureLogin();
      const base = (typeof _adminBase === "function") ? _adminBase() : (localStorage.getItem("api_base") || location.origin);
      const out = await fetch(`${String(base).replace(/\/+$/, "")}/healthz`, { headers: (typeof _adminHeaders === "function") ? _adminHeaders(false) : {} })
        .then(r => r.json().catch(() => ({})));
      ttoast("Health", JSON.stringify(out));
      closeTools();
    }, "Health");

    const ratesBtn = tbtn("rates");
    if (ratesBtn) ratesBtn.onclick = () => actionRunner(async () => {
      await safeEnsureLogin();
      const base = (typeof _adminBase === "function") ? _adminBase() : (localStorage.getItem("api_base") || location.origin);
      const out = await fetch(`${String(base).replace(/\/+$/, "")}/rates`, { headers: (typeof _adminHeaders === "function") ? _adminHeaders(false) : {} })
        .then(r => r.json().catch(() => ({})));
      const fxAt = out?.fetchedAt || out?.fetched_at || out?.timestamp || "";
      ttoast("Rates", fxAt ? `fetchedAt: ${fxAt}` : JSON.stringify(out).slice(0, 180));
      window.__lastRates = out;
      closeTools();
    }, "Rates");

    const dupesBtn = tbtn("dupes");
    if (dupesBtn) dupesBtn.onclick = () => actionRunner(async () => {
      const groups = findPotentialDupes(state.orders || [], 30);
      window.__lastDupes = groups;
      downloadTextFile("potential-duplicates.json", JSON.stringify(groups, null, 2), "application/json;charset=utf-8");
      ttoast("Dupes", `${groups.length} groups exported`);
      closeTools();
    }, "Dupes");

    const copyAddrBtn = tbtn("copy-addr");
    if (copyAddrBtn) copyAddrBtn.onclick = () => actionRunner(async () => {
      const o = getActiveOrder();
      if (!o) throw new Error("Open an order first (click its card header)");
      await copyToClipboard(formatAddress(o));
      ttoast("Copied", "Address copied");
      closeTools();
    }, "Copy address");

    const copySumBtn = tbtn("copy-sum");
    if (copySumBtn) copySumBtn.onclick = () => actionRunner(async () => {
      const o = getActiveOrder();
      if (!o) throw new Error("Open an order first (click its card header)");
      await copyToClipboard(formatSummary(o));
      ttoast("Copied", "Summary copied");
      closeTools();
    }, "Copy summary");

    tbtn("print").onclick = () => actionRunner(async () => {
      const o = getActiveOrder();
      if (!o) throw new Error("Open an order first (click its card header)");
      const text = `PACKING SLIP\n\n${formatSummary(o)}\n\nSHIP TO:\n${formatAddress(o)}\n`;
      const safeTitle = String(o.id || "Packing slip").replace(/[^\w \-().]/g, "");
      const w = window.open("", "_blank", "noopener,noreferrer");
      if (!w) throw new Error("Popup blocked");
      const body = text.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
      w.document.open();
      w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${safeTitle}</title>
          <style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;padding:20px;line-height:1.35}</style>
          </head><body>${body}<script>window.onload=()=>window.print();</script></body></html>`);
      w.document.close();
    }, "Print slip");

    btn("logout").onclick = () => actionRunner(async () => {
      const ok = confirm("Logout? This will clear your admin session on this browser.");
      if (!ok) return;
      clearAdminSession();
      localStorage.removeItem("admin_code");
      clearRememberedLogin();
      location.reload();
    }, "Logout");
  }

  document.addEventListener("DOMContentLoaded", mount);
})();
// ---- Metrics API (Graphs v2) ----
// ---- Metrics API (Graphs v2) ----
(function attachMetricsApi() {
  window.adminApi = window.adminApi || {};
  const api = window.adminApi;

  function _base() {
    const b = (localStorage.getItem("api_base") || (location && location.origin) || "").replace(/\/+$/, "");
    return b || "";
  }

  function _hdr(json = false) {
    // Prefer your existing helper if present
    if (typeof _adminHeaders === "function") return _adminHeaders(!!json);

    const h = json ? { "Content-Type": "application/json" } : {};
    const token = localStorage.getItem("api_token") || "";
    const code = localStorage.getItem("admin_code") || "";
    if (token) h.Authorization = `Bearer ${token}`;
    if (code) h["X-Admin-Code"] = code;
    return h;
  }

  async function _ensure() {
    if (typeof ensureLogin === "function") await ensureLogin();
  }

  api.metricsCatalog = api.metricsCatalog || async function metricsCatalog() {
    await _ensure();
    const r = await fetch(`${_base()}/admin/metrics/catalog`, { method: "GET", headers: _hdr(false) });
    const out = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(out?.error || `metricsCatalog failed (${r.status})`);
    return out;
  };

  api.metricsDimensions = api.metricsDimensions || async function metricsDimensions(params = {}) {
    await _ensure();
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params || {})) {
      if (v == null || v === "") continue;
      qs.set(k, String(v));
    }
    const r = await fetch(`${_base()}/admin/metrics/dimensions?${qs.toString()}`, { method: "GET", headers: _hdr(false) });
    const out = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(out?.error || `metricsDimensions failed (${r.status})`);
    return out;
  };

  api.metricsTimeseries = api.metricsTimeseries || async function metricsTimeseries(params = {}) {
    await _ensure();
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params || {})) {
      if (v == null || v === "") continue;
      qs.set(k, String(v));
    }
    const r = await fetch(`${_base()}/admin/metrics/timeseries?${qs.toString()}`, { method: "GET", headers: _hdr(false) });
    const out = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(out?.error || `metricsTimeseries failed (${r.status})`);
    return out;
  };

  api.listAnalyticsEvents = api.listAnalyticsEvents || async function listAnalyticsEvents(params = {}) {
    await _ensure();
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params || {})) {
      if (v == null || v === "") continue;
      qs.set(k, String(v));
    }
    const r = await fetch(`${_base()}/admin/analytics/events?${qs.toString()}`, { method: "GET", headers: _hdr(false) });
    const out = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(out?.error || `listAnalyticsEvents failed (${r.status})`);
    return out;
  };
})();


// ===== Accounting & Close Tab =====
async function loadAccountingSummary() {
  const from = document.getElementById("accFrom").value;
  const to = document.getElementById("accTo").value;
  const res = await fetch(`${getApiBase()}/admin/accounting/summary?from=${from}&to=${to}`, {
    headers: authHeaders()
  });
  const data = await res.json();
  document.getElementById("accSummary").textContent = JSON.stringify(data, null, 2);

  if (data.vat && data.vat.thresholdReached) {
    document.getElementById("vatWarning").textContent =
      "⚠ VAT threshold reached or close to limit. Consult your accountant.";
  }
}

async function exportAccountingCSV() {
  const from = document.getElementById("accFrom").value;
  const to = document.getElementById("accTo").value;
  await downloadWithAuth(`${getApiBase()}/admin/accounting/export.csv?from=${from}&to=${to}`, "accounting_export.csv");
}

document.addEventListener("click", (e) => {
  if (e.target?.id === "accLoad") loadAccountingSummary();
  if (e.target?.id === "accExport") exportAccountingCSV();
});


// ===== Expenses UI =====
function fmtEUR(n) {
  const x = Number(n || 0);
  return x.toFixed(2);
}

async function loadExpenses() {
  const from = document.getElementById("accFrom").value;
  const to = document.getElementById("accTo").value;
  const res = await fetch(`${getApiBase()}/admin/expenses?from=${from}&to=${to}`, { headers: authHeaders() });
  const data = await res.json();
  const list = document.getElementById("expensesList");

  if (!data.expenses || !data.expenses.length) {
    list.textContent = "No expenses in this period.";
    return;
  }

  const container = document.createElement("div");
  container.className = "expenses-table";

  data.expenses.forEach(exp => {
    const row = document.createElement("div");
    row.className = "expense-row";
    row.dataset.id = exp._id;

    const left = document.createElement("div");
    left.className = "expense-main";
    left.textContent = `${new Date(exp.date).toLocaleDateString()} • ${exp.vendor || "-"} • ${exp.category || "-"} • €${fmtEUR(exp.amountEUR)} • ${exp.description || ""}`;

    const actions = document.createElement("div");
    actions.className = "expense-actions";

    const uploadBtn = document.createElement("button");
    uploadBtn.textContent = "Upload attachment";
    uploadBtn.onclick = () => openExpenseUpload(exp._id);

    const viewBtn = document.createElement("button");
    viewBtn.textContent = "View attachments";
    viewBtn.onclick = () => viewExpenseAttachments(exp);

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.onclick = async () => {
      if (!confirm("Delete this expense and its attachments?")) return;
      await fetch(`${getApiBase()}/admin/expenses/${exp._id}`, { method: "DELETE", headers: authHeaders() });
      await loadExpenses();
    };

    actions.appendChild(uploadBtn);
    actions.appendChild(viewBtn);
    actions.appendChild(delBtn);

    row.appendChild(left);
    row.appendChild(actions);
    container.appendChild(row);
  });

  list.innerHTML = "";
  list.appendChild(container);
}

function viewExpenseAttachments(exp) {
  const atts = exp.attachments || [];
  if (!atts.length) { alert("No attachments."); return; }
  const lines = atts.map(a => `${a.filename} (${Math.round((a.size || 0) / 1024)} KB)`);
  alert(lines.join("\n"));
}

function openExpenseUpload(expenseId) {
  const input = document.createElement("input");
  input.type = "file";
  input.multiple = true;
  input.accept = ".pdf,.png,.jpg,.jpeg";
  input.onchange = async () => {
    const files = Array.from(input.files || []);
    if (!files.length) return;
    const fd = new FormData();
    files.slice(0, 5).forEach(f => fd.append("files", f));
    const res = await fetch(`${getApiBase()}/admin/expenses/${expenseId}/attachments`, {
      method: "POST",
      headers: { "Authorization": authHeaders().Authorization },
      body: fd
    });
    if (!res.ok) alert("Upload failed");
    await loadExpenses();
  };
  input.click();
}

async function createExpense() {
  const date = document.getElementById("expDate").value;
  const vendor = document.getElementById("expVendor").value;
  const category = document.getElementById("expCategory").value;
  const amountEUR = document.getElementById("expAmount").value;
  const description = document.getElementById("expDesc").value;

  const res = await fetch(`${getApiBase()}/admin/expenses`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ date, vendor, category, amountEUR, description })
  });
  if (!res.ok) {
    alert("Failed to create expense");
    return;
  }
  document.getElementById("expVendor").value = "";
  document.getElementById("expCategory").value = "";
  document.getElementById("expAmount").value = "";
  document.getElementById("expDesc").value = "";
  await loadExpenses();
  await loadAccountingSummary();
}

// wire buttons
document.addEventListener("click", (e) => {
  if (e.target?.id === "expCreate") createExpense();
  if (e.target?.id === "expRefresh") loadExpenses();
});

// when summary loads, also refresh expenses list
const _origLoadAccountingSummary = loadAccountingSummary;
loadAccountingSummary = async function () {
  await _origLoadAccountingSummary();
  await loadExpenses();
};


// ===== Refunds & Chargebacks (manual tracking) =====
async function submitRefund(orderId) {
  const amount = prompt("Refund amount EUR (blank = full order amount):", "");
  const reason = prompt("Refund reason (optional):", "") || "";
  const stripeRefundId = prompt("Stripe refund ID (optional):", "") || "";

  const payload = { reason, stripeRefundId };
  if (amount !== null && amount !== "") payload.amountEUR = Number(amount);

  const res = await fetch(`${getApiBase()}/admin/orders/${orderId}/refund`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) alert("Refund update failed");
  else alert("Refund saved.");
}

async function submitChargeback(orderId) {
  const status = prompt('Chargeback status: "" | open | won | lost', "open") || "open";
  const stripeDisputeId = prompt("Stripe dispute ID (optional):", "") || "";

  const res = await fetch(`${getApiBase()}/admin/orders/${orderId}/chargeback`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ status, stripeDisputeId })
  });
  if (!res.ok) alert("Chargeback update failed");
  else alert("Chargeback saved.");
}


// ===== Authenticated download helper =====
async function downloadWithAuth(url, filename) {
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    alert(`Download failed (${res.status}). ${t}`);
    return;
  }
  const blob = await res.blob();
  const a = document.createElement("a");
  const objectUrl = URL.createObjectURL(blob);
  a.href = objectUrl;
  a.download = filename || "download";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
}


// ===== Reconciliation UI =====
function renderSimpleTable(rows, columns) {
  const table = document.createElement("table");
  table.style.width = "100%";
  table.style.borderCollapse = "collapse";
  const thead = document.createElement("thead");
  const trh = document.createElement("tr");
  for (const c of columns) {
    const th = document.createElement("th");
    th.textContent = c.label;
    th.style.textAlign = "left";
    th.style.borderBottom = "1px solid rgba(255,255,255,0.15)";
    th.style.padding = "6px";
    trh.appendChild(th);
  }
  thead.appendChild(trh);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  for (const r of rows) {
    const tr = document.createElement("tr");
    for (const c of columns) {
      const td = document.createElement("td");
      td.textContent = String(r[c.key] ?? "");
      td.style.borderBottom = "1px solid rgba(255,255,255,0.08)";
      td.style.padding = "6px";
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  return table;
}

async function loadReconciliationPayouts() {
  const from = document.getElementById("accFrom").value;
  const to = document.getElementById("accTo").value;
  const res = await fetch(`${getApiBase()}/admin/reconcile/payouts?from=${from}&to=${to}`, { headers: authHeaders() });
  const data = await res.json();
  const out = document.getElementById("reconOut");
  out.innerHTML = "";

  if (!data.payouts || !data.payouts.length) {
    out.textContent = "No payouts found for this period.";
    return;
  }

  const rows = data.payouts.map(p => ({
    id: p.id,
    status: p.status,
    currency: p.currency,
    amount_minor: p.amount,
    created: new Date(p.created * 1000).toISOString().slice(0, 10),
    arrival: new Date(p.arrival_date * 1000).toISOString().slice(0, 10),
    gross_minor: p.totalsMinor?.gross ?? "",
    fees_minor: p.totalsMinor?.fees ?? "",
    net_minor: p.totalsMinor?.net ?? ""
  }));

  out.appendChild(renderSimpleTable(rows, [
    { key: "id", label: "Payout ID" },
    { key: "status", label: "Status" },
    { key: "currency", label: "Cur" },
    { key: "amount_minor", label: "Amount (minor)" },
    { key: "gross_minor", label: "Gross (minor)" },
    { key: "fees_minor", label: "Fees (minor)" },
    { key: "net_minor", label: "Net (minor)" },
    { key: "created", label: "Created" },
    { key: "arrival", label: "Arrival" },
  ]));
}

async function loadReconciliationUnmatched() {
  const from = document.getElementById("accFrom").value;
  const to = document.getElementById("accTo").value;
  const res = await fetch(`${getApiBase()}/admin/reconcile/unmatched?from=${from}&to=${to}`, { headers: authHeaders() });
  const data = await res.json();
  const out = document.getElementById("reconOut");
  out.innerHTML = "";

  const arr = data.unmatched || [];
  if (!arr.length) {
    out.textContent = `No unmatched payments (checked ${data.checked || 0}).`;
    return;
  }

  const rows = arr.map(pi => ({
    id: pi.id,
    currency: pi.currency,
    amount_minor: pi.amount,
    created: new Date(pi.created * 1000).toISOString().slice(0, 10),
    receipt_email: pi.receipt_email || ""
  }));

  out.appendChild(renderSimpleTable(rows, [
    { key: "id", label: "PaymentIntent" },
    { key: "currency", label: "Cur" },
    { key: "amount_minor", label: "Amount (minor)" },
    { key: "created", label: "Created" },
    { key: "receipt_email", label: "Receipt email" },
  ]));
}

async function exportPayoutsCSV() {
  const from = document.getElementById("accFrom").value;
  const to = document.getElementById("accTo").value;
  // reuse payouts endpoint and convert client-side to CSV
  const res = await fetch(`${getApiBase()}/admin/reconcile/payouts?from=${from}&to=${to}`, { headers: authHeaders() });
  const data = await res.json();
  const rows = data.payouts || [];
  if (!rows.length) { alert("No payouts to export."); return; }

  const lines = ["payoutId,status,currency,amountMinor,grossMinor,feesMinor,netMinor,created,arrival"];
  for (const p of rows) {
    lines.push([
      p.id, p.status, p.currency, p.amount,
      p.totalsMinor?.gross ?? "", p.totalsMinor?.fees ?? "", p.totalsMinor?.net ?? "",
      new Date(p.created * 1000).toISOString(),
      new Date(p.arrival_date * 1000).toISOString()
    ].map(x => `"${String(x).replace(/"/g, '""')}"`).join(","));
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  const u = URL.createObjectURL(blob);
  a.href = u;
  a.download = "stripe_payouts.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(u), 5000);
}

// ===== Backup UI =====
async function downloadBackupZip() {
  const include = document.getElementById("backupIncludeAttachments")?.checked ? "1" : "0";
  await downloadWithAuth(`${getApiBase()}/admin/backup/export.zip?includeAttachments=${include}`, include === "1" ? "snagletshop_backup_with_attachments.zip" : "snagletshop_backup.zip");
}

// ===== Analytics UI =====
let _lastAnalytics = null;
async function loadAnalytics() {
  const from = document.getElementById("accFrom").value;
  const to = document.getElementById("accTo").value;
  const group = document.getElementById("anGroup").value;
  const res = await fetch(`${getApiBase()}/admin/analytics/profit?from=${from}&to=${to}&group=${group}`, { headers: authHeaders() });
  const data = await res.json();
  _lastAnalytics = data;

  const out = document.getElementById("anOut");
  out.innerHTML = "";

  const rows = data.rows || [];
  if (!rows.length) { out.textContent = "No data."; return; }

  if (data.group === "country") {
    out.appendChild(renderSimpleTable(rows, [
      { key: "key", label: "Country" },
      { key: "orders", label: "Orders" },
      { key: "netRevenue", label: "Net revenue" },
      { key: "fees", label: "Fees" },
      { key: "shipping", label: "Shipping" },
      { key: "cogs", label: "COGS" },
      { key: "profit", label: "Profit" },
    ]));
  } else {
    out.appendChild(renderSimpleTable(rows, [
      { key: "key", label: "Product key" },
      { key: "name", label: "Name" },
      { key: "qty", label: "Qty" },
      { key: "netRevenue", label: "Net revenue" },
      { key: "fees", label: "Fees" },
      { key: "shipping", label: "Shipping" },
      { key: "cogs", label: "COGS" },
      { key: "profit", label: "Profit" },
    ]));
  }
}

async function exportAnalyticsCSV() {
  if (!_lastAnalytics || !_lastAnalytics.rows) { alert("Load analytics first."); return; }
  const group = _lastAnalytics.group || "product";
  const rows = _lastAnalytics.rows || [];
  const cols = group === "country"
    ? ["country", "orders", "netRevenue", "fees", "shipping", "cogs", "profit"]
    : ["productKey", "name", "qty", "revenue", "refunds", "netRevenue", "fees", "shipping", "cogs", "profit"];

  const lines = [cols.join(",")];
  for (const r of rows) {
    const line = group === "country"
      ? [r.key, r.orders, r.netRevenue, r.fees, r.shipping, r.cogs, r.profit]
      : [r.key, r.name, r.qty, r.revenue, r.refunds, r.netRevenue, r.fees, r.shipping, r.cogs, r.profit];
    lines.push(line.map(x => `"${String(x ?? "").replace(/"/g, '""')}"`).join(","));
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  const u = URL.createObjectURL(blob);
  a.href = u;
  a.download = group === "country" ? "analytics_country.csv" : "analytics_product.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(u), 5000);
}

// Wire buttons
document.addEventListener("click", (e) => {
  if (e.target?.id === "reconLoadPayouts") loadReconciliationPayouts();
  if (e.target?.id === "reconLoadUnmatched") loadReconciliationUnmatched();
  if (e.target?.id === "reconExportPayouts") exportPayoutsCSV();
  if (e.target?.id === "backupDownload") downloadBackupZip();
  if (e.target?.id === "anLoad") loadAnalytics();
  if (e.target?.id === "anExport") exportAnalyticsCSV();
});


// ===== Product catalogue (pricing management) =====
let _catalogCache = null;

async function loadProductCatalogue() {
  try {
    if (typeof safeEnsureLogin === "function") await safeEnsureLogin();
    else if (typeof ensureLogin === "function") await ensureLogin();
  } catch { /* ignore */ }

  let res;
  try {
    res = await fetch(`${getApiBase()}/admin/catalog`, { headers: _adminHeaders(false) });
  } catch (e) {
    alert("Failed to reach API for catalogue");
    console.error("loadProductCatalogue fetch failed:", e);
    return;
  }

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    alert(`Failed to load catalogue (${res.status})`);
    console.error("loadProductCatalogue error:", res.status, t);
    return;
  }

  _catalogCache = await res.json().catch(() => null);
  renderProductCatalogue();
}

async function adminGetCatalogFileMode() {
  try {
    if (typeof safeEnsureLogin === "function") await safeEnsureLogin();
    else if (typeof ensureLogin === "function") await ensureLogin();
  } catch { /* ignore */ }


  const r = await fetch(`${getApiBase()}/admin/catalog/filemode`, { headers: _adminHeaders(false) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error || `GET /admin/catalog/filemode failed (${r.status})`);
  return j;
}

async function adminSetCatalogFileMode(mode) {
  try {
    if (typeof safeEnsureLogin === "function") await safeEnsureLogin();
    else if (typeof ensureLogin === "function") await ensureLogin();
  } catch { /* ignore */ }


  const r = await fetch(`${getApiBase()}/admin/catalog/filemode`, {
    method: "POST",
    headers: _adminHeaders(true),
    body: JSON.stringify({ mode })
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error || `POST /admin/catalog/filemode failed (${r.status})`);
  return j;
}

async function adminConvertProductsJsToSplit() {
  try {
    if (typeof safeEnsureLogin === "function") await safeEnsureLogin();
    else if (typeof ensureLogin === "function") await ensureLogin();
  } catch { /* ignore */ }


  const r = await fetch(`${getApiBase()}/admin/catalog/convert/to-split`, {
    method: "POST",
    headers: _adminHeaders(false)
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error || `POST /admin/catalog/convert/to-split failed (${r.status})`);
  return j;
}

async function refreshCatalogFileModeUi() {
  const sel = document.getElementById("catalogFileMode");
  const status = document.getElementById("catalogFileModeStatus");
  if (!sel || !status) return;

  status.textContent = "";
  try {
    const info = await adminGetCatalogFileMode();
    if (info && info.mode) sel.value = info.mode;
    try { localStorage.setItem("catalog_file_mode_last", sel.value); } catch { }
    const src = info?.catalogSource ? ` (${info.catalogSource})` : "";
    status.textContent = `Active: ${sel.value}${src}`;
  } catch (e) {
    // UI-only fallback: keep last known selection visible
    const last = (() => { try { return localStorage.getItem("catalog_file_mode_last") || ""; } catch { return ""; } })();
    if (last) sel.value = last;
    status.textContent = "Filemode: unavailable";
  }
}


function renderProductCatalogue() {
  const tbody = document.getElementById("prodTableBody");
  const countEl = document.getElementById("prodCount");
  const search = String(document.getElementById("prodSearch")?.value || "").trim().toLowerCase();
  const sort = String(document.getElementById("prodSort")?.value || "profit_desc");

  // If the Products tab DOM isn't present (or page HTML changed), do nothing instead of crashing.
  if (!tbody) return;

  const productsById = _catalogCache?.productsById || {};
  const ids = Object.keys(productsById);

  const rows = [];
  for (const id of ids) {
    const p = productsById[id];
    const name = String(p?.name || "");
    if (search) {
      if (!name.toLowerCase().includes(search) && !String(id).toLowerCase().includes(search)) continue;
    }
    const selling = Number(p?.salePriceEUR ?? p?.salePrice ?? p?.priceEUR ?? p?.price ?? 0) || 0;
    const purchase = Number(p?.purchasePriceEUR ?? p?.purchasePrice ?? p?.expectedPurchasePrice ?? 0) || 0;
    const profit = selling - purchase;
    const opts = p?.productOptions;
    const optsCount = Array.isArray(opts) ? opts.length : (opts && typeof opts === "object" ? Object.keys(opts).length : 0);

    rows.push({ id: String(id), name, selling, purchase, profit, optsCount });
  }

  const by = {
    profit_desc: (a, b) => b.profit - a.profit,
    profit_asc: (a, b) => a.profit - b.profit,
    sell_desc: (a, b) => b.selling - a.selling,
    sell_asc: (a, b) => a.selling - b.selling,
    name_asc: (a, b) => a.name.localeCompare(b.name),
    id_asc: (a, b) => a.id.localeCompare(b.id),
  }[sort] || ((a, b) => b.profit - a.profit);

  rows.sort(by);

  // Render
  tbody.innerHTML = "";
  for (const r of rows) {
    const tr = document.createElement("tr");

    // (blank column)
    const td0 = document.createElement("td");
    td0.textContent = "";
    tr.appendChild(td0);

    const tdId = document.createElement("td");
    tdId.textContent = r.id;
    tr.appendChild(tdId);

    const tdName = document.createElement("td");
    tdName.textContent = r.name;
    tr.appendChild(tdName);

    const tdBuy = document.createElement("td");
    const buyInput = document.createElement("input");
    buyInput.type = "number";
    buyInput.step = "0.01";
    buyInput.value = r.purchase.toFixed(2);
    buyInput.style.width = "90px";
    buyInput.dataset.pid = r.id;
    buyInput.dataset.field = "purchase";
    tdBuy.appendChild(buyInput);
    tr.appendChild(tdBuy);

    const tdSell = document.createElement("td");
    const sellInput = document.createElement("input");
    sellInput.type = "number";
    sellInput.step = "0.01";
    sellInput.value = r.selling.toFixed(2);
    sellInput.style.width = "90px";
    sellInput.dataset.pid = r.id;
    sellInput.dataset.field = "selling";
    tdSell.appendChild(sellInput);
    tr.appendChild(tdSell);

    const tdProfit = document.createElement("td");
    const profitEl = document.createElement("span");
    const recompute = () => {
      const p = (Number(sellInput.value) || 0) - (Number(buyInput.value) || 0);
      profitEl.textContent = p.toFixed(2);
    };
    sellInput.addEventListener("input", recompute);
    buyInput.addEventListener("input", recompute);
    recompute();
    tdProfit.appendChild(profitEl);
    tr.appendChild(tdProfit);

    const tdOpts = document.createElement("td");
    tdOpts.textContent = r.optsCount ? String(r.optsCount) : "";
    tr.appendChild(tdOpts);

    const tdActions = document.createElement("td");

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.className = "mgmt-btn";
    editBtn.onclick = () => openProductEditor(r.id);

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save";
    saveBtn.className = "mgmt-btn primary";
    saveBtn.onclick = async () => {
      const sellingPriceEUR = Number(sellInput.value);
      const purchasePriceEUR = Number(buyInput.value);
      const resp = await fetch(`${getApiBase()}/admin/products/${encodeURIComponent(r.id)}/pricing`, {
        method: "PATCH",
        headers: { ..._adminHeaders(true) },
        body: JSON.stringify({ sellingPriceEUR, purchasePriceEUR })
      });
      if (!resp.ok) {
        const t = await resp.text().catch(() => "");
        alert(`Save failed: ${resp.status} ${t}`);
        return;
      }
      await loadProductCatalogue();
    };

    tdActions.appendChild(editBtn);
    tdActions.appendChild(saveBtn);
    tr.appendChild(tdActions);

    tbody.appendChild(tr);
  }

  if (countEl) countEl.textContent = `${rows.length} item${rows.length === 1 ? "" : "s"}`;
}


// Save all pricing changes from the Products table in one action.
// Uses bulk endpoint when available; falls back to per-product PATCH.
async function saveAllPricingChanges() {
  // Ensure login when possible
  try {
    if (typeof safeEnsureLogin === "function") await safeEnsureLogin();
    else if (typeof ensureLogin === "function") await ensureLogin();
  } catch { }

  const tbody = document.getElementById("prodTableBody");
  if (!tbody) return alert("Products table not found");

  // Collect values from inputs
  const sellingById = new Map();
  const purchaseById = new Map();

  for (const input of tbody.querySelectorAll("input[data-pid][data-field]")) {
    const pid = input.dataset.pid;
    const field = input.dataset.field;
    const val = Number(input.value);
    if (!pid) continue;
    if (field === "selling") sellingById.set(pid, Number.isFinite(val) ? val : 0);
    if (field === "purchase") purchaseById.set(pid, Number.isFinite(val) ? val : 0);
  }

  const productsById = _catalogCache?.productsById || {};
  const updates = [];
  for (const pid of new Set([...sellingById.keys(), ...purchaseById.keys()])) {
    const p = productsById[pid] || {};
    const oldSelling = Number(p?.salePriceEUR ?? p?.salePrice ?? p?.priceEUR ?? p?.price ?? 0) || 0;
    const oldPurchase = Number(p?.purchasePriceEUR ?? p?.purchasePrice ?? p?.expectedPurchasePrice ?? 0) || 0;
    const newSelling = sellingById.get(pid);
    const newPurchase = purchaseById.get(pid);

    // Only send if changed (tolerance for floats)
    const changed = (Math.abs((newSelling ?? oldSelling) - oldSelling) > 0.0005) || (Math.abs((newPurchase ?? oldPurchase) - oldPurchase) > 0.0005);
    if (!changed) continue;

    updates.push({
      productId: pid,
      sellingPriceEUR: (newSelling ?? oldSelling),
      purchasePriceEUR: (newPurchase ?? oldPurchase)
    });
  }

  if (!updates.length) return alert("No pricing changes to save.");

  // Try bulk endpoint first
  let bulkOk = false;
  try {
    const resp = await fetch(`${getApiBase()}/admin/products/pricing/bulk`, {
      method: "PATCH",
      headers: { ..._adminHeaders(true) },
      body: JSON.stringify({ updates })
    });

    if (resp.ok) {
      const j = await resp.json().catch(() => ({}));
      bulkOk = true;
      alert(`Saved pricing for ${j.updatedProducts || updates.length} product(s).`);
    } else {
      // if endpoint missing or blocked, fall back
      const t = await resp.text().catch(() => "");
      console.warn("Bulk save failed:", resp.status, t);
    }
  } catch (e) {
    console.warn("Bulk save request failed:", e);
  }

  if (!bulkOk) {
    // Fallback: sequential saves to existing endpoint (slower)
    let ok = 0, fail = 0;
    for (const u of updates) {
      try {
        const resp = await fetch(`${getApiBase()}/admin/products/${encodeURIComponent(u.productId)}/pricing`, {
          method: "PATCH",
          headers: { ..._adminHeaders(true) },
          body: JSON.stringify({ sellingPriceEUR: u.sellingPriceEUR, purchasePriceEUR: u.purchasePriceEUR })
        });
        if (resp.ok) ok++;
        else fail++;
      } catch { fail++; }
    }
    alert(`Saved: ${ok}, Failed: ${fail} (fallback mode)`);
  }

  await loadProductCatalogue();
}

// NOTE: intentionally no "Save all pricing" button (per operator preference).
// Legacy catalogue table event hooks removed.
// The current Products tab installs its own handlers inside productsUiShow(),
// and legacy handlers would override/clear the newer renderer.


document.addEventListener("click", async (e) => {
  if (e.target?.id === "catalogFileModeApply") {
    const sel = document.getElementById("catalogFileMode");
    const status = document.getElementById("catalogFileModeStatus");
    const mode = sel ? sel.value : "products_js";
    try {
      await adminSetCatalogFileMode(mode);
      await refreshCatalogFileModeUi();
      await loadProductCatalogue();
    } catch (err) {
      if (status) status.textContent = String(err?.message || err);
      else alert(String(err?.message || err));
    }
  }

  if (e.target?.id === "catalogConvertToSplit") {
    const status = document.getElementById("catalogFileModeStatus");
    try {
      if (status) status.textContent = "Uploading bundled ServerProducts.js…";

      // 1) Replace the local ServerProducts.js on the server using the bundled file (uploaded as strict JSON).
      //    This makes convert reproducible and avoids backend JSON-parse 400s.
      await adminReplaceLocalServerProductsFromBundledFile();

      // 2) Convert to split files.
      if (status) status.textContent = "Converting to split files…";
      const out = await adminConvertProductsJsToSplit();

      // 3) Switch active mode to split_json (file-backed only).
      try { await adminSetCatalogFileMode("split_json"); } catch { /* ignore (e.g., DB mode) */ }

      // 4) Refresh UI + reload catalogue.
      await refreshCatalogFileModeUi();
      try {
        if (typeof window.productsUiReloadAll === "function") await window.productsUiReloadAll(true);
      } catch { }
      try { await loadProductCatalogue(); } catch { }

      if (status) status.textContent = `Converted: ${out.products || 0} products / ${out.categories || 0} categories`;
    } catch (err) {
      if (status) status.textContent = String(err?.message || err);
      else alert(String(err?.message || err));
    }
  }
});

// ===== Product editor modal =====
let _editingProductId = null;

function getProductFromCache(productId) {
  const productsById = _catalogCache?.productsById || {};
  return productsById[String(productId || "").trim()] || null;
}

function openProductEditor(productId) {
  const p = getProductFromCache(productId);
  if (!p) { alert("Product not found in cache. Reload catalogue."); return; }

  _editingProductId = String(productId);
  const selectedCats = Object.entries(_catalogCache?.categories || {}).filter(([cat, ids]) => (ids || []).includes(String(productId))).map(([cat]) => cat);
  populateCategorySelect(selectedCats.length ? selectedCats : [(typeof currentCategory !== 'undefined' ? currentCategory : null)].filter(Boolean));
  const newIdEl = document.getElementById("peNewId");
  if (newIdEl) newIdEl.value = "";
  document.getElementById("peId").value = _editingProductId;
  document.getElementById("peName").value = p.name || "";
  document.getElementById("peLink").value = p.productLink || p.canonicalLink || "";
  document.getElementById("pePrice").value = (Number(p.price || 0)).toFixed(2);
  document.getElementById("pePurchase").value = (Number(p.expectedPurchasePrice || 0)).toFixed(2);

  const imgs = Array.isArray(p.images) ? p.images : (Array.isArray(p.imageLinks) ? p.imageLinks : []);
  document.getElementById("peImages").value = (imgs || []).join("\n");

  // options as JSON text (best-effort)
  const opts = p.productOptions;
  document.getElementById("peOptions").value = (opts === undefined || opts === null) ? "" : JSON.stringify(opts, null, 2);
  const vps = p.variantPrices;
  const vpEl = document.getElementById("peVariantPrices");
  if (vpEl) vpEl.value = (vps === undefined || vps === null) ? "" : JSON.stringify(vps, null, 2);

  setImagesToolsFromProduct(p);

  document.getElementById("productEditorModal").hidden = false;
}

function closeProductEditor() {
  document.getElementById("productEditorModal").hidden = true;
  _editingProductId = null;
}

async function saveProductEditor() {
  const isCreate = !_editingProductId;

  const name = String(document.getElementById("peName")?.value || "").trim();
  const newProductId = String(document.getElementById("peNewId")?.value || "").trim();
  const productLink = String(document.getElementById("peLink")?.value || "").trim();
  const price = Number(document.getElementById("pePrice")?.value || 0);
  const expectedPurchasePrice = Number(document.getElementById("pePurchase")?.value || 0);

  const images = String(document.getElementById("peImages")?.value || "")
    .split(/\r?\n/)
    .map(x => x.trim())
    .filter(Boolean);

  const optsRaw = String(document.getElementById("peOptions")?.value || "").trim();
  let productOptions = undefined;
  if (optsRaw !== "") {
    try {
      productOptions = JSON.parse(optsRaw);
    } catch (_e) {
      alert("Product options must be valid JSON.");
      return;
    }
  }

  const vpRaw = String(document.getElementById("peVariantPrices")?.value || "").trim();
  let variantPrices = undefined;
  if (vpRaw !== "") {
    try {
      variantPrices = JSON.parse(vpRaw);
    } catch (_e) {
      alert("Variant prices must be valid JSON.");
      return;
    }
  }

  // categories (multi-select)
  const selCats = document.getElementById("peCategory");
  const cats = selCats ? Array.from(selCats.selectedOptions).map(o => o.value).filter(Boolean) : [];

  const body = {
    name,
    productLink,
    price,
    expectedPurchasePrice,
    images
  };
  if (productOptions !== undefined) body.productOptions = productOptions;
  if (variantPrices !== undefined) body.variantPrices = variantPrices;

  if (isCreate) {
    if (cats.length) body.categories = cats;
    if (newProductId) body.productId = newProductId; // backend expects productId on create
  } else {
    if (cats.length) body.categories = cats;
    if (newProductId) body.newProductId = newProductId; // backend expects newProductId on update
  }

  const url = isCreate
    ? `${getApiBase()}/admin/products`
    : `${getApiBase()}/admin/products/${encodeURIComponent(_editingProductId)}`;

  const resp = await fetch(url, {
    method: isCreate ? "POST" : "PATCH",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    alert(`Save failed: ${resp.status} ${t}`);
    return;
  }

  // reload cache and rerender
  await loadProductCatalogue();
  closeProductEditor();
}

document.addEventListener("click", (e) => {
  if (e.target?.id === "peClose") closeProductEditor();
  if (e.target?.id === "peCancel") closeProductEditor();
  if (e.target?.id === "peSave") saveProductEditor();
});


// ===== Products subtabs (Editor / Versions) =====
function showProductSubtab(which) {
  const a = document.getElementById("subtab-editor");
  const b = document.getElementById("subtab-versions");
  if (!a || !b) return;
  const editorBtn = document.getElementById("subtabEditorBtn");
  const verBtn = document.getElementById("subtabVersionsBtn");
  if (which === "versions") {
    a.hidden = true; b.hidden = false;
    editorBtn?.classList?.remove("active");
    verBtn?.classList?.add("active");
    loadCatalogVersions();
  } else {
    a.hidden = false; b.hidden = true;
    verBtn?.classList?.remove("active");
    editorBtn?.classList?.add("active");
  }
}

async function downloadCurrentCatalog() {
  await downloadWithAuth(`${getApiBase()}/admin/catalog/file`, "catalog.json");
}

async function uploadReplaceCatalog() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json,application/json";
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    const text = await file.text();
    let bundle = null;
    try { bundle = JSON.parse(text); } catch { alert("Invalid JSON"); return; }
    const res = await fetch(`${getApiBase()}/admin/catalog/file`, {
      method: "PUT",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(bundle)
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      alert(`Upload failed: ${res.status} ${t}`);
      return;
    }
    alert("Catalog uploaded. DB was synced and a snapshot created.");
    await loadProductCatalogue();
    await loadCatalogVersions();
  };
  input.click();
}

async function loadCatalogVersions() {
  const out = document.getElementById("versionsOut");
  if (!out) return;
  out.textContent = "Loading...";
  const res = await fetch(`${getApiBase()}/admin/catalog/versions`, { headers: authHeaders() });
  if (!res.ok) { out.textContent = "Failed to load versions."; return; }
  const data = await res.json();
  const versions = data.versions || [];
  if (!versions.length) { out.textContent = "No versions found."; return; }

  const container = document.createElement("div");
  container.className = "versions-table";

  for (const v of versions) {
    const row = document.createElement("div");
    row.className = "version-row";

    const left = document.createElement("div");
    left.className = "version-main";
    left.textContent = `${v.stamp} • ${v.reason || "-"} • products: ${v.products ?? "?"}`;

    const actions = document.createElement("div");
    actions.className = "version-actions";

    const dlJson = document.createElement("button");
    dlJson.textContent = "Download JSON";
    dlJson.onclick = () => downloadWithAuth(`${getApiBase()}/admin/catalog/versions/${encodeURIComponent(v.stamp)}/json`, `catalog_${v.stamp}.json`);

    const dlDb = document.createElement("button");
    dlDb.textContent = "Download DB snapshot";
    dlDb.onclick = () => downloadWithAuth(`${getApiBase()}/admin/catalog/versions/${encodeURIComponent(v.stamp)}/db`, `db_products_${v.stamp}.json`);

    const restore = document.createElement("button");
    restore.textContent = "Restore";
    restore.onclick = async () => {
      if (!confirm(`Restore catalog to version ${v.stamp}? This will sync DB and create a new snapshot.`)) return;
      const r = await fetch(`${getApiBase()}/admin/catalog/versions/${encodeURIComponent(v.stamp)}/restore`, {
        method: "POST",
        headers: authHeaders()
      });
      if (!r.ok) {
        const t = await r.text().catch(() => "");
        alert(`Restore failed: ${r.status} ${t}`);
        return;
      }
      alert("Restored. Reloading catalogue...");
      await loadProductCatalogue();
      await loadCatalogVersions();
    };

    actions.appendChild(dlJson);
    actions.appendChild(dlDb);
    actions.appendChild(restore);

    row.appendChild(left);
    row.appendChild(actions);
    container.appendChild(row);
  }

  out.innerHTML = "";
  out.appendChild(container);
}

document.addEventListener("click", (e) => {
  if (e.target?.id === "subtabEditorBtn") showProductSubtab("editor");
  if (e.target?.id === "subtabVersionsBtn") showProductSubtab("versions");
  if (e.target?.id === "catDownloadCurrent") downloadCurrentCatalog();
  if (e.target?.id === "catUploadBtn") uploadReplaceCatalog();
  if (e.target?.id === "catRefreshVersions") loadCatalogVersions();
});

// default subtab
document.addEventListener("DOMContentLoaded", () => {
  showProductSubtab("editor");
});


// ===== Category lists editor (storefront IDs) =====
async function loadCategoryLists() {
  const res = await fetch(`${getApiBase()}/admin/catalog/category-lists`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) { alert(`Failed to load category lists: ${data?.error || res.status}`); return; }
  document.getElementById("catListsText").value = JSON.stringify(data.categories || {}, null, 2);
}

async function saveCategoryLists() {
  let categories = null;
  const raw = document.getElementById("catListsText").value;
  try { categories = JSON.parse(raw || "{}"); } catch { alert("Invalid JSON"); return; }
  const res = await fetch(`${getApiBase()}/admin/catalog/category-lists`, {
    method: "PUT",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ categories })
  });
  const text = await res.text().catch(() => "");
  if (!res.ok) { alert(`Save failed: ${res.status} ${text}`); return; }
  alert("Category lists saved. Snapshot created and DB synced.");
  await loadProductCatalogue();
  await loadCatalogVersions();
}

async function downloadCategoryLists() {
  // current category lists are embedded in catalog; download a generated file
  const res = await fetch(`${getApiBase()}/admin/catalog/category-lists`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) { alert("Failed to download category lists."); return; }
  const blob = new Blob([JSON.stringify(data.categories || {}, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  const u = URL.createObjectURL(blob);
  a.href = u;
  a.download = "CategoryLists.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(u), 5000);
}

document.addEventListener("click", (e) => {
  if (e.target?.id === "catListsLoad") loadCategoryLists();
  if (e.target?.id === "catListsSave") saveCategoryLists();
  if (e.target?.id === "catListsDownload") downloadCategoryLists();
});


// ===== Graph engine (Chart.js) + Excel export (SheetJS) =====
let _graphChart = null;
let _graphRows = null; // last timeseries rows

const METRIC_LABELS = {
  orders: "Orders",
  gross: "Gross (EUR)",
  refunds: "Refunds (EUR)",
  netRevenue: "Net revenue (EUR)",
  fees: "Stripe fees (EUR)",
  shipping: "Shipping (EUR)",
  cogs: "COGS (EUR)",
  otherOrderCosts: "Other order costs (EUR)",
  profit: "Profit (EUR)"
};

async function loadGraphsTimeseries() {
  const from = document.getElementById("accFrom").value;
  const to = document.getElementById("accTo").value;

  const res = await fetch(`${getApiBase()}/admin/analytics/timeseries?from=${from}&to=${to}&interval=day`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) { alert(`Failed to load graph data: ${data?.error || res.status}`); return; }
  _graphRows = data.rows || [];
  renderGraphsChart();
}

function buildDataset(metric, colorHex) {
  if (!metric) return null;
  const width = Math.max(1, Math.min(10, Number(document.getElementById("gLineWidth").value || 2)));
  const tension = Math.max(0, Math.min(1, Number(document.getElementById("gTension").value || 0)));
  const showPoints = !!document.getElementById("gShowPoints").checked;
  const fill = !!document.getElementById("gFill").checked;

  return {
    label: METRIC_LABELS[metric] || metric,
    data: (_graphRows || []).map(r => Number(r[metric] || 0)),
    borderColor: colorHex || "#00bcd4",
    backgroundColor: (colorHex || "#00bcd4") + "33",
    borderWidth: width,
    tension: tension,
    pointRadius: showPoints ? 3 : 0,
    pointHoverRadius: showPoints ? 5 : 0,
    fill: fill
  };
}

function renderGraphsChart() {
  if (!_graphRows) { alert("No graph data loaded yet."); return; }
  const metricA = document.getElementById("gMetricA").value;
  const metricB = document.getElementById("gMetricB").value;
  const colorA = document.getElementById("gColorA").value;
  const colorB = document.getElementById("gColorB").value;
  const showGrid = !!document.getElementById("gShowGrid").checked;

  const labels = (_graphRows || []).map(r => r.date);

  const datasets = [];
  const dsA = buildDataset(metricA, colorA);
  if (dsA) datasets.push(dsA);
  const dsB = buildDataset(metricB, colorB);
  if (dsB) datasets.push(dsB);

  const ctx = document.getElementById("graphsCanvas");
  if (!ctx) return;

  if (_graphChart) {
    _graphChart.destroy();
    _graphChart = null;
  }

  _graphChart = new Chart(ctx, {
    type: "line",
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: true }
      },
      scales: {
        x: {
          grid: { display: showGrid }
        },
        y: {
          grid: { display: showGrid },
          ticks: { precision: 0 }
        }
      }
    }
  });
}

function applyGraphsStyle() {
  if (!_graphChart) { renderGraphsChart(); return; }
  // Rebuild datasets with current style controls
  renderGraphsChart();
}

function exportGraphsToExcel() {
  if (!_graphRows || !_graphRows.length) { alert("Load graph data first."); return; }
  if (typeof XLSX === "undefined") { alert("XLSX library not loaded."); return; }

  const metricA = document.getElementById("gMetricA").value;
  const metricB = document.getElementById("gMetricB").value;

  const header = ["date"];
  if (metricA) header.push(metricA);
  if (metricB) header.push(metricB);

  const data = [header];
  for (const r of _graphRows) {
    const row = [r.date];
    if (metricA) row.push(Number(r[metricA] || 0));
    if (metricB) row.push(Number(r[metricB] || 0));
    data.push(row);
  }

  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "GraphData");

  // Add a small metadata sheet
  const meta = [
    ["exportedAt", new Date().toISOString()],
    ["metricA", metricA || ""],
    ["metricB", metricB || ""],
    ["from", document.getElementById("accFrom").value],
    ["to", document.getElementById("accTo").value]
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(meta);
  XLSX.utils.book_append_sheet(wb, ws2, "Meta");

  const filename = `graphs_${new Date().toISOString().replace(/[:.]/g, '-')}.xlsx`;
  XLSX.writeFile(wb, filename);
}

document.addEventListener("click", (e) => {
  if (e.target?.id === "gLoad") loadGraphsTimeseries();
  if (e.target?.id === "gApply") applyGraphsStyle();
  if (e.target?.id === "gExportExcel") exportGraphsToExcel();
});


// ===== Image link auto-generation =====
function toRoman(n) {
  const map = [
    ["X", 10], ["IX", 9], ["V", 5], ["IV", 4], ["I", 1]
  ];
  let out = "";
  for (const [sym, val] of map) {
    while (n >= val) { out += sym; n -= val; }
  }
  return out || "I";
}

function encodeNameForImages(name) {
  // encode like URLs in your repo: spaces => %20 etc.
  return encodeURIComponent(String(name || "").trim()).replace(/%2F/g, "%252F");
}

function generateImageLinksFromName(name, count, ext, template) {
  const enc = encodeNameForImages(name);
  const c = Math.max(0, Math.min(50, Number(count || 0)));
  const e = String(ext || "avif").trim();
  const t = String(template || "");
  const out = [];
  for (let i = 1; i <= c; i++) {
    const roman = toRoman(i);
    out.push(
      t.replaceAll("{NAME_ENC}", enc)
        .replaceAll("{ROMAN}", roman)
        .replaceAll("{INDEX}", String(i))
        .replaceAll("{EXT}", e)
    );
  }
  return out;
}

function isAutoImageList(images, name, ext, template) {
  try {
    const gen = generateImageLinksFromName(name, images.length, ext, template);
    if (gen.length !== images.length) return false;
    for (let i = 0; i < gen.length; i++) if (String(gen[i]) !== String(images[i])) return false;
    return true;
  } catch { return false; }
}


function populateCategorySelect(selectedCats) {
  const sel = document.getElementById("peCategory");
  if (!sel) return;
  const cats = Object.keys(_catalogCache?.categories || {}).sort();
  sel.innerHTML = "";
  for (const c of cats) {
    const opt = document.createElement("option");
    opt.value = c; opt.textContent = c;
    if (Array.isArray(selectedCats) && selectedCats.includes(c)) opt.selected = true;
    sel.appendChild(opt);
  }
  // allow new category typing? not now; keep select for safety.
}

function refreshImagesFromTools() {
  const auto = !!document.getElementById("peAutoImages")?.checked;
  const name = document.getElementById("peName")?.value || "";
  const count = Number(document.getElementById("peImageCount")?.value || 0);
  const ext = document.getElementById("peImageExt")?.value || "avif";
  const template = document.getElementById("peImageTemplate")?.value || "";
  const textarea = document.getElementById("peImages");

  if (!textarea) return;
  if (!auto) return;

  const links = generateImageLinksFromName(name, count, ext, template);
  textarea.value = links.join("\n");
}

function setImagesToolsFromProduct(p) {
  const textarea = document.getElementById("peImages");
  const name = document.getElementById("peName")?.value || "";
  const extSel = document.getElementById("peImageExt");
  const template = document.getElementById("peImageTemplate")?.value || "";
  const autoChk = document.getElementById("peAutoImages");
  const cnt = document.getElementById("peImageCount");

  const imgs = Array.isArray(p?.images) ? p.images : (Array.isArray(p?.imageLinks) ? p.imageLinks : []);
  if (textarea) textarea.value = (imgs || []).join("\n");

  // Infer ext from first image if possible
  let ext = "avif";
  if (imgs && imgs.length) {
    const m = String(imgs[0]).match(/\.([a-z0-9]+)(\?.*)?$/i);
    if (m) ext = m[1].toLowerCase();
  }
  if (extSel) extSel.value = ext;

  if (cnt) cnt.value = String((imgs || []).length || 0);

  // Heuristic: enable auto if matches generated list
  const auto = imgs && imgs.length ? isAutoImageList(imgs, name, ext, template) : true;
  if (autoChk) autoChk.checked = auto;
  if (auto) refreshImagesFromTools();
}


function openNewProductEditor() {
  _editingProductId = null;

  populateCategorySelect([Object.keys(_catalogCache?.categories || {})[0] || ""].filter(Boolean));

  document.getElementById("peId").value = "(new)";
  const newIdEl = document.getElementById("peNewId");
  if (newIdEl) newIdEl.value = "";

  document.getElementById("peName").value = "";
  document.getElementById("peLink").value = "";
  document.getElementById("pePrice").value = "0.00";
  document.getElementById("pePurchase").value = "0.00";

  document.getElementById("peOptions").value = "";
  const vpEl = document.getElementById("peVariantPrices");
  if (vpEl) vpEl.value = "";
  document.getElementById("peAutoImages").checked = true;
  document.getElementById("peImageCount").value = "6";
  // keep ext/template defaults
  refreshImagesFromTools();

  document.getElementById("productEditorModal").hidden = false;
}


document.addEventListener("input", (e) => {
  if (e.target?.id === "peName") {
    // live update images if auto enabled
    refreshImagesFromTools();
  }
  if (e.target?.id === "peImageCount" || e.target?.id === "peImageExt" || e.target?.id === "peImageTemplate") {
    refreshImagesFromTools();
  }
});

document.addEventListener("click", (e) => {
  if (e.target?.id === "peGenImages") refreshImagesFromTools();
  if (e.target?.id === "peAddImage") {
    const cntEl = document.getElementById("peImageCount");
    const auto = !!document.getElementById("peAutoImages")?.checked;
    if (auto && cntEl) {
      cntEl.value = String(Number(cntEl.value || 0) + 1);
      refreshImagesFromTools();
    } else {
      // manual mode: append empty line
      const ta = document.getElementById("peImages");
      if (ta) ta.value = (ta.value.trim() ? (ta.value.trim() + "\n") : "") + "";
    }
  }
  if (e.target?.id === "newProductBtn") openNewProductEditor();
});


// ===================== Products Tab (Catalogue + Categories) =====================
(function productsWorkbench() {
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  let installed = false;
  let bundle = null; // {productsById, categories}
  let activeProductId = null;
  let editorBaseline = null;
  const newlyCreatedIds = new Set();
  let history = [];
  let histIndex = -1;
  let categoriesDraft = null;
  let categoriesMetaDraft = {};
  let catMetaTarget = null;
  let activeCategory = null;
  let catSortable = null;
  let imgSortable = null;
  const stateKey = "mg_products_hist_collapsed";

  // Catalogue sorting (clickable table headers)
  const sortKeyStorage = "mg_catalogue_sort_v1";
  let catalogueSort = (() => {
    try {
      const raw = localStorage.getItem(sortKeyStorage);
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && typeof parsed === "object" && parsed.key && parsed.dir) return parsed;
    } catch { }
    return { key: "profit", dir: "desc" };
  })();

  function apiBase() {
    if (typeof getApiBase === "function") return getApiBase().replace(/\/+$/, "");
    return (localStorage.getItem("api_base") || location.origin).replace(/\/+$/, "");
  }
  function authHead(json = true) {
    if (typeof authHeaders === "function") return authHeaders(json);
    if (typeof _adminHeaders === "function") return _adminHeaders(json);
    const h = json ? { "Content-Type": "application/json" } : {};
    const token = localStorage.getItem("api_token") || "";
    const code = localStorage.getItem("admin_code") || "";
    if (token) h.Authorization = `Bearer ${token}`;
    if (code) h["X-Admin-Code"] = code;
    return h;
  }

  async function fetchCatalog() {
    const r = await fetch(`${apiBase()}/admin/catalog`, { headers: authHead(false) });
    const out = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(out?.error || `GET /admin/catalog failed (${r.status})`);
    return out;
  }

  async function fetchCategoriesMeta() {
    const r = await fetch(`${apiBase()}/admin/catalog/categories-meta`, { headers: authHead(false) });
    const out = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(out?.error || `GET /admin/catalog/categories-meta failed (${r.status})`);
    return out;
  }

  function _parseDualIcon(iconStr) {
    const s = String(iconStr || "").trim();
    if (!s) return { light: "", dark: "" };
    if (s.startsWith("{") && s.endsWith("}")) {
      try {
        const obj = JSON.parse(s);
        if (obj && typeof obj === "object") {
          const light = String(obj.light || obj.l || obj.url || obj.icon || "").trim();
          const dark = String(obj.dark || obj.d || "").trim();
          return { light, dark };
        }
      } catch { }
    }
    return { light: s, dark: "" };
  }

  function _buildIconStringFromInputs(light, dark) {
    const l = String(light || "").trim();
    const d = String(dark || "").trim();
    if (!l && !d) return "";
    if (l && d) return JSON.stringify({ light: l, dark: d });
    return l || d;
  }


  async function downloadCatalogs() {
    const r = await fetch(`${apiBase()}/admin/catalog`, { headers: authHead(false) });
    const txt = await r.text();
    if (!r.ok) {
      let msg = txt;
      try { msg = JSON.parse(txt)?.error || msg; } catch { }
      throw new Error(msg || `GET /admin/catalog failed (${r.status})`);
    }

    // Keep the server payload as-is, but ensure it's valid JSON for download.
    let payload = null;
    try { payload = JSON.parse(txt); } catch { payload = { raw: txt }; }

    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `catalog_bundle_${stamp}.json`;

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { try { URL.revokeObjectURL(a.href); } catch { } a.remove(); }, 0);

    try { pushHistory("Downloaded catalogs", filename); } catch { }
    try { ttoast("Downloaded", filename); } catch { }
  }

  async function putCatalogFile(newBundle) {
    const r = await fetch(`${apiBase()}/admin/catalog/file`, {
      method: "PUT",
      headers: authHead(true),
      body: JSON.stringify(newBundle)
    });
    const out = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(out?.error || `PUT /admin/catalog/file failed (${r.status})`);
    return out;
  }
  async function putCategoryLists(catLists) {
    const r = await fetch(`${apiBase()}/admin/catalog/category-lists`, {
      method: "PUT",
      headers: authHead(true),
      body: JSON.stringify(catLists)
    });
    const out = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(out?.error || `PUT /admin/catalog/category-lists failed (${r.status})`);
    return out;
  }

  function showPane(name) {
    $$("#productsTab .mg-prod-pane").forEach(p => p.classList.toggle("hidden", p.getAttribute("data-pane") !== name));
    $$("#productsTab .mg-subtab").forEach(b => b.classList.toggle("active", b.getAttribute("data-subtab") === name));
    localStorage.setItem("mg_products_subtab", name);
  }

  function fmt2(n) { const x = Number(n || 0); return (Number.isFinite(x) ? x : 0).toFixed(2); }
  function esc(s) { return (typeof escHtml === "function") ? escHtml(String(s ?? "")) : String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

  function normalizeBundle(raw) {
    const productsById = raw?.productsById || raw?.products_by_id || {};
    const categories = raw?.categories || {};
    return { productsById, categories };
  }


  // ===== Product option groups (multi-variant) helpers =====
  function mgSafeJsonParseMaybe(v) {
    if (typeof v !== "string") return v;
    const s = v.trim();
    if (!s) return v;
    if (!(s.startsWith("{") || s.startsWith("["))) return v;
    try { return JSON.parse(s); } catch { return v; }
  }

  function mgNormalizeOptionGroups(raw) {
    let v = mgSafeJsonParseMaybe(raw);

    // Preferred: optionGroups already
    if (Array.isArray(v) && v.length && v[0] && typeof v[0] === "object" && !Array.isArray(v[0])) {
      const out = [];
      for (const g of v.slice(0, 10)) {
        const label = String(g.label ?? g.name ?? "").trim().replace(/:$/, "");
        const opts = Array.isArray(g.options) ? g.options : [];
        const options = opts.map(x => String(x ?? "").trim()).filter(Boolean).slice(0, 200);
        if (!label || !options.length) continue;
        const keyBase = label.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_\-]/g, "");
        const key = String(g.key ?? keyBase ?? `opt${out.length + 1}`).trim().slice(0, 64) || `opt${out.length + 1}`;
        const imageByOption = (g.imageByOption && typeof g.imageByOption === "object") ? g.imageByOption : undefined;
        out.push({ key, label, options, ...(imageByOption ? { imageByOption } : {}) });
      }
      return out;
    }

    // Back-compat: legacy single group array: ["Color:", "Red", "Blue"]
    if (Array.isArray(v) && (v.length === 0 || typeof v[0] === "string")) {
      const arr = v.map(x => String(x ?? "").trim()).filter(Boolean);
      if (arr.length < 2) return [];
      const label = String(arr[0] || "Option").replace(/:$/, "").trim();
      const options = arr.slice(1);
      return [{ key: label.toLowerCase().replace(/\s+/g, "_"), label, options }];
    }

    // Back-compat: array of arrays: [[label, ...opts], [label2, ...opts2]]
    if (Array.isArray(v) && v.length && Array.isArray(v[0])) {
      const out = [];
      for (const a of v.slice(0, 10)) {
        const arr = Array.isArray(a) ? a : [];
        const [labelRaw, ...optsRaw] = arr;
        const label = String(labelRaw ?? "Option").trim().replace(/:$/, "");
        const options = optsRaw.map(x => String(x ?? "").trim()).filter(Boolean).slice(0, 200);
        if (!label || !options.length) continue;
        out.push({ key: label.toLowerCase().replace(/\s+/g, "_"), label, options });
      }
      return out;
    }

    return [];
  }

  function mgFirstGroupToLegacyProductOptions(groups) {
    const arr = Array.isArray(groups) ? groups : [];
    const g = arr[0];
    if (!g || typeof g !== "object") return [];
    const labelRaw = String(g.label ?? g.name ?? "Option").trim().replace(/:$/, "");
    const label = labelRaw ? (labelRaw.endsWith(":") ? labelRaw : (labelRaw + ":")) : "Option:";
    const opts = Array.isArray(g.options) ? g.options : [];
    const options = opts.map(x => String(x ?? "").trim()).filter(Boolean).slice(0, 300);
    return options.length ? [label, ...options] : [];
  }
  function getProductList() {
    if (!bundle) return [];
    // In split_json mode, product objects often do NOT contain their ID field
    // (the ID is the key in productsById). Always fall back to the map key.
    const byId = bundle.productsById || {};
    return Object.entries(byId).map(([idKey, p]) => ({
      id: String(p?.productId || p?.id || idKey || "").trim(),
      name: String(p?.name || p?.productName || ""),
      buy: Number(p?.purchasePriceEUR ?? p?.purchasePrice ?? p?.expectedPurchasePrice ?? p?.expectedPurchasePriceEUR ?? 0),
      sell: Number(p?.salePriceEUR ?? p?.salePrice ?? p?.priceEUR ?? p?.price ?? p?.sellingPrice ?? 0),
      link: String(p?.productLink || ""),
      description: String(p?.description || ""),
      options: mgNormalizeOptionGroups(p?.optionGroups ?? p?.productOptions ?? p?.options ?? []),
      images: Array.isArray(p?.images) ? p.images : Array.isArray(p?.imageLinks) ? p.imageLinks : []
    })).filter(p => p.id);
  }

  function _defaultDirForKey(k) {
    return (k === "name" || k === "id") ? "asc" : "desc";
  }

  function setCatalogueSort(key) {
    const k = String(key || "").trim();
    if (!k) return;
    if (catalogueSort.key === k) catalogueSort.dir = (catalogueSort.dir === "asc") ? "desc" : "asc";
    else {
      catalogueSort.key = k;
      catalogueSort.dir = _defaultDirForKey(k);
    }
    try { localStorage.setItem(sortKeyStorage, JSON.stringify(catalogueSort)); } catch { }
    updateCatalogueSortIndicators();
    renderCatalogue();
  }

  function updateCatalogueSortIndicators() {
    const ths = $$("#productsTab .mg-cat-table thead th.mg-sortable");
    const key = String(catalogueSort?.key || "");
    const dir = (String(catalogueSort?.dir || "desc").toLowerCase() === "asc") ? "asc" : "desc";
    for (const th of ths) {
      const k = th.getAttribute("data-sort-key") || "";
      const active = (k === key);
      th.classList.toggle("active", active);
      th.setAttribute("aria-sort", active ? (dir === "asc" ? "ascending" : "descending") : "none");
      const arrow = th.querySelector(".mg-sort-arrow");
      if (arrow) arrow.textContent = active ? (dir === "asc" ? "▲" : "▼") : "";
    }
  }

  function installCatalogueSortHeaders() {
    const ths = $$("#productsTab .mg-cat-table thead th.mg-sortable");
    for (const th of ths) {
      if (th.getAttribute("data-sort-installed") === "1") continue;
      th.setAttribute("data-sort-installed", "1");
      th.addEventListener("click", () => setCatalogueSort(th.getAttribute("data-sort-key")));
    }
    updateCatalogueSortIndicators();
  }

  function sortProducts(list) {
    const key = String(catalogueSort?.key || "profit");
    const dir = (String(catalogueSort?.dir || "desc").toLowerCase() === "asc") ? "asc" : "desc";
    const mul = (dir === "asc") ? 1 : -1;

    const num = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };
    const str = (v) => String(v ?? "");
    const optsCount = (p) => Array.isArray(p?.options) ? p.options.length : (p?.options && typeof p.options === "object" ? Object.keys(p.options).length : 0);

    return [...list].sort((a, b) => {
      let cmp = 0;
      if (key === "name") cmp = str(a.name).localeCompare(str(b.name));
      else if (key === "id") cmp = str(a.id).localeCompare(str(b.id));
      else if (key === "buy") cmp = (num(a.buy) - num(b.buy)) * mul;
      else if (key === "sell") cmp = (num(a.sell) - num(b.sell)) * mul;
      else if (key === "profit") cmp = ((num(a.sell) - num(a.buy)) - (num(b.sell) - num(b.buy))) * mul;
      else if (key === "opts") cmp = (optsCount(a) - optsCount(b)) * mul;
      else cmp = 0;

      // Tie-breakers for stability/readability
      if (cmp === 0) cmp = str(a.name).localeCompare(str(b.name));
      if (cmp === 0) cmp = str(a.id).localeCompare(str(b.id));
      return cmp;
    });
  }

  function renderCatalogue() {
    const body = $("#prodTableBody");
    if (!body) return;

    const search = ($("#prodSearch")?.value || "").trim().toLowerCase();

    let list = getProductList();
    if (search) {
      const sNum = Number(String(search).replace(/,/g, "."));
      const isNum = Number.isFinite(sNum);
      list = list.filter(p => {
        const hay = [
          p.id,
          p.name,
          p.description,
          p.link,
          fmt2(p.buy),
          fmt2(p.sell),
          String(p.buy ?? ""),
          String(p.sell ?? "")
        ].map(x => String(x ?? "").toLowerCase());

        if (hay.some(x => x.includes(search))) return true;
        // Allow numeric exact match for convenience (e.g. type 12.99)
        if (isNum) {
          const buy = Number(p.buy ?? NaN);
          const sell = Number(p.sell ?? NaN);
          if (Number.isFinite(buy) && Math.abs(buy - sNum) < 0.0005) return true;
          if (Number.isFinite(sell) && Math.abs(sell - sNum) < 0.0005) return true;
        }
        return false;
      });
    }
    list = sortProducts(list);
    updateCatalogueSortIndicators();

    if ($("#prodCount")) $("#prodCount").textContent = `${list.length} items`;

    body.innerHTML = "";
    for (const p of list) {
      const tr = document.createElement("tr");
      if (activeProductId === p.id) tr.classList.add("active");
      const profit = p.sell - p.buy;
      const thumb = p.images?.[0] || "";
      tr.innerHTML = `
        <td>${thumb ? `<img class="mg-thumb" src="${esc(thumb)}" alt="">` : `<div class="mg-thumb"></div>`}</td>
        <td>${esc(p.id)}</td>
        <td title="${esc(p.name)}">${esc(p.name)}</td>
        <td>${fmt2(p.buy)}</td>
        <td>${fmt2(p.sell)}</td>
        <td class="mg-profit ${profit >= 0 ? "pos" : "neg"}">${fmt2(profit)}</td>
        <td>${Array.isArray(p.options) ? p.options.length : 0}</td>
        <td><div style="display:flex;gap:8px;justify-content:flex-end;"><button class="Buttony" data-edit="1">Edit</button><button class="Buttony danger" data-del="1" title="Delete">🗑</button></div></td>
      `;
      tr.querySelector('[data-edit="1"]').onclick = () => openEditor(p.id);
      const delBtn = tr.querySelector('[data-del="1"]');
      if (delBtn) delBtn.onclick = (ev) => { ev.stopPropagation(); actionRunner(async () => { await deleteProduct(p.id); }, `Delete ${p.id}`); };
      tr.onclick = (ev) => { if (ev.target?.tagName === "BUTTON") return; openEditor(p.id); };
      body.appendChild(tr);
    }
  }

  function pushHistory(label, details = "") {
    const item = { at: new Date().toISOString(), label, details, productId: activeProductId };
    history.push(item);
    histIndex = history.length - 1;
    renderHistory();
  }
  function renderHistory() {
    const list = $("#prodHistoryList");
    if (!list) return;
    list.innerHTML = "";
    history.slice().reverse().slice(0, 60).forEach((h, idx) => {
      const row = document.createElement("div");
      row.className = "mg-cat-item";
      row.innerHTML = `<div style="min-width:0">
        <div style="font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(h.label)}</div>
        <div style="font-size:11px;color:#6b7280;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(h.details || h.at)}</div>
      </div><div class="mg-pill">↩</div>`;
      row.onclick = () => { if (h.productId) openEditor(h.productId); };
      list.appendChild(row);
    });
  }

  function setDirty(isDirty) {
    const badge = $("#prodDirty");
    if (!badge) return;
    badge.classList.toggle("hidden", !isDirty);
  }

  function readEditor() {
    const id = $("#pe_id")?.value?.trim() || "";
    const name = $("#pe_name")?.value?.trim() || "";
    const link = $("#pe_link")?.value?.trim() || "";
    const buy = Number($("#pe_buy")?.value || 0);
    const sell = Number($("#pe_sell")?.value || 0);
    const description = $("#pe_desc")?.value || "";
    const optionsJson = $("#pe_opts")?.value || "[]";
    let options = [];
    try { options = JSON.parse(optionsJson); } catch { }
    options = mgNormalizeOptionGroups(options);
    // images are stored on container dataset
    const imgs = $$("#pe_images .mg-img-item").map(it => it.getAttribute("data-url")).filter(Boolean);
    return { id, name, link, buy, sell, description, options, images: imgs };
  }


  // === Image URL auto-generation (GitHub raw pattern) ===
  const _IMAGE_BASE = "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/";
  const _ROMANS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI", "XXII", "XXIII", "XXIV", "XXV", "XXVI", "XXVII", "XXVIII", "XXIX", "XXX", "XXXI", "XXXII", "XXXIII", "XXXIV", "XXXV", "XXXVI", "XXXVII", "XXXVIII", "XXXIX", "XL", "XLI", "XLII", "XLIII", "XLIV", "XLV", "XLVI", "XLVII", "XLVIII", "XLIX", "L"];

  function _romanForIndex(i1) {
    const n = Number(i1) || 1;
    return _ROMANS[n - 1] || String(n);
  }

  function _extFromUrl(u) {
    const s = String(u || "");
    const m = s.match(/\.([a-z0-9]+)(?:\?|#|$)/i);
    return (m && m[1]) ? m[1].toLowerCase() : "avif";
  }

  function _buildImageUrlFromName(name, i1, ext = "avif") {
    const safeName = String(name || "").trim();
    const folder = encodeURIComponent(`SnagletShop--Product_Images/${safeName}/Modified`);
    const r = _romanForIndex(i1);
    const e = String(ext || "avif").replace(/[^a-z0-9]/gi, "") || "avif";
    return `${_IMAGE_BASE}${folder}/Image_${r}.${e}`;
  }

  function syncEditorImagesToName(silent = false) {
    const name = ($("#pe_name")?.value || "").trim();
    if (!name) return false;

    const cur = $$("#pe_images .mg-img-item").map(it => it.getAttribute("data-url")).filter(Boolean);
    if (!cur.length) return false;

    const exts = cur.map(_extFromUrl);
    const urls = exts.map((ext, idx) => _buildImageUrlFromName(name, idx + 1, ext));

    renderImages(urls);
    if (!silent) {
      try { setDirty(true); } catch { }
      try { pushHistory("Synced image URLs", `${urls.length} images`); } catch { }
    }
    return true;
  }


  function renderImages(urls) {
    const grid = $("#pe_images");
    if (!grid) return;
    grid.innerHTML = "";
    for (const u of (urls || [])) {
      const it = document.createElement("div");
      it.className = "mg-img-item";
      it.setAttribute("data-url", u);
      it.innerHTML = `
        <img src="${esc(u)}" alt="">
        <div class="mg-img-actions">
          <button class="trash" title="Delete">🗑</button>
          <button class="edit" title="Edit URL">✎</button>
        </div>
        <div class="mg-img-url">${esc(u)}</div>
      `;
      it.querySelector("img").onclick = () => window.open(u, "_blank", "noopener,noreferrer");
      it.querySelector("button.trash").onclick = (ev) => { ev.stopPropagation(); it.remove(); setDirty(true); pushHistory("Removed image", u); };
      it.querySelector("button.edit").onclick = (ev) => {
        ev.stopPropagation();
        const nu = prompt("Image URL:", u);
        if (!nu) return;
        it.setAttribute("data-url", nu);
        it.querySelector("img").src = nu;
        it.querySelector(".mg-img-url").textContent = nu;
        setDirty(true);
        pushHistory("Edited image URL", nu);
      };
      grid.appendChild(it);
    }

    // sortable reorder
    try {
      if (window.Sortable) {
        if (imgSortable) imgSortable.destroy();
        imgSortable = window.Sortable.create(grid, {
          animation: 120,
          onEnd: () => { try { syncEditorImagesToName(true); } catch { } setDirty(true); pushHistory("Reordered images"); }
        });
      }
    } catch { }
  }

  function renderEditor(product) {
    const body = $("#prodEditorBody");
    if (!body) return;

    const p = product;
    const profit = Number(p.sell || 0) - Number(p.buy || 0);

    body.innerHTML = `
      <div class="mg-editor-card">
        <h3>Basics</h3>
        <div class="mg-form-row">
          <div><label>ID</label><input id="pe_id" value="${esc(p.id)}"></div>
          <div><label>Name</label><input id="pe_name" value="${esc(p.name)}"></div>
        </div>
        <div class="mg-form-row">
          <div><label>Product link</label><input id="pe_link" value="${esc(p.link)}"></div>
          <div>
            <label>Profit</label>
            <input value="${fmt2(profit)}" disabled>
          </div>
        </div>
      </div>


      <div class="mg-editor-card">
        <h3>Categories</h3>
        <div class="mg-form-row" style="grid-template-columns:1fr;">
          <div>
            <div id="pe_cat_checks" class="mg-cat-checks"></div>
            <div style="display:flex;gap:8px;margin-top:10px;align-items:center;">
              <input id="pe_new_cat" placeholder="Create new category…" />
              <button class="Buttony" id="pe_create_cat">Create + add</button>
            </div>
          </div>
        </div>
      </div>

      <div class="mg-editor-card">
        <h3>Pricing</h3>
        <div class="mg-form-row">
          <div><label>Purchase (EUR)</label><input id="pe_buy" type="number" step="0.01" value="${fmt2(p.buy)}"></div>
          <div><label>Selling (EUR)</label><input id="pe_sell" type="number" step="0.01" value="${fmt2(p.sell)}"></div>
        </div>
      </div>

      <div class="mg-editor-card">
        <h3>Description</h3>
        <div class="mg-form-row" style="grid-template-columns:1fr;">
          <div><textarea id="pe_desc" placeholder="Description…">${esc(p.description || "")}</textarea></div>
        </div>
      </div>

      <div class="mg-editor-card">
        <h3>Options</h3>
        <div style="display:flex;gap:8px;margin-bottom:10px;">
          <button class="Buttony" id="pe_opt_add_group">+ Add option group</button>
        </div>
        <div class="mg-form-row" style="grid-template-columns:1fr;">
          <div><textarea id="pe_opts" placeholder='[]'>${esc(JSON.stringify(p.options || [], null, 2))}</textarea></div>
        </div>
      </div>

      <div class="mg-editor-card">
        <h3>Images</h3>
        <div style="display:flex;gap:8px;margin-bottom:10px;">
          <button class="Buttony" id="pe_add_img">+ Add image</button>
          <button class="Buttony" id="pe_gen_imgs">Generate N from name</button>
        </div>
        <div id="pe_images" class="mg-img-grid"></div>
      </div>
    `;

    const mark = () => { setDirty(true); };
    ["pe_id", "pe_name", "pe_link", "pe_buy", "pe_sell", "pe_desc", "pe_opts"].forEach(id => {
      const n = $("#" + id);
      if (n) n.addEventListener("input", mark);
    });

    // Categories multi-assign + create
    let catBoundId = p.id;
    const catWrap = $("#pe_cat_checks");

    function replaceIdInCategories(oldId, newId) {
      const o = String(oldId || "").trim();
      const n = String(newId || "").trim();
      if (!o || !n || o === n) return;
      for (const cat of Object.keys(categoriesDraft || {})) {
        const arr = categoriesDraft[cat];
        if (!Array.isArray(arr)) continue;
        for (let i = 0; i < arr.length; i++) {
          if (String(arr[i]) === o) arr[i] = n;
        }
        // de-dupe
        categoriesDraft[cat] = Array.from(new Set(arr.map(x => String(x))));
      }
    }

    function renderCatChecks() {
      if (!catWrap) return;
      const cats = Object.keys(categoriesDraft || {}).sort((a, b) => a.localeCompare(b));
      const selected = new Set(categoriesForProduct(catBoundId));
      catWrap.innerHTML = cats.map(c => {
        const checked = selected.has(c) ? "checked" : "";
        return `<label class="mg-cat-check"><input type="checkbox" data-cat="${esc(c)}" ${checked}> <span>${esc(c)}</span></label>`;
      }).join("") || `<div style="color:#6b7280;font-size:12px;">No categories yet.</div>`;

      catWrap.querySelectorAll('input[type="checkbox"][data-cat]').forEach(cb => {
        cb.addEventListener("change", () => {
          const cat = cb.dataset.cat;
          if (!categoriesDraft) categoriesDraft = {};
          if (!Array.isArray(categoriesDraft[cat])) categoriesDraft[cat] = [];
          if (cb.checked) {
            if (!categoriesDraft[cat].some(x => String(x) === String(catBoundId))) categoriesDraft[cat].push(String(catBoundId));
          } else {
            categoriesDraft[cat] = (categoriesDraft[cat] || []).filter(x => String(x) !== String(catBoundId));
          }
          setDirty(true);
          renderCategoriesList();
          if (activeCategory === cat) renderCategoryProducts();
        });
      });
    }

    // If ID is edited, keep categories pointing to the new id immediately.
    const idEl = $("#pe_id");
    if (idEl) {
      idEl.addEventListener("input", () => {
        const nid = String(idEl.value || "").trim();
        if (!nid || nid === catBoundId) return;
        replaceIdInCategories(catBoundId, nid);
        catBoundId = nid;
        renderCatChecks();
        renderCategoriesList();
        renderCategoryProducts();
      });
    }

    const createCatBtn = $("#pe_create_cat");
    const newCatEl = $("#pe_new_cat");
    if (createCatBtn && newCatEl) {
      createCatBtn.onclick = () => {
        const name = String(newCatEl.value || "").trim();
        if (!name) return;
        if (!categoriesDraft) categoriesDraft = {};
        if (!Array.isArray(categoriesDraft[name])) categoriesDraft[name] = [];
        if (!categoriesDraft[name].some(x => String(x) === String(catBoundId))) categoriesDraft[name].push(String(catBoundId));
        newCatEl.value = "";
        setDirty(true);
        renderCatChecks();
        renderCategoriesList();
      };
    }

    // initial render
    renderCatChecks();

    // Keep image URLs in sync with name (auto updates on rename)
    try {
      const nEl = $("#pe_name");
      if (nEl) nEl.addEventListener("input", () => { try { syncEditorImagesToName(true); } catch { } });
    } catch { }

    // Add another option group (multi-level options)
    const addGroupBtn = $("#pe_opt_add_group");
    if (addGroupBtn) {
      addGroupBtn.onclick = () => {
        const ta = $("#pe_opts");
        let raw = [];
        try { raw = JSON.parse(String(ta?.value || "[]")); } catch { raw = []; }

        const groups = mgNormalizeOptionGroups(raw);
        const n = groups.length + 1;
        groups.push({ key: `opt${n}`, label: `Option ${n}`, options: ["Value"] });

        if (ta) {
          ta.value = JSON.stringify(groups, null, 2);
          ta.dispatchEvent(new Event("input", { bubbles: true }));
        }
      };
    }

    $("#pe_add_img").onclick = () => {
      const name = ($("#pe_name")?.value || "").trim();
      if (!name) {
        try { ttoast("Name required", "Set product name first"); } catch { alert("Set product name first"); }
        return;
      }
      const cur = $$("#pe_images .mg-img-item").map(it => it.getAttribute("data-url")).filter(Boolean);
      const exts = cur.map(_extFromUrl);
      exts.push("avif");
      const urls = exts.map((ext, idx) => _buildImageUrlFromName(name, idx + 1, ext));
      renderImages(urls);
      setDirty(true);
      pushHistory("Added image", urls[urls.length - 1]);
    };

    $("#pe_gen_imgs").onclick = () => {
      const name = ($("#pe_name")?.value || "").trim();
      if (!name) {
        try { ttoast("Name required", "Set product name first"); } catch { alert("Set product name first"); }
        return;
      }

      const curCount = $$("#pe_images .mg-img-item").length;
      const n = Math.max(1, Math.min(50, curCount || 6));
      const urls = [];
      for (let i = 0; i < n; i++) urls.push(_buildImageUrlFromName(name, i + 1, "avif"));

      renderImages(urls);
      setDirty(true);
      pushHistory("Generated images", `${n} for ${name}`);
    };


    renderImages(p.images || []);
  }

  function openEditor(productId) {
    const p = getProductList().find(x => x.id === productId);
    if (!p) return;
    activeProductId = p.id;
    editorBaseline = JSON.parse(JSON.stringify(p));
    $("#prodEditorTitle").textContent = `Editing: ${p.name || p.id}`;
    setDirty(false);
    renderEditor(p);
    renderCatalogue();
  }

  function upsertProductFromEditor() {
    const draft = readEditor();
    if (!draft.id) throw new Error("Product ID is required");
    // build canonical shape
    const canonical = {
      productId: draft.id,
      name: draft.name,
      productLink: draft.link,
      purchasePriceEUR: Number(draft.buy || 0),
      salePriceEUR: Number(draft.sell || 0),
      description: draft.description || "",
      optionGroups: mgNormalizeOptionGroups(draft.options || []),
      productOptions: mgFirstGroupToLegacyProductOptions(mgNormalizeOptionGroups(draft.options || [])),
      images: draft.images || []
    };

    // remove old key if id renamed
    const oldId = activeProductId;
    if (oldId && oldId !== draft.id) {
      delete bundle.productsById[oldId];
      // categories: swap id references
      for (const [cat, ids] of Object.entries(bundle.categories || {})) {
        bundle.categories[cat] = (ids || []).map(x => x === oldId ? draft.id : x);
      }
    }
    bundle.productsById[draft.id] = canonical;
    activeProductId = draft.id;
    return canonical;
  }

  function categoriesForProduct(productId) {
    const id = String(productId || "").trim();
    const out = [];
    for (const [cat, ids] of Object.entries(categoriesDraft || {})) {
      const arr = Array.isArray(ids) ? ids.map(x => String(x)) : [];
      if (arr.includes(id)) out.push(String(cat));
    }
    return out;
  }

  async function adminCreateProduct(payload) {
    const r = await fetch(`${apiBase()}/admin/products`, {
      method: "POST",
      headers: authHead(true),
      body: JSON.stringify(payload)
    });
    const out = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(out?.error || `POST /admin/products failed (${r.status})`);
    return out;
  }

  async function adminPatchProduct(productId, payload) {
    const r = await fetch(`${apiBase()}/admin/products/${encodeURIComponent(productId)}`, {
      method: "PATCH",
      headers: authHead(true),
      body: JSON.stringify(payload)
    });
    const out = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(out?.error || `PATCH /admin/products/${productId} failed (${r.status})`);
    return out;
  }


  async function adminDeleteProduct(productId) {
    const pid = String(productId || "").trim();
    const r = await fetch(`${apiBase()}/admin/products/${encodeURIComponent(pid)}`, {
      method: "DELETE",
      headers: authHead(false)
    });
    const out = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(out?.error || `DELETE /admin/products/${pid} failed (${r.status})`);
    return out;
  }

  async function deleteProduct(productId) {
    const pid = String(productId || "").trim();
    if (!pid) return;
    const ok = confirm(`Delete product ${pid}?\n\nThis will remove it from the catalogue and all categories.`);
    if (!ok) return;

    await adminDeleteProduct(pid);

    // Best-effort local cleanup so UI doesn't glitch before reload.
    try { if (bundle?.productsById) delete bundle.productsById[pid]; } catch { }
    try {
      for (const c of Object.keys(categoriesDraft || {})) {
        categoriesDraft[c] = (categoriesDraft[c] || []).filter(x => String(x) !== pid);
      }
    } catch { }

    if (activeProductId === pid) {
      activeProductId = null;
      editorBaseline = null;
      try { $("#prodEditorBody").innerHTML = `<div class="mg-empty">Select a product or click “New product”.</div>`; } catch { }
      try { $("#prodEditorTitle").textContent = "Product editor"; } catch { }
      try { setDirty(false); } catch { }
    }

    pushHistory("Deleted product", pid);
    await reloadAll(false);
    renderCategoriesList();
  }


  async function saveActiveProduct() {
    if (!bundle) throw new Error("Catalogue not loaded");
    if (!editorBaseline) throw new Error("No product selected");

    // Ensure image URLs follow the current name pattern before reading
    try { syncEditorImagesToName(true); } catch { }

    const draft = readEditor();
    const oldId = String(editorBaseline.id || "").trim();
    const newId = String(draft.id || "").trim();

    if (!newId) throw new Error("Product ID is required");
    if (!draft.name) throw new Error("Product name is required");

    // Categories: derive from current category lists. If none, fall back.
    let categories = categoriesForProduct(oldId);
    if (!categories.length) categories = categoriesForProduct(newId);
    if (!categories.length) {
      const fallbackCat = activeCategory || Object.keys(categoriesDraft || {})[0] || "Uncategorized";
      categories = [fallbackCat];
    }

    // If ID changed, update category lists in memory (so UI stays consistent)
    if (oldId && newId !== oldId) {
      for (const cat of Object.keys(categoriesDraft || {})) {
        const arr = categoriesDraft[cat];
        if (!Array.isArray(arr)) continue;
        for (let i = 0; i < arr.length; i++) {
          if (String(arr[i]) === oldId) arr[i] = newId;
        }
      }
    }

    const payloadCreate = {
      productId: newId,
      categories,
      name: draft.name,
      productLink: draft.link || "",
      price: Number(draft.sell || 0),
      expectedPurchasePrice: Number(draft.buy || 0),
      description: draft.description || "",
      images: Array.isArray(draft.images) ? draft.images : [],
      optionGroups: mgNormalizeOptionGroups(draft.options ?? []),
      productOptions: mgFirstGroupToLegacyProductOptions(mgNormalizeOptionGroups(draft.options ?? []))
    };

    if (newlyCreatedIds.has(oldId) || newlyCreatedIds.has(newId)) {
      await adminCreateProduct(payloadCreate);
      newlyCreatedIds.delete(oldId);
      newlyCreatedIds.delete(newId);
    } else {
      const payloadPatch = {
        categories,
        name: draft.name,
        productLink: draft.link || "",
        price: Number(draft.sell || 0),
        expectedPurchasePrice: Number(draft.buy || 0),
        description: draft.description || "",
        images: Array.isArray(draft.images) ? draft.images : [],
        optionGroups: mgNormalizeOptionGroups(draft.options ?? []),
        productOptions: mgFirstGroupToLegacyProductOptions(mgNormalizeOptionGroups(draft.options ?? []))
      };
      if (newId !== oldId) payloadPatch.newProductId = newId;
      await adminPatchProduct(oldId, payloadPatch);
    }

    setDirty(false);
    pushHistory("Saved product", newId);
    await reloadAll(false);
    openEditor(newId);
    renderCategoriesList();
  }


  function _randHex(bytesLen = 6) {
    try {
      const a = new Uint8Array(bytesLen);
      (crypto || window.crypto).getRandomValues(a);
      return Array.from(a).map(b => b.toString(16).padStart(2, "0")).join("");
    } catch {
      return Math.random().toString(16).slice(2, 2 + bytesLen * 2).padEnd(bytesLen * 2, "0");
    }
  }

  function generateUnusedProductId() {
    const existing = new Set(Object.keys(bundle?.productsById || {}).map(x => String(x).trim()));

    // Digits only: 13-digit ms timestamp + 6 random digits = 19 digits
    for (let i = 0; i < 500; i++) {
      const ts = Date.now().toString(); // digits only
      const rand = Math.floor(Math.random() * 1e6).toString().padStart(6, "0");
      const id = ts + rand;
      if (!existing.has(id)) return id;
    }

    // Fallback (still digits only)
    let id;
    do {
      const ts = Date.now().toString();
      const rand = Math.floor(Math.random() * 1e9).toString().padStart(9, "0");
      id = ts + rand;
    } while (existing.has(id));
    return id;
  }


  function newProduct() {
    if (!bundle) throw new Error("Catalogue not loaded");

    const id = generateUnusedProductId();

    if (!bundle.productsById) bundle.productsById = {};
    bundle.productsById[id] = {
      productId: id,
      name: "",
      productLink: "",
      purchasePriceEUR: 0,
      salePriceEUR: 0,
      description: "",
      optionGroups: [],
      productOptions: [],
      images: []
    };

    // Put new product into the currently selected category (or first available).
    const fallbackCat = (activeCategory || Object.keys(categoriesDraft || {})[0] || "Uncategorized");
    if (!categoriesDraft) categoriesDraft = {};
    if (!Array.isArray(categoriesDraft[fallbackCat])) categoriesDraft[fallbackCat] = [];
    if (!categoriesDraft[fallbackCat].includes(id)) categoriesDraft[fallbackCat].push(id);

    newlyCreatedIds.add(id);

    pushHistory("Created product", id);
    renderCatalogue();
    renderCategoriesList();
    openEditor(id);
  }


  async function reloadAll(keepSelection = true) {
    const raw = await fetchCatalog();
    bundle = normalizeBundle(raw);
    categoriesDraft = JSON.parse(JSON.stringify(bundle.categories || {}));
    try {
      const meta = await fetchCategoriesMeta();
      categoriesMetaDraft = (meta && meta.categoriesMeta) ? meta.categoriesMeta : {};
    } catch {
      categoriesMetaDraft = {};
    }
    renderCatalogue();
    renderCategoriesList();
    if (keepSelection && activeProductId && bundle.productsById?.[activeProductId]) {
      openEditor(activeProductId);
    } else {
      $("#prodEditorBody").innerHTML = `<div class="mg-empty">Select a product or click “New product”.</div>`;
      $("#prodEditorTitle").textContent = "Product editor";
      activeProductId = null;
      setDirty(false);
    }
  }

  // Expose a safe reload helper for other UI actions (e.g., one-click convert).
  // This avoids reaching into closure scope from global handlers.
  try { window.productsUiReloadAll = reloadAll; } catch { }

  // ---- Categories UI ----
  function renderCategoriesList() {
    const list = $("#catList");
    if (!list) return;
    const search = ($("#catSearch")?.value || "").trim().toLowerCase();
    list.innerHTML = "";
    const cats = Object.keys(categoriesDraft || {}).sort((a, b) => a.localeCompare(b));

    for (const c of cats) {
      if (search && !c.toLowerCase().includes(search)) continue;

      const row = document.createElement("div");
      row.className = "mg-cat-item" + (activeCategory === c ? " active" : "");

      const left = document.createElement("div");
      left.style.minWidth = "0";
      left.style.overflow = "hidden";
      left.style.textOverflow = "ellipsis";
      left.style.whiteSpace = "nowrap";
      left.textContent = c;

      const right = document.createElement("div");
      right.className = "mg-cat-right";

      const count = (categoriesDraft[c] || []).length;
      const pill = document.createElement("div");
      pill.className = "mg-pill";
      pill.textContent = String(count);

      const menu = document.createElement("button");
      menu.type = "button";
      menu.className = "mg-cat-menu";
      menu.title = "Category options";
      menu.textContent = "⋮";
      menu.onclick = (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        openCatMetaModal(c);
      };

      right.appendChild(pill);
      right.appendChild(menu);

      row.appendChild(left);
      row.appendChild(right);

      row.onclick = () => { activeCategory = c; renderCategoriesList(); renderCategoryProducts(); };
      list.appendChild(row);
    }

    if (!activeCategory && cats.length) { activeCategory = cats[0]; renderCategoriesList(); renderCategoryProducts(); }
  }
  function renderCategoryProducts() {
    const box = $("#catProducts");
    if (!box) return;
    const cat = activeCategory;
    $("#catEditorTitle").textContent = cat ? `Category: ${cat}` : "Category";
    let ids = (categoriesDraft?.[cat] || []).slice();
    const q = ($("#catAddSearch")?.value || "").trim().toLowerCase();
    const products = getProductList();
    const byId = new Map(products.map(p => [p.id, p]));
    if (q) {
      ids = ids.filter(pid => String(pid).toLowerCase().includes(q) || String(byId.get(pid)?.name || "").toLowerCase().includes(q));
    }
    box.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "mg-cat-products";
    ids.forEach(pid => {
      const p = byId.get(pid);
      const row = document.createElement("div");
      row.className = "mg-cat-prod-row";
      row.setAttribute("data-id", pid);
      row.innerHTML = `<div class="name">${esc(pid)}${p?.name ? ` — ${esc(p.name)}` : ""}</div>
        <button class="trash" title="Remove">🗑</button>`;
      row.querySelector("button.trash").onclick = () => {
        categoriesDraft[cat] = (categoriesDraft[cat] || []).filter(x => x !== pid);
        renderCategoryProducts();
        renderCategoriesList();
      };
      wrap.appendChild(row);
    });
    box.appendChild(wrap);

    // sortable
    try {
      if (window.Sortable) {
        if (catSortable) catSortable.destroy();
        catSortable = window.Sortable.create(wrap, {
          animation: 120,
          onEnd: () => {
            const newIds = $$("#catProducts .mg-cat-prod-row").map(n => n.getAttribute("data-id")).filter(Boolean);
            categoriesDraft[cat] = newIds;
            renderCategoriesList();
          }
        });
      }
    } catch { }
  }

  function addProductToCategoryBySearch() {
    const q = ($("#catAddSearch")?.value || "").trim().toLowerCase();
    if (!q || !activeCategory) return;
    const products = getProductList();
    const hit = products.find(p => p.id.toLowerCase() === q) ||
      products.find(p => (p.name || "").toLowerCase().includes(q)) ||
      products.find(p => p.id.toLowerCase().includes(q));
    if (!hit) { alert("No product match"); return; }
    const ids = categoriesDraft[activeCategory] || (categoriesDraft[activeCategory] = []);
    if (ids.includes(hit.id)) { $("#catAddSearch").value = ""; return; }
    ids.push(hit.id);
    $("#catAddSearch").value = "";
    renderCategoryProducts();
    renderCategoriesList();
  }


  // ---- Category product picker modal (add/remove products) ----
  function _catPickerEls() {
    return {
      modal: $("#catProductPickerModal"),
      backdrop: $("#catProductPickerBackdrop"),
      close: $("#catProductPickerClose"),
      title: $("#catProductPickerTitle"),
      search: $("#catProductPickerSearch"),
      body: $("#catProductPickerBody")
    };
  }

  function closeCatProductPickerModal() {
    const { modal } = _catPickerEls();
    if (!modal) return;
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
  }

  function openCatProductPickerModal() {
    if (!activeCategory) return alert("Select a category first.");
    const { modal, title, search } = _catPickerEls();
    if (!modal) return alert("Modal missing in index.html");
    if (title) title.textContent = `Manage products in: ${activeCategory}`;
    if (search) search.value = "";
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    renderCatProductPicker();
  }

  function renderCatProductPicker() {
    const { body, search } = _catPickerEls();
    if (!body) return;
    const q = String(search?.value || "").trim().toLowerCase();
    const cat = activeCategory;
    const ids = categoriesDraft?.[cat] || [];
    const inCat = new Set((ids || []).map(x => String(x)));

    let list = getProductList();
    if (q) {
      list = list.filter(p =>
        String(p.id || "").toLowerCase().includes(q) ||
        String(p.name || "").toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id));

    body.innerHTML = "";
    for (const p of list) {
      const added = inCat.has(String(p.id));
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${esc(p.id)}</td>
        <td>${esc(p.name || "")}</td>
        <td>${added ? "Yes" : "No"}</td>
        <td style="text-align:right;">
          <button class="mgmt-btn ${added ? "danger" : "success"}" data-act="1">${added ? "Remove" : "Add"}</button>
        </td>
      `;
      tr.querySelector('[data-act="1"]').onclick = () => {
        if (!categoriesDraft) categoriesDraft = {};
        if (!Array.isArray(categoriesDraft[cat])) categoriesDraft[cat] = [];
        if (added) {
          categoriesDraft[cat] = categoriesDraft[cat].filter(x => String(x) !== String(p.id));
        } else {
          if (!categoriesDraft[cat].some(x => String(x) === String(p.id))) categoriesDraft[cat].push(String(p.id));
        }
        setDirty(true);
        renderCategoriesList();
        renderCategoryProducts();
        renderCatProductPicker(); // re-render to update buttons
      };
      body.appendChild(tr);
    }
  }



  // ---- Category options modal (rename + icon URLs) ----
  function _catMetaEls() {
    return {
      modal: $("#catMetaModal"),
      backdrop: $("#catMetaBackdrop"),
      close: $("#catMetaClose"),
      cancel: $("#catMetaCancel"),
      save: $("#catMetaSave"),
      current: $("#catMetaCurrentName"),
      newName: $("#catMetaNewName"),
      light: $("#catMetaIconLight"),
      dark: $("#catMetaIconDark"),
    };
  }

  function closeCatMetaModal() {
    const { modal } = _catMetaEls();
    if (!modal) return;
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    catMetaTarget = null;
  }

  function openCatMetaModal(catName) {
    const { modal, current, newName, light, dark } = _catMetaEls();
    if (!modal) return alert("Category options modal missing in index.html");
    const cat = String(catName || "").trim();
    if (!cat) return;

    catMetaTarget = cat;

    if (current) current.textContent = cat;
    if (newName) newName.value = cat;

    const iconRaw = (categoriesMetaDraft && categoriesMetaDraft[cat])
      ? (typeof categoriesMetaDraft[cat] === "string" ? categoriesMetaDraft[cat] : categoriesMetaDraft[cat].icon)
      : "";
    const dual = _parseDualIcon(iconRaw || "");
    if (light) light.value = dual.light || "";
    if (dark) dark.value = dual.dark || "";

    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
  }

  async function saveCatMetaModal() {
    const { newName, light, dark } = _catMetaEls();
    const oldName = String(catMetaTarget || "").trim();
    if (!oldName) return closeCatMetaModal();

    const nextName = String(newName?.value || "").trim();
    if (!nextName) return alert("New name cannot be empty.");

    const iconStr = _buildIconStringFromInputs(light?.value || "", dark?.value || "");

    const payload = {
      category: oldName,
      newName: nextName,
      icon: iconStr,          // backward compat (server accepts)
      iconLightUrl: String(light?.value || "").trim(),
      iconDarkUrl: String(dark?.value || "").trim()
    };

    const r = await fetch(`${apiBase()}/admin/catalog/category-meta`, {
      method: "POST",
      headers: authHead(true),
      body: JSON.stringify(payload)
    });
    const out = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(out?.error || `POST /admin/catalog/category-meta failed (${r.status})`);

    // Keep selection if we renamed the active category
    if (activeCategory === oldName) activeCategory = nextName;

    pushHistory(`Category updated: ${oldName}${oldName !== nextName ? " → " + nextName : ""}`);
    closeCatMetaModal();
    await reloadAll(true);
  }


  async function saveCategories() {
    if (!categoriesDraft) throw new Error("No categories loaded");
    await putCategoryLists(categoriesDraft);
    pushHistory("Saved categories");
    await reloadAll(true);
  }

  // ---- Public show/hide/install ----
  window.productsUiHide = function () {
    const tab = $("#productsTab");
    if (tab) {
      tab.classList.add("hidden");
      tab.style.display = "none";
      tab.setAttribute("aria-hidden", "true");
      // Ensure it cannot intercept clicks even if some CSS keeps it around
      tab.style.pointerEvents = "none";
    }
  };
  window.productsUiShow = async function () {
    const tab = $("#productsTab");
    if (!tab) throw new Error("productsTab missing in index.html");
    tab.classList.remove("hidden");
    tab.style.display = "";
    tab.style.pointerEvents = "";
    tab.setAttribute("aria-hidden", "false");

    // Always reflect the server's current storage mode when opening the tab.
    try { await refreshCatalogFileModeUi(); } catch { }
    if (!installed) {
      installed = true;
      // subtabs
      $("#mgProdSubCatalogue")?.addEventListener("click", () => showPane("catalogue"));
      $("#mgProdSubCategories")?.addEventListener("click", () => showPane("categories"));
      const pref = localStorage.getItem("mg_products_subtab") || "catalogue";
      showPane(pref);

      // history collapse
      const hist = $("#prodHistory");
      const isCollapsed = localStorage.getItem(stateKey) === "1";
      if (hist && isCollapsed) hist.classList.add("collapsed");
      $("#histToggle")?.addEventListener("click", () => {
        hist?.classList.toggle("collapsed");
        localStorage.setItem(stateKey, hist?.classList.contains("collapsed") ? "1" : "0");
      });
      $("#histPrev")?.addEventListener("click", () => {
        histIndex = Math.max(-1, histIndex - 1);
        const h = history[histIndex];
        if (h?.productId) openEditor(h.productId);
      });
      $("#histNext")?.addEventListener("click", () => {
        histIndex = Math.min(history.length - 1, histIndex + 1);
        const h = history[histIndex];
        if (h?.productId) openEditor(h.productId);
      });

      // catalogue controls
      $("#prodReload")?.addEventListener("click", () => actionRunner(reloadAll, "Reload catalogue"));
      $("#prodNew")?.addEventListener("click", () => actionRunner(async () => { newProduct(); }, "New product"));
      $("#catalogDownload")?.addEventListener("click", () => actionRunner(downloadCatalogs, "Download catalogs"));
      $("#prodSearch")?.addEventListener("input", renderCatalogue);
      installCatalogueSortHeaders();
      $("#prodSave")?.addEventListener("click", () => actionRunner(saveActiveProduct, "Save product"));
      $("#prodDiscard")?.addEventListener("click", () => {
        if (!editorBaseline) return;
        openEditor(editorBaseline.id);
        setDirty(false);
        pushHistory("Discarded changes");
      });

      // categories controls
      $("#catReload")?.addEventListener("click", () => actionRunner(reloadAll, "Reload categories"));
      $("#catSave")?.addEventListener("click", () => actionRunner(saveCategories, "Save categories"));
      $("#catSearch")?.addEventListener("input", renderCategoriesList);
      $("#catAddSearch")?.addEventListener("input", renderCategoryProducts);
      $("#catAddProductBtn")?.addEventListener("click", () => openCatProductPickerModal());

      // modal events
      $("#catProductPickerClose")?.addEventListener("click", closeCatProductPickerModal);
      $("#catProductPickerBackdrop")?.addEventListener("click", closeCatProductPickerModal);
      $("#catProductPickerSearch")?.addEventListener("input", renderCatProductPicker);
      $("#catMetaClose")?.addEventListener("click", closeCatMetaModal);
      $("#catMetaCancel")?.addEventListener("click", closeCatMetaModal);
      $("#catMetaBackdrop")?.addEventListener("click", closeCatMetaModal);
      $("#catMetaSave")?.addEventListener("click", () => actionRunner(saveCatMetaModal, "Save category options"));
    }

    // load data if needed
    if (!bundle) await reloadAll(true);
  };
})();

// ===== Accounting tab (local-first, uses Orders tab costs as source of truth) =====
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]));

  const cats = [
    "Advertising", "Software", "Hosting", "Professional services", "Equipment", "Packaging", "Shipping", "Banking/Fees", "Tax", "Other"
  ];

  function pid() { try { return mgGetActiveProjectId?.() || "default"; } catch { return "default"; } }
  function kSettings() { return `mg_acc_settings_${pid()}`; }
  function kExpenses() { return `mg_acc_expenses_${pid()}`; }

  function loadSettings() {
    const d = { vatStartDate: "", taxReservePct: 30, cashBuffer: 500, adMaxPctGrossProfit: 40 };
    try {
      const raw = localStorage.getItem(kSettings());
      const parsed = raw ? JSON.parse(raw) : {};
      return { ...d, ...(parsed || {}) };
    } catch { return d; }
  }
  function saveSettings(s) { localStorage.setItem(kSettings(), JSON.stringify(s)); }

  function loadExpenses() {
    try { const a = JSON.parse(localStorage.getItem(kExpenses()) || "[]"); return Array.isArray(a) ? a : []; } catch { return []; }
  }
  function saveExpenses(list) { localStorage.setItem(kExpenses(), JSON.stringify(list || [])); }

  function toDateKey(d) {
    if (!d) return "";
    const dt = (d instanceof Date) ? d : new Date(d);
    if (isNaN(dt)) return "";
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const da = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${da}`;
  }

  function moneyEUR(n) {
    const v = Number(n || 0);
    return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function orderDate(o) {
    return o?.paidAt || o?.createdAt || o?.created || o?.date || o?.updatedAt || null;
  }

  function inRange(d, from, to) {
    if (!d) return true;
    const dt = new Date(d);
    if (isNaN(dt)) return true;
    if (from && dt < from) return false;
    if (to && dt > to) return false;
    return true;
  }

  function calcOrdersSummary(orders, settings) {
    const from = state?.filters?.till ? new Date(state.filters.till) : null; // note: your UI labels are swapped; we treat both inclusively
    const to = state?.filters?.since ? new Date(state.filters.since) : null;
    // If the user uses the existing Orders filters, since is latest and to is oldest; normalize:
    let min = null, max = null;
    if (from && !isNaN(from)) min = from;
    if (to && !isNaN(to)) max = to;
    if (min && max && min > max) { const tmp = min; min = max; max = tmp; }

    let revenue = 0, purchase = 0, shipping = 0, stripe = 0, profit = 0, count = 0, vatCount = 0, vatRevenue = 0;
    const vatStart = settings?.vatStartDate ? new Date(settings.vatStartDate) : null;
    orders.forEach(o => {
      const od = orderDate(o);
      if (!inRange(od, min, max)) return;
      const sale = Number(o?.paidEUR || 0);
      const pur = Array.isArray(o?.products) ? o.products.reduce((s, p) => s + Number(p?.expectedPurchase || p?.purchasePrice || 0) * Number(p?.amount || 0), 0) : 0;
      const ship = Number(o?.shipping?.aliExpress || 0) + Number(o?.shipping?.thirdParty1 || 0) + Number(o?.shipping?.thirdParty2 || 0);
      const sf = Number(o?.stripeFeeEUR || 0);
      const prof = sale - (pur + ship + sf);
      revenue += sale; purchase += pur; shipping += ship; stripe += sf; profit += prof; count++;
      if (vatStart && !isNaN(vatStart)) {
        const d = od ? new Date(od) : null;
        if (d && !isNaN(d) && d >= vatStart) { vatCount++; vatRevenue += sale; }
      }
    });
    return { count, revenue, purchase, shipping, stripe, profit, vatCount, vatRevenue };
  }

  function renderKpis(sum, expTotal, settings) {
    const k = $("#accKpis");
    if (!k) return;
    const gross = sum.revenue - (sum.purchase + sum.shipping + sum.stripe);
    const net = gross - expTotal;
    const reserve = Math.max(0, net) * (Number(settings.taxReservePct || 0) / 100);
    const adCapByPct = Math.max(0, gross) * (Number(settings.adMaxPctGrossProfit || 0) / 100);
    k.innerHTML = `
      <div class="mg-acc-kpi"><div class="label">Orders in range</div><div class="value">${sum.count}</div></div>
      <div class="mg-acc-kpi"><div class="label">Revenue (EUR)</div><div class="value">${moneyEUR(sum.revenue)}</div></div>
      <div class="mg-acc-kpi"><div class="label">COGS (buy+ship+fees)</div><div class="value">${moneyEUR(sum.purchase + sum.shipping + sum.stripe)}</div></div>
      <div class="mg-acc-kpi"><div class="label">Gross profit</div><div class="value">${moneyEUR(gross)}</div></div>
      <div class="mg-acc-kpi"><div class="label">Expenses (manual)</div><div class="value">${moneyEUR(expTotal)}</div></div>
      <div class="mg-acc-kpi"><div class="label">Net (pre-tax)</div><div class="value">${moneyEUR(net)}</div></div>
    `;
    const os = $("#accOrdersSummary");
    if (os) {
      os.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px">
          <div><div style="font-size:12px;color:#6b7280">Purchase</div><div style="font-weight:700">€${moneyEUR(sum.purchase)}</div></div>
          <div><div style="font-size:12px;color:#6b7280">Shipping</div><div style="font-weight:700">€${moneyEUR(sum.shipping)}</div></div>
          <div><div style="font-size:12px;color:#6b7280">Stripe fees</div><div style="font-weight:700">€${moneyEUR(sum.stripe)}</div></div>
          <div><div style="font-size:12px;color:#6b7280">Profit</div><div style="font-weight:700">€${moneyEUR(sum.profit)}</div></div>
        </div>
        ${settings.vatStartDate ? `<div style="margin-top:10px;color:#6b7280;font-size:12px">VAT period orders: <b>${sum.vatCount}</b>, VAT period revenue: <b>€${moneyEUR(sum.vatRevenue)}</b> (from ${esc(settings.vatStartDate)})</div>` : ""}
      `;
    }
    const g = $("#accGuidance");
    if (g) {
      g.innerHTML = `
        <div style="display:grid;gap:8px">
          <div style="color:#6b7280;font-size:12px">This is operational guidance (cash & risk), not legal advice.</div>
          <div><b>Suggested tax reserve:</b> €${moneyEUR(reserve)} (${Number(settings.taxReservePct || 0)}%)</div>
          <div><b>Ad spend cap (policy):</b> €${moneyEUR(adCapByPct)} (${Number(settings.adMaxPctGrossProfit || 0)}% of gross profit)</div>
          <div><b>Cash buffer (policy):</b> €${moneyEUR(settings.cashBuffer || 0)}</div>
        </div>
      `;
    }
  }

  function expenseCategoriesSelect(sel) {
    if (!sel) return;
    sel.innerHTML = `<option value="">All categories</option>` + cats.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join("");
  }

  function renderExpenseForm(e) {
    const root = $("#accExpForm");
    if (!root) return;
    const ex = e || { id: "", date: toDateKey(new Date()), vendor: "", category: "Advertising", amount: 0, currency: "EUR", fxRate: 1, eur: 0, note: "" };
    root.innerHTML = `
      <div class="mg-acc-field"><label>Date</label><input id="accF_date" type="date" value="${esc(ex.date || "")}" /></div>
      <div class="mg-acc-field"><label>Vendor</label><input id="accF_vendor" value="${esc(ex.vendor || "")}" placeholder="Meta, Google, Hetzner…" /></div>
      <div class="mg-acc-field"><label>Category</label><select id="accF_category">${cats.map(c => `<option ${c === ex.category ? "selected" : ""}>${esc(c)}</option>`).join("")}</select></div>
      <div class="mg-acc-field"><label>Amount</label><input id="accF_amount" type="number" step="0.01" value="${esc(ex.amount ?? 0)}" /></div>
      <div class="mg-acc-field"><label>Currency</label><select id="accF_currency"><option ${ex.currency === "EUR" ? "selected" : ""}>EUR</option><option ${ex.currency === "USD" ? "selected" : ""}>USD</option><option ${ex.currency === "GBP" ? "selected" : ""}>GBP</option></select></div>
      <div class="mg-acc-field"><label>FX rate to EUR</label><input id="accF_fx" type="number" step="0.0001" value="${esc(ex.fxRate ?? 1)}" /></div>
      <div class="mg-acc-field"><label>Amount (EUR)</label><input id="accF_eur" type="number" step="0.01" value="${esc(ex.eur ?? 0)}" /></div>
      <div class="mg-acc-field"><label>Note</label><textarea id="accF_note" placeholder="campaign, invoice no., purpose…">${esc(ex.note || "")}</textarea></div>
    `;
    // live EUR calc
    const amt = $("#accF_amount");
    const cur = $("#accF_currency");
    const fx = $("#accF_fx");
    const eur = $("#accF_eur");
    const recalc = () => {
      const a = Number(amt?.value || 0);
      const c = String(cur?.value || "EUR");
      const r = Number(fx?.value || 1);
      if (c === "EUR") eur.value = String(a || 0);
      else eur.value = String((a || 0) * (r || 0));
    };
    [amt, cur, fx].forEach(n => n && n.addEventListener("input", recalc));
  }

  let installed = false;
  let activePane = "dashboard";
  let expenses = [];
  let activeExpenseId = null;

  function showPane(name) {
    activePane = name;
    localStorage.setItem(`mg_acc_subtab_${pid()}`, name);
    $$("#accountingTab .mg-acc-pane").forEach(p => p.classList.toggle("hidden", p.getAttribute("data-pane") !== name));
    $$("#accountingTab .mg-subtab").forEach(b => b.classList.toggle("active", b.getAttribute("data-subtab") === name));
  }

  function filterExpenses() {
    const q = ($("#accExpSearch")?.value || "").trim().toLowerCase();
    const cat = $("#accExpCat")?.value || "";
    const fromK = $("#accExpFrom")?.value || "";
    const toK = $("#accExpTo")?.value || "";
    const from = fromK ? new Date(fromK) : null;
    const to = toK ? new Date(toK) : null;
    return (expenses || []).filter(e => {
      if (cat && e.category !== cat) return false;
      if (q) {
        const blob = `${e.vendor || ""} ${e.category || ""} ${e.note || ""}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      if (from || to) {
        const d = e.date ? new Date(e.date) : null;
        if (d && !inRange(d, from, to)) return false;
      }
      return true;
    }).sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  }

  function renderExpenses() {
    const tb = $("#accExpTbody");
    if (!tb) return;
    const list = filterExpenses();
    tb.innerHTML = list.map(e => {
      const active = e.id === activeExpenseId;
      const eur = Number(e.eur || (e.currency === "EUR" ? e.amount : (Number(e.amount || 0) * Number(e.fxRate || 0))));
      return `
        <tr class="${active ? "active" : ""}" data-id="${esc(e.id)}">
          <td>${esc(e.date || "")}</td>
          <td>${esc(e.vendor || "")}</td>
          <td>${esc(e.category || "")}</td>
          <td>${esc(String(e.amount || 0))} ${esc(e.currency || "EUR")}</td>
          <td>€${moneyEUR(eur)}</td>
          <td style="text-align:right"><button class="Buttony" data-open>Open</button></td>
        </tr>`;
    }).join("");
    tb.querySelectorAll("tr").forEach(tr => {
      tr.addEventListener("click", () => {
        const id = tr.getAttribute("data-id");
        openExpense(id);
      });
    });
  }

  function openExpense(id) {
    const e = expenses.find(x => x.id === id);
    if (!e) return;
    activeExpenseId = id;
    $("#accExpEditorTitle").textContent = `Expense`;
    renderExpenseForm(e);
    renderExpenses();
  }

  function newExpense() {
    const id = `ex_${Date.now()}`;
    const e = { id, date: toDateKey(new Date()), vendor: "", category: "Advertising", amount: 0, currency: "EUR", fxRate: 1, eur: 0, note: "" };
    expenses.unshift(e);
    saveExpenses(expenses);
    activeExpenseId = id;
    renderExpenseForm(e);
    renderExpenses();
  }

  function readExpenseForm() {
    const id = activeExpenseId;
    if (!id) return null;
    const e = expenses.find(x => x.id === id);
    if (!e) return null;
    e.date = $("#accF_date")?.value || "";
    e.vendor = $("#accF_vendor")?.value || "";
    e.category = $("#accF_category")?.value || "Other";
    e.amount = Number($("#accF_amount")?.value || 0);
    e.currency = $("#accF_currency")?.value || "EUR";
    e.fxRate = Number($("#accF_fx")?.value || 1);
    e.eur = Number($("#accF_eur")?.value || 0);
    e.note = $("#accF_note")?.value || "";
    return e;
  }

  function exportCsv() {
    const rows = [
      ["id", "date", "vendor", "category", "amount", "currency", "fxRate", "eur", "note"],
      ...(expenses || []).map(e => [
        e.id, e.date, e.vendor, e.category, e.amount, e.currency, e.fxRate, e.eur, (e.note || "").replace(/\r?\n/g, " ")
      ])
    ];
    const csv = rows.map(r => r.map(v => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(",")).join("\n");
    downloadTextFile(`expenses_${toDateKey(new Date())}.csv`, csv, "text/csv;charset=utf-8");
  }

  function renderSettingsForm(s) {
    const root = $("#accSettingsForm");
    if (!root) return;
    root.innerHTML = `
      <div class="mg-acc-field"><label>VAT effective date (leave empty until registered)</label><input id="accS_vat" type="date" value="${esc(s.vatStartDate || "")}" /></div>
      <div class="mg-acc-field"><label>Tax reserve (policy % of net profit)</label><input id="accS_tax" type="number" step="1" value="${esc(s.taxReservePct ?? 30)}" /></div>
      <div class="mg-acc-field"><label>Cash buffer (EUR)</label><input id="accS_buf" type="number" step="1" value="${esc(s.cashBuffer ?? 500)}" /></div>
      <div class="mg-acc-field"><label>Ad spend cap (policy % of gross profit)</label><input id="accS_ad" type="number" step="1" value="${esc(s.adMaxPctGrossProfit ?? 40)}" /></div>
      <div style="display:flex;gap:8px;align-items:center;margin-top:6px">
        <button class="Buttony" id="accS_save" type="button">Save settings</button>
        <span style="font-size:12px;color:#6b7280">Saved per project/server.</span>
      </div>
    `;
    $("#accS_save")?.addEventListener("click", () => {
      const ns = {
        vatStartDate: $("#accS_vat")?.value || "",
        taxReservePct: Number($("#accS_tax")?.value || 0),
        cashBuffer: Number($("#accS_buf")?.value || 0),
        adMaxPctGrossProfit: Number($("#accS_ad")?.value || 0)
      };
      saveSettings(ns);
      toast?.("Saved", "Accounting settings saved");
      // refresh dashboard
      try { renderDashboard(); } catch { }
    });
  }

  function totalExpensesInRange() {
    // Use same range inputs as expenses filters if set; else total all
    const fromK = $("#accExpFrom")?.value || "";
    const toK = $("#accExpTo")?.value || "";
    const from = fromK ? new Date(fromK) : null;
    const to = toK ? new Date(toK) : null;
    let sum = 0;
    (expenses || []).forEach(e => {
      const d = e.date ? new Date(e.date) : null;
      if (from || to) { if (d && !inRange(d, from, to)) return; }
      const eur = Number(e.eur || (e.currency === "EUR" ? e.amount : (Number(e.amount || 0) * Number(e.fxRate || 0))));
      sum += eur;
    });
    return sum;
  }

  async function renderDashboard() {
    const s = loadSettings();
    if (!state.orders || !Array.isArray(state.orders) || state.orders.length === 0) {
      try { await safeEnsureLogin(); state.orders = await loadOrdersFromServer(); } catch { }
    }
    const sum = calcOrdersSummary(state.orders || [], s);
    const expTotal = totalExpensesInRange();
    renderKpis(sum, expTotal, s);
  }

  // Public show/hide
  window.accountingUiHide = function () {
    const tab = $("#accountingTab");
    if (tab) { tab.classList.add("hidden"); tab.style.display = "none"; tab.style.pointerEvents = "none"; tab.setAttribute("aria-hidden", "true"); }
  };
  window.accountingUiShow = async function () {
    const tab = $("#accountingTab");
    if (!tab) throw new Error("accountingTab missing in index.html");
    tab.classList.remove("hidden"); tab.style.display = ""; tab.style.pointerEvents = ""; tab.setAttribute("aria-hidden", "false");

    if (!installed) {
      installed = true;
      // subtabs
      $("#mgAccSubDash")?.addEventListener("click", () => showPane("dashboard"));
      $("#mgAccSubExpenses")?.addEventListener("click", () => showPane("expenses"));
      $("#mgAccSubSettings")?.addEventListener("click", () => showPane("settings"));
      const pref = localStorage.getItem(`mg_acc_subtab_${pid()}`) || "dashboard";
      showPane(pref);

      // expenses
      expenseCategoriesSelect($("#accExpCat"));
      $("#accExpSearch")?.addEventListener("input", renderExpenses);
      $("#accExpCat")?.addEventListener("change", renderExpenses);
      $("#accExpFrom")?.addEventListener("change", () => { renderExpenses(); renderDashboard(); });
      $("#accExpTo")?.addEventListener("change", () => { renderExpenses(); renderDashboard(); });
      $("#accExpNew")?.addEventListener("click", newExpense);
      $("#accExpSave")?.addEventListener("click", () => {
        const e = readExpenseForm();
        if (!e) return;
        saveExpenses(expenses);
        toast?.("Saved", "Expense saved");
        renderExpenses();
        renderDashboard();
      });
      $("#accExpDelete")?.addEventListener("click", () => {
        if (!activeExpenseId) return;
        const ok = confirm("Delete this expense?");
        if (!ok) return;
        expenses = expenses.filter(x => x.id !== activeExpenseId);
        saveExpenses(expenses);
        activeExpenseId = expenses[0]?.id || null;
        if (activeExpenseId) renderExpenseForm(expenses.find(x => x.id === activeExpenseId)); else renderExpenseForm(null);
        renderExpenses();
        renderDashboard();
      });
      $("#accExpExport")?.addEventListener("click", exportCsv);

      // dashboard
      $("#accRecalc")?.addEventListener("click", () => actionRunner(async () => { await renderDashboard(); }, "Recalculate"));
    }

    // reload per project
    expenses = loadExpenses();
    if (!expenses.length) { /* no-op */ }
    activeExpenseId = expenses[0]?.id || null;
    expenseCategoriesSelect($("#accExpCat"));
    renderExpenses();
    renderExpenseForm(activeExpenseId ? expenses.find(x => x.id === activeExpenseId) : null);
    renderSettingsForm(loadSettings());
    await renderDashboard();
  };
})();

