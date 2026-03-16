'use strict';

const fs = require('fs');
const { getCatalogFileModeState, setCatalogFileModeState } = require('./catalogFileModeState');

function getCatalogFileMode() {
  return getCatalogFileModeState().mode;
}

function setCatalogFileMode(mode) {
  const m = String(mode || '').trim();
  if (m !== 'products_js' && m !== 'split_json') throw new Error('Invalid catalog file mode');
  setCatalogFileModeState(m);
  const splitDir = getCatalogSplitDir();
  const filemodePath = getCatalogFilemodePath();
  if (splitDir) {
    try { fs.mkdirSync(splitDir, { recursive: true }); } catch {}
  }
  if (filemodePath) {
    try {
      fs.writeFileSync(filemodePath, JSON.stringify({ mode: m, updatedAt: new Date().toISOString() }, null, 2), 'utf-8');
    } catch {}
  }
  return m;
}

function getCatalogSplitDir() {
  return getCatalogFileModeState().splitDir;
}
function getCatalogSplitProductsFile() {
  return getCatalogFileModeState().splitProductsFile;
}
function getCatalogSplitCategoriesFile() {
  return getCatalogFileModeState().splitCategoriesFile;
}
function getCatalogFilemodePath() {
  return getCatalogFileModeState().filemodePath;
}

module.exports = {
  getCatalogFileMode,
  setCatalogFileMode,
  getCatalogSplitDir,
  getCatalogSplitProductsFile,
  getCatalogSplitCategoriesFile,
  getCatalogFilemodePath,
};
