import { FieldStack, FormBlock, Button, Card, Divider, Header, IconCircle, ListRow, MarkGrid, Notice, Screen, Text, TextField, useStyles } from '@/design';
import type { Theme } from '@/design';
import { CurrencyPicker, accountTypeIcon, useCreateAccount } from '@/features/accounts';
import { FIRST_ACCOUNT_KINDS, NAME_MAX, newSetupDraft, setupBlockerOf, withAccountName, withKind } from '@/features/onboarding/first-run-rules';
import type { FirstAccountKind, SetupDraft } from '@/features/onboarding/first-run-rules';
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

/**
 * Setting up, as one form in the reference's own form pattern: a bold label
 * over each white card, a chooser row for the currency, and the first
 * account's kind and details together in one card. Nothing is saved until
 * the button at the foot is pressed.
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
  // The first account's colour is chosen once and saved with it.
  const [colorHex] = useState(() => OFFERED_COLORS[Math.floor(Math.random() * OFFERED_COLORS.length)]!.hex);
  const [choosingCurrency, setChoosingCurrency] = useState(false);
  const [making, setMaking] = useState(false);
  const [failed, setFailed] = useState(false);

  const blocker = setupBlockerOf(draft);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/(onboarding)'));

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

  return (
    <Screen
      keyboardAware
      header={<Header title={t('setup.title')} onBack={making ? undefined : back} backLabel={t('setup.back')} />}
      footer={
        <>
          {blocker ? <Text variant="callout" tone="muted" align="center">{t(`setup.blocked.${blocker}`)}</Text> : null}
          <Button label={t('setup.finish')} disabled={!!blocker} loading={making} onPress={finish} />
        </>
      }
    >
      {failed ? <Notice tone="danger" title={t('setup.failedTitle')} body={t('setup.failedBody')} /> : null}

      <FormBlock label={t('setup.you')}>
        <Card>
          <TextField label={t('setup.name.label')} value={draft.name} onChangeText={(name) => setDraft({ ...draft, name })} maxLength={NAME_MAX} autoCapitalize="words" autoCorrect={false} focusOnArrival returnKeyType="done" helper={t('setup.name.hint')} />
        </Card>
      </FormBlock>

      <FormBlock label={t('setup.currency.label')}>
        <Card padded={false}>
          <ListRow leading={<IconCircle initials={getCurrencySymbol(draft.currency)} color="green" />} strong title={currencyName(draft.currency)} subtitle={t('setup.currency.hint')} onPress={() => setChoosingCurrency(true)} />
        </Card>
      </FormBlock>

      <FormBlock label={t('setup.account.label')}>
        <Card padded={false}>
          <View style={styles.inCard}>
            <MarkGrid
              columns={4}
              marks={FIRST_ACCOUNT_KINDS.map((kind) => ({ key: kind, label: kindName(kind), icon: accountTypeIcon(kind), color: KIND_COLORS[kind] }))}
              selectedKey={draft.kind}
              onSelect={(kind) => setDraft(withKind(draft, kind, kindName(kind)))}
            />
          </View>
          <Divider />
          <FieldStack padded>
            <TextField label={t('setup.account.name')} value={draft.accountName} onChangeText={(name) => setDraft(withAccountName(draft, name))} maxLength={NAME_MAX} autoCapitalize="words" />
            <TextField label={t('setup.account.balance')} prefix={getCurrencySymbol(draft.currency)} value={draft.balance} onChangeText={(text) => setDraft({ ...draft, balance: text })} placeholder={t('setup.account.zero')} keyboardType="decimal-pad" helper={t('setup.account.balanceHint')} />
          </FieldStack>
        </Card>
      </FormBlock>

      <CurrencyPicker visible={choosingCurrency} onClose={() => setChoosingCurrency(false)} value={draft.currency} onChange={(currency) => setDraft({ ...draft, currency })} />
    </Screen>
  );
}

const createStyles = ({ size, space }: Theme) =>
  StyleSheet.create({
    inCard: { padding: size.cardPadding },
  });
