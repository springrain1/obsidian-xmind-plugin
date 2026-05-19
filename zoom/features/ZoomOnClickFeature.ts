import { Plugin } from "obsidian";
import { EditorView } from "@codemirror/view";

import { Feature } from "./Feature";
import { ZoomFeature } from "./ZoomFeature";
import { SettingsService } from "../services/SettingsService";

/**
 * 此类用于实现点击列表项目符号时触发缩放功能
 */
export class ZoomOnClickFeature implements Feature {
  constructor(
    private plugin: Plugin,
    private settings: SettingsService,
    private zoomFeature: ZoomFeature
  ) {}
  
  /**
   * 处理点击事件
   */
  private handleClick = (event: MouseEvent, view: EditorView) => {
    // 如果设置中禁用了点击缩放，或者不是点击在HTML元素上，则不处理
    if (
      !this.settings.zoomOnClick ||
      !(event.target instanceof HTMLElement) ||
      !this.isBulletPoint(event.target)
    ) {
      return false;
    }

    // 获取点击位置对应的文档位置
    const pos = view.posAtDOM(event.target);
    
    // 将光标移动到行尾
    this.moveCursorToLineEnd(view, pos);
    
    // 执行缩放
    this.zoomFeature.zoomIn(view, pos);
    
    // 返回true表示事件已处理
    return true;
  };
  
  private domEventHandler = EditorView.domEventHandlers({
    click: this.handleClick
  });

  async load() {
    // 注册编辑器扩展
    this.plugin.registerEditorExtension([this.domEventHandler]);
    
    // 添加样式类，使列表项目符号可点击
    if (this.settings.zoomOnClick) {
      this.addZoomStyles();
    }
    
    // 监听设置变化
    this.settings.onChange("zoomOnClick", this.onZoomOnClickSettingChange);
  }

  async unload() {
    // 移除样式类
    this.removeZoomStyles();
    
    // 移除设置监听
    if (this.settings.removeCallback) {
      this.settings.removeCallback("zoomOnClick", this.onZoomOnClickSettingChange);
    }
  }

  /**
   * 将光标移动到行尾
   */
  private moveCursorToLineEnd(view: EditorView, pos: number) {
    const line = view.state.doc.lineAt(pos);
    view.dispatch({
      selection: { anchor: line.to }
    });
  }

  /**
   * 判断点击元素是否为列表项目符号
   */
  private isBulletPoint(element: HTMLElement): boolean {
    return (
      element instanceof HTMLSpanElement &&
      (element.classList.contains("list-bullet") ||
       element.classList.contains("cm-formatting-list"))
    );
  }

  /**
   * 设置变化时的回调
   */
  private onZoomOnClickSettingChange = (zoomOnClick: boolean) => {
    if (zoomOnClick) {
      this.addZoomStyles();
    } else {
      this.removeZoomStyles();
    }
  };

  /**
   * 添加样式类
   */
  private addZoomStyles() {
    document.body.classList.add("zoom-plugin-bls-zoom");
  }

  /**
   * 移除样式类
   */
  private removeZoomStyles() {
    document.body.classList.remove("zoom-plugin-bls-zoom");
  }
} 