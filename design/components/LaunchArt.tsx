import { BRAND_MARK, BrandMark } from '@/design/components/BrandMark';
import { WaveField } from '@/design/components/WaveField';
import { INK } from '@/design/tokens/colors';
import { FONTS } from '@/design/tokens/typography';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

/**
 * The mark's width on the launch screen. It is what the phone's own splash draws before the app
 * is up (app.json: a 134pt image, of which `scripts/generate-brand.js` gives the mark this share),
 * so the mark does not move or change size when the app takes over. About 60pt.
 */
export const LAUNCH_MARK_WIDTH = (134 * BRAND_MARK.width * 1.17) / 1024;
const MARK_HEIGHT = (LAUNCH_MARK_WIDTH * BRAND_MARK.height) / BRAND_MARK.width;
/** The name sits a short step under the mark, a little wider than it. */
const NAME = { size: 26, line: 32, gap: 10 };

export type LaunchArtProps = {
  /** Whether the bundled face has loaded. The name waits for it, so it never shows in the wrong letters. */
  named?: boolean;
};

/**
 * The launch screen, laid out as the reference's: the waves, the mark in the very middle, the name
 * under it in black. It fills whatever holds it.
 */
export function LaunchArt({ named = true }: LaunchArtProps) {
  return (
    <View style={StyleSheet.absoluteFill} accessible accessibilityRole="image" accessibilityLabel="Fintraq">
      <WaveField />
      <View style={styles.centre} pointerEvents="none">
        <BrandMark width={LAUNCH_MARK_WIDTH} />
      </View>
      {named ? (
        <View style={styles.name} pointerEvents="none">
          <Text style={styles.letters} allowFontScaling={false}>Fintraq</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  centre: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  // Hung from the middle of the screen, clear of the mark.
  name: { position: 'absolute', left: 0, right: 0, top: '50%', marginTop: MARK_HEIGHT / 2 + NAME.gap, alignItems: 'center' },
  letters: { fontFamily: FONTS.bold, fontSize: NAME.size, lineHeight: NAME.line, color: INK },
});
