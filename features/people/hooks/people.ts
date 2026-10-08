import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/data/query-keys';
import { afterLedgerWrite } from '@/platform/notifications/after-ledger-write';
import * as api from '@/data/repositories/people';
import { getDashboardPersons } from '@/data/repositories/summaries';

export const usePersons = () =>
  useQuery({
    queryKey: QUERY_KEYS.persons.lists(),
    queryFn: api.getPersons,
  });

export const usePersonById = (id: number | null) =>
  useQuery({
    queryKey: QUERY_KEYS.persons.detail(id ?? 0),
    // Someone who is gone reads as null: a query may not answer undefined.
    queryFn: async () => (await api.getPersonById(id!)) ?? null,
    enabled: id !== null,
  });

export const usePersonWithStats = (id: number | null, currency?: string) =>
  useQuery({
    queryKey: [...QUERY_KEYS.persons.detail(id ?? 0), 'stats', currency],
    queryFn: async () => (await api.getPersonWithStats(id!, currency)) ?? null,
    enabled: id !== null,
  });

export const usePersonsCount = () =>
  useQuery({
    queryKey: [...QUERY_KEYS.persons.all, 'count'],
    queryFn: api.getPersonsCount,
  });

export const useCreatePerson = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createPerson,
    onSuccess: () =>
      afterLedgerWrite(queryClient),
  });
};

export const useUpdatePerson = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: api.UpdatePersonData }) =>
      api.updatePerson(id, data),
    onSuccess: (_, { id }) =>
      afterLedgerWrite(queryClient),
  });
};

export const useDeletePerson = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deletePerson,
    onSuccess: () =>
      afterLedgerWrite(queryClient),
  });
};

/** Everyone, each with what stands between you in one currency: those with a balance first. */
export const usePeopleWithBalances = (currency: string) =>
  useQuery({
    queryKey: [...QUERY_KEYS.dashboard.topPersons(currency), 'everyone'],
    queryFn: () => getDashboardPersons(currency, Number.POSITIVE_INFINITY),
  });
