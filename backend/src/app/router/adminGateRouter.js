'use strict';

const { getAdminGateState } = require('../../lib/middlewareState');

function mountAdminGate(app) {
  if (!app || typeof app.use !== 'function') return app;
  app.use('/admin', (req, res, next) => {
    try {
      const { adminLimiter } = getAdminGateState();
      return adminLimiter(req, res, next);
    } catch (err) {
      return next(err);
    }
  });
  return app;
}

module.exports = { mountAdminGate };
