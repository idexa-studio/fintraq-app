import { Badge, Button, Dialog, FeatureTile, Header, IconButton, INK, ListGroup, ListRow, Notice, OptionList, Screen, Section, Select, Sheet, Switch, Text, TextField, TimePicker, Touchable, WaveCard, useStyles, useToast } from '@/design';
import type { Theme } from '@/design';
import { CurrencyPicker, useAccounts } from '@/features/accounts';
import { useBackupAccount } from '@/features/backup';
import { useCategories } from '@/features/categories';
import { useShowTipsAgain } from '@/features/guide';
import { useAppLock } from '@/features/lock';
import { usePersons } from '@/features/people';
import { usePro } from '@/features/pro';
import { useEraseEverything } from '@/features/settings/hooks/useEraseEverything';
import { useExactAlarmAccess } from '@/features/settings/hooks/useExactAlarmAccess';
import { useAppLanguage } from '@/features/settings/LanguageProvider';
import { APPEARANCES, NAME_MAX, cleanName, reminderDate, reminderTimeOf, reminderTimeText } from '@/features/settings/settings-rules';
import { useSettings } from '@/features/settings/SettingsProvider';
import { openAppSettings } from '@/platform/backup/battery-optimization';
import { restartApp } from '@/platform/config/restart';
import { NotificationService } from '@/platform/notifications/notifications';
import { DEFAULT_CURRENCY } from '@/shared/currency/currencies';
import { formatDate } from '@/shared/date/date';
import { languages, supportedLanguages } from '@/shared/i18n';
import { LoggerService } from '@/shared/logging/logger';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

type Open = 'name' | 'currency' | 'language' | 'time' | 'erase' | null;

/**
 * Settings, in the order people come for them: who you are and your plan,
 * the things you record against, how the app looks and speaks, the daily
 * reminder, safety, what the app does with what it knows, and starting over.
 */
