export type OnboardingStepId = 'welcome' | 'setup_choice' | 'profile' | 'backup_setup';

export type OnboardingStepDefinition = {
  id: OnboardingStepId;
  eyebrow: string;
  title: string;
  subtitle: string;
};

export type OnboardingFormValues = {
  name: string;
};
