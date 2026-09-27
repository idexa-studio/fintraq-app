import { useEffect, useState } from 'react';
import { Keyboard, KeyboardEvent, Platform } from 'react-native';

/**
 * How far the keyboard overlaps the bottom of the window, minus the bottom
 * safe-area inset the layout already pads for.
 *
 * Replaces KeyboardAvoidingView, which on Android edge-to-edge keeps ~50dp of
 * stale padding after the keyboard hides, leaving footers floating mid-air.
 */
export function useKeyboardInset(enabled: boolean, bottomInset = 0): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setInset(0);
      return;
    }
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, (e: KeyboardEvent) =>
      setInset(Math.max(0, e.endCoordinates.height - bottomInset)),
    );
    const hide = Keyboard.addListener(hideEvent, () => setInset(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, [enabled, bottomInset]);

  return inset;
}
