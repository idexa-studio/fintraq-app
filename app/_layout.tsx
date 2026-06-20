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
      await LocalMigrationService.execute();
      setMigrationReady(true);
    }
    runMigration();
  }, []);

  useEffect(() => {
    NotificationService.init();
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
