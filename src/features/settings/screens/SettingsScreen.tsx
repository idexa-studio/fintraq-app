import { ConfirmDialog } from '@/src/components/ui/ConfirmDialog';
import { CurrencyPickerModal } from '@/src/components/ui/CurrencyPickerModal';
import { Header } from '@/src/components/ui/Header';
import { IconAvatar } from '@/src/components/ui/IconAvatar';
import { OptionsDialog } from '@/src/components/ui/OptionsDialog';
import { PageBackground } from '@/src/components/ui/PageBackground';
import { TextInputSheet } from '@/src/components/ui/TextInputSheet';
import { db } from '@/src/db/client';
import { accounts, categories, payments, persons, seederState } from '@/src/db/schema';
import { usePremium } from '@/src/providers/PremiumProvider';
import { useSettings } from '@/src/providers/SettingsProvider';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { NotificationService } from '@/src/services/notification.service';
import { IoniconName } from '@/src/utils/icons';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Constants from 'expo-constants';
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


type SwitchRowProps = {
  icon: IoniconName;
  label: string;
  subtitle: string;
  value: boolean;
  onToggle: () => void;
};

const SwitchRow = React.memo(function SwitchRow({
  icon,
  label,
  subtitle,
  value,
  onToggle,
  theme,
}: SwitchRowProps & { theme: ThemeContextType }) {
  const { colors, typography, spacing } = theme;
  return (
    <View style={[switchRowStyles.row, { paddingHorizontal: spacing('4'), paddingVertical: spacing('3.5'), backgroundColor: colors.surface, marginBottom: spacing('0.5') }]}>
      <IconAvatar icon={icon} color={colors.text} variant="subtle" size={32} iconSize={14} />
      <View style={switchRowStyles.textBlock}>
        <Text style={[switchRowStyles.label, { fontFamily: typography.fonts.semibold, color: colors.text }]}>
          {label}
        </Text>
        <Text style={[switchRowStyles.subtitle, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
          {subtitle}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.surface, true: colors.primary + '40' }}
        thumbColor={value ? colors.primary : colors.textMuted}
        ios_backgroundColor={colors.surface}
      />
    </View>
  );
});

const switchRowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  textBlock: { flex: 1 },
  label: { fontSize: 14 },
  subtitle: { fontSize: 11, marginTop: 2, opacity: 0.65 },
});

type NavRowProps = {
  icon: IoniconName;
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
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.65}
      style={[navRowStyles.row, { paddingHorizontal: spacing('4'), paddingVertical: spacing('3.5'), backgroundColor: colors.surface }, !isLast && { marginBottom: spacing('0.5') }]}
    >
      <IconAvatar icon={icon} color={iconColor} variant="subtle" size={32} iconSize={14} />
      <View style={navRowStyles.textBlock}>
        <Text style={[navRowStyles.label, { fontFamily: typography.fonts.semibold, color: labelColor }]}>
          {label}
        </Text>
        <Text style={[navRowStyles.subtitle, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
          {subtitle}
        </Text>
      </View>
      <View style={navRowStyles.right}>
        {value ? (
          <Text style={[navRowStyles.value, { fontFamily: typography.fonts.semibold, color: colors.primary }]}>
            {value}
          </Text>
        ) : null}
        <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
});

const navRowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  textBlock: { flex: 1 },
  label: { fontSize: 14 },
  subtitle: { fontSize: 11, marginTop: 2, opacity: 0.65 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  value: { fontSize: 11 },
});

const THEME_OPTIONS: { label: string; value: 'light' | 'dark' | 'system'; icon: IoniconName }[] = [
  { label: 'Light', value: 'light', icon: 'sunny-outline' },
  { label: 'Dark', value: 'dark', icon: 'moon-outline' },
  { label: 'Follow system', value: 'system', icon: 'phone-portrait-outline' },
];

