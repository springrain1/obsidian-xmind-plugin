import { foldable } from "@codemirror/language";
import { EditorState } from "@codemirror/state";

import { cleanTitle } from "../utils/cleanTitle";

/**
 * 面包屑项目接口
 */
export interface Breadcrumb {
  title: string;
  pos: number | null;
}

export interface GetDocumentTitle {
  getDocumentTitle(state: EditorState): string;
}

/**
 * 收集面包屑导航信息
 * 用于在缩放视图顶部显示导航栏
 */
export class CollectBreadcrumbs {
  constructor(private getDocumentTitle: GetDocumentTitle) {}

  /**
   * 收集从文档根到当前位置的所有面包屑
   * @param state 编辑器状态
   * @param pos 当前光标位置
   * @returns 面包屑数组
   */
  public collectBreadcrumbs(state: EditorState, pos: number): Breadcrumb[] {
    // 总是以文档标题作为第一个面包屑
    const breadcrumbs: Breadcrumb[] = [
      { title: this.getDocumentTitle.getDocumentTitle(state), pos: null },
    ];

    // 获取当前位置所在行
    const posLine = state.doc.lineAt(pos);

    // 遍历文档，寻找包含当前位置的可折叠区域
    for (let i = 1; i < posLine.number; i++) {
      const line = state.doc.line(i);
      const f = foldable(state, line.from, line.to);
      
      // 如果找到了包含当前位置的可折叠区域，将其添加到面包屑中
      if (f && f.to > posLine.from) {
        breadcrumbs.push({ title: cleanTitle(line.text), pos: line.from });
      }
    }

    // 添加当前行作为最后一个面包屑
    breadcrumbs.push({
      title: cleanTitle(posLine.text),
      pos: posLine.from,
    });

    return breadcrumbs;
  }
} 