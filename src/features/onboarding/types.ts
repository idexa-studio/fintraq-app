export type OnboardingStepId = 'welcome' | 'profile' | 'account' | 'first_entry' | 'backup_setup';

export type OnboardingStepDefinition = {
  id: OnboardingStepId;
};

export type OnboardingFormValues = {
  name: string;
};

/** The first account, set up in onboarding and created when setup finishes. */
export type OnboardingAccountDraft = {
  type: 'cash' | 'bank' | 'ewallet' | 'credit_card';
  name: string;
  /** Typed balance, parsed with parseAmountInput. */
  balance: string;
  /** False until the user types a name, so picking a type can suggest one. */
  nameEdited: boolean;
};

/** The optional first transaction, recorded right after the first account. */
export type OnboardingEntryDraft = {
  type: 'DR' | 'CR';
  amount: string;
  /** A default category's name (see FIRST_ENTRY_CATEGORIES). */
  category: string;
  note: string;
};
