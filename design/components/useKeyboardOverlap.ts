import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * How far the keyboard covers the bottom of the screen, less the safe-area
 * inset the layout already clears. Measured from keyboard events because the
 * platform's own avoiding view leaves stale padding behind on Android when
 * the app draws edge to edge.
 */
export function useKeyboardOverlap(enabled = true): number {
  const { bottom } = useSafeAreaInsets();
  const [overlap, setOverlap] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (e) => setOverlap(Math.max(0, e.endCoordinates.height - bottom)));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setOverlap(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, [enabled, bottom]);
  return enabled ? overlap : 0;
}
