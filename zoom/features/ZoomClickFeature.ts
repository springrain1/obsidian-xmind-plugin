import { Editor, Plugin } from "obsidian";
import { EditorView } from "@codemirror/view";

import { Feature } from "./Feature";
import { ZoomFeature } from "./ZoomFeature";
import { getEditorViewFromEditor } from "../utils/getEditorViewFromEditor";
import { LoggerService } from "../services/LoggerService";
import { SettingsService } from "../services/SettingsService";

export class ZoomClickFeature implements Feature {
  private clickHandlers: Map<Editor, (e: MouseEvent) => void> = new Map();

  constructor(
    private plugin: Plugin,
    private zoomFeature: ZoomFeature,
    private settingsService: SettingsService,
    private logger: LoggerService
  ) {}

  async load() {
    this.registerEditorClickHandlers();
    this.plugin.registerEvent(
      this.plugin.app.workspace.on("active-leaf-change", () => {
        const l = this.logger.bind("ZoomClickFeature:active-leaf-change");
        l("活动的叶子已更改");
        this.registerEditorClickHandlers();
      })
    );

    this.plugin.registerEvent(
      this.plugin.app.workspace.on("editor-change", (editor) => {
        const l = this.logger.bind("ZoomClickFeature:editor-change");
        l("编辑器已更改");
        this.registerClickHandlerForEditor(editor);
      })
    );
  }

  async unload() {
    this.removeAllClickHandlers();
  }

  private registerEditorClickHandlers() {
    const l = this.logger.bind("ZoomClickFeature:registerEditorClickHandlers");
    l("为活动编辑器注册点击处理程序");

    const editors = this.getVisibleMarkdownEditors();

    for (const editor of editors) {
      this.registerClickHandlerForEditor(editor);
    }
  }

  private getVisibleMarkdownEditors(): Editor[] {
    const editors: Editor[] = [];

    // 尝试获取当前活动的叶子
    try {
      // @ts-ignore - 使用内部 API 获取活动叶子
      const leaves = this.plugin.app.workspace.getLeavesOfType("markdown");
      
      for (const leaf of leaves) {
        // @ts-ignore - 尝试获取编辑器实例
        if (leaf.view && leaf.view.editor) {
          // @ts-ignore - 添加编辑器到列表
          editors.push(leaf.view.editor);
        }
      }
    } catch (e) {
      console.error("获取编辑器失败", e);
    }

    return editors;
  }

  private registerClickHandlerForEditor(editor: Editor) {
    if (!editor) {
      return;
    }

    const l = this.logger.bind("ZoomClickFeature:registerClickHandlerForEditor");
    
    // 如果已经为此编辑器注册了处理程序，则返回
    if (this.clickHandlers.has(editor)) {
      return;
    }

    const editorView = getEditorViewFromEditor(editor);
    if (!editorView) {
      l("无法获取编辑器视图");
      return;
    }

    const container = editorView.dom;
    if (!container) {
      l("无法获取编辑器容器");
      return;
    }

    // 创建新的点击处理程序
    const clickHandler = this.createClickHandler(editor, editorView);
    
    // 添加点击处理程序
    container.addEventListener("click", clickHandler);
    
    // 存储点击处理程序，以便以后可以移除
    this.clickHandlers.set(editor, clickHandler);
    
    l(`已为编辑器 ${editor} 注册点击处理程序`);
  }

  private createClickHandler(editor: Editor, editorView: EditorView) {
    return (e: MouseEvent) => {
      if (!this.settingsService.zoomOnClick) {
        return;
      }

      const l = this.logger.bind("ZoomClickFeature:clickHandler");
      l("处理点击事件", e);

      // 检查点击的元素是否是列表项标记或标题
      const target = e.target as HTMLElement;
      
      // 获取点击位置的文档偏移量
      const pos = editorView.posAtCoords({ x: e.clientX, y: e.clientY });
      
      if (pos === null) {
        return;
      }

      // 检查点击的元素类型
      const isClickOnBullet = this.isClickOnListBullet(target);
      const isClickOnHeader = this.isClickOnHeader(target);
      
      if (isClickOnBullet || isClickOnHeader) {
        l(`在${isClickOnBullet ? "列表项" : "标题"}上检测到点击，位置: ${pos}`);
        
        // 防止默认行为和事件冒泡
        e.preventDefault();
        e.stopPropagation();
        
        // 执行缩放操作
        this.zoomFeature.zoomIn(editorView, pos);
      }
    };
  }

  private isClickOnListBullet(element: HTMLElement): boolean {
    // 检查是否点击了列表项标记
    return element.classList.contains("list-bullet") || 
           element.classList.contains("cm-formatting-list");
  }

  private isClickOnHeader(element: HTMLElement): boolean {
    // 检查是否点击了标题
    return element.classList.contains("cm-header") || 
           (element.tagName.toLowerCase().startsWith("h") && 
            parseInt(element.tagName.substring(1)) >= 1 && 
            parseInt(element.tagName.substring(1)) <= 6);
  }

  private removeAllClickHandlers() {
    const l = this.logger.bind("ZoomClickFeature:removeAllClickHandlers");
    l("移除所有点击处理程序");

    for (const [editor, handler] of this.clickHandlers.entries()) {
      this.removeClickHandlerForEditor(editor);
    }
    
    this.clickHandlers.clear();
  }

  private removeClickHandlerForEditor(editor: Editor) {
    const l = this.logger.bind("ZoomClickFeature:removeClickHandlerForEditor");
    
    const handler = this.clickHandlers.get(editor);
    if (!handler) {
      return;
    }
    
    const editorView = getEditorViewFromEditor(editor);
    if (!editorView) {
      l("无法获取编辑器视图");
      return;
    }
    
    const container = editorView.dom;
    if (!container) {
      l("无法获取编辑器容器");
      return;
    }
    
    container.removeEventListener("click", handler);
    this.clickHandlers.delete(editor);
    
    l(`已为编辑器 ${editor} 移除点击处理程序`);
  }
} 