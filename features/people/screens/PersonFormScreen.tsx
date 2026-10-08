import { Button, Card, Dialog, Divider, Emblem, Header, IconCircle, ListRow, Message, Screen, Skeleton, SwatchGrid, Text, TextField, pastelOf, useStyles, useTheme, useToast } from '@/design';
import type { Theme } from '@/design';
import { useCreatePerson, usePersonById, usePersonsCount, useUpdatePerson } from '@/features/people/hooks/people';
import { DETAIL_MAX, NAME_MAX, blockerOf, draftOf, hasDetails, initialsOf, isChanged, newDraft, payloadOf } from '@/features/people/person-form';
import type { PersonDraft } from '@/features/people/person-form';
import { FREE_LIMITS, isOverFreeLimit, usePro } from '@/features/pro';
import { useLeaveGuard } from '@/features/shell';
import { OFFERED_COLORS } from '@/shared/contracts/pickers';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

export type PersonFormOptions = {
  /** Editing this person; leave out to add a new one. */
  personId?: number;
};

/**
 * Adding or changing a person, as the mark they are drawn with: their
 * initials on their colour beside the name. Only a name is needed; how to
 * reach them and what they do stay folded away until wanted.
 */
export function PersonFormScreen({ personId }: PersonFormOptions) {
  const { t } = useTranslation(['people', 'common']);
  const { size } = useTheme();
  const styles = useStyles(createStyles);
  const router = useRouter();
  const toast = useToast();
  const editing = personId != null;
  const { isPro, openPaywall } = usePro();

  const { data: person, isPending } = usePersonById(editing ? personId : null);
  const { data: count } = usePersonsCount();
  const create = useCreatePerson();
  const update = useUpdatePerson();

  const blank = useMemo(() => newDraft(OFFERED_COLORS[0]!.hex), []);
  const [draft, setDraft] = useState<PersonDraft>(blank);
  /** What the form started as, to tell whether anything was entered. */
  const [initial, setInitial] = useState<PersonDraft>(blank);
  /** The optional details stay folded away until asked for, or when the person already has some. */
  const [more, setMore] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!person) return;
    const read = draftOf(person);
    setDraft(read);
    setInitial(read);
  }, [person]);

  const guard = useLeaveGuard(isChanged(draft, initial));
  const set = <K extends keyof PersonDraft>(key: K, value: PersonDraft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const close = () => (router.canGoBack() ? router.back() : router.replace('/people'));
  const header = (title?: string) => <Header task title={title} onClose={close} closeLabel={t('close')} />;

  if ((editing && isPending) || (!editing && count === undefined)) {
    return (
      <Screen sheet header={header()}>
        <Skeleton height={size.row * 3} />
      </Screen>
    );
  }

  if (editing && !person) {
    return (
      <Screen sheet scroll={false} header={header()}>
        <View style={styles.centre}>
          <Message illustration={<Emblem icon="user" />} title={t('person.notFound')} />
        </View>
      </Screen>
    );
  }

  // Reached past the free limit, e.g. from a link: say so, and offer the way forward.
  if (!editing && !isPro && isOverFreeLimit('people', count ?? 0)) {
    return (
      <Screen sheet scroll={false} header={header(t('form.newTitle'))} footer={<Button label={t('limit.seePro')} onPress={() => openPaywall('unlimited')} />}>
        <View style={styles.centre}>
          <Message illustration={<Emblem icon="users" />} title={t('limit.reached', { count: FREE_LIMITS.people })} />
        </View>
      </Screen>
    );
  }

  const blocker = blockerOf(draft);
  const saving = create.isPending || update.isPending;
  const showMore = more || hasDetails(initial);

  // The saved palette is wider than what is offered; a person keeps a colour chosen before.
  const swatches = [
    ...OFFERED_COLORS.map((color) => ({ key: color.hex, color: pastelOf(color.hex), label: t(`common:colors.${color.name}`) })),
    ...(OFFERED_COLORS.some((color) => color.hex === initial.color) ? [] : [{ key: initial.color, color: pastelOf(initial.color), label: t('common:colors.current') }]),
  ];

  const save = async () => {
    try {
      if (editing) await update.mutateAsync({ id: personId, data: payloadOf(draft) });
      else await create.mutateAsync(payloadOf(draft));
      guard.release();
      toast.show({ message: editing ? t('form.changesSaved') : t('form.created', { name: draft.name.trim() }) });
      // Leaves on the next tick, once the unsaved-input guard is off.
      setTimeout(close, 0);
    } catch {
      setFailed(true);
    }
  };

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
      {/* The person as they will appear: initials on their colour, beside the name. */}
      <Card padded={false}>
        <View style={styles.identity}>
          <IconCircle initials={initialsOf(draft.name)} icon={draft.name.trim() ? undefined : 'user'} color={draft.color} />
          <View style={styles.fill}>
            <TextField label={t('form.name')} value={draft.name} onChangeText={(text) => set('name', text)} placeholder={t('form.namePlaceholder')} maxLength={NAME_MAX} autoCapitalize="words" autoCorrect={false} focusOnArrival={!editing} />
          </View>
        </View>
        <Divider />
        <View style={styles.colours}>
          <SwatchGrid swatches={swatches} selectedKey={draft.color} onSelect={(hex) => set('color', hex)} />
        </View>
      </Card>

      {showMore ? (
        <Card style={styles.fields}>
          <TextField label={t('form.phone')} value={draft.phone} onChangeText={(text) => set('phone', text)} maxLength={DETAIL_MAX} keyboardType="phone-pad" />
          <TextField label={t('form.email')} value={draft.email} onChangeText={(text) => set('email', text)} maxLength={DETAIL_MAX} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} error={blocker === 'email' ? t('form.blocked.email') : undefined} />
          <TextField label={t('form.role')} value={draft.role} onChangeText={(text) => set('role', text)} placeholder={t('form.rolePlaceholder')} maxLength={DETAIL_MAX} autoCapitalize="words" />
          <TextField label={t('form.company')} value={draft.company} onChangeText={(text) => set('company', text)} maxLength={DETAIL_MAX} autoCapitalize="words" />
        </Card>
      ) : (
        <Card padded={false}>
          <ListRow icon="plus" title={t('form.more')} subtitle={t('form.moreHint')} onPress={() => setMore(true)} />
        </Card>
      )}

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
    fields: { gap: space.lg },
    identity: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: size.cardPadding },
    colours: { padding: size.cardPadding },
  });