export function SettingsScreen() {
  const { t } = useTranslation('settings');
  const styles = useStyles(createStyles);
  const router = useRouter();
  const toast = useToast();

  const { profile, updateProfile } = useSettings();
  const { language, setLanguage } = useAppLanguage();
  const { isPro, openPaywall } = usePro();
  const { lockMode } = useAppLock();
  const { account: backupAccount } = useBackupAccount();
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();
  const { data: people } = usePersons();
  const exactAlarm = useExactAlarmAccess();
  const erase = useEraseEverything();
  const showTipsAgain = useShowTipsAgain();

  const [open, setOpen] = useState<Open>(null);
  const [name, setName] = useState(profile.name);
  const [denied, setDenied] = useState(false);
  const [erasing, setErasing] = useState(false);
  const [eraseFailed, setEraseFailed] = useState(false);
  const close = () => setOpen(null);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const currency = profile.defaultCurrency || DEFAULT_CURRENCY;
  const time = reminderTimeOf(profile.reminderTime);
  const timeText = formatDate(reminderDate(profile.reminderTime), { hour: 'numeric', minute: '2-digit' });

  const saveName = async () => {
    await updateProfile({ name: cleanName(name) });
    close();
    toast.show({ message: t('name.saved') });
  };

  const setReminder = async (on: boolean) => {
    // Notifications are how the reminder arrives, so a refusal leaves it off and says why.
    if (on && !(await NotificationService.requestPermissions())) {
      setDenied(true);
      return;
    }
    setDenied(false);
    await updateProfile({ reminderEnabled: on });
  };

  const eraseAll = async () => {
    setErasing(true);
    setEraseFailed(false);
    try {
      await erase();
    } catch (e) {
      LoggerService.error('SETTINGS', 'Erasing everything failed', e);
      setErasing(false);
      close();
      setEraseFailed(true);
      return;
    }
    // Everything in memory describes what was just deleted, so the app starts again.
    if (!(await restartApp())) router.replace('/(onboarding)');
  };

  return (
    <Screen header={<Header title={t('title')} onBack={back} backLabel={t('back')} />}>
      {eraseFailed ? <Notice tone="danger" title={t('erase.failedTitle')} body={t('erase.failedBody')} /> : null}

      <WaveCard>
        <View style={styles.profile}>
          <View style={styles.who}>
            <View style={styles.whoText}>
              <Text variant="display" numberOfLines={1} style={styles.ink}>{profile.name.trim() || t('profile.noName')}</Text>
              <Text variant="callout" style={styles.ink}>{t('profile.hello')}</Text>
            </View>
            <IconButton icon="pencil" onPress={() => { setName(profile.name); setOpen('name'); }} accessibilityLabel={t('profile.edit')} />
          </View>
          <Touchable onPress={() => openPaywall()} accessibilityRole="link" accessibilityLabel={isPro ? t('profile.managePro') : t('profile.seePro')} style={styles.plan}>
            {isPro ? <Badge label={t('profile.pro')} tone="neutral" /> : <Text variant="calloutStrong" style={styles.ink}>{t('profile.free')}</Text>}
            <Text variant="calloutStrong" underline style={styles.ink}>{isPro ? t('profile.managePro') : t('profile.seePro')}</Text>
          </Touchable>
        </View>
      </WaveCard>

      <Section title={t('money.title')} hint={t('money.hint')}>
        <View style={styles.tiles}>
          <FeatureTile compact icon="bank" color="lilac" label={t('money.accounts')} description={t('money.accountsCount', { count: accounts?.length ?? 0 })} onPress={() => router.push('/accounts')} />
          <FeatureTile compact icon="tag" color="orange" label={t('money.categories')} description={t('money.categoriesCount', { count: categories?.length ?? 0 })} onPress={() => router.push('/categories')} />
        </View>
        <View style={styles.tiles}>
          <FeatureTile compact icon="users" color="teal" label={t('money.people')} description={t('money.peopleCount', { count: people?.length ?? 0 })} onPress={() => router.push('/people')} />
          <FeatureTile compact icon="file-text" color="pink" label={t('money.export')} description={t('money.exportHint')} onPress={() => router.push('/export')} />
        </View>
      </Section>

      <Section title={t('prefs.title')} hint={t('prefs.hint')}>
        <ListGroup>
          <ListRow icon="cash" title={t('prefs.currency')} subtitle={t('prefs.currencyHint')} value={currency} onPress={() => setOpen('currency')} />
          <ListRow icon="translate" title={t('prefs.language')} subtitle={language === 'system' ? t('prefs.systemLanguage') : languages[language].nativeName} onPress={() => setOpen('language')} />
          <ListRow
            icon="moon"
            title={t('prefs.appearance')}
            trailing={<Select options={APPEARANCES.map((key) => ({ key, label: t(`prefs.appearances.${key}`) }))} value={profile.theme || 'system'} onChange={(theme) => void updateProfile({ theme })} accessibilityLabel={t('prefs.appearance')} />}
          />
        </ListGroup>
      </Section>

      <Section title={t('reminder.title')} hint={t('reminder.hint')}>
        <ListGroup>
          <ListRow
            icon="bell"
            title={t('reminder.label')}
            subtitle={profile.reminderEnabled ? t('reminder.on', { time: timeText }) : t('reminder.off')}
            trailing={<Switch value={profile.reminderEnabled} onValueChange={setReminder} accessibilityLabel={t('reminder.label')} />}
          />
          {profile.reminderEnabled ? <ListRow icon="clock" title={t('reminder.time')} value={timeText} onPress={() => setOpen('time')} /> : null}
        </ListGroup>
        {denied ? <Notice tone="warning" title={t('reminder.deniedTitle')} body={t('reminder.deniedBody')} linkLabel={t('reminder.openSettings')} onLink={() => void openAppSettings()} /> : null}
        {profile.reminderEnabled && !exactAlarm.hasAccess ? <Notice tone="warning" title={t('reminder.lateTitle')} body={t('reminder.lateBody')} linkLabel={t('reminder.lateLink')} onLink={() => void exactAlarm.openSettings()} /> : null}
      </Section>

      <Section title={t('safety.title')} hint={t('safety.hint')}>
        <ListGroup>
          <ListRow icon={lockMode ? 'lock-key' : 'lock-open'} title={t('safety.lock')} subtitle={t(`safety.lockState.${lockMode ?? 'off'}`)} onPress={() => router.push('/settings/security')} />
          <ListRow icon="cloud-arrow-up" title={t('safety.backup')} subtitle={backupAccount ? t('safety.backupOn', { email: backupAccount.email }) : t('safety.backupOff')} onPress={() => router.push('/backup')} />
        </ListGroup>
        <ListGroup>
          <ListRow icon="bulb" title={t('tips.row')} subtitle={t('tips.rowHint')} trailing={<View />} onPress={() => void showTipsAgain().then(() => toast.show({ message: t('tips.done') }))} />
          <ListRow icon="info" title={t('about.row')} subtitle={t('about.rowHint')} onPress={() => router.push('/settings/about')} />
        </ListGroup>
      </Section>

      <Section title={t('erase.title')}>
        <ListGroup>
          <ListRow icon="trash" destructive title={t('erase.row')} subtitle={t('erase.rowHint')} onPress={() => setOpen('erase')} />
        </ListGroup>
      </Section>

      <Sheet visible={open === 'name'} onClose={close} title={t('name.title')} footer={<Button label={t('name.save')} onPress={saveName} />}>
        <TextField label={t('name.label')} value={name} onChangeText={setName} maxLength={NAME_MAX} autoCapitalize="words" autoCorrect={false} focusOnArrival returnKeyType="done" onSubmitEditing={saveName} helper={t('name.hint')} />
      </Sheet>

      <CurrencyPicker visible={open === 'currency'} onClose={close} value={currency} onChange={(code) => void updateProfile({ defaultCurrency: code })} suggested={[...new Set((accounts ?? []).map((a) => a.currency))]} />

      <Sheet visible={open === 'language'} onClose={close} title={t('prefs.language')}>
        <OptionList
          groups={[{ options: [{ key: 'system', title: t('prefs.systemLanguage'), icon: 'smartphone' }, ...supportedLanguages.map((code) => ({ key: code, title: languages[code].nativeName }))] }]}
          selectedKey={language}
          onSelect={(key) => {
            void setLanguage(key as typeof language);
            close();
          }}
        />
      </Sheet>

      <Sheet visible={open === 'time'} onClose={close} title={t('reminder.pickTime')} footer={<Button label={t('reminder.done')} onPress={close} />}>
        <TimePicker value={time} onChange={(next) => void updateProfile({ reminderTime: reminderTimeText(next) })} />
      </Sheet>

      <Dialog visible={open === 'erase'} onRequestClose={erasing ? undefined : close} title={t('erase.confirmTitle')} body={t('erase.confirmBody')}>
        <Button label={t('erase.confirm')} variant="danger" loading={erasing} onPress={eraseAll} />
        <Button label={t('erase.keep')} variant="secondary" disabled={erasing} onPress={close} />
      </Dialog>
    </Screen>
  );
}

const createStyles = ({ size, space }: Theme) =>
  StyleSheet.create({
    profile: { padding: size.cardPadding, gap: space.xl },
    who: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
    whoText: { flex: 1, gap: space.xs },
    plan: { flexDirection: 'row', alignItems: 'center', gap: space.md, alignSelf: 'flex-start' },
    ink: { color: INK },
    tiles: { flexDirection: 'row', gap: size.cardGap },
  });
