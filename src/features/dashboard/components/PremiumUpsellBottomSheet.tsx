import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { Modal, Platform, StyleSheet, Text, View } from 'react-native';

type PremiumUpsellBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
};

const BLOCK = 5;

const PRO_FEATURES = [
  { icon: 'chart-timeline-variant' as const, text: 'Spending trends & burn velocity' },
  { icon: 'lightning-bolt' as const, text: 'Runway forecasts & metrics' },
  { icon: 'magnify' as const, text: 'Global search across all data' },
  { icon: 'file-document-outline' as const, text: 'CSV export & weekly/monthly reports' },
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
    <Modal transparent visible={visible} animationType="slide" onRequestClose={() => {}}>
      <View style={styles.overlay}>
        <BentoPressable style={styles.backdrop} onPress={canDismiss ? onClose : undefined} />
        <View style={styles.sheet}>
          <View style={styles.dragHandle} />

          {/* Header Row with Crown Icon */}
          <View style={styles.header}>
            <View style={styles.crownWrapper}>
              <MaterialCommunityIcons name="crown" size={24} color={colors.warning} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>Unlock Keeep Pro</Text>
              <Text style={styles.subtitle}>One-time lifetime access</Text>
            </View>
          </View>

          {canDismiss ? (
            <BentoPressable onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialCommunityIcons name="close" size={20} color={colors.textMuted} />
            </BentoPressable>
          ) : null}

          {/* Feature Bento List */}
          <View style={styles.list}>
            {PRO_FEATURES.map((item, index) => (
              <View key={index} style={styles.row}>
                <View style={styles.iconWrapper}>
                  <MaterialCommunityIcons name={item.icon} size={18} color={colors.primary} />
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
      </View>
    </Modal>
  );
});

const createStyles = ({ colors, overlay, typography, spacing, radius, layout, onAccent }: ThemeContextType) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: overlay.dim,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
    },
    dragHandle: {
      width: 32,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.text + '24',
      alignSelf: 'center',
      marginTop: spacing('2'),
      marginBottom: spacing('4'),
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: spacing('6'),
      paddingBottom: Platform.OS === 'ios' ? spacing('8') : spacing('6'),
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
      top: spacing('5'),
      right: spacing('4'),
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
      color: colors.background,
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
