import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Badge, Button, Divider, IconAvatar, LIST_ITEM_LEADING_SIZE, Screen, Text } from '@/src/components/ui';
import { ProFeatureRow } from '@/src/features/premium/components/ProFeatureList';
import { useProAccess } from '@/src/features/premium/hooks/useProAccess';
import { FEATURE_COPY_PARAMS, HEADLINE_FEATURES, PRO_FEATURES, ProFeatureId } from '@/src/features/premium/pro-features';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';

type Props = { feature: ProFeatureId };

/** Stands in for a whole Pro-only screen (search, export) when a free user reaches it by any route. */
export const ProGateScreen = React.memo(function ProGateScreen({ feature }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { colors, spacing } = theme;
  const router = useRouter();
  const { openPaywall } = useProAccess();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const others = HEADLINE_FEATURES.filter((id) => id !== feature).slice(0, 3);

  return (
    <Screen
      header={{ title: '', showBack: true }}
      footer={
        <View style={styles.footer}>
          <Button title={t('premium.gate.upgrade')} icon="sparkle" onPress={() => openPaywall(feature)} size="lg" fullWidth />
          <Button title={t('premium.gate.notNow')} onPress={() => router.back()} variant="ghost" size="lg" fullWidth />
        </View>
      }
    >
      <View style={styles.hero}>
        <View>
          <IconAvatar icon={PRO_FEATURES[feature].icon} color={colors.primaryInk} size={72} iconSize={32} />
          <Badge label={t('premium.pro')} variant="count" style={styles.proBadge} />
        </View>
        <Text variant="title" align="center">
          {t(`premium.features.${feature}.title`)}
        </Text>
        <Text variant="body" tone="muted" align="center">
          {t(`premium.features.${feature}.description`, FEATURE_COPY_PARAMS)}
        </Text>
      </View>

      <View>
        <Text variant="label" tone="muted" style={styles.groupTitle}>
          {t('premium.gate.alsoIncluded')}
        </Text>
        <View style={styles.card}>
          {others.map((id, i) => (
            <React.Fragment key={id}>
              {i > 0 ? <Divider inset={spacing('4') + LIST_ITEM_LEADING_SIZE + spacing('3.5')} /> : null}
              <ProFeatureRow feature={id} />
            </React.Fragment>
          ))}
        </View>
      </View>
    </Screen>
  );
});

const createStyles = ({ colors, spacing, radius }: ThemeContextType) =>
  StyleSheet.create({
    hero: { alignItems: 'center', gap: spacing('3'), paddingTop: spacing('6'), paddingHorizontal: spacing('4') },
    proBadge: { position: 'absolute', right: -8, bottom: -6 },
    groupTitle: { marginBottom: spacing('2'), marginLeft: spacing('1') },
    card: { borderRadius: radius('xl'), backgroundColor: colors.surface, overflow: 'hidden' },
    footer: { gap: spacing('1') },
  });
