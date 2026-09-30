import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BentoPressable, Icon, Text } from '@/src/components/ui';
import { FEATURE_TIPS, FeatureTipId } from '@/src/features/walkthrough/constants/tips';
import { useFeatureTip } from '@/src/features/walkthrough/hooks/useFeatureTip';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';

type FeatureTipProps = {
  tip: FeatureTipId;
  /** Show only when the tip is actionable, e.g. the list actually has a row to swipe. */
  enabled?: boolean;
};

/**
 * A one-line, non-blocking hint about a hidden gesture: icon, sentence, "Got it". The screen stays
 * usable underneath. Sits on the ink surface (like the tab bar) so it separates without a shadow.
 */
export const FeatureTip = React.memo(function FeatureTip({ tip, enabled = true }: FeatureTipProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { visible, dismiss } = useFeatureTip(tip, enabled);

  if (!visible) return null;

  // Clears both the floating tab bar and screen FABs (56pt + margins).
  const bottom = insets.bottom + 56 + theme.spacing('8');
  const message = t(`walkthrough.${tip}`);

  return (
    <Animated.View
      entering={FadeInDown.duration(theme.animation.normal)}
      exiting={FadeOutDown.duration(theme.animation.fast)}
      style={[styles.wrap, { bottom }]}
      pointerEvents="box-none"
    >
      <View style={styles.card} accessible accessibilityLiveRegion="polite" accessibilityLabel={message}>
        <Icon icon={FEATURE_TIPS[tip].icon} size={20} color={theme.colors.onInk} />
        <Text variant="callout" color={theme.colors.onInk} style={styles.message}>
          {message}
        </Text>
        <BentoPressable
          onPress={dismiss}
          hitSlop={8}
          style={styles.action}
          accessibilityRole="button"
          accessibilityLabel={t('walkthrough.gotIt')}
        >
          <Text variant="calloutStrong" color={theme.colors.primary}>{/* design-system-ignore: lime on the dark ink surface is high-contrast */}
            {t('walkthrough.gotIt')}
          </Text>
        </BentoPressable>
      </View>
    </Animated.View>
  );
});

const createStyles = ({ colors, spacing, radius, layout }: ThemeContextType) =>
  StyleSheet.create({
    wrap: { position: 'absolute', left: layout.screenPadding, right: layout.screenPadding },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3'),
      paddingVertical: spacing('3'),
      paddingLeft: spacing('4'),
      paddingRight: spacing('2'),
      borderRadius: radius('xl'),
      backgroundColor: colors.tabBarBackground,
    },
    message: { flex: 1 },
    action: {
      minHeight: layout.minTouchTarget,
      justifyContent: 'center',
      paddingHorizontal: spacing('3'),
      borderRadius: radius('full'),
    },
  });
