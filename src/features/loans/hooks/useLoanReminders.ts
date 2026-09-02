import { useCallback } from 'react';
import { NotificationService } from '../../../services/notification.service';
import { toErrorMessage } from '../../../utils/errors';
import { useUpdateLoan } from './loans';
import type { LoanWithStats } from '../api/loans';

export const useLoanReminders = () => {
  const { mutateAsync: updateLoan } = useUpdateLoan();

  const scheduleEmiReminder = useCallback(async (loan: LoanWithStats, day: number, timeStr: string) => {
    try {
      const hasPermission = await NotificationService.checkPermissions();
      if (!hasPermission) {
        const granted = await NotificationService.requestPermissions();
        if (!granted) return false;
      }

      if (loan.emiNotificationIds) {
        const existing: string[] = JSON.parse(loan.emiNotificationIds);
        await NotificationService.cancelByIdentifiers(existing);
      }

      const ids = await NotificationService.scheduleLoanEmiReminder(
        loan.id,
        day,
        timeStr,
        loan.personName ?? '',
        loan.type as 'lend' | 'borrow',
      );

      await updateLoan({
        id: loan.id,
        data: {
          emiReminderEnabled: true,
          emiReminderDay: day,
          emiReminderTime: timeStr,
          emiNotificationIds: JSON.stringify(ids),
        },
      });

      return true;
    } catch (e) {
      console.error('[LoanReminders] EMI schedule failed:', toErrorMessage(e));
      return false;
    }
  }, [updateLoan]);

  const cancelEmiReminder = useCallback(async (loan: LoanWithStats) => {
    try {
      if (loan.emiNotificationIds) {
        const ids: string[] = JSON.parse(loan.emiNotificationIds);
        await NotificationService.cancelByIdentifiers(ids);
      }
      await updateLoan({
        id: loan.id,
        data: { emiReminderEnabled: false, emiNotificationIds: null },
      });
    } catch (e) {
      console.error('[LoanReminders] EMI cancel failed:', toErrorMessage(e));
    }
  }, [updateLoan]);

  const scheduleDueReminder = useCallback(async (loan: LoanWithStats, daysBefore: number, timeStr: string) => {
    if (!loan.dueDate) return false;
    try {
      const hasPermission = await NotificationService.checkPermissions();
      if (!hasPermission) {
        const granted = await NotificationService.requestPermissions();
        if (!granted) return false;
      }

      if (loan.dueNotificationId) {
        await NotificationService.cancelByIdentifiers([loan.dueNotificationId]);
      }

      const id = await NotificationService.scheduleLoanDueReminder(
        loan.id,
        loan.dueDate,
        daysBefore,
        timeStr,
        loan.personName ?? '',
        loan.type as 'lend' | 'borrow',
      );

      await updateLoan({
        id: loan.id,
        data: {
          dueReminderEnabled: true,
          dueReminderDaysBefore: daysBefore,
          dueNotificationId: id,
        },
      });

      return true;
    } catch (e) {
      console.error('[LoanReminders] Due reminder schedule failed:', toErrorMessage(e));
      return false;
    }
  }, [updateLoan]);

  const cancelDueReminder = useCallback(async (loan: LoanWithStats) => {
    try {
      if (loan.dueNotificationId) {
        await NotificationService.cancelByIdentifiers([loan.dueNotificationId]);
      }
      await updateLoan({
        id: loan.id,
        data: { dueReminderEnabled: false, dueNotificationId: null },
      });
    } catch (e) {
      console.error('[LoanReminders] Due reminder cancel failed:', toErrorMessage(e));
    }
  }, [updateLoan]);

  const cancelAllLoanReminders = useCallback(async (loan: LoanWithStats) => {
    const ids: string[] = [];
    if (loan.emiNotificationIds) ids.push(...JSON.parse(loan.emiNotificationIds));
    if (loan.dueNotificationId) ids.push(loan.dueNotificationId);
    if (ids.length > 0) await NotificationService.cancelByIdentifiers(ids);
  }, []);

  return {
    scheduleEmiReminder,
    cancelEmiReminder,
    scheduleDueReminder,
    cancelDueReminder,
    cancelAllLoanReminders,
  };
};
