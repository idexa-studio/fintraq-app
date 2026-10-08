import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/data/query-keys';
import { afterLedgerWrite } from '@/src/lib/after-ledger-write';
import * as api from '@/data/repositories/loans';

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
    // A deleted or unknown loan resolves to null; React Query rejects undefined.
    queryFn: async () => (await api.getLoanWithStats(id!)) ?? null,
    enabled: id !== null && Number.isFinite(id),
  });

export const useLoanRepayments = (loanId: number | null) =>
  useQuery({
    queryKey: [...QUERY_KEYS.loans.detail(loanId ?? 0), 'repayments'],
    queryFn: () => api.getLoanRepayments(loanId!),
    enabled: loanId !== null && Number.isFinite(loanId),
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

export const useCreateLoan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ data, txPayload }: {
      data: api.CreateLoanData;
      txPayload: { categoryId?: number; note: string; datetime: string };
    }) => api.createLoan(data, txPayload),
    onSuccess: () => afterLedgerWrite(queryClient),
  });
};

export const useUpdateLoan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: api.UpdateLoanData }) =>
      api.updateLoan(id, data),
    onSuccess: (_, { id }) =>
      afterLedgerWrite(queryClient),
  });
};

export const useMarkLoanRepaid = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.markLoanRepaid(id),
    onSuccess: () => afterLedgerWrite(queryClient),
  });
};

export const useDeleteLoan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteLoan,
    onSuccess: () => afterLedgerWrite(queryClient),
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
    onSuccess: () => afterLedgerWrite(queryClient),
  });
};
