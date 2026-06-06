import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import React from 'react';
import {
  Alert,
  DevSettings,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PageBackground } from '@/src/components/ui/PageBackground';
import { ConfirmDialog } from '@/src/components/ui/ConfirmDialog';
import { Header } from '@/src/components/ui/Header';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { IconAvatar } from '@/src/components/ui/IconAvatar';
import { Input } from '@/src/components/ui/Input';
import { usePremium } from '@/src/providers/PremiumProvider';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { NotificationService } from '@/src/services/notification.service';
import { toErrorMessage } from '@/src/utils/errors';
import { seedDummyData } from '@/src/utils/seed';

const DEV_PIN = '32159';

export const DeveloperScreen = React.memo(function DeveloperScreen() {
  const theme = useTheme();
  const { colors } = theme;
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const { devOverride, setDevOverride } = usePremium();

  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [pin, setPin] = React.useState('');
  const [error, setError] = React.useState('');
  const [showSeedConfirm, setShowSeedConfirm] = React.useState(false);
  const [isSeeding, setIsSeeding] = React.useState(false);
  const [scheduledNotifs, setScheduledNotifs] = React.useState<Notifications.NotificationRequest[]>([]);

  const fetchScheduled = React.useCallback(async () => {
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
      Alert.alert(
        'Success',
        `Generated ${count} transactions. The app will reload to sync.`,
        [{ text: 'Ok', onPress: () => DevSettings.reload() }],
      );
      setShowSeedConfirm(false);
    } catch (e) {
      Alert.alert('Error', toErrorMessage(e, 'Failed to generate seed data.'));
    } finally {
      setIsSeeding(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <PageBackground />

        <Header title="Developer" showBack />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.lockWrap}>
            <View style={styles.decoCircle1} />
            <View style={styles.decoCircle2} />

            <View style={styles.lockIcon}>
              <IconAvatar icon="lock" color={colors.primary} variant="subtle" size={64} iconSize={26} />
            </View>

            <Text style={styles.lockBadge}>Secure gateway</Text>
            <Text style={styles.lockTitle}>Developer tools</Text>
            <Text style={styles.lockSub}>Enter the access token to continue</Text>

            <View style={styles.lockInputWrap}>
              <Input
                placeholder="00000"
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
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <PageBackground />

      <Header title="Developer" showBack />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <SectionHeader title="Premium override" noPadding />
        <View style={styles.card}>
          {([
            { mode: 'DEFAULT', title: 'Default (Sync with Store)', desc: 'Use standard Play Store / App Store purchase status', icon: 'sync' },
            { mode: 'FORCED_ON', title: 'Force Enabled', desc: 'Force entitlement state as active for testing', icon: 'check-decagram-outline' },
            { mode: 'FORCED_OFF', title: 'Force Disabled', desc: 'Force entitlement state as inactive for testing', icon: 'close-circle-outline' },
          ] as const).map((item, index) => {
            const active = devOverride === item.mode;
            const isLast = index === 2;
            return (
              <TouchableOpacity
                key={item.mode}
                style={[styles.optionRow, isLast && styles.noMargin]}
                onPress={() => setDevOverride(item.mode)}
                activeOpacity={0.7}
              >
                <IconAvatar
                  icon={item.icon}
                  color={active ? colors.primary : colors.textMuted}
                  variant="subtle"
                  size={36}
                  iconSize={16}
                />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.rowTitle}>{item.title}</Text>
                  <Text style={styles.rowSub}>{item.desc}</Text>
                </View>
                <MaterialCommunityIcons
                  name={active ? "radiobox-marked" : "radiobox-blank"}
                  size={22}
                  color={active ? colors.primary : colors.textMuted}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        <SectionHeader title="Data" noPadding />
        <View style={styles.card}>
          <TouchableOpacity
            style={[styles.optionRow, styles.noMargin]}
            onPress={() => setShowSeedConfirm(true)}
            activeOpacity={0.65}
          >
            <IconAvatar icon="flask-outline" color={colors.primary} variant="subtle" size={36} iconSize={16} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.rowTitle}>Seed dummy data</Text>
              <Text style={styles.rowSub}>Generate 12 months of test transactions</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={14} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <SectionHeader title="Notifications" noPadding />
        <View style={styles.card}>
          {scheduledNotifs.length === 0 ? (
            <View style={[styles.optionRow, styles.noMargin]}>
              <IconAvatar icon="bell-off-outline" color={colors.textMuted} variant="subtle" size={36} iconSize={16} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.rowTitle}>No active schedules</Text>
                <Text style={styles.rowSub}>All reminder notifications are currently disabled</Text>
              </View>
            </View>
          ) : (
            scheduledNotifs.map((n) => (
              <View key={n.identifier} style={styles.optionRow}>
                <IconAvatar icon="bell-outline" color={colors.primary} variant="subtle" size={36} iconSize={16} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.rowTitle}>
                    {n.content.title || 'Scheduled Reminder'}
                  </Text>
                  <Text style={styles.rowSub} numberOfLines={1}>
                    {n.content.body || 'Daily check-in alert'}
                  </Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Active</Text>
                </View>
              </View>
            ))
          )}
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => {
              NotificationService.triggerInstantNotification();
              Alert.alert('Test notification', 'An instant notification has been queued.');
            }}
            activeOpacity={0.65}
          >
            <IconAvatar icon="bell-ring-outline" color={colors.primary} variant="subtle" size={36} iconSize={16} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.rowTitleAction}>Trigger sample notification</Text>
              <Text style={styles.rowSub}>Queue an instant check-in alert for debugging</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={14} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionRow, styles.noMargin]}
            onPress={fetchScheduled}
            activeOpacity={0.65}
          >
            <IconAvatar icon="refresh" color={colors.primary} variant="subtle" size={36} iconSize={16} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.rowTitleAction}>Refresh schedules</Text>
              <Text style={styles.rowSub}>Force reload notification schedules list</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={14} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <SectionHeader title="System" noPadding />
        <View style={styles.card}>
          <View style={styles.optionRow}>
            <IconAvatar icon="cog-outline" color={colors.textMuted} variant="subtle" size={36} iconSize={16} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.rowTitle}>Environment</Text>
              <Text style={styles.rowSub}>App runtime build environment</Text>
            </View>
            <Text style={styles.infoValue}>
              {__DEV__ ? 'Development' : 'Production'}
            </Text>
          </View>
          <View style={[styles.optionRow, styles.noMargin]}>
            <IconAvatar icon={Platform.OS === 'ios' ? 'apple' : 'android'} color={colors.textMuted} variant="subtle" size={36} iconSize={16} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.rowTitle}>Platform</Text>
              <Text style={styles.rowSub}>OS runtime target</Text>
            </View>
            <Text style={styles.infoValue}>
              {Platform.OS === 'ios' ? 'iOS' : 'Android'}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerBrand}>Keeep / Dev tools</Text>
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
    </SafeAreaView>
  );
});

