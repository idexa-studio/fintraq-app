import { Badge, Button, Emblem, Header, ListGroup, ListRow, Message, Screen, Section, useStyles } from '@/design';
import type { Theme } from '@/design';
import { useProCopy } from '@/features/pro/pro-copy.en';
import { LIVE_FEATURES, PRO_FEATURES, featuresIn } from '@/features/pro/pro-features';
import type { ProFeatureId } from '@/features/pro/pro-features';
import { usePro } from '@/features/pro/ProProvider';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

/** How many other features are named under the one that was asked for. */
const ALSO = 3;

export type ProGateScreenProps = {
  /** The Pro feature this whole screen is. */
  feature: ProFeatureId;
};

/**
 * Stands in for a screen that is Pro as a whole (search, export) when a free
 * user reaches it by any way, a link included: what it is, what else comes
 * with it, and one way to the plans.
 */
export function ProGateScreen({ feature }: ProGateScreenProps) {
  const { t } = useTranslation('common');
  const styles = useStyles(createStyles);
  const router = useRouter();
  const { openPaywall } = usePro();
  const copy = useProCopy();
  // Its neighbours in the same pillar first, then the rest of what is live.
  const others = [...new Set([...featuresIn(PRO_FEATURES[feature].pillar, 'live'), ...LIVE_FEATURES])].filter((id) => id !== feature).slice(0, ALSO);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <Screen header={<Header onBack={back} backLabel={t('back')} />} footer={<Button label={t('pro.see')} onPress={() => openPaywall(feature)} />}>
      <View style={styles.top}>
        <Message
          illustration={
            <View style={styles.mark}>
              <Emblem icon={PRO_FEATURES[feature].icon} />
              <View style={styles.badge}><Badge label={t('pro.badge')} /></View>
            </View>
          }
          title={copy.feature(feature).title}
          body={copy.feature(feature).description}
        />
      </View>
      <Section title={t('pro.also')}>
        <ListGroup>
          {others.map((id) => <ListRow key={id} icon={PRO_FEATURES[id].icon} title={copy.feature(id).title} subtitle={copy.feature(id).description} />)}
        </ListGroup>
      </Section>
    </Screen>
  );
}

const createStyles = ({ space }: Theme) =>
  StyleSheet.create({
    top: { paddingTop: space.xl },
    mark: { alignItems: 'center' },
    // The badge overlaps the foot of the emblem, as a stamp on it.
    badge: { marginTop: -space.md },
  });
