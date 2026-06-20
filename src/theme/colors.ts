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
  background: '#11131A',
  card: '#171A22',
  surface: '#1F2430',
  tabBarBackground: '#171A22',

  primary: '#8DBDFF',
  primaryLight: '#1E2C42',
  primaryDark: '#5A9CFF',
  secondary: '#D7E7FF',

  text: '#F3F6FB',
  textMuted: '#A8B3C7',

  border: 'transparent',

  success: '#7FE3AA',
  danger: '#FFB4AB',
  warning: '#F2C66D',
  info: '#A9C7FF',
};

export const LIGHT_THEME: ThemePalette = {
  background: '#F6F8FB',
  card: '#EEF3F6',
  surface: '#FFFFFF',
  tabBarBackground: '#FFFFFF',

  primary: '#205FA8',
  primaryLight: '#DCEBFF',
  primaryDark: '#174C87',
  secondary: '#102033',

  text: '#182129',
  textMuted: '#5F6B7A',

  border: 'transparent',

  success: '#126B43',
  danger: '#B3261E',
  warning: '#8A5B00',
  info: '#205FA8',
};

export type ThemeColors = ThemePalette;

// Fixed contrast color for icons/checkmarks rendered on top of bright user-selected
// picker swatches (account/category colors). These swatches are always vivid/light,
// so this must always be dark regardless of the active theme.
export const PICKER_CONTRAST_COLOR = '#000100';
