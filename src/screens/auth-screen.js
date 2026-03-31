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

  function render(mode = 'login') {
    const node = viewer();
    if (!node) return;
    clearSort();
    const isRegister = mode === 'register';
    node.innerHTML = `
      <div class="ss-auth-page">
        <div class="ss-auth-card">
          <div class="ss-auth-copy">
            <div class="ss-auth-kicker">Account</div>
            <h2>${isRegister ? 'Create your account' : 'Welcome back'}</h2>
            <p>${isRegister ? 'Use the same email you ordered with so you can review the products you actually bought.' : 'Log in with the email attached to your orders to leave verified reviews and track your profile.'}</p>
          </div>
          <form class="ss-auth-form" id="ssAuthForm">
            ${isRegister ? `
              <label class="ss-auth-field">
                <span>Name</span>
                <input id="ssAuthName" maxlength="80" placeholder="Your display name" required type="text"/>
              </label>
            ` : ''}
            <label class="ss-auth-field">
              <span>Email</span>
              <input id="ssAuthEmail" autocomplete="email" placeholder="you@example.com" required type="email"/>
            </label>
            <label class="ss-auth-field">
              <span>Password</span>
              <input id="ssAuthPassword" autocomplete="${isRegister ? 'new-password' : 'current-password'}" minlength="8" placeholder="${isRegister ? 'At least 8 characters' : 'Your password'}" required type="password"/>
            </label>
            ${isRegister ? `
              <label class="ss-auth-field">
                <span>Profile picture (optional)</span>
                <input id="ssAuthProfileImage" accept="image/*" type="file"/>
              </label>
            ` : ''}
            <div class="ss-auth-actions">
              <button class="ss-review-btn ss-review-btn-primary" id="ssAuthSubmit" type="submit">${isRegister ? 'Create account' : 'Login'}</button>
              <button class="ss-review-btn" id="ssAuthSwitch" type="button">${isRegister ? 'Already have an account?' : 'Create an account'}</button>
            </div>
            <div class="ss-auth-status" id="ssAuthStatus" aria-live="polite"></div>
          </form>
        </div>
      </div>`;

    const form = document.getElementById('ssAuthForm');
    const status = document.getElementById('ssAuthStatus');
    const switchBtn = document.getElementById('ssAuthSwitch');

    switchBtn?.addEventListener('click', () => {
      try { window.navigate?.(isRegister ? 'GoToLogin' : 'GoToRegister', []); } catch {}
    });

    form?.addEventListener('submit', async (event) => {
      event.preventDefault();
      status.textContent = isRegister ? 'Creating account…' : 'Logging in…';
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
        status.textContent = isRegister ? 'Account created. Redirecting…' : 'Logged in. Redirecting…';
        status.dataset.tone = 'success';
        window.setTimeout(redirectAfterAuth, 120);
      } catch (error) {
        status.textContent = esc(String(error?.message || 'Authentication failed'));
        status.dataset.tone = 'error';
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
