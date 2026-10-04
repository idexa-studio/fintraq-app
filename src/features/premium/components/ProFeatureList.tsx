import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Divider, Icon, IconAvatar, LIST_ITEM_LEADING_SIZE, Text } from '@/src/components/ui';
import {
  FEATURE_COPY_PARAMS,
  featuresInGroup,
  PRO_FEATURE_GROUPS,
  PRO_FEATURES,
  ProFeatureId,
} from '@/src/features/premium/pro-features';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';

type Props = {
  /** Owned features get a check; otherwise they read as what you'd get. */
  unlocked?: boolean;
  /** Left out of the list — the paywall shows it on its own above. */
  exclude?: ProFeatureId;
};

/** Every Pro feature, grouped by area. The single rendering used by the paywall and the Pro screen. */
export const ProFeatureList = React.memo(function ProFeatureList({ unlocked = false, exclude }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const dividerInset = theme.spacing('4') + LIST_ITEM_LEADING_SIZE + theme.spacing('3.5');

  return (
    <View style={styles.groups}>
      {PRO_FEATURE_GROUPS.map((group) => {
        const ids = featuresInGroup(group).filter((id) => id !== exclude);
        if (ids.length === 0) return null;
        return (
          <View key={group}>
            <Text variant="label" tone="muted" style={styles.groupTitle}>
              {t(`premium.groups.${group}`)}
            </Text>
            <View style={styles.card}>
              {ids.map((id, i) => (
                <React.Fragment key={id}>
                  {i > 0 ? <Divider inset={dividerInset} /> : null}
                  <ProFeatureRow feature={id} unlocked={unlocked} />
                </React.Fragment>
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
});

type RowProps = { feature: ProFeatureId; unlocked?: boolean };

export const ProFeatureRow = React.memo(function ProFeatureRow({ feature, unlocked = false }: RowProps) {
  const theme = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.row}>
      <IconAvatar icon={PRO_FEATURES[feature].icon} color={unlocked ? colors.success : colors.primaryInk} size={LIST_ITEM_LEADING_SIZE} />
      <View style={styles.body}>
        <Text variant="bodyStrong">{t(`premium.features.${feature}.title`)}</Text>
        <Text variant="caption" tone="muted">
          {t(`premium.features.${feature}.description`, FEATURE_COPY_PARAMS)}
        </Text>
      </View>
      {unlocked ? <Icon name="check-circle" size={18} color={colors.success} /> : null}
    </View>
  );
});

const createStyles = ({ colors, spacing, radius }: ThemeContextType) =>
  StyleSheet.create({
    groups: { gap: spacing('5') },
    groupTitle: { marginBottom: spacing('2'), marginLeft: spacing('1') },
    card: { borderRadius: radius('xl'), backgroundColor: colors.surface, overflow: 'hidden' },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3.5'),
      paddingHorizontal: spacing('4'),
      paddingVertical: spacing('3.5'),
    },
    body: { flex: 1, gap: spacing('0.5') },
  });
