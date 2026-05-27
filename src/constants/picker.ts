// ── Shared ────────────────────────────────────────────────────────────────────

export type IconGroup = {
  label: string;
  icons: readonly string[];
};

// ── Account ──────────────────────────────────────────────────────────────────

export const ACCOUNT_ICONS = [
  // Wallets & Cards
  'wallet-outline', 'card-outline', 'cash-outline', 'receipt-outline',
  'document-text-outline', 'shield-checkmark-outline', 'key-outline',
  'lock-closed-outline', 'id-card-outline',
  // Savings & Investments
  'diamond-outline', 'trending-up-outline', 'stats-chart-outline',
  'pie-chart-outline', 'analytics-outline', 'layers-outline', 'bar-chart-outline',
  'rocket-outline', 'pulse-outline',
  // Business & Work
  'briefcase-outline', 'business-outline', 'server-outline',
  'laptop-outline', 'archive-outline', 'calculator-outline',
  'desktop-outline', 'print-outline',
  // Goals
  'home-outline', 'car-outline', 'airplane-outline',
  'heart-outline', 'school-outline', 'trophy-outline',
  'flag-outline', 'compass-outline',
  // Other
  'phone-portrait-outline', 'globe-outline', 'people-outline',
  'leaf-outline', 'gift-outline', 'star-outline',
  'moon-outline', 'sunny-outline', 'cog-outline',
  'hammer-outline', 'flash-outline', 'water-outline',
] as const;

export type AccountIconName = (typeof ACCOUNT_ICONS)[number];

export const ACCOUNT_ICON_GROUPS: IconGroup[] = [
  {
    label: 'Wallets & Cards',
    icons: ['wallet-outline', 'card-outline', 'cash-outline', 'receipt-outline', 'document-text-outline', 'shield-checkmark-outline', 'key-outline', 'lock-closed-outline', 'id-card-outline'],
  },
  {
    label: 'Savings & Investments',
    icons: ['diamond-outline', 'trending-up-outline', 'stats-chart-outline', 'pie-chart-outline', 'analytics-outline', 'layers-outline', 'bar-chart-outline', 'rocket-outline', 'pulse-outline'],
  },
  {
    label: 'Business & Work',
    icons: ['briefcase-outline', 'business-outline', 'server-outline', 'laptop-outline', 'archive-outline', 'calculator-outline', 'desktop-outline', 'print-outline'],
  },
  {
    label: 'Goals',
    icons: ['home-outline', 'car-outline', 'airplane-outline', 'heart-outline', 'school-outline', 'trophy-outline', 'flag-outline', 'compass-outline'],
  },
  {
    label: 'Other',
    icons: ['phone-portrait-outline', 'globe-outline', 'people-outline', 'leaf-outline', 'gift-outline', 'star-outline', 'moon-outline', 'sunny-outline', 'cog-outline', 'hammer-outline', 'flash-outline', 'water-outline'],
  },
];

export type ColorOption = { readonly hex: string; readonly name: string };

export const PALETTE_COLOR_OPTIONS: readonly ColorOption[] = [
  // Greens & Teals
  { hex: '#15803D', name: 'Forest' },
  { hex: '#059669', name: 'Emerald' },
  { hex: '#0F766E', name: 'Teal' },
  { hex: '#0D9488', name: 'Cyan Teal' },
  // Blues
  { hex: '#0369A1', name: 'Ocean' },
  { hex: '#2563EB', name: 'Blue' },
  { hex: '#1D4ED8', name: 'Cobalt' },
  { hex: '#1E40AF', name: 'Navy' },
  // Indigo & Violet
  { hex: '#4338CA', name: 'Indigo' },
  { hex: '#4F46E5', name: 'Iris' },
  { hex: '#6D28D9', name: 'Violet' },
  { hex: '#7C3AED', name: 'Purple' },
  // Pink & Fuchsia
  { hex: '#7E22CE', name: 'Deep Purple' },
  { hex: '#A21CAF', name: 'Fuchsia' },
  { hex: '#BE185D', name: 'Pink' },
  { hex: '#DB2777', name: 'Hot Pink' },
  // Rose & Red
  { hex: '#BE123C', name: 'Crimson' },
  { hex: '#E11D48', name: 'Rose' },
  { hex: '#DC2626', name: 'Red' },
  { hex: '#B91C1C', name: 'Deep Red' },
  // Orange & Amber
  { hex: '#C2410C', name: 'Burnt Orange' },
  { hex: '#EA580C', name: 'Orange' },
  { hex: '#D97706', name: 'Amber' },
  { hex: '#B45309', name: 'Gold' },
  // Lime & Cyan
  { hex: '#4D7C0F', name: 'Olive' },
  { hex: '#65A30D', name: 'Lime' },
  { hex: '#0E7490', name: 'Cyan' },
  { hex: '#155E75', name: 'Deep Cyan' },
  // Neutral
  { hex: '#334155', name: 'Slate' },
  { hex: '#475569', name: 'Cool Gray' },
];

export const PALETTE_COLORS: readonly string[] = PALETTE_COLOR_OPTIONS.map((c) => c.hex);

export const ACCOUNT_COLORS = PALETTE_COLORS;

// ── Category ─────────────────────────────────────────────────────────────────

