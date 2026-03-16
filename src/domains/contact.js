(function (window) {
  async function sendMessage(payload = {}) {
    return window.__SS_API__.json('/send-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {})
    });
  }
  window.__SS_CONTACT__ = { sendMessage };
})(window);
