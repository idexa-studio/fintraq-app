/**
 * Prints the English copy as numbered lines, "n<TAB>namespace:key.path<TAB>text", in a fixed
 * order: the source a translation is written against. Run: node scripts/i18n/flatten.js
 */
require('sucrase/register/ts');
const fs = require('fs');
const path = require('path');

const COPY = path.join(__dirname, '..', '..', 'shared', 'i18n', 'copy');

function flatten(value, prefix, out) {
  if (typeof value === 'string') out.push([prefix, value]);
  else for (const key of Object.keys(value)) flatten(value[key], prefix ? `${prefix}.${key}` : key, out);
  return out;
}

function english() {
  const lines = [];
  for (const file of fs.readdirSync(COPY).filter((name) => name.endsWith('.en.ts')).sort()) {
    const ns = file.replace('.en.ts', '');
    for (const [key, text] of flatten(require(path.join(COPY, file)).default, '', [])) lines.push([`${ns}:${key}`, text]);
  }
  return lines;
}

module.exports = { english };

if (require.main === module) english().forEach(([key, text], i) => console.log(`${i + 1}\t${key}\t${text.replace(/\n/g, '\\n')}`));
