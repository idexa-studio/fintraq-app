#!/usr/bin/env node
/**
 * Recounts docs/PLAN.md and rewrites its progress table, so the table can
 * never disagree with the checkboxes.
 *
 *   node scripts/plan-progress.js           # update the table and print it
 *   node scripts/plan-progress.js B2.01 …   # tick these tasks first
 */
const fs = require('fs');
const path = require('path');

const FILE = path.resolve(__dirname, '../docs/PLAN.md');
let text = fs.readFileSync(FILE, 'utf8');

for (const id of process.argv.slice(2)) {
  const task = new RegExp(`^- \\[[ ~!]\\] ${id.replace('.', '\\.')} `, 'm');
  if (!task.test(text)) {
    console.error(`No open task ${id}`);
    process.exit(1);
  }
  text = text.replace(task, `- [x] ${id} `);
}

const total = {};
const done = {};
for (const [, mark, phase] of text.matchAll(/^- \[(.)\] ([A-Z])\d+\.\d+ /gm)) {
  total[phase] = (total[phase] ?? 0) + 1;
  if (mark === 'x') done[phase] = (done[phase] ?? 0) + 1;
}

let next = true;
text = text.replace(/^\| ([A-Z]) \| ([^|]+) \| \d+ \| \d+ \|[^|]*\|$/gm, (_, phase, what) => {
  const d = done[phase] ?? 0;
  const state = d === total[phase] ? 'Complete' : d > 0 ? 'In progress' : next ? 'Next' : '';
  if (d !== total[phase]) next = false;
  console.log(`${phase}  ${String(d).padStart(3)} / ${String(total[phase]).padEnd(3)}  ${state}`);
  return `| ${phase} | ${what.trim()} | ${total[phase]} | ${d} | ${state} |`;
});

fs.writeFileSync(FILE, text);
