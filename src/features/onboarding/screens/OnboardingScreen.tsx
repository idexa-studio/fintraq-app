import { useKeyboardInset } from '@/src/hooks/useKeyboardInset';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/src/components/ui/Screen';
import * as Updates from 'expo-updates';
import { AlertButton, AlertDialog, Button, ConfirmDialog, IconButton, Text } from '@/src/components/ui';
import { CurrencyPickerBottomSheet } from '@/src/components/pickers/CurrencyPickerBottomSheet';
import { getDeviceCurrencyCode } from '@/src/constants/currency';
import { ACCOUNT_COLORS } from '@/src/constants/picker';
import { DEFAULT_CATEGORIES } from '@/src/constants/defaultCategories';
import { useCreateAccount } from '@/src/features/accounts/hooks/accounts';
import { db } from '@/src/db/client';
import { accounts, categories, payments } from '@/src/db/schema';
import { and, eq } from 'drizzle-orm';
import { parseAmountInput } from '@/src/utils/amount';
import { resolveAccountTypeIcon } from '@/src/utils/icons';
import { RestoreProgressView } from '@/src/features/onboarding/components/RestoreProgressView';
import { ProfileStep } from '@/src/features/onboarding/components/ProfileStep';
import { WelcomeStep } from '@/src/features/onboarding/components/WelcomeStep';
import { AccountStep } from '@/src/features/onboarding/components/AccountStep';
import { FirstEntryStep } from '@/src/features/onboarding/components/FirstEntryStep';
import { FIRST_ENTRY_CATEGORIES, ONBOARDING_STEPS } from '@/src/features/onboarding/constants';
import type { OnboardingAccountDraft, OnboardingEntryDraft, OnboardingFormValues } from '@/src/features/onboarding/types';
import { useCreateTransaction } from '@/src/features/transactions/hooks/transactions';
import { useOnboarding } from '@/src/providers/OnboardingProvider';
import { useSettings } from '@/src/providers/SettingsProvider';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { Analytics } from '@/src/services/telemetry';
import { NotificationService } from '@/src/services/notification.service';
import { toDbColor } from '@/src/utils/format';
import { isNoBackupError, isProRequiredError } from '@/src/services/backup/google-drive.errors';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';

import { useAutoBackupSetting } from '@/src/features/backup/hooks/useAutoBackupSetting';
import { useBackupAccount, useConnectBackupAccount, useDisconnectBackupAccount } from '@/src/features/backup/hooks/useBackupAccount';
import { useBackupProgress } from '@/src/features/backup/hooks/useBackupProgress';
import { useCloudBackupActions } from '@/src/features/backup/hooks/useCloudBackupActions';
import { useEnableCloudBackup } from '@/src/features/backup/hooks/useEnableCloudBackup';
import { openAppSettings } from '@/src/services/backup/battery-optimization';

import { CloudBackupChoice, CloudBackupStep } from '@/src/features/onboarding/components/CloudBackupStep';
import { LoggerService } from '@/src/services/logger.service';
import { useTranslation } from 'react-i18next';
import { toErrorMessage } from '@/src/utils/errors';

