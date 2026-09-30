import type { QueryClient } from '@tanstack/react-query';
import { syncReminders } from '@/src/services/reminders/reminder-sync';
import { invalidateLedger } from '@/src/utils/query';

/**
 * What every successful write to financial data triggers: refresh the screens that read it, and
 * bring scheduled reminders in line (a repayment can settle a loan; a rename changes reminder text).
 */
export function afterLedgerWrite(queryClient: QueryClient): void {
  invalidateLedger(queryClient);
  void syncReminders();
}
