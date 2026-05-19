import { Plugin } from "obsidian";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

import { Feature } from "./Feature";
import { ZoomFeature } from "./ZoomFeature";
import { LoggerService } from "../services/LoggerService";
import { getDocumentTitle } from "../utils/getDocumentTitle";
import { getEditorViewFromEditorState } from "../utils/getEditorViewFromEditorState";

import { CollectBreadcrumbs } from "../logic/CollectBreadcrumbs";
import { RenderNavigationHeader } from "../logic/RenderNavigationHeader";

/**
 * 监听缩放后更新导航的子功能
 */
class ShowHeaderAfterZoomIn implements Feature {
  constructor(
    private zoomFeature: ZoomFeature,
    private collectBreadcrumbs: CollectBreadcrumbs,
    private renderNavigationHeader: RenderNavigationHeader
  ) {}

  async load() {
    // 注册缩放后的回调
    this.zoomFeature.notifyAfterZoomIn((view, pos) => {
      // 收集面包屑
      const breadcrumbs = this.collectBreadcrumbs.collectBreadcrumbs(
        view.state,
        pos
      );
      // 显示导航栏
      this.renderNavigationHeader.showHeader(view, breadcrumbs);
    });
  }

  async unload() {}
}

/**
 * 监听缩小后隐藏导航的子功能
 */
class HideHeaderAfterZoomOut implements Feature {
  constructor(
    private zoomFeature: ZoomFeature,
    private renderNavigationHeader: RenderNavigationHeader
  ) {}

  async load() {
    // 注册缩小后的回调
    this.zoomFeature.notifyAfterZoomOut((view) => {
      // 隐藏导航栏
      this.renderNavigationHeader.hideHeader(view);
    });
  }

  async unload() {}
}

/**
 * 顶部导航功能类
 * 集成面包屑导航，显示当前缩放位置层次
 */
export class HeaderNavigationFeature implements Feature {
  // 创建面包屑收集工具
  private collectBreadcrumbs = new CollectBreadcrumbs({
    getDocumentTitle: getDocumentTitle,
  });

  // 创建导航渲染工具
  private renderNavigationHeader: RenderNavigationHeader;

  // 子功能
  private showHeaderAfterZoomIn: ShowHeaderAfterZoomIn;
  private hideHeaderAfterZoomOut: HideHeaderAfterZoomOut;

  constructor(
    private plugin: Plugin,
    private logger: LoggerService,
    private zoomFeature: ZoomFeature
  ) {
    // 初始化导航渲染器
    this.renderNavigationHeader = new RenderNavigationHeader(
      this.logger,
      this.zoomFeature,
      this.zoomFeature
    );

    // 初始化子功能
    this.showHeaderAfterZoomIn = new ShowHeaderAfterZoomIn(
      this.zoomFeature,
      this.collectBreadcrumbs,
      this.renderNavigationHeader
    );

    this.hideHeaderAfterZoomOut = new HideHeaderAfterZoomOut(
      this.zoomFeature,
      this.renderNavigationHeader
    );
  }

  async load() {
    // 注册导航栏扩展
    this.plugin.registerEditorExtension([
      this.renderNavigationHeader.getExtension()
    ]);

    // 加载子功能
    await this.showHeaderAfterZoomIn.load();
    await this.hideHeaderAfterZoomOut.load();
  }

  async unload() {
    // 卸载子功能
    await this.showHeaderAfterZoomIn.unload();
    await this.hideHeaderAfterZoomOut.unload();
  }
} 