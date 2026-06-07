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
  background: '#1E1F24', // Lighter slate/charcoal background for reversed contrast
  card: '#0C0D0F',       // Premium deep obsidian black (darker than background)
  surface: '#15161A',    // Deep dark gray for inputs/chips (stands out inside card)
  tabBarBackground: '#2A2B36', // Slightly lighter slate/charcoal for dark mode tab contrast

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
  background: '#EDF0F3', // Soft clean light gray (darkest light layer)
  card: '#F5F7FA',       // Premium light slate card (lighter than background)
  surface: '#FFFFFF',    // Crisp white for inputs/chips (lightest layer, stands out inside card)
  tabBarBackground: '#E4E8EC', // Slightly darker slate-gray for light mode tab contrast

  primary: '#059669',       // Premium rich emerald green
  primaryLight: '#D1FAE5',  // Very soft mint tint (great for badges)
  primaryDark: '#064E3B',   // Deep dark forest green
  secondary: '#0F172A',     // Slate-black ambient accent

  text: '#0F172A',          // Deep premium slate-black text
  textMuted: '#64748B',     // Elegant neutral slate-gray for muted text

  border: 'transparent',

  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
};

export type ThemeColors = ThemePalette;

// Fixed contrast color for icons/checkmarks rendered on top of bright user-selected
// picker swatches (account/category colors). These swatches are always vivid/light,
// so this must always be dark regardless of the active theme.
export const PICKER_CONTRAST_COLOR = '#000100';
