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
  /** Accessible brand green for TEXT and ICONS on background/surface
   *  (links, active chip labels, tonal buttons). The lime `primary` is a fill
   *  colour — as text it drops to ~2:1 on paper. */
  primaryInk: string;
  /** Text/icon color for elements rendered ON a primary-colored surface.
   *  Always dark (#0A0A0A) because the lime green primary is always vivid/bright. */
  primaryForeground: string;
  /** Ambient inverse color — used for background blur/glow circles */
  secondary: string;

  /** Text/icons on the ink surface (tabBarBackground): profile card, tips, dev badge. */
  onInk: string;
  onInkMuted: string;
  /** Lime accent for text/icons on the ink surface — full contrast there, unlike on paper. */
  onInkAccent: string;
  /** Glyphs on a user-chosen colour fill (category tile, swatch). */
  onColor: string;

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
  /** Informational accent — transfers, info alerts, neutral-but-active rows.
   *  Must stay a distinct hue from textMuted, otherwise every element using it
   *  renders as dead grey. */
  info: string;
};

// Polished around the original identity: lime brand, warm paper, ink.
// Neutrals share one warm hue so layers read as the same material at
// different depths; each dark layer steps ~4% lightness for even separation.

export const DARK_THEME: ThemePalette = {
  background: '#131311',
  card: '#2C2B27',
  surface: '#1E1D1A',
  tabBarBackground: '#262521',

  primary: '#00CC6A',
  primaryLight: '#0B2E1D',
  primaryDark: '#00A857',
  primaryInk: '#2EDB85',
  primaryForeground: '#0A0A08',
  secondary: '#EDEBE4',

  onInk: '#FFFFFF',
  onInkMuted: 'rgba(255, 255, 255, 0.62)',
  onInkAccent: '#00CC6A',
  onColor: '#FFFFFF',

  text: '#EDEBE4',
  textMuted: '#9C9A92',

  border: '#34332E',

  success: '#34C97A',
  danger: '#FF6159',
  warning: '#F2C66D',
  info: '#6AB0F0',
};

export const LIGHT_THEME: ThemePalette = {
  background: '#F5F4EE',
  card: '#ECEBE4',
  surface: '#FFFFFF',
  tabBarBackground: '#161612',

  primary: '#00CC6A',
  primaryLight: '#D3F6E3',
  primaryDark: '#00A857',
  primaryInk: '#00824A',
  primaryForeground: '#0A0A08',
  secondary: '#161612',

  onInk: '#FFFFFF',
  onInkMuted: 'rgba(255, 255, 255, 0.62)',
  onInkAccent: '#00CC6A',
  onColor: '#FFFFFF',

  text: '#161612',
  textMuted: '#6B6962',

  border: '#E2E0D8',

  success: '#16945A',
  danger: '#D93D34',
  warning: '#A86F00',
  info: '#1765AB',
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
  /** Transfer accent (entry form type switch). */
  transfer: string;
  /** Selected tab / input well on the hero — one step stronger than `separator`. */
  tileStrong: string;
  /** Placeholder text inside hero inputs. */
  placeholder: string;
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
      transfer: '#BFE0FF',
      tileStrong: 'rgba(255, 255, 255, 0.22)',
      placeholder: 'rgba(255, 255, 255, 0.45)',
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
      transfer: '#0B3D7A',
      tileStrong: 'rgba(0, 0, 0, 0.14)',
      placeholder: 'rgba(10, 10, 10, 0.35)',
      decoOverlay: 'rgba(0, 0, 0, 0.06)',
      glowLight: 'rgba(255, 255, 255, 0.04)',
    };
  }
}