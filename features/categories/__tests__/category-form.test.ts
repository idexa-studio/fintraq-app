import type { Category } from '@/data/repositories/categories';
import { blockerOf, categoriesOfKind, draftOf, isChanged, kindsOf, newDraft, payloadOf, toggleKind } from '@/features/categories/category-form';
import { OFFERED_COLORS } from '@/shared/contracts/pickers';
import { toDbColor } from '@/shared/format/color';

const GREEN = OFFERED_COLORS[0]!.hex;
const category = (over: Partial<Category>) => ({ id: 1, name: 'Food', type: 'DR', icon: 'fork', color: toDbColor(GREEN), isSystem: false, ...over }) as Category;
const draft = (over = {}) => ({ ...newDraft('DR', GREEN), name: 'Food', ...over });

describe('category form rules', () => {
  it('reads the kinds a category is stored for, in the usual order', () => {
    expect(kindsOf(category({ type: 'CR,DR' }))).toEqual(['DR', 'CR']);
    expect(kindsOf(category({ type: 'TR' }))).toEqual(['TR']);
  });

  it('adds and removes a kind without disturbing the order', () => {
    expect(toggleKind(['DR'], 'TR')).toEqual(['DR', 'TR']);
    expect(toggleKind(['DR', 'TR'], 'CR')).toEqual(['DR', 'CR', 'TR']);
    expect(toggleKind(['DR', 'CR'], 'DR')).toEqual(['CR']);
  });

  it('needs a name of two characters and at least one kind', () => {
    expect(blockerOf(draft({ name: ' a' }))).toBe('name');
    expect(blockerOf(draft({ kinds: [] }))).toBe('kind');
    expect(blockerOf(draft())).toBeNull();
  });

  it('stores the kinds together as every version has', () => {
    expect(payloadOf(draft({ name: ' Food ', kinds: ['CR', 'DR'], icon: 'pizza' }))).toEqual({ name: 'Food', type: 'DR,CR', icon: 'pizza', color: toDbColor(GREEN) });
  });

  it('reads a category back into the form unchanged', () => {
    const read = draftOf(category({ type: 'DR,CR' }));
    expect(read).toEqual({ name: 'Food', kinds: ['DR', 'CR'], icon: 'fork', color: GREEN });
    expect(isChanged(read, read)).toBe(false);
    expect(isChanged({ ...read, kinds: ['DR'] }, read)).toBe(true);
  });

  it('lists a kind\'s own categories by name and the built-in ones apart', () => {
    const all = [category({ id: 1, name: 'Rent' }), category({ id: 2, name: 'Coffee', type: 'DR,CR' }), category({ id: 3, name: 'Salary', type: 'CR' }), category({ id: 4, name: 'Others', type: 'CR,DR,TR', isSystem: true }), category({ id: 5, name: 'Uncategorized', type: 'ALL', isSystem: true })];
    const expense = categoriesOfKind(all, 'DR');
    expect(expense.own.map((c) => c.id)).toEqual([2, 1]);
    expect(expense.builtIn.map((c) => c.id)).toEqual([4, 5]);
    expect(categoriesOfKind(all, 'TR').own).toEqual([]);
  });
});
