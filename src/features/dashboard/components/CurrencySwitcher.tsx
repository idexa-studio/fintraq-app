import * as Haptics from 'expo-haptics';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { BentoPressable, Text } from '@/src/components/ui';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';

type Props = {
  currencies: string[];
  selected: string;
  onSelect: (currency: string) => void;
};

/**
 * Currency switch at the foot of a HeroSurface: a tonal track with a solid thumb, the hero's
 * original control. Scrolls when there are many currencies; hidden with one.
 */
export const CurrencySwitcher = React.memo(function CurrencySwitcher({ currencies, selected, onSelect }: Props) {
  const theme = useTheme();
  const { heroCard: hero } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (currencies.length <= 1) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll} contentContainerStyle={styles.track} accessibilityRole="tablist">
      {currencies.map((code) => {
        const active = code === selected;
        return (
          <BentoPressable
            key={code}
            style={[styles.option, active && styles.optionActive]}
            onPress={() => {
              if (active) return;
              Haptics.selectionAsync().catch(() => {});
              onSelect(code);
            }}
            scaleOnPress={false}
            // 28pt tall pills; the slop brings the target to the 44pt minimum.
            hitSlop={{ top: 8, bottom: 8 }}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <Text variant={active ? 'label' : 'caption'} color={active ? hero.onInk : hero.textMuted}>
              {code}
            </Text>
          </BentoPressable>
        );
      })}
    </ScrollView>
  );
});

const createStyles = ({ heroCard: hero, spacing, radius }: ThemeContextType) =>
  StyleSheet.create({
    scroll: { flexGrow: 0, alignSelf: 'center', maxWidth: '100%' },
    track: { backgroundColor: hero.track, borderRadius: radius('full'), padding: spacing('1'), gap: spacing('0.5') },
    option: {
      minWidth: 48,
      height: 28,
      paddingHorizontal: spacing('3'),
      borderRadius: radius('full'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionActive: { backgroundColor: hero.ink },
  });
