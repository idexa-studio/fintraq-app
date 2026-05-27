// ── Shared ────────────────────────────────────────────────────────────────────

export type IconGroup = {
  label: string;
  icons: readonly string[];
};

// ── Account ──────────────────────────────────────────────────────────────────

export const ACCOUNT_ICONS = [
  // Wallets & Cards
  'wallet-outline', 'card-outline', 'cash-outline', 'receipt-outline',
  'document-text-outline', 'shield-checkmark-outline',
  // Savings & Investments
  'diamond-outline', 'trending-up-outline', 'stats-chart-outline',
  'pie-chart-outline', 'analytics-outline', 'layers-outline', 'bar-chart-outline',
  // Business & Work
  'briefcase-outline', 'business-outline', 'server-outline',
  'laptop-outline', 'archive-outline',
  // Goals
  'home-outline', 'car-outline', 'airplane-outline',
  'heart-outline', 'school-outline', 'trophy-outline',
  // Other
  'phone-portrait-outline', 'globe-outline', 'people-outline',
  'leaf-outline', 'gift-outline', 'star-outline',
] as const;

export type AccountIconName = (typeof ACCOUNT_ICONS)[number];

export const ACCOUNT_ICON_GROUPS: IconGroup[] = [
  {
    label: 'Wallets & Cards',
    icons: ['wallet-outline', 'card-outline', 'cash-outline', 'receipt-outline', 'document-text-outline', 'shield-checkmark-outline'],
  },
  {
    label: 'Savings & Investments',
    icons: ['diamond-outline', 'trending-up-outline', 'stats-chart-outline', 'pie-chart-outline', 'analytics-outline', 'layers-outline', 'bar-chart-outline'],
  },
  {
    label: 'Business & Work',
    icons: ['briefcase-outline', 'business-outline', 'server-outline', 'laptop-outline', 'archive-outline'],
  },
  {
    label: 'Goals',
    icons: ['home-outline', 'car-outline', 'airplane-outline', 'heart-outline', 'school-outline', 'trophy-outline'],
  },
  {
    label: 'Other',
    icons: ['phone-portrait-outline', 'globe-outline', 'people-outline', 'leaf-outline', 'gift-outline', 'star-outline'],
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
  'cash-outline',
  'wallet-outline',
  'card-outline',
  'briefcase-outline',
  'trending-up-outline',
  'refresh-outline',
  'receipt-outline',
  'document-text-outline',
  // Food & Drink
  'fast-food-outline',
  'restaurant-outline',
  'cafe-outline',
  'pizza-outline',
  'wine-outline',
  'beer-outline',
  'ice-cream-outline',
  'basket-outline',
  // Transport
  'car-outline',
  'bus-outline',
  'airplane-outline',
  'train-outline',
  'bicycle-outline',
  'boat-outline',
  'speedometer-outline',
  'locate-outline',
  // Home & Utilities
  'home-outline',
  'business-outline',
  'flash-outline',
  'wifi-outline',
  'build-outline',
  'bed-outline',
  'leaf-outline',
  // Health & Fitness
  'medkit-outline',
  'bandage-outline',
  'barbell-outline',
  'fitness-outline',
  // Tech & Communication
  'phone-portrait-outline',
  'hardware-chip-outline',
  'globe-outline',
  // Shopping & Lifestyle
  'bag-outline',
  'cart-outline',
  'repeat-outline',
  'cut-outline',
  'shield-checkmark-outline',
  'umbrella-outline',
  // Entertainment & Hobbies
  'film-outline',
  'game-controller-outline',
  'musical-notes-outline',
  'camera-outline',
  'color-palette-outline',
  'book-outline',
  // Education
  'school-outline',
  // Personal & Social
  'person-outline',
  'people-outline',
  'happy-outline',
  'paw-outline',
  'heart-outline',
  'gift-outline',
  'ribbon-outline',
  'trophy-outline',
  // Misc
  'sparkles-outline',
  'star-outline',
  'bulb-outline',
  'grid-outline',
  'ellipsis-horizontal-outline',
] as const;

export type CategoryIconName = (typeof CATEGORY_ICONS)[number];

export const CATEGORY_ICON_GROUPS: IconGroup[] = [
  {
    label: 'Finance',
    icons: ['cash-outline', 'wallet-outline', 'card-outline', 'briefcase-outline', 'trending-up-outline', 'refresh-outline', 'receipt-outline', 'document-text-outline'],
  },
  {
    label: 'Food & Drink',
    icons: ['fast-food-outline', 'restaurant-outline', 'cafe-outline', 'pizza-outline', 'wine-outline', 'beer-outline', 'ice-cream-outline', 'basket-outline'],
  },
  {
    label: 'Transport',
    icons: ['car-outline', 'bus-outline', 'airplane-outline', 'train-outline', 'bicycle-outline', 'boat-outline', 'speedometer-outline', 'locate-outline'],
  },
  {
    label: 'Home & Utilities',
    icons: ['home-outline', 'business-outline', 'flash-outline', 'wifi-outline', 'build-outline', 'bed-outline', 'leaf-outline'],
  },
  {
    label: 'Health & Fitness',
    icons: ['medkit-outline', 'bandage-outline', 'barbell-outline', 'fitness-outline'],
  },
  {
    label: 'Tech',
    icons: ['phone-portrait-outline', 'hardware-chip-outline', 'globe-outline'],
  },
  {
    label: 'Shopping',
    icons: ['bag-outline', 'cart-outline', 'repeat-outline', 'cut-outline', 'shield-checkmark-outline', 'umbrella-outline'],
  },
  {
    label: 'Entertainment',
    icons: ['film-outline', 'game-controller-outline', 'musical-notes-outline', 'camera-outline', 'color-palette-outline', 'book-outline'],
  },
  {
    label: 'Education',
    icons: ['school-outline'],
  },
  {
    label: 'Personal',
    icons: ['person-outline', 'people-outline', 'happy-outline', 'paw-outline', 'heart-outline', 'gift-outline', 'ribbon-outline', 'trophy-outline'],
  },
  {
    label: 'Misc',
    icons: ['sparkles-outline', 'star-outline', 'bulb-outline', 'grid-outline', 'ellipsis-horizontal-outline'],
  },
];

export const CATEGORY_COLORS = PALETTE_COLORS;
