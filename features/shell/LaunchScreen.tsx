import { LaunchArt } from '@/design';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';

/** The least the launch screen is seen for, so it never flickers past. */
const MIN_SHOWN_MS = 700;
const FADE_MS = 220;

type LaunchScreenProps = {
  /** Whether the bundled face has loaded, for the name. */
  named: boolean;
  /** Set once the app behind is ready to be seen. The screen then fades and removes itself. */
  ready: boolean;
};

/**
 * What covers the app while it starts. The phone's own splash can only hold a colour and the
 * mark; as soon as this is drawn it takes over from that, with the mark in the same place, and
 * adds the waves and the name. It leaves when the app behind it is ready.
 */
export function LaunchScreen({ named, ready }: LaunchScreenProps) {
  const [gone, setGone] = useState(false);
  const [shownAt, setShownAt] = useState<number | null>(null);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!ready || shownAt === null) return;
    const wait = Math.max(0, MIN_SHOWN_MS - (Date.now() - shownAt));
    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: FADE_MS, useNativeDriver: true }).start(() => setGone(true));
    }, wait);
    return () => clearTimeout(timer);
  }, [ready, shownAt, opacity]);

  if (gone) return null;
  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { opacity }]}
      onLayout={() => {
        if (shownAt !== null) return;
        setShownAt(Date.now());
        void SplashScreen.hideAsync().catch(() => undefined);
      }}
    >
      <LaunchArt named={named} />
    </Animated.View>
  );
}
