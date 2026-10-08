import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/data/query-keys';
import { afterLedgerWrite } from '@/platform/notifications/after-ledger-write';
import * as api from '@/data/repositories/accounts';

export const useAccounts = () => {
  return useQuery({
    queryKey: QUERY_KEYS.accounts.lists(),
    queryFn: api.getAccounts,
  });
};

export const useAccount = (id: number | undefined) => {
  return useQuery({
    queryKey: id != null ? QUERY_KEYS.accounts.detail(id) : [...QUERY_KEYS.accounts.details(), 'disabled'],
    queryFn: () => api.getAccountById(id as number),
    enabled: id != null,
  });
};

export const useCreateAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createAccount,
    onSuccess: () => afterLedgerWrite(queryClient),
  });
};

export const useUpdateAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: api.UpdateAccountData }) =>
      api.updateAccount(id, data),
    onSuccess: (_, { id }) => afterLedgerWrite(queryClient),
  });
};

export const useDeleteAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteAccount,
    onSuccess: () => afterLedgerWrite(queryClient),
  });
};
