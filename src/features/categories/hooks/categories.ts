import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../lib/query-keys';
import { invalidateAll } from '../../../utils/query';
import * as api from '../api/categories';

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
    onSuccess: () => invalidateAll(queryClient,
      QUERY_KEYS.categories.all,
      QUERY_KEYS.transactions.all,
      QUERY_KEYS.dashboard.all,
    ),
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<api.InsertCategory> }) =>
      api.updateCategory(id, data),
    onSuccess: (_, { id }) => invalidateAll(queryClient,
      QUERY_KEYS.categories.all,
      QUERY_KEYS.categories.detail(id),
      QUERY_KEYS.transactions.all,
      QUERY_KEYS.dashboard.all,
    ),
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteCategory,
    onSuccess: () => invalidateAll(queryClient,
      QUERY_KEYS.categories.all,
      QUERY_KEYS.transactions.all,
      QUERY_KEYS.dashboard.all,
    ),
  });
};
