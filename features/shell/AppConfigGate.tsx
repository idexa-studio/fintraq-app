import { ForceUpdateScreen } from '@/features/shell/ForceUpdateScreen';
import { startAutoBackupTriggers } from '@/platform/backup/auto-backup.triggers';
import { fetchRemoteAppConfig, initRemoteConfig } from '@/platform/config/remote-config';
import { LoggerService } from '@/shared/logging/logger';
import * as SplashScreen from 'expo-splash-screen';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

/** The remote settings are not asked for again within this time of the last answer. */
const COOLDOWN_MS = 10 * 60 * 1000;
/** A backstop at launch, so the launch screen can never stay up for want of an answer. */
const INIT_DEADLINE_MS = 8000;

const withDeadline = <T,>(promise: Promise<T>, ms: number): Promise<T | undefined> =>
  Promise.race([promise, new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), ms))]);

/**
 * Reads the app's remote settings at launch and on return, takes the launch screen down once
 * they are in (or the deadline passes), and replaces the app with the update screen when this
 * version is too old. It also starts the checks that run automatic backup while the app is open.
 */
export function AppConfigGate({ children }: { children: React.ReactNode }) {
  const [update, setUpdate] = useState<{ storeUrl: string; version: string } | null>(null);
  const lastChecked = useRef(0);

  const check = useCallback(async (force = false) => {
    if (!force && !__DEV__ && lastChecked.current > 0 && Date.now() - lastChecked.current < COOLDOWN_MS) return;
    try {
      const { forceUpdate } = await fetchRemoteAppConfig();
      setUpdate(forceUpdate.required ? { storeUrl: forceUpdate.storeUrl, version: forceUpdate.versionName } : null);
      lastChecked.current = Date.now();
    } catch (e) {
      if (__DEV__) LoggerService.warn('APP_CONFIG', 'Could not read the remote settings', e);
    }
  }, []);

  useEffect(() => {
    const hideSplash = () => void SplashScreen.hideAsync().catch(() => undefined);
    void withDeadline(initRemoteConfig().then(() => check(true)), INIT_DEADLINE_MS)
      .catch((e) => { if (__DEV__) LoggerService.warn('APP_CONFIG', 'Remote settings did not start', e); })
      .finally(() => {
        if (AppState.currentState === 'active') {
          hideSplash();
          return;
        }
        // Launched in the background: the launch screen comes down when the app is first seen.
        const waiting = AppState.addEventListener('change', (state) => {
          if (state !== 'active') return;
          waiting.remove();
          hideSplash();
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

  return update ? <ForceUpdateScreen storeUrl={update.storeUrl} version={update.version} /> : <>{children}</>;
}
