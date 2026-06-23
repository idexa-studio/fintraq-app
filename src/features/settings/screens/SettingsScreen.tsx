import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { ConfirmDialog } from '@/src/components/ui/ConfirmDialog';
import { CurrencyPickerBottomSheet } from '@/src/components/ui/CurrencyPickerBottomSheet';
import { Header } from '@/src/components/ui/Header';
import { IconAvatar } from '@/src/components/ui/IconAvatar';
import { OptionsDialog } from '@/src/components/ui/OptionsDialog';
import { PageBackground } from '@/src/components/ui/PageBackground';
import { TextInputDialog } from '@/src/components/ui/TextInputDialog';
import { StorageKeys } from '@/src/constants/keys';
import { db } from '@/src/db/client';
import { accounts, categories, payments, persons } from '@/src/db/schema';
import { LockStorage } from '@/src/features/lock/api/lockStorage';
import { PinSetupModal } from '@/src/features/lock/components/PinSetupModal';
import { authenticateWithBiometrics, getBiometricCapability } from '@/src/features/lock/hooks/useLocalAuth';
import { useAppLock } from '@/src/providers/AppLockProvider';
import { usePremium } from '@/src/providers/PremiumProvider';
import { useSettings } from '@/src/providers/SettingsProvider';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { NotificationService } from '@/src/services/notification.service';
import { getFormattedAppVersion } from '@/src/utils/version';
import {
  AlarmClockIcon,
  ArrowRight01Icon,
  BellIcon,
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
  UserGroupIcon,
} from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
        backgroundColor: theme.colors.text + '18',
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
        trackColor={{ false: colors.text + '18', true: colors.primary }}
        thumbColor={'#FFFFFF'}
        ios_backgroundColor={colors.text + '18'}
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
      fontSize: typography.sizes.md,
      color: colors.text,
    },
    rowSubtitle: {
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.xs,
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
      fontSize: typography.sizes.sm,
      color: colors.textMuted,
    },
  });

/* ─────────────────────────────────────────────────────────────
   Theme options
───────────────────────────────────────────────────────────── */

const THEME_OPTIONS: { label: string; value: 'light' | 'dark' | 'system'; icon: IconSvgElement }[] = [
  { label: 'Light', value: 'light', icon: Sun01Icon },
  { label: 'Dark', value: 'dark', icon: Moon01Icon },
  { label: 'Follow system', value: 'system', icon: ContrastIcon },
];

/* ─────────────────────────────────────────────────────────────
   SettingsScreen
───────────────────────────────────────────────────────────── */

