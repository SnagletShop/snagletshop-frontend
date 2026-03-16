(function(){
  const APP_LOADER_STYLE_ID = 'appBootLoaderStyles';
  const APP_LOADER_ID = 'appBootLoaderOverlay';
  let prevBodyOverflow = null;
  let prevTitle = null;
  const api = {
    ensureStyles() {
      if (document.getElementById(APP_LOADER_STYLE_ID)) return;
      const style = document.createElement('style');
      style.id = APP_LOADER_STYLE_ID;
      style.textContent = `
        @keyframes appLoaderSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        #${APP_LOADER_ID}{position:fixed; inset:0; z-index:90000; display:flex; align-items:center; justify-content:center; padding:16px; background:rgba(0,0,0,.45); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);} 
        #${APP_LOADER_ID} .card{width:min(520px, calc(100vw - 32px)); border-radius:16px; border:1px solid rgba(255,255,255,0.12); background:rgba(20,20,20,0.9); box-shadow:0 20px 60px rgba(0,0,0,.65); padding:16px; font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif; color:#fff;}
        #${APP_LOADER_ID} .row{display:flex; align-items:center; gap:12px;}
        #${APP_LOADER_ID} .spinner{width:22px; height:22px; border-radius:999px; border:3px solid rgba(255,255,255,0.22); border-top-color: rgba(255,255,255,0.95); animation: appLoaderSpin 900ms linear infinite; flex:0 0 auto;}
        #${APP_LOADER_ID} .title{font-weight:700; font-size:15px; line-height:1.2;}
        #${APP_LOADER_ID} .sub{margin-top:6px; font-size:13px; opacity:.85; line-height:1.35;}
      `;
      document.head.appendChild(style);
    },
    show(text = 'Loading…') {
      try { api.ensureStyles(); } catch {}
      let overlay = document.getElementById(APP_LOADER_ID);
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = APP_LOADER_ID;
        overlay.setAttribute('role', 'status');
        overlay.setAttribute('aria-live', 'polite');
        overlay.innerHTML = `<div class="card"><div class="row"><div class="spinner" aria-hidden="true"></div><div class="title">Loading SnagletShop</div></div><div class="sub" id="${APP_LOADER_ID}_text"></div></div>`;
        (document.body || document.documentElement).appendChild(overlay);
      }
      const textEl = document.getElementById(`${APP_LOADER_ID}_text`);
      if (textEl) textEl.textContent = String(text || 'Loading…');
      document.documentElement.style.cursor = 'progress';
      document.documentElement.setAttribute('aria-busy', 'true');
      try { if (prevTitle === null) prevTitle = document.title; if (!/Loading/i.test(document.title)) document.title = 'Loading…'; } catch {}
      try { if (document.body) { if (prevBodyOverflow === null) prevBodyOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; } } catch {}
    },
    hide() {
      const overlay = document.getElementById(APP_LOADER_ID);
      if (overlay) overlay.remove();
      document.documentElement.style.cursor = '';
      document.documentElement.removeAttribute('aria-busy');
      try { if (document.body && prevBodyOverflow !== null) document.body.style.overflow = prevBodyOverflow; } catch {}
      prevBodyOverflow = null;
      try { if (prevTitle !== null) document.title = prevTitle; } catch {}
      prevTitle = null;
    }
  };
  window.__SS_APP_LOADER__ = api;
})();
