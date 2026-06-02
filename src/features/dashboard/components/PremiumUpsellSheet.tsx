import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { PICKER_CONTRAST_COLOR } from '@/src/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const BLOCK = 5;

export const PremiumUpsellSheet = React.memo(function PremiumUpsellSheet({
  visible,
  onClose,
}: Props) {
  const theme = useTheme();
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
    <Modal transparent visible={visible} animationType="fade" onRequestClose={() => {}}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Keeep Pro</Text>
          <Text style={styles.headline}>
            One-time purchase. Unlock analytics, search, reports, and CSV export.
          </Text>

          {canDismiss ? (
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>
          ) : null}

          <View style={styles.list}>
            <View style={styles.row}>
              <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />
              <Text style={styles.rowText}>Spending trends & burn velocity</Text>
            </View>
            <View style={styles.row}>
              <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />
              <Text style={styles.rowText}>Runway forecasts & performance deltas</Text>
            </View>
            <View style={styles.row}>
              <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />
              <Text style={styles.rowText}>Global search across all data</Text>
            </View>
            <View style={styles.row}>
              <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />
              <Text style={styles.rowText}>CSV export & weekly/monthly reports</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.cta, !canDismiss && { opacity: 0.6 }]}
            onPress={handleUpgrade}
            activeOpacity={0.85}
            disabled={!canDismiss}
          >
            <Text style={styles.ctaText}>
              {canDismiss ? 'Get lifetime access' : `Get lifetime access in ${left}s`}
            </Text>
          </TouchableOpacity>

          {canDismiss ? (
            <TouchableOpacity onPress={onClose} activeOpacity={0.6} style={styles.skip}>
              <Text style={styles.skipText}>Not now</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </Modal>
  );
});

const createStyles = ({ colors, overlay, typography, spacing, radius, layout }: ThemeContextType) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: overlay.dim,
      justifyContent: 'flex-end',
      padding: layout.screenPadding,
      paddingBottom: Platform.OS === 'ios' ? spacing('8') : spacing('6'),
    },
    sheet: {
      backgroundColor: colors.surface,
      borderRadius: radius('2xl'),
      borderWidth: 0.5,
      borderColor: colors.text + '0C',
      padding: spacing('5'),
    },
    title: {
      fontFamily: typography.fonts.heading,
      fontSize: 22,
      color: colors.text,
      marginBottom: spacing('2'),
    },
    headline: {
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.sm,
      color: colors.textMuted,
      lineHeight: 20,
      marginBottom: spacing('4'),
      paddingRight: spacing('8'),
    },
    closeBtn: {
      position: 'absolute',
      top: spacing('4'),
      right: spacing('4'),
    },
    list: {
      gap: spacing('3'),
      marginBottom: spacing('5'),
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3'),
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: radius('full'),
    },
    rowText: {
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.sm,
      color: colors.text,
    },
    cta: {
      height: 52,
      borderRadius: radius('md'),
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    ctaText: {
      fontFamily: typography.fonts.bold,
      fontSize: typography.sizes.md,
      color: PICKER_CONTRAST_COLOR,
    },
    skip: {
      alignItems: 'center',
      marginTop: spacing('3'),
    },
    skipText: {
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.sm,
      color: colors.textMuted,
    },
  });
