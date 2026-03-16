'use strict';

function canonicalizeProductLink(url) {
  if (!url) return '';
  try {
    const s = String(url).trim();
    if (!s) return '';
    const withScheme = /^https?:\/\//i.test(s) ? s : `https://${s}`;
    const u = new URL(withScheme);
    u.hash = '';
    const drop = new Set([
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'gclid', 'fbclid',
    ]);
    for (const k of [...u.searchParams.keys()]) {
      if (drop.has(k)) u.searchParams.delete(k);
    }
    return u.toString();
  } catch {
    return String(url).trim();
  }
}

module.exports = {
  canonicalizeProductLink,
};
