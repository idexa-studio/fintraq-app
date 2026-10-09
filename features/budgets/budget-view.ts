/** A budget as the screens draw it: what it limits, the limit, and what this month has used. */
export type BudgetView = {
  id: number;
  /** The category it limits, or null for the budget over all spending. */
  category: { name: string; icon: string; color: number } | null;
  currency: string;
  /** This month's limit, rollover included. */
  limit: number;
  spent: number;
};
