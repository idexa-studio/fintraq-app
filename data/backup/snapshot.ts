/**
 * Backup file format and the pure mapping from a parsed backup to SQL rows. Version 2 added
 * `budgets`; a version 1 file has no such key and restores with no budgets.
 *
 * No I/O and no React Native imports, so the restore mapping is unit-tested against every
 * historical shape. Compatibility contract: backups written by any earlier release must keep
 * restoring — camelCase (Drizzle) and snake_case (raw SQL) column keys, and the singular/legacy
 * table keys (`person`, `seeder_state`, …) are all accepted.
 */

export type SqlValue = string | number | null;

export type BackupMetadata = {
  version: number;
  appVersion: string;
  timestamp: string;
  checksum: string;
  /** `budgets` is counted from format version 2. */
  counts: { accounts: number; categories: number; persons: number; loans: number; payments: number; budgets?: number };
};

export type PersonBackupRow = {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  designation?: string | null;
  company?: string | null;
  color?: number | null;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
};

export type AccountBackupRow = {
  id: number;
  name: string;
  holderName?: string | null;
  holder_name?: string | null;
  accountNumber?: string | null;
  account_number?: string | null;
  icon?: string | null;
  accountType?: string | null;
  account_type?: string | null;
  color?: number | null;
  isDefault?: boolean | number | null;
  is_default?: boolean | number | null;
  currency?: string | null;
  balance?: number | null;
  income?: number | null;
  expense?: number | null;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
};

export type CategoryBackupRow = {
  id: number;
  name: string;
  icon?: string | null;
  color?: number | null;
  type?: string | null;
  isSystem?: boolean | number | null;
  is_system?: boolean | number | null;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
};

export type LoanBackupRow = {
  id: number;
  personId?: number | null;
  person_id?: number | null;
  type?: string | null;
  principal?: number | null;
  currency?: string | null;
  accountId?: number | null;
  account_id?: number | null;
  categoryId?: number | null;
  category_id?: number | null;
  dueDate?: string | null;
  due_date?: string | null;
  note?: string | null;
  status?: string | null;
  emiReminderEnabled?: boolean | number | null;
  emi_reminder_enabled?: boolean | number | null;
  emiReminderDay?: number | null;
  emi_reminder_day?: number | null;
  emiReminderTime?: string | null;
  emi_reminder_time?: string | null;
  emiNotificationIds?: string | null;
  emi_notification_ids?: string | null;
  dueReminderEnabled?: boolean | number | null;
  due_reminder_enabled?: boolean | number | null;
  dueReminderDaysBefore?: number | null;
  due_reminder_days_before?: number | null;
  /** Added with migration 0008; absent from older backups. */
  dueReminderTime?: string | null;
  due_reminder_time?: string | null;
  dueNotificationId?: string | null;
  due_notification_id?: string | null;
  dueNotificationIds?: string | null;
  due_notification_ids?: string | null;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
};

export type PaymentBackupRow = {
  id: number;
  accountId?: number | null;
  account_id?: number | null;
  categoryId?: number | null;
  category_id?: number | null;
  toAccountId?: number | null;
  to_account_id?: number | null;
  personId?: number | null;
  person_id?: number | null;
  loanId?: number | null;
  loan_id?: number | null;
  amount?: number | null;
  type?: string | null;
  datetime?: string | null;
  note?: string | null;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
};

/** Added with migration 0009 (format version 2). */
export type BudgetBackupRow = {
  id: number;
  categoryId?: number | null;
  category_id?: number | null;
  currency?: string | null;
  monthlyLimit?: number | null;
  monthly_limit?: number | null;
  rollover?: boolean | number | null;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
};

export type SeederBackupRow = {
  id: number;
  name: string;
  executedAt?: string;
  executed_at?: string;
};

export type BackupData = {
  accounts: AccountBackupRow[];
  categories: CategoryBackupRow[];
  persons: PersonBackupRow[];
  loans: LoanBackupRow[];
  payments: PaymentBackupRow[];
  /** Absent from backups made before budgets existed. */
  budgets?: BudgetBackupRow[];
  seederState: SeederBackupRow[];
};

export type BackupPackagePayload<Profile = unknown> = {
  metadata: BackupMetadata;
  profile?: Profile | null;
  data: BackupData;
};

