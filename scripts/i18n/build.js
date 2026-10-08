/**
 * Translations are written against the unique English strings, numbered (see `--source`), and
 * built into one file per language keyed like the English copy.
 *
 *   node scripts/i18n/build.js --source > source.tsv          the strings to translate: "n<TAB>English"
 *   node scripts/i18n/build.js hi part1.tsv part2.tsv …       "n<TAB>translation" lines -> shared/i18n/copy/hi.json
 *                                                             "@namespace:key.path<TAB>translation" overrides one
 *                                                             place where the same English means something else
 *   node scripts/i18n/build.js --check                        what each language is missing or has left over
 *
 * A translation is refused if it drops or invents a {{placeholder}}, so a sentence can never lose
 * its amount or its name.
 */
const fs = require('fs');
const path = require('path');
const { english } = require('./flatten');

const COPY = path.join(__dirname, '..', '..', 'shared', 'i18n', 'copy');
const LANGUAGES = ['hi', 'bn', 'ta', 'te', 'mr', 'kn', 'id', 'es', 'pt', 'fr', 'de', 'ja'];
/** Languages whose plural rules have a "many" form (used for millions); it reads as the "other" form. */
const HAS_MANY = ['es', 'pt', 'fr'];

const lines = english();
const unique = [...new Set(lines.map(([, text]) => text))];
const holes = (text) => (text.match(/\{\{\s*\w+\s*\}\}/g) || []).map((hole) => hole.replace(/\s/g, '')).sort().join(',');

function setDeep(target, dotted, value) {
  const keys = dotted.split('.');
  let node = target;
  for (const key of keys.slice(0, -1)) node = node[key] = node[key] || {};
  node[keys.at(-1)] = value;
}

function check() {
  let bad = 0;
  for (const language of LANGUAGES) {
    const file = path.join(COPY, `${language}.json`);
    if (!fs.existsSync(file)) { console.log(`${language}: not translated`); bad += 1; continue; }
    const have = JSON.parse(fs.readFileSync(file, 'utf8'));
    const missing = lines.filter(([key]) => {
      const [ns, dotted] = key.split(':');
      return dotted.split('.').reduce((node, part) => (node == null ? node : node[part]), have[ns]) === undefined;
    });
    console.log(`${language}: ${missing.length ? `${missing.length} missing, e.g. ${missing.slice(0, 3).map(([key]) => key).join(', ')}` : 'complete'}`);
    if (missing.length) bad += 1;
  }
  process.exit(bad ? 1 : 0);
}

function build(language, files) {
  const translated = new Map();
  const overrides = new Map();
  for (const file of files) {
    for (const row of fs.readFileSync(file, 'utf8').split('\n')) {
      const match = /^(\d+)\t(.*)$/.exec(row);
      if (match) translated.set(Number(match[1]), match[2].replace(/\\n/g, '\n'));
      const override = /^@(\S+)\t(.*)$/.exec(row);
      if (override) overrides.set(override[1], override[2]);
    }
  }
  const known = new Set(lines.map(([key]) => key));
  for (const key of overrides.keys()) if (!known.has(key)) { console.error(`override for a key that does not exist: ${key}`); process.exit(1); }
  const problems = [];
  unique.forEach((text, i) => {
    const mine = translated.get(i + 1);
    if (mine === undefined || mine.trim() === '') problems.push(`${i + 1} missing: ${text}`);
    else if (holes(mine) !== holes(text)) problems.push(`${i + 1} placeholders differ: "${text}" -> "${mine}"`);
  });
  if (problems.length) { console.error(problems.slice(0, 40).join('\n')); console.error(`${problems.length} problem(s); nothing written`); process.exit(1); }

  const out = {};
  for (const [key, text] of lines) {
    const [ns, dotted] = key.split(':');
    const mine = overrides.get(key) ?? translated.get(unique.indexOf(text) + 1);
    out[ns] = out[ns] || {};
    setDeep(out[ns], dotted, mine);
    if (HAS_MANY.includes(language) && dotted.endsWith('_other')) setDeep(out[ns], dotted.replace(/_other$/, '_many'), mine);
  }
  fs.writeFileSync(path.join(COPY, `${language}.json`), `${JSON.stringify(out, null, 2)}\n`);
  console.log(`${language}: ${unique.length} strings -> shared/i18n/copy/${language}.json`);
}

const [first, ...rest] = process.argv.slice(2);
if (first === '--source') unique.forEach((text, i) => console.log(`${i + 1}\t${text.replace(/\n/g, '\\n')}`));
else if (first === '--check') check();
else if (LANGUAGES.includes(first) && rest.length) build(first, rest);
else { console.error('usage: build.js --source | --check | <language> <file.tsv>…'); process.exit(2); }
