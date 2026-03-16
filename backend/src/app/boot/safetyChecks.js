'use strict';

function bootSafetyChecks() {
  if (!process.env.JWT_SECRET) {
    console.warn('[boot] JWT_SECRET is not set. Some auth flows may be insecure or fail.');
  }
  if (!process.env.MONGODB_URI && !process.env.MONGO_URI) {
    console.warn('[boot] MongoDB connection string is not set. Startup may fail when legacy code connects.');
  }
}

module.exports = { bootSafetyChecks };
