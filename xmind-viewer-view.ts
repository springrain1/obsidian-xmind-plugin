import { App, ItemView, TFile, WorkspaceLeaf } from 'obsidian';
import { XMindEmbedViewer } from 'xmind-embed-viewer';
import XMindPlugin from './main';
import { createXMindEmbedViewerWithFallback } from './xmind-embed-helper';
import { createDebugLogger, DebugLogger } from './debug-logger';

export const VIEW_TYPE_XMIND = 'xmind-viewer';

export class XMindViewerView extends ItemView {
    plugin: XMindPlugin;
    viewer: XMindEmbedViewer | null = null;
    file: TFile | null = null;
    private logger: DebugLogger;

    constructor(leaf: WorkspaceLeaf, plugin: XMindPlugin) {
        super(leaf);
        this.plugin = plugin;
        this.logger = createDebugLogger(plugin);
        // 设置容器样式
        this.contentEl.addClass('xmind-viewer-container');
this.contentEl.setCssProps({ 'width': '100%' });
this.contentEl.setCssProps({ 'height': '100%' });
this.contentEl.setCssProps({ 'overflow': 'hidden' });
    }

    getViewType(): string {
        return VIEW_TYPE_XMIND;
    }

    getIcon(): string {
        return 'brain';
    }

    getDisplayText(): string {
        return this.file ? `XMind: ${this.file.name}` : '无标题 XMind';
    }

    async onOpen(): Promise<void> {
        // 视图打开时的初始化
    }

    async onClose(): Promise<void> {
        // 清理资源
        if (this.viewer) {
            this.viewer = null;
        }
        this.contentEl.empty();
    }

    async setFile(file: TFile): Promise<void> {
        this.file = file;
        
        if (file.extension !== 'xmind') {
            this.displayError('不是有效的 XMind 文件');
            return;
        }
        
        try {
            // 清除现有内容
            this.contentEl.empty();

            // 清理之前的查看器实例
            if (this.viewer) {
                this.viewer = null;
            }

            // 读取文件内容
            const binary = await this.plugin.app.vault.readBinary(file);

            // 使用回退逻辑创建查看器
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
            this.displayError(error);
        }
    }

    private displayError(error: Error | string): void {
        this.logger.error('XMind Viewer Error', error);
        
        this.contentEl.empty();
        
        const errorContainer = this.contentEl.createEl('div', { cls: 'xmind-viewer-error' });
        errorContainer.createEl('h3', { text: '无法加载 XMind 文件' });
        
        const errorMessage = typeof error === 'string' ? error : error.message;
        errorContainer.createEl('p', { text: errorMessage });
        
        errorContainer.createEl('p', { 
            text: '提示：确保您的 XMind 文件格式正确，并且可以在 XMind 应用中正常打开。' 
        });
    }
}

export class XMindViewerCreator {
    plugin: XMindPlugin;

    constructor(plugin: XMindPlugin) {
        this.plugin = plugin;
    }

    create(leaf: WorkspaceLeaf): XMindViewerView {
        return new XMindViewerView(leaf, this.plugin);
    }
} 