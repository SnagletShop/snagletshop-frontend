'use strict';

let loaded = false;

function loadEnv() {
  if (loaded) return;
  require('dotenv').config();
  loaded = true;
}

module.exports = { loadEnv };
