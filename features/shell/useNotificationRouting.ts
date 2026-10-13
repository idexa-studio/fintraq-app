import { useNotificationLinks } from '@/platform/notifications/notification-links';
import { useRootNavigationState, useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useCallback } from 'react';

/** Opens the screen a tapped notification is about. Mount once, inside the onboarded stack. */
export function useNotificationRouting(): void {
  const router = useRouter();
  // No key yet means the navigator is not mounted, and a push would have nowhere to go.
  const ready = !!useRootNavigationState()?.key;
  useNotificationLinks(useCallback((path: string) => router.push(path as Href), [router]), ready);
}
