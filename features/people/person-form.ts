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

/** A person with what stands between you in one currency: positive when they owe you, negative when you owe them. */
export type PersonBalance = { id: number; name: string; color: number; net: number; /** An open loan with them is past its due date. */ overdue: boolean };

type OpenLoan = { personId: number | null; type: 'lend' | 'borrow'; currency: string; outstanding: number; computedStatus: string };

/**
 * What each person owes you or is owed, in one currency. Only loans count:
 * money lent and not yet repaid is owed to you, money borrowed and not yet
 * repaid is owed by you. Ordinary payments are not debts (paying the rent
 * does not mean owing the landlord), so they are left out.
 */
export function balancesOf(people: readonly Pick<Person, 'id' | 'name' | 'color'>[], loans: readonly OpenLoan[], currency: string): PersonBalance[] {
  const net = new Map<number, number>();
  const overdue = new Set<number>();
  for (const loan of loans) {
    if (loan.personId === null || loan.currency !== currency || loan.computedStatus === 'repaid') continue;
    net.set(loan.personId, (net.get(loan.personId) ?? 0) + (loan.type === 'lend' ? loan.outstanding : -loan.outstanding));
    if (loan.computedStatus === 'overdue') overdue.add(loan.personId);
  }
  return people.map((person) => ({ id: person.id, name: person.name, color: person.color, net: net.get(person.id) ?? 0, overdue: overdue.has(person.id) }));
}

/** Where things stand with someone. */
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
