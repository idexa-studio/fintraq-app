import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/src/lib/query-keys';
import { invalidateLedger } from '@/src/utils/query';
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
    onSuccess: () => invalidateLedger(queryClient),
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<api.InsertCategory> }) =>
      api.updateCategory(id, data),
    onSuccess: (_, { id }) => invalidateLedger(queryClient),
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteCategory,
    onSuccess: () => invalidateLedger(queryClient),
  });
};
