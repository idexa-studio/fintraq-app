import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { DatabaseProvider } from '@/src/providers/DatabaseProvider';
import { OnboardingProvider } from '@/src/providers/OnboardingProvider';
import { QueryProvider } from '@/src/providers/QueryProvider';
import { SettingsProvider } from '@/src/providers/SettingsProvider';
import { PremiumProvider } from '@/src/providers/PremiumProvider';
import { ThemeProvider as CustomThemeProvider } from '@/src/providers/ThemeProvider';
import { NotificationService } from '@/src/services/notification.service';
import { useFonts } from 'expo-font';
import { Text, TextInput } from 'react-native';

const customizeText = () => {
  const customTextProps = {
    style: { fontFamily: 'GoogleSans_Regular' }
  };
  // @ts-ignore
  if (Text.defaultProps) { Text.defaultProps.style = customTextProps.style; } else { Text.defaultProps = customTextProps; }
  // @ts-ignore
  if (TextInput.defaultProps) { TextInput.defaultProps.style = customTextProps.style; } else { TextInput.defaultProps = customTextProps; }
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [fontsLoaded] = useFonts({
    GoogleSans_Regular: require('../assets/fonts/GoogleSanaFlex/Regular.ttf'),
    GoogleSans_Medium: require('../assets/fonts/GoogleSanaFlex/Medium.ttf'),
    GoogleSans_SemiBold: require('../assets/fonts/GoogleSanaFlex/SemiBold.ttf'),
    GoogleSans_Bold: require('../assets/fonts/GoogleSanaFlex/Bold.ttf'),
  });

  if (!fontsLoaded) return null;

  NotificationService.init();

  customizeText();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryProvider>
        <DatabaseProvider>
          <SettingsProvider>
            <PremiumProvider>
              <OnboardingProvider>
                <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                  <CustomThemeProvider>
                    <Stack screenOptions={{ headerShown: false }}>
                      {/* Rely on auto-resolution for groups */}
                    </Stack>
                    <StatusBar style="auto" />
                  </CustomThemeProvider>
                </ThemeProvider>
              </OnboardingProvider>
            </PremiumProvider>
          </SettingsProvider>
        </DatabaseProvider>
      </QueryProvider>
    </GestureHandlerRootView>
  );
}