/** Table keys written by older releases — still accepted on restore. */
type LegacyBackupData = Partial<BackupData> & {
  person?: PersonBackupRow[];
  account?: AccountBackupRow[];
  category?: CategoryBackupRow[];
  loan?: LoanBackupRow[];
  payment?: PaymentBackupRow[];
  seeder_state?: SeederBackupRow[];
  seeder?: SeederBackupRow[];
};

export type BackupValidationErrorCode = 'corrupted' | 'empty' | 'drive_error';

export class BackupValidationError extends Error {
  constructor(
    public readonly code: BackupValidationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'BackupValidationError';
  }
}

type DriveErrorPayload = { error?: { message?: string } };

/** Parses and structurally validates a downloaded backup. Checksum is verified separately. */
export function parseBackupPackage(json: string): BackupPackagePayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new BackupValidationError('corrupted', 'Backup is not valid JSON');
  }
  if (typeof parsed !== 'object' || parsed === null) {
    throw new BackupValidationError('corrupted', 'Backup is not an object');
  }
  const driveError = (parsed as DriveErrorPayload).error;
  if (driveError) {
    throw new BackupValidationError('drive_error', `Google Drive download error: ${driveError.message || 'Failed to fetch backup file'}`);
  }
  const pkg = parsed as Partial<BackupPackagePayload>;
  if (!pkg.metadata || typeof pkg.data !== 'object' || pkg.data === null) {
    throw new BackupValidationError('corrupted', 'Backup is missing metadata or data');
  }
  return pkg as BackupPackagePayload;
}

export type TableInsert = { table: string; columns: readonly string[]; rows: SqlValue[][] };

// Insertion order satisfies foreign keys; deletion runs children first.
export const RESTORE_DELETE_ORDER = ['budgets', 'payments', 'loans', 'persons', 'categories', 'accounts', 'seeder_state'] as const;

const orNull = <T extends SqlValue>(value: T | undefined): T | null => (value === undefined ? null : value);

function toBooleanInt(value: unknown, fallback = 0): number {
  if (value === true || value === 1 || value === '1' || value === 'true' || value === 'TRUE') return 1;
  if (value === false || value === 0 || value === '0' || value === 'false' || value === 'FALSE') return 0;
  return fallback;
}

/** A reference to a row that isn't in the backup becomes NULL, matching the schema's `set null`. */
function validRef(id: number | null | undefined, valid: ReadonlySet<number>): number | null {
  return id && valid.has(id) ? id : null;
}

/**
 * Maps a validated backup to ordered table inserts. `now` stamps rows that predate timestamps.
 * Throws BackupValidationError('empty') rather than let a restore wipe data for nothing.
 */
