import { NAME_MAX, NAME_MIN, newDraft, payloadOf } from '@/features/people/person-form';
import { useCreatePerson, usePersons } from '@/features/people/hooks/people';
import { OFFERED_COLORS } from '@/shared/contracts/pickers';
import { colorNumberToHex } from '@/shared/format/color';

/**
 * A person made from a name alone, in the middle of recording something: a loan cannot be
 * recorded without one, and leaving the form to make one would lose what was typed. They get a
 * colour no one has yet; their phone, email and work can be added later in People.
 */
export function useQuickPerson() {
  const { data: people = [] } = usePersons();
  const create = useCreatePerson();

  return {
    nameMax: NAME_MAX,
    isNameOk: (name: string) => name.trim().length >= NAME_MIN,
    adding: create.isPending,
    /** Resolves with the new person's id. */
    add: async (name: string): Promise<number> => {
      const taken = new Set(people.map((person) => colorNumberToHex(person.color).toLowerCase()));
      const free = OFFERED_COLORS.find((offered) => !taken.has(offered.hex.toLowerCase())) ?? OFFERED_COLORS[people.length % OFFERED_COLORS.length]!;
      const made = await create.mutateAsync(payloadOf({ ...newDraft(free.hex), name: name.trim() }));
      return made!.id;
    },
  };
}
