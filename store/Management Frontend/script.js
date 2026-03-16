// ---- Early Topbar Bootstrap (prevents empty header if later code errors or mount isn't reached) ----
(function mgmtEarlyTopbarBootstrap(){
  try {
    if (typeof document === 'undefined') return;
    // Ensure header container exists
    let header = document.querySelector('header.top-topbar');
    if (!header) {
      header = document.createElement('header');
      header.className = 'top-topbar';
      // Insert at top of body
      (document.body || document.documentElement).insertBefore(header, (document.body || document.documentElement).firstChild);
    }
    let container = header.querySelector('.container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'container';
      header.appendChild(container);
    }
    // If something already mounted, do nothing
    if (container.querySelector('.mgmt-topbar-actions') || container.querySelector('#mgOrdersTabBtn')) return;

    container.classList.add('mgmt-topbar-container');

    // Project selector wrap
    const projWrap = document.createElement('div');
    projWrap.className = 'mgmt-project-wrap';
    const sel = document.createElement('select');
    sel.className = 'mgmt-project-select';
    sel.id = 'mgProjectSelect';
    const opt = document.createElement('option');
    opt.value = 'default';
    opt.textContent = 'SnagletShop';
    sel.appendChild(opt);
    const manageBtn = document.createElement('button');
    manageBtn.className = 'mgmt-project-btn';
    manageBtn.id = 'mgProjectManage';
    manageBtn.title = 'Manage projects';
    manageBtn.textContent = '⋯';
    projWrap.appendChild(sel);
    projWrap.appendChild(manageBtn);

    const brandWrap = document.createElement('div');
    brandWrap.className = 'mgmt-brand-wrap';

    const actions = document.createElement('div');
    actions.className = 'mgmt-topbar-actions';

    function mkBtn(text, id, act, extraClass){
      const b = document.createElement('button');
      b.className = 'mgmt-btn' + (extraClass ? (' ' + extraClass) : '');
      if (id) b.id = id;
      if (act) b.dataset.act = act;
      b.textContent = text;
      return b;
    }

    actions.appendChild(mkBtn('Refresh', null, 'refresh'));
    const searchBtn = mkBtn('Search', 'mgPaletteBtn', 'palette');
    searchBtn.title = 'Search (Ctrl+K)';
    actions.appendChild(searchBtn);

    const recentBtn = document.createElement('button');
    recentBtn.className = 'mg-recent-btn';
    recentBtn.id = 'mgRecentBtn';
    recentBtn.type = 'button';
    recentBtn.title = 'Recent activity';
    recentBtn.textContent = 'Recent';
    actions.appendChild(recentBtn);

    const fresh = document.createElement('span');
    fresh.className = 'mgmt-fresh';
    fresh.id = 'mgFreshBadge';
    fresh.title = 'Data freshness';
    fresh.textContent = 'Orders: —';
    actions.appendChild(fresh);

    actions.appendChild(mkBtn('Orders', 'mgOrdersTabBtn', 'orders'));
    actions.appendChild(mkBtn('Graphs', 'mgGraphsTabBtn', 'graphs'));
    actions.appendChild(mkBtn('Analytics', 'mgAnalyticsTabBtn', 'analytics', 'primary'));
    // Recommendations tab (embedded in index.html)
    actions.appendChild(mkBtn('Recs', 'mgRecsTabBtn', 'recs'));
    actions.appendChild(mkBtn('Incentives', 'mgIncentivesTabBtn', 'incentives'));
    actions.appendChild(mkBtn('Profit', 'mgProfitTabBtn', 'profit'));
    actions.appendChild(mkBtn('Email', 'mgEmailTabBtn', 'email'));
    actions.appendChild(mkBtn('Features', 'mgFeaturesTabBtn', 'features'));
    actions.appendChild(mkBtn('Ops', 'mgOpsTabBtn', 'ops'));

    const settingsBtn = mkBtn('⚙', null, 'settings');
    settingsBtn.title = 'Settings';
    actions.appendChild(settingsBtn);

    const densityBtn = mkBtn('Comfort', 'mgDensityToggle', 'density');
    densityBtn.title = 'Switch to compact density';
    actions.appendChild(densityBtn);

    const themeBtn = mkBtn('Light', 'mgThemeToggle', 'theme');
    themeBtn.title = 'Switch to dark mode';
    themeBtn.setAttribute('aria-pressed','false');
    actions.appendChild(themeBtn);

    const sep1 = document.createElement('div');
    sep1.className = 'mgmt-sep';
    actions.appendChild(sep1);

    actions.appendChild(mkBtn('Products', 'mgProductsTabBtn', 'products'));
    actions.appendChild(mkBtn('Accounting', 'mgAccountingTabBtn', 'accounting'));
    actions.appendChild(mkBtn('Tariffs', 'mgTariffsTabBtn', 'tariffs'));
    actions.appendChild(mkBtn('Sync', null, 'sync'));

    const sep2 = document.createElement('div');
    sep2.className = 'mgmt-sep';
    actions.appendChild(sep2);

    const toolsBtn = mkBtn('Tools ▾', 'mgToolsBtn', 'tools');
    actions.appendChild(toolsBtn);

    const sep3 = document.createElement('div');
    sep3.className = 'mgmt-sep';
    actions.appendChild(sep3);

    actions.appendChild(mkBtn('Logout', null, 'logout', 'danger'));

    const toolsPop = document.createElement('div');
    toolsPop.className = 'mgmt-tools-pop';
    toolsPop.id = 'mgToolsPop';
    toolsPop.hidden = true;

    function toolItem(label, tool){
      const b = document.createElement('button');
      b.className = 'mgmt-btn';
      b.dataset.tool = tool;
      b.textContent = label;
      return b;
    }
    toolsPop.appendChild(toolItem('Health','health'));
    toolsPop.appendChild(toolItem('Rates','rates'));
    toolsPop.appendChild(toolItem('Dupes','dupes'));
    toolsPop.appendChild(toolItem('Excel','excel'));
    toolsPop.appendChild(toolItem('Print slip','print'));
    const tSep = document.createElement('div');
    tSep.className = 'mgmt-tools-sep';
    toolsPop.appendChild(tSep);
    toolsPop.appendChild(toolItem('Copy address','copy-addr'));
    toolsPop.appendChild(toolItem('Copy summary','copy-sum'));

    actions.appendChild(toolsPop);

    // Insert into header container
    container.appendChild(projWrap);
    container.appendChild(brandWrap);
    container.appendChild(actions);
  } catch (e) {
    // Never block app bootstrap
    try { console.error('[mgmtEarlyTopbarBootstrap] failed', e); } catch {}
  }
})();


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

function mgGetSessionToken() {
  try { return String(sessionStorage.getItem("api_token") || ""); } catch { return ""; }
}
function mgSetSessionToken(token) {
  try {
    const v = String(token || "");
    if (v) sessionStorage.setItem("api_token", v);
    else sessionStorage.removeItem("api_token");
  } catch { }
  try { localStorage.removeItem("api_token"); } catch { }
}
function mgGetSessionTokenExpMs() {
  try { return Number(sessionStorage.getItem("api_token_exp_ms") || 0); } catch { return 0; }
}
function mgSetSessionTokenExpMs(expMs) {
  try {
    const n = Number(expMs || 0);
    if (n > 0) sessionStorage.setItem("api_token_exp_ms", String(n));
    else sessionStorage.removeItem("api_token_exp_ms");
  } catch { }
  try { localStorage.removeItem("api_token_exp_ms"); } catch { }
}
function mgGetSessionTokenSetAtMs() {
  try { return Number(sessionStorage.getItem("api_token_set_at_ms") || 0); } catch { return 0; }
}
function mgSetSessionTokenSetAtMs(ms) {
  try {
    const n = Number(ms || 0);
    if (n > 0) sessionStorage.setItem("api_token_set_at_ms", String(n));
    else sessionStorage.removeItem("api_token_set_at_ms");
  } catch { }
  try { localStorage.removeItem("api_token_set_at_ms"); } catch { }
}
function mgClearSessionToken() {
  try { sessionStorage.removeItem("api_token"); } catch { }
  try { sessionStorage.removeItem("api_token_exp_ms"); } catch { }
  try { sessionStorage.removeItem("api_token_set_at_ms"); } catch { }
  try { localStorage.removeItem("api_token"); } catch { }
  try { localStorage.removeItem("api_token_exp_ms"); } catch { }
  try { localStorage.removeItem("api_token_set_at_ms"); } catch { }
}

function mgEnsureDefaultProject() {
  const projects = mgLoadProjects();
  if (projects.length) return projects;

  const p = {
    id: "default",
    name: "Default",
    api_base: localStorage.getItem("api_base") || "",
    admin_code: localStorage.getItem("admin_code") || "",
    // optional remembered creds
    admin_user: localStorage.getItem("admin_user") || "",
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
  mgClearSessionToken();
  if (project.admin_user != null) localStorage.setItem("admin_user", String(project.admin_user || ""));
  try { localStorage.removeItem("admin_pass"); } catch { }
}

function mgPersistActiveProjectFromLocalStorage() {
  const projects = mgEnsureDefaultProject();
  const activeId = mgGetActiveProjectId();
  const idx = projects.findIndex(p => p.id === activeId);
  if (idx < 0) return;
  const p = projects[idx];
  p.api_base = localStorage.getItem("api_base") || "";
  p.admin_code = localStorage.getItem("admin_code") || "";
  p.admin_user = localStorage.getItem("admin_user") || "";
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
    mgClearSessionToken();
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
    const tok = mgGetSessionToken();
    if (!tok) return false;

    const expMs = mgGetSessionTokenExpMs();
    if (expMs > 0) return Date.now() < expMs;

    // If exp wasn't stored (older versions), assume ~55 minutes from set time.
    const setAt = mgGetSessionTokenSetAtMs();
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

    const __now = Date.now();
    mgSetSessionToken(token);
    mgSetSessionTokenSetAtMs(__now);
    if (expiresIn > 0) {
      // small safety margin
      mgSetSessionTokenExpMs(__now + (expiresIn * 1000) - 15000);
    } else {
      mgSetSessionTokenExpMs(0);
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

// ===== Analytics tab (engagement) =====
(() => {
  "use strict";

  const $ = (sel) => document.querySelector(sel);
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;");
  const money = (n) => {
    const x = Number(n || 0);
    return (Number.isFinite(x) ? x : 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
  };

  function isoDay(d) {
    const x = (d instanceof Date) ? d : new Date(d);
    if (!x || isNaN(x)) return "";
    return x.toISOString().slice(0, 10);
  }

  function setDefaultRange() {
    // Prefer remembered UI state
    try {
      const preset = localStorage.getItem("mgAnRangePreset") || "30d";
      const f0 = localStorage.getItem("mgAnFrom") || "";
      const t0 = localStorage.getItem("mgAnTo") || "";
      const f = document.getElementById("mgAnFrom");
      const t = document.getElementById("mgAnTo");
      const rp = document.getElementById("mgAnRange");
      if (rp && !rp.value) rp.value = preset;

      if (preset === "custom" && f0 && t0) {
        if (f && !f.value) f.value = f0;
        if (t && !t.value) t.value = t0;
        return;
      }
    } catch { }

    // Default: last 30 days
    const to = new Date();
    const from = new Date(Date.now() - 30 * 86400000);
    const f = document.getElementById("mgAnFrom");
    const t = document.getElementById("mgAnTo");
    if (f && !f.value) f.value = isoDay(from);
    if (t && !t.value) t.value = isoDay(to);
  }

  function applyRangePreset(preset) {
    const p = String(preset || "30d");
    const day = 86400000;
    const to = new Date();
    let from = new Date(Date.now() - 30 * day);
    if (p === "7d") from = new Date(Date.now() - 7 * day);
    if (p === "10d") from = new Date(Date.now() - 10 * day);
    if (p === "30d") from = new Date(Date.now() - 30 * day);

    const f = document.getElementById("mgAnFrom");
    const t = document.getElementById("mgAnTo");
    if (f) f.value = isoDay(from);
    if (t) t.value = isoDay(to);

    try {
      localStorage.setItem("mgAnRangePreset", p);
      localStorage.setItem("mgAnFrom", isoDay(from));
      localStorage.setItem("mgAnTo", isoDay(to));
    } catch { }
  }

  function rememberAnalyticsUi() {
    try {
      const from = document.getElementById("mgAnFrom")?.value || "";
      const to = document.getElementById("mgAnTo")?.value || "";
      const preset = document.getElementById("mgAnRange")?.value || "custom";
      const bucket = document.getElementById("mgAnBucket")?.value || "day";
      const metric = document.getElementById("mgAnTopMetric")?.value || "views";
      const includeFaulty = document.getElementById("mgAnIncludeFaulty")?.checked ? "1" : "0";
      localStorage.setItem("mgAnRangePreset", preset);
      if (from) localStorage.setItem("mgAnFrom", from);
      if (to) localStorage.setItem("mgAnTo", to);
      localStorage.setItem("mgAnBucket", bucket);
      localStorage.setItem("mgAnTopMetric", metric);
      localStorage.setItem("mgAnIncludeFaulty", includeFaulty);
    } catch { }
  }

  async function renderAnalytics() {
    if (!window.adminApi?.engagementSummary) throw new Error("engagementSummary API missing");

    const from = document.getElementById("mgAnFrom")?.value || "";
    const to = document.getElementById("mgAnTo")?.value || "";
    const bucket = document.getElementById("mgAnBucket")?.value || "day";
    const metric = document.getElementById("mgAnTopMetric")?.value || "views";
    const includeFaulty = !!document.getElementById("mgAnIncludeFaulty")?.checked;

    const summary = await window.adminApi.engagementSummary({
      from: from ? new Date(from).toISOString() : undefined,
      to: to ? new Date(to).toISOString() : undefined,
      bucket,
      includeFaulty
    });

    const top = await window.adminApi.engagementTopProducts({
      from: from ? new Date(from).toISOString() : undefined,
      to: to ? new Date(to).toISOString() : undefined,
      metric,
      limit: 30,
      includeFaulty
    });

    // Backend shape: { ok, settings, totals, series }
    const series = Array.isArray(summary?.series) ? summary.series : (Array.isArray(summary?.rows) ? summary.rows : []);
    const totalsIn = (summary && typeof summary === "object" && summary.totals && typeof summary.totals === "object") ? summary.totals : {};
    const totals = {
      views: Number(totalsIn.views || 0),
      clicks: Number(totalsIn.clicks || 0),
      addToCart: Number(totalsIn.addToCart || 0),
      faultyViews: Number(totalsIn.faultyViews || 0)
    };

    // Approx overall avg time from bucket averages
    let avgTimeMs = 0;
    try {
      let wSum = 0;
      let wN = 0;
      for (const r of series) {
        const tms = Number(r.avgTimeMs || 0);
        if (!tms) continue;
        const w = Math.max(1, Number(r.views || 0));
        wSum += tms * w;
        wN += w;
      }
      avgTimeMs = wN ? (wSum / wN) : 0;
    } catch { }

    const viewToCart = totals.views ? (totals.addToCart / totals.views) : 0;
    const viewToClick = totals.views ? (totals.clicks / totals.views) : 0;

    const kpi = (label, value) => `<div class="mg-acc-kpi"><div class="label">${esc(label)}</div><div class="value">${esc(value)}</div></div>`;

    const kpisHtml = `
      <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;">
        ${kpi("Views", String(totals.views))}
        ${kpi("Clicks", String(totals.clicks))}
        ${kpi("Add to cart", String(totals.addToCart))}
        ${kpi("Avg time", (avgTimeMs / 1000).toFixed(1) + " s")}
        ${kpi("View → Click", (viewToClick * 100).toFixed(2) + "%")}
        ${kpi("View → Cart", (viewToCart * 100).toFixed(2) + "%")}
        ${kpi("Faulty views", String(totals.faultyViews))}
      </div>
    `;

    const tsHead = `<tr>
      <th>Bucket</th><th>Views</th><th>Clicks</th><th>Add to cart</th><th>Avg time (s)</th><th>Faulty views</th><th>View→Cart</th>
    </tr>`;
    const tsBody = series.map(r => `
      <tr>
        <td>${esc(r.bucket)}</td>
        <td>${Number(r.views || 0)}</td>
        <td>${Number(r.clicks || 0)}</td>
        <td>${Number(r.addToCart || 0)}</td>
        <td>${(Number(r.avgTimeMs || 0) / 1000).toFixed(1)}</td>
        <td>${Number(r.faultyViews || 0)}</td>
        <td>${(Number(r.views || 0) ? ((Number(r.addToCart || 0) / Number(r.views || 1)) * 100) : 0).toFixed(2)}%</td>
      </tr>
    `).join("");

    const topRows = Array.isArray(top?.products) ? top.products : (Array.isArray(top?.rows) ? top.rows : []);
    const topHead = `<tr>
      <th>Product</th><th>Views</th><th>Clicks</th><th>Add to cart</th><th>Avg time (s)</th><th>Faulty views</th><th>View→Cart</th>
    </tr>`;
    const topBody = topRows.map(r => `
      <tr>
        <td style="max-width:520px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${(() => {
        const title = (r.name || r.productName || r.productLink || r.key || r.productId || "unknown");
        const href = (r.productLink || (String(r.key || "").startsWith("http") ? String(r.key) : ""));
        if (href) return `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(title)}</a>`;
        return esc(title);
      })()}</td>
        <td>${Number(r.views || 0)}</td>
        <td>${Number(r.clicks || 0)}</td>
        <td>${Number(r.addToCart || 0)}</td>
        <td>${(Number(r.avgTimeMs || 0) / 1000).toFixed(1)}</td>
        <td>${Number(r.faultyViews || 0)}</td>
        <td>${(Number(r.views || 0) ? ((Number(r.addToCart || 0) / Number(r.views || 1)) * 100) : 0).toFixed(2)}%</td>
      </tr>
    `).join("");

    const out = document.getElementById("mgAnOut");
    if (out) {
      const s = (summary && typeof summary === "object") ? (summary.settings || {}) : {};
      const minS = Number(s.minEngagedMs || 0) ? (Number(s.minEngagedMs || 0) / 1000).toFixed(1) : "0";
      const maxS = Number(s.maxEngagedMs || 0) ? (Number(s.maxEngagedMs || 0) / 1000).toFixed(1) : "0";
      out.innerHTML = `
        ${kpisHtml}
        <div class="login-hint" style="margin-top:12px;">Engaged views are derived from product_time duration (min: ${esc(minS)}s, max: ${esc(maxS)}s). "Faulty views" are excluded from aggregates unless you toggle "Include faulty".</div>
        <h3 style="margin:16px 0 8px;font-size:14px;">Time series</h3>
        <div style="overflow:auto;border:1px solid rgba(255,255,255,.10);border-radius:12px;">
          <table style="width:100%;border-collapse:collapse;font-size:12px;">
            <thead>${tsHead}</thead>
            <tbody>${tsBody}</tbody>
          </table>
        </div>
        <h3 style="margin:16px 0 8px;font-size:14px;">Top products</h3>
        <div style="overflow:auto;border:1px solid rgba(255,255,255,.10);border-radius:12px;">
          <table style="width:100%;border-collapse:collapse;font-size:12px;">
            <thead>${topHead}</thead>
            <tbody>${topBody}</tbody>
          </table>
        </div>
      `;
    }
  }

  function ensureUi() {
    const tab = document.getElementById("analyticsTab");
    if (!tab) return;
    if (tab.dataset.ready === "1") return;
    tab.innerHTML = `
      <div class="login-hint" style="margin-bottom:10px;">Engagement analytics (requires storefront /track events).</div>
      <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;">
        <div class="mgmt-field" style="min-width:200px;">
          <label>Range</label>
          <select id="mgAnRange" class="login-input" style="padding:10px 12px;border-radius:12px;">
            <option value="7d">Last 7 days</option>
            <option value="10d">Last 10 days</option>
            <option value="30d" selected>Last 30 days</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        <div class="mgmt-field" style="min-width:180px;">
          <label>From</label>
          <input id="mgAnFrom" type="date" />
        </div>
        <div class="mgmt-field" style="min-width:180px;">
          <label>To</label>
          <input id="mgAnTo" type="date" />
        </div>
        <div class="mgmt-field" style="min-width:140px;">
          <label>Bucket</label>
          <select id="mgAnBucket" class="login-input" style="padding:10px 12px;border-radius:12px;">
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
        </div>
        <div class="mgmt-field" style="min-width:180px;">
          <label>Top metric</label>
          <select id="mgAnTopMetric" class="login-input" style="padding:10px 12px;border-radius:12px;">
            <option value="views">Views</option>
            <option value="clicks">Clicks</option>
            <option value="addtocart">Add to cart</option>
            <option value="time">Avg time</option>
          </select>
        </div>
        <label class="login-hint" style="display:flex;align-items:center;gap:8px;margin:0 0 6px 0;">
          <input id="mgAnIncludeFaulty" type="checkbox" />
          Include faulty sessions
        </label>
        <button id="mgAnRefresh" class="mgmt-btn primary" type="button">Refresh</button>
      </div>
      <div id="mgAnOut" style="margin-top:12px;"></div>
    `;

    // Restore persisted UI values
    try {
      const rp = document.getElementById("mgAnRange");
      const bucket = document.getElementById("mgAnBucket");
      const metric = document.getElementById("mgAnTopMetric");
      const faulty = document.getElementById("mgAnIncludeFaulty");
      const p0 = localStorage.getItem("mgAnRangePreset") || "30d";
      if (rp) rp.value = p0;
      if (bucket) bucket.value = localStorage.getItem("mgAnBucket") || bucket.value;
      if (metric) metric.value = localStorage.getItem("mgAnTopMetric") || metric.value;
      if (faulty) faulty.checked = (localStorage.getItem("mgAnIncludeFaulty") === "1");
    } catch { }

    document.getElementById("mgAnRefresh")?.addEventListener("click", () => {
      if (typeof actionRunner === "function") {
        actionRunner(async () => { await renderAnalytics(); }, "Analytics");
      } else {
        renderAnalytics().catch((e) => alert(String(e?.message || e)));
      }
    });

    // Preset range selector
    document.getElementById("mgAnRange")?.addEventListener("change", (e) => {
      const p = String(e?.target?.value || "custom");
      if (p !== "custom") applyRangePreset(p);
      rememberAnalyticsUi();
      // auto-refresh for presets
      const btn = document.getElementById("mgAnRefresh");
      if (btn) btn.click();
    });

    // Remember when changing custom dates / selectors
    document.getElementById("mgAnFrom")?.addEventListener("change", () => { try { document.getElementById("mgAnRange").value = "custom"; } catch { } rememberAnalyticsUi(); });
    document.getElementById("mgAnTo")?.addEventListener("change", () => { try { document.getElementById("mgAnRange").value = "custom"; } catch { } rememberAnalyticsUi(); });
    document.getElementById("mgAnBucket")?.addEventListener("change", rememberAnalyticsUi);
    document.getElementById("mgAnTopMetric")?.addEventListener("change", rememberAnalyticsUi);
    document.getElementById("mgAnIncludeFaulty")?.addEventListener("change", () => {
      rememberAnalyticsUi();
      const btn = document.getElementById("mgAnRefresh");
      if (btn) btn.click();
    });

    tab.dataset.ready = "1";
  }

  window.analyticsUiHide = function (purge = false) {
    const tab = document.getElementById("analyticsTab");
    if (tab) {
      tab.classList.add("hidden");
      tab.style.display = "none";
      tab.style.pointerEvents = "none";
      tab.setAttribute("aria-hidden", "true");

      // If requested, fully tear down UI so re-entering the tab rebuilds fresh.
      if (purge) {
        try { tab.innerHTML = ""; } catch { }
        try { delete tab.dataset.ready; } catch { }
        try { tab.dataset.ready = "0"; } catch { }
      }
    }
  };
  window.analyticsUiShow = async function () {
    // NOTE: mgFeat is defined inside this bundle. Do not rely on window.mgFeat being exported.
    try { if (typeof mgFeat === "function" && !mgFeat("analyticsTab")) return; } catch { }
    const tab = document.getElementById("analyticsTab");
    if (!tab) throw new Error("analyticsTab missing in index.html");
    tab.classList.remove("hidden"); tab.style.display = ""; tab.style.pointerEvents = ""; tab.setAttribute("aria-hidden", "false");
    ensureUi();
    setDefaultRange();
    await renderAnalytics();
  };
})();

// ---- API base helper (fix: legacy API_BASE usages) ----

let _ensureLoginPromise = null;

function clearAdminSession() {
  mgClearSessionToken();
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

}


async function tryAutoLoginIfConfigured() {
  // Try local remembered password (explicit opt-in).
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
        unitPriceOriginalEUR: (it.unitPriceOriginalEUR != null ? Number(it.unitPriceOriginalEUR) : (it.unitPriceOriginalEur != null ? Number(it.unitPriceOriginalEur) : null)),
        recoDiscountPct: (it.recoDiscountPct != null ? Number(it.recoDiscountPct) : null),
        recoDiscountToken: (it.recoDiscountToken != null ? String(it.recoDiscountToken) : null),
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
  try { state._ordersLoadedAt = new Date().toISOString(); } catch { }
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

function mgArmDangerButton(btn, run, label = "Confirm", timeoutMs = 2500) {
  if (!btn || btn._mgDangerArmed) return;
  btn._mgDangerArmed = false;
  let timer = null;
  const origText = btn.textContent;
  const origTitle = btn.title;

  btn.addEventListener("click", async (e) => {
    // allow other handlers to set stopPropagation beforehand
    if (btn._mgDangerArmed) {
      btn._mgDangerArmed = false;
      if (timer) { clearTimeout(timer); timer = null; }
      btn.textContent = origText;
      btn.title = origTitle;
      await run(e);
      return;
    }
    // arm
    btn._mgDangerArmed = true;
    btn.textContent = label;
    btn.title = "Click again to confirm";
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      btn._mgDangerArmed = false;
      btn.textContent = origText;
      btn.title = origTitle;
    }, timeoutMs);
  }, { capture: true });
}

function mgShowUndo(message, undoFn, ttlMs = 12000) {
  try {
    let host = document.getElementById("mgUndoHost");
    if (!host) {
      host = document.createElement("div");
      host.id = "mgUndoHost";
      host.className = "mg-undo-host";
      document.body.appendChild(host);
    }
    host.innerHTML = "";
    const bar = document.createElement("div");
    bar.className = "mg-undo-bar";
    bar.innerHTML = `<div class="mg-undo-text">${escHtml(message || "Done")}</div>
      <button class="mg-undo-btn" type="button">Undo</button>
      <button class="mg-undo-close" type="button" title="Dismiss">✕</button>`;
    host.appendChild(bar);

    const close = () => { try { bar.remove(); } catch { } };
    bar.querySelector(".mg-undo-close")?.addEventListener("click", close);
    bar.querySelector(".mg-undo-btn")?.addEventListener("click", () => {
      try { undoFn?.(); } catch { }
      close();
    });
    setTimeout(close, ttlMs);
  } catch { }
}
window.mgShowUndo = mgShowUndo;


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
window.mgOpenProductsWindowWithOpenAll = function (rows, title, opts = {}) {
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
          try { w.focus(); } catch { }
          try { w.opener = null; } catch { }
          try { w.resizeTo(1400, 900); } catch { }
          try { w.moveTo(40, 40); } catch { }
          return w;
        }
      } catch { /* ignore */ }
    }
  }

  try {
    const w = window.open("", name);
    if (w) { try { w.focus(); } catch { } }
    return w;
  } catch {
    return null;
  }
}


