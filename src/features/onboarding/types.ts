export type OnboardingStepId = 'welcome' | 'profile' | 'backup_setup';

export type OnboardingStepDefinition = {
  id: OnboardingStepId;
};

export type OnboardingFormValues = {
  name: string;
};
