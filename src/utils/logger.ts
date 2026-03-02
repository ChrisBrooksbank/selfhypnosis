/**
 * Centralized Logging Utility
 * Provides consistent logging with timestamps and log levels
 */

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

interface LogLevels {
    DEBUG: number;
    INFO: number;
    WARN: number;
    ERROR: number;
}

const levels: LogLevels = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
};

let debugMode = false;

export const Logger = {
    levels,
    currentLevel: 1 as number,

    _timestamp(): string {
        return new Date().toISOString().substring(11, 23);
    },

    _format(level: string, emoji: string, message: string, ...args: unknown[]): unknown[] {
        const ts = this._timestamp();
        return [`[${ts}] ${emoji} ${level}:`, message, ...args];
    },

    debug(message: string, ...args: unknown[]): void {
        if (this.currentLevel <= this.levels.DEBUG && debugMode) {
            // eslint-disable-next-line no-console
            console.log(...this._format('DEBUG', '🔍', message, ...args));
        }
    },

    info(message: string, ...args: unknown[]): void {
        if (this.currentLevel <= this.levels.INFO) {
            // eslint-disable-next-line no-console
            console.log(...this._format('INFO', 'ℹ️', message, ...args));
        }
    },

    warn(message: string, ...args: unknown[]): void {
        if (this.currentLevel <= this.levels.WARN) {
            // eslint-disable-next-line no-console
            console.warn(...this._format('WARN', '⚠️', message, ...args));
        }
    },

    error(message: string, ...args: unknown[]): void {
        if (this.currentLevel <= this.levels.ERROR) {
            // eslint-disable-next-line no-console
            console.error(...this._format('ERROR', '❌', message, ...args));
        }
    },

    success(message: string, ...args: unknown[]): void {
        if (this.currentLevel <= this.levels.INFO) {
            // eslint-disable-next-line no-console
            console.log(...this._format('SUCCESS', '✅', message, ...args));
        }
    },

    setLevel(level: LogLevel): void {
        this.currentLevel = this.levels[level] ?? 1;
    },

    setDebugMode(enabled: boolean): void {
        debugMode = enabled;
    },
};
