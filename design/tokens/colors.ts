/**
 * Colour roles. Every value in the light palette was sampled from the
 * reference screens; the dark palette is derived from it (no dark reference
 * exists) by inverting ink and paper and keeping the greens.
 */
export type ColorRoles = {
  /** Page. */
  background: string;
  /** Cards, sheets, fields, the tab bar. */
  surface: string;
  /** A resting or unavailable surface: upcoming steps, dialog and sheet headers. */
  surfaceMuted: string;
  /** Primary content. */
  text: string;
  /** Secondary content: descriptions, field labels. */
  textMuted: string;
  /** Outline of fields, chips, radios and secondary buttons. */
  border: string;
  /** Hairline between rows and between a card and its actions. */
  divider: string;
  /** Fill of the one main action, and of selected chips. */
  action: string;
  onAction: string;
  /** Fill and label of an action that cannot be used yet. */
  disabled: string;
  onDisabled: string;
  /**
   * Vivid green: badges, the active tab mark, the spinner, a switch that is on.
   * Never text. It is nearly as light as white (1.7:1), so on a light surface a
   * shape filled with it always carries a `border` outline or sits beside black.
   */
  accent: string;
  onAccent: string;
  /** Outline of the current or selected item, and green that is safe as text. */
  selected: string;
  /** Brand greens, darkest to lightest, for brand moments and illustration. */
  brandDeep: string;
  brand: string;
  brandBright: string;
  /** Pale green behind an illustration. */
  /** Money in. Money out stays in `text`, with a minus sign. */
  positive: string;
  danger: string;
  onDanger: string;
  warning: string;
  /** Behind dialogs and sheets. */
  scrim: string;
};

export const LIGHT_COLORS: ColorRoles = {
  background: '#F1F1F1',
  surface: '#FFFFFF',
  surfaceMuted: '#F9F9F9',
  text: '#000000',
  textMuted: '#636363',
  border: '#000000',
  divider: '#C7C7C7',
  action: '#000000',
  onAction: '#FFFFFF',
  disabled: '#C9C9C9',
  // Sampled as #717171; one step darker so it reaches 3:1 on the disabled fill.
  onDisabled: '#6E6E6E',
  accent: '#0AE449',
  onAccent: '#000000',
  selected: '#109062',
  brandDeep: '#016A4D',
  brand: '#11B67A',
  brandBright: '#6CF579',
  positive: '#0B7A53',
  // Dark enough to read as text on the grey page (4.6:1) as well as on white.
  danger: '#D02B1B',
  onDanger: '#FFFFFF',
  warning: '#B25E00',
  scrim: 'rgba(0, 0, 0, 0.5)',
};

export const DARK_COLORS: ColorRoles = {
  background: '#000000',
  surface: '#1A1A1A',
  surfaceMuted: '#111111',
  text: '#FFFFFF',
  textMuted: '#A6A6A6',
  border: '#FFFFFF',
  divider: '#3D3D3D',
  action: '#FFFFFF',
  onAction: '#000000',
  disabled: '#3A3A3A',
  onDisabled: '#8C8C8C',
  accent: '#0AE449',
  onAccent: '#000000',
  selected: '#2BC48B',
  brandDeep: '#016A4D',
  brand: '#11B67A',
  brandBright: '#6CF579',
  positive: '#4FDB9A',
  danger: '#FF6B5C',
  onDanger: '#000000',
  warning: '#FBB369',
  scrim: 'rgba(0, 0, 0, 0.7)',
};

/**
 * Pastel fills for icon circles, sampled from the reference. The icon on top
 * is always black, in both themes.
 */
export const PASTELS = {
  lilac: '#A59EFE',
  pink: '#F4B7EE',
  orange: '#FBB369',
  teal: '#9FE9E0',
  green: '#6CF579',
} as const;

export type PastelName = keyof typeof PASTELS;

/** What shows above a task sheet on Android: black, in both themes. */
export const BACKDROP = '#000000';

/** Black, for content drawn on a pastel or on the accent green in either theme. */
export const INK = '#000000';

/** How much white is mixed into a saved colour to make it a pastel. */
const PASTEL_WHITE = 0.62;

/**
 * A user's saved colour as a pastel of the same hue. Saved colours were
 * picked to sit behind white icons and are too dark for a black glyph; mixed
 * with white they join the pastel family and the glyph stays readable.
 */
export function pastelOf(hex: string): string {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!match) return hex;
  const value = Number.parseInt(match[1], 16);
  const mix = (channel: number) => Math.round(channel + (255 - channel) * PASTEL_WHITE);
  const [r, g, b] = [mix((value >> 16) & 255), mix((value >> 8) & 255), mix(value & 255)];
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
