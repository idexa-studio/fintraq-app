import { Ionicons } from '@expo/vector-icons';
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
  return <View style={{ height: 1, backgroundColor: colors.text + '0C', marginHorizontal: 16 }} />;
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
            <View style={styles.lockIcon}>
              <IconAvatar icon="lock-closed" color={colors.surface} variant="solid" size={64} iconSize={26} />
            </View>

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
        <Text style={[styles.sectionLabel, { fontFamily: typography.fonts.semibold, color: colors.textMuted }]}>
          Premium override
        </Text>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <IconAvatar icon="sparkles" color={colors.primary} variant="subtle" size={32} iconSize={14} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { fontFamily: typography.fonts.semibold, color: colors.text }]}>
                Premium bypass
              </Text>
              <Text style={[styles.cardSub, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
                Force entitlement state for testing
              </Text>
            </View>
          </View>

          <View style={styles.pillRow}>
            {(['FORCED_ON', 'FORCED_OFF', 'DEFAULT'] as const).map((mode) => {
              const active = devOverride === mode;
              const label = mode === 'FORCED_ON' ? 'On' : mode === 'FORCED_OFF' ? 'Off' : 'Default';
              return (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.pill,
                    active && styles.pillActive,
                  ]}
                  onPress={() => setDevOverride(mode)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.pillText,
                    { fontFamily: typography.fonts.semibold },
                    active && styles.pillTextActive,
                  ]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Text style={[styles.sectionLabel, { fontFamily: typography.fonts.semibold, color: colors.textMuted }]}>
          Data
        </Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => setShowSeedConfirm(true)}
            activeOpacity={0.65}
          >
            <IconAvatar icon="flask-outline" color={colors.primary} variant="subtle" size={32} iconSize={14} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { fontFamily: typography.fonts.semibold, color: colors.text }]}>
                Seed dummy data
              </Text>
              <Text style={[styles.rowSub, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
                Generate 12 months of test transactions
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionLabel, { fontFamily: typography.fonts.semibold, color: colors.textMuted }]}>
          Notifications
        </Text>
        <View style={styles.card}>
          {scheduledNotifs.length === 0 ? (
            <View style={styles.row}>
              <Text style={[styles.rowSub, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
                No active schedules found
              </Text>
            </View>
          ) : (
            scheduledNotifs.map((n, i) => (
              <React.Fragment key={n.identifier}>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowTitle, { fontFamily: typography.fonts.semibold, color: colors.text, fontSize: 13 }]}>
                      {n.content.title}
                    </Text>
                    <Text style={[styles.rowSub, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
                      {JSON.stringify(n.trigger)}
                    </Text>
                  </View>
                </View>
                {i < scheduledNotifs.length - 1 ? <Divider theme={theme} /> : null}
              </React.Fragment>
            ))
          )}
          <Divider theme={theme} />
          <TouchableOpacity
            style={styles.row}
            onPress={() => {
              NotificationService.triggerInstantNotification();
              Alert.alert('Test notification', 'An instant notification has been queued.');
            }}
            activeOpacity={0.65}
          >
            <Text style={[styles.actionText, { fontFamily: typography.fonts.semibold, color: colors.primary }]}>
              Trigger sample notification
            </Text>
          </TouchableOpacity>
          <Divider theme={theme} />
          <TouchableOpacity
            style={styles.row}
            onPress={fetchScheduled}
            activeOpacity={0.65}
          >
            <Text style={[styles.actionText, { fontFamily: typography.fonts.semibold, color: colors.primary }]}>
              Refresh schedules
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionLabel, { fontFamily: typography.fonts.semibold, color: colors.textMuted }]}>
          System
        </Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={[styles.infoLabel, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
              Environment
            </Text>
            <Text style={[styles.infoValue, { fontFamily: typography.fonts.semibold, color: colors.text }]}>
              {__DEV__ ? 'Development' : 'Production'}
            </Text>
          </View>
          <Divider theme={theme} />
          <View style={styles.row}>
            <Text style={[styles.infoLabel, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
              Platform
            </Text>
            <Text style={[styles.infoValue, { fontFamily: typography.fonts.semibold, color: colors.text }]}>
              {process.env.EXPO_PUBLIC_PLATFORM || 'Native'}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerBrand, { fontFamily: typography.fonts.semibold, color: colors.text }]}>
            Numeo / Dev tools
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
    },
    lockIcon: {
      marginBottom: spacing('2'),
    },
    lockTitle: {
      fontSize: 20,
    },
    lockSub: {
      fontSize: typography.sizes.sm,
      textAlign: 'center',
      lineHeight: 20,
      opacity: 0.7,
    },
    lockInputWrap: {
      width: '100%',
      maxWidth: 200,
      marginTop: spacing('2'),
    },

    sectionLabel: {
      fontSize: 10,
      marginBottom: spacing('2.5'),
      paddingLeft: spacing('1'),
      opacity: 0.7,
    },

    card: {
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      overflow: 'hidden',
      marginBottom: spacing('6'),
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing('4'),
      paddingBottom: spacing('3'),
      gap: spacing('3'),
    },
    cardTitle: {
      fontSize: typography.sizes.md,
    },
    cardSub: {
      fontSize: typography.sizes.xs,
      marginTop: 2,
      opacity: 0.65,
    },

    pillRow: {
      flexDirection: 'row',
      paddingHorizontal: spacing('4'),
      paddingBottom: spacing('4'),
      gap: spacing('2'),
    },
    pill: {
      flex: 1,
      height: 36,
      borderRadius: radius('md'),
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.text + '0C',
      justifyContent: 'center',
      alignItems: 'center',
    },
    pillActive: {
      backgroundColor: colors.text,
      borderColor: colors.text,
    },
    pillText: {
      fontSize: 11,
      color: colors.textMuted,
    },
    pillTextActive: {
      color: colors.background,
    },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing('4'),
      paddingVertical: spacing('3.5'),
      gap: spacing('3'),
    },
    rowTitle: {
      fontSize: typography.sizes.md,
    },
    rowSub: {
      fontSize: typography.sizes.xs,
      marginTop: 2,
      opacity: 0.65,
    },

    actionText: {
      fontSize: typography.sizes.sm,
    },

    infoLabel: {
      fontSize: typography.sizes.sm,
      flex: 1,
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
