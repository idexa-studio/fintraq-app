import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { DARK_THEME, LIGHT_THEME, PICKER_CONTRAST_COLOR, ThemeColors } from '../theme/colors';
import {
  COMPONENT_SIZES,
  LAYOUT,
  OVERLAY,
  radius,
  shadow,
  spacing,
  ShadowToken,
  SpacingToken,
  RadiusToken,
} from '../theme/tokens';
import { TYPOGRAPHY } from '../theme/typography';
import { useSettings } from './SettingsProvider';

export type ThemeContextType = {
  /** Theme-dependent palette (switches with light/dark mode) */
  colors: ThemeColors;
  isDark: boolean;
  /** Fixed dark overlay used behind modals/sheets */
  overlay: typeof OVERLAY;
  /** Always-dark colour for icons/checkmarks on user-chosen bright swatches */
  onAccent: string;
  /** Typography scale — font families, sizes, weights */
  typography: typeof TYPOGRAPHY;
  /** Component size presets — button, input, card, iconButton */
  sizes: typeof COMPONENT_SIZES;
  /** Screen-level layout constants — padding, gaps, icon sizes */
  layout: typeof LAYOUT;
  /** Spacing helper: spacing('4') → 16 */
  spacing: (token: SpacingToken) => number;
  /** Radius helper: radius('md') → 12 */
  radius: (token: RadiusToken) => number;
  /** Shadow helper: shadow('sm') → shadow style object */
  shadow: (token: ShadowToken) => object;
};

const defaultContext: ThemeContextType = {
  colors: DARK_THEME,
  isDark: true,
  overlay: OVERLAY,
  onAccent: PICKER_CONTRAST_COLOR,
  typography: TYPOGRAPHY,
  sizes: COMPONENT_SIZES,
  layout: LAYOUT,
  spacing,
  radius,
  shadow,
};

const ThemeContext = createContext<ThemeContextType>(defaultContext);

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = React.memo(function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useSettings();
  const systemColorScheme = useColorScheme();

  const isDark = profile.theme === 'system'
    ? systemColorScheme === 'dark'
    : profile.theme === 'dark';

  const colors = useMemo(() => isDark ? DARK_THEME : LIGHT_THEME, [isDark]);

  const contextValue = useMemo<ThemeContextType>(() => ({
    colors,
    isDark,
    overlay: OVERLAY,
    onAccent: PICKER_CONTRAST_COLOR,
    typography: TYPOGRAPHY,
    sizes: COMPONENT_SIZES,
    layout: LAYOUT,
    spacing,
    radius,
    shadow,
  }), [colors, isDark]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
});
