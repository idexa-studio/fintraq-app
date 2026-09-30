import { contrastRatio, foregroundOn } from '@/src/theme/tokens';

describe('contrastRatio', () => {
  it('matches the WCAG reference values', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
  });

  it('documents why brand lime is a fill, not a text colour on light layers', () => {
    expect(contrastRatio('#00CC6A', '#FFFFFF')).toBeLessThan(3);
    expect(contrastRatio('#00824A', '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
  });
});

describe('foregroundOn', () => {
  it.each(['#00CC6A', '#E8A33D', '#FACC15', '#A7F3D0', '#FFFFFF'])('uses dark content on light fill %s', (fill) => {
    expect(foregroundOn(fill)).toBe('#0A0A08');
  });

  it.each(['#1D4ED8', '#7C3AED', '#B91C1C', '#262521', '#000000'])('uses white content on dark fill %s', (fill) => {
    expect(foregroundOn(fill)).toBe('#FFFFFF');
  });

  it('always yields at least AA-large contrast (3:1) against the fill', () => {
    for (let v = 0; v <= 255; v += 15) {
      const hex = `#${v.toString(16).padStart(2, '0').repeat(3)}`;
      expect(contrastRatio(hex, foregroundOn(hex))).toBeGreaterThanOrEqual(3);
    }
  });
});
