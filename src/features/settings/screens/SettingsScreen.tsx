import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Updates from 'expo-updates';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, View } from 'react-native';
import { CurrencyPickerBottomSheet } from '@/src/components/pickers/CurrencyPickerBottomSheet';
import {
  AlertDialog,
  Banner,
  ConfirmDialog,
  LIST_ITEM_LEADING_SIZE,
  ListGroup,
  ListItem,
  OptionsBottomSheet,
  OptionsDialog,
  Screen,
  Text,
  TextInputDialog,
} from '@/src/components/ui';
import type { IconSource } from '@/src/components/ui';
import { PrivacySheet } from '@/src/features/settings/components/PrivacySheet';
import { DEFAULT_CURRENCY, getCurrencySymbol } from '@/shared/currency/currencies';
import { useBackupAccount } from '@/src/features/backup/hooks/useBackupAccount';
import { PinSetupModal } from '@/src/features/lock/components/PinSetupModal';
import { useLockSetting } from '@/src/features/lock/hooks/useLockSetting';
import { ProfileCard } from '@/src/features/settings/components/ProfileCard';
import { SettingsFooter } from '@/src/features/settings/components/SettingsFooter';
import { useExactAlarmAccess } from '@/src/features/settings/hooks/useExactAlarmAccess';
import { useFactoryReset } from '@/src/features/settings/hooks/useFactoryReset';
import { useAlertDialog } from '@/src/hooks/useAlertDialog';
import { languages, supportedLanguages } from '@/shared/i18n';
import { useAppConfig } from '@/src/providers/AppConfigProvider';
import { useAppLanguage , useSettings } from '@/features/settings';
import { useProAccess } from '@/src/features/premium/hooks/useProAccess';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { NotificationService } from '@/platform/notifications/notifications';

type ThemeValue = 'light' | 'dark' | 'system';

const THEME_OPTIONS: { label: 'light' | 'dark' | 'followSystem'; value: ThemeValue; icon: IconSource }[] = [
  { label: 'light', value: 'light', icon: 'theme-light' },
  { label: 'dark', value: 'dark', icon: 'theme-dark' },
  { label: 'followSystem', value: 'system', icon: 'circle-half' },
];

type Sheet = 'currency' | 'theme' | 'language' | 'name' | 'reset' | 'time' | 'privacy' | null;

const LANGUAGE_SNAP_POINTS = ['70%'];

