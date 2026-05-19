import { Notice, TFile } from 'obsidian';
import { DebugLogger } from './debug-logger';

// XMind AI 在线服务URL
const XMIND_AI_URL = 'https://xmind.ai/markdown-to-mind-map';

/**
 * 统一的XMind AI在线转换方法
 * 将内容复制到剪贴板并打开XMind AI网站
 * @param content Markdown内容
 */
export function useXMindAIConverter(content: string): void {
  // 复制内容到剪贴板
  copyToClipboard(content)
    .then(() => {
      // 显示通知
      new Notice('已复制内容到剪贴板，正在打开XMind AI...');
      new Notice('请在打开的XMind AI网站中粘贴内容(Ctrl+V或Cmd+V)', 8000);
      
      // 直接打开网站，不带任何参数
      window.open(XMIND_AI_URL, '_blank');
    })
    .catch(error => {
      // 这里使用console.error因为这是用户可见的错误，且函数没有logger参数
      console.error('XMind插件错误: 复制到剪贴板失败', error);
      new Notice('复制到剪贴板失败，但仍会打开XMind AI网站。请手动复制内容后粘贴。', 8000);
      window.open(XMIND_AI_URL, '_blank');
    });
}

/**
 * 打开XMind AI在线转换工具（不带内容）
 */
export function openXMindAIConverter(): void {
  window.open(XMIND_AI_URL, '_blank');
}

/**
 * 辅助函数：复制内容到剪贴板
 * @param text 要复制的文本
 * @returns Promise
 */
async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    // 如果navigator.clipboard API不可用，使用旧方法
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
    } catch (e) {
      console.error('复制到剪贴板失败:', e);
      throw e;
    } finally {
      document.body.removeChild(textArea);
    }
  }
}

/**
 * 尝试检测XMind AI是否可用
 * @returns Promise<boolean> 网站是否可访问
 */
export async function checkXMindAPIAvailability(): Promise<boolean> {
  try {
    // 尝试检测是否可以访问XMind AI网站
    const response = await fetch(XMIND_AI_URL, {
      method: 'HEAD',
      mode: 'no-cors' // 使用no-cors模式尝试连接
    });
    
    // 如果能成功连接到网站，则可以使用剪贴板方法
    return true;
  } catch (error) {
    // 这里使用console.error因为这是用户可见的错误，且函数没有logger参数
    console.error('XMind插件错误: 检查XMind AI访问失败', error);
    return false;
  }
}

/**
 * 上传文件到XMind AI进行转换
 * 由于浏览器安全限制，我们不能直接上传文件，而是将Markdown内容传递给网站
 * @param file Obsidian中的文件
 * @param fileContent 文件内容
 */
export function uploadToXMindAI(file: TFile, fileContent: string): void {
  // 构建URL，包含文件名信息
  const url = `${XMIND_AI_URL}?filename=${encodeURIComponent(file.name)}&content=${encodeURIComponent(fileContent)}`;
  // 在新窗口中打开
  window.open(url, '_blank');
}

/**
 * 使用XMind AI的REST API直接转换Markdown到思维导图（如果API可用）
 * 这是一个示例实现，需要根据XMind AI的实际API进行调整
 * @param markdown Markdown内容
 * @returns 转换结果的Promise，可能是转换结果的URL或二进制数据
 */
export async function convertMarkdownUsingAPI(markdown: string, format: 'xmind' | 'pdf' | 'png' = 'xmind'): Promise<any> {
  // 注意：这是一个示例实现，需要根据XMind AI的实际API进行调整
  try {
    // 构建API URL
    const apiUrl = 'https://xmind.ai/api/convert/markdown';
    
    // 发送请求
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        markdown: markdown,
        format: format
      })
    });
    
    // 检查响应
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }
    
    // 根据请求的格式返回不同类型的数据
    if (format === 'xmind') {
      return await response.arrayBuffer();
    } else {
      return await response.blob();
    }
  } catch (error) {
    // 这里使用console.error因为这是用户可见的错误，且函数没有logger参数
    console.error('XMind插件错误: XMind AI API调用失败', error);
    throw error;
  }
} 