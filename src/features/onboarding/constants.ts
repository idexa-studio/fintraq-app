import { OnboardingStepDefinition } from './types';

// Fresh vs restore is decided on the welcome screen (primary vs secondary
// action). The fresh path sets the app up by using it: you → your first
// account → your first entry (skippable) → backup.
export const ONBOARDING_STEPS: OnboardingStepDefinition[] = [
  { id: 'welcome' },
  { id: 'profile' },
  { id: 'account' },
  { id: 'first_entry' },
  { id: 'backup_setup' },
];

/** Account types offered in onboarding — the everyday four; the rest live in the account form. */
export const ONBOARDING_ACCOUNT_TYPES = ['cash', 'bank', 'ewallet', 'credit_card'] as const;

/** Default categories offered as one-tap picks for the first entry, most common first. */
export const FIRST_ENTRY_CATEGORIES = {
  DR: ['Groceries', 'Dining Out', 'Coffee', 'Fuel', 'Shopping', 'Rent'],
  CR: ['Salary', 'Freelance', 'Gifts', 'Refunds'],
} as const;
