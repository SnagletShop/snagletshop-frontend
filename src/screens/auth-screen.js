(function (window, document) {
  'use strict';

  function getResolver() { return window.__SS_RESOLVE__ || null; }
  function getScreens() { return getResolver()?.resolve?.('screens.manager', window.__SS_SCREENS__ || null) || null; }
  function getRouter() { return getResolver()?.resolve?.('app.router', window.__SS_ROUTER__ || null) || null; }
  function auth() { return window.__SS_CUSTOMER_AUTH__ || null; }
  function esc(value) {
    try { return window.__ssSafeEscHtml?.(value) || ''; } catch {}
    return String(value == null ? '' : value).replace(/[&<>"]/g, (m) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[m]));
  }

  function viewer() {
    return document.getElementById('Viewer');
  }

  function clearSort() {
    try { window.removeSortContainer?.(); } catch {}
  }

  function defaultReturnUrl() {
    return auth()?.consumeRedirect?.() || '/';
  }

  function tryResolveInternalState(urlLike) {
    const router = getRouter();
    if (!router?.parseRoute || !router?.resolveStateFromRoute) return null;
    try {
      const parsed = new URL(String(urlLike || ''), window.location.origin);
      if (parsed.origin !== window.location.origin) return null;
      const route = router.parseRoute(parsed.href);
      return router.resolveStateFromRoute(route, { allowDefaultCatalog: true }) || null;
    } catch {}
    return null;
  }

  function sameRouteState(a, b) {
    try { return !!a && !!b && JSON.stringify(a) === JSON.stringify(b); } catch {}
    return false;
  }

  function redirectAfterAuth() {
    const next = defaultReturnUrl();
    const nextState = tryResolveInternalState(next);
    if (nextState?.action) {
      try {
        const stack = Array.isArray(window.userHistoryStack) ? window.userHistoryStack : [];
        const index = Number.isInteger(window.currentIndex) ? window.currentIndex : -1;
        const previousState = index > 0 ? stack[index - 1] : null;
        if (sameRouteState(previousState, nextState) && window.history.length > 1) {
          window.history.back();
          return;
        }
      } catch {}
      try {
        window.navigate?.(nextState.action, nextState.data || [], { replaceCurrent: true });
        return;
      } catch {}
    }
    try { window.location.assign(next || '/'); } catch { window.location.href = next || '/'; }
  }

  function initialsOf(value) {
    const parts = String(value || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2);
    const initials = parts.map((part) => String(part || '').charAt(0).toUpperCase()).join('');
    return initials || 'SS';
  }

  function iconMarkup(name) {
    const icons = {
      access: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3.5 5.5 6v5.2c0 4.1 2.4 7.8 6.5 9.3 4.1-1.5 6.5-5.2 6.5-9.3V6L12 3.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9.5 12h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M12 9.5v5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
      review: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3.5 5.5 6v5.2c0 4.1 2.4 7.8 6.5 9.3 4.1-1.5 6.5-5.2 6.5-9.3V6L12 3.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="m12 8.5 1.1 2.3 2.5.3-1.8 1.8.5 2.6-2.3-1.2-2.3 1.2.5-2.6-1.8-1.8 2.5-.3L12 8.5Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>',
      profile: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 12a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" stroke="currentColor" stroke-width="1.8"/><path d="M4.75 19.25c1.7-3.1 4.1-4.65 7.25-4.65s5.55 1.55 7.25 4.65" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
      checkout: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 7.5h10.5l-1.3 9H7.8L7 7.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 7.5V6a3 3 0 1 1 6 0v1.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
      timing: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 8v4l2.5 2.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M12 21a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17Z" stroke="currentColor" stroke-width="1.8"/><path d="M9.5 2.8h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
      login: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" stroke-width="1.8"/><path d="M5 19c1.5-2.7 3.8-4 7-4s5.5 1.3 7 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
      register: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M10 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" stroke-width="1.8"/><path d="M3.5 19c1.4-2.7 3.5-4 6.5-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M17.5 8v6M14.5 11h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
      email: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4.5 6.5h15a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 16V8a1.5 1.5 0 0 1 1.5-1.5Z" stroke="currentColor" stroke-width="1.8"/><path d="m4.5 8 7.5 6 7.5-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      password: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="5.5" y="10" width="13" height="10" rx="2.5" stroke="currentColor" stroke-width="1.8"/><path d="M8.5 10V8a3.5 3.5 0 1 1 7 0v2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
      secure: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3.5 5.5 6v5.2c0 4.1 2.4 7.8 6.5 9.3 4.1-1.5 6.5-5.2 6.5-9.3V6L12 3.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M10 11.8 11.4 13 14.5 9.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      linked: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M10 14 8.2 15.8a3 3 0 0 1-4.2-4.2L6.8 8.8A3 3 0 0 1 11 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M14 10 15.8 8.2a3 3 0 1 1 4.2 4.2l-2.8 2.8A3 3 0 0 1 13 16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M9.5 14.5 14.5 9.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
      quick: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m13 3-7 10h5l-1 8 8-11h-5l0-7Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>'
    };
    return `<span class="ss-auth-icon ss-auth-icon--${esc(name)}" aria-hidden="true">${icons[name] || icons.secure}</span>`;
  }

  function benefitItems() {
    return [
      {
        icon: 'review',
        title: 'Verified review access',
        body: 'Use the same email you checked out with so product reviews stay tied to real orders.',
      },
      {
        icon: 'profile',
        title: 'Your own profile',
        body: 'Add your name and optional profile photo once, then reuse them anywhere reviews appear.',
      },
      {
        icon: 'checkout',
        title: 'Faster checkout',
        body: 'Your details are saved and ready for order-linked tools and future purchases.',
      },
    ];
  }

  function benefitMarkup() {
    return benefitItems().map((item) => `
      <article class="ss-auth-benefit">
        <div class="ss-auth-benefit-icon">${iconMarkup(item.icon)}</div>
        <div class="ss-auth-benefit-copy">
          <strong>${item.title}</strong>
          <span>${item.body}</span>
        </div>
      </article>`).join('');
  }

  function trustItems() {
    return [
      { icon: 'secure', title: 'Secure & Protected', body: 'Your data is safe with us' },
      { icon: 'linked', title: 'Order-Linked', body: 'Reviews stay verified' },
      { icon: 'quick', title: 'Quick & Easy', body: 'Set up in seconds' }
    ];
  }

  function trustMarkup() {
    return trustItems().map((item) => `
      <article class="ss-auth-trust-item">
        <div class="ss-auth-trust-icon">${iconMarkup(item.icon)}</div>
        <div class="ss-auth-trust-copy">
          <strong>${item.title}</strong>
          <span>${item.body}</span>
        </div>
      </article>`).join('');
  }

  function copyFor(mode) {
    if (mode === 'register') {
      return {
        heroKicker: 'Order-linked access',
        heroTitle: 'Create your account',
        heroSubtitle: 'Register to continue',
        heroBody: 'Use the same email you ordered with so verified reviews stay matched to your real purchases.',
        panelTitle: '',
        panelBody: '',
        submitLabel: 'Create account',
        switchCopy: 'Already registered?',
        switchLabel: 'Login instead',
      };
    }
    return {
      heroKicker: 'Order-linked access',
      heroTitle: 'Welcome back!',
      heroSubtitle: 'Log in to continue',
      heroBody: 'We’ll take you straight back to the storefront or your review flow.',
      panelTitle: '',
      panelBody: '',
      submitLabel: 'Log in',
      switchCopy: 'New here?',
      switchLabel: 'Create an account',
    };
  }

  function modeSwitchMarkup(isRegister) {
    return `
      <div class="ss-auth-mode-switch" role="tablist" aria-label="Account mode">
        <button class="ss-auth-mode-btn ${!isRegister ? 'is-active' : ''}" id="ssAuthModeLogin" type="button" aria-pressed="${!isRegister ? 'true' : 'false'}">${iconMarkup('login')}<span>Login</span></button>
        <button class="ss-auth-mode-btn ${isRegister ? 'is-active' : ''}" id="ssAuthModeRegister" type="button" aria-pressed="${isRegister ? 'true' : 'false'}">${iconMarkup('register')}<span>Register</span></button>
      </div>`;
  }

  function registerFieldsMarkup() {
    return `
      <div class="ss-auth-form-grid">
        <label class="ss-auth-field ss-auth-field--half">
          <span>Name</span>
          <div class="ss-auth-input-shell">
            ${iconMarkup('profile')}
            <input id="ssAuthName" maxlength="80" placeholder="Your display name" required type="text"/>
          </div>
        </label>
        <label class="ss-auth-field ss-auth-field--half">
          <span>Email</span>
          <div class="ss-auth-input-shell">
            ${iconMarkup('email')}
            <input id="ssAuthEmail" autocomplete="email" placeholder="you@example.com" required type="email"/>
          </div>
        </label>
      </div>
      <div class="ss-auth-register-preview">
        <div class="ss-auth-avatar-preview" id="ssAuthAvatarPreview" data-has-image="no" aria-hidden="true">
          <img id="ssAuthAvatarImage" alt="" hidden />
          <span class="ss-auth-avatar-fallback" id="ssAuthAvatarFallback">SS</span>
        </div>
        <label class="ss-auth-field ss-auth-field--file">
          <span>Profile picture (optional)</span>
          <input id="ssAuthProfileImage" accept="image/*" type="file"/>
          <small>This shows next to the reviews you leave later.</small>
        </label>
      </div>`;
  }

  function loginFieldsMarkup() {
    return `
      <label class="ss-auth-field">
        <span>Email</span>
        <div class="ss-auth-input-shell">
          ${iconMarkup('email')}
          <input id="ssAuthEmail" autocomplete="email" placeholder="you@example.com" required type="email"/>
        </div>
      </label>`;
  }

  function attachRegisterPreview() {
    const nameInput = document.getElementById('ssAuthName');
    const fileInput = document.getElementById('ssAuthProfileImage');
    const preview = document.getElementById('ssAuthAvatarPreview');
    const image = document.getElementById('ssAuthAvatarImage');
    const fallback = document.getElementById('ssAuthAvatarFallback');
    if (!nameInput || !fileInput || !preview || !image || !fallback) return;

    let currentObjectUrl = '';

    function clearPreviewUrl() {
      if (!currentObjectUrl) return;
      try { URL.revokeObjectURL(currentObjectUrl); } catch {}
      currentObjectUrl = '';
    }

    function renderPreview() {
      fallback.textContent = initialsOf(nameInput.value);
      clearPreviewUrl();
      const file = fileInput.files?.[0] || null;
      if (file) {
        try {
          currentObjectUrl = URL.createObjectURL(file);
          image.src = currentObjectUrl;
          image.hidden = false;
          fallback.hidden = true;
          preview.dataset.hasImage = 'yes';
          return;
        } catch {}
      }
      image.hidden = true;
      image.removeAttribute('src');
      fallback.hidden = false;
      preview.dataset.hasImage = 'no';
    }

    nameInput.addEventListener('input', renderPreview);
    fileInput.addEventListener('change', renderPreview);
    renderPreview();

    window.addEventListener('beforeunload', clearPreviewUrl, { once: true });
  }

  function render(mode) {
    const node = viewer();
    if (!node) return;
    clearSort();
    const isRegister = mode === 'register';
    const copy = copyFor(mode);
    node.innerHTML = `
      <div class="ss-auth-page">
        <div class="ss-auth-card ss-auth-card--${isRegister ? 'register' : 'login'}">
          <section class="ss-auth-hero">
            <div class="ss-auth-badge">
              ${iconMarkup('access')}
              <span>${copy.heroKicker}</span>
            </div>
            <div class="ss-auth-copy">
              <h2>${copy.heroTitle}</h2>
              <div class="ss-auth-subtitle">${copy.heroSubtitle}</div>
              <p>${copy.heroBody}</p>
            </div>
            <div class="ss-auth-benefits">${benefitMarkup()}</div>
            <div class="ss-auth-note-card">
              <div class="ss-auth-note-icon">${iconMarkup('timing')}</div>
              <div class="ss-auth-note-copy">
                <div class="ss-auth-note-label">Review timing</div>
                <div class="ss-auth-note-text">Verified product reviews unlock after the current waiting period on eligible orders. Right now that window is 5 days.</div>
              </div>
            </div>
          </section>
          <section class="ss-auth-panel">
            <div class="ss-auth-panel-shell">
              ${modeSwitchMarkup(isRegister)}
              ${copy.panelTitle || copy.panelBody ? `<div class="ss-auth-panel-head">
                <h3>${copy.panelTitle}</h3>
                <p>${copy.panelBody}</p>
              </div>` : ''}
              <form class="ss-auth-form" id="ssAuthForm">
                ${isRegister ? registerFieldsMarkup() : loginFieldsMarkup()}
                <label class="ss-auth-field">
                  <span>Password</span>
                  <div class="ss-auth-input-shell ss-auth-input-shell--password">
                    ${iconMarkup('password')}
                    <input id="ssAuthPassword" autocomplete="${isRegister ? 'new-password' : 'current-password'}" minlength="8" placeholder="${isRegister ? 'At least 8 characters' : 'Your password'}" required type="password"/>
                  </div>
                </label>
                <div class="ss-auth-inline-note">Use the same email as your order history so review eligibility works automatically.</div>
                <div class="ss-auth-actions">
                  <button class="ss-review-btn ss-review-btn-primary ss-auth-submit" id="ssAuthSubmit" type="submit">${copy.submitLabel}</button>
                </div>
                <div class="ss-auth-divider"><span>${copy.switchCopy}</span></div>
                <div class="ss-auth-footer-row">
                  <button class="ss-auth-link-btn" id="ssAuthSwitch" type="button">${copy.switchLabel}</button>
                </div>
                <div class="ss-auth-trust-row">${trustMarkup()}</div>
                <div class="ss-auth-status" id="ssAuthStatus" aria-live="polite"></div>
              </form>
            </div>
          </section>
        </div>
      </div>`;

    const form = document.getElementById('ssAuthForm');
    const status = document.getElementById('ssAuthStatus');
    const switchBtn = document.getElementById('ssAuthSwitch');
    const loginModeBtn = document.getElementById('ssAuthModeLogin');
    const registerModeBtn = document.getElementById('ssAuthModeRegister');
    const submitBtn = document.getElementById('ssAuthSubmit');

    if (isRegister) attachRegisterPreview();

    switchBtn?.addEventListener('click', () => {
      try { window.navigate?.(isRegister ? 'GoToLogin' : 'GoToRegister', []); } catch {}
    });

    loginModeBtn?.addEventListener('click', () => {
      if (!isRegister) return;
      try { window.navigate?.('GoToLogin', []); } catch {}
    });

    registerModeBtn?.addEventListener('click', () => {
      if (isRegister) return;
      try { window.navigate?.('GoToRegister', []); } catch {}
    });

    form?.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (submitBtn) submitBtn.disabled = true;
      status.textContent = isRegister ? 'Creating account...' : 'Logging in...';
      status.dataset.tone = 'neutral';
      try {
        if (isRegister) {
          await auth()?.register?.({
            name: String(document.getElementById('ssAuthName')?.value || '').trim(),
            email: String(document.getElementById('ssAuthEmail')?.value || '').trim(),
            password: String(document.getElementById('ssAuthPassword')?.value || ''),
            profileImageFile: document.getElementById('ssAuthProfileImage')?.files?.[0] || null,
          });
        } else {
          await auth()?.login?.({
            email: String(document.getElementById('ssAuthEmail')?.value || '').trim(),
            password: String(document.getElementById('ssAuthPassword')?.value || ''),
          });
        }
        status.textContent = isRegister ? 'Account created. Redirecting...' : 'Logged in. Redirecting...';
        status.dataset.tone = 'success';
        window.setTimeout(redirectAfterAuth, 120);
      } catch (error) {
        status.textContent = esc(String(error?.message || 'Authentication failed'));
        status.dataset.tone = 'error';
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  function mountLogin() {
    render('login');
    return function cleanupAuthLogin() {};
  }

  function mountRegister() {
    render('register');
    return function cleanupAuthRegister() {};
  }

  getScreens()?.register?.('auth-login', mountLogin);
  getScreens()?.register?.('auth-register', mountRegister);
  getRouter()?.registerAction?.('GoToLogin', function goToLoginRoute(state) {
    return getScreens()?.show?.('auth-login', state);
  });
  getRouter()?.registerAction?.('GoToRegister', function goToRegisterRoute(state) {
    return getScreens()?.show?.('auth-register', state);
  });
})(window, document);
