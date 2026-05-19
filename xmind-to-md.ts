import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import JSZip from 'jszip';
import { DebugLogger } from './debug-logger';

const execAsync = promisify(exec);

interface XMindTopic {
  id?: string;
  title?: string;
  class?: string;
  children?: Record<string, any>;
  notes?: {
    plain?: { content?: string };
    html?: { content?: string };
  };
  markers?: { markerId?: string }[];
  labels?: string[];
  style?: any;
}

interface XMindContent {
  id?: string;
  class?: string;
  title?: string;
  rootTopic?: XMindTopic;
  sheet?: { rootTopic?: XMindTopic }[];
}

/**
 * 将XMind文件转换为Markdown文件
 * @param xmindFilePath XMind文件路径
 * @param mdFilePath 输出的Markdown文件路径
 * @param xmindExePath XMind可执行文件路径
 * @param logger 调试日志器（可选）
 */
export async function convertXMindToMarkdown(
  xmindFilePath: string,
  mdFilePath: string,
  xmindExePath: string,
  logger?: DebugLogger
): Promise<void> {
  if (!fs.existsSync(xmindFilePath)) {
    throw new Error(`XMind文件不存在: ${xmindFilePath}`);
  }

  if (!xmindExePath) {
    throw new Error('未设置XMind可执行文件路径。请在插件设置中配置XMind路径。');
  }

  try {
    // 尝试直接解析XMind文件
    let mdContent = await parseXMindFile(xmindFilePath, logger);
    
    // 如果解析成功，写入Markdown文件
    fs.writeFileSync(mdFilePath, mdContent, 'utf-8');
    logger?.success(`成功将XMind文件转换为Markdown: ${mdFilePath}`);
  } catch (error) {
    logger?.error('转换XMind到Markdown出错', error);
    
    // 如果解析失败，创建一个简单的错误提示文件
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorMd = `# 转换错误: ${path.basename(xmindFilePath)}\n\n` +
      `无法将XMind文件转换为Markdown。错误信息：\n\n` +
      `\`\`\`\n${errorMessage}\n\`\`\`\n\n` +
      `请使用XMind软件打开原始文件。`;
      
    fs.writeFileSync(mdFilePath, errorMd, 'utf-8');
  }
}

/**
 * 解析XMind文件
 * @param xmindFilePath XMind文件路径
 * @param logger 调试日志器（可选）
 * @returns Markdown内容
 */
