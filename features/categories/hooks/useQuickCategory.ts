import { QUERY_KEYS } from '@/data/query-keys';
import { NAME_MAX, NAME_MIN, newDraft, payloadOf } from '@/features/categories/category-form';
import { useCategories, useCreateCategory } from '@/features/categories/hooks/categories';
import { OFFERED_COLORS } from '@/shared/contracts/pickers';
import { colorNumberToHex } from '@/shared/format/color';
import type { TransactionType } from '@/shared/types';
import { useQueryClient } from '@tanstack/react-query';

/**
 * A category made from a name alone, in the middle of recording something. It gets the plain mark
 * and a colour no other category has yet; both can be changed later in Categories.
 */
export function useQuickCategory() {
  const queryClient = useQueryClient();
  const { data: categories = [] } = useCategories();
  const create = useCreateCategory();

  return {
    nameMax: NAME_MAX,
    isNameOk: (name: string) => name.trim().length >= NAME_MIN,
    adding: create.isPending,
    /** Resolves with the new category's id once the list of categories holds it. */
    add: async (name: string, kind: TransactionType): Promise<number> => {
      const taken = new Set(categories.map((category) => colorNumberToHex(category.color).toLowerCase()));
      const free = OFFERED_COLORS.find((offered) => !taken.has(offered.hex.toLowerCase())) ?? OFFERED_COLORS[categories.length % OFFERED_COLORS.length]!;
      const made = await create.mutateAsync({ ...payloadOf({ ...newDraft(kind, free.hex), name: name.trim() }), isSystem: false });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories.lists() });
      return made!.id;
    },
  };
}
