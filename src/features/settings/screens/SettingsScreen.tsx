import { AlertButton, AlertDialog } from '@/src/components/ui/AlertDialog';
import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { ConfirmDialog } from '@/src/components/ui/ConfirmDialog';
import { CurrencyPickerBottomSheet } from '@/src/components/ui/CurrencyPickerBottomSheet';
import { Header } from '@/src/components/ui/Header';
import { IconAvatar } from '@/src/components/ui/IconAvatar';
import { OptionsBottomSheet } from '@/src/components/ui/OptionsBottomSheet';
import { OptionsDialog } from '@/src/components/ui/OptionsDialog';
import { PageBackground } from '@/src/components/ui/PageBackground';
import { TextInputDialog } from '@/src/components/ui/TextInputDialog';
import { db } from '@/src/db/client';
import { accounts, categories, loans, payments, persons } from '@/src/db/schema';
import { RETIRED_AUTO_BACKUP_FREQUENCY_KEY, StorageKeys } from '@/src/constants/keys';
import { GoogleDriveService } from '@/src/services/backup/google-drive.service';
import * as Updates from 'expo-updates';

import { useGoogleBackup } from '@/src/features/backup/hooks/useGoogleBackup';
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
import {
  AlarmClockIcon,
  ArrowRight01Icon,
  BellIcon,
  CloudIcon,
  Coins02Icon,
  ContrastIcon,
  Delete01Icon,
  Download01Icon,
  File01Icon,
  GridIcon,
  LockPasswordIcon,
  Moon01Icon,
  PencilEdit01Icon,
  PinCodeIcon,
  ShieldKeyIcon,
  SparklesIcon,
  Sun01Icon,
  TranslateIcon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { alpha } from '@/src/theme/tokens';

/* ─────────────────────────────────────────────────────────────
   Shared row separator
───────────────────────────────────────────────────────────── */

const RowSeparator = React.memo(function RowSeparator({
  theme,
}: {
  theme: ThemeContextType;
}) {
  return (
    <View
      style={{
        height: StyleSheet.hairlineWidth,
        backgroundColor: alpha(theme.colors.text, 'subtle'),
        marginLeft: theme.layout.screenPadding + 36 + theme.spacing('3.5'),
      }}
    />
  );
});

/* ─────────────────────────────────────────────────────────────
   SwitchRow
───────────────────────────────────────────────────────────── */

type SwitchRowProps = {
  icon: IconSvgElement;
  label: string;
  subtitle?: string;
  value: boolean;
  onToggle: () => void;
  iconColor?: string;
  theme: ThemeContextType;
};

const SwitchRow = React.memo(function SwitchRow({
  icon,
  label,
  subtitle,
  value,
  onToggle,
  iconColor,
  theme,
}: SwitchRowProps) {
  const styles = useMemo(() => createRowStyles(theme), [theme]);
  const { colors } = theme;
  const resolvedIconColor = iconColor ?? colors.text;

  return (
    <View style={styles.row}>
      <IconAvatar icon={icon} color={resolvedIconColor} variant="subtle" size={36} />
      <View style={styles.rowInfo}>
        <Text style={styles.rowLabel}>{label}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: alpha(colors.text, 'subtle'), true: colors.primary }}
        thumbColor={'#FFFFFF'}
        ios_backgroundColor={alpha(colors.text, 'subtle')}
      />
    </View>
  );
});

/* ─────────────────────────────────────────────────────────────
   NavRow
───────────────────────────────────────────────────────────── */

type NavRowProps = {
  icon: IconSvgElement;
  label: string;
  subtitle?: string;
  value?: string;
  onPress: () => void;
  destructive?: boolean;
  iconColor?: string;
  showArrow?: boolean;
  theme: ThemeContextType;
};

const NavRow = React.memo(function NavRow({
  icon,
  label,
  subtitle,
  value,
  onPress,
  destructive = false,
  iconColor: iconColorOverride,
  showArrow = true,
  theme,
}: NavRowProps) {
  const styles = useMemo(() => createRowStyles(theme), [theme]);
  const { colors } = theme;
  const iconColor = iconColorOverride ?? (destructive ? colors.danger : colors.text);
  const labelColor = destructive ? colors.danger : colors.text;

  return (
    <BentoPressable onPress={onPress} style={styles.row}>
      <IconAvatar icon={icon} color={iconColor} variant="subtle" size={36} />
      <View style={styles.rowInfo}>
        <Text style={[styles.rowLabel, { color: labelColor }]}>{label}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {value || showArrow ? (
        <View style={styles.rowRight}>
          {value ? (
            <Text style={[styles.rowValue, destructive && { color: colors.danger }]}>
              {value}
            </Text>
          ) : null}
          {showArrow ? (
            <HugeiconsIcon icon={ArrowRight01Icon} size={14} color={colors.textMuted} />
          ) : null}
        </View>
      ) : null}
    </BentoPressable>
  );
});

