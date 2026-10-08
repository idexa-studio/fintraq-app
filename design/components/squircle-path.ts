/**
 * How far along each edge a smooth corner reaches, as a multiple of its radius. A plain rounded
 * corner stops at 1; this one starts easing earlier, which is what makes it look softer.
 */
const REACH = 1.528665;

/**
 * The outline of a rectangle with smooth ("squircle") corners, as an SVG path: the continuous
 * corner iOS draws for its own shapes, which the reference's chips have. Curvature eases in
 * along the edge instead of starting abruptly where the arc begins. The radius is reduced when
 * the shape is too small for the corner to reach its full length.
 */
export function squirclePath(width: number, height: number, radius: number, inset = 0): string {
  const w = width - inset * 2;
  const h = height - inset * 2;
  if (w <= 0 || h <= 0) return '';
  const r = Math.max(0, Math.min(radius - inset, Math.min(w, h) / 2 / REACH));
  const n = (value: number) => (Math.round((value + inset) * 100) / 100).toString();
  // One corner, drawn clockwise from where it leaves the incoming edge. `a` runs along that
  // edge towards the corner, `b` along the outgoing edge away from it.
  const corner = (cx: number, cy: number, ax: number, ay: number, bx: number, by: number) => {
    const at = (alongA: number, alongB: number) => `${n(cx - ax * alongA * r + bx * alongB * r)} ${n(cy - ay * alongA * r + by * alongB * r)}`;
    return [
      `C ${at(1.08849296, 0)} ${at(0.86840694, 0)} ${at(0.631494, 0.074911)}`,
      `C ${at(0.37282383, 0.16905956)} ${at(0.16905956, 0.37282383)} ${at(0.074911, 0.631494)}`,
      `C ${at(0, 0.86840694)} ${at(0, 1.08849296)} ${at(0, REACH)}`,
    ].join(' ');
  };
  const reach = REACH * r;
  return [
    `M ${n(reach)} ${n(0)}`,
    `L ${n(w - reach)} ${n(0)}`,
    corner(w, 0, 1, 0, 0, 1),
    `L ${n(w)} ${n(h - reach)}`,
    corner(w, h, 0, 1, -1, 0),
    `L ${n(reach)} ${n(h)}`,
    corner(0, h, -1, 0, 0, -1),
    `L ${n(0)} ${n(reach)}`,
    corner(0, 0, 0, -1, 1, 0),
    'Z',
  ].join(' ');
}
