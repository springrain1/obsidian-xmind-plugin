import {
  App,
  Menu,
  MenuItem,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
  TFile,
  TFolder,
  WorkspaceLeaf,
  ItemView,
  Editor
} from 'obsidian';

// 定义类型以兼容不同版本的 Obsidian
interface ViewState {
  type: string;
  state?: any;
  popstate?: boolean;
}
import { XMindViewer, XMindView, VIEW_TYPE_XMIND } from './xmind-viewer';
import { VIEW_TYPE_XMIND as XMIND_VIEWER_TYPE, XMindViewerView, XMindViewerCreator } from './xmind-viewer-view';
import { XMindEmbedViewer } from 'xmind-embed-viewer';
import {
  useXMindAIConverter,
  checkXMindAPIAvailability
} from './online-converter';
import { ZoomManager } from './zoom/ZoomManager';
import { createXMindMarkdownProcessor } from './xmind-markdown-processor';
import { createXMindEmbedViewerWithFallback } from './xmind-embed-helper';
import { createDebugLogger, DebugLogger } from './debug-logger';

// 导入思维导图相关模块
import { around } from 'monkey-around';
import { MindMapSettings } from './src/settings';
import { MindMapSettingsTab } from './src/settingTab';
import { MindMapView, mindmapViewType } from './src/MindMapView';
import { frontMatterKey, basicFrontmatter, FRONT_MATTER_REGEX } from './src/constants';
import { t } from './src/lang/helpers';

// 导入 AI 服务相关模块
import { AIService } from './src/services/ai/AIService';
import { AIServiceFactory } from './src/services/ai/AIServiceFactory';
import { AISettingsManager } from './src/settings/AISettings';
import { ContextMenuIntegration } from './src/services/ai/integration/ContextMenuIntegration';
import { MindmapAIIntegration } from './src/services/ai/integration/MindmapAIIntegration';

// 使用不同的视图类型名称
const XMIND_FILE_VIEW_TYPE = 'xmind-file-view';
const XMIND_PREVIEW_TYPE = 'xmind-preview-view';

// 帮助功能暂时移除，因为Modal在当前版本不可用

// 更新接口定义，添加新的在线转换相关设置项
interface XMindSettings {
  xmindPath: string;
  useOnlineConverter: boolean; // 是否使用在线转换器（控制命令栏和右键菜单中的在线转换选项）
  enableXMindViewer: boolean; // 是否启用XMind预览功能（控制预览器、右键菜单和命令）
  enableFileSync: boolean; // 是否启用XMind与Markdown文件同步功能
  syncMode: 'all' | 'folders'; // 同步模式：全库文件或指定文件夹
  syncFolders: string[]; // 需要同步的文件夹列表

  // XMind缩略图嵌入功能设置
  enableXMindEmbedThumbnail: boolean; // 是否启用XMind缩略图嵌入功能
  showFileName: boolean; // 是否在缩略图下方显示XMind文件名标签

  // XMindEmbedViewer服务设置
  xmindViewerRegion: 'cn' | 'global'; // XMind预览器服务区域：国内或全球

  // Zoom功能相关设置
  enableZoom: boolean; // 是否启用Zoom功能
  zoomOnClick: boolean; // 点击项目符号时是否自动放大

  // 全局调试设置
  globalDebugMode: boolean; // 全局调试模式，控制所有功能的调试日志输出

  // 思维导图设置
  mindmapTheme: string; // 思维导图主题
  mindmapCanvasSize: number; // 画布大小
  mindmapBackground: string; // 背景色
  mindmapFontSize: number; // 字体大小
  mindmapHeadLevel: number; // 标题级别
  mindmapLayoutDirect: string; // 布局方向
  mindmapColor?: string; // 颜色
  mindmapExportMdModel?: string; // 导出模式
  mindmapStrokeArray?: any[]; // 描边数组
  mindmapFocusOnMove: boolean; // 移动时聚焦
  requireFrontMatter: boolean; // 是否需要YAML前置元数据

  // AI 服务设置
  ai?: {
    provider?: string;
    prompts?: Record<string, string>;
    savePath?: string;
    [key: string]: any;
  };
}

const DEFAULT_SETTINGS: XMindSettings = {
  xmindPath: '',
  useOnlineConverter: true,
  enableXMindViewer: true,
  enableFileSync: false,
  syncMode: 'all',
  syncFolders: [],

  // XMind缩略图嵌入功能设置
  enableXMindEmbedThumbnail: true,
  showFileName: false,

  // XMindEmbedViewer服务默认设置
  xmindViewerRegion: 'cn', // 默认使用国内区域

  // Zoom功能默认设置
  enableZoom: true,
  zoomOnClick: true,

  // 全局调试默认设置
  globalDebugMode: false,

  // 思维导图默认设置
  mindmapTheme: 'classic',
  mindmapCanvasSize: 8000,
  mindmapBackground: 'transparent',
  mindmapFontSize: 16,
  mindmapHeadLevel: 2,
  mindmapLayoutDirect: 'mindmap',
  mindmapColor: undefined,
  mindmapExportMdModel: undefined,
  mindmapStrokeArray: undefined,
  mindmapFocusOnMove: false,
  requireFrontMatter: false,

  // AI 服务默认设置
  ai: {
    provider: 'ollama',
    prompts: {
      '🤔 核心洞察': '{{highlight}}。请从全新的角度重新解读上述内容，并在200字内总结其核心思想。',
      '📝 内容扩展': '基于以下内容：{{highlight}}，请提供3-5个相关的扩展要点或子主题。',
      '🔍 深度分析': '请对以下内容进行深度分析：{{highlight}}。包括背景、影响和潜在应用。',
      '💡 创意思考': '基于：{{highlight}}，请提供3个创新的思考角度或应用场景。',
      '📊 结构化总结': '请将以下内容结构化总结：{{highlight}}。使用要点形式组织信息。'
    },
    savePath: ''
  }
};

// XMind 文件视图类
class XMindFileView extends ItemView {
  private plugin: XMindPlugin;

  constructor(leaf: WorkspaceLeaf, plugin: XMindPlugin) {
    super(leaf);
    this.plugin = plugin;
  }
  
  getViewType(): string {
    return XMIND_FILE_VIEW_TYPE;
  }
  
  getDisplayText(): string {
    return "XMind File";
  }
  
  async onOpen(): Promise<void> {
    const container = this.contentEl.createEl('div', { cls: "xmind-container" });
    container.createEl('div', { text: "请打开一个 XMind 文件" });
  }
  
  async onClose(): Promise<void> {
    this.contentEl.empty();
  }
}

// XMind 预览视图类
class XMindPreviewView extends ItemView {
  private plugin: XMindPlugin;
  private viewer: XMindEmbedViewer | null = null;
  private file: TFile | null = null;

  constructor(leaf: WorkspaceLeaf, plugin: XMindPlugin) {
    super(leaf);
    this.plugin = plugin;
  }
  
  getViewType(): string {
    return XMIND_PREVIEW_TYPE;
  }
  
  getDisplayText(): string {
    return this.file ? `XMind: ${this.file.name}` : "XMind 预览";
  }
  
  getIcon(): string {
    return "brain";
  }
  
  async onOpen(): Promise<void> {
    const container = this.contentEl.createEl('div', { cls: "xmind-preview-container" });
    container.createEl('div', { text: "选择一个 XMind 文件以预览" });
  }
  
  async onClose(): Promise<void> {
    if (this.viewer) {
      this.viewer = null;
    }
    this.contentEl.empty();
  }
  
  async setFile(file: TFile): Promise<void> {
    this.file = file;
    
    if (file && file.extension === 'xmind') {
      this.contentEl.empty();

      try {
        // 读取文件内容
        const binary = await this.plugin.app.vault.readBinary(file);

        // 使用回退逻辑创建查看器
        this.viewer = await createXMindEmbedViewerWithFallback({
          el: this.contentEl,
          file: binary,
          styles: {
            width: '100%',
            height: '100%'
          }
        }, this.plugin);

      } catch (error) {
        const errorContainer = this.contentEl.createEl('div', { cls: 'xmind-viewer-error' });
        errorContainer.createEl('h3', { text: '无法加载 XMind 文件' });

        const errorMessage = error instanceof Error ? error.message : String(error);
        errorContainer.createEl('p', { text: errorMessage });

        errorContainer.createEl('p', {
          text: '提示：确保您的 XMind 文件格式正确，并且可以在 XMind 应用中正常打开。'
        });
      }
    }
  }
}

export default class XMindPlugin extends Plugin {
  settings: XMindSettings;
  xmindViewer: XMindViewer;
  xmindViewerCreator: XMindViewerCreator;
  apiAvailable: boolean = false;
  zoomManager: ZoomManager;
  logger: DebugLogger;
  private markdownProcessor: any = null;

  // AI 服务相关属性
  aiService: AIService | null = null;
  aiServiceFactory: AIServiceFactory;
  aiSettingsManager: AISettingsManager;
  contextMenuIntegration: ContextMenuIntegration | null = null;
  mindmapAIIntegration: MindmapAIIntegration | null = null;

  // 思维导图相关属性
  mindmapFileModes: { [file: string]: string } = {};
  _loaded: boolean = false;
  timeOut: any = null;

  async onload() {
    await this.loadSettings();

    // 初始化颜色组设置
    if (this.settings.mindmapColor && !this.settings.mindmapStrokeArray) {
      const colorArray = this.getColorArrayByType(this.settings.mindmapColor, this.settings.mindmapTheme);
      this.settings.mindmapStrokeArray = colorArray;
      await this.saveSettings();
    }

    // 初始化调试日志器
    this.logger = createDebugLogger(this);

    this.logger.info('加载XMind插件');
    this.logger.log('XMind插件设置:', JSON.stringify(this.settings, null, 2));

    // 初始化 AI 服务
    await this.initializeAIServices();

    // 初始化视图创建器
    this.xmindViewer = new XMindViewer(this);
    this.xmindViewerCreator = new XMindViewerCreator(this);

    // 注册思维导图视图
    this.registerView(mindmapViewType, (leaf: WorkspaceLeaf) => new MindMapView(leaf, this as any));
    
    // 初始化Zoom管理器（如果启用）
    if (this.settings.enableZoom) {
      this.zoomManager = new ZoomManager(this);
      await this.zoomManager.initialize();
      
      // 添加放大和缩小命令
      this.addCommand({
        id: 'zoom-in',
        name: '放大到当前标题或列表项',
        editorCallback: (editor: Editor) => {
          if (this.zoomManager) {
            const cursor = editor.getCursor();
            const line = cursor.line;
            this.zoomManager.zoomIn(editor, line);
          }
        }
      });
      
      this.addCommand({
        id: 'zoom-out',
        name: '缩小视图（返回上层）',
        editorCallback: (editor: Editor) => {
          if (this.zoomManager) {
            this.zoomManager.zoomOut(editor);
          }
        }
      });
    }
    
    // 注册XMind文件扩展名，确保文件在文件列表中可见
    // 这一步不受enableXMindViewer设置的影响，确保XMind文件总是可见
    this.registerExtensions(['xmind'], VIEW_TYPE_XMIND);
    
    // 当启用XMind预览功能时，注册视图
    if (this.settings.enableXMindViewer) {
      // 注册XMind文件视图
      // 使用类型断言绕过TypeScript的类型检查
      this.registerView(
        VIEW_TYPE_XMIND,
        // @ts-ignore ViewCreator接口在不同版本的Obsidian中定义不同
        (leaf: WorkspaceLeaf) => {
          return new XMindView(leaf, this);
        }
      );

      // 注册XMind预览视图 
      // 使用类型断言绕过TypeScript的类型检查
      this.registerView(
        XMIND_PREVIEW_TYPE,
        // @ts-ignore ViewCreator接口在不同版本的Obsidian中定义不同
        (leaf: WorkspaceLeaf) => {
          return new XMindViewerView(leaf, this);
        }
      );

      // 添加命令以打开XMind预览视图
      this.addCommand({
        id: 'open-xmind-viewer',
        name: '打开XMind预览器',
        callback: () => this.activateXMindViewer()
      });
    }

    // 尝试检测API是否可用
    this.checkAPIAvailability();

    // 根据设置决定是否注册XMind缩略图预览的Markdown后处理器
    this.setupMarkdownProcessor();

    // 仅当启用在线转换时添加命令
    if (this.settings.useOnlineConverter) {
      // 添加统一的XMind AI在线转换命令
      this.addCommand({
        id: 'use-xmind-ai-converter',
        name: '使用XMind AI在线转换',
        editorCallback: (editor: Editor) => {
          const markdown = editor.getValue();
          if (markdown) {
            useXMindAIConverter(markdown);
          } else {
            new Notice('当前编辑器没有内容可转换');
          }
        },
        callback: async () => {
          const activeFile = this.app.workspace.getActiveFile();
          if (activeFile && activeFile.extension === 'md') {
            try {
              const content = await this.app.vault.read(activeFile);
              useXMindAIConverter(content);
            } catch (error) {
              new Notice(`读取文件失败: ${error}`);
            }
          } else {
            // 如果没有打开的文件或不是markdown文件，提示用户
            new Notice('请先打开一个Markdown文件，或在编辑器中选择此命令');
          }
        }
      });
    }

    // 注册右键菜单 - 打开XMind预览（仅当启用XMind预览时）
    if (this.settings.enableXMindViewer) {
      this.registerEvent(
        this.app.workspace.on('file-menu', (menu: Menu, file: TFile) => {
          // 安全检查：确保menu和file存在
          if (!menu || !file) {
            return;
          }

          if (file instanceof TFile && file.extension === 'xmind') {
            menu.addItem((item: MenuItem) => {
              item
                .setTitle('在预览器中打开')
                .setIcon('eye')
                .onClick(async () => {
                  await this.activateXMindViewer(file);
                });
            });
          }
        })
      );
    }

    // 注册右键菜单 - Markdown转XMind
    this.registerEvent(
      this.app.workspace.on('file-menu', (menu: Menu, file: TFile) => {
        // 安全检查：确保menu和file存在
        if (!menu || !file) {
          return;
        }

        if (file instanceof TFile && file.extension === 'md') {
          // 仅当启用了在线转换时添加选项
          if (this.settings.useOnlineConverter) {
            // 添加使用XMind AI在线转换选项
            menu.addItem((item: MenuItem) => {
              item
                .setTitle('使用XMind AI在线转换')
                .setIcon('arrow-up-right')
                .onClick(async () => {
                  try {
                    const content = await this.app.vault.read(file);
                    useXMindAIConverter(content);
                  } catch (error) {
                    new Notice(`读取文件失败: ${error}`);
                  }
                });
            });
          }
        }
      })
    );

    // 添加思维导图命令
    this.addMindMapCommands();

    // 注册文件菜单事件
    this.registerEvents();

    // 注册monkey-around补丁
    this.registerMonkeyAround();

    // 添加设置选项卡
    this.addSettingTab(new XMindSettingTab(this.app, this));

    // 应用初始主题的选中颜色
    this.applyThemeSelectColors(this.settings.mindmapTheme || 'classic');

    // 标记插件已加载完成
    this._loaded = true;
  }

