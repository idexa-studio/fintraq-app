import { OnboardingStepDefinition } from './types';

export const ONBOARDING_STEPS: OnboardingStepDefinition[] = [
  {
    id: 'welcome',
    eyebrow: 'Getting started',
    title: 'Build your finance cockpit.',
    subtitle: 'A calm setup flow with complete defaults and clean account bootstrap.',
  },
  {
    id: 'setup_choice',
    eyebrow: 'Setup mode',
    title: 'How would you like to start?',
    subtitle: 'Start with a fresh workspace or restore an existing Google Drive backup.',
  },
  {
    id: 'profile',
    eyebrow: 'Your profile',
    title: 'Tell us about you.',
    subtitle: 'Set your name and default currency to personalise your workspace.',
  },
  {
    id: 'backup_setup',
    eyebrow: 'Cloud Sync & Safety',
    title: 'Automate your backup.',
    subtitle: 'Optionally connect Google Drive for automatic daily background backups.',
  },
];
