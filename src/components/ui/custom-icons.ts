import type { IconSvgElement } from '@hugeicons/react-native';

// Glyphs the free Hugeicons set lacks, drawn on its 24px grid and 1.5 stroke.

/**
 * Backspace (a left-pointing key with an ×). The free Hugeicons set has none, so it's drawn here in
 * the same 24px grid and 1.5 stroke — Hugeicons' own label outline, mirrored.
 */
export const BackspaceIcon: IconSvgElement = [
  [
    'path',
    {
      d: 'M22 12C22 8.22876 22 6.34315 20.8284 5.17157C19.6569 4 17.7712 4 14 4H11C9.03719 4 8.05571 4 7.21115 4.42229C6.36659 4.84458 5.77772 5.62972 4.6 7.2C2.86667 9.51111 2 10.6667 2 12C2 13.3333 2.86667 14.4889 4.6 16.8C5.77772 18.3703 6.36659 19.1554 7.21115 19.5777C8.05571 20 9.03719 20 11 20H14C17.7712 20 19.6569 20 20.8284 18.8284C22 17.6569 22 15.7712 22 12Z',
      stroke: 'currentColor',
      strokeWidth: '1.5',
      key: '0',
    },
  ],
  ['path', { d: 'M16.5 9.5L11.5 14.5M11.5 9.5L16.5 14.5', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '1.5', key: '1' }],
];
