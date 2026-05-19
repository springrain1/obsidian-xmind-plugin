import XMindPlugin from './main';

/**
 * 统一的调试日志管理器
 * 只有在启用全局调试模式时才输出日志
 */
export class DebugLogger {
  private plugin: XMindPlugin;

  constructor(plugin: XMindPlugin) {
    this.plugin = plugin;
  }

  /**
   * 检查是否启用了调试模式
   */
  private get isDebugEnabled(): boolean {
    return this.plugin?.settings?.globalDebugMode || false;
  }

  /**
   * 输出调试日志
   * @param message 日志消息
   * @param data 可选的数据对象
   */
  log(message: string, data?: any): void {
    if (this.isDebugEnabled) {
      if (data !== undefined) {
        console.log(`[XMind Debug] ${message}`, data);
      } else {
        console.log(`[XMind Debug] ${message}`);
      }
    }
  }

  /**
   * 输出警告日志
   * @param message 警告消息
   * @param data 可选的数据对象
   */
  warn(message: string, data?: any): void {
    if (this.isDebugEnabled) {
      if (data !== undefined) {
        console.warn(`[XMind Debug] ${message}`, data);
      } else {
        console.warn(`[XMind Debug] ${message}`);
      }
    }
  }

  /**
   * 输出错误日志（错误日志总是显示，但调试模式下会显示更多详细信息）
   * @param message 错误消息
   * @param error 错误对象
   * @param debugData 调试模式下的额外数据
   */
  error(message: string, error?: any, debugData?: any): void {
    // 错误日志总是显示
    if (error !== undefined) {
      console.error(`XMind插件错误: ${message}`, error);
    } else {
      console.error(`XMind插件错误: ${message}`);
    }

    // 调试模式下显示额外的详细信息
    if (this.isDebugEnabled && debugData !== undefined) {
      console.error(`[XMind Debug] 错误详细信息:`, debugData);
    }
  }

  /**
   * 输出成功日志（仅在调试模式下显示）
   * @param message 成功消息
   * @param data 可选的数据对象
   */
  success(message: string, data?: any): void {
    if (this.isDebugEnabled) {
      if (data !== undefined) {
        console.log(`[XMind Debug] ✅ ${message}`, data);
      } else {
        console.log(`[XMind Debug] ✅ ${message}`);
      }
    }
  }

  /**
   * 输出信息日志（仅在调试模式下显示）
   * @param message 信息消息
   * @param data 可选的数据对象
   */
  info(message: string, data?: any): void {
    if (this.isDebugEnabled) {
      if (data !== undefined) {
        console.info(`[XMind Debug] ℹ️ ${message}`, data);
      } else {
        console.info(`[XMind Debug] ℹ️ ${message}`);
      }
    }
  }

  /**
   * 输出性能计时开始
   * @param label 计时标签
   */
  timeStart(label: string): void {
    if (this.isDebugEnabled) {
      console.time(`[XMind Debug] ${label}`);
    }
  }

  /**
   * 输出性能计时结束
   * @param label 计时标签
   */
  timeEnd(label: string): void {
    if (this.isDebugEnabled) {
      console.timeEnd(`[XMind Debug] ${label}`);
    }
  }

  /**
   * 输出分组开始
   * @param label 分组标签
   */
  groupStart(label: string): void {
    if (this.isDebugEnabled) {
      console.group(`[XMind Debug] ${label}`);
    }
  }

  /**
   * 输出分组结束
   */
  groupEnd(): void {
    if (this.isDebugEnabled) {
      console.groupEnd();
    }
  }
}

/**
 * 创建调试日志器实例
 * @param plugin XMind插件实例
 * @returns DebugLogger实例
 */
export function createDebugLogger(plugin: XMindPlugin): DebugLogger {
  return new DebugLogger(plugin);
}
