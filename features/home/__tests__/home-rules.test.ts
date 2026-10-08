import { balanceMakeup, firstName, monthShape } from '@/features/home/home-rules';

const account = (id: number, balance: number) => ({ id, name: `Account ${id}`, balance, color: 0 });

describe('home rules', () => {
  it('draws only money held, largest first, and still names what owes', () => {
    const makeup = balanceMakeup([account(1, 100), account(2, -40), account(3, 900), account(4, 0)]);
    expect(makeup.parts.map((a) => a.id)).toEqual([3, 1]);
    expect(makeup.named.map((a) => a.id)).toEqual([3, 1, 2, 4]);
    expect(makeup.more).toBe(0);
  });

  it('counts the accounts it has no room to name', () => {
    const makeup = balanceMakeup([1, 2, 3, 4, 5].map((id) => account(id, id * 10)), 3);
    expect(makeup.named.map((a) => a.id)).toEqual([5, 4, 3]);
    expect(makeup.more).toBe(2);
  });

  it('reads a month with something kept', () => {
    expect(monthShape(1000, 650)).toEqual({ whole: 1000, spent: 650, kept: 350, reading: 'kept', keptPercent: 35 });
  });

  it('reads the months with nothing kept', () => {
    expect(monthShape(0, 0).reading).toBe('nothing');
    expect(monthShape(0, 50)).toMatchObject({ reading: 'onlySpending', whole: 50, spent: 50, kept: 0 });
    expect(monthShape(100, 100).reading).toBe('spentAll');
    expect(monthShape(100, 150)).toMatchObject({ reading: 'spentMore', whole: 150, kept: 0, keptPercent: 0 });
  });

  it('takes the first word of a name', () => {
    expect(firstName('  Sarah Mitchell ')).toBe('Sarah');
    expect(firstName('')).toBe('');
  });
});
