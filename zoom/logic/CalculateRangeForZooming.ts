import { EditorState } from "@codemirror/state";
import { foldable } from "@codemirror/language";

/**
 * 用于计算缩放范围的工具类
 */
export class CalculateRangeForZooming {
  /**
   * 计算给定位置的缩放范围
   * @param state 编辑器状态
   * @param pos 光标位置
   * @returns 缩放范围或null
   */
  public calculateRangeForZooming(state: EditorState, pos: number) {
    const line = state.doc.lineAt(pos);
    const foldRange = foldable(state, line.from, line.to);

    // 处理列表项，即使它们没有可折叠的内容
    if (!foldRange && /^\s*([-*+]|\d+\.)\s+/.test(line.text)) {
      return { from: line.from, to: line.to };
    }

    // 如果不是可折叠内容，则无法缩放
    if (!foldRange) {
      return null;
    }

    return { from: line.from, to: foldRange.to };
  }

  /**
   * 计算给定行的缩放范围
   * @param state 编辑器状态
   * @param from 开始位置
   * @param to 结束位置
   * @returns 缩放范围或null
   */
  private static calculateRangeForLine(
    state: EditorState, 
    from: number, 
    to: number
  ) {
    // 检查是否是可折叠区域
    const f = foldable(state, from, to);
    if (f) {
      return { from, to: f.to };
    }
    
    // 如果不是可折叠区域，尝试查找父级可折叠区域
    return this.findParentFoldable(state, from);
  }

  /**
   * 查找包含指定位置的父级可折叠区域
   * @param state 编辑器状态
   * @param pos 当前位置
   * @returns 缩放范围或null
   */
  private static findParentFoldable(state: EditorState, pos: number) {
    // 获取当前行
    const line = state.doc.lineAt(pos);
    
    // 从当前行向上查找可以包含当前位置的可折叠区域
    for (let i = line.number - 1; i >= 1; i--) {
      const prevLine = state.doc.line(i);
      const f = foldable(state, prevLine.from, prevLine.to);
      
      // 如果找到一个包含当前位置的可折叠区域，返回它
      if (f && f.to > pos) {
        return { from: prevLine.from, to: f.to };
      }
    }
    
    // 没有找到合适的可折叠区域，返回整个文档
    return { 
      from: 0, 
      to: state.doc.length 
    };
  }
} 