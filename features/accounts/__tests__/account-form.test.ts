import type { Account } from '@/data/repositories/accounts';
import { blockerOf, createPayloadOf, draftOf, isChanged, maskedNumber, newDraft, updatePayloadOf } from '@/features/accounts/account-form';
import { accountsByType } from '@/features/accounts/account-list';
import { OFFERED_COLORS } from '@/shared/contracts/pickers';
import { toDbColor } from '@/shared/format/color';

const [GREEN, , , , , RED] = OFFERED_COLORS.map((color) => color.hex) as [string, string, string, string, string, string];

const draft = (over = {}) => ({ ...newDraft('USD', GREEN), name: 'Everyday', ...over });
const account = (over: Partial<Account>) => ({ id: 1, name: 'A', accountType: 'bank', isDefault: false, holderName: '', accountNumber: '', color: toDbColor(GREEN), currency: 'USD', ...over }) as Account;

describe('account form rules', () => {
  it('needs a name of two characters', () => {
    expect(blockerOf(draft({ name: ' a ' }), false)).toBe('name');
    expect(blockerOf(draft(), false)).toBeNull();
  });

  it('takes an empty opening balance as zero and refuses one that is negative or not a number', () => {
    expect(blockerOf(draft({ openingBalance: '' }), false)).toBeNull();
    expect(blockerOf(draft({ openingBalance: '-5' }), false)).toBe('balance');
    expect(blockerOf(draft({ openingBalance: 'abc' }), false)).toBe('balance');
    expect(createPayloadOf(draft({ openingBalance: '120.50' })).balance).toBe(120.5);
    expect(createPayloadOf(draft()).balance).toBe(0);
  });

  it('does not look at the opening balance when editing', () => {
    expect(blockerOf(draft({ openingBalance: 'abc' }), true)).toBeNull();
  });

  it('writes a new account as every version has: trimmed, not default, the fixed icon', () => {
    expect(createPayloadOf(draft({ name: ' Everyday ', type: 'cash', holderName: ' Me ' }))).toEqual({
      name: 'Everyday', holderName: 'Me', accountNumber: '', balance: 0, currency: 'USD', color: toDbColor(GREEN), icon: 'building', accountType: 'cash', isDefault: false,
    });
  });

  it('never changes the balance or the kind on edit, and the currency only while unused', () => {
    const changed = draft({ currency: 'EUR', type: 'cash' as const });
    expect(updatePayloadOf(changed, false)).toEqual({ name: 'Everyday', holderName: '', accountNumber: '', color: toDbColor(GREEN), currency: 'EUR' });
    expect(updatePayloadOf(changed, true)).toEqual({ name: 'Everyday', holderName: '', accountNumber: '', color: toDbColor(GREEN) });
  });

  it('reads an account back into the form, dropping the old "N/A" number', () => {
    const read = draftOf(account({ name: 'Card', accountType: null, accountNumber: 'N/A', color: toDbColor(RED) }));
    expect(read).toMatchObject({ name: 'Card', type: 'bank', accountNumber: '', color: RED });
    expect(isChanged(read, read)).toBe(false);
    expect(isChanged({ ...read, name: 'Card 2' }, read)).toBe(true);
  });

  it('shows only the end of an account number', () => {
    expect(maskedNumber('1234567890')).toBe('•••• 7890');
    expect(maskedNumber('N/A')).toBeNull();
    expect(maskedNumber('')).toBeNull();
  });
});

describe('accountsByType', () => {
  it('groups by kind in the usual order, the default first, then by name', () => {
    const groups = accountsByType([
      account({ id: 1, name: 'Zed', accountType: 'cash' }),
      account({ id: 2, name: 'Beta', accountType: 'bank' }),
      account({ id: 3, name: 'Alpha', accountType: 'bank' }),
      account({ id: 4, name: 'Main', accountType: 'bank', isDefault: true }),
      account({ id: 5, name: 'Old', accountType: null }),
    ]);
    expect(groups.map((g) => g.type)).toEqual(['bank', 'cash']);
    expect(groups[0]!.accounts.map((a) => a.id)).toEqual([4, 3, 2, 5]);
  });
});