export const CATEGORY_ICONS = [
  // Finance & Money
  'cash-outline', 'wallet-outline', 'card-outline', 'briefcase-outline',
  'trending-up-outline', 'refresh-outline', 'receipt-outline',
  'document-text-outline', 'calculator-outline', 'layers-outline',
  // Food & Drink
  'fast-food-outline', 'restaurant-outline', 'cafe-outline',
  'pizza-outline', 'wine-outline', 'beer-outline', 'ice-cream-outline',
  'basket-outline', 'nutrition-outline', 'egg-outline',
  // Transport
  'car-outline', 'bus-outline', 'airplane-outline', 'train-outline',
  'bicycle-outline', 'boat-outline', 'speedometer-outline', 'locate-outline',
  'walk-outline', 'subway-outline',
  // Home & Utilities
  'home-outline', 'business-outline', 'flash-outline', 'wifi-outline',
  'build-outline', 'bed-outline', 'leaf-outline', 'water-outline',
  'thermometer-outline', 'flame-outline',
  // Health & Fitness
  'medkit-outline', 'bandage-outline', 'barbell-outline',
  'fitness-outline', 'heart-outline', 'pulse-outline',
  'accessibility-outline', 'body-outline',
  // Tech & Communication
  'phone-portrait-outline', 'hardware-chip-outline', 'globe-outline',
  'tablet-portrait-outline', 'headset-outline', 'cloud-outline',
  // Shopping & Lifestyle
  'bag-outline', 'cart-outline', 'repeat-outline', 'cut-outline',
  'shield-checkmark-outline', 'umbrella-outline', 'shirt-outline',
  // Entertainment & Hobbies
  'film-outline', 'game-controller-outline', 'musical-notes-outline',
  'camera-outline', 'color-palette-outline', 'book-outline',
  'football-outline', 'golf-outline',
  // Education
  'school-outline', 'library-outline', 'pencil-outline',
  // Personal & Social
  'person-outline', 'people-outline', 'happy-outline',
  'paw-outline', 'heart-circle-outline', 'gift-outline',
  'ribbon-outline', 'trophy-outline', 'chatbubbles-outline',
  // Misc
  'sparkles-outline', 'star-outline', 'bulb-outline',
  'grid-outline', 'ellipsis-horizontal-outline',
  'time-outline', 'alarm-outline', 'moon-outline', 'sunny-outline',
  'calendar-outline', 'map-outline',
] as const;

export type CategoryIconName = (typeof CATEGORY_ICONS)[number];

export const CATEGORY_ICON_GROUPS: IconGroup[] = [
  {
    label: 'Finance',
    icons: ['cash-outline', 'wallet-outline', 'card-outline', 'briefcase-outline', 'trending-up-outline', 'refresh-outline', 'receipt-outline', 'document-text-outline', 'calculator-outline', 'layers-outline'],
  },
  {
    label: 'Food & Drink',
    icons: ['fast-food-outline', 'restaurant-outline', 'cafe-outline', 'pizza-outline', 'wine-outline', 'beer-outline', 'ice-cream-outline', 'basket-outline', 'nutrition-outline', 'egg-outline'],
  },
  {
    label: 'Transport',
    icons: ['car-outline', 'bus-outline', 'airplane-outline', 'train-outline', 'bicycle-outline', 'boat-outline', 'speedometer-outline', 'locate-outline', 'walk-outline', 'subway-outline'],
  },
  {
    label: 'Home & Utilities',
    icons: ['home-outline', 'business-outline', 'flash-outline', 'wifi-outline', 'build-outline', 'bed-outline', 'leaf-outline', 'water-outline', 'thermometer-outline', 'flame-outline'],
  },
  {
    label: 'Health & Fitness',
    icons: ['medkit-outline', 'bandage-outline', 'barbell-outline', 'fitness-outline', 'heart-outline', 'pulse-outline', 'accessibility-outline', 'body-outline'],
  },
  {
    label: 'Tech',
    icons: ['phone-portrait-outline', 'hardware-chip-outline', 'globe-outline', 'tablet-portrait-outline', 'headset-outline', 'cloud-outline'],
  },
  {
    label: 'Shopping',
    icons: ['bag-outline', 'cart-outline', 'repeat-outline', 'cut-outline', 'shield-checkmark-outline', 'umbrella-outline', 'shirt-outline'],
  },
  {
    label: 'Entertainment',
    icons: ['film-outline', 'game-controller-outline', 'musical-notes-outline', 'camera-outline', 'color-palette-outline', 'book-outline', 'football-outline', 'golf-outline'],
  },
  {
    label: 'Education',
    icons: ['school-outline', 'library-outline', 'pencil-outline'],
  },
  {
    label: 'Personal',
    icons: ['person-outline', 'people-outline', 'happy-outline', 'paw-outline', 'heart-circle-outline', 'gift-outline', 'ribbon-outline', 'trophy-outline', 'chatbubbles-outline'],
  },
  {
    label: 'Misc',
    icons: ['sparkles-outline', 'star-outline', 'bulb-outline', 'grid-outline', 'ellipsis-horizontal-outline', 'time-outline', 'alarm-outline', 'moon-outline', 'sunny-outline', 'calendar-outline', 'map-outline'],
  },
];

export const CATEGORY_COLORS = PALETTE_COLORS;
