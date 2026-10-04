import { db } from '@/src/db/client';
import { PAYMENT_LOCAL_DAY } from '@/src/db/sql';
import { CSV_BOM, toCsvRow } from '@/src/features/export/utils/csv';
import { getLocalISOString } from '@/src/utils/date';
import { accounts, categories, loans, payments, persons } from '@/src/db/schema';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { StorageAccessFramework } from 'expo-file-system/legacy';
import { format } from 'date-fns';
import { and, count, desc, eq, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';
import { Platform, Alert } from 'react-native';
import { LoggerService } from '@/src/services/logger.service';
import i18n from '@/src/i18n';

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

  private static formatRow(row: TransactionExportRow): string {
    return toCsvRow([
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
    ]);
  }

  private static formatLoanRow(row: LoanExportRow): string {
    return toCsvRow([
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
    ]);
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
      // Local calendar days, both inclusive — the same days the app shows.
      const start = getLocalISOString(options.dateRange.startDate);
      const end = getLocalISOString(options.dateRange.endDate);
      conditions.push(sql`${PAYMENT_LOCAL_DAY} BETWEEN ${start} AND ${end}`);
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
      createdDate: getLocalISOString(new Date(row.createdAt)),
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
      // Date and time both in local time, so a row reads as the moment the user recorded.
      const dateObj = new Date(row.datetime);
      const date = getLocalISOString(dateObj);
      const time = format(dateObj, 'HH:mm');
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

    const csvContent = CSV_BOM + lines.join('\n');

    let filename: string;
    if (options.dateRange) {
      const start = getLocalISOString(options.dateRange.startDate);
      const end = getLocalISOString(options.dateRange.endDate);
      filename = `fintraq_export_${start}_to_${end}.csv`;
    } else {
      const today = getLocalISOString();
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
      dialogTitle: i18n.t('export.shareDialog'),
    });
  }

  private static async saveAndroid(content: string, filename: string): Promise<void> {
    try {
      const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (!permissions.granted) {
        Alert.alert(i18n.t('export.permissionDenied'), i18n.t('export.permissionDeniedMessage'));
        return;
      }
      const fileUri = await StorageAccessFramework.createFileAsync(
        permissions.directoryUri,
        filename,
        'text/csv',
      );
      await StorageAccessFramework.writeAsStringAsync(fileUri, content, { encoding: 'utf8' });
      Alert.alert(i18n.t('export.saved'), i18n.t('export.savedMessage', { filename }));
    } catch (error) {
      LoggerService.error('CSV_EXPORT', 'Failed to save CSV to Android folder', error);
      Alert.alert(i18n.t('export.saveCsvFailed'), error instanceof Error ? error.message : i18n.t('export.saveCsvFailedMessage'));
    }
  }

  private static async saveIOS(content: string, filename: string): Promise<void> {
    const tempFile = new File(Paths.cache, filename);
    tempFile.write(content);
    if (!tempFile.exists) throw new Error('Failed to create export file');
    await Sharing.shareAsync(tempFile.uri, {
      mimeType: 'text/csv',
      UTI: 'public.comma-separated-values-text',
      dialogTitle: i18n.t('export.saveDialog'),
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
