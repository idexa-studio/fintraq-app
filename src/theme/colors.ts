export type ThemePalette = {
  /** Page/screen background — lowest layer */
  background: string;
  /** Subtle card fill — sits one layer above background */
  card: string;
  /** Component surface fill — chips, inputs, rows */
  surface: string;
  /** Bottom navigation bar background with proper contrast */
  tabBarBackground: string;
  /** Hero card fill: a mid evergreen in both themes, lighter than the ink surfaces, so the
   *  headline card is the one green moment on a screen. Text on it uses onInk / onInkMuted. */
  heroSurface: string;
  /** Accents on the hero. Plain primary/danger/info lose contrast on its mid-green, so the hero has
   *  its own lighter set: income / up (mint), expense / down (rose), transfer (sky). */
  onHeroPositive: string;
  onHeroNegative: string;
  onHeroInfo: string;

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

// Evergreen: one calm emerald on sage-tinted neutrals. Every neutral shares a faint green hue so
// paper, ink and charcoal read as the same material, and the accent never has to shout. Accents
// are de-saturated from pure neon; each text colour clears WCAG AA on the layers it sits on.

export const DARK_THEME: ThemePalette = {
  background: '#111412',
  card: '#262B28',
  surface: '#191D1B',
  tabBarBackground: '#202422',
  heroSurface: '#234A3B',
  onHeroPositive: '#8EE3B5',
  onHeroNegative: '#FFA49C',
  onHeroInfo: '#A9CBF2',

  primary: '#39C684',
  primaryLight: '#193427',
  primaryDark: '#2BA16E',
  primaryInk: '#66CC99',
  primaryForeground: '#0A0D0B',
  secondary: '#E8EAE6',

  onInk: '#FFFFFF',
  onInkMuted: 'rgba(255, 255, 255, 0.62)',
  onInkAccent: '#39C684',
  onColor: '#FFFFFF',

  text: '#E8EAE6',
  textMuted: '#9AA19C',

  border: '#303532',

  success: '#59C08C',
  danger: '#E87C73',
  warning: '#E0BB7B',
  info: '#85AFE0',
};

export const LIGHT_THEME: ThemePalette = {
  background: '#F3F4F0',
  card: '#E9EBE6',
  surface: '#FFFFFF',
  tabBarBackground: '#151917',
  heroSurface: '#265040',
  onHeroPositive: '#8EE3B5',
  onHeroNegative: '#FFA49C',
  onHeroInfo: '#A9CBF2',

  primary: '#1FB270',
  primaryLight: '#DBF0E5',
  primaryDark: '#18915E',
  primaryInk: '#146B4A',
  primaryForeground: '#0A0D0B',
  secondary: '#151917',

  onInk: '#FFFFFF',
  onInkMuted: 'rgba(255, 255, 255, 0.62)',
  onInkAccent: '#39C684',
  onColor: '#FFFFFF',

  text: '#171A18',
  textMuted: '#686D68',

  border: '#DFE2DC',

  success: '#1D7C50',
  danger: '#BA4136',
  warning: '#8F5C0F',
  info: '#2E669E',
};

export type ThemeColors = ThemePalette;

// kLimeBlack — fixed contrast color for text/icons rendered on top of the lime
// primary emerald. The accent is always bright enough that this stays dark regardless of theme.
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