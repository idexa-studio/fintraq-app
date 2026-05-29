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
  background: '#0D0D0F',
  card: '#18181B',
  surface: '#252528',

  primary: '#B8D641',
  primaryLight: '#C5E055',
  primaryDark: '#9CB82D',
  secondary: '#F4F7E8',

  text: '#F0F0EB',
  textMuted: '#979994',

  border: 'transparent',

  success: '#2DCF8B',
  danger: '#EF4444',
  warning: '#EAB308',
  info: '#5B9EF5',
};

export const LIGHT_THEME: ThemePalette = {
  background: '#FCFCF9',
  card: '#F4F4F0',
  surface: '#EBEBE6',

  primary: '#9CB82D',
  primaryLight: '#B2D043',
  primaryDark: '#849925',
  secondary: '#1A1B18',

  text: '#1B1B18',
  textMuted: '#6B6B65',

  border: 'transparent',

  success: '#1EA371',
  danger: '#DC2626',
  warning: '#CA8A04',
  info: '#3B82F6',
};

export type ThemeColors = ThemePalette;

// Fixed contrast color for icons/checkmarks rendered on top of bright user-selected
// picker swatches (account/category colors). These swatches are always vivid/light,
// so this must always be dark regardless of the active theme.
export const PICKER_CONTRAST_COLOR = '#000100';
