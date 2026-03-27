(function (window, document) {
  let widgetId = null;
  let pending = null;
  let lastToken = '';

  function __snagletGetTurnstileSiteKey() {
    const meta = document.querySelector('meta[name="turnstile-sitekey"]');
    const metaContent = String(meta?.getAttribute('content') || '').trim();
    if (metaContent) return metaContent;

    const cfgContent = String(
      window.preloadedData?.storefrontConfig?.turnstileSiteKey ||
      window.preloadedData?.publicConfig?.turnstileSiteKey ||
      window.storefrontCfg?.turnstileSiteKey ||
      window.storefrontCfg?.config?.turnstileSiteKey ||
      ''
    ).trim();
    if (cfgContent) return cfgContent;

    return '';
  }

  function __snagletEnsureTurnstileContainer() {
    let el = document.getElementById('snaglet-turnstile');
    if (!el) {
      el = document.createElement('div');
      el.id = 'snaglet-turnstile';
      el.className = 'snaglet-turnstile-hidden';
      (document.body || document.documentElement).appendChild(el);
    }
    return el;
  }

  function __snagletWaitForTurnstile(timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
      const started = Date.now();
      const tick = () => {
        if (window.turnstile && typeof window.turnstile.render === 'function') return resolve(window.turnstile);
        if ((Date.now() - started) >= Number(timeoutMs || 10000)) return reject(new Error('Turnstile API not available'));
        setTimeout(tick, 100);
      };
      tick();
    });
  }

  async function __snagletInitTurnstileOnce() {
    const siteKey = __snagletGetTurnstileSiteKey();
    if (!siteKey) return null;
    if (widgetId !== null) return widgetId;
    const turnstile = await __snagletWaitForTurnstile(10000);
    const el = __snagletEnsureTurnstileContainer();
    widgetId = turnstile.render(el, {
      sitekey: siteKey,
      size: 'invisible',
      callback(token) { lastToken = String(token || ''); },
      'expired-callback'() { lastToken = ''; },
      'error-callback'() { lastToken = ''; }
    });
    return widgetId;
  }

  async function snagletGetTurnstileToken({ forceFresh = true, timeoutMs = 12000 } = {}) {
    const siteKey = __snagletGetTurnstileSiteKey();
    if (!siteKey) return '';
    await __snagletInitTurnstileOnce();
    if (!forceFresh && lastToken) return lastToken;
    if (pending) return pending;
    pending = new Promise(async (resolve, reject) => {
      try {
        const turnstile = await __snagletWaitForTurnstile(timeoutMs);
        const started = Date.now();
        const done = () => {
          if (lastToken) return resolve(lastToken);
          if ((Date.now() - started) >= Number(timeoutMs || 12000)) return reject(new Error('Turnstile token timeout'));
          setTimeout(done, 80);
        };
        if (forceFresh && widgetId !== null && typeof turnstile.reset === 'function') turnstile.reset(widgetId);
        if (widgetId !== null && typeof turnstile.execute === 'function') turnstile.execute(widgetId);
        done();
      } catch (err) {
        reject(err);
      }
    });
    try {
      return await pending;
    } finally {
      pending = null;
    }
  }

  window.__SS_TURNSTILE__ = {
    __snagletGetTurnstileSiteKey,
    __snagletEnsureTurnstileContainer,
    __snagletWaitForTurnstile,
    __snagletInitTurnstileOnce,
    snagletGetTurnstileToken
  };
})(window, document);
