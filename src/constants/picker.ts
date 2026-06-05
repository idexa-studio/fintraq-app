// ── Shared ────────────────────────────────────────────────────────────────────

export type IconGroup = {
  label: string;
  icons: readonly string[];
};

// ── Account ──────────────────────────────────────────────────────────────────

export const ACCOUNT_ICONS = [
  // Wallets & Cards
  'wallet-outline', 'card-outline', 'cash', 'receipt-text-outline',
  'file-document-outline', 'shield-check-outline', 'key-outline',
  'lock-outline', 'card-account-details-outline',
  // Savings & Investments
  'diamond-stone', 'trending-up', 'chart-bar',
  'chart-pie', 'chart-timeline-variant', 'layers-outline',
  'rocket-launch-outline', 'heart-pulse',
  // Business & Work
  'briefcase-outline', 'domain', 'server',
  'laptop', 'archive-outline', 'calculator',
  'monitor', 'printer-outline',
  // Goals
  'home-outline', 'car-outline', 'airplane',
  'heart-outline', 'school-outline', 'trophy-outline',
  'flag-outline', 'compass-outline',
  // Other
  'cellphone', 'earth', 'account-group-outline',
  'leaf', 'gift-outline', 'star-outline',
  'moon-waning-crescent', 'weather-sunny', 'cog-outline',
  'hammer', 'flash-outline', 'water-outline',
] as const;

export type AccountIconName = (typeof ACCOUNT_ICONS)[number];

export const ACCOUNT_ICON_GROUPS: IconGroup[] = [
  {
    label: 'Wallets & Cards',
    icons: ['wallet-outline', 'card-outline', 'cash', 'receipt-text-outline', 'file-document-outline', 'shield-check-outline', 'key-outline', 'lock-outline', 'card-account-details-outline'],
  },
  {
    label: 'Savings & Investments',
    icons: ['diamond-stone', 'trending-up', 'chart-bar', 'chart-pie', 'chart-timeline-variant', 'layers-outline', 'rocket-launch-outline', 'heart-pulse'],
  },
  {
    label: 'Business & Work',
    icons: ['briefcase-outline', 'domain', 'server', 'laptop', 'archive-outline', 'calculator', 'monitor', 'printer-outline'],
  },
  {
    label: 'Goals',
    icons: ['home-outline', 'car-outline', 'airplane', 'heart-outline', 'school-outline', 'trophy-outline', 'flag-outline', 'compass-outline'],
  },
  {
    label: 'Other',
    icons: ['cellphone', 'earth', 'account-group-outline', 'leaf', 'gift-outline', 'star-outline', 'moon-waning-crescent', 'weather-sunny', 'cog-outline', 'hammer', 'flash-outline', 'water-outline'],
  },
];

export type ColorOption = { readonly hex: string; readonly name: string };

export const PALETTE_COLOR_OPTIONS: readonly ColorOption[] = [
  // Greens & Teals
  { hex: '#15803D', name: 'Forest' },
  { hex: '#166534', name: 'Deep Forest' },
  { hex: '#059669', name: 'Emerald' },
  { hex: '#065F46', name: 'Deep Emerald' },
  { hex: '#0F766E', name: 'Teal' },
  { hex: '#115E59', name: 'Deep Teal' },
  { hex: '#0D9488', name: 'Cyan Teal' },
  // Blues & Cyans
  { hex: '#0369A1', name: 'Ocean' },
  { hex: '#075985', name: 'Deep Ocean' },
  { hex: '#0284C7', name: 'Sky' },
  { hex: '#2563EB', name: 'Blue' },
  { hex: '#1D4ED8', name: 'Cobalt' },
  { hex: '#1E40AF', name: 'Navy' },
  { hex: '#1E3A8A', name: 'Midnight Blue' },
  // Indigo & Violet
  { hex: '#4338CA', name: 'Indigo' },
  { hex: '#312E81', name: 'Midnight Indigo' },
  { hex: '#4F46E5', name: 'Iris' },
  { hex: '#6D28D9', name: 'Violet' },
  { hex: '#581C87', name: 'Deep Violet' },
  { hex: '#7C3AED', name: 'Purple' },
  { hex: '#4A148C', name: 'Midnight Purple' },
  // Pink & Fuchsia
  { hex: '#7E22CE', name: 'Deep Purple' },
  { hex: '#A21CAF', name: 'Fuchsia' },
  { hex: '#701A75', name: 'Midnight Fuchsia' },
  { hex: '#BE185D', name: 'Pink' },
  { hex: '#9D174D', name: 'Deep Pink' },
  { hex: '#DB2777', name: 'Hot Pink' },
  { hex: '#880E4F', name: 'Mulberry' },
  // Rose & Red
  { hex: '#BE123C', name: 'Crimson' },
  { hex: '#9F1239', name: 'Ruby' },
  { hex: '#E11D48', name: 'Rose' },
  { hex: '#DC2626', name: 'Red' },
  { hex: '#B91C1C', name: 'Deep Red' },
  { hex: '#7F1D1D', name: 'Burgundy' },
  { hex: '#581845', name: 'Wine' },
  // Orange, Amber & Earthy
  { hex: '#C2410C', name: 'Burnt Orange' },
  { hex: '#EA580C', name: 'Orange' },
  { hex: '#9A3412', name: 'Rust' },
  { hex: '#A73B24', name: 'Terracotta' },
  { hex: '#D97706', name: 'Amber' },
  { hex: '#B45309', name: 'Gold' },
  { hex: '#92400E', name: 'Bronze' },
  { hex: '#78350F', name: 'Chocolate' },
  { hex: '#451A03', name: 'Espresso' },
  // Lime, Olive & Mustard
  { hex: '#4D7C0F', name: 'Olive' },
  { hex: '#3F6212', name: 'Deep Olive' },
  { hex: '#65A30D', name: 'Lime' },
  { hex: '#854D0E', name: 'Mustard' },
  { hex: '#0E7490', name: 'Cyan' },
  { hex: '#155E75', name: 'Deep Cyan' },
  { hex: '#164E63', name: 'Midnight Cyan' },
  // Neutral
  { hex: '#334155', name: 'Slate' },
  { hex: '#1E293B', name: 'Charcoal' },
  { hex: '#475569', name: 'Cool Gray' },
  { hex: '#374151', name: 'Steel' },
  { hex: '#1C1917', name: 'Onyx' },
];

