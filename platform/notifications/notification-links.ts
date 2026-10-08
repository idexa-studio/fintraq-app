import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import notifee, { EventType } from 'react-native-notify-kit';
import type { Event } from 'react-native-notify-kit';

/**
 * Tapping a notification opens the screen it is about. Every notification carries its path in
 * `data.path` (see notification-copy); this hands that path to the app, once, however the tap
 * arrived: with the app open, in the background, or closed.
 */

let pending: string | null = null;
let lastHandled: string | null = null;
const listeners = new Set<() => void>();

/** Queues a path for the app to open. `key` names the tap, so one tap reported twice opens once. */
function offer(path: unknown, key: string): void {
  if (typeof path !== 'string' || !path.startsWith('/') || key === lastHandled) return;
  lastHandled = key;
  pending = path;
  listeners.forEach((listener) => listener());
}

/** The waiting path, handed over once. */
function takePending(): string | null {
  const path = pending;
  pending = null;
  return path;
}

const offerResponse = (response: Notifications.NotificationResponse | null): void => {
  if (!response || response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
  const { request, date } = response.notification;
  offer(request.content.data?.path, `${request.identifier}:${date}`);
};

const offerEvent = ({ type, detail }: Event): void => {
  if (type !== EventType.PRESS) return;
  offer(detail.notification?.data?.path, `${detail.notification?.id}:${Date.now()}`);
};

// A press while the app sits in the background arrives here, before any screen is listening, so
// the path waits in `pending` until the hook below takes it.
notifee.onBackgroundEvent(async (event) => offerEvent(event));

/**
 * Calls `open` with the path of each notification the user taps, once `ready` says the app can
 * navigate. A tap is reported while the app is still coming forward and its screens are being put
 * back, so the path waits here, outside any component, until someone ready takes it.
 * Mount once, where routing is safe.
 */
export function useNotificationLinks(open: (path: string) => void, ready: boolean): void {
  const [, setOffers] = useState(0);

  useEffect(() => {
    const noticed = () => setOffers((count) => count + 1);
    listeners.add(noticed);

    const responses = Notifications.addNotificationResponseReceivedListener(offerResponse);
    const stopForeground = notifee.onForegroundEvent(offerEvent);
    // The tap that started the app, if one did.
    void Notifications.getLastNotificationResponseAsync().then(offerResponse, () => {});
    void notifee.getInitialNotification().then((initial) => {
      if (initial) offer(initial.notification.data?.path, `${initial.notification.id}:initial`);
    }, () => {});

    return () => {
      listeners.delete(noticed);
      responses.remove();
      stopForeground();
    };
  }, []);

  useEffect(() => {
    const path = ready ? takePending() : null;
    if (path) open(path);
  });
}
