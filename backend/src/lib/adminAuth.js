'use strict';

function verifyAdminLogin(body, runtimeLike) {
  const username = body?.username;
  const password = body?.password;
  const adminCode = body?.adminCode;
  if (runtimeLike.ADMIN_CODE && adminCode !== runtimeLike.ADMIN_CODE) {
    const err = new Error('Bad admin code');
    err.status = 401;
    throw err;
  }
  if (username !== runtimeLike.ADMIN_USER || password !== runtimeLike.ADMIN_PASS) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }
  return { username: String(username || '') };
}

module.exports = { verifyAdminLogin };
