import type { StepState } from '@/design';

/**
 * Home's first steps for someone new. Every step is read from the records and settings, so it
 * ticks itself off whichever screen it was done from. Pure, for testing.
 */

export type GettingStartedStepId = 'account' | 'transaction' | 'reminder' | 'secondAccount' | 'backup';
export type GettingStartedStep = { id: GettingStartedStepId; state: StepState };

export type GettingStartedInput = {
  accountCount: number;
  transactionCount: number;
  reminderOn: boolean;
  /** Backing up to Google Drive is part of Pro, so only a Pro user is given it as a step. */
  isPro: boolean;
  autoBackupOn: boolean;
};

/** Past this many transactions the user is established; an app update must not greet them with first steps. */
export const ESTABLISHED_TRANSACTIONS = 10;

/** The steps in the order they are offered: done ones ticked, the next one current, the rest waiting. */
export function gettingStartedSteps(input: GettingStartedInput): GettingStartedStep[] {
  const done: [GettingStartedStepId, boolean][] = [
    ['account', input.accountCount > 0],
    ['transaction', input.transactionCount > 0],
    ['reminder', input.reminderOn],
    ['secondAccount', input.accountCount > 1],
    ...(input.isPro ? ([['backup', input.autoBackupOn]] as [GettingStartedStepId, boolean][]) : []),
  ];
  const next = done.find(([, isDone]) => !isDone)?.[0];
  return done.map(([id, isDone]) => ({ id, state: isDone ? 'done' : id === next ? 'current' : 'upcoming' }));
}

/** Shown until every step is done, it is hidden by hand, or the user has a history. */
export function showsGettingStarted(steps: readonly GettingStartedStep[], transactionCount: number, dismissed: boolean): boolean {
  return !dismissed && transactionCount < ESTABLISHED_TRANSACTIONS && steps.some((step) => step.state !== 'done');
}

export type HomePrompt = 'backup' | 'pro';

export type HomePromptInput = {
  /** Pro and the backup account have both been read. */
  resolved: boolean;
  isPro: boolean;
  backupConnected: boolean;
  transactionCount: number;
};

/** Only after someone has used the app: a prompt on an empty Home has nothing to protect. */
export const PROMPT_FROM_TRANSACTIONS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;
/** How long each prompt stays away once dismissed, as in the shipped app. */
export const PROMPT_COOLDOWN_MS: Record<HomePrompt, number> = { backup: 14 * DAY_MS, pro: 3 * DAY_MS };
export const BACKUP_PROMPT_COOLDOWN_MS = PROMPT_COOLDOWN_MS.backup;

/**
 * The one prompt Home may show, ignoring cooldowns: Pro for a free user, backup for a Pro user
 * with no Drive connected. Connecting Drive needs Pro, so a free user is never offered something
 * they cannot finish.
 */
export function chooseHomePrompt(input: HomePromptInput): HomePrompt | null {
  if (!input.resolved || input.transactionCount < PROMPT_FROM_TRANSACTIONS) return null;
  if (!input.isPro) return 'pro';
  return input.backupConnected ? null : 'backup';
}

export const isCoolingDown = (dismissedAt: string | null, now: number, cooldownMs: number): boolean => {
  const last = Number.parseInt(dismissedAt ?? '', 10);
  return Number.isFinite(last) && now - last < cooldownMs;
};
