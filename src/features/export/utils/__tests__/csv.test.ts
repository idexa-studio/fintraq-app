import { CSV_BOM, escapeCsvField, toCsvRow } from '@/src/features/export/utils/csv';

describe('escapeCsvField', () => {
  it('leaves plain text and numbers alone', () => {
    expect(escapeCsvField('Groceries')).toBe('Groceries');
    expect(escapeCsvField('1250.50')).toBe('1250.50');
    expect(escapeCsvField('-40.00')).toBe('-40.00');
    expect(escapeCsvField('')).toBe('');
  });

  it('quotes commas, quotes and line breaks', () => {
    expect(escapeCsvField('rent, march')).toBe('"rent, march"');
    expect(escapeCsvField('the "big" one')).toBe('"the ""big"" one"');
    expect(escapeCsvField('line one\nline two')).toBe('"line one\nline two"');
  });

  it.each(['=1+1', '+SUM(A1:A9)', '-cmd|x', '@import', '\tx'])('neutralises the formula lead in %j', (value) => {
    expect(escapeCsvField(value).startsWith("'")).toBe(true);
  });

  it('neutralises and quotes together', () => {
    expect(escapeCsvField('=HYPERLINK("http://x","y")')).toBe('"\'=HYPERLINK(""http://x"",""y"")"');
  });
});

describe('toCsvRow', () => {
  it('joins escaped cells', () => {
    expect(toCsvRow(['2026-10-04', 'Café, বাজার', '=A1'])).toBe('2026-10-04,"Café, বাজার",\'=A1');
  });
});

describe('CSV_BOM', () => {
  it('is the UTF-8 byte-order mark', () => {
    expect(CSV_BOM.charCodeAt(0)).toBe(0xfeff);
  });
});
