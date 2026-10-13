import { NotificationService } from '@/platform/notifications/notifications';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

/**
 * Whether reminders can fire at the exact minute (Android 12 and later ask for "Alarms and
 * reminders" access). Checked again on return, as the user grants it in the system's settings.
 */
export function useExactAlarmAccess() {
  const [hasAccess, setHasAccess] = useState(true);
  const refresh = useCallback(() => {
    NotificationService.hasExactAlarmAccess().then(setHasAccess, () => setHasAccess(true));
  }, []);

  useEffect(() => {
    refresh();
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => listener.remove();
  }, [refresh]);

  return { hasAccess, openSettings: NotificationService.openExactAlarmSettings };
}
