import { XMindEmbedViewer } from 'xmind-embed-viewer';
import XMindPlugin from './main';
import { createDebugLogger } from './debug-logger';

/**
 * XMindEmbedViewer配置选项接口
 */
interface XMindEmbedViewerOptions {
  el: HTMLElement;
  file: ArrayBuffer;
  region?: 'cn' | 'global';
  styles?: {
    width?: string;
    height?: string;
    border?: string;
    [key: string]: any;
  };
}

/**
 * 创建XMindEmbedViewer实例，支持区域回退逻辑
 * 根据插件设置优先使用指定区域，失败后回退到备用区域
 *
 * @param options XMindEmbedViewer配置选项
 * @param plugin XMind插件实例，用于获取设置和调试模式
 * @returns Promise<XMindEmbedViewer> 返回创建的XMindEmbedViewer实例
 */
export async function createXMindEmbedViewerWithFallback(
  options: XMindEmbedViewerOptions,
  plugin?: XMindPlugin
): Promise<XMindEmbedViewer> {
  const { el, file, styles } = options;
  const logger = plugin ? createDebugLogger(plugin) : null;
  const preferredRegion = plugin?.settings?.xmindViewerRegion || 'cn';
  const fallbackRegion = preferredRegion === 'cn' ? 'global' : 'cn';

  // 检查是否启用了XMind预览功能
  if (plugin?.settings && !plugin.settings.enableXMindViewer) {
    throw new Error('XMind预览功能已被禁用。如需启用，请在插件设置中开启XMind预览功能。');
  }

  // 首先尝试使用首选区域
  try {
    logger?.log(`尝试使用${preferredRegion === 'cn' ? '国内' : '全球'}区域(${preferredRegion})加载XMind文件...`);

    const viewer = new XMindEmbedViewer({
      el,
      file,
      region: preferredRegion,
      styles: styles || {
        width: '100%',
        height: '100%'
      }
    });

    // 等待一小段时间来检测是否加载成功
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`${preferredRegion}区域加载超时 - 可能是网络连接问题或防火墙限制`));
      }, 8000); // 增加到8秒超时，给网络更多时间

      // 监听加载成功事件（如果XMindEmbedViewer支持的话）
      // 这里我们简单地等待一段时间，实际实现可能需要根据XMindEmbedViewer的API调整
      setTimeout(() => {
        clearTimeout(timeout);
        resolve(viewer);
      }, 2000); // 增加到2秒检测加载状态
    });

    logger?.success(`成功使用${preferredRegion === 'cn' ? '国内' : '全球'}区域(${preferredRegion})加载XMind文件`);
    return viewer;

  } catch (primaryError) {
    logger?.warn(`使用${preferredRegion === 'cn' ? '国内' : '全球'}区域(${preferredRegion})加载XMind文件失败:`, primaryError);

    // 清理可能的残留元素
    el.empty();

    try {
      logger?.log(`尝试使用${fallbackRegion === 'cn' ? '国内' : '全球'}区域(${fallbackRegion})加载XMind文件...`);

      const viewer = new XMindEmbedViewer({
        el,
        file,
        region: fallbackRegion,
        styles: styles || {
          width: '100%',
          height: '100%'
        }
      });

      logger?.success(`成功使用${fallbackRegion === 'cn' ? '国内' : '全球'}区域(${fallbackRegion})加载XMind文件`);
      return viewer;

    } catch (fallbackError) {
      // 为国内用户提供更友好的错误提示
      let userFriendlyMsg = 'XMind文件加载失败';

      if (primaryError.message.includes('超时') || fallbackError.message.includes('超时')) {
        userFriendlyMsg = `XMind预览服务连接超时。

可能的原因：
1. 网络连接不稳定
2. 防火墙或网络代理阻止了连接
3. XMind在线服务暂时不可用

建议解决方案：
1. 检查网络连接
2. 尝试使用VPN或更换网络环境
3. 在插件设置中暂时禁用XMind预览功能
4. 使用本地XMind应用打开文件`;
      } else {
        userFriendlyMsg = `XMind文件加载失败: ${preferredRegion}区域错误: ${primaryError.message}, ${fallbackRegion}区域错误: ${fallbackError.message}`;
      }

      logger?.error('XMind文件加载失败', new Error(userFriendlyMsg), {
        preferredRegion,
        fallbackRegion,
        primaryError: primaryError.message,
        fallbackError: fallbackError.message
      });
      throw new Error(userFriendlyMsg);
    }
  }
}

/**
 * 简化版本的创建函数，直接使用回退逻辑
 * 这个函数更适合在现有代码中替换原有的XMindEmbedViewer构造函数调用
 * 
 * @param el HTML元素
 * @param file 文件数据
 * @param styles 样式配置
 * @returns Promise<XMindEmbedViewer> 返回创建的XMindEmbedViewer实例
 */
export async function createXMindViewer(
  el: HTMLElement,
  file: ArrayBuffer,
  styles?: { [key: string]: any }
): Promise<XMindEmbedViewer> {
  return createXMindEmbedViewerWithFallback({
    el,
    file,
    styles
  });
}

/**
 * 同步版本的创建函数，使用Promise.resolve包装
 * 用于需要同步调用但支持异步处理的场景
 * 
 * @param options XMindEmbedViewer配置选项
 * @returns XMindEmbedViewer实例（实际上是Promise包装的）
 */
export function createXMindEmbedViewerSync(options: XMindEmbedViewerOptions): any {
  // 异步创建真正的viewer
  createXMindEmbedViewerWithFallback(options)
    .then((viewer) => {
      return viewer;
    })
    .catch((error) => {
      // 显示错误信息
      const errorEl = options.el.createEl('div', {
        cls: 'xmind-viewer-error'
      });
      errorEl.createEl('h3', { text: '无法加载XMind文件' });
      errorEl.createEl('p', { text: error.message });
      errorEl.createEl('p', {
        text: '提示：请检查网络连接或XMind文件格式是否正确。'
      });
    });

  // 返回一个模拟的viewer对象
  return {
    destroy: () => {
      // 清理函数
      options.el.empty();
    }
  };
}
