import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import JSZip from 'jszip';
import { DebugLogger } from './debug-logger';

const execAsync = promisify(exec);

interface XMindNode {
  title: string;
  children: XMindNode[];
  note?: string;  // 添加笔记字段
  image?: string; // 添加图片链接字段
  markers?: string[]; // 添加标记字段，用于表示特殊类型节点
}

interface XMindJson {
  rootTopic: {
    title: string;
    children: any;
  };
}

/**
 * 将Markdown文件转换为XMind文件
 * @param mdFilePath Markdown文件路径
 * @param xmindFilePath 输出的XMind文件路径
 * @param xmindExePath XMind可执行文件路径
 * @param logger 调试日志器（可选）
 */
export async function convertMarkdownToXMind(
  mdFilePath: string,
  xmindFilePath: string,
  xmindExePath: string,
  logger?: DebugLogger
): Promise<void> {
  if (!fs.existsSync(mdFilePath)) {
    throw new Error(`Markdown文件不存在: ${mdFilePath}`);
  }

  if (!xmindExePath) {
    throw new Error('未设置XMind可执行文件路径。请在插件设置中配置XMind路径。');
  }

  try {
    // 读取Markdown文件内容
    const mdContent = fs.readFileSync(mdFilePath, 'utf-8');
    
    // 解析Markdown内容为层级结构
    const structure = parseMarkdownToStructure(mdContent);

    // 创建XMind文件
    await createXMindFile(structure, xmindFilePath);
    
    logger?.success('成功创建XMind文件:', xmindFilePath);
  } catch (error) {
    logger?.error('转换Markdown到XMind出错', error);
    throw error;
  }
}

/**
 * 解析Markdown内容为层级结构
 * @param mdContent Markdown文件内容
 */