/* Shared row styles */
const createRowStyles = ({ colors, typography, spacing }: ThemeContextType) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3.5'),
      paddingHorizontal: spacing('4'),
      paddingVertical: spacing('3.5'),
      backgroundColor: colors.surface,
    },
    rowInfo: { flex: 1, gap: 2 },
    rowLabel: {
      fontFamily: typography.styles.rowLabel.fontFamily,
      ...typography.metrics.md,
      color: colors.text,
    },
    rowSubtitle: {
      fontFamily: typography.fonts.regular,
      ...typography.metrics.xs,
      color: colors.textMuted,
      marginTop: 1,
    },
    rowRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('2'),
    },
    rowValue: {
      fontFamily: typography.styles.rowValue.fontFamily,
      ...typography.metrics.sm,
      color: colors.textMuted,
    },
  });

/* ─────────────────────────────────────────────────────────────
   Theme options
───────────────────────────────────────────────────────────── */

const THEME_OPTIONS: { label: 'light' | 'dark' | 'followSystem'; value: 'light' | 'dark' | 'system'; icon: IconSvgElement }[] = [
  { label: 'light', value: 'light', icon: Sun01Icon },
  { label: 'dark', value: 'dark', icon: Moon01Icon },
  { label: 'followSystem', value: 'system', icon: ContrastIcon },
];

/* ─────────────────────────────────────────────────────────────
   SettingsScreen
───────────────────────────────────────────────────────────── */

