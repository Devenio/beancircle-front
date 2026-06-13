/**
 * Lightweight in-memory diagnostics buffer for the bug reporter.
 *
 * Captures the last N console logs, uncaught JS errors, unhandled promise
 * rejections, and failed `fetch` requests so they can be attached to a report.
 * Installed once (idempotent) from the global launcher. No-ops on the server.
 */

export type LogLevel = 'log' | 'info' | 'warn' | 'error';

export type LogEntry = {
  ts: number;
  level: LogLevel;
  /** 'console' | 'error' | 'unhandledrejection' | 'network' */
  source: string;
  message: string;
};

const MAX_LOGS = 300;
const buffer: LogEntry[] = [];
let installed = false;

function push(entry: LogEntry) {
  buffer.push(entry);
  if (buffer.length > MAX_LOGS) buffer.splice(0, buffer.length - MAX_LOGS);
}

function stringify(args: unknown[]): string {
  return args
    .map((a) => {
      if (typeof a === 'string') return a;
      if (a instanceof Error) return `${a.name}: ${a.message}`;
      try {
        return JSON.stringify(a);
      } catch {
        return String(a);
      }
    })
    .join(' ')
    .slice(0, 2000);
}

/** Returns a snapshot copy of the captured logs (most recent last). */
export function getLogs(): LogEntry[] {
  return buffer.slice();
}

export function installDiagnostics() {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  (['log', 'info', 'warn', 'error'] as const).forEach((level) => {
    const original = console[level].bind(console);
    console[level] = (...args: unknown[]) => {
      push({
        ts: Date.now(),
        level,
        source: 'console',
        message: stringify(args),
      });
      original(...args);
    };
  });

  window.addEventListener('error', (e) => {
    push({
      ts: Date.now(),
      level: 'error',
      source: 'error',
      message: `${e.message} @ ${e.filename}:${e.lineno}:${e.colno}`,
    });
  });

  window.addEventListener('unhandledrejection', (e) => {
    const reason = e.reason;
    push({
      ts: Date.now(),
      level: 'error',
      source: 'unhandledrejection',
      message:
        reason instanceof Error
          ? `${reason.name}: ${reason.message}`
          : stringify([reason]),
    });
  });

  // Wrap fetch to record API failures (status >= 400 or network errors).
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (...args: Parameters<typeof fetch>) => {
    const started = Date.now();
    const url =
      typeof args[0] === 'string'
        ? args[0]
        : args[0] instanceof URL
          ? args[0].toString()
          : args[0].url;
    const method = (args[1]?.method ?? 'GET').toUpperCase();
    try {
      const res = await originalFetch(...args);
      if (res.status >= 400) {
        push({
          ts: started,
          level: 'error',
          source: 'network',
          message: `${method} ${url} → ${res.status} (${Date.now() - started}ms)`,
        });
      }
      return res;
    } catch (err) {
      push({
        ts: started,
        level: 'error',
        source: 'network',
        message: `${method} ${url} → failed: ${
          err instanceof Error ? err.message : String(err)
        }`,
      });
      throw err;
    }
  };
}
