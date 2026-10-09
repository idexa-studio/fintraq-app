import type { Person } from '@/data/repositories/people';
import { balancesOf, blockerOf, draftOf, hasDetails, initialsOf, isChanged, newDraft, payloadOf, peopleByStanding, standingOf } from '@/features/people/person-form';
import { OFFERED_COLORS } from '@/shared/contracts/pickers';
import { toDbColor } from '@/shared/format/color';

const GREEN = OFFERED_COLORS[0]!.hex;
const draft = (over = {}) => ({ ...newDraft(GREEN), name: 'Sam Lee', ...over });

describe('person form rules', () => {
  it('needs a name of two characters', () => {
    expect(blockerOf(draft({ name: ' s ' }))).toBe('name');
    expect(blockerOf(draft())).toBeNull();
  });

  it('accepts no email, and refuses one that is not an address', () => {
    expect(blockerOf(draft({ email: '  ' }))).toBeNull();
    expect(blockerOf(draft({ email: 'sam@' }))).toBe('email');
    expect(blockerOf(draft({ email: ' sam@example.com ' }))).toBeNull();
  });

  it('saves empty details as nothing, and the role as the designation', () => {
    expect(payloadOf(draft({ name: ' Sam Lee ', role: ' Plumber ', phone: ' ' }))).toEqual({
      name: 'Sam Lee', phone: null, email: null, designation: 'Plumber', company: null, color: toDbColor(GREEN),
    });
  });

  it('reads a person back into the form unchanged', () => {
    const person = { id: 1, name: 'Sam Lee', phone: null, email: 'sam@example.com', designation: 'Plumber', company: null, color: toDbColor(GREEN) } as Person;
    const read = draftOf(person);
    expect(read).toEqual({ name: 'Sam Lee', phone: '', email: 'sam@example.com', role: 'Plumber', company: '', color: GREEN });
    expect(hasDetails(read)).toBe(true);
    expect(hasDetails(draft())).toBe(false);
    expect(isChanged(read, read)).toBe(false);
    expect(isChanged({ ...read, phone: '1' }, read)).toBe(true);
  });

  it('draws a person by up to two initials', () => {
    expect(initialsOf('Sam Lee')).toBe('SL');
    expect(initialsOf('  madonna ')).toBe('m');
    expect(initialsOf('Ana Maria de Souza')).toBe('AM');
    expect(initialsOf('')).toBe('');
  });
});

describe('where things stand', () => {
  it('reads the net as owed to you, owed by you, or settled', () => {
    expect(standingOf(10)).toBe('owesYou');
    expect(standingOf(-10)).toBe('youOwe');
    expect(standingOf(0)).toBe('settled');
  });

  it('counts only open loans as owed, either way, and never ordinary payments', () => {
    const people = [{ id: 1, name: 'Tom', color: 0 }, { id: 2, name: 'Ana', color: 0 }, { id: 3, name: 'Li', color: 0 }];
    const loan = (personId: number | null, type: 'lend' | 'borrow', outstanding: number, over = {}) => ({ personId, type, outstanding, currency: 'USD', computedStatus: 'active', ...over });
    const balances = balancesOf(people, [
      loan(2, 'lend', 100), loan(2, 'lend', 50), loan(2, 'borrow', 30),
      loan(3, 'borrow', 80),
      loan(3, 'lend', 999, { computedStatus: 'repaid' }),
      loan(3, 'lend', 999, { currency: 'EUR' }),
      loan(null, 'lend', 999),
    ], 'USD');
    // Tom is only ever paid (rent, say): nothing is owed either way.
    expect(balances).toEqual([{ id: 1, name: 'Tom', color: 0, net: 0, overdue: false }, { id: 2, name: 'Ana', color: 0, net: 120, overdue: false }, { id: 3, name: 'Li', color: 0, net: -80, overdue: false }]);
  });

  it('marks someone with an open loan past its due date', () => {
    const people = [{ id: 1, name: 'Tom', color: 0 }, { id: 2, name: 'Ana', color: 0 }];
    const balances = balancesOf(people, [
      { personId: 1, type: 'lend', outstanding: 40, currency: 'USD', computedStatus: 'overdue' },
      { personId: 2, type: 'lend', outstanding: 40, currency: 'USD', computedStatus: 'active' },
    ], 'USD');
    expect(balances.map((b) => b.overdue)).toEqual([true, false]);
  });

  it('groups people by standing, largest first, with what each group adds up to', () => {
    const groups = peopleByStanding([
      { name: 'Zed', net: 0 }, { name: 'Amy', net: 0 }, { name: 'Bo', net: 20 }, { name: 'Cy', net: 50 }, { name: 'Di', net: -30 },
    ]);
    expect(groups.map((g) => g.standing)).toEqual(['owesYou', 'youOwe', 'settled']);
    expect(groups[0]).toMatchObject({ total: 70, people: [{ name: 'Cy' }, { name: 'Bo' }] });
    expect(groups[1]).toMatchObject({ total: 30 });
    expect(groups[2]!.people.map((p) => p.name)).toEqual(['Amy', 'Zed']);
  });

  it('leaves out a standing nobody is in', () => {
    expect(peopleByStanding([{ name: 'Amy', net: 0 }]).map((g) => g.standing)).toEqual(['settled']);
  });
});
