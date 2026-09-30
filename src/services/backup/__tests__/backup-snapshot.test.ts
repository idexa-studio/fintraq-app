import {
  BackupData,
  BackupValidationError,
  buildRestorePlan,
  insertSql,
  parseBackupPackage,
  TableInsert,
} from '@/src/services/backup/backup-snapshot';

const NOW = '2026-09-30T12:00:00.000Z';

const tableOf = (plan: TableInsert[], table: string) => {
  const found = plan.find((t) => t.table === table);
  if (!found) throw new Error(`no ${table} in plan`);
  return found;
};

/** Column → value for one planned row, so assertions read by column name. */
const rowOf = (plan: TableInsert[], table: string, index = 0) => {
  const t = tableOf(plan, table);
  return Object.fromEntries(t.columns.map((c, i) => [c, t.rows[index][i]]));
};

/** Shape the current release exports (Drizzle rows, camelCase). */
const currentExport: BackupData = {
  persons: [{ id: 1, name: 'Asha', email: null, phone: '123', designation: null, company: null, color: 5, createdAt: '2025-01-01', updatedAt: '2025-01-02' }],
  accounts: [
    { id: 1, name: 'Bank', holderName: 'Asha', accountNumber: '42', icon: 'building', accountType: 'bank', color: 1, isDefault: true, currency: 'INR', balance: 100, income: 150, expense: 50, createdAt: '2025-01-01', updatedAt: '2025-01-01' },
    { id: 2, name: 'Cash', holderName: 'Asha', accountNumber: '', icon: 'wallet', accountType: 'cash', color: 2, isDefault: false, currency: 'INR', balance: 0, income: 0, expense: 0, createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  ],
  categories: [{ id: 3, name: 'Food', icon: 'food', color: 4, type: 'DR', isSystem: false, createdAt: '2025-01-01', updatedAt: '2025-01-01' }],
  loans: [
    {
      id: 7, personId: 1, type: 'lend', principal: 500, currency: 'INR', accountId: 1, categoryId: 3, dueDate: null, note: 'n', status: 'active',
      emiReminderEnabled: true, emiReminderDay: 5, emiReminderTime: '09:00', emiNotificationIds: '["a"]',
      dueReminderEnabled: false, dueReminderDaysBefore: null, dueNotificationId: 'due-1', createdAt: '2025-01-01', updatedAt: '2025-01-01',
    },
  ],
  payments: [
    { id: 9, accountId: 1, categoryId: 3, toAccountId: 2, personId: 1, loanId: 7, amount: 25, type: 'TR', datetime: '2025-02-01', note: '', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  ],
  seederState: [{ id: 1, name: '001_categories', executedAt: '2025-01-01' }],
};

describe('parseBackupPackage', () => {
  it('rejects invalid JSON and non-objects as corrupted', () => {
    expect(() => parseBackupPackage('{oops')).toThrow(expect.objectContaining({ code: 'corrupted' }));
    expect(() => parseBackupPackage('42')).toThrow(expect.objectContaining({ code: 'corrupted' }));
  });

  it('recognises a Drive error body returned in place of the file', () => {
    expect(() => parseBackupPackage(JSON.stringify({ error: { message: 'File not found' } }))).toThrow(
      expect.objectContaining({ code: 'drive_error' }),
    );
  });

  it('requires metadata and data', () => {
    expect(() => parseBackupPackage(JSON.stringify({ data: {} }))).toThrow(BackupValidationError);
    expect(() => parseBackupPackage(JSON.stringify({ metadata: {} }))).toThrow(BackupValidationError);
  });

  it('accepts a well-formed package', () => {
    const pkg = parseBackupPackage(JSON.stringify({ metadata: { version: 1 }, data: currentExport }));
    expect(pkg.data.accounts).toHaveLength(2);
  });
});

describe('buildRestorePlan', () => {
  it('refuses a backup with no rows, so a restore never wipes data for nothing', () => {
    const empty: BackupData = { persons: [], accounts: [], categories: [], loans: [], payments: [], seederState: [] };
    expect(() => buildRestorePlan(empty, NOW)).toThrow(expect.objectContaining({ code: 'empty' }));
  });

  it('orders inserts so foreign keys resolve and skips empty tables', () => {
    const plan = buildRestorePlan({ ...currentExport, loans: [], payments: [] }, NOW);
    expect(plan.map((t) => t.table)).toEqual(['persons', 'accounts', 'categories', 'seeder_state']);
  });

  it('maps the current camelCase export column-for-column', () => {
    const plan = buildRestorePlan(currentExport, NOW);
    expect(rowOf(plan, 'accounts')).toEqual({
      id: 1, name: 'Bank', holderName: 'Asha', accountNumber: '42', icon: 'building', account_type: 'bank', color: 1,
      isDefault: 1, currency: 'INR', balance: 100, income: 150, expense: 50, created_at: '2025-01-01', updated_at: '2025-01-01',
    });
    expect(rowOf(plan, 'loans')).toMatchObject({
      person_id: 1, emi_reminder_enabled: 1, emi_reminder_day: 5, emi_notification_ids: '["a"]', due_reminder_enabled: 0, due_notification_id: 'due-1',
    });
    expect(rowOf(plan, 'payments')).toMatchObject({ to_account_id: 2, person_id: 1, loan_id: 7, type: 'TR' });
    expect(rowOf(plan, 'seeder_state')).toEqual({ id: 1, name: '001_categories', executed_at: '2025-01-01' });
  });

  it('restores legacy backups: singular table keys, snake_case columns, string booleans', () => {
    const legacy = {
      person: [{ id: 1, name: 'Ravi', created_at: '2024-01-01', updated_at: '2024-01-02' }],
      account: [{ id: 1, name: 'Old', holder_name: 'Ravi', account_number: '7', account_type: 'savings', is_default: '1' }],
      category: [{ id: 2, name: 'Rent', is_system: 'true' }],
      loan: [{ id: 3, person_id: 1, account_id: 1, category_id: 2, due_reminder_enabled: 'TRUE', due_notification_id: 'legacy-due' }],
      payment: [{ id: 4, account_id: 1, category_id: 2, loan_id: 3 }],
      seeder: [{ id: 1, name: 'seed', executed_at: '2024-01-01' }],
    } as unknown as BackupData;

    const plan = buildRestorePlan(legacy, NOW);
    expect(rowOf(plan, 'persons')).toMatchObject({ name: 'Ravi', color: 0, created_at: '2024-01-01', updated_at: '2024-01-02' });
    expect(rowOf(plan, 'accounts')).toMatchObject({ holderName: 'Ravi', accountNumber: '7', account_type: 'savings', isDefault: 1, currency: 'USD' });
    expect(rowOf(plan, 'categories')).toMatchObject({ is_system: 1, icon: 'grid', type: 'DR' });
    expect(rowOf(plan, 'loans')).toMatchObject({ person_id: 1, due_reminder_enabled: 1, due_notification_id: 'legacy-due', type: 'lend', status: 'active' });
    expect(rowOf(plan, 'payments')).toMatchObject({ loan_id: 3, amount: 0, type: 'DR', datetime: NOW, note: '' });
    expect(tableOf(plan, 'seeder_state').rows).toHaveLength(1);
  });

  it('accepts the older plural dueNotificationIds key', () => {
    const plan = buildRestorePlan({ ...currentExport, loans: [{ ...currentExport.loans[0], dueNotificationId: undefined, dueNotificationIds: 'old-ids' }] }, NOW);
    expect(rowOf(plan, 'loans').due_notification_id).toBe('old-ids');
  });

  it('restores the due reminder time, and leaves it null for backups made before it existed', () => {
    expect(rowOf(buildRestorePlan(currentExport, NOW), 'loans').due_reminder_time).toBeNull();
    const withTime = buildRestorePlan({ ...currentExport, loans: [{ ...currentExport.loans[0], dueReminderTime: '18:30' }] }, NOW);
    expect(rowOf(withTime, 'loans').due_reminder_time).toBe('18:30');
  });

  it('nulls references to rows missing from the backup (schema: on delete set null)', () => {
    const plan = buildRestorePlan(
      { ...currentExport, payments: [{ ...currentExport.payments[0], toAccountId: 99, personId: 98, loanId: 97 }], loans: [{ ...currentExport.loans[0], personId: 96 }] },
      NOW,
    );
    expect(rowOf(plan, 'payments')).toMatchObject({ to_account_id: null, person_id: null, loan_id: null });
    expect(rowOf(plan, 'loans').person_id).toBeNull();
  });

  it('stamps missing timestamps with the restore time', () => {
    const plan = buildRestorePlan({ ...currentExport, persons: [{ id: 1, name: 'No dates' }] }, NOW);
    expect(rowOf(plan, 'persons')).toMatchObject({ created_at: NOW, updated_at: NOW });
  });

  it('produces rows whose width matches their column list', () => {
    for (const t of buildRestorePlan(currentExport, NOW)) {
      t.rows.forEach((row) => expect(row).toHaveLength(t.columns.length));
    }
  });
});

describe('insertSql', () => {
  it('builds one placeholder per column', () => {
    expect(insertSql({ table: 't', columns: ['a', 'b', 'c'] })).toBe('INSERT INTO t (a, b, c) VALUES (?, ?, ?)');
  });
});
