import { App, MarkdownPostProcessorContext, TFile } from 'obsidian';
import { extractXMindThumbnail } from './xmind-thumbnail-extractor';
import XMindPlugin from './main';
import { createDebugLogger, DebugLogger } from './debug-logger';

// 尺寸参数解析接口
interface SizeParams {
  width?: number;
  height?: number;
}

// 链接解析结果接口
interface LinkParseResult {
  path: string;
  size?: SizeParams;
  alias?: string;
}

/**
 * XMind Markdown后处理器
 * 用于在Markdown预览中将XMind文件嵌入链接替换为缩略图预览
 * 支持Reading View和Live Preview模式
 */
export class XMindMarkdownProcessor {
  private app: App;
  private plugin: XMindPlugin;
  private logger: DebugLogger;

  constructor(app: App, plugin: XMindPlugin) {
    this.app = app;
    this.plugin = plugin;
    this.logger = createDebugLogger(plugin);
  }

  /**
   * 处理Markdown元素，查找并替换XMind文件嵌入链接
   * @param el HTML元素
   * @param ctx Markdown后处理器上下文
   */
  async processMarkdown(el: HTMLElement, ctx: MarkdownPostProcessorContext): Promise<void> {
    try {
      // 检测当前渲染模式
      const renderMode = this.detectRenderMode(ctx);

      this.logger.log('Markdown后处理器开始处理:', {
        sourcePath: ctx.sourcePath,
        renderMode,
        elementClass: el.className,
        elementTag: el.tagName
      });

      // 只处理嵌入链接（![[]]格式），不处理内联链接（[[]]格式）
      const embeds = el.querySelectorAll('.internal-embed');

      if (embeds.length > 0) {
        this.logger.log(`找到 ${embeds.length} 个 .internal-embed 元素`);
      }

      for (const embed of Array.from(embeds)) {
        await this.processEmbedLink(embed as HTMLElement, ctx, renderMode);
      }

      // 在Live Preview模式下，还需要处理cm-embed-block
      if (renderMode.isLivePreview) {
        const livePreviewEmbeds = el.querySelectorAll('.cm-embed-block');

        this.logger.log(`Live Preview模式，找到 ${livePreviewEmbeds.length} 个 .cm-embed-block 元素`);

        for (const embed of Array.from(livePreviewEmbeds)) {
          await this.processLivePreviewEmbed(embed as HTMLElement, ctx);
        }
      }

    } catch (error) {
      this.logger.error('Markdown处理器错误', error, {
        sourcePath: ctx.sourcePath,
        elementHTML: el.outerHTML
      });
    }
  }

  /**
   * 检测当前渲染模式
   * @param ctx Markdown后处理器上下文
   * @returns 渲染模式信息
   */
  private detectRenderMode(ctx: MarkdownPostProcessorContext): {
    isReadingMode: boolean;
    isLivePreview: boolean;
    isHoverPopover: boolean;
    isPrinting: boolean;
  } {
    // @ts-ignore - 访问内部属性
    const containerEl = ctx.containerEl;

    // 检测各种渲染模式
    const isReadingMode = Boolean(containerEl && this.getParentOfClass(containerEl, "markdown-reading-view"));
    const isHoverPopover = Boolean(containerEl && this.getParentOfClass(containerEl, "hover-popover"));
    const isPrinting = Boolean(document.body.querySelectorAll("body > .print").length > 0);
    const isLivePreview = !isReadingMode && !isHoverPopover && !isPrinting;

    const result = {
      isReadingMode,
      isLivePreview,
      isHoverPopover,
      isPrinting
    };

    this.logger.log('渲染模式检测结果:', {
      ...result,
      containerElClass: containerEl?.className,
      containerElTag: containerEl?.tagName
    });

    return result;
  }

  /**
   * 获取具有指定类名的父元素
   * @param el 起始元素
   * @param className 类名
   * @returns 找到的父元素或null
   */
  private getParentOfClass(el: HTMLElement, className: string): HTMLElement | null {
    let current = el;
    while (current && current.parentElement) {
      if (current.hasClass && current.hasClass(className)) {
        return current;
      }
      current = current.parentElement;
    }
    return null;
  }

  /**
   * 解析链接字符串，提取路径、尺寸参数等信息
   * @param linkText 链接文本，如 "file.xmind|200" 或 "file.xmind|200x150"
   * @returns 解析结果
   */
  private parseLinkText(linkText: string): LinkParseResult {
    const parts = linkText.split('|');
    const path = parts[0].trim();

    const result: LinkParseResult = { path };

    if (parts.length > 1) {
      const sizeStr = parts[1].trim();
      result.size = this.parseSizeString(sizeStr);

      // 如果有更多部分，可能是别名
      if (parts.length > 2) {
        result.alias = parts.slice(2).join('|').trim();
      }
    }

    return result;
  }

