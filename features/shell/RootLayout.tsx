import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { QueryProvider } from '@/data/QueryProvider';
import { SettingsProvider , I18nProvider } from '@/features/settings';
import { NotificationService } from '@/platform/notifications/notifications';
import { ReviewPromptService } from '@/platform/config/review-prompt';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

import { LocalMigrationService } from '@/data/db/local-migration';
import { unlockDatabaseIfLocked } from '@/data/db/client';
// Side-effect import: must run unconditionally at module load so
// TaskManager.defineTask is registered before the OS can headlessly relaunch
// the JS engine to run the background backup task.
import { syncBackgroundBackupTask } from '@/platform/backup/background-backup.task';
import { AppState, AppStateStatus, useColorScheme } from 'react-native';
import { FONT_ASSETS, SHEET_ROUTE, ToastProvider } from '@/design';
import { LockProvider } from '@/features/lock';
import { OnboardingProvider } from '@/features/onboarding';
import { ProEndedNotice, ProProvider } from '@/features/pro';
import { AppConfigGate } from '@/features/shell/AppConfigGate';
import { AppTheme } from '@/features/shell/AppTheme';
import { DatabaseGate } from '@/features/shell/DatabaseGate';
import { LaunchScreen } from '@/features/shell/LaunchScreen';
import { SystemNavBackdrop } from '@/features/shell/SystemNavBackdrop';
import { TelemetryGate } from '@/features/shell/TelemetryGate';
import React, { useEffect, useState } from 'react';
import { LoggerService } from '@/shared/logging/logger';

// The phone's own splash stays until the launch screen is drawn, which then takes it down.
SplashScreen.preventAutoHideAsync().catch(() => {});

/**
 * The app, from the outside in: the database, settings and language, who is Pro, telemetry, first
 * run, the theme, the lock, remote configuration, and then the screens. `app/_layout.tsx` is this.
 */
export function RootLayout() {
  const colorScheme = useColorScheme();
  const [migrationReady, setMigrationReady] = useState(false);
  const [launched, setLaunched] = useState(false);

  const [fontsLoaded] = useFonts(FONT_ASSETS);

  useEffect(() => {
    async function runMigration() {
      // Must run before any SQLite connection is opened — opening the
      // fintraq.db file first would make LocalMigrationService's
      // `!fintraqDbFile.exists` check always true, silently skipping the
      // legacy Luno/Keep → Fintraq data migration for existing users.
      await LocalMigrationService.execute();
      unlockDatabaseIfLocked();
      setMigrationReady(true);
    }
    runMigration();

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        unlockDatabaseIfLocked();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    LoggerService.info('APP_LIFECYCLE', 'App launched');
    NotificationService.init();
    void syncBackgroundBackupTask();
    ReviewPromptService.ensureFirstLaunchRecorded();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {fontsLoaded && migrationReady ? (
        <SafeAreaProvider>
          <QueryProvider>
            <DatabaseGate>
              <SettingsProvider>
                <I18nProvider>
                  <ProProvider>
                    <TelemetryGate>
                      <OnboardingProvider>
                        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                          <AppTheme>
                            <LockProvider>
                              <AppConfigGate onReady={() => setLaunched(true)}>
                                <ToastProvider>
                                  <Stack screenOptions={{ headerShown: false, animation: 'ios_from_right' }}>
                                    {/* Listed first on purpose: the first screen named here is where the app starts when
                                        no link says otherwise. With a task first, a reload opened Add expense over Home. */}
                                    <Stack.Screen name="(main)" />
                                    {/* Tasks rise over the screen they were started from. */}
                                    <Stack.Screen name="add" options={SHEET_ROUTE} />
                                    <Stack.Screen name="pro" options={SHEET_ROUTE} />
                                    <Stack.Screen name="transactions/[id]/edit" options={SHEET_ROUTE} />
                                    <Stack.Screen name="transactions/[id]" options={SHEET_ROUTE} />
                                  </Stack>
                                  <ProEndedNotice />
                                </ToastProvider>
                                <SystemNavBackdrop />
                                <StatusBar style="auto" />
                              </AppConfigGate>
                            </LockProvider>
                          </AppTheme>
                        </ThemeProvider>
                      </OnboardingProvider>
                    </TelemetryGate>
                  </ProProvider>
                </I18nProvider>
              </SettingsProvider>
            </DatabaseGate>
          </QueryProvider>
        </SafeAreaProvider>
      ) : null}
      {/* Over everything until the app behind it is ready. */}
      <LaunchScreen named={fontsLoaded} ready={launched} />
    </GestureHandlerRootView>
  );
}
