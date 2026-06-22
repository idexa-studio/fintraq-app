import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import {
  CancelCircleIcon,
  ChartLineData01Icon,
  CrownIcon,
  File01Icon,
  Rocket01Icon,
  Search01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import type { IconSvgElement } from '@hugeicons/react-native';
import { useRouter } from 'expo-router';
import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BentoBottomSheet } from '@/src/components/ui/BottomSheet';

type PremiumUpsellBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
};

const BLOCK = 5;

const PRO_FEATURES: { icon: IconSvgElement; text: string }[] = [
  { icon: ChartLineData01Icon, text: 'Spending trends & burn velocity' },
  { icon: Rocket01Icon, text: 'Runway forecasts & metrics' },
  { icon: Search01Icon, text: 'Global search across all data' },
  { icon: File01Icon, text: 'CSV export & weekly/monthly reports' },
];

export const PremiumUpsellBottomSheet = React.memo(function PremiumUpsellBottomSheet({
  visible,
  onClose,
}: PremiumUpsellBottomSheetProps) {
  const theme = useTheme();
  const { colors } = theme;
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [canDismiss, setCanDismiss] = useState(false);
  const [left, setLeft] = useState(BLOCK);

  useEffect(() => {
    if (!visible) {
      setCanDismiss(false);
      setLeft(BLOCK);
      return;
    }
    const id = setInterval(() => {
      setLeft(prev => {
        if (prev <= 1) { clearInterval(id); setCanDismiss(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [visible]);

  const handleUpgrade = useCallback(() => {
    onClose();
    router.push('/premium');
  }, [onClose, router]);

  return (
    <BentoBottomSheet
      visible={visible}
      onClose={onClose}
      enablePanDownToClose={canDismiss}
      enableBackdropDismiss={canDismiss}
    >
      <View style={styles.content}>
        {/* Header Row with Crown Icon */}
        <View style={styles.header}>
          <View style={styles.crownWrapper}>
            <HugeiconsIcon icon={CrownIcon} size={24} color={colors.warning} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Unlock Fintraq Pro</Text>
            <Text style={styles.subtitle}>One-time lifetime access</Text>
          </View>
        </View>

        {canDismiss ? (
          <BentoPressable onPress={onClose} style={styles.closeBtn}>
            <HugeiconsIcon icon={CancelCircleIcon} size={18} color={colors.text} />
          </BentoPressable>
        ) : null}

        {/* Feature Bento List */}
        <View style={styles.list}>
          {PRO_FEATURES.map((item, index) => (
            <View key={index} style={styles.row}>
              <View style={styles.iconWrapper}>
                <HugeiconsIcon icon={item.icon} size={18} color={colors.primary} />
              </View>
              <Text style={styles.rowText}>{item.text}</Text>
            </View>
          ))}
        </View>

        <BentoPressable
          style={[styles.cta, !canDismiss && styles.ctaDisabled]}
          onPress={handleUpgrade}
          disabled={!canDismiss}
        >
          <Text style={styles.ctaText}>
            {canDismiss ? 'Get lifetime access' : `Get lifetime access in ${left}s`}
          </Text>
        </BentoPressable>

        {canDismiss ? (
          <BentoPressable onPress={onClose} style={styles.skip}>
            <Text style={styles.skipText}>Not now</Text>
          </BentoPressable>
        ) : null}
      </View>
    </BentoBottomSheet>
  );
});

const createStyles = ({ colors, typography, spacing, radius }: ThemeContextType) =>
  StyleSheet.create({
    content: {
      paddingHorizontal: spacing('6'),
      paddingBottom: spacing('3'),
      paddingTop: spacing('2'),
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3'),
      marginBottom: spacing('5'),
    },
    crownWrapper: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.warning + '12',
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerText: {
      flex: 1,
      gap: spacing('0.5'),
    },
    title: {
      fontFamily: typography.fonts.heading,
      fontSize: 20,
      color: colors.text,
    },
    subtitle: {
      fontFamily: typography.fonts.regular,
      fontSize: 12,
      color: colors.textMuted,
    },
    closeBtn: {
      position: 'absolute',
      top: spacing('4'),
      right: spacing('6'),
      width: 32,
      height: 32,
      borderRadius: radius('full'),
      backgroundColor: colors.text + '0C',
      justifyContent: 'center',
      alignItems: 'center',
    },
    list: {
      gap: spacing('2'),
      marginBottom: spacing('5'),
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3.5'),
      backgroundColor: colors.background,
      padding: spacing('3'),
      borderRadius: radius('lg'),
    },
    iconWrapper: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primary + '12',
      justifyContent: 'center',
      alignItems: 'center',
    },
    rowText: {
      fontFamily: typography.fonts.semibold,
      fontSize: 13,
      color: colors.text,
      flex: 1,
    },
    cta: {
      height: 52,
      borderRadius: radius('full'),
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    ctaDisabled: {
      opacity: 0.65,
    },
    ctaText: {
      fontFamily: typography.fonts.bold,
      fontSize: typography.sizes.md,
      color: colors.primaryForeground,
    },
    skip: {
      alignItems: 'center',
      marginTop: spacing('3.5'),
    },
    skipText: {
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.sm,
      color: colors.textMuted,
    },
  });
