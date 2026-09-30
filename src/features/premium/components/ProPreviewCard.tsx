import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Button, Icon, IconAvatar, Text } from '@/src/components/ui';
import { LockKeyIcon, SparkleIcon } from '@/src/components/ui/icons';
import { useProAccess } from '@/src/features/premium/hooks/useProAccess';
import { PRO_FEATURES, ProFeatureId } from '@/src/features/premium/pro-features';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';

type Props = {
  /** What this screen would show with Pro, in display order. The first one is highlighted on the paywall. */
  features: readonly [ProFeatureId, ...ProFeatureId[]];
};

/**
 * One card listing every locked section of a screen, with a single upgrade button — instead of a
 * stack of lock cards that makes a free user's screen mostly padlocks.
 */
export const ProPreviewCard = React.memo(function ProPreviewCard({ features }: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();
  const { openPaywall } = useProAccess();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <IconAvatar icon={SparkleIcon} color={colors.warning} size={40} iconSize={18} />
        <View style={styles.headerText}>
          <Text variant="subheading">{t('premium.gate.previewTitle')}</Text>
          <Text variant="caption" tone="muted">
            {t('premium.gate.previewHint')}
          </Text>
        </View>
      </View>

      <View style={styles.list}>
        {features.map((id) => (
          <View key={id} style={styles.row}>
            <IconAvatar icon={PRO_FEATURES[id].icon} color={colors.primaryInk} size={32} iconSize={15} />
            <Text variant="calloutStrong" numberOfLines={1} style={styles.rowText}>
              {t(`premium.features.${id}.title`)}
            </Text>
            <Icon icon={LockKeyIcon} size={14} color={colors.textMuted} />
          </View>
        ))}
      </View>

      <Button title={t('premium.gate.seeAll')} icon={SparkleIcon} onPress={() => openPaywall(features[0])} fullWidth />
    </View>
  );
});

const createStyles = ({ colors, spacing, radius }: ThemeContextType) =>
  StyleSheet.create({
    card: { backgroundColor: colors.surface, borderRadius: radius('xl'), padding: spacing('4'), gap: spacing('4') },
    header: { flexDirection: 'row', alignItems: 'center', gap: spacing('3') },
    headerText: { flex: 1, gap: spacing('0.5') },
    list: { gap: spacing('2.5') },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing('3') },
    rowText: { flex: 1 },
  });
