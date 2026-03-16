/* graphEngine.js (v2 - server-metrics)
   Management Frontend — Graph Engine
   - Excel-like charts tab (Chart.js)
   - Graph configs persisted to localStorage
   - Pulls time-series from server endpoints:
       GET /admin/metrics/catalog
       GET /admin/metrics/timeseries
       GET /admin/metrics/dimensions (optional dropdown helper)
       GET /admin/analytics/events (optional raw)
   - Requires window.adminApi with:
       - tokenValid(), login(), setApiBase(), setAdminCode()
       - (added in script.js) metricsCatalog(), metricsTimeseries(), metricsDimensions()

   Installation:
     <script src="script.js"></script>
     <script src="graphEngine.js"></script>
     // after ensureLogin():
     await graphEngine.install({ adminApi: window.adminApi });

   Notes:
   - If Chart.js isn't present, this file auto-loads it from CDN.
*/
(() => {
  "use strict";

  const STORAGE_KEY = "mgmt_graphs_v2";
  const UI_STATE_KEY = "mgmt_graphs_ui_v2";
  const CHARTJS_CDN = "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js";

  const DEFAULT_TOPN = 8;

  const engine = {
    _installed: false,
    _panel: null,
    _charts: new Map(), // graphId -> Chart
    _resizeObservers: new Map(), // graphId -> ResizeObserver
    _adminApi: null,
    _styleInjected: false,
    _catalog: null, // { metrics:[{dataset,id,label,...}], timezone }
  };

  // -----------------------------
  // Utilities
  // -----------------------------
  const nowMs = () => Date.now();
  const uid = () => "g_" + Math.random().toString(16).slice(2) + "_" + nowMs().toString(16);

  function safeJsonParse(s, fallback) { try { return JSON.parse(s); } catch { return fallback; } }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function clampInt(v, min, max, fb) {
    const n = Number(v);
    if (!Number.isFinite(n)) return fb;
    return Math.max(min, Math.min(max, Math.trunc(n)));
  }

  function toISODate(ms) {
    const d = new Date(ms);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  }

  function rangePresetToMs(preset) {
    const end = nowMs();
    const day = 24 * 60 * 60 * 1000;
    const p = String(preset || "30d");

    if (p === "7d") return { fromMs: end - 7 * day, toMs: end };
    if (p === "10d") return { fromMs: end - 10 * day, toMs: end };
    if (p === "30d") return { fromMs: end - 30 * day, toMs: end };
    if (p === "90d") return { fromMs: end - 90 * day, toMs: end };
    if (p === "365d") return { fromMs: end - 365 * day, toMs: end };
    if (p === "ytd") {
      const d = new Date(end);
      d.setMonth(0, 1);
      d.setHours(0, 0, 0, 0);
      return { fromMs: d.getTime(), toMs: end };
    }
    return { fromMs: end - 30 * day, toMs: end };
  }

  function getRangeMs(g) {
    if (g.rangePreset === "custom") {
      const f = g.customFrom ? Date.parse(g.customFrom + "T00:00:00") : null;
      const t = g.customTo ? Date.parse(g.customTo + "T23:59:59") : null;
      const fromMs = Number.isFinite(f) ? f : (nowMs() - 30 * 86400000);
      const toMs = Number.isFinite(t) ? t : nowMs();
      return { fromMs, toMs };
    }
    return rangePresetToMs(g.rangePreset);
  }

  // -----------------------------
  // Storage
  // -----------------------------
  function loadGraphs() {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = safeJsonParse(raw, []);
    return Array.isArray(arr) ? arr : [];
  }
  function saveGraphs(graphs) { localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.isArray(graphs) ? graphs : [])); }
  function loadUiState() { return safeJsonParse(localStorage.getItem(UI_STATE_KEY), {}); }
  function saveUiState(state) { localStorage.setItem(UI_STATE_KEY, JSON.stringify(state || {})); }

  // -----------------------------
  // Chart.js loader
  // -----------------------------
  let chartJsPromise = null;
  function ensureChartJs() {
    if (window.Chart && typeof window.Chart === "function") return Promise.resolve(window.Chart);
    if (chartJsPromise) return chartJsPromise;
    chartJsPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = CHARTJS_CDN;
      s.async = true;
      s.defer = true;
      s.onload = () => window.Chart ? resolve(window.Chart) : reject(new Error("Chart.js loaded but window.Chart missing"));
      s.onerror = () => reject(new Error("Failed to load Chart.js from CDN"));
      document.head.appendChild(s);
    });
    return chartJsPromise;
  }

  // -----------------------------
  // Catalog handling
  // -----------------------------
  function metricKey(dataset, id) { return `${dataset}:${id}`; }

  function groupByOptionsForDataset(dataset) {
    if (dataset === "orders") {
      return [
        { key: "", label: "None" },
        { key: "status", label: "Status" },
        { key: "country", label: "Country" }
      ];
    }
    if (dataset === "analytics") {
      return [
        { key: "", label: "None" },
        { key: "type", label: "Type" },
        { key: "path", label: "Path" },
        { key: "productLink", label: "Product link" }
      ];
    }
    return [{ key: "", label: "None" }];
  }

  function defaultGraphSpec() {
    return {
      id: uid(),
      title: "Revenue (last 30 days)",
      chartType: "line",        // line|bar
      dataset: "orders",        // orders|analytics
      metric: "revenue_eur",    // dataset-specific metric id
      interval: "day",          // hour|day|week|month (server supports hour too)
      rangePreset: "30d",       // 7d|30d|90d|365d|ytd|custom
      customFrom: "",
      customTo: "",
      groupBy: "",              // dimension key
      topN: DEFAULT_TOPN,       // effective when groupBy
      // dataset-specific filters:
      filters: {
        // orders:
        paidOnly: true,
        status: "",
        country: "",
        minPaidEUR: "",
        // analytics:
        type: "",
        path: "",
        websiteOrigin: "",
        sessionId: "",
        productLink: ""
      }
    };
  }

  function sanitizeGraphSpec(g) {
    const out = Object.assign(defaultGraphSpec(), g || {});
    out.id = String(out.id || uid());
    out.title = String(out.title || "Graph");
    out.chartType = (out.chartType === "bar") ? "bar" : "line";
    out.dataset = (out.dataset === "analytics") ? "analytics" : "orders";
    out.metric = String(out.metric || "");
    out.interval = ["hour", "day", "week", "month"].includes(String(out.interval)) ? String(out.interval) : "day";
    out.rangePreset = ["7d", "10d", "30d", "90d", "365d", "ytd", "custom"].includes(String(out.rangePreset)) ? String(out.rangePreset) : "30d";
    out.customFrom = String(out.customFrom || "");
    out.customTo = String(out.customTo || "");
    out.groupBy = String(out.groupBy || "");
    out.topN = clampInt(out.topN, 1, 25, DEFAULT_TOPN);
    out.sizeW = clampInt(out.sizeW, 240, 2400, 900);
    out.sizeH = clampInt(out.sizeH, 180, 1800, 360);
    out.filters = out.filters || {};
    // normalize known keys to strings/bools
    out.filters.paidOnly = !!out.filters.paidOnly;
    for (const k of ["status", "country", "minPaidEUR", "type", "path", "websiteOrigin", "sessionId", "productLink"]) {
      out.filters[k] = (out.filters[k] == null) ? "" : String(out.filters[k]);
    }
    return out;
  }

  async function fetchCatalog() {
    const api = engine._adminApi;
    if (!api || typeof api.metricsCatalog !== "function") return null;
    const c = await api.metricsCatalog();
    if (!c || !c.ok || !Array.isArray(c.metrics)) return null;
    engine._catalog = c;
    return c;
  }

  function metricsForDataset(dataset) {
    const c = engine._catalog;
    if (!c || !Array.isArray(c.metrics)) return [];
    return c.metrics.filter(m => m.dataset === dataset);
  }

  function metricLabel(dataset, metricId) {
    const ms = metricsForDataset(dataset);
    const def = ms.find(m => String(m.id) === String(metricId));
    return def ? String(def.label || metricId) : String(metricId || "");
  }

  function guessUnit(dataset, metricId) {
    const id = String(metricId || "").toLowerCase();
    if (id.includes("eur") || id.includes("revenue")) return "EUR";
    return "";
  }

  // -----------------------------
  // Server series -> Chart.js data
  // -----------------------------
  function buildChartDataFromServerSeries(seriesArr) {
    // Input:
    //   [{ key,label, points:[{bucket,value}] }, ...]
    // Output:
    //   { labels:[...], datasets:[{label,data:[...]}] }
    const bucketsSet = new Set();
    for (const s of (seriesArr || [])) {
      for (const p of (s.points || [])) bucketsSet.add(String(p.bucket));
    }
    const labels = Array.from(bucketsSet);
    labels.sort((a, b) => String(a).localeCompare(String(b)));

    const datasets = (seriesArr || []).map((s) => {
      const map = new Map();
      for (const p of (s.points || [])) map.set(String(p.bucket), Number(p.value) || 0);
      const data = labels.map(b => map.get(b) ?? 0);
      return { label: String(s.label || s.key || "Series"), data, tension: 0.25, fill: false };
    });

    return { labels, datasets };
  }

  function formatTick(v, unit) {
    if (unit === "EUR") {
      const n = Number(v);
      if (!Number.isFinite(n)) return String(v);
      return n.toLocaleString(undefined, { maximumFractionDigits: 2 }) + " €";
    }
    const n = Number(v);
    if (Number.isFinite(n) && Math.abs(n) >= 1000) return n.toLocaleString(undefined);
    return String(v);
  }

  // -----------------------------
  // UI
  // -----------------------------
  function injectStylesOnce() {
    if (engine._styleInjected) return;
    engine._styleInjected = true;

        const css = `
.mg-graphs-hidden{display:none!important;}
.mg-graphs-top{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;margin:10px 0 12px;}
.mg-graphs-title{font-size:16px;font-weight:650;letter-spacing:.2px;color:#111827;}
.mg-graphs-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap;}
.mg-graphs-btn{background:#ffffff;color:#111827;border:1px solid #e5e7eb;border-radius:12px;padding:8px 10px;font-size:13px;cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,.04);}
.mg-graphs-btn:hover{filter:brightness(0.98);}
.mg-graphs-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:12px;margin:8px 0 16px;}
.mg-graph-card{background:#ffffff;color:#111827;border:1px solid #e5e7eb;border-radius:16px;box-shadow:0 18px 60px rgba(0,0,0,.10);padding:12px;}
.mg-graph-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px;}
.mg-graph-title{flex:1;min-width:160px;background:#ffffff;color:#111827;border:1px solid #e5e7eb;border-radius:10px;padding:8px 10px;font-size:13px;}
.mg-graph-controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:10px 12px;margin-bottom:12px;}
.mg-graph-controls>div{background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:10px;}
.mg-graph-controls label{font-size:12px;color:#374151;margin-bottom:4px;display:block;}
.mg-graph-controls select,
.mg-graph-controls input{width:100%;background:#ffffff;color:#111827;border:1px solid #e5e7eb;border-radius:10px;padding:8px 10px;font-size:13px;outline:none;}
.mg-graph-controls select:focus,
.mg-graph-controls input:focus{border-color:#93c5fd;box-shadow:0 0 0 3px rgba(59,130,246,.15);}
.mg-graph-controls input::placeholder{color:#9ca3af;}
.mg-graph-footer{display:flex;gap:8px;justify-content:flex-end;align-items:center;margin-top:10px;}
.mg-graph-note{font-size:12px;color:#6b7280;margin-top:6px;}
.mg-graph-canvas{background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:10px;}
.mg-graph-canvas canvas{background:#ffffff;}

/* Resizable chart area */
.mg-graph-canvasWrap{
  background:#ffffff;
  border:1px solid #e5e7eb;
  border-radius:12px;
  padding:10px;
  height:320px;
  min-height:200px;
  width:100%;
  min-width:260px;
  resize:both;
  overflow:auto;
}
.mg-graph-canvasWrap canvas{display:block;width:100%!important;height:100%!important;background:#ffffff;}
.mg-graph-stage{position:relative;padding:12px 24px 18px;display:flex;justify-content:flex-start;align-items:center;min-height:360px;gap:12px;}
.mg-graph-sizePanel{position:absolute;bottom:12px;right:12px;display:flex;align-items:center;gap:6px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:6px 8px;box-shadow:0 8px 18px rgba(0,0,0,.06);z-index:20;}
.mg-graph-sizePanel input{width:76px;padding:6px 8px;border:1px solid #e5e7eb;border-radius:10px;background:#fff;color:#111827;font-size:12px;}
.mg-size-lbl{font-size:12px;color:#374151;}
.mg-graph-resizeBox{position:relative;border:1px solid #e5e7eb;border-radius:16px;background:#ffffff;box-shadow:0 10px 22px rgba(0,0,0,.08);overflow:hidden;}
.mg-graph-resizeBox canvas{width:100%!important;height:100%!important;display:block;}
.mg-rh{position:absolute;width:14px;height:14px;border-radius:999px;background:#3b82f6;opacity:.85;box-shadow:0 2px 8px rgba(0,0,0,.18);cursor:grab;}
.mg-rh:active{cursor:grabbing;}
.mg-rh-l{left:-7px;top:50%;transform:translateY(-50%);}
.mg-rh-r{right:-7px;top:50%;transform:translateY(-50%);}
.mg-rh-t{top:-7px;left:50%;transform:translateX(-50%);}
.mg-rh-b{bottom:-7px;left:50%;transform:translateX(-50%);}
.mg-rh-br{right:-7px;bottom:-7px;cursor:nwse-resize;}

`;
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
  }

  function createGraphsPanel() {
    injectStylesOnce();

    const panel = document.createElement("section");
    panel.className = "container mg-graphs-hidden";
    panel.id = "graphsTab";

    panel.innerHTML = `
      <div class="mg-graphs-top">
        <div class="mg-graphs-title">Graphs <span class="mg-badge" id="mgCatalogBadge">catalog: unknown</span></div>
        <div class="mg-graphs-actions">
          <button class="mg-graphs-btn" id="mgAddGraphBtn">Add graph</button>
          <button class="mg-graphs-btn" id="mgRefreshAllBtn">Refresh</button>
          <button class="mg-graphs-btn" id="mgExportGraphsBtn">Export config</button>
          <button class="mg-graphs-btn" id="mgImportGraphsBtn">Import config</button>
        </div>
      </div>

      <div class="mg-graphs-top" style="border-top:none; padding-top: 10px;">
        <div class="mg-graphs-title" style="font-size:12px;opacity:.9;">Engagement presets</div>
        <div class="mg-graphs-actions">
          <button class="mg-graphs-btn" id="mgEngViewsBtn">Views & Paid</button>
          <button class="mg-graphs-btn" id="mgEngConvBtn">Conversion rates</button>
        </div>
      </div>

      <div class="mg-graphs-empty mg-graphs-hidden" id="mgGraphsEmpty"></div>
      <div class="mg-graphs-grid" id="mgGraphsGrid"></div>
      <input type="file" id="mgGraphsImportFile" accept="application/json" class="mg-graphs-hidden" />
      <div class="mg-graph-note">
        Uses server endpoints <code>/admin/metrics/*</code>. If you add new metrics on the server, they automatically appear here after refresh.
      </div>
    `;

    const main = document.querySelector("section.container");
    if (main && main.parentNode) main.parentNode.insertBefore(panel, main.nextSibling);
    else document.body.appendChild(panel);

    return panel;
  }

  function ensureGraphsButton() {
    const topbarContainer = document.querySelector(".top-topbar .container");
    if (!topbarContainer) return null;

    let btn = document.getElementById("mgGraphsTabBtn");
    if (btn) return btn;

    btn = document.createElement("button");
    btn.id = "mgGraphsTabBtn";
    btn.className = "mg-graphs-btn";
    btn.textContent = "Graphs";

    const brand = topbarContainer.querySelector(".brand");
    if (brand && brand.nextSibling) topbarContainer.insertBefore(btn, brand.nextSibling);
    else topbarContainer.appendChild(btn);

    return btn;
  }

  function showGraphsTab() {
    const panel = engine._panel;
    if (!panel) return;

    const ui = loadUiState() || {};
    ui.active = "graphs";
    saveUiState(ui);

    for (const sec of document.querySelectorAll("section.container")) {
      if (sec === panel) continue;
      sec.classList.add("mg-graphs-hidden");
    }
    panel.classList.remove("mg-graphs-hidden");
  }

  function hideGraphsTab() {
    const panel = engine._panel;
    if (!panel) return;

    const ui = loadUiState() || {};
    ui.active = "main";
    saveUiState(ui);

    panel.classList.add("mg-graphs-hidden");
    for (const sec of document.querySelectorAll("section.container")) {
      if (sec === panel) continue;
      sec.classList.remove("mg-graphs-hidden");
    }
  }

  function metricOptionsHtml(dataset, selected) {
  const ms = metricsForDataset(dataset);
  const sorted = ms.slice().sort((a, b) => String(a.label).localeCompare(String(b.label)));
  const sel = String(selected || "");
  if (!sorted.length) {
    const safe = escapeHtml(sel || (dataset === "orders" ? "orders_count" : "events_count"));
    return `<option value="${safe}" selected>${safe}</option>`;
  }
  return sorted.map(m => {
    const s = (String(m.id) === sel) ? "selected" : "";
    return `<option value="${escapeHtml(m.id)}" ${s}>${escapeHtml(m.label || m.id)}</option>`;
  }).join("");
  }

  function datasetOptionsHtml(selected) {
    const s = String(selected || "orders");
    return `
      <option value="orders" ${s === "orders" ? "selected" : ""}>Orders</option>
      <option value="analytics" ${s === "analytics" ? "selected" : ""}>Analytics</option>
    `;
  }

  function groupByOptionsHtml(dataset, selected) {
    const opts = groupByOptionsForDataset(dataset);
    const sel = String(selected || "");
    return opts.map(o => {
      const s = (String(o.key) === sel) ? "selected" : "";
      return `<option value="${escapeHtml(o.key)}" ${s}>${escapeHtml(o.label)}</option>`;
    }).join("");
  }

  function renderGraphsGrid() {
    const grid = engine._panel.querySelector("#mgGraphsGrid");
    if (!grid) return;

    const graphs = loadGraphs().map(sanitizeGraphSpec);
    saveGraphs(graphs);

    grid.innerHTML = graphs.map(g => {
      const ms = metricsForDataset(g.dataset);
      const defaultMetric = (ms[0]?.id) || (g.dataset === "orders" ? "orders_count" : "events_count");
      const metric = g.metric || defaultMetric;

      return `
      <div class="mg-graph-card" data-graph-id="${escapeHtml(g.id)}">
        <div class="mg-graph-head">
          <input class="mg-graph-title" data-role="title" value="${escapeHtml(g.title)}" />
          <button class="mg-graphs-btn" data-role="duplicate">Duplicate</button>
          <button class="mg-graphs-btn" data-role="delete">Delete</button>
        </div>

        <div class="mg-graph-controls">
          <div>
            <label>Dataset</label>
            <select data-role="dataset">${datasetOptionsHtml(g.dataset)}</select>
          </div>
          <div>
            <label>Metric</label>
            <select data-role="metric">${metricOptionsHtml(g.dataset, metric)}</select>
          </div>

          <div>
            <label>Chart type</label>
            <select data-role="chartType">
              <option value="line" ${g.chartType === "line" ? "selected" : ""}>Line</option>
              <option value="bar" ${g.chartType === "bar" ? "selected" : ""}>Bar</option>
            </select>
          </div>
          <div>
            <label>Interval</label>
            <select data-role="interval">
              <option value="hour" ${g.interval === "hour" ? "selected" : ""}>Hourly</option>
              <option value="day" ${g.interval === "day" ? "selected" : ""}>Daily</option>
              <option value="week" ${g.interval === "week" ? "selected" : ""}>Weekly</option>
              <option value="month" ${g.interval === "month" ? "selected" : ""}>Monthly</option>
            </select>
          </div>

          <div>
            <label>Range</label>
            <select data-role="rangePreset">
              <option value="7d" ${g.rangePreset === "7d" ? "selected" : ""}>Last 7 days</option>
              <option value="10d" ${g.rangePreset === "10d" ? "selected" : ""}>Last 10 days</option>
              <option value="30d" ${g.rangePreset === "30d" ? "selected" : ""}>Last 30 days</option>
              <option value="90d" ${g.rangePreset === "90d" ? "selected" : ""}>Last 90 days</option>
              <option value="365d" ${g.rangePreset === "365d" ? "selected" : ""}>Last 365 days</option>
              <option value="ytd" ${g.rangePreset === "ytd" ? "selected" : ""}>Year-to-date</option>
              <option value="custom" ${g.rangePreset === "custom" ? "selected" : ""}>Custom</option>
            </select>
          </div>
          <div>
            <label>Group by</label>
            <select data-role="groupBy">${groupByOptionsHtml(g.dataset, g.groupBy)}</select>
          </div>

          <div>
            <label>Custom from</label>
            <input data-role="customFrom" type="date" value="${escapeHtml(g.customFrom)}" />
          </div>
          <div>
            <label>Custom to</label>
            <input data-role="customTo" type="date" value="${escapeHtml(g.customTo)}" />
          </div>

          <div>
            <label>Top N (when Group by)</label>
            <input data-role="topN" type="number" min="1" max="25" value="${escapeHtml(String(g.topN || DEFAULT_TOPN))}" />
          </div>

          <!-- Orders filters -->
          <div class="mg-toggle">
            <input data-role="paidOnly" type="checkbox" ${g.filters?.paidOnly ? "checked" : ""} />
            <span>Paid only (orders)</span>
          </div>
          <div>
            <label>Status (orders)</label>
            <input data-role="status" placeholder="e.g. PAID" value="${escapeHtml(g.filters?.status || "")}" />
          </div>
          <div>
            <label>Country ISO2 (orders)</label>
            <input data-role="country" placeholder="e.g. SK" value="${escapeHtml(g.filters?.country || "")}" />
          </div>
          <div>
            <label>Min paid EUR (orders)</label>
            <input data-role="minPaidEUR" type="number" step="0.01" placeholder="0" value="${escapeHtml(g.filters?.minPaidEUR || "")}" />
          </div>

          <!-- Analytics filters -->
          <div>
            <label>Type (analytics)</label>
            <input data-role="type" placeholder="e.g. product_view" value="${escapeHtml(g.filters?.type || "")}" />
          </div>
          <div>
            <label>Path (analytics)</label>
            <input data-role="path" placeholder="/ or /product" value="${escapeHtml(g.filters?.path || "")}" />
          </div>
          <div>
            <label>Product link (analytics)</label>
            <input data-role="productLink" placeholder="https://..." value="${escapeHtml(g.filters?.productLink || "")}" />
          </div>
          <div>
            <label>Website origin (analytics)</label>
            <input data-role="websiteOrigin" placeholder="https://www.snagletshop.com" value="${escapeHtml(g.filters?.websiteOrigin || "")}" />
          </div>
          <div>
            <label>SessionId (analytics)</label>
            <input data-role="sessionId" placeholder="optional" value="${escapeHtml(g.filters?.sessionId || "")}" />
          </div>
        </div>

        <div class="mg-graph-stage">
          <div class="mg-graph-sizePanel" title="Resize chart (px)">
            <span class="mg-size-lbl">W</span>
            <input data-role="sizeW" type="number" min="240" step="10" value="${g.sizeW || 900}" />
            <span class="mg-size-lbl">H</span>
            <input data-role="sizeH" type="number" min="180" step="10" value="${g.sizeH || 360}" />
            <button class="mg-graphs-btn" data-role="applySize">Apply</button>
            <button class="mg-graphs-btn" data-role="resetSize" title="Reset">↺</button>
          </div>
          <div class="mg-graph-resizeBox" data-role="resizeBox" style="width:${g.sizeW || 900}px;height:${g.sizeH || 360}px;">
            <canvas data-role="canvas"></canvas>
            <div class="mg-rh mg-rh-l" data-h="l" title="Resize"></div>
            <div class="mg-rh mg-rh-r" data-h="r" title="Resize"></div>
            <div class="mg-rh mg-rh-t" data-h="t" title="Resize"></div>
            <div class="mg-rh mg-rh-b" data-h="b" title="Resize"></div>
            <div class="mg-rh mg-rh-br" data-h="br" title="Resize"></div>
          </div>
        </div>

        <div class="mg-graph-footer">
          <button class="mg-graphs-btn" data-role="refresh">Refresh</button>
          <button class="mg-graphs-btn" data-role="hide">Back to main</button>
          <span class="mg-graph-note" data-role="status"></span>
        </div>
      </div>
      `;
    }).join("");

    grid.querySelectorAll(".mg-graph-card").forEach(card => wireGraphCard(card));
  }

  function upsertGraph(g) {
    const graphs = loadGraphs().map(sanitizeGraphSpec);
    const idx = graphs.findIndex(x => x.id === g.id);
    if (idx >= 0) graphs[idx] = g;
    else graphs.unshift(g);
    saveGraphs(graphs);
  }

  function deleteGraph(id) {
    const graphs = loadGraphs().map(sanitizeGraphSpec).filter(g => g.id !== id);
    saveGraphs(graphs);
    const ch = engine._charts.get(id);
    if (ch) { try { ch.destroy(); } catch { } engine._charts.delete(id); }
  }

  function duplicateGraph(id) {
    const graphs = loadGraphs().map(sanitizeGraphSpec);
    const g = graphs.find(x => x.id === id);
    if (!g) return;
    const copy = sanitizeGraphSpec(Object.assign({}, g, { id: uid(), title: g.title + " (copy)" }));
    graphs.unshift(copy);
    saveGraphs(graphs);
  }

  function setCardStatus(card, msg) {
    const el = card.querySelector('[data-role="status"]');
    if (el) el.textContent = String(msg || "");
  }

  function readGraphFromCard(card) {
    const id = card.getAttribute("data-graph-id");
    const graphs = loadGraphs().map(sanitizeGraphSpec);
    const g = graphs.find(x => x.id === id) || sanitizeGraphSpec({ id });

    g.title = (card.querySelector('[data-role="title"]')?.value || "").trim() || "Graph";
    g.dataset = card.querySelector('[data-role="dataset"]')?.value || "orders";
    g.metric = card.querySelector('[data-role="metric"]')?.value || "";
    g.chartType = card.querySelector('[data-role="chartType"]')?.value || "line";
    g.interval = card.querySelector('[data-role="interval"]')?.value || "day";
    g.rangePreset = card.querySelector('[data-role="rangePreset"]')?.value || "30d";
    g.groupBy = card.querySelector('[data-role="groupBy"]')?.value || "";
    g.topN = clampInt(card.querySelector('[data-role="topN"]')?.value, 1, 25, DEFAULT_TOPN);

    g.sizeW = clampInt(card.querySelector('[data-role="sizeW"]')?.value, 240, 2400, g.sizeW || 900);
    g.sizeH = clampInt(card.querySelector('[data-role="sizeH"]')?.value, 180, 1800, g.sizeH || 360);

    g.customFrom = card.querySelector('[data-role="customFrom"]')?.value || "";
    g.customTo = card.querySelector('[data-role="customTo"]')?.value || "";

    g.filters = g.filters || {};
    g.filters.paidOnly = !!card.querySelector('[data-role="paidOnly"]')?.checked;
    for (const k of ["status", "country", "minPaidEUR", "type", "path", "websiteOrigin", "sessionId", "productLink"]) {
      g.filters[k] = (card.querySelector(`[data-role="${k}"]`)?.value || "").trim();
    }

    // ensure metric still exists; if dataset changed, pick first available
    const ms = metricsForDataset(g.dataset);
    if (ms.length) {
      const ok = ms.some(m => String(m.id) === String(g.metric));
      if (!ok) g.metric = String(ms[0].id);
    }

    return sanitizeGraphSpec(g);
  }

  const debounceMap = new Map(); // id -> timer
  function debouncePerId(id, fn, ms) {
    const t = debounceMap.get(id);
    if (t) clearTimeout(t);
    debounceMap.set(id, setTimeout(() => {
      debounceMap.delete(id);
      try { fn(); } catch { }
    }, ms));
  }

  function wireGraphCard(card) {
    const id = card.getAttribute("data-graph-id");
    const controls = card.querySelectorAll(".mg-graph-controls input, .mg-graph-controls select");

    // -----------------------------
    // Resizing UI (attach ONCE)
    // -----------------------------
    (function attachResizeUIOnce(){
      if (card._mgResizeWired) return;
      card._mgResizeWired = true;

      const box = card.querySelector('[data-role="resizeBox"]');
      const sizeWEl = card.querySelector('[data-role="sizeW"]');
      const sizeHEl = card.querySelector('[data-role="sizeH"]');
      const applyBtn = card.querySelector('[data-role="applySize"]');
      const resetBtn = card.querySelector('[data-role="resetSize"]');

      const getGid = () => (card.getAttribute("data-graph-id") || "");

      const applySize = (w, h) => {
        if (!box) return;
        const gid = getGid();
        const ww = clampInt(Math.round(w), 240, 2400, 900);
        const hh = clampInt(Math.round(h), 180, 1800, 360);

        box.style.width = ww + "px";
        box.style.height = hh + "px";

        if (sizeWEl) sizeWEl.value = String(ww);
        if (sizeHEl) sizeHEl.value = String(hh);

        // persist
        const g0 = readGraphFromCard(card);
        g0.sizeW = ww; g0.sizeH = hh;
        upsertGraph(g0);

        const ch = engine._charts.get(id);
        if (ch) { try { ch.resize(); } catch {} }
      };

      // Immediate updates from inputs (no Apply)
      let t = null;
      const scheduleFromInputs = () => {
        clearTimeout(t);
        t = setTimeout(() => {
          const w = parseInt(sizeWEl?.value || "0", 10);
          const h = parseInt(sizeHEl?.value || "0", 10);
          applySize(isFinite(w) ? w : 900, isFinite(h) ? h : 360);
        }, 50);
      };
      sizeWEl?.addEventListener("input", scheduleFromInputs);
      sizeHEl?.addEventListener("input", scheduleFromInputs);

      // Keep Apply for people who expect it (but it does same as typing)
      applyBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        scheduleFromInputs();
      });

      resetBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        applySize(900, 360);
      });

      // Drag handles
      const handles = card.querySelectorAll(".mg-rh");
      if (box && handles && handles.length) {
        handles.forEach(hn => hn.addEventListener("pointerdown", (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          const hdir = hn.getAttribute("data-h") || "br";

          const rect = box.getBoundingClientRect();
          const startX = ev.clientX, startY = ev.clientY;
          const startW = rect.width, startH = rect.height;

          const onMove = (mv) => {
            const dx = mv.clientX - startX;
            const dy = mv.clientY - startY;
            let w = startW, h = startH;

            if (hdir === "r" || hdir === "br") w = startW + dx;
            if (hdir === "l") w = startW - dx;
            if (hdir === "b" || hdir === "br") h = startH + dy;
            if (hdir === "t") h = startH - dy;

            applySize(w, h); // also updates inputs + chart live
          };

          const onUp = () => {
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
          };

          window.addEventListener("pointermove", onMove);
          window.addEventListener("pointerup", onUp);
        }));
      }
    })();

    // -----------------------------
    // Main config wiring
    // -----------------------------
    const onChange = (event) => {
      const g = readGraphFromCard(card);
      upsertGraph(g);

      // if dataset changed -> re-render metric + groupBy dropdowns to match dataset
      if (event && event.target && event.target.getAttribute) {
        const role = event.target.getAttribute("data-role");
        if (role === "dataset") {
          renderGraphsGrid(); // fast and safe
          return;
        }
      }

      debouncePerId(id, () => renderGraphIntoCard(card, g), 250);
    };

    controls.forEach(el => el.addEventListener("change", onChange));
    card.querySelector('[data-role="title"]')?.addEventListener("input", () => {
      const g = readGraphFromCard(card);
      upsertGraph(g);
      debouncePerId(id, () => renderGraphIntoCard(card, g), 350);
    });

    card.querySelector('[data-role="delete"]')?.addEventListener("click", () => { deleteGraph(id); renderGraphsGrid(); });
    card.querySelector('[data-role="duplicate"]')?.addEventListener("click", () => { duplicateGraph(id); renderGraphsGrid(); });
    card.querySelector('[data-role="refresh"]')?.addEventListener("click", () => {
      const g = readGraphFromCard(card);
      upsertGraph(g);
      renderGraphIntoCard(card, g, { force: true }).catch(() => { });
    });
    card.querySelector('[data-role="hide"]')?.addEventListener("click", () => hideGraphsTab());

    const g = readGraphFromCard(card);
    renderGraphIntoCard(card, g).catch(() => { });
  }
