import type { UserProfile } from '@/shared/settings/profile';

/** The longest name the profile takes. Names saved by the shipped app are no longer. */
export const NAME_MAX = 30;

export const APPEARANCES = ['system', 'light', 'dark'] as const satisfies readonly UserProfile['theme'][];

/** A name as it is saved: trimmed, single spaces. Empty is allowed: the name is optional. */
export const cleanName = (name: string): string => name.trim().replace(/\s+/g, ' ').slice(0, NAME_MAX);

/** The saved "HH:mm" as an hour and a minute. Anything unreadable is eight in the evening, the default. */
export function reminderTimeOf(saved: string): { hour: number; minute: number } {
  const [hour, minute] = saved.split(':').map(Number);
  const valid = Number.isInteger(hour) && Number.isInteger(minute) && hour! >= 0 && hour! < 24 && minute! >= 0 && minute! < 60;
  return valid ? { hour: hour!, minute: minute! } : { hour: 20, minute: 0 };
}

/** An hour and a minute as the profile saves them: 24-hour "HH:mm". */
export const reminderTimeText = ({ hour, minute }: { hour: number; minute: number }): string => `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

/** Today at that time, for writing the time in the phone's own style. */
export function reminderDate(saved: string, now: Date = new Date()): Date {
  const { hour, minute } = reminderTimeOf(saved);
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);
}
