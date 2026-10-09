import { Badge, Button, Card, Dialog, Emblem, Header, ListGroup, ListRow, Message, Money, Notice, Screen, Section, Skeleton, Text, useStyles, useTheme, useToast } from '@/design';
import type { Theme } from '@/design';
import { useProCopy } from '@/features/pro/pro-copy.en';
import { LIVE_FEATURES, PRO_FEATURES, UPCOMING_FEATURES } from '@/features/pro/pro-features';
import type { ProFeatureId } from '@/features/pro/pro-features';
import { DEFAULT_PLAN, PRO_PLANS, discountPercent, lifetimeBreakEvenMonths, yearlySavingPercent } from '@/features/pro/pro-plans';
import type { PlanPrice, ProPlan } from '@/features/pro/pro-plans';
import { useProStore } from '@/features/pro/ProProvider';
import { useLegalLinks } from '@/platform/config/legal-links';
import type { SubscriptionPlan } from '@/platform/purchases/entitlement';
import { openStoreSubscriptions } from '@/platform/purchases/store';
import { Analytics } from '@/platform/telemetry';
import { formatDate } from '@/shared/date/date';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Platform, StyleSheet, View } from 'react-native';

export type ProScreenProps = {
  /** The feature that led here, if one did: the paywall opens on it. */
  feature?: ProFeatureId;
};

type Trouble = 'pending' | 'failed' | null;

/**
 * Fintraq Pro, in whichever of its three states applies: the plans for someone who has not
 * bought, what is held for someone who has, and the thank-you straight after buying.
 */
export function ProScreen({ feature }: ProScreenProps) {
  const { t } = useTranslation('pro');
  const { size } = useTheme();
  const router = useRouter();
  const store = useProStore();
  const [buying, setBuying] = useState<ProPlan | null>(null);
  /** Set once a purchase is paid: the subscription it replaces, if lifetime was bought over one. */
  const [bought, setBought] = useState<{ replaced: SubscriptionPlan | null } | null>(null);
  const [trouble, setTrouble] = useState<Trouble>(null);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const header = <Header task title={t('title')} onClose={close} closeLabel={t('close')} />;

  const buy = async (plan: ProPlan) => {
    const before = store.entitlement;
    setTrouble(null);
    setBuying(plan);
    const outcome = await store.buy(plan);
    if (outcome === 'paid') setBought({ replaced: plan === 'lifetime' && before.kind === 'subscription' && before.renews ? before.plan : null });
    else if (outcome === 'pending') setTrouble('pending');
    else if (outcome === 'failed' || outcome === 'unavailable') setTrouble('failed');
    setBuying(null);
  };

  if (!store.ready) {
    return (
      <Screen sheet header={header}>
        <Skeleton height={size.row * 3} />
        <Skeleton height={size.row * 4} />
      </Screen>
    );
  }
  if (bought) return <Bought header={header} replaced={bought.replaced} onDone={close} />;
  // While the sheet is open the plans stay put: Pro switching on mid-purchase must not swap the screen under the buyer.
  if (store.isPro && !buying) return <Owned header={header} buying={false} trouble={trouble} onBuyLifetime={() => void buy('lifetime')} onDone={close} />;
  if (store.isPro) return <Owned header={header} buying trouble={trouble} onBuyLifetime={() => undefined} onDone={close} />;
  return <Plans header={header} feature={feature} buying={buying} trouble={trouble} onBuy={(plan) => void buy(plan)} />;
}

type PlansProps = { header: React.ReactNode; feature?: ProFeatureId; buying: ProPlan | null; trouble: Trouble; onBuy: (plan: ProPlan) => void };

