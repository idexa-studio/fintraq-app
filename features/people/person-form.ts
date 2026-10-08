import type { InsertPerson, Person } from '@/data/repositories/people';
import { colorNumberToHex, toDbColor } from '@/shared/format/color';

export const NAME_MIN = 2;
export const NAME_MAX = 60;
export const DETAIL_MAX = 100;

export type PersonDraft = {
  name: string;
  phone: string;
  email: string;
  /** What they do, saved as their designation. */
  role: string;
  company: string;
  /** Hex, from the saved palette. */
  color: string;
};

/** Why the form cannot be saved yet. */
export type PersonBlocker = 'name' | 'email';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const newDraft = (color: string): PersonDraft => ({ name: '', phone: '', email: '', role: '', company: '', color });

export const draftOf = (person: Person): PersonDraft => ({
  name: person.name,
  phone: person.phone ?? '',
  email: person.email ?? '',
  role: person.designation ?? '',
  company: person.company ?? '',
  color: colorNumberToHex(person.color).toUpperCase(),
});

export function blockerOf(draft: PersonDraft): PersonBlocker | null {
  if (draft.name.trim().length < NAME_MIN) return 'name';
  if (draft.email.trim() && !EMAIL.test(draft.email.trim())) return 'email';
  return null;
}

/** Details left empty are saved as nothing, not as empty text. */
const orNull = (text: string): string | null => text.trim() || null;

export const payloadOf = (draft: PersonDraft): Pick<InsertPerson, 'name' | 'phone' | 'email' | 'designation' | 'company' | 'color'> => ({
  name: draft.name.trim(),
  phone: orNull(draft.phone),
  email: orNull(draft.email),
  designation: orNull(draft.role),
  company: orNull(draft.company),
  color: toDbColor(draft.color),
});

export const isChanged = (draft: PersonDraft, from: PersonDraft): boolean => (Object.keys(draft) as (keyof PersonDraft)[]).some((key) => draft[key] !== from[key]);

export const hasDetails = (draft: PersonDraft): boolean => !!(draft.phone || draft.email || draft.role || draft.company);

/** Up to two initials, for the mark a person is drawn with. */
export const initialsOf = (name: string): string => name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join('');

/** Where things stand with someone, from the net of what has passed between you. */
export type Standing = 'owesYou' | 'youOwe' | 'settled';
export const standingOf = (net: number): Standing => (net > 0 ? 'owesYou' : net < 0 ? 'youOwe' : 'settled');

/** People under where they stand, and what each group adds up to. */
export function peopleByStanding<T extends { net: number; name: string }>(people: readonly T[]): { standing: Standing; total: number; people: T[] }[] {
  return (['owesYou', 'youOwe', 'settled'] as const)
    .map((standing) => {
      const group = people.filter((person) => standingOf(person.net) === standing);
      // The largest amount first; the settled, who all stand at nothing, by name.
      const sorted = [...group].sort((a, b) => Math.abs(b.net) - Math.abs(a.net) || a.name.localeCompare(b.name));
      return { standing, total: group.reduce((sum, person) => sum + Math.abs(person.net), 0), people: sorted };
    })
    .filter((group) => group.people.length > 0);
}
