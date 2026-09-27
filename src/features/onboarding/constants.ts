import { OnboardingStepDefinition } from './types';

// Fresh vs restore is decided on the welcome screen (primary vs secondary
// action), so the happy path is three screens: welcome → you → backup.
export const ONBOARDING_STEPS: OnboardingStepDefinition[] = [
  { id: 'welcome' },
  { id: 'profile' },
  { id: 'backup_setup' },
];
