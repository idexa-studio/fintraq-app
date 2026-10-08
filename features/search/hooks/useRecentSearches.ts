import { parseRecents, withRecent, withoutRecent } from '@/features/search/search-rules';
import { StorageKeys } from '@/shared/contracts/storage-keys';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

/** The last few searches, kept under the key the shipped app used so they carry over. */
export function useRecentSearches() {
  const [recents, setRecents] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(StorageKeys.RECENT_SEARCHES).then((raw) => setRecents(parseRecents(raw)), () => undefined);
  }, []);

  const change = useCallback((next: (current: string[]) => string[]) => {
    setRecents((current) => {
      const updated = next(current);
      // Losing a remembered search is harmless, so a failed write is not reported.
      void (updated.length ? AsyncStorage.setItem(StorageKeys.RECENT_SEARCHES, JSON.stringify(updated)) : AsyncStorage.removeItem(StorageKeys.RECENT_SEARCHES)).catch(() => undefined);
      return updated;
    });
  }, []);

  const remember = useCallback((query: string) => change((current) => withRecent(current, query)), [change]);
  const forget = useCallback((query: string) => change((current) => withoutRecent(current, query)), [change]);
  const forgetAll = useCallback(() => change(() => []), [change]);

  return { recents, remember, forget, forgetAll };
}
