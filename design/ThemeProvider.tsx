import { DARK_COLORS, LIGHT_COLORS } from '@/design/tokens/colors';
import type { ColorRoles } from '@/design/tokens/colors';
import { BORDER, MOTION, RADIUS, SIZE, SPACE } from '@/design/tokens/metrics';
import { FONTS, MAX_FONT_SCALE, TYPE, TYPE_SYSTEM } from '@/design/tokens/typography';
import type { TypeRamp } from '@/design/tokens/typography';
import React, { createContext, useContext, useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

export type Scheme = 'light' | 'dark';

/** latin: the bundled faces. system: the phone's own font, for scripts the bundled faces cannot draw. */
export type Script = 'latin' | 'system';

export type Theme = {
  scheme: Scheme;
  isDark: boolean;
  colors: ColorRoles;
  script: Script;
  type: TypeRamp;
  fonts: typeof FONTS;
  space: typeof SPACE;
  radius: typeof RADIUS;
  border: typeof BORDER;
  size: typeof SIZE;
  motion: typeof MOTION;
};

const buildTheme = (scheme: Scheme, script: Script): Theme => ({
  scheme,
  script,
  isDark: scheme === 'dark',
  colors: scheme === 'dark' ? DARK_COLORS : LIGHT_COLORS,
  type: script === 'system' ? TYPE_SYSTEM : TYPE,
  fonts: FONTS,
  space: SPACE,
  radius: RADIUS,
  border: BORDER,
  size: SIZE,
  motion: MOTION,
});

const THEMES: Record<Scheme, Record<Script, Theme>> = {
  light: { latin: buildTheme('light', 'latin'), system: buildTheme('light', 'system') },
  dark: { latin: buildTheme('dark', 'latin'), system: buildTheme('dark', 'system') },
};

const ThemeContext = createContext<Theme>(THEMES.light.latin);

/** Every component reads its tokens here. */
export const useTheme = () => useContext(ThemeContext);

type ThemeProviderProps = {
  scheme: Scheme;
  /** From the app's language: `needsSystemFont(language) ? 'system' : 'latin'`. */
  script?: Script;
  children: React.ReactNode;
};

/**
 * Supplies the tokens for one colour scheme. It holds no app state: whoever
 * mounts it decides the scheme (the user's setting, or a gallery preview).
 */
export function ThemeProvider({ scheme, script = 'latin', children }: ThemeProviderProps) {
  const theme = useMemo(() => THEMES[scheme][script], [scheme, script]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

/** Memoised styles from a `createStyles(theme)` factory declared at module level. */
export function useStyles<T>(createStyles: (theme: Theme) => T): T {
  const theme = useTheme();
  return useMemo(() => createStyles(theme), [createStyles, theme]);
}

/**
 * How much to enlarge text for the phone's font-size setting, capped at
 * MAX_FONT_SCALE. Text applies this to its size and line height together and
 * turns the platform's own scaling off: left to the platform, Android enlarges
 * the letters but not a fixed line height, which clips them.
 */
export function useFontScale(): number {
  const { fontScale } = useWindowDimensions();
  return Math.min(Math.max(fontScale, 1), MAX_FONT_SCALE);
}