  /**
   * 解析尺寸字符串
   * @param sizeStr 尺寸字符串，如 "200" 或 "200x150"
   * @returns 尺寸参数
   */
  private parseSizeString(sizeStr: string): SizeParams | undefined {
    if (!sizeStr) return undefined;

    // 支持格式：200, 200x150, 200X150
    const sizeMatch = sizeStr.match(/^(\d+)(?:[xX](\d+))?$/);
    if (!sizeMatch) return undefined;

    const width = parseInt(sizeMatch[1]);
    const height = sizeMatch[2] ? parseInt(sizeMatch[2]) : undefined;

    return { width, height };
  }

  /**
   * 处理嵌入链接（Reading View模式）
   * @param embedEl 嵌入元素
   * @param ctx 上下文
   * @param renderMode 渲染模式信息
   */
  private async processEmbedLink(
    embedEl: HTMLElement,
    ctx: MarkdownPostProcessorContext,
    renderMode: { isReadingMode: boolean; isLivePreview: boolean; isHoverPopover: boolean; isPrinting: boolean }
  ): Promise<void> {
    const src = embedEl.getAttribute('src');

    this.logger.log('处理嵌入链接:', {
      src,
      elementClass: embedEl.className,
      renderMode: renderMode.isReadingMode ? 'Reading' : renderMode.isLivePreview ? 'Live Preview' : 'Other'
    });

    if (!src) return;

    // 解析链接信息
    const linkInfo = this.parseLinkText(src);
    if (!linkInfo.path.endsWith('.xmind')) {
      this.logger.log('跳过非XMind文件:', linkInfo.path);
      return;
    }

    this.logger.log('解析的链接信息:', linkInfo);

    // 获取文件
    const file = this.app.metadataCache.getFirstLinkpathDest(linkInfo.path, ctx.sourcePath);
    if (!file || !(file instanceof TFile)) {
      this.logger.log('文件未找到:', linkInfo.path);
      return;
    }

    this.logger.log('找到XMind文件:', file.path);

    // 提取缩略图
    const thumbnailDataURL = await extractXMindThumbnail(file, this.app, this.logger);
    if (!thumbnailDataURL) {
      this.logger.log('缩略图提取失败:', file.path);
      return;
    }

    this.logger.log('缩略图提取成功，长度:', thumbnailDataURL.length);

    // 获取尺寸参数（从src属性或元素属性）
    const width = embedEl.getAttribute('width');
    const height = embedEl.getAttribute('height');
    const sizeParams = linkInfo.size || this.parseSizeFromAttributes(width, height);

    this.logger.log('尺寸参数:', sizeParams);

    // 创建缩略图预览元素
    const thumbnailEl = this.createThumbnailElement(file, thumbnailDataURL, true, sizeParams);

    // 替换原嵌入元素
    embedEl.replaceWith(thumbnailEl);

    this.logger.success('嵌入链接处理完成，已替换为缩略图');
  }

  /**
   * 处理Live Preview模式的嵌入
   * @param embedEl 嵌入元素
   * @param ctx 上下文
   */
  private async processLivePreviewEmbed(embedEl: HTMLElement, ctx: MarkdownPostProcessorContext): Promise<void> {
    this.logger.log('处理Live Preview嵌入元素:', {
      elementClass: embedEl.className,
      elementHTML: embedEl.outerHTML.substring(0, 200) + '...'
    });

    // 在Live Preview模式下，嵌入元素的结构可能不同
    // 需要查找内部的链接信息
    const linkEl = embedEl.querySelector('[data-href]') as HTMLElement;
    if (!linkEl) {
      this.logger.log('Live Preview元素中未找到[data-href]属性的子元素');
      return;
    }

    const href = linkEl.getAttribute('data-href');
    if (!href) {
      this.logger.log('data-href属性为空');
      return;
    }

    this.logger.log('Live Preview找到链接:', href);

    // 解析链接信息
    const linkInfo = this.parseLinkText(href);
    if (!linkInfo.path.endsWith('.xmind')) {
      this.logger.log('Live Preview跳过非XMind文件:', linkInfo.path);
      return;
    }

    // 获取文件
    const file = this.app.metadataCache.getFirstLinkpathDest(linkInfo.path, ctx.sourcePath);
    if (!file || !(file instanceof TFile)) {
      this.logger.log('Live Preview文件未找到:', linkInfo.path);
      return;
    }

    this.logger.log('Live Preview找到XMind文件:', file.path);

    // 提取缩略图
    const thumbnailDataURL = await extractXMindThumbnail(file, this.app, this.logger);
    if (!thumbnailDataURL) {
      this.logger.log('Live Preview缩略图提取失败:', file.path);
      return;
    }

    this.logger.log('Live Preview缩略图提取成功');

    // 创建缩略图预览元素
    const thumbnailEl = this.createThumbnailElement(file, thumbnailDataURL, true, linkInfo.size);

    // 替换原嵌入元素
    embedEl.replaceWith(thumbnailEl);

    this.logger.success('Live Preview嵌入处理完成，已替换为缩略图');
  }

