import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { AppConfigProvider } from '@/src/providers/AppConfigProvider';
import { AppLockProvider } from '@/src/providers/AppLockProvider';
import { TelemetryProvider } from '@/src/providers/TelemetryProvider';
import { OnboardingProvider } from '@/src/providers/OnboardingProvider';
import { PremiumProvider } from '@/src/providers/PremiumProvider';
import { QueryProvider } from '@/data/QueryProvider';
import { SettingsProvider , I18nProvider } from '@/features/settings';
import { ThemeProvider as CustomThemeProvider } from '@/src/providers/ThemeProvider';
import { NotificationService } from '@/platform/notifications/notifications';
import { ReviewPromptService } from '@/platform/config/review-prompt';
import { useFonts } from 'expo-font';
import { SystemNavBackdrop } from '@/src/components/ui/SystemNavBackdrop';
import * as SplashScreen from 'expo-splash-screen';

import { LocalMigrationService } from '@/data/db/local-migration';
import { unlockDatabaseIfLocked } from '@/data/db/client';
// Side-effect import: must run unconditionally at module load so
// TaskManager.defineTask is registered before the OS can headlessly relaunch
// the JS engine to run the background backup task.
import { syncBackgroundBackupTask } from '@/platform/backup/background-backup.task';
import { AppState, AppStateStatus } from 'react-native';
import { FONT_ASSETS, SHEET_ROUTE, ToastProvider } from '@/design';
import { ProProvider } from '@/features/pro';
import { AppTheme, DatabaseGate } from '@/features/shell';
import React, { useEffect, useState } from 'react';
import { LoggerService } from '@/shared/logging/logger';

// Prevent the splash screen from auto-hiding before version check completes
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [migrationReady, setMigrationReady] = useState(false);

  const [fontsLoaded] = useFonts({
    MuseoModerno_Bold: require('../assets/fonts/MuseoModerno/MuseoModerno-Bold.ttf'),
    MuseoModerno_Regular: require('../assets/fonts/MuseoModerno/MuseoModerno-Regular.ttf'),
    MuseoModerno_Medium: require('../assets/fonts/MuseoModerno/MuseoModerno-Medium.ttf'),
    MuseoModerno_SemiBold: require('../assets/fonts/MuseoModerno/MuseoModerno-SemiBold.ttf'),
    ...FONT_ASSETS,
  });

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

  if (!fontsLoaded || !migrationReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryProvider>
          <DatabaseGate>
            <SettingsProvider>
              <I18nProvider>
              <PremiumProvider>
              <ProProvider>
                <TelemetryProvider>
                  <OnboardingProvider>
                    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                      <CustomThemeProvider>
                        <AppTheme>
                          <AppLockProvider>
                            <AppConfigProvider>
                              <ToastProvider>
                                <Stack screenOptions={{ headerShown: false, animation: 'ios_from_right' }}>
                                  {/* Listed first on purpose: the first screen named here is where the app starts when
                                      no link says otherwise. With a task first, a reload opened Add expense over Home. */}
                                  <Stack.Screen name="(main)" />
                                  {/* Tasks rise over the screen they were started from. */}
                                  <Stack.Screen name="add" options={SHEET_ROUTE} />
                                  <Stack.Screen name="transactions/[id]/edit" options={SHEET_ROUTE} />
                                  <Stack.Screen name="transactions/[id]" options={SHEET_ROUTE} />
                                </Stack>
                              </ToastProvider>
                              <SystemNavBackdrop />
                              <StatusBar style="auto" />
                            </AppConfigProvider>
                          </AppLockProvider>
                        </AppTheme>
                      </CustomThemeProvider>
                    </ThemeProvider>
                  </OnboardingProvider>
                </TelemetryProvider>
              </ProProvider>
              </PremiumProvider>
              </I18nProvider>
            </SettingsProvider>
          </DatabaseGate>
        </QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