async function renderGraphIntoCard(card, g) {
    setCardStatus(card, "Loading…");

    // Custom date inputs enabled only when preset=custom
    const customEnabled = (g.rangePreset === "custom");
    const cf = card.querySelector('[data-role="customFrom"]');
    const ct = card.querySelector('[data-role="customTo"]');
    if (cf) cf.disabled = !customEnabled;
    if (ct) ct.disabled = !customEnabled;

    // Disable irrelevant filter inputs based on dataset
    const isOrders = (g.dataset === "orders");
    for (const k of ["paidOnly", "status", "country", "minPaidEUR"]) {
      const el = card.querySelector(`[data-role="${k}"]`);
      if (el) el.disabled = !isOrders;
    }
    for (const k of ["type", "path", "websiteOrigin", "sessionId", "productLink"]) {
      const el = card.querySelector(`[data-role="${k}"]`);
      if (el) el.disabled = isOrders;
    }

    const metricId = String(g.metric || "");
    if (!metricId) { setCardStatus(card, "Select a metric"); return; }

    const { fromMs, toMs } = getRangeMs(g);
    if (!Number.isFinite(fromMs) || !Number.isFinite(toMs) || toMs <= fromMs) {
      setCardStatus(card, "Invalid range");
      return;
    }

    const api = engine._adminApi;
    if (!api || typeof api.metricsTimeseries !== "function") {
      setCardStatus(card, "adminApi.metricsTimeseries missing (update script.js adminApi helpers)");
      return;
    }

    // Build query for server
    const from = new Date(fromMs).toISOString();
    const to = new Date(toMs).toISOString();

    const q = {
      dataset: g.dataset,
      metric: metricId,
      interval: g.interval,
      from, to
    };

    if (g.groupBy) {
      q.groupBy = g.groupBy;
      q.topN = clampInt(g.topN, 1, 25, DEFAULT_TOPN);
    }

    // Dataset-specific filters
    if (g.dataset === "orders") {
      q.paidOnly = !!g.filters.paidOnly;
      if (g.filters.status) q.status = g.filters.status;
      if (g.filters.country) q.country = g.filters.country;
      if (g.filters.minPaidEUR) q.minPaidEUR = g.filters.minPaidEUR;
    } else if (g.dataset === "analytics") {
      if (g.filters.type) q.type = g.filters.type;
      if (g.filters.path) q.path = g.filters.path;
      if (g.filters.websiteOrigin) q.websiteOrigin = g.filters.websiteOrigin;
      if (g.filters.sessionId) q.sessionId = g.filters.sessionId;
      if (g.filters.productLink) q.productLink = g.filters.productLink;
    }

    let resp;
    try {
      resp = await api.metricsTimeseries(q);
    } catch (e) {
      setCardStatus(card, "Fetch failed: " + String(e?.message || e));
      return;
    }
    if (!resp || !resp.ok) {
      setCardStatus(card, "Fetch failed");
      return;
    }

    const seriesArr = Array.isArray(resp.series) ? resp.series : [];
    const { labels, datasets } = buildChartDataFromServerSeries(seriesArr);

    const canvas = card.querySelector('[data-role="canvas"]');
    if (!canvas) return;

    try { await ensureChartJs(); }
    catch (e) { setCardStatus(card, "Chart.js unavailable: " + String(e?.message || e)); return; }

    const prev = engine._charts.get(g.id);
    if (prev) {
      try { prev.destroy(); } catch { }
      engine._charts.delete(g.id);
    }
    const prevObs = engine._resizeObservers.get(g.id);
    if (prevObs) { try { prevObs.disconnect(); } catch { } engine._resizeObservers.delete(g.id); }

    const ctx = canvas.getContext("2d");
    const type = (g.chartType === "bar") ? "bar" : "line";
    const unit = guessUnit(g.dataset, metricId);
    const title = g.title || metricLabel(g.dataset, metricId) || "Graph";

    // Keep it "Excel-like": readable grid, no over-styling.
    const chart = new window.Chart(ctx, {
      type,
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: datasets.length > 1, position: "top" },
          title: { display: true, text: title }
        },
        scales: {
          x: { grid: { display: true } },
          y: { grid: { display: true }, ticks: { callback: (v) => formatTick(v, unit) } }
        }
      }
    });

    engine._charts.set(g.id, chart);

    // Ensure the chart responds to manual resize of the canvas wrapper (CSS resize: both)
    try {
      const wrap = card.querySelector('[data-role="resizeBox"]') || canvas.parentElement;
      if (wrap && typeof ResizeObserver !== 'undefined') {
        const ro = new ResizeObserver(() => {
          try { chart.resize(); } catch { }
        });
        ro.observe(wrap);
        engine._resizeObservers.set(g.id, ro);
      }
    } catch { }

    const meta = `${metricLabel(g.dataset, metricId)} • ${toISODate(fromMs)} → ${toISODate(toMs)} • ${g.interval}${g.groupBy ? ` • grouped by ${g.groupBy}` : ""}`;
    setCardStatus(card, meta);
  }

  // -----------------------------
  // Import/export config
  // -----------------------------
  function exportConfig() {
    const graphs = loadGraphs().map(sanitizeGraphSpec);
    const blob = new Blob([JSON.stringify({ version: 2, graphs }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mgmt-graphs-config.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function importConfigFromFile(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => {
        const obj = safeJsonParse(String(r.result || ""), null);
        const graphs = Array.isArray(obj?.graphs) ? obj.graphs : (Array.isArray(obj) ? obj : null);
        if (!graphs) return reject(new Error("Invalid config file"));
        saveGraphs(graphs.map(sanitizeGraphSpec));
        resolve(true);
      };
      r.onerror = () => reject(new Error("Failed to read file"));
      r.readAsText(file);
    });
  }

  // -----------------------------
  // Engagement presets (uses adminApi.engagementSummary)
  // -----------------------------
  function ensureEngagementCard() {
    const grid = engine._panel?.querySelector?.("#mgGraphsGrid");
    if (!grid) return null;
    let card = engine._panel.querySelector("#mgEngagementCard");
    if (card) return card;

    card = document.createElement("div");
    card.className = "mg-graph-card";
    card.id = "mgEngagementCard";
    card.innerHTML = `
      <div class="mg-graph-head">
        <div class="mg-graph-title">Engagement preset</div>
        <div class="mg-graph-actions">
          <span class="mg-badge" id="mgEngagementMeta">last 30 days • day</span>
        </div>
      </div>
      <div class="mg-graph-body" data-role="resizeBox" style="min-height:320px; resize: vertical; overflow:auto;">
        <canvas data-role="canvas" height="320"></canvas>
      </div>
    `;
    grid.insertBefore(card, grid.firstChild);
    return card;
  }

  async function renderEngagementPreset(kind) {
    if (!engine._adminApi?.engagementSummary) {
      alert("Engagement presets require adminApi.engagementSummary() (update Management Frontend script.js)");
      return;
    }
    try { await ensureChartJs(); } catch (e) {
      alert("Chart.js unavailable: " + String(e?.message || e));
      return;
    }

    const to = new Date();
    const from = new Date(Date.now() - 30 * 86400000);
    const bucket = "day";

    const resp = await engine._adminApi.engagementSummary({ from: from.toISOString(), to: to.toISOString(), bucket });
    const rows = Array.isArray(resp?.rows) ? resp.rows : [];

    const labels = rows.map(r => r.bucket);
    let datasets = [];
    if (kind === "conv") {
      datasets = [
        { label: "View→Cart %", data: rows.map(r => (Number(r.viewToCartRate || 0) * 100)), tension: 0.15 },
        { label: "View→Paid %", data: rows.map(r => (Number(r.viewToPaidRate || 0) * 100)), tension: 0.15 },
        { label: "Cart→Paid %", data: rows.map(r => (Number(r.cartToPaidRate || 0) * 100)), tension: 0.15 }
      ];
    } else {
      datasets = [
        { label: "Views", data: rows.map(r => Number(r.views || 0)), tension: 0.15 },
        { label: "Paid orders", data: rows.map(r => Number(r.paidOrders || 0)), tension: 0.15 }
      ];
    }

    const card = ensureEngagementCard();
    if (!card) return;
    const canvas = card.querySelector('[data-role="canvas"]');
    const meta = card.querySelector('#mgEngagementMeta');
    if (meta) meta.textContent = `last 30 days • ${bucket}`;

    const prev = engine._charts.get("__engagement");
    if (prev) { try { prev.destroy(); } catch { } engine._charts.delete("__engagement"); }

    const ctx = canvas.getContext("2d");
    const chart = new window.Chart(ctx, {
      type: "line",
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: true, position: "top" },
          title: { display: true, text: (kind === "conv") ? "Engagement — Conversion rates" : "Engagement — Views & Paid" }
        },
        scales: {
          x: { grid: { display: true } },
          y: { grid: { display: true } }
        }
      }
    });

    engine._charts.set("__engagement", chart);
  }

  // -----------------------------
  // Public API
  // -----------------------------
  async function install(opts) {
    opts = opts || {};
    engine._adminApi = opts.adminApi || window.adminApi || null;

    if (!engine._panel) engine._panel = createGraphsPanel();

    // Add and wire the topbar button (idempotent)
    const btn = ensureGraphsButton();
    if (btn && !btn._mgWired) {
      btn._mgWired = true;
      btn.addEventListener("click", async () => {
        const isHidden = engine._panel.classList.contains("mg-graphs-hidden");
        if (isHidden) {
          showGraphsTab();
          await refreshCatalogAndRender();
        } else {
          hideGraphsTab();
        }
      });
    }

    // Wire panel buttons once
    const addBtn = engine._panel.querySelector("#mgAddGraphBtn");
    if (addBtn && !addBtn._mgWired) {
      addBtn._mgWired = true;
      addBtn.addEventListener("click", () => {
        const graphs = loadGraphs().map(sanitizeGraphSpec);
        graphs.unshift(defaultGraphSpec());
        saveGraphs(graphs);
        renderGraphsGrid();
      });
    }

    const refBtn = engine._panel.querySelector("#mgRefreshAllBtn");
    if (refBtn && !refBtn._mgWired) {
      refBtn._mgWired = true;
      refBtn.addEventListener("click", async () => {
        await refreshCatalogAndRender(true);
      });
    }

    // Engagement preset buttons
    const engViewsBtn = engine._panel.querySelector("#mgEngViewsBtn");
    const engConvBtn = engine._panel.querySelector("#mgEngConvBtn");
    const allowEng = (() => {
      try {
        const raw = localStorage.getItem("mg_features_v1");
        const obj = raw ? JSON.parse(raw) : {};
        // default true
        return obj?.analyticsGraphs !== false;
      } catch { return true; }
    })();

    if (engViewsBtn && !engViewsBtn._mgWired) {
      engViewsBtn._mgWired = true;
      engViewsBtn.addEventListener("click", async () => {
        if (!allowEng) return;
        await renderEngagementPreset("views");
      });
    }
    if (engConvBtn && !engConvBtn._mgWired) {
      engConvBtn._mgWired = true;
      engConvBtn.addEventListener("click", async () => {
        if (!allowEng) return;
        await renderEngagementPreset("conv");
      });
    }

    const expBtn = engine._panel.querySelector("#mgExportGraphsBtn");
    if (expBtn && !expBtn._mgWired) { expBtn._mgWired = true; expBtn.addEventListener("click", exportConfig); }

    const impBtn = engine._panel.querySelector("#mgImportGraphsBtn");
    const impFile = engine._panel.querySelector("#mgGraphsImportFile");
    if (impBtn && impFile && !impBtn._mgWired) {
      impBtn._mgWired = true;
      impBtn.addEventListener("click", () => impFile.click());
      impFile.addEventListener("change", async () => {
        const file = impFile.files && impFile.files[0];
        if (!file) return;
        try { await importConfigFromFile(file); await refreshCatalogAndRender(true); }
        catch (e) { alert(String(e?.message || e)); }
        finally { impFile.value = ""; }
      });
    }

    // Ensure at least one graph exists
    const graphs = loadGraphs();
    if (!graphs || graphs.length === 0) saveGraphs([defaultGraphSpec()]);

    // Restore last view
    const ui = loadUiState() || {};
    if (ui.active === "graphs") {
      showGraphsTab();
      await refreshCatalogAndRender();
    } else {
      updateCatalogBadge();
    }

    engine._installed = true;
    return true;
  }

  async function refreshCatalogAndRender(force) {
    try {
      if (force) engine._catalog = null;
      await fetchCatalog();
    } catch (e) {
      console.warn("graphEngine: catalog fetch failed", e);
    }
    updateCatalogBadge();
    renderGraphsGrid();
  }

  
