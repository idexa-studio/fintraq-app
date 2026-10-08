import { AmountField, Button, Card, Header, MarkGrid, Notice, ProgressBar, Screen, Text, TextField, pastelOf, useStyles } from '@/design';
import type { Theme } from '@/design';
import { CurrencyPicker, WalletStack, accountTypeIcon, useCreateAccount } from '@/features/accounts';
import { FIRST_ACCOUNT_KINDS, NAME_MAX, SETUP_STEPS, newSetupDraft, nextStep, openingBalance, previousStep, setupBlockerOf, withAccountName, withKind } from '@/features/onboarding/first-run-rules';
import type { FirstAccountKind, SetupDraft, SetupStep } from '@/features/onboarding/first-run-rules';
import { useOnboarding } from '@/features/onboarding/FirstRunProvider';
import { createWorkspace } from '@/features/onboarding/workspace';
import { useSettings } from '@/features/settings';
import { Analytics } from '@/platform/telemetry';
import { OFFERED_COLORS } from '@/shared/contracts/pickers';
import { currencyName, getCurrencySymbol, getDeviceCurrencyCode } from '@/shared/currency/currencies';
import { formatCurrency } from '@/shared/format/money';
import { LoggerService } from '@/shared/logging/logger';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

const KIND_COLORS = { cash: 'green', bank: 'lilac', ewallet: 'teal', credit_card: 'orange' } as const;

/**
 * Setting up, one question at a time, under a picture of what is being made:
 * the greeting and the first account as they will look on Home. The picture
 * fills in as each question is answered, and nothing is saved until the last.
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

  const balance = openingBalance(draft.balance) ?? 0;

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

      <View style={styles.preview} accessible accessibilityRole="image" accessibilityLabel={t('setup.preview.label')}>
        <Text variant="title">{draft.name.trim() ? t('setup.preview.greeting', { name: draft.name.trim().split(/\s+/)[0] }) : t('setup.preview.noName')}</Text>
        <WalletStack cards={[{ key: 'first', name: draft.accountName.trim() || kindName(draft.kind), detail: `${kindName(draft.kind)} · ${currencyName(draft.currency)}`, amount: formatCurrency(balance, draft.currency), color: pastelOf(colorHex), icon: accountTypeIcon(draft.kind) }]} />
      </View>

      <View style={styles.question}>
        <View style={styles.asked}>
          <Text variant="title" accessibilityRole="header">{t(`setup.${step}.title`)}</Text>
          <Text variant="callout" tone="muted">{t(`setup.${step}.hint`)}</Text>
        </View>

        {step === 'name' ? (
          <Card>
            <TextField label={t('setup.name.label')} value={draft.name} onChangeText={(name) => setDraft({ ...draft, name })} maxLength={NAME_MAX} autoCapitalize="words" autoCorrect={false} focusOnArrival returnKeyType="next" onSubmitEditing={() => { if (!blocker) proceed(); }} />
          </Card>
        ) : null}

        {step === 'currency' ? (
          <Card style={styles.currency}>
            <View style={styles.asked}>
              <Text variant="amountHero">{draft.currency}</Text>
              <Text variant="callout" tone="muted">{currencyName(draft.currency)}</Text>
            </View>
            <Button label={t('setup.currency.change')} variant="secondary" onPress={() => setChoosingCurrency(true)} />
          </Card>
        ) : null}

        {step === 'account' ? (
          <>
            <Card>
              <MarkGrid
                columns={4}
                marks={FIRST_ACCOUNT_KINDS.map((kind) => ({ key: kind, label: kindName(kind), icon: accountTypeIcon(kind), color: KIND_COLORS[kind] }))}
                selectedKey={draft.kind}
                onSelect={(kind) => setDraft(withKind(draft, kind, kindName(kind)))}
              />
            </Card>
            <Card style={styles.fields}>
              <TextField label={t('setup.account.name')} value={draft.accountName} onChangeText={(name) => setDraft(withAccountName(draft, name))} maxLength={NAME_MAX} autoCapitalize="words" />
              <View style={styles.asked}>
                <Text variant="callout" tone="muted">{t('setup.account.balance')}</Text>
                <AmountField value={draft.balance} onChangeText={(text) => setDraft({ ...draft, balance: text })} symbol={getCurrencySymbol(draft.currency)} accessibilityLabel={t('setup.account.balance')} />
                <Text variant="caption" tone="muted">{t('setup.account.balanceHint')}</Text>
              </View>
            </Card>
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
    preview: { gap: space.md },
    question: { gap: size.titleGap },
    asked: { gap: space.xs },
    currency: { gap: space.lg },
    fields: { gap: space.xl },
  });
