import { Card, Checklist, Emblem, Header, ListGroup, ListRow, Screen, Section, Switch, Text, useStyles, useToast } from '@/design';
import type { Theme } from '@/design';
import { useLegalLinks } from '@/features/settings/hooks/useLegalLinks';
import { useSettings } from '@/features/settings/SettingsProvider';
import { getFormattedAppVersion } from '@/platform/config/version';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, StyleSheet, View } from 'react-native';

/** Where the people who make Fintraq can be found. */
const MAKER_SITE = 'https://idexa.app';

/**
 * What Fintraq is for, who makes it, and what it does with what it knows:
 * the promises first, then the maker, then the fine print.
 */
export function AboutScreen() {
  const { t } = useTranslation('settings');
  const styles = useStyles(createStyles);
  const router = useRouter();
  const toast = useToast();
  const { profile, updateProfile } = useSettings();
  const { privacyUrl, termsUrl } = useLegalLinks();

  const back = () => (router.canGoBack() ? router.back() : router.replace('/settings'));
  // Pages on the web open in the phone's browser: the app carries no web view of its own.
  const openPage = (url: string) => void Linking.openURL(url).catch(() => toast.show({ message: t('about.pageFailed') }));

  return (
    <Screen header={<Header title={t('about.title')} onBack={back} backLabel={t('back')} />}>
      <View style={styles.top}>
        <Emblem icon="wallet" color="green" />
        <View style={styles.name}>
          <Text variant="display" align="center" accessibilityRole="header">{t('about.name')}</Text>
          <Text variant="lead" align="center">{t('about.tagline')}</Text>
          <Text variant="callout" tone="muted" align="center">{t('about.version', { version: getFormattedAppVersion() })}</Text>
        </View>
      </View>

      <Section title={t('about.idea.title')} hint={t('about.idea.hint')}>
        {/* The checklist brings its own padding. */}
        <Card padded={false}>
          <Checklist items={[t('about.idea.free'), t('about.idea.private'), t('about.idea.pro')]} />
        </Card>
      </Section>

      <Section title={t('about.maker.title')} hint={t('about.maker.hint')}>
        <ListGroup>
          <ListRow icon="heart" strong title={t('about.maker.name')} subtitle={t('about.maker.line')} />
          <ListRow icon="globe" title={t('about.maker.site')} onPress={() => openPage(MAKER_SITE)} />
        </ListGroup>
      </Section>

      <Section title={t('about.print.title')} hint={t('about.print.hint')}>
        <ListGroup>
          <ListRow icon="chart-bar" title={t('about.usage')} subtitle={t('about.usageHint')} trailing={<Switch value={profile.shareUsageData} onValueChange={(shareUsageData) => void updateProfile({ shareUsageData })} accessibilityLabel={t('about.usage')} />} />
          <ListRow icon="shield-check" title={t('about.privacy')} disabled={!privacyUrl} onPress={() => openPage(privacyUrl)} />
          <ListRow icon="file-text" title={t('about.terms')} disabled={!termsUrl} onPress={() => openPage(termsUrl)} />
          {/* Development builds only. A release build opens the tools by link alone (`luno://developer`). */}
          {__DEV__ ? <ListRow icon="flask" title={t('about.developer')} subtitle={t('about.developerHint')} onPress={() => router.push('/developer')} /> : null}
        </ListGroup>
        <Text variant="callout" tone="muted" align="center">{t('about.stored')}</Text>
      </Section>
    </Screen>
  );
}

const createStyles = ({ space }: Theme) =>
  StyleSheet.create({
    top: { alignItems: 'center', gap: space.lg, paddingTop: space.lg },
    name: { gap: space.xs },
  });
