export type ThemePalette = {
  /** Page/screen background — lowest layer */
  background: string;
  /** Subtle card fill — sits one layer above background */
  card: string;
  /** Component surface fill — chips, inputs, rows */
  surface: string;

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
  background: '#000100',
  card: 'rgba(255, 255, 255, 0.02)',
  surface: 'rgba(255, 255, 255, 0.05)',

  primary: '#B8D641',
  primaryLight: '#cae560',
  primaryDark: '#a0c119',
  secondary: '#f9fff3',

  text: '#fbfff3',
  textMuted: '#b2bb8b',

  border: 'transparent',

  success: '#0E9F6E',
  danger: '#B42318',
  warning: '#F59E0B',
  info: '#60A5FA',
};

export const LIGHT_THEME: ThemePalette = {
  background: '#F6FFF9',
  card: 'rgba(0, 0, 0, 0.02)',
  surface: 'rgba(0, 0, 0, 0.05)',

  primary: '#a6c13a',
  primaryLight: '#b9d253',
  primaryDark: '#8caa14',
  secondary: '#000100',

  text: '#000100',
  textMuted: '#737a5f',

  border: 'transparent',

  success: '#0E9F6E',
  danger: '#B42318',
  warning: '#D97706',
  info: '#2563EB',
};

export type ThemeColors = ThemePalette;

// Fixed contrast color for icons/checkmarks rendered on top of bright user-selected
// picker swatches (account/category colors). These swatches are always vivid/light,
// so this must always be dark regardless of the active theme.
export const PICKER_CONTRAST_COLOR = '#000100';
