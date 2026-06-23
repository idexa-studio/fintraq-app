// ── Shared ────────────────────────────────────────────────────────────────────

export type IconGroup = {
  label: string;
  icons: readonly string[];
};

// ── Account ──────────────────────────────────────────────────────────────────

export const ACCOUNT_ICONS = [
  // Wallets & Cards
  'wallet', 'credit-card', 'cash', 'receipt-text',
  'file', 'shield', 'key', 'lock',
  // Savings & Investments
  'diamond', 'chart-up', 'bar-chart',
  'pie-chart', 'chart-line-data', 'layers',
  'rocket', 'heart-pulse',
  // Business & Work
  'briefcase', 'building', 'server-stack',
  'laptop', 'archive', 'computer', 'printer',
  // Goals
  'home', 'car', 'airplane',
  'heart', 'school', 'award',
  'flag', 'compass',
  // Other
  'smartphone', 'earth', 'user-group',
  'leaf', 'gift', 'star',
  'moon', 'sun', 'settings',
  'hammer', 'flash', 'droplets',
] as const;

export type AccountIconName = (typeof ACCOUNT_ICONS)[number];

export const ACCOUNT_ICON_GROUPS: IconGroup[] = [
  {
    label: 'Wallets & Cards',
    icons: ['wallet', 'credit-card', 'cash', 'receipt-text', 'file', 'shield', 'key', 'lock'],
  },
  {
    label: 'Savings & Investments',
    icons: ['diamond', 'chart-up', 'bar-chart', 'pie-chart', 'chart-line-data', 'layers', 'rocket', 'heart-pulse'],
  },
  {
    label: 'Business & Work',
    icons: ['briefcase', 'building', 'server-stack', 'laptop', 'archive', 'computer', 'printer'],
  },
  {
    label: 'Goals',
    icons: ['home', 'car', 'airplane', 'heart', 'school', 'award', 'flag', 'compass'],
  },
  {
    label: 'Other',
    icons: ['smartphone', 'earth', 'user-group', 'leaf', 'gift', 'star', 'moon', 'sun', 'settings', 'hammer', 'flash', 'droplets'],
  },
];

export type ColorOption = { readonly hex: string; readonly name: string };

export const PALETTE_COLOR_OPTIONS: readonly ColorOption[] = [
  // Greens & Teals
  { hex: '#15803D', name: 'Forest' },
  { hex: '#059669', name: 'Emerald' },
  { hex: '#0D9488', name: 'Teal' },
  // Blues & Cyans
  { hex: '#0284C7', name: 'Sky' },
  { hex: '#0369A1', name: 'Ocean' },
  { hex: '#2563EB', name: 'Blue' },
  { hex: '#1D4ED8', name: 'Cobalt' },
  // Indigos, Purples & Violets
  { hex: '#4F46E5', name: 'Iris' },
  { hex: '#4338CA', name: 'Indigo' },
  { hex: '#7C3AED', name: 'Purple' },
  { hex: '#6D28D9', name: 'Violet' },
  // Pinks & Fuchsias
  { hex: '#A21CAF', name: 'Fuchsia' },
  { hex: '#DB2777', name: 'Pink' },
  { hex: '#BE185D', name: 'Deep Pink' },
  // Reds & Roses
  { hex: '#E11D48', name: 'Rose' },
  { hex: '#DC2626', name: 'Red' },
  { hex: '#BE123C', name: 'Crimson' },
  // Warm Tones (Orange, Amber, Gold)
  { hex: '#EA580C', name: 'Orange' },
  { hex: '#D97706', name: 'Amber' },
  { hex: '#B45309', name: 'Gold' },
  // Lime, Olive & Slate
  { hex: '#65A30D', name: 'Lime' },
  { hex: '#4D7C0F', name: 'Olive' },
  { hex: '#334155', name: 'Slate' },
  { hex: '#475569', name: 'Cool Gray' },
];

export const PALETTE_COLORS: readonly string[] = PALETTE_COLOR_OPTIONS.map((c) => c.hex);

