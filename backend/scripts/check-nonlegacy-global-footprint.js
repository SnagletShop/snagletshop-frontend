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

const root = path.join(process.cwd(), 'src');
const files = walk(root).filter((file) => !file.includes(`${path.sep}domains${path.sep}legacy${path.sep}`));
const report = files.map((file) => {
  const text = fs.readFileSync(file, 'utf8');
  const count = (text.match(/\bglobal\./g) || []).length;
  return { file: path.relative(process.cwd(), file), count };
}).filter((item) => item.count > 0).sort((a, b) => b.count - a.count);

const total = report.reduce((sum, item) => sum + item.count, 0);
const threshold = 260;
console.log(`[nonlegacy-global-footprint] files with direct global refs: ${report.length}, total refs: ${total}, threshold: ${threshold}`);
for (const item of report.slice(0, 15)) {
  console.log(` - ${item.count.toString().padStart(3, ' ')} ${item.file}`);
}

if (total > threshold) {
  console.error(`[nonlegacy-global-footprint] expected <= ${threshold} direct global refs outside legacy domain, got ${total}`);
  process.exit(1);
}
