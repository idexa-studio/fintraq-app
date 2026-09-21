import * as Updates from 'expo-updates';
import { AlertButton, AlertDialog } from '@/src/components/ui/AlertDialog';
import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { Button } from '@/src/components/ui/Button';
import { ConfirmDialog } from '@/src/components/ui/ConfirmDialog';
import { CurrencyPickerBottomSheet } from '@/src/components/ui/CurrencyPickerBottomSheet';
import { PageBackground } from '@/src/components/ui/PageBackground';
import { getDeviceCurrencyCode } from '@/src/constants/currency';
import { ACCOUNT_COLORS } from '@/src/constants/picker';
import { useCreateAccount } from '@/src/features/accounts/hooks/accounts';
import { db } from '@/src/db/client';
import { accounts, categories } from '@/src/db/schema';
import { RestoreProgressView } from '@/src/features/onboarding/components/RestoreProgressView';
import { ProfileStep } from '@/src/features/onboarding/components/ProfileStep';
import { WelcomeStep } from '@/src/features/onboarding/components/WelcomeStep';
import { ONBOARDING_STEPS } from '@/src/features/onboarding/constants';
import { createOnboardingStyles } from '@/src/features/onboarding/styles';
import { OnboardingFormValues } from '@/src/features/onboarding/types';
import { useOnboarding } from '@/src/providers/OnboardingProvider';
import { useSettings } from '@/src/providers/SettingsProvider';
import { useTheme } from '@/src/providers/ThemeProvider';
import { AnalyticsService } from '@/src/services/analytics';
import { NotificationService } from '@/src/services/notification.service';
import { toDbColor } from '@/src/utils/format';
import { isNoBackupError, isProRequiredError } from '@/src/services/backup/google-drive.errors';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useGoogleBackup } from '@/src/features/backup/hooks/useGoogleBackup';
import { openAppSettings } from '@/src/services/backup/battery-optimization';

import { CloudBackupChoice, CloudBackupStep } from '@/src/features/onboarding/components/CloudBackupStep';
import { RestoreStep, SetupOption } from '@/src/features/onboarding/components/RestoreStep';
import { LoggerService } from '@/src/services/logger.service';
import { useTranslation } from 'react-i18next';

