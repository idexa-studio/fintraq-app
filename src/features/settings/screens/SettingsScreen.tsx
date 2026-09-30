import { BackupPreferences } from '@/src/services/backup/backup-preferences';
import {
  AlertButton,
  AlertDialog,
  BentoPressable,
  ConfirmDialog,
  Icon,
  ListGroup,
  ListItem,
  OptionsBottomSheet,
  OptionsDialog,
  Screen,
  Text,
  TextInputDialog,
  LIST_ITEM_LEADING_SIZE,
} from '@/src/components/ui';
import { getCurrencySymbol } from '@/src/constants/currency';
import type { IconSource } from '@/src/components/ui';
import {
  AlarmIcon,
  BellIcon,
  CircleHalfIcon,
  CloudIcon,
  DownloadSimpleIcon,
  HandCoinsIcon,
  FileTextIcon,
  LockKeyIcon,
  MoonIcon,
  PasswordIcon,
  PencilSimpleIcon,
  ShieldCheckIcon,
  SparkleIcon,
  SquaresFourIcon,
  SunIcon,
  TranslateIcon,
  TrashIcon,
  UsersIcon,
} from '@/src/components/ui/icons';
import { CurrencyPickerBottomSheet } from '@/src/components/pickers/CurrencyPickerBottomSheet';
import { db } from '@/src/db/client';
import { accounts, categories, loans, payments, persons } from '@/src/db/schema';
import { StorageKeys } from '@/src/constants/keys';
import { GoogleDriveService } from '@/src/services/backup/google-drive.service';
import * as Updates from 'expo-updates';

import { useBackupAccount } from '@/src/features/backup/hooks/useBackupAccount';
import { LockStorage } from '@/src/features/lock/api/lockStorage';
import { PinSetupModal } from '@/src/features/lock/components/PinSetupModal';
import { authenticateWithBiometrics, getBiometricCapability } from '@/src/features/lock/hooks/useLocalAuth';
import { useAppLock } from '@/src/providers/AppLockProvider';
import { useAppConfig } from '@/src/providers/AppConfigProvider';
import { usePremium } from '@/src/providers/PremiumProvider';
import { useSettings } from '@/src/providers/SettingsProvider';
import { languages, supportedLanguages } from '@/src/i18n';
import { useAppLanguage } from '@/src/providers/I18nProvider';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { NotificationService } from '@/src/services/notification.service';
import { getFormattedAppVersion } from '@/src/utils/version';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';

/* ─────────────────────────────────────────────────────────────
   Theme options
───────────────────────────────────────────────────────────── */

const THEME_OPTIONS: { label: 'light' | 'dark' | 'followSystem'; value: 'light' | 'dark' | 'system'; icon: IconSource }[] = [
  { label: 'light', value: 'light', icon: SunIcon },
  { label: 'dark', value: 'dark', icon: MoonIcon },
  { label: 'followSystem', value: 'system', icon: CircleHalfIcon },
];

/* ─────────────────────────────────────────────────────────────
   SettingsScreen
───────────────────────────────────────────────────────────── */

