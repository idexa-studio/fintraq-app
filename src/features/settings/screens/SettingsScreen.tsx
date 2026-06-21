import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { ConfirmDialog } from '@/src/components/ui/ConfirmDialog';
import { CurrencyPickerBottomSheet } from '@/src/components/ui/CurrencyPickerBottomSheet';
import { Header } from '@/src/components/ui/Header';
import { IconAvatar } from '@/src/components/ui/IconAvatar';
import { OptionsBottomSheet } from '@/src/components/ui/OptionsBottomSheet';
import { PageBackground } from '@/src/components/ui/PageBackground';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { TextInputDialog } from '@/src/components/ui/TextInputDialog';
import { db } from '@/src/db/client';
import { accounts, categories, payments, persons, seederState } from '@/src/db/schema';
import { PinSetupModal } from '@/src/features/lock/components/PinSetupModal';
import { getBiometricCapability, authenticateWithBiometrics } from '@/src/features/lock/hooks/useLocalAuth';
import { LockStorage } from '@/src/features/lock/api/lockStorage';
import { useAppLock } from '@/src/providers/AppLockProvider';
import { usePremium } from '@/src/providers/PremiumProvider';
import { useSettings } from '@/src/providers/SettingsProvider';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { NotificationService } from '@/src/services/notification.service';
import {
  AlarmClockIcon,
  ArrowRight01Icon,
  BellIcon,
  Calendar01Icon,
  CellularNetworkIcon,
  CoinsIcon,
  Delete01Icon,
  Download01Icon,
  File01Icon,
  GridIcon,
  LockPasswordIcon,
  PinCodeIcon,
  Moon01Icon,
  ShieldKeyIcon,
  SparklesIcon,
  Sun01Icon,
  UserAccountIcon,
  ContrastIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import type { IconSvgElement } from '@hugeicons/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { getFormattedAppVersion } from '@/src/utils/version';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Linking, Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


type SwitchRowProps = {
  icon: IconSvgElement;
  label: string;
  subtitle: string;
  value: boolean;
  onToggle: () => void;
  iconColor?: string;
};

const SwitchRow = React.memo(function SwitchRow({
  icon,
  label,
  subtitle,
  value,
  onToggle,
  iconColor,
  theme,
}: SwitchRowProps & { theme: ThemeContextType }) {
  const { colors, typography, spacing } = theme;
  const resolvedIconColor = iconColor ?? colors.text;

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3'),
      paddingHorizontal: spacing('4'),
      paddingVertical: spacing('3.5'),
      backgroundColor: colors.surface,
      marginBottom: spacing('0.5'),
    }}>
      <IconAvatar icon={icon} color={resolvedIconColor} variant="subtle" size={32} iconSize={14} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: typography.fonts.semibold, fontSize: typography.sizes.md, color: colors.text }}>
          {label}
        </Text>
        <Text style={{ fontFamily: typography.fonts.regular, fontSize: typography.sizes.xs, color: colors.textMuted, marginTop: 2, opacity: 0.65 }}>
          {subtitle}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.background, true: colors.primary + '40' }}
        thumbColor={value ? colors.primary : colors.textMuted}
        ios_backgroundColor={colors.background}
      />
    </View>
  );
});

type NavRowProps = {
  icon: IconSvgElement;
  label: string;
  subtitle: string;
  value?: string;
  onPress: () => void;
  destructive?: boolean;
  iconColor?: string;
  isLast?: boolean;
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
  isLast,
  theme,
}: NavRowProps) {
  const { colors, typography, spacing } = theme;
  const iconColor = iconColorOverride ?? (destructive ? colors.danger : colors.text);
  const labelColor = destructive ? colors.danger : colors.text;

  return (
    <BentoPressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing('3'),
        paddingHorizontal: spacing('4'),
        paddingVertical: spacing('3.5'),
        backgroundColor: colors.surface,
        marginBottom: isLast ? 0 : spacing('0.5'),
      }}
    >
      <IconAvatar icon={icon} color={iconColor} variant="subtle" size={32} iconSize={14} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: typography.fonts.semibold, fontSize: typography.sizes.md, color: labelColor }}>
          {label}
        </Text>
        <Text style={{ fontFamily: typography.fonts.regular, fontSize: typography.sizes.xs, color: colors.textMuted, marginTop: 2, opacity: 0.65 }}>
          {subtitle}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing('1.5') }}>
        {value ? (
          <Text style={{ fontFamily: typography.fonts.semibold, fontSize: typography.sizes.xs, color: colors.primary }}>
            {value}
          </Text>
        ) : null}
        <HugeiconsIcon icon={ArrowRight01Icon} size={14} color={colors.textMuted} />
      </View>
    </BentoPressable>
  );
});

const THEME_OPTIONS: { label: string; value: 'light' | 'dark' | 'system'; icon: IconSvgElement }[] = [
  { label: 'Light', value: 'light', icon: Sun01Icon },
  { label: 'Dark', value: 'dark', icon: Moon01Icon },
  { label: 'Follow system', value: 'system', icon: ContrastIcon },
];

