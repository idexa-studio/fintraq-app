import { Button, Card, Emblem, Header, IconCircle, ListRow, MarkGrid, Message, Notice, ProgressBar, Screen, Text, TextField, useStyles } from '@/design';
import type { Theme } from '@/design';
import { CurrencyPicker, accountTypeIcon, useCreateAccount } from '@/features/accounts';
import { FIRST_ACCOUNT_KINDS, NAME_MAX, SETUP_STEPS, newSetupDraft, nextStep, previousStep, setupBlockerOf, withAccountName, withKind } from '@/features/onboarding/first-run-rules';
import type { FirstAccountKind, SetupDraft, SetupStep } from '@/features/onboarding/first-run-rules';
import { useOnboarding } from '@/features/onboarding/FirstRunProvider';
import { createWorkspace } from '@/features/onboarding/workspace';
import { useSettings } from '@/features/settings';
import { Analytics } from '@/platform/telemetry';
import { OFFERED_COLORS } from '@/shared/contracts/pickers';
import { currencyName, getCurrencySymbol, getDeviceCurrencyCode } from '@/shared/currency/currencies';
import { LoggerService } from '@/shared/logging/logger';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

const KIND_COLORS = { cash: 'green', bank: 'lilac', ewallet: 'teal', credit_card: 'orange' } as const;
const STEP_MARKS = { name: { icon: 'user', color: 'teal' }, currency: { icon: 'cash', color: 'green' }, account: { icon: 'wallet', color: 'lilac' } } as const;

/**
 * Setting up, one question at a time, each headed and laid out as the
 * reference's own steps are: a mark, the question, then its form. Nothing is
 * saved until the last question is answered.
 */
