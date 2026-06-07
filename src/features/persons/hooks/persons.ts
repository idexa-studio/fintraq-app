import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../lib/query-keys';
import { invalidateAll } from '../../../utils/query';
import * as api from '../api/persons';

export const usePersons = () =>
  useQuery({
    queryKey: QUERY_KEYS.persons.lists(),
    queryFn: api.getPersons,
  });

export const usePersonById = (id: number | null) =>
  useQuery({
    queryKey: QUERY_KEYS.persons.detail(id ?? 0),
    queryFn: () => api.getPersonById(id!),
    enabled: id !== null,
  });

export const usePersonWithStats = (id: number | null, currency?: string) =>
  useQuery({
    queryKey: [...QUERY_KEYS.persons.detail(id ?? 0), 'stats', currency],
    queryFn: () => api.getPersonWithStats(id!, currency),
    enabled: id !== null,
  });

export const usePersonsCount = () =>
  useQuery({
    queryKey: [...QUERY_KEYS.persons.all, 'count'],
    queryFn: api.getPersonsCount,
  });

export const useTransactionsByPerson = (personId: number | null) =>
  useQuery({
    queryKey: QUERY_KEYS.persons.txByPerson(personId ?? 0),
    queryFn: () => api.getTransactionsByPerson(personId!),
    enabled: personId !== null,
  });

export const useCreatePerson = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createPerson,
    onSuccess: () =>
      invalidateAll(queryClient, QUERY_KEYS.persons.all, QUERY_KEYS.dashboard.all),
  });
};

export const useUpdatePerson = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: api.UpdatePersonData }) =>
      api.updatePerson(id, data),
    onSuccess: (_, { id }) =>
      invalidateAll(
        queryClient,
        QUERY_KEYS.persons.all,
        QUERY_KEYS.persons.detail(id),
        QUERY_KEYS.dashboard.all,
      ),
  });
};

export const useDeletePerson = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deletePerson,
    onSuccess: () =>
      invalidateAll(
        queryClient,
        QUERY_KEYS.persons.all,
        QUERY_KEYS.transactions.all,
        QUERY_KEYS.dashboard.all,
      ),
  });
};
