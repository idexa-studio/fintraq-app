import { db } from '../../../db/client';
import { accounts, categories, loans, payments, persons } from '../../../db/schema';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { StorageAccessFramework } from 'expo-file-system/legacy';
import { and, count, desc, eq, gte, lte, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';
import { Platform, Alert } from 'react-native';

export interface ExportDateRange {
  startDate: Date;
  endDate: Date;
}

export interface CsvExportOptions {
  dateRange?: ExportDateRange;
  accountId?: number;
  categoryId?: number;
  type?: 'CR' | 'DR' | 'TR';
  includeLoans?: boolean;
}

interface TransactionExportRow {
  id: number;
  date: string;
  time: string;
  type: 'Income' | 'Expense' | 'Transfer';
  amount: string;
  currency: string;
  account: string;
  accountHolder: string;
  toAccount: string;
  category: string;
  linkedPerson: string;
  note: string;
  loanId: string;
}

interface LoanExportRow {
  id: number;
  createdDate: string;
  type: 'Lend' | 'Borrow';
  principal: string;
  currency: string;
  account: string;
  person: string;
  dueDate: string;
  status: string;
  note: string;
}

export class CsvExportService {
  private static readonly CSV_HEADER = [
    'Date',
    'Time',
    'Type',
    'Amount',
    'Currency',
    'Account',
    'Account Holder',
    'To Account',
    'Category',
    'Linked Person',
    'Note',
    'Loan ID',
  ].join(',');

  private static readonly LOANS_CSV_HEADER = [
    'Loan ID',
    'Created Date',
    'Type',
    'Principal',
    'Currency',
    'Account',
    'Person',
    'Due Date',
    'Status',
    'Note',
  ].join(',');

  private static escapeCsvField(field: string): string {
    if (/[",\n\r]/.test(field)) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }

  private static formatRow(row: TransactionExportRow): string {
    return [
      row.date,
      row.time,
      row.type,
      row.amount,
      row.currency,
      row.account,
      row.accountHolder,
      row.toAccount,
      row.category,
      row.linkedPerson,
      row.note,
      row.loanId,
    ].map(f => this.escapeCsvField(f)).join(',');
  }

  private static formatLoanRow(row: LoanExportRow): string {
    return [
      String(row.id),
      row.createdDate,
      row.type,
      row.principal,
      row.currency,
      row.account,
      row.person,
      row.dueDate,
      row.status,
      row.note,
    ].map(f => this.escapeCsvField(f)).join(',');
  }

  static async getTransactionCount(options: CsvExportOptions = {}): Promise<number> {
    const conditions = this.buildConditions(options);
    const result = await db
      .select({ total: count() })
      .from(payments)
      .where(conditions);
    return Number(result[0]?.total ?? 0);
  }

  private static buildConditions(options: CsvExportOptions) {
    const conditions = [];

    if (options.dateRange) {
      const startIso = options.dateRange.startDate.toISOString().split('T')[0];
      const endIso = options.dateRange.endDate.toISOString().split('T')[0];
      conditions.push(gte(payments.datetime, startIso));
      conditions.push(lte(payments.datetime, endIso));
    }

    if (options.accountId !== undefined) {
      conditions.push(
        or(
          eq(payments.accountId, options.accountId),
          sql`${payments.toAccountId} = ${options.accountId}`,
        ),
      );
    }

    if (options.categoryId !== undefined) {
      conditions.push(eq(payments.categoryId, options.categoryId));
    }

    if (options.type !== undefined) {
      conditions.push(eq(payments.type, options.type));
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
  }

  private static async fetchLoanRows(accountId?: number): Promise<LoanExportRow[]> {
    const loanAccounts = alias(accounts, 'loan_accounts');

    const rows = await db
      .select({
        id: loans.id,
        createdAt: loans.createdAt,
        type: loans.type,
        principal: loans.principal,
        currency: loans.currency,
        dueDate: loans.dueDate,
        status: loans.status,
        note: loans.note,
        account: { name: loanAccounts.name },
        person: { name: persons.name },
      })
      .from(loans)
      .innerJoin(loanAccounts, eq(loans.accountId, loanAccounts.id))
      .leftJoin(persons, eq(loans.personId, persons.id))
      .where(accountId !== undefined ? eq(loans.accountId, accountId) : undefined)
      .orderBy(desc(loans.createdAt));

    return rows.map(row => ({
      id: row.id,
      createdDate: row.createdAt.split('T')[0],
      type: row.type === 'lend' ? 'Lend' : 'Borrow',
      principal: row.principal.toFixed(2),
      currency: row.currency,
      account: row.account.name,
      person: row.person?.name || '',
      dueDate: row.dueDate || '',
      status: row.status.charAt(0).toUpperCase() + row.status.slice(1),
      note: row.note || '',
    }));
  }

  static async exportToCsv(options: CsvExportOptions = {}): Promise<{ content: string; filename: string }> {
    const conditions = this.buildConditions(options);
    const toAccounts = alias(accounts, 'to_accounts');

    const rows = await db
      .select({
        id: payments.id,
        datetime: payments.datetime,
        type: payments.type,
        amount: payments.amount,
        note: payments.note,
        loanId: payments.loanId,
        account: {
          name: accounts.name,
          currency: accounts.currency,
          holderName: accounts.holderName,
        },
        toAccount: { name: toAccounts.name },
        category: { name: categories.name },
        person: { name: persons.name },
      })
      .from(payments)
      .innerJoin(accounts, eq(payments.accountId, accounts.id))
      .innerJoin(categories, eq(payments.categoryId, categories.id))
      .leftJoin(toAccounts, eq(payments.toAccountId, toAccounts.id))
      .leftJoin(persons, eq(payments.personId, persons.id))
      .where(conditions)
      .orderBy(desc(payments.datetime));

    const exportRows: TransactionExportRow[] = rows.map(row => {
      const dateObj = new Date(row.datetime);
      const date = dateObj.toISOString().split('T')[0];
      const time = dateObj.toTimeString().split(' ')[0].slice(0, 5);
      return {
        id: row.id,
        date,
        time,
        type: row.type === 'CR' ? 'Income' : row.type === 'DR' ? 'Expense' : 'Transfer',
        amount: row.amount.toFixed(2),
        currency: row.account.currency,
        account: row.account.name,
        accountHolder: row.account.holderName,
        toAccount: row.toAccount?.name || '',
        category: row.category.name,
        linkedPerson: row.person?.name || '',
        note: row.note || '',
        loanId: row.loanId != null ? String(row.loanId) : '',
      };
    });

    const lines: string[] = [this.CSV_HEADER];
    for (const row of exportRows) {
      lines.push(this.formatRow(row));
    }

    if (options.includeLoans) {
      const loanRows = await this.fetchLoanRows(options.accountId);
      lines.push('');
      lines.push('## LOANS');
      lines.push(this.LOANS_CSV_HEADER);
      for (const row of loanRows) {
        lines.push(this.formatLoanRow(row));
      }
    }

    const csvContent = lines.join('\n');

    let filename: string;
    if (options.dateRange) {
      const start = options.dateRange.startDate.toISOString().split('T')[0];
      const end = options.dateRange.endDate.toISOString().split('T')[0];
      filename = `fintraq_export_${start}_to_${end}.csv`;
    } else {
      const today = new Date().toISOString().split('T')[0];
      filename = `fintraq_export_all_${today}.csv`;
    }

    return { content: csvContent, filename };
  }

  static async saveToFolder(content: string, filename: string): Promise<void> {
    if (Platform.OS === 'android') {
      await this.saveAndroid(content, filename);
    } else {
      await this.saveIOS(content, filename);
    }
  }

  static async shareFile(content: string, filename: string): Promise<void> {
    const tempFile = new File(Paths.cache, filename);
    tempFile.write(content);
    if (!tempFile.exists) throw new Error('Failed to create file');
    await Sharing.shareAsync(tempFile.uri, {
      mimeType: 'text/csv',
      UTI: 'public.comma-separated-values-text',
      dialogTitle: 'Share CSV Export',
    });
  }

  private static async saveAndroid(content: string, filename: string): Promise<void> {
    try {
      const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (!permissions.granted) {
        Alert.alert('Permission Denied', 'Cannot save without folder access.');
        return;
      }
      const fileUri = await StorageAccessFramework.createFileAsync(
        permissions.directoryUri,
        filename,
        'text/csv',
      );
      await StorageAccessFramework.writeAsStringAsync(fileUri, content, { encoding: 'utf8' });
      Alert.alert('Saved', `CSV saved as ${filename}`);
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Save Failed', error instanceof Error ? error.message : 'Failed to save CSV');
    }
  }

  private static async saveIOS(content: string, filename: string): Promise<void> {
    const tempFile = new File(Paths.cache, filename);
    tempFile.write(content);
    if (!tempFile.exists) throw new Error('Failed to create export file');
    await Sharing.shareAsync(tempFile.uri, {
      mimeType: 'text/csv',
      UTI: 'public.comma-separated-values-text',
      dialogTitle: 'Save CSV Export',
    });
  }

  static getDateRangePresets(): { label: string; getRange: () => ExportDateRange }[] {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    return [
      {
        label: 'This Month',
        getRange: () => {
          const start = new Date(today.getFullYear(), today.getMonth(), 1);
          return { startDate: start, endDate: today };
        },
      },
      {
        label: 'Last Month',
        getRange: () => {
          const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          const end = new Date(today.getFullYear(), today.getMonth(), 0);
          end.setHours(23, 59, 59, 999);
          return { startDate: start, endDate: end };
        },
      },
      {
        label: 'Last 3 Months',
        getRange: () => {
          const start = new Date(today.getFullYear(), today.getMonth() - 3, 1);
          return { startDate: start, endDate: today };
        },
      },
      {
        label: 'This Year',
        getRange: () => {
          const start = new Date(today.getFullYear(), 0, 1);
          return { startDate: start, endDate: today };
        },
      },
      {
        label: 'Last Year',
        getRange: () => {
          const start = new Date(today.getFullYear() - 1, 0, 1);
          const end = new Date(today.getFullYear() - 1, 11, 31);
          end.setHours(23, 59, 59, 999);
          return { startDate: start, endDate: end };
        },
      },
      {
        label: 'All Time',
        getRange: () => {
          const start = new Date(today.getFullYear() - 10, 0, 1);
          return { startDate: start, endDate: today };
        },
      },
    ];
  }
}