export const SettingsScreen = React.memo(function SettingsScreen() {
  const theme = useTheme();
  const { colors, typography, heroCard } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { isPremium } = usePremium();
  const { profile, updateProfile } = useSettings();
  const router = useRouter();

  const [showThemeDialog, setShowThemeDialog] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [devTaps, setDevTaps] = useState(0);

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
    Linking.openURL(`https://numeo.idexa.app/in-app/privacy?platform=${platform}`);
  }, []);

  const openTerms = useCallback(() => {
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    Linking.openURL(`https://numeo.idexa.app/in-app/terms?platform=${platform}`);
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

  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SafeAreaView style={styles.container}>
      <PageBackground />

      <Header title="Settings" showBack />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <Text style={[styles.heroMonogram, { fontFamily: typography.fonts.heading, color: heroCard.textPrimary }]}>
            {(profile.name || 'W').charAt(0).toUpperCase()}
          </Text>

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
                v{version}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>
          Plan
        </Text>
        <View style={styles.group}>
          <NavRow
            theme={theme}
            icon="sparkles"
            label={isPremium ? 'Keeep Pro — Lifetime' : 'Upgrade to Pro'}
            subtitle={isPremium ? 'You have permanent access to every feature' : 'Unlock analytics, insights, and more'}
            value={isPremium ? 'Active' : undefined}
            onPress={() => router.push('/premium')}
            isLast
          />
        </View>

        <Text style={styles.sectionLabel}>
          Preferences
        </Text>
        <View style={styles.group}>
          <SwitchRow
            theme={theme}
            icon="notifications-outline"
            label="Daily reminder"
            subtitle="Get a nudge to log your daily transactions"
            value={profile.reminderEnabled}
            onToggle={handleToggleReminders}
          />
          {profile.reminderEnabled && (
            <>
              <NavRow
                theme={theme}
                icon="time-outline"
                label="Reminder time"
                subtitle="When you receive your daily notification"
                value={profile.reminderTime}
                onPress={() => setShowTimePicker(true)}
              />
            </>
          )}
          <NavRow
            theme={theme}
            icon="cash-outline"
            label="Default currency"
            subtitle="Used for new accounts and display"
            value={profile.defaultCurrency || 'USD'}
            onPress={() => setShowCurrencyPicker(true)}
          />
          <NavRow
            theme={theme}
            icon="person-outline"
            label="Display name"
            subtitle="How you appear throughout the app"
            value={profile.name || 'Not set'}
            onPress={openNameModal}
          />
          <NavRow
            theme={theme}
            icon="contrast-outline"
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

        <Text style={styles.sectionLabel}>
          Data
        </Text>
        <View style={styles.group}>
          <NavRow
            theme={theme}
            icon="people-outline"
            label="Persons"
            subtitle="Manage people linked to transactions"
            onPress={() => router.push('/(main)/persons')}
          />
          <NavRow
            theme={theme}
            icon="grid-outline"
            label="Categories"
            subtitle="Manage your income and expense groups"
            onPress={() => router.push('/categories')}
          />
          <NavRow
            theme={theme}
            icon="download-outline"
            label="Export CSV"
            subtitle="Download transactions as a spreadsheet file"
            onPress={openExport}
            isLast
          />
        </View>

        <Text style={styles.sectionLabel}>
          Legal
        </Text>
        <View style={styles.group}>
          <NavRow
            theme={theme}
            icon="shield-checkmark-outline"
            label="Privacy policy"
            subtitle="How we handle your data"
            onPress={openPrivacy}
          />
          <NavRow
            theme={theme}
            icon="document-text-outline"
            label="Terms of service"
            subtitle="Rules and guidelines for using Keeep"
            onPress={openTerms}
            isLast
          />
        </View>

        <Text style={styles.sectionLabel}>
          Danger zone
        </Text>
        <View style={styles.group}>
          <NavRow
            theme={theme}
            icon="trash-bin-outline"
            label="Factory reset"
            subtitle="Permanently erase all data and start fresh"
            onPress={() => setShowResetDialog(true)}
            destructive
            isLast
          />
        </View>

        <TouchableOpacity onPress={handleFooterTap} activeOpacity={1} hitSlop={{ top: 12, bottom: 12, left: 24, right: 24 }}>
          <View style={styles.footer}>
            <Text style={[styles.footerBrand, { fontFamily: typography.fonts.semibold, color: colors.text }]}>
              Keeep / Core
            </Text>
            <Text style={[styles.footerCopy, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
              Data encrypted and stored locally.
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      <CurrencyPickerModal
        visible={showCurrencyPicker}
        onClose={() => setShowCurrencyPicker(false)}
        value={profile.defaultCurrency || 'USD'}
        onChange={(code) => { updateProfile({ defaultCurrency: code }); }}
      />

      <OptionsDialog
        visible={showThemeDialog}
        onClose={() => setShowThemeDialog(false)}
        title="Theme"
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

      <TextInputSheet
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
      paddingBottom: spacing('9'),
    },

    heroCard: {
      backgroundColor: heroCard.background,
      borderRadius: radius('2xl'),
      padding: spacing('6'),
      marginBottom: spacing('7'),
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('5'),
    },
    heroMonogram: {
      fontSize: 72,
      lineHeight: 76,
      opacity: 0.35,
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

    sectionLabel: {
      fontFamily: typography.fonts.semibold,
      color: colors.textMuted,
      fontSize: typography.sizes.sm,
      marginTop: spacing('5'),
      marginBottom: spacing('3'),
    },

    group: {
      borderRadius: radius('xl'),
      overflow: 'hidden',
      marginBottom: spacing('6'),
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
