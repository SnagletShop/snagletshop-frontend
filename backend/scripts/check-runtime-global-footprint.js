'use strict';

const fs = require('fs');
const path = require('path');

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.isFile() && full.endsWith('.js')) files.push(full);
  }
  return files;
}

const root = path.join(process.cwd(), 'src', 'lib');
const files = walk(root).filter((file) => file.endsWith('State.js'));
const report = files.map((file) => {
  const text = fs.readFileSync(file, 'utf8');
  const count = (text.match(/global\./g) || []).length;
  return { file: path.relative(process.cwd(), file), count };
}).sort((a, b) => b.count - a.count);

const total = report.reduce((sum, item) => sum + item.count, 0);
console.log(`[runtime-global-footprint] state files: ${report.length}, direct global refs: ${total}`);
for (const item of report.slice(0, 12)) {
  console.log(` - ${item.count.toString().padStart(3, ' ')} ${item.file}`);
}

if (total !== 0) {
  console.error(`[runtime-global-footprint] expected 0 direct global refs in state files, got ${total}`);
  process.exit(1);
}
