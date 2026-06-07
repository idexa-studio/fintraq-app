import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useWalkthrough(
  storageKey: string,
  stepsLength: number,
  onFinish?: () => void
) {
  const [visible, setVisible] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const val = await AsyncStorage.getItem(storageKey);
        if (val !== 'true') {
          setVisible(true);
        }
      } catch {
        // Fallback: don't show if storage fails
      }
    };
    checkStatus();
  }, [storageKey]);

  const handleNext = useCallback(async () => {
    if (index >= stepsLength - 1) {
      try {
        await AsyncStorage.setItem(storageKey, 'true');
      } catch {}
      setVisible(false);
      onFinish?.();
    } else {
      setIndex((prev) => prev + 1);
    }
  }, [index, stepsLength, storageKey, onFinish]);

  const handleSkip = useCallback(async () => {
    try {
      await AsyncStorage.setItem(storageKey, 'true');
    } catch {}
    setVisible(false);
    onFinish?.();
  }, [storageKey, onFinish]);

  return {
    visible,
    index,
    handleNext,
    handleSkip,
  };
}
