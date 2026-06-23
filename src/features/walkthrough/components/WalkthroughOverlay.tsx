import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { ArrowRight01Icon, CheckmarkCircle01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import React, { useMemo } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { WalkthroughStep } from '../constants/steps';
import { useWalkthrough } from '../hooks/useWalkthrough';

type WalkthroughOverlayProps = {
  storageKey: string;
  steps: WalkthroughStep[];
  onFinish?: () => void;
  enabled?: boolean;
};

export const WalkthroughOverlay = React.memo(function WalkthroughOverlay({
  storageKey,
  steps,
  onFinish,
  enabled = true,
}: WalkthroughOverlayProps) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { visible, index, handleNext, handleSkip } = useWalkthrough(
    storageKey,
    steps.length,
    onFinish,
    enabled
  );

  if (!visible || steps.length === 0) return null;

  const currentStep = steps[index];

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={() => {}}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header Row */}
          <View style={styles.header}>
            <View style={styles.iconWrapper}>
              <HugeiconsIcon icon={currentStep.icon} size={20} color={colors.primary} />
            </View>
            <View style={styles.stepsBadge}>
              <Text style={styles.stepsBadgeText}>
                Step {index + 1} of {steps.length}
              </Text>
            </View>
          </View>

          {/* Content */}
          <Text style={styles.title}>{currentStep.title}</Text>
          <Text style={styles.desc}>{currentStep.desc}</Text>

          {/* Slide Dots Indicator */}
          <View style={styles.dotsRow}>
            {steps.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === index ? styles.dotActive : { backgroundColor: colors.text + '1E' },
                ]}
              />
            ))}
          </View>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <BentoPressable onPress={handleSkip} style={styles.skipBtn}>
              <Text style={styles.skipText}>Skip guide</Text>
            </BentoPressable>

            <BentoPressable onPress={handleNext} style={styles.nextBtn}>
              <Text style={styles.nextText}>
                {index === steps.length - 1 ? 'Get started' : 'Continue'}
              </Text>
              <HugeiconsIcon
                icon={index === steps.length - 1 ? CheckmarkCircle01Icon : ArrowRight01Icon}
                size={14}
                color={colors.primaryForeground}
              />
            </BentoPressable>
          </View>
        </View>
      </View>
    </Modal>
  );
});

const createStyles = ({ colors, overlay, typography, spacing, radius }: ThemeContextType) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: overlay.dim,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing('6'),
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius('2xl'),
      width: '100%',
      maxWidth: 320,
      padding: spacing('5'),
      gap: spacing('4'),
      elevation: 8,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    iconWrapper: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.primary + '12',
      justifyContent: 'center',
      alignItems: 'center',
    },
    stepsBadge: {
      paddingHorizontal: spacing('2.5'),
      height: 22,
      borderRadius: radius('full'),
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    stepsBadgeText: {
      fontFamily: typography.styles.badge.fontFamily,
      fontSize: 10,
      color: colors.textMuted,
    },
    title: {
      fontFamily: typography.fonts.heading,
      fontSize: 18,
      color: colors.text,
    },
    desc: {
      fontFamily: typography.fonts.regular,
      fontSize: 13,
      color: colors.textMuted,
      lineHeight: 18,
    },
    dotsRow: {
      flexDirection: 'row',
      gap: spacing('1.5'),
      marginVertical: spacing('1'),
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    dotActive: {
      width: 16,
      backgroundColor: colors.primary,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing('2'),
    },
    skipBtn: {
      paddingVertical: spacing('2'),
      paddingHorizontal: spacing('1'),
    },
    skipText: {
      fontFamily: typography.fonts.regular,
      fontSize: 13,
      color: colors.textMuted,
    },
    nextBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('1.5'),
      backgroundColor: colors.primary,
      height: 36,
      paddingHorizontal: spacing('4'),
      borderRadius: radius('full'),
      justifyContent: 'center',
    },
    nextText: {
      fontFamily: typography.styles.buttonLabel.fontFamily,
      fontSize: 13,
      color: colors.primaryForeground,
    },
  });