function updateCatalogBadge() {
  const badge = engine._panel?.querySelector("#mgCatalogBadge");
  const empty = engine._panel?.querySelector("#mgGraphsEmpty");
  if (!badge) return;

  const c = engine._catalog;
  const count = (c && Array.isArray(c.metrics)) ? c.metrics.length : null;

  if (typeof count === "number") {
    badge.textContent = `catalog: ${count}`;
    if (empty) {
      if (count === 0) {
        empty.textContent = "No metrics are available yet. This tab still works, but your server returned an empty metrics catalog.";
        empty.classList.remove("mg-graphs-hidden");
      } else {
        empty.textContent = "";
        empty.classList.add("mg-graphs-hidden");
      }
    }
  } else {
    badge.textContent = "catalog: unavailable";
    if (empty) {
      empty.textContent = "Metrics endpoints are unavailable or returned an error. Graphs UI is still usable, but dropdowns will be limited until /admin/metrics/* is implemented/enabled.";
      empty.classList.remove("mg-graphs-hidden");
    }
  }
}

  function setAdminApi(adminApi) { engine._adminApi = adminApi; }
  function open() { if (!engine._panel) engine._panel = createGraphsPanel(); showGraphsTab(); refreshCatalogAndRender(); }
  function close() { hideGraphsTab(); }

  window.graphEngine = window.graphEngine || {};
  window.graphEngine.install = install;
  window.graphEngine.open = open;
  window.graphEngine.close = close;
  window.graphEngine.setAdminApi = setAdminApi;
})();
