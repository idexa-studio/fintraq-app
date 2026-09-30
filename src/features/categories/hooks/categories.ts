import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/src/lib/query-keys';
import { afterLedgerWrite } from '@/src/lib/after-ledger-write';
import * as api from '@/src/features/categories/api/categories';

export const useCategories = () => {
  return useQuery({
    queryKey: QUERY_KEYS.categories.lists(),
    queryFn: api.getCategories,
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createCategory,
    onSuccess: () => afterLedgerWrite(queryClient),
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<api.InsertCategory> }) =>
      api.updateCategory(id, data),
    onSuccess: (_, { id }) => afterLedgerWrite(queryClient),
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteCategory,
    onSuccess: () => afterLedgerWrite(queryClient),
  });
};