/** The paywall: what Pro does, the three plans with lifetime first, one button, and the quiet ways out. */
function Plans({ header, feature, buying, trouble, onBuy }: PlansProps) {
  const { t } = useTranslation('pro');
  const styles = useStyles(createStyles);
  const { type } = useTheme();
  const toast = useToast();
  const copy = useProCopy();
  const { prices, priceState, loadPrices, restore } = useProStore();
  const { privacyUrl, termsUrl } = useLegalLinks();
  const [plan, setPlan] = useState<ProPlan>(DEFAULT_PLAN);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    Analytics.track('paywall_view', { source: feature ?? 'direct' });
  }, [feature]);

  const price = prices[plan];
  const months = lifetimeBreakEvenMonths(prices.lifetime, prices.monthly);
  const saving = yearlySavingPercent(prices.yearly, prices.monthly);
  // A subscription the store opens at less than its price says so, in place of its usual line.
  const opening = (option: ProPlan): '' | 'Intro' | 'Trial' => (!prices[option]?.intro ? '' : prices[option].intro.amount > 0 ? 'Intro' : 'Trial');
  const noteOf = (option: ProPlan): string => {
    const at = prices[option];
    if (option === 'lifetime') {
      const off = discountPercent(at);
      if (off && at?.regular) return t('paywall.notes.lifetimeOff', { percent: off, regular: at.regular.display });
      return months ? t('paywall.notes.lifetimeMonths', { count: months }) : t('paywall.notes.lifetime');
    }
    if (at?.intro) return t(`paywall.notes.${option}${opening(option) || 'Intro'}`, { intro: at.intro.display, price: at.display });
    if (option === 'yearly') return saving ? t('paywall.notes.yearlySaving', { percent: saving }) : t('paywall.notes.yearly');
    return t('paywall.notes.monthly');
  };
  const storeName = t(Platform.OS === 'ios' ? 'paywall.terms.storeIos' : 'paywall.terms.storeAndroid');
  const termsOf = (option: ProPlan, at: PlanPrice): string =>
    option !== 'lifetime' && at.intro
      ? t(`paywall.terms.${option}${opening(option) || 'Intro'}`, { intro: at.intro.display, price: at.display, store: storeName })
      : t(`paywall.terms.${option}`, { price: at.display, store: storeName });
  const buyLabelOf = (option: ProPlan, at: PlanPrice): string => {
    if (option !== 'lifetime' && at.intro) return at.intro.amount > 0 ? t('paywall.buy.intro', { intro: at.intro.display }) : t('paywall.buy.trial');
    return t(`paywall.buy.${option}`, { price: at.display });
  };
  // The feature that led here comes first in the list of what is included.
  const included = feature && LIVE_FEATURES.includes(feature) ? [feature, ...LIVE_FEATURES.filter((id) => id !== feature)] : LIVE_FEATURES;
  const lead = feature ? copy.feature(feature) : { title: t('paywall.title'), description: t('paywall.body') };

  const restoreNow = async () => {
    setRestoring(true);
    const outcome = await restore();
    setRestoring(false);
    toast.show({ message: t(outcome === 'restored' ? 'paywall.restored.done' : outcome === 'none' ? 'paywall.restored.none' : 'paywall.restored.failed') });
  };

  return (
    <Screen
      sheet
      header={header}
      footer={
        <>
          <Text variant="caption" tone="muted" align="center">
            {price ? termsOf(plan, price) : t(priceState === 'loading' ? 'paywall.prices.loading' : 'paywall.prices.blocked')}
          </Text>
          <Button label={price ? buyLabelOf(plan, price) : t('paywall.buy.noPrice')} onPress={() => onBuy(plan)} disabled={!price || restoring} loading={buying !== null} />
          <View style={styles.links}>
            <Button label={t('paywall.restore')} variant="link" size="sm" fullWidth={false} onPress={restoreNow} disabled={buying !== null} loading={restoring} />
            {termsUrl ? <Button label={t('paywall.terms.termsLink')} variant="link" size="sm" fullWidth={false} onPress={() => void Linking.openURL(termsUrl)} /> : null}
            {privacyUrl ? <Button label={t('paywall.terms.privacyLink')} variant="link" size="sm" fullWidth={false} onPress={() => void Linking.openURL(privacyUrl)} /> : null}
          </View>
        </>
      }
    >
      <View style={styles.lead}>
        <Message illustration={<Emblem icon={feature ? PRO_FEATURES[feature].icon : 'crown'} />} title={lead.title} body={lead.description} />
      </View>

      {trouble ? <Notice tone={trouble === 'failed' ? 'danger' : 'info'} title={t(`paywall.${trouble}.title`)} body={t(`paywall.${trouble}.body`)} /> : null}
      {priceState === 'unavailable' ? (
        <Notice tone="warning" title={t('paywall.prices.unavailableTitle')} body={t('paywall.prices.unavailableBody')} linkLabel={t('paywall.prices.retry')} onLink={() => void loadPrices()} />
      ) : null}

      <View style={styles.plans} accessibilityRole="radiogroup" accessibilityLabel={t('paywall.plans.label')}>
        {PRO_PLANS.map((option) => (
          <Card key={option} compact selected={plan === option} onPress={() => setPlan(option)} accessibilityLabel={`${t(`paywall.plans.${option}`)}, ${prices[option]?.display ?? ''}. ${prices[option]?.regular ? `${t('paywall.plans.was', { regular: prices[option].regular.display })}. ` : ''}${noteOf(option)}`} style={styles.plan}>
            <View style={styles.planHead}>
              {/* The name and its badge share what the prices leave: when that is too little the badge drops under the name, and the name is never broken. */}
              <View style={styles.planName}>
                <Text variant="bodyStrong">{t(`paywall.plans.${option}`)}</Text>
                {option === DEFAULT_PLAN ? <Badge label={t('paywall.plans.best')} /> : null}
              </View>
              {prices[option]?.regular ? <Money value={prices[option].regular.display} tone="muted" struck /> : null}
              {prices[option] ? <Money value={prices[option].display} /> : priceState === 'loading' ? <Skeleton height={type.amount.lineHeight} width="25%" /> : null}
            </View>
            <Text variant="callout" tone="muted">{noteOf(option)}</Text>
          </Card>
        ))}
      </View>

      <Section title={t('paywall.included.title')} hint={t('paywall.included.hint')}>
        <ListGroup>
          {included.map((id) => <ListRow key={id} icon={PRO_FEATURES[id].icon} title={copy.feature(id).title} subtitle={copy.feature(id).description} />)}
        </ListGroup>
      </Section>

      <Section title={t('paywall.upcoming.title')} hint={t('paywall.upcoming.hint')}>
        <ListGroup>
          {UPCOMING_FEATURES.map((id) => <ListRow key={id} icon={PRO_FEATURES[id].icon} title={copy.feature(id).title} subtitle={copy.feature(id).description} />)}
        </ListGroup>
      </Section>
    </Screen>
  );
}

