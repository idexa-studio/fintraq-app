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
  background: '#1E1F24', // Lighter slate/charcoal background for reversed contrast
  card: '#0C0D0F',       // Premium deep obsidian black (darker than background)
  surface: '#15161A',    // Deep dark gray for inputs/chips (stands out inside card)

  primary: '#10B981',       // Vibrant premium emerald green
  primaryLight: '#34D399',  // Soft mint green
  primaryDark: '#047857',   // Deep forest green
  secondary: '#E6F4EA',     // Premium mint-white tint for ambient effects

  text: '#FFFFFF',          // Crisp white text
  textMuted: '#94A3B8',     // Sleek slate-gray for muted text

  border: 'transparent',

  success: '#10B981',
  danger: '#F43F5E',
  warning: '#F59E0B',
  info: '#3B82F6',
};

export const LIGHT_THEME: ThemePalette = {
  background: '#F2F2F7',
  card: '#FAFAFA',
  surface: '#FFFFFF',

  primary: '#047857',
  primaryLight: '#059669',
  primaryDark: '#065F46',
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
