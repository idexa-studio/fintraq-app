import type { Account } from '@/data/repositories/accounts';
import type { Category } from '@/data/repositories/categories';
import { repaymentType } from '@/data/repositories/ledger';
import { useAccounts } from '@/features/accounts';
import { useCategories } from '@/features/categories';
import { useLoanWithStats } from '@/features/loans';
import { usePersons } from '@/features/people';
import { useCreateTransaction, useDeleteTransaction, useTransactionById, useUpdateTransaction } from '@/features/transactions/hooks/transactions';
import { blockerOf, categoriesFor, defaultAccountId, defaultCategoryId, payloadOf, typeOfKind } from '@/features/transactions/transaction-form';
import type { Blocker, FormState, Kind } from '@/features/transactions/transaction-form';
import { transferDestinations } from '@/shared/calc/transfers';
import { parseAmountInput } from '@/shared/format/amount';
import type { TransactionType } from '@/shared/types';
import { useMemo, useState } from 'react';

export type TransactionFormOptions = {
  /** Editing this transaction; leave out to add a new one. */
  transactionId?: number | null;
  /** The kind a new entry starts as. Ignored when editing. */
  initialKind?: Kind;
  /** The account a new entry starts on, e.g. when opened from that account. Ignored when editing. */
  initialAccountId?: number;
};

/**
 * Everything the entry screen needs: the values being edited, what they may
 * be changed to, why saving is not possible yet, and saving itself.
 */
export function useTransactionForm({ transactionId, initialKind = 'expense', initialAccountId }: TransactionFormOptions) {
  const editing = transactionId != null;
  const accountsQuery = useAccounts();
  const categoriesQuery = useCategories();
  const peopleQuery = usePersons();
  const existingQuery = useTransactionById(editing ? transactionId : null);
  const create = useCreateTransaction();
  const update = useUpdateTransaction();
  const remove = useDeleteTransaction();

  const accounts = useMemo<Account[]>(() => accountsQuery.data ?? [], [accountsQuery.data]);
  const categories = useMemo<Category[]>(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
  const people = useMemo(() => peopleQuery.data ?? [], [peopleQuery.data]);
  const existing = editing ? (existingQuery.data ?? null) : null;

  // A loan-linked payment is the loan's principal or one of its repayments. The loan owns its
  // type and category, so neither can be changed here; a repayment is also capped by what was owed.
  const loanLinked = existing?.loanId != null;
  const { data: loan } = useLoanWithStats(existing?.loanId ?? null);
  const isRepayment = !!loan && !!existing && existing.type === repaymentType(loan.type);

  const [type, setTypeState] = useState<TransactionType>(typeOfKind(initialKind));
  const [amountText, setAmountText] = useState('');
  const [accountId, setAccountId] = useState<number | null>(null);
  const [toAccountId, setToAccountId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [personId, setPersonId] = useState<number | null>(null);
  const [when, setWhen] = useState(() => new Date());
  const [note, setNote] = useState('');
  /** True once the user has changed anything, so leaving can ask before discarding it. */
  const [touched, setTouched] = useState(false);

  // Editing: start from the saved transaction, once it has loaded.
  const [readFrom, setReadFrom] = useState<typeof existing>(null);
  if (existing && readFrom !== existing) {
    setReadFrom(existing);
    setTypeState(existing.type);
    setAmountText(String(existing.amount));
    setAccountId(existing.accountId);
    setToAccountId(existing.toAccountId ?? null);
    setCategoryId(existing.categoryId);
    setPersonId(existing.personId ?? null);
    setWhen(new Date(existing.datetime));
    setNote(existing.note ?? '');
  }

  // Keep the account valid: start on the preferred one, and recover if the chosen one disappears.
  if (accounts.length === 0) {
    if (accountId !== null) setAccountId(null);
  } else if (accountId === null || !accounts.some((a) => a.id === accountId)) {
    setAccountId(defaultAccountId(accounts, initialAccountId));
  }

  const offeredCategories = useMemo(() => categoriesFor(categories, type), [categories, type]);

  // Keep the category valid for the type, except on a loan payment, which keeps the loan's own.
  if (!loanLinked) {
    if (offeredCategories.length === 0) {
      if (categoryId !== null) setCategoryId(null);
    } else if (categoryId === null || !offeredCategories.some((c) => c.id === categoryId)) {
      setCategoryId(defaultCategoryId(offeredCategories));
    }
  }

  const account = accounts.find((a) => a.id === accountId) ?? null;
  // The same rule Home uses for its Transfer tile: same currency, compatible kinds, never itself.
  const destinations = useMemo(() => (type === 'TR' && account ? transferDestinations(account, accounts) : []), [type, account, accounts]);

  // Drop a destination that is no longer possible, e.g. after changing the source account.
  if (type === 'TR' && toAccountId != null && !destinations.some((a) => a.id === toAccountId)) setToAccountId(null);

  const amount = parseAmountInput(amountText) ?? undefined;
  const state: FormState = { type, amount, accountId, toAccountId, categoryId, personId, when, note };
  const repaymentLimit = isRepayment && loan && existing ? loan.outstanding + existing.amount : undefined;
  const saving = create.isPending || update.isPending;
  const blocker: Blocker | null = blockerOf(state, repaymentLimit);

  const touch = <T,>(set: (value: T) => void) => (value: T) => {
    setTouched(true);
    set(value);
  };

  /** Saves the entry. Resolves to the id of a newly added transaction, or null after an edit. */
  const save = async (fallbackNote: string): Promise<number | null> => {
    const payload = payloadOf(state, categories.find((c) => c.id === categoryId)?.name, fallbackNote);
    if (existing) {
      await update.mutateAsync({ id: existing.id, data: payload });
      return null;
    }
    const created = await create.mutateAsync(payload);
    return created?.id ?? null;
  };

  return {
    editing,
    loading: editing && (existingQuery.isPending || accountsQuery.isPending || categoriesQuery.isPending),
    missing: editing && !existingQuery.isPending && !existing,
    loanLinked,
    isRepayment,
    loan: loan ?? null,
    repaymentLimit,

    type,
    setType: touch((next: TransactionType) => {
      setTypeState(next);
      // A destination chosen for a transfer means nothing for the other kinds, and may not suit a new source.
      setToAccountId(null);
    }),
    amountText,
    amount,
    setAmountText: touch(setAmountText),
    account,
    setAccountId: touch(setAccountId),
    toAccount: accounts.find((a) => a.id === toAccountId) ?? null,
    setToAccountId: touch(setToAccountId),
    category: categories.find((c) => c.id === categoryId) ?? null,
    setCategoryId: touch(setCategoryId),
    person: people.find((p) => p.id === personId) ?? null,
    setPersonId: touch(setPersonId),
    when,
    setWhen: touch(setWhen),
    note,
    setNote: touch(setNote),

    accounts,
    destinations,
    offeredCategories,
    people,

    touched,
    blocker,
    saving,
    save,
    undo: (id: number) => remove.mutateAsync(id),
  };
}

export type TransactionForm = ReturnType<typeof useTransactionForm>;