export function buildRestorePlan(data: BackupData, now: string): TableInsert[] {
  const legacy = data as LegacyBackupData;
  const persons = legacy.persons || legacy.person || [];
  const accounts = legacy.accounts || legacy.account || [];
  const categories = legacy.categories || legacy.category || [];
  const loans = legacy.loans || legacy.loan || [];
  const payments = legacy.payments || legacy.payment || [];
  const budgets = legacy.budgets || [];
  const seeders = legacy.seederState || legacy.seeder_state || legacy.seeder || [];

  if (persons.length + accounts.length + categories.length + loans.length + payments.length === 0) {
    throw new BackupValidationError('empty', 'Backup contains no rows');
  }

  const personIds = new Set(persons.map((p) => p.id));
  const accountIds = new Set(accounts.map((a) => a.id));
  const loanIds = new Set(loans.map((l) => l.id));
  const categoryIds = new Set(categories.map((c) => c.id));

  const created = (r: { createdAt?: string; created_at?: string }) => r.createdAt ?? r.created_at ?? now;
  const updated = (r: { updatedAt?: string; updated_at?: string }) => r.updatedAt ?? r.updated_at ?? now;

  const plan: TableInsert[] = [
    {
      table: 'persons',
      columns: ['id', 'name', 'email', 'phone', 'designation', 'company', 'color', 'created_at', 'updated_at'],
      rows: persons.map((r) => [
        r.id,
        r.name ?? '',
        orNull(r.email),
        orNull(r.phone),
        orNull(r.designation),
        orNull(r.company),
        r.color ?? 0,
        created(r),
        updated(r),
      ]),
    },
    {
      table: 'accounts',
      columns: ['id', 'name', 'holderName', 'accountNumber', 'icon', 'account_type', 'color', 'isDefault', 'currency', 'balance', 'income', 'expense', 'created_at', 'updated_at'],
      rows: accounts.map((r) => [
        r.id,
        r.name ?? '',
        r.holderName ?? r.holder_name ?? r.name ?? '',
        r.accountNumber ?? r.account_number ?? '',
        r.icon ?? 'building',
        r.accountType ?? r.account_type ?? 'bank',
        r.color ?? 0,
        toBooleanInt(r.isDefault ?? r.is_default),
        r.currency ?? 'USD',
        r.balance ?? 0,
        r.income ?? 0,
        r.expense ?? 0,
        created(r),
        updated(r),
      ]),
    },
    {
      table: 'categories',
      columns: ['id', 'name', 'icon', 'color', 'type', 'is_system', 'created_at', 'updated_at'],
      rows: categories.map((r) => [
        r.id,
        r.name ?? '',
        r.icon ?? 'grid',
        r.color ?? 0,
        r.type ?? 'DR',
        toBooleanInt(r.isSystem ?? r.is_system),
        created(r),
        updated(r),
      ]),
    },
    {
      table: 'loans',
      columns: [
        'id', 'person_id', 'type', 'principal', 'currency', 'account_id', 'category_id', 'due_date', 'note', 'status',
        'emi_reminder_enabled', 'emi_reminder_day', 'emi_reminder_time', 'emi_notification_ids',
        'due_reminder_enabled', 'due_reminder_days_before', 'due_reminder_time', 'due_notification_id', 'created_at', 'updated_at',
      ],
      rows: loans.map((r) => [
        r.id,
        validRef(r.personId ?? r.person_id, personIds),
        r.type ?? 'lend',
        r.principal ?? 0,
        r.currency ?? 'USD',
        orNull(r.accountId ?? r.account_id),
        orNull(r.categoryId ?? r.category_id),
        orNull(r.dueDate ?? r.due_date),
        r.note ?? '',
        r.status ?? 'active',
        toBooleanInt(r.emiReminderEnabled ?? r.emi_reminder_enabled),
        orNull(r.emiReminderDay ?? r.emi_reminder_day),
        orNull(r.emiReminderTime ?? r.emi_reminder_time),
        orNull(r.emiNotificationIds ?? r.emi_notification_ids),
        toBooleanInt(r.dueReminderEnabled ?? r.due_reminder_enabled),
        orNull(r.dueReminderDaysBefore ?? r.due_reminder_days_before),
        orNull(r.dueReminderTime ?? r.due_reminder_time),
        orNull(r.dueNotificationId ?? r.due_notification_id ?? r.dueNotificationIds ?? r.due_notification_ids),
        created(r),
        updated(r),
      ]),
    },
    {
      table: 'payments',
      columns: ['id', 'account_id', 'category_id', 'to_account_id', 'person_id', 'loan_id', 'amount', 'type', 'datetime', 'note', 'created_at', 'updated_at'],
      rows: payments.map((r) => [
        r.id,
        orNull(r.accountId ?? r.account_id),
        orNull(r.categoryId ?? r.category_id),
        validRef(r.toAccountId ?? r.to_account_id, accountIds),
        validRef(r.personId ?? r.person_id, personIds),
        validRef(r.loanId ?? r.loan_id, loanIds),
        r.amount ?? 0,
        r.type ?? 'DR',
        r.datetime ?? now,
        r.note ?? '',
        created(r),
        updated(r),
      ]),
    },
    {
      table: 'budgets',
      columns: ['id', 'category_id', 'currency', 'monthly_limit', 'rollover', 'created_at', 'updated_at'],
      // No category means the budget over all spending, so a budget whose category is missing from
      // the backup is dropped, not set to null: it would otherwise turn into a limit on everything.
      rows: budgets
        .filter((r) => (r.categoryId ?? r.category_id ?? null) === null || categoryIds.has((r.categoryId ?? r.category_id) as number))
        .map((r) => [r.id, orNull(r.categoryId ?? r.category_id), r.currency ?? 'USD', r.monthlyLimit ?? r.monthly_limit ?? 0, toBooleanInt(r.rollover), created(r), updated(r)]),
    },
    {
      table: 'seeder_state',
      columns: ['id', 'name', 'executed_at'],
      rows: seeders.map((r) => [r.id, orNull(r.name), r.executedAt ?? r.executed_at ?? now]),
    },
  ];

  return plan.filter((t) => t.rows.length > 0);
}

export function insertSql({ table, columns }: Pick<TableInsert, 'table' | 'columns'>): string {
  return `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`;
}
