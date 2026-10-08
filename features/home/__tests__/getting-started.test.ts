import { BACKUP_PROMPT_COOLDOWN_MS, chooseHomePrompt, gettingStartedSteps, isCoolingDown, showsGettingStarted } from '@/features/home/getting-started';
import type { GettingStartedInput } from '@/features/home/getting-started';

const fresh: GettingStartedInput = { accountCount: 1, transactionCount: 0, reminderOn: false, isPro: false, autoBackupOn: false };
const states = (input: GettingStartedInput) => gettingStartedSteps(input).map((step) => `${step.id}:${step.state}`);

describe('gettingStartedSteps', () => {
  it('ticks what is done, points at the next step and holds the rest back', () => {
    expect(states(fresh)).toEqual(['account:done', 'transaction:current', 'reminder:upcoming', 'secondAccount:upcoming']);
  });

  it('skips over a later step already done from elsewhere', () => {
    expect(states({ ...fresh, transactionCount: 2, accountCount: 2 })).toEqual(['account:done', 'transaction:done', 'reminder:current', 'secondAccount:done']);
  });

  it('gives backup as a step only to someone who can turn it on', () => {
    expect(states({ ...fresh, isPro: true }).at(-1)).toBe('backup:upcoming');
    expect(states({ ...fresh, isPro: true, autoBackupOn: true }).at(-1)).toBe('backup:done');
    expect(states(fresh).some((step) => step.startsWith('backup'))).toBe(false);
  });
});

describe('showsGettingStarted', () => {
  const steps = gettingStartedSteps(fresh);
  const allDone = gettingStartedSteps({ ...fresh, transactionCount: 1, reminderOn: true, accountCount: 2 });

  it('shows until every step is done', () => {
    expect(showsGettingStarted(steps, 0, false)).toBe(true);
    expect(showsGettingStarted(allDone, 1, false)).toBe(false);
  });

  it('stays away once hidden, and from anyone with a history', () => {
    expect(showsGettingStarted(steps, 0, true)).toBe(false);
    expect(showsGettingStarted(steps, 10, false)).toBe(false);
  });
});

describe('chooseHomePrompt', () => {
  const base = { resolved: true, isPro: true, backupConnected: false, transactionCount: 3 };

  it('offers backup to a Pro user with no Drive connected, once the app has been used', () => {
    expect(chooseHomePrompt(base)).toBe('backup');
    expect(chooseHomePrompt({ ...base, transactionCount: 2 })).toBeNull();
    expect(chooseHomePrompt({ ...base, backupConnected: true })).toBeNull();
  });

  it('offers Pro to a free user, never a backup they cannot finish, and nothing before it knows', () => {
    expect(chooseHomePrompt({ ...base, isPro: false })).toBe('pro');
    expect(chooseHomePrompt({ ...base, isPro: false, transactionCount: 2 })).toBeNull();
    expect(chooseHomePrompt({ ...base, resolved: false })).toBeNull();
  });
});

describe('isCoolingDown', () => {
  const now = 1_800_000_000_000;
  it('keeps a dismissed prompt away for its cooldown and no longer', () => {
    expect(isCoolingDown(String(now - 1000), now, BACKUP_PROMPT_COOLDOWN_MS)).toBe(true);
    expect(isCoolingDown(String(now - BACKUP_PROMPT_COOLDOWN_MS), now, BACKUP_PROMPT_COOLDOWN_MS)).toBe(false);
    expect(isCoolingDown(null, now, BACKUP_PROMPT_COOLDOWN_MS)).toBe(false);
    expect(isCoolingDown('nonsense', now, BACKUP_PROMPT_COOLDOWN_MS)).toBe(false);
  });
});
