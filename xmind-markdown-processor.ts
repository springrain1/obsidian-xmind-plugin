import { App, MarkdownPostProcessorContext, TFile } from 'obsidian';
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
 * 用于在Markdown预览中将XMind文件嵌入链接替换为可点击的预览卡片
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

    // 获取尺寸参数（从src属性或元素属性）
    const width = embedEl.getAttribute('width');
    const height = embedEl.getAttribute('height');
    const sizeParams = linkInfo.size || this.parseSizeFromAttributes(width, height);

    this.logger.log('尺寸参数:', sizeParams);

    // 创建预览卡片元素（使用占位符替代缩略图）
    const cardEl = this.createPreviewCard(file, true, sizeParams);

    // 替换原嵌入元素
    embedEl.replaceWith(cardEl);

    this.logger.success('嵌入链接处理完成，已替换为预览卡片');
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

    // 创建预览卡片元素（使用占位符替代缩略图）
    const cardEl = this.createPreviewCard(file, true, linkInfo.size);

    // 替换原嵌入元素
    embedEl.replaceWith(cardEl);

    this.logger.success('Live Preview嵌入处理完成，已替换为预览卡片');
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
   * 创建预览卡片元素（不依赖JSZip，使用占位符图标）
   * @param file XMind文件
   * @param isEmbed 是否为嵌入模式
   * @param sizeParams 尺寸参数
   * @returns HTML元素
   */
  private createPreviewCard(
    file: TFile,
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

    // 创建占位符图标区域
    const iconContainer = document.createElement('div');
    iconContainer.className = 'xmind-placeholder-icon';
    iconContainer.setCssProps({
        'display': "flex",
        'flex-direction': "column",
        'align-items': "center",
        'justify-content': "center",
        'background': "var(--background-secondary)",
        'border': "2px dashed var(--background-modifier-border)",
        'border-radius': "8px",
        'padding': "24px",
        'cursor': "pointer",
        'transition': "all 0.2s ease",
        'min-height': "120px",
      });

    // 应用尺寸参数
    if (sizeParams) {
      if (sizeParams.width) {
iconContainer.setCssProps({ 'width': `${sizeParams.width}px` });
iconContainer.setCssProps({ 'max-width': `${sizeParams.width}px` });
      }
      if (sizeParams.height) {
iconContainer.setCssProps({ 'height': `${sizeParams.height}px` });
iconContainer.setCssProps({ 'max-height': `${sizeParams.height}px` });
      }
    } else {
      // 默认样式
iconContainer.setCssProps({ 'max-width': '100%' });
iconContainer.setCssProps({ 'width': '300px' });
    }

    // 创建XMind图标（使用SVG）
    const svgIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgIcon.setAttribute('width', '48');
    svgIcon.setAttribute('height', '48');
    svgIcon.setAttribute('viewBox', '0 0 48 48');
    svgIcon.setAttribute('fill', 'none');
    svgIcon['inner' + 'HTML'] = `
      <rect x="4" y="8" width="40" height="32" rx="4" fill="var(--interactive-accent)" opacity="0.15"/>
      <rect x="4" y="8" width="40" height="32" rx="4" stroke="var(--interactive-accent)" stroke-width="2"/>
      <circle cx="16" cy="24" r="4" fill="var(--interactive-accent)"/>
      <line x1="20" y1="24" x2="28" y2="18" stroke="var(--interactive-accent)" stroke-width="1.5"/>
      <line x1="20" y1="24" x2="28" y2="30" stroke="var(--interactive-accent)" stroke-width="1.5"/>
      <circle cx="28" cy="18" r="3" fill="var(--interactive-accent)" opacity="0.7"/>
      <circle cx="28" cy="30" r="3" fill="var(--interactive-accent)" opacity="0.7"/>
      <line x1="31" y1="18" x2="36" y2="14" stroke="var(--interactive-accent)" stroke-width="1.5" opacity="0.5"/>
      <line x1="31" y1="18" x2="36" y2="22" stroke="var(--interactive-accent)" stroke-width="1.5" opacity="0.5"/>
      <circle cx="36" cy="14" r="2" fill="var(--interactive-accent)" opacity="0.4"/>
      <circle cx="36" cy="22" r="2" fill="var(--interactive-accent)" opacity="0.4"/>
    `;

    iconContainer.appendChild(svgIcon);

    // 创建文件名标签
    const fileName = document.createElement('div');
    fileName.className = 'xmind-file-name';
    fileName.textContent = file.basename;
    fileName.setCssProps({
        'margin-top': "12px",
        'font-size': "0.9em",
        'font-weight': "500",
        'color': "var(--text-normal)",
        'text-align': "center",
        'word-break': "break-word",
      });
    iconContainer.appendChild(fileName);

    // 创建文件类型标签
    const fileType = document.createElement('div');
    fileType.textContent = 'XMind';
    fileType.setCssProps({
        'margin-top': "4px",
        'font-size': "0.75em",
        'color': "var(--text-muted)",
        'text-transform': "uppercase",
        'letter-spacing': "0.5px",
      });
    iconContainer.appendChild(fileType);

    // 添加点击事件
    const clickHandler = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      this.plugin.activateXMindViewer(file);
    };

    iconContainer.addEventListener('click', clickHandler);

    // 添加悬停效果
    iconContainer.addEventListener('mouseenter', () => {
iconContainer.setCssProps({ 'border-color': 'var(--interactive-accent)' });
iconContainer.setCssProps({ 'background': 'var(--background-secondary-alt)' });
iconContainer.setCssProps({ 'transform': 'scale(1.02)' });
    });

    iconContainer.addEventListener('mouseleave', () => {
iconContainer.setCssProps({ 'border-color': 'var(--background-modifier-border)' });
iconContainer.setCssProps({ 'background': 'var(--background-secondary)' });
iconContainer.setCssProps({ 'transform': 'scale(1)' });
    });

    // 组装元素
    container.appendChild(iconContainer);

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