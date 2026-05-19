/**
 * 清理标题文本，用于在面包屑导航栏显示
 * 移除不必要的标记和保持简洁
 * @param text 原始标题文本
 * @returns 清理后的标题文本
 */
export function cleanTitle(text: string): string {
  // 移除Markdown标记如 #、*、-、[x] 等
  let cleanText = text
    .replace(/^#+\s+/, "") // 移除标题符号
    .replace(/^\s*[-*+]\s+/, "") // 移除列表符号
    .replace(/^\s*\d+\.\s+/, "") // 移除有序列表符号
    .replace(/^\s*\[\s*[xX]\s*\]\s*/, "") // 移除任务列表完成标记
    .replace(/^\s*\[\s*\]\s*/, "") // 移除任务列表未完成标记
    .trim();
  
  // 如果文本太长，截断它
  if (cleanText.length > 30) {
    cleanText = cleanText.substring(0, 30) + "...";
  }
  
  return cleanText;
} 