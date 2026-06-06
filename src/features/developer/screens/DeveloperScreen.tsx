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
import { IconAvatar } from '@/src/components/ui/IconAvatar';
import { Input } from '@/src/components/ui/Input';
import { usePremium } from '@/src/providers/PremiumProvider';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { NotificationService } from '@/src/services/notification.service';
import { toErrorMessage } from '@/src/utils/errors';
import { seedDummyData } from '@/src/utils/seed';

const DEV_PIN = '32159';

const Divider = React.memo(function Divider({ theme }: { theme: ThemeContextType }) {
  const { colors } = theme;
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.text + '0C', marginHorizontal: 16 }} />;
});

export const DeveloperScreen = React.memo(function DeveloperScreen() {
  const theme = useTheme();
  const { colors, typography } = theme;
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

            <Text style={[styles.lockBadge, { color: colors.primary }]}>SECURE GATEWAY</Text>

            <Text style={[styles.lockTitle, { fontFamily: typography.fonts.heading, color: colors.text }]}>
              Developer tools
            </Text>
            <Text style={[styles.lockSub, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
              Enter the access token to continue
            </Text>

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
        <Text style={styles.sectionLabel}>
          Premium override
        </Text>
        <View style={styles.card}>
          {([
            { mode: 'DEFAULT', title: 'Default (Sync with Store)', desc: 'Use standard Play Store / App Store purchase status', icon: 'sync' },
            { mode: 'FORCED_ON', title: 'Force Enabled', desc: 'Force entitlement state as active for testing', icon: 'check-decagram-outline' },
            { mode: 'FORCED_OFF', title: 'Force Disabled', desc: 'Force entitlement state as inactive for testing', icon: 'close-circle-outline' },
          ] as const).map((item, index) => {
            const active = devOverride === item.mode;
            return (
              <React.Fragment key={item.mode}>
                <TouchableOpacity
                  style={styles.optionRow}
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
                    <Text style={[styles.rowTitle, { fontFamily: typography.fonts.semibold, color: colors.text }]}>
                      {item.title}
                    </Text>
                    <Text style={[styles.rowSub, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
                      {item.desc}
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name={active ? "radiobox-marked" : "radiobox-blank"}
                    size={22}
                    color={active ? colors.primary : colors.textMuted}
                  />
                </TouchableOpacity>
                {index < 2 && <Divider theme={theme} />}
              </React.Fragment>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>
          Data
        </Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => setShowSeedConfirm(true)}
            activeOpacity={0.65}
          >
            <IconAvatar icon="flask-outline" color={colors.primary} variant="subtle" size={36} iconSize={16} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.rowTitle, { fontFamily: typography.fonts.semibold, color: colors.text }]}>
                Seed dummy data
              </Text>
              <Text style={[styles.rowSub, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
                Generate 12 months of test transactions
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={14} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>
          Notifications
        </Text>
        <View style={styles.card}>
          {scheduledNotifs.length === 0 ? (
            <View style={styles.optionRow}>
              <IconAvatar icon="bell-off-outline" color={colors.textMuted} variant="subtle" size={36} iconSize={16} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.rowTitle, { fontFamily: typography.fonts.semibold, color: colors.text }]}>
                  No active schedules
                </Text>
                <Text style={[styles.rowSub, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
                  All reminder notifications are currently disabled
                </Text>
              </View>
            </View>
          ) : (
            scheduledNotifs.map((n, i) => (
              <React.Fragment key={n.identifier}>
                <View style={styles.optionRow}>
                  <IconAvatar icon="bell-outline" color={colors.primary} variant="subtle" size={36} iconSize={16} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[styles.rowTitle, { fontFamily: typography.fonts.semibold, color: colors.text }]}>
                      {n.content.title || 'Scheduled Reminder'}
                    </Text>
                    <Text style={[styles.rowSub, { fontFamily: typography.fonts.regular, color: colors.textMuted }]} numberOfLines={1}>
                      {n.content.body || 'Daily check-in alert'}
                    </Text>
                  </View>
                  <View style={styles.badge}>
                    <Text style={[styles.badgeText, { color: colors.primary }]}>Active</Text>
                  </View>
                </View>
                {i < scheduledNotifs.length - 1 ? <Divider theme={theme} /> : null}
              </React.Fragment>
            ))
          )}
          <Divider theme={theme} />
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
              <Text style={[styles.rowTitle, { fontFamily: typography.fonts.semibold, color: colors.primary }]}>
                Trigger sample notification
              </Text>
              <Text style={[styles.rowSub, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
                Queue an instant check-in alert for debugging
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={14} color={colors.textMuted} />
          </TouchableOpacity>
          <Divider theme={theme} />
          <TouchableOpacity
            style={styles.optionRow}
            onPress={fetchScheduled}
            activeOpacity={0.65}
          >
            <IconAvatar icon="refresh" color={colors.primary} variant="subtle" size={36} iconSize={16} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.rowTitle, { fontFamily: typography.fonts.semibold, color: colors.primary }]}>
                Refresh schedules
              </Text>
              <Text style={[styles.rowSub, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
                Force reload notification schedules list
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={14} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>
          System
        </Text>
        <View style={styles.card}>
          <View style={styles.optionRow}>
            <IconAvatar icon="cog-outline" color={colors.textMuted} variant="subtle" size={36} iconSize={16} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.rowTitle, { fontFamily: typography.fonts.semibold, color: colors.text }]}>
                Environment
              </Text>
              <Text style={[styles.rowSub, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
                App runtime build environment
              </Text>
            </View>
            <Text style={[styles.infoValue, { fontFamily: typography.fonts.semibold, color: colors.text }]}>
              {__DEV__ ? 'Development' : 'Production'}
            </Text>
          </View>
          <Divider theme={theme} />
          <View style={styles.optionRow}>
            <IconAvatar icon={Platform.OS === 'ios' ? 'apple' : 'android'} color={colors.textMuted} variant="subtle" size={36} iconSize={16} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.rowTitle, { fontFamily: typography.fonts.semibold, color: colors.text }]}>
                Platform
              </Text>
              <Text style={[styles.rowSub, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
                OS runtime target
              </Text>
            </View>
            <Text style={[styles.infoValue, { fontFamily: typography.fonts.semibold, color: colors.text }]}>
              {Platform.OS === 'ios' ? 'iOS' : 'Android'}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerBrand, { fontFamily: typography.fonts.semibold, color: colors.text }]}>
            Keeep / Dev tools
          </Text>
          <Text style={[styles.footerCopy, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
            Internal debugging and testing utilities.
          </Text>
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
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    decoCircle2: {
      position: 'absolute',
      bottom: 60,
      left: 10,
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
    },
    lockIcon: {
      marginBottom: spacing('2'),
      zIndex: 2,
    },
    lockBadge: {
      fontFamily: typography.fonts.semibold,
      fontSize: 10,
      letterSpacing: 1.5,
      zIndex: 2,
      marginBottom: spacing('1'),
    },
    lockTitle: {
      fontSize: 24,
      zIndex: 2,
    },
    lockSub: {
      fontSize: typography.sizes.sm,
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

    sectionLabel: {
      fontFamily: typography.fonts.semibold,
      fontSize: 10,
      color: colors.textMuted,
      letterSpacing: 1.5,
      marginBottom: spacing('2.5'),
      paddingLeft: spacing('1'),
      textTransform: 'uppercase',
    },

    card: {
      backgroundColor: colors.surface,
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
    },
    rowTitle: {
      fontSize: typography.sizes.md,
    },
    rowSub: {
      fontSize: typography.sizes.xs,
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
    },

    infoValue: {
      fontSize: typography.sizes.sm,
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