export const OnboardingScreen = React.memo(function OnboardingScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();
  const styles = React.useMemo(() => createOnboardingStyles(theme), [theme]);
  const { completeOnboarding } = useOnboarding();
  const { profile, updateProfile } = useSettings();
  const { mutateAsync: createAccount, isPending: accountPending } = useCreateAccount();
  const { user, isConnected, isChecking, isRestoring, progress, progressStage, connectAccount, disconnectAccount, performRestore, setAutoBackupEnabled } = useGoogleBackup();

  const [stepIndex, setStepIndex] = React.useState(0);
  const currentStep = ONBOARDING_STEPS[stepIndex];
  const [setupOption, setSetupOption] = React.useState<SetupOption>('fresh');
  const [cloudBackupChoice, setCloudBackupChoice] = React.useState<CloudBackupChoice>('enable');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [currency, setCurrency] = React.useState<string>(() => getDeviceCurrencyCode());
  const [showCurrencyPicker, setShowCurrencyPicker] = React.useState(false);
  const [showReminderDialog, setShowReminderDialog] = React.useState(false);

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
      await updateProfile({ reminderEnabled: true });
      // Explicitly schedule here to avoid race condition with SettingsProvider useEffect.
      // reminderTime defaults to '20:00' and the user hasn't changed it during onboarding.
      await NotificationService.scheduleDailyReminder(profile.reminderTime);
    }
    router.replace('/(main)/(tabs)');
  }, [updateProfile, profile.reminderTime, router, showAlert, t]);

  const handleSkipReminders = useCallback(() => {
    setShowReminderDialog(false);
    router.replace('/(main)/(tabs)');
  }, [router]);

  const validateStep = async () => {
    if (currentStep.id === 'profile') return trigger('name');
    return true;
  };

  const seedCategories = async () => {
    const defaults: { name: string; icon: string; color: number; type: string; isSystem?: boolean }[] = [
      // ── Income ──────────────────────────────────────────────────────
      { name: 'Salary', icon: 'cash', color: toDbColor('#059669'), type: 'CR' },
      { name: 'Freelance', icon: 'sparkles', color: toDbColor('#65A30D'), type: 'CR' },
      { name: 'Sales', icon: 'shopping-cart', color: toDbColor('#D97706'), type: 'CR' },
      { name: 'Dividends', icon: 'chart-up', color: toDbColor('#2563EB'), type: 'CR' },
      { name: 'Interests', icon: 'chart-bar-increasing', color: toDbColor('#7C3AED'), type: 'CR' },
      { name: 'Gifts', icon: 'gift', color: toDbColor('#BE185D'), type: 'CR' },
      { name: 'Refunds', icon: 'refresh', color: toDbColor('#059669'), type: 'CR' },
      { name: 'Other Income', icon: 'building', color: toDbColor('#334155'), type: 'CR' },

      // ── Housing & Utilities ──────────────────────────────────────────
      { name: 'Rent', icon: 'building', color: toDbColor('#EA580C'), type: 'DR' },
      { name: 'Mortgage', icon: 'home', color: toDbColor('#DC2626'), type: 'DR' },
      { name: 'Electricity', icon: 'flash', color: toDbColor('#D97706'), type: 'DR' },
      { name: 'Water', icon: 'droplets', color: toDbColor('#0369A1'), type: 'DR' },
      { name: 'Internet', icon: 'wifi', color: toDbColor('#4338CA'), type: 'DR' },
      { name: 'Phone', icon: 'smartphone', color: toDbColor('#4F46E5'), type: 'DR' },
      { name: 'Maintenance', icon: 'wrench', color: toDbColor('#475569'), type: 'DR' },

      // ── Food & Drink ────────────────────────────────────────────────
      { name: 'Groceries', icon: 'shopping-basket', color: toDbColor('#B45309'), type: 'DR' },
      { name: 'Dining Out', icon: 'fork', color: toDbColor('#EA580C'), type: 'DR' },
      { name: 'Delivery', icon: 'bike', color: toDbColor('#DC2626'), type: 'DR' },
      { name: 'Coffee', icon: 'coffee', color: toDbColor('#B45309'), type: 'DR' },
      { name: 'Drinks', icon: 'drink', color: toDbColor('#6D28D9'), type: 'DR' },

      // ── Transport ───────────────────────────────────────────────────
      { name: 'Fuel', icon: 'dashboard-speed', color: toDbColor('#EA580C'), type: 'DR' },
      { name: 'Car Payment', icon: 'car', color: toDbColor('#2563EB'), type: 'DR' },
      { name: 'Public Transit', icon: 'bus', color: toDbColor('#0E7490'), type: 'DR' },
      { name: 'Ride Share', icon: 'car', color: toDbColor('#059669'), type: 'DR' },
      { name: 'Parking', icon: 'map-pin', color: toDbColor('#334155'), type: 'DR' },

      // ── Health & Wellness ───────────────────────────────────────────
      { name: 'Health', icon: 'bandage', color: toDbColor('#BE123C'), type: 'DR' },
      { name: 'Pharmacy', icon: 'bandage', color: toDbColor('#059669'), type: 'DR' },
      { name: 'Gym', icon: 'dumbbell', color: toDbColor('#059669'), type: 'DR' },
      { name: 'Personal Care', icon: 'scissor', color: toDbColor('#BE185D'), type: 'DR' },

      // ── Lifestyle & Fun ──────────────────────────────────────────────
      { name: 'Shopping', icon: 'shopping-bag', color: toDbColor('#BE185D'), type: 'DR' },
      { name: 'Electronics', icon: 'cpu', color: toDbColor('#4338CA'), type: 'DR' },
      { name: 'Subscrip.', icon: 'repeat', color: toDbColor('#7C3AED'), type: 'DR' },
      { name: 'Entertainment', icon: 'film', color: toDbColor('#E11D48'), type: 'DR' },
      { name: 'Travel', icon: 'airplane', color: toDbColor('#0E7490'), type: 'DR' },
      { name: 'Games', icon: 'gamepad', color: toDbColor('#7C3AED'), type: 'DR' },
      { name: 'Books', icon: 'book-open', color: toDbColor('#D97706'), type: 'DR' },

      // ── Family & Education ──────────────────────────────────────────
      { name: 'Education', icon: 'school', color: toDbColor('#0369A1'), type: 'DR' },
      { name: 'Kids', icon: 'smile', color: toDbColor('#D97706'), type: 'DR' },
      { name: 'Pets', icon: 'cat', color: toDbColor('#65A30D'), type: 'DR' },
      { name: 'Gifts given', icon: 'heart', color: toDbColor('#E11D48'), type: 'DR' },

      // ── Finance & Taxes ─────────────────────────────────────────────
      { name: 'Loan/EMI', icon: 'credit-card', color: toDbColor('#DC2626'), type: 'CR,DR' },
      { name: 'Taxes', icon: 'file', color: toDbColor('#475569'), type: 'DR' },
      { name: 'Insurance', icon: 'shield', color: toDbColor('#334155'), type: 'DR' },
      { name: 'Fees', icon: 'receipt-text', color: toDbColor('#334155'), type: 'DR' },
      { name: 'Other', icon: 'more-horizontal', color: toDbColor('#475569'), type: 'DR' },

      // ── Transfers ────────────────────────────────────────────────────
      { name: 'Transfer', icon: 'repeat', color: toDbColor('#2563EB'), type: 'TR', isSystem: true },
      { name: 'Uncategorized', icon: 'grid', color: toDbColor('#475569'), type: 'CR,DR,TR', isSystem: true },
    ];

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
      const existingAccounts = await db.select({ id: accounts.id }).from(accounts).limit(1);
      if (existingAccounts.length === 0) {
        await createAccount({
          name: 'Cash',
          holderName: name.trim() || 'Personal',
          accountNumber: '',
          icon: 'building',
          color: toDbColor(ACCOUNT_COLORS[Math.floor(Math.random() * ACCOUNT_COLORS.length)]),
          isDefault: true,
          currency,
          balance: 0,
          income: 0,
          expense: 0,
        });
      }

      await seedCategories();

      await completeOnboarding();
      await AnalyticsService.onboardingCompleted(currency);
      setShowReminderDialog(true);
    } catch (e: any) {
      LoggerService.error('ONBOARDING', 'Setup finalization failed', e);
      showAlert({
        title: t('onboardingFlow.setupFailed'),
        message: e?.message || t('onboardingFlow.setupFailedMessage'),
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
      if (currentStep.id === 'setup_choice' && setupOption === 'restore') {
        await handleOnboardingRestore();
        return;
      }

      if (currentStep.id === 'backup_setup' && cloudBackupChoice === 'enable') {
        try {
          if (!isConnected) {
            await connectAccount();
          }

          // This is the one place onboarding is allowed to turn scheduling on
          // automatically — the user just explicitly picked "Automated Cloud Sync".
          // setAutoBackupEnabled applies its own notification-permission gate.
          const { blockedByNotifications } = await setAutoBackupEnabled(true);
          if (blockedByNotifications) {
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
        } catch (err: any) {
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
                { text: t('onboardingFlow.upgradeToPro'), onPress: () => router.push('/premium') },
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
      const success = await performRestore();
      LoggerService.info('ONBOARDING', `Restore finished, success: ${success}`);
      if (success) {
        await completeOnboarding();
        // Restored data was written straight to storage/DB, bypassing providers
        // (SettingsProvider, PremiumProvider, etc.) — reload so their in-memory
        // state isn't stale for the rest of this session.
        try {
          await Updates.reloadAsync();
        } catch {
          router.replace('/(main)/(tabs)');
        }
      }
    } catch (e: any) {
      const errorMsg = e?.message || '';
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
                setSetupOption('fresh');
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
              setSetupOption('fresh');
              setStepIndex(ONBOARDING_STEPS.findIndex((s) => s.id === 'profile'));
            } },
            { text: t('onboardingFlow.upgradeToPro'), onPress: () => router.push('/premium') },
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
  }, [user, connectAccount, disconnectAccount, performRestore, completeOnboarding, router, showAlert, t]);

  const openCurrencyPicker = useCallback(() => setShowCurrencyPicker(true), []);
  const closeCurrencyPicker = useCallback(() => setShowCurrencyPicker(false), []);

  const buttonTitle = React.useMemo(() => {
    if (isButtonLoading) {
      if (currentStep.id === 'backup_setup' && cloudBackupChoice === 'enable') {
        return isConnected ? t('onboardingFlow.finalizing') : t('onboardingFlow.connectingSync');
      }
      if (currentStep.id === 'setup_choice' && setupOption === 'restore') {
        return t('onboardingFlow.restoringBackup');
      }
      if (stepIndex === ONBOARDING_STEPS.length - 1) {
        return t('onboardingFlow.finalizing');
      }
      return t('onboardingFlow.processing');
    }

    if (currentStep.id === 'setup_choice' && setupOption === 'restore') {
      return user ? t('onboardingFlow.restoreCloudBackup') : t('onboardingFlow.connectAndRestore');
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
    return t('onboardingFlow.next');
  }, [isButtonLoading, currentStep.id, setupOption, cloudBackupChoice, isConnected, user, stepIndex, t]);

  const renderStepContent = () => {
    switch (currentStep.id) {
      case 'welcome':
        return <WelcomeStep />;
      case 'setup_choice':
        return isRestoring ? (
          <RestoreProgressView
            progress={progress}
            progressStage={progressStage}
            userEmail={user?.email}
          />
        ) : (
          <RestoreStep
            selectedOption={setupOption}
            onSelectOption={setSetupOption}
            userEmail={user?.email}
            isRestoring={isRestoring}
          />
        );
      case 'profile':
        return (
          <ProfileStep
            currency={currency}
            onOpenCurrencyPicker={openCurrencyPicker}
          />
        );
      case 'backup_setup':
        return (
          <CloudBackupStep
            selectedChoice={cloudBackupChoice}
            onSelectChoice={setCloudBackupChoice}
            userEmail={user?.email}
            isConnecting={isChecking}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <PageBackground />

      <FormProvider {...methods}>
        <KeyboardAvoidingView style={styles.keyboardWrap} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.header}>
            <View style={styles.headerTopRow}>
              {stepIndex > 0 ? (
                <BentoPressable
                  style={styles.headerBackButton}
                  onPress={() => setStepIndex((i) => i - 1)}
                  disabled={isButtonLoading}
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={18} color={colors.text} />
                </BentoPressable>
              ) : (
                <View style={styles.headerBackPlaceholder} />
              )}

              <Text style={styles.brand}>Fintraq<Text style={{ color: colors.primary }}>.</Text></Text>

              <View style={styles.stepPill}>
                <Text style={styles.stepPillText}>{stepIndex + 1}/{ONBOARDING_STEPS.length}</Text>
              </View>
            </View>

            <View style={styles.progressTrack}>
              {ONBOARDING_STEPS.map((step, index) => (
                <View key={step.id} style={[styles.progressDot, index <= stepIndex && styles.progressDotActive]} />
              ))}
            </View>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.stepMeta}>
              <Text style={styles.eyebrow}>{t(`onboardingFlow.steps.${currentStep.id}.eyebrow`)}</Text>
              <Text style={styles.stepTitle}>{t(`onboardingFlow.steps.${currentStep.id}.title`)}</Text>
              <Text style={styles.stepSubtitle}>{t(`onboardingFlow.steps.${currentStep.id}.subtitle`)}</Text>
            </View>

            {renderStepContent()}
          </ScrollView>

          <View style={styles.footer}>
            <Button
              title={buttonTitle}
              onPress={handleContinue}
              size="lg"
              isLoading={isButtonLoading}
              style={styles.primaryAction}
            />
          </View>
        </KeyboardAvoidingView>
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
    </SafeAreaView>
  );
});
