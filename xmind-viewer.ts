import {
  App,
  ItemView,
  TFile,
  WorkspaceLeaf,
  FileView
} from 'obsidian';
// @ts-ignore
import { XMindEmbedViewer } from 'xmind-embed-viewer';
import { createXMindEmbedViewerWithFallback } from './xmind-embed-helper';
import { createDebugLogger, DebugLogger } from './debug-logger';

export const VIEW_TYPE_XMIND = 'xmind-viewer';

export class XMindView extends FileView {
  private plugin: any;
  private viewer: XMindEmbedViewer | null = null;
  private logger: DebugLogger;

  constructor(leaf: WorkspaceLeaf, plugin: any) {
    super(leaf);
    this.plugin = plugin;
    this.logger = createDebugLogger(plugin);
    
    // 设置容器样式
    this.contentEl.addClass('xmind-view-container');
    this.contentEl.style.width = '100%';
    this.contentEl.style.height = '100%';
    this.contentEl.style.overflow = 'hidden'; // 防止滚动条出现
    
    // 允许在没有文件的情况下打开视图
    this.allowNoFile = true;
    // 支持导航
    this.navigation = true;
  }

  getViewType(): string {
    return VIEW_TYPE_XMIND;
  }

  getDisplayText(): string {
    if (this.file) {
      return `XMind: ${this.file.name}`;
    }
    return '未打开文件';
  }

  getIcon(): string {
    return 'brain';
  }

  async onLoadFile(file: TFile): Promise<void> {
    // 清空内容区域
    this.contentEl.empty();
    
    try {
      // 读取XMind文件作为二进制
      const binary = await this.plugin.app.vault.readBinary(file);

      // 清理之前的查看器实例
      if (this.viewer) {
        // 尝试清理资源
        this.viewer = null;
      }

      // 使用回退逻辑创建XMind嵌入式查看器
      this.viewer = await createXMindEmbedViewerWithFallback({
        el: this.contentEl,
        file: binary,
        styles: {
          width: '100%',
          height: '100%',
          border: 'none'
        }
      }, this.plugin);

    } catch (error) {
      this.logger.error('加载XMind文件时出错', error);
      this.displayError(error);
    }
  }

  async onUnloadFile(file: TFile): Promise<void> {
    // 清理资源
    if (this.viewer) {
      this.viewer = null;
    }
    this.contentEl.empty();
  }

  canAcceptExtension(extension: string): boolean {
    return extension.toLowerCase() === 'xmind';
  }

  private displayError(error: any): void {
    this.logger.error('XMind Viewer Error', error);
    
    this.contentEl.empty();
    
    const errorContainer = this.contentEl.createEl('div', { cls: 'xmind-viewer-error' });
    errorContainer.createEl('h3', { text: '无法加载 XMind 文件' });
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    errorContainer.createEl('p', { text: errorMessage });
    
    errorContainer.createEl('p', { 
      text: '提示：确保您的 XMind 文件格式正确，并且可以在 XMind 应用中正常打开。' 
    });
  }

  // ItemView 必需的方法
  async onOpen() {
    // 在视图打开时的初始化工作
  }

  async onClose() {
    // 清理资源
    if (this.viewer) {
      this.viewer = null;
    }
    this.contentEl.empty();
  }
}

export class XMindViewer {
  plugin: any;

  constructor(plugin: any) {
    this.plugin = plugin;
  }
} 