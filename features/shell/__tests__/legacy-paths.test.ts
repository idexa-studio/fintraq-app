import { addPathFromLegacy, editPathFromLegacy, personPathFromLegacy } from '@/features/shell/legacy-paths';

describe('paths of the shipped app', () => {
  // The three launcher shortcuts 1.2.4 registers.
  it.each([
    ['DR', '/add?kind=expense'],
    ['CR', '/add?kind=income'],
    ['TR', '/add?kind=transfer'],
  ])('sends the %s shortcut to the entry screen', (type, path) => {
    expect(addPathFromLegacy({ type })).toBe(path);
  });

  it('keeps the account a new entry was opened from', () => {
    expect(addPathFromLegacy({ accountId: '7' })).toBe('/add?accountId=7');
    expect(addPathFromLegacy({ type: 'CR', accountId: '7' })).toBe('/add?kind=income&accountId=7');
  });

  it('opens the entry screen on its default for an unknown type', () => {
    expect(addPathFromLegacy({ type: 'XX' })).toBe('/add');
    expect(addPathFromLegacy({})).toBe('/add');
  });

  it('sends an edit link to the transaction, and anything unreadable home', () => {
    expect(editPathFromLegacy('42')).toBe('/transactions/42/edit');
    expect(editPathFromLegacy('abc')).toBe('/');
    expect(editPathFromLegacy(undefined)).toBe('/');
  });

  it('sends a person\'s old path to the same person, and anything unreadable to the list', () => {
    expect(personPathFromLegacy('12')).toBe('/people/12');
    expect(personPathFromLegacy('abc')).toBe('/people');
    expect(personPathFromLegacy(undefined)).toBe('/people');
  });
});
