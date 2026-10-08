import { NAME_MAX, cleanName, reminderDate, reminderTimeOf, reminderTimeText } from '@/features/settings/settings-rules';

describe('settings rules', () => {
  it('saves a name trimmed, single-spaced and no longer than allowed', () => {
    expect(cleanName('  John   Smith ')).toBe('John Smith');
    expect(cleanName('')).toBe('');
    expect(cleanName('x'.repeat(NAME_MAX + 5))).toHaveLength(NAME_MAX);
  });

  it('reads the reminder time the shipped app saved', () => {
    expect(reminderTimeOf('20:00')).toEqual({ hour: 20, minute: 0 });
    expect(reminderTimeOf('07:05')).toEqual({ hour: 7, minute: 5 });
  });

  it('falls back to eight in the evening when the saved time cannot be read', () => {
    expect(reminderTimeOf('')).toEqual({ hour: 20, minute: 0 });
    expect(reminderTimeOf('25:00')).toEqual({ hour: 20, minute: 0 });
    expect(reminderTimeOf('nonsense')).toEqual({ hour: 20, minute: 0 });
  });

  it('writes the time back in the same form', () => {
    expect(reminderTimeText({ hour: 7, minute: 5 })).toBe('07:05');
    expect(reminderTimeText(reminderTimeOf('20:00'))).toBe('20:00');
  });

  it('places the reminder on today for display', () => {
    const date = reminderDate('07:05', new Date(2026, 9, 8, 15, 0));
    expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes()]).toEqual([2026, 9, 8, 7, 5]);
  });
});