export const PALETTE_COLORS: readonly string[] = PALETTE_COLOR_OPTIONS.map((c) => c.hex);

export const ACCOUNT_COLORS = PALETTE_COLORS;

// ── Category ─────────────────────────────────────────────────────────────────

export const CATEGORY_ICONS = [
  // Finance & Money
  'cash', 'wallet-outline', 'card-outline', 'briefcase-outline',
  'trending-up', 'refresh', 'receipt-text-outline',
  'file-document-outline', 'calculator', 'layers-outline',
  // Food & Drink
  'hamburger', 'silverware-fork-knife', 'coffee-outline',
  'pizza', 'glass-wine', 'beer-outline', 'ice-cream',
  'basket-outline', 'food-apple', 'egg-outline',
  // Transport
  'car-outline', 'bus', 'airplane', 'train',
  'bike', 'sail-boat', 'speedometer', 'crosshairs-gps',
  'walk', 'subway',
  // Home & Utilities
  'home-outline', 'domain', 'flash-outline', 'wifi',
  'wrench-outline', 'bed-outline', 'leaf', 'water-outline',
  'thermometer', 'fire',
  // Health & Fitness
  'medical-bag', 'bandage', 'weight-lifter',
  'heart-pulse', 'heart-outline', 'pulse-outline',
  'human', 'human-greeting',
  // Tech & Communication
  'cellphone', 'cpu-64-bit', 'earth',
  'tablet', 'headset', 'cloud-outline',
  // Shopping & Lifestyle
  'shopping-outline', 'cart-outline', 'repeat', 'content-cut',
  'shield-check-outline', 'umbrella-outline', 'tshirt-crew-outline',
  // Entertainment & Hobbies
  'filmstrip', 'gamepad-variant-outline', 'music-note',
  'camera-outline', 'palette-outline', 'book-open-page-variant-outline',
  'football', 'golf',
  // Education
  'school-outline', 'library', 'pencil-outline',
  // Personal & Social
  'account-outline', 'account-group-outline', 'emoticon-happy-outline',
  'paw', 'heart-circle-outline', 'gift-outline',
  'ribbon', 'trophy-outline', 'chat-outline',
  // Misc
  'creation', 'star-outline', 'lightbulb-on-outline',
  'grid', 'dots-horizontal',
  'clock-outline', 'alarm', 'moon-waning-crescent', 'weather-sunny',
  'calendar-outline', 'map-outline',
] as const;

export type CategoryIconName = (typeof CATEGORY_ICONS)[number];

export const CATEGORY_ICON_GROUPS: IconGroup[] = [
  {
    label: 'Finance',
    icons: ['cash', 'wallet-outline', 'card-outline', 'briefcase-outline', 'trending-up', 'refresh', 'receipt-text-outline', 'file-document-outline', 'calculator', 'layers-outline'],
  },
  {
    label: 'Food & Drink',
    icons: ['hamburger', 'silverware-fork-knife', 'coffee-outline', 'pizza', 'glass-wine', 'beer-outline', 'ice-cream', 'basket-outline', 'food-apple', 'egg-outline'],
  },
  {
    label: 'Transport',
    icons: ['car-outline', 'bus', 'airplane', 'train', 'bike', 'sail-boat', 'speedometer', 'crosshairs-gps', 'walk', 'subway'],
  },
  {
    label: 'Home & Utilities',
    icons: ['home-outline', 'domain', 'flash-outline', 'wifi', 'wrench-outline', 'bed-outline', 'leaf', 'water-outline', 'thermometer', 'fire'],
  },
  {
    label: 'Health & Fitness',
    icons: ['medical-bag', 'bandage', 'weight-lifter', 'heart-pulse', 'heart-outline', 'pulse-outline', 'human', 'human-greeting'],
  },
  {
    label: 'Tech',
    icons: ['cellphone', 'cpu-64-bit', 'earth', 'tablet', 'headset', 'cloud-outline'],
  },
  {
    label: 'Shopping',
    icons: ['shopping-outline', 'cart-outline', 'repeat', 'content-cut', 'shield-check-outline', 'umbrella-outline', 'tshirt-crew-outline'],
  },
  {
    label: 'Entertainment',
    icons: ['filmstrip', 'gamepad-variant-outline', 'music-note', 'camera-outline', 'palette-outline', 'book-open-page-variant-outline', 'football', 'golf'],
  },
  {
    label: 'Education',
    icons: ['school-outline', 'library', 'pencil-outline'],
  },
  {
    label: 'Personal',
    icons: ['account-outline', 'account-group-outline', 'emoticon-happy-outline', 'paw', 'heart-circle-outline', 'gift-outline', 'ribbon', 'trophy-outline', 'chat-outline'],
  },
  {
    label: 'Misc',
    icons: ['creation', 'star-outline', 'lightbulb-on-outline', 'grid', 'dots-horizontal', 'clock-outline', 'alarm', 'moon-waning-crescent', 'weather-sunny', 'calendar-outline', 'map-outline'],
  },
];

export const CATEGORY_COLORS = PALETTE_COLORS;