export const SettingsScreen = React.memo(function SettingsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { colors, alpha } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { isPremium } = usePremium();
  const { profile, updateProfile } = useSettings();
  const { language, setLanguage } = useAppLanguage();
  const { isConnected: isBackupConnected } = useBackupAccount();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { lockEnabled, lockMode, enableLock, disableLock } = useAppLock();
  const { privacyUrl, termsUrl } = useAppConfig();
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [showThemeDialog, setShowThemeDialog] = useState(false);
  const [showLanguageDialog, setShowLanguageDialog] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [devTaps, setDevTaps] = useState(0);

  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    type?: 'info' | 'success' | 'error' | 'warning';
    buttons?: AlertButton[];
  }>({
    visible: false,
    title: '',
  });

  const showAlert = useCallback(
    (config: {
      title: string;
      message?: string;
      type?: 'info' | 'success' | 'error' | 'warning';
      buttons?: AlertButton[];
    }) => {
      setAlertConfig({
        visible: true,
        title: config.title,
        message: config.message,
        type: config.type || 'info',
        buttons: config.buttons || [{ text: t('common.ok') }],
      });
    },
    [t],
  );

  /* ── App lock ── */
  const handleToggleLock = useCallback(async () => {
    if (lockEnabled) {
      const cap = await getBiometricCapability();
      let confirmed = false;
      if (lockMode === 'biometric' && cap.available) {
        confirmed = await authenticateWithBiometrics(t('settings.confirmDisableLock'));
      } else {
        confirmed = await new Promise<boolean>(resolve => {
          Alert.alert(
            t('settings.disableLock'),
            t('settings.disableLockMessage'),
            [
              { text: t('common.cancel'), style: 'cancel', onPress: () => resolve(false) },
              { text: t('settings.disable'), style: 'destructive', onPress: () => resolve(true) },
            ],
          );
        });
      }
      if (confirmed) await disableLock();
    } else {
      const cap = await getBiometricCapability();
      if (cap.available) {
        const confirmed = await authenticateWithBiometrics(t('settings.confirmEnableLock'));
        if (confirmed) await enableLock('biometric');
      } else {
        setShowPinSetup(true);
      }
    }
  }, [lockEnabled, lockMode, enableLock, disableLock, t]);

  const handlePinSetupComplete = useCallback(async (pin: string) => {
    setShowPinSetup(false);
    await LockStorage.setPin(pin);
    await enableLock('pin');
  }, [enableLock]);

  const handleChangePinPress = useCallback(() => setShowPinSetup(true), []);
  const handlePinSetupCancel = useCallback(() => setShowPinSetup(false), []);

  /* ── Reminders ── */
  const handleToggleReminders = useCallback(async () => {
    const next = !profile.reminderEnabled;
    if (next) {
      const granted = await NotificationService.requestPermissions();
      if (!granted) {
        Alert.alert(t('settings.permissionRequired'), t('settings.enableNotifications'));
        return;
      }
    }
    await updateProfile({ reminderEnabled: next });
  }, [profile.reminderEnabled, updateProfile, t]);

  /* ── Name ── */
  const openNameModal = useCallback(() => setShowNameModal(true), []);
  const closeNameModal = useCallback(() => setShowNameModal(false), []);
  const saveName = useCallback(async (name: string) => {
    await updateProfile({ name });
  }, [updateProfile]);

  /* ── Time picker ── */
  const onTimeChange = useCallback(async (event: DateTimePickerEvent, date?: Date) => {
    setShowTimePicker(false);
    if (date && event.type === 'set') {
      const hh = date.getHours().toString().padStart(2, '0');
      const mm = date.getMinutes().toString().padStart(2, '0');
      await updateProfile({ reminderTime: `${hh}:${mm}` });
    }
  }, [updateProfile]);

  /* ── Reset ── */
  const runReset = useCallback(async () => {
    try {
      // 1. Sign out of Google Drive Cloud Backup
      await GoogleDriveService.signOut().catch(() => {});

      // 2. Clear query cache
      queryClient.clear();

      // 3. Delete user data tables
      await db.delete(payments);
      await db.delete(loans);
      await db.delete(persons);
      await db.delete(categories);
      await db.delete(accounts);

      // 4. Clear user-facing AsyncStorage keys only — do NOT use
      // AsyncStorage.clear(), which would also wipe any infra keys (feature
      // flags, review-prompt state, etc.) added elsewhere in the future.
      await AsyncStorage.multiRemove([
        StorageKeys.PROFILE,
        StorageKeys.ONBOARDED,
        StorageKeys.SEED_EXECUTED,
        StorageKeys.RECENT_SEARCHES,
        StorageKeys.UPSELL_DISMISSED_AT,
        StorageKeys.WALKTHROUGH_DASHBOARD,
        StorageKeys.WALKTHROUGH_CATEGORIES,
        StorageKeys.WALKTHROUGH_ANALYTICS,
        StorageKeys.WALKTHROUGH_ACCOUNTS,
        StorageKeys.WALKTHROUGH_TRANSACTIONS,
        StorageKeys.WALKTHROUGH_SEARCH,
        StorageKeys.WALKTHROUGH_TRANSACTION_CREATE,
        StorageKeys.WALKTHROUGH_PERSONS,
        ...BackupPreferences.allKeys(),
      ]);

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
      showAlert({
        title: t('settings.resetFailed'),
        message: t('settings.resetFailedMessage'),
        type: 'error',
      });
    }
  }, [router, queryClient, showAlert, t]);

  /* ── Easter egg ── */
  const handleFooterTap = useCallback(() => {
    const next = devTaps + 1;
    if (next >= 10) {
      router.push('/developer');
      setDevTaps(0);
    } else {
      setDevTaps(next);
    }
  }, [devTaps, router]);

  /* ── Links ── */
  const openPrivacy = useCallback(() => {
    if (!privacyUrl) return;
    router.push({ pathname: '/webview', params: { url: privacyUrl, title: t('settings.privacyTitle') } });
  }, [router, privacyUrl, t]);

  const openTerms = useCallback(() => {
    if (!termsUrl) return;
    router.push({ pathname: '/webview', params: { url: termsUrl, title: t('settings.termsTitle') } });
  }, [router, termsUrl, t]);

  const openExport = useCallback(() => {
    router.push(isPremium ? '/export' : '/premium');
  }, [isPremium, router]);

  /* ── Memos ── */
  const themeLabel = useMemo(() => {
    const match = THEME_OPTIONS.find(o => o.value === (profile.theme || 'system'));
    return t(`settings.${match?.label ?? 'followSystem'}`);
  }, [profile.theme, t]);

  const reminderTimeDate = useMemo(() => {
    const [h, m] = profile.reminderTime.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  }, [profile.reminderTime]);

  const themeDialogOptions = useMemo(() =>
    THEME_OPTIONS.map(o => ({
      key: o.value,
      label: t(`settings.${o.label}`),
      icon: o.icon,
      selected: (profile.theme || 'system') === o.value,
      onPress: async () => { await updateProfile({ theme: o.value }); },
    })),
    [profile.theme, updateProfile, t],
  );

  const languageLabel = useMemo(() => {
    return language === 'system' ? t('settings.systemDefault') : languages[language].nativeName;
  }, [language, t]);

  const languageSheetSnapPoints = useMemo(() => ['70%'], []);

  const languageDialogOptions = useMemo(() => [
    { key: 'system', label: t('settings.systemDefault'), selected: language === 'system', onPress: () => setLanguage('system') },
    ...supportedLanguages.map(code => ({
      key: code,
      label: languages[code].nativeName,
      selected: language === code,
      onPress: () => setLanguage(code),
    })),
  ], [language, setLanguage, t]);

  const appVersion = getFormattedAppVersion();
  const monogram = (profile.name || 'W').charAt(0).toUpperCase();

  const lockSubtitle = lockMode === 'biometric'
    ? t('settings.lockBiometric')
    : lockMode === 'pin'
    ? t('settings.lockPin')
    : t('settings.lockOff');

  return (
    <Screen
      header={{ title: t('settings.title') }}
      tabBar
      overlays={
        <>
          <CurrencyPickerBottomSheet
            visible={showCurrencyPicker}
            onClose={() => setShowCurrencyPicker(false)}
            value={profile.defaultCurrency || 'USD'}
            onChange={(code) => { updateProfile({ defaultCurrency: code }); }}
          />
          <OptionsDialog
            visible={showThemeDialog}
            onClose={() => setShowThemeDialog(false)}
            title={t('settings.appTheme')}
            options={themeDialogOptions}
          />
          <OptionsBottomSheet
            visible={showLanguageDialog}
            onClose={() => setShowLanguageDialog(false)}
            title={t('settings.appLanguage')}
            options={languageDialogOptions}
            snapPoints={languageSheetSnapPoints}
          />
          <ConfirmDialog
            visible={showResetDialog}
            onClose={() => setShowResetDialog(false)}
            title={t('settings.factoryReset')}
            message={t('settings.resetMessage')}
            confirmLabel={t('settings.eraseEverything')}
            destructive
            onConfirm={runReset}
          />
          <TextInputDialog
            visible={showNameModal}
            onClose={closeNameModal}
            onSave={saveName}
            title={t('settings.displayName')}
            subtitle={t('settings.displayNameHint')}
            initialValue={profile.name || ''}
            placeholder={t('settings.yourName')}
            maxLength={30}
            saveLabel={t('common.save')}
            inputProps={{ autoCapitalize: 'words' }}
          />
          <PinSetupModal visible={showPinSetup} onCancel={handlePinSetupCancel} onComplete={handlePinSetupComplete} />
          <AlertDialog
            visible={alertConfig.visible}
            title={alertConfig.title}
            message={alertConfig.message}
            type={alertConfig.type}
            buttons={alertConfig.buttons}
            onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
          />
        </>
      }
    >
      {/* Profile: the one ink card on the page — tap to rename */}
      <BentoPressable style={styles.profileCard} onPress={openNameModal} accessibilityRole="button" accessibilityLabel={t('settings.displayName')}>
        <View style={styles.profileAvatar}>
          <Text variant="headline" tone="onPrimary">{monogram}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text variant="subheading" color={colors.onInk} numberOfLines={1}>{profile.name || t('settings.welcome')}</Text>
          <Text variant="caption" color={colors.onInkMuted}>{isPremium ? t('settings.proMember') : t('settings.freeTier')}</Text>
        </View>
        <Icon icon={PencilSimpleIcon} size={18} color={colors.onInkMuted} />
      </BentoPressable>

      <ListGroup>
        {isPremium ? (
          <ListItem
            icon={SparkleIcon}
            iconColor={colors.warning}
            title={t('settings.proLifetime')}
            subtitle={t('settings.permanentAccess')}
            value={t('settings.active')}
            showChevron={false}
            onPress={() => router.push('/premium')}
          />
        ) : (
          <ListItem
            icon={SparkleIcon}
            iconColor={colors.warning}
            title={t('settings.upgradeToPro')}
            subtitle={t('settings.unlockAllFeatures')}
            onPress={() => router.push('/premium')}
            trailing={
              <View style={styles.upgradePill}>
                <Text variant="calloutStrong" tone="onPrimary">{t('settings.upgrade')}</Text>
              </View>
            }
          />
        )}
      </ListGroup>

      {/* Ordered by how often people come here: manage data → everyday prefs → one-off setup → about. */}
      <ListGroup title={t('settings.manage')}>
        <ListItem
          icon={SquaresFourIcon}
          iconColor={colors.success}
          title={t('settings.categories')}
          subtitle={t('settings.categoriesHint')}
          onPress={() => router.push('/categories')}
        />
        <ListItem
          icon={UsersIcon}
          iconColor={colors.info}
          title={t('settings.people')}
          subtitle={t('settings.peopleHint')}
          onPress={() => router.push('/persons')}
        />
        <ListItem
          icon={HandCoinsIcon}
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
                {getCurrencySymbol(profile.defaultCurrency || 'USD')}
              </Text>
            </View>
          }
          title={t('settings.defaultCurrency')}
          value={profile.defaultCurrency || 'USD'}
          onPress={() => setShowCurrencyPicker(true)}
        />
        <ListItem
          icon={TranslateIcon}
          iconColor={colors.info}
          title={t('settings.language')}
          value={languageLabel}
          onPress={() => setShowLanguageDialog(true)}
        />
        <ListItem
          icon={CircleHalfIcon}
          iconColor={colors.info}
          title={t('settings.appearance')}
          value={themeLabel}
          onPress={() => setShowThemeDialog(true)}
        />
      </ListGroup>

      <ListGroup title={t('settings.notifications')}>
        <ListItem
          icon={BellIcon}
          iconColor={colors.warning}
          title={t('settings.dailyReminder')}
          subtitle={profile.reminderEnabled ? t('settings.reminderOn', { time: profile.reminderTime }) : t('settings.reminderOff')}
          switchValue={profile.reminderEnabled}
          onSwitchChange={handleToggleReminders}
        />
        {profile.reminderEnabled ? (
          <ListItem
            icon={AlarmIcon}
            iconColor={colors.warning}
            title={t('settings.reminderTime')}
            value={profile.reminderTime}
            onPress={() => setShowTimePicker(true)}
          />
        ) : null}
      </ListGroup>

      <ListGroup title={t('settings.security')}>
        <ListItem
          icon={LockKeyIcon}
          iconColor={colors.primaryInk}
          title={t('settings.appLock')}
          subtitle={lockSubtitle}
          switchValue={lockEnabled}
          onSwitchChange={handleToggleLock}
        />
        {lockMode === 'pin' && lockEnabled ? (
          <ListItem
            icon={PasswordIcon}
            iconColor={colors.primaryInk}
            title={t('settings.changePin')}
            subtitle={t('settings.updatePin')}
            onPress={handleChangePinPress}
          />
        ) : null}
      </ListGroup>

      <ListGroup title={t('settings.dataBackup')}>
        <ListItem
          icon={CloudIcon}
          iconColor={isBackupConnected ? colors.success : colors.primaryInk}
          title={t('settings.cloudBackup')}
          subtitle={isBackupConnected ? t('settings.cloudActive') : t('settings.cloudSetup')}
          value={isBackupConnected ? t('settings.connected') : t('settings.notSetUp')}
          onPress={() => router.push('/(main)/backup')}
        />
        <ListItem
          icon={DownloadSimpleIcon}
          iconColor={colors.primaryInk}
          title={t('settings.exportCsv')}
          subtitle={t('settings.exportHint')}
          onPress={openExport}
        />
      </ListGroup>

      <ListGroup title={t('settings.about')}>
        <ListItem
          icon={ShieldCheckIcon}
          iconColor={colors.textMuted}
          title={t('settings.privacy')}
          onPress={openPrivacy}
        />
        <ListItem
          icon={FileTextIcon}
          iconColor={colors.textMuted}
          title={t('settings.terms')}
          onPress={openTerms}
        />
      </ListGroup>

      <ListGroup title={t('settings.dangerZone')}>
        <ListItem
          icon={TrashIcon}
          title={t('settings.factoryReset')}
          subtitle={t('settings.factoryResetHint')}
          onPress={() => setShowResetDialog(true)}
          destructive
        />
      </ListGroup>

      {showTimePicker ? (
        <DateTimePicker
          value={reminderTimeDate}
          mode="time"
          is24Hour
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onTimeChange}
        />
      ) : null}

      {/* Footer — tapping it 10× opens developer tools */}
      <Pressable onPress={handleFooterTap} hitSlop={{ top: 12, bottom: 12, left: 24, right: 24 }} style={styles.footer}>
        <Text variant="label" tone="muted">Fintraq / Core</Text>
        <Text variant="caption" tone="muted">{t('settings.footer', { version: appVersion })}</Text>
      </Pressable>
    </Screen>
  );
});

/* ─────────────────────────────────────────────────────────────
   Screen-level styles
───────────────────────────────────────────────────────────── */

const createStyles = ({ colors, spacing, radius }: ThemeContextType) =>
  StyleSheet.create({
    profileCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('4'),
      padding: spacing('5'),
      borderRadius: radius('2xl'),
      backgroundColor: colors.tabBarBackground,
    },
    profileAvatar: {
      width: 48,
      height: 48,
      borderRadius: Math.round(48 * 0.3),
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    profileInfo: { flex: 1, gap: spacing('0.5') },
    symbolTile: {
      width: LIST_ITEM_LEADING_SIZE,
      height: LIST_ITEM_LEADING_SIZE,
      borderRadius: Math.round(LIST_ITEM_LEADING_SIZE * 0.3),
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    upgradePill: {
      paddingHorizontal: spacing('3.5'),
      height: 32,
      justifyContent: 'center',
      borderRadius: radius('full'),
      backgroundColor: colors.primary,
    },
    footer: { alignItems: 'center', gap: spacing('1'), paddingVertical: spacing('4') },
  });
