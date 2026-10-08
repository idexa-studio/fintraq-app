import { Specimen } from '@/features/gallery/components/Specimen';
import { Badge, Button, Card, Emblem, Keypad, ListGroup, ListRow, Message, Money, Notice, Section, Switch, Text, useTheme } from '@/design';
import {
  DEFAULT_PLAN, FREE_LIMITS, PRO_FEATURES, PRO_FEATURE_COPY, PRO_PILLARS, PRO_PILLAR_COPY, PRO_PLANS, featuresIn, isSubscription,
  lifetimeBreakEvenMonths, yearlySavingPercent,
} from '@/features/pro';
import type { PlanPrice, ProPlan } from '@/features/pro';
import { BackupCard } from '@/features/backup';
import React, { useState } from 'react';
import { View } from 'react-native';

/** Sample store prices. In the app these come from the store at runtime. */
const PRICES: Record<ProPlan, PlanPrice> = {
  lifetime: { display: '$39.99', amount: 39.99 },
  yearly: { display: '$19.99', amount: 19.99 },
  monthly: { display: '$2.99', amount: 2.99 },
};

const PLAN_LABEL: Record<ProPlan, string> = { lifetime: 'Lifetime', yearly: 'Yearly', monthly: 'Monthly' };

const planNote = (plan: ProPlan): string => {
  if (plan === 'lifetime') {
    const months = lifetimeBreakEvenMonths(PRICES.lifetime, PRICES.monthly);
    return months ? `Pay once. Same as ${months} months of monthly.` : 'Pay once. Yours for good.';
  }
  if (plan === 'yearly') {
    const saving = yearlySavingPercent(PRICES.yearly, PRICES.monthly);
    return saving ? `Every year. Save ${saving}% on monthly.` : 'Every year.';
  }
  return 'Every month. Cancel any time.';
};

const PIN_LENGTH = 6;