function _mgCreateOrderSummaryBlobUrl(order) {
  try {
    const esc = (typeof escHtml === "function") ? escHtml : (s) => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
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
  ${metaRows.map((r, idx) => `<div class="item"><b>${idx + 1}.</b> <a href="${escapeHtml(r.url)}" target="_blank" rel="noreferrer noopener">${escapeHtml(r.label || r.url)}</a></div>`).join("")}
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

    try { hostWin.focus(); } catch { }
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
    try { host.focus(); } catch { }
    return host;
  } catch (e) {
    // Fallback: navigate to first product if writing is blocked
    try { host.location.href = metaRows[0].url; } catch { }
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
  const an = document.getElementById("mgAnalyticsTabBtn");
  const r = document.getElementById("mgRecsTabBtn");
  const i = document.getElementById("mgIncentivesTabBtn");
  const pf = document.getElementById("mgProfitTabBtn");
  const em = document.getElementById("mgEmailTabBtn");
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
  set(an, active === "analytics");
  set(r, active === "recs");
  set(i, active === "incentives");
  set(pf, active === "profit");
  set(em, active === "email");
  set(p, active === "products");
  set(t, active === "tariffs");
  set(a, active === "accounting");
}

// ======= Recommendations tab show/hide (embedded in index.html) =======
function recsUiHide(force = false) {
  const el = document.getElementById("recommendationsTab");
  if (!el) return;
  el.classList.add("hidden");
  el.setAttribute("aria-hidden", "true");
  if (force) el.style.display = "none";
}

function recsUiShow() {
  const el = document.getElementById("recommendationsTab");
  if (!el) return;
  el.classList.remove("hidden");
  el.setAttribute("aria-hidden", "false");
  el.style.display = "";
}


// ======= Incentives tab show/hide (embedded in index.html) =======
function incentivesUiHide(force = false) {
  const el = document.getElementById("incentivesTab");
  if (!el) return;
  el.classList.add("hidden");
  el.setAttribute("aria-hidden", "true");
  if (force) el.style.display = "none";
}

function incentivesUiShow() {
  const el = document.getElementById("incentivesTab");
  if (!el) return;
  el.classList.remove("hidden");
  el.setAttribute("aria-hidden", "false");
  el.style.display = "";
}

// ======= Profit tab show/hide (embedded in index.html) =======
function profitUiHide(force = false) {
  const el = document.getElementById("profitTab");
  if (!el) return;
  el.classList.add("hidden");
  el.setAttribute("aria-hidden", "true");
  if (force) el.style.display = "none";
}

function profitUiShow() {
  const el = document.getElementById("profitTab");
  if (!el) return;
  el.classList.remove("hidden");
  el.setAttribute("aria-hidden", "false");
  el.style.display = "";
}

// ======= Email tab show/hide (embedded in index.html) =======
function emailUiHide(force = false) {
  const el = document.getElementById("emailTab");
  if (!el) return;
  el.classList.add("hidden");
  el.setAttribute("aria-hidden", "true");
  if (force) el.style.display = "none";
}

function emailUiShow() {
  const el = document.getElementById("emailTab");
  if (!el) return;
  el.classList.remove("hidden");
  el.setAttribute("aria-hidden", "false");
  el.style.display = "";
  try { if (typeof loadEmailMarketingUi === "function") loadEmailMarketingUi(); } catch { }
}

// ======= Features tab show/hide (embedded in index.html) =======
function featuresUiHide(force = false) {
  const el = document.getElementById("featuresTab");
  if (!el) return;
  el.classList.add("hidden");
  el.setAttribute("aria-hidden", "true");
  if (force) el.style.display = "none";
}

function featuresUiShow() {
  const el = document.getElementById("featuresTab");
  if (!el) return;
  el.classList.remove("hidden");
  el.setAttribute("aria-hidden", "false");
  el.style.display = "";
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



function opsUiHide(force = false) {
  const el = document.getElementById("opsTab");
  if (!el) return;
  el.classList.add("hidden");
  el.setAttribute("aria-hidden", "true");
  if (force) el.style.display = "none";
}

function opsUiShow() {
  const el = document.getElementById("opsTab");
  if (!el) return;
  el.classList.remove("hidden");
  el.removeAttribute("aria-hidden");
  el.style.display = "";
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
  const pricing = (order && order.pricing && typeof order.pricing === 'object') ? order.pricing : {};
  const discMeta = (pricing.discounts && typeof pricing.discounts === 'object') ? pricing.discounts : (order && order.discounts && typeof order.discounts === 'object' ? order.discounts : {});
  const orderTierPct = Number(discMeta.tierPct ?? order.tierPct ?? 0) || 0;
  const orderBundlePct = Number(discMeta.bundlePct ?? order.bundlePct ?? 0) || 0;
  const orderEffectivePct = Number(pricing.effectivePct ?? discMeta.effectivePct ?? 0) || 0;
  const orderBaseTotalEUR = Number(pricing.baseTotalEUR ?? pricing.originalTotalEUR ?? 0) || 0;
  const orderSubtotalAfterEUR = Number(pricing.subtotalAfterDiscountsEUR ?? 0) || 0;
  const saleTotal0 = Number(order.paidEUR != null ? order.paidEUR : order.products.reduce((s, p) => s + (p.totalSale ?? p.amount * p.unitPrice), 0));

  const baseTotal0_raw = Number(order?.pricing?.baseTotalEUR ?? order?.pricing?.baseTotal ?? NaN);
  const baseTotal0 = isFinite(baseTotal0_raw)
    ? baseTotal0_raw
    : order.products.reduce((s, p) => {
        const q = Number(p.amount ?? p.quantity ?? 0);
        const u0 = Number(p.unitPriceOriginal ?? p.unitPriceOriginalEUR ?? NaN);
        const u1 = Number(p.unitPrice ?? p.unitPriceEUR ?? 0);
        const line = (isFinite(u0) && u0 > u1 + 1e-9) ? (q * u0) : (Number(p.totalSale ?? (q * u1)) || 0);
        return s + line;
      }, 0);

  const pct0 = (orderEffectivePct > 0) ? orderEffectivePct : ((isFinite(baseTotal0) && baseTotal0 > 0) ? ((baseTotal0 - saleTotal0) / baseTotal0) * 100 : 0);
  const pricePaidHtml =
    (isFinite(baseTotal0) && baseTotal0 > saleTotal0 + 1e-9)
      ? `Price paid: <span class="PriceStrike">${money(baseTotal0)} ${order.currency}</span> <span class="PricePaid">${money(saleTotal0)} ${order.currency}</span> <span class="PricePct">(-${pct0.toFixed(2)}%)</span>`
      : `Price paid: <span class="PricePaid">${money(saleTotal0)} ${order.currency}</span>`;
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

    const baseTotalRaw = Number(order?.pricing?.baseTotalEUR ?? order?.pricing?.baseTotal ?? NaN);
    const baseTotal = isFinite(baseTotalRaw)
      ? baseTotalRaw
      : (order.products || []).reduce((s, p) => {
          const q = Number(p.amount ?? p.quantity ?? 0);
          const u0 = Number(p.unitPriceOriginal ?? p.unitPriceOriginalEUR ?? NaN);
          const u1 = Number(p.unitPrice ?? p.unitPriceEUR ?? 0);
          const line = (isFinite(u0) && u0 > u1 + 1e-9) ? (q * u0) : (Number(p.totalSale ?? (q * u1)) || 0);
          return s + line;
        }, 0);

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
      if (isFinite(baseTotal) && baseTotal > saleTotal + 1e-9) {
        node.innerHTML = `<span class="PriceStrike">${money(baseTotal)} ${order.currency}</span> <span class="PricePaid">${money(saleTotal)} ${order.currency}</span>`;
      } else {
        node.textContent = `${money(saleTotal)} ${order.currency}`;
      }
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
            ${pricePaidHtml}${(order.paymentCurrency && order.paymentCurrency !== "EUR" && Number(order.paidOriginalAmount || 0) > 0) ? ` (≈${money(order.paidOriginalAmount)} ${esc(order.paymentCurrency)})` : ""}
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

    <div id="DropdownDiv_A_DISCOUNT" class="DropdownDiv_A_DISCOUNT">
      <span id="DropdownDiv_A_DISCOUNT_Text" class="DropdownDiv_A_DISCOUNT_Text">
        Disc
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


    const disc = document.createElement("div");
    disc.id = `ProductDiv_DISCOUNT_${i}`;
    disc.className = "ProductDiv_DISCOUNT";
    const discText = document.createElement("span");
    discText.id = `ProductDiv_DISCOUNT_Text_${i}`;
    discText.className = "ProductDiv_DISCOUNT_Text";
    // percent discount based on original vs paid unit price (if present)
    const u0 = Number(p.unitPriceOriginal ?? p.unitPriceOriginalEUR ?? p.unitPriceOriginalEur ?? p.unitPrice0 ?? p.unitPriceOrig ?? NaN);
    const u1 = Number(p.unitPrice ?? p.unitPriceEUR ?? NaN);

    // If "original" exists, compute from original vs paid.
    if (isFinite(u0) && isFinite(u1) && u0 > u1 + 1e-9) {
      const pct = Math.round((1 - (u1 / u0)) * 100);
      discText.textContent = pct > 0 ? `-${pct}%` : "";
    } else {
      // Fallback: use explicit item discount percent if provided by backend.
      const pReco = Number(p.recoDiscountPctApplied ?? p.recoDiscountPct ?? p.recoPctApplied ?? p.recoPct ?? NaN);
      if (isFinite(pReco) && pReco > 0) {
        discText.textContent = `-${Math.round(pReco)}%`;
      } else {
        if (orderTierPct > 0 || orderBundlePct > 0) {
        const parts = [];
        if (orderTierPct > 0) parts.push(`T-${Math.round(orderTierPct)}%`);
        if (orderBundlePct > 0) parts.push(`B-${Math.round(orderBundlePct)}%`);
        discText.textContent = parts.join(' ');
      } else {
        discText.textContent = "";
      }
      }
    }
    disc.appendChild(discText);


    const d = document.createElement("div");
    d.id = `ProductDiv_D_${i}`;
    d.className = "ProductDiv_D";
    const unitWrap = document.createElement("span");
    unitWrap.id = `ProductDiv_D_ProductUnitPriceText_${i}`;
    unitWrap.className = "ProductDiv_D_ProductUnitPriceText PriceWrap";
    const u0n = Number(p.unitPriceOriginal ?? p.unitPriceOriginalEUR ?? p.unitPriceOriginalEur ?? NaN);
    const u1n = Number(p.unitPrice ?? p.unitPriceEUR ?? NaN);
    if (isFinite(u0n) && isFinite(u1n) && u0n > u1n + 1e-9) {
      const s0 = document.createElement("span");
      s0.className = "PriceStrike";
      s0.textContent = money(u0n);
      const s1 = document.createElement("span");
      s1.className = "PricePaid";
      s1.textContent = money(u1n);
      unitWrap.appendChild(s0);
      unitWrap.appendChild(document.createTextNode(" "));
      unitWrap.appendChild(s1);
    } else {
      unitWrap.textContent = money(p.unitPrice);
    }
    d.appendChild(unitWrap);

    const e = document.createElement("div");
    e.id = `ProductDiv_E_${i}`;
    e.className = "ProductDiv_E";
    const totalWrap = document.createElement("span");
    totalWrap.id = `ProductDiv_E_ProductTotalPrice_${i}`;
    totalWrap.className = "ProductDiv_E_ProductTotalPrice PriceWrap";
    const qn = Number(p.amount ?? p.quantity ?? NaN);
    const u0t = Number(p.unitPriceOriginal ?? p.unitPriceOriginalEUR ?? NaN);
    const u1t = Number(p.unitPrice ?? p.unitPriceEUR ?? NaN);
    const paidLine = Number(p.totalSale ?? (isFinite(qn)&&isFinite(u1t)? qn*u1t : NaN));
    if (isFinite(qn) && isFinite(u0t) && isFinite(u1t) && u0t > u1t + 1e-9) {
      const origLine = qn * u0t;
      const s0 = document.createElement("span");
      s0.className = "PriceStrike";
      s0.textContent = money(origLine);
      const s1 = document.createElement("span");
      s1.className = "PricePaid";
      s1.textContent = money(paidLine);
      totalWrap.appendChild(s0);
      totalWrap.appendChild(document.createTextNode(" "));
      totalWrap.appendChild(s1);
    } else {
      totalWrap.textContent = money(p.totalSale ?? p.amount * p.unitPrice);
    }
    e.appendChild(totalWrap);

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
    row.appendChild(disc);
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

  const copyAddrBtn = card.querySelector("#TopBarDiv_C_A_E_CopyAddr");
  if (copyAddrBtn) {
    copyAddrBtn.onclick = async (e) => {
      e.stopPropagation();
      try { state.openOrderId = order.id; } catch { }
      await copyToClipboard(formatAddress(order));
      ttoast("Copied", "Address copied");
    };
  }

  const copySumBtn = card.querySelector("#TopBarDiv_C_A_F_CopySum");
  if (copySumBtn) {
    copySumBtn.onclick = async (e) => {
      e.stopPropagation();
      try { state.openOrderId = order.id; } catch { }
      await copyToClipboard(formatSummary(order));
      ttoast("Copied", "Summary copied");
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
  if (typeof XLSX === "undefined") {
    alert("XLSX library not loaded.");
    return;
  }
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
  if (typeof XLSX === "undefined") {
    alert("XLSX library not loaded.");
    return;
  }
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

  // Advanced features
  try {
    mgLoadFeatures();
    mgEnsureFeatureTogglesUI();
    const host = document.getElementById("mgFeatureToggles");
    if (host) {
      host.querySelectorAll("input[data-feature]").forEach(cb => {
        const k = String(cb.getAttribute("data-feature") || "");
        cb.checked = mgFeat(k);
      });
    }
  } catch { }

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

      // Advanced feature toggles
      try {
        const host = document.getElementById("mgFeatureToggles");
        if (host) {
          const next = { ...(mgFeatures || MG_FEATURES_DEFAULT) };
          host.querySelectorAll("input[data-feature]").forEach(cb => {
            next[String(cb.getAttribute("data-feature") || "")] = !!cb.checked;
          });
          mgSaveFeatures(next);
        }
      } catch (e) { console.error("Saving feature toggles failed:", e); }

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
        list._sortableInstance = new window.Sortable(list, { animation: 150, ghostClass: "drag-ghost" });
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
  const token = mgGetSessionToken();
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

// ===== Engagement analytics (admin) =====
async function adminEngagementSummary({ from, to, bucket = "day", includeFaulty = false } = {}) {
  await ensureLogin();
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (bucket) params.set("bucket", bucket);
  if (includeFaulty) params.set("includeFaulty", "1");
  const r = await fetch(`${_adminBase()}/admin/analytics/engagement/summary?${params}`, { headers: _adminHeaders(false) });
  if (!r.ok) throw new Error(`engagementSummary HTTP ${r.status}`);
  return r.json();
}

async function adminEngagementTopProducts({ from, to, metric = "views", limit = 25, includeFaulty = false } = {}) {
  await ensureLogin();
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  params.set("metric", metric);
  params.set("limit", String(limit));
  if (includeFaulty) params.set("includeFaulty", "1");
  const r = await fetch(`${_adminBase()}/admin/analytics/engagement/top-products?${params}`, { headers: _adminHeaders(false) });
  if (!r.ok) throw new Error(`engagementTopProducts HTTP ${r.status}`);
  return r.json();
}

window.adminApi = window.adminApi || {}; Object.assign(window.adminApi, {
  engagementSummary: adminEngagementSummary,
  engagementTopProducts: adminEngagementTopProducts
});

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
    const token = mgGetSessionToken();
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

    // Gross sale from item lines (may not include order-level discounts)
    let grossSale = 0;
    let purchase = 0;

    for (const it of items) {
      const q = itemQty(it);
      grossSale += q * itemSaleEUR(it);
      purchase += q * itemExpectedPurchaseEUR(it);
    }

    // Net sale = what the customer actually paid (preferred)
    const totalPaidEUR =
      (order?.pricing?.totalPaidEUR != null && !isNaN(Number(order.pricing.totalPaidEUR)))
        ? _num(order.pricing.totalPaidEUR, 0)
        : (grossSale || 0);

    // For reporting: treat net sale as revenue; keep gross for reference
    const saleEUR = totalPaidEUR;

    const marginEUR = saleEUR - purchase;

    return {
      saleEUR,
      grossSaleEUR: grossSale,
      purchaseEUR: purchase,
      totalPaidEUR,
      marginEUR,
      marginPct: (saleEUR > 0) ? (marginEUR / saleEUR) : null
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

  // ===== Theme (light/dark) =====
  const MG_THEME_KEY = "mgmt_theme";

  function mgThemeGet() {
    try {
      const v = localStorage.getItem(MG_THEME_KEY);
      if (v === "dark" || v === "light") return v;
    } catch (e) { }
    // fall back to current DOM state
    return document.documentElement.classList.contains("theme-dark") ? "dark" : "light";
  }

  function mgThemeApply(theme) {
    const t = (theme === "dark") ? "dark" : "light";
    const root = document.documentElement;
    root.classList.toggle("theme-dark", t === "dark");
    root.classList.toggle("theme-light", t === "light");
    try { localStorage.setItem(MG_THEME_KEY, t); } catch (e) { }
    mgThemeUpdateToggle();
  }

  function mgThemeToggle() {
    const cur = mgThemeGet();
    mgThemeApply(cur === "dark" ? "light" : "dark");
  }

  function mgThemeUpdateToggle() {
    const btn = document.getElementById("mgThemeToggle");
    if (!btn) return;
    const t = mgThemeGet();
    btn.textContent = (t === "dark") ? "Dark" : "Light";
    btn.setAttribute("aria-pressed", t === "dark" ? "true" : "false");
    btn.title = (t === "dark") ? "Switch to light mode" : "Switch to dark mode";
  }

  // ===== Density (comfort/compact) =====
  const MG_DENSITY_KEY = "mgmt_density";
  function mgDensityGet() {
    try {
      const v = localStorage.getItem(MG_DENSITY_KEY);
      if (v === "compact" || v === "comfort") return v;
    } catch (e) { }
    return document.documentElement.classList.contains("density-compact") ? "compact" : "comfort";
  }
  function mgDensityApply(mode) {
    const m = (mode === "compact") ? "compact" : "comfort";
    document.documentElement.classList.toggle("density-compact", m === "compact");
    try { localStorage.setItem(MG_DENSITY_KEY, m); } catch (e) { }
    mgDensityUpdateToggle();
  }
  function mgDensityToggle() {
    mgDensityApply(mgDensityGet() === "compact" ? "comfort" : "compact");
  }
  function mgDensityUpdateToggle() {
    const btn = document.getElementById("mgDensityToggle");
    if (!btn) return;
    const m = mgDensityGet();
    btn.textContent = (m === "compact") ? "Compact" : "Comfort";
    btn.title = (m === "compact") ? "Switch to comfort density" : "Switch to compact density";
  }

  // 
  // ===== Advanced feature flags =====
  const MG_FEATURES_KEY = "mg_features_v1";
  const MG_FEATURES_DEFAULT = {
    commandPalette: true,
    stickySaveBar: true,
    orderQuickActions: true,
    keyboardNav: true,
    densityToggle: true,
    dataFreshness: true,
    saferDeletes: true,
    undoToasts: true,
    tabMemory: true,
    tooltips: true,
    recentActivity: true,
    softLocking: true,
    accountingDrilldown: true,
    analyticsTab: true,
    analyticsGraphs: true,
  };

  let mgFeatures = null;
  function mgLoadFeatures() {
    try {
      const raw = localStorage.getItem(MG_FEATURES_KEY);
      const obj = raw ? JSON.parse(raw) : {};
      mgFeatures = { ...MG_FEATURES_DEFAULT, ...(obj || {}) };
    } catch {
      mgFeatures = { ...MG_FEATURES_DEFAULT };
    }
    return mgFeatures;
  }
  function mgSaveFeatures(next) {
    mgFeatures = { ...MG_FEATURES_DEFAULT, ...(next || {}) };
    try { localStorage.setItem(MG_FEATURES_KEY, JSON.stringify(mgFeatures)); } catch { }
    return mgFeatures;
  }
  function mgFeat(name) {
    if (!mgFeatures) mgLoadFeatures();
    return mgFeatures[name] !== false;
  }

  // Export for console/debug and small runtime helpers.
  // (Some UI modules reference window.mgFeat defensively.)
  try {
    window.mgFeat = mgFeat;
    window.mgLoadFeatures = mgLoadFeatures;
    window.mgSaveFeatures = mgSaveFeatures;
  } catch { }

  // ===== Recent activity =====
  const MG_RECENT_KEY = "mg_recent_v1";
  function mgLoadRecent() {
    try { return JSON.parse(localStorage.getItem(MG_RECENT_KEY) || "[]") || []; } catch { return []; }
  }
  function mgSaveRecent(items) {
    try { localStorage.setItem(MG_RECENT_KEY, JSON.stringify(items || [])); } catch { }
  }
  function mgRecordRecent(item) {
    if (!mgFeat("recentActivity")) return;
    const now = Date.now();
    const next = mgLoadRecent();
    next.unshift({ ...item, ts: now });
    // de-dupe by type+id
    const seen = new Set();
    const out = [];
    for (const it of next) {
      const k = (it.type || "") + "::" + (it.id || "");
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(it);
      if (out.length >= 12) break;
    }
    mgSaveRecent(out);
    mgRenderRecentPanel();
  }

  function mgFmtAgo(ts) {
    const m = Math.max(0, Math.round((Date.now() - ts) / 60000));
    if (m <= 0) return "now";
    if (m < 60) return `${m}m`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h}h`;
    const d = Math.round(h / 24);
    return `${d}d`;
  }

  function mgEnsureRecentDom() {
    let panel = document.getElementById("mgRecentPanel");
    if (panel) return panel;

    panel = document.createElement("div");
    panel.id = "mgRecentPanel";
    panel.className = "mg-recent-panel hidden";
    panel.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;">
      <div style="font-weight:750;">Recent activity</div>
      <button class="mgmt-btn" id="mgRecentClose" type="button">Close</button>
    </div>
    <div id="mgRecentList"></div>
  `;
    document.body.appendChild(panel);

    panel.querySelector("#mgRecentClose")?.addEventListener("click", () => panel.classList.add("hidden"));
    document.addEventListener("click", (e) => {
      const p = document.getElementById("mgRecentPanel");
      const b = document.getElementById("mgRecentBtn");
      if (!p || p.classList.contains("hidden")) return;
      if (p.contains(e.target) || (b && b.contains(e.target))) return;
      p.classList.add("hidden");
    });

    return panel;
  }

  function mgRenderRecentPanel() {
    if (!mgFeat("recentActivity")) return;
    const panel = mgEnsureRecentDom();
    const list = panel.querySelector("#mgRecentList");
    if (!list) return;

    const items = mgLoadRecent();
    list.innerHTML = "";

    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "login-hint";
      empty.textContent = "No recent actions yet.";
      list.appendChild(empty);
      return;
    }

    for (const it of items) {
      const row = document.createElement("div");
      row.className = "mg-recent-item";
      row.innerHTML = `
      <div style="min-width:0;">
        <div class="t1"></div>
        <div class="t2"></div>
      </div>
      <div class="ts"></div>
    `;
      row.querySelector(".t1").textContent = it.title || it.type || "Activity";
      row.querySelector(".t2").textContent = it.subtitle || it.id || "";
      row.querySelector(".ts").textContent = mgFmtAgo(it.ts);

      row.addEventListener("click", () => {
        panel.classList.add("hidden");
        try {
          if (it.type === "order" && it.id) {
            const card = document.querySelector(`.OrderCardDiv[data-id="${CSS.escape(it.id)}"]`);
            if (card) {
              card.scrollIntoView({ behavior: "smooth", block: "center" });
              card.click();
            }
            return;
          }
          if (it.type === "product" && it.id) {
            // open product editor by calling existing helper if present
            if (typeof openProductEditorById === "function") { openProductEditorById(it.id); return; }
            // fallback: click product row
            const pr = document.querySelector(`[data-product-id="${CSS.escape(it.id)}"]`);
            if (pr) pr.click();
          }
          if (it.type === "action" && typeof it.run === "function") it.run();
        } catch { }
      });

      list.appendChild(row);
    }
  }

  function mgToggleRecentPanel(forceOpen) {
    if (!mgFeat("recentActivity")) return;
    const panel = mgEnsureRecentDom();
    const open = forceOpen == null ? panel.classList.contains("hidden") : !!forceOpen;
    if (open) mgRenderRecentPanel();
    panel.classList.toggle("hidden", !open);
  }

  // ===== Tooltips =====
  function mgMakeTip(text) {
    const sp = document.createElement("span");
    sp.className = "mg-tip";
    sp.textContent = "i";
    sp.setAttribute("data-tip", text || "");
    sp.setAttribute("aria-label", text || "Info");
    return sp;
  }

  function mgIsTypingContext() {
    const a = document.activeElement;
    if (!a) return false;
    const tag = (a.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select") return true;
    if (a.isContentEditable) return true;
    return false;
  }

  function mgOrdersKeyboardNav(e) {
    // only in orders tab
    const ordersTab = document.getElementById("ordersTab");
    if (!ordersTab || ordersTab.classList.contains("hidden")) return false;

    const key = e.key;
    const cards = Array.from(document.querySelectorAll(".OrderCardDiv"));
    if (!cards.length) return false;

    // get current selection
    let idx = cards.findIndex(c => c.classList.contains("mg-selected"));
    if (idx < 0) idx = 0;

    if (key === "ArrowDown") idx = Math.min(cards.length - 1, idx + 1);
    else if (key === "ArrowUp") idx = Math.max(0, idx - 1);
    else if (key === "Enter") {
      const c = cards[idx];
      if (c) { c.scrollIntoView({ behavior: "smooth", block: "center" }); c.click(); }
      return true;
    } else return false;

    cards.forEach(c => c.classList.remove("mg-selected"));
    const sel = cards[idx];
    if (sel) {
      sel.classList.add("mg-selected");
      sel.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    return true;
  }




  function mgEnsureFeatureTogglesUI() {
    const host = document.getElementById("mgFeatureToggles");
    if (!host) return;

    // Already rendered?
    if (host.dataset.ready === "1") return;

    const defs = [
      ["commandPalette", "Command palette (Ctrl+K)", "Search and jump to actions, orders, products."],
      ["stickySaveBar", "Sticky save bar", "Shows Save/Discard bar when you have unsaved changes."],
      ["orderQuickActions", "Order quick actions", "Copy address and copy summary buttons on each order."],
      ["keyboardNav", "Keyboard navigation", "Use ↑/↓ and Enter in Orders; Ctrl+S to save."],
      ["densityToggle", "Compact mode toggle", "Switch between Comfort and Compact density."],
      ["dataFreshness", "Data freshness badge", "Shows how old the loaded Orders/Products data is."],
      ["saferDeletes", "Safer deletes", "Requires confirmation click for destructive actions."],
      ["undoToasts", "Undo toasts", "Shows short Undo bars for destructive actions (where supported)."],
      ["tabMemory", "Tab filter memory", "Remembers your search/filter inputs per tab."],
      ["tooltips", "Tooltips", "Info tips for VAT/accounting fields."],
      ["recentActivity", "Recent activity", "Recent panel in the top bar + tracking of actions."],
      ["softLocking", "Soft locking", "Warns when you open the same product twice."],
      ["accountingDrilldown", "Accounting drill-down", "Click KPIs in Accounting to see contributing orders/expenses."],
      ["analyticsTab", "Analytics tab", "Shows Engagement analytics (views, time, conversion, retention proxy)."],
      ["analyticsGraphs", "Analytics in Graphs", "Adds Engagement presets in the Graphs tab."],
    ];

    if (!mgFeatures) mgLoadFeatures();

    host.innerHTML = "";
    for (const [key, title, desc] of defs) {
      const row = document.createElement("label");
      row.className = "mgmt-feature-toggle";
      row.innerHTML = `
      <input type="checkbox" data-feature="${key}">
      <div style="min-width:0;">
        <div class="t-title"></div>
        <div class="t-desc"></div>
      </div>
    `;
      row.querySelector(".t-title").textContent = title;
      row.querySelector(".t-desc").textContent = desc;
      const cb = row.querySelector("input[type='checkbox']");
      cb.checked = mgFeat(key);
      host.appendChild(row);
    }

    host.dataset.ready = "1";
  }


  function mgEnsurePaletteDom() {
    let root = document.getElementById("mgPaletteRoot");
    if (root) return root;

    root = document.createElement("div");
    root.id = "mgPaletteRoot";
    root.className = "mg-palette hidden";
    root.innerHTML = `
    <div class="mg-palette-backdrop" data-close="1"></div>
    <div class="mg-palette-panel" role="dialog" aria-modal="true" aria-label="Search">
      <div class="mg-palette-top">
        <input id="mgPaletteInput" placeholder="Search actions, orders, products…" autocomplete="off" />
        <button class="mg-palette-close" id="mgPaletteClose" title="Close (Esc)">✕</button>
      </div>
      <div class="mg-palette-hint">Enter to run • ↑/↓ to navigate • Esc to close</div>
      <div class="mg-palette-list" id="mgPaletteList"></div>
    </div>
  `;
    document.body.appendChild(root);

    root.addEventListener("click", (e) => {
      const t = e.target;
      if (t?.dataset?.close === "1") mgPaletteClose();
    });
    root.querySelector("#mgPaletteClose")?.addEventListener("click", mgPaletteClose);

    const input = root.querySelector("#mgPaletteInput");
    if (input) {
      input.addEventListener("input", () => { mgPaletteSel = 0; mgPaletteRender(input.value); });
      input.addEventListener("keydown", (e) => { if (mgPaletteKeydown(e)) { e.preventDefault(); e.stopPropagation(); } });
    }
    return root;
  }

  function mgPaletteOpen() {
    const root = mgEnsurePaletteDom();
    root.classList.remove("hidden");
    const input = root.querySelector("#mgPaletteInput");
    if (input) {
      input.value = "";
      setTimeout(() => input.focus(), 0);
    }
    mgPaletteSel = 0;
    mgPaletteRender("");
  }

  function mgPaletteClose() {
    const root = document.getElementById("mgPaletteRoot");
    if (!root) return;
    root.classList.add("hidden");
  }

  function mgPaletteItems(btn, tbtn) {
    const items = [];

    items.push({ k: "Go: Orders", run: () => btn("orders")?.click() });
    items.push({ k: "Go: Incentives", run: () => btn("incentives")?.click() });
    items.push({ k: "Go: Profit", run: () => btn("profit")?.click() });
    items.push({ k: "Go: Email", run: () => btn("email")?.click() });
    items.push({ k: "Go: Features", run: () => btn("features")?.click() });
    items.push({ k: "Go: Ops", run: () => btn("ops")?.click() });
    items.push({ k: "Go: Products", run: () => btn("products")?.click() });
    items.push({ k: "Go: Accounting", run: () => btn("accounting")?.click() });
    items.push({ k: "Go: Tariffs", run: () => btn("tariffs")?.click() });
    items.push({ k: "Open: Health", run: () => tbtn("health")?.click() });
    items.push({ k: "Action: Refresh", run: () => btn("refresh")?.click() });
    items.push({ k: "Action: Sync", run: () => btn("sync")?.click() });

    // Orders
    try {
      const orders = Array.isArray(state?.orders) ? state.orders : [];
      for (const o of orders.slice(0, 600)) {
        const id = String(o.id || "");
        const who = String(o.email || o.shipping?.name || "");
        if (!id) continue;
        items.push({
          k: `Order: ${id}${who ? " — " + who : ""}`,
          run: () => {
            const card = document.querySelector(`.OrderCardDiv[data-id="${CSS.escape(id)}"]`);
            if (card) {
              card.scrollIntoView({ behavior: "smooth", block: "center" });
              card.classList.add("mg-flash");
              setTimeout(() => card.classList.remove("mg-flash"), 900);
            }
          }
        });
      }
    } catch (e) { }

    // Products
    try {
      const prods = Array.isArray(state?.products) ? state.products : [];
      for (const p of prods.slice(0, 1200)) {
        const pid = String(p.id || "");
        const pn = String(p.name || "");
        if (!pid) continue;
        items.push({
          k: `Product: ${pn || pid} (${pid})`,
          run: () => {
            btn("products")?.click();
            setTimeout(() => { try { openEditor(pid); } catch { } }, 50);
          }
        });
      }
    } catch (e) { }

    return items;
  }

  function mgNorm(s) { return String(s || "").toLowerCase().replace(/\s+/g, " ").trim(); }
  function mgPaletteFilter(items, q) {
    const qq = mgNorm(q);
    if (!qq) return items.slice(0, 30);
    const parts = qq.split(" ").filter(Boolean);
    const scored = [];
    for (const it of items) {
      const hay = mgNorm(it.k);
      let ok = true;
      let score = 0;
      for (const p of parts) {
        const idx = hay.indexOf(p);
        if (idx < 0) { ok = false; break; }
        score += (idx === 0 ? 6 : 1);
      }
      if (!ok) continue;
      scored.push({ it, score });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 30).map(x => x.it);
  }

  let mgPaletteSel = 0;
  function mgPaletteRender(q) {
    const root = mgEnsurePaletteDom();
    const list = root.querySelector("#mgPaletteList");
    if (!list) return;
    // btn() and tbtn() live inside mount, but we can resolve from topbar actions
    const actions = document.querySelector(".mgmt-topbar-actions");
    const btn = (act) => actions?.querySelector(`[data-act="${act}"]`);
    const tbtn = (tool) => actions?.querySelector(`[data-tool="${tool}"]`);

    const items = mgPaletteFilter(mgPaletteItems(btn, tbtn), q);
    mgPaletteSel = Math.max(0, Math.min(mgPaletteSel, items.length - 1));
    list.innerHTML = items.map((it, idx) => `<div class="mg-palette-item ${idx === mgPaletteSel ? "active" : ""}" data-idx="${idx}">${escHtml(it.k)}</div>`).join("");
    list.querySelectorAll(".mg-palette-item").forEach(node => {
      node.onclick = () => {
        const i = Number(node.dataset.idx || 0);
        const it = items[i];
        if (it?.run) { mgPaletteClose(); it.run(); }
      };
    });
    root._items = items;
  }

  function mgPaletteKeydown(e) {
    const root = document.getElementById("mgPaletteRoot");
    if (!root || root.classList.contains("hidden")) return false;
    const items = root._items || [];
    if (e.key === "Escape") { mgPaletteClose(); return true; }
    if (e.key === "ArrowDown") { mgPaletteSel = Math.min(items.length - 1, mgPaletteSel + 1); mgPaletteRender(root.querySelector("#mgPaletteInput")?.value || ""); return true; }
    if (e.key === "ArrowUp") { mgPaletteSel = Math.max(0, mgPaletteSel - 1); mgPaletteRender(root.querySelector("#mgPaletteInput")?.value || ""); return true; }
    if (e.key === "Enter") {
      const it = items[mgPaletteSel];
      if (it?.run) { mgPaletteClose(); it.run(); }
      return true;
    }
    return false;
  }

  // ===== Sticky save bar =====
  function mgEnsureStickySaveDom() {
    let bar = document.getElementById("mgStickySave");
    if (bar) return bar;
    bar = document.createElement("div");
    bar.id = "mgStickySave";
    bar.className = "mg-sticky-save hidden";
    bar.innerHTML = `
    <div class="mg-sticky-save-inner">
      <div class="mg-sticky-save-text">Unsaved changes</div>
      <div class="mg-sticky-save-actions">
        <button class="mgmt-btn primary" id="mgStickySaveBtn">Save</button>
        <button class="mgmt-btn" id="mgStickyDiscardBtn">Discard</button>
      </div>
    </div>
  `;
    document.body.appendChild(bar);

    bar.querySelector("#mgStickySaveBtn")?.addEventListener("click", () => {
      const prodSave = document.getElementById("prodSave");
      const catSave = document.getElementById("catSave");
      if (prodSave && !prodSave.disabled && prodSave.offsetParent) return prodSave.click();
      if (catSave && !catSave.disabled && catSave.offsetParent) return catSave.click();
      try { if (typeof tariffsUiSave === "function") return tariffsUiSave(); } catch { }
      const accSave = document.getElementById("accExpSave");
      if (accSave && !accSave.disabled && accSave.offsetParent) return accSave.click();
    });

    bar.querySelector("#mgStickyDiscardBtn")?.addEventListener("click", () => {
      const prodDiscard = document.getElementById("prodDiscard");
      if (prodDiscard && !prodDiscard.disabled && prodDiscard.offsetParent) return prodDiscard.click();
      try { if (typeof tariffsUiLoad === "function") return tariffsUiLoad(); } catch { }
      try { if (typeof renderExpenses === "function") return renderExpenses(); } catch { }
    });

    return bar;
  }

  function mgUpdateStickySave() {
    if (!mgFeat("stickySaveBar")) {
      const b = document.getElementById("mgStickySave");
      if (b) b.classList.add("hidden");
      return;
    }
    const bar = mgEnsureStickySaveDom();
    const dirty = !!document.querySelector(".mg-dirty:not(.hidden)") || document.body.classList.contains("mg-has-unsaved");
    bar.classList.toggle("hidden", !dirty);
  }

  // ===== Data freshness badge =====
  function mgUpdateFreshBadge() {
    const b = document.getElementById("mgFreshBadge");
    if (!b) return;
    const oAt = state?._ordersLoadedAt ? new Date(state._ordersLoadedAt) : null;
    const pAt = state?._productsLoadedAt ? new Date(state._productsLoadedAt) : null;
    const parts = [];
    if (oAt) parts.push(`Orders: ${Math.max(0, Math.round((Date.now() - oAt.getTime()) / 60000))}m`);
    if (pAt) parts.push(`Products: ${Math.max(0, Math.round((Date.now() - pAt.getTime()) / 60000))}m`);
    b.textContent = parts.length ? parts.join(" • ") : "";
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
          projects.push({ id, name, api_base: apiBase || "", admin_code: "" });
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
<button class="mgmt-btn" data-act="palette" id="mgPaletteBtn" title="Search (Ctrl+K)">Search</button>
<span class="mgmt-fresh" id="mgFreshBadge" title="Data freshness"></span>
<button class="mgmt-btn" data-act="orders" id="mgOrdersTabBtn">Orders</button>
<button class="mgmt-btn" data-act="graphs" id="mgGraphsTabBtn">Graphs</button>
<button class="mgmt-btn" data-act="analytics" id="mgAnalyticsTabBtn">Analytics</button>
<button class="mgmt-btn" data-act="recs" id="mgRecsTabBtn">Recs</button>
<button class="mgmt-btn" data-act="incentives" id="mgIncentivesTabBtn">Incentives</button>
<button class="mgmt-btn" data-act="profit" id="mgProfitTabBtn">Profit</button>
<button class="mgmt-btn" data-act="email" id="mgEmailTabBtn">Email</button>
<button class="mgmt-btn" data-act="features" id="mgFeaturesTabBtn">Features</button>
<button class="mgmt-btn" data-act="ops" id="mgOpsTabBtn">Ops</button>
<button class="mgmt-btn" data-act="settings" title="Settings">⚙</button>
<button class="mgmt-btn" data-act="density" id="mgDensityToggle" title="Toggle density">Comfort</button>
<button class="mgmt-btn" data-act="theme" id="mgThemeToggle" title="Toggle theme" aria-pressed="false">Light</button>

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

    // Apply feature flags to topbar
    try {
      mgLoadFeatures();
      if (!mgFeat("commandPalette")) {
        const b = document.getElementById("mgPaletteBtn");
        if (b) b.classList.add("hidden");
      }
      if (!mgFeat("dataFreshness")) {
        const b = document.getElementById("mgFreshBadge");
        if (b) b.classList.add("hidden");
      }
      if (!mgFeat("analyticsTab")) {
        const b = document.getElementById("mgAnalyticsTabBtn");
        if (b) b.classList.add("hidden");
      }
      if (mgFeat("recentActivity")) {
        if (!document.getElementById("mgRecentBtn")) {
          const btn = document.createElement("button");
          btn.className = "mg-recent-btn";
          btn.id = "mgRecentBtn";
          btn.type = "button";
          btn.textContent = "Recent";
          btn.title = "Recent activity";
          btn.addEventListener("click", () => mgToggleRecentPanel());
          // Insert after Search button if present, else at end
          const searchBtn = document.getElementById("mgPaletteBtn");
          if (searchBtn && searchBtn.parentElement) {
            searchBtn.insertAdjacentElement("afterend", btn);
          } else {
            actions.appendChild(btn);
          }
        }
      } else {
        document.getElementById("mgRecentBtn")?.remove();
        document.getElementById("mgRecentPanel")?.remove();
      }
    } catch { }

    // Defensive: inject theme toggle if missing (e.g., stale cached topbar HTML)
    if (!actions.querySelector("#mgThemeToggle")) {
      const themeBtn = document.createElement("button");
      themeBtn.className = "mgmt-btn";
      themeBtn.dataset.act = "theme";
      themeBtn.id = "mgThemeToggle";
      themeBtn.title = "Toggle theme";
      themeBtn.setAttribute("aria-pressed", "false");
      themeBtn.textContent = "Light";

      const settingsBtn = actions.querySelector('[data-act="settings"]');
      if (settingsBtn && typeof settingsBtn.after === "function") {
        settingsBtn.after(themeBtn);
      } else {
        actions.appendChild(themeBtn);
      }
    }



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

    const thbtn = btn("theme");
    if (thbtn) {
      thbtn.onclick = () => mgThemeToggle();
      mgThemeUpdateToggle();
    }
    const dbtn = btn("density");
    if (dbtn) {
      dbtn.onclick = () => mgDensityToggle();
      // apply persisted density on mount
      try { mgDensityApply(mgDensityGet()); } catch { }
      mgDensityUpdateToggle();
    } else {
      try { mgDensityApply(mgDensityGet()); } catch { }
    }

	    const palBtn = btn("palette");
	    if (palBtn) {
	      palBtn.onclick = () => mgPaletteOpen();
	    }

    // Global shortcuts
    document.addEventListener("keydown", (e) => {
      // palette handles its own keys
      if (mgFeat("commandPalette") && mgPaletteKeydown(e)) { e.preventDefault(); e.stopPropagation(); return; }

      const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
      const mod = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl+K / Cmd+K
      if (mod && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        if (mgFeat("commandPalette")) { mgPaletteOpen(); }
        return;
      }

      // Arrow-key navigation in Orders
      if (mgFeat("keyboardNav") && !mod && !mgIsTypingContext()) {
        if (mgOrdersKeyboardNav(e)) { e.preventDefault(); return; }
      }

      // Ctrl+S / Cmd+S save (contextual)
      if (mod && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        // click sticky save if visible; otherwise best-effort
        const sticky = document.getElementById("mgStickySaveBtn");
        if (sticky && sticky.offsetParent) sticky.click();
        return;
      }
    }, { capture: true });

    // Ensure sticky save + freshness badge update loop
    mgEnsureStickySaveDom();
    setInterval(() => {
      try { mgUpdateStickySave(); } catch { }
      try { mgUpdateFreshBadge(); } catch { }
    }, 1000);

    // Persist common filters/search per tab (localStorage)
    function mgRemember(id, key) {
      const el = document.getElementById(id);
      if (!el) return;
      const k = "mg_tab_" + key;
      try {
        const v = localStorage.getItem(k);
        if (v != null && el.value !== v) el.value = v;
      } catch { }
      const save = () => { try { localStorage.setItem(k, String(el.value || "")); } catch { } };
      el.addEventListener("input", save);
      el.addEventListener("change", save);
    }
    mgRemember("prodSearch", "prodSearch");
    mgRemember("catSearch", "catSearch");
    mgRemember("accExpSearch", "accExpSearch");
    mgRemember("accExpFrom", "accExpFrom");
    mgRemember("accExpTo", "accExpTo");


    tbtn("excel").onclick = () => actionRunner(async () => {
      await safeEnsureLogin();
      const { from, to } = getOrdersRangeIso();
      if (!window.adminApi?.exportExcel) throw new Error("adminApi.exportExcel not available");
      await window.adminApi.exportExcel({ from, to, limit: 10000 });
      ttoast("Export", "orders.xlsx download started");
    }, "Excel export");


    const ordBtn = btn("orders");
    if (ordBtn) {
      ordBtn._mgWired = true;
      ordBtn.onclick = () => actionRunner(async () => {
        await safeEnsureLogin();

        // Hide embedded Recommendations tab if open
        try { recsUiHide?.(); } catch (e) { }

        // Leaving Analytics: fully tear down its UI (prevents stale/huge DOM from lingering)
        try { window.analyticsUiHide?.(true); } catch (e) { }

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

        // Hide embedded Recommendations tab if open
        try { recsUiHide?.(); } catch (e) { }

        // Leaving Analytics: fully tear down its UI
        try { window.analyticsUiHide?.(true); } catch (e) { }

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

    // Analytics tab
    const abtn = btn("analytics");
    if (abtn) {
      abtn._mgWired = true;
      abtn.onclick = () => actionRunner(async () => {
        await safeEnsureLogin();
        if (!mgFeat("analyticsTab")) return;
        try { recsUiHide?.(); } catch { }
        try { incentivesUiHide?.(); } catch { }
        try { profitUiHide?.(); } catch { }
        try { profitUiHide?.(); } catch { }
        try { profitUiHide?.(); } catch { }
        try { tariffsUiHide?.(); } catch { }
        try { productsUiHide?.(); } catch { }
        try { accountingUiHide?.(); } catch { }
        try { window.graphEngine?.close?.(); } catch { }
        localStorage.setItem("mgmt_active_tab", "analytics");
        try { updateMgmtTabButtons?.(); } catch { }
        try { renderFilters(true); } catch { }
        try { const groups = document.getElementById("groups"); if (groups) groups.innerHTML = ""; } catch { }
        if (typeof analyticsUiShow === "function") await analyticsUiShow();
      }, "Analytics");
    }

    // Recommendations tab (embedded in index.html)
    const rbtn = btn("recs");
    if (rbtn) {
      rbtn._mgWired = true;
      rbtn.onclick = () => actionRunner(async () => {
        await safeEnsureLogin();

        // Hide other tab panels
        try { window.analyticsUiHide?.(true); } catch { }
        try { tariffsUiHide?.(); } catch { }
        try { productsUiHide?.(); } catch { }
        try { accountingUiHide?.(); } catch { }
        try { window.graphEngine?.close?.(); } catch { }

        // Hide orders list area to avoid mixing DOM
        try { const groups = document.getElementById("groups"); if (groups) groups.innerHTML = ""; } catch { }

        // Show recommendations tab
        try { recsUiShow?.(); } catch { }
        localStorage.setItem("mgmt_active_tab", "recs");
        try { updateMgmtTabButtons?.(); } catch { }
        try { renderFilters(true); } catch { }
      }, "Recommendations");
    }

    
    // Incentives tab (embedded in index.html)
    const ibtn = btn("incentives");
    if (ibtn) {
      ibtn._mgWired = true;
      ibtn.onclick = () => actionRunner(async () => {
        await safeEnsureLogin();

        // Hide other tab panels
        try { recsUiHide?.(); } catch { }
        try { incentivesUiHide?.(); } catch { }
        try { profitUiHide?.(); } catch { }
        try { emailUiHide?.(); } catch { }
        try { featuresUiHide?.(); } catch { }
        try { profitUiHide?.(); } catch { }
        try { profitUiHide?.(); } catch { }
        try { window.analyticsUiHide?.(true); } catch { }
        try { tariffsUiHide?.(); } catch { }
        try { productsUiHide?.(); } catch { }
        try { accountingUiHide?.(); } catch { }
        try { window.graphEngine?.close?.(); } catch { }

        // Hide orders list area to avoid mixing DOM
        try { const groups = document.getElementById("groups"); if (groups) groups.innerHTML = ""; } catch { }

        // Show incentives tab
        try { incentivesUiShow?.(); } catch { }
        localStorage.setItem("mgmt_active_tab", "incentives");
        try { updateMgmtTabButtons?.(); } catch { }
        try { renderFilters(true); } catch { }

        // Lazy-wire incentives UI (safe even if called multiple times)
        try { mgIncentivesWireUi?.(); } catch { }
      }, "Incentives");
    }



    // Profit tab (embedded in index.html)
    const pbtn = btn("profit");
    if (pbtn) {
      pbtn._mgWired = true;
      pbtn.onclick = () => actionRunner(async () => {
        await safeEnsureLogin();

        // Hide other tab panels
        try { recsUiHide?.(); } catch { }
        try { incentivesUiHide?.(); } catch { }
        try { profitUiHide?.(); } catch { }
        try { emailUiHide?.(); } catch { }
        try { featuresUiHide?.(); } catch { }
        try { profitUiHide?.(); } catch { }
        try { profitUiHide?.(); } catch { }
        try { profitUiHide?.(); } catch { }
        try { window.analyticsUiHide?.(true); } catch { }
        try { tariffsUiHide?.(); } catch { }
        try { productsUiHide?.(); } catch { }
        try { accountingUiHide?.(); } catch { }
        try { window.graphEngine?.close?.(); } catch { }

        try { const groups = document.getElementById("groups"); if (groups) groups.innerHTML = ""; } catch { }

        try { profitUiShow?.(); } catch { }
        try { localStorage.setItem("mg_active_tab", "profit"); } catch { }
        try { updateMgmtTabButtons?.(); } catch { }

        try { await profitInit?.(); } catch (e) { console.warn("profitInit failed", e); }
      }, "Profit");
    }


    // Email tab (embedded in index.html)
    const ebtn = btn("email");
    if (ebtn) {
      ebtn._mgWired = true;
      ebtn.onclick = () => actionRunner(async () => {
        await safeEnsureLogin();

        // Hide other tab panels
        try { recsUiHide?.(); } catch { }
        try { incentivesUiHide?.(); } catch { }
        try { profitUiHide?.(); } catch { }
        try { emailUiHide?.(); } catch { }
        try { featuresUiHide?.(); } catch { }
        try { window.analyticsUiHide?.(true); } catch { }
        try { tariffsUiHide?.(); } catch { }
        try { productsUiHide?.(); } catch { }
        try { accountingUiHide?.(); } catch { }
        try { window.graphEngine?.close?.(); } catch { }

        try { const groups = document.getElementById("groups"); if (groups) groups.innerHTML = ""; } catch { }

        try { emailUiShow?.(); } catch { }
        try { localStorage.setItem("mgmt_active_tab", "email"); } catch { }
        try { updateMgmtTabButtons?.(); } catch { }
        try { renderFilters(true); } catch { }
      }, "Email");
    }
btn("settings").onclick = () => {
      try { openSettingsModal(); } catch (e) { ttoast("Error", String(e?.message || e)); }
    };

    
    // Features tab (embedded in index.html)
    const fbtn = btn("features");
    if (fbtn) {
      fbtn._mgWired = true;
      fbtn.onclick = () => actionRunner(async () => {
        await safeEnsureLogin();
        // Hide others
        try { ordersUiHide?.(); } catch { }
        try { productsUiHide?.(); } catch { }
        try { tariffsUiHide?.(); } catch { }
        try { graphsUiHide?.(); } catch { }
        try { analyticsUiHide?.(); } catch { }
        try { recsUiHide?.(); } catch { }
        try { incentivesUiHide?.(); } catch { }
        try { profitUiHide?.(); } catch { }
        try { emailUiHide?.(); } catch { }
        try { featuresUiHide?.(); } catch { }
        try { accountingUiHide?.(); } catch { }
        try { window.graphEngine?.close?.(); } catch { }
        try { const groups = document.getElementById("groups"); if (groups) groups.innerHTML = ""; } catch { }

        try { featuresUiShow?.(); } catch { }
        try { window.loadFeatureFlagsUi?.(); } catch { }
        try { localStorage.setItem("mgmt_active_tab", "features"); } catch { }
        try { updateMgmtTabButtons?.(); } catch { }
        try { renderFilters(true); } catch { }
      }, "Features");
    }


    // Ops tab
    const opsBtn = btn("ops");
    if (opsBtn) {
      opsBtn._mgWired = true;
      opsBtn.onclick = () => actionRunner(async () => {
        await safeEnsureLogin();
        try { ordersUiHide?.(); } catch { }
        try { productsUiHide?.(); } catch { }
        try { tariffsUiHide?.(); } catch { }
        try { graphsUiHide?.(); } catch { }
        try { analyticsUiHide?.(); } catch { }
        try { recsUiHide?.(); } catch { }
        try { incentivesUiHide?.(); } catch { }
        try { profitUiHide?.(); } catch { }
        try { emailUiHide?.(); } catch { }
        try { featuresUiHide?.(); } catch { }
        try { accountingUiHide?.(); } catch { }
        try { opsUiHide?.(); } catch { }
        try { window.graphEngine?.close?.(); } catch { }
        try { const groups = document.getElementById("groups"); if (groups) groups.innerHTML = ""; } catch { }
        if (typeof opsUiShow === "function") opsUiShow();
        if (typeof mgOpsInit === "function") mgOpsInit();
      }, "Ops");
    }

// Products tab
    const __pb = btn("products");
    if (__pb) {
      __pb._mgWired = true;
      __pb.onclick = () => actionRunner(async () => {
        await safeEnsureLogin();
        try { recsUiHide?.(); } catch { }
        try { incentivesUiHide?.(); } catch { }
        try { profitUiHide?.(); } catch { }
        try { emailUiHide?.(); } catch { }
        try { featuresUiHide?.(); } catch { }
        try { profitUiHide?.(); } catch { }
        try { profitUiHide?.(); } catch { }
        try { window.analyticsUiHide?.(true); } catch (e) { }
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
        try { recsUiHide?.(); } catch { }
        try { incentivesUiHide?.(); } catch { }
        try { profitUiHide?.(); } catch { }
        try { emailUiHide?.(); } catch { }
        try { featuresUiHide?.(); } catch { }
        try { profitUiHide?.(); } catch { }
        try { profitUiHide?.(); } catch { }
        try { window.analyticsUiHide?.(true); } catch (e) { }
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
      try { recsUiHide?.(); } catch { }
        try { incentivesUiHide?.(); } catch { }
        try { profitUiHide?.(); } catch { }
        try { profitUiHide?.(); } catch { }
        try { profitUiHide?.(); } catch { }
      try { window.analyticsUiHide?.(true); } catch (e) { }
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
    const token = mgGetSessionToken();
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
    const opts = p?.productOptions || p?.optionGroups || p?.options || null;
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

// ===== Option pricing UI (Product editor) =====
const _peVpUi = {
  wired: false,
  groups: [],           // [{name, values[]}]
  groupOrder: [],       // ["Color","Size",...]
  pricedGroup: "",
  baseSell: 0,
  baseBuy: 0,
  // maps we actually edit
  vp: {},               // variantPrices
  vpp: {},              // variantPurchasePrices
  // initial raw strings (to preserve "blank means keep unchanged")
  vpRawInitial: "",
  vppRawInitial: "",
  // dirty flags
  vpDirty: false,
  vppDirty: false,
  // tester selection
  selected: {}
};

function _peVpSafeJsonParse(s) {
  const t = String(s || "").trim();
  if (!t) return { ok: true, value: null };
  try { return { ok: true, value: JSON.parse(t) }; }
  catch (e) { return { ok: false, value: null, err: e }; }
}

function _peVpNormalizeOptions(raw) {
  // returns { groups:[{name, values[]}], order:[name...] }
  const out = { groups: [], order: [] };
  if (raw === undefined || raw === null || raw === "") return out;

  // If it's a string, treat as "single group name" with unknown values (not supported)
  if (typeof raw === "string") return out;

  // Common format: object map { "Color": ["Red","Blue"], ... }
  if (typeof raw === "object" && !Array.isArray(raw)) {
    const keys = Object.keys(raw);
    for (const k of keys) {
      const name = String(k || "").trim();
      if (!name) continue;
      const v = raw[k];
      const values = Array.isArray(v) ? v.map(x => String(x)).filter(Boolean) : [];
      if (!values.length) continue;
      out.groups.push({ name, values });
    }
    out.order = out.groups.map(g => g.name);
    return out;
  }

  // Alternative: [{name:"Size", values:[...]}, ...]
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (!item) continue;
      if (typeof item === "object" && !Array.isArray(item)) {
        const name = String(item.name || item.label || item.title || item.key || "").trim();
        const rawVals = Array.isArray(item.values) ? item.values : (Array.isArray(item.options) ? item.options : []);
        const values = rawVals.map(x => String(x)).filter(Boolean);
        if (name && values.length) out.groups.push({ name, values });
      }
    }
    out.order = out.groups.map(g => g.name);
  }
  return out;
}

function _peVpBuildGroupKey(group, value) {
  return `${String(group).trim()}=${String(value).trim()}`;
}

function _peVpBuildFullKey(groupOrder, selected) {
  const parts = [];
  for (const g of (groupOrder || [])) {
    const v = selected && selected[g];
    if (!v) continue;
    parts.push(`${g}=${v}`);
  }
  return parts.join(" | ");
}

function _peVpResolveFromMap(baseValue, map, groupOrder, selected) {
  const m = (map && typeof map === "object") ? map : {};
  const fullKey = _peVpBuildFullKey(groupOrder, selected);
  if (fullKey && Object.prototype.hasOwnProperty.call(m, fullKey)) {
    const val = Number(m[fullKey]);
    if (Number.isFinite(val)) return { value: val, keyUsed: fullKey, source: "combo" };
  }

  for (const g of (groupOrder || [])) {
    const v = selected && selected[g];
    if (!v) continue;
    const key = _peVpBuildGroupKey(g, v);
    if (Object.prototype.hasOwnProperty.call(m, key)) {
      const val = Number(m[key]);
      if (Number.isFinite(val)) return { value: val, keyUsed: key, source: "group" };
    }
  }

  return { value: Number(baseValue) || 0, keyUsed: "", source: "base" };
}

function _peVpInferPricedGroup(optsNorm, storedGroup, vp, vpp) {
  const groups = (optsNorm?.order || []);
  if (storedGroup && groups.includes(storedGroup)) return storedGroup;

  // Infer from simple keys like "Size=M" across vp/vpp
  const scan = (m) => {
    if (!m || typeof m !== "object") return null;
    const keys = Object.keys(m);
    if (!keys.length) return null;
    let candidate = null;
    for (const k of keys) {
      if (k.includes("|")) return null; // combo keys exist
      const mm = String(k).match(/^([^=]+)=/);
      if (!mm) return null;
      const g = mm[1].trim();
      if (!groups.includes(g)) return null;
      if (!candidate) candidate = g;
      if (candidate !== g) return null;
    }
    return candidate;
  };

  return scan(vp) || scan(vpp) || "";
}

function _peVpSetTextareasFromState() {
  const vpEl = document.getElementById("peVariantPrices");
  const vppEl = document.getElementById("peVariantPurchasePrices");

  const vpObj = (_peVpUi.vp && typeof _peVpUi.vp === "object") ? _peVpUi.vp : {};
  const vppObj = (_peVpUi.vpp && typeof _peVpUi.vpp === "object") ? _peVpUi.vpp : {};

  // Preserve original "blank means keep unchanged" unless user actually edited
  if (vpEl) {
    if (_peVpUi.vpDirty || String(_peVpUi.vpRawInitial || "").trim() !== "") {
      vpEl.value = JSON.stringify(vpObj, null, 2);
    }
  }
  if (vppEl) {
    if (_peVpUi.vppDirty || String(_peVpUi.vppRawInitial || "").trim() !== "") {
      vppEl.value = JSON.stringify(vppObj, null, 2);
    }
  }
}

function _peVpUpdateKeyWarning() {
  const warn = document.getElementById("vpKeyWarning");
  if (!warn) return;

  const pg = _peVpUi.pricedGroup;
  if (!pg) { warn.hidden = true; warn.textContent = ""; return; }

  const keys = new Set([].concat(Object.keys(_peVpUi.vp || {}), Object.keys(_peVpUi.vpp || {})));
  const advanced = [];
  for (const k of keys) {
    const ks = String(k);
    if (ks.includes("|")) { advanced.push(ks); continue; }
    const mm = ks.match(/^([^=]+)=/);
    if (mm) {
      const g = mm[1].trim();
      if (g !== pg) advanced.push(ks);
    } else {
      advanced.push(ks);
    }
  }

  if (!advanced.length) { warn.hidden = true; warn.textContent = ""; return; }

  warn.hidden = false;
  warn.textContent = `Note: ${advanced.length} advanced key(s) exist (combo/other groups). UI edits only "${pg}=…". Use Advanced JSON to edit complex keys.`;
}

function _peVpRenderGroupSelect() {
  const sel = document.getElementById("pePricedGroup");
  if (!sel) return;

  const groups = _peVpUi.groupOrder || [];
  sel.innerHTML = "";

  const opt0 = document.createElement("option");
  opt0.value = "";
  opt0.textContent = "— choose —";
  sel.appendChild(opt0);

  for (const g of groups) {
    const opt = document.createElement("option");
    opt.value = g;
    opt.textContent = g;
    sel.appendChild(opt);
  }

  if (_peVpUi.pricedGroup && groups.includes(_peVpUi.pricedGroup)) {
    sel.value = _peVpUi.pricedGroup;
  } else {
    sel.value = "";
  }

  sel.disabled = groups.length === 0;
}

function _peVpRenderTable() {
  const tbody = document.getElementById("vpTbody");
  if (!tbody) return;

  const pg = _peVpUi.pricedGroup;
  const group = (_peVpUi.groups || []).find(g => g.name === pg);

  tbody.innerHTML = "";
  if (!pg || !group || !Array.isArray(group.values) || !group.values.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 5;
    td.style.padding = "14px 10px";
    td.style.color = "var(--ui-muted)";
    td.textContent = _peVpUi.groupOrder.length
      ? "Select a priced option group to edit prices."
      : "No product options detected. Add Options first.";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  for (const val of group.values) {
    const key = _peVpBuildGroupKey(pg, val);
    const sell = (_peVpUi.vp && Object.prototype.hasOwnProperty.call(_peVpUi.vp, key)) ? _peVpUi.vp[key] : "";
    const buy = (_peVpUi.vpp && Object.prototype.hasOwnProperty.call(_peVpUi.vpp, key)) ? _peVpUi.vpp[key] : "";

    const sellNum = (sell === "" || sell === null || sell === undefined) ? null : Number(sell);
    const buyNum = (buy === "" || buy === null || buy === undefined) ? null : Number(buy);

    const effSell = Number.isFinite(sellNum) ? sellNum : _peVpUi.baseSell;
    const effBuy = Number.isFinite(buyNum) ? buyNum : _peVpUi.baseBuy;
    const profit = (Number.isFinite(effSell) && Number.isFinite(effBuy)) ? (effSell - effBuy) : 0;

    const tr = document.createElement("tr");

    const tdV = document.createElement("td");
    tdV.textContent = String(val);
    tr.appendChild(tdV);

    const tdS = document.createElement("td");
    tdS.innerHTML = `<input type="number" step="0.01" inputmode="decimal" class="vp-sell" data-key="${encodeURIComponent(key)}" value="${sell === "" ? "" : String(sell)}" placeholder="—" />`;
    tr.appendChild(tdS);

    const tdB = document.createElement("td");
    tdB.innerHTML = `<input type="number" step="0.01" inputmode="decimal" class="vp-buy" data-key="${encodeURIComponent(key)}" value="${buy === "" ? "" : String(buy)}" placeholder="—" />`;
    tr.appendChild(tdB);

    const tdP = document.createElement("td");
    tdP.className = "vp-profit";
    tdP.textContent = Number.isFinite(profit) ? profit.toFixed(2) : "—";
    tr.appendChild(tdP);

    const tdC = document.createElement("td");
    tdC.style.textAlign = "right";
    tdC.innerHTML = `<button type="button" class="vp-clearbtn" data-key="${encodeURIComponent(key)}">Clear</button>`;
    tr.appendChild(tdC);

    tbody.appendChild(tr);
  }
}

function _peVpRenderTester() {
  const host = document.getElementById("vpTesterOptions");
  const sum = document.getElementById("vpTesterSummary");
  if (!host || !sum) return;

  host.innerHTML = "";
  sum.innerHTML = "";

  if (!_peVpUi.groupOrder.length) {
    sum.textContent = "Add Options to enable testing.";
    return;
  }

  // Render as selects (not buttons). This scales better for many options and avoids
  // clutter in the tester panel.
  for (const g of _peVpUi.groupOrder) {
    const group = (_peVpUi.groups || []).find(x => x.name === g);
    if (!group) continue;

    const wrap = document.createElement("div");
    wrap.className = "vp-opt-group";

    const title = document.createElement("div");
    title.className = "vp-opt-title";
    title.textContent = g;
    wrap.appendChild(title);

    const sel = document.createElement("select");
    sel.className = "vp-opt-sel";
    sel.dataset.group = g;

    // Allow an explicit "no selection" state.
    const opt0 = document.createElement("option");
    opt0.value = "";
    opt0.textContent = "—";
    sel.appendChild(opt0);

    for (const v of group.values) {
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      sel.appendChild(opt);
    }

    const cur = _peVpUi.selected[g] || "";
    sel.value = (group.values || []).includes(cur) ? cur : "";

    wrap.appendChild(sel);
    host.appendChild(wrap);
  }

  const sell = _peVpResolveFromMap(_peVpUi.baseSell, _peVpUi.vp, _peVpUi.groupOrder, _peVpUi.selected);
  const buy = _peVpResolveFromMap(_peVpUi.baseBuy, _peVpUi.vpp, _peVpUi.groupOrder, _peVpUi.selected);
  const profit = (sell.value - buy.value);

  const fullKey = _peVpBuildFullKey(_peVpUi.groupOrder, _peVpUi.selected) || "(no selection)";
  sum.innerHTML = `
    <div class="vp-sum">
      <div class="vp-sumrow">
        <div class="vp-sumlabel">Selection</div>
        <div class="vp-sumvalue vp-sumkey">${escapeHtml(fullKey)}</div>
      </div>

      <div class="vp-sumrow">
        <div class="vp-sumlabel">Selling</div>
        <div class="vp-sumvalue">
          <span class="vp-money">€${sell.value.toFixed(2)}</span>
          <span class="vp-source">${sell.keyUsed ? `from ${escapeHtml(sell.keyUsed)}` : `base`}</span>
        </div>
      </div>

      <div class="vp-sumrow">
        <div class="vp-sumlabel">Purchase</div>
        <div class="vp-sumvalue">
          <span class="vp-money">€${buy.value.toFixed(2)}</span>
          <span class="vp-source">${buy.keyUsed ? `from ${escapeHtml(buy.keyUsed)}` : `base`}</span>
        </div>
      </div>

      <div class="vp-sumrow">
        <div class="vp-sumlabel">Profit</div>
        <div class="vp-sumvalue">
          <span class="vp-money vp-profitmoney ${profit >= 0 ? "is-pos" : "is-neg"}">€${profit.toFixed(2)}</span>
        </div>
      </div>
    </div>
  `;
}

function _peVpRenderAll() {
  const baseSellEl = document.getElementById("vpBaseSell");
  const baseBuyEl = document.getElementById("vpBaseBuy");
  if (baseSellEl) baseSellEl.textContent = `€${Number(_peVpUi.baseSell || 0).toFixed(2)}`;
  if (baseBuyEl) baseBuyEl.textContent = `€${Number(_peVpUi.baseBuy || 0).toFixed(2)}`;

  _peVpRenderGroupSelect();
  _peVpUpdateKeyWarning();
  _peVpRenderTable();
  _peVpRenderTester();
}

function _peVpLoadFromProduct(p) {
  _peVpUi.baseSell = Number(p?.price || 0) || 0;
  _peVpUi.baseBuy = Number(p?.expectedPurchasePrice || 0) || 0;

  let opts = p?.productOptions;
  // Back-compat: most of this app stores options under `options` (textarea pe_opts),
  // while older builds used `productOptions`.
  if (!opts && p?.options) opts = p.options;

  // If product object doesn't have options (or is stale), fall back to editor textarea.
  if (!opts) {
    const optsEl = document.getElementById("pe_opts") || document.getElementById("peOptions");
    if (optsEl && typeof optsEl.value === "string") {
      const parsed = _peVpSafeJsonParse(optsEl.value);
      if (parsed.ok) opts = parsed.value;
    }
  }

  const norm = _peVpNormalizeOptions(opts);

  _peVpUi.groups = norm.groups || [];
  _peVpUi.groupOrder = norm.order || [];

  // Default priced group to first available group for convenience
  if (!_peVpUi.pricedGroup && _peVpUi.groupOrder.length) {
    _peVpUi.pricedGroup = _peVpUi.groupOrder[0];
  }

  // Raw JSON textarea values (preserve blank semantics)
  const vpEl = document.getElementById("peVariantPrices");
  const vppEl = document.getElementById("peVariantPurchasePrices");
  _peVpUi.vpRawInitial = String(vpEl?.value || "").trim();
  _peVpUi.vppRawInitial = String(vppEl?.value || "").trim();

  // Parse maps (even if blank)
  const vpParsed = _peVpSafeJsonParse(_peVpUi.vpRawInitial);
  if (!vpParsed.ok) { /* keep empty; user will see error when editing */ }
  _peVpUi.vp = (vpParsed.value && typeof vpParsed.value === "object") ? vpParsed.value : {};

  const vppParsed = _peVpSafeJsonParse(_peVpUi.vppRawInitial);
  if (!vppParsed.ok) { /* keep empty */ }
  _peVpUi.vpp = (vppParsed.value && typeof vppParsed.value === "object") ? vppParsed.value : {};

  _peVpUi.vpDirty = false;
  _peVpUi.vppDirty = false;

  const storedGroup = String(p?.pricedOptionGroup || p?.pricedOptionCategory || "").trim();
  _peVpUi.pricedGroup = _peVpInferPricedGroup(norm, storedGroup, _peVpUi.vp, _peVpUi.vpp);

  // tester defaults: pick first value for each group
  _peVpUi.selected = {};
  for (const g of _peVpUi.groupOrder) {
    const gg = _peVpUi.groups.find(x => x.name === g);
    if (gg?.values?.length) _peVpUi.selected[g] = gg.values[0];
  }

  _peVpRenderAll();
}

function _peVpLoadFromTextareas() {
  const vpEl = document.getElementById("peVariantPrices");
  const vppEl = document.getElementById("peVariantPurchasePrices");

  if (vpEl) {
    const p = _peVpSafeJsonParse(vpEl.value);
    if (!p.ok) { toast("Invalid JSON", "variantPrices"); return; }
    _peVpUi.vp = (p.value && typeof p.value === "object") ? p.value : {};
    _peVpUi.vpDirty = true; // user edited JSON
  }
  if (vppEl) {
    const p = _peVpSafeJsonParse(vppEl.value);
    if (!p.ok) { toast("Invalid JSON", "variantPurchasePrices"); return; }
    _peVpUi.vpp = (p.value && typeof p.value === "object") ? p.value : {};
    _peVpUi.vppDirty = true;
  }

  _peVpUpdateKeyWarning();
  _peVpRenderTable();
  _peVpRenderTester();
}

function _peVpEnsureWired() {
  if (_peVpUi.wired) return;
  _peVpUi.wired = true;

  // Use event delegation so this works for both:
  // - the modal product editor (with peOptions/pePrice/pePurchase)
  // - the inline products editor (with pe_opts/pe_sell/pe_buy)
  document.addEventListener("change", (e) => {
    const el = e.target;
    if (!(el instanceof HTMLElement)) return;

    if (el.id === "pePricedGroup") {
      _peVpUi.pricedGroup = String(el.value || "");
      _peVpUpdateKeyWarning();
      _peVpRenderTable();
      _peVpRenderTester();
      return;
    }

    // tester selects (replaces old button UI)
    if (el.classList && el.classList.contains("vp-opt-sel")) {
      const g = String(el.dataset.group || "").trim();
      if (!g) return;
      const v = String(el.value || "").trim();
      if (!v) delete _peVpUi.selected[g];
      else _peVpUi.selected[g] = v;
      _peVpRenderTester();
      return;
    }
  });

  document.addEventListener("click", (e) => {
    const el = e.target;
    if (!(el instanceof HTMLElement)) return;

    // reset tester selections
    if (el.id === "vpTesterReset") {
      _peVpUi.selected = {};
      for (const g of _peVpUi.groupOrder) {
        const gg = _peVpUi.groups.find(x => x.name === g);
        if (gg?.values?.length) _peVpUi.selected[g] = gg.values[0];
      }
      _peVpRenderTester();
      return;
    }

    // clear a single row key
    if (el.classList.contains("vp-clearbtn") && el.dataset.key) {
      const key = decodeURIComponent(String(el.dataset.key || ""));
      if (key) {
        if (_peVpUi.vp && Object.prototype.hasOwnProperty.call(_peVpUi.vp, key)) { delete _peVpUi.vp[key]; _peVpUi.vpDirty = true; }
        if (_peVpUi.vpp && Object.prototype.hasOwnProperty.call(_peVpUi.vpp, key)) { delete _peVpUi.vpp[key]; _peVpUi.vppDirty = true; }
        _peVpSetTextareasFromState();
        _peVpRenderTable();
        _peVpRenderTester();
      }
      return;
    }

  });

  document.addEventListener("input", (e) => {
    const el = e.target;

    // table inputs + base numbers
    if (el instanceof HTMLInputElement) {
      if ((el.classList.contains("vp-sell") || el.classList.contains("vp-buy")) && el.closest && el.closest("#vpTbody")) {
        const encKey = el.dataset.key;
        if (!encKey) return;
        const key = decodeURIComponent(encKey);

        if (el.classList.contains("vp-sell")) {
          const v = String(el.value || "").trim();
          if (v === "") {
            if (_peVpUi.vp && Object.prototype.hasOwnProperty.call(_peVpUi.vp, key)) delete _peVpUi.vp[key];
          } else {
            const num = Number(v);
            if (Number.isFinite(num)) _peVpUi.vp[key] = num;
          }
          _peVpUi.vpDirty = true;
          _peVpSetTextareasFromState();
          _peVpRenderTable();
          _peVpRenderTester();
          return;
        }

        if (el.classList.contains("vp-buy")) {
          const v = String(el.value || "").trim();
          if (v === "") {
            if (_peVpUi.vpp && Object.prototype.hasOwnProperty.call(_peVpUi.vpp, key)) delete _peVpUi.vpp[key];
          } else {
            const num = Number(v);
            if (Number.isFinite(num)) _peVpUi.vpp[key] = num;
          }
          _peVpUi.vppDirty = true;
          _peVpSetTextareasFromState();
          _peVpRenderTable();
          _peVpRenderTester();
          return;
        }
      }

      if (el.id === "pePrice" || el.id === "pe_sell") {
        _peVpUi.baseSell = Number(el.value || 0) || 0;
        _peVpRenderAll();
        return;
      }

      if (el.id === "pePurchase" || el.id === "pe_buy") {
        _peVpUi.baseBuy = Number(el.value || 0) || 0;
        _peVpRenderAll();
        return;
      }
    }

    // manual JSON edits (advanced view) - debounce a bit
    if (el instanceof HTMLTextAreaElement) {
      if (el.id === "peVariantPrices" || el.id === "peVariantPurchasePrices") {
        if (_peVpUi._vpDeb) clearTimeout(_peVpUi._vpDeb);
        _peVpUi._vpDeb = setTimeout(() => {
          _peVpUi._vpDeb = null;
          _peVpLoadFromTextareas();
          _peVpRenderTable();
          _peVpRenderTester();
        }, 250);
        return;
      }

      // options/groups (debounced)
      if (el.id === "peOptions" || el.id === "pe_opts") {
        if (_peVpUi._optDeb) clearTimeout(_peVpUi._optDeb);
        _peVpUi._optDeb = setTimeout(() => {
          _peVpUi._optDeb = null;
          const optsRaw = String(el.value || "").trim();
          if (!optsRaw) {
            _peVpUi.groups = [];
            _peVpUi.groupOrder = [];
            _peVpUi.pricedGroup = "";
            _peVpUi.selected = {};
            _peVpRenderAll();
            return;
          }
          const p = _peVpSafeJsonParse(optsRaw);
          if (!p.ok) return;
          const norm = _peVpNormalizeOptions(p.value);
          _peVpUi.groups = norm.groups || [];
          _peVpUi.groupOrder = norm.order || [];
          if (!_peVpUi.pricedGroup && _peVpUi.groupOrder.length) _peVpUi.pricedGroup = _peVpUi.groupOrder[0];
          if (_peVpUi.pricedGroup && !_peVpUi.groupOrder.includes(_peVpUi.pricedGroup)) _peVpUi.pricedGroup = "";
          _peVpRenderAll();
        }, 350);
        return;
      }
    }
  });
}


function getProductFromCache(productId) {
  const productsById = _catalogCache?.productsById || {};
  return productsById[String(productId || "").trim()] || null;
}

function openProductEditor(productId) {
  const p = getProductFromCache(productId);
  if (!p) { alert("Product not found in cache. Reload catalogue."); return; }

  // Soft locking: prevent opening the same product twice
  try {
    if (mgFeat("softLocking") && String(_editingProductId || "") === String(productId || "")) {
      const pm = document.getElementById("productEditorModal");
      if (pm && !pm.hasAttribute("hidden")) {
        toast("This product is already open.");
        return;
      }
    }
  } catch { }
  _editingProductId = String(productId);

  try {
    mgRecordRecent({ type: "product", id: String(productId || ""), title: "Product opened", subtitle: (p.name || p.title || String(productId || "")) });
  } catch { }

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


  const vpps = p.variantPurchasePrices;
  const vppEl = document.getElementById("peVariantPurchasePrices");
  if (vppEl) vppEl.value = (vpps === undefined || vpps === null) ? "" : JSON.stringify(vpps, null, 2);

  _peVpEnsureWired();
  _peVpLoadFromProduct(p);
  setImagesToolsFromProduct(p);

  document.getElementById("productEditorModal").hidden = false;
}

function closeProductEditor() {
  document.getElementById("productEditorModal").hidden = true;
  _editingProductId = null;
}

async function saveProductEditor() {
  const isCreate = !_editingProductId;

  // keep Option pricing UI + JSON in sync before reading
  try { _peVpSetTextareasFromState(); } catch (_e) { }

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


  const vppRaw = String(document.getElementById("peVariantPurchasePrices")?.value || "").trim();
  let variantPurchasePrices = undefined;
  if (vppRaw !== "") {
    try {
      variantPurchasePrices = JSON.parse(vppRaw);
    } catch (_e) {
      alert("Variant purchase prices must be valid JSON.");
      return;
    }
  }

  const pricedOptionGroup = String(document.getElementById("pePricedGroup")?.value || "").trim();
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
  if (variantPurchasePrices !== undefined) body.variantPurchasePrices = variantPurchasePrices;
  if (pricedOptionGroup) body.pricedOptionGroup = pricedOptionGroup;

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

  if (typeof Chart === "undefined") {
    alert("Chart.js library not loaded.");
    return;
  }

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
  const vppEl = document.getElementById("peVariantPurchasePrices");
  if (vppEl) vppEl.value = "";

  _peVpEnsureWired();
  _peVpLoadFromProduct({ price: 0, expectedPurchasePrice: 0, productOptions: undefined, variantPrices: {}, variantPurchasePrices: {} });
  const __peAuto = document.getElementById("peAutoImages");
  if (__peAuto) __peAuto.checked = true;
  const __peImgCnt = document.getElementById("peImageCount");
  if (__peImgCnt) __peImgCnt.value = "6";
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
    const token = mgGetSessionToken();
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
    const payload = (catLists && typeof catLists === 'object' && 'categories' in catLists) ? catLists : { categories: (catLists || {}) };
    const r = await fetch(`${apiBase()}/admin/catalog/category-lists`, {
      method: "PUT",
      headers: authHead(true),
      body: JSON.stringify(payload)
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
      pricedOptionGroup: String(p?.pricedOptionGroup || p?.pricedOptionCategory || ""),
      variantPrices: (p?.variantPrices && typeof p.variantPrices === "object") ? p.variantPrices : {},
      variantPurchasePrices: (p?.variantPurchasePrices && typeof p.variantPurchasePrices === "object") ? p.variantPurchasePrices : {},
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
      if (delBtn) {
        const evStop = (ev) => { try { ev.stopPropagation(); } catch { } };
        mgArmDangerButton(delBtn, async (ev) => { evStop(ev); await actionRunner(async () => { await deleteProduct(p.id); }, `Delete ${p.id}`); }, "Delete");
      }
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

    // option pricing (optional)
    const pricedOptionGroup = "";
    const _vpParse = (raw, label) => {
      const s = String(raw || "").trim();
      if (!s) return {};
      try {
        const v = JSON.parse(s);
        return (v && typeof v === "object" && !Array.isArray(v)) ? v : {};
      } catch (e) {
        toast("Invalid JSON in " + label);
        return {};
      }
    };
    const variantPrices = _vpParse($("#peVariantPrices")?.value, "variantPrices");
    const variantPurchasePrices = _vpParse($("#peVariantPurchasePrices")?.value, "variantPurchasePrices");

    return { id, name, link, buy, sell, description, options, images: imgs, pricedOptionGroup, variantPrices, variantPurchasePrices };
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

      <div class="mg-editor-card mg-optpr-card">
        <div class="mg-optpr-head">
          <h3>Option groups & pricing</h3>
          <div class="mg-optpr-headmeta">
            Base sell: <span id="vpBaseSell">0.00</span> • Base purchase: <span id="vpBaseBuy">0.00</span>
          </div>
        </div>

        <div class="mg-optpr-layout mg-optpr-layout-one">
          <div class="mg-optpr-pane mg-optpr-left">
            <div class="mg-optpr-title">Option groups &amp; pricing</div>
            <div class="mg-optpr-hint">Set per-option sell/purchase adjustments. Leave blank for 0. Full-combo overrides are available in “Advanced JSON”.</div>
            <div id="pe_opts_ui" class="mg-optgroups"></div>
            <div id="pe_opts_addgroup" class="mg-opt-addgroup" role="button" tabindex="0">+ Add option group</div>

            <div class="mg-optpr-testerwrap">
              <div class="vp-tester">
                <div class="vp-tester-head">
                  <div class="vp-tester-title">Tester</div>
                  <button type="button" class="vp-clearbtn" id="vpTesterReset">Reset</button>
                </div>
                <div id="vpTesterOptions" class="vp-tester-options"></div>
                <div id="vpTesterSummary" class="vp-tester-summary"></div>
              </div>
            </div>
          </div>
        </div>

        <details class="mg-optpr-adv">
          <summary>Advanced JSON (manual)</summary>
          <div class="mg-optpr-advgrid">
            <div class="mg-optpr-advcol">
              <div class="mg-optpr-advtitle">Option groups (options)</div>
              <textarea id="pe_opts" placeholder='[]'>${esc(JSON.stringify(p.options || [], null, 2))}</textarea>
            </div>
            <div class="mg-optpr-advcol">
              <div class="mg-optpr-advtitle">Sell overrides (variantPrices)</div>
              <textarea id="peVariantPrices" rows="6" placeholder='{}'>${esc(JSON.stringify(p.variantPrices || {}, null, 2))}</textarea>
            </div>
            <div class="mg-optpr-advcol">
              <div class="mg-optpr-advtitle">Purchase overrides (variantPurchasePrices)</div>
              <textarea id="peVariantPurchasePrices" rows="6" placeholder='{}'>${esc(JSON.stringify(p.variantPurchasePrices || {}, null, 2))}</textarea>
            </div>
          </div>
        </details>
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
    ["pe_id", "pe_name", "pe_link", "pe_buy", "pe_sell", "pe_desc", "pe_opts", "peVariantPrices", "peVariantPurchasePrices"].forEach(id => {
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

    // Options UI: render all option groups as editable cards (add/remove/options)
    const optUiHost = $("#pe_opts_ui");
    const optAddGroupTile = $("#pe_opts_addgroup");
    const optTa = $("#pe_opts");

    const _reEsc = (s) => String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const _uniqueOptionName = (existing) => {
      const base = "New option";
      const set = new Set((existing || []).map(x => String(x ?? "").trim()).filter(Boolean));
      let name = base;
      let n = 2;
      while (set.has(name)) name = `${base} ${n++}`;
      return name;
    };
    const _readGroups = () => {
      let raw = [];
      try { raw = JSON.parse(String(optTa?.value || "[]")); } catch { raw = []; }
      return mgNormalizeOptionGroups(raw);
    };
    const _writeGroups = (groups) => {
      if (!optTa) return;
      optTa.value = JSON.stringify(mgNormalizeOptionGroups(groups || []), null, 2);
      optTa.dispatchEvent(new Event("input", { bubbles: true }));
    };
    const _readMap = (id) => {
      const el = $("#" + id);
      const s = String(el?.value || "").trim();
      if (!s) return {};
      try {
        const v = JSON.parse(s);
        return (v && typeof v === "object" && !Array.isArray(v)) ? v : {};
      } catch {
        try { toast("Invalid JSON in " + id); } catch { }
        return {};
      }
    };
    const _writeMap = (id, obj) => {
      const el = $("#" + id);
      if (!el) return;
      el.value = JSON.stringify(obj || {}, null, 2);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    };
    const _mapRenameGroup = (map, oldG, newG) => {
      const out = {};
      const re = new RegExp(`(^|\\s\\|\\s)${_reEsc(oldG)}=`, "g");
      for (const [k, v] of Object.entries(map || {})) {
        out[String(k).replace(re, `$1${newG}=`)] = v;
      }
      return out;
    };
    const _mapRenameValue = (map, g, oldV, newV) => {
      const out = {};
      const re = new RegExp(`(^|\\s\\|\\s)${_reEsc(g)}=${_reEsc(oldV)}(?=(\\s\\|\\s|$))`, "g");
      for (const [k, v] of Object.entries(map || {})) {
        out[String(k).replace(re, `$1${g}=${newV}`)] = v;
      }
      return out;
    };
    const _mapDropGroup = (map, g) => {
      const out = {};
      const re = new RegExp(`(^|\\s\\|\\s)${_reEsc(g)}=`, "g");
      for (const [k, v] of Object.entries(map || {})) {
        if (re.test(String(k))) continue;
        out[k] = v;
      }
      return out;
    };
    const _mapDropValue = (map, g, val) => {
      const out = {};
      const re = new RegExp(`(^|\\s\\|\\s)${_reEsc(g)}=${_reEsc(val)}(?=(\\s\\|\\s|$))`);
      for (const [k, v] of Object.entries(map || {})) {
        if (re.test(String(k))) continue;
        out[k] = v;
      }
      return out;
    };

    const _focusNext = (sel) => {
      setTimeout(() => {
        const el = document.querySelector(sel);
        if (el && el.focus) el.focus();
      }, 0);
    };


    function _buildSimpleKey(gLabel, val) {
      return `${String(gLabel || "").trim()}=${String(val || "").trim()}`;
    }

    function _numOrEmpty(n) {
      const x = Number(n);
      return Number.isFinite(x) ? x : null;
    }

    function _getOverride(map, key) {
      if (!map || typeof map !== "object") return "";
      if (!Object.prototype.hasOwnProperty.call(map, key)) return "";
      const v = Number(map[key]);
      return Number.isFinite(v) ? String(v) : "";
    }

    function _setOverride(mapId, key, rawVal) {
      const s = String(rawVal ?? "").trim();
      const m = _readMap(mapId);
      if (!s) {
        if (Object.prototype.hasOwnProperty.call(m, key)) delete m[key];
        _writeMap(mapId, m);
        return;
      }
      const n = Number(s);
      if (!Number.isFinite(n)) return;
      m[key] = n;
      _writeMap(mapId, m);
    }

    let _testerSelected = {};

    function renderTesterUi() {
      const host = document.getElementById("vpTesterOptions");
      const sum = document.getElementById("vpTesterSummary");
      if (!host || !sum) return;

      const groups = _readGroups();
      const baseSell = Number($("#pe_sell")?.value || 0) || 0;
      const baseBuy = Number($("#pe_buy")?.value || 0) || 0;

      const vp = _readMap("peVariantPrices");
      const vpp = _readMap("peVariantPurchasePrices");

      host.innerHTML = "";

      const order = groups.map(g => String(g.label || g.name || g.key || "").trim()).filter(Boolean);

      for (const g of groups) {
        const gLabel = String(g.label || g.name || g.key || "").trim();
        if (!gLabel) continue;
        const values = Array.isArray(g.options) ? g.options : (Array.isArray(g.values) ? g.values : []);
        const cleanVals = values.map(x => String(x || "").trim()).filter(Boolean);

        if (!_testerSelected[gLabel] || !cleanVals.includes(_testerSelected[gLabel])) {
          _testerSelected[gLabel] = cleanVals[0] || "";
        }
        const groupEl = document.createElement("div");
        groupEl.className = "vp-opt-group";

        const titleEl = document.createElement("div");
        titleEl.className = "vp-opt-title";
        titleEl.textContent = gLabel;

        const btns = document.createElement("div");
        btns.className = "vp-opt-btns";

        for (const v of cleanVals) {
          const b = document.createElement("button");
          b.type = "button";
          b.className = "vp-opt-btn" + ((_testerSelected[gLabel] === v) ? " active" : "");
          b.textContent = v;
          b.onclick = () => {
            _testerSelected[gLabel] = v;
            renderTesterUi();
          };
          btns.appendChild(b);
        }

        groupEl.appendChild(titleEl);
        groupEl.appendChild(btns);
        host.appendChild(groupEl);
      }

      // Compute totals (base + per-option adjustments)
      let sell = baseSell;
      let buy = baseBuy;
      const parts = [];

      for (const gLabel of order) {
        const v = _testerSelected[gLabel] || "";
        if (!v) continue;
        parts.push(`${gLabel}=${v}`);
        const k = _buildSimpleKey(gLabel, v);
        const ds = Number(vp?.[k]);
        const db = Number(vpp?.[k]);
        if (Number.isFinite(ds)) sell += ds;
        if (Number.isFinite(db)) buy += db;
      }

      const profit = sell - buy;
      const fullKey = parts.join(" | ") || "(no selection)";

      sum.innerHTML = `
        <div class="vp-sum">
          <div class="vp-sumrow">
            <div class="vp-sumlabel">Selection</div>
            <div class="vp-sumvalue vp-sumkey">${escapeHtml(fullKey)}</div>
          </div>

          <div class="vp-sumrow">
            <div class="vp-sumlabel">Selling</div>
            <div class="vp-sumvalue"><span class="vp-money">€${sell.toFixed(2)}</span> <span class="vp-source">base + adjustments</span></div>
          </div>

          <div class="vp-sumrow">
            <div class="vp-sumlabel">Purchase</div>
            <div class="vp-sumvalue"><span class="vp-money">€${buy.toFixed(2)}</span> <span class="vp-source">base + adjustments</span></div>
          </div>

          <div class="vp-sumrow">
            <div class="vp-sumlabel">Profit</div>
            <div class="vp-sumvalue"><span class="vp-money vp-profitmoney ${profit >= 0 ? "is-pos" : "is-neg"}">€${profit.toFixed(2)}</span></div>
          </div>
        </div>
      `;
    }

    function renderOptionsUi() {
      if (!optUiHost) return;
      const groups = _readGroups();
      const vp = _readMap("peVariantPrices");
      const vpp = _readMap("peVariantPurchasePrices");

      optUiHost.innerHTML = "";

      if (!groups.length) {
        const empty = document.createElement("div");
        empty.style.color = "var(--ui-muted)";
        empty.style.fontSize = "12px";
        empty.textContent = "No option groups. Add one below.";
        optUiHost.appendChild(empty);
        return;
      }

      groups.forEach((g, gidx) => {
        const card = document.createElement("div");
        card.className = "mg-optgroup-card";
        card.dataset.gidx = String(gidx);

        const gLabel = String(g.label || g.name || g.key || "Option").trim();

        const head = document.createElement("div");
        head.className = "mg-optgroup-head";

        const label = document.createElement("input");
        label.className = "mg-optgroup-label";
        label.value = gLabel;
        label.placeholder = "Group name (e.g. Colour)";
        label.dataset.gidx = String(gidx);
        label.dataset.old = label.value;

        const actions = document.createElement("div");
        actions.className = "mg-optgroup-actions";

        const delGroup = document.createElement("button");
        delGroup.type = "button";
        delGroup.className = "mg-opt-iconbtn mg-opt-delgroup";
        delGroup.dataset.gidx = String(gidx);
        delGroup.title = "Delete group";
        delGroup.textContent = "🗑";

        actions.appendChild(delGroup);
        head.appendChild(label);
        head.appendChild(actions);
        card.appendChild(head);

        const grid = document.createElement("div");
        grid.className = "mg-opt-grid mg-opt-rows";

        const rowHead = document.createElement("div");
        // Header row (order-card style columns)
        rowHead.className = "mg-opt-rowhead";
        // Defensive inline layout: some deployments override CSS.
        // Ensures columns never collapse into stacked text.
        rowHead.style.display = "grid";
        rowHead.style.gridTemplateColumns = "minmax(260px, 1fr) 160px 160px 60px";
        rowHead.style.alignItems = "center";
        rowHead.style.columnGap = "0";
        rowHead.style.width = "100%";
        rowHead.style.padding = "8px 0";
        rowHead.style.borderBottom = "2px dashed var(--line)";
        rowHead.style.background = "transparent";
        rowHead.innerHTML = `
          <div class="mg-opt-cell mg-opt-cell-name">Option</div>
          <div class="mg-opt-cell mg-opt-cell-sell">Sell (EUR)</div>
          <div class="mg-opt-cell mg-opt-cell-buy">Purchase (EUR)</div>
          <div class="mg-opt-cell mg-opt-cell-bin"></div>
        `;
        // Apply per-cell separators/padding (order-card look)
        (rowHead.querySelectorAll(".mg-opt-cell") || []).forEach((c) => {
          c.style.padding = "0 12px";
          c.style.minWidth = "0";
        });
        const _hs = rowHead.querySelector(".mg-opt-cell-sell");
        const _hb = rowHead.querySelector(".mg-opt-cell-buy");
        const _hx = rowHead.querySelector(".mg-opt-cell-bin");
        if (_hs) _hs.style.borderLeft = "2px solid var(--line)";
        if (_hb) _hb.style.borderLeft = "2px solid var(--line)";
        if (_hx) {
          _hx.style.borderLeft = "2px solid var(--line)";
          _hx.style.display = "flex";
          _hx.style.justifyContent = "flex-end";
          _hx.style.paddingRight = "8px";
        }
        grid.appendChild(rowHead);

        const opts = Array.isArray(g.options) ? g.options : (Array.isArray(g.values) ? g.values : []);
        opts.forEach((v, oidx) => {
          const rawVal = String(v ?? "");
          const val = rawVal.trim();
          const isEmpty = !val;
          const key = isEmpty ? null : _buildSimpleKey(gLabel, val);

          const row = document.createElement("div");
          row.className = "mg-opt-row";
          row.dataset.gidx = String(gidx);
          row.dataset.oidx = String(oidx);

          // Defensive inline layout for consistent columns
          row.style.display = "grid";
          row.style.gridTemplateColumns = "minmax(260px, 1fr) 160px 160px 60px";
          row.style.alignItems = "center";
          row.style.columnGap = "0";
          row.style.width = "100%";
          row.style.padding = "10px 0";
          row.style.borderBottom = "1px dashed var(--line)";
          row.style.background = "transparent";

          const inp = document.createElement("input");
          inp.className = "mg-opt-val";
          inp.value = val;
          inp.placeholder = "Option (e.g. Black)";
          inp.dataset.gidx = String(gidx);
          inp.dataset.oidx = String(oidx);
          inp.dataset.old = inp.value;

          const sellInp = document.createElement("input");
          sellInp.className = "mg-opt-price mg-opt-sell";
          sellInp.type = "number";
          sellInp.step = "0.01";
          sellInp.placeholder = "0.00";
          sellInp.value = key ? _getOverride(vp, key) : "";
          if (!key) { sellInp.disabled = true; sellInp.title = "Set option name first"; }
          sellInp.dataset.gidx = String(gidx);
          sellInp.dataset.oidx = String(oidx);
          sellInp.dataset.kind = "sell";
          // Ensure styled like the option-name field even if external CSS overrides inputs
          sellInp.style.width = "100%";
          sellInp.style.height = "38px";
          sellInp.style.borderRadius = "999px";
          sellInp.style.textAlign = "center";

          const buyInp = document.createElement("input");
          buyInp.className = "mg-opt-price mg-opt-buy";
          buyInp.type = "number";
          buyInp.step = "0.01";
          buyInp.placeholder = "0.00";
          buyInp.value = key ? _getOverride(vpp, key) : "";
          if (!key) { buyInp.disabled = true; buyInp.title = "Set option name first"; }
          buyInp.dataset.gidx = String(gidx);
          buyInp.dataset.oidx = String(oidx);
          buyInp.dataset.kind = "buy";
          buyInp.style.width = "100%";
          buyInp.style.height = "38px";
          buyInp.style.borderRadius = "999px";
          buyInp.style.textAlign = "center";

          const del = document.createElement("button");
          del.type = "button";
          del.className = "mg-opt-iconbtn mg-opt-del";
          del.dataset.gidx = String(gidx);
          del.dataset.oidx = String(oidx);
          del.title = "Delete option";
          del.textContent = "🗑";

          const c1 = document.createElement("div");
          c1.className = "mg-opt-cell mg-opt-cell-name";
          c1.style.padding = "0 12px";
          c1.appendChild(inp);

          const c2 = document.createElement("div");
          c2.className = "mg-opt-cell mg-opt-cell-sell";
          c2.style.padding = "0 12px";
          c2.style.borderLeft = "2px solid var(--line)";
          c2.appendChild(sellInp);

          const c3 = document.createElement("div");
          c3.className = "mg-opt-cell mg-opt-cell-buy";
          c3.style.padding = "0 12px";
          c3.style.borderLeft = "2px solid var(--line)";
          c3.appendChild(buyInp);

          const c4 = document.createElement("div");
          c4.className = "mg-opt-cell mg-opt-cell-bin";
          c4.style.padding = "0 12px";
          c4.style.borderLeft = "2px solid var(--line)";
          c4.style.display = "flex";
          c4.style.justifyContent = "flex-end";
          c4.style.paddingRight = "8px";
          c4.appendChild(del);

          row.appendChild(c1);
          row.appendChild(c2);
          row.appendChild(c3);
          row.appendChild(c4);
          grid.appendChild(row);
        });

        // Add-option row
        const addRow = document.createElement("div");
        addRow.className = "mg-opt-addtile mg-opt-addopt";
        addRow.dataset.gidx = String(gidx);
        addRow.textContent = "+ Add option";
        grid.appendChild(addRow);

        card.appendChild(grid);
        optUiHost.appendChild(card);
      });
    }


    // Wire interactions
    if (optAddGroupTile) {
      const addGroup = () => {
        const groups = _readGroups();
        const n = groups.length + 1;
        const label = prompt("Option group name (e.g. Colour):", `Option ${n}`);
        if (!label) return;
        const cleanLabel = String(label).trim().replace(/:$/, "");
        const keyBase = cleanLabel.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_\-]/g, "") || `opt${n}`;
        groups.push({ key: keyBase, label: cleanLabel, options: ["Value"] });
        _writeGroups(groups);
        setDirty(true);
        renderOptionsUi();
        try { renderTesterUi(); } catch { }
        _focusNext(`#productEditorModal .mg-optgroup-card[data-gidx="${groups.length - 1}"] .mg-optgroup-label`);
      };
      optAddGroupTile.onclick = addGroup;
      optAddGroupTile.onkeydown = (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); addGroup(); }
      };
    }

    if (optUiHost) {
      // Inline price inputs (per-option adjustments)
      optUiHost.addEventListener("input", (e) => {
        const t = e.target;
        if (!(t instanceof HTMLInputElement)) return;
        if (!t.classList.contains("mg-opt-price")) return;
        const gidx = Number(t.dataset.gidx);
        const oidx = Number(t.dataset.oidx);
        const kind = String(t.dataset.kind || "");
        const groups = _readGroups();
        const g = groups[gidx];
        const gLabel = String(g?.label || g?.name || g?.key || "").trim();
        const opts = Array.isArray(g?.options) ? g.options : (Array.isArray(g?.values) ? g.values : []);
        const val = String(opts?.[oidx] || "").trim();
        if (!gLabel || !val) return;
        const key = _buildSimpleKey(gLabel, val);

        if (kind === "sell") _setOverride("peVariantPrices", key, t.value);
        if (kind === "buy") _setOverride("peVariantPurchasePrices", key, t.value);

        setDirty(true);
        try { renderTesterUi(); } catch { }
      });

      optUiHost.addEventListener("click", (e) => {
        const t = e.target;
        if (!(t instanceof HTMLElement)) return;

        // Add option
        if (t.classList.contains("mg-opt-addopt") && t.dataset.gidx) {
          const gidx = Number(t.dataset.gidx);
          const groups = _readGroups();
          const g = groups[gidx];
          if (!g) return;
          if (!Array.isArray(g.options)) g.options = Array.isArray(g.values) ? g.values : [];
          g.options.push(_uniqueOptionName(g.options || []));
          _writeGroups(groups);
          setDirty(true);
          renderOptionsUi();
          try { renderTesterUi(); } catch { }
          _focusNext(`#productEditorModal .mg-optgroup-card[data-gidx="${gidx}"] .mg-opt-val[data-oidx="${g.options.length - 1}"]`);
          setTimeout(() => {
            const el = document.querySelector(`#productEditorModal .mg-optgroup-card[data-gidx="${gidx}"] .mg-opt-val[data-oidx="${g.options.length - 1}"]`);
            if (el && typeof el.select === "function") el.select();
          }, 0);
          return;
        }

        // Delete option
        if (t.classList.contains("mg-opt-del") && t.dataset.gidx && t.dataset.oidx) {
          const gidx = Number(t.dataset.gidx);
          const oidx = Number(t.dataset.oidx);
          const groups = _readGroups();
          const g = groups[gidx];
          const gLabel = String(g?.label || g?.name || g?.key || "").trim();
          const opts = Array.isArray(g?.options) ? g.options : [];
          const val = String(opts[oidx] || "").trim();
          if (!g) return;

          g.options = opts.filter((_, i) => i !== oidx);
          _writeGroups(groups);

          // Remove variant price keys referencing this option
          if (val) {
            const vp = _mapDropValue(_readMap("peVariantPrices"), gLabel, val);
            const vpp = _mapDropValue(_readMap("peVariantPurchasePrices"), gLabel, val);
            _writeMap("peVariantPrices", vp);
            _writeMap("peVariantPurchasePrices", vpp);
          }

          setDirty(true);
          renderOptionsUi();
          try { renderTesterUi(); } catch { }
          return;
        }

        // Delete group
        if (t.classList.contains("mg-opt-delgroup") && t.dataset.gidx) {
          const gidx = Number(t.dataset.gidx);
          const groups = _readGroups();
          const g = groups[gidx];
          const gLabel = String(g?.label || g?.name || g?.key || "").trim();
          if (!g) return;
          if (!confirm(`Delete option group "${gLabel}"?`)) return;

          const nextGroups = groups.filter((_, i) => i !== gidx);
          _writeGroups(nextGroups);

          // Remove any variant price keys referencing this group
          const vp = _mapDropGroup(_readMap("peVariantPrices"), gLabel);
          const vpp = _mapDropGroup(_readMap("peVariantPurchasePrices"), gLabel);
          _writeMap("peVariantPrices", vp);
          _writeMap("peVariantPurchasePrices", vpp);

          setDirty(true);
          renderOptionsUi();
          try { renderTesterUi(); } catch { }
          return;
        }
      });

      // Rename handlers (blur doesn't bubble, capture=true)
      optUiHost.addEventListener("blur", (e) => {
        const t = e.target;
        if (!(t instanceof HTMLElement)) return;

        // Group label rename
        if (t.classList.contains("mg-optgroup-label") && t.dataset.gidx) {
          const gidx = Number(t.dataset.gidx);
          const oldLabel = String(t.dataset.old || "").trim();
          const newLabel = String((t instanceof HTMLInputElement) ? t.value : "").trim().replace(/:$/, "");
          if (!newLabel || newLabel === oldLabel) return;

          const groups = _readGroups();
          const g = groups[gidx];
          if (!g) return;
          g.label = newLabel;
          if (!g.key) g.key = newLabel.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_\-]/g, "") || `opt${gidx + 1}`;
          _writeGroups(groups);

          // Migrate variant price keys and pricedOptionGroup
          const vp = _mapRenameGroup(_readMap("peVariantPrices"), oldLabel, newLabel);
          const vpp = _mapRenameGroup(_readMap("peVariantPurchasePrices"), oldLabel, newLabel);
          _writeMap("peVariantPrices", vp);
          _writeMap("peVariantPurchasePrices", vpp);

          setDirty(true);
          renderOptionsUi();
          try { renderTesterUi(); } catch { }
          return;
        }

        // Option value rename
        if (t.classList.contains("mg-opt-val") && t.dataset.gidx && t.dataset.oidx) {
          const gidx = Number(t.dataset.gidx);
          const oidx = Number(t.dataset.oidx);
          const oldV = String(t.dataset.old || "").trim();
          const newV = String((t instanceof HTMLInputElement) ? t.value : "").trim();
          if (!newV) {
            // If the row was a newly-added placeholder, remove it when left blank
            if (!oldV) {
              const groups = _readGroups();
              const g = groups[gidx];
              if (!g) return;
              if (!Array.isArray(g.options)) g.options = Array.isArray(g.values) ? g.values : [];
              g.options = g.options.filter((_, i) => i !== oidx);
              _writeGroups(groups);
              setDirty(true);
              renderOptionsUi();
              try { renderTesterUi(); } catch { }
            }
            return;
          }
          if (newV === oldV) return;

          const groups = _readGroups();
          const g = groups[gidx];
          if (!g) return;
          const gLabel = String(g.label || g.name || g.key || "").trim();
          if (!Array.isArray(g.options)) g.options = Array.isArray(g.values) ? g.values : [];
          if (!g.options[oidx]) return;
          g.options[oidx] = newV;
          // de-dupe + cleanup
          g.options = Array.from(new Set(g.options.map(x => String(x || "").trim()).filter(Boolean)));
          _writeGroups(groups);

          // Migrate variant price keys
          const vp = _mapRenameValue(_readMap("peVariantPrices"), gLabel, oldV, newV);
          const vpp = _mapRenameValue(_readMap("peVariantPurchasePrices"), gLabel, oldV, newV);
          _writeMap("peVariantPrices", vp);
          _writeMap("peVariantPurchasePrices", vpp);

          setDirty(true);
          renderOptionsUi();
          try { renderTesterUi(); } catch { }
          return;
        }
      }, true);
    }

    // Initial render
    try {
      renderOptionsUi();
      try { renderTesterUi(); } catch { }
    } catch { }
    try {
      const syncBase = () => {
        const bs = Number($("#pe_sell")?.value || 0) || 0;
        const bb = Number($("#pe_buy")?.value || 0) || 0;
        const a = document.getElementById("vpBaseSell");
        const b = document.getElementById("vpBaseBuy");
        if (a) a.textContent = `€${bs.toFixed(2)}`;
        if (b) b.textContent = `€${bb.toFixed(2)}`;
      };
      syncBase();
      $("#pe_sell")?.addEventListener("input", () => { syncBase(); try { renderTesterUi(); } catch { } });
      $("#pe_buy")?.addEventListener("input", () => { syncBase(); try { renderTesterUi(); } catch { } });

      const rb = document.getElementById("vpTesterReset");
      if (rb) rb.onclick = () => { _testerSelected = {}; renderTesterUi(); };
      renderTesterUi();
    } catch { }

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
      images: draft.images || [],
      pricedOptionGroup: draft.pricedOptionGroup || "",
      variantPrices: draft.variantPrices || {},
      variantPurchasePrices: draft.variantPurchasePrices || {}
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
      productOptions: mgFirstGroupToLegacyProductOptions(mgNormalizeOptionGroups(draft.options ?? [])),
      pricedOptionGroup: draft.pricedOptionGroup || "",
      variantPrices: draft.variantPrices || {},
      variantPurchasePrices: draft.variantPurchasePrices || {},
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
        productOptions: mgFirstGroupToLegacyProductOptions(mgNormalizeOptionGroups(draft.options ?? [])),
        pricedOptionGroup: draft.pricedOptionGroup || "",
        variantPrices: draft.variantPrices || {},
        variantPurchasePrices: draft.variantPurchasePrices || {}
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
      images: [],
      pricedOptionGroup: "",
      variantPrices: {},
      variantPurchasePrices: {}
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

    (Array.isArray(orders) ? orders : []).forEach(o => {
      const od = orderDate(o);
      if (!inRange(od, min, max)) return;

      // Revenue: prefer what was actually charged/paid (includes discounts)
      const sale =
        (o?.pricing?.totalPaidEUR != null && !isNaN(Number(o.pricing.totalPaidEUR)))
          ? Number(o.pricing.totalPaidEUR)
          : (o?.paidEUR != null ? Number(o.paidEUR) : 0);

      // Purchase/COGS: sum expectedPurchase from items (works for both old/new orders)
      const items = orderItems(o);
      const pur = Array.isArray(items)
        ? items.reduce((s, it) => s + Number(itemExpectedPurchaseEUR(it) || 0) * Number(itemQty(it) || 0), 0)
        : 0;

      // Shipping + Stripe fees: prefer new costs schema; fallback to legacy fields
      const ship =
        (o?.costs?.shippingCostEUR != null && !isNaN(Number(o.costs.shippingCostEUR)))
          ? Number(o.costs.shippingCostEUR)
          : (Number(o?.shipping?.aliExpress || 0) + Number(o?.shipping?.thirdParty1 || 0) + Number(o?.shipping?.thirdParty2 || 0));

      const sf =
        (o?.costs?.stripeFeeEUR != null && !isNaN(Number(o.costs.stripeFeeEUR)))
          ? Number(o.costs.stripeFeeEUR)
          : Number(o?.stripeFeeEUR || 0);

      const prof = sale - (pur + ship + sf);

      revenue += sale;
      purchase += pur;
      shipping += ship;
      stripe += sf;
      profit += prof;
      count++;

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
      <div class="mg-acc-kpi" data-kpi="count"><div class="label">Orders in range</div><div class="value">${sum.count}</div></div>
      <div class="mg-acc-kpi" data-kpi="revenue"><div class="label">Revenue (EUR)</div><div class="value">${moneyEUR(sum.revenue)}</div><a href="#" class="mg-acc-explain" data-kpi="revenue">Explain</a></div>
      <div class="mg-acc-kpi" data-kpi="cogs"><div class="label">COGS (buy+ship+fees)</div><div class="value">${moneyEUR(sum.purchase + sum.shipping + sum.stripe)}</div><a href="#" class="mg-acc-explain" data-kpi="cogs">Explain</a></div>
      <div class="mg-acc-kpi" data-kpi="gross"><div class="label">Gross profit</div><div class="value">${moneyEUR(gross)}</div><a href="#" class="mg-acc-explain" data-kpi="gross">Explain</a></div>
      <div class="mg-acc-kpi" data-kpi="expenses"><div class="label">Expenses (manual)</div><div class="value">${moneyEUR(expTotal)}</div><a href="#" class="mg-acc-explain" data-kpi="expenses">Explain</a></div>
      <div class="mg-acc-kpi" data-kpi="net"><div class="label">Net (pre-tax)</div><div class="value">${moneyEUR(net)}</div><a href="#" class="mg-acc-explain" data-kpi="net">Explain</a></div>
    `; const os = $("#accOrdersSummary");
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

  function ensureAccExplainModal() {
    let m = document.getElementById("accExplainModal");
    if (m) return m;
    m = document.createElement("div");
    m.id = "accExplainModal";
    m.className = "mgmt-modal hidden";
    m.innerHTML = `
      <div class="mgmt-modal-backdrop" data-close="1"></div>
      <div class="mgmt-modal-panel" role="dialog" aria-modal="true" aria-label="Explain">
        <div class="mgmt-modal-header">
          <h2 id="accExplainTitle">Explain</h2>
          <div class="mgmt-modal-actions">
            <button class="mgmt-btn" type="button" data-close="1">Close</button>
          </div>
        </div>
        <div class="mgmt-modal-body">
          <div id="accExplainBody"></div>
        </div>
      </div>
    `;
    document.body.appendChild(m);
    m.querySelectorAll("[data-close='1']").forEach(x => x.addEventListener("click", () => m.classList.add("hidden")));
    return m;
  }

  function openAccExplain(kind) {
    const modal = ensureAccExplainModal();
    const title = modal.querySelector("#accExplainTitle");
    const body = modal.querySelector("#accExplainBody");
    if (!body) return;

    const s = loadSettings();
    const sum = calcOrdersSummary(state.orders || [], s);
    const expTotal = totalExpensesInRange();
    const gross = sum.revenue - (sum.purchase + sum.shipping + sum.stripe);
    const net = gross - expTotal;

    title.textContent = ({
      revenue: "Revenue (orders)",
      cogs: "COGS breakdown",
      gross: "Gross profit breakdown",
      expenses: "Expenses (manual)",
      net: "Net cashflow breakdown",
    }[kind] || "Explain");

    const rows = [];
    const orders = (state.orders || []).slice().sort((a, b) => (new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()));
    if (kind === "revenue") {
      for (const o of orders.slice(0, 60)) {
        rows.push({ a: o.id, b: (o.email || o.customerEmail || ""), c: moneyEUR(Number(o.paidEUR || 0) || 0) });
      }
      body.innerHTML = `<div class="login-hint">Top recent paid orders (showing up to 60)</div>` + mgTable(["Order", "Customer", "Paid EUR"], rows);
    } else if (kind === "expenses") {
      const ex = (expenses || []).slice().sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
      for (const e of ex.slice(0, 100)) {
        rows.push({ a: e.date || "", b: (e.category || ""), c: moneyEUR(Number(e.eur || 0)) });
      }
      body.innerHTML = `<div class="login-hint">Manual expenses (showing up to 100)</div>` + mgTable(["Date", "Category", "EUR"], rows);
    } else if (kind === "cogs") {
      body.innerHTML = `
        <div class="login-hint">Totals in range:</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px;">
          <div class="mg-acc-kpi"><div class="label">Purchase</div><div class="value">${moneyEUR(sum.purchase)}</div></div>
          <div class="mg-acc-kpi"><div class="label">Shipping</div><div class="value">${moneyEUR(sum.shipping)}</div></div>
          <div class="mg-acc-kpi"><div class="label">Stripe fees</div><div class="value">${moneyEUR(sum.stripe)}</div></div>
          <div class="mg-acc-kpi"><div class="label">Total COGS</div><div class="value">${moneyEUR(sum.purchase + sum.shipping + sum.stripe)}</div></div>
        </div>
      `;
    } else if (kind === "gross") {
      body.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div class="mg-acc-kpi"><div class="label">Revenue</div><div class="value">${moneyEUR(sum.revenue)}</div></div>
          <div class="mg-acc-kpi"><div class="label">COGS</div><div class="value">${moneyEUR(sum.purchase + sum.shipping + sum.stripe)}</div></div>
          <div class="mg-acc-kpi"><div class="label">Gross profit</div><div class="value">${moneyEUR(gross)}</div></div>
        </div>
        <div class="login-hint" style="margin-top:10px;">Click “Revenue” or “COGS” KPIs for lists/breakdown.</div>
      `;
    } else if (kind === "net") {
      body.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div class="mg-acc-kpi"><div class="label">Gross profit</div><div class="value">${moneyEUR(gross)}</div></div>
          <div class="mg-acc-kpi"><div class="label">Manual expenses</div><div class="value">${moneyEUR(expTotal)}</div></div>
          <div class="mg-acc-kpi"><div class="label">Net (pre-tax)</div><div class="value">${moneyEUR(net)}</div></div>
        </div>
        <div class="login-hint" style="margin-top:10px;">This uses orders in range + expenses filter range.</div>
      `;
    } else {
      body.textContent = "No details.";
    }

    modal.classList.remove("hidden");
  }

  function mgTable(cols, rows) {
    const head = cols.map(c => `<th style="text-align:left;padding:8px 10px;border-bottom:1px solid rgba(255,255,255,.10);font-size:12px;opacity:.8;">${esc(c)}</th>`).join("");
    const body = rows.map(r => `<tr>${Object.values(r).map(v => `<td style="padding:8px 10px;border-bottom:1px solid rgba(255,255,255,.06);font-size:12px;">${esc(v)}</td>`).join("")}</tr>`).join("");
    return `<div style="overflow:auto;border:1px solid rgba(255,255,255,.12);border-radius:12px;margin-top:10px;"><table style="width:100%;border-collapse:collapse;"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
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
      const expDelBtn = $("#accExpDelete");
      if (expDelBtn) {
        mgArmDangerButton(expDelBtn, async () => {
          if (!activeExpenseId) return;
          const removed = expenses.find(x => x.id === activeExpenseId) || null;
          const removedIdx = expenses.findIndex(x => x.id === activeExpenseId);
          expenses = expenses.filter(x => x.id !== activeExpenseId);
          saveExpenses(expenses);
          activeExpenseId = expenses[0]?.id || null;
          if (activeExpenseId) renderExpenseForm(expenses.find(x => x.id === activeExpenseId)); else renderExpenseForm(null);
          renderExpenses();
          renderDashboard();
          // offer undo (in-memory; persists if user clicks undo quickly)
          mgShowUndo?.("Expense deleted", () => {
            if (!removed) return;
            const arr = expenses.slice();
            const idx = Math.max(0, Math.min(arr.length, removedIdx));
            arr.splice(idx, 0, removed);
            expenses = arr;
            saveExpenses(expenses);
            activeExpenseId = removed.id;
            renderExpenseForm(removed);
            renderExpenses();
            renderDashboard();
          });
        }, "Delete");
      }
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



/* ===== Recommendations tab (merged) ===== */

(function () {
  const $ = (id) => document.getElementById(id);

  const statusEl = $("recoStatus");
  const cfgStatusEl = $("recoCfgStatus");
  const overviewEl = $("recoOverview");
  const sourceStatusEl = $("recoSourceStatus");
  const sourceTableEl = $("recoSourceTable");

  function baseUrl() {
    // Prefer management.js helpers if present
    try {
      if (typeof window._adminBase === "function") return String(window._adminBase() || "").replace(/\/$/, "");
      if (typeof window.apiBase === "function") return String(window.apiBase() || "").replace(/\/$/, "");
    } catch { }
    return String(localStorage.getItem("api_base") || "").trim().replace(/\/$/, "");
  }

  function authHeaders() {
    try {
      if (typeof window._adminHeaders === "function") return window._adminHeaders(true);
      if (typeof window.authHead === "function") return window.authHead(true);
    } catch { }
    const token = String(mgGetSessionToken() || "").trim();
    const adminCode = String(localStorage.getItem("admin_code") || "").trim();
    const h = { "Content-Type": "application/json" };
    if (token) h["Authorization"] = `Bearer ${token}`;
    if (adminCode) h["x-admin-code"] = adminCode;
    return h;
  }

  function setStatus(msg, ok = true) {
    if (!statusEl) return;
    statusEl.textContent = msg || "";
    statusEl.style.color = ok ? "" : "#b00020";
  }

  function setCfgStatus(msg, ok = true) {
    if (!cfgStatusEl) return;
    cfgStatusEl.textContent = msg || "";
    cfgStatusEl.style.color = ok ? "" : "#b00020";
  }

  async function jfetch(path, opts = {}) {
    const b = baseUrl();
    if (!b) throw new Error("Missing API base URL (log in first).");
    const res = await fetch(b + path, {
      method: opts.method || "GET",
      headers: { ...authHeaders(), ...(opts.headers || {}) },
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.error || data?.message || `HTTP ${res.status}`;
      throw new Error(msg);
    }
    return data;
  }

  function fmtPct(n) {
    const x = Number(n);
    if (!Number.isFinite(x)) return "0%";
    return (x * 100).toFixed(2) + "%";
  }

  function fmtRatio(a, b) {
    const aa = Number(a) || 0;
    const bb = Number(b) || 0;
    return bb > 0 ? (aa / bb).toFixed(3) : "0.000";
  }

  function htmlEscape(s) {
    return String(s || "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
    }[c]));
  }

  async function loadOverview() {
    setStatus("Loading overview…");
    const data = await jfetch("/admin/recs/overview");
    const totals = data?.totals || {};
    const top = Array.isArray(data?.topGlobal) ? data.topGlobal : [];
    const rows = top.slice(0, 20).map(r => {
      const pid = htmlEscape(r.targetProductId || r.productId || "");
      const imp = Number(r.impressions || 0);
      const clk = Number(r.clicks || 0);
      const atc = Number(r.addToCarts || 0);
      const ctr = imp > 0 ? (clk / imp) : 0;
      const atcClick = clk > 0 ? (atc / clk) : 0;
      const score = Number(r.scoreFinal || 0).toFixed(6);
      return `<tr>
        <td>${pid}</td>
        <td style="text-align:right;">${imp}</td>
        <td style="text-align:right;">${clk}</td>
        <td style="text-align:right;">${atc}</td>
        <td style="text-align:right;">${fmtPct(ctr)}</td>
        <td style="text-align:right;">${atcClick.toFixed(3)}</td>
        <td style="text-align:right;">${score}</td>
      </tr>`;
    }).join("");

    if (overviewEl) {
      overviewEl.innerHTML = `
        <div class="muted" style="margin-bottom:10px;">
          Totals: Impr ${Number(totals.impressions || 0)} • Clicks ${Number(totals.clicks || 0)} • ATC ${Number(totals.addToCarts || 0)} • Purchases ${Number(totals.purchases || 0)}
        </div>
        <div class="mg-cat-table-wrap">
          <table class="mg-cat-table">
            <thead>
              <tr>
                <th>Target productId</th>
                <th style="text-align:right;">Impr</th>
                <th style="text-align:right;">Clicks</th>
                <th style="text-align:right;">ATC</th>
                <th style="text-align:right;">CTR</th>
                <th style="text-align:right;">ATC/Click</th>
                <th style="text-align:right;">Score</th>
              </tr>
            </thead>
            <tbody>${rows || ""}</tbody>
          </table>
        </div>`;
    }

    setStatus("Overview loaded.");
  }

  function cfgReadUI() {
    const stableSlots = Number($("recoCfgStable")?.value || 0) || 0;
    const evolutionSlots = Number($("recoCfgEvo")?.value || 0) || 0;
    const globalWinnerSlots = Number($("recoCfgGlobalSlots")?.value || 0) || 0;
    const globalWinnersEnabled = !!$("recoCfgGlobalEnabled")?.checked;
    const allowCrossCategoryGlobalWinners = !!$("recoCfgCross")?.checked;

    const discount = {
      enabled: !!$("recoCfgDiscEnabled")?.checked,
      minPct: Number($("recoCfgDiscMinPct")?.value || 0) || 0,
      maxPct: Number($("recoCfgDiscMaxPct")?.value || 0) || 0,
      maxItemsPerWidget: Number($("recoCfgDiscMaxItems")?.value || 0) || 0,
      ttlMinutes: Number($("recoCfgDiscTtl")?.value || 0) || 60,
      minImpressions: Number($("recoCfgDiscMinImpr")?.value || 0) || 0,
      maxAtcPerClick: Number($("recoCfgDiscMaxAtcClick")?.value || 0.1) || 0.1,
      minMarginPct: Number($("recoCfgDiscMinMargin")?.value || 0.2) || 0.2,
      onlyEvolutionSlots: true
    };

    return {
      widgetId: "product_page_recs_v1",
      scope: "global",
      scopeId: null,
      stableSlots,
      evolutionSlots,
      globalWinnerSlots,
      globalWinnersEnabled,
      allowCrossCategoryGlobalWinners,
      // keep defaults; allow cross-category pool changes later via code/advanced UI
      candidatePoolRules: { sameCategoryOnly: true, allowedCategoryKeys: [], maxPriceDeltaPct: null },
      exploration: { mode: "thompson", epsilon: 0.2, priorImpressions: 20, priorClicks: 1, priorATC: 1 },
      globalWinnerMinUnitsSold30d: 0,
      globalWinnerMinScore: 0,
      discount
    };
  }

  function cfgApplyUI(cfg) {
    const c = cfg && typeof cfg === "object" ? cfg : {};
    if ($("recoCfgStable")) $("recoCfgStable").value = Number(c.stableSlots ?? 2);
    if ($("recoCfgEvo")) $("recoCfgEvo").value = Number(c.evolutionSlots ?? 6);
    if ($("recoCfgGlobalSlots")) $("recoCfgGlobalSlots").value = Number(c.globalWinnerSlots ?? 0);
    if ($("recoCfgGlobalEnabled")) $("recoCfgGlobalEnabled").checked = !!c.globalWinnersEnabled;
    if ($("recoCfgCross")) $("recoCfgCross").checked = !!c.allowCrossCategoryGlobalWinners;

    const d = (c.discount && typeof c.discount === "object") ? c.discount : {};
    if ($("recoCfgDiscEnabled")) $("recoCfgDiscEnabled").checked = !!d.enabled;
    if ($("recoCfgDiscMinPct")) $("recoCfgDiscMinPct").value = Number(d.minPct ?? 2);
    if ($("recoCfgDiscMaxPct")) $("recoCfgDiscMaxPct").value = Number(d.maxPct ?? 5);
    if ($("recoCfgDiscMaxItems")) $("recoCfgDiscMaxItems").value = Number(d.maxItemsPerWidget ?? 2);
    if ($("recoCfgDiscTtl")) $("recoCfgDiscTtl").value = Number(d.ttlMinutes ?? 60);
    if ($("recoCfgDiscMinImpr")) $("recoCfgDiscMinImpr").value = Number(d.minImpressions ?? 80);
    if ($("recoCfgDiscMaxAtcClick")) $("recoCfgDiscMaxAtcClick").value = Number(d.maxAtcPerClick ?? 0.10);
    if ($("recoCfgDiscMinMargin")) $("recoCfgDiscMinMargin").value = Number(d.minMarginPct ?? 0.20);
  }

  async function loadConfig() {
    setCfgStatus("Loading…");
    const data = await jfetch("/admin/recs/config?scope=global");
    cfgApplyUI(data?.config || null);
    setCfgStatus("Loaded.");
  }

  async function saveConfig() {
    setCfgStatus("Saving…");
    const body = cfgReadUI();
    await jfetch("/admin/recs/config", { method: "PUT", body });
    setCfgStatus("Saved.");
  }

  async function loadSource() {
    const sourceId = String($("recoSourceId")?.value || "").trim();
    if (!sourceId) throw new Error("Enter a source productId.");
    if (sourceStatusEl) { sourceStatusEl.textContent = "Loading…"; sourceStatusEl.style.color = ""; }
    const data = await jfetch(`/admin/recs/source/${encodeURIComponent(sourceId)}`);
    const items = Array.isArray(data?.items) ? data.items : [];
    const rows = items.slice(0, 200).map(r => {
      const imp = Number(r.impressions || 0);
      const clk = Number(r.clicks || 0);
      const atc = Number(r.addToCarts || 0);
      const ctr = imp > 0 ? (clk / imp) : 0;
      const atcClick = clk > 0 ? (atc / clk) : 0;
      const auto = Number(r.scoreAuto || 0);
      const mm = Number(r.manualMultiplier || 0);
      const mb = Number(r.manualBoost || 0);
      const finalScore = Number(r.scoreFinal || 0);
      const t = r.target || {};
      const name = t?.name ? `${htmlEscape(t.name)} (${htmlEscape(t.productId || r.targetProductId)})` : htmlEscape(r.targetProductId || "");
      return `<tr>
        <td>${name}</td>
        <td style="text-align:right;">${imp}</td>
        <td style="text-align:right;">${clk}</td>
        <td style="text-align:right;">${atc}</td>
        <td style="text-align:right;">${fmtPct(ctr)}</td>
        <td style="text-align:right;">${atcClick.toFixed(3)}</td>
        <td style="text-align:right;">${auto.toFixed(6)}</td>
        <td style="text-align:right;">${(auto * (1 + mm) + mb).toFixed(6)}</td>
        <td style="text-align:right;">${finalScore.toFixed(6)}</td>
      </tr>`;
    }).join("");

    if (sourceTableEl) sourceTableEl.innerHTML = rows;
    if (sourceStatusEl) sourceStatusEl.textContent = `Loaded ${items.length} targets for ${sourceId}.`;
  }

  function wire() {
    if ($("recoLoadOverview")) $("recoLoadOverview").onclick = () => loadOverview().catch(e => setStatus(String(e.message || e), false));
    if ($("recoLoadCfg")) $("recoLoadCfg").onclick = () => loadConfig().catch(e => setCfgStatus(String(e.message || e), false));
    if ($("recoSaveCfg")) $("recoSaveCfg").onclick = () => saveConfig().catch(e => setCfgStatus(String(e.message || e), false));
    if ($("recoLoadSource")) $("recoLoadSource").onclick = () => loadSource().catch(e => {
      if (sourceStatusEl) { sourceStatusEl.textContent = String(e.message || e); sourceStatusEl.style.color = "#b00020"; }
    });
  }

  // Only run if this tab exists in the page (it is embedded in index.html)
  if ($("recommendationsTab")) {
    wire();
    try { setStatus("Ready."); } catch { }
  }
})();

// ===== Incentives (tier discounts, shipping unlock, bundles) =====
function mgIncentivesSetStatus(msg, ok = true) {
  const el = document.getElementById("incStatus");
  if (!el) return;
  el.textContent = msg || "";
  el.style.color = ok ? "" : "#b00020";
}

function mgIncentivesParseJson(text, fallback) {
  try {
    const t = String(text || "").trim();
    if (!t) return fallback;
    return JSON.parse(t);
  } catch {
    return fallback;
  }
}

function mgIncentivesReadTiersFromTable() {
  const body = document.getElementById("incTiersBody");
  const rows = body ? Array.from(body.querySelectorAll("tr")) : [];
  const tiers = [];
  for (const r of rows) {
    const minEl = r.querySelector("input[data-k='min']");
    const pctEl = r.querySelector("input[data-k='pct']");
    const minEUR = Math.max(0, Number(minEl?.value || 0) || 0);
    const pct = Math.max(0, Math.min(80, Number(pctEl?.value || 0) || 0));
    tiers.push({ minEUR, pct });
  }
  return tiers
    .filter(t => Number.isFinite(t.minEUR) && Number.isFinite(t.pct))
    .sort((a, b) => a.minEUR - b.minEUR);
}

function mgIncentivesSetTiersTable(tiers) {
  const body = document.getElementById("incTiersBody");
  if (!body) return;
  body.innerHTML = "";
  (Array.isArray(tiers) ? tiers : []).forEach(t => body.appendChild(mgIncentivesRenderTierRow(t)));
}

function mgIncentivesReadUiPayload() {
  const enabled = document.getElementById("incEnabled")?.checked !== false;

  const topup = {
    maxItems: Math.max(0, Math.min(50, Number(document.getElementById("incTopupMaxItems")?.value || 0) || 0)),
    maxPriceDeltaPct: Math.max(0, Math.min(1000, Number(document.getElementById("incTopupDeltaPct")?.value || 0) || 0))
  };

  const tierDiscount = {
    enabled: document.getElementById("incTierEnabled")?.checked !== false,
    tiers: mgIncentivesReadTiersFromTable()
  };

  const freeShipping = {
    enabled: !!document.getElementById("incShipEnabled")?.checked,
    thresholdEUR: Math.max(0, Number(document.getElementById("incShipThreshold")?.value || 0) || 0),
    shippingFeeEUR: Math.max(0, Number(document.getElementById("incShipFee")?.value || 0) || 0)
  };

  const bundles = {
    enabled: !!document.getElementById("incBundleEnabled")?.checked,
    bundles: (() => {
      const arr = mgIncentivesParseJson(document.getElementById("incBundlesJson")?.value, []);
      return Array.isArray(arr) ? arr : [];
    })()
  };

  return { enabled, topup, tierDiscount, freeShipping, bundles };
}

function mgIncentivesFmtEUR(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "€0";
  return `€${x.toFixed(2).replace(/\.00$/, "")}`;
}

function mgIncentivesValidateAndPreview() {
  const warnEl = document.getElementById("incWarnings");
  const prevEl = document.getElementById("incPreview");
  const cfg = mgIncentivesReadUiPayload();

  const warnings = [];
  if (cfg.enabled) {
    if (cfg.tierDiscount?.enabled) {
      const tiers = Array.isArray(cfg.tierDiscount.tiers) ? cfg.tierDiscount.tiers : [];
      if (!tiers.length) warnings.push("Tier discounts are enabled but no tiers are defined.");
      // duplicate mins
      const mins = tiers.map(t => Number(t.minEUR || 0));
      const dup = mins.filter((v, i) => mins.indexOf(v) !== i);
      if (dup.length) warnings.push("Multiple tiers share the same minimum subtotal. Keep each tier minimum unique.");
      const maxPct = Math.max(0, ...tiers.map(t => Number(t.pct || 0)));
      if (maxPct > 20) warnings.push("A tier discount above ~20% often reduces profit and can trigger price skepticism. Consider lowering it unless margin is very high.");
      const firstMin = Math.min(...tiers.map(t => Number(t.minEUR || 0)));
      if (Number.isFinite(firstMin) && firstMin > 0 && firstMin < 5) warnings.push("Your first tier unlock is very low. Low unlocks usually add little incremental AOV.");
    }
    if (cfg.freeShipping?.enabled) {
      if ((cfg.freeShipping.thresholdEUR || 0) <= 0) warnings.push("Free shipping is enabled but threshold is 0.");
      if ((cfg.freeShipping.shippingFeeEUR || 0) <= 0) warnings.push("Free shipping is enabled but shipping fee is 0. If you already offer free shipping, disable this feature.");
    }
    if (cfg.tierDiscount?.enabled && cfg.freeShipping?.enabled) {
      warnings.push("Both tier discounts and free shipping are enabled. Consider keeping one primary goal in the cart UI for maximum conversion.");
    }
    if ((cfg.topup?.maxItems || 0) > 12) warnings.push("Top-up suggestions above ~12 items can overwhelm buyers. 6–10 tends to work best.");
  }

  if (warnEl) {
    if (warnings.length) {
      warnEl.innerHTML = `<b>Attention</b><ul style="margin:8px 0 0 18px; display:grid; gap:6px;">${warnings.map(w => `<li>${w}</li>`).join("")}</ul>`;
      warnEl.classList.remove("hidden");
    } else {
      warnEl.textContent = "";
      warnEl.classList.add("hidden");
    }
  }

  if (prevEl) {
    const aov = Math.max(0, Number(document.getElementById("incTypicalAov")?.value || 0) || 0);
    const tiers = (cfg.tierDiscount?.enabled ? (cfg.tierDiscount.tiers || []) : []).slice().sort((a, b) => (a.minEUR - b.minEUR));
    const activeTier = tiers.filter(t => aov >= (t.minEUR || 0)).slice(-1)[0] || null;
    const nextTier = tiers.find(t => (t.minEUR || 0) > aov) || null;
    const ship = cfg.freeShipping?.enabled ? cfg.freeShipping : null;

    const lines = [];
    if (aov > 0) {
      if (cfg.tierDiscount?.enabled && tiers.length) {
        lines.push(`<div><b>At typical subtotal</b> ${mgIncentivesFmtEUR(aov)}:</div>`);
        lines.push(`<div style="margin-top:6px;">Current tier: <b>${activeTier ? `${activeTier.pct}%` : "0%"}</b>${activeTier ? ` (min ${mgIncentivesFmtEUR(activeTier.minEUR)})` : ""}</div>`);
        if (nextTier) {
          const add = Math.max(0, (nextTier.minEUR || 0) - aov);
          lines.push(`<div>Next unlock: <b>${nextTier.pct}%</b> at ${mgIncentivesFmtEUR(nextTier.minEUR)} (add ~${mgIncentivesFmtEUR(add)})</div>`);
        } else {
          lines.push(`<div>Next unlock: <span class="muted">none (already at top tier)</span></div>`);
        }
        const recLow = aov * 1.10;
        const recHigh = aov * 1.15;
        lines.push(`<div style="margin-top:8px;" class="muted">Common high-performing first unlock range: ${mgIncentivesFmtEUR(recLow)}–${mgIncentivesFmtEUR(recHigh)} (10–15% above typical).</div>`);
      }
      if (ship) {
        const addShip = Math.max(0, (ship.thresholdEUR || 0) - aov);
        lines.push(`<div style="margin-top:10px;"><b>Free shipping</b>: threshold ${mgIncentivesFmtEUR(ship.thresholdEUR || 0)} (add ~${mgIncentivesFmtEUR(addShip)})</div>`);
      }
    } else {
      lines.push("Enter a typical order subtotal to get a concrete next-unlock preview.");
    }

    prevEl.innerHTML = lines.join("");
  }
}

function mgIncentivesRenderTierRow(t = { minEUR: 0, pct: 0 }) {
  const tr = document.createElement("tr");

  const tdMin = document.createElement("td");
  const inMin = document.createElement("input");
  inMin.type = "number";
  inMin.min = "0";
  inMin.step = "0.01";
  inMin.value = String(t.minEUR ?? 0);
  inMin.dataset.k = "min";
  inMin.style.width = "100%";
  tdMin.appendChild(inMin);

  const tdPct = document.createElement("td");
  const inPct = document.createElement("input");
  inPct.type = "number";
  inPct.min = "0";
  inPct.max = "80";
  inPct.step = "0.1";
  inPct.value = String(t.pct ?? 0);
  inPct.dataset.k = "pct";
  inPct.style.width = "100%";
  tdPct.appendChild(inPct);

  const tdRm = document.createElement("td");
  const rm = document.createElement("button");
  rm.className = "mgmt-btn";
  rm.type = "button";
  rm.textContent = "Remove";
  rm.onclick = () => { try { tr.remove(); } catch { } };
  tdRm.appendChild(rm);

  tr.appendChild(tdMin);
  tr.appendChild(tdPct);
  tr.appendChild(tdRm);
  return tr;
}

async function mgIncentivesFetch(path, opts = {}) {
  const base = (typeof _adminBase === "function") ? _adminBase() : "";
  if (!base) throw new Error("Missing API base (log in first).");
  const r = await fetch(base + path, {
    method: opts.method || "GET",
    headers: { ..._adminHeaders(true), ...(opts.headers || {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = data?.error || data?.message || `HTTP ${r.status}`;
    throw new Error(msg);
  }
  return data;
}

async function mgIncentivesLoad() {
  mgIncentivesSetStatus("Loading…", true);
  const data = await mgIncentivesFetch("/admin/incentives/config");
  const cfg = data?.runtime || data?.config || {};
  // core
  const en = document.getElementById("incEnabled"); if (en) en.checked = cfg.enabled !== false;

  // preview helper (local only)
  const aovEl = document.getElementById("incTypicalAov");
  if (aovEl) {
    const saved = localStorage.getItem("mg_inc_typical_aov");
    if (saved != null && saved !== "") aovEl.value = String(saved);
  }

  // topup
  const mi = document.getElementById("incTopupMaxItems"); if (mi) mi.value = String(cfg.topup?.maxItems ?? 8);
  const dp = document.getElementById("incTopupDeltaPct"); if (dp) dp.value = String(cfg.topup?.maxPriceDeltaPct ?? 30);

  // tier
  const te = document.getElementById("incTierEnabled"); if (te) te.checked = cfg.tierDiscount?.enabled !== false;
  const body = document.getElementById("incTiersBody");
  if (body) {
    body.innerHTML = "";
    const tiers = Array.isArray(cfg.tierDiscount?.tiers) ? cfg.tierDiscount.tiers : [];
    (tiers.length ? tiers : [{ minEUR: 25, pct: 3 }, { minEUR: 40, pct: 6 }, { minEUR: 60, pct: 10 }])
      .forEach(t => body.appendChild(mgIncentivesRenderTierRow(t)));
  }

  // shipping
  const se = document.getElementById("incShipEnabled"); if (se) se.checked = !!cfg.freeShipping?.enabled;
  const st = document.getElementById("incShipThreshold"); if (st) st.value = String(cfg.freeShipping?.thresholdEUR ?? 0);
  const sf = document.getElementById("incShipFee"); if (sf) sf.value = String(cfg.freeShipping?.shippingFeeEUR ?? 0);

  // bundles
  const be = document.getElementById("incBundleEnabled"); if (be) be.checked = !!cfg.bundles?.enabled;
  const bj = document.getElementById("incBundlesJson");
  if (bj) bj.value = JSON.stringify((cfg.bundles?.bundles || []), null, 2);

  mgIncentivesSetStatus("Loaded incentives config.", true);
  try { mgIncentivesValidateAndPreview(); } catch { }
}

async function mgIncentivesSave() {
  mgIncentivesSetStatus("Saving…", true);

  const payload = mgIncentivesReadUiPayload();

  // local-only helper
  const aov = String(document.getElementById("incTypicalAov")?.value || "").trim();
  localStorage.setItem("mg_inc_typical_aov", aov);

  try { mgIncentivesValidateAndPreview(); } catch { }

  await mgIncentivesFetch("/admin/incentives/config", { method: "PUT", body: payload });
  mgIncentivesSetStatus("Saved. Storefront config updates immediately (server cache ≤ 60s).", true);
}

async function mgIncentivesReset() {
  mgIncentivesSetStatus("Resetting…", true);
  await mgIncentivesFetch("/admin/incentives/config", { method: "DELETE" });
  await mgIncentivesLoad();
  mgIncentivesSetStatus("Reset to ENV defaults.", true);
}

// Wire UI once (idempotent)
function mgIncentivesWireUi() {
  const root = document.getElementById("incentivesTab");
  if (!root || root._mgWired) return;
  root._mgWired = true;

  const loadBtn = document.getElementById("incLoad");
  const saveBtn = document.getElementById("incSave");
  const resetBtn = document.getElementById("incReset");
  const addTierBtn = document.getElementById("incAddTier");
  const presetC = document.getElementById("incPresetConservative");
  const presetB = document.getElementById("incPresetBalanced");
  const presetA = document.getElementById("incPresetAggressive");

  if (loadBtn) loadBtn.onclick = () => actionRunner(async () => { await safeEnsureLogin(); await mgIncentivesLoad(); }, "Load incentives");
  if (saveBtn) saveBtn.onclick = () => actionRunner(async () => { await safeEnsureLogin(); await mgIncentivesSave(); }, "Save incentives");
  if (resetBtn) resetBtn.onclick = () => actionRunner(async () => { await safeEnsureLogin(); await mgIncentivesReset(); }, "Reset incentives");

  if (addTierBtn) {
    addTierBtn.onclick = () => {
      const body = document.getElementById("incTiersBody");
      if (!body) return;
      body.appendChild(mgIncentivesRenderTierRow({ minEUR: 0, pct: 0 }));
      try { mgIncentivesValidateAndPreview(); } catch { }
    };
  }

  const applyPreset = (tiers) => {
    mgIncentivesSetTiersTable(tiers);
    try { mgIncentivesValidateAndPreview(); } catch { }
  };

  if (presetC) presetC.onclick = () => applyPreset([{ minEUR: 30, pct: 3 }, { minEUR: 55, pct: 5 }, { minEUR: 90, pct: 8 }]);
  if (presetB) presetB.onclick = () => applyPreset([{ minEUR: 25, pct: 3 }, { minEUR: 40, pct: 6 }, { minEUR: 60, pct: 10 }]);
  if (presetA) presetA.onclick = () => applyPreset([{ minEUR: 20, pct: 5 }, { minEUR: 35, pct: 8 }, { minEUR: 55, pct: 12 }]);

  // Live validation/preview
  const liveIds = [
    "incEnabled", "incTierEnabled", "incShipEnabled", "incShipThreshold", "incShipFee",
    "incTopupMaxItems", "incTopupDeltaPct", "incBundleEnabled", "incBundlesJson", "incTypicalAov"
  ];
  for (const id of liveIds) {
    const el = document.getElementById(id);
    if (!el) continue;
    el.addEventListener("input", () => { try { mgIncentivesValidateAndPreview(); } catch { } });
    el.addEventListener("change", () => { try { mgIncentivesValidateAndPreview(); } catch { } });
  }

  // Also update preview when tiers change
  const tiersBody = document.getElementById("incTiersBody");
  if (tiersBody) {
    tiersBody.addEventListener("input", () => { try { mgIncentivesValidateAndPreview(); } catch { } });
    tiersBody.addEventListener("change", () => { try { mgIncentivesValidateAndPreview(); } catch { } });
  }

  // Initial load (best effort)
  try { mgIncentivesLoad(); } catch { }
}



// ===================== Profit tab (config + report) =====================
let __profitWired = false;

function _profitEl(id){ return document.getElementById(id); }

function _profitBool(v){ return String(v) === "true" || v === true; }

function _profitSetVal(id, v){
  const el = _profitEl(id);
  if (!el) return;
  el.value = (v === undefined || v === null) ? "" : String(v);
}

function _profitGetNum(id, defVal){
  const el = _profitEl(id);
  const v = el ? Number(el.value) : NaN;
  return Number.isFinite(v) ? v : defVal;
}

async function profitLoadConfig() {
  const r = await apiFetchJson("/admin/profit/config");
  const cfg = r?.config || r?.runtime || null;
  if (!cfg) return;
  _profitSetVal("profitEnabled", cfg.enabled ? "true" : "false");
  _profitSetVal("profitFeesPct", cfg?.fees?.pct ?? 0.029);
  _profitSetVal("profitFeesFixed", cfg?.fees?.fixedEUR ?? 0.30);
  _profitSetVal("profitAvgShip", cfg.avgShippingCostEUR ?? 3.5);
  _profitSetVal("profitMinMargin", cfg.minOrderMarginPct ?? 0.18);
  _profitSetVal("profitMinContrib", cfg.minOrderContributionEUR ?? 2.0);
  _profitSetVal("profitRefundWeight", cfg.refundPenaltyWeight ?? 0.8);
  _profitSetVal("profitFraudEnabled", (cfg?.fraud?.enabled ?? true) ? "true" : "false");
  _profitSetVal("profitFraudPi", cfg?.fraud?.maxPaymentIntentsPerIPPerHour ?? 20);
  _profitSetVal("profitFraudFinalize", cfg?.fraud?.maxFinalizePerIPPerHour ?? 30);
}

function profitReadForm() {
  return {
    enabled: _profitBool(_profitEl("profitEnabled")?.value),
    fees: {
      pct: _profitGetNum("profitFeesPct", 0.029),
      fixedEUR: _profitGetNum("profitFeesFixed", 0.30)
    },
    avgShippingCostEUR: _profitGetNum("profitAvgShip", 3.5),
    minOrderMarginPct: _profitGetNum("profitMinMargin", 0.18),
    minOrderContributionEUR: _profitGetNum("profitMinContrib", 2.0),
    refundPenaltyWeight: _profitGetNum("profitRefundWeight", 0.8),
    fraud: {
      enabled: _profitBool(_profitEl("profitFraudEnabled")?.value),
      maxPaymentIntentsPerIPPerHour: _profitGetNum("profitFraudPi", 20),
      maxFinalizePerIPPerHour: _profitGetNum("profitFraudFinalize", 30)
    }
  };
}

async function profitSaveConfig() {
  const body = profitReadForm();
  await apiFetchJson("/admin/profit/config", { method: "PUT", body: JSON.stringify(body) });
  ttoast("Saved profit config");
}

async function profitResetConfig() {
  await apiFetchJson("/admin/profit/config", { method: "DELETE" });
  ttoast("Reset profit config");
  await profitLoadConfig();
}

function profitRenderReport(rows) {
  const tb = _profitEl("profitReportBody");
  if (!tb) return;
  tb.innerHTML = "";
  const safe = Array.isArray(rows) ? rows : [];
  for (const r of safe) {
    const tr = document.createElement("tr");
    const name = String(r.name || r.productId || r.key || "").slice(0, 120);
    const soldQty = Number(r.soldQty || 0) || 0;
    const refundPct = Math.round((Number(r.refundRate || 0) || 0) * 1000) / 10;
    const marginPct = Math.round((Number(r.estMarginPct || 0) || 0) * 1000) / 10;
    const contrib = Math.round((Number(r.contributionEUR || 0) || 0) * 100) / 100;
    const alert = r.lossLeader ? "⚠" : "";

    tr.innerHTML = `
      <td style="max-width:420px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(name)}</td>
      <td style="text-align:right;">${soldQty}</td>
      <td style="text-align:right;">${refundPct}%</td>
      <td style="text-align:right;">${marginPct}%</td>
      <td style="text-align:right;">${contrib.toFixed(2)}€</td>
      <td style="text-align:center;">${alert}</td>
    `;
    tb.appendChild(tr);
  }
}

async function profitLoadReport() {
  const sort = String(_profitEl("profitSort")?.value || "contribution");
  const r = await apiFetchJson(`/admin/profit/report?sort=${encodeURIComponent(sort)}&limit=500`);
  profitRenderReport(r?.rows || []);
}

async function profitInit() {
  if (!__profitWired) {
    __profitWired = true;
    const reload = _profitEl("profitReloadBtn");
    const save = _profitEl("profitSaveBtn");
    const reset = _profitEl("profitResetBtn");
    const refresh = _profitEl("profitRefreshReportBtn");
    const sort = _profitEl("profitSort");
    if (reload) reload.onclick = () => actionRunner(async()=>{ await profitLoadConfig(); await profitLoadReport(); }, "Profit reload");
    if (save) save.onclick = () => actionRunner(async()=>{ await profitSaveConfig(); await profitLoadReport(); }, "Profit save");
    if (reset) reset.onclick = () => actionRunner(async()=>{ await profitResetConfig(); await profitLoadReport(); }, "Profit reset");
    if (refresh) refresh.onclick = () => actionRunner(async()=>{ await profitLoadReport(); }, "Profit report");
    if (sort) sort.onchange = () => actionRunner(async()=>{ await profitLoadReport(); }, "Profit sort");
  }
  await profitLoadConfig();
  await profitLoadReport();
}



// ===== Ops tab wiring =====
let __mgOpsWired = false;
function mgOpsInit() {
  if (__mgOpsWired) return;
  __mgOpsWired = true;

  const alertsList = document.getElementById("mgOpsAlertsList");
  const includeAck = document.getElementById("mgOpsIncludeAck");
  const reloadBtn = document.getElementById("mgOpsReloadAlerts");
  const exportBtn = document.getElementById("mgOpsExportBtn");
  const invBtn = document.getElementById("mgOpsInvoiceBtn");
  const fulfillBtn = document.getElementById("mgOpsFulfillBtn");
  const costBtn = document.getElementById("mgOpsCostBtn");
  const enableBtn = document.getElementById("mgOpsEnableBtn");
  const histLoad = document.getElementById("mgOpsHistLoad");
  const histRollback = document.getElementById("mgOpsHistRollback");

  async function renderAlerts() {
    if (!alertsList) return;
    alertsList.innerHTML = "";
    try {
      const items = await mgGetOpsAlerts({ limit: 100, includeAck: !!includeAck?.checked });
      if (!items.length) {
        alertsList.innerHTML = '<div class="mg-page-sub" style="opacity:.8;">No alerts.</div>';
        return;
      }
      for (const a of items) {
        const div = document.createElement("div");
        div.className = "mg-order-card";
        div.style.padding = "12px";
        div.innerHTML = `
          <div style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start;">
            <div>
              <div style="font-weight:700;">${String(a.type || "")} <span style="opacity:.7; font-weight:500;">(${String(a.severity || "info")})</span></div>
              <div style="margin-top:4px; opacity:.9;">${String(a.message || "")}</div>
              <div style="margin-top:6px; font-size:12px; opacity:.7;">${a.createdAt ? new Date(a.createdAt).toLocaleString() : ""}</div>
            </div>
            <div style="display:flex; gap:8px;">
              ${a.ackAt ? '<div style="font-size:12px; opacity:.7;">acked</div>' : '<button class="mg-btn" data-ack="1">Ack</button>'}
            </div>
          </div>
        `;
        div.querySelector('[data-ack="1"]')?.addEventListener("click", () => actionRunner(async()=>{
          await mgAckOpsAlert(a._id);
          await renderAlerts();
        }, "Ack alert"));
        alertsList.appendChild(div);
      }
    } catch (e) {
      alertsList.innerHTML = `<div class="mg-page-sub" style="opacity:.8;">Failed: ${String(e?.message || e)}</div>`;
    }
  }

  reloadBtn?.addEventListener("click", () => actionRunner(async()=>{ await renderAlerts(); }, "Alerts"));

  exportBtn?.addEventListener("click", () => actionRunner(async()=>{
    const from = document.getElementById("mgOpsExportFrom")?.value || "";
    const to = document.getElementById("mgOpsExportTo")?.value || "";
    const status = document.getElementById("mgOpsExportStatus")?.value || "";
    const fromISO = from ? new Date(from + "T00:00:00Z").toISOString() : "";
    const toISO = to ? new Date(to + "T23:59:59Z").toISOString() : "";
    await mgDownloadOrdersCSV({ from: fromISO || undefined, to: toISO || undefined, status: status || undefined });
  }, "Export CSV"));

  invBtn?.addEventListener("click", () => actionRunner(async()=>{
    const id = (document.getElementById("mgOpsInvoiceOrderId")?.value || "").trim();
    if (!id) throw new Error("Order ID required");
    await mgDownloadInvoicePDF(id);
  }, "Invoice"));

  fulfillBtn?.addEventListener("click", () => actionRunner(async()=>{
    const idsRaw = document.getElementById("mgOpsFulfillIds")?.value || "";
    const orderIds = idsRaw.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
    const trackingUrl = document.getElementById("mgOpsFulfillTracking")?.value || "";
    const carrier = document.getElementById("mgOpsFulfillCarrier")?.value || "";
    const note = document.getElementById("mgOpsFulfillNote")?.value || "";
    const out = await mgBulkFulfillOrders({ orderIds, trackingUrl, carrier, note });
    const el = document.getElementById("mgOpsFulfillOut");
    if (el) el.textContent = `Matched ${out.matched}, modified ${out.modified}`;
  }, "Bulk fulfill"));

  costBtn?.addEventListener("click", () => actionRunner(async()=>{
    const csv = document.getElementById("mgOpsCostCsv")?.value || "";
    const updates = csv.split(/\r?\n/).map(l=>l.trim()).filter(Boolean).map(l=>{
      const [pid, cost] = l.split(",").map(s=>s.trim());
      return { productId: pid, expectedPurchasePrice: Number(cost||0)||0 };
    }).filter(x=>x.productId);
    const out = await mgBulkUpdateCosts(updates);
    const el = document.getElementById("mgOpsProdOut");
    if (el) el.textContent = `Updated costs: ${out.updated}`;
  }, "Bulk cost"));

  enableBtn?.addEventListener("click", () => actionRunner(async()=>{
    const idsRaw = document.getElementById("mgOpsEnableIds")?.value || "";
    const productIds = idsRaw.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
    const enabled = !!document.getElementById("mgOpsEnableValue")?.checked;
    const out = await mgBulkEnableProducts(productIds, enabled);
    const el = document.getElementById("mgOpsProdOut");
    if (el) el.textContent = `Matched ${out.matched}, modified ${out.modified}`;
  }, "Bulk enable"));

  let __histSelected = null;
  histLoad?.addEventListener("click", () => actionRunner(async()=>{
    const type = (document.getElementById("mgOpsHistType")?.value || "").trim();
    const list = document.getElementById("mgOpsHistList");
    if (!type || !list) return;
    const items = await mgGetConfigHistory(type, 50);
    __histSelected = null;
    list.innerHTML = "";
    for (const h of items) {
      const row = document.createElement("div");
      row.className = "mg-order-card";
      row.style.padding = "10px";
      row.style.cursor = "pointer";
      row.innerHTML = `
        <div style="display:flex; justify-content:space-between; gap:10px;">
          <div>
            <div style="font-weight:700;">${h.createdAt ? new Date(h.createdAt).toLocaleString() : ""}</div>
            <div style="font-size:12px; opacity:.75;">${String(h.note || "")} ${h.adminEmail ? "— " + String(h.adminEmail) : ""}</div>
          </div>
          <div style="font-size:12px; opacity:.7;">${h._id}</div>
        </div>
      `;
      row.addEventListener("click", () => {
        __histSelected = h._id;
        Array.from(list.children).forEach(ch => ch.style.outline = "");
        row.style.outline = "2px solid rgba(255,255,255,.18)";
      });
      list.appendChild(row);
    }
  }, "Load history"));

  histRollback?.addEventListener("click", () => actionRunner(async()=>{
    const type = (document.getElementById("mgOpsHistType")?.value || "").trim();
    if (!type || !__histSelected) throw new Error("Select a history item");
    await mgRollbackConfig(type, __histSelected);
    const out = document.getElementById("mgOpsHistOut");
    if (out) out.textContent = "Rollback applied.";
  }, "Rollback"));

  // initial
  renderAlerts().catch(()=>{});
}