async function parseXMindFile(xmindFilePath: string, logger?: DebugLogger): Promise<string> {
  // 读取XMind文件（实际上是一个ZIP文件）
  const fileData = fs.readFileSync(xmindFilePath);
  
  try {
    // 使用JSZip解析Zip文件
    const zip = await JSZip.loadAsync(fileData);
    
    // 检查文件是否为有效的XMind文件，但不要因缺少manifest.xml而失败
    // 如果缺少META-INF/manifest.xml，仍然尝试解析
    const manifestXml = zip.file('META-INF/manifest.xml');
    if (!manifestXml) {
      logger?.warn('注意: XMind文件缺少META-INF/manifest.xml，但仍将尝试解析');
    }
    
    // 尝试查找content.json或content.xml
    const contentFiles = Object.keys(zip.files).filter(
      fileName => fileName === 'content.json' || fileName === 'content.xml' || 
                fileName.endsWith('/content.json') || fileName.endsWith('/content.xml')
    );
    
    if (contentFiles.length === 0) {
      throw new Error('无法找到content.json或content.xml文件，无法解析XMind内容');
    }
    
    logger?.log('找到以下内容文件:', contentFiles);
    
    // 优先尝试读取content.json文件
    let contentJson: XMindContent | null = null;
    
    // 按优先级查找和解析内容文件
    for (const contentFile of contentFiles) {
      if (contentFile.endsWith('content.json')) {
        const file = zip.file(contentFile);
        if (file) {
          try {
            const contentText = await file.async('text');
            contentJson = JSON.parse(contentText);
            logger?.success(`成功从${contentFile}解析XMind内容`);
            break;
          } catch (e) {
            logger?.error(`解析${contentFile}失败`, e);
          }
        }
      }
    }
    
    // 如果没有找到或解析失败content.json，尝试解析content.xml
    if (!contentJson) {
      for (const contentFile of contentFiles) {
        if (contentFile.endsWith('content.xml')) {
          const file = zip.file(contentFile);
          if (file) {
            try {
              const contentXml = await file.async('text');
              contentJson = extractTopicsFromXml(contentXml);
              logger?.success(`成功从${contentFile}解析XMind内容`);
              break;
            } catch (e) {
              logger?.error(`解析${contentFile}失败`, e);
            }
          }
        }
      }
    }
    
    // 如果所有内容文件都解析失败
    if (!contentJson) {
      // 尝试查看是否有其他可以解析的文件
      const allFiles = Object.keys(zip.files);
      logger?.error('所有内容文件解析失败。此XMind包含以下文件:', allFiles);
      
      // 尝试直接查找任何可能包含主题(topic)的JSON文件
      const jsonFiles = allFiles.filter(file => file.endsWith('.json'));
      for (const jsonFile of jsonFiles) {
        const file = zip.file(jsonFile);
        if (file) {
          try {
            const contentText = await file.async('text');
            const json = JSON.parse(contentText);
            // 检查这个JSON是否有类似XMind的结构
            if (json.rootTopic || (json.sheet && json.sheet[0] && json.sheet[0].rootTopic)) {
              contentJson = json;
              logger?.log(`找到可能的内容在${jsonFile}`);
              break;
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
      
      if (!contentJson) {
        throw new Error('无法从XMind文件中提取内容，所有尝试都失败');
      }
    }
    
    // 将XMind内容转换为Markdown
    return convertXMindContentToMarkdown(contentJson);
  } catch (error) {
    logger?.error('解析XMind文件失败', error);
    throw new Error(`解析XMind文件失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 从XML提取主题
 * @param contentXml XML内容
 * @returns 解析出的XMind内容
 */
function extractTopicsFromXml(contentXml: string): XMindContent {
  // 提取根主题标题
  const rootTopicMatch = /<topic[^>]*>\s*<title[^>]*>([^<]+)<\/title>/;
  let rootTitle = 'XMind导出';
  
  const titleMatch = contentXml.match(rootTopicMatch);
  if (titleMatch && titleMatch[1]) {
    rootTitle = titleMatch[1];
  }
  
  // 提取所有主题
  const allTopics: {[id: string]: XMindTopic} = {};
  
  // 提取主题ID和标题
  // 匹配格式: <topic id="123"><title>标题</title>
  const topicRegex = /<topic\s+id="([^"]+)"[^>]*>(?:(?!<\/topic>)[\s\S])*?<title[^>]*>([^<]+)<\/title>/g;
  let match;
  
  while ((match = topicRegex.exec(contentXml)) !== null) {
    const id = match[1];
    const title = match[2];
    allTopics[id] = { 
      id, 
      title, 
      children: {} 
    };
    
    // 尝试提取笔记
    const notesMatch = match[0].match(/<notes[^>]*>(?:(?!<\/notes>)[\s\S])*?<plain[^>]*>([^<]+)<\/plain>/);
    if (notesMatch && notesMatch[1]) {
      const topic = allTopics[id];
      if (topic) {
        if (!topic.notes) {
          topic.notes = {};
        }
        
        const notes = topic.notes;
        if (notes) {
          notes.plain = { content: notesMatch[1] };
        }
      }
    }
    
    // 尝试提取标签
    const labelsMatch = match[0].match(/<labels[^>]*>((?:(?!<\/labels>)[\s\S])*?)<\/labels>/);
    if (labelsMatch && labelsMatch[1]) {
      const labelItems = labelsMatch[1].match(/<label[^>]*>([^<]+)<\/label>/g);
      if (labelItems) {
        allTopics[id].labels = labelItems.map(label => {
          const labelText = label.match(/<label[^>]*>([^<]+)<\/label>/);
          return labelText ? labelText[1] : '';
        }).filter(Boolean);
      }
    }
  }
  
  // 构建主题之间的父子关系
  // 在同一个topic标签中寻找子主题
  const allIds = Object.keys(allTopics);
  for (const id of allIds) {
    // 在XML中查找这个ID的topic标签内容
    const topicRegex = new RegExp(`<topic\\s+id="${id}"[^>]*>([\\s\\S]*?)<\\/topic>`, 'g');
    const topicMatch = topicRegex.exec(contentXml);
    
    if (topicMatch && topicMatch[1]) {
      const topicContent = topicMatch[1];
      // 查找这个主题下的所有子主题ID
      const childIdsRegex = /<topic\s+id="([^"]+)"/g;
      let childMatch;
      
      while ((childMatch = childIdsRegex.exec(topicContent)) !== null) {
        const childId = childMatch[1];
        // 确保子ID存在于allTopics中，并且不是当前ID(防止自引用)
        if (childId !== id && allTopics[childId]) {
          // 初始化children结构
          if (!allTopics[id].children) {
            allTopics[id].children = {};
          }
          
          const children = allTopics[id].children;
          if (children) {
            // 初始化attached数组
            if (!children.attached) {
              children.attached = [];
            }
            
            if (Array.isArray(children.attached)) {
              // 将子主题添加到attached数组
              children.attached.push(allTopics[childId]);
            }
          }
        }
      }
    }
  }
  
  // 找出根主题
  let rootTopic: XMindTopic | null = null;
  
  // 方法1: 寻找<sheet>标签中的第一个topic
  const sheetRegex = /<sheet[^>]*>(?:[^<]|<(?!\/sheet))*<topic[^>]*id="([^"]+)"/;
  const sheetMatch = contentXml.match(sheetRegex);
  
  if (sheetMatch && sheetMatch[1] && allTopics[sheetMatch[1]]) {
    rootTopic = allTopics[sheetMatch[1]];
  } else {
    // 方法2: 寻找没有被其他主题引用的主题作为根
    const childIds = new Set<string>();
    for (const id in allTopics) {
      const children = allTopics[id].children;
      if (children && 
          children.attached && 
          Array.isArray(children.attached)) {
        for (const child of children.attached) {
          if (child.id) childIds.add(child.id);
        }
      }
    }
    
    // 找出没有被引用的主题ID
    const rootIds = Object.keys(allTopics).filter(id => !childIds.has(id));
    if (rootIds.length > 0) {
      rootTopic = allTopics[rootIds[0]];
    }
  }
  
  // 如果依然找不到根主题，创建一个默认的
  if (!rootTopic) {
    rootTopic = {
      id: "root",
      title: rootTitle,
      children: {}
    };
    
    // 将所有未连接的主题都作为根主题的子主题
    rootTopic.children = { 
      attached: Object.values(allTopics).filter(topic => 
        !Object.values(allTopics).some(t => 
          t.children?.attached?.some((c: XMindTopic) => c.id === topic.id)
        )
      )
    };
  }
  
  return {
    rootTopic: rootTopic
  };
}

/**
 * 将XMind内容转换为Markdown
 * @param contentJson XMind内容
 * @returns Markdown文本
 */
function convertXMindContentToMarkdown(contentJson: XMindContent): string {
  let markdown = '';
  
  try {
    // 尝试提取根主题
    let rootTopic: XMindTopic | undefined;
    
    // 处理不同版本的XMind格式
    if (contentJson.rootTopic) {
      // 直接有rootTopic的情况
      rootTopic = contentJson.rootTopic;
    } else if (contentJson.class === 'sheet') {
      // 新版本的单个sheet格式
      rootTopic = contentJson.rootTopic;
    } else if (Array.isArray(contentJson) && contentJson.length > 0) {
      // 数组形式的旧版本格式
      if (contentJson[0].rootTopic) {
        rootTopic = contentJson[0].rootTopic;
      } else if (contentJson[0].topic) {
        rootTopic = contentJson[0].topic as XMindTopic;
      }
    } else if (contentJson.sheet && Array.isArray(contentJson.sheet) && contentJson.sheet.length > 0) {
      // 多个sheet的情况，取第一个
      rootTopic = contentJson.sheet[0].rootTopic;
    } else if (typeof contentJson === 'object' && Object.keys(contentJson).length > 0) {
      // 尝试在顶层对象中查找任何可能的rootTopic或topic
      for (const key in contentJson) {
        const value = (contentJson as any)[key];
        if (value && typeof value === 'object' && value.title) {
          rootTopic = value as XMindTopic;
          break;
        }
      }
    }
    
    if (!rootTopic) {
      throw new Error('无法找到根主题');
    }
    
    // 添加标题
    markdown += `# ${rootTopic.title || 'XMind导出'}\n\n`;
    
    // 处理根主题的笔记
    if (rootTopic.notes) {
      let noteContent = '';
      
      // 处理纯文本笔记
      if (rootTopic.notes.plain && rootTopic.notes.plain.content) {
        noteContent = rootTopic.notes.plain.content;
      }
      // 处理HTML笔记
      else if (rootTopic.notes.html && rootTopic.notes.html.content) {
        noteContent = rootTopic.notes.html.content
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<\/p>\s*<p>/gi, '\n\n')
          .replace(/<[^>]*>/g, '');
      }
      
      if (noteContent) {
        markdown += `${noteContent}\n`;
      }
    }
    
    // 处理子主题
    if (rootTopic.children) {
      for (const childType in rootTopic.children) {
        if (Array.isArray(rootTopic.children[childType])) {
          markdown += processChildren(rootTopic.children[childType], 1);
        }
      }
    }
    
    // 如果没有内容，添加一个提示
    if (markdown === `# ${rootTopic.title || 'XMind导出'}\n\n`) {
      markdown += "*该XMind文件没有包含子主题*\n\n";
    }
  } catch (error) {
    // 这里不使用logger，因为convertXMindContentToMarkdown是纯函数，没有logger参数
    console.error('解析XMind内容时出错:', error);
    markdown += `# XMind导出\n\n`;
    markdown += `*解析XMind内容时出错: ${error instanceof Error ? error.message : String(error)}*\n\n`;
  }
  
  return markdown;
}

/**
 * 递归处理子主题
 * @param children 子主题数组
 * @param level 当前级别
 */
function processChildren(children: any[], level: number): string {
  let markdown = '';
  
  if (!Array.isArray(children)) {
    return markdown;
  }
  
  for (const child of children) {
    if (!child) continue;
    
    // 检查当前级别，根据级别决定使用标题格式还是列表格式
    if (level <= 2) {  // 对应 ## 和 ### (二级和三级标题)
      // 添加标题，根据级别添加不同数量的#
      markdown += `${'#'.repeat(level + 1)} ${child.title || '未命名'}\n\n`;
      
      // 处理节点上的笔记
      if (child.notes) {
        let noteContent = '';
        
        // 处理纯文本笔记
        if (child.notes.plain && child.notes.plain.content) {
          noteContent = child.notes.plain.content;
        }
        // 处理HTML笔记
        else if (child.notes.html && child.notes.html.content) {
          noteContent = child.notes.html.content
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p>\s*<p>/gi, '\n\n')
            .replace(/<[^>]*>/g, '');
        }
        
        if (noteContent) {
          markdown += `${noteContent}\n`;
        }
      }
      
      // 处理标签 (markers)
      if (child.markers && Array.isArray(child.markers) && child.markers.length > 0) {
        const tags = child.markers
          .map((marker: any) => marker.markerId)
          .filter(Boolean)
          .map((tag: string) => `#${tag}`)
          .join(' ');
          
        if (tags) {
          markdown += `${tags}\n`;
        }
      }
      
      // 处理标签 (labels)
      if (child.labels && Array.isArray(child.labels) && child.labels.length > 0) {
        const tags = child.labels
          .filter(Boolean)
          .map((label: string) => `#${label}`)
          .join(' ');
          
        if (tags) {
          markdown += `${tags}\n`;
        }
      }
    } else {  // 对应 #### 及以上 (四级及以上标题)，使用列表项格式
      // 根据级别添加缩进
      const indent = '  '.repeat(level - 3);  // 四级标题从一级缩进开始
      
      // 添加列表项 - 不再添加额外的空行
      markdown += `${indent}- ${child.title || '未命名'}\n`;
      
      // 处理节点上的笔记
      if (child.notes) {
        let noteContent = '';
        
        // 处理纯文本笔记
        if (child.notes.plain && child.notes.plain.content) {
          noteContent = child.notes.plain.content;
        }
        // 处理HTML笔记
        else if (child.notes.html && child.notes.html.content) {
          noteContent = child.notes.html.content
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p>\s*<p>/gi, '\n\n')
            .replace(/<[^>]*>/g, '');
        }
        
        if (noteContent) {
          // 缩进笔记内容，使其与列表项对齐
          const indentedNote = noteContent.split('\n').map(line => `${indent}  ${line}`).join('\n');
          markdown += `\n${indentedNote}\n`;
        }
      }
      
      // 处理标签 (markers)
      if (child.markers && Array.isArray(child.markers) && child.markers.length > 0) {
        const tags = child.markers
          .map((marker: any) => marker.markerId)
          .filter(Boolean)
          .map((tag: string) => `#${tag}`)
          .join(' ');
          
        if (tags) {
          markdown += `\n${indent}  ${tags}`;
        }
      }
      
      // 处理标签 (labels)
      if (child.labels && Array.isArray(child.labels) && child.labels.length > 0) {
        const tags = child.labels
          .filter(Boolean)
          .map((label: string) => `#${label}`)
          .join(' ');
          
        if (tags) {
          markdown += `\n${indent}  ${tags}`;
        }
      }
      
      // 在处理完当前节点的笔记和标签后，只在需要时添加空行（有子主题或是最后一个项目）
      if ((child.children && Object.keys(child.children).length > 0) || 
          children.indexOf(child) === children.length - 1) {
        markdown += '\n';
      }
    }
    
    // 递归处理子主题
    if (child.children) {
      for (const childType in child.children) {
        if (Array.isArray(child.children[childType])) {
          markdown += processChildren(child.children[childType], level + 1);
        }
      }
    }
  }
  
  return markdown;
} 