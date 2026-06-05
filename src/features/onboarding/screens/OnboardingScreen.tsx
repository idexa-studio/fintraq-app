import { Button } from '@/src/components/ui/Button';
import { ConfirmDialog } from '@/src/components/ui/ConfirmDialog';
import { CurrencyPickerModal } from '@/src/components/ui/CurrencyPickerModal';
import { PageBackground } from '@/src/components/ui/PageBackground';
import { getDeviceCurrencyCode } from '@/src/constants/currency';
import { ACCOUNT_COLORS } from '@/src/constants/picker';
import { useCreateAccount } from '@/src/features/accounts/hooks/accounts';
import { useCreateCategory } from '@/src/features/categories/hooks/categories';
import { ProfileStep } from '@/src/features/onboarding/components/ProfileStep';
import { WelcomeStep } from '@/src/features/onboarding/components/WelcomeStep';
import { ONBOARDING_STEPS } from '@/src/features/onboarding/constants';
import { createOnboardingStyles } from '@/src/features/onboarding/styles';
import { OnboardingFormValues } from '@/src/features/onboarding/types';
import { useOnboarding } from '@/src/providers/OnboardingProvider';
import { useSettings } from '@/src/providers/SettingsProvider';
import { useTheme } from '@/src/providers/ThemeProvider';
import { NotificationService } from '@/src/services/notification.service';
import type { TransactionType } from '@/src/types';
import { toDbColor } from '@/src/utils/format';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const OnboardingScreen = React.memo(function OnboardingScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { colors } = theme;
  const styles = React.useMemo(() => createOnboardingStyles(theme), [theme]);
  const { completeOnboarding } = useOnboarding();
  const { updateProfile } = useSettings();
  const { mutateAsync: createAccount, isPending: accountPending } = useCreateAccount();
  const { mutateAsync: createCategory, isPending: categoryPending } = useCreateCategory();

  const [stepIndex, setStepIndex] = React.useState(0);
  const currentStep = ONBOARDING_STEPS[stepIndex];

  const [currency, setCurrency] = React.useState<string>(() => getDeviceCurrencyCode());
  const [showCurrencyPicker, setShowCurrencyPicker] = React.useState(false);
  const [showReminderDialog, setShowReminderDialog] = React.useState(false);

  const methods = useForm<OnboardingFormValues>({
    mode: 'onChange',
    defaultValues: { name: '' },
  });

  const { trigger, getValues } = methods;

  const isPending = accountPending || categoryPending;

  const handleEnableReminders = useCallback(async () => {
    setShowReminderDialog(false);
    const granted = await NotificationService.requestPermissions();
    if (!granted) {
      Alert.alert(
        'Permission required',
        'Enable notifications in device settings to receive daily reminders. You can turn this on anytime in Settings.'
      );
    } else {
      await updateProfile({ reminderEnabled: true });
    }
    router.replace('/(main)/(tabs)');
  }, [updateProfile, router]);

  const handleSkipReminders = useCallback(() => {
    setShowReminderDialog(false);
    router.replace('/(main)/(tabs)');
  }, [router]);

  const validateStep = async () => {
    if (currentStep.id === 'profile') return trigger('name');
    return true;
  };

  const seedCategories = async () => {
    const defaults: { name: string; icon: string; color: number; type: TransactionType }[] = [
      // ── Income ──────────────────────────────────────────────────────
      { name: 'Salary', icon: 'cash', color: toDbColor('#059669'), type: 'CR' },
      { name: 'Freelance', icon: 'creation', color: toDbColor('#65A30D'), type: 'CR' },
      { name: 'Sales', icon: 'cart-outline', color: toDbColor('#D97706'), type: 'CR' },
      { name: 'Dividends', icon: 'trending-up', color: toDbColor('#2563EB'), type: 'CR' },
      { name: 'Interests', icon: 'plus-circle-outline', color: toDbColor('#7C3AED'), type: 'CR' },
      { name: 'Gifts', icon: 'gift-outline', color: toDbColor('#BE185D'), type: 'CR' },
      { name: 'Refunds', icon: 'refresh', color: toDbColor('#059669'), type: 'CR' },
      { name: 'Other Income', icon: 'wallet-outline', color: toDbColor('#334155'), type: 'CR' },

      // ── Housing & Utilities ──────────────────────────────────────────
      { name: 'Rent', icon: 'domain', color: toDbColor('#EA580C'), type: 'DR' },
      { name: 'Mortgage', icon: 'home-outline', color: toDbColor('#DC2626'), type: 'DR' },
      { name: 'Electricity', icon: 'flash-outline', color: toDbColor('#D97706'), type: 'DR' },
      { name: 'Water', icon: 'water-outline', color: toDbColor('#0369A1'), type: 'DR' },
      { name: 'Internet', icon: 'wifi', color: toDbColor('#4338CA'), type: 'DR' },
      { name: 'Phone', icon: 'cellphone', color: toDbColor('#4F46E5'), type: 'DR' },
      { name: 'Maintenance', icon: 'wrench-outline', color: toDbColor('#475569'), type: 'DR' },

      // ── Food & Drink ────────────────────────────────────────────────
      { name: 'Groceries', icon: 'basket-outline', color: toDbColor('#B45309'), type: 'DR' },
      { name: 'Dining Out', icon: 'silverware-fork-knife', color: toDbColor('#EA580C'), type: 'DR' },
      { name: 'Delivery', icon: 'bike', color: toDbColor('#DC2626'), type: 'DR' },
      { name: 'Coffee', icon: 'coffee-outline', color: toDbColor('#B45309'), type: 'DR' },
      { name: 'Drinks', icon: 'glass-wine', color: toDbColor('#6D28D9'), type: 'DR' },

      // ── Transport ───────────────────────────────────────────────────
      { name: 'Fuel', icon: 'speedometer', color: toDbColor('#EA580C'), type: 'DR' },
      { name: 'Car Payment', icon: 'car-outline', color: toDbColor('#2563EB'), type: 'DR' },
      { name: 'Public Transit', icon: 'bus', color: toDbColor('#0E7490'), type: 'DR' },
      { name: 'Ride Share', icon: 'car-outline', color: toDbColor('#059669'), type: 'DR' },
      { name: 'Parking', icon: 'crosshairs-gps', color: toDbColor('#334155'), type: 'DR' },

      // ── Health & Wellness ───────────────────────────────────────────
      { name: 'Health', icon: 'medical-bag', color: toDbColor('#BE123C'), type: 'DR' },
      { name: 'Pharmacy', icon: 'bandage', color: toDbColor('#059669'), type: 'DR' },
      { name: 'Gym', icon: 'weight-lifter', color: toDbColor('#059669'), type: 'DR' },
      { name: 'Personal Care', icon: 'content-cut', color: toDbColor('#BE185D'), type: 'DR' },

      // ── Lifestyle & Fun ──────────────────────────────────────────────
      { name: 'Shopping', icon: 'shopping-outline', color: toDbColor('#BE185D'), type: 'DR' },
      { name: 'Electronics', icon: 'cpu-64-bit', color: toDbColor('#4338CA'), type: 'DR' },
      { name: 'Subscrip.', icon: 'repeat', color: toDbColor('#7C3AED'), type: 'DR' },
      { name: 'Entertainment', icon: 'filmstrip', color: toDbColor('#E11D48'), type: 'DR' },
      { name: 'Travel', icon: 'airplane', color: toDbColor('#0E7490'), type: 'DR' },
      { name: 'Games', icon: 'gamepad-variant-outline', color: toDbColor('#7C3AED'), type: 'DR' },
      { name: 'Books', icon: 'book-open-page-variant-outline', color: toDbColor('#D97706'), type: 'DR' },

      // ── Family & Education ──────────────────────────────────────────
      { name: 'Education', icon: 'school-outline', color: toDbColor('#0369A1'), type: 'DR' },
      { name: 'Kids', icon: 'emoticon-happy-outline', color: toDbColor('#D97706'), type: 'DR' },
      { name: 'Pets', icon: 'paw', color: toDbColor('#65A30D'), type: 'DR' },
      { name: 'Gifts given', icon: 'heart-outline', color: toDbColor('#E11D48'), type: 'DR' },

      // ── Finance & Taxes ─────────────────────────────────────────────
      { name: 'Loan/EMI', icon: 'card-outline', color: toDbColor('#DC2626'), type: 'DR' },
      { name: 'Taxes', icon: 'file-document-outline', color: toDbColor('#475569'), type: 'DR' },
      { name: 'Insurance', icon: 'shield-check-outline', color: toDbColor('#334155'), type: 'DR' },
      { name: 'Fees', icon: 'receipt-text-outline', color: toDbColor('#334155'), type: 'DR' },
      { name: 'Other', icon: 'dots-horizontal', color: toDbColor('#475569'), type: 'DR' },

      // ── Transfers ────────────────────────────────────────────────────
      { name: 'Transfer', icon: 'swap-horizontal', color: toDbColor('#2563EB'), type: 'TR' },
    ];

    for (const category of defaults) {
      await createCategory(category);
    }
  };

  const finalizeSetup = async () => {
    const { name } = getValues();
    try {
      await updateProfile({
        name: name.trim(),
        email: '',
        phone: '',
        defaultCurrency: currency,
      });

      await createAccount({
        name: 'Cash',
        holderName: name.trim() || 'Personal',
        accountNumber: '',
        icon: 'wallet-outline',
        color: toDbColor(ACCOUNT_COLORS[Math.floor(Math.random() * ACCOUNT_COLORS.length)]),
        isDefault: true,
        currency,
        balance: 0,
        income: 0,
        expense: 0,
      });

      await seedCategories();
      await completeOnboarding();
      setShowReminderDialog(true);
    } catch {
      Alert.alert('Setup failed', 'Could not initialize your workspace. Please try again.');
    }
  };

  const handleContinue = async () => {
    const valid = await validateStep();
    if (!valid) return;

    if (stepIndex === ONBOARDING_STEPS.length - 1) {
      await finalizeSetup();
      return;
    }

    setStepIndex((i) => i + 1);
  };

  const openCurrencyPicker = useCallback(() => setShowCurrencyPicker(true), []);
  const closeCurrencyPicker = useCallback(() => setShowCurrencyPicker(false), []);

  const renderStepContent = () => {
    switch (currentStep.id) {
      case 'welcome':
        return <WelcomeStep />;
      case 'profile':
        return (
          <ProfileStep
            currency={currency}
            onOpenCurrencyPicker={openCurrencyPicker}
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
                <TouchableOpacity style={styles.headerBackButton} onPress={() => setStepIndex((i) => i - 1)} activeOpacity={0.9}>
                  <MaterialCommunityIcons name="chevron-left" size={18} color={colors.text} />
                </TouchableOpacity>
              ) : (
                <View style={styles.headerBackPlaceholder} />
              )}

              <Text style={styles.brand}>Keeep<Text style={{ color: colors.primary }}>.</Text></Text>

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
              <Text style={styles.eyebrow}>{currentStep.eyebrow}</Text>
              <Text style={styles.stepTitle}>{currentStep.title}</Text>
              <Text style={styles.stepSubtitle}>{currentStep.subtitle}</Text>
            </View>

            <View style={styles.contentCard}>{renderStepContent()}</View>
          </ScrollView>

          <View style={styles.footer}>
            <Button
              title={stepIndex === ONBOARDING_STEPS.length - 1 ? 'Launch Keeep' : 'Continue'}
              onPress={handleContinue}
              size="lg"
              isLoading={isPending}
              style={styles.primaryAction}
            />
          </View>
        </KeyboardAvoidingView>
      </FormProvider>

      <CurrencyPickerModal
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
        title="Stay on track"
        confirmLabel="Enable reminders"
        cancelLabel="Not now"
        destructive={false}
        message="Get a gentle nudge at 8:00 PM to log your daily transactions. You can change this anytime in Settings."
        onConfirm={handleEnableReminders}
      />
    </SafeAreaView>
  );
});
