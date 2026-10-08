import { useEffect, useRef } from 'react';
import type { TextInput } from 'react-native';

/** How long a sheet takes to settle before the keyboard may follow it up. */
const ARRIVAL = 450;

/**
 * Opens the keyboard on a field once its screen has arrived. Focusing at
 * once, as `autoFocus` does, happens while a sheet is still sliding up: the
 * list then scrolls to where the field was mid-slide and leaves it out of view.
 */
export function useFocusOnArrival(enabled: boolean) {
  const input = useRef<TextInput>(null);
  useEffect(() => {
    if (!enabled) return;
    const timer = setTimeout(() => input.current?.focus(), ARRIVAL);
    return () => clearTimeout(timer);
  }, [enabled]);
  return input;
}
