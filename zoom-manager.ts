import { Editor, Plugin } from "obsidian";
import XMindPlugin from "./main";
import { EditorView } from "@codemirror/view";

import { Feature } from "./zoom/features/Feature";
import { HeaderNavigationFeature } from "./zoom/features/HeaderNavigationFeature";
import { LimitSelectionFeature } from "./zoom/features/LimitSelectionFeature";
import { ListsStylesFeature } from "./zoom/features/ListsStylesFeature";
import { ResetZoomWhenVisibleContentBoundariesViolatedFeature } from "./zoom/features/ResetZoomWhenVisibleContentBoundariesViolatedFeature";
import { ZoomFeature } from "./zoom/features/ZoomFeature";
import { ZoomOnClickFeature } from "./zoom/features/ZoomOnClickFeature";
import { LoggerService } from "./zoom/services/LoggerService";
import { SettingsService } from "./zoom/services/SettingsService";
import { getEditorViewFromEditor } from "./zoom/utils/getEditorViewFromEditor";

/**
 * ZoomManager 类管理 Obsidian Zoom 功能
 * 负责初始化并协调各个缩放功能组件
 */
export class ZoomManager {
  protected zoomFeature: ZoomFeature;
  protected features: Feature[];
  private settingsService: SettingsService;
  private loggerService: LoggerService;

  constructor(private plugin: XMindPlugin) {
    this.settingsService = new SettingsService(this.plugin);
    this.loggerService = new LoggerService(this.settingsService);
  }

  async initialize() {
    try {
      console.log("正在初始化 XMind Zoom 功能");

      // 初始化核心功能
      const zoomFeature = new ZoomFeature(this.plugin, this.loggerService);
      this.zoomFeature = zoomFeature;

      // 创建各个功能组件
      const limitSelectionFeature = new LimitSelectionFeature(
        this.plugin,
        this.loggerService,
        this.zoomFeature
      );
      
      const resetZoomWhenVisibleContentBoundariesViolatedFeature =
        new ResetZoomWhenVisibleContentBoundariesViolatedFeature(
          this.plugin,
          this.loggerService,
          this.zoomFeature,
          this.zoomFeature
        );
      
      const headerNavigationFeature = new HeaderNavigationFeature(
        this.plugin,
        this.loggerService,
        this.zoomFeature,
        this.zoomFeature,
        this.zoomFeature,
        this.zoomFeature,
        this.zoomFeature,
        this.zoomFeature
      );
      
      const zoomOnClickFeature = new ZoomOnClickFeature(
        this.plugin,
        this.settingsService,
        this.zoomFeature
      );
      
      const listsStylesFeature = new ListsStylesFeature(this.settingsService);

      // 保存所有功能组件
      this.features = [
        this.zoomFeature,
        limitSelectionFeature,
        resetZoomWhenVisibleContentBoundariesViolatedFeature,
        headerNavigationFeature,
        zoomOnClickFeature,
        listsStylesFeature,
      ];

      // 添加缩放命令
      this.addCommands();

      // 初始化所有功能
      for (const feature of this.features) {
        await feature.load();
      }

      return true;
    } catch (error) {
      console.error("初始化 XMind Zoom 功能失败:", error);
      this.addFallbackCommands();
      return false;
    }
  }

  /**
   * 添加缩放相关的命令
   */
  private addCommands() {
    // 放大命令
    this.plugin.addCommand({
      id: "xmind-zoom-in",
      name: "放大到当前位置",
      icon: "zoom-in",
      editorCallback: (editor) => {
        const view = getEditorViewFromEditor(editor);
        this.zoomIn(editor, editor.getCursor().line);
      },
      hotkeys: [
        {
          modifiers: ["Mod"],
          key: ".",
        },
      ],
    });

    // 缩小命令
    this.plugin.addCommand({
      id: "xmind-zoom-out",
      name: "缩小到整个文档",
      icon: "zoom-out",
      editorCallback: (editor) => this.zoomOut(editor),
      hotkeys: [
        {
          modifiers: ["Mod", "Shift"],
          key: ".",
        },
      ],
    });
  }

  /**
   * 添加备用命令（当初始化失败时使用）
   */
  private addFallbackCommands() {
    // 当初始化失败时，添加提供错误提示的命令
    this.plugin.addCommand({
      id: "xmind-zoom-in-fallback",
      name: "放大到当前位置 (初始化失败)",
      icon: "zoom-in",
      editorCallback: (editor) => {
        // @ts-ignore -- Legacy code compatibility
        new this.plugin.app.Notice(
          "XMind Zoom 功能初始化失败。请检查控制台错误信息。"
        );
      },
      hotkeys: [
        {
          modifiers: ["Mod"],
          key: ".",
        },
      ],
    });

    this.plugin.addCommand({
      id: "xmind-zoom-out-fallback",
      name: "缩小到整个文档 (初始化失败)",
      icon: "zoom-out",
      editorCallback: (editor) => {
        // @ts-ignore -- Legacy code compatibility
        new this.plugin.app.Notice(
          "XMind Zoom 功能初始化失败。请检查控制台错误信息。"
        );
      },
      hotkeys: [
        {
          modifiers: ["Mod", "Shift"],
          key: ".",
        },
      ],
    });
  }

  /**
   * 卸载缩放功能
   */
  async unload() {
    console.log("正在卸载 XMind Zoom 功能");

    if (this.features) {
      for (const feature of this.features) {
        await feature.unload();
      }
    }
  }

  /**
   * 更新设置
   */
  public updateSettings() {
    // 通知设置服务更新设置
    if (this.settingsService) {
      this.settingsService.save();
    }
  }

  /**
   * 获取当前缩放范围
   */
  public getZoomRange(editor: Editor) {
    if (!this.zoomFeature) return null;

    const cm = getEditorViewFromEditor(editor);
    const range = this.zoomFeature.calculateVisibleContentRange(cm.state);

    if (!range) {
      return null;
    }

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
  }

  /**
   * 缩小到整个文档
   */
  public zoomOut(editor: Editor) {
    if (!this.zoomFeature) return;
    this.zoomFeature.zoomOut(getEditorViewFromEditor(editor));
  }

  /**
   * 放大到指定行
   */
  public zoomIn(editor: Editor, line: number) {
    if (!this.zoomFeature) return;
    
    const cm = getEditorViewFromEditor(editor);
    const pos = cm.state.doc.line(line + 1).from;
    this.zoomFeature.zoomIn(cm, pos);
  }

  /**
   * 刷新当前缩放状态
   */
  public refreshZoom(editor: Editor) {
    if (!this.zoomFeature) return;
    this.zoomFeature.refreshZoom(getEditorViewFromEditor(editor));
  }
} 