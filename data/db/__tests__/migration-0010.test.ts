/**
 * Release 2.1.0's migration (0010) over a database as 2.0.2 left it: every record and balance is
 * the same afterwards, and the new fields start empty. Runs the real SQL files, in order, on
 * SQLite (Node's own), so what is tested is what a user's phone runs.
 */
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { DatabaseSync } = require('node:sqlite') as typeof import('node:sqlite');

const DRIZZLE = join(__dirname, '..', '..', '..', 'drizzle');
const files = readdirSync(DRIZZLE).filter((name) => /^\d{4}_.*\.sql$/.test(name)).sort();
const apply = (db: InstanceType<typeof DatabaseSync>, name: string) =>
  readFileSync(join(DRIZZLE, name), 'utf8').split('--> statement-breakpoint').forEach((statement) => { if (statement.trim()) db.exec(statement); });

describe('migration 0010 over a 2.0.2 database', () => {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON;');
  const before = files.filter((name) => name < '0010');
  before.forEach((name) => apply(db, name));

  db.exec(`
    INSERT INTO accounts (id, name, holderName, accountNumber, color, currency, balance, income, expense, account_type) VALUES
      (1, 'Everyday', 'A', '', 1, 'INR', 3240.10, 5000, 1759.90, 'bank'),
      (2, 'Savings', 'A', '', 2, 'INR', 12400, 12400, 0, 'savings');
    INSERT INTO categories (id, name, type, color) VALUES (1, 'Rent', 'DR', 3);
    INSERT INTO payments (id, account_id, category_id, amount, type, datetime, note) VALUES
      (1, 1, 1, 1200, 'DR', '2026-10-01T09:00:00.000Z', 'Rent'),
      (2, 1, 1, 559.90, 'DR', '2026-10-05T09:00:00.000Z', 'Shop');
    INSERT INTO budgets (id, category_id, currency, monthly_limit) VALUES (1, 1, 'INR', 2000);
  `);
  const snapshot = () => ({
    accounts: db.prepare('SELECT id, name, balance, income, expense, account_type FROM accounts ORDER BY id').all(),
    payments: db.prepare('SELECT id, account_id, amount, type, datetime, note FROM payments ORDER BY id').all(),
    budgets: db.prepare('SELECT id, category_id, monthly_limit FROM budgets ORDER BY id').all(),
  });
  const kept = snapshot();
  files.filter((name) => name.startsWith('0010_')).forEach((name) => apply(db, name));

  it('keeps every account, balance, transaction and budget as it was', () => {
    expect(snapshot()).toEqual(kept);
  });

  it('starts the new fields empty: accounts by their kind, transactions made by no item, no items', () => {
    expect(db.prepare('SELECT counts_as_spendable AS v FROM accounts').all().map((row) => row.v)).toEqual([null, null]);
    expect(db.prepare('SELECT recurring_rule_id AS r, recurring_date AS d FROM payments').all()).toEqual([{ r: null, d: null }, { r: null, d: null }]);
    expect(db.prepare('SELECT COUNT(*) AS n FROM recurring_rules').get()).toEqual({ n: 0 });
  });

  it('refuses a second transaction for the same item on the same day', () => {
    db.exec(`INSERT INTO recurring_rules (id, type, amount, account_id, category_id, cadence, anchor_date, time, next_due) VALUES (1, 'DR', 1200, 1, 1, 'month', '2026-10-01', '09:00', '2026-11-01');`);
    db.exec(`INSERT INTO payments (account_id, category_id, amount, type, datetime, note, recurring_rule_id, recurring_date) VALUES (1, 1, 1200, 'DR', '2026-11-01T09:00:00.000Z', 'Rent', 1, '2026-11-01');`);
    expect(() => db.exec(`INSERT INTO payments (account_id, category_id, amount, type, datetime, note, recurring_rule_id, recurring_date) VALUES (1, 1, 1200, 'DR', '2026-11-01T09:00:00.000Z', 'Rent', 1, '2026-11-01');`)).toThrow(/UNIQUE/);
  });

  it('stops an item, rather than deleting it, when its account goes', () => {
    db.exec('DELETE FROM accounts WHERE id = 1;');
    expect(db.prepare('SELECT account_id AS a FROM recurring_rules WHERE id = 1').get()).toEqual({ a: null });
  });
});
