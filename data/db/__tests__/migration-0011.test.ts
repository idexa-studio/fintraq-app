/**
 * Migration 0011 clears the category's name where it was stored in place of a note, so a
 * transaction left without a note is named by its category as it is, not by a stale copy.
 * Runs the real SQL files, in order, on SQLite (Node's own), as a phone does.
 */
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { DatabaseSync } = require('node:sqlite') as typeof import('node:sqlite');

const DRIZZLE = join(__dirname, '..', '..', '..', 'drizzle');
const files = readdirSync(DRIZZLE).filter((name) => /^\d{4}_.*\.sql$/.test(name)).sort();
const apply = (db: InstanceType<typeof DatabaseSync>, name: string) =>
  readFileSync(join(DRIZZLE, name), 'utf8').split('--> statement-breakpoint').forEach((statement) => { if (statement.trim()) db.exec(statement); });

describe('migration 0011: a category name stored as a note', () => {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON;');
  files.filter((name) => name < '0011').forEach((name) => apply(db, name));

  db.exec(`
    INSERT INTO accounts (id, name, holderName, accountNumber, color, currency, balance, income, expense) VALUES (1, 'Everyday', 'A', '', 1, 'INR', 1000, 0, 0);
    INSERT INTO categories (id, name, type, color) VALUES (1, 'Groceries', 'DR', 3), (2, 'Fuel', 'DR', 4);
    INSERT INTO payments (id, account_id, category_id, amount, type, datetime, note) VALUES
      (1, 1, 1, 100, 'DR', '2026-10-01T09:00:00.000Z', 'Groceries'),
      (2, 1, 2, 50, 'DR', '2026-10-02T09:00:00.000Z', 'Groceries'),
      (3, 1, 1, 70, 'DR', '2026-10-03T09:00:00.000Z', 'Milk and bread');
    INSERT INTO recurring_rules (id, type, amount, account_id, category_id, note, cadence, anchor_date, time, next_due) VALUES
      (1, 'DR', 1200, 1, 1, 'Groceries', 'month', '2026-10-01', '09:00', '2026-11-01');
  `);
  const amounts = () => db.prepare('SELECT id, amount, category_id FROM payments ORDER BY id').all();
  const before = amounts();
  apply(db, files.find((name) => name.startsWith('0011_'))!);
  const notes = () => db.prepare('SELECT note FROM payments ORDER BY id').all().map((row) => row.note);

  it('clears a note that is only its own category’s name', () => {
    expect(notes()[0]).toBe('');
    expect(db.prepare('SELECT note FROM recurring_rules').get()).toEqual({ note: '' });
  });

  it('keeps a typed note, and one naming another category, which was changed after it was written', () => {
    // The second was saved as Groceries and moved to Fuel: its note stays, as it is now indistinguishable from a typed one.
    expect(notes().slice(1)).toEqual(['Groceries', 'Milk and bread']);
  });

  it('changes nothing else', () => {
    expect(amounts()).toEqual(before);
  });
});
