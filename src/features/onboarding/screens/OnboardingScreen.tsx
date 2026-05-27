import { Ionicons } from '@expo/vector-icons';
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
import { BlurBackground } from '@/src/components/ui/BlurBackground';
import { Button } from '@/src/components/ui/Button';
import { ConfirmDialog } from '@/src/components/ui/ConfirmDialog';
import { getDeviceCurrencyCode } from '@/src/constants/currency';
import { useCreateAccount } from '@/src/features/accounts/hooks/accounts';
import { useCreateCategory } from '@/src/features/categories/hooks/categories';
import { CurrencyStep } from '@/src/features/onboarding/components/CurrencyStep';
import { ProfileStep } from '@/src/features/onboarding/components/ProfileStep';
import { WelcomeStep } from '@/src/features/onboarding/components/WelcomeStep';
import { ONBOARDING_STEPS } from '@/src/features/onboarding/constants';
import { createOnboardingStyles } from '@/src/features/onboarding/styles';
import { OnboardingFormValues } from '@/src/features/onboarding/types';
import { toDbColor } from '@/src/utils/format';
import type { TransactionType } from '@/src/types';
import { useOnboarding } from '@/src/providers/OnboardingProvider';
import { useSettings } from '@/src/providers/SettingsProvider';
import { useTheme } from '@/src/providers/ThemeProvider';
import { NotificationService } from '@/src/services/notification.service';

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
    router.replace('/(main)');
  }, [updateProfile, router]);

  const handleSkipReminders = useCallback(() => {
    setShowReminderDialog(false);
    router.replace('/(main)');
  }, [router]);

  const validateStep = async () => {
    if (currentStep.id === 'profile') return trigger('name');
    return true;
  };

  const seedCategories = async () => {
    const defaults: { name: string; icon: string; color: number; type: TransactionType }[] = [
      // ── Income ──────────────────────────────────────────────────────
      { name: 'Salary',        icon: 'cash-outline',          color: toDbColor('#6BD498'), type: 'CR' },
      { name: 'Freelance',     icon: 'sparkles-outline',      color: toDbColor('#B8D641'), type: 'CR' },
      { name: 'Sales',         icon: 'cart-outline',          color: toDbColor('#FCD34D'), type: 'CR' },
      { name: 'Dividends',     icon: 'trending-up-outline',   color: toDbColor('#63A4FF'), type: 'CR' },
      { name: 'Interests',     icon: 'add-circle-outline',    color: toDbColor('#A78BFA'), type: 'CR' },
      { name: 'Gifts',         icon: 'gift-outline',          color: toDbColor('#F9A8D4'), type: 'CR' },
      { name: 'Refunds',       icon: 'refresh-outline',       color: toDbColor('#6EE7B7'), type: 'CR' },
      { name: 'Other Income',  icon: 'wallet-outline',        color: toDbColor('#94A3B8'), type: 'CR' },

      // ── Housing & Utilities ──────────────────────────────────────────
      { name: 'Rent',          icon: 'business-outline',      color: toDbColor('#FF8A65'), type: 'DR' },
      { name: 'Mortgage',      icon: 'home-outline',          color: toDbColor('#F87171'), type: 'DR' },
      { name: 'Electricity',   icon: 'flash-outline',         color: toDbColor('#FBBF24'), type: 'DR' },
      { name: 'Water',         icon: 'water-outline',         color: toDbColor('#60A5FA'), type: 'DR' },
      { name: 'Internet',      icon: 'wifi-outline',          color: toDbColor('#818CF8'), type: 'DR' },
      { name: 'Phone',         icon: 'phone-portrait-outline',color: toDbColor('#A5B4FC'), type: 'DR' },
      { name: 'Maintenance',   icon: 'build-outline',         color: toDbColor('#9CA3AF'), type: 'DR' },

      // ── Food & Drink ────────────────────────────────────────────────
      { name: 'Groceries',     icon: 'basket-outline',        color: toDbColor('#F5C451'), type: 'DR' },
      { name: 'Dining Out',    icon: 'restaurant-outline',    color: toDbColor('#FB923C'), type: 'DR' },
      { name: 'Delivery',      icon: 'bicycle-outline',       color: toDbColor('#F87171'), type: 'DR' },
      { name: 'Coffee',        icon: 'cafe-outline',          color: toDbColor('#C4A35A'), type: 'DR' },
      { name: 'Drinks',        icon: 'wine-outline',          color: toDbColor('#C084FC'), type: 'DR' },

      // ── Transport ───────────────────────────────────────────────────
      { name: 'Fuel',          icon: 'speedometer-outline',   color: toDbColor('#FB923C'), type: 'DR' },
      { name: 'Car Payment',   icon: 'car-outline',           color: toDbColor('#63A4FF'), type: 'DR' },
      { name: 'Public Transit',icon: 'bus-outline',           color: toDbColor('#38BDF8'), type: 'DR' },
      { name: 'Ride Share',    icon: 'car-sport-outline',     color: toDbColor('#34D399'), type: 'DR' },
      { name: 'Parking',       icon: 'locate-outline',        color: toDbColor('#94A3B8'), type: 'DR' },

      // ── Health & Wellness ───────────────────────────────────────────
      { name: 'Health',        icon: 'medkit-outline',        color: toDbColor('#F87171'), type: 'DR' },
      { name: 'Pharmacy',      icon: 'bandage-outline',       color: toDbColor('#6EE7B7'), type: 'DR' },
      { name: 'Gym',           icon: 'barbell-outline',       color: toDbColor('#4ADE80'), type: 'DR' },
      { name: 'Personal Care', icon: 'cut-outline',           color: toDbColor('#F9A8D4'), type: 'DR' },

      // ── Lifestyle & Fun ──────────────────────────────────────────────
      { name: 'Shopping',      icon: 'bag-outline',           color: toDbColor('#F472B6'), type: 'DR' },
      { name: 'Electronics',   icon: 'hardware-chip-outline', color: toDbColor('#818CF8'), type: 'DR' },
      { name: 'Subscrip.',     icon: 'repeat-outline',        color: toDbColor('#C084FC'), type: 'DR' },
      { name: 'Entertainment', icon: 'film-outline',          color: toDbColor('#FCA5A5'), type: 'DR' },
      { name: 'Travel',        icon: 'airplane-outline',      color: toDbColor('#38BDF8'), type: 'DR' },
      { name: 'Games',         icon: 'game-controller-outline', color: toDbColor('#7C3AED'), type: 'DR' },
      { name: 'Books',         icon: 'book-outline',          color: toDbColor('#D97706'), type: 'DR' },

      // ── Family & Education ──────────────────────────────────────────
      { name: 'Education',     icon: 'school-outline',        color: toDbColor('#0EA5E9'), type: 'DR' },
      { name: 'Kids',          icon: 'happy-outline',         color: toDbColor('#FCD34D'), type: 'DR' },
      { name: 'Pets',          icon: 'paw-outline',           color: toDbColor('#A3E635'), type: 'DR' },
      { name: 'Gifts given',   icon: 'heart-outline',         color: toDbColor('#FB7185'), type: 'DR' },

      // ── Finance & Taxes ─────────────────────────────────────────────
      { name: 'Loan/EMI',      icon: 'card-outline',          color: toDbColor('#EF4444'), type: 'DR' },
      { name: 'Taxes',         icon: 'document-text-outline', color: toDbColor('#6B7280'), type: 'DR' },
      { name: 'Insurance',     icon: 'shield-checkmark-outline', color: toDbColor('#4B5563'), type: 'DR' },
      { name: 'Fees',          icon: 'receipt-outline',       color: toDbColor('#94A3B8'), type: 'DR' },
      { name: 'Other',         icon: 'ellipsis-horizontal-outline', color: toDbColor('#cbd5e1'), type: 'DR' },
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
        icon: 'wallet',
        color: toDbColor('#6BD498'),
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

  const renderStepContent = () => {
    switch (currentStep.id) {
      case 'welcome':
        return <WelcomeStep />;
      case 'profile':
        return <ProfileStep />;
      case 'currency':
        return <CurrencyStep currency={currency} onCurrencyChange={setCurrency} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <BlurBackground androidOverlayOpacity="76" />

      <FormProvider {...methods}>
        <KeyboardAvoidingView style={styles.keyboardWrap} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.header}>
            <View style={styles.headerTopRow}>
              {stepIndex > 0 ? (
                <TouchableOpacity style={styles.headerBackButton} onPress={() => setStepIndex((i) => i - 1)} activeOpacity={0.9}>
                  <Ionicons name="chevron-back" size={18} color={colors.text} />
                </TouchableOpacity>
              ) : (
                <View style={styles.headerBackPlaceholder} />
              )}

              <Text style={styles.brand}>LUNO.</Text>

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
              title={stepIndex === ONBOARDING_STEPS.length - 1 ? 'Launch Luno' : 'Continue'}
              onPress={handleContinue}
              size="lg"
              isLoading={isPending}
              style={styles.primaryAction}
            />
          </View>
        </KeyboardAvoidingView>
      </FormProvider>

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
