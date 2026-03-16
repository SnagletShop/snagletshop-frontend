'use strict';

function buildRequestId() {
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

function getRequestIp(req) {
  return String(req?.headers?.['cf-connecting-ip'] || req?.headers?.['x-forwarded-for'] || req?.ip || '')
    .split(',')[0]
    .trim();
}

function getTurnstileToken(req) {
  return (
    (req?.body && (req.body.turnstileToken || req.body.turnstile)) ||
    (req?.get && req.get('cf-turnstile-response')) ||
    (req?.get && req.get('x-turnstile-token')) ||
    ''
  );
}

function logCreatePaymentIntentRequest(req, reqId) {
  try {
    const b = (req && req.body) ? req.body : {};
    const items = Array.isArray(b.productsFull) && b.productsFull.length ? b.productsFull : (Array.isArray(b.products) ? b.products : []);
    const sample = items.slice(0, 3).map(it => ({
      id: it?.id ?? null,
      productId: it?.productId ?? null,
      pid: it?.pid ?? null,
      name: it?.name ?? null,
      productLink: it?.productLink ?? null,
      qty: it?.quantity ?? it?.qty ?? null,
      price: it?.price ?? null,
      unitPriceEUR: it?.unitPriceEUR ?? null,
      hasRecoToken: !!it?.recoDiscountToken,
      recoPct: it?.recoDiscountPct ?? null
    }));
    console.error('[PI][REQ]', {
      reqId,
      ip: getRequestIp(req),
      origin: String(req?.headers?.origin || ''),
      referer: String(req?.headers?.referer || ''),
      ua: String(req?.headers?.['user-agent'] || ''),
      currency: b.currency || null,
      country: b.country || null,
      expectedClientTotal: b.expectedClientTotal ?? null,
      clientAmountCents: b.clientAmountCents ?? null,
      fxFetchedAt: b.fxFetchedAt ?? null,
      applyTariff: b.applyTariff ?? null,
      checkoutId: b.checkoutId ?? null,
      itemsCount: items.length,
      hasRecoToken: sample.some(x => x.hasRecoToken),
      sampleItems: sample
    });
  } catch (e) {
    console.error('[PI][REQ][LOG_FAIL]', { reqId, msg: String(e && e.message || e) });
  }
}

function assertOriginAllowed(req, originIsAllowed) {
  if (!originIsAllowed(req)) {
    const err = new Error('FORBIDDEN');
    err.status = 403;
    err.code = 'FORBIDDEN';
    throw err;
  }
}

async function assertFraudAndTurnstile(req, { fraudCheck, verifyTurnstile }) {
  const fraud = await fraudCheck(req, 'pi');
  if (!fraud.ok) {
    const err = new Error(fraud.code || 'FRAUD_VELOCITY');
    err.status = 429;
    err.code = fraud.code || 'FRAUD_VELOCITY';
    throw err;
  }

  const ts = await verifyTurnstile(String(getTurnstileToken(req) || ''), getRequestIp(req));
  if (!ts.ok) {
    const err = new Error('TURNSTILE_FAILED');
    err.status = 403;
    err.code = 'TURNSTILE_FAILED';
    err.details = ts.reason;
    throw err;
  }
}

function parsePaymentIntentPayload(req, { PaymentIntentBodySchema, zodBadRequest }, res) {
  const parsedBody = PaymentIntentBodySchema.safeParse((req && req.body) || {});
  if (!parsedBody.success) {
    zodBadRequest(res, parsedBody, 'Invalid payment intent payload');
    return null;
  }
  return parsedBody;
}

module.exports = {
  buildRequestId,
  getRequestIp,
  getTurnstileToken,
  logCreatePaymentIntentRequest,
  assertOriginAllowed,
  assertFraudAndTurnstile,
  parsePaymentIntentPayload,
};
