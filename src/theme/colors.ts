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

  primary: '#B0C443',
  primaryLight: '#C4D65A',
  primaryDark: '#95A830',
  secondary: '#F4F7E8',

  text: '#F5F5F5',
  textMuted: '#A3A3A3',

  border: 'transparent',

  success: '#22C55E',
  danger: '#EF4444',
  warning: '#EAB308',
  info: '#3B82F6',
};

export const LIGHT_THEME: ThemePalette = {
  background: '#FCFCF9',
  card: '#F9F9F6',
  surface: '#F5F5F2',

  primary: '#8A9D16',
  primaryLight: '#A0B41E',
  primaryDark: '#71800E',
  secondary: '#1A1B18',

  text: '#171717',
  textMuted: '#737373',

  border: 'transparent',

  success: '#16A34A',
  danger: '#DC2626',
  warning: '#CA8A04',
  info: '#2563EB',
};

export type ThemeColors = ThemePalette;

// Fixed contrast color for icons/checkmarks rendered on top of bright user-selected
// picker swatches (account/category colors). These swatches are always vivid/light,
// so this must always be dark regardless of the active theme.
export const PICKER_CONTRAST_COLOR = '#000100';
