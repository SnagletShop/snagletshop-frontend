(function (window) {
  'use strict';

  const TOKEN_KEY = 'ss_customer_token_v1';
  const ACCOUNT_KEY = 'ss_customer_account_v1';
  const REDIRECT_KEY = 'ss_customer_auth_redirect_v1';

  function api() {
    return window.__SS_API__ || null;
  }

  function storage() {
    try { return window.localStorage; } catch {}
    return null;
  }

  function safeGet(key) {
    try { return storage()?.getItem?.(key) || ''; } catch {}
    return '';
  }

  function safeSet(key, value) {
    try {
      if (value == null || value === '') storage()?.removeItem?.(key);
      else storage()?.setItem?.(key, String(value));
    } catch {}
  }

  function parseJson(text, fallback = null) {
    try { return JSON.parse(String(text || '')); } catch {}
    return fallback;
  }

  function getToken() {
    return String(safeGet(TOKEN_KEY) || '').trim();
  }

  function setToken(token) {
    const next = String(token || '').trim();
    safeSet(TOKEN_KEY, next);
    return next;
  }

  function getAccount() {
    return parseJson(safeGet(ACCOUNT_KEY), null);
  }

  function setAccount(account) {
    safeSet(ACCOUNT_KEY, account ? JSON.stringify(account) : '');
    try { window.dispatchEvent(new CustomEvent('ss:customer-auth-changed', { detail: { account: account || null } })); } catch {}
    return account || null;
  }

  function isLoggedIn() {
    return !!getToken() && !!getAccount();
  }

  function authHeaders(json = false) {
    const headers = {};
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    if (json) headers['Content-Type'] = 'application/json';
    return headers;
  }

  async function requestJson(path, options = {}) {
    return api()?.json?.(path, options);
  }

  async function request(path, options = {}) {
    return api()?.request?.(path, options);
  }

  function rememberRedirect(url) {
    const next = String(url || '').trim();
    if (!next) return '';
    safeSet(REDIRECT_KEY, next);
    return next;
  }

  function consumeRedirect() {
    const next = String(safeGet(REDIRECT_KEY) || '').trim();
    safeSet(REDIRECT_KEY, '');
    return next;
  }

  async function syncMe() {
    const token = getToken();
    if (!token) {
      setAccount(null);
      return null;
    }
    try {
      const data = await requestJson('/auth/me', { headers: authHeaders(false) });
      const account = data?.account || null;
      setAccount(account);
      return account;
    } catch (error) {
      clearSession();
      throw error;
    }
  }

  function clearSession() {
    setToken('');
    setAccount(null);
  }

  async function login(payload = {}) {
    const data = await requestJson('/auth/login', {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify({
        email: String(payload.email || '').trim(),
        password: String(payload.password || ''),
      }),
    });
    setToken(data?.token || '');
    setAccount(data?.account || null);
    return data;
  }

  async function register(payload = {}) {
    const form = new FormData();
    form.set('name', String(payload.name || '').trim());
    form.set('email', String(payload.email || '').trim());
    form.set('password', String(payload.password || ''));
    if (payload.profileImageFile) form.set('profileImage', payload.profileImageFile, payload.profileImageFile.name || 'profile.jpg');
    const response = await request('/auth/register', {
      method: 'POST',
      body: form,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data?.error || `Register failed (${response.status})`);
      Object.assign(error, data || {});
      throw error;
    }
    setToken(data?.token || '');
    setAccount(data?.account || null);
    return data;
  }

  async function logout() {
    try { await requestJson('/auth/logout', { method: 'POST', headers: authHeaders(false) }); } catch {}
    clearSession();
    return true;
  }

  async function updateProfile(payload = {}) {
    const form = new FormData();
    if (payload.name != null) form.set('name', String(payload.name || '').trim());
    if (payload.clearProfilePicture) form.set('clearProfilePicture', '1');
    if (payload.profileImageFile) form.set('profileImage', payload.profileImageFile, payload.profileImageFile.name || 'profile.jpg');
    const response = await request('/auth/profile', {
      method: 'PATCH',
      headers: authHeaders(false),
      body: form,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data?.error || `Profile update failed (${response.status})`);
      Object.assign(error, data || {});
      throw error;
    }
    setAccount(data?.account || null);
    return data;
  }

  const service = {
    getToken,
    getAccount,
    isLoggedIn,
    authHeaders,
    rememberRedirect,
    consumeRedirect,
    syncMe,
    login,
    register,
    logout,
    updateProfile,
    clearSession,
  };

  window.__SS_CUSTOMER_AUTH__ = service;
})(window);
