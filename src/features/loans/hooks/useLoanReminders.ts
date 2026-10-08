import { useCallback } from 'react';
import type { LoanWithStats } from '@/src/features/loans/api/loans';
import { useUpdateLoan } from '@/src/features/loans/hooks/loans';
import { LoggerService } from '@/src/services/logger.service';
import { NotificationService } from '@/src/services/notification.service';
import { syncReminders } from '@/src/services/reminders/reminder-sync';
import { toErrorMessage } from '@/shared/errors';

/**
 * Loan reminder settings. Each action saves the setting on the loan, then syncs: the scheduled OS
 * reminders are always rebuilt from the loans table, so they can't drift from what's saved.
 */
export const useLoanReminders = () => {
  const { mutateAsync: updateLoan } = useUpdateLoan();

  const ensurePermission = useCallback(async () => {
    if (await NotificationService.checkPermissions()) return true;
    return NotificationService.requestPermissions();
  }, []);

  const scheduleEmiReminder = useCallback(
    async (loan: LoanWithStats, day: number, timeStr: string) => {
      try {
        if (!(await ensurePermission())) return false;
        await updateLoan({ id: loan.id, data: { emiReminderEnabled: true, emiReminderDay: day, emiReminderTime: timeStr, emiNotificationIds: null } });
        await syncReminders();
        return true;
      } catch (e) {
        LoggerService.error('LOAN_REMINDERS', 'EMI schedule failed', toErrorMessage(e));
        return false;
      }
    },
    [updateLoan, ensurePermission],
  );

  const cancelEmiReminder = useCallback(
    async (loan: LoanWithStats) => {
      try {
        await updateLoan({ id: loan.id, data: { emiReminderEnabled: false, emiNotificationIds: null } });
        await syncReminders();
      } catch (e) {
        LoggerService.error('LOAN_REMINDERS', 'EMI cancel failed', toErrorMessage(e));
      }
    },
    [updateLoan],
  );

  const scheduleDueReminder = useCallback(
    async (loan: LoanWithStats, daysBefore: number, timeStr: string) => {
      if (!loan.dueDate) return false;
      try {
        if (!(await ensurePermission())) return false;
        await updateLoan({
          id: loan.id,
          data: { dueReminderEnabled: true, dueReminderDaysBefore: daysBefore, dueReminderTime: timeStr, dueNotificationId: null },
        });
        await syncReminders();
        return true;
      } catch (e) {
        LoggerService.error('LOAN_REMINDERS', 'Due reminder schedule failed', toErrorMessage(e));
        return false;
      }
    },
    [updateLoan, ensurePermission],
  );

  const cancelDueReminder = useCallback(
    async (loan: LoanWithStats) => {
      try {
        await updateLoan({ id: loan.id, data: { dueReminderEnabled: false, dueNotificationId: null } });
        await syncReminders();
      } catch (e) {
        LoggerService.error('LOAN_REMINDERS', 'Due reminder cancel failed', toErrorMessage(e));
      }
    },
    [updateLoan],
  );

  return { scheduleEmiReminder, cancelEmiReminder, scheduleDueReminder, cancelDueReminder };
};
