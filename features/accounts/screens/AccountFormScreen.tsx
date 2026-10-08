import {
  FormBlock, FieldStack, AmountField, Button, Card, Chip, Dialog, Divider, Emblem, Header, IconCircle, ListRow, MarkGrid, Message, Money, Screen, Skeleton, SwatchGrid, Text, TextField, pastelOf,
  useStyles, useTheme, useToast,
} from '@/design';
import type { Theme } from '@/design';
import { accountTypeIcon } from '@/features/accounts/account-icons';
import { ACCOUNT_TYPES, HOLDER_MAX, NAME_MAX, NUMBER_MAX, blockerOf, createPayloadOf, draftOf, isChanged, newDraft, updatePayloadOf } from '@/features/accounts/account-form';
import type { AccountDraft } from '@/features/accounts/account-form';
import { CurrencyPicker } from '@/features/accounts/components/CurrencyPicker';
import { useAccount, useAccountUsage, useAccounts, useCreateAccount, useUpdateAccount } from '@/features/accounts/hooks/accounts';
import { useSettings } from '@/features/settings';
import { useLeaveGuard } from '@/features/shell';
import { Analytics } from '@/platform/telemetry';
import { OFFERED_COLORS } from '@/shared/contracts/pickers';
import { currencyName, getCurrencySymbol, sortCurrenciesWithDefault } from '@/shared/currency/currencies';
import { formatCurrency } from '@/shared/format/money';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

export type AccountFormOptions = {
  /** Editing this account; leave out to make a new one. */
  accountId?: number;
};

/**
 * Making or changing an account, as the account itself: its mark, name and
 * balance are filled in where they will be seen, and the kind is picked from
 * the marks. Only a name is needed. What can no longer be changed says why.
 */
