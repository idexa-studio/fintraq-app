import {
  capReminders,
  dueReminderDate,
  isAppReminderId,
  LoanReminderSource,
  localDateKey,
  monthlyDates,
  parseClock,
  planDailyReminders,
  planLoanReminders,
} from '@/platform/notifications/reminder-plan';

// 30 Sep 2026, 10:00 local.
const NOW = new Date(2026, 8, 30, 10, 0, 0);
const EIGHT_PM = { hours: 20, minutes: 0 };

describe('parseClock', () => {
  it('reads HH:mm and rejects anything else', () => {
    expect(parseClock('20:05')).toEqual({ hours: 20, minutes: 5 });
    expect(parseClock('9:30')).toEqual({ hours: 9, minutes: 30 });
    expect(parseClock('24:00')).toBeNull();
    expect(parseClock('abc')).toBeNull();
    expect(parseClock(null)).toBeNull();
  });
});

describe('planDailyReminders', () => {
  it('starts today when the time is still ahead, one per day', () => {
    const plan = planDailyReminders(NOW, EIGHT_PM, null, 3);
    expect(plan.map((p) => localDateKey(p.date))).toEqual(['2026-09-30', '2026-10-01', '2026-10-02']);
    expect(plan[0]!.date.getHours()).toBe(20);
    expect(plan[0]!.id).toBe('daily_reminder_2026-09-30');
  });

  it('starts tomorrow once today’s time has passed', () => {
    const plan = planDailyReminders(NOW, { hours: 8, minutes: 0 }, null, 2);
    expect(plan.map((p) => localDateKey(p.date))).toEqual(['2026-10-01']);
  });

  it('skips today when the user already logged something, and keeps the rest', () => {
    const plan = planDailyReminders(NOW, EIGHT_PM, '2026-09-30', 3);
    expect(plan.map((p) => localDateKey(p.date))).toEqual(['2026-10-01', '2026-10-02']);
  });
});

describe('monthlyDates', () => {
  it('clamps the 31st to the end of short months instead of rolling over', () => {
    const dates = monthlyDates(new Date(2027, 0, 1), 31, EIGHT_PM, 3);
    expect(dates.map(localDateKey)).toEqual(['2027-01-31', '2027-02-28', '2027-03-31']);
  });

  it('starts next month when this month’s day has passed, and keeps the count', () => {
    const dates = monthlyDates(NOW, 5, EIGHT_PM, 2);
    expect(dates.map(localDateKey)).toEqual(['2026-10-05', '2026-11-05']);
  });
});

describe('dueReminderDate', () => {
  it('reads the due date in local time, not UTC', () => {
    const date = dueReminderDate('2026-10-05', 1, EIGHT_PM, NOW);
    expect(date && localDateKey(date)).toBe('2026-10-04');
    expect(date?.getHours()).toBe(20);
  });

  it('is null once the moment has passed', () => {
    expect(dueReminderDate('2026-09-30', 1, EIGHT_PM, NOW)).toBeNull();
  });
});

describe('planLoanReminders', () => {
  const base: LoanReminderSource = {
    id: 7,
    type: 'lend',
    personName: 'Sam',
    dueDate: '2026-10-10',
    emiReminderEnabled: true,
    emiReminderDay: 5,
    emiReminderTime: '09:00',
    dueReminderEnabled: true,
    dueReminderDaysBefore: 2,
    dueReminderTime: '18:30',
  };

  it('plans EMI and due reminders with stable ids and the saved due time', () => {
    const plan = planLoanReminders(NOW, [base]);
    const due = plan.find((p) => p.kind === 'due');
    expect(due?.id).toBe('loan_due_7');
    expect(due && localDateKey(due.date)).toBe('2026-10-08');
    expect(due?.date.getHours()).toBe(18);
    expect(plan.filter((p) => p.kind === 'emi')[0]?.id).toBe('loan_emi_7_2026_9');
  });

  it('falls back to the EMI time for loans saved before the due time existed', () => {
    const due = planLoanReminders(NOW, [{ ...base, dueReminderTime: null }]).find((p) => p.kind === 'due');
    expect(due?.date.getHours()).toBe(9);
  });

  it('plans nothing for switched-off reminders', () => {
    expect(planLoanReminders(NOW, [{ ...base, emiReminderEnabled: false, dueReminderEnabled: false }])).toEqual([]);
  });
});

describe('capReminders and ids', () => {
  it('keeps the nearest reminders under a platform limit', () => {
    const plan = planDailyReminders(NOW, EIGHT_PM, null, 10);
    const capped = capReminders([...plan].reverse(), 3);
    expect(capped.map((p) => localDateKey(p.date))).toEqual(['2026-09-30', '2026-10-01', '2026-10-02']);
  });

  it('recognises every id the app owns, including the legacy repeating one', () => {
    expect(isAppReminderId('daily_reminder')).toBe(true);
    expect(isAppReminderId('daily_reminder_2026-10-01')).toBe(true);
    expect(isAppReminderId('loan_emi_3_2026_9')).toBe(true);
    expect(isAppReminderId('loan_due_3')).toBe(true);
    expect(isAppReminderId('cloud_backup_status')).toBe(false);
  });
});
