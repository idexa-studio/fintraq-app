export type ThemePalette = {
  /** Page/screen background — lowest layer */
  background: string;
  /** Subtle card fill — sits one layer above background */
  card: string;
  /** Component surface fill — chips, inputs, rows */
  surface: string;
  /** Bottom navigation bar background with proper contrast */
  tabBarBackground: string;

  /** Brand accent — buttons, active states, highlights */
  primary: string;
  /** Lighter tint of primary — hover/glow effects */
  primaryLight: string;
  /** Darker shade of primary — pressed states, depth circles */
  primaryDark: string;
  /** Text/icon color for elements rendered ON a primary-colored surface.
   *  Always dark (#0A0A0A) because the lime green primary is always vivid/bright. */
  primaryForeground: string;
  /** Ambient inverse color — used for background blur/glow circles */
  secondary: string;

  /** Primary text color */
  text: string;
  /** Secondary / helper text color */
  textMuted: string;

  /** Edge color — transparent by design (edgeless UI) */
  border: string;

  /** Positive / income state */
  success: string;
  /** Negative / error / destructive state */
  danger: string;
  /** Caution / notice state */
  warning: string;
  /** Informational / neutral state */
  info: string;
};

export const DARK_THEME: ThemePalette = {
  background: '#141412',
  card: '#2A2A25',
  surface: '#1C1C1A',
  tabBarBackground: '#1C1C1A',

  primary: '#00CC6A',
  primaryLight: '#00331A',
  primaryDark: '#009950',
  primaryForeground: '#0A0A0A',
  secondary: '#E8E7E1',

  text: '#E8E7E1',
  textMuted: '#9A9993',

  border: '#3A3A35',

  success: '#34C97A',
  danger: '#FF5449',
  warning: '#F2C66D',
  info: '#9A9993',
};

export const LIGHT_THEME: ThemePalette = {
  background: '#F5F4EE',
  card: '#EEEDE7',
  surface: '#FFFFFF',
  tabBarBackground: '#0A0A0A',

  primary: '#00CC6A',
  primaryLight: '#CCFFE8',
  primaryDark: '#009950',
  primaryForeground: '#0A0A0A',
  secondary: '#0A0A0A',

  text: '#0A0A0A',
  textMuted: '#6B6A65',

  border: '#D4D3CC',

  success: '#22A45D',
  danger: '#E53935',
  warning: '#B87D00',
  info: '#6B6A65',
};

export type ThemeColors = ThemePalette;

// kLimeBlack — fixed contrast color for text/icons rendered on top of the lime
// primary (#00CC6A). Lime is always vivid/bright so this stays dark regardless of theme.
export const PICKER_CONTRAST_COLOR = '#0A0A0A';

export type HeroCardPalette = {
  background: string;
  backgroundDark: string;
  textPrimary: string;
  textMuted: string;
  separator: string;
  income: string;
  expense: string;
  decoOverlay: string;
  glowLight: string;
};

export function getHeroColors(
  isDark: boolean,
  primary: string,
  primaryDark: string,
  text: string,
  textMuted: string
): HeroCardPalette {
  if (isDark) {
    return {
      background: '#008040', // Deep emerald green for dark mode balance backing
      backgroundDark: '#006633', // Deep forest green
      textPrimary: '#FFFFFF', // Pure white for perfect contrast
      textMuted: '#D1FADF', // Soft bright mint-white for highly legible labels
      separator: 'rgba(255, 255, 255, 0.15)',
      income: '#00FF88', // Bright mint/green indicator
      expense: '#FF8F8F', // Bright coral/red indicator
      decoOverlay: 'rgba(255, 255, 255, 0.08)',
      glowLight: 'rgba(255, 255, 255, 0.03)',
    };
  } else {
    return {
      background: primary, // #00CC6A (bright primary green)
      backgroundDark: primaryDark, // #009950
      textPrimary: '#0A0A0A', // Deep black text for readability
      textMuted: '#1E3A2B', // Dark forest green for label contrast
      separator: 'rgba(0, 0, 0, 0.08)',
      income: '#00602F', // Dark green indicator
      expense: '#9E0000', // Dark red indicator
      decoOverlay: 'rgba(0, 0, 0, 0.06)',
      glowLight: 'rgba(255, 255, 255, 0.04)',
    };
  }
}