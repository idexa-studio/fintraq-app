import { BREAKPOINT, LAYOUT, widthClassOf } from '@/design/tokens/layout';

describe('width classes', () => {
  it.each([
    [320, 'compact'],
    [412, 'compact'],
    [599, 'compact'],
    [600, 'medium'],
    [839, 'medium'],
    [840, 'expanded'],
    [1280, 'expanded'],
  ] as const)('%i wide is %s', (width, expected) => {
    expect(widthClassOf(width)).toBe(expected);
  });

  it('keeps every card narrower than the screen that first shows it', () => {
    expect(LAYOUT.task).toBeLessThan(BREAKPOINT.medium);
    expect(LAYOUT.dialog).toBeLessThan(LAYOUT.task);
    expect(LAYOUT.column).toBeLessThanOrEqual(BREAKPOINT.medium);
  });

  it('fits two columns and the rail on the narrowest expanded screen only by shrinking, never by overflowing the widest', () => {
    expect(LAYOUT.wide).toBeGreaterThan(LAYOUT.column);
    expect(LAYOUT.wide).toBeLessThan(LAYOUT.column * 2);
  });
});
