import { BentoPressable, Button, Icon, IconAvatar, Text } from '@/src/components/ui';
import { XIcon } from '@/src/components/ui/icons';
import { WalkthroughStep } from '@/src/features/walkthrough/constants/steps';
import { useWalkthrough } from '@/src/features/walkthrough/hooks/useWalkthrough';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// The tip sits on the ink surface (same as the tab bar) so it separates from
// content without a shadow.
type WalkthroughOverlayProps = {
  storageKey: string;
  steps: WalkthroughStep[];
  onFinish?: () => void;
  enabled?: boolean;
};

/**
 * A small, non-blocking tip card that floats above the tab bar the first time
 * a screen is opened. The screen stays fully usable underneath; the tip goes
 * away for good on "Got it" or ✕. Keep each screen to one or two tips.
 */
export const WalkthroughOverlay = React.memo(function WalkthroughOverlay({
  storageKey,
  steps,
  onFinish,
  enabled = true,
}: WalkthroughOverlayProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { visible, index, handleNext, handleSkip } = useWalkthrough(storageKey, steps.length, onFinish, enabled);

  if (!visible || steps.length === 0) return null;

  const step = steps[index];
  const isLast = index === steps.length - 1;
  // Sits above both the floating tab bar and screen FABs (56pt + margin).
  const bottom = insets.bottom + 56 + theme.spacing('4') + theme.spacing('4');

  return (
    <Animated.View
      key={step.id}
      entering={FadeInDown.duration(220)}
      exiting={FadeOutDown.duration(160)}
      style={[styles.wrap, { bottom }]}
      pointerEvents="box-none"
    >
      <View style={styles.card} accessibilityRole="alert">
        <IconAvatar icon={step.icon} color={theme.colors.primary} size={40} weight="duotone" />
        <View style={styles.body}>
          <Text variant="bodyStrong" color={theme.colors.onInk}>{t(`walkthrough.${step.id}.title`)}</Text>
          <Text variant="callout" color={theme.colors.onInkMuted}>{t(`walkthrough.${step.id}.desc`)}</Text>
          <View style={styles.footer}>
            {steps.length > 1 ? (
              <Text variant="caption" color={theme.colors.onInkMuted} style={styles.counter}>
                {t('walkthrough.step', { current: index + 1, total: steps.length })}
              </Text>
            ) : <View style={styles.counter} />}
            <Button
              title={isLast ? t('walkthrough.gotIt') : t('walkthrough.next')}
              onPress={handleNext}
              size="sm"
            />
          </View>
        </View>
        <BentoPressable
          onPress={handleSkip}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t('walkthrough.skip')}
          style={styles.close}
        >
          <Icon icon={XIcon} size={16} color={theme.colors.onInkMuted} weight="bold" />
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
      alignItems: 'flex-start',
      gap: spacing('3'),
      padding: spacing('4'),
      borderRadius: radius('xl'),
      backgroundColor: colors.tabBarBackground,
    },
    body: { flex: 1, gap: spacing('1') },
    footer: { flexDirection: 'row', alignItems: 'center', marginTop: spacing('2') },
    counter: { flex: 1 },
    close: { width: 24, height: 24, borderRadius: radius('full'), alignItems: 'center', justifyContent: 'center' },
  });
