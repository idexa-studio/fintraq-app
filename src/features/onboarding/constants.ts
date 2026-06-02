import { OnboardingStepDefinition } from './types';

export const ONBOARDING_STEPS: OnboardingStepDefinition[] = [
  {
    id: 'welcome',
    eyebrow: 'Getting started',
    title: 'Build your finance cockpit.',
    subtitle: 'A calm setup flow with complete defaults and clean account bootstrap.',
  },
  {
    id: 'profile',
    eyebrow: 'Your profile',
    title: 'Tell us about you.',
    subtitle: 'Set your name and default currency to personalise your workspace.',
  },
];