  /**
   * 从HTML属性解析尺寸参数
   * @param width 宽度属性
   * @param height 高度属性
   * @returns 尺寸参数
   */
  private parseSizeFromAttributes(width: string | null, height: string | null): SizeParams | undefined {
    if (!width && !height) return undefined;

    const result: SizeParams = {};
    if (width) {
      const w = parseInt(width);
      if (!isNaN(w)) result.width = w;
    }
    if (height) {
      const h = parseInt(height);
      if (!isNaN(h)) result.height = h;
    }

    return Object.keys(result).length > 0 ? result : undefined;
  }

  /**
   * 解析链接路径，移除锚点和查询参数
   * @param href 原始链接
   * @returns 清理后的路径
   */
  private parseLinkPath(href: string): string {
    // 移除锚点和查询参数
    return href.split('#')[0].split('?')[0];
  }

  /**
   * 创建缩略图预览元素
   * @param file XMind文件
   * @param dataURL 缩略图数据URL
   * @param isEmbed 是否为嵌入模式
   * @param sizeParams 尺寸参数
   * @returns HTML元素
   */
  private createThumbnailElement(
    file: TFile,
    dataURL: string,
    isEmbed: boolean,
    sizeParams?: SizeParams
  ): HTMLElement {
    const container = document.createElement('div');
    let containerClasses = `xmind-thumbnail-container ${isEmbed ? 'xmind-embed' : 'xmind-link'}`;

    // 根据尺寸添加额外的CSS类
    if (sizeParams) {
      containerClasses += ' xmind-custom-size';
      const width = sizeParams.width || 0;
      if (width > 0) {
        if (width <= 150) {
          containerClasses += ' xmind-small';
        } else if (width >= 400) {
          containerClasses += ' xmind-large';
        }
      }
    }

    container.className = containerClasses;

    // 创建图片元素
    const img = document.createElement('img');
    img.src = dataURL;
    img.alt = `XMind: ${file.name}`;
    img.className = 'xmind-thumbnail-image';

    // 应用尺寸参数
    if (sizeParams) {
      if (sizeParams.width) {
        img.style.width = `${sizeParams.width}px`;
        img.style.maxWidth = `${sizeParams.width}px`;
      }
      if (sizeParams.height) {
        img.style.height = `${sizeParams.height}px`;
        img.style.maxHeight = `${sizeParams.height}px`;
      }
      // 如果只指定了宽度，保持宽高比
      if (sizeParams.width && !sizeParams.height) {
        img.style.height = 'auto';
      }
      // 如果只指定了高度，保持宽高比
      if (sizeParams.height && !sizeParams.width) {
        img.style.width = 'auto';
      }
    } else {
      // 默认样式
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
    }

    // 设置其他图片样式
    img.style.borderRadius = '8px';
    img.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
    img.style.cursor = 'pointer';

    // 创建标题元素
    const title = document.createElement('div');
    title.className = 'xmind-thumbnail-title';
    title.textContent = file.basename;
    title.style.textAlign = 'center';
    title.style.marginTop = '8px';
    title.style.fontSize = '0.9em';
    title.style.color = 'var(--text-muted)';

    // 添加点击事件
    const clickHandler = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      
      if (event.ctrlKey || event.metaKey) {
        // Ctrl+点击：在新标签页中打开
        this.plugin.activateXMindViewer(file);
      } else {
        // 普通点击：在当前视图中打开
        this.plugin.activateXMindViewer(file);
      }
    };

    img.addEventListener('click', clickHandler);
    title.addEventListener('click', clickHandler);

    // 添加悬停效果
    container.addEventListener('mouseenter', () => {
      img.style.transform = 'scale(1.02)';
      img.style.transition = 'transform 0.2s ease';
    });

    container.addEventListener('mouseleave', () => {
      img.style.transform = 'scale(1)';
    });

    // 组装元素
    container.appendChild(img);
    if (isEmbed && this.plugin.settings.showFileName) {
      container.appendChild(title);
    }

    return container;
  }
}

/**
 * 创建Markdown后处理器函数
 * @param plugin XMind插件实例
 * @returns 后处理器函数
 */
export function createXMindMarkdownProcessor(plugin: XMindPlugin) {
  const processor = new XMindMarkdownProcessor(plugin.app, plugin);
  
  return async (el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
    await processor.processMarkdown(el, ctx);
  };
}