  onunload() {
    this.logger?.info('卸载XMind插件');

    // 标记插件已卸载
    this._loaded = false;

    // 清理 AI 服务资源
    this.cleanupAIServices();

    // 卸载缩放管理器
    if (this.zoomManager) {
      this.zoomManager.unload();
    }

    // 仅当启用了XMind预览功能时释放相关资源
    if (this.settings.enableXMindViewer) {
      this.app.workspace.detachLeavesOfType(VIEW_TYPE_XMIND);
      this.app.workspace.detachLeavesOfType(XMIND_PREVIEW_TYPE);
    }

    // 清理思维导图视图
    this.app.workspace.detachLeavesOfType(mindmapViewType);
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
    
    // 更新缩放管理器设置
    if (this.zoomManager) {
      this.zoomManager.updateSettings();
    }

    // 更新 AI 服务设置
    if (this.aiSettingsManager && this.aiService) {
      this.aiService.updateSettings(this.aiSettingsManager.getSettings());
    }
  }

  /**
   * 激活XMind预览视图
   */
  async activateXMindViewer(file?: TFile): Promise<void> {
    // 获取工作区
    const { workspace } = this.app;

    // 查找是否已有预览视图
    let leaf: WorkspaceLeaf | null = null;
    const leaves = workspace.getLeavesOfType(XMIND_PREVIEW_TYPE);

    if (leaves.length > 0) {
      // 已存在预览视图，使用该视图
      leaf = leaves[0];
    } else {
      // 没有找到预览视图，在右侧创建一个新的
      leaf = workspace.getRightLeaf(false);
      await leaf.setViewState({ type: XMIND_PREVIEW_TYPE, active: true });
    }

    // 显示叶子（如果在折叠的侧边栏中）
    workspace.revealLeaf(leaf);
    
    // 如果指定了文件，加载它
    if (file) {
      const view = leaf.view;
      if (view && typeof (view as any).setFile === 'function') {
        await (view as any).setFile(file);
      } else {
        new Notice("无法加载XMind文件到预览视图");
      }
    }
  }

  // 检查API是否可用
  async checkAPIAvailability(): Promise<void> {
    try {
      this.apiAvailable = await checkXMindAPIAvailability();
      this.logger.info(`XMind AI 网站连接状态: ${this.apiAvailable ? '可用' : '不可用'}`);
    } catch (error) {
      this.logger.error('检查XMind AI可用性时出错', error);
      this.apiAvailable = false;
    }
  }

  /**
   * 设置Markdown后处理器
   */
  private setupMarkdownProcessor(): void {
    if (this.settings.enableXMindEmbedThumbnail) {
      if (!this.markdownProcessor) {
        this.markdownProcessor = createXMindMarkdownProcessor(this);
        // 直接注册Markdown后处理器
        (this as any).registerMarkdownPostProcessor(this.markdownProcessor);
      }
    }
  }

  /**
   * 动态切换嵌入功能
   */
  public toggleEmbedFeature(enabled: boolean): void {
    if (enabled) {
      // 启用缩略图嵌入功能
      if (!this.markdownProcessor) {
        this.setupMarkdownProcessor();
      }
    } else {
      // 禁用缩略图嵌入功能
      this.markdownProcessor = null;
    }

    // 无论启用还是禁用，都需要刷新所有Markdown视图
    this.refreshMarkdownViews();
  }

  /**
   * 刷新所有Markdown视图
   */
  private refreshMarkdownViews(): void {
    const leaves = this.app.workspace.getLeavesOfType('markdown');
    leaves.forEach(leaf => {
      const view = leaf.view as any;
      // 刷新预览模式
      if (view.previewMode) {
        view.previewMode.rerender(true);
      }
      // 刷新实时预览模式
      if (view.editor && view.editor.cm) {
        // 触发编辑器重新渲染
        setTimeout(() => {
          view.editor.cm.refresh();
        }, 100);
      }
    });
  }

  // ========== 思维导图相关方法 ==========

  // 更新所有思维导图视图的设置
  updateAllMindmapViews(settingKey: string, value: any) {
    const mindmapLeaves = this.app.workspace.getLeavesOfType(mindmapViewType);
    mindmapLeaves.forEach((leaf) => {
      const view = leaf.view as MindMapView;
      if (view && view.mindmap) {
        switch (settingKey) {
          case 'canvasSize':
            view.mindmap.setting.canvasSize = value;
            view.mindmap.setAppSetting();
            break;
          case 'fontSize':
            view.mindmap.setting.fontSize = value;
            view.mindmap.setAppSetting();
            view.mindmap.traverseBF((n: any) => {
              n.boundingRect = null;
              n.refreshBox();
            });
            view.mindmap.refresh();
            break;
          case 'headLevel':
            view.mindmap.setting.headLevel = value;
            break;
          case 'background':
            view.mindmap.setting.background = value;
            view.mindmap.setAppSetting();
            break;
          case 'layoutDirect':
            view.mindmap.setting.layoutDirect = value;
            view.mindmap.refresh();
            break;
          case 'strokeArray':
            view.mindmap.setting.strokeArray = value;
            if (view.mindmap.mmLayout) {
              view.mindmap.mmLayout.colors = value;
            }
            view.mindmap.traverseBF((n: any) => {
              n.boundingRect = null;
              n.refreshBox();
            });
            view.mindmap.refresh();
            break;
          case 'theme':
            view.mindmap.setting.theme = value;
            // 更新主题类名
            view.mindmap.appEl.className = view.mindmap.appEl.className.replace(/mm-theme-\w+/g, '');
            view.mindmap.appEl.classList.add(`mm-theme-${value}`);
            // 应用主题样式
            this.applyThemeStyles(view.mindmap, value);
            view.mindmap.refresh();
            break;
        }
      }
    });
  }

  // 根据颜色组类型和主题获取颜色数组
  getColorArrayByType(colorType: string, theme: string): string[] {
    switch (colorType) {
      case 'theme-auto':
        return this.getThemeColors(theme);
      case 'pure-colors':
        return ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
      case 'warm-colors':
        return ['#FF6B6B', '#FFD166', '#F7931E', '#FF5722', '#E91E63', '#9C27B0'];
      case 'cool-colors':
        return ['#2196F3', '#03DAC6', '#4CAF50', '#00BCD4', '#3F51B5', '#673AB7'];
      case 'nature-colors':
        return ['#4CAF50', '#8BC34A', '#CDDC39', '#FFC107', '#FF9800', '#795548'];
      case 'business-colors':
        return ['#2C3E50', '#34495E', '#7F8C8D', '#95A5A6', '#BDC3C7', '#ECF0F1'];
      // 单色系列
      case 'mono-blue':
        return ['#2196F3', '#2196F3', '#2196F3', '#2196F3', '#2196F3', '#2196F3'];
      case 'mono-green':
        return ['#4CAF50', '#4CAF50', '#4CAF50', '#4CAF50', '#4CAF50', '#4CAF50'];
      case 'mono-red':
        return ['#F44336', '#F44336', '#F44336', '#F44336', '#F44336', '#F44336'];
      case 'mono-purple':
        return ['#9C27B0', '#9C27B0', '#9C27B0', '#9C27B0', '#9C27B0', '#9C27B0'];
      case 'mono-orange':
        return ['#FF9800', '#FF9800', '#FF9800', '#FF9800', '#FF9800', '#FF9800'];
      case 'mono-teal':
        return ['#009688', '#009688', '#009688', '#009688', '#009688', '#009688'];
      case 'mono-indigo':
        return ['#3F51B5', '#3F51B5', '#3F51B5', '#3F51B5', '#3F51B5', '#3F51B5'];
      case 'mono-pink':
        return ['#E91E63', '#E91E63', '#E91E63', '#E91E63', '#E91E63', '#E91E63'];
      // 渐变色系列
      case 'gradient-blue':
        return ['#0D47A1', '#1565C0', '#1976D2', '#1E88E5', '#2196F3', '#42A5F5'];
      case 'gradient-green':
        return ['#1B5E20', '#2E7D32', '#388E3C', '#43A047', '#4CAF50', '#66BB6A'];
      case 'gradient-red':
        return ['#B71C1C', '#C62828', '#D32F2F', '#E53935', '#F44336', '#EF5350'];
      case 'gradient-purple':
        return ['#4A148C', '#6A1B9A', '#7B1FA2', '#8E24AA', '#9C27B0', '#AB47BC'];
      case 'gradient-orange':
        return ['#E65100', '#EF6C00', '#F57C00', '#FB8C00', '#FF9800', '#FFA726'];
      default:
        return this.getThemeColors(theme);
    }
  }

  // 获取颜色组的显示名称
  getColorGroupName(colorType: string): string {
    const colorGroupNames: { [key: string]: string } = {
      'theme-auto': '🎨 主题自适应',
      'pure-colors': '🌈 纯色系列',
      'warm-colors': '🔥 暖色系列',
      'cool-colors': '❄️ 冷色系列',
      'nature-colors': '🌿 自然系列',
      'business-colors': '💼 商务系列',
      'mono-blue': '🔵 单色-蓝色',
      'mono-green': '🟢 单色-绿色',
      'mono-red': '🔴 单色-红色',
      'mono-purple': '🟣 单色-紫色',
      'mono-orange': '🟠 单色-橙色',
      'mono-teal': '🔷 单色-青色',
      'mono-indigo': '🟦 单色-靛蓝',
      'mono-pink': '🩷 单色-粉色',
      'gradient-blue': '🌊 渐变-蓝色',
      'gradient-green': '🌱 渐变-绿色',
      'gradient-red': '🔥 渐变-红色',
      'gradient-purple': '🌸 渐变-紫色',
      'gradient-orange': '🍊 渐变-橙色'
    };
    return colorGroupNames[colorType] || colorType;
  }

  // 根据主题获取推荐的颜色组
  getRecommendedColorType(theme: string): string {
    switch (theme) {
      case 'classic':
        return 'cool-colors';
      case 'business':
        return 'business-colors';
      case 'creative':
        return 'gradient-purple';
      case 'nature':
        return 'nature-colors';
      case 'tech':
        return 'mono-blue';
      case 'warm':
        return 'warm-colors';
      case 'cool':
        return 'cool-colors';
      case 'dopamine-orange':
        return 'gradient-orange';
      case 'dopamine-purple':
        return 'gradient-purple';
      case 'dopamine-coral':
        return 'warm-colors';
      case 'dopamine-mint':
        return 'gradient-green';
      case 'dopamine-sunset':
        return 'gradient-red';
      case 'dopamine-ocean':
        return 'gradient-blue';
      default:
        return 'theme-auto';
    }
  }

