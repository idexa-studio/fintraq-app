import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { DARK_THEME, getHeroColors, HeroCardPalette, LIGHT_THEME, PICKER_CONTRAST_COLOR, ThemeColors } from '../theme/colors';

export type { ThemeColors };
import {
  COMPONENT_SIZES,
  LAYOUT,
  OVERLAY,
  radius,
  RadiusToken,
  shadow,
  ShadowToken,
  spacing,
  SpacingToken,
} from '../theme/tokens';
import { TYPOGRAPHY } from '../theme/typography';
import { useSettings } from './SettingsProvider';

export type { HeroCardPalette };

export type ThemeContextType = {
  /** Theme-dependent palette (switches with light/dark mode) */
  colors: ThemeColors;
  isDark: boolean;
  /** Pre-computed hero card colour palette — use instead of importing getHeroColors directly */
  heroCard: HeroCardPalette;
  /** Theme-aware overlay used behind modals/sheets */
  overlay: { dim: string; dark: string };
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
  heroCard: getHeroColors(true, DARK_THEME.primary, DARK_THEME.primaryDark, DARK_THEME.text, DARK_THEME.textMuted),
  overlay: OVERLAY.dark,
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

  const overlay = useMemo(() => isDark ? OVERLAY.dark : OVERLAY.light, [isDark]);

  const heroCard = useMemo(
    () => getHeroColors(isDark, colors.primary, colors.primaryDark, colors.text, colors.textMuted),
    [isDark, colors.primary, colors.primaryDark, colors.text, colors.textMuted],
  );

  const contextValue = useMemo<ThemeContextType>(() => ({
    colors,
    isDark,
    heroCard,
    overlay,
    onAccent: PICKER_CONTRAST_COLOR,
    typography: TYPOGRAPHY,
    sizes: COMPONENT_SIZES,
    layout: LAYOUT,
    spacing,
    radius,
    shadow,
  }), [colors, isDark, heroCard, overlay]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
});
