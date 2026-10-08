import { AppState, AppStateStatus, Platform } from 'react-native';
import { LoggerService } from '@/shared/logging/logger';
import { runAutoBackupIfDue } from './auto-backup.service';

// Let launch/resume work (queries, splash, remote config) settle before touching the network.
const FOREGROUND_CHECK_DELAY_MS = 4_000;

/**
 * Wires the foreground auto-backup checks — the reliable path, since OS background scheduling
 * is best-effort on both platforms. Checks on launch and on every resume. On Android also when
 * the app is backgrounded (the process normally survives long enough to finish); iOS suspends
 * apps within seconds of backgrounding, which would cut uploads off, so iOS relies on resume
 * checks plus BGTaskScheduler. Returns a cleanup function.
 */
export function startAutoBackupTriggers(): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastState: AppStateStatus = AppState.currentState;

  const cancelPending = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };

  const check = () => {
    runAutoBackupIfDue().catch((e) => LoggerService.warn('AUTO_BACKUP', 'Auto-backup check threw', e));
  };

  const scheduleForegroundCheck = () => {
    cancelPending();
    timer = setTimeout(() => {
      timer = null;
      if (AppState.currentState === 'active') check();
    }, FOREGROUND_CHECK_DELAY_MS);
  };

  if (AppState.currentState === 'active') scheduleForegroundCheck();

  const subscription = AppState.addEventListener('change', (next) => {
    if (next === 'active' && lastState !== 'active') {
      scheduleForegroundCheck();
    } else if (next === 'background') {
      cancelPending();
      if (Platform.OS === 'android') check();
    }
    lastState = next;
  });

  return () => {
    cancelPending();
    subscription.remove();
  };
}
