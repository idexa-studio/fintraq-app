import type { DailyLine } from '@/platform/notifications/daily-line';
import type { LoanSubject, PlannedReminder } from '@/platform/notifications/reminder-plan';
import { formatDate } from '@/shared/date/date';
import { formatCurrency } from '@/shared/format/money';
import i18n from '@/shared/i18n';

/**
 * The words of every notification, and where tapping it goes. The one place that turns what the
 * app knows into a line, so a notification can be read here before it is ever sent.
 */

export type NotificationText = { title: string; body: string };

/** Where a tap lands. Carried in the notification's data and opened by `useNotificationLinks`. */
export const NOTIFICATION_PATHS = {
  daily: '/add?kind=expense',
  loan: (loanId: number) => `/loans/${loanId}`,
  backup: '/backup',
} as const;

const t = i18n.getFixedT(null, 'notifications');

export function dailyText(line: DailyLine): NotificationText {
  switch (line.kind) {
    case 'first':
      return { title: t('daily.first.title'), body: t('daily.first.body') };
    case 'loanTomorrow': {
      const values = { name: line.personName, amount: formatCurrency(line.outstanding, line.currency) };
      return { title: t(`daily.loanTomorrow.${line.loanType}.title`, values), body: t(`daily.loanTomorrow.${line.loanType}.body`) };
    }
    case 'quiet':
      return { title: t('daily.quiet.title'), body: t('daily.quiet.body') };
    case 'monthEnd':
      return { title: t('daily.monthEnd.title', { month: formatDate(line.month, { month: 'long' }) }), body: t('daily.monthEnd.body', { count: line.count }) };
    case 'monthStart':
      return { title: t('daily.monthStart.title', { month: formatDate(line.month, { month: 'long' }) }), body: t('daily.monthStart.body') };
    case 'missedYesterday':
      return { title: t('daily.missedYesterday.title'), body: t('daily.missedYesterday.body') };
    case 'quietSince':
      return { title: t('daily.quietSince.title', { day: formatDate(line.since, { weekday: 'long' }) }), body: t('daily.quietSince.body') };
    case 'weekEnd':
      return { title: t('daily.weekEnd.title', { count: line.count }), body: t('daily.weekEnd.body') };
    case 'weekday':
      return { title: t(`daily.weekday.${line.day}.title`), body: t(`daily.weekday.${line.day}.body`) };
  }
}

const whenText = (daysBefore: number): string =>
  daysBefore <= 0 ? t('loan.when.today') : daysBefore === 1 ? t('loan.when.tomorrow') : t('loan.when.inDays', { count: daysBefore });

export function loanDueText(loan: LoanSubject, daysBefore: number): NotificationText {
  const amount = formatCurrency(loan.outstanding, loan.currency);
  return {
    title: loan.personName ? t(`loan.due.${loan.loanType}.title`, { name: loan.personName, amount }) : t(`loan.due.${loan.loanType}.titleNoName`, { amount }),
    body: t(`loan.due.${loan.loanType}.body`, { when: whenText(daysBefore) }),
  };
}

export function loanInstalmentText(loan: LoanSubject): NotificationText {
  const amount = formatCurrency(loan.outstanding, loan.currency);
  return {
    title: loan.personName ? t(`loan.instalment.${loan.loanType}.title`, { name: loan.personName }) : t(`loan.instalment.${loan.loanType}.titleNoName`),
    body: t(`loan.instalment.${loan.loanType}.body`, { amount }),
  };
}

/** A planned reminder as it will read, with where its tap goes. `daily` is that day's line. */
export function reminderContent(reminder: PlannedReminder, daily: DailyLine): NotificationText & { path: string } {
  switch (reminder.kind) {
    case 'daily':
      return { ...dailyText(daily), path: NOTIFICATION_PATHS.daily };
    case 'emi':
      return { ...loanInstalmentText(reminder), path: NOTIFICATION_PATHS.loan(reminder.loanId) };
    case 'due':
      return { ...loanDueText(reminder, reminder.daysBefore), path: NOTIFICATION_PATHS.loan(reminder.loanId) };
  }
}

export const backupText = {
  running: (): string => t('backup.running.title'),
  failed: (): NotificationText => ({ title: t('backup.failed.title'), body: t('backup.failed.body') }),
  reconnect: (): NotificationText => ({ title: t('backup.reconnect.title'), body: t('backup.reconnect.body') }),
};

export const channelText = {
  reminders: () => ({ name: t('channels.reminders.name'), description: t('channels.reminders.description') }),
  backup: () => ({ name: t('channels.backup.name'), description: t('channels.backup.description') }),
};
