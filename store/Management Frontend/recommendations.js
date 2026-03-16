
(function () {
  const $ = (id) => document.getElementById(id);

  const WIDGET_ID_DEFAULT = "product_page_recs_v1";

  function baseUrl() {
    const v = String($("apiBase")?.value || localStorage.getItem("api_base") || "").trim().replace(/\/$/, "");
    return v;
  }
  function authHeaders() {
    const token = String($("apiToken")?.value || localStorage.getItem("api_token") || "").trim();
    const adminCode = String($("adminCode")?.value || localStorage.getItem("admin_code") || "").trim();
    const h = { "Content-Type": "application/json" };
    if (token) h["Authorization"] = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    if (adminCode) h["x-admin-code"] = adminCode;
    return h;
  }

  function widgetId() {
    return String($("widgetId")?.value || localStorage.getItem("recs_widget_id") || WIDGET_ID_DEFAULT).trim() || WIDGET_ID_DEFAULT;
  }

  function cfgUrl(scope, scopeId) {
    const u = new URL("/admin/recs/config", "http://x");
    u.searchParams.set("widgetId", widgetId());
    u.searchParams.set("scope", scope || "global");
    if (scopeId) u.searchParams.set("scopeId", String(scopeId));
    return u.pathname + "?" + u.searchParams.toString();
  }

  function setStatus(msg, ok = true) {
    const el = $("status");
    if (!el) return;
    el.textContent = msg || "";
    el.style.color = ok ? "" : "#b00020";
  }
  function setCfgStatus(msg, ok = true) {
    const el = $("cfgStatus");
    if (!el) return;
    el.textContent = msg || "";
    el.style.color = ok ? "" : "#b00020";
  }
  function setPCfgStatus(msg, ok = true) {
    const el = $("pcfgStatus");
    if (!el) return;
    el.textContent = msg || "";
    el.style.color = ok ? "" : "#b00020";
  }
  function setBanStatus(msg, ok = true) {
    const el = $("banStatus");
    if (!el) return;
    el.textContent = msg || "";
    el.style.color = ok ? "" : "#b00020";
  }

  async function jfetch(path, opts = {}) {
    const b = baseUrl();
    if (!b) throw new Error("Missing API base URL.");
    const res = await fetch(b + path, {
      method: opts.method || "GET",
      headers: { ...authHeaders(), ...(opts.headers || {}) },
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = String(data?.error || data?.message || `HTTP ${res.status}`);
      if (res.status === 401) {
        throw new Error(msg + " (admin token expired/invalid — use Login or paste a fresh token)");
      }
      throw new Error(msg);
    }
    return data;
  }

  function htmlEscape(s) {
    return String(s || "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
    }[c]));
  }
  function fmtPct(n) {
    const x = Number(n);
    if (!Number.isFinite(x)) return "0%";
    return (x * 100).toFixed(2) + "%";
  }

  function cfgReadUI(scope = "global", scopeId = null) {
    const stableSlots = Number($("cfgStable")?.value || 0) || 0;
    const evolutionSlots = Number($("cfgEvo")?.value || 0) || 0;
    const globalWinnerSlots = Number($("cfgGlobalSlots")?.value || 0) || 0;

    const globalWinnersEnabled = !!$("cfgGlobalEnabled")?.checked;
    const allowCrossCategoryGlobalWinners = !!$("cfgCross")?.checked;

    const discount = {
      enabled: !!$("cfgDiscEnabled")?.checked,
      minPct: Number($("cfgDiscMinPct")?.value || 0) || 0,
      maxPct: Number($("cfgDiscMaxPct")?.value || 0) || 0,
      maxItemsPerWidget: Number($("cfgDiscMaxItems")?.value || 0) || 0,
      // NOTE: backend uses discount.minImpressions as "min clicks" guardrail in this project
      minImpressions: Number($("cfgDiscMinClicks")?.value || 0) || 0,
      maxAtcPerClick: Number($("cfgDiscMaxAtcClick")?.value || 0.1) || 0.1,
      minMarginPct: Number($("cfgDiscMinMargin")?.value || 0.2) || 0.2,
      ttlMinutes: Number($("cfgDiscTtl")?.value || 60) || 60,
      strategy: String($("cfgDiscStrategy")?.value || "bestSellers"),
      randomChance: Number($("cfgDiscRandomChance")?.value || 0) || 0,
      maxRandomPerBatch: Number($("cfgDiscMaxRandom")?.value || 0) || 0,
      onlyEvolutionSlots: true
    };

    
const ui = {
  carousel: {
    desktopVisible: Number($("cfgUiDesktopVisible")?.value || 3) || 3,
    mobileVisible: Number($("cfgUiMobileVisible")?.value || 2) || 2,
    batchSizeDesktop: Number($("cfgUiBatchDesktop")?.value || 3) || 3,
    batchSizeMobile: Number($("cfgUiBatchMobile")?.value || 2) || 2,
    maxBatchesDesktop: Number($("cfgUiMaxBatchesDesktop")?.value || 10) || 10,
    maxBatchesMobile: Number($("cfgUiMaxBatchesMobile")?.value || 6) || 6,
    maxItemsDesktop: Number($("cfgUiMaxItemsDesktop")?.value || 0) || 0,
    maxItemsMobile: Number($("cfgUiMaxItemsMobile")?.value || 0) || 0,
    // legacy (kept for backward compatibility)
    maxBatches: Number($("cfgUiMaxBatchesDesktop")?.value || 10) || 10,
    maxItems: Number($("cfgUiMaxItemsDesktop")?.value || 0) || 0,
    swipeSmallPx: Number($("cfgUiSwipeSmall")?.value || 35) || 35,
    swipeBigPx: Number($("cfgUiSwipeBig")?.value || 120) || 120,
    tokenTtlMinutes: Number($("cfgUiTokenTtl")?.value || 60) || 60,
    prefetchThresholdMobile: Number($("cfgUiPrefetchMobile")?.value || 3) || 3,
    prefetchThresholdDesktop: Number($("cfgUiPrefetchDesktop")?.value || 6) || 6,
    appendCountMobile: Number($("cfgUiAppendMobile")?.value || (Number($("cfgUiMobileVisible")?.value || 2) || 2)) || (Number($("cfgUiMobileVisible")?.value || 2) || 2),
    appendCountDesktop: Number($("cfgUiAppendDesktop")?.value || (Number($("cfgUiBatchDesktop")?.value || 3) || 3)) || (Number($("cfgUiBatchDesktop")?.value || 3) || 3)
  }
};

    return {
      widgetId: widgetId(),
      scope,
      scopeId,
      stableSlots,
      evolutionSlots,
      globalWinnerSlots,
      globalWinnersEnabled,
      allowCrossCategoryGlobalWinners,
      candidatePoolRules: { sameCategoryOnly: true, allowedCategoryKeys: [], maxPriceDeltaPct: null },
      exploration: { mode: "thompson", epsilon: 0.2, priorImpressions: 20, priorClicks: 1, priorATC: 1 },
      globalWinnerMinUnitsSold30d: 0,
      globalWinnerMinScore: 0,
      discount,
      ui
    };
  }

  function cfgApplyUI(cfg) {
    const c = (cfg && typeof cfg === "object") ? cfg : {};
    $("cfgStable").value = Number(c.stableSlots ?? 2);
    $("cfgEvo").value = Number(c.evolutionSlots ?? 6);
    $("cfgGlobalSlots").value = Number(c.globalWinnerSlots ?? 0);
    $("cfgGlobalEnabled").checked = !!c.globalWinnersEnabled;
    $("cfgCross").checked = !!c.allowCrossCategoryGlobalWinners;

    const d = (c.discount && typeof c.discount === "object") ? c.discount : {};
    $("cfgDiscEnabled").checked = !!d.enabled;
    $("cfgDiscMinPct").value = Number(d.minPct ?? 2);
    $("cfgDiscMaxPct").value = Number(d.maxPct ?? 5);
    $("cfgDiscMaxItems").value = Number(d.maxItemsPerWidget ?? 2);
    $("cfgDiscMinClicks").value = Number(d.minImpressions ?? 80);
    $("cfgDiscMaxAtcClick").value = Number(d.maxAtcPerClick ?? 0.10);
    $("cfgDiscMinMargin").value = Number(d.minMarginPct ?? 0.20);
    $("cfgDiscTtl").value = Number(d.ttlMinutes ?? 60);

    // strategy + random
    if ($("cfgDiscStrategy")) $("cfgDiscStrategy").value = String(d.strategy ?? "bestSellers");
    if ($("cfgDiscRandomChance")) $("cfgDiscRandomChance").value = Number(d.randomChance ?? 0);
    if ($("cfgDiscMaxRandom")) $("cfgDiscMaxRandom").value = Number(d.maxRandomPerBatch ?? 0);

    const car = (c.ui && c.ui.carousel && typeof c.ui.carousel === "object") ? c.ui.carousel : {};
    $("cfgUiDesktopVisible").value = Number(car.desktopVisible ?? 3);
    $("cfgUiMobileVisible").value = Number(car.mobileVisible ?? 2);
    $("cfgUiBatchDesktop").value = Number(car.batchSizeDesktop ?? (car.desktopVisible ?? 3));
    $("cfgUiBatchMobile").value = Number(car.batchSizeMobile ?? (car.mobileVisible ?? 2));

    if ($("cfgUiMaxBatchesDesktop")) $("cfgUiMaxBatchesDesktop").value = Number(car.maxBatchesDesktop ?? car.maxBatches ?? 10);
    if ($("cfgUiMaxBatchesMobile")) $("cfgUiMaxBatchesMobile").value = Number(car.maxBatchesMobile ?? car.maxBatches ?? 6);
    if ($("cfgUiMaxItemsDesktop")) $("cfgUiMaxItemsDesktop").value = Number(car.maxItemsDesktop ?? car.maxItems ?? 0);
    if ($("cfgUiMaxItemsMobile")) $("cfgUiMaxItemsMobile").value = Number(car.maxItemsMobile ?? car.maxItems ?? 0);

    if ($("cfgUiPrefetchMobile")) $("cfgUiPrefetchMobile").value = Number(car.prefetchThresholdMobile ?? 3);
    if ($("cfgUiPrefetchDesktop")) $("cfgUiPrefetchDesktop").value = Number(car.prefetchThresholdDesktop ?? 6);
    if ($("cfgUiAppendMobile")) $("cfgUiAppendMobile").value = Number(car.appendCountMobile ?? (car.mobileVisible ?? 2));
    if ($("cfgUiAppendDesktop")) $("cfgUiAppendDesktop").value = Number(car.appendCountDesktop ?? (car.batchSizeDesktop ?? (car.desktopVisible ?? 3)));

    $("cfgUiSwipeSmall").value = Number(car.swipeSmallPx ?? 35);
    $("cfgUiSwipeBig").value = Number(car.swipeBigPx ?? 120);
    $("cfgUiTokenTtl").value = Number(car.tokenTtlMinutes ?? 60);
  }

  async function loadCredsIntoInputs() {
    $("apiBase").value = String(localStorage.getItem("api_base") || "");
    $("apiToken").value = String(localStorage.getItem("api_token") || "");
    $("adminCode").value = String(localStorage.getItem("admin_code") || "");
    if ($("widgetId")) $("widgetId").value = String(localStorage.getItem("recs_widget_id") || WIDGET_ID_DEFAULT);
    if ($("loginUser")) $("loginUser").value = String(localStorage.getItem("admin_user") || "admin");
    if ($("loginPass")) $("loginPass").value = String(localStorage.getItem("admin_pass") || "admin");
  }

  async function saveCreds() {
    localStorage.setItem("api_base", String($("apiBase")?.value || "").trim());
    localStorage.setItem("api_token", String($("apiToken")?.value || "").trim());
    localStorage.setItem("admin_code", String($("adminCode")?.value || "").trim());
    if ($("widgetId")) localStorage.setItem("recs_widget_id", String($("widgetId")?.value || "").trim() || WIDGET_ID_DEFAULT);
    setStatus("Saved credentials.");
  }

  async function login() {
    setStatus("Logging in…");
    const b = baseUrl();
    if (!b) throw new Error("Missing API base URL.");
    const username = String($("loginUser")?.value || "admin").trim();
    const password = String($("loginPass")?.value || "admin").trim();
    const adminCode = String($("adminCode")?.value || localStorage.getItem("admin_code") || "").trim();
    if (!adminCode) throw new Error("Missing admin code.");

    const res = await fetch(b + "/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, adminCode }),
      credentials: "include"
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.token) throw new Error(data?.error || data?.message || `HTTP ${res.status}`);

    const token = String(data.token);
    $("apiToken").value = token;
    localStorage.setItem("api_token", token);
    localStorage.setItem("admin_user", username);
    localStorage.setItem("admin_pass", password);
    setStatus(`Logged in. Token valid ~${Number(data.expiresIn || 0)}s.`);
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

    $("overview").innerHTML = `
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

    setStatus("Overview loaded.");
  }

  async function loadConfig() {
    setCfgStatus("Loading…");
    const data = await jfetch(cfgUrl("global", null));
    cfgApplyUI(data?.config || null);
    setCfgStatus("Loaded.");
  }

  async function saveConfig() {
    setCfgStatus("Saving…");
    const body = cfgReadUI("global", null);
    const data = await jfetch("/admin/recs/config", { method: "PUT", body });
    cfgApplyUI(data?.config || body);
    setCfgStatus("Saved.");
  }

  async function loadProductOverride() {
    const sourceId = String($("pcfgSource")?.value || "").trim();
    if (!sourceId) throw new Error("Enter a productId.");
    setPCfgStatus("Loading…");
    const data = await jfetch(cfgUrl("product", sourceId));
    const cfg = data?.config || null;
    if (cfg) {
      $("pcfgStable").value = Number(cfg.stableSlots ?? 2);
      $("pcfgEvo").value = Number(cfg.evolutionSlots ?? 6);
      setPCfgStatus("Loaded override.");
    } else {
      $("pcfgStable").value = "";
      $("pcfgEvo").value = "";
      setPCfgStatus("No override found.");
    }
  }

  async function saveProductOverride() {
    const sourceId = String($("pcfgSource")?.value || "").trim();
    if (!sourceId) throw new Error("Enter a productId.");
    setPCfgStatus("Saving…");
    const body = cfgReadUI("product", sourceId);
    body.stableSlots = Number($("pcfgStable")?.value || 0) || body.stableSlots;
    body.evolutionSlots = Number($("pcfgEvo")?.value || 0) || body.evolutionSlots;
    await jfetch("/admin/recs/config", { method: "PUT", body });
    setPCfgStatus("Saved override.");
  }

  async function clearProductOverride() {
    const sourceId = String($("pcfgSource")?.value || "").trim();
    if (!sourceId) throw new Error("Enter a productId.");
    setPCfgStatus("Clearing…");
    await jfetch(cfgUrl("product", sourceId), { method: "DELETE" });
    setPCfgStatus("Cleared.");
  }

  async function loadSourceStats() {
    const sourceId = String($("sourceId")?.value || "").trim();
    if (!sourceId) throw new Error("Enter a source productId.");
    setStatus("Loading source…");
    const data = await jfetch(`/admin/recs/source/${encodeURIComponent(sourceId)}`);
    const items = Array.isArray(data?.items) ? data.items : [];

    $("sourceMeta").textContent = `Loaded ${items.length} targets for ${sourceId}.`;

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

    $("tbl").innerHTML = rows;
    setStatus("Source loaded.");
  }

  async function saveBan() {
    setBanStatus("Saving…");
    const body = {
      widgetId: widgetId(),
      type: String($("banType")?.value || "").trim(),
      productId: String($("banProductId")?.value || "").trim() || null,
      sourceProductId: String($("banSourceId")?.value || "").trim() || null,
      categoryKey: String($("banCategory")?.value || "").trim() || null,
      reason: String($("banReason")?.value || "").trim() || null,
      isActive: !!$("banActive")?.checked
    };
    await jfetch("/admin/recs/exclusions", { method: "POST", body });
    setBanStatus("Saved.");
  }

  function wire() {
    $("saveCreds").onclick = () => saveCreds().catch(e => setStatus(String(e.message || e), false));
    if ($("loginBtn")) $("loginBtn").onclick = () => login().catch(e => setStatus(String(e.message || e), false));
    $("loadOverview").onclick = () => loadOverview().catch(e => setStatus(String(e.message || e), false));

    $("loadCfg").onclick = () => loadConfig().catch(e => setCfgStatus(String(e.message || e), false));
    $("saveCfg").onclick = () => saveConfig().catch(e => setCfgStatus(String(e.message || e), false));

    $("pcfgLoad").onclick = () => loadProductOverride().catch(e => setPCfgStatus(String(e.message || e), false));
    $("pcfgSave").onclick = () => saveProductOverride().catch(e => setPCfgStatus(String(e.message || e), false));
    $("pcfgClear").onclick = () => clearProductOverride().catch(e => setPCfgStatus(String(e.message || e), false));

    $("loadSource").onclick = () => loadSourceStats().catch(e => setStatus(String(e.message || e), false));

    $("saveBan").onclick = () => saveBan().catch(e => setBanStatus(String(e.message || e), false));
  }

  (async function init() {
    await loadCredsIntoInputs();
    wire();

    // Auto-load global config on page load so values persist across refresh.
    loadConfig().catch(e => setCfgStatus(String(e.message || e), false));
  })();
})();
