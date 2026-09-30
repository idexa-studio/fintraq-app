import { IconButton } from '@/src/components/ui/IconButton';
import { Button } from '@/src/components/ui/Button';
import { Text } from '@/src/components/ui/Text';
import { Icon } from '@/src/components/ui/Icon';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { CancelCircleIcon, ChartLineData01Icon, CheckmarkCircle01Icon, CrownIcon, Download01Icon, Search01Icon, SparklesIcon, TrendingUpDownIcon } from '@hugeicons/core-free-icons';
import type { IconSource } from '@/src/components/ui/Icon';
import { useRouter } from 'expo-router';
import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { Modal, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { alpha } from '@/src/theme/tokens';

type PremiumUpsellModalProps = {
  visible: boolean;
  onClose: () => void;
};

const BLOCK = 5;

const PRO_FEATURES: { icon: IconSource; label: 'upsellTrends' | 'upsellHighlights' | 'upsellSearch' | 'upsellCsv' | 'upsellExtended' }[] = [
  { icon: ChartLineData01Icon, label: 'upsellTrends' },
  { icon: SparklesIcon,        label: 'upsellHighlights' },
  { icon: Search01Icon,        label: 'upsellSearch' },
  { icon: Download01Icon,      label: 'upsellCsv' },
  { icon: TrendingUpDownIcon,       label: 'upsellExtended' },
];

export const PremiumUpsellModal = React.memo(function PremiumUpsellModal({
  visible,
  onClose,
}: PremiumUpsellModalProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { colors } = theme;
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme, screenWidth), [theme, screenWidth]);
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

  const handleClose = useCallback(() => {
    if (canDismiss) onClose();
  }, [canDismiss, onClose]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* ── Header ── */}
          <View style={styles.header}>
            <View style={[styles.crownBadge, { backgroundColor: alpha(colors.warning, 'subtle') }]}>
              <Icon icon={CrownIcon} size={26} color={colors.warning} />
            </View>

            <View style={styles.headerText}>
              <Text style={styles.title}>{t('premium.title')}</Text>
              <View style={[styles.lifetimePill, { backgroundColor: alpha(colors.warning, 'subtle') }]}>
                <Text style={[styles.lifetimeLabel, { color: colors.warning }]}>{t('premium.oneTimeLifetime')}</Text>
              </View>
            </View>

            {canDismiss && (
              <IconButton icon={CancelCircleIcon} variant="ghost" size="sm" onPress={onClose} accessibilityLabel={t('common.close')} />
            )}
          </View>

          {/* ── Feature list ── */}
          <View style={[styles.featureCard, { backgroundColor: colors.background }]}>
            {PRO_FEATURES.map((item, i) => (
              <View
                key={i}
                style={[
                  styles.featureRow,
                  i < PRO_FEATURES.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
                ]}
              >
                <View style={[styles.featureIcon, { backgroundColor: colors.surface }]}>
                  <Icon icon={item.icon} size={16} color={colors.primaryInk} />
                </View>
                <Text style={styles.featureLabel}>{t(`premium.${item.label}`)}</Text>
                <Icon icon={CheckmarkCircle01Icon} size={16} color={colors.success} />
              </View>
            ))}
          </View>

          {/* ── CTA ── */}
          <View style={styles.footer}>
            <Button
              title={canDismiss ? t('premium.unlockPro') : t('premium.unlockIn', { seconds: left })}
              onPress={handleUpgrade}
              disabled={!canDismiss}
              size="lg"
              fullWidth
            />

            {canDismiss && (
              <Button title={t('premium.maybeLater')} onPress={onClose} variant="ghost" fullWidth />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
});

const createStyles = ({ colors, typography, spacing, radius, shadow, overlay, state }: ThemeContextType, screenWidth: number) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: overlay.dim,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing('6'),
    },
    card: {
      width: Math.min(screenWidth - spacing('8'), 380),
      backgroundColor: colors.surface,
      borderRadius: radius('2xl'),
      padding: spacing('5'),
      gap: spacing('4'),
    },
    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3'),
    },
    crownBadge: {
      width: 48,
      height: 48,
      borderRadius: radius('xl'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerText: {
      flex: 1,
      gap: spacing('1'),
    },
    title: {
      fontFamily: typography.fonts.heading,
      ...typography.metrics.xxl,
      letterSpacing: -0.3,
      color: colors.text,
    },
    lifetimePill: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing('2.5'),
      paddingVertical: spacing('0.5'),
      borderRadius: radius('full'),
    },
    lifetimeLabel: {
      fontFamily: typography.fonts.medium,
      ...typography.metrics.xs,
    },
    // Features
    featureCard: {
      borderRadius: radius('xl'),
      overflow: 'hidden',
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3'),
      paddingHorizontal: spacing('4'),
      paddingVertical: spacing('3'),
    },
    featureIcon: {
      width: 32,
      height: 32,
      borderRadius: radius('lg'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    featureLabel: {
      fontFamily: typography.fonts.regular,
      ...typography.metrics.sm,
      flex: 1,
      color: colors.text,
    },
    // Footer
    footer: {
      gap: spacing('2'),
    },
  });