  // 根据主题获取匹配的颜色
  getThemeColors(theme: string): string[] {
    switch (theme) {
      case 'classic':
        return ['#4a90e2', '#7bb3f0', '#a8d0f7', '#e8f4fd'];
      case 'business':
        return ['#2c3e50', '#34495e', '#5d6d7e', '#85929e'];
      case 'creative':
        return ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'];
      case 'nature':
        return ['#27ae60', '#2ecc71', '#58d68d', '#a9dfbf'];
      case 'tech':
        return ['#0d1117', '#161b22', '#21262d', '#30363d'];
      case 'warm':
        return ['#e67e22', '#f39c12', '#f7dc6f', '#fdeaa7'];
      case 'cool':
        return ['#3498db', '#5dade2', '#85c1e9', '#d6eaf8'];
      case 'dopamine-orange':
        return ['#FF6B6B', '#FFD166', '#FF8E53', '#FFA726'];
      case 'dopamine-purple':
        return ['#9B5DE5', '#F15BB5', '#C77DFF', '#E0AAFF'];
      case 'dopamine-coral':
        return ['#FF5E5B', '#FFED66', '#FF8A80', '#FFB74D'];
      case 'dopamine-blue':
        return ['#6A67CE', '#FCD757', '#FC7A57', '#42A5F5'];
      case 'dopamine-pink':
        return ['#EF476F', '#06D6A0', '#FF6B9D', '#26C6DA'];
      case 'dopamine-ruby':
        return ['#E71D36', '#2EC4B6', '#FF5722', '#00ACC1'];
      default:
        return ['#4a90e2', '#7bb3f0', '#a8d0f7', '#e8f4fd'];
    }
  }

  // 应用主题选中颜色
  applyThemeSelectColors(theme: string) {
    // 获取主题对应的选中颜色配置
    const selectColorConfig = this.getThemeSelectColors(theme);

    // 更新CSS变量
    document.documentElement.style.setProperty('--mindmap-select-border', selectColorConfig.border);
    document.documentElement.style.setProperty('--mindmap-select-shadow-rgb', selectColorConfig.shadowRgb);
  }

  // 获取主题选中颜色配置
  getThemeSelectColors(theme: string): { border: string; shadowRgb: string } {
    switch (theme) {
      case 'classic':
        return { border: '#2c5aa0', shadowRgb: '44, 90, 160' };
      case 'business':
        return { border: '#e74c3c', shadowRgb: '231, 76, 60' };
      case 'creative':
        return { border: '#ff6b6b', shadowRgb: '255, 107, 107' };
      case 'nature':
        return { border: '#e67e22', shadowRgb: '230, 126, 34' };
      case 'tech':
        return { border: '#f85149', shadowRgb: '248, 81, 73' };
      case 'warm':
        return { border: '#8e44ad', shadowRgb: '142, 68, 173' };
      case 'cool':
        return { border: '#e74c3c', shadowRgb: '231, 76, 60' };
      case 'dopamine-orange':
        return { border: '#2E86AB', shadowRgb: '46, 134, 171' };
      case 'dopamine-purple':
        return { border: '#00F5FF', shadowRgb: '0, 245, 255' };
      case 'dopamine-coral':
        return { border: '#4A90E2', shadowRgb: '74, 144, 226' };
      case 'dopamine-blue':
        return { border: '#E91E63', shadowRgb: '233, 30, 99' };
      case 'dopamine-pink':
        return { border: '#FFD700', shadowRgb: '255, 215, 0' };
      case 'dopamine-ruby':
        return { border: '#FF9500', shadowRgb: '255, 149, 0' };
      default:
        return { border: '#2c5aa0', shadowRgb: '44, 90, 160' };
    }
  }

  // 应用主题样式
  applyThemeStyles(mindmap: any, theme: string) {
    // 如果用户设置了自定义背景颜色，则不应用主题背景
    const hasCustomBackground = this.settings.mindmapBackground && this.settings.mindmapBackground !== 'transparent';

    // 应用主题选中颜色
    this.applyThemeSelectColors(theme);

    if (!hasCustomBackground) {
      // 根据主题设置背景色和其他样式
      switch (theme) {
        case 'classic':
          mindmap.setting.background = '#f8f9fa';
          break;
        case 'business':
          mindmap.setting.background = '#2c3e50';
          break;
        case 'creative':
          mindmap.setting.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
          break;
        case 'nature':
          mindmap.setting.background = '#e8f5e8';
          break;
        case 'tech':
          mindmap.setting.background = '#0d1117';
          break;
        case 'warm':
          mindmap.setting.background = '#fff8e1';
          break;
        case 'cool':
          mindmap.setting.background = '#e3f2fd';
          break;
        case 'dopamine-orange':
          mindmap.setting.background = 'linear-gradient(135deg, #FF6B6B 0%, #FFD166 100%)';
          break;
        case 'dopamine-purple':
          mindmap.setting.background = 'linear-gradient(135deg, #9B5DE5 0%, #F15BB5 100%)';
          break;
        case 'dopamine-coral':
          mindmap.setting.background = 'linear-gradient(135deg, #FF5E5B 0%, #FFED66 100%)';
          break;
        case 'dopamine-blue':
          mindmap.setting.background = 'linear-gradient(135deg, #6A67CE 0%, #FCD757 100%)';
          break;
        case 'dopamine-pink':
          mindmap.setting.background = 'linear-gradient(135deg, #EF476F 0%, #06D6A0 100%)';
          break;
        case 'dopamine-ruby':
          mindmap.setting.background = 'linear-gradient(135deg, #E71D36 0%, #2EC4B6 100%)';
          break;
        default:
          mindmap.setting.background = 'transparent';
      }
      mindmap.setAppSetting();
    }
  }



  async setMarkdownView(leaf: WorkspaceLeaf) {
    await (leaf as any).setViewState(
      {
        type: "markdown",
        state: (leaf.view as any).getState(),
        popstate: true,
      } as ViewState,
      { focus: true }
    );
  }

  async setMindMapView(leaf: WorkspaceLeaf) {
    await (leaf as any).setViewState({
      type: mindmapViewType,
      state: (leaf.view as any).getState(),
      popstate: true,
    } as ViewState);
  }

