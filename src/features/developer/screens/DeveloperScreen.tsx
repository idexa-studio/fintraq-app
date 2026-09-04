import { AlertButton, AlertDialog } from '@/src/components/ui/AlertDialog';
import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { ConfirmDialog } from '@/src/components/ui/ConfirmDialog';
import { Header } from '@/src/components/ui/Header';
import { IconAvatar } from '@/src/components/ui/IconAvatar';
import { Input } from '@/src/components/ui/Input';
import { PageBackground } from '@/src/components/ui/PageBackground';
import { usePremium } from '@/src/providers/PremiumProvider';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { NotificationService } from '@/src/services/notification.service';
import { toErrorMessage } from '@/src/utils/errors';
import { seedDummyData } from '@/src/utils/seed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleDriveService } from '@/src/services/backup/google-drive.service';
import {
  AndroidIcon,
  Apple01Icon,
  ArrowRight01Icon,
  BellIcon,
  BellOffIcon,
  BellRingIcon,
  CancelCircleIcon,
  CheckmarkBadge01Icon,
  CheckmarkCircle01Icon,
  Delete02Icon,
  FlaskConicalIcon,
  LockPasswordIcon,
  RefreshIcon,
  Settings01Icon,
} from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import * as Notifications from 'expo-notifications';
import React, { useCallback, useMemo } from 'react';
import {
  DevSettings,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Updates from 'expo-updates';

const DEV_PIN = '32159';

/* ── Row separator ──────────────────────────────────────────── */

const RowSeparator = React.memo(function RowSeparator({ theme }: { theme: ThemeContextType }) {
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

/* ── NavRow ─────────────────────────────────────────────────── */

type NavRowProps = {
  icon: IconSvgElement;
  label: string;
  subtitle?: string;
  value?: string;
  onPress: () => void;
  iconColor?: string;
  showArrow?: boolean;
  theme: ThemeContextType;
};

const NavRow = React.memo(function NavRow({
  icon, label, subtitle, value, onPress, iconColor, showArrow = true, theme,
}: NavRowProps) {
  const styles = useMemo(() => createRowStyles(theme), [theme]);
  const { colors } = theme;
  return (
    <BentoPressable onPress={onPress} style={styles.row}>
      <IconAvatar icon={icon} color={iconColor ?? colors.text} variant="subtle" size={36} />
      <View style={styles.rowInfo}>
        <Text style={styles.rowLabel}>{label}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {(value || showArrow) ? (
        <View style={styles.rowRight}>
          {value ? <Text style={styles.rowValue}>{value}</Text> : null}
          {showArrow ? (
            <HugeiconsIcon icon={ArrowRight01Icon} size={14} color={colors.textMuted} />
          ) : null}
        </View>
      ) : null}
    </BentoPressable>
  );
});

/* ── InfoRow (non-pressable) ────────────────────────────────── */

const InfoRow = React.memo(function InfoRow({
  icon, label, value, theme,
}: { icon: IconSvgElement; label: string; value: string; theme: ThemeContextType }) {
  const styles = useMemo(() => createRowStyles(theme), [theme]);
  return (
    <View style={styles.row}>
      <IconAvatar icon={icon} color={theme.colors.textMuted} variant="subtle" size={36} />
      <View style={styles.rowInfo}>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
});

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

/* ── DeveloperScreen ────────────────────────────────────────── */

export const DeveloperScreen = React.memo(function DeveloperScreen() {
  const theme = useTheme();
  const { colors, isDark } = theme;
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const { devOverride, setDevOverride } = usePremium();

  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [pin, setPin] = React.useState('');
  const [error, setError] = React.useState('');
  const [showSeedConfirm, setShowSeedConfirm] = React.useState(false);
  const [isSeeding, setIsSeeding] = React.useState(false);
  const [showDeleteBackupConfirm, setShowDeleteBackupConfirm] = React.useState(false);
  const [isDeletingBackup, setIsDeletingBackup] = React.useState(false);
  const [scheduledNotifs, setScheduledNotifs] = React.useState<Notifications.NotificationRequest[]>([]);

  const handleDeleteBackup = async () => {
    try {
      setIsDeletingBackup(true);
      const deleted = await GoogleDriveService.deleteBackup();
      await AsyncStorage.removeItem('@fintraq_last_backup_meta');
      setShowDeleteBackupConfirm(false);
      if (deleted) {
        showAlert({
          title: 'Success',
          message: 'Cloud backup file has been permanently deleted from Google Drive.',
          type: 'success',
        });
      } else {
        showAlert({
          title: 'No Backup Found',
          message: 'No backup file was found on Google Drive.',
          type: 'info',
        });
      }
    } catch (e) {
      setShowDeleteBackupConfirm(false);
      showAlert({
        title: 'Error',
        message: toErrorMessage(e, 'Failed to delete backup from Google Drive.'),
        type: 'error',
      });
    } finally {
      setIsDeletingBackup(false);
    }
  };

  const [alertConfig, setAlertConfig] = React.useState<{
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
        buttons: config.buttons || [{ text: 'OK' }],
      });
    },
    [],
  );

  const fetchScheduled = useCallback(async () => {
    const list = await Notifications.getAllScheduledNotificationsAsync();
    setScheduledNotifs(list);
  }, []);

  React.useEffect(() => {
    if (isAuthenticated) fetchScheduled();
  }, [isAuthenticated, fetchScheduled]);

  const handlePinChange = (val: string) => {
    setPin(val);
    setError('');
    if (val === DEV_PIN) {
      setIsAuthenticated(true);
    } else if (val.length >= DEV_PIN.length) {
      setError('Invalid access token');
      setTimeout(() => setPin(''), 800);
    }
  };

  const handleRunSeed = async () => {
    try {
      setIsSeeding(true);
      const count = await seedDummyData();
      showAlert({
        title: 'Success',
        message: `Generated ${count} transactions. The app will reload to sync.`,
        type: 'success',
        buttons: [
          {
            text: 'OK',
            onPress: async () => {
              try {
                await Updates.reloadAsync();
              } catch (reloadErr) {
                console.warn('[DeveloperScreen] Updates.reloadAsync warning (fallback to DevSettings):', reloadErr);
                if (DevSettings?.reload) {
                  DevSettings.reload();
                }
              }
            },
          },
        ],
      });
      setShowSeedConfirm(false);
    } catch (e) {
      showAlert({
        title: 'Error',
        message: toErrorMessage(e, 'Failed to generate seed data.'),
        type: 'error',
      });
    } finally {
      setIsSeeding(false);
    }
  };

  /* ── Lock screen ── */

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <PageBackground />
        <Header title="Developer" showBack />

        <KeyboardAvoidingView
          style={styles.lockShell}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
        >
          {/* Art section — stays in upper half */}
          <View style={styles.lockArt}>
            <View style={styles.lockIconRing}>
              <IconAvatar
                icon={LockPasswordIcon}
                color={colors.primary}
                variant="subtle"
                size={72}
                iconSize={28}
              />
            </View>
            <Text style={styles.lockBadge}>Secure gateway</Text>
            <Text style={styles.lockTitle}>Developer tools</Text>
            <Text style={styles.lockSub}>
              Internal utilities for testing and debugging.{'\n'}Enter access token to continue.
            </Text>
          </View>

          {/* Input section — keyboard pushes this up */}
          <View style={styles.lockInputSection}>
            <Input
              placeholder="Access token"
              value={pin}
              onChangeText={handlePinChange}
              keyboardType="numeric"
              maxLength={DEV_PIN.length}
              secureTextEntry
              textAlign="center"
              autoFocus
              error={error}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  /* ── Main screen ── */

  const overrideOptions: { mode: 'DEFAULT' | 'FORCED_ON' | 'FORCED_OFF'; label: string; subtitle: string; icon: IconSvgElement; color: string }[] = [
    { mode: 'DEFAULT', label: 'Default', subtitle: 'Sync with App Store / Play Store', icon: RefreshIcon as IconSvgElement, color: colors.textMuted },
    { mode: 'FORCED_ON', label: 'Force enabled', subtitle: 'Treat as active Pro subscription', icon: CheckmarkBadge01Icon as IconSvgElement, color: colors.success },
    { mode: 'FORCED_OFF', label: 'Force disabled', subtitle: 'Treat as free tier regardless', icon: CancelCircleIcon as IconSvgElement, color: colors.danger },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <PageBackground />
      <Header title="Developer" showBack />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Dev badge card ── */}
        <View style={styles.badgeCard}>
          <View style={styles.badgeDot} />
          <View style={styles.badgeInfo}>
            <Text style={styles.badgeTitle}>Dev tools active</Text>
            <Text style={styles.badgeSub}>Changes here affect app behaviour globally</Text>
          </View>
          <View style={styles.badgePill}>
            <Text style={styles.badgePillText}>{__DEV__ ? 'DEV' : 'PROD'}</Text>
          </View>
        </View>

        {/* ── Premium override ── */}
        <Text style={styles.sectionLabel}>Premium override</Text>
        <View style={styles.group}>
          {overrideOptions.map((item, idx) => {
            const isActive = devOverride === item.mode;
            const isLast = idx === overrideOptions.length - 1;
            return (
              <React.Fragment key={item.mode}>
                <BentoPressable
                  style={[styles.optionRow, isActive && { backgroundColor: item.color + '0C' }]}
                  onPress={() => setDevOverride(item.mode)}
                >
                  <IconAvatar
                    icon={item.icon}
                    color={isActive ? item.color : colors.textMuted}
                    variant="subtle"
                    size={36}
                  />
                  <View style={styles.optionInfo}>
                    <Text style={[styles.optionLabel, isActive && { color: item.color }]}>
                      {item.label}
                    </Text>
                    <Text style={styles.optionSub}>{item.subtitle}</Text>
                  </View>
                  {isActive && (
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} color={item.color} />
                  )}
                </BentoPressable>
                {!isLast && <RowSeparator theme={theme} />}
              </React.Fragment>
            );
          })}
        </View>

        {/* ── Data ── */}
        <Text style={styles.sectionLabel}>Data & Cloud</Text>
        <View style={styles.group}>
          <NavRow
            theme={theme}
            icon={FlaskConicalIcon as IconSvgElement}
            iconColor={colors.primary}
            label="Seed dummy data"
            subtitle="Generate 12 months of transactions, persons & loans"
            onPress={() => setShowSeedConfirm(true)}
          />
          <RowSeparator theme={theme} />
          <NavRow
            theme={theme}
            icon={Delete02Icon as IconSvgElement}
            iconColor={colors.danger}
            label="Delete Cloud Backup"
            subtitle="Permanently remove backup file from Google Drive"
            onPress={() => setShowDeleteBackupConfirm(true)}
          />
        </View>

        {/* ── Notifications ── */}
        <Text style={styles.sectionLabel}>Notifications</Text>
        <View style={styles.group}>
          {scheduledNotifs.length === 0 ? (
            <InfoRow
              theme={theme}
              icon={BellOffIcon as IconSvgElement}
              label="No active schedules"
              value="None"
            />
          ) : (
            scheduledNotifs.map((n, idx) => (
              <React.Fragment key={n.identifier}>
                {idx > 0 && <RowSeparator theme={theme} />}
                <View style={styles.notifRow}>
                  <IconAvatar icon={BellIcon as IconSvgElement} color={colors.primary} variant="subtle" size={36} />
                  <View style={styles.optionInfo}>
                    <Text style={styles.optionLabel} numberOfLines={1}>
                      {n.content.title || 'Scheduled reminder'}
                    </Text>
                    <Text style={styles.optionSub} numberOfLines={1}>
                      {n.content.body || 'Daily check-in alert'}
                    </Text>
                  </View>
                  <View style={[styles.activePill, { backgroundColor: colors.success + '18' }]}>
                    <Text style={[styles.activePillText, { color: colors.success }]}>Active</Text>
                  </View>
                </View>
              </React.Fragment>
            ))
          )}
          <RowSeparator theme={theme} />
          <NavRow
            theme={theme}
            icon={BellRingIcon as IconSvgElement}
            iconColor={colors.primary}
            label="Trigger sample notification"
            subtitle="Queue an instant check-in alert"
            onPress={() => {
              NotificationService.triggerInstantNotification();
              showAlert({
                title: 'Test Notification',
                message: 'Instant check-in alert queued.',
                type: 'info',
              });
            }}
          />
          <RowSeparator theme={theme} />
          <NavRow
            theme={theme}
            icon={RefreshIcon as IconSvgElement}
            iconColor={colors.textMuted}
            label="Refresh schedules"
            subtitle="Reload notification schedule list"
            onPress={fetchScheduled}
          />
        </View>

        {/* ── System ── */}
        <Text style={styles.sectionLabel}>System</Text>
        <View style={styles.group}>
          <InfoRow
            theme={theme}
            icon={Settings01Icon as IconSvgElement}
            label="Environment"
            value={__DEV__ ? 'Development' : 'Production'}
          />
          <RowSeparator theme={theme} />
          <InfoRow
            theme={theme}
            icon={(Platform.OS === 'ios' ? Apple01Icon : AndroidIcon) as IconSvgElement}
            label="Platform"
            value={Platform.OS === 'ios' ? 'iOS' : 'Android'}
          />
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <Text style={styles.footerBrand}>Fintraq / Dev tools</Text>
          <Text style={styles.footerCopy}>Internal debugging and testing utilities.</Text>
        </View>

      </ScrollView>

      <ConfirmDialog
        visible={showSeedConfirm}
        onClose={() => setShowSeedConfirm(false)}
        title="Seed test data"
        message="This will add 12 months of transactions to your default account. Proceed?"
        confirmLabel="Generate"
        isLoading={isSeeding}
        onConfirm={handleRunSeed}
      />

      <ConfirmDialog
        visible={showDeleteBackupConfirm}
        onClose={() => setShowDeleteBackupConfirm(false)}
        title="Delete Cloud Backup"
        message="This will permanently delete your database backup file from Google Drive. This action cannot be undone. Proceed?"
        confirmLabel="Delete"
        destructive
        isLoading={isDeletingBackup}
        onConfirm={handleDeleteBackup}
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

/* ── Styles ─────────────────────────────────────────────────── */

const createStyles = (
  { colors, spacing, radius, typography, layout }: ThemeContextType,
  isDark: boolean,
) => {
  const badgeBg = isDark ? '#1C1C1E' : '#111111';

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    /* Lock screen */
    lockShell: {
      flex: 1,
      justifyContent: 'space-between',
    },
    lockArt: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing('8'),
      gap: spacing('3'),
    },
    lockIconRing: {
      marginBottom: spacing('2'),
    },
    lockBadge: {
      fontFamily: typography.styles.sectionLabel.fontFamily,
      fontSize: 11,
      color: colors.primary,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    lockTitle: {
      fontFamily: typography.fonts.heading,
      fontSize: 26,
      color: colors.text,
      textAlign: 'center',
    },
    lockSub: {
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.sm,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 20,
      opacity: 0.7,
      maxWidth: 260,
    },
    lockInputSection: {
      paddingHorizontal: layout.screenPadding,
      paddingBottom: spacing('8'),
    },

    /* Main screen */
    scroll: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('2'),
      paddingBottom: spacing('12'),
    },

    /* Badge card */
    badgeCard: {
      backgroundColor: badgeBg,
      borderRadius: radius('2xl'),
      paddingHorizontal: spacing('5'),
      paddingVertical: spacing('4'),
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3'),
      marginBottom: spacing('5'),
    },
    badgeDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.success,
    },
    badgeInfo: { flex: 1, gap: 2 },
    badgeTitle: {
      fontFamily: typography.styles.rowLabel.fontFamily,
      fontSize: typography.sizes.md,
      color: '#FFFFFF',
    },
    badgeSub: {
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.xs,
      color: 'rgba(255,255,255,0.45)',
    },
    badgePill: {
      backgroundColor: colors.primary + '28',
      paddingHorizontal: spacing('2.5'),
      paddingVertical: spacing('1'),
      borderRadius: radius('full'),
    },
    badgePillText: {
      fontFamily: typography.styles.buttonLabel.fontFamily,
      fontSize: 10,
      color: colors.primary,
      letterSpacing: 0.8,
    },

    /* Group */
    group: {
      borderRadius: radius('xl'),
      overflow: 'hidden',
      marginBottom: spacing('4'),
    },

    /* Section label */
    sectionLabel: {
      fontFamily: typography.styles.sectionLabel.fontFamily,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
      marginBottom: spacing('2'),
      marginLeft: spacing('1'),
    },

    /* Option rows (premium toggle) */
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3.5'),
      paddingHorizontal: spacing('4'),
      paddingVertical: spacing('3.5'),
      backgroundColor: colors.surface,
    },
    optionInfo: { flex: 1, gap: 2 },
    optionLabel: {
      fontFamily: typography.styles.rowLabel.fontFamily,
      fontSize: typography.sizes.md,
      color: colors.text,
    },
    optionSub: {
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
      marginTop: 1,
    },

    /* Notification rows */
    notifRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3.5'),
      paddingHorizontal: spacing('4'),
      paddingVertical: spacing('3.5'),
      backgroundColor: colors.surface,
    },
    activePill: {
      paddingHorizontal: spacing('2.5'),
      paddingVertical: spacing('1'),
      borderRadius: radius('full'),
    },
    activePillText: {
      fontFamily: typography.styles.badge.fontFamily,
      fontSize: 10,
    },

    /* Footer */
    footer: {
      alignItems: 'center',
      gap: spacing('1.5'),
      marginTop: spacing('2'),
      paddingVertical: spacing('4'),
    },
    footerBrand: {
      fontFamily: typography.styles.sectionLabel.fontFamily,
      fontSize: 10,
      color: colors.text,
      opacity: 0.25,
    },
    footerCopy: {
      fontFamily: typography.fonts.regular,
      fontSize: 10,
      color: colors.textMuted,
      opacity: 0.35,
    },
  });
};
