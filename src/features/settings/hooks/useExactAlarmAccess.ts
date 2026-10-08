import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { NotificationService } from '@/platform/notifications/notifications';

/**
 * Whether reminders can fire at the exact minute (Android 12+ "Alarms & reminders" access).
 * Re-checked on resume, since the user grants it in system settings and comes back.
 */
export function useExactAlarmAccess() {
  const [hasAccess, setHasAccess] = useState(true);

  const refresh = useCallback(() => {
    NotificationService.hasExactAlarmAccess()
      .then(setHasAccess)
      .catch(() => setHasAccess(true));
  }, []);

  useEffect(() => {
    refresh();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  return { hasAccess, openSettings: NotificationService.openExactAlarmSettings };
}
