// import { editorEditorField } from "obsidian";

import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

/**
 * 从编辑器状态获取编辑器视图
 * @param state 编辑器状态
 * @returns 编辑器视图或 null
 */
export function getEditorViewFromEditorState(state: EditorState): EditorView | null {
  // @ts-ignore - 使用私有API访问视图实例
  if (state && state.field && state.field.panels) {
    // @ts-ignore
    const view = state.field.panels.panels;
    if (view instanceof EditorView) {
      return view;
    }
  }
  
  // 如果无法通过常规方式获取，尝试备选方法
  // @ts-ignore - cm6内部实现细节
  return (state as any).editor?.view || null;
} 