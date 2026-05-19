import { StateEffect, StateField } from "@codemirror/state";
import { EditorView, showPanel } from "@codemirror/view";

import { LoggerService } from "../services/LoggerService";
import { Breadcrumb } from "./CollectBreadcrumbs";

/**
 * 头部导航状态接口
 */
interface HeaderState {
  breadcrumbs: Breadcrumb[];
  onClick: (view: EditorView, pos: number | null) => void;
}

/**
 * 缩放控制接口
 */
export interface ZoomIn {
  zoomIn(view: EditorView, pos: number): void;
}

export interface ZoomOut {
  zoomOut(view: EditorView): void;
}

/**
 * 渲染头部导航面包屑
 * @param doc 文档对象
 * @param ctx 上下文，包含面包屑和点击回调
 * @returns 导航DOM元素
 */
function renderHeader(
  doc: Document,
  ctx: {
    breadcrumbs: Array<{ title: string; pos: number | null }>;
    onClick: (pos: number | null) => void;
  }
): HTMLElement {
  const { breadcrumbs, onClick } = ctx;

  // 创建导航容器
  const headerContainer = doc.createElement("div");
  headerContainer.classList.add("zoom-plugin-header");

  // 添加每个面包屑项
  for (let i = 0; i < breadcrumbs.length; i++) {
    // 添加分隔符（除了第一个面包屑）
    if (i > 0) {
      const delimiter = doc.createElement("span");
      delimiter.classList.add("zoom-plugin-delimiter");
      delimiter.innerText = ">";
      headerContainer.appendChild(delimiter);
    }

    // 添加面包屑链接
    const breadcrumb = breadcrumbs[i];
    const link = doc.createElement("a");
    link.classList.add("zoom-plugin-title");
    link.dataset.pos = String(breadcrumb.pos);
    link.appendChild(doc.createTextNode(breadcrumb.title));
    
    // 添加点击事件
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const target = e.target as HTMLAnchorElement;
      const pos = target.dataset.pos;
      onClick(pos === "null" ? null : Number(pos));
    });
    
    headerContainer.appendChild(link);
  }

  return headerContainer;
}

// 定义状态效果
const showHeaderEffect = StateEffect.define<HeaderState>();
const hideHeaderEffect = StateEffect.define<void>();

/**
 * 渲染导航头部类
 * 管理导航面包屑的显示和隐藏
 */
export class RenderNavigationHeader {
  // 定义状态字段
  private readonly headerStateField = StateField.define<HeaderState | null>({
    create: () => null,
    update: (value, tr) => {
      for (const e of tr.effects) {
        if (e.is(showHeaderEffect)) {
          value = e.value;
        }
        if (e.is(hideHeaderEffect)) {
          value = null;
        }
      }
      return value;
    },
    provide: (f) =>
      showPanel.from(f, (state) => {
        if (!state) {
          return null;
        }

        return (view) => ({
          top: true,
          dom: renderHeader(view.dom.ownerDocument, {
            breadcrumbs: state.breadcrumbs,
            onClick: (pos) => state.onClick(view, pos),
          }),
        });
      }),
  });

  constructor(
    private logger: LoggerService,
    private zoomIn: ZoomIn,
    private zoomOut: ZoomOut
  ) {}

  /**
   * 获取编辑器扩展
   */
  getExtension() {
    return this.headerStateField;
  }

  /**
   * 显示导航头部
   */
  public showHeader(view: EditorView, breadcrumbs: Breadcrumb[]) {
    const l = this.logger.bind("RenderNavigationHeader:showHeader");
    l("显示面包屑导航");

    view.dispatch({
      effects: [
        showHeaderEffect.of({
          breadcrumbs,
          onClick: this.onClick,
        }),
      ],
    });
  }

  /**
   * 隐藏导航头部
   */
  public hideHeader(view: EditorView) {
    const l = this.logger.bind("RenderNavigationHeader:hideHeader");
    l("隐藏面包屑导航");

    view.dispatch({
      effects: [hideHeaderEffect.of()],
    });
  }

  /**
   * 点击导航项处理
   */
  private onClick = (view: EditorView, pos: number | null) => {
    if (pos === null) {
      // 点击文档标题，缩小到整个文档
      this.zoomOut.zoomOut(view);
    } else {
      // 点击中间项，缩放到该位置
      this.zoomIn.zoomIn(view, pos);
    }
  };
} 