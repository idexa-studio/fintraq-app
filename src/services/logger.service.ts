import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';
export type LogTag = 'FOREGROUND' | 'BACKGROUND';

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

class LoggerServiceClass {
  private logQueue: LogEntry[] | null = null;

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
      // Storage read error
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
      // Storage write error
    }
  }

  public async log(
    level: LogLevel,
    category: string,
    message: string,
    details?: Record<string, unknown>,
    explicitTag?: LogTag
  ): Promise<LogEntry> {
    const tag: LogTag = explicitTag || (AppState.currentState === 'active' ? 'FOREGROUND' : 'BACKGROUND');
    const now = Date.now();
    const entry: LogEntry = {
      id: `${now}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now,
      timeStr: new Date(now).toLocaleString(),
      level,
      tag,
      category: category.toUpperCase(),
      message,
      ...(details ? { details } : {}),
    };

    const consoleMsg = `[${entry.tag}][${entry.category}] ${message}`;
    if (level === 'error') console.error(consoleMsg, details || '');
    else if (level === 'warn') console.warn(consoleMsg, details || '');
    else console.log(consoleMsg, details || '');

    const currentLogs = await this.loadLogs();
    const updated = this.pruneOldLogs([...currentLogs, entry]);
    await this.saveLogs(updated);

    return entry;
  }

  public async info(category: string, message: string, details?: Record<string, unknown>, tag?: LogTag) {
    return this.log('info', category, message, details, tag);
  }

  public async warn(category: string, message: string, details?: Record<string, unknown>, tag?: LogTag) {
    return this.log('warn', category, message, details, tag);
  }

  public async error(category: string, message: string, details?: Record<string, unknown>, tag?: LogTag) {
    return this.log('error', category, message, details, tag);
  }

  public async debug(category: string, message: string, details?: Record<string, unknown>, tag?: LogTag) {
    return this.log('debug', category, message, details, tag);
  }

  public async getLogs(filter?: {
    category?: string;
    tag?: LogTag;
    days?: number;
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
    if (filter?.category) {
      const catUpper = filter.category.toUpperCase();
      result = result.filter((l) => l.category === catUpper);
    }

    return result.sort((a, b) => b.timestamp - a.timestamp);
  }

  public async clearLogs(): Promise<void> {
    this.logQueue = [];
    await AsyncStorage.removeItem(LOG_STORAGE_KEY);
  }
}

export const LoggerService = new LoggerServiceClass();
