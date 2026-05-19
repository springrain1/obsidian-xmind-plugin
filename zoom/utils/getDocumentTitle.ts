// import { editorViewField } from "obsidian";

import { EditorState } from "@codemirror/state";

/**
 * 获取当前文档的标题
 * 如果找不到，则返回默认标题
 * @param state 编辑器状态
 * @returns 文档标题
 */
export function getDocumentTitle(state: EditorState): string {
  try {
    // 获取编辑器视图关联的文件
    // @ts-ignore
    const file = state.field?.viewState?.state?.file;
    
    if (file) {
      // 如果能获取到文件，返回文件名
      return file.name || "文档";
    }
    
    // 尝试从第一行提取标题
    const firstLine = state.doc.line(1);
    if (firstLine.text.startsWith("#")) {
      // 移除 Markdown 标题标记并清理
      return firstLine.text.replace(/^#+\s+/, "").trim();
    }
    
    // 都没找到，返回默认标题
    return "文档";
  } catch (error) {
    console.error("获取文档标题失败:", error);
    return "文档";
  }
} 