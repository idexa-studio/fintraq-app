import { BRAND_MARK, BrandMark } from '@/design/components/BrandMark';
import { WaveField } from '@/design/components/WaveField';
import { INK } from '@/design/tokens/colors';
import { FONTS } from '@/design/tokens/typography';
import React, { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

/** The width of the image the phone's own splash draws: `imageWidth` in app.json. Change the two together. */
const SPLASH_IMAGE_WIDTH = 108;
/**
 * The mark's width on the launch screen. It is what the phone's own splash draws before the app
 * is up (of its image, `scripts/generate-brand.js` gives the mark this share), so the mark does
 * not change size when the app takes over. About 49pt.
 */
export const LAUNCH_MARK_WIDTH = (SPLASH_IMAGE_WIDTH * BRAND_MARK.width * 1.17) / 1024;
const MARK_HEIGHT = (LAUNCH_MARK_WIDTH * BRAND_MARK.height) / BRAND_MARK.width;
/** The name sits a short step under the mark, a little wider than it. */
const NAME = { size: 22, line: 28, gap: 8 };
/** How far the mark rises to make room for the name, so the two together sit in the middle. */
const RISE = (NAME.gap + NAME.line) / 2;
const RISE_MS = 260;

export type LaunchArtProps = {
  /** Whether the bundled face has loaded. The name waits for it, so it never shows in the wrong letters. */
  named?: boolean;
};

/**
 * The launch screen, laid out as the reference's: the waves, the mark and the name under it in
 * black. The mark starts in the very middle, where the phone's own splash drew it; as the name
 * appears it rises a little, so that the mark and the name together are what is centred.
 */
export function LaunchArt({ named = true }: LaunchArtProps) {
  const [shown] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!named) return;
    Animated.timing(shown, { toValue: 1, duration: RISE_MS, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [named, shown]);
  const rise = shown.interpolate({ inputRange: [0, 1], outputRange: [0, -RISE] });

  return (
    <View style={StyleSheet.absoluteFill} accessible accessibilityRole="image" accessibilityLabel="Fintraq">
      <WaveField />
      <Animated.View style={[styles.centre, { transform: [{ translateY: rise }] }]} pointerEvents="none">
        <BrandMark width={LAUNCH_MARK_WIDTH} />
      </Animated.View>
      {named ? (
        <Animated.View style={[styles.name, { opacity: shown, transform: [{ translateY: rise }] }]} pointerEvents="none">
          <Animated.Text style={styles.letters} allowFontScaling={false}>Fintraq</Animated.Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  centre: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  // Hung from the middle of the screen, clear of the mark; it rises with the mark.
  name: { position: 'absolute', left: 0, right: 0, top: '50%', marginTop: MARK_HEIGHT / 2 + NAME.gap, alignItems: 'center' },
  letters: { fontFamily: FONTS.bold, fontSize: NAME.size, lineHeight: NAME.line, color: INK },
});