export function SetupScreen() {
  const { t } = useTranslation(['firstRun', 'common']);
  const styles = useStyles(createStyles);
  const router = useRouter();
  const { profile, updateProfile } = useSettings();
  const { completeOnboarding } = useOnboarding();
  const { mutateAsync: createAccount } = useCreateAccount();

  const kindName = (kind: FirstAccountKind) => t(`common:accountTypes.${kind}`);
  const [draft, setDraft] = useState<SetupDraft>(() => newSetupDraft(getDeviceCurrencyCode(), kindName('cash')));
  const [step, setStep] = useState<SetupStep>('name');
  // The first account's colour is chosen once, so the picture shows the colour that is saved.
  const [colorHex] = useState(() => OFFERED_COLORS[Math.floor(Math.random() * OFFERED_COLORS.length)]!.hex);
  const [choosingCurrency, setChoosingCurrency] = useState(false);
  const [making, setMaking] = useState(false);
  const [failed, setFailed] = useState(false);

  const blocker = setupBlockerOf(step, draft);
  const last = nextStep(step) === null;
  const back = () => {
    const before = previousStep(step);
    if (before) setStep(before);
    else if (router.canGoBack()) router.back();
    else router.replace('/(onboarding)');
  };

  const finish = async () => {
    setMaking(true);
    setFailed(false);
    try {
      await updateProfile({ name: draft.name.trim(), email: profile.email || '', phone: profile.phone || '', defaultCurrency: draft.currency });
      await createWorkspace(draft, colorHex, createAccount);
      await completeOnboarding();
      Analytics.track('tutorial_complete', { first_entry: 'skipped' });
      router.replace('/(onboarding)/reminder');
    } catch (e) {
      LoggerService.error('FIRST_RUN', 'Setup did not finish', e);
      setFailed(true);
      setMaking(false);
    }
  };

  const proceed = () => {
    const after = nextStep(step);
    if (after) setStep(after);
    else void finish();
  };

  return (
    <Screen
      keyboardAware
      header={
        <View>
          <Header onBack={making ? undefined : back} backLabel={t('setup.back')} right={<Text variant="callout" tone="muted" style={styles.count}>{t('setup.step', { step: SETUP_STEPS.indexOf(step) + 1, total: SETUP_STEPS.length })}</Text>} />
          <View style={styles.progress}><ProgressBar value={(SETUP_STEPS.indexOf(step) + 1) / SETUP_STEPS.length} accessibilityLabel={t('setup.progress')} /></View>
        </View>
      }
      footer={
        <>
          {blocker ? <Text variant="callout" tone="muted" align="center">{t(`setup.blocked.${blocker}`)}</Text> : null}
          <Button label={last ? t('setup.finish') : t('setup.continue')} disabled={!!blocker} loading={making} onPress={proceed} />
        </>
      }
    >
      {failed ? <Notice tone="danger" title={t('setup.failedTitle')} body={t('setup.failedBody')} /> : null}

      <View style={styles.question}>
        {/* Each question is headed as the reference heads a step: a mark, the question, one line. */}
        <Message illustration={<Emblem icon={STEP_MARKS[step].icon} color={STEP_MARKS[step].color} />} title={t(`setup.${step}.title`)} body={t(`setup.${step}.hint`)} />

        {step === 'name' ? (
          <Card>
            <TextField label={t('setup.name.label')} value={draft.name} onChangeText={(name) => setDraft({ ...draft, name })} maxLength={NAME_MAX} autoCapitalize="words" autoCorrect={false} focusOnArrival returnKeyType="next" onSubmitEditing={() => { if (!blocker) proceed(); }} helper={t('setup.name.helper')} />
          </Card>
        ) : null}

        {/* The reference's form: a bold label, then a white card holding a row to choose from or outlined fields. */}
        {step === 'currency' ? (
          <View style={styles.group}>
            <Text variant="bodyStrong">{t('setup.currency.yours')}</Text>
            <Card padded={false}>
              <ListRow leading={<IconCircle initials={getCurrencySymbol(draft.currency)} color="green" />} strong title={currencyName(draft.currency)} subtitle={draft.currency} onPress={() => setChoosingCurrency(true)} />
            </Card>
            <Text variant="callout" tone="muted">{t('setup.currency.tap')}</Text>
          </View>
        ) : null}

        {step === 'account' ? (
          <>
            <View style={styles.group}>
              <Text variant="bodyStrong">{t('setup.account.kind')}</Text>
              <Card>
                <MarkGrid
                  columns={4}
                  marks={FIRST_ACCOUNT_KINDS.map((kind) => ({ key: kind, label: kindName(kind), icon: accountTypeIcon(kind), color: KIND_COLORS[kind] }))}
                  selectedKey={draft.kind}
                  onSelect={(kind) => setDraft(withKind(draft, kind, kindName(kind)))}
                />
              </Card>
            </View>
            <View style={styles.group}>
              <Text variant="bodyStrong">{t('setup.account.details')}</Text>
              <Card style={styles.fields}>
                <TextField label={t('setup.account.name')} value={draft.accountName} onChangeText={(name) => setDraft(withAccountName(draft, name))} maxLength={NAME_MAX} autoCapitalize="words" />
                <TextField label={t('setup.account.balance')} prefix={getCurrencySymbol(draft.currency)} value={draft.balance} onChangeText={(text) => setDraft({ ...draft, balance: text })} placeholder={t('setup.account.zero')} keyboardType="decimal-pad" helper={t('setup.account.balanceHint')} />
              </Card>
            </View>
          </>
        ) : null}
      </View>

      <CurrencyPicker visible={choosingCurrency} onClose={() => setChoosingCurrency(false)} value={draft.currency} onChange={(currency) => setDraft({ ...draft, currency })} />
    </Screen>
  );
}

const createStyles = ({ size, space }: Theme) =>
  StyleSheet.create({
    count: { paddingHorizontal: space.sm },
    progress: { paddingHorizontal: size.screenPadding, paddingBottom: space.md },
    question: { gap: size.titleGap },
    asked: { gap: space.xs },
    group: { gap: space.md },
    fields: { gap: space.lg },
  });
