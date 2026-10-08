import { WEEKDAYS } from '@/platform/notifications/daily-line';
import type { DailyLine } from '@/platform/notifications/daily-line';
import { backupText, dailyText, loanDueText, loanInstalmentText, NOTIFICATION_PATHS } from '@/platform/notifications/notification-copy';
import type { NotificationText } from '@/platform/notifications/notification-copy';
import { NotificationService } from '@/platform/notifications/notifications';
import type { LoanSubject } from '@/platform/notifications/reminder-plan';
import i18n from '@/shared/i18n';

/**
 * Every notification the app can send, worded from sample records: the inventory, in code. The
 * Developer screen lists it and sends any of them, so each can be read on a real lock screen, and
 * a test walks it so none can be left without text. Labels are English only: a developer tool.
 */

export type NotificationPreview = NotificationText & {
  id: string;
  group: 'Daily reminder' | 'Loans' | 'Backup';
  /** When the app sends it. */
  when: string;
  /** The screen a tap opens. */
  opens: string;
  send: () => Promise<void>;
};

const SAMPLE_DAY = new Date(2026, 9, 1);
const lent: LoanSubject = { loanId: 0, loanType: 'lend', personName: 'Priya', outstanding: 300, currency: 'USD' };
const borrowed: LoanSubject = { loanId: 0, loanType: 'borrow', personName: 'Priya', outstanding: 300, currency: 'USD' };
const unnamed = (loan: LoanSubject): LoanSubject => ({ ...loan, personName: null });

const DAY_NAMES = { sun: 'Sunday', mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday' } as const;

const DAILY: { id: string; when: string; line: DailyLine }[] = [
  { id: 'first', when: 'Nothing has ever been recorded', line: { kind: 'first' } },
  ...WEEKDAYS.map((day) => ({ id: `weekday-${day}`, when: `An ordinary ${DAY_NAMES[day]}, yesterday recorded`, line: { kind: 'weekday', day } as const })),
  { id: 'week-end', when: 'Sunday, with entries since Monday', line: { kind: 'weekEnd', count: 12 } },
  { id: 'week-end-one', when: 'Sunday, with one entry since Monday', line: { kind: 'weekEnd', count: 1 } },
  { id: 'month-start', when: 'The first of the month', line: { kind: 'monthStart', month: SAMPLE_DAY } },
  { id: 'month-end', when: 'The last day of the month', line: { kind: 'monthEnd', month: SAMPLE_DAY, count: 42 } },
  { id: 'month-end-one', when: 'The last day of the month, one entry in it', line: { kind: 'monthEnd', month: SAMPLE_DAY, count: 1 } },
  { id: 'missed-yesterday', when: 'Nothing was added yesterday', line: { kind: 'missedYesterday' } },
  { id: 'quiet-since', when: 'Three to six days without an entry', line: { kind: 'quietSince', since: SAMPLE_DAY } },
  { id: 'quiet', when: 'A week without an entry, then once a week', line: { kind: 'quiet' } },
  { id: 'loan-tomorrow-lend', when: 'A loan you gave is due tomorrow and has no reminder of its own', line: { kind: 'loanTomorrow', loanType: 'lend', personName: 'Priya', outstanding: 300, currency: 'USD' } },
  { id: 'loan-tomorrow-borrow', when: 'A loan you took is due tomorrow and has no reminder of its own', line: { kind: 'loanTomorrow', loanType: 'borrow', personName: 'Priya', outstanding: 300, currency: 'USD' } },
];

const LOANS: { id: string; when: string; text: () => NotificationText }[] = [
  { id: 'due-lend', when: 'Before the due date of a loan you gave', text: () => loanDueText(lent, 1) },
  { id: 'due-lend-days', when: 'Several days before, a loan you gave', text: () => loanDueText(lent, 3) },
  { id: 'due-lend-unnamed', when: 'A loan you gave, with no person', text: () => loanDueText(unnamed(lent), 0) },
  { id: 'due-borrow', when: 'Before the due date of a loan you took', text: () => loanDueText(borrowed, 1) },
  { id: 'due-borrow-unnamed', when: 'A loan you took, with no person', text: () => loanDueText(unnamed(borrowed), 0) },
  { id: 'instalment-lend', when: 'The monthly payment day of a loan you gave', text: () => loanInstalmentText(lent) },
  { id: 'instalment-lend-unnamed', when: 'Monthly payment day, loan you gave, no person', text: () => loanInstalmentText(unnamed(lent)) },
  { id: 'instalment-borrow', when: 'The monthly payment day of a loan you took', text: () => loanInstalmentText(borrowed) },
  { id: 'instalment-borrow-unnamed', when: 'Monthly payment day, loan you took, no person', text: () => loanInstalmentText(unnamed(borrowed)) },
];

export function notificationPreviews(): NotificationPreview[] {
  const stage = i18n.getFixedT(null, 'backup');
  const reminder = (group: NotificationPreview['group'], id: string, when: string, text: NotificationText, path: string, opens: string): NotificationPreview => ({
    ...text, id, group, when, opens, send: () => NotificationService.sendNow({ ...text, path }),
  });
  const uploading = stage('stage.uploadingPct', { pct: 40 });

  return [
    ...DAILY.map(({ id, when, line }) => reminder('Daily reminder', id, when, dailyText(line), NOTIFICATION_PATHS.daily, 'Add expense')),
    // The sample loan has no record behind it, so its preview opens the loans list instead.
    ...LOANS.map(({ id, when, text }) => reminder('Loans', id, when, text(), '/loans', 'The loan')),
    { id: 'backup-running', group: 'Backup', when: 'While a backup runs. Goes by itself when it works', opens: 'Backup', title: backupText.running(), body: uploading, send: () => NotificationService.presentBackupProgressNotification(40, uploading) },
    { id: 'backup-failed', group: 'Backup', when: 'A backup failed for a reason that may pass', opens: 'Backup', ...backupText.failed(), send: () => NotificationService.presentBackupFailedNotification() },
    { id: 'backup-reconnect', group: 'Backup', when: 'Fintraq was signed out of Google', opens: 'Backup', ...backupText.reconnect(), send: () => NotificationService.presentBackupReconnectNotification() },
  ];
}