export const SettingsScreen = React.memo(function SettingsScreen() {
  const theme = useTheme();
  const { colors, typography, heroCard } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

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

  const handleToggleLock = useCallback(async () => {
    if (lockEnabled) {
      // require auth before disabling
      const cap = await getBiometricCapability();
      let confirmed = false;
      if (lockMode === 'biometric' && cap.available) {
        confirmed = await authenticateWithBiometrics('Confirm to disable lock');
      } else {
        // PIN mode — user will just confirm via alert (PIN already set, trust session)
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

  const handleChangePinPress = useCallback(() => {
    setShowPinSetup(true);
  }, []);

  const handlePinSetupCancel = useCallback(() => {
    setShowPinSetup(false);
  }, []);

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

  const openNameModal = useCallback(() => setShowNameModal(true), []);
  const closeNameModal = useCallback(() => setShowNameModal(false), []);
  const saveName = useCallback(async (name: string) => {
    await updateProfile({ name });
  }, [updateProfile]);

  const onTimeChange = useCallback(async (event: DateTimePickerEvent, date?: Date) => {
    setShowTimePicker(false);
    if (date && event.type === 'set') {
      const hh = date.getHours().toString().padStart(2, '0');
      const mm = date.getMinutes().toString().padStart(2, '0');
      await updateProfile({ reminderTime: `${hh}:${mm}` });
    }
  }, [updateProfile]);

  const runReset = useCallback(async () => {
    try {
      await db.delete(payments);
      await db.delete(persons);
      await db.delete(categories);
      await db.delete(accounts);
      await db.delete(seederState);
      await AsyncStorage.clear();
      Alert.alert('Wipe complete', 'All data erased. Restart the app.');
      router.replace('/(onboarding)');
    } catch {
      Alert.alert('Error', 'Failed to erase data.');
    }
  }, [router]);

  const handleFooterTap = useCallback(() => {
    const next = devTaps + 1;
    if (next >= 10) {
      router.push('/developer');
      setDevTaps(0);
    } else {
      setDevTaps(next);
    }
  }, [devTaps, router]);

  const openPrivacy = useCallback(() => {
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    Linking.openURL(`https://fintraq.idexa.app/in-app/privacy?platform=${platform}`);
  }, []);

  const openTerms = useCallback(() => {
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    Linking.openURL(`https://fintraq.idexa.app/in-app/terms?platform=${platform}`);
  }, []);

  const openExport = useCallback(() => {
    router.push(isPremium ? '/export' : '/premium');
  }, [isPremium, router]);

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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <PageBackground />

      <Header title="Settings" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroAvatar}>
            <Text style={[styles.heroMonogram, { fontFamily: typography.fonts.bold, color: heroCard.textPrimary }]}>
              {(profile.name || 'W').charAt(0).toUpperCase()}
            </Text>
          </View>

          <View style={styles.heroInfo}>
            <Text style={[styles.heroName, { fontFamily: typography.fonts.bold, color: heroCard.textPrimary }]}>
              {profile.name || 'Welcome'}
            </Text>
            <View style={styles.heroMeta}>
              <Text style={[styles.heroMetaText, { fontFamily: typography.fonts.regular, color: heroCard.textMuted }]}>
                {isPremium ? 'Pro member' : 'Free plan'}
              </Text>
              <View style={[styles.heroMetaDot, { backgroundColor: heroCard.textMuted }]} />
              <Text style={[styles.heroMetaText, { fontFamily: typography.fonts.regular, color: heroCard.textMuted }]}>
                v{appVersion}
              </Text>
            </View>
          </View>
        </View>

        <SectionHeader title="Plan" noPadding />
        <View style={styles.group}>
          <NavRow
            theme={theme}
            icon={SparklesIcon}
            iconColor={colors.warning}
            label={isPremium ? 'Fintraq Pro — Lifetime' : 'Upgrade to Pro'}
            subtitle={isPremium ? 'You have permanent access to every feature' : 'Unlock analytics, insights, and more'}
            value={isPremium ? 'Active' : undefined}
            onPress={() => router.push('/premium')}
            isLast
          />
        </View>

        <SectionHeader title="Preferences" noPadding />
        <View style={styles.group}>
          <SwitchRow
            theme={theme}
            icon={BellIcon}
            iconColor={colors.info}
            label="Daily reminder"
            subtitle="Get a nudge to log your daily transactions"
            value={profile.reminderEnabled}
            onToggle={handleToggleReminders}
          />
          {profile.reminderEnabled && (
            <>
              <NavRow
                theme={theme}
                icon={AlarmClockIcon}
                iconColor={colors.info}
                label="Reminder time"
                subtitle="When you receive your daily notification"
                value={profile.reminderTime}
                onPress={() => setShowTimePicker(true)}
              />
            </>
          )}
          <NavRow
            theme={theme}
            icon={CoinsIcon}
            iconColor={colors.success}
            label="Default currency"
            subtitle="Used for new accounts and display"
            value={profile.defaultCurrency || 'USD'}
            onPress={() => setShowCurrencyPicker(true)}
          />
          <NavRow
            theme={theme}
            icon={UserAccountIcon}
            iconColor={colors.textMuted}
            label="Display name"
            subtitle="How you appear throughout the app"
            value={profile.name || 'Not set'}
            onPress={openNameModal}
          />
          <NavRow
            theme={theme}
            icon={ContrastIcon}
            iconColor={colors.textMuted}
            label="Theme"
            subtitle="Light, dark, or follow your system setting"
            value={themeLabel}
            onPress={() => setShowThemeDialog(true)}
            isLast
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

        <SectionHeader title="Security" noPadding />
        <View style={styles.group}>
          <SwitchRow
            theme={theme}
            icon={LockPasswordIcon}
            iconColor={colors.primary}
            label="App lock"
            subtitle={lockMode === 'biometric' ? 'Face ID / fingerprint' : lockMode === 'pin' ? 'PIN lock' : 'Require biometrics or PIN on open'}
            value={lockEnabled}
            onToggle={handleToggleLock}
          />
          {lockMode === 'pin' && lockEnabled && (
            <NavRow
              theme={theme}
              icon={PinCodeIcon}
              iconColor={colors.primary}
              label="Change PIN"
              subtitle="Update your 6-digit unlock code"
              onPress={handleChangePinPress}
              isLast
            />
          )}
        </View>

        <SectionHeader title="Data" noPadding />
        <View style={styles.group}>
          <NavRow
            theme={theme}
            icon={GridIcon}
            iconColor={colors.success}
            label="Categories"
            subtitle="Manage your income and expense groups"
            onPress={() => router.push('/categories')}
          />
          <NavRow
            theme={theme}
            icon={Download01Icon}
            iconColor={colors.textMuted}
            label="Export CSV"
            subtitle="Download transactions as a spreadsheet file"
            onPress={openExport}
            isLast
          />
        </View>

        <SectionHeader title="Legal" noPadding />
        <View style={styles.group}>
          <NavRow
            theme={theme}
            icon={ShieldKeyIcon}
            iconColor={colors.textMuted}
            label="Privacy policy"
            subtitle="How we handle your data"
            onPress={openPrivacy}
          />
          <NavRow
            theme={theme}
            icon={File01Icon}
            iconColor={colors.textMuted}
            label="Terms of service"
            subtitle="Rules and guidelines for using Fintraq"
            onPress={openTerms}
            isLast
          />
        </View>

        <SectionHeader title="Danger zone" noPadding />
        <View style={styles.group}>
          <NavRow
            theme={theme}
            icon={Delete01Icon}
            label="Factory reset"
            subtitle="Permanently erase all data and start fresh"
            onPress={() => setShowResetDialog(true)}
            destructive
            isLast
          />
        </View>

        <BentoPressable onPress={handleFooterTap} hitSlop={{ top: 12, bottom: 12, left: 24, right: 24 }}>
          <View style={styles.footer}>
            <Text style={[styles.footerBrand, { fontFamily: typography.fonts.semibold, color: colors.text }]}>
              Fintraq / Core
            </Text>
            <Text style={[styles.footerCopy, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
              Data encrypted and stored locally.
            </Text>
          </View>
        </BentoPressable>
      </ScrollView>

      <CurrencyPickerBottomSheet
        visible={showCurrencyPicker}
        onClose={() => setShowCurrencyPicker(false)}
        value={profile.defaultCurrency || 'USD'}
        onChange={(code) => { updateProfile({ defaultCurrency: code }); }}
      />

      <OptionsBottomSheet
        visible={showThemeDialog}
        onClose={() => setShowThemeDialog(false)}
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

const createStyles = ({ colors, heroCard, spacing, radius, typography, layout }: ThemeContextType) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('2'),
      paddingBottom: 24,
    },

    heroCard: {
      backgroundColor: heroCard.background,
      borderRadius: radius('2xl'),
      padding: spacing('6'),
      marginBottom: spacing('7'),
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('5'),
      overflow: 'hidden',
    },
    heroAvatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: heroCard.textPrimary + '15',
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroMonogram: {
      fontSize: 22,
    },
    heroInfo: {
      flex: 1,
      gap: spacing('1.5'),
    },
    heroName: {
      fontSize: 22,
    },
    heroMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('2'),
    },
    heroMetaText: {
      fontSize: 12,
      opacity: 0.7,
    },
    heroMetaDot: {
      width: 3,
      height: 3,
      borderRadius: radius('full'),
      opacity: 0.4,
    },

    group: {
      borderRadius: radius('xl'),
      overflow: 'hidden',
      marginBottom: spacing('3'),
    },

    footer: {
      alignItems: 'center',
      gap: spacing('1.5'),
      marginTop: spacing('3'),
      paddingVertical: spacing('4'),
    },
    footerBrand: {
      fontSize: 10,
      opacity: 0.3,
    },
    footerCopy: {
      fontSize: 10,
      opacity: 0.4,
    },
  });

// Suppress unused import warnings for icons only used in THEME_OPTIONS
void Calendar01Icon;
void CellularNetworkIcon;
