import { OFFERED_COLORS } from '@/shared/contracts/pickers';
import { accountStack, dayPart, distinctColors, firstName, looksSame, monthShape } from '@/features/home/home-rules';

const account = (id: number, balance: number) => ({ id, balance });

describe('home rules', () => {
  it('puts the default account in front and the largest holding nearest behind it', () => {
    const stack = accountStack([account(1, 100), { ...account(2, 50), isDefault: true }, account(3, 900), account(4, -40)]);
    expect(stack.front?.id).toBe(2);
    expect(stack.behind.map((a) => a.id)).toEqual([4, 1, 3]);
    expect(stack.more).toBe(0);
  });

  it('puts the largest holding in front when no account is the default', () => {
    expect(accountStack([account(1, 100), account(3, 900)]).front?.id).toBe(3);
  });

  it('counts the accounts it has no room to stack', () => {
    const stack = accountStack([1, 2, 3, 4, 5, 6, 7].map((id) => account(id, id * 10)), 5);
    expect(stack.front?.id).toBe(7);
    expect(stack.behind.map((a) => a.id)).toEqual([3, 4, 5, 6]);
    expect(stack.more).toBe(2);
  });

  it('stacks nothing when there are no accounts', () => {
    expect(accountStack([])).toEqual({ behind: [], front: null, more: 0 });
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

  it('greets by the part of the day', () => {
    expect(dayPart(5)).toBe('morning');
    expect(dayPart(11)).toBe('morning');
    expect(dayPart(12)).toBe('afternoon');
    expect(dayPart(16)).toBe('afternoon');
    expect(dayPart(17)).toBe('evening');
    expect(dayPart(2)).toBe('evening');
  });

  // Offered colours stand in for saved ones; a near match is the same colour nudged a little on every channel.
  const nudged = (hex: string) => `#${(parseInt(hex.slice(1), 16) + 0x060606).toString(16).padStart(6, '0')}`;
  const pick = (name: string) => OFFERED_COLORS.find((color) => color.name === name)!.hex;
  const [lilac, blue, orange, green] = [pick('purple'), pick('blue'), pick('orange'), pick('forest')];
  const lilacish = nudged(lilac);

  it('tells a near match from a different colour', () => {
    expect(looksSame(lilac, lilacish)).toBe(true);
    expect(looksSame(lilac, blue)).toBe(false);
  });

  it('keeps each colour and replaces only one that looks like an earlier one', () => {
    expect(distinctColors([blue, lilac, orange, lilacish], [lilac, blue, green])).toEqual([blue, lilac, orange, green]);
  });

  it('repeats a colour only when no spare is left', () => {
    expect(distinctColors([lilac, lilacish], [lilac])).toEqual([lilac, lilacish]);
  });
});
