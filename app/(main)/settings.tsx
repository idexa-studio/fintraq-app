import { usePremium } from '@/src/providers/PremiumProvider';
import { IoniconName } from '@/src/utils/icons';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurBackground } from '../../src/components/ui/BlurBackground';
import { ConfirmDialog } from '../../src/components/ui/ConfirmDialog';
import { Header } from '../../src/components/ui/Header';
import { OptionsDialog } from '../../src/components/ui/OptionsDialog';
import { db } from '../../src/db/client';
import { accounts, categories, payments } from '../../src/db/schema';
import { useSettings } from '../../src/providers/SettingsProvider';
import { ThemeContextType, useTheme } from '../../src/providers/ThemeProvider';
import { NotificationService } from '../../src/services/notification.service';

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

type RowProps = {
  icon: IoniconName;
  label: string;
  subtitle?: string;
  value?: string;
  onPress: () => void;
  destructive?: boolean;
  accentColor?: string;
  isLast?: boolean;
  theme: ThemeContextType;
};

const PreferenceRow = React.memo(function PreferenceRow({
  icon,
  label,
  subtitle,
  value,
  onPress,
  destructive,
  accentColor,
  isLast,
  theme,
}: RowProps) {
  const { colors, spacing, radius, typography } = theme;
  const iconColor = accentColor ?? (destructive ? colors.danger : colors.text);
  const labelColor = destructive ? colors.danger : colors.text;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        rowStyles.row,
        { paddingHorizontal: spacing('4'), paddingVertical: spacing('3.5') },
        !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
      ]}
    >
      <View
        style={[
          rowStyles.iconBox,
          {
            width: 36,
            height: 36,
            borderRadius: radius('sm'),
            backgroundColor: colors.background,
            marginRight: spacing('3'),
          },
        ]}
      >
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>

      <View style={rowStyles.textBlock}>
        <Text style={[rowStyles.label, { fontFamily: typography.fonts.semibold, color: labelColor }]}>
          {label}
        </Text>
        {subtitle ? (
          <Text style={[rowStyles.subtitle, { fontFamily: typography.fonts.regular, color: colors.textMuted }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={rowStyles.right}>
        {value ? (
          <Text style={[rowStyles.value, { fontFamily: typography.fonts.semibold, color: colors.primary }]}>
            {value}
          </Text>
        ) : null}
        <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
});

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { justifyContent: 'center', alignItems: 'center' },
  textBlock: { flex: 1 },
  label: { fontSize: 15 },
  subtitle: { fontSize: 12, marginTop: 2 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  value: { fontSize: 11, letterSpacing: 0.8 },
});

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────

const THEME_OPTIONS: { label: string; value: 'light' | 'dark' | 'system'; icon: IoniconName }[] = [
  { label: 'Light', value: 'light', icon: 'sunny-outline' },
  { label: 'Dark', value: 'dark', icon: 'moon-outline' },
  { label: 'Follow system', value: 'system', icon: 'phone-portrait-outline' },
];

export default function SettingsScreen() {
  const theme = useTheme();
  const { colors, radius, overlay } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { isPremium, resetPremium } = usePremium();
  const { profile, updateProfile } = useSettings();
  const router = useRouter();

  const [showThemeDialog, setShowThemeDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [devTaps, setDevTaps] = useState(0);

  const openNameModal = useCallback(() => {
    setNameInput(profile.name || '');
    setShowNameModal(true);
  }, [profile.name]);

  const closeNameModal = useCallback(() => setShowNameModal(false), []);

  const saveName = useCallback(async () => {
    await updateProfile({ name: nameInput.trim() });
    setShowNameModal(false);
  }, [nameInput, updateProfile]);

  const handleToggleReminders = useCallback(async () => {
    const next = !profile.reminderEnabled;
    if (next) {
      const granted = await NotificationService.requestPermissions();
      if (!granted) {
        Alert.alert('Permission required', 'Enable notifications in device settings to use reminders.');
        return;
      }
    }
    await updateProfile({ reminderEnabled: next });
  }, [profile.reminderEnabled, updateProfile]);

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
      await db.delete(categories);
      await db.delete(accounts);
      await AsyncStorage.clear();
      Alert.alert('Wipe complete', 'All data erased. Restart the app.');
      router.replace('/(onboarding)');
    } catch {
      Alert.alert('Error', 'Failed to erase data.');
    }
  }, [router]);

  const handleFooterTap = useCallback(() => {
    const next = devTaps + 1;
    if (next >= 7) {
      router.push('/developer');
      setDevTaps(0);
    } else {
      setDevTaps(next);
    }
  }, [devTaps, router]);

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
      <BlurBackground />

      <Header title="Settings" subtitle="Preferences & data" showBack />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Profile panel ── */}
        <View style={styles.profilePanel}>
          <View style={styles.profileLeft}>
            <View style={[styles.avatar, { backgroundColor: colors.primary + '18', borderRadius: radius('md') }]}>
              <Ionicons name="person" size={22} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.profileName} numberOfLines={1}>
                {profile.name || 'No name set'}
              </Text>
              <Text style={styles.profileSub}>
                v{version} · {isPremium ? 'Pro' : 'Free'}
              </Text>
            </View>
          </View>
          {isPremium && (
            <View style={[styles.proBadge, { backgroundColor: colors.primary + '18' }]}>
              <Ionicons name="sparkles" size={12} color={colors.primary} />
              <Text style={[styles.proBadgeText, { color: colors.primary }]}>PRO</Text>
            </View>
          )}
        </View>

        {/* ── Subscription ── */}
        <Text style={styles.sectionLabel}>Subscription</Text>
        <View style={[styles.card, isPremium && { borderWidth: 1.5, borderColor: colors.primary }]}>
          <PreferenceRow
            theme={theme}
            icon="sparkles"
            label={isPremium ? 'Luno Pro — Lifetime' : 'Upgrade to Pro'}
            subtitle={isPremium ? 'Full access to all features' : 'Unlock analytics, insights & more'}
            value={isPremium ? 'ACTIVE' : undefined}
            accentColor={isPremium ? colors.primary : undefined}
            onPress={() => router.push('/premium')}
            isLast
          />
        </View>

        {/* ── Account ── */}
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.card}>
          <PreferenceRow
            theme={theme}
            icon="person-outline"
            label="Display name"
            subtitle={profile.name || 'Tap to set your name'}
            onPress={openNameModal}
            isLast
          />
        </View>

        {/* ── Notifications ── */}
        <Text style={styles.sectionLabel}>Notifications</Text>
        <View style={styles.card}>
          <PreferenceRow
            theme={theme}
            icon="notifications-outline"
            label="Daily reminder"
            subtitle="Get prompted to log your spending"
            value={profile.reminderEnabled ? 'ON' : 'OFF'}
            onPress={handleToggleReminders}
          />
          <PreferenceRow
            theme={theme}
            icon="time-outline"
            label="Reminder time"
            subtitle="When to send the daily nudge"
            value={profile.reminderTime}
            onPress={() => setShowTimePicker(true)}
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

        {/* ── Appearance ── */}
        <Text style={styles.sectionLabel}>Appearance</Text>
        <View style={styles.card}>
          <PreferenceRow
            theme={theme}
            icon="contrast-outline"
            label="Theme"
            subtitle="Light, dark, or follow system"
            value={themeLabel.toUpperCase()}
            onPress={() => setShowThemeDialog(true)}
            isLast
          />
        </View>

        {/* ── Manage ── */}
        <Text style={styles.sectionLabel}>Manage</Text>
        <View style={styles.card}>
          <PreferenceRow
            theme={theme}
            icon="grid-outline"
            label="Categories"
            subtitle="Customise income and expense tags"
            onPress={() => router.push('/categories')}
          />
          <PreferenceRow
            theme={theme}
            icon="download-outline"
            label="Export CSV"
            subtitle="Download transactions as spreadsheet"
            onPress={() => router.push('/export')}
            isLast
          />
        </View>

        {/* ── Danger ── */}
        <Text style={styles.sectionLabel}>Danger zone</Text>
        <View style={styles.card}>
          <PreferenceRow
            theme={theme}
            icon="trash-bin-outline"
            label="Factory reset"
            subtitle="Permanently erase all local data"
            onPress={() => setShowResetDialog(true)}
            destructive
            isLast
          />
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleFooterTap} activeOpacity={1} hitSlop={{ top: 12, bottom: 12, left: 24, right: 24 }}>
            <Text style={styles.footerBrand}>LUNO / CORE</Text>
          </TouchableOpacity>
          <Text style={styles.footerCopy}>All data is encrypted and stored locally.</Text>

          {devTaps > 0 && (
            <TouchableOpacity
              style={[styles.devResetBtn, { borderColor: colors.danger + '44' }]}
              onPress={async () => {
                await resetPremium();
                Alert.alert('Dev', 'Premium reset to Free.');
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.devResetText, { color: colors.danger }]}>
                Reset subscription ({7 - devTaps} taps left)
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* ── Dialogs ── */}
      <OptionsDialog
        visible={showThemeDialog}
        onClose={() => setShowThemeDialog(false)}
        title="Theme"
        subtitle="Choose your preferred appearance"
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

      {/* ── Edit name modal ── */}
      <Modal
        visible={showNameModal}
        transparent
        animationType="fade"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        onRequestClose={closeNameModal}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.modalOverlay, { backgroundColor: overlay.dark }]}>
            <TouchableOpacity
              style={StyleSheet.absoluteFillObject}
              activeOpacity={1}
              onPress={closeNameModal}
            />
            <View style={[styles.modalCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={styles.modalTitle}>Display name</Text>
              <Text style={styles.modalSub}>How you{"'"}re greeted on the dashboard</Text>

              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                value={nameInput}
                onChangeText={setNameInput}
                placeholder="Your name"
                placeholderTextColor={colors.textMuted}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={saveName}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={closeNameModal}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.modalBtnText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: colors.text }]}
                  onPress={saveName}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.modalBtnText, { color: colors.background }]}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = ({ colors, spacing, radius, typography, shadow }: ThemeContextType) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      paddingHorizontal: spacing('6'),
      paddingTop: spacing('2'),
      paddingBottom: spacing('9'),
    },

    // Profile panel
    profilePanel: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      padding: spacing('4'),
      marginBottom: spacing('7'),
    },
    profileLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3'),
      flex: 1,
    },
    avatar: {
      width: 48,
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
    },
    profileName: {
      fontFamily: typography.fonts.semibold,
      fontSize: 16,
      color: colors.text,
      letterSpacing: -0.2,
    },
    profileSub: {
      fontFamily: typography.fonts.regular,
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    proBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('1'),
      paddingHorizontal: spacing('2'),
      paddingVertical: spacing('1'),
      borderRadius: radius('sm'),
    },
    proBadgeText: {
      fontFamily: typography.fonts.bold,
      fontSize: 9,
      letterSpacing: 1.5,
    },

    // Sections
    sectionLabel: {
      fontFamily: typography.fonts.semibold,
      fontSize: 10,
      color: colors.textMuted,
      letterSpacing: 1.5,
      marginBottom: spacing('2.5'),
      paddingLeft: spacing('1'),
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      overflow: 'hidden',
      marginBottom: spacing('6'),
    },

    // Footer
    footer: {
      alignItems: 'center',
      gap: spacing('1.5'),
      marginTop: spacing('3'),
    },
    footerBrand: {
      fontFamily: typography.fonts.bold,
      fontSize: 10,
      color: colors.text,
      letterSpacing: 3,
      opacity: 0.4,
    },
    footerCopy: {
      fontFamily: typography.fonts.regular,
      fontSize: 10,
      color: colors.textMuted,
      letterSpacing: 0.3,
      opacity: 0.7,
    },
    devResetBtn: {
      marginTop: spacing('3'),
      paddingHorizontal: spacing('3'),
      paddingVertical: spacing('1.5'),
      borderRadius: radius('sm'),
      borderWidth: 1,
    },
    devResetText: {
      fontFamily: typography.fonts.semibold,
      fontSize: 10,
      letterSpacing: 0.5,
    },

    // Name modal
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: spacing('6'),
    },
    modalCard: {
      borderRadius: radius('2xl'),
      borderWidth: 1,
      padding: spacing('6'),
      ...shadow('md'),
    },
    modalTitle: {
      fontFamily: typography.fonts.heading,
      fontSize: 26,
      color: colors.text,
      letterSpacing: -0.8,
      marginBottom: spacing('1'),
    },
    modalSub: {
      fontFamily: typography.fonts.regular,
      fontSize: 13,
      color: colors.textMuted,
      marginBottom: spacing('5'),
    },
    modalInput: {
      height: 52,
      borderRadius: radius('md'),
      borderWidth: 1,
      paddingHorizontal: spacing('4'),
      fontSize: 16,
      fontFamily: typography.fonts.regular,
      marginBottom: spacing('5'),
    },
    modalActions: {
      flexDirection: 'row',
      gap: spacing('3'),
    },
    modalBtn: {
      flex: 1,
      height: 48,
      borderRadius: radius('md'),
      borderWidth: 1,
      borderColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalBtnText: {
      fontFamily: typography.fonts.semibold,
      fontSize: 14,
    },
  });
