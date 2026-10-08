import {
  FormBlock, Button, Card, Chip, Dialog, Divider, Emblem, Header, IconCircle, IconGrid, ListRow, Message, Screen, Skeleton, SwatchGrid, Text, TextField, isIconName, pastelOf, resolveIcon,
  useStyles, useTheme, useToast,
} from '@/design';
import type { Theme } from '@/design';
import { CATEGORY_KINDS, NAME_MAX, blockerOf, draftOf, isChanged, newDraft, payloadOf, toggleKind } from '@/features/categories/category-form';
import type { CategoryDraft } from '@/features/categories/category-form';
import { useCategories, useCategoryUsage, useCreateCategory, useDeleteCategory, useUpdateCategory } from '@/features/categories/hooks/categories';
import { useLeaveGuard } from '@/features/shell';
import { CATEGORY_ICON_GROUPS, OFFERED_COLORS } from '@/shared/contracts/pickers';
import type { TransactionType } from '@/shared/types';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

/** The groups the category icons are offered in. */
type IconGroupName = 'finance' | 'foodDrink' | 'transport' | 'homeUtilities' | 'healthFitness' | 'tech' | 'shopping' | 'entertainment' | 'education' | 'personal' | 'misc';

export type CategoryFormOptions = {
  /** Editing this category; leave out to make a new one. */
  categoryId?: number;
  /** The kind a new category starts as, e.g. the tab it was added from. Ignored when editing. */
  initialKind?: TransactionType;
};

/**
 * Making or changing a category, as the mark it will be: its icon on its
 * colour beside the name, changing as they are chosen. Only a name is needed.
 */
export function CategoryFormScreen({ categoryId, initialKind = 'DR' }: CategoryFormOptions) {
  const { t } = useTranslation(['categories', 'common']);
  const { size } = useTheme();
  const styles = useStyles(createStyles);
  const router = useRouter();
  const toast = useToast();
  const editing = categoryId != null;

  const { data: categories, isPending } = useCategories();
  const category = editing ? categories?.find((c) => c.id === categoryId) : undefined;
  const { data: usage } = useCategoryUsage(category?.id);
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const remove = useDeleteCategory();

  const blank = useMemo(() => newDraft(initialKind, OFFERED_COLORS[0]!.hex), [initialKind]);
  const [draft, setDraft] = useState<CategoryDraft>(blank);
  /** What the form started as, to tell whether anything was entered. */
  const [initial, setInitial] = useState<CategoryDraft>(blank);
  const [confirming, setConfirming] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!category) return;
    const read = draftOf(category);
    setDraft(read);
    setInitial(read);
  }, [category]);

  const guard = useLeaveGuard(isChanged(draft, initial));
  const set = <K extends keyof CategoryDraft>(key: K, value: CategoryDraft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const close = () => (router.canGoBack() ? router.back() : router.replace('/categories'));
  const header = (title?: string) => <Header task title={title} onClose={close} closeLabel={t('close')} />;

  const iconGroups = useMemo(
    () => CATEGORY_ICON_GROUPS.map((group) => ({ title: t(`form.iconGroups.${group.label as IconGroupName}`), icons: group.icons.filter(isIconName) })),
    [t],
  );

  if (editing && isPending) {
    return (
      <Screen sheet header={header()}>
        <Skeleton height={size.row * 3} />
        <Skeleton height={size.row * 4} />
      </Screen>
    );
  }

  // The built-in categories are relied on by the app, so they are never opened for changing.
  if (editing && (!category || category.isSystem)) {
    return (
      <Screen sheet scroll={false} header={header()}>
        <View style={styles.centre}>
          <Message illustration={<Emblem icon="tag" color="orange" />} title={category ? t('builtIn.hint') : t('form.notFound')} />
        </View>
      </Screen>
    );
  }

  const blocker = blockerOf(draft);
  const saving = create.isPending || update.isPending;
  // A category in use stays: the transactions filed under it would have nowhere to go.
  const inUse = usage
    ? usage.transactions > 0
      ? t('form.inUse.transactions', { count: usage.transactions })
      : usage.loans > 0
        ? t('form.inUse.loans', { count: usage.loans })
        : null
    : null;

  // The saved palette is wider than what is offered; a category keeps a colour chosen before.
  const swatches = [
    ...OFFERED_COLORS.map((color) => ({ key: color.hex, color: pastelOf(color.hex), label: t(`common:colors.${color.name}`) })),
    ...(OFFERED_COLORS.some((color) => color.hex === initial.color) ? [] : [{ key: initial.color, color: pastelOf(initial.color), label: t('common:colors.current') }]),
  ];

  const leave = (message: string) => {
    guard.release();
    toast.show({ message });
    // Leaves on the next tick, once the unsaved-input guard is off.
    setTimeout(close, 0);
  };

  const save = async () => {
    try {
      if (editing) await update.mutateAsync({ id: categoryId, data: payloadOf(draft) });
      else await create.mutateAsync({ ...payloadOf(draft), isSystem: false });
      leave(editing ? t('form.changesSaved') : t('form.created'));
    } catch {
      setFailed(true);
    }
  };

  const confirmDelete = async () => {
    try {
      await remove.mutateAsync(categoryId as number);
      setConfirming(false);
      leave(t('form.deleted', { name: initial.name }));
    } catch {
      setConfirming(false);
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
      {/* The category as it will look: its icon on its colour, beside its name. */}
      <Card padded={false}>
        <View style={styles.identity}>
          <IconCircle icon={resolveIcon(draft.icon, 'tag')} color={draft.color} />
          <View style={styles.fill}>
            <TextField label={t('form.name')} value={draft.name} onChangeText={(text) => set('name', text)} placeholder={t('form.namePlaceholder')} maxLength={NAME_MAX} autoCapitalize="words" autoCorrect={false} focusOnArrival={!editing} />
          </View>
        </View>
        <Divider />
        <View style={styles.colours}>
          <SwatchGrid swatches={swatches} selectedKey={draft.color} onSelect={(hex) => set('color', hex)} />
        </View>
      </Card>

      <FormBlock label={t('form.usedFor')}>
        <View style={styles.kinds}>
          {CATEGORY_KINDS.map((kind) => (
            <Chip key={kind} label={t(`kinds.${kind}`)} selected={draft.kinds.includes(kind)} onPress={() => set('kinds', toggleKind(draft.kinds, kind))} />
          ))}
        </View>
      </FormBlock>

      <FormBlock label={t('form.icon')}>
        <Card>
          <IconGrid groups={iconGroups} selected={resolveIcon(draft.icon, 'tag')} onSelect={(icon) => set('icon', icon)} color={pastelOf(draft.color)} />
        </Card>
      </FormBlock>

      {editing ? (
        <Card padded={false}>
          <ListRow icon="trash" title={t('form.delete')} subtitle={inUse ?? undefined} destructive={!inUse} disabled={!usage || !!inUse} onPress={() => setConfirming(true)} trailing={<View />} />
        </Card>
      ) : null}

      <Dialog visible={confirming} onRequestClose={() => setConfirming(false)} title={t('form.deleteTitle', { name: initial.name })} body={t('form.deleteBody')}>
        <Button label={t('form.deleteConfirm')} variant="danger" onPress={confirmDelete} loading={remove.isPending} />
        <Button label={t('form.deleteCancel')} variant="secondary" onPress={() => setConfirming(false)} />
      </Dialog>
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
    colours: { padding: size.cardPadding },
    kinds: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  });