/** Pro, backup, lock and first run. */
export function SystemSection() {
  const { colors, space, size, border } = useTheme();
  const [plan, setPlan] = useState<ProPlan>(DEFAULT_PLAN);
  const [backup, setBackup] = useState(true);
  const [pin, setPin] = useState('12');
  const frame = { marginHorizontal: -space.lg, backgroundColor: colors.background, borderTopWidth: border.thin, borderBottomWidth: border.thin, borderColor: colors.divider, padding: size.screenPadding };

  return (
    <>
      <Section title="Fintraq Pro">
        <Specimen name="Paywall" note="What Pro does, the three plans with lifetime first, one button. Restore is the quiet way out.">
          <View style={[frame, { gap: space.xl, paddingVertical: space.xxl }]}>
            <Message illustration={<Emblem icon="crown" />} title="Get more from your money" body="Plan ahead, understand your spending and keep it safe." />
            <View style={{ gap: space.md }}>
              {PRO_PLANS.map((option) => (
                <Card key={option} compact selected={plan === option} onPress={() => setPlan(option)} accessibilityLabel={`${PLAN_LABEL[option]}, ${PRICES[option].display}. ${planNote(option)}`} style={{ gap: space.xs }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                    <Text variant="bodyStrong" style={{ flex: 1 }}>{PLAN_LABEL[option]}</Text>
                    {option === DEFAULT_PLAN ? <Badge label="Best value" /> : null}
                    <Money value={PRICES[option].display} />
                  </View>
                  <Text variant="callout" tone="muted">{planNote(option)}</Text>
                </Card>
              ))}
            </View>
            <View style={{ gap: space.lg }}>
              <Button label={isSubscription(plan) ? `Subscribe for ${PRICES[plan].display}` : `Get lifetime for ${PRICES[plan].display}`} />
              <Button label="Restore purchases" variant="text" />
            </View>
          </View>
        </Specimen>
        <Specimen name="What Pro includes" note="Four jobs, each with one promise. Only what exists today is sold as included.">
          {PRO_PILLARS.map((pillar) => (
            <View key={pillar} style={{ gap: space.sm }}>
              <View style={{ gap: space.xxs }}>
                <Text variant="title">{PRO_PILLAR_COPY[pillar].title}</Text>
                <Text variant="callout" tone="muted">{PRO_PILLAR_COPY[pillar].promise}</Text>
              </View>
              <ListGroup>
                {featuresIn(pillar).map((id) => (
                  <ListRow
                    key={id}
                    icon={PRO_FEATURES[id].icon}
                    title={PRO_FEATURE_COPY[id].title}
                    subtitle={PRO_FEATURE_COPY[id].description}
                    trailing={PRO_FEATURES[id].status === 'live' ? undefined : <Badge label="Soon" tone="neutral" />}
                  />
                ))}
              </ListGroup>
            </View>
          ))}
        </Specimen>
        <Specimen name="Free allowance" note="What the free plan includes of each limited thing.">
          <ListGroup>
            <ListRow icon="users" title="People" value={String(FREE_LIMITS.people)} />
            <ListRow icon="hand-coins" title="Active loans" value={String(FREE_LIMITS.loans)} />
            <ListRow icon="pie-chart" title="Budgets" value={String(FREE_LIMITS.budgets)} />
            <ListRow icon="repeat" title="Repeating items" value={String(FREE_LIMITS.recurring)} />
            <ListRow icon="flag" title="Goals" value={String(FREE_LIMITS.goals)} />
          </ListGroup>
        </Specimen>
        <Specimen name="Limit reached" note="Say what the free plan includes, then offer Pro.">
          <Notice title={`You’ve added ${FREE_LIMITS.people} people`} body={`The free plan keeps track of ${FREE_LIMITS.people}. Pro has no limit.`} linkLabel="See Fintraq Pro" />
        </Specimen>
      </Section>

      <Section title="Backup">
        <Specimen name="Backup" note="The phone and the Drive, joined once a backup is there; the state in words; then the switch.">
          <BackupCard title="Backed up today at 2:14 PM" detail="In the Drive of john@example.com · 84 KB" hasBackup phoneLabel="This phone" driveLabel="Your Drive" backUpLabel="Back up now" restoreLabel="Restore" />
          <ListGroup>
            <ListRow icon="repeat" title="Back up automatically" subtitle="Twice a day. Next around 2:14 AM." trailing={<Switch value={backup} onValueChange={setBackup} accessibilityLabel="Back up automatically" />} />
            <ListRow icon="battery-charging" title="Keep it running" subtitle="Stop your phone closing Fintraq between backups" onPress={() => {}} />
          </ListGroup>
        </Specimen>
        <Specimen name="While it runs" note="The line fills towards the Drive; neither action can be started.">
          <BackupCard title="Backing up · 62%" detail="Uploading to Google Drive..." hasBackup working={{ operation: 'backup', value: 0.62 }} phoneLabel="This phone" driveLabel="Your Drive" backUpLabel="Back up now" restoreLabel="Restore" />
        </Specimen>
        <Specimen name="Restoring" note="The line fills the other way: from the Drive back to the phone.">
          <BackupCard title="Restoring · 40%" detail="Downloading backup..." hasBackup working={{ operation: 'restore', value: 0.4 }} phoneLabel="This phone" driveLabel="Your Drive" backUpLabel="Back up now" restoreLabel="Restore" />
        </Specimen>
        <Specimen name="Nothing backed up yet" note="Restore waits until there is something to restore.">
          <BackupCard title="No backup yet" detail="Back up now, or switch on automatic backup below." hasBackup={false} phoneLabel="This phone" driveLabel="Your Drive" backUpLabel="Back up now" restoreLabel="Restore" />
        </Specimen>
        <Specimen name="Needs attention" note="A warning says what happened and what to do; a failure offers the fix.">
          <Notice tone="warning" title="Automatic backup has stopped running" body="Your phone may be closing Fintraq in the background. Allow it to run unrestricted, then back up now." linkLabel="Open battery settings" onLink={() => {}} />
          <Notice tone="danger" title="The backup was not made" body="Fintraq is no longer signed in to your Google account. Connect again, then retry." linkLabel="Connect again" onLink={() => {}} />
        </Specimen>
      </Section>

      <Section title="Settings">
        <Specimen name="Settings list" note="Grouped rows; the current choice on the right.">
          <ListGroup>
            <ListRow icon="coins" title="Default currency" value="USD" onPress={() => {}} />
            <ListRow icon="translate" title="Language" value="English" onPress={() => {}} />
            <ListRow icon="circle-half" title="Appearance" value="System" onPress={() => {}} />
            <ListRow icon="lock-key" title="App lock" value="On" onPress={() => {}} />
          </ListGroup>
          <ListGroup>
            <ListRow icon="trash" title="Delete all data" destructive onPress={() => {}} />
          </ListGroup>
        </Specimen>
      </Section>

      <Section title="App lock">
        <Specimen name="Enter PIN" note="Six marks fill as you type. No decimal key.">
          <View style={[frame, { gap: space.xl, paddingVertical: space.xxl }]}>
            <Message illustration={<Emblem icon="lock-key" />} title="Enter your PIN" />
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: space.lg }} accessible accessibilityLabel={`${pin.length} of ${PIN_LENGTH} digits entered`}>
              {Array.from({ length: PIN_LENGTH }, (_, i) => (
                <View key={i} style={{ width: space.lg, height: space.lg, borderRadius: space.sm, borderWidth: border.thin, borderColor: colors.border, backgroundColor: i < pin.length ? colors.action : colors.surface }} />
              ))}
            </View>
            <Keypad decimal={false} onKey={(key) => setPin((current) => (key === 'delete' ? current.slice(0, -1) : current.length < PIN_LENGTH ? current + key : current))} />
            <Button label="Use fingerprint" variant="text" />
          </View>
        </Specimen>
      </Section>

      <Section title="First run">
        <Specimen name="Welcome" note="One message, the way in, and the way back for returning users.">
          <View style={[frame, { gap: space.xxxl, paddingVertical: space.xxxl }]}>
            <Message
              illustration={<Emblem icon="wallet" />}
              title="Know where your money goes"
              body="Track spending, accounts and what people owe you. Everything stays on your phone."
            />
            <View style={{ gap: space.lg }}>
              <Text variant="title">New here?</Text>
              <Button label="Let’s get started" />
              <Text variant="title">Used Fintraq before?</Text>
              <Button label="Restore from backup" variant="secondary" />
            </View>
          </View>
        </Specimen>
      </Section>
    </>
  );
}
