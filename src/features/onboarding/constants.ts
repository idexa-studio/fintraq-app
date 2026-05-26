import { OnboardingStepDefinition } from './types';

export const ONBOARDING_STEPS: OnboardingStepDefinition[] = [
  {
    id: 'welcome',
    eyebrow: 'FINTRACKER SETUP',
    title: 'Build your finance cockpit.',
    subtitle: 'A calm setup flow with complete defaults and clean account bootstrap.',
  },
  {
    id: 'profile',
    eyebrow: 'PROFILE',
    title: 'Who is driving this ledger?',
    subtitle: 'Your name becomes the holder default and personal context in the app.',
  },
  {
    id: 'currency',
    eyebrow: 'DEFAULT CURRENCY',
    title: 'Pick your currency.',
    subtitle: 'We\'ll create a cash wallet in this currency to get you started.',
  },
];
