import { Editor, Plugin, Notice } from "obsidian";
import { EditorView } from "@codemirror/view";

import { Feature } from "./features/Feature";
import { ZoomFeature } from "./features/ZoomFeature";
import { HeaderNavigationFeature } from "./features/HeaderNavigationFeature";
import { ZoomOnClickFeature } from "./features/ZoomOnClickFeature";
import { LoggerService } from "./services/LoggerService";
import { SettingsService } from "./services/SettingsService";
import { createDebugLogger, DebugLogger } from '../debug-logger';
import { getEditorViewFromEditor } from "./utils/getEditorViewFromEditor";
import XMindPlugin from "../main";

export class ZoomManager {
  protected zoomFeature: ZoomFeature;
  protected features: Feature[];
  private settingsService: SettingsService;
  private logger: LoggerService;
  private debugLogger: DebugLogger;
  private headerNavigationFeature: HeaderNavigationFeature;
  private zoomOnClickFeature: ZoomOnClickFeature;

  constructor(private plugin: XMindPlugin) {
    this.debugLogger = createDebugLogger(plugin);
  }

  async initialize() {
    this.debugLogger.info(`正在初始化缩放功能`);

    try {
      this.settingsService = new SettingsService(this.plugin);
      this.logger = new LoggerService(this.settingsService);
      
      // 创建核心功能
      this.zoomFeature = new ZoomFeature(this.plugin, this.logger);
      
      // 创建面包屑导航功能
      this.headerNavigationFeature = new HeaderNavigationFeature(
        this.plugin,
        this.logger,
        this.zoomFeature
      );
      
      // 创建点击列表项缩放功能
      this.zoomOnClickFeature = new ZoomOnClickFeature(
        this.plugin,
        this.settingsService,
        this.zoomFeature
      );
      
      // 将所有功能加入数组统一管理
      this.features = [
        this.zoomFeature,
        this.headerNavigationFeature,
        this.zoomOnClickFeature
      ];
      
      // 加载所有功能模块
      for (const feature of this.features) {
        await feature.load();
      }
      
      // 添加缩放相关命令
      this.addCommands();
      
      return true;
    } catch (error) {
      console.error("缩放功能初始化失败:", error);
      // 添加后备命令
      this.addFallbackCommands();
      return false;
    }
  }

  private addCommands() {
    this.plugin.addCommand({
      id: 'zoom-in',
      name: '放大到当前选区',
      icon: 'zoom-in',
      editorCallback: (editor) => {
        try {
          const view = getEditorViewFromEditor(editor);
          if (view) {
            this.zoomFeature.zoomIn(view, view.state.selection.main.head);
          }
        } catch (error) {
          this.debugLogger.error("执行缩放命令失败", error);
          new Notice("执行缩放命令失败");
        }
      },
      hotkeys: [
        {
          modifiers: ["Mod"],
          key: ".",
        },
      ],
    });

    this.plugin.addCommand({
      id: 'zoom-out',
      name: '缩小到整个文档',
      icon: 'zoom-out',
      editorCallback: (editor) => {
        try {
          const view = getEditorViewFromEditor(editor);
          if (view) {
            this.zoomFeature.zoomOut(view);
          }
        } catch (error) {
          this.debugLogger.error("执行缩放命令失败", error);
          new Notice("执行缩放命令失败");
        }
      },
      hotkeys: [
        {
          modifiers: ["Mod", "Shift"],
          key: ".",
        },
      ],
    });
  }
  
  private addFallbackCommands() {
    this.plugin.addCommand({
      id: 'zoom-in',
      name: '放大到当前选区',
      icon: 'zoom-in',
      editorCallback: () => {
        new Notice("缩放功能初始化失败，请检查控制台获取更多信息");
      },
      hotkeys: [
        {
          modifiers: ["Mod"],
          key: ".",
        },
      ],
    });

    this.plugin.addCommand({
      id: 'zoom-out',
      name: '缩小到整个文档',
      icon: 'zoom-out',
      editorCallback: () => {
        new Notice("缩放功能初始化失败，请检查控制台获取更多信息");
      },
      hotkeys: [
        {
          modifiers: ["Mod", "Shift"],
          key: ".",
        },
      ],
    });
  }

  async unload() {
    this.debugLogger.info(`卸载缩放功能`);

    if (!this.features) return;
    
    for (const feature of this.features) {
      try {
        await feature.unload();
      } catch (error) {
        this.debugLogger.error("卸载功能时出错", error);
      }
    }
  }

  public updateSettings() {
    // 更新缩放设置
    if (this.settingsService) {
      this.settingsService.zoomOnClick = this.plugin.settings.zoomOnClick;
      this.settingsService.debug = this.plugin.settings.debugMode;
    }
  }

  public getZoomRange(editor: Editor) {
    try {
      if (!this.zoomFeature) return null;
      
      const cm = getEditorViewFromEditor(editor);
      if (!cm) return null;
      
      const range = this.zoomFeature.calculateVisibleContentRange(cm.state);
      if (!range) return null;
      
      const from = cm.state.doc.lineAt(range.from);
      const to = cm.state.doc.lineAt(range.to);
      
      return {
        from: {
          line: from.number - 1,
          ch: range.from - from.from,
        },
        to: {
          line: to.number - 1,
          ch: range.to - to.from,
        },
      };
    } catch (error) {
      this.debugLogger.error("获取缩放范围失败", error);
      return null;
    }
  }

  public zoomOut(editor: Editor) {
    try {
      if (!this.zoomFeature) return;
      
      const view = getEditorViewFromEditor(editor);
      if (view) {
        this.zoomFeature.zoomOut(view);
      }
    } catch (error) {
      console.error("缩小操作失败:", error);
    }
  }

  public zoomIn(editor: Editor, line: number) {
    try {
      if (!this.zoomFeature) return;
      
      const cm = getEditorViewFromEditor(editor);
      if (!cm) return;
      
      const pos = cm.state.doc.line(line + 1).from;
      this.zoomFeature.zoomIn(cm, pos);
    } catch (error) {
      console.error("放大操作失败:", error);
    }
  }

  public refreshZoom(editor: Editor) {
    try {
      if (!this.zoomFeature) return;
      
      const view = getEditorViewFromEditor(editor);
      if (view) {
        this.zoomFeature.refreshZoom(view);
      }
    } catch (error) {
      console.error("刷新缩放失败:", error);
    }
  }
} 