import { exportBlockerOf, exportOptionsOf, newExportDraft, previewFiltersOf, rangeOf } from '@/features/export/export-rules';

const NOW = new Date(2026, 9, 8, 15, 30);

describe('export rules', () => {
  it('starts with the last thirty days of everything', () => {
    expect(newExportDraft(NOW)).toMatchObject({ period: 30, kind: 'all', accountId: null, includeLoans: false });
  });

  it('covers whole days, counted back from today', () => {
    const { startDate, endDate } = rangeOf({ period: 7, from: NOW, to: NOW }, NOW);
    expect(startDate).toEqual(new Date(2026, 9, 1, 0, 0, 0, 0));
    expect(endDate).toEqual(new Date(2026, 9, 8, 23, 59, 59, 999));
  });

  it('takes a custom period in either order', () => {
    const early = new Date(2026, 8, 3, 18, 0);
    const late = new Date(2026, 8, 20, 9, 0);
    const forwards = rangeOf({ period: 'custom', from: early, to: late }, NOW);
    expect(forwards.startDate).toEqual(new Date(2026, 8, 3, 0, 0, 0, 0));
    expect(forwards.endDate).toEqual(new Date(2026, 8, 20, 23, 59, 59, 999));
    expect(rangeOf({ period: 'custom', from: late, to: early }, NOW)).toEqual(forwards);
  });

  it('asks the service only for what was narrowed', () => {
    const all = exportOptionsOf(newExportDraft(NOW), NOW);
    expect(all).not.toHaveProperty('accountId');
    expect(all).not.toHaveProperty('type');
    expect(exportOptionsOf({ ...newExportDraft(NOW), kind: 'income', accountId: 4, includeLoans: true }, NOW)).toMatchObject({ type: 'CR', accountId: 4, includeLoans: true });
  });

  it('previews with the same choices', () => {
    expect(previewFiltersOf({ ...newExportDraft(NOW), period: 7, kind: 'expense', accountId: 2 }, NOW)).toEqual({ startDate: '2026-10-01', endDate: '2026-10-08', accountIds: [2], types: ['DR'] });
  });

  it('waits for the count, and refuses an empty file unless loans go in', () => {
    expect(exportBlockerOf(undefined, false)).toBe('counting');
    expect(exportBlockerOf(0, false)).toBe('nothing');
    expect(exportBlockerOf(0, true)).toBeNull();
    expect(exportBlockerOf(12, false)).toBeNull();
  });
});
