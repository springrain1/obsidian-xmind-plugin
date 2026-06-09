/**
 * Debug Logger Stub
 * 为 Obsidian 插件提供简单的日志记录功能
 */

export interface DebugLogger {
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
    debug(message: string, ...args: any[]): void;
}

export function createDebugLogger(plugin: any): DebugLogger {
    const prefix = `[${plugin?.manifest?.name || 'XMind'}]`;
    
    return {
        info(message: string, ...args: any[]) {
            console.log(`${prefix} ${message}`, ...args);
        },
        warn(message: string, ...args: any[]) {
            console.warn(`${prefix} ${message}`, ...args);
        },
        error(message: string, ...args: any[]) {
            console.error(`${prefix} ${message}`, ...args);
        },
        debug(message: string, ...args: any[]) {
            console.debug(`${prefix} ${message}`, ...args);
        }
    };
}