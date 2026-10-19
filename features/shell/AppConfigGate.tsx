import { ForceUpdateScreen } from '@/features/shell/ForceUpdateScreen';
import { startAutoBackupTriggers } from '@/platform/backup/auto-backup.triggers';
import { fetchRemoteAppConfig, initRemoteConfig } from '@/platform/config/remote-config';
import type { LatestVersion } from '@/platform/config/update-rules';
import { LoggerService } from '@/shared/logging/logger';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

/** The newest release announced for this platform. */
export type AnnouncedRelease = LatestVersion;

const AnnouncedReleaseContext = createContext<AnnouncedRelease | null>(null);

/** The newest release announced in the remote settings, or null; Home decides whether to offer it. */
export const useAnnouncedRelease = (): AnnouncedRelease | null => useContext(AnnouncedReleaseContext);

/** The remote settings are not asked for again within this time of the last answer. */
const COOLDOWN_MS = 10 * 60 * 1000;
/** A backstop at launch, so the launch screen can never stay up for want of an answer. */
const INIT_DEADLINE_MS = 8000;

const withDeadline = <T,>(promise: Promise<T>, ms: number): Promise<T | undefined> =>
  Promise.race([promise, new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), ms))]);

/**
 * Reads the app's remote settings at launch and on return, says the app is ready to be seen once
 * they are in (or the deadline passes), and replaces the app with the update screen when this
 * version is too old. The newest release it hears of is passed down, for Home to offer. It also starts the checks that run automatic backup while the app is open.
 */
export function AppConfigGate({ children, onReady }: { children: React.ReactNode; onReady: () => void }) {
  const [update, setUpdate] = useState<{ version: string } | null>(null);
  const [announced, setAnnounced] = useState<AnnouncedRelease | null>(null);
  const lastChecked = useRef(0);

  const check = useCallback(async (force = false) => {
    if (!force && !__DEV__ && lastChecked.current > 0 && Date.now() - lastChecked.current < COOLDOWN_MS) return;
    try {
      const { forceUpdate, latest } = await fetchRemoteAppConfig();
      setUpdate(forceUpdate.required ? { version: forceUpdate.versionName } : null);
      setAnnounced(latest);
      lastChecked.current = Date.now();
    } catch (e) {
      if (__DEV__) LoggerService.warn('APP_CONFIG', 'Could not read the remote settings', e);
    }
  }, []);

  useEffect(() => {
    void withDeadline(initRemoteConfig().then(() => check(true)), INIT_DEADLINE_MS)
      .catch((e) => { if (__DEV__) LoggerService.warn('APP_CONFIG', 'Remote settings did not start', e); })
      .finally(() => {
        if (AppState.currentState === 'active') {
          onReady();
          return;
        }
        // Launched in the background: the launch screen comes down when the app is first seen.
        const waiting = AppState.addEventListener('change', (state) => {
          if (state !== 'active') return;
          waiting.remove();
          onReady();
        });
      });
    // Once, at launch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let previous = AppState.currentState;
    const listener = AppState.addEventListener('change', (state) => {
      if (/inactive|background/.test(previous) && state === 'active') void check();
      previous = state;
    });
    return () => listener.remove();
  }, [check]);

  // The main way automatic backup runs. Each check does nothing when it is not due, not Pro, or signed out.
  useEffect(() => startAutoBackupTriggers(), []);

  if (update) return <ForceUpdateScreen version={update.version} />;
  return <AnnouncedReleaseContext.Provider value={announced}>{children}</AnnouncedReleaseContext.Provider>;
}
