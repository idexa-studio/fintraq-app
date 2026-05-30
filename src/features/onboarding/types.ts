export type OnboardingStepId = 'welcome' | 'profile';

export type OnboardingStepDefinition = {
  id: OnboardingStepId;
  eyebrow: string;
  title: string;
  subtitle: string;
};

export type OnboardingFormValues = {
  name: string;
};