const createStyles = ({ colors, typography, spacing, radius, layout }: ThemeContextType) =>
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

    lockWrap: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing('8'),
      gap: spacing('4'),
      overflow: 'hidden',
    },
    decoCircle1: {
      position: 'absolute',
      top: 40,
      right: 20,
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: colors.text + '14',
    },
    decoCircle2: {
      position: 'absolute',
      bottom: 60,
      left: 10,
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.text + '08',
    },
    lockIcon: {
      marginBottom: spacing('2'),
      zIndex: 2,
    },
    lockBadge: {
      fontFamily: typography.fonts.semibold,
      fontSize: 11,
      color: colors.primary,
      zIndex: 2,
      marginBottom: spacing('1'),
    },
    lockTitle: {
      fontFamily: typography.fonts.heading,
      fontSize: 24,
      color: colors.text,
      zIndex: 2,
    },
    lockSub: {
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.sm,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 20,
      opacity: 0.7,
      zIndex: 2,
    },
    lockInputWrap: {
      width: '100%',
      maxWidth: 240,
      marginTop: spacing('2'),
      zIndex: 2,
    },

    card: {
      borderRadius: 24,
      overflow: 'hidden',
      marginBottom: spacing('3'),
    },

    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing('4'),
      paddingVertical: spacing('3.5'),
      gap: spacing('3.5'),
      backgroundColor: colors.surface,
      marginBottom: spacing('0.5'),
    },
    noMargin: {
      marginBottom: 0,
    },
    rowTitle: {
      fontFamily: typography.fonts.semibold,
      fontSize: typography.sizes.md,
      color: colors.text,
    },
    rowTitleAction: {
      fontFamily: typography.fonts.semibold,
      fontSize: typography.sizes.md,
      color: colors.primary,
    },
    rowSub: {
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
      opacity: 0.65,
    },
    badge: {
      paddingHorizontal: spacing('2'),
      paddingVertical: spacing('0.5'),
      borderRadius: radius('full'),
      backgroundColor: colors.success + '15',
    },
    badgeText: {
      fontSize: 10,
      fontFamily: typography.fonts.semibold,
      color: colors.primary,
    },

    infoValue: {
      fontFamily: typography.fonts.semibold,
      fontSize: typography.sizes.sm,
      color: colors.text,
    },

    footer: {
      alignItems: 'center',
      gap: spacing('1.5'),
      marginTop: spacing('3'),
      paddingVertical: spacing('4'),
    },
    footerBrand: {
      fontFamily: typography.fonts.semibold,
      fontSize: 10,
      color: colors.text,
      opacity: 0.3,
    },
    footerCopy: {
      fontFamily: typography.fonts.regular,
      fontSize: 10,
      color: colors.textMuted,
      opacity: 0.4,
    },
  });
