import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Badge, BentoPressable, Icon, IconAvatar, Text } from '@/src/components/ui';
import { useProAccess } from '@/src/features/premium/hooks/useProAccess';
import { FEATURE_COPY_PARAMS, PRO_FEATURES, ProFeatureId } from '@/src/features/premium/pro-features';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';

type Props = {
  feature: ProFeatureId;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Renders `children` for Pro users. Free users see what the section is, in the same card shape as
 * every other widget, and tapping it opens the paywall on that feature.
 */
export const ProGate = React.memo(function ProGate({ feature, children, style }: Props) {
  const { isPremium, openPaywall } = useProAccess();
  if (isPremium) return <>{children}</>;
  return <ProLockedCard feature={feature} onPress={() => openPaywall(feature)} style={style} />;
});

type LockedCardProps = { feature: ProFeatureId; onPress: () => void; style?: StyleProp<ViewStyle> };

export const ProLockedCard = React.memo(function ProLockedCard({ feature, onPress, style }: LockedCardProps) {
  const theme = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const title = t(`premium.features.${feature}.title`);

  return (
    <BentoPressable style={[styles.card, style]} onPress={onPress} accessibilityRole="button" accessibilityLabel={`${title}, ${t('premium.gate.upgrade')}`}>
      <IconAvatar icon={PRO_FEATURES[feature].icon} color={colors.primaryInk} size={40} iconSize={18} />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text variant="bodyStrong" numberOfLines={1} style={styles.title}>
            {title}
          </Text>
          <Badge label={t('premium.pro')} color={colors.warning} />
        </View>
        <Text variant="caption" tone="muted" numberOfLines={2}>
          {t(`premium.features.${feature}.description`, FEATURE_COPY_PARAMS)}
        </Text>
      </View>
      <Icon name="chevron-right" size={16} color={colors.textMuted} />
    </BentoPressable>
  );
});

const createStyles = ({ colors, spacing, radius }: ThemeContextType) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3'),
      padding: spacing('4'),
      borderRadius: radius('xl'),
      backgroundColor: colors.surface,
    },
    body: { flex: 1, gap: spacing('0.5') },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing('2') },
    title: { flexShrink: 1 },
  });
