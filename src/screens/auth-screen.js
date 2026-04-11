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

  function redirectAfterAuth() {
    const next = defaultReturnUrl();
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

  function benefitItems() {
    return [
      {
        index: '01',
        title: 'Verified review access',
        body: 'Use the same email you checked out with so product reviews stay tied to real orders.',
      },
      {
        index: '02',
        title: 'Your own profile',
        body: 'Add your name and optional profile photo once, then reuse them anywhere reviews appear.',
      },
      {
        index: '03',
        title: 'Cleaner future checkout',
        body: 'Your account stays ready for order-linked tools and anything we add next.',
      },
    ];
  }

  function benefitMarkup() {
    return benefitItems().map((item) => `
      <article class="ss-auth-benefit">
        <div class="ss-auth-benefit-index" aria-hidden="true">${item.index}</div>
        <div class="ss-auth-benefit-copy">
          <strong>${item.title}</strong>
          <span>${item.body}</span>
        </div>
      </article>`).join('');
  }

  function copyFor(mode) {
    if (mode === 'register') {
      return {
        heroKicker: 'Customer account',
        heroTitle: 'Create one account that matches your real orders.',
        heroBody: 'That keeps review access clean, order-linked, and ready for the products you actually bought.',
        panelTitle: 'Set up your SnagletShop profile',
        panelBody: 'Use the same email you ordered with. That is what unlocks verified product reviews.',
        submitLabel: 'Create account',
        switchCopy: 'Already registered?',
        switchLabel: 'Login instead',
      };
    }
    return {
      heroKicker: 'Customer account',
      heroTitle: 'Welcome back to your order-linked profile.',
      heroBody: 'Log in with the email attached to your orders so your verified reviews and account details stay in sync.',
      panelTitle: 'Login to continue',
      panelBody: 'We will send you straight back to the storefront or review flow you came from.',
      submitLabel: 'Login',
      switchCopy: 'New here?',
      switchLabel: 'Create an account',
    };
  }

  function modeSwitchMarkup(isRegister) {
    return `
      <div class="ss-auth-mode-switch" role="tablist" aria-label="Account mode">
        <button class="ss-auth-mode-btn ${!isRegister ? 'is-active' : ''}" id="ssAuthModeLogin" type="button" aria-pressed="${!isRegister ? 'true' : 'false'}">Login</button>
        <button class="ss-auth-mode-btn ${isRegister ? 'is-active' : ''}" id="ssAuthModeRegister" type="button" aria-pressed="${isRegister ? 'true' : 'false'}">Register</button>
      </div>`;
  }

  function registerFieldsMarkup() {
    return `
      <div class="ss-auth-form-grid">
        <label class="ss-auth-field ss-auth-field--half">
          <span>Name</span>
          <input id="ssAuthName" maxlength="80" placeholder="Your display name" required type="text"/>
        </label>
        <label class="ss-auth-field ss-auth-field--half">
          <span>Email</span>
          <input id="ssAuthEmail" autocomplete="email" placeholder="you@example.com" required type="email"/>
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
        <input id="ssAuthEmail" autocomplete="email" placeholder="you@example.com" required type="email"/>
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
            <div class="ss-auth-brand">
              <div class="ss-auth-brand-wordmark">SnagletShop</div>
              <div class="ss-auth-brand-caption">Order-linked access</div>
            </div>
            <div class="ss-auth-copy">
              <div class="ss-auth-kicker">${copy.heroKicker}</div>
              <h2>${copy.heroTitle}</h2>
              <p>${copy.heroBody}</p>
            </div>
            <div class="ss-auth-benefits">${benefitMarkup()}</div>
            <div class="ss-auth-note-card">
              <div class="ss-auth-note-label">Review timing</div>
              <div class="ss-auth-note-text">Verified product reviews unlock after the current waiting period on eligible orders. Right now that window is 5 days.</div>
            </div>
          </section>
          <section class="ss-auth-panel">
            ${modeSwitchMarkup(isRegister)}
            <div class="ss-auth-panel-head">
              <h3>${copy.panelTitle}</h3>
              <p>${copy.panelBody}</p>
            </div>
            <form class="ss-auth-form" id="ssAuthForm">
              ${isRegister ? registerFieldsMarkup() : loginFieldsMarkup()}
              <label class="ss-auth-field">
                <span>Password</span>
                <input id="ssAuthPassword" autocomplete="${isRegister ? 'new-password' : 'current-password'}" minlength="8" placeholder="${isRegister ? 'At least 8 characters' : 'Your password'}" required type="password"/>
              </label>
              <div class="ss-auth-inline-note">Use the same email as your order history so review eligibility works automatically.</div>
              <div class="ss-auth-actions">
                <button class="ss-review-btn ss-review-btn-primary ss-auth-submit" id="ssAuthSubmit" type="submit">${copy.submitLabel}</button>
              </div>
              <div class="ss-auth-footer-row">
                <span class="ss-auth-footer-copy">${copy.switchCopy}</span>
                <button class="ss-auth-link-btn" id="ssAuthSwitch" type="button">${copy.switchLabel}</button>
              </div>
              <div class="ss-auth-status" id="ssAuthStatus" aria-live="polite"></div>
            </form>
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
