import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus, Share } from 'react-native';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';
export type LogTag = 'FOREGROUND' | 'BACKGROUND';

export type LogCategory =
  | 'APP_LIFECYCLE'
  | 'AUTO_BACKUP'
  | 'GOOGLE_DRIVE'
  | 'TASK_MANAGER'
  | 'NOTIFICATION'
  | 'DATABASE'
  | 'SYSTEM'
  | (string & {});

export type LogEntry = {
  id: string;
  timestamp: number;
  timeStr: string;
  level: LogLevel;
  tag: LogTag;
  category: string;
  message: string;
  details?: Record<string, unknown>;
};

const LOG_STORAGE_KEY = '@fintraq_app_logs_v1';
const MAX_LOG_RETENTION_MS = 7 * 24 * 60 * 60 * 1000; // 7 Days in milliseconds
const MAX_LOG_COUNT = 500;

function formatTimestamp(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const timeStr = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  return `${dateStr} ${timeStr}`;
}

export function formatRelativeTime(ms: number): string {
  const now = Date.now();
  const diffSec = Math.floor((now - ms) / 1000);
  if (diffSec < 10) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}

class LoggerServiceClass {
  private logQueue: LogEntry[] | null = null;
  private currentAppState: AppStateStatus = AppState.currentState;
  private isInitialized = false;

  public initialize() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Record initial app launch
    this.info('APP_LIFECYCLE', `App initialized (State: ${AppState.currentState.toUpperCase()})`);

    // Monitor lifecycle state transitions
    AppState.addEventListener('change', (nextState) => {
      const prev = this.currentAppState;
      this.currentAppState = nextState;
      if (prev !== nextState) {
        const tag: LogTag = nextState === 'active' ? 'FOREGROUND' : 'BACKGROUND';
        this.info(
          'APP_LIFECYCLE',
          `App transition: ${prev.toUpperCase()} ➔ ${nextState.toUpperCase()}`,
          { previousState: prev, nextState },
          tag,
        );
      }
    });
  }

  private async loadLogs(): Promise<LogEntry[]> {
    if (this.logQueue) return this.logQueue;
    try {
      const raw = await AsyncStorage.getItem(LOG_STORAGE_KEY);
      if (raw) {
        const parsed: LogEntry[] = JSON.parse(raw);
        this.logQueue = this.pruneOldLogs(parsed);
        return this.logQueue;
      }
    } catch {
      // Storage read error fallback
    }
    this.logQueue = [];
    return this.logQueue;
  }

  private pruneOldLogs(logs: LogEntry[]): LogEntry[] {
    const cutoff = Date.now() - MAX_LOG_RETENTION_MS;
    return logs
      .filter((entry) => entry.timestamp >= cutoff)
      .slice(-MAX_LOG_COUNT);
  }

  private async saveLogs(logs: LogEntry[]): Promise<void> {
    this.logQueue = logs;
    try {
      await AsyncStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logs));
    } catch {
      // Storage write error fallback
    }
  }

  public async log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    details?: Record<string, unknown>,
    explicitTag?: LogTag,
  ): Promise<LogEntry> {
    const tag: LogTag = explicitTag || (AppState.currentState === 'active' ? 'FOREGROUND' : 'BACKGROUND');
    const now = Date.now();
    const entry: LogEntry = {
      id: `${now}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now,
      timeStr: formatTimestamp(now),
      level,
      tag,
      category: category.toUpperCase(),
      message,
      ...(details ? { details } : {}),
    };

    const consoleMsg = `[${entry.timeStr}][${entry.tag}][${entry.category}] ${message}`;
    if (level === 'error') console.error(consoleMsg, details || '');
    else if (level === 'warn') console.warn(consoleMsg, details || '');
    else console.log(consoleMsg, details || '');

    const currentLogs = await this.loadLogs();
    const updated = this.pruneOldLogs([...currentLogs, entry]);
    await this.saveLogs(updated);

    return entry;
  }

  public async info(category: LogCategory, message: string, details?: Record<string, unknown>, tag?: LogTag) {
    return this.log('info', category, message, details, tag);
  }

  public async warn(category: LogCategory, message: string, details?: Record<string, unknown>, tag?: LogTag) {
    return this.log('warn', category, message, details, tag);
  }

  public async error(category: LogCategory, message: string, details?: Record<string, unknown>, tag?: LogTag) {
    return this.log('error', category, message, details, tag);
  }

  public async debug(category: LogCategory, message: string, details?: Record<string, unknown>, tag?: LogTag) {
    return this.log('debug', category, message, details, tag);
  }

  public async getLogs(filter?: {
    category?: string;
    tag?: LogTag;
    level?: LogLevel;
    days?: number;
    searchQuery?: string;
  }): Promise<LogEntry[]> {
    const logs = await this.loadLogs();
    let result = this.pruneOldLogs(logs);

    if (filter?.days) {
      const cutoff = Date.now() - filter.days * 24 * 60 * 60 * 1000;
      result = result.filter((l) => l.timestamp >= cutoff);
    }
    if (filter?.tag) {
      result = result.filter((l) => l.tag === filter.tag);
    }
    if (filter?.level) {
      result = result.filter((l) => l.level === filter.level);
    }
    if (filter?.category) {
      const catUpper = filter.category.toUpperCase();
      result = result.filter((l) => l.category === catUpper);
    }
    if (filter?.searchQuery && filter.searchQuery.trim().length > 0) {
      const q = filter.searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.message.toLowerCase().includes(q) ||
          l.category.toLowerCase().includes(q) ||
          l.timeStr.includes(q) ||
          (l.details && JSON.stringify(l.details).toLowerCase().includes(q)),
      );
    }

    return result.sort((a, b) => b.timestamp - a.timestamp);
  }

  public async clearLogs(): Promise<void> {
    this.logQueue = [];
    await AsyncStorage.removeItem(LOG_STORAGE_KEY);
  }

  public async exportLogsAsText(filter?: { category?: string; tag?: LogTag; days?: number }): Promise<string> {
    const logs = await this.getLogs(filter);
    if (logs.length === 0) return 'No log records available.';

    const lines: string[] = [
      `==================================================`,
      ` FINTRAQ APPLICATION LOGS EXPORT (LAST 7 DAYS)`,
      ` Generated At: ${formatTimestamp(Date.now())}`,
      ` Total Log Records: ${logs.length}`,
      ` Retention Window: 7 Days (Auto-Pruned)`,
      `==================================================`,
      '',
    ];

    for (const log of logs) {
      lines.push(`[${log.timeStr}] [${log.tag}] [${log.level.toUpperCase()}] [${log.category}] ${log.message}`);
      if (log.details && Object.keys(log.details).length > 0) {
        lines.push(`  Details: ${JSON.stringify(log.details)}`);
      }
    }

    return lines.join('\n');
  }

  public async shareLogs(filter?: { category?: string; tag?: LogTag; days?: number }): Promise<boolean> {
    try {
      const text = await this.exportLogsAsText(filter);
      await Share.share({
        title: 'Fintraq 7-Day App Logs',
        message: text,
      });
      return true;
    } catch {
      return false;
    }
  }
}

export const LoggerService = new LoggerServiceClass();
