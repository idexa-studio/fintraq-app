import { hasPossibleTransfer, transferDestinations } from '@/shared/calc/transfers';

const account = (id: number, currency: string, accountType: string | null = 'bank') => ({ id, currency, accountType });

describe('transferDestinations', () => {
  it('offers same-currency, compatible accounts other than the source', () => {
    const accounts = [account(1, 'USD', 'bank'), account(2, 'USD', 'savings'), account(3, 'EUR', 'bank')];
    expect(transferDestinations(accounts[0]!, accounts).map((a) => a.id)).toEqual([2]);
  });

  it('offers nothing from an account type that cannot send', () => {
    const accounts = [account(1, 'USD', 'credit_card'), account(2, 'USD', 'bank')];
    expect(transferDestinations(accounts[0]!, accounts)).toEqual([]);
  });
});

describe('hasPossibleTransfer', () => {
  it('is false with one account', () => {
    expect(hasPossibleTransfer([account(1, 'USD')])).toBe(false);
  });

  it('is false when the accounts are in different currencies', () => {
    expect(hasPossibleTransfer([account(1, 'USD'), account(2, 'EUR')])).toBe(false);
  });

  it('is false when no account type can send to another', () => {
    expect(hasPossibleTransfer([account(1, 'USD', 'credit_card'), account(2, 'USD', 'loan')])).toBe(false);
  });

  it('is true when two accounts share a currency and are compatible', () => {
    expect(hasPossibleTransfer([account(1, 'USD', 'cash'), account(2, 'USD', 'bank'), account(3, 'EUR')])).toBe(true);
  });
});
