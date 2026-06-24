import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../lib/query-keys';
import { invalidateAll } from '../../../utils/query';
import * as api from '../api/loans';

export const useLoans = (type?: api.LoanType) =>
  useQuery({
    queryKey: type ? QUERY_KEYS.loans.list(type) : QUERY_KEYS.loans.lists(),
    queryFn: () => api.getLoans(type),
  });

export const useLoansByPerson = (personId: number | null) =>
  useQuery({
    queryKey: QUERY_KEYS.loans.byPerson(personId ?? 0),
    queryFn: () => api.getLoansByPerson(personId!),
    enabled: personId !== null,
  });

export const useLoanWithStats = (id: number | null) =>
  useQuery({
    queryKey: QUERY_KEYS.loans.detail(id ?? 0),
    queryFn: () => api.getLoanWithStats(id!),
    enabled: id !== null,
  });

export const useLoanRepayments = (loanId: number | null) =>
  useQuery({
    queryKey: [...QUERY_KEYS.loans.detail(loanId ?? 0), 'repayments'],
    queryFn: () => api.getLoanRepayments(loanId!),
    enabled: loanId !== null,
  });

export const useLoansSummary = (currency: string) =>
  useQuery({
    queryKey: QUERY_KEYS.loans.summary(currency),
    queryFn: () => api.getLoansSummary(currency),
    staleTime: 30_000,
  });

export const useLoansCount = () =>
  useQuery({
    queryKey: [...QUERY_KEYS.loans.all, 'count'],
    queryFn: api.getLoansCount,
  });

const LOAN_INVALIDATION_KEYS = (queryClient: ReturnType<typeof useQueryClient>) =>
  invalidateAll(
    queryClient,
    QUERY_KEYS.loans.all,
    QUERY_KEYS.transactions.all,
    QUERY_KEYS.accounts.all,
    QUERY_KEYS.dashboard.all,
    QUERY_KEYS.persons.all,
  );

export const useCreateLoan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ data, txPayload }: {
      data: Omit<api.InsertLoan, 'categoryId'> & { categoryId?: number };
      txPayload: { categoryId?: number; note: string; datetime: string };
    }) => api.createLoan(data as any, txPayload),
    onSuccess: () => LOAN_INVALIDATION_KEYS(queryClient),
  });
};

export const useUpdateLoan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: api.UpdateLoanData }) =>
      api.updateLoan(id, data),
    onSuccess: (_, { id }) =>
      invalidateAll(queryClient, QUERY_KEYS.loans.all, QUERY_KEYS.loans.detail(id), QUERY_KEYS.dashboard.all),
  });
};

export const useMarkLoanRepaid = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.markLoanRepaid(id),
    onSuccess: () => LOAN_INVALIDATION_KEYS(queryClient),
  });
};

export const useDeleteLoan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteLoan,
    onSuccess: () => LOAN_INVALIDATION_KEYS(queryClient),
  });
};

export const useAddRepayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      loanId: number;
      loanType: api.LoanType;
      personId: number | null;
      accountId: number;
      categoryId?: number;
      amount: number;
      datetime: string;
      note: string;
    }) => api.addRepayment(payload),
    onSuccess: () => LOAN_INVALIDATION_KEYS(queryClient),
  });
};
