import { ThemeProvider, needsSystemFont } from '@/design';
import { useAppLanguage, useSettings } from '@/features/settings';
import React from 'react';
import { useColorScheme } from 'react-native';

/**
 * Gives the design system the user's choices: light or dark from the saved
 * appearance setting (or the phone's, when set to follow it), and the type
 * ramp that can draw the app's language.
 */
export function AppTheme({ children }: { children: React.ReactNode }) {
  const { profile } = useSettings();
  const { resolvedLanguage } = useAppLanguage();
  const system = useColorScheme();
  const scheme = profile.theme === 'system' ? (system === 'dark' ? 'dark' : 'light') : profile.theme;
  return <ThemeProvider scheme={scheme} script={needsSystemFont(resolvedLanguage) ? 'system' : 'latin'}>{children}</ThemeProvider>;
}
