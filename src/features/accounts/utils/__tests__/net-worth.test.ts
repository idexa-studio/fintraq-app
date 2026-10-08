import type { Account } from '@/data/repositories/accounts';
import { netWorthByCurrency } from '@/src/features/accounts/utils/net-worth';

const account = (id: number, currency: string, balance: number) => ({ id, currency, balance }) as Account;

describe('netWorthByCurrency', () => {
  it('keeps currencies apart and puts the default first', () => {
    const result = netWorthByCurrency([account(1, 'EUR', 50), account(2, 'USD', 100), account(3, 'USD', 20)], 'USD');
    expect(result.map((g) => g.currency)).toEqual(['USD', 'EUR']);
    expect(result[0]).toMatchObject({ assets: 120, debts: 0, net: 120 });
    expect(result[0]!.accounts.map((a) => a.id)).toEqual([2, 3]);
  });

  it('separates debts from assets', () => {
    const [usd] = netWorthByCurrency([account(1, 'USD', 500), account(2, 'USD', -200)], 'USD');
    expect(usd).toMatchObject({ assets: 500, debts: 200, net: 300 });
  });

  it('is empty without accounts', () => {
    expect(netWorthByCurrency([], 'USD')).toEqual([]);
  });
});
