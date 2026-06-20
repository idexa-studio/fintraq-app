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