export const SettingsScreen = React.memo(function SettingsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { colors, isDark } = theme;
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, isDark, insets.bottom), [theme, isDark, insets.bottom]);

  const { isPremium } = usePremium();
  const { profile, updateProfile } = useSettings();
  const { language, setLanguage } = useAppLanguage();
  const { isConnected: isBackupConnected } = useGoogleBackup();
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
        // Cloud backup settings, owned by useGoogleBackup.ts
        StorageKeys.AUTO_BACKUP_ENABLED,
        StorageKeys.AUTO_BACKUP_LAST_BACKUP_META,
        StorageKeys.AUTO_BACKUP_LAST_AUTO_TIME,
        RETIRED_AUTO_BACKUP_FREQUENCY_KEY,
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <PageBackground />

      <Header title={t('settings.title')} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Profile card ── */}
        <BentoPressable style={styles.profileCard} onPress={openNameModal}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileMonogram}>{monogram}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile.name || t('settings.welcome')}</Text>
            <Text style={styles.profilePlan}>{isPremium ? t('settings.proMember') : t('settings.freeTier')}</Text>
          </View>
          <HugeiconsIcon icon={PencilEdit01Icon} size={18} color={'rgba(255,255,255,0.5)'} />
        </BentoPressable>

        {/* ── Upgrade card (free users) or Pro badge (premium) ── */}
        <View style={styles.group}>
          {!isPremium ? (
            <BentoPressable onPress={() => router.push('/premium')} style={styles.upgradeRow}>
              <IconAvatar icon={SparklesIcon} color={colors.warning} variant="subtle" size={36} />
              <View style={styles.upgradeInfo}>
                <Text style={styles.upgradeLabel}>{t('settings.upgradeToPro')}</Text>
                <Text style={styles.upgradeSub}>{t('settings.unlockAllFeatures')}</Text>
              </View>
              <View style={styles.upgradePill}>
                <Text style={styles.upgradePillText}>{t('settings.upgrade')}</Text>
              </View>
            </BentoPressable>
          ) : (
            <NavRow
              theme={theme}
              icon={SparklesIcon}
              iconColor={colors.warning}
              label={t('settings.proLifetime')}
              subtitle={t('settings.permanentAccess')}
              value={t('settings.active')}
              showArrow={false}
              onPress={() => router.push('/premium')}
            />
          )}
        </View>

        {/* ── Notifications ── */}
        <Text style={styles.sectionLabel}>{t('settings.notifications')}</Text>
        <View style={styles.group}>
          <SwitchRow
            theme={theme}
            icon={BellIcon}
            iconColor={colors.info}
            label={t('settings.dailyReminder')}
            subtitle={profile.reminderEnabled ? t('settings.reminderOn', { time: profile.reminderTime }) : t('settings.reminderOff')}
            value={profile.reminderEnabled}
            onToggle={handleToggleReminders}
          />
          {profile.reminderEnabled && (
            <>
              <RowSeparator theme={theme} />
              <NavRow
                theme={theme}
                icon={AlarmClockIcon}
                iconColor={colors.info}
                label={t('settings.reminderTime')}
                value={profile.reminderTime}
                showArrow={false}
                onPress={() => setShowTimePicker(true)}
              />
            </>
          )}
        </View>

        {/* ── Preferences ── */}
        <Text style={styles.sectionLabel}>{t('settings.preferences')}</Text>
        <View style={styles.group}>
          <NavRow
            theme={theme}
            icon={Coins02Icon}
            iconColor={colors.success}
            label={t('settings.defaultCurrency')}
            value={profile.defaultCurrency || 'USD'}
            showArrow={false}
            onPress={() => setShowCurrencyPicker(true)}
          />
          <RowSeparator theme={theme} />
          <NavRow
            theme={theme}
            icon={TranslateIcon}
            iconColor={colors.info}
            label={t('settings.language')}
            subtitle={languageLabel}
            showArrow={false}
            onPress={() => setShowLanguageDialog(true)}
          />
          <RowSeparator theme={theme} />
          <NavRow
            theme={theme}
            icon={ContrastIcon}
            iconColor={colors.info}
            label={t('settings.appearance')}
            subtitle={themeLabel}
            showArrow={false}
            onPress={() => setShowThemeDialog(true)}
          />
          <RowSeparator theme={theme} />
          <SwitchRow
            theme={theme}
            icon={LockPasswordIcon}
            iconColor={colors.primary}
            label={t('settings.appLock')}
            subtitle={lockSubtitle}
            value={lockEnabled}
            onToggle={handleToggleLock}
          />
          {lockMode === 'pin' && lockEnabled && (
            <>
              <RowSeparator theme={theme} />
              <NavRow
                theme={theme}
                icon={PinCodeIcon}
                iconColor={colors.primary}
                label={t('settings.changePin')}
                subtitle={t('settings.updatePin')}
                onPress={handleChangePinPress}
              />
            </>
          )}
        </View>

        {/* ── Data & Backup ── */}
        <Text style={styles.sectionLabel}>{t('settings.dataBackup')}</Text>
        <View style={styles.group}>
          <NavRow
            theme={theme}
            icon={CloudIcon}
            iconColor={isBackupConnected ? colors.success : colors.primary}
            label={t('settings.cloudBackup')}
            subtitle={isBackupConnected ? t('settings.cloudActive') : t('settings.cloudSetup')}
            value={isBackupConnected ? t('settings.connected') : t('settings.notSetUp')}
            onPress={() => router.push('/(main)/backup')}
          />
          <RowSeparator theme={theme} />
          <NavRow
            theme={theme}
            icon={GridIcon}
            iconColor={colors.success}
            label={t('settings.categories')}
            subtitle={t('settings.categoriesHint')}
            onPress={() => router.push('/categories')}
          />
          <RowSeparator theme={theme} />
          <NavRow
            theme={theme}
            icon={UserGroupIcon}
            iconColor={colors.info}
            label={t('settings.people')}
            subtitle={t('settings.peopleHint')}
            onPress={() => router.push('/persons')}
          />
          <RowSeparator theme={theme} />
          <NavRow
            theme={theme}
            icon={Download01Icon}
            iconColor={colors.textMuted}
            label={t('settings.exportCsv')}
            subtitle={t('settings.exportHint')}
            onPress={openExport}
          />
        </View>

        {/* ── Legal ── */}
        <Text style={styles.sectionLabel}>{t('settings.legal')}</Text>
        <View style={styles.group}>
          <NavRow
            theme={theme}
            icon={ShieldKeyIcon}
            iconColor={colors.textMuted}
            label={t('settings.privacy')}
            subtitle={t('settings.privacyHint')}
            onPress={openPrivacy}
          />
          <RowSeparator theme={theme} />
          <NavRow
            theme={theme}
            icon={File01Icon}
            iconColor={colors.textMuted}
            label={t('settings.terms')}
            subtitle={t('settings.termsHint')}
            onPress={openTerms}
          />
        </View>

        {/* ── Danger zone ── */}
        <Text style={styles.sectionLabel}>{t('settings.dangerZone')}</Text>
        <View style={styles.group}>
          <NavRow
            theme={theme}
            icon={Delete01Icon}
            label={t('settings.factoryReset')}
            subtitle={t('settings.factoryResetHint')}
            onPress={() => setShowResetDialog(true)}
            destructive
          />
        </View>

        {showTimePicker && (
          <DateTimePicker
            value={reminderTimeDate}
            mode="time"
            is24Hour
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onTimeChange}
          />
        )}

        {/* ── Footer ── */}
        <TouchableOpacity
          onPress={handleFooterTap}
          hitSlop={{ top: 12, bottom: 12, left: 24, right: 24 }}
          activeOpacity={1}
        >
          <View style={styles.footer}>
            <Text style={styles.footerBrand}>Fintraq / Core</Text>
            <Text style={styles.footerCopy}>{t('settings.footer', { version: appVersion })}</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Overlays ── */}
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

      <PinSetupModal
        visible={showPinSetup}
        onCancel={handlePinSetupCancel}
        onComplete={handlePinSetupComplete}
      />

      <AlertDialog
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
});

