import { QueryClient } from '@tanstack/react-query';
import { LEDGER_QUERY_ROOTS } from '@/data/query-keys';

export function invalidateAll(queryClient: QueryClient, ...keys: readonly (readonly unknown[])[]): void {
  for (const key of keys) {
    queryClient.invalidateQueries({ queryKey: key });
  }
}

/** After any write to financial data: refresh everything derived from it. See LEDGER_QUERY_ROOTS. */
export function invalidateLedger(queryClient: QueryClient): void {
  invalidateAll(queryClient, ...LEDGER_QUERY_ROOTS);
}
