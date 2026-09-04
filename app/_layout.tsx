import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppConfigProvider } from '@/src/providers/AppConfigProvider';
import { AppLockProvider } from '@/src/providers/AppLockProvider';
import { DatabaseProvider } from '@/src/providers/DatabaseProvider';
import { FirebaseProvider } from '@/src/providers/FirebaseProvider';
import { OnboardingProvider } from '@/src/providers/OnboardingProvider';
import { PremiumProvider } from '@/src/providers/PremiumProvider';
import { QueryProvider } from '@/src/providers/QueryProvider';
import { SettingsProvider } from '@/src/providers/SettingsProvider';
import { ThemeProvider as CustomThemeProvider } from '@/src/providers/ThemeProvider';
import { NotificationService } from '@/src/services/notification.service';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

import { LocalMigrationService } from '@/src/services/local-migration.service';
import { unlockDatabaseIfLocked } from '@/src/db/client';
// Side-effect import: must run unconditionally at module load so
// TaskManager.defineTask has registered the executor before the OS can ever
// headlessly relaunch the JS engine to run it (see file for details).
import { registerBackgroundBackupTaskAsync } from '@/src/services/backup/background-backup.task';
import { AppState } from 'react-native';
import React, { useEffect, useState } from 'react';

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

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        unlockDatabaseIfLocked();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    NotificationService.init();
    registerBackgroundBackupTaskAsync();
  }, []);

  if (!fontsLoaded || !migrationReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryProvider>
          <DatabaseProvider>
            <SettingsProvider>
              <PremiumProvider>
                <FirebaseProvider>
                  <OnboardingProvider>
                    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                      <CustomThemeProvider>
                          <AppLockProvider>
                            <AppConfigProvider>
                              <Stack screenOptions={{ headerShown: false }} />
                              <StatusBar style="auto" />
                            </AppConfigProvider>
                          </AppLockProvider>
                      </CustomThemeProvider>
                    </ThemeProvider>
                  </OnboardingProvider>
                </FirebaseProvider>
              </PremiumProvider>
            </SettingsProvider>
          </DatabaseProvider>
        </QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
