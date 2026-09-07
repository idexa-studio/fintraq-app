import { File, Paths } from 'expo-file-system';
import { Share } from 'react-native';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const LOG_FILE_NAME = 'fintraq.log';
const MAX_LOG_BYTES = 1_000_000; // 1MB cap — rotate (keep newest half) past this
const encoder = new TextEncoder();

function stringifyArg(arg: unknown): string {
  if (typeof arg === 'string') return arg;
  if (arg instanceof Error) return arg.stack || arg.message;
  try {
    return JSON.stringify(arg);
  } catch {
    return String(arg);
  }
}

/**
 * Lightweight app-wide logger: every call writes one line to console AND
 * appends it to a plain-text file on disk, so logs survive app restarts and
 * can be shared/inspected without a debugger attached. `tag` is a short,
 * free-form label for where the log came from (e.g. 'GOOGLE_DRIVE') — no
 * enum, no structured metadata object, no console monkey-patching. Call
 * sites that used to do `console.log('[Foo]', ...)` should call
 * `LoggerService.info('FOO', ...)` instead — same variadic args as console.
 */
class LoggerServiceClass {
  private file = new File(Paths.document, LOG_FILE_NAME);

  private appendLine(line: string): void {
    try {
      if (!this.file.exists) {
        this.file.write('');
      } else if (this.file.size > MAX_LOG_BYTES) {
        const tail = this.file.textSync().slice(-Math.floor(MAX_LOG_BYTES / 2));
        this.file.write(tail);
      }
      const handle = this.file.open();
      handle.offset = handle.size ?? 0;
      handle.writeBytes(encoder.encode(line + '\n'));
      handle.close();
    } catch {
      // Best-effort file logging — a logging failure must never break the caller.
    }
  }

  private record(level: LogLevel, tag: string, args: unknown[]): void {
    const message = args.map(stringifyArg).join(' ');
    const line = `[${new Date().toISOString()}] [${level.toUpperCase()}] [${tag}] ${message}`;
    const consoleFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    consoleFn(line);
    this.appendLine(line);
  }

  info(tag: string, ...args: unknown[]): void {
    this.record('info', tag, args);
  }

  warn(tag: string, ...args: unknown[]): void {
    this.record('warn', tag, args);
  }

  error(tag: string, ...args: unknown[]): void {
    this.record('error', tag, args);
  }

  debug(tag: string, ...args: unknown[]): void {
    this.record('debug', tag, args);
  }

  getRawLogText(): string {
    try {
      if (!this.file.exists) return 'No log records found.';
      const text = this.file.textSync();
      return text.trim().length > 0 ? text : 'No log records found.';
    } catch {
      return 'No log records found.';
    }
  }

  getLogCount(): number {
    try {
      if (!this.file.exists) return 0;
      const text = this.file.textSync().trim();
      return text.length === 0 ? 0 : text.split('\n').length;
    } catch {
      return 0;
    }
  }

  clearLogs(): void {
    try {
      this.file.write('');
    } catch {
      // ignore
    }
  }

  async shareLogs(): Promise<boolean> {
    try {
      await Share.share({ title: LOG_FILE_NAME, message: this.getRawLogText() });
      return true;
    } catch {
      return false;
    }
  }
}

export const LoggerService = new LoggerServiceClass();
