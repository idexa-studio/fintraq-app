import { Specimen } from '@/features/gallery/components/Specimen';
import { BRAND_MARK, BrandMark, LaunchArt, LIGHT_COLORS, PASTELS, Section, useTheme } from '@/design';
import React from 'react';
import { useWindowDimensions, View } from 'react-native';

/** The launcher draws an icon about this large, and shows the middle two thirds of its canvas. */
const LAUNCHER = 60;
/** The mark's share of that icon's width, as `scripts/generate-brand.js` draws it: 0.78 of its grid on a 1024 canvas. */
const MARK_SHARE = (BRAND_MARK.width * 0.78) / ((1024 * 2) / 3);
/** How far the generator lifts the mark above the middle, as a share of the icon. */
const LIFT_SHARE = (10 * 0.78) / ((1024 * 2) / 3);

type TileProps = { size: number; shape: 'circle' | 'squircle' };

/** The app icon as a launcher shows it: the grey page, cut to the launcher's shape, with the mark on it. */
function IconTile({ size, shape }: TileProps) {
  return (
    <View style={{ width: size, height: size, borderRadius: shape === 'circle' ? size / 2 : size * 0.3, overflow: 'hidden', backgroundColor: LIGHT_COLORS.background, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ transform: [{ translateY: -size * LIFT_SHARE }] }}>
        <BrandMark width={size * MARK_SHARE} />
      </View>
    </View>
  );
}

/** The brand as the phone shows it: the app icon at launcher size, and the launch screen. */
export function BrandSection() {
  const { radius, space } = useTheme();
  // The launch screen at the phone's own size, shrunk as a whole so its proportions are the real ones.
  const screen = useWindowDimensions();
  const shrink = 0.6;
  return (
    <Section title="Brand">
      <Specimen name="App icon" note="A stack of coins: a white one on a black one, a green one falling onto them. Shown as a launcher cuts it, at four sizes.">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, backgroundColor: PASTELS.teal }}>
          <IconTile size={LAUNCHER * 2} shape="squircle" />
          <IconTile size={LAUNCHER} shape="squircle" />
          <IconTile size={LAUNCHER} shape="circle" />
          <IconTile size={LAUNCHER * 0.6} shape="circle" />
        </View>
      </Specimen>
      <Specimen name="Launch screen" note="What covers the app while it starts: the reference's three greens, the mark in the middle, the name under it. Shown at six tenths of this phone's size.">
        <View style={{ alignSelf: 'center', width: screen.width * shrink, height: screen.height * shrink, borderRadius: radius.md, overflow: 'hidden' }}>
          <View style={{ width: screen.width, height: screen.height, transformOrigin: 'top left', transform: [{ scale: shrink }] }}>
            <LaunchArt />
          </View>
        </View>
      </Specimen>
    </Section>
  );
}