/** Ordered by how often people come here: data they manage → everyday preferences → one-off setup → about. */
export const SettingsScreen = React.memo(function SettingsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { colors, alpha } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();

  const { isPremium, requirePro, openPaywall } = useProAccess();
  const { profile, updateProfile } = useSettings();
  const { language, setLanguage } = useAppLanguage();
  const { isConnected: isBackupConnected } = useBackupAccount();
  const { privacyUrl, termsUrl } = useAppConfig();
  const lock = useLockSetting();
  const factoryReset = useFactoryReset();
  const exactAlarm = useExactAlarmAccess();
  const { showAlert, alertProps } = useAlertDialog();

  const [sheet, setSheet] = useState<Sheet>(null);
  const closeSheet = useCallback(() => setSheet(null), []);
  const currency = profile.defaultCurrency || DEFAULT_CURRENCY;
  const themeValue: ThemeValue = profile.theme || 'system';

  const toggleReminders = useCallback(async () => {
    const next = !profile.reminderEnabled;
    if (next && !(await NotificationService.requestPermissions())) {
      showAlert({ title: t('settings.permissionRequired'), message: t('settings.enableNotifications'), type: 'warning' });
      return;
    }
    await updateProfile({ reminderEnabled: next });
  }, [profile.reminderEnabled, updateProfile, showAlert, t]);

  const onTimeChange = useCallback(
    async (event: DateTimePickerEvent, date?: Date) => {
      setSheet(null);
      if (!date || event.type !== 'set') return;
      const hh = date.getHours().toString().padStart(2, '0');
      const mm = date.getMinutes().toString().padStart(2, '0');
      await updateProfile({ reminderTime: `${hh}:${mm}` });
    },
    [updateProfile],
  );

  const runReset = useCallback(async () => {
    try {
      await factoryReset();
      showAlert({
        title: t('settings.resetComplete'),
        message: t('settings.resetCompleteMessage'),
        type: 'success',
        buttons: [
          {
            text: t('common.ok'),
            onPress: async () => {
              try {
                await Updates.reloadAsync();
              } catch {
                router.replace('/(onboarding)');
              }
            },
          },
        ],
      });
    } catch {
      showAlert({ title: t('settings.resetFailed'), message: t('settings.resetFailedMessage'), type: 'error' });
    }
  }, [factoryReset, router, showAlert, t]);

  const openWebPage = useCallback(
    (url: string | undefined, title: string) => {
      if (url) router.push({ pathname: '/webview', params: { url, title } });
    },
    [router],
  );

  const themeOptions = useMemo(
    () =>
      THEME_OPTIONS.map((o) => ({
        key: o.value,
        label: t(`settings.${o.label}`),
        icon: o.icon,
        selected: themeValue === o.value,
        onPress: async () => {
          await updateProfile({ theme: o.value });
        },
      })),
    [themeValue, updateProfile, t],
  );

  const languageOptions = useMemo(
    () => [
      { key: 'system', label: t('settings.systemDefault'), selected: language === 'system', onPress: () => setLanguage('system') },
      ...supportedLanguages.map((code) => ({
        key: code,
        label: languages[code].nativeName,
        selected: language === code,
        onPress: () => setLanguage(code),
      })),
    ],
    [language, setLanguage, t],
  );

  const reminderTimeDate = useMemo(() => {
    const [h = 20, m = 0] = profile.reminderTime.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  }, [profile.reminderTime]);

  const themeLabel = t(`settings.${THEME_OPTIONS.find((o) => o.value === themeValue)?.label ?? 'followSystem'}`);
  const languageLabel = language === 'system' ? t('settings.systemDefault') : languages[language].nativeName;
  const lockSubtitle =
    lock.lockMode === 'biometric' ? t('settings.lockBiometric') : lock.lockMode === 'pin' ? t('settings.lockPin') : t('settings.lockOff');

  return (
    <Screen
      header={{ title: t('settings.title') }}
      tabBar
      overlays={
        <>
          <CurrencyPickerBottomSheet
            visible={sheet === 'currency'}
            onClose={closeSheet}
            value={currency}
            onChange={(code) => void updateProfile({ defaultCurrency: code })}
          />
          <PrivacySheet
            visible={sheet === 'privacy'}
            onClose={closeSheet}
            onOpenPolicy={() => {
              closeSheet();
              openWebPage(privacyUrl, t('settings.privacyTitle'));
            }}
            shareUsageData={profile.shareUsageData}
            onShareUsageDataChange={(value) => void updateProfile({ shareUsageData: value })}
          />
          <OptionsDialog visible={sheet === 'theme'} onClose={closeSheet} title={t('settings.appTheme')} options={themeOptions} />
          <OptionsBottomSheet
            visible={sheet === 'language'}
            onClose={closeSheet}
            title={t('settings.appLanguage')}
            options={languageOptions}
            snapPoints={LANGUAGE_SNAP_POINTS}
          />
          <TextInputDialog
            visible={sheet === 'name'}
            onClose={closeSheet}
            onSave={(name) => updateProfile({ name })}
            title={t('settings.displayName')}
            subtitle={t('settings.displayNameHint')}
            initialValue={profile.name || ''}
            placeholder={t('settings.yourName')}
            maxLength={30}
            saveLabel={t('common.save')}
            inputProps={{ autoCapitalize: 'words' }}
          />
          <ConfirmDialog
            visible={sheet === 'reset'}
            onClose={closeSheet}
            title={t('settings.factoryReset')}
            message={t('settings.resetMessage')}
            confirmLabel={t('settings.eraseEverything')}
            destructive
            onConfirm={runReset}
          />
          <ConfirmDialog
            {...lock.disableConfirm}
            title={t('settings.disableLock')}
            message={t('settings.disableLockMessage')}
            confirmLabel={t('settings.disable')}
            destructive
          />
          <PinSetupModal {...lock.pinSetup} />
          <AlertDialog {...alertProps} />
        </>
      }
    >
      <ProfileCard
        name={profile.name}
        isPremium={isPremium}
        onEditName={() => setSheet('name')}
        onOpenPremium={() => openPaywall()}
      />

      <ListGroup title={t('settings.manage')}>
        <ListItem
          icon="squares-four"
          iconColor={colors.success}
          title={t('settings.categories')}
          subtitle={t('settings.categoriesHint')}
          onPress={() => router.push('/categories')}
        />
        <ListItem icon="users" iconColor={colors.info} title={t('settings.people')} subtitle={t('settings.peopleHint')} onPress={() => router.push('/people')} />
        <ListItem
          icon="hand-coins"
          iconColor={colors.warning}
          title={t('settings.loans')}
          subtitle={t('settings.loansHint')}
          onPress={() => router.push('/(main)/loans')}
        />
      </ListGroup>

      <ListGroup title={t('settings.general')}>
        <ListItem
          leading={
            // The currency's own symbol reads better than a generic coin glyph.
            <View style={[styles.symbolTile, { backgroundColor: alpha(colors.success, 'subtle') }]}>
              <Text variant="bodyStrong" color={colors.success} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
                {getCurrencySymbol(currency)}
              </Text>
            </View>
          }
          title={t('settings.defaultCurrency')}
          value={currency}
          onPress={() => setSheet('currency')}
        />
        <ListItem icon="translate" iconColor={colors.info} title={t('settings.language')} value={languageLabel} onPress={() => setSheet('language')} />
        <ListItem icon="circle-half" iconColor={colors.info} title={t('settings.appearance')} value={themeLabel} onPress={() => setSheet('theme')} />
      </ListGroup>

      <ListGroup title={t('settings.notifications')}>
        <ListItem
          icon="bell"
          iconColor={colors.warning}
          title={t('settings.dailyReminder')}
          subtitle={profile.reminderEnabled ? t('settings.reminderOn', { time: profile.reminderTime }) : t('settings.reminderOff')}
          switchValue={profile.reminderEnabled}
          onSwitchChange={toggleReminders}
        />
        {profile.reminderEnabled ? (
          <ListItem
            icon="alarm"
            iconColor={colors.warning}
            title={t('settings.reminderTime')}
            value={profile.reminderTime}
            onPress={() => setSheet('time')}
          />
        ) : null}
      </ListGroup>
      {profile.reminderEnabled && !exactAlarm.hasAccess ? (
        <Banner
          tone="warning"
          title={t('settings.exactAlarmTitle')}
          message={t('settings.exactAlarmMessage')}
          actionLabel={t('settings.exactAlarmAction')}
          onAction={exactAlarm.openSettings}
        />
      ) : null}

      <ListGroup title={t('settings.security')}>
        <ListItem
          icon="lock-key"
          iconColor={colors.primaryInk}
          title={t('settings.appLock')}
          subtitle={lockSubtitle}
          switchValue={lock.lockEnabled}
          onSwitchChange={lock.toggle}
        />
        {lock.lockMode === 'pin' && lock.lockEnabled ? (
          <ListItem
            icon="password"
            iconColor={colors.primaryInk}
            title={t('settings.changePin')}
            subtitle={t('settings.updatePin')}
            onPress={lock.changePin}
          />
        ) : null}
      </ListGroup>

      <ListGroup title={t('settings.dataBackup')}>
        <ListItem
          icon="cloud"
          iconColor={isBackupConnected ? colors.success : colors.primaryInk}
          title={t('settings.cloudBackup')}
          subtitle={isBackupConnected ? t('settings.cloudActive') : t('settings.cloudSetup')}
          value={isBackupConnected ? t('settings.connected') : t('settings.notSetUp')}
          onPress={() => router.push('/(main)/backup')}
        />
        <ListItem
          icon="download-simple"
          iconColor={colors.primaryInk}
          title={t('settings.exportCsv')}
          subtitle={t('settings.exportHint')}
          onPress={() => {
            if (requirePro('csv')) router.push('/export');
          }}
        />
      </ListGroup>

      <ListGroup title={t('settings.about')}>
        <ListItem icon="shield-check" iconColor={colors.textMuted} title={t('settings.privacy')} onPress={() => setSheet('privacy')} />
        <ListItem icon="file-text" iconColor={colors.textMuted} title={t('settings.terms')} onPress={() => openWebPage(termsUrl, t('settings.termsTitle'))} />
      </ListGroup>

      <ListGroup title={t('settings.dangerZone')}>
        <ListItem icon="trash" title={t('settings.factoryReset')} subtitle={t('settings.factoryResetHint')} onPress={() => setSheet('reset')} destructive />
      </ListGroup>

      {sheet === 'time' ? (
        <DateTimePicker value={reminderTimeDate} mode="time" is24Hour display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={onTimeChange} />
      ) : null}

      <SettingsFooter />
    </Screen>
  );
});

const createStyles = ({ radius }: ThemeContextType) =>
  StyleSheet.create({
    symbolTile: {
      width: LIST_ITEM_LEADING_SIZE,
      height: LIST_ITEM_LEADING_SIZE,
      borderRadius: Math.round(LIST_ITEM_LEADING_SIZE * 0.3),
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
  });
