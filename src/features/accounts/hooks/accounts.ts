import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../lib/query-keys';
import { invalidateAll } from '../../../utils/query';
import * as api from '../api/accounts';

export const useAccounts = () => {
  return useQuery({
    queryKey: QUERY_KEYS.accounts.lists(),
    queryFn: api.getAccounts,
  });
};

export const useCreateAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createAccount,
    onSuccess: () => invalidateAll(queryClient,
      QUERY_KEYS.accounts.all,
      QUERY_KEYS.transactions.all,
      QUERY_KEYS.dashboard.all,
    ),
  });
};

export const useUpdateAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: api.UpdateAccountData }) =>
      api.updateAccount(id, data),
    onSuccess: (_, { id }) => invalidateAll(queryClient,
      QUERY_KEYS.accounts.all,
      QUERY_KEYS.accounts.detail(id),
      QUERY_KEYS.transactions.all,
      QUERY_KEYS.dashboard.all,
    ),
  });
};

export const useDeleteAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteAccount,
    onSuccess: () => invalidateAll(queryClient,
      QUERY_KEYS.accounts.all,
      QUERY_KEYS.transactions.all,
      QUERY_KEYS.dashboard.all,
    ),
  });
};