  registerEvents() {
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu: any, file: TFile, _source: string, leaf?: WorkspaceLeaf) => {
        // 安全检查：确保menu和file存在
        if (!menu || !file) {
          return;
        }

        // Add a menu item to the folder context menu to create a board
        if (file instanceof TFolder) {
          menu.addItem((item: any) => {
            item
              .setTitle(`${t('New mindmap board')}`)
              .setIcon('document')
              .onClick(() => this.newMindMap(file));
          });
        }

        //add markdown view menu open as mind map view
        if (leaf && file instanceof TFile && file.extension === 'md') {
          // 检查当前视图类型，只在非思维导图视图中添加"打开为思维导图"选项
          const currentViewType = leaf.view.getViewType();

          if (currentViewType !== mindmapViewType) {
            // 根据requireFrontMatter设置决定是否显示菜单项
            if (this.settings.requireFrontMatter) {
              // 如果需要YAML前置元数据，则检查文件是否有相应的YAML
              const cache = (this.app as any).metadataCache.getFileCache(file);
              if (cache?.frontmatter && cache.frontmatter[frontMatterKey]) {
                // 只有含有mindmap-plugin的YAML前置元数据才显示菜单
                menu.addItem((item: any) => {
                  item
                    .setTitle(`${t('Open as mindmap board')}`)
                    .setIcon("document")
                    .onClick(() => {
                      this.mindmapFileModes[file.path] = mindmapViewType;
                      this.setMindMapView(leaf);
                    });
                });
              }
            } else {
              // 如果不需要YAML前置元数据，则为所有Markdown文件添加菜单项
              menu.addItem((item: any) => {
                item
                  .setTitle(`${t('Open as mindmap board')}`)
                  .setIcon("document")
                  .onClick(() => {
                    this.mindmapFileModes[file.path] = mindmapViewType;
                    this.setMindMapView(leaf);
                  });
              });
            }
          }
        }
      })
    );

    this.registerEvent(
      (this.app as any).metadataCache.on("changed", (file) => {
        this.app.workspace.getLeavesOfType(mindmapViewType).forEach((leaf) => {
          try {
            const view = leaf.view as MindMapView;
            // 确保视图存在且有 onFileMetadataChange 方法
            if (view && typeof view.onFileMetadataChange === 'function') {
              view.onFileMetadataChange(file);
            }
          } catch (error) {
            console.debug('Error calling onFileMetadataChange:', error);
          }
        });
      })
    );
  }

  async newMindMap(folder?: TFolder) {
    const targetFolder = folder
      ? folder
      : (this.app as any).fileManager.getNewFileParent(
        this.app.workspace.getActiveFile()?.path || ""
      );

    try {
      // @ts-ignore
      const mindmap: TFile = await (this.app as any).fileManager.createNewMarkdownFile(
        targetFolder,
        `${t('Untitled mindmap')}`
      );

      // 根据用户设置决定是否添加前置元数据
      // 注意：此设置在UI中不可见，默认为false，保持与原版行为一致
      if (this.settings.requireFrontMatter) {
        // 如果需要前置元数据，则添加
        await this.app.vault.modify(mindmap, basicFrontmatter);
      } else {
        // 如果不需要前置元数据，则添加一个根节点作为开始
        await this.app.vault.modify(mindmap, `# ${t('Untitled mindmap')}`);
      }

      setTimeout(async ()=>{
         await (this.app.workspace as any).getLeaf().setViewState({
           type: mindmapViewType,
           state: { file: mindmap.path },
         });
      },100);
    } catch (e) {
      console.error("Error creating mindmap board:", e);
    }
  }

  // 添加思维导图命令
  addMindMapCommands() {
    // 创建新思维导图
    this.addCommand({
      id: 'Create New MindMap',
      name: `${t('Create new mindmap')}`,
      checkCallback: (checking: boolean) => {
        let leaf = (this.app.workspace as any).activeLeaf;
        if (leaf) {
          if (!checking) {
            const targetFolder = (this.app.vault as any).getRoot();
            if (targetFolder) {
              this.newMindMap(targetFolder);
            }
          }
          return true;
        }
        return false;
      }
    });

    // 切换思维导图/Markdown视图
    this.addCommand({
      id: 'Toggle to markdown or mindmap',
      name: `${t('Toggle markdown/mindmap')}`,
      callback: () => {
        const mindmapView = (this.app.workspace as any).getActiveViewOfType(MindMapView);
        const activeView = (this.app.workspace as any).getActiveViewOfType(ItemView);
        const markdownView = activeView && activeView.getViewType() === 'markdown' ? activeView : null;

        if(mindmapView != null && mindmapView.file && mindmapView.file.path) {
          this.mindmapFileModes[mindmapView.file.path] = 'markdown';
          this.setMarkdownView(mindmapView.leaf);
        } else if(markdownView != null && markdownView.file && markdownView.file.path) {
          // 检查是否需要YAML前置元数据
          if (this.settings.requireFrontMatter) {
            // 如果需要YAML，检查文件是否包含所需的前置元数据
            const cache = (this.app as any).metadataCache.getFileCache(markdownView.file);
            if (cache?.frontmatter && cache.frontmatter[frontMatterKey]) {
              // 包含所需的YAML前置元数据，可以切换
              this.mindmapFileModes[markdownView.file.path] = mindmapViewType;
              this.setMindMapView(markdownView.leaf);
            } else {
              // 不包含所需的YAML前置元数据，显示提示
              new Notice(`${t("YAML frontmatter is required to open as mindmap")}`);
            }
          } else {
            // 不需要YAML前置元数据，直接切换
            this.mindmapFileModes[markdownView.file.path] = mindmapViewType;
            this.setMindMapView(markdownView.leaf);
          }
        }
      }
    });

    // Alt + Shift + C - 复制节点
    this.addCommand({
      id: 'Copy Node',
      name: `${t('Copy node')}`,
      hotkeys: [
        {
          modifiers: ['Alt', 'Shift'],
          key: 'C',
        },
      ],
      callback: () => {
        const mindmapView = (this.app.workspace as any).getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          navigator.clipboard.writeText('');
          var node = mindmap.selectNode;
          if(node){
            var text = mindmap.copyNode(node);
            navigator.clipboard.writeText(text);
          }
        }
      }
    });

    // Alt + Shift + V - 粘贴节点
    this.addCommand({
      id: 'Paste Node',
      name: `${t('Paste node')}`,
      hotkeys: [
        {
          modifiers: ['Alt', 'Shift'],
          key: 'V',
        },
      ],
      callback: () => {
        const mindmapView = (this.app.workspace as any).getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          navigator.clipboard.readText().then(text=>{
              mindmap.pasteNode(text);
              // Copy once more so that the node can be copied once more
              navigator.clipboard.writeText(text);
          });
        }
      }
    });

    // Alt + Shift + Z - 撤销
    this.addCommand({
      id: 'Undo',
      name: `${t('Undo')}`,
      hotkeys: [
        {
          modifiers: ['Alt', 'Shift'],
          key: 'Z',
        },
      ],
      callback: () => {
        const mindmapView = (this.app.workspace as any).getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          mindmap.undo();
        }
      }
    });

    // Alt + Shift + Y - 重做
    this.addCommand({
      id: 'Redo',
      name: `${t('Redo')}`,
      hotkeys: [
        {
          modifiers: ['Alt', 'Shift'],
          key: 'Y',
        },
      ],
      callback: () => {
        const mindmapView = (this.app.workspace as any).getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          mindmap.redo();
        }
      }
    });

    // Alt + Ctrl + Shift + Z - 替换为之前的文本
    this.addCommand({
      id: 'Replace by the previous text',
      name: `${t('Replace by the previous text')}`,
      callback: () => {
        const mindmapView = (this.app.workspace as any).getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          var node = mindmap.selectNode;
          if(node) {
              // var text = (node.data.oldText as string);
              var text = (node.data.oldText);
              if(text) {
                  node.data.text = text;
                  node.data.oldText = null;
                  mindmap.refresh();
              }
          }
        }
      }
    });

    // Shift + F2 - 编辑节点
    this.addCommand({
      id: 'Edit node',
      name: `${t('Edit node')}`,
      hotkeys: [
        {
          modifiers: ['Shift'],
          key: 'F2',
        },
      ],
      callback: () => {
        const mindmapView = (this.app.workspace as any).getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          var node = mindmap.selectNode;
          if(node){
            mindmap.editNode(node);
          }
        }
      }
    });

    // Alt + Shift + Enter - 添加兄弟节点/结束编辑
    this.addCommand({
      id: 'Add sibling/end editing',
      name: `${t('Add sibling/end editing')}`,
      hotkeys: [
        {
          modifiers: ['Alt', 'Shift'],
          key: 'Enter',
        },
      ],
      callback: () => {
        const mindmapView = (this.app.workspace as any).getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          var node = mindmap.selectNode;
          if(node){
            if(mindmap.editNode == node){
              mindmap.endEdit();
            } else {
              var newNode = mindmap.addSibling(node);
              if(newNode){
                mindmap.selectNode = newNode;
                mindmap.editNode(newNode);
              }
            }
          }
        }
      }
    });

    // Shift + Tab / Insert - 插入子节点
    this.addCommand({
      id: 'Insert child',
      name: `${t('Insert child')}`,
      hotkeys: [
        {
          modifiers: ['Shift'],
          key: 'Tab',
        },
        {
          modifiers: [],
          key: 'Insert',
        },
      ],
      callback: () => {
        const mindmapView = (this.app.workspace as any).getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          var node = mindmap.selectNode;
          if(node){
            var newNode = mindmap.addChild(node);
            if(newNode){
              mindmap.selectNode = newNode;
              mindmap.editNode(newNode);
            }
          }
        }
      }
    });

    // Shift + Delete - 删除节点及子节点
    this.addCommand({
      id: 'Delete node & child',
      name: `${t('Delete node & child')}`,
      hotkeys: [
        {
          modifiers: ['Shift'],
          key: 'Delete',
        },
      ],
      callback: () => {
        const mindmapView = (this.app.workspace as any).getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          var node = mindmap.selectNode;
          if(node && node.parent){
            mindmap.deleteNode(node);
          }
        }
      }
    });

    // Alt + Shift + S - 选择节点文本
    this.addCommand({
      id: 'Select the node\'s text',
      name: `${t('Select the node\'s text')}`,
      callback: () => {
        const mindmapView = (this.app.workspace as any).getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          var node = mindmap.selectNode;
          if(node && mindmap.editNode == node){
            var textarea = mindmap.editDiv.querySelector('textarea');
            if(textarea){
              textarea.select();
            }
          }
        }
      }
    });

    // Alt + Shift + B - 加粗节点文本
    this.addCommand({
      id: 'Bold the node\'s text',
      name: `${t('Bold the node\'s text')}`,
      hotkeys: [
        {
          modifiers: ['Alt', 'Shift'],
          key: 'B',
        },
      ],
      callback: () => {
        const mindmapView = (this.app.workspace as any).getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          var node = mindmap.selectNode;
          if(node){
            if(mindmap.editNode == node){
              var textarea = mindmap.editDiv.querySelector('textarea');
              if(textarea){
                var start = textarea.selectionStart;
                var end = textarea.selectionEnd;
                var text = textarea.value;
                var selectedText = text.substring(start, end);
                var newText = text.substring(0, start) + '**' + selectedText + '**' + text.substring(end);
                textarea.value = newText;
                textarea.setSelectionRange(start + 2, end + 2);
              }
            } else {
              node.data.text = '**' + node.data.text + '**';
              mindmap.refresh();
            }
          }
        }
      }
    });

    // Alt + Shift + I - 斜体节点文本
    this.addCommand({
      id: 'Italicize the node\'s text',
      name: `${t('Italicize the node\'s text')}`,
      hotkeys: [
        {
          modifiers: ['Alt', 'Shift'],
          key: 'I',
        },
      ],
      callback: () => {
        const mindmapView = (this.app.workspace as any).getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          var node = mindmap.selectNode;
          if(node){
            if(mindmap.editNode == node){
              var textarea = mindmap.editDiv.querySelector('textarea');
              if(textarea){
                var start = textarea.selectionStart;
                var end = textarea.selectionEnd;
                var text = textarea.value;
                var selectedText = text.substring(start, end);
                var newText = text.substring(0, start) + '*' + selectedText + '*' + text.substring(end);
                textarea.value = newText;
                textarea.setSelectionRange(start + 1, end + 1);
              }
            } else {
              node.data.text = '*' + node.data.text + '*';
              mindmap.refresh();
            }
          }
        }
      }
    });

    // Alt + Shift + H - 高亮节点文本
    this.addCommand({
      id: 'Highlight the node\'s text',
      name: `${t('Highlight the node\'s text')}`,
      hotkeys: [
        {
          modifiers: ['Alt', 'Shift'],
          key: 'H',
        },
      ],
      callback: () => {
        const mindmapView = (this.app.workspace as any).getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          var node = mindmap.selectNode;
          if(node){
            if(mindmap.editNode == node){
              var textarea = mindmap.editDiv.querySelector('textarea');
              if(textarea){
                var start = textarea.selectionStart;
                var end = textarea.selectionEnd;
                var text = textarea.value;
                var selectedText = text.substring(start, end);
                var newText = text.substring(0, start) + '==' + selectedText + '==' + text.substring(end);
                textarea.value = newText;
                textarea.setSelectionRange(start + 2, end + 2);
              }
            } else {
              node.data.text = '==' + node.data.text + '==';
              mindmap.refresh();
            }
          }
        }
      }
    });

    // Alt + Shift + 2 - 删除线节点文本
    this.addCommand({
      id: 'Strike through the node\'s text',
      name: `${t('Strike through the node\'s text')}`,
      callback: () => {
        const mindmapView = (this.app.workspace as any).getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          var node = mindmap.selectNode;
          if(node){
            if(mindmap.editNode == node){
              var textarea = mindmap.editDiv.querySelector('textarea');
              if(textarea){
                var start = textarea.selectionStart;
                var end = textarea.selectionEnd;
                var text = textarea.value;
                var selectedText = text.substring(start, end);
                var newText = text.substring(0, start) + '~~' + selectedText + '~~' + text.substring(end);
                textarea.value = newText;
                textarea.setSelectionRange(start + 2, end + 2);
              }
            } else {
              node.data.text = '~~' + node.data.text + '~~';
              mindmap.refresh();
            }
          }
        }
      }
    });

    // Alt + Down - 展开一级
    this.addCommand({
      id: 'Expand one level',
      name: `${t('Expand one level')}`,
      hotkeys: [
        {
          modifiers: ['Alt'],
          key: 'ArrowDown',
        },
      ],
      callback: () => {
        const mindmapView = (this.app.workspace as any).getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          var node = mindmap.selectNode;
          if(node){
            mindmap.expandLevel(node, 1);
          }
        }
      }
    });

    // Alt + Up - 折叠一级
    this.addCommand({
      id: 'Collapse one level',
      name: `${t('Collapse one level')}`,
      hotkeys: [
        {
          modifiers: ['Alt'],
          key: 'ArrowUp',
        },
      ],
      callback: () => {
        const mindmapView = (this.app.workspace as any).getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          var node = mindmap.selectNode;
          if(node){
            mindmap.collapseLevel(node, 1);
          }
        }
      }
    });

    // Ctrl + Shift + Space - 切换展开/折叠节点
    this.addCommand({
      id: 'Toggle expand/collapse node',
      name: `${t('Toggle expand/collapse node')}`,
      hotkeys: [
        {
          modifiers: ['Mod', 'Shift'],
          key: 'Space',
        },
      ],
      callback: () => {
        const mindmapView = (this.app.workspace as any).getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          var node = mindmap.selectNode;
          if(node){
            mindmap._toggleExpandNode(node);
          }
        }
      }
    });

    // Alt + Shift + Up - 向上移动当前节点
    this.addCommand({
      id: 'Move the current node above',
      name: `${t('Move the current node above')}`,
      hotkeys: [
        {
          modifiers: ['Alt', 'Shift'],
          key: 'ArrowUp',
        },
      ],
      callback: () => {
        const mindmapView = (this.app.workspace as any).getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          var node = mindmap.selectNode;
          if(node && node.parent){
            var parent = node.parent;
            var index = parent.children.indexOf(node);
            if(index > 0){
              parent.children.splice(index, 1);
              parent.children.splice(index - 1, 0, node);
              mindmap.refresh();
            }
          }
        }
      }
    });

    // Alt + Shift + Down - 向下移动当前节点
    this.addCommand({
      id: 'Move the current node below',
      name: `${t('Move the current node below')}`,
      hotkeys: [
        {
          modifiers: ['Alt', 'Shift'],
          key: 'ArrowDown',
        },
      ],
      callback: () => {
        const mindmapView = (this.app.workspace as any).getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          var node = mindmap.selectNode;
          if(node && node.parent){
            var parent = node.parent;
            var index = parent.children.indexOf(node);
            if(index < parent.children.length - 1){
              parent.children.splice(index, 1);
              parent.children.splice(index + 1, 0, node);
              mindmap.refresh();
            }
          }
        }
      }
    });

    // Alt + Shift + Left - 向左移动当前节点
    this.addCommand({
      id: 'Move the current node left',
      name: `${t('Move the current node left')}`,
      hotkeys: [
        {
          modifiers: ['Alt', 'Shift'],
          key: 'ArrowLeft',
        },
      ],
      callback: () => {
        const mindmapView = (this.app.workspace as any).getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          var node = mindmap.selectNode;
          if(node && node.parent && node.parent.parent){
            // 将节点移动到父节点的父节点下
            var grandParent = node.parent.parent;
            var parent = node.parent;
            var index = parent.children.indexOf(node);
            parent.children.splice(index, 1);
            grandParent.children.push(node);
            node.parent = grandParent;
            mindmap.refresh();
          }
        }
      }
    });

    // Alt + Shift + Right - 向右移动当前节点
    this.addCommand({
      id: 'Move the current node right',
      name: `${t('Move the current node right')}`,
      hotkeys: [
        {
          modifiers: ['Alt', 'Shift'],
          key: 'ArrowRight',
        },
      ],
      callback: () => {
        const mindmapView = (this.app.workspace as any).getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          var node = mindmap.selectNode;
          if(node && node.parent){
            var parent = node.parent;
            var index = parent.children.indexOf(node);
            if(index > 0){
              // 将节点移动到前一个兄弟节点下作为子节点
              var prevSibling = parent.children[index - 1];
              parent.children.splice(index, 1);
              prevSibling.children.push(node);
              node.parent = prevSibling;
              mindmap.refresh();
            }
          }
        }
      }
    });

    // Alt + Shift + D - 将后续兄弟节点移动为子节点
    this.addCommand({
      id: 'Move next siblings as children',
      name: `${t('Move next siblings as children')}`,
      hotkeys: [
        {
          modifiers: ['Alt', 'Shift'],
          key: 'D',
        },
      ],
      callback: () => {
        const mindmapView = (this.app.workspace as any).getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          var node = mindmap.selectNode;
          if(node && node.parent){
            var parent = node.parent;
            var index = parent.children.indexOf(node);
            var nextSiblings = parent.children.splice(index + 1);
            nextSiblings.forEach(sibling => {
              node.children.push(sibling);
              sibling.parent = node;
            });
            mindmap.refresh();
          }
        }
      }
    });

    // Alt + Ctrl + Shift + D - 将所有兄弟节点移动为子节点
    this.addCommand({
      id: 'Move all siblings as children',
      name: `${t('Move all siblings as children')}`,
      hotkeys: [
        {
          modifiers: ['Alt', 'Ctrl', 'Shift'],
          key: 'D',
        },
      ],
      callback: () => {
        const mindmapView = (this.app.workspace as any).getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          var node = mindmap.selectNode;
          if(node && node.parent){
            var parent = node.parent;
            var index = parent.children.indexOf(node);
            var siblings = parent.children.splice(0);
            siblings.forEach((sibling, i) => {
              if(i !== index){
                node.children.push(sibling);
                sibling.parent = node;
              }
            });
            parent.children.push(node);
            mindmap.refresh();
          }
        }
      }
    });

    // Alt + Shift + J - 与下方节点合并
    this.addCommand({
      id: 'Join with the node below',
      name: `${t('Join with the node below')}`,
      hotkeys: [
        {
          modifiers: ['Alt', 'Shift'],
          key: 'J',
        },
      ],
      callback: () => {
        const mindmapView = (this.app.workspace as any).getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          var node = mindmap.selectNode;
          if(node && node.parent){
            var parent = node.parent;
            var index = parent.children.indexOf(node);
            if(index < parent.children.length - 1){
              var nextNode = parent.children[index + 1];
              node.data.text += ' ' + nextNode.data.text;
              parent.children.splice(index + 1, 1);
              mindmap.refresh();
            }
          }
        }
      }
    });

    // Alt + Shift + Ctrl + J - 作为引用与下方节点合并
    this.addCommand({
      id: 'Join as citation with the node below',
      name: `${t('Join as citation with the node below')}`,
      hotkeys: [
        {
          modifiers: ['Alt', 'Shift', 'Ctrl'],
          key: 'J',
        },
      ],
      callback: () => {
        const mindmapView = (this.app.workspace as any).getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          var node = mindmap.selectNode;
          if(node && node.parent){
            var parent = node.parent;
            var index = parent.children.indexOf(node);
            if(index < parent.children.length - 1){
              var nextNode = parent.children[index + 1];
              node.data.text += ' (' + nextNode.data.text + ')';
              parent.children.splice(index + 1, 1);
              mindmap.refresh();
            }
          }
        }
      }
    });

    // Alt + E - 居中思维导图视图到当前节点
    this.addCommand({
      id: 'Center mindmap view on the current node',
      name: `${t('Center mindmap view on the current node')}`,
      hotkeys: [
        {
          modifiers: ['Alt'],
          key: 'E',
        },
      ],
      callback: () => {
        const mindmapView = (this.app.workspace as any).getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          var node = mindmap.selectNode;
          if(node){
            mindmap.centerNode(node);
          }
        }
      }
    });

    // Alt + Shift + E - 居中思维导图视图
    this.addCommand({
      id: 'Center mindmap view',
      name: `${t('Center mindmap view')}`,
      callback: () => {
        const mindmapView = (this.app.workspace as any).getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          mindmap.center();
        }
      }
    });

    // 导出为HTML（实际导出为SVG格式）
    this.addCommand({
      id: 'Export to html',
      name: `${t('Export to html')}`,
      callback: () => {
        const mindmapView = (this.app.workspace as any).getActiveViewOfType(MindMapView);
        if(mindmapView){
          mindmapView.exportToSvg();
        }
      }
    });

    // 导出为JPEG
    this.addCommand({
      id: 'Export to JPEG',
      name: `${t('Export to JPEG')}`,
      callback: () => {
        const mindmapView = (this.app.workspace as any).getActiveViewOfType(MindMapView);
        if(mindmapView){
          mindmapView.exportToJpeg();
        }
      }
    });

    // 导出为PNG
    this.addCommand({
      id: 'Export to PNG',
      name: `${t('Export to PNG')}`,
      callback: () => {
        const mindmapView = (this.app.workspace as any).getActiveViewOfType(MindMapView);
        if(mindmapView){
          mindmapView.exportToPng();
        }
      }
    });

    // 显示节点信息到控制台（调试用）
    this.addCommand({
      id: 'Display the node\'s info in console',
      name: `${t('Display the node\'s info in console')}`,
      callback: () => {
        const mindmapView = (this.app.workspace as any).getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          var node = mindmap.selectNode;
          if(node){
            console.log('Node info:', node);
          }
        }
      }
    });

    // 删除换行符
    this.addCommand({
      id: 'Remove line breaks (<br>)',
      name: `${t('Remove line breaks (<br>)')}`,
      hotkeys: [
        {
          modifiers: ['Alt', 'Shift'],
          key: 'L',
        },
      ],
      callback: () => {
        const mindmapView = (this.app.workspace as any).getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          var node = mindmap.selectNode;
          if(node){
            node.data.text = node.data.text.replace(/<br\s*\/?>/gi, ' ');
            mindmap.refresh();
          }
        }
      }
    });

    // 取消编辑
    this.addCommand({
      id: 'Cancel edit',
      name: `${t('Cancel edit')}`,
      callback: () => {
        const mindmapView = (this.app.workspace as any).getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          if(mindmap.editNode){
            mindmap.endEdit();
          }
        }
      }
    });
  }

  // 注册思维导图事件（已合并到src/main.ts中，避免重复注册）

  // 注册monkey-around补丁
  registerMonkeyAround() {
    const self = this;

    (this as any).register(
      around(WorkspaceLeaf.prototype, {
        // Kanbans can be viewed as markdown or kanban, and we keep track of the mode
        // while the file is open. When the file closes, we no longer need to keep track of it.
        detach(next: any) {
          return function () {
            const state = this.view?.getState();

            // 安全检查：确保文件路径有效
            if (state?.file && typeof state.file === 'string' && state.file.trim() !== '') {
              // 使用file.path作为主要键
              const fileKey = state.file;
              if (self.mindmapFileModes[fileKey]) {
                delete self.mindmapFileModes[fileKey];
              }
            }
            return next.apply(this);
          };
        },

        setViewState(next) {
          return function (state: any, ...rest: any[]) {
            try {
              // 检查必要条件
              if (
                self._loaded &&
                state.type === "markdown" &&
                state.state?.file &&
                typeof state.state.file === 'string' &&
                state.state.file.trim() !== '' &&
                // 确认文件模式不是markdown - 这是关键检查！
                self.mindmapFileModes[state.state.file] !== "markdown"
              ) {
                // 检查文件是否存在
                const file = (self.app.vault as any).getAbstractFileByPath(state.state.file);
                if (!file || !(file instanceof TFile)) {
                  // 如果文件不存在或不是TFile类型，使用原始方法处理
                  return next.apply(this, [state, ...rest]);
                }

                // 获取文件的缓存信息
                const cache = (self.app as any).metadataCache.getFileCache(file);

                // 方式1：检查YAML前置元数据
                if (cache?.frontmatter && cache.frontmatter[frontMatterKey]) {
                  // 如果有YAML前置元数据，强制视图类型为思维导图
                  const newState = {
                    ...state,
                    type: mindmapViewType,
                  };
                  self.mindmapFileModes[state.state.file] = mindmapViewType;
                  return next.apply(this, [newState, ...rest]);
                }

                // 当关闭"需要YAML前置元数据"设置时，不自动将md文件转换为思维导图
                // 用户需要手动通过右键菜单选择"打开为思维导图"
              }

              // 检查是否有记录的文件模式
              if (state?.state?.file && self.mindmapFileModes[state.state.file]) {
                const mode = self.mindmapFileModes[state.state.file];
                if (mode === mindmapViewType && state.type !== mindmapViewType) {
                  // 应该是思维导图视图但当前不是，切换到思维导图视图
                  const newState = {
                    ...state,
                    type: mindmapViewType,
                  };
                  return next.apply(this, [newState, ...rest]);
                } else if (mode === 'markdown' && state.type !== 'markdown') {
                  // 应该是markdown视图但当前不是，切换到markdown视图
                  const newState = {
                    ...state,
                    type: 'markdown',
                  };
                  return next.apply(this, [newState, ...rest]);
                }
              }

              return next.apply(this, [state, ...rest]);
            } catch (error) {
              console.error('Error in setViewState monkey patch:', error);
              return next.apply(this, [state, ...rest]);
            }
          };
        },
      })
    );
  }

  // AI 服务相关方法

  /**
   * 初始化 AI 服务
   */
  private async initializeAIServices(): Promise<void> {
    try {
      // 初始化 AI 服务工厂
      this.aiServiceFactory = AIServiceFactory.getInstance();
      this.aiServiceFactory.initializeDefaultProviders();

      // 初始化 AI 设置管理器
      this.aiSettingsManager = new AISettingsManager(this.settings.ai);

      // 创建 AI 服务实例
      if (this.aiSettingsManager.getSettings()) {
        this.aiService = this.aiServiceFactory.createAIService(this.aiSettingsManager.getSettings());
      }

      // 初始化上下文菜单集成
      if (this.aiService) {
        this.contextMenuIntegration = new ContextMenuIntegration(this.app, this.aiService, this);
        this.mindmapAIIntegration = new MindmapAIIntegration(this.app, this.aiService, this);
      }

      // 注册编辑器右键菜单
      this.registerEvent(
        this.app.workspace.on('editor-menu', (menu, editor, view) => {
          if (this.contextMenuIntegration) {
            this.contextMenuIntegration.registerEditorMenu(menu, editor, view);
          }
        })
      );

      // 注册文件右键菜单
      this.registerEvent(
        this.app.workspace.on('file-menu', (menu, file) => {
          // 安全检查：确保menu和file存在
          if (!menu || !file) {
            return;
          }

          if (this.contextMenuIntegration) {
            this.contextMenuIntegration.registerFileMenu(menu, file);
          }
        })
      );

      // 添加 AI 相关命令
      this.addAICommands();

      this.logger.info('AI 服务初始化完成');
    } catch (error) {
      this.logger.error('AI 服务初始化失败', error);
    }
  }

  /**
   * 添加 AI 相关命令
   */
  private addAICommands(): void {
    // 测试 AI 连接命令
    this.addCommand({
      id: 'test-ai-connection',
      name: '测试 AI 服务连接',
      callback: async () => {
        if (this.aiService) {
          try {
            const isConnected = await this.aiService.testConnection();
            if (isConnected) {
              new Notice('AI 服务连接成功！');
            } else {
              new Notice('AI 服务连接失败，请检查配置');
            }
          } catch (error) {
            new Notice(`AI 服务连接失败: ${error.message}`);
          }
        } else {
          new Notice('AI 服务未配置');
        }
      }
    });

    // 调试 AI 设置命令
    this.addCommand({
      id: 'debug-ai-settings',
      name: '调试 AI 设置状态',
      callback: () => {
        console.log('=== AI 设置调试信息 ===');
        console.log('主设置 ai:', this.settings.ai);
        console.log('aiSettingsManager 存在:', !!this.aiSettingsManager);
        if (this.aiSettingsManager) {
          const aiSettings = this.aiSettingsManager.getSettings();
          console.log('aiSettingsManager 设置:', aiSettings);
          console.log('aiSettingsManager prompts:', aiSettings.prompts);
        }
        console.log('aiService 存在:', !!this.aiService);
        new Notice('AI 设置调试信息已输出到控制台');
      }
    });

    // AI 分析选中文本命令
    this.addCommand({
      id: 'ai-analyze-selection',
      name: 'AI 分析选中文本',
      editorCallback: async (editor) => {
        const selectedText = editor.getSelection();
        if (!selectedText) {
          new Notice('请先选择要分析的文本');
          return;
        }

        if (!this.aiService) {
          new Notice('AI 服务未配置');
          return;
        }

        const processingNotice = new Notice('AI 正在分析中...', 0);

        try {
          const response = await this.aiService?.generateResponse(
            '请对以下内容进行简要分析：{{highlight}}',
            selectedText,
            ''
          );

          processingNotice.hide();

          // 在选中文本后插入分析结果
          const cursor = editor.getCursor('to');
          const insertText = `\n\n**AI 分析:**\n${response}\n`;
          editor.setCursor(cursor);
          editor.replaceSelection(insertText);

          new Notice('AI 分析完成');
        } catch (error) {
          processingNotice.hide();
          new Notice(`AI 分析失败: ${error.message}`);
        }
      }
    });

    // AI 弹窗快捷键命令
    this.addCommand({
      id: 'ai-modal-insert',
      name: 'AI弹窗：插入内容',
      callback: () => {
        // 这个命令会被 StreamingModal 动态处理
        // 当弹窗打开时，会监听这个命令的快捷键
      }
    });

    this.addCommand({
      id: 'ai-modal-replace',
      name: 'AI弹窗：替换内容',
      callback: () => {
        // 这个命令会被 StreamingModal 动态处理
        // 当弹窗打开时，会监听这个命令的快捷键
      }
    });

    // 思维导图 AI 扩展命令
    this.addCommand({
      id: 'mindmap-ai-expand',
      name: '思维导图 AI 扩展',
      callback: () => {
        const activeLeaf = this.app.workspace.getActiveViewOfType(MindMapView);
        if (activeLeaf && this.mindmapAIIntegration) {
          new Notice('请在思维导图中右键点击节点使用 AI 扩展功能');
        } else {
          new Notice('请先打开思维导图视图');
        }
      }
    });
  }

  /**
   * 更新 AI 服务
   */
  public updateAIService(): void {
    if (this.aiSettingsManager && this.aiServiceFactory) {
      const settings = this.aiSettingsManager.getSettings();
      this.aiService = this.aiServiceFactory.createAIService(settings);

      // 更新集成服务
      if (this.contextMenuIntegration) {
        this.contextMenuIntegration.updateAIService(this.aiService);
      }
      if (this.mindmapAIIntegration) {
        this.mindmapAIIntegration.updateAIService(this.aiService);
      }
    }
  }

  /**
   * 获取 AI 服务状态
   */
  public getAIServiceStatus(): { available: boolean; provider: string; configured: boolean } {
    if (!this.aiService || !this.aiSettingsManager) {
      return { available: false, provider: 'none', configured: false };
    }

    const settings = this.aiSettingsManager.getSettings();
    const validation = this.aiSettingsManager.validateSettings();

    return {
      available: this.aiService !== null,
      provider: settings.provider,
      configured: validation.isValid
    };
  }

  /**
   * 清理 AI 服务资源
   */
  private cleanupAIServices(): void {
    if (this.contextMenuIntegration) {
      this.contextMenuIntegration.cleanup();
      this.contextMenuIntegration = null;
    }

    if (this.mindmapAIIntegration) {
      this.mindmapAIIntegration.cleanup();
      this.mindmapAIIntegration = null;
    }

    if (this.aiServiceFactory) {
      this.aiServiceFactory.cleanup();
    }

    this.aiService = null;
    this.aiSettingsManager = null;
  }
}

