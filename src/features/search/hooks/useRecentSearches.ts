import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageKeys } from '../../../constants/keys';

const STORAGE_KEY = StorageKeys.RECENT_SEARCHES;

export function useRecentSearches() {
  const [recents, setRecents] = useState<string[]>([]);

  const loadRecents = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRecents(JSON.parse(stored));
      }
    } catch {
      // Fallback: silently ignore errors
    }
  }, []);

  useEffect(() => {
    loadRecents();
  }, [loadRecents]);

  const addRecent = useCallback(async (query: string) => {
    const q = query.trim();
    if (!q || q.length < 2) return;
    try {
      setRecents((prev) => {
        const next = [q, ...prev.filter((item) => item !== q)].slice(0, 5);
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    } catch {
      // Ignore errors
    }
  }, []);

  const removeRecent = useCallback(async (query: string) => {
    try {
      setRecents((prev) => {
        const next = prev.filter((item) => item !== query);
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    } catch {
      // Ignore errors
    }
  }, []);

  const clearRecents = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setRecents([]);
    } catch {
      // Ignore errors
    }
  }, []);

  return {
    recents,
    addRecent,
    removeRecent,
    clearRecents,
  };
}