function parseMarkdownToStructure(mdContent: string): XMindNode {
  const lines = mdContent.split('\n');
  
  // 提取第一个一级标题作为根节点/中心主题
  const titleMatch = mdContent.match(/^#\s+(.+)/m);
  const rootTitle = titleMatch ? titleMatch[1].trim() : 'Root Topic';
  
  const rootNode: XMindNode = {
    title: rootTitle,
    children: [],
  };

  // 分析所有标题行来构建层级结构
  let currentNodes: (XMindNode | undefined)[] = [];
  currentNodes[1] = rootNode; // 一级标题对应根节点
  
  let currentHeadingNode: XMindNode | undefined = rootNode; // 初始设置为根节点，这样一级标题后的内容会被附加到根节点
  let currentListNode: XMindNode | undefined = undefined; // 当前处理的列表项节点
  let currentListLevel = 0; // 当前列表的缩进级别
  let inCodeBlock = false; // 是否正在处理代码块
  let codeBlockContent = ''; // 代码块内容
  let codeBlockLanguage = ''; // 代码块语言
  let paragraphText = ''; // 收集段落文本
  let inTable = false; // 是否正在处理表格
  let tableContent: string[][] = []; // 表格内容
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // 检查是否是代码块开始或结束
    if (trimmedLine.startsWith('```')) {
      if (!inCodeBlock) {
        // 代码块开始
        inCodeBlock = true;
        codeBlockContent = '';
        // 提取代码块语言
        codeBlockLanguage = trimmedLine.substring(3).trim();
      } else {
        // 代码块结束
        inCodeBlock = false;
        // 如果有当前标题节点，添加代码块作为子节点
        if (currentHeadingNode) {
          const codeBlockNode: XMindNode = {
            title: `代码块${codeBlockLanguage ? `: ${codeBlockLanguage}` : ''}`,
            children: [],
            note: codeBlockContent,
            markers: ['code']
          };
          currentHeadingNode.children.push(codeBlockNode);
        }
      }
      continue;
    }
    
    // 如果在代码块内，收集代码内容
    if (inCodeBlock) {
      codeBlockContent += line + '\n';
      continue;
    }
    
    // 检查是否是表格分隔行
    const isTableSeparator = /^\s*\|(:?-+:?\|)+\s*$/.test(trimmedLine);
    
    // 检查是否是表格行
    const isTableRow = trimmedLine.startsWith('|') && trimmedLine.endsWith('|');
    
    if (isTableRow) {
      // 处理表格
      if (!inTable && isTableSeparator) {
        // 表格开始
        inTable = true;
        tableContent = [];
        // 添加上一行作为表头
        if (i > 0) {
          const headerLine = lines[i-1].trim();
          if (headerLine.startsWith('|') && headerLine.endsWith('|')) {
            const headerCells = headerLine.split('|')
              .slice(1, -1)
              .map(cell => cell.trim());
            tableContent.push(headerCells);
          }
        }
      } else if (inTable && !isTableSeparator) {
        // 处理表格行
        const cells = trimmedLine.split('|')
          .slice(1, -1)
          .map(cell => cell.trim());
        tableContent.push(cells);
      }
      continue;
    } else if (inTable) {
      // 表格结束
      inTable = false;
      
      // 如果有当前标题节点，添加表格作为子节点
      if (currentHeadingNode && tableContent.length > 0) {
        const tableNode: XMindNode = {
          title: '表格',
          children: [],
          markers: ['table']
        };
        
        // 将表格头作为表格节点的标题
        if (tableContent.length > 0) {
          tableNode.title = `表格: ${tableContent[0].join(' | ')}`;
        }
        
        // 将表格行作为表格节点的子节点
        for (let rowIndex = 1; rowIndex < tableContent.length; rowIndex++) {
          const row = tableContent[rowIndex];
          const rowNode: XMindNode = {
            title: row.join(' | '),
            children: []
          };
          
          // 将单元格作为行节点的子节点
          for (let cellIndex = 0; cellIndex < row.length; cellIndex++) {
            if (tableContent[0] && cellIndex < tableContent[0].length) {
              const cellNode: XMindNode = {
                title: `${tableContent[0][cellIndex]}: ${row[cellIndex]}`,
                children: []
              };
              rowNode.children.push(cellNode);
            }
          }
          
          tableNode.children.push(rowNode);
        }
        
        currentHeadingNode.children.push(tableNode);
      }
    }
    
    // 如果是空行，可能是段落结束
    if (!trimmedLine) {
      // 如果有收集的段落文本并且有当前标题节点
      if (paragraphText && currentHeadingNode) {
        // 将段落添加为当前标题节点的笔记，保留原有格式
        if (!currentHeadingNode.note) {
          currentHeadingNode.note = '';
        }
        currentHeadingNode.note += paragraphText + '\n';
        paragraphText = '';
      }
      continue;
    }
    
    // 检查是否是标题行
    const headingMatch = trimmedLine.match(/^(#+)\s+(.+)/);
    if (headingMatch) {
      // 保存之前收集的段落，保留原有格式
      if (paragraphText && currentHeadingNode) {
        if (!currentHeadingNode.note) {
          currentHeadingNode.note = '';
        }
        currentHeadingNode.note += paragraphText + '\n';
        paragraphText = '';
      }
      
      const level = headingMatch[1].length;
      // 移除Markdown样式
      let title = headingMatch[2].trim()
        .replace(/\*\*([^*]+)\*\*/g, '$1') // 移除加粗
        .replace(/\*([^*]+)\*/g, '$1')     // 移除斜体
        .replace(/~~([^~]+)~~/g, '$1')     // 移除删除线
        .replace(/`([^`]+)`/g, '$1')       // 移除行内代码
        .replace(/:cite\[\d+\]/g, '');     // 移除引用标记
      
      // 处理标题中的图片
      const imageMatch = title.match(/!\[(.*?)\]\((.*?)\)/);
      let imageUrl = '';
      if (imageMatch) {
        imageUrl = imageMatch[2];
        title = title.replace(/!\[(.*?)\]\((.*?)\)/, imageMatch[1] || '图片');
      }
      
      // 跳过第一个一级标题，因为它已经作为根节点
      if (level === 1 && title === rootTitle) {
        currentHeadingNode = rootNode; // 确保当前标题节点是根节点，以便后续段落添加到根节点备注
        continue;
      }
      
      // 创建新节点
      const newNode: XMindNode = {
        title,
        children: []
      };
      
      // 如果有图片链接，添加到节点
      if (imageUrl) {
        newNode.image = imageUrl;
      }
      
      // 找到当前节点的父节点并添加
      let parentLevel = level - 1;
      while (parentLevel >= 1 && !currentNodes[parentLevel]) {
        parentLevel--; // 如果没有直接的父级，找最近的上级
      }
      
      const parentNode = currentNodes[parentLevel];
      if (parentLevel >= 1 && parentNode) {
        parentNode.children.push(newNode);
      } else if (level > 1) {
        // 如果找不到父节点但级别>1，添加到根节点
        rootNode.children.push(newNode);
      }
      
      // 更新当前级别的节点
      currentNodes[level] = newNode;
      currentHeadingNode = newNode; // 更新当前正在处理的标题节点
      currentListNode = undefined;  // 重置当前列表节点
      currentListLevel = 0; // 重置列表级别
      
      // 清除所有更深层级的节点引用，因为我们现在在新的分支
      for (let j = level + 1; j < currentNodes.length; j++) {
        currentNodes[j] = undefined;
      }
    } 
    // 检查是否是列表项（无序列表或有序列表）
    else if (currentHeadingNode && (trimmedLine.match(/^[\-\*\+]\s+(.+)/) || trimmedLine.match(/^\d+\.\s+(.+)/))) {
      // 保存之前收集的段落，保留原有格式
      if (paragraphText && currentHeadingNode) {
        if (!currentHeadingNode.note) {
          currentHeadingNode.note = '';
        }
        currentHeadingNode.note += paragraphText + '\n';
        paragraphText = '';
      }
      
      // 计算列表项的缩进级别
      const lineIndent = line.search(/\S/);
      const listItemMatch = trimmedLine.match(/^[\-\*\+]\s+(.+)/) || trimmedLine.match(/^\d+\.\s+(.+)/);
      
      if (listItemMatch) {
        // 移除Markdown样式
        let content = listItemMatch[1].trim()
          .replace(/\*\*([^*]+)\*\*/g, '$1') // 移除加粗
          .replace(/\*([^*]+)\*/g, '$1')     // 移除斜体
          .replace(/~~([^~]+)~~/g, '$1')     // 移除删除线
          .replace(/`([^`]+)`/g, '$1')       // 移除行内代码
          .replace(/:cite\[\d+\]/g, '');     // 移除引用标记
        
        // 处理列表项中的图片
        const imageMatch = content.match(/!\[(.*?)\]\((.*?)\)/);
        let imageUrl = '';
        if (imageMatch) {
          imageUrl = imageMatch[2];
          content = content.replace(/!\[(.*?)\]\((.*?)\)/, imageMatch[1] || '图片');
        }
        
        // 处理列表项的缩进级别变化
        const indentLevel = Math.max(1, Math.floor(lineIndent / 2));
        
        // 创建列表项节点
        const listItemNode: XMindNode = {
          title: content,
          children: []
        };
        
        // 如果有图片链接，添加到节点
        if (imageUrl) {
          listItemNode.image = imageUrl;
        }
        
        // 确定列表项的父节点
        if (indentLevel === 1) {
          // 顶级列表项，直接添加到当前标题节点
          currentHeadingNode.children.push(listItemNode);
          currentListNode = listItemNode;
        } else {
          // 嵌套列表项，需要找到合适的父级列表项
          let parentListNode = findParentListNode(currentHeadingNode, indentLevel - 1);
          
          if (parentListNode) {
            parentListNode.children.push(listItemNode);
          } else {
            // 如果找不到合适的父级，直接添加到当前标题节点
            currentHeadingNode.children.push(listItemNode);
          }
          
          currentListNode = listItemNode;
        }
      }
    }
    // 如果不是特殊格式，当作普通段落处理
    else if (currentHeadingNode) {
      // 收集段落文本，保留换行
      if (paragraphText) {
        paragraphText += '\n' + trimmedLine;
      } else {
        paragraphText = trimmedLine;
      }
      
      // 检查段落中的图片
      const imageMatch = trimmedLine.match(/!\[(.*?)\]\((.*?)\)/);
      if (imageMatch && currentHeadingNode) {
        const imageUrl = imageMatch[2];
        const imageTitle = imageMatch[1] || '图片';
        
        // 创建图片节点
        const imageNode: XMindNode = {
          title: imageTitle,
          children: [],
          image: imageUrl,
          markers: ['image']
        };
        
        currentHeadingNode.children.push(imageNode);
        
        // 从段落中移除图片标记
        paragraphText = paragraphText.replace(/!\[(.*?)\]\((.*?)\)/, '').trim();
      }
    }
  }
  
  // 处理最后可能剩余的段落
  if (paragraphText && currentHeadingNode) {
    if (!currentHeadingNode.note) {
      currentHeadingNode.note = '';
    }
    currentHeadingNode.note += paragraphText;
  }

  return rootNode;
}

/**
 * 查找给定缩进级别的父级列表节点
 * @param headingNode 当前标题节点
 * @param targetLevel 目标缩进级别
 * @returns 找到的父级列表节点或undefined
 */
function findParentListNode(headingNode: XMindNode, targetLevel: number): XMindNode | undefined {
  // 简单实现：假设列表项在相同分支上并且是按顺序添加的
  // 实际使用中可能需要更复杂的跟踪机制
  
  if (!headingNode.children.length) {
    return undefined;
  }
  
  // 最后添加的一个节点可能是当前分支的父节点
  const lastChild = headingNode.children[headingNode.children.length - 1];
  
  // 如果需要找的是第一级，直接返回最后一个子节点
  if (targetLevel === 1) {
    return lastChild;
  }
  
  // 递归寻找更深层级
  return findParentListNode(lastChild, targetLevel - 1);
}

/**
 * 创建XMind文件
 * @param structure 思维导图结构
 * @param xmindFilePath 输出的XMind文件路径
 */
async function createXMindFile(structure: XMindNode, xmindFilePath: string): Promise<void> {
  const zip = new JSZip();
  
  // 转换为XMind JSON格式
  const contentJson = convertStructureToXMindJson(structure);
  
  // 添加content.json文件 - 核心内容文件
  // XMind 8和XMind 2020的格式不同，这里使用XMind 8的格式
  // XMind 8期望content.json是一个数组
  zip.file("content.json", JSON.stringify([contentJson], null, 2));
  
  // 添加meta.json文件
  const metaJson = {
    creator: {
      name: "Obsidian XMind Plugin",
      version: "1.0.0"
    },
    created: new Date().toISOString(),
    modified: new Date().toISOString()
  };
  zip.file("meta.json", JSON.stringify(metaJson, null, 2));
  
  // 添加必要的文件夹结构
  zip.folder("styles");
  zip.folder("thumbnails");
  const metaInfFolder = zip.folder("META-INF");
  
  // 添加comments.json文件
  zip.file("comments.json", JSON.stringify({ comments: [] }));
  
  // 添加必要的配置文件
  const manifestJson = {
    "file-entries": {
      "content.json": { "media-type": "application/json" },
      "metadata.json": { "media-type": "application/json" },
      "manifest.json": { "media-type": "application/json" },
      "comments.json": { "media-type": "application/json" },
      "styles/styles.json": { "media-type": "application/json" },
      "META-INF/": { "media-type": "text/directory" },
      "META-INF/manifest.xml": { "media-type": "text/xml" },
      "thumbnails/": { "media-type": "text/directory" }
    }
  };
  zip.file("manifest.json", JSON.stringify(manifestJson, null, 2));
  
  // 添加metadata.json文件 - 确保activeSheetId是正确的
  const metadata = {
    "creator": {
      "name": "Obsidian XMind Plugin",
      "version": "1.0.0"
    },
    "activeSheetId": contentJson.id
  };
  zip.file("metadata.json", JSON.stringify(metadata, null, 2));
  
  // 添加styles/styles.json文件
  const stylesFolder = zip.folder("styles");
  if (stylesFolder) {
    stylesFolder.file("styles.json", JSON.stringify({
      "styles": [],
      "masterStyles": {}
    }));
  }
  
  // 添加空的缩略图占位符文件
  const thumbnailsFolder = zip.folder("thumbnails");
  
  // 重要：创建正确的META-INF/manifest.xml文件
  if (metaInfFolder) {
    metaInfFolder.file("manifest.xml", `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<manifest xmlns="urn:xmind:xmap:xmlns:manifest:1.0">
  <file-entry full-path="content.json" media-type="application/json"/>
  <file-entry full-path="metadata.json" media-type="application/json"/>
  <file-entry full-path="manifest.json" media-type="application/json"/>
  <file-entry full-path="comments.json" media-type="application/json"/>
  <file-entry full-path="styles/styles.json" media-type="application/json"/>
  <file-entry full-path="thumbnails/" media-type="text/directory"/>
  <file-entry full-path="META-INF/" media-type="text/directory"/>
  <file-entry full-path="META-INF/manifest.xml" media-type="text/xml"/>
</manifest>`);
  }
  
  // 生成zip文件，使用DEFLATE压缩算法
  const zipContent = await zip.generateAsync({ 
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: {
      level: 9
    }
  });
  fs.writeFileSync(xmindFilePath, zipContent);
}

/**
 * 将解析后的结构转换为XMind JSON结构
 * @param structure 解析后的结构
 */
function convertStructureToXMindJson(structure: XMindNode): any {
  // 创建XMind兼容的JSON结构
  const rootId = generateUUID();
  const sheetId = generateUUID();
  
  // 确保子主题结构正确
  const childrenData = structure.children && structure.children.length > 0 
    ? convertChildrenToXMindFormat(structure.children) 
    : { attached: [] };  // 确保即使没有子主题，也有一个空的attached数组
  
  // 创建根主题
  const rootTopic: any = {
    id: rootId,
    class: "topic",
    title: structure.title || "Root Topic",
    structureClass: "org.xmind.ui.logic.right",
    children: childrenData,
    style: {
      id: generateUUID(),
      "line-width": "1pt",
      "line-color": "#707070",
      "fo:font-family": "Microsoft YaHei",
      "fo:font-style": "normal",
      "fo:font-weight": "normal",
      "fo:font-size": "14pt"
    }
  };
  
  // 如果有笔记，添加到根主题
  if (structure.note) {
    rootTopic.notes = {
      plain: {
        content: structure.note
      }
    };
  }
  
  // 如果有图片，添加到根主题
  if (structure.image) {
    rootTopic.image = {
      src: structure.image,
      align: "center"
    };
  }
  
  // 如果有标记，添加到根主题
  if (structure.markers && structure.markers.length > 0) {
    rootTopic.markers = structure.markers.map(marker => ({
      markerId: marker
    }));
  }
  
  const content = {
    id: sheetId,
    class: "sheet",
    title: structure.title || "Root Topic",
    rootTopic: rootTopic,
    theme: {
      id: generateUUID(),
      centralTopic: {
        "properties": {
          "fo:font-family": "Microsoft YaHei",
          "border-line-width": "2pt",
          "shape-class": "org.xmind.topicShape.roundedRect",
          "svg:fill": "#FF5733",
          "line-color": "#707070",
          "border-line-color": "#707070"
        }
      },
      mainTopic: {
        "properties": {
          "fo:font-family": "Microsoft YaHei",
          "border-line-width": "1pt",
          "shape-class": "org.xmind.topicShape.roundedRect",
          "svg:fill": "#F7EDDF",
          "line-color": "#707070",
          "border-line-color": "#707070"
        }
      },
      subTopic: {
        "properties": {
          "fo:font-family": "Microsoft YaHei",
          "border-line-width": "1pt",
          "shape-class": "org.xmind.topicShape.roundedRect",
          "svg:fill": "#F5F5F5",
          "line-color": "#707070",
          "border-line-color": "#707070"
        }
      }
    }
  };

  return content;
}

/**
 * 生成UUID
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, 
          v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * 将子节点结构转换为XMind格式
 * @param children 子节点数组
 */
function convertChildrenToXMindFormat(children: XMindNode[]): any {
  if (!children || children.length === 0) {
    return { attached: [] };  // 始终返回带有空attached数组的对象，而不是空对象
  }

  // 确保返回一个具有正确结构的attached数组
  const attached = children.map((child) => {
    const topicId = generateUUID();
    
    // 处理子主题的子主题
    let childrenData = { attached: [] };  // 默认为带有空attached数组的对象
    
    if (child.children && child.children.length > 0) {
      childrenData = convertChildrenToXMindFormat(child.children);
      // 确保childrenData具有attached属性
      if (!childrenData.attached) {
        childrenData.attached = [];
      }
    }
    
    // 创建主题对象  
    const topic: any = {
      id: topicId,
      class: "topic",
      title: child.title || "未命名主题",
      children: childrenData,  // 确保子主题结构正确
      style: {
        id: generateUUID()
      }
    };
    
    // 如果有笔记，添加到主题
    if (child.note) {
      topic.notes = {
        plain: {
          content: child.note
        }
      };
    }
    
    // 如果有图片，添加到主题
    if (child.image) {
      topic.image = {
        src: child.image,
        align: "center"
      };
    }
    
    // 如果有标记，添加到主题
    if (child.markers && child.markers.length > 0) {
      topic.markers = child.markers.map(marker => ({
        markerId: marker
      }));
    }
    
    return topic;
  });

  return {
    attached: attached  // 确保始终返回具有attached属性的对象
  };
} 