export class XMindSettingTab extends PluginSettingTab {
	plugin: XMindPlugin;

	constructor(app: App, plugin: XMindPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	/**
	 * 动态切换XMind预览功能
	 */
	private toggleXMindViewerFeature(enabled: boolean): void {
		if (enabled) {
			// 启用预览功能
			if (!this.plugin.xmindViewer) {
				this.plugin.xmindViewer = new XMindViewer(this.plugin);
			}
			if (!this.plugin.xmindViewerCreator) {
				this.plugin.xmindViewerCreator = new XMindViewerCreator(this.plugin);
			}
		} else {
			// 禁用预览功能
			// 关闭所有打开的XMind预览视图
			this.plugin.app.workspace.detachLeavesOfType(VIEW_TYPE_XMIND);
		}
	}

	/**
	 * 动态切换XMind缩略图嵌入功能
	 */
	private toggleXMindEmbedFeature(enabled: boolean): void {
		// 调用插件的公共方法来切换功能
		this.plugin.toggleEmbedFeature(enabled);
	}

	/**
	 * 创建帮助按钮
	 */
	private createHelpButton(containerEl: HTMLElement, title: string, content: string): void {
		const helpButton = containerEl.createEl('button', {
			cls: 'xmind-help-button',
			text: '?'
		});

		helpButton.addEventListener('click', () => {
			// 创建帮助提示
			const helpDiv = document.createElement('div');
			helpDiv.innerHTML = `<strong>${title}</strong><br><br>${content}`;
			helpDiv.style.cssText = `
				position: fixed;
				top: 50%;
				left: 50%;
				transform: translate(-50%, -50%);
				background: var(--background-primary);
				border: 1px solid var(--background-modifier-border);
				border-radius: 8px;
				padding: 20px;
				max-width: 500px;
				max-height: 400px;
				overflow-y: auto;
				z-index: 10000;
				box-shadow: 0 4px 12px rgba(0,0,0,0.15);
			`;

			// 创建关闭按钮
			const closeBtn = document.createElement('button');
			closeBtn.textContent = '关闭';
			closeBtn.style.cssText = `
				margin-top: 15px;
				padding: 8px 16px;
				background: var(--interactive-accent);
				color: var(--text-on-accent);
				border: none;
				border-radius: 4px;
				cursor: pointer;
			`;

			closeBtn.onclick = () => document.body.removeChild(helpDiv);
			helpDiv.appendChild(closeBtn);

			// 添加到页面
			document.body.appendChild(helpDiv);

			// 点击外部关闭
			setTimeout(() => {
				const clickOutside = (e: MouseEvent) => {
					if (!helpDiv.contains(e.target as Node)) {
						document.body.removeChild(helpDiv);
						document.removeEventListener('click', clickOutside);
					}
				};
				document.addEventListener('click', clickOutside);
			}, 100);
		});
	}

	/**
	 * 获取XMind路径设置帮助内容
	 */
	private getXMindPathHelp(): string {
		return `
			<strong>常见XMind路径参考：</strong><br>
			• Windows: <code>C:\\Program Files\\XMind\\XMind.exe</code><br>
			• macOS: <code>/Applications/XMind.app/Contents/MacOS/XMind</code><br>
			• Linux: <code>/usr/bin/xmind</code> 或 <code>/opt/xmind/XMind</code><br><br>

			<strong>查找XMind路径的方法：</strong><br>
			1. 右键点击XMind快捷方式<br>
			2. 选择"属性"（Windows）或"显示简介"（macOS）<br>
			3. 查看路径信息<br><br>

			<strong>注意：</strong>请确保填写的是XMind主程序的完整路径，包括可执行文件名（如XMind.exe）
		`;
	}

	/**
	 * 获取在线转换帮助内容
	 */
	private getOnlineConverterHelp(): string {
		return `
			<strong>关于XMind AI在线转换：</strong><br>
			• 使用XMind AI在线转换需要互联网连接<br>
			• 在线转换支持XMind、PDF和PNG格式导出<br>
			• 启用后，您可以通过命令面板或右键菜单使用在线转换功能<br>
			• 文件内容将发送到XMind AI服务器进行处理（注意隐私安全）<br>
			• 了解更多信息，请访问 <a href="https://xmind.ai/markdown-to-mind-map" target="_blank">XMind AI</a>
		`;
	}

	/**
	 * 获取预览功能帮助内容
	 */
	private getViewerHelp(): string {
		return `
			<strong>关于XMind预览功能：</strong><br>
			• 启用后可在Obsidian中直接查看和导航XMind思维导图<br>
			• 双击XMind文件将在Obsidian中打开预览<br>
			• 在命令面板中可使用"打开XMind预览器"命令<br>
			• 在文件浏览器中右键点击XMind文件可选择"在预览器中打开"<br>
			• 禁用此功能后，XMind文件仍会显示在文件列表中，但双击时会使用系统默认应用打开<br>
			• 关闭此功能可减少对系统资源的占用，适合性能受限的设备
		`;
	}

	/**
	 * 获取Zoom功能帮助内容
	 */
	private getZoomHelp(): string {
		return `
			<strong>关于Zoom功能：</strong><br>
			• 启用后可在Markdown编辑器中放大标题或列表项进行聚焦编辑<br>
			• 支持多级标题和列表项的放大显示<br>
			• 点击标题或列表项的标记可自动放大该部分<br>
			• 使用快捷键可快速切换放大/缩小状态<br>
			• 提高长文档的编辑效率和专注度
		`;
	}

	/**
	 * 获取缩略图嵌入功能帮助内容
	 */
	private getEmbedHelp(): string {
		return `
			<strong>关于XMind缩略图嵌入功能：</strong><br>
			• 在Markdown文档中使用 <code>![[xxx.xmind]]</code> 语法显示XMind文件的缩略图预览<br>
			• 点击缩略图可用系统默认应用打开XMind文件<br>
			• 支持显示文件名标签，便于识别<br>
			• 可根据需要开启或关闭文件名标签显示<br>
			• 提供便捷的思维导图预览和访问方式
		`;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		// 添加主容器
		const mainContainer = containerEl.createEl('div', { cls: 'xmind-settings-container' });

		// 添加标题
		mainContainer.createEl('h1', {
			text: 'XMind Integration 设置',
			cls: 'xmind-settings-title'
		});

        // XMind Zoom 功能区
        const zoomSection = mainContainer.createEl('div', { cls: 'xmind-settings-section' });
		const zoomTitle = zoomSection.createEl('div', { cls: 'xmind-settings-title' });
		zoomTitle.createEl('span', { text: 'Zoom 功能设置' });
		this.createHelpButton(zoomTitle, 'Zoom功能帮助', this.getZoomHelp());

        const zoomBranch1 = zoomSection.createEl('div', { cls: 'xmind-branch' });
        new Setting(zoomBranch1)
            .setName('启用 Zoom 功能')
            .setDesc('启用后可在 Markdown 文件中放大标题或列表项进行聚焦编辑')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableZoom)
                .onChange(async (value: boolean) => {
                    this.plugin.settings.enableZoom = value;
                    await this.plugin.saveSettings();
                    if (this.plugin.zoomManager) {
                        this.plugin.zoomManager.updateSettings();
                    }
                    new Notice('Zoom功能已' + (value ? '启用' : '禁用'), 2000);
                }));