type OwnedProps = { header: React.ReactNode; buying: boolean; trouble: Trouble; onBuyLifetime: () => void; onDone: () => void };

/** For someone who already has Pro: which plan, until when, and where a subscription is managed. */
function Owned({ header, buying, trouble, onBuyLifetime, onDone }: OwnedProps) {
  const { t } = useTranslation('pro');
  const styles = useStyles(createStyles);
  const { entitlement, prices } = useProStore();
  const subscription = entitlement.kind === 'subscription' ? entitlement : null;
  const until = subscription ? formatDate(new Date(subscription.activeUntil), { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  const line = entitlement.kind === 'lifetime'
    ? t('owned.lifetime')
    : subscription
      ? t(subscription.renews ? 'owned.renews' : 'owned.ends', { plan: t(`paywall.plans.${subscription.plan}`), date: until })
      : t('owned.override');

  return (
    <Screen
      sheet
      centred
      header={header}
      footer={
        <>
          <Button label={t('owned.done')} onPress={onDone} disabled={buying} />
          {subscription ? <Button label={t('owned.manage')} variant="secondary" onPress={() => void openStoreSubscriptions()} disabled={buying} /> : null}
        </>
      }
    >
      <View style={styles.centre}>
        <Message illustration={<Emblem icon="crown" color="green" />} title={t('owned.title')} body={line} />
        {trouble ? <Notice tone={trouble === 'failed' ? 'danger' : 'info'} title={t(`paywall.${trouble}.title`)} body={t(`paywall.${trouble}.body`)} /> : null}
        {/* A subscriber is shown the one-time plan once, plainly: it ends the payments. */}
        {subscription && prices.lifetime ? (
          <Card style={styles.plan}>
            <Text variant="bodyStrong">{t('owned.goLifetime.title')}</Text>
            <Text variant="callout" tone="muted">{t('owned.goLifetime.body', { period: t(subscription.plan === 'yearly' ? 'owned.goLifetime.year' : 'owned.goLifetime.month') })}</Text>
            <Button label={t('owned.goLifetime.action', { price: prices.lifetime.display })} variant="secondary" onPress={onBuyLifetime} loading={buying} />
          </Card>
        ) : null}
      </View>
    </Screen>
  );
}

/** Straight after buying. Lifetime bought over a subscription says the one thing still to do: cancel it. */
function Bought({ header, replaced, onDone }: { header: React.ReactNode; replaced: SubscriptionPlan | null; onDone: () => void }) {
  const { t } = useTranslation('pro');
  const styles = useStyles(createStyles);
  return (
    <Screen sheet centred header={header} footer={<Button label={t('bought.done')} onPress={onDone} />}>
      <View style={styles.centre}>
        <Message illustration={<Emblem icon="check-circle" color="green" />} title={t('bought.title')} body={t('bought.body')} />
        {replaced ? (
          <Notice tone="warning" title={t('bought.cancelOld.title', { plan: t(`paywall.plans.${replaced}`) })} body={t('bought.cancelOld.body')} linkLabel={t('bought.cancelOld.link')} onLink={() => void openStoreSubscriptions()} />
        ) : null}
      </View>
    </Screen>
  );
}

/**
 * Says, once, that Pro has gone: a refund, or a subscription that ended. Mounted at the root so it
 * is said wherever the user is when the store reports it.
 */
export function ProEndedNotice() {
  const { t } = useTranslation('pro');
  const router = useRouter();
  const { ended, dismissEnded } = useProStore();
  return (
    <Dialog visible={ended} onRequestClose={dismissEnded} title={t('ended.title')} body={t('ended.body')}>
      <Button label={t('ended.see')} onPress={() => { dismissEnded(); router.push('/pro'); }} />
      <Button label={t('ended.ok')} variant="secondary" onPress={dismissEnded} />
    </Dialog>
  );
}

const createStyles = ({ space }: Theme) =>
  StyleSheet.create({
    lead: { paddingTop: space.lg },
    centre: { gap: space.xxl },
    plans: { gap: space.md },
    plan: { gap: space.xs },
    planHead: { flexDirection: 'row', alignItems: 'center', gap: space.md },
    planName: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: space.md, rowGap: space.xs },
    links: { flexDirection: 'row', justifyContent: 'center', gap: space.xl },
  });
