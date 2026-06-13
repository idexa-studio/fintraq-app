import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { DatabaseProvider } from '@/src/providers/DatabaseProvider';
import { OnboardingProvider } from '@/src/providers/OnboardingProvider';
import { QueryProvider } from '@/src/providers/QueryProvider';
import { SettingsProvider } from '@/src/providers/SettingsProvider';
import { PremiumProvider } from '@/src/providers/PremiumProvider';
import { AppLockProvider } from '@/src/providers/AppLockProvider';
import { AppConfigProvider } from '@/src/providers/AppConfigProvider';
import { ThemeProvider as CustomThemeProvider } from '@/src/providers/ThemeProvider';
import { NotificationService } from '@/src/services/notification.service';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

import { LocalMigrationService } from '@/src/services/local-migration.service';
import React, { useState, useEffect } from 'react';

// Prevent the splash screen from auto-hiding before version check completes
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [migrationReady, setMigrationReady] = useState(false);

  const [fontsLoaded] = useFonts({
    GoogleSans_Bold: require('../assets/fonts/GoogleSanaFlex/Bold.ttf'),
    GoogleSans_Regular: require('../assets/fonts/GoogleSanaFlex/Regular.ttf'),
    GoogleSans_Medium: require('../assets/fonts/GoogleSanaFlex/Medium.ttf'),
    GoogleSans_SemiBold: require('../assets/fonts/GoogleSanaFlex/SemiBold.ttf'),
  });

  useEffect(() => {
    async function runMigration() {
      await LocalMigrationService.execute();
      setMigrationReady(true);
    }
    runMigration();
  }, []);

  if (!fontsLoaded || !migrationReady) return null;

  NotificationService.init();


  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryProvider>
          <DatabaseProvider>
            <SettingsProvider>
              <PremiumProvider>
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
              </PremiumProvider>
            </SettingsProvider>
          </DatabaseProvider>
        </QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
