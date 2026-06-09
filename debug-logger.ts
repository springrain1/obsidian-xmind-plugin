/**
 * Debug Logger - Stub implementation for production
 * All logging is disabled in production builds
 */

export interface DebugLogger {
  info(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;
  debug(...args: any[]): void;
}

class NoOpDebugLogger implements DebugLogger {
  info(...args: any[]): void {
    // No-op in production
  }

  warn(...args: any[]): void {
    // No-op in production
  }

  error(...args: any[]): void {
    // Console error only for critical issues
    console.error(...args);
  }

  debug(...args: any[]): void {
    // No-op in production
  }
}

export function createDebugLogger(plugin: any): DebugLogger {
  return new NoOpDebugLogger();
}
