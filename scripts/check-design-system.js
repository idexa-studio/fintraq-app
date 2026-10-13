#!/usr/bin/env node
/**
 * Design-system compliance audit. Flags feature/app code that bypasses the
 * system in docs/DESIGN_SYSTEM.md. Design-system internals (design/) are exempt: they are where raw values are allowed to live.
 *
 *   node scripts/check-design-system.js           # summary + every violation
 *   node scripts/check-design-system.js --summary # counts per rule and file
 *
 * Exits 1 when any violation exists, so it can gate CI.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SCAN = ['app', 'design', 'features', 'data', 'platform', 'shared'];
const EXEMPT = [
  'design/', // the new design system: the one place raw values live
  'shared/i18n/',
  'shared/contracts/', // the colours offered to users and seeded on first run: data, not UI
];

const RULES = [
  { id: 'hex-color', msg: 'Hex/rgb colour literal — use theme colours or alpha()', re: /(['"`])#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\1|rgba?\(/ },
  { id: 'raw-font', msg: 'Raw fontSize/lineHeight — use <Text variant> or typography.metrics', re: /\b(fontSize|lineHeight)\s*:\s*\d/ },
  { id: 'raw-font-family', msg: 'Hard-coded fontFamily string — use typography.fonts', re: /fontFamily\s*:\s*['"]/ },
  { id: 'raw-radius', msg: 'Raw borderRadius number — use radius() tokens', re: /borderRadius\s*:\s*\d/ },
  { id: 'shadow', msg: 'Shadow/elevation — the design system is flat', re: /\b(shadowColor|shadowOpacity|shadowRadius|shadowOffset|elevation\s*:|boxShadow|\.\.\.shadow\()/ },
  { id: 'icon-lib', msg: 'Icon pack used directly — map the name in design/icons/icon-map.json (legacy: src/components/ui/icon-registry.ts) and render <Icon name="…" />', re: /\bHugeiconsIcon\b|from '@hugeicons\// },
  { id: 'rn-primitive', msg: 'Off-system primitive — use ui Switch / BentoPressable / Button', re: /\b(TouchableOpacity|TouchableHighlight)\b|import \{[^}]*\bSwitch\b[^}]*\} from 'react-native'/ },
  { id: 'spinner', msg: 'ActivityIndicator — use Skeleton for loading, Button isLoading for actions', re: /\bActivityIndicator\b/ },
  { id: 'opacity-text', msg: 'Opacity-faded style — use tone="muted" / alpha() instead', re: /^\s*opacity\s*:\s*0\.[1-8]\d*\s*,?\s*$/ },
  { id: 'lime-text', msg: 'colors.primary as text/icon colour (~2:1 on light layers) — use colors.primaryInk, or primaryForeground on a primary fill', re: /(?<![A-Za-z])color(?:\s*:\s*|=\{)[^,}]*\bcolors\.primary(?![A-Za-z])/ },
  { id: 'relative-import', msg: "'../' import — use the @/ alias", re: /from '\.\.\// },
  // Component-level rules: screens are built from the system, not rebuilt by hand.
  { id: 'screen-scaffold', msg: 'Hand-rolled SafeAreaView scaffold — use <Screen>', re: /<SafeAreaView\b/ },
  { id: 'rn-text', msg: "RN Text with manual styles — use <Text variant> from components/ui", re: /import \{[^}]*\bText\b[^}]*\} from 'react-native'/ },
  { id: 'custom-button', msg: 'Hand-built button — use <Button> / <IconButton>', re: /style=\{[^}]*styles\.\w*(Btn|Button|Cta|cta)\b/ },
];

const files = [];
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(tsx?|jsx?)$/.test(e.name)) files.push(path.relative(ROOT, p));
  }
};
// Folders of the rebooted tree appear as they are first needed.
SCAN.map((d) => path.join(ROOT, d)).filter((d) => fs.existsSync(d)).forEach(walk);

const hits = [];
for (const file of files) {
  if (EXEMPT.some((x) => file.startsWith(x))) continue;
  const lines = fs.readFileSync(path.join(ROOT, file), 'utf8').split('\n');
  // Fold multi-line `import { … } from '…'` onto its first line so import rules see the whole statement.
  for (let i = 0; i < lines.length; i++) {
    if (!/^import \{[^}]*$/.test(lines[i])) continue;
    for (let j = i + 1; j < lines.length; j++) {
      const part = lines[j];
      lines[i] += ' ' + part.trim();
      lines[j] = '';
      if (/\}/.test(part)) break;
    }
  }
  // A feature is used from outside only through its index.ts (docs/ARCHITECTURE.md).
  const own = /^features\/([^/]+)\//.exec(file)?.[1];
  lines.forEach((line, i) => {
    const reach = /from '@\/features\/([^/']+)\/[^']+'/.exec(line);
    if (reach && reach[1] !== own) hits.push({ file, line: i + 1, rule: 'feature-internals', text: line.trim().slice(0, 110) });
  });
  lines.forEach((line, i) => {
    if (/design-system-ignore/.test(line) || /^\s*(\/\/|\*)/.test(line)) return;
    for (const r of RULES) if (r.re.test(line)) hits.push({ file, line: i + 1, rule: r.id, text: line.trim().slice(0, 110) });
  });
}

const byRule = {};
const byFile = {};
hits.forEach((h) => {
  byRule[h.rule] = (byRule[h.rule] || 0) + 1;
  byFile[h.file] = (byFile[h.file] || 0) + 1;
});

console.log(`Design-system audit: ${hits.length} violation(s) in ${Object.keys(byFile).length} file(s)\n`);
for (const r of [...RULES, { id: 'feature-internals', msg: "Reaching into another feature — import from its index ('@/features/<name>')" }]) if (byRule[r.id]) console.log(`  ${String(byRule[r.id]).padStart(4)}  ${r.id.padEnd(16)} ${r.msg}`);
console.log('');
if (process.argv.includes('--summary')) {
  Object.entries(byFile).sort((a, b) => b[1] - a[1]).forEach(([f, n]) => console.log(`  ${String(n).padStart(4)}  ${f}`));
} else {
  hits.forEach((h) => console.log(`${h.file}:${h.line}  [${h.rule}]  ${h.text}`));
}
process.exit(hits.length ? 1 : 0);