        const zoomBranch2 = zoomSection.createEl('div', { cls: 'xmind-branch' });
        new Setting(zoomBranch2)
            .setName('点击时自动放大')
            .setDesc('启用后，点击标题或列表项的标记将自动放大该部分')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.zoomOnClick)
                .onChange(async (value: boolean) => {
                    this.plugin.settings.zoomOnClick = value;
                    await this.plugin.saveSettings();
                    if (this.plugin.zoomManager) {
                        this.plugin.zoomManager.updateSettings();
                    }
                }));

		// XMind 集成设置区
		const integrationSection = mainContainer.createEl('div', { cls: 'xmind-settings-section' });
		const integrationTitle = integrationSection.createEl('div', { cls: 'xmind-settings-title' });
		integrationTitle.createEl('span', { text: 'XMind 格式转换设置' });
		this.createHelpButton(integrationTitle, 'XMind路径设置帮助', this.getXMindPathHelp());

		// 添加XMind描述
		const descEl = integrationSection.createEl('div', { cls: 'setting-item-description xmind-leaf' });
		descEl.innerHTML = '实现Markdown和XMind文件的相互转换。';

		// 添加XMind路径设置
		const pathBranch = integrationSection.createEl('div', { cls: 'xmind-branch' });
		new Setting(pathBranch)
		  .setName('XMind 可执行文件路径')
		  .setDesc('设置XMind可执行文件的完整路径，可选')
		  .addText(text => text
			.setPlaceholder('例如: C:\\Program Files\\XMind\\XMind.exe')
			.setValue(this.plugin.settings.xmindPath)
			.onChange(async (value: string) => {
			  this.plugin.settings.xmindPath = value;
			  await this.plugin.saveSettings();
			}));
		
		// 在线转换相关设置
		const onlineSection = mainContainer.createEl('div', { cls: 'xmind-settings-section' });
		const onlineTitle = onlineSection.createEl('div', { cls: 'xmind-settings-title' });
		onlineTitle.createEl('span', { text: 'XMind AI 在线转换设置' });
		this.createHelpButton(onlineTitle, '在线转换帮助', this.getOnlineConverterHelp());

		const onlineDescEl = onlineSection.createEl('div', { cls: 'setting-item-description xmind-leaf' });
		onlineDescEl.innerHTML = 'XMind AI提供在线Markdown转思维导图功能，可以生成高质量的思维导图并支持多种导出格式。';

		const onlineBranch = onlineSection.createEl('div', { cls: 'xmind-branch' });
		new Setting(onlineBranch)
		  .setName('启用在线转换')
		  .setDesc('启用后可通过命令面板和右键菜单使用XMind AI进行在线转换')
		  .addToggle(toggle => toggle
			.setValue(this.plugin.settings.useOnlineConverter)
			.onChange(async (value: boolean) => {
			  this.plugin.settings.useOnlineConverter = value;
			  await this.plugin.saveSettings();
			  new Notice('在线转换功能已' + (value ? '启用' : '禁用'), 2000);
			}));
		
		// 添加XMind预览功能设置
		const viewerSection = mainContainer.createEl('div', { cls: 'xmind-settings-section' });
		const viewerTitle = viewerSection.createEl('div', { cls: 'xmind-settings-title' });
		viewerTitle.createEl('span', { text: 'XMind 预览功能设置' });
		this.createHelpButton(viewerTitle, 'XMind预览功能帮助', this.getViewerHelp());

		const viewerDescEl = viewerSection.createEl('div', { cls: 'setting-item-description xmind-leaf' });
		viewerDescEl.innerHTML = '启用后可在Obsidian中直接预览XMind文件，无需打开外部应用，需要联网才能使用。';

		const viewerBranch1 = viewerSection.createEl('div', { cls: 'xmind-branch' });
		new Setting(viewerBranch1)
		  .setName('启用XMind预览')
		  .setDesc('启用后可在Obsidian中预览XMind文件')
		  .addToggle(toggle => toggle
			.setValue(this.plugin.settings.enableXMindViewer)
			.onChange(async (value: boolean) => {
			  this.plugin.settings.enableXMindViewer = value;
			  await this.plugin.saveSettings();
			  // 动态启用/禁用预览功能，无需重启
			  this.toggleXMindViewerFeature(value);
			  new Notice('XMind文件预览功能已' + (value ? '启用' : '禁用'), 2000);
			}));

		// XMind预览器服务区域设置
		const viewerBranch2 = viewerSection.createEl('div', { cls: 'xmind-branch' });
		new Setting(viewerBranch2)
		  .setName('XMind预览器服务区域')
		  .setDesc('选择XMind预览器使用的服务区域')
		  .addDropdown(dropdown => {
			dropdown.addOption('cn', '国内区域 (推荐)');
			dropdown.addOption('global', '全球区域');
			dropdown.setValue(this.plugin.settings.xmindViewerRegion);
			dropdown.onChange(async (value: 'cn' | 'global') => {
			  this.plugin.settings.xmindViewerRegion = value;
			  await this.plugin.saveSettings();
			  new Notice('XMind预览器服务区域已更改为：' + (value === 'cn' ? '国内区域' : '全球区域'), 2000);
			});
		  });

		// 添加XMind缩略图嵌入功能设置
		const embedSection = mainContainer.createEl('div', { cls: 'xmind-settings-section' });
		const embedTitle = embedSection.createEl('div', { cls: 'xmind-settings-title' });
		embedTitle.createEl('span', { text: 'XMind 缩略图嵌入功能设置' });
		this.createHelpButton(embedTitle, 'XMind缩略图嵌入帮助', this.getEmbedHelp());

		const embedDescEl = embedSection.createEl('div', { cls: 'setting-item-description xmind-leaf' });
		embedDescEl.innerHTML = '启用后可在Markdown文档中使用 <code>![[xxx.xmind]]</code> 语法显示XMind文件的缩略图预览。';

		const embedBranch1 = embedSection.createEl('div', { cls: 'xmind-branch' });
		new Setting(embedBranch1)
		  .setName('启用XMind缩略图嵌入')
		  .setDesc('启用后可在Markdown中使用 ![[xxx.xmind]] 语法显示缩略图，设置重启生效')
		  .addToggle(toggle => toggle
			.setValue(this.plugin.settings.enableXMindEmbedThumbnail)
			.onChange(async (value: boolean) => {
			  this.plugin.settings.enableXMindEmbedThumbnail = value;
			  await this.plugin.saveSettings();
			  // 动态启用/禁用缩略图嵌入功能，无需重启
			  this.toggleXMindEmbedFeature(value);
			  new Notice('XMind缩略图嵌入功能已' + (value ? '启用' : '禁用'), 2000);
			}));

		const embedBranch2 = embedSection.createEl('div', { cls: 'xmind-branch' });
		new Setting(embedBranch2)
		  .setName('显示文件名标签')
		  .setDesc('是否在缩略图下方显示XMind文件名')
		  .addToggle(toggle => toggle
			.setValue(this.plugin.settings.showFileName)
			.onChange(async (value: boolean) => {
			  this.plugin.settings.showFileName = value;
			  await this.plugin.saveSettings();
			}));

		// 思维导图设置区
			const mindmapSection = mainContainer.createEl('div', { cls: 'xmind-settings-section' });
			const mindmapTitle = mindmapSection.createEl('div', { cls: 'xmind-settings-title' });
			mindmapTitle.createEl('span', { text: 'Enhancing Mindmap设置' });
			this.createHelpButton(mindmapTitle, 'Enhancing Mindmap帮助', this.getMindMapHelp());

			const mindmapDescEl = mindmapSection.createEl('div', { cls: 'setting-item-description xmind-leaf' });
			mindmapDescEl.innerHTML = '配置Enhancing Mindmap的外观、行为和导出选项。这些设置会影响所有markdown文件显示思维导图的效果。';

			// 主题设置
			const themeBranch = mindmapSection.createEl('div', { cls: 'xmind-branch' });
			new Setting(themeBranch)
				.setName('思维导图主题')
				.setDesc('选择思维导图的显示主题，主题优先级高于自定义背景颜色')
				.addDropdown(dropdown => dropdown
					.addOption('classic', '🎨 经典主题')
					.addOption('business', '💼 商务主题')
					.addOption('creative', '✨ 创意主题')
					.addOption('nature', '🌿 自然主题')
					.addOption('tech', '🔧 科技主题')
					.addOption('warm', '🌅 温暖主题')
					.addOption('cool', '❄️ 冷色主题')
					.addOption('dopamine-orange', '🔥 活力橙黄')
					.addOption('dopamine-purple', '👑 梦幻紫粉')
					.addOption('dopamine-coral', '☀️ 珊瑚阳光')
					.addOption('dopamine-blue', '🏔️ 蓝山日出')
					.addOption('dopamine-pink', '💚 活力粉绿')
					.addOption('dopamine-ruby', '⭐ 红宝石绿')
					.setValue(this.plugin.settings.mindmapTheme)
					.onChange(async (value: string) => {
						this.plugin.settings.mindmapTheme = value;
						// 如果颜色组是主题自适应，则更新颜色组
						if (this.plugin.settings.mindmapColor === 'theme-auto') {
							const colorArray = this.plugin.getColorArrayByType('theme-auto', value);
							this.plugin.settings.mindmapStrokeArray = colorArray;
						}
						await this.plugin.saveSettings();
						// 实时更新所有思维导图视图
						this.plugin.updateAllMindmapViews('theme', value);
					}));

			// 画布大小设置
			const canvasBranch = mindmapSection.createEl('div', { cls: 'xmind-branch' });
			new Setting(canvasBranch)
				.setName('画布尺寸')
				.setDesc('绘制思维导图的画布的宽度和高度')
				.addDropdown(dropdown => dropdown
					.addOption('4000', '4000')
					.addOption('6000', '6000')
					.addOption('8000', '8000')
					.addOption('10000', '10000')
					.addOption('12000', '12000')
					.addOption('16000', '16000')
					.addOption('20000', '20000')
					.addOption('30000', '30000')
					.addOption('36000', '36000')
					.setValue(this.plugin.settings.mindmapCanvasSize.toString())
					.onChange(async (value: string) => {
						const numValue = Number.parseInt(value);
						this.plugin.settings.mindmapCanvasSize = numValue;
						await this.plugin.saveSettings();
						// 实时更新所有思维导图视图
						this.plugin.updateAllMindmapViews('canvasSize', numValue);
					}));

			// 字体大小设置
			const fontSizeBranch = mindmapSection.createEl('div', { cls: 'xmind-branch' });
			new Setting(fontSizeBranch)
				.setName('文字大小')
				.setDesc('思维导图节点文字认大小，单位px')
				.addText(text => text
					.setValue(this.plugin.settings.mindmapFontSize.toString())
					.setPlaceholder('Example: 16')
					.onChange(async (value: string) => {
						const numValue = Number.parseInt(value) || 16;
						this.plugin.settings.mindmapFontSize = numValue;
						await this.plugin.saveSettings();
						// 实时更新所有思维导图视图
						this.plugin.updateAllMindmapViews('fontSize', numValue);
					}));

			// 标题级别设置
			const headLevelBranch = mindmapSection.createEl('div', { cls: 'xmind-branch' });
			new Setting(headLevelBranch)
				.setName('节点文字转为markdown标题的最大层级')
				.setDesc('将小于该级别的节点文字转为markdown标题，最大层级为6，因为HTML标签支持最大为6级')
				.addDropdown(dropdown => dropdown
					.addOption('0', '0')
					.addOption('1', '1')
					.addOption('2', '2')
					.addOption('3', '3')
					.addOption('4', '4')
					.addOption('5', '5')
					.addOption('6', '6')
					.setValue(this.plugin.settings.mindmapHeadLevel.toString())
					.onChange(async (value: string) => {
						const numValue = Number.parseInt(value);
						this.plugin.settings.mindmapHeadLevel = numValue;
						await this.plugin.saveSettings();
						// 实时更新所有思维导图视图
						this.plugin.updateAllMindmapViews('headLevel', numValue);
					}));

			// 背景色设置
			const backgroundBranch = mindmapSection.createEl('div', { cls: 'xmind-branch' });
			const backgroundSetting = new Setting(backgroundBranch)
				.setName('背景颜色')
				.setDesc('画布的背景颜色，支持颜色选择器和透明背景');

			// 创建颜色选择器容器
			const colorContainer = backgroundBranch.createEl('div', { cls: 'xmind-color-picker-container' });

			// 创建颜色输入框
			const colorInput = colorContainer.createEl('input', {
				type: 'color',
				cls: 'xmind-color-input'
			}) as HTMLInputElement;

			// 创建文本输入框（用于输入自定义值如transparent）
			const textInput = colorContainer.createEl('input', {
				type: 'text',
				cls: 'xmind-text-input',
				placeholder: 'transparent'
			}) as HTMLInputElement;

			// 创建透明按钮
			const transparentBtn = colorContainer.createEl('button', {
				text: '透明',
				cls: 'xmind-transparent-btn'
			});

			// 设置初始值
			const currentBg = this.plugin.settings.mindmapBackground || 'transparent';
			if (currentBg !== 'transparent' && currentBg.startsWith('#')) {
				colorInput.value = currentBg;
				textInput.value = currentBg;
			} else {
				textInput.value = currentBg;
			}

			// 颜色选择器事件
			colorInput.addEventListener('change', async () => {
				const color = colorInput.value;
				textInput.value = color;
				this.plugin.settings.mindmapBackground = color;
				await this.plugin.saveSettings();
				this.plugin.updateAllMindmapViews('background', color);
			});

			// 文本输入框事件
			textInput.addEventListener('change', async () => {
				const value = textInput.value || 'transparent';
				if (value.startsWith('#') && value.length === 7) {
					colorInput.value = value;
				}
				this.plugin.settings.mindmapBackground = value;
				await this.plugin.saveSettings();
				this.plugin.updateAllMindmapViews('background', value);
			});

			// 透明按钮事件
			transparentBtn.addEventListener('click', async () => {
				textInput.value = 'transparent';
				this.plugin.settings.mindmapBackground = 'transparent';
				await this.plugin.saveSettings();
				this.plugin.updateAllMindmapViews('background', 'transparent');
			});



			// 思维导图布局方向设置
			const layoutDirectBranch = mindmapSection.createEl('div', { cls: 'xmind-branch' });
			new Setting(layoutDirectBranch)
				.setName('思维导图布局方向')
				.setDesc('思维导图的布局方向，分为向两侧发散、仅右侧、仅左侧、仅右侧三个方向')
				.addDropdown(dropdown => dropdown
					.addOption('mind map', '居中')
					.addOption('right', '右')
					.addOption('left', '左')
					.addOption('clockwise', '仅右侧')
					.setValue(this.plugin.settings.mindmapLayoutDirect)
					.onChange(async (value: string) => {
						this.plugin.settings.mindmapLayoutDirect = value;
						await this.plugin.saveSettings();
						// 实时更新所有思维导图视图
						this.plugin.updateAllMindmapViews('layoutDirect', value);
					}));

			// 颜色组设置
			const colorBranch = mindmapSection.createEl('div', { cls: 'xmind-branch' });
			new Setting(colorBranch)
				.setName('颜色组')
				.setDesc('节点线条颜色组合，支持多色系列、单色系列或主题自适应')
				.addDropdown(dropdown => dropdown
					.addOption('theme-auto', '🎨 主题自适应')
					.addOption('pure-colors', '🌈 纯色系列')
					.addOption('warm-colors', '🔥 暖色系列')
					.addOption('cool-colors', '❄️ 冷色系列')
					.addOption('nature-colors', '🌿 自然系列')
					.addOption('business-colors', '💼 商务系列')
					.addOption('mono-blue', '🔵 单色-蓝色')
					.addOption('mono-green', '🟢 单色-绿色')
					.addOption('mono-red', '🔴 单色-红色')
					.addOption('mono-purple', '🟣 单色-紫色')
					.addOption('mono-orange', '🟠 单色-橙色')
					.addOption('mono-teal', '🔷 单色-青色')
					.addOption('mono-indigo', '🟦 单色-靛蓝')
					.addOption('mono-pink', '🩷 单色-粉色')
					.addOption('gradient-blue', '🌊 渐变-蓝色')
					.addOption('gradient-green', '🌱 渐变-绿色')
					.addOption('gradient-red', '🔥 渐变-红色')
					.addOption('gradient-purple', '🌸 渐变-紫色')
					.addOption('gradient-orange', '🍊 渐变-橙色')
					.setValue(this.plugin.settings.mindmapColor || 'theme-auto')
					.onChange(async (value: string) => {
						this.plugin.settings.mindmapColor = value;
						// 根据选择的颜色组生成颜色数组
						const colorArray = this.plugin.getColorArrayByType(value, this.plugin.settings.mindmapTheme);
						this.plugin.settings.mindmapStrokeArray = colorArray;
						await this.plugin.saveSettings();
						// 实时更新所有思维导图视图
						this.plugin.updateAllMindmapViews('strokeArray', colorArray);
					}));

			// 颜色预览区域
			const colorPreviewBranch = mindmapSection.createEl('div', { cls: 'xmind-branch' });
			const colorPreviewContainer = colorPreviewBranch.createEl('div', {
				cls: 'color-preview-container',
				attr: { style: 'margin-top: 10px; padding: 10px; border: 1px solid var(--background-modifier-border); border-radius: 4px;' }
			});

			const previewTitle = colorPreviewContainer.createEl('div', {
				text: '颜色预览',
				attr: { style: 'font-weight: bold; margin-bottom: 8px; font-size: 12px; color: var(--text-muted);' }
			});

			const colorSwatches = colorPreviewContainer.createEl('div', {
				cls: 'color-swatches',
				attr: { style: 'display: flex; gap: 4px; flex-wrap: wrap;' }
			});

			// 更新颜色预览的函数
			const updateColorPreview = (colorType: string) => {
				const colors = this.plugin.getColorArrayByType(colorType, this.plugin.settings.mindmapTheme);
				colorSwatches.empty();
				colors.forEach((color, index) => {
					const swatch = colorSwatches.createEl('div', {
						attr: {
							style: `
								width: 24px;
								height: 24px;
								background-color: ${color};
								border: 1px solid var(--background-modifier-border);
								border-radius: 3px;
								cursor: pointer;
								position: relative;
							`,
							title: `分支 ${index + 1}: ${color}`
						}
					});

					// 添加颜色值标签（鼠标悬停时显示）
					swatch.addEventListener('mouseenter', () => {
						const tooltip = document.createElement('div');
						tooltip.textContent = color;
						tooltip.style.cssText = `
							position: absolute;
							top: -30px;
							left: 50%;
							transform: translateX(-50%);
							background: var(--background-primary);
							border: 1px solid var(--background-modifier-border);
							padding: 2px 6px;
							border-radius: 3px;
							font-size: 10px;
							white-space: nowrap;
							z-index: 1000;
							box-shadow: 0 2px 4px rgba(0,0,0,0.1);
						`;
						swatch.appendChild(tooltip);
					});

					swatch.addEventListener('mouseleave', () => {
						const tooltip = swatch.querySelector('div');
						if (tooltip) tooltip.remove();
					});
				});
			};

			// 初始化预览
			updateColorPreview(this.plugin.settings.mindmapColor || 'theme-auto');

			// 监听颜色组变化并更新预览
			const selectElement = colorBranch.querySelector('select');
			if (selectElement) {
				selectElement.addEventListener('change', (e) => {
					const target = e.target as HTMLSelectElement;
					updateColorPreview(target.value);
				});
			}

			// 移动时聚焦设置
			const focusOnMoveBranch = mindmapSection.createEl('div', { cls: 'xmind-branch' });
			new Setting(focusOnMoveBranch)
				.setName('移动时聚焦')
				.setDesc('启用后，移动节点时会自动聚焦到该节点')
				.addToggle(toggle => toggle
					.setValue(this.plugin.settings.mindmapFocusOnMove)
					.onChange(async (value: boolean) => {
						this.plugin.settings.mindmapFocusOnMove = value;
						await this.plugin.saveSettings();
					}));

			// YAML前置元数据要求设置
			const frontMatterBranch = mindmapSection.createEl('div', { cls: 'xmind-branch' });
			new Setting(frontMatterBranch)
				.setName('需要YAML前置元数据')
				.setDesc('如果启用，思维导图文件将需要YAML前置元数据。如果禁用，您可以创建不带前置元数据的思维导图。')
				.addToggle(toggle => toggle
					.setValue(this.plugin.settings.requireFrontMatter)
					.onChange(async (value: boolean) => {
						this.plugin.settings.requireFrontMatter = value;
						await this.plugin.saveSettings();
					}));

			// AI 服务配置区
			const aiSection = mainContainer.createEl('div', { cls: 'xmind-settings-section' });
			const aiTitle = aiSection.createEl('div', { cls: 'xmind-settings-title' });
			aiTitle.createEl('span', { text: 'AI 服务配置' });

			// 使用HiNote的AI服务配置界面
			this.renderHiNoteAISettings(aiSection);

			// 全局调试设置区
		const debugSection = mainContainer.createEl('div', { cls: 'xmind-settings-section' });
		const debugTitle = debugSection.createEl('div', { cls: 'xmind-settings-title' });
		debugTitle.createEl('span', { text: '调试设置' });

		const debugDescEl = debugSection.createEl('div', { cls: 'setting-item-description xmind-leaf' });
		debugDescEl.innerHTML = '启用全局调试模式后，插件的所有功能都会输出详细的调试日志到浏览器控制台，方便诊断问题。';

		const debugBranch = debugSection.createEl('div', { cls: 'xmind-branch' });
		new Setting(debugBranch)
		  .setName('全局调试模式')
		  .setDesc('启用后所有功能都会输出详细日志，用于诊断问题（按F12打开控制台查看）')
		  .addToggle(toggle => toggle
			.setValue(this.plugin.settings.globalDebugMode)
			.onChange(async (value: boolean) => {
			  this.plugin.settings.globalDebugMode = value;
			  await this.plugin.saveSettings();

			  // 更新所有管理器的调试设置
			  if (this.plugin.zoomManager) {
				this.plugin.zoomManager.updateSettings();
			  }

			  new Notice('全局调试模式已' + (value ? '启用' : '禁用'), 2000);
			}));
		
		// 添加思维导图风格的CSS样式
		const style = document.createElement('style');
		style.textContent = `
		  /* 确保所有文字在多巴胺背景下可读 */
		  .xmind-settings-container,
		  .xmind-settings-container * {
			color: white !important;
		  }

		  /* 设置项名称 - 使用亮白色 */
		  .xmind-settings-container .setting-item-name {
			color: #FFFFFF !important;
			font-weight: 600;
		  }

		  /* 设置项描述 - 使用浅色 */
		  .xmind-settings-container .setting-item-description {
			color: rgba(255, 255, 255, 0.85) !important;
			font-size: 13px;
		  }

		  /* 叶子节点描述 - 使用金色强调 */
		  .xmind-settings-container .xmind-leaf {
			color: #FFE4B5 !important;
		  }

		  /* 输入框文字 */
		  .xmind-settings-container input[type="text"] {
			color: #333 !important;
			background: rgba(255, 255, 255, 0.95) !important;
		  }

		  .xmind-settings-container input[type="text"]::placeholder {
			color: rgba(0, 0, 0, 0.5) !important;
		  }

		  /* 下拉选择器 */
		  .xmind-settings-container select {
			color: #333 !important;
			background: rgba(255, 255, 255, 0.95) !important;
		  }

		  /* 下拉选择器选项 */
		  .xmind-settings-container select option {
			color: #333 !important;
			background: #ffffff !important;
		  }

		  /* 文件夹设置容器样式 */
		  .xmind-folder-setting-container {
			background: rgba(255, 255, 255, 0.1);
			backdrop-filter: blur(10px);
			border: 1px solid rgba(255, 255, 255, 0.2);
			border-radius: 12px;
			padding: 16px;
			margin: 12px 0;
			transition: all 0.3s ease;
		  }

		  .xmind-folder-setting-container:hover {
			transform: translateX(2px);
			box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
		  }

		  /* 文本框容器样式 */
		  .xmind-textarea-container {
			margin: 12px 0;
		  }

		  .xmind-textarea-label {
			font-weight: 600;
			margin-bottom: 8px;
			color: #FFD700 !important;
			font-size: 14px;
		  }

		  /* 文本框样式 */
		  .xmind-folder-textarea {
			width: 100%;
			background: rgba(255, 255, 255, 0.95) !important;
			color: #333 !important;
			font-family: var(--font-monospace);
			font-size: 14px;
			border: 1px solid rgba(255, 255, 255, 0.2);
			border-radius: 8px;
			padding: 12px;
			min-height: 120px;
			resize: vertical;
			transition: all 0.3s ease;
		  }

		  .xmind-folder-textarea:focus {
			border-color: #4ECDC4;
			box-shadow: 0 0 0 2px rgba(78, 205, 196, 0.2);
			outline: none;
		  }

		  .xmind-folder-textarea::placeholder {
			color: rgba(0, 0, 0, 0.5) !important;
		  }

		  /* 确保代码块可读 */
		  .xmind-settings-container code {
			background: rgba(255, 255, 255, 0.2) !important;
			color: #FFE4B5 !important;
			padding: 2px 6px;
			border-radius: 4px;
			font-weight: 500;
		  }
		`;
		containerEl.appendChild(style);
	}

	/**
	 * 获取思维导图帮助信息
	 */
	private getMindMapHelp(): string {
		return `
			<strong>思维导图功能说明：</strong><br>
			• <strong>主题：</strong>选择深色或浅色主题以适应不同的使用环境<br>
			• <strong>画布大小：</strong>较大的画布可以容纳更多内容，但可能影响性能<br>
			• <strong>字体大小：</strong>调整节点文本的显示大小，建议12-20像素<br>
			• <strong>标题级别：</strong>设置思维导图的起始标题级别（1-6）<br>
			• <strong>背景色：</strong>设置思维导图的背景颜色，透明背景会使用编辑器主题<br>
			• <strong>移动时聚焦：</strong>启用后移动节点时会自动居中显示<br>
			• <strong>YAML前置元数据：</strong>启用后只有包含特定YAML的文件才能作为思维导图打开<br><br>

			<strong>快捷键说明：</strong><br>
			• <code>Alt+Shift+C</code>：复制节点<br>
			• <code>Alt+Shift+V</code>：粘贴节点<br>
			• <code>Alt+Shift+Z</code>：撤销<br>
			• <code>Alt+Shift+Y</code>：重做<br>
			• <code>Shift+F2</code>：编辑节点<br>
			• <code>Shift+Tab</code>：插入子节点<br>
			• <code>Shift+Delete</code>：删除节点<br>
			• <code>Alt+E</code>：居中当前节点<br><br>

			<strong>导出功能：</strong><br>
			支持导出为HTML、PNG、JPEG、SVG格式，可通过命令面板访问导出功能。
		`;
	}

	/**
	 * 渲染HiNote风格的AI服务配置
	 */
	private renderHiNoteAISettings(container: HTMLElement): void {
		// 导入HiNote的AIServiceTab
		import('./src/settings/AIServiceTab').then(({ AIServiceTab }) => {
			const aiServiceTab = new AIServiceTab(this.plugin, container);
			aiServiceTab.display();
		}).catch(error => {
			console.error('Failed to load AIServiceTab:', error);
			// 降级到简单的配置界面
			this.displaySimpleAISettings(container);
		});
	}

	/**
	 * 简单的AI服务配置界面（降级方案）
	 */
	private displaySimpleAISettings(container: HTMLElement): void {
		// 确保AI设置对象存在
		if (!this.plugin.settings.ai) {
			this.plugin.settings.ai = {
				provider: 'ollama',
				prompts: {}
			};
		}

		// AI 服务提供商选择
		new Setting(container)
			.setName('AI 服务')
			.setDesc('选择 AI 服务提供商')
			.addDropdown(dropdown => {
				const options = {
					'openai': 'OpenAI',
					'gemini': 'Gemini',
					'anthropic': 'Anthropic',
					'deepseek': 'Deepseek',
					'siliconflow': 'SiliconFlow',
					'ollama': 'Ollama (Local)'
				};

				return dropdown
					.addOptions(options)
					.setValue(this.plugin.settings.ai?.provider || 'ollama')
					.onChange(async (value) => {
						this.plugin.settings.ai.provider = value;
						await this.plugin.saveSettings();
						// 重新显示设置
						container.empty();
						this.displaySimpleAISettings(container);
					});
			});

		// 根据选择的服务显示相应的设置
		switch (this.plugin.settings.ai?.provider) {
			case 'ollama':
				this.displaySimpleOllamaSettings(container);
				break;
			default:
				container.createEl('p', { text: '请配置相应的AI服务设置' });
				break;
		}
	}

	/**
	 * 简单的Ollama设置
	 */
	private displaySimpleOllamaSettings(container: HTMLElement): void {
		// 确保ollama设置对象存在
		if (!this.plugin.settings.ai.ollama) {
			this.plugin.settings.ai.ollama = {
				host: 'http://localhost:11434',
				model: ''
			};
		}

		new Setting(container)
			.setName('服务器 URL')
			.setDesc('Ollama 服务器 URL (默认: http://localhost:11434)')
			.addText(text => {
				text
					.setPlaceholder('http://localhost:11434')
					.setValue(this.plugin.settings.ai.ollama?.host || 'http://localhost:11434')
					.onChange(async (value) => {
						if (!this.plugin.settings.ai.ollama) {
							this.plugin.settings.ai.ollama = {};
						}
						this.plugin.settings.ai.ollama.host = value || 'http://localhost:11434';
						await this.plugin.saveSettings();
					});
			});

		new Setting(container)
			.setName('模型')
			.setDesc('选择一个 Ollama 模型')
			.addText(text => {
				text
					.setPlaceholder('deepseek-r1:8b')
					.setValue(this.plugin.settings.ai.ollama?.model || '')
					.onChange(async (value) => {
						if (!this.plugin.settings.ai.ollama) {
							this.plugin.settings.ai.ollama = {};
						}
						this.plugin.settings.ai.ollama.model = value;
						await this.plugin.saveSettings();
					});
			});
	}



}