export const ACCOUNT_COLORS = PALETTE_COLORS;

// ── Category ─────────────────────────────────────────────────────────────────

export const CATEGORY_ICONS = [
  // Finance & Money
  'cash', 'credit-card', 'briefcase',
  'chart-up', 'refresh', 'receipt-text',
  'file', 'layers',
  // Food & Drink
  'hamburger', 'fork', 'coffee',
  'pizza', 'drink', 'beer', 'ice-cream',
  'shopping-basket', 'apple', 'egg',
  // Transport
  'car', 'bus', 'airplane', 'train',
  'bike', 'sailboat-coastal', 'dashboard-speed', 'map-pin',
  'walking', 'metro',
  // Home & Utilities
  'home', 'building', 'flash', 'wifi',
  'wrench', 'bed', 'leaf', 'droplets',
  'thermometer', 'fire',
  // Health & Fitness
  'bandage', 'dumbbell',
  'heart-pulse', 'heart', 'pulse',
  'user', 'smile',
  // Tech & Communication
  'smartphone', 'cpu', 'earth',
  'tablet', 'headset', 'cloud',
  // Shopping & Lifestyle
  'shopping-bag', 'shopping-cart', 'repeat', 'scissor',
  'shield', 'umbrella', 't-shirt',
  // Entertainment & Hobbies
  'film', 'gamepad', 'music-note',
  'camera', 'paint-brush', 'book-open',
  'football', 'golf-ball',
  // Education
  'school', 'library', 'pencil',
  // Personal & Social
  'user-group', 'cat', 'gift',
  'ribbon', 'award', 'chat',
  // Misc
  'sparkles', 'star', 'bulb',
  'grid', 'more-horizontal',
  'clock', 'alarm-clock', 'moon', 'sun',
  'calendar', 'maps',
] as const;

export type CategoryIconName = (typeof CATEGORY_ICONS)[number];

export const CATEGORY_ICON_GROUPS: IconGroup[] = [
  {
    label: 'Finance',
    icons: ['cash', 'credit-card', 'briefcase', 'chart-up', 'refresh', 'receipt-text', 'file', 'layers'],
  },
  {
    label: 'Food & Drink',
    icons: ['hamburger', 'fork', 'coffee', 'pizza', 'drink', 'beer', 'ice-cream', 'shopping-basket', 'apple', 'egg'],
  },
  {
    label: 'Transport',
    icons: ['car', 'bus', 'airplane', 'train', 'bike', 'sailboat-coastal', 'dashboard-speed', 'map-pin', 'walking', 'metro'],
  },
  {
    label: 'Home & Utilities',
    icons: ['home', 'building', 'flash', 'wifi', 'wrench', 'bed', 'leaf', 'droplets', 'thermometer', 'fire'],
  },
  {
    label: 'Health & Fitness',
    icons: ['bandage', 'dumbbell', 'heart-pulse', 'heart', 'pulse', 'user', 'smile'],
  },
  {
    label: 'Tech',
    icons: ['smartphone', 'cpu', 'earth', 'tablet', 'headset', 'cloud'],
  },
  {
    label: 'Shopping',
    icons: ['shopping-bag', 'shopping-cart', 'repeat', 'scissor', 'shield', 'umbrella', 't-shirt'],
  },
  {
    label: 'Entertainment',
    icons: ['film', 'gamepad', 'music-note', 'camera', 'paint-brush', 'book-open', 'football', 'golf-ball'],
  },
  {
    label: 'Education',
    icons: ['school', 'library', 'pencil'],
  },
  {
    label: 'Personal',
    icons: ['user', 'user-group', 'smile', 'cat', 'gift', 'ribbon', 'award', 'chat'],
  },
  {
    label: 'Misc',
    icons: ['sparkles', 'star', 'bulb', 'grid', 'more-horizontal', 'clock', 'alarm-clock', 'moon', 'sun', 'calendar', 'maps'],
  },
];

export const CATEGORY_COLORS = PALETTE_COLORS;