/* ─────────────────────────────────────────────────────────────
   Screen-level styles
───────────────────────────────────────────────────────────── */

const createStyles = (
  { colors, spacing, radius, typography, layout, tabBarClearance }: ThemeContextType,
  isDark: boolean,
  bottomInset: number,
) => {
  const profileBg = isDark ? '#2C2C2E' : '#111111';

  return StyleSheet.create({
    container: { flex: 1 },
    scroll: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('2'),
      paddingBottom: tabBarClearance(bottomInset),
    },

    /* ── Profile card ── */
    profileCard: {
      backgroundColor: profileBg,
      borderRadius: radius('2xl'),
      padding: spacing('5'),
      marginBottom: spacing('4'),
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('4'),
    },
    profileAvatar: {
      width: 48,
      height: 48,
      borderRadius: radius('full'),
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    profileMonogram: {
      fontFamily: typography.styles.profileMono.fontFamily,
      ...typography.metrics.xl,
      color: colors.primaryForeground,
    },
    profileInfo: {
      flex: 1,
      gap: spacing('0.5'),
    },
    profileName: {
      fontFamily: typography.styles.profileName.fontFamily,
      ...typography.metrics.lg,
      color: '#FFFFFF',
    },
    profilePlan: {
      fontFamily: typography.fonts.regular,
      ...typography.metrics.xs,
      color: 'rgba(255,255,255,0.55)',
    },

    /* ── Group ── */
    group: {
      borderRadius: radius('xl'),
      overflow: 'hidden',
      marginBottom: spacing('4'),
    },

    /* ── Section label ── */
    sectionLabel: {
      fontFamily: typography.styles.sectionLabel.fontFamily,
      ...typography.metrics.xs,
      color: colors.textMuted,
      marginBottom: spacing('2'),
      marginLeft: spacing('1'),
    },

    /* ── Upgrade row ── */
    upgradeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3.5'),
      paddingHorizontal: spacing('4'),
      paddingVertical: spacing('3.5'),
      backgroundColor: colors.surface,
    },
    upgradeInfo: { flex: 1, gap: 2 },
    upgradeLabel: {
      fontFamily: typography.styles.rowLabel.fontFamily,
      ...typography.metrics.md,
      color: colors.text,
    },
    upgradeSub: {
      fontFamily: typography.fonts.regular,
      ...typography.metrics.xs,
      color: colors.textMuted,
      marginTop: 1,
    },
    upgradePill: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing('4'),
      paddingVertical: spacing('2'),
      borderRadius: radius('full'),
    },
    upgradePillText: {
      fontFamily: typography.styles.buttonLabel.fontFamily,
      ...typography.metrics.sm,
      color: colors.primaryForeground,
    },

    /* ── Footer ── */
    footer: {
      alignItems: 'center',
      gap: spacing('1'),
      marginTop: spacing('2'),
      paddingVertical: spacing('4'),
    },
    footerBrand: {
      fontFamily: typography.styles.sectionLabel.fontFamily,
      ...typography.metrics.xxs,
      color: colors.text,
      opacity: 0.25,
    },
    footerCopy: {
      fontFamily: typography.fonts.regular,
      ...typography.metrics.xxs,
      color: colors.textMuted,
      opacity: 0.35,
    },
  });
};
