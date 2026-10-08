import { squirclePath } from '@/design/components/squircle-path';

const numbers = (path: string) => (path.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);

describe('squirclePath', () => {
  it('is a closed outline that stays inside its box', () => {
    const path = squirclePath(100, 40, 9);
    expect(path.startsWith('M ')).toBe(true);
    expect(path.endsWith('Z')).toBe(true);
    const values = numbers(path);
    expect(Math.min(...values)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...values)).toBeLessThanOrEqual(100);
  });

  it('touches the middle of every edge', () => {
    const path = squirclePath(100, 40, 9);
    // Top edge runs to x = 100 - reach; right edge down to y = 40 - reach.
    expect(path).toContain('L 86.24 0');
    expect(path).toContain('L 100 26.24');
  });

  it('shrinks the corner when the shape is too small for it', () => {
    // A 20-high shape cannot fit a 9 corner's reach on both sides; the corners meet mid-edge.
    const path = squirclePath(100, 20, 9);
    expect(path).toContain('L 100 10');
  });

  it('draws inside an inset, for a line that must not be clipped', () => {
    const values = numbers(squirclePath(100, 40, 9, 0.5));
    expect(Math.min(...values)).toBeGreaterThanOrEqual(0.5);
    expect(Math.max(...values)).toBeLessThanOrEqual(99.5);
  });

  it('draws nothing for a shape with no size', () => {
    expect(squirclePath(0, 40, 9)).toBe('');
  });
});
