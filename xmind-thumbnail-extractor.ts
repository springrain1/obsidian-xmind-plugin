import { TFile, App } from 'obsidian';
import JSZip from 'jszip';
import { DebugLogger } from './debug-logger';

// 缓存接口定义
interface ThumbnailCache {
  [fileId: string]: {
    dataURL: string;
    lastModified: number;
  };
}

// 全局缓存对象
const thumbnailCache: ThumbnailCache = {};

/**
 * 从XMind文件中提取缩略图
 * @param file XMind文件
 * @param app Obsidian App实例
 * @param logger 调试日志器（可选）
 * @returns Promise<string | null> 返回base64格式的缩略图数据URL，失败返回null
 */
export async function extractXMindThumbnail(file: TFile, app: App, logger?: DebugLogger): Promise<string | null> {
  try {
    // 检查文件扩展名
    if (file.extension !== 'xmind') {
      logger?.warn('不是XMind文件:', file.path);
      return null;
    }

    // 生成缓存键
    const cacheKey = `${file.path}_${file.stat.mtime}`;

    // 检查缓存
    if (thumbnailCache[cacheKey]) {
      logger?.log('从缓存中获取XMind缩略图:', file.path);
      return thumbnailCache[cacheKey].dataURL;
    }

    logger?.log('开始提取XMind缩略图:', file.path);

    // 读取XMind文件内容
    const arrayBuffer = await app.vault.readBinary(file);

    logger?.log('文件大小:', `${arrayBuffer.byteLength} bytes`);

    // 使用JSZip解压XMind文件
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(arrayBuffer);

    const fileList = Object.keys(zipContent.files);
    logger?.log('ZIP文件内容:', fileList);

    // 查找缩略图文件
    const thumbnailFile = zipContent.file('Thumbnails/thumbnail.png');
    if (!thumbnailFile) {
      logger?.warn('XMind文件中未找到缩略图:', file.path);
      logger?.log('可用文件列表:', fileList);
      return null;
    }

    logger?.log('找到缩略图文件，开始提取...');

    // 提取缩略图数据
    const thumbnailData = await thumbnailFile.async('uint8array');

    logger?.log('缩略图数据大小:', `${thumbnailData.length} bytes`);

    // 转换为base64格式的数据URL
    const base64 = arrayBufferToBase64(thumbnailData);
    const dataURL = `data:image/png;base64,${base64}`;

    // 缓存结果
    thumbnailCache[cacheKey] = {
      dataURL,
      lastModified: file.stat.mtime
    };

    logger?.success('成功提取XMind缩略图:', {
      filePath: file.path,
      base64Length: base64.length
    });
    return dataURL;

  } catch (error) {
    logger?.error('提取XMind缩略图失败', error, {
      filePath: file.path,
      fileSize: file.stat.size,
      errorMessage: error.message,
      stack: error.stack
    });
    return null;
  }
}

/**
 * 将Uint8Array转换为base64字符串
 * @param buffer Uint8Array数据
 * @returns string base64字符串
 */
function arrayBufferToBase64(buffer: Uint8Array): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * 清理过期的缓存条目
 * @param maxAge 最大缓存时间（毫秒），默认1小时
 * @param logger 调试日志器（可选）
 */
export function cleanThumbnailCache(maxAge: number = 3600000, logger?: DebugLogger): void {
  const now = Date.now();
  const keysToDelete: string[] = [];

  for (const key in thumbnailCache) {
    const cacheEntry = thumbnailCache[key];
    if (now - cacheEntry.lastModified > maxAge) {
      keysToDelete.push(key);
    }
  }

  keysToDelete.forEach(key => {
    delete thumbnailCache[key];
  });

  if (keysToDelete.length > 0) {
    logger?.info(`清理了 ${keysToDelete.length} 个过期的缩略图缓存条目`);
  }
}

/**
 * 获取缓存统计信息
 * @returns 缓存统计对象
 */
export function getThumbnailCacheStats(): { count: number; keys: string[] } {
  const keys = Object.keys(thumbnailCache);
  return {
    count: keys.length,
    keys
  };
}

/**
 * 清空所有缓存
 * @param logger 调试日志器（可选）
 */
export function clearThumbnailCache(logger?: DebugLogger): void {
  const count = Object.keys(thumbnailCache).length;
  for (const key in thumbnailCache) {
    delete thumbnailCache[key];
  }
  logger?.info(`清空了 ${count} 个缩略图缓存条目`);
}
