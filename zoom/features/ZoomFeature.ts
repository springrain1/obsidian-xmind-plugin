import { Notice, Plugin } from "obsidian";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

import { Feature } from "./Feature";
import { isFoldingEnabled } from "./utils/isFoldingEnabled";

import { CalculateRangeForZooming } from "../logic/CalculateRangeForZooming";
import { KeepOnlyZoomedContentVisible } from "../logic/KeepOnlyZoomedContentVisible";
import { LoggerService } from "../services/LoggerService";
import { getEditorViewFromEditor } from "../utils/getEditorViewFromEditor";

export type ZoomInCallback = (view: EditorView, pos: number) => void;
export type ZoomOutCallback = (view: EditorView) => void;

/**
 * ZoomFeature 类实现了 Obsidian 中的缩放功能
 * 允许放大到特定的标题、列表项或段落，以便更专注于内容的特定部分
 */
export class ZoomFeature implements Feature {
  private zoomInCallbacks: ZoomInCallback[] = [];
  private zoomOutCallbacks: ZoomOutCallback[] = [];
  
  private keepOnlyZoomedContentVisible = new KeepOnlyZoomedContentVisible(
    this.logger
  );

  private calculateRangeForZooming = new CalculateRangeForZooming();

  constructor(
    private plugin: Plugin,
    private logger: LoggerService
  ) {}

  /**
   * 加载缩放功能
   */
  async load(): Promise<void> {
    this.plugin.registerEditorExtension(
      this.keepOnlyZoomedContentVisible.getExtension()
    );

    // 注：这些命令会在 ZoomManager 中添加，这里不再添加
    // 避免重复添加命令
  }

  /**
   * 卸载缩放功能
   */
  async unload(): Promise<void> {
    // 清除回调
    this.zoomInCallbacks = [];
    this.zoomOutCallbacks = [];
    return Promise.resolve();
  }

  /**
   * 刷新当前缩放状态
   * @param view 编辑器视图
   */
  public refreshZoom(view: EditorView) {
    const prevRange =
      this.keepOnlyZoomedContentVisible.calculateVisibleContentRange(
        view.state
      );

    if (!prevRange) {
      return;
    }

    const newRange = this.calculateRangeForZooming.calculateRangeForZooming(
      view.state,
      prevRange.from
    );

    if (!newRange) {
      return;
    }

    this.keepOnlyZoomedContentVisible.keepOnlyZoomedContentVisible(
      view,
      newRange.from,
      newRange.to,
      { scrollIntoView: false }
    );
  }

  /**
   * 计算当前可见内容范围
   * @param state 编辑器状态
   * @returns 范围对象或null
   */
  public calculateVisibleContentRange(state: EditorState) {
    return this.keepOnlyZoomedContentVisible.calculateVisibleContentRange(
      state
    );
  }

  /**
   * 计算隐藏内容范围
   * @param state 编辑器状态
   * @returns 范围对象或null
   */
  public calculateHiddenContentRanges(state: EditorState) {
    return this.keepOnlyZoomedContentVisible.calculateHiddenContentRanges(
      state
    );
  }

  /**
   * 注册缩放后的回调
   * @param callback 回调函数
   */
  public notifyAfterZoomIn(cb: ZoomInCallback) {
    this.zoomInCallbacks.push(cb);
  }

  /**
   * 注册缩小后的回调
   * @param callback 回调函数
   */
  public notifyAfterZoomOut(cb: ZoomOutCallback) {
    this.zoomOutCallbacks.push(cb);
  }

  /**
   * 放大到指定位置
   * @param view 编辑器视图
   * @param pos 光标位置
   */
  public zoomIn(view: EditorView, pos: number) {
    const l = this.logger.bind("ZoomFeature:zoomIn");
    l("正在放大");

    if (!isFoldingEnabled(this.plugin.app)) {
      new Notice(
        `要使用缩放功能，您必须先在设置 -> 编辑器中启用"折叠标题"和"折叠缩进"`
      );
      return;
    }

    const range = this.calculateRangeForZooming.calculateRangeForZooming(
      view.state,
      pos
    );

    if (!range) {
      l("无法计算缩放范围");
      return;
    }

    this.keepOnlyZoomedContentVisible.keepOnlyZoomedContentVisible(
      view,
      range.from,
      range.to
    );

    for (const cb of this.zoomInCallbacks) {
      cb(view, pos);
    }
  }

  /**
   * 缩小到整个文档
   * @param view 编辑器视图
   */
  public zoomOut(view: EditorView) {
    const l = this.logger.bind("ZoomFeature:zoomOut");
    l("正在缩小");

    this.keepOnlyZoomedContentVisible.showAllContent(view);

    for (const cb of this.zoomOutCallbacks) {
      cb(view);
    }
  }
} 