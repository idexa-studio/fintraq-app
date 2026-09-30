import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { FEATURE_TIPS, FeatureTipId } from '@/src/features/walkthrough/constants/tips';

// At most one tip per app session, app-wide. Tips on several screens a new user visits in their
// first minutes would otherwise arrive as a burst; spread out, each one lands when it's relevant.
let sessionTip: FeatureTipId | null = null;

/**
 * Whether `tip` should show now. It shows once ever (dismissal is persisted), only while
 * `enabled` (e.g. the list has a row to swipe), and only if no other tip has shown this session.
 */
export function useFeatureTip(tip: FeatureTipId, enabled: boolean) {
  const { storageKey } = FEATURE_TIPS[tip];
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setVisible(false);
      return;
    }
    if (sessionTip !== null && sessionTip !== tip) return;

    let cancelled = false;
    AsyncStorage.getItem(storageKey)
      .then((dismissed) => {
        if (cancelled || dismissed === 'true') return;
        if (sessionTip !== null && sessionTip !== tip) return;
        sessionTip = tip;
        setVisible(true);
      })
      // If storage is unreadable, err on the side of silence.
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [tip, storageKey, enabled]);

  const dismiss = useCallback(() => {
    setVisible(false);
    AsyncStorage.setItem(storageKey, 'true').catch(() => {});
  }, [storageKey]);

  return { visible, dismiss };
}