export const SettingsScreen = React.memo(function SettingsScreen() {
  const theme = useTheme();
  const { colors, isDark } = theme;
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const { isPremium } = usePremium();
  const { profile, updateProfile } = useSettings();
  const router = useRouter();

  const { lockEnabled, lockMode, enableLock, disableLock } = useAppLock();
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [showThemeDialog, setShowThemeDialog] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [devTaps, setDevTaps] = useState(0);

  /* ── App lock ── */
  const handleToggleLock = useCallback(async () => {
    if (lockEnabled) {
      const cap = await getBiometricCapability();
      let confirmed = false;
      if (lockMode === 'biometric' && cap.available) {
        confirmed = await authenticateWithBiometrics('Confirm to disable lock');
      } else {
        confirmed = await new Promise<boolean>(resolve => {
          Alert.alert(
            'Disable app lock',
            'Are you sure you want to remove the app lock?',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Disable', style: 'destructive', onPress: () => resolve(true) },
            ],
          );
        });
      }
      if (confirmed) await disableLock();
    } else {
      const cap = await getBiometricCapability();
      if (cap.available) {
        const confirmed = await authenticateWithBiometrics('Confirm to enable lock');
        if (confirmed) await enableLock('biometric');
      } else {
        setShowPinSetup(true);
      }
    }
  }, [lockEnabled, lockMode, enableLock, disableLock]);

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
        Alert.alert('Permission required', 'Enable notifications in device settings.');
        return;
      }
    }
    await updateProfile({ reminderEnabled: next });
  }, [profile.reminderEnabled, updateProfile]);

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
      // Delete user data only — seederState (schema migration tracking) is preserved
      // so ALTER TABLE migrations don't re-run and crash on next launch
      await db.delete(payments);
      await db.delete(persons);
      await db.delete(categories);
      await db.delete(accounts);

      // Clear user-facing AsyncStorage keys only — do NOT use AsyncStorage.clear()
      // which would also wipe any infra keys added in the future
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
      ]);

      Alert.alert('Wipe complete', 'All data erased. Restart the app.');
      router.replace('/(onboarding)');
    } catch {
      Alert.alert('Error', 'Failed to erase data.');
    }
  }, [router]);

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
    const p = Platform.OS === 'ios' ? 'ios' : 'android';
    Linking.openURL(`https://fintraq.idexa.app/in-app/privacy?platform=${p}`);
  }, []);

  const openTerms = useCallback(() => {
    const p = Platform.OS === 'ios' ? 'ios' : 'android';
    Linking.openURL(`https://fintraq.idexa.app/in-app/terms?platform=${p}`);
  }, []);

  const openExport = useCallback(() => {
    router.push(isPremium ? '/export' : '/premium');
  }, [isPremium, router]);

  /* ── Memos ── */
  const themeLabel = useMemo(() => {
    const match = THEME_OPTIONS.find(o => o.value === (profile.theme || 'system'));
    return match?.label ?? 'Follow system';
  }, [profile.theme]);

  const reminderTimeDate = useMemo(() => {
    const [h, m] = profile.reminderTime.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  }, [profile.reminderTime]);

  const themeDialogOptions = useMemo(() =>
    THEME_OPTIONS.map(o => ({
      key: o.value,
      label: o.label,
      icon: o.icon,
      selected: (profile.theme || 'system') === o.value,
      onPress: async () => { await updateProfile({ theme: o.value }); },
    })),
    [profile.theme, updateProfile],
  );

  const appVersion = getFormattedAppVersion();
  const monogram = (profile.name || 'W').charAt(0).toUpperCase();

  const lockSubtitle = lockMode === 'biometric'
    ? 'Face ID / Fingerprint enabled'
    : lockMode === 'pin'
    ? 'PIN lock enabled'
    : 'Biometric / PIN on resume';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <PageBackground />

      <Header title="Settings" />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Profile card ── */}
        <BentoPressable style={styles.profileCard} onPress={openNameModal}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileMonogram}>{monogram}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile.name || 'Welcome'}</Text>
            <Text style={styles.profilePlan}>{isPremium ? 'Pro member' : 'Free Tier'}</Text>
          </View>
          <HugeiconsIcon icon={PencilEdit01Icon} size={18} color={'rgba(255,255,255,0.5)'} />
        </BentoPressable>

        {/* ── Upgrade card (free users) or Pro badge (premium) ── */}
        <View style={styles.group}>
          {!isPremium ? (
            <BentoPressable onPress={() => router.push('/premium')} style={styles.upgradeRow}>
              <IconAvatar icon={SparklesIcon} color={colors.warning} variant="subtle" size={36} />
              <View style={styles.upgradeInfo}>
                <Text style={styles.upgradeLabel}>Upgrade to Pro</Text>
                <Text style={styles.upgradeSub}>Unlock all features</Text>
              </View>
              <View style={styles.upgradePill}>
                <Text style={styles.upgradePillText}>Upgrade</Text>
              </View>
            </BentoPressable>
          ) : (
            <NavRow
              theme={theme}
              icon={SparklesIcon}
              iconColor={colors.warning}
              label="Fintraq Pro — Lifetime"
              subtitle="Permanent access to all features"
              value="Active"
              showArrow={false}
              onPress={() => router.push('/premium')}
            />
          )}
        </View>

        {/* ── Notifications ── */}
        <Text style={styles.sectionLabel}>Notifications</Text>
        <View style={styles.group}>
          <SwitchRow
            theme={theme}
            icon={BellIcon}
            iconColor={colors.info}
            label="Daily reminder"
            subtitle={profile.reminderEnabled ? `On · ${profile.reminderTime}` : 'Get a nudge to log transactions'}
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
                label="Reminder time"
                value={profile.reminderTime}
                showArrow={false}
                onPress={() => setShowTimePicker(true)}
              />
            </>
          )}
        </View>

        {/* ── Preferences ── */}
        <Text style={styles.sectionLabel}>Preferences</Text>
        <View style={styles.group}>
          <NavRow
            theme={theme}
            icon={Coins02Icon}
            iconColor={colors.success}
            label="Default currency"
            value={profile.defaultCurrency || 'USD'}
            showArrow={false}
            onPress={() => setShowCurrencyPicker(true)}
          />
          <RowSeparator theme={theme} />
          <NavRow
            theme={theme}
            icon={ContrastIcon}
            iconColor={colors.textMuted}
            label="Appearance"
            subtitle={themeLabel}
            showArrow={false}
            onPress={() => setShowThemeDialog(true)}
          />
          <RowSeparator theme={theme} />
          <SwitchRow
            theme={theme}
            icon={LockPasswordIcon}
            iconColor={colors.primary}
            label="App lock"
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
                label="Change PIN"
                subtitle="Update security PIN code"
                onPress={handleChangePinPress}
              />
            </>
          )}
        </View>

        {/* ── Data ── */}
        <Text style={styles.sectionLabel}>Data</Text>
        <View style={styles.group}>
          <NavRow
            theme={theme}
            icon={GridIcon}
            iconColor={colors.success}
            label="Categories"
            subtitle="Manage expense/income categories"
            onPress={() => router.push('/categories')}
          />
          <RowSeparator theme={theme} />
          <NavRow
            theme={theme}
            icon={UserGroupIcon}
            iconColor={colors.info}
            label="People"
            subtitle="Manage people linked to transactions"
            onPress={() => router.push('/persons')}
          />
          <RowSeparator theme={theme} />
          <NavRow
            theme={theme}
            icon={Download01Icon}
            iconColor={colors.textMuted}
            label="Export CSV"
            subtitle="Download data as spreadsheet"
            onPress={openExport}
          />
        </View>

        {/* ── Legal ── */}
        <Text style={styles.sectionLabel}>Legal</Text>
        <View style={styles.group}>
          <NavRow
            theme={theme}
            icon={ShieldKeyIcon}
            iconColor={colors.textMuted}
            label="Privacy policy"
            subtitle="How we manage your data"
            onPress={openPrivacy}
          />
          <RowSeparator theme={theme} />
          <NavRow
            theme={theme}
            icon={File01Icon}
            iconColor={colors.textMuted}
            label="Terms of service"
            subtitle="App rules and conditions"
            onPress={openTerms}
          />
        </View>

        {/* ── Danger zone ── */}
        <Text style={styles.sectionLabel}>Danger zone</Text>
        <View style={styles.group}>
          <NavRow
            theme={theme}
            icon={Delete01Icon}
            label="Factory reset"
            subtitle="Erase all data and start fresh"
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
            <Text style={styles.footerCopy}>Data encrypted and stored locally. v{appVersion}</Text>
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
        title="App theme"
        options={themeDialogOptions}
      />

      <ConfirmDialog
        visible={showResetDialog}
        onClose={() => setShowResetDialog(false)}
        title="Factory reset"
        message="This permanently erases all accounts, categories, and transactions. Cannot be undone."
        confirmLabel="Erase everything"
        destructive
        onConfirm={runReset}
      />

      <TextInputDialog
        visible={showNameModal}
        onClose={closeNameModal}
        onSave={saveName}
        title="Display name"
        subtitle="How you are greeted on the dashboard"
        initialValue={profile.name || ''}
        placeholder="Your name"
        maxLength={30}
        saveLabel="Save"
        inputProps={{ autoCapitalize: 'words' }}
      />

      <PinSetupModal
        visible={showPinSetup}
        onCancel={handlePinSetupCancel}
        onComplete={handlePinSetupComplete}
      />
    </SafeAreaView>
  );
});

/* ─────────────────────────────────────────────────────────────
   Screen-level styles
───────────────────────────────────────────────────────────── */

const createStyles = (
  { colors, spacing, radius, typography, layout }: ThemeContextType,
  isDark: boolean,
) => {
  const profileBg = isDark ? '#2C2C2E' : '#111111';

  return StyleSheet.create({
    container: { flex: 1 },
    scroll: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('2'),
      paddingBottom: 110,
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
      fontSize: typography.sizes.xl,
      color: colors.primaryForeground,
    },
    profileInfo: {
      flex: 1,
      gap: spacing('0.5'),
    },
    profileName: {
      fontFamily: typography.styles.profileName.fontFamily,
      fontSize: typography.sizes.lg,
      color: '#FFFFFF',
    },
    profilePlan: {
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.xs,
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
      fontSize: typography.sizes.xs,
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
      fontSize: typography.sizes.md,
      color: colors.text,
    },
    upgradeSub: {
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.xs,
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
      fontSize: typography.sizes.sm,
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
      fontSize: typography.sizes.xxs,
      color: colors.text,
      opacity: 0.25,
    },
    footerCopy: {
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.xxs,
      color: colors.textMuted,
      opacity: 0.35,
    },
  });
};
