(function(){
  const APP_LOADER_STYLE_ID = 'appBootLoaderStyles';
  const APP_LOADER_ID = 'appBootLoaderOverlay';
  let prevBodyOverflow = null;
  let prevTitle = null;
  const api = {
    ensureStyles() {
      return !!document.getElementById(APP_LOADER_STYLE_ID)
        || !!document.querySelector('link[href*="src/styles/app.css"]');
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
