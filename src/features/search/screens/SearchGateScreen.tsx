import { Badge, Button, IconAvatar, ListGroup, ListItem, Screen, Text } from '@/src/components/ui';
import { MagnifyingGlassIcon, ReceiptIcon, SparkleIcon, TagIcon, WalletIcon } from '@/src/components/ui/icons';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

const SEARCH_FEATURES = [
  { icon: ReceiptIcon, key: 'transactions' as const },
  { icon: WalletIcon, key: 'accounts' as const },
  { icon: TagIcon, key: 'categories' as const },
];

/** Shown instead of Search for free users: what search does, and the way to unlock it. */
export const SearchGateScreen = React.memo(function SearchGateScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { colors } = theme;
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Screen
      header={{ title: '', showBack: true }}
      footer={
        <View style={styles.footer}>
          <Button title={t('searchGate.upgrade')} icon={SparkleIcon} onPress={() => router.push('/premium')} size="lg" fullWidth />
          <Button title={t('searchGate.notNow')} onPress={() => router.back()} variant="ghost" size="lg" fullWidth />
        </View>
      }
    >
      <View style={styles.hero}>
        <View>
          <IconAvatar icon={MagnifyingGlassIcon} color={colors.primaryInk} size={72} iconSize={32} />
          <Badge label={t('searchGate.pro')} variant="count" style={styles.proBadge} />
        </View>
        <Text variant="title" align="center">{t('searchGate.title')}</Text>
        <Text variant="body" tone="muted" align="center">{t('searchGate.subtitle')}</Text>
      </View>

      <ListGroup>
        {SEARCH_FEATURES.map((f) => (
          <ListItem key={f.key} icon={f.icon} iconColor={colors.primaryInk} title={t(`searchGate.${f.key}`)} />
        ))}
      </ListGroup>
    </Screen>
  );
});

const createStyles = ({ spacing }: ThemeContextType) =>
  StyleSheet.create({
    hero: { alignItems: 'center', gap: spacing('3'), paddingTop: spacing('6'), paddingHorizontal: spacing('4') },
    proBadge: { position: 'absolute', right: -8, bottom: -6 },
    footer: { gap: spacing('1') },
  });