export function AccountFormScreen({ accountId }: AccountFormOptions) {
  const { t } = useTranslation(['accounts', 'common']);
  const { size } = useTheme();
  const styles = useStyles(createStyles);
  const router = useRouter();
  const toast = useToast();
  const { profile } = useSettings();
  const editing = accountId != null;

  const { data: account, isPending } = useAccount(accountId);
  const { data: usage } = useAccountUsage(accountId);
  const { data: accounts } = useAccounts();
  const create = useCreateAccount();
  const update = useUpdateAccount();

  // The currencies already held, the default first: the likely choice for another account.
  const held = useMemo(() => sortCurrenciesWithDefault([...new Set([profile.defaultCurrency, ...(accounts ?? []).map((a) => a.currency)])], profile.defaultCurrency), [accounts, profile.defaultCurrency]);
  const blank = useMemo(() => newDraft(profile.defaultCurrency, OFFERED_COLORS[0]!.hex), [profile.defaultCurrency]);
  const [draft, setDraft] = useState<AccountDraft>(blank);
  /** What the form started as, to tell whether anything was entered. */
  const [initial, setInitial] = useState<AccountDraft>(blank);
  const [picker, setPicker] = useState<'currency' | null>(null);
  /** The optional details stay folded away until asked for, or when the account already has them. */
  const [more, setMore] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!account) return;
    const read = draftOf(account);
    setDraft(read);
    setInitial(read);
  }, [account]);

  const guard = useLeaveGuard(isChanged(draft, initial));
  const set = <K extends keyof AccountDraft>(key: K, value: AccountDraft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const close = () => (router.canGoBack() ? router.back() : router.replace('/accounts'));
  const header = (title?: string) => <Header task title={title} onClose={close} closeLabel={t('close')} />;

  if (editing && isPending) {
    return (
      <Screen sheet header={header()}>
        <Skeleton height={size.row * 3} />
        <Skeleton height={size.row * 2} />
      </Screen>
    );
  }

  if (editing && !account) {
    return (
      <Screen sheet scroll={false} header={header()}>
        <View style={styles.centre}>
          <Message illustration={<Emblem icon="wallet" />} title={t('account.notFound')} />
        </View>
      </Screen>
    );
  }

  // Changing the currency would relabel every amount already recorded, so it is fixed once there is one.
  const currencyLocked = editing && (!usage || usage.transactions > 0 || usage.loans > 0);
  const blocker = blockerOf(draft, editing);
  const saving = create.isPending || update.isPending;

  // The saved palette is wider than what is offered; an account keeps a colour chosen before.
  const swatches = [
    ...OFFERED_COLORS.map((color) => ({ key: color.hex, color: pastelOf(color.hex), label: t(`common:colors.${color.name}`) })),
    ...(OFFERED_COLORS.some((color) => color.hex === initial.color) ? [] : [{ key: initial.color, color: pastelOf(initial.color), label: t('common:colors.current') }]),
  ];
  const showMore = more || !!initial.holderName || !!initial.accountNumber;

  const save = async () => {
    try {
      if (editing) await update.mutateAsync({ id: accountId, data: updatePayloadOf(draft, currencyLocked) });
      else await create.mutateAsync(createPayloadOf(draft));
      Analytics.track('account_saved', { account_type: draft.type, mode: editing ? 'edit' : 'create' });
      guard.release();
      toast.show({ message: editing ? t('form.changesSaved') : t('form.created') });
      // Leaves on the next tick, once the unsaved-input guard is off.
      setTimeout(close, 0);
    } catch {
      setFailed(true);
    }
  };

  const kind = t(`common:accountTypes.${draft.type}`);

  return (
    <Screen
      sheet
      keyboardAware
      header={header(editing ? t('form.editTitle') : t('form.newTitle'))}
      footer={
        <>
          {blocker ? <Text variant="callout" tone="muted" align="center">{t(`form.blocked.${blocker}`)}</Text> : null}
          <Button label={editing ? t('form.save') : t('form.create')} onPress={save} disabled={!!blocker} loading={saving} />
        </>
      }
    >
      {/* The account as it will look, filled in where it stands: its mark, name, what is in it, its colour. */}
      <Card padded={false}>
        <View style={styles.identity}>
          <IconCircle icon={accountTypeIcon(draft.type)} color={draft.color} />
          <View style={styles.fill}>
            <TextField label={t('form.name')} value={draft.name} onChangeText={(text) => set('name', text)} placeholder={t('form.namePlaceholder')} maxLength={NAME_MAX} autoCapitalize="words" autoCorrect={false} focusOnArrival={!editing} />
          </View>
        </View>
        <View style={styles.balance}>
          <View style={styles.balanceHead}>
            <Text variant="callout" tone="muted">{editing ? t('form.balance') : t('form.opening')}</Text>
            {currencyLocked ? null : <Chip menu label={draft.currency} onPress={() => setPicker('currency')} accessibilityLabel={`${t('form.currency')}: ${currencyName(draft.currency)}`} />}
          </View>
          {editing && account ? (
            <Money value={formatCurrency(account.balance, draft.currency)} variant="amountHero" />
          ) : (
            <AmountField value={draft.openingBalance} onChangeText={(text) => set('openingBalance', text)} symbol={getCurrencySymbol(draft.currency)} accessibilityLabel={t('form.opening')} />
          )}
          {editing ? (
            <Text variant="caption" tone="muted">
              {[t('form.typeLocked', { kind }), currencyLocked ? t('form.currencyLocked', { currency: currencyName(draft.currency) }) : t('form.balanceHelper')].join(' ')}
            </Text>
          ) : null}
        </View>
        <Divider />
        <View style={styles.colours}>
          <SwatchGrid swatches={swatches} selectedKey={draft.color} onSelect={(hex) => set('color', hex)} />
        </View>
      </Card>

      {editing ? null : (
        <FormBlock label={t('form.type')}>
          <Card style={styles.kinds}>
            <MarkGrid columns={4} marks={ACCOUNT_TYPES.map((type) => ({ key: type, label: t(`common:accountTypes.${type}`), icon: accountTypeIcon(type), color: draft.color }))} selectedKey={draft.type} onSelect={(type) => set('type', type)} />
          </Card>
        </FormBlock>
      )}

      {showMore ? (
        <Card><FieldStack>
          <TextField label={t('form.holder')} value={draft.holderName} onChangeText={(text) => set('holderName', text)} maxLength={HOLDER_MAX} autoCapitalize="words" autoCorrect={false} />
          <TextField label={t('form.number')} value={draft.accountNumber} onChangeText={(text) => set('accountNumber', text)} maxLength={NUMBER_MAX} autoCapitalize="none" autoCorrect={false} helper={t('form.numberHelper')} />
        </FieldStack></Card>
      ) : (
        <Card padded={false}>
          <ListRow icon="plus" title={t('form.more')} subtitle={t('form.moreHint')} onPress={() => setMore(true)} />
        </Card>
      )}

      <CurrencyPicker visible={picker === 'currency'} onClose={() => setPicker(null)} value={draft.currency} onChange={(code) => set('currency', code)} suggested={held} />

      <Dialog visible={guard.asking} onRequestClose={guard.stay} title={editing ? t('form.discard.titleEdit') : t('form.discard.title')} body={t('form.discard.body')}>
        <Button label={t('form.discard.confirm')} variant="danger" onPress={guard.leave} />
        <Button label={t('form.discard.cancel')} variant="secondary" onPress={guard.stay} />
      </Dialog>
      <Dialog visible={failed} onRequestClose={() => setFailed(false)} title={t('form.saveFailed')} body={t('form.saveFailedBody')}>
        <Button label={t('form.ok')} onPress={() => setFailed(false)} />
      </Dialog>
    </Screen>
  );
}

const createStyles = ({ size, space }: Theme) =>
  StyleSheet.create({
    centre: { flex: 1, justifyContent: 'center' },
    fill: { flex: 1 },
    identity: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: size.cardPadding },
    balance: { paddingHorizontal: size.cardPadding, paddingBottom: space.lg, gap: space.sm },
    balanceHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: size.chip },
    colours: { padding: size.cardPadding },
    kinds: { padding: space.sm },
  });
