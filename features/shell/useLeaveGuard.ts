import { usePreventRemove } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import { useState } from 'react';

/**
 * Stops a task being left by accident while it holds unsaved input: back,
 * close and the swipe all ask first. The screen shows a dialog while `asking`
 * and wires its two buttons to `leave` and `stay`. Call `release` once the
 * input is saved, then leave on the next tick.
 */
export function useLeaveGuard(unsaved: boolean) {
  const navigation = useNavigation();
  const [released, setReleased] = useState(false);
  /** The navigation the user asked for while there was unsaved input; carried out if they confirm. */
  const [pending, setPending] = useState<Parameters<typeof navigation.dispatch>[0] | null>(null);

  usePreventRemove(unsaved && !released, ({ data }) => setPending(data.action));

  return {
    asking: pending !== null,
    stay: () => setPending(null),
    leave: () => {
      const action = pending;
      setPending(null);
      setReleased(true);
      if (action) setTimeout(() => navigation.dispatch(action), 0);
    },
    release: () => setReleased(true),
  };
}
