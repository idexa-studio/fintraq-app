export type OnboardingStepId = 'welcome' | 'setup_choice' | 'profile' | 'backup_setup';

export type OnboardingStepDefinition = {
  id: OnboardingStepId;
};

export type OnboardingFormValues = {
  name: string;
};
