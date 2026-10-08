import { format } from 'date-fns';
import { buildRows } from '@/data/seed/demo-data';

jest.mock('@/data/db/client', () => ({ db: {} }));
jest.mock('@/shared/logging/logger', () => ({ LoggerService: { error: jest.fn() } }));
jest.mock('@react-native-async-storage/async-storage', () => ({ getItem: jest.fn(), setItem: jest.fn() }));

const NOW = new Date(2026, 9, 5, 12, 0, 0);
const rows = buildRows(NOW);
const monthOf = (d: Date) => format(d, 'yyyy-MM');

describe('demo data', () => {
  it('never logs into the future', () => {
    expect(rows.every((r) => r.date <= NOW)).toBe(true);
  });

  it('has money coming in every month, not only going out', () => {
    const months = [...new Set(rows.map((r) => monthOf(r.date)))];
    expect(months).toHaveLength(12);
    for (const month of months) {
      const income = rows.filter((r) => monthOf(r.date) === month && r.type === 'CR');
      expect(income.length).toBeGreaterThanOrEqual(month === monthOf(NOW) ? 2 : 4);
    }
  });

  it('keeps a realistic mix: mostly spending, with regular income and transfers', () => {
    const count = (type: string) => rows.filter((r) => r.type === type).length;
    expect(count('DR')).toBeGreaterThan(count('CR'));
    expect(count('CR') / rows.length).toBeGreaterThan(0.1);
    expect(count('TR')).toBeGreaterThanOrEqual(30);
  });

  it('shows income among the most recent days', () => {
    const cutoff = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - 3);
    expect(rows.some((r) => r.type === 'CR' && r.date >= cutoff)).toBe(true);
  });

  it('earns more than it spends in the home currency, so balances stay believable', () => {
    const home = rows.filter((r) => ['checking', 'savings', 'cash', 'card'].includes(r.acct));
    const sum = (type: string) => home.filter((r) => r.type === type).reduce((s, r) => s + r.amount, 0);
    expect(sum('CR')).toBeGreaterThan(sum('DR'));
  });
});
