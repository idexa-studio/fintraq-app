import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

const DURATION_MS = 600;
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

/**
 * Eases a displayed number towards `target` whenever it changes (and from zero on first show), so
 * a headline figure arrives instead of snapping. Returns `target` unchanged when disabled or when
 * the user has asked the system to reduce motion.
 */
export function useCountUp(target: number, enabled: boolean): number {
  const [value, setValue] = useState(enabled ? 0 : target);
  const from = useRef(enabled ? 0 : target);

  useEffect(() => {
    if (!enabled) {
      from.current = target;
      setValue(target);
      return;
    }
    let frame = 0;
    let cancelled = false;
    const start = from.current;

    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled) return;
      if (reduce || start === target) {
        from.current = target;
        setValue(target);
        return;
      }
      const startedAt = Date.now();
      const tick = () => {
        const progress = Math.min(1, (Date.now() - startedAt) / DURATION_MS);
        const next = start + (target - start) * easeOutCubic(progress);
        from.current = next;
        setValue(progress === 1 ? target : next);
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [target, enabled]);

  return value;
}