export const OnboardingScreen = React.memo(function OnboardingScreen() {
  const router = useRouter();
  const theme = useTheme();
  const keyboardInset = useKeyboardInset(true, useSafeAreaInsets().bottom);
  const { t } = useTranslation();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const { completeOnboarding } = useOnboarding();
  const { profile, updateProfile } = useSettings();
  const { mutateAsync: createAccount, isPending: accountPending } = useCreateAccount();
  const { mutateAsync: createTransaction } = useCreateTransaction();
  const { account: user, isConnected } = useBackupAccount();
  const { mutateAsync: connectAccount, isPending: isConnectingAccount } = useConnectBackupAccount();
  const { mutateAsync: disconnectAccount } = useDisconnectBackupAccount();
  const { isRestoring, progress, stage: progressStage } = useBackupProgress();
  const { restoreLatest } = useCloudBackupActions();
  const { enableCloudBackup, isEnabling } = useEnableCloudBackup();
  const { setAutoBackupEnabled } = useAutoBackupSetting();

  const [stepIndex, setStepIndex] = React.useState(0);
  const currentStep = ONBOARDING_STEPS[stepIndex];
  const [cloudBackupChoice, setCloudBackupChoice] = React.useState<CloudBackupChoice>('enable');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [currency, setCurrency] = React.useState<string>(() => getDeviceCurrencyCode());
  const [showCurrencyPicker, setShowCurrencyPicker] = React.useState(false);
  const [showReminderDialog, setShowReminderDialog] = React.useState(false);

  // The first account and first entry are drafted across steps and written when setup finishes.
  const [accountDraft, setAccountDraft] = React.useState<OnboardingAccountDraft>(() => ({ type: 'cash', name: t('accounts.cash'), balance: '', nameEdited: false }));
  const [entryDraft, setEntryDraft] = React.useState<OnboardingEntryDraft>({ type: 'DR', amount: '', category: FIRST_ENTRY_CATEGORIES.DR[0], note: '' });
  const [entrySkipped, setEntrySkipped] = React.useState(false);
  useEffect(() => {
    Analytics.track('tutorial_begin');
  }, []);
  const [stepErrors, setStepErrors] = React.useState<{ accountName?: string; balance?: string; amount?: string }>({});

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
        buttons: config.buttons || [{ text: t('common.ok') }],
      });
    },
    [t],
  );

  const methods = useForm<OnboardingFormValues>({
    defaultValues: { name: '' },
    mode: 'onBlur',
  });

  const { trigger, getValues } = methods;

  const isPending = accountPending;
  const isButtonLoading = isPending || isSubmitting || isRestoring;

  const handleEnableReminders = useCallback(async () => {
    setShowReminderDialog(false);
    const granted = await NotificationService.requestPermissions();
    if (!granted) {
      showAlert({
        title: t('onboardingFlow.permissionRequired'),
        message: t('onboardingFlow.permissionMessage'),
        type: 'warning',
      });
    } else {
      // Saving the profile triggers SettingsProvider's reminder sync.
      await updateProfile({ reminderEnabled: true });
    }
    router.replace('/(main)/(tabs)');
  }, [updateProfile, router, showAlert, t]);

  const handleSkipReminders = useCallback(() => {
    setShowReminderDialog(false);
    router.replace('/(main)/(tabs)');
  }, [router]);

  const validateStep = async () => {
    if (currentStep.id === 'profile') return trigger('name');
    if (currentStep.id === 'account') {
      const errors = {
        accountName: accountDraft.name.trim() ? undefined : t('onboardingFlow.accountNameRequired'),
        balance: accountDraft.balance.trim() && parseAmountInput(accountDraft.balance) === null ? t('onboardingFlow.invalidAmount') : undefined,
      };
      setStepErrors(errors);
      return !errors.accountName && !errors.balance;
    }
    if (currentStep.id === 'first_entry') {
      const amount = parseAmountInput(entryDraft.amount);
      const error = amount && amount > 0 ? undefined : t('onboardingFlow.entryAmountRequired');
      setStepErrors({ amount: error });
      if (!error) setEntrySkipped(false);
      return !error;
    }
    return true;
  };

  const seedCategories = async () => {
    const defaults = DEFAULT_CATEGORIES;

    const existing = await db.select({ name: categories.name }).from(categories);
    const existingNames = new Set(existing.map((c) => c.name));

    const toInsert = defaults.filter((c) => !existingNames.has(c.name));
    if (toInsert.length === 0) return;

    await db.insert(categories).values(
      toInsert.map((c) => ({
        name: c.name,
        icon: c.icon,
        color: c.color,
        type: c.type,
        isSystem: c.isSystem ?? false,
      }))
    );
  };

  const finalizeSetup = async () => {
    const { name } = getValues();
    try {
      await updateProfile({
        name: name.trim(),
        email: profile.email || '',
        phone: profile.phone || '',
        defaultCurrency: currency,
      });

      // Only create the default account if one doesn't already exist (e.g. a
      // retried finalize after a prior partial failure) — accounts.name has
      // no unique constraint, so an unguarded create here would silently
      // duplicate the "Cash" account on retry. Real failures below are
      // intentionally NOT swallowed: without a default account or categories
      // the app is unusable, so onboarding must not be marked complete.
      // Categories first: the first entry needs one. Only create the account if none exists yet
      // (a retried finalize after a partial failure) — accounts.name has no unique constraint, so
      // an unguarded create would duplicate it. Real failures are NOT swallowed: without an
      // account and categories the app is unusable, so onboarding must not be marked complete.
      await seedCategories();

      const [existingAccount] = await db.select({ id: accounts.id }).from(accounts).limit(1);
      const accountId =
        existingAccount?.id ??
        (
          await createAccount({
            name: accountDraft.name.trim(),
            holderName: name.trim() || 'Personal',
            accountNumber: '',
            accountType: accountDraft.type,
            icon: resolveAccountTypeIcon(accountDraft.type),
            color: toDbColor(ACCOUNT_COLORS[Math.floor(Math.random() * ACCOUNT_COLORS.length)]),
            isDefault: true,
            currency,
            balance: parseAmountInput(accountDraft.balance) ?? 0,
            income: 0,
            expense: 0,
          })
        ).id;

      // The first entry, unless skipped — and never twice if finalize is retried.
      const entryAmount = parseAmountInput(entryDraft.amount);
      const [anyPayment] = await db.select({ id: payments.id }).from(payments).limit(1);
      let firstEntry: 'added' | 'skipped' = 'skipped';
      if (!entrySkipped && entryAmount && entryAmount > 0 && !anyPayment) {
        const [category] = await db
          .select({ id: categories.id })
          .from(categories)
          .where(and(eq(categories.name, entryDraft.category), eq(categories.type, entryDraft.type)))
          .limit(1);
        if (category) {
          await createTransaction({
            accountId,
            categoryId: category.id,
            amount: entryAmount,
            type: entryDraft.type,
            datetime: new Date().toISOString(),
            note: entryDraft.note.trim() || entryDraft.category,
          });
          firstEntry = 'added';
        }
      }

      await completeOnboarding();
      Analytics.track('tutorial_complete', { first_entry: firstEntry });
      setShowReminderDialog(true);
    } catch (e) {
      LoggerService.error('ONBOARDING', 'Setup finalization failed', e);
      showAlert({
        title: t('onboardingFlow.setupFailed'),
        message: toErrorMessage(e, t('onboardingFlow.setupFailedMessage')),
        type: 'error',
      });
    }
  };

  const handleContinue = async () => {
    if (isSubmitting || isButtonLoading) return;
    const valid = await validateStep();
    if (!valid) return;

    setIsSubmitting(true);
    try {
      if (currentStep.id === 'backup_setup' && cloudBackupChoice === 'enable') {
        try {
          // The user explicitly picked "Automated Cloud Sync": connect and turn scheduling on.
          // Enabling applies its own notification-permission gate.
          const result = await enableCloudBackup();
          if (result.status === 'cancelled') {
            // A dismissed sign-in must not look like Cloud Backup was enabled.
            throw new Error('Google sign-in cancelled');
          }
          if (result.blockedByNotifications) {
            showAlert({
              title: t('onboardingFlow.notificationsRequired'),
              message: t('onboardingFlow.notificationsRequiredMessage'),
              type: 'warning',
              buttons: [
                { text: t('onboardingFlow.continue'), style: 'cancel', onPress: () => { void finalizeSetup(); } },
                { text: t('onboardingFlow.openSettings'), onPress: () => openAppSettings() },
              ],
            });
            return;
          }
        } catch (err) {
          // Don't block onboarding on a failed/cancelled Google sign-in, but
          // never silently proceed as if Cloud Backup were enabled — the
          // button the user tapped promised to enable it. Finalize only
          // after the user acknowledges, so this alert can't get stacked
          // under (or raced by) the reminder dialog finalizeSetup triggers.
          LoggerService.warn('ONBOARDING', 'Cloud backup connect failed', err);
          if (isProRequiredError(err)) {
            showAlert({
              title: t('onboardingFlow.cloudBackupPro'),
              message: t('onboardingFlow.cloudBackupProMessage'),
              type: 'info',
              buttons: [
                { text: t('onboardingFlow.continue'), style: 'cancel', onPress: () => { void finalizeSetup(); } },
                { text: t('onboardingFlow.upgradeToPro'), onPress: () => router.push({ pathname: '/premium', params: { feature: 'backup' } }) },
              ],
            });
            return;
          }
          showAlert({
            title: t('onboardingFlow.cloudNotEnabled'),
            message: t('onboardingFlow.cloudNotEnabledMessage'),
            type: 'warning',
            buttons: [{ text: t('onboardingFlow.continue'), onPress: () => { void finalizeSetup(); } }],
          });
          return;
        }
      }

      if (stepIndex === ONBOARDING_STEPS.length - 1) {
        await finalizeSetup();
        return;
      }

      setStepIndex((i) => i + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOnboardingRestore = useCallback(async () => {
    let signedInEmail = user?.email;
    try {
      LoggerService.info('ONBOARDING', 'Starting cloud restore flow');
      const signedInUser = user || (await connectAccount());
      if (!signedInUser) {
        LoggerService.info('ONBOARDING', 'User cancelled Google sign-in');
        return;
      }
      signedInEmail = signedInUser.email;
      LoggerService.info('ONBOARDING', `Restoring backup for ${signedInUser.email}`);
      await restoreLatest();
      LoggerService.info('ONBOARDING', 'Restore finished');
      // Someone restoring onto a new device is a backup user: keep them protected here too.
      // Best-effort — a denied notification permission must not undo a successful restore.
      await setAutoBackupEnabled(true).catch((err) => LoggerService.warn('ONBOARDING', 'Could not enable auto-backup after restore', err));
      await completeOnboarding();
      // Restored data was written straight to storage/DB, bypassing providers
      // (SettingsProvider, PremiumProvider, etc.) — reload so their in-memory
      // state isn't stale for the rest of this session.
      try {
        await Updates.reloadAsync();
      } catch {
        router.replace('/(main)/(tabs)');
      }
    } catch (e) {
      const errorMsg = toErrorMessage(e, '');
      const isNoBackup = isNoBackupError(e);

      if (isNoBackup) {
        LoggerService.info('ONBOARDING', `No backup file found for ${signedInEmail}`);
      } else {
        LoggerService.warn('ONBOARDING', 'Restore during onboarding failed', e);
      }

      // Automatically sign out / disconnect cloud account on restore error or failure
      await disconnectAccount().catch(() => {});

      if (isNoBackup) {
        showAlert({
          title: t('onboardingFlow.noBackupFound'),
          message: t('onboardingFlow.noBackupMessage', { email: signedInEmail || t('onboardingFlow.yourCloudAccount') }),
          type: 'warning',
          buttons: [
            {
              text: t('onboardingFlow.startFresh'),
              onPress: () => {
                setStepIndex(ONBOARDING_STEPS.findIndex((s) => s.id === 'profile'));
              },
            },
            {
              text: t('onboardingFlow.tryAnotherAccount'),
              style: 'cancel',
            },
          ],
        });
      } else if (isProRequiredError(e)) {
        showAlert({
          title: t('onboardingFlow.cloudRestorePro'),
          message: t('onboardingFlow.cloudRestoreProMessage'),
          type: 'info',
          buttons: [
            { text: t('onboardingFlow.startFresh'), style: 'cancel', onPress: () => {
              setStepIndex(ONBOARDING_STEPS.findIndex((s) => s.id === 'profile'));
            } },
            { text: t('onboardingFlow.upgradeToPro'), onPress: () => router.push({ pathname: '/premium', params: { feature: 'backup' } }) },
          ],
        });
      } else {
        showAlert({
          title: t('onboardingFlow.restoreFailed'),
          message: errorMsg || t('onboardingFlow.restoreFailedMessage'),
          type: 'error',
        });
      }
    }
  }, [user, connectAccount, disconnectAccount, restoreLatest, setAutoBackupEnabled, completeOnboarding, router, showAlert, t]);

  const openCurrencyPicker = useCallback(() => setShowCurrencyPicker(true), []);
  const closeCurrencyPicker = useCallback(() => setShowCurrencyPicker(false), []);

  const handleRestorePress = useCallback(async () => {
    if (isSubmitting || isButtonLoading) return;
    setIsSubmitting(true);
    try {
      await handleOnboardingRestore();
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, isButtonLoading, handleOnboardingRestore]);

  const buttonTitle = React.useMemo(() => {
    if (isButtonLoading) {
      if (currentStep.id === 'backup_setup' && cloudBackupChoice === 'enable') {
        return isConnected ? t('onboardingFlow.finalizing') : t('onboardingFlow.connectingSync');
      }
      if (isRestoring) {
        return t('onboardingFlow.restoringBackup');
      }
      if (stepIndex === ONBOARDING_STEPS.length - 1) {
        return t('onboardingFlow.finalizing');
      }
      return t('onboardingFlow.processing');
    }

    if (currentStep.id === 'welcome') {
      return t('onboardingFlow.getStarted');
    }
    if (currentStep.id === 'backup_setup') {
      if (cloudBackupChoice === 'enable') {
        return user ? t('onboardingFlow.launch') : t('onboardingFlow.enableAndLaunch');
      }
      return t('onboardingFlow.skipAndLaunch');
    }
    if (stepIndex === ONBOARDING_STEPS.length - 1) {
      return t('onboardingFlow.launch');
    }
    if (currentStep.id === 'first_entry') {
      return t('onboardingFlow.addEntry');
    }
    return t('onboardingFlow.next');
  }, [isButtonLoading, isRestoring, currentStep.id, cloudBackupChoice, isConnected, user, stepIndex, t]);

  const renderStepContent = () => {
    if (isRestoring) {
      return <RestoreProgressView progress={progress} progressStage={progressStage} userEmail={user?.email} />;
    }
    switch (currentStep.id) {
      case 'welcome':
        return <WelcomeStep />;
      case 'profile':
        return <ProfileStep currency={currency} onOpenCurrencyPicker={openCurrencyPicker} />;
      case 'account':
        return <AccountStep draft={accountDraft} onChange={setAccountDraft} currency={currency} nameError={stepErrors.accountName} balanceError={stepErrors.balance} />;
      case 'first_entry':
        return (
          <FirstEntryStep
            draft={entryDraft}
            onChange={setEntryDraft}
            currency={currency}
            accountName={accountDraft.name.trim()}
            openingBalance={parseAmountInput(accountDraft.balance) ?? 0}
            amountError={stepErrors.amount}
          />
        );
      case 'backup_setup':
        return (
          <CloudBackupStep
            selectedChoice={cloudBackupChoice}
            onSelectChoice={setCloudBackupChoice}
            userEmail={user?.email}
            isConnecting={isEnabling || isConnectingAccount}
          />
        );
      default:
        return null;
    }
  };

  const isWelcome = currentStep.id === 'welcome';

  return (
    <Screen variant="fixed" edges={['top', 'right', 'bottom', 'left']}>

      <FormProvider {...methods}>
        <View style={[styles.keyboardWrap, { paddingBottom: keyboardInset }]}>
          {isWelcome ? null : (
            <View style={styles.header}>
              <IconButton
                icon="chevron-left"
                onPress={() => setStepIndex((i) => i - 1)}
                disabled={isButtonLoading}
                accessibilityLabel={t('common.back')}
              />
              <View style={styles.progressTrack} accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: ONBOARDING_STEPS.length, now: stepIndex + 1 }}>
                {ONBOARDING_STEPS.slice(1).map((step, index) => (
                  <View key={step.id} style={[styles.progressSegment, index + 1 <= stepIndex && styles.progressSegmentActive]} />
                ))}
              </View>
            </View>
          )}

          <ScrollView
            contentContainerStyle={[styles.scrollContent, isWelcome && styles.scrollContentWelcome]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {isWelcome ? (
              <Text variant="headline" style={styles.brand}>Fintraq<Text inline style={styles.brandDot}>.</Text></Text>
            ) : null}
            <View style={styles.stepMeta}>
              <Text variant="display">{t(`onboardingFlow.steps.${currentStep.id}.title`)}</Text>
              <Text variant="body" tone="muted">
                {isWelcome ? t('onboardingFlow.welcomeSubtitle') : t(`onboardingFlow.steps.${currentStep.id}.subtitle`)}
              </Text>
            </View>

            {renderStepContent()}
          </ScrollView>

          <View style={styles.footer}>
            <Button
              title={buttonTitle}
              onPress={handleContinue}
              size="lg"
              fullWidth
              isLoading={isButtonLoading && !isRestoring}
              disabled={isRestoring}
            />
            {currentStep.id === 'first_entry' ? (
              <Button
                title={t('onboardingFlow.skipForNow')}
                onPress={() => {
                  setEntrySkipped(true);
                  setStepErrors({});
                  setStepIndex((i) => i + 1);
                }}
                variant="ghost"
                size="lg"
                fullWidth
                disabled={isButtonLoading}
              />
            ) : null}
            {isWelcome && !isRestoring ? (
              <Button
                title={t('onboardingFlow.restoreFromBackup')}
                onPress={handleRestorePress}
                variant="ghost"
                size="lg"
                fullWidth
                disabled={isButtonLoading}
              />
            ) : null}
          </View>
        </View>
      </FormProvider>

      <CurrencyPickerBottomSheet
        visible={showCurrencyPicker}
        onClose={closeCurrencyPicker}
        value={currency}
        onChange={(code) => {
          setCurrency(code);
          closeCurrencyPicker();
        }}
      />

      <ConfirmDialog
        visible={showReminderDialog}
        onClose={handleSkipReminders}
        title={t('onboardingFlow.reminderTitle')}
        confirmLabel={t('onboardingFlow.reminderConfirm')}
        cancelLabel={t('onboardingFlow.notNow')}
        destructive={false}
        message={t('onboardingFlow.reminderMessage')}
        onConfirm={handleEnableReminders}
      />

      <AlertDialog
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </Screen>
  );
});

const createStyles = ({ colors, typography, spacing, radius, layout }: ThemeContextType) =>
  StyleSheet.create({
    keyboardWrap: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('4'),
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('2'),
    },
    progressTrack: { flex: 1, flexDirection: 'row', gap: spacing('1.5') },
    progressSegment: { flex: 1, height: 6, borderRadius: radius('full'), backgroundColor: colors.card },
    progressSegmentActive: { backgroundColor: colors.primary },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('7'),
      paddingBottom: spacing('6'),
      gap: spacing('7'),
    },
    scrollContentWelcome: { paddingTop: spacing('10') },
    // The original wordmark: the biggest type in the app, once, on the first screen.
    brand: {
      ...typography.metrics.jumbo,
      marginBottom: -spacing('4'),
    },
    brandDot: { color: colors.primary }, // design-system-ignore: logotype mark, exempt from contrast
    stepMeta: { gap: spacing('2.5') },
    footer: {
      gap: spacing('1'),
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('2'),
      paddingBottom: Platform.OS === 'ios' ? spacing('2') : spacing('4'),
    },
  });
