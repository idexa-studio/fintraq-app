import type en from '@/src/i18n/locales/en';

// ── Shared ────────────────────────────────────────────────────────────────────

export type IconGroup = {
  label: keyof (typeof en)['picker']['groups'];
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
    label: 'walletsCards',
    icons: ['wallet', 'credit-card', 'cash', 'receipt-text', 'file', 'shield', 'key', 'lock'],
  },
  {
    label: 'savingsInvestments',
    icons: ['diamond', 'chart-up', 'bar-chart', 'pie-chart', 'chart-line-data', 'layers', 'rocket', 'heart-pulse'],
  },
  {
    label: 'businessWork',
    icons: ['briefcase', 'building', 'server-stack', 'laptop', 'archive', 'computer', 'printer'],
  },
  {
    label: 'goals',
    icons: ['home', 'car', 'airplane', 'heart', 'school', 'award', 'flag', 'compass'],
  },
  {
    label: 'other',
    icons: ['smartphone', 'earth', 'user-group', 'leaf', 'gift', 'star', 'moon', 'sun', 'settings', 'hammer', 'flash', 'droplets'],
  },
];

export type ColorOption = { readonly hex: string; readonly name: keyof (typeof en)['picker']['colors'] };

export const PALETTE_COLOR_OPTIONS: readonly ColorOption[] = [
  // Greens & Teals
  { hex: '#15803D', name: 'forest' },
  { hex: '#059669', name: 'emerald' },
  { hex: '#0D9488', name: 'teal' },
  // Blues & Cyans
  { hex: '#0284C7', name: 'sky' },
  { hex: '#0369A1', name: 'ocean' },
  { hex: '#2563EB', name: 'blue' },
  { hex: '#1D4ED8', name: 'cobalt' },
  // Indigos, Purples & Violets
  { hex: '#4F46E5', name: 'iris' },
  { hex: '#4338CA', name: 'indigo' },
  { hex: '#7C3AED', name: 'purple' },
  { hex: '#6D28D9', name: 'violet' },
  // Pinks & Fuchsias
  { hex: '#A21CAF', name: 'fuchsia' },
  { hex: '#DB2777', name: 'pink' },
  { hex: '#BE185D', name: 'deepPink' },
  // Reds & Roses
  { hex: '#E11D48', name: 'rose' },
  { hex: '#DC2626', name: 'red' },
  { hex: '#BE123C', name: 'crimson' },
  // Warm Tones (Orange, Amber, Gold)
  { hex: '#EA580C', name: 'orange' },
  { hex: '#D97706', name: 'amber' },
  { hex: '#B45309', name: 'gold' },
  // Lime, Olive & Slate
  { hex: '#65A30D', name: 'lime' },
  { hex: '#4D7C0F', name: 'olive' },
  { hex: '#334155', name: 'slate' },
  { hex: '#475569', name: 'coolGray' },
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
    label: 'finance',
    icons: ['cash', 'credit-card', 'briefcase', 'chart-up', 'refresh', 'receipt-text', 'file', 'layers'],
  },
  {
    label: 'foodDrink',
    icons: ['hamburger', 'fork', 'coffee', 'pizza', 'drink', 'beer', 'ice-cream', 'shopping-basket', 'apple', 'egg'],
  },
  {
    label: 'transport',
    icons: ['car', 'bus', 'airplane', 'train', 'bike', 'sailboat-coastal', 'dashboard-speed', 'map-pin', 'walking', 'metro'],
  },
  {
    label: 'homeUtilities',
    icons: ['home', 'building', 'flash', 'wifi', 'wrench', 'bed', 'leaf', 'droplets', 'thermometer', 'fire'],
  },
  {
    label: 'healthFitness',
    icons: ['bandage', 'dumbbell', 'heart-pulse', 'heart', 'pulse', 'user', 'smile'],
  },
  {
    label: 'tech',
    icons: ['smartphone', 'cpu', 'earth', 'tablet', 'headset', 'cloud'],
  },
  {
    label: 'shopping',
    icons: ['shopping-bag', 'shopping-cart', 'repeat', 'scissor', 'shield', 'umbrella', 't-shirt'],
  },
  {
    label: 'entertainment',
    icons: ['film', 'gamepad', 'music-note', 'camera', 'paint-brush', 'book-open', 'football', 'golf-ball'],
  },
  {
    label: 'education',
    icons: ['school', 'library', 'pencil'],
  },
  {
    label: 'personal',
    icons: ['user', 'user-group', 'smile', 'cat', 'gift', 'ribbon', 'award', 'chat'],
  },
  {
    label: 'misc',
    icons: ['sparkles', 'star', 'bulb', 'grid', 'more-horizontal', 'clock', 'alarm-clock', 'moon', 'sun', 'calendar', 'maps'],
  },
];

export const CATEGORY_COLORS = PALETTE_COLORS;
