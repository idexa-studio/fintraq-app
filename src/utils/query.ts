import { QueryClient } from '@tanstack/react-query';

export function invalidateAll(queryClient: QueryClient, ...keys: readonly (readonly unknown[])[]): void {
  for (const key of keys) {
    queryClient.invalidateQueries({ queryKey: key });
  }
}
