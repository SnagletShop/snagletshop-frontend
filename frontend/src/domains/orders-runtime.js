(function(){
  const api = {
    async fetchOrderStatus(ctx, { orderId, token } = {}){
      const oid = String(orderId || '').trim();
      const t = String(token || '').trim();
      if (!oid || !t) throw new Error('Missing orderId or token.');
      try { return await ctx.fetchOrderStatus({ orderId: oid, token: t }); }
      catch (err) {
        const data = err?.details || {};
        if (data && (data.error === 'TURNSTILE_FAILED' || data.error === 'TURNSTILE_REQUIRED' || String(data.message || '').toUpperCase().includes('TURNSTILE'))) {
          const configured = Boolean(ctx.getTurnstileSiteKey?.());
          const hint = configured ? 'Turnstile verification failed. Please refresh the page and try again.' : 'Bot protection (Turnstile) is not configured on this site. Set <meta name="turnstile-sitekey" content="YOUR_SITE_KEY"> in index.html (and ensure the backend TURNSTILE_SECRET_KEY matches).';
          alert(hint);
        }
        throw err;
      }
    },
    formatDateMaybe(v){
      try { if (!v) return ''; const d = new Date(v); if (Number.isNaN(d.getTime())) return String(v); return d.toLocaleString(); } catch { return String(v || ''); }
    },
    setPaymentPendingFlag(ctx, obj = {}){
      const { paymentIntentId = null, orderId = null, clientSecret = null, checkoutId = null, checkoutToken = null } = obj;
      if (!paymentIntentId && !clientSecret) return;
      try { localStorage.setItem(ctx.PAYMENT_PENDING_KEY, JSON.stringify({ ts: Date.now(), paymentIntentId: paymentIntentId ? String(paymentIntentId) : null, orderId: orderId ? String(orderId) : null, clientSecret: clientSecret ? String(clientSecret) : null, checkoutId: checkoutId ? String(checkoutId) : null, checkoutToken: checkoutToken ? String(checkoutToken) : null })); } catch {}
    },
    getPaymentPendingFlag(ctx){
      try {
        const raw = localStorage.getItem(ctx.PAYMENT_PENDING_KEY);
        if (!raw) return null;
        const obj = JSON.parse(raw);
        const paymentIntentId = obj?.paymentIntentId ? String(obj.paymentIntentId) : null;
        const clientSecret = obj?.clientSecret ? String(obj.clientSecret) : null;
        const orderId = obj?.orderId ? String(obj.orderId) : null;
        const ts = Number(obj?.ts || 0) || 0;
        if (!paymentIntentId && !clientSecret) return null;
        return { ts, paymentIntentId, clientSecret, orderId, checkoutId: obj?.checkoutId ? String(obj.checkoutId) : null, checkoutToken: obj?.checkoutToken ? String(obj.checkoutToken) : null };
      } catch { return null; }
    },
    clearPaymentPendingFlag(ctx){ try { localStorage.removeItem(ctx.PAYMENT_PENDING_KEY); } catch {} },
    async pollPendingPaymentUntilFinal(ctx, { paymentIntentId, clientSecret, timeoutMs = 120000, intervalMs = 2500 } = {}){
      const pending = api.getPaymentPendingFlag(ctx) || {};
      return ctx.pollPendingPaymentUntilFinal({ paymentIntentId, clientSecret: (clientSecret ? String(clientSecret) : null) || (pending.clientSecret ? String(pending.clientSecret) : null) || (window.latestClientSecret ? String(window.latestClientSecret) : null), timeoutMs, intervalMs });
    },
    async resolveOrderIdByPaymentIntent(ctx, { paymentIntentId, clientSecret, maxWaitMs = 60000, intervalMs = 1200 } = {}){
      const pending = api.getPaymentPendingFlag(ctx) || {};
      return ctx.resolveOrderIdByPaymentIntent({ paymentIntentId, clientSecret, checkoutId: pending.checkoutId || window.latestCheckoutId || null, checkoutToken: pending.checkoutToken || window.latestCheckoutPublicToken || null, maxWaitMs, intervalMs });
    },
    async checkAndHandlePendingPaymentOnLoad(ctx){
      const pending = api.getPaymentPendingFlag(ctx);
      if (!pending?.paymentIntentId) return;
      const MAX_AGE_MS = 15 * 60 * 1000;
      if (pending?.ts && (Date.now() - Number(pending.ts) > MAX_AGE_MS)) { api.clearPaymentPendingFlag(ctx); return; }
      const { status } = await api.pollPendingPaymentUntilFinal(ctx, { paymentIntentId: pending.paymentIntentId, clientSecret: pending.clientSecret });
      if (status === 'succeeded') {
        const checkoutToken = pending.checkoutToken || null;
        const resolvedOrderId = await api.resolveOrderIdByPaymentIntent(ctx, { paymentIntentId: pending.paymentIntentId, clientSecret: pending.clientSecret });
        if (resolvedOrderId && checkoutToken) {
          const statusUrl = `${window.location.origin}/?orderId=${encodeURIComponent(resolvedOrderId)}&token=${encodeURIComponent(checkoutToken)}`;
          window.latestOrderId = resolvedOrderId; window.latestOrderPublicToken = checkoutToken; window.latestOrderStatusUrl = statusUrl;
        }
        if (!resolvedOrderId) { alert("Payment succeeded, but your order is still being finalized. Please wait a moment and refresh this page if it doesn't update."); return; }
        api.clearPaymentPendingFlag(ctx); ctx.clearBasketCompletely?.(); try { ctx.clearCheckoutDraft?.(); } catch {} ctx.setPaymentSuccessFlag?.({ reloadOnOk: true }); window.location.replace(window.location.origin); return;
      }
      if (status === 'requires_payment_method' || status === 'canceled') { api.clearPaymentPendingFlag(ctx); alert('Payment did not complete. Your cart is still saved—please try again.'); return; }
      console.warn('Payment is still processing (or status check failed). Cart is unchanged. You can try again in a moment.');
    },
    getStripePublishableKeySafe(){
      const fromMeta = document.querySelector('meta[name="stripe-publishable-key"]')?.content?.trim() || '';
      const pk = (window.STRIPE_PUBLISHABLE_KEY || window.STRIPE_PUBLISHABLE || fromMeta || '').trim();
      if (!pk || pk === '__STRIPE_PUBLISHABLE_KEY__') throw new Error('Stripe publishable key is not configured. Set <meta name="stripe-publishable-key" content="pk_live_..."/> or define window.STRIPE_PUBLISHABLE_KEY before script.js.');
      const host = String(location.hostname || '').toLowerCase();
      const isLocal = (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local'));
      if (!isLocal && pk.startsWith('pk_test_')) throw new Error('Refusing to run checkout with a Stripe TEST publishable key on a non-localhost domain. Use a pk_live_... key.');
      return pk;
    },
    ensureStripeInstance(){
      if (!window.stripeInstance) {
        if (typeof Stripe !== 'function') throw new Error('Stripe.js not loaded');
        window.stripeInstance = Stripe(api.getStripePublishableKeySafe());
      }
      return window.stripeInstance;
    },
    stripStripeReturnParamsFromUrl(urlObj){
      urlObj.searchParams.delete('redirect_status');
      urlObj.searchParams.delete('payment_intent');
      urlObj.searchParams.delete('payment_intent_client_secret');
      urlObj.searchParams.delete('stripe_return');
      urlObj.searchParams.delete('payment_success');
    }
  };
  window.__SS_ORDERS_RUNTIME__ = api;
})();
