/**
 * ============================================================================
 * LOGGER — Centralized Logging with Winston (Level-First)
 * ============================================================================
 *
 * Simple, standard log levels with optional context metadata.
 *
 * Usage:
 *   Logger.info('Creating product');
 *   Logger.info('Creating product', { context: 'api' });
 *   Logger.error('Failed to create', { context: 'api', error });
 *   Logger.debug('Full response', { data: response });
 *
 * Environment Variables:
 *   CI=true         → Only errors shown
 *   LOG_LEVEL       → debug | info | warn | error (default: info)
 *
 * Output Format:
 *   2026-02-01 21:27:31.123 INFO  [API] Creating product
 *   2026-02-01 21:27:31.456 ERROR [API] Failed to create
 *
 * 🔗 DÙNG BỞI:
 * - BasePage.ts          → clickWithLog, fillWithLog (context: 'ui')
 * - CollectionHelper.ts  → search/pagination logging (context: 'ui')
 * - BaseService.ts       → API request/response logging (context: 'api')
 * - auth fixtures        → login flow logging (context: 'fixture')
 * - setup files          → setup/teardown logging (context: 'setup')
 * - test specs           → test step logging (context: 'test')
 */

import winston from 'winston';
import * as dotenv from 'dotenv';

// Load .env file
dotenv.config();

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

const isCI = process.env.CI === 'true';
// Normalize to lowercase (Winston requires lowercase levels)
const logLevel = (process.env.LOG_LEVEL || (isCI ? 'error' : 'info')).toLowerCase();

// Context icons
const CONTEXT_ICONS: Record<string, string> = {
  api: '📡',
  ui: '🖥️',
  fixture: '⚙️',
  test: '🧪',
  setup: '🔧',
  cleanup: '🗑️',
};

// Level colors (for non-CI)
const LEVEL_COLORS: Record<string, string> = {
  error: '\x1b[31m', // Red
  warn: '\x1b[33m',  // Yellow
  info: '\x1b[36m',  // Cyan
  debug: '\x1b[90m', // Gray
};
const RESET = '\x1b[0m';

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM FORMAT
// ─────────────────────────────────────────────────────────────────────────────

const customFormat = winston.format.printf((info) => {
  const timestamp = info.timestamp as string;
  const level = (info.level as string).toUpperCase().padEnd(5);
  const message = info.message as string;
  const context = info['context'] as string | undefined;
  const data = info['data'] as unknown;

  // Build context tag
  const icon = context ? CONTEXT_ICONS[context.toLowerCase()] || '' : '';
  const contextTag = context ? `${icon} [${context.toUpperCase()}]` : '';

  // Format data
  let dataStr = '';
  if (data !== undefined) {
    if (typeof data === 'object' && data !== null) {
      dataStr = '\n' + JSON.stringify(data, null, 2);
    } else {
      dataStr = ' ' + String(data);
    }
  }

  // Color for level (only in non-CI)
  const levelStr = isCI 
    ? level 
    : `${LEVEL_COLORS[info.level as string] || ''}${level}${RESET}`;

  return `${timestamp} ${levelStr} ${contextTag} ${message}${dataStr}`.trim();
});

// ─────────────────────────────────────────────────────────────────────────────
// WINSTON LOGGER INSTANCE
// ─────────────────────────────────────────────────────────────────────────────

const winstonLogger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    customFormat
  ),
  transports: [
    new winston.transports.Console(),
  ],
});

// ─────────────────────────────────────────────────────────────────────────────
// LOG OPTIONS INTERFACE
// ─────────────────────────────────────────────────────────────────────────────

export interface LogOptions {
  /** Context: api, ui, fixture, test, setup, cleanup */
  context?: 'api' | 'ui' | 'fixture' | 'test' | 'setup' | 'cleanup' | string;
  /** Additional data to log */
  data?: unknown;
  /** Error object */
  error?: Error;
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGGER CLASS - Level-First API
// ─────────────────────────────────────────────────────────────────────────────

export class Logger {
  /**
   * INFO level - General information
   * @example
   * Logger.info('Creating product');
   * Logger.info('Creating product', { context: 'api' });
   */
  static info(message: string, options?: LogOptions): void {
    winstonLogger.info(message, options);
  }

  /**
   * WARN level - Warning messages
   * @example
   * Logger.warn('Token expiring soon', { context: 'fixture' });
   */
  static warn(message: string, options?: LogOptions): void {
    winstonLogger.warn(message, options);
  }

  /**
   * ERROR level - Error messages (always shown, even on CI)
   * @example
   * Logger.error('Failed to create product', { context: 'api', error });
   */
  static error(message: string, options?: LogOptions): void {
    const opts = { ...options };
    if (opts.error) {
      opts.data = {
        ...(typeof opts.data === 'object' ? opts.data : {}),
        errorMessage: opts.error.message,
        stack: opts.error.stack,
      };
    }
    winstonLogger.error(message, opts);
  }

  /**
   * DEBUG level - Detailed debugging (only when LOG_LEVEL=debug)
   * @example
   * Logger.debug('Full API response', { context: 'api', data: response });
   */
  static debug(message: string, options?: LogOptions): void {
    winstonLogger.debug(message, options);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CONVENIENCE METHODS (for common patterns)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Log API request/response
   * @example
   * Logger.api('POST /api/products 201 (45ms)');
   */
  static api(message: string, data?: unknown): void {
    winstonLogger.info(message, { context: 'api', data });
  }

  /**
   * Log fixture setup/teardown
   */
  static fixture(message: string, data?: unknown): void {
    winstonLogger.info(message, { context: 'fixture', data });
  }

  /**
   * Log test steps
   */
  static test(message: string, data?: unknown): void {
    winstonLogger.info(message, { context: 'test', data });
  }

  /**
   * Log cleanup actions
   */
  static cleanup(message: string, data?: unknown): void {
    winstonLogger.info(message, { context: 'cleanup', data });
  }

  /**
   * Log UI actions (click, fill, navigate, search across pages, etc.)
   * @example
   * Logger.ui('Click "Submit" button');
   * Logger.ui('Navigate to /products');
   * Logger.ui('Search product across 6 pages → Found on page 4');
   */
  static ui(message: string, data?: unknown): void {
    winstonLogger.info(message, { context: 'ui', data });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // UTILITY METHODS
  // ─────────────────────────────────────────────────────────────────────────

  /** Check if logging is enabled */
  static isEnabled(): boolean {
    return !isCI || logLevel === 'debug';
  }

  /** Get current log level */
  static getLevel(): string {
    return logLevel;
  }

  /** Check if specific level is enabled */
  static isLevelEnabled(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
    const levels = ['error', 'warn', 'info', 'debug'];
    return levels.indexOf(level) <= levels.indexOf(logLevel);
  }
}

// Re-export for advanced usage
export { winstonLogger };
