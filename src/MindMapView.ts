import {
  HoverParent,
  HoverPopover,
  Menu,
  TextFileView,
  WorkspaceLeaf,
  TFile,
  Notice,
  Platform
} from "obsidian";

import MindMapPlugin from './main'
import { FRONT_MATTER_REGEX } from './constants'
import MindMap from "./mindmap/mindmap";
import { INodeData } from './mindmap/INode'
import { Transformer } from './markmapLib/markmap-lib';
import randomColor from "randomcolor";
import { t } from './lang/helpers'
import { OutlineView, createViewToggleButton } from './OutlineView';
import { MapOverview, createMapToggleButton } from './MapOverview';

import domtoimage from './domtoimage.js'

export function uuid(): string {
  function S4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  }
  return (S4() + S4() + '-' + S4() + '-' + S4());
}
const transformer = new Transformer();


export const mindmapViewType = "mindmapView";
export const mindmapIcon = "blocks";

export class MindMapView extends TextFileView implements HoverParent {
  plugin: MindMapPlugin;
  hoverPopover: HoverPopover | null;
  id: string = (this.leaf as any).id;
  mindmap: MindMap | null;
  colors: string[] = [];
  timeOut: any = null;
  fileCache: any;
  firstInit: boolean = true;
  yamlString:string=''
  outlineView: OutlineView | null = null;
  toggleButton: HTMLElement | null = null;
  mapOverview: MapOverview | null = null;
  mapToggleButton: HTMLElement | null = null;

  getViewType() {
    return mindmapViewType;
  }
  getIcon() {
    return mindmapIcon;
  }

  getDisplayText() {
    return this.file?.basename || "mindmap";
  }

  setColors() {
    // 确保 this.colors 已初始化
    if (!this.colors) {
      this.colors = [];
    }

    var colors:any[] = []
    try{
      if( this.plugin.settings.mindmapStrokeArray){
         //colors = this.plugin.settings.mindmapStrokeArray.split(',')
         colors = this.plugin.settings.mindmapStrokeArray;
      }
    }catch(err){
       console.log(err,'stroke array is error');
    }

    // 重置颜色数组，避免累积
    this.colors = colors.slice();

    for (var i = 0; i < 50; i++) {
      this.colors.push(randomColor());
    }
  }

  prepareForExport() {
    if (!this.mindmap) {
      return {
        rootBox: null,
        oldScrollLeft: 0,
        oldScrollTop: 0,
        originalBgColor: '',
        width: 0,
        height: 0,
        originalWidth: '',
        originalHeight: '',
        originalTransform: '',
        originalOverflow: ''
      };
    }

    // 保存当前状态
    const originalState = {
      rootBox: this.mindmap.root.getPosition(),
      oldScrollLeft: this.mindmap.containerEL.scrollLeft,
      oldScrollTop: this.mindmap.containerEL.scrollTop,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- Dynamic style required
      originalBgColor: this.mindmap.contentEL.style.background,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- Dynamic style required
      originalWidth: this.mindmap.contentEL.style.width,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- Dynamic style required
      originalHeight: this.mindmap.contentEL.style.height,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- Dynamic style required
      originalTransform: this.mindmap.contentEL.style.transform,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- Dynamic style required
      originalOverflow: this.mindmap.contentEL.style.overflow
    };

    // 收集所有可见节点
    var nodes: any[] = [];
    this.mindmap.traverseDF((n: any) => {
      if (n.isShow()) {
        nodes.push(n);
      }
    });

    // 计算边界框，添加更多边距以确保内容完整
    var box = this.mindmap.getBoundingRect(nodes);
    const padding = 80; // 增加边距

    var disX = 0, disY = 0;
    if (box.x > padding) {
      disX = box.x - padding;
    }

    if (box.y > padding) {
      disY = box.y - padding;
    }

    // 重新定位根节点，确保所有内容都在可见区域内
    this.mindmap.root.setPosition(originalState.rootBox.x - disX, originalState.rootBox.y - disY);

    // 计算导出尺寸，确保足够大
    var w = Math.max(box.width + padding * 2, 800); // 最小宽度800px
    var h = Math.max(box.height + padding * 2, 600); // 最小高度600px

    // 优化导出样式设置
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- Dynamic style required
    this.mindmap.contentEL.style.width = w + 'px';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- Dynamic style required
    this.mindmap.contentEL.style.height = h + 'px';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- Dynamic style required
    this.mindmap.contentEL.style.overflow = 'visible'; // 确保内容不被裁剪
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- Dynamic style required
    this.mindmap.contentEL.style.transform = 'none'; // 移除可能影响导出的变换

    // 设置背景色，确保导出质量
    if (this.plugin.settings.mindmapBackground === 'transparent') {
      const isDarkMode = document.body.classList.contains('theme-dark');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- Dynamic style required
      this.mindmap.contentEL.style.background = isDarkMode ? '#1e1e1e' : '#ffffff';
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- Dynamic style required
      this.mindmap.contentEL.style.background = this.plugin.settings.mindmapBackground;
    }

    // 刷新显示
    this.mindmap.refresh();

    return {
      ...originalState,
      width: w,
      height: h
    };
  }

  restoreMindmap(exportData: any) {
    if (!this.mindmap || !exportData.rootBox) {
      return;
    }

    // 恢复所有原始样式和状态
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- Dynamic style required
    this.mindmap.contentEL.style.width = exportData.originalWidth || this.plugin.settings.canvasSize + 'px';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- Dynamic style required
    this.mindmap.contentEL.style.height = exportData.originalHeight || this.plugin.settings.canvasSize + 'px';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- Dynamic style required
    this.mindmap.contentEL.style.background = exportData.originalBgColor || '';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- Dynamic style required
    this.mindmap.contentEL.style.transform = exportData.originalTransform || '';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- Dynamic style required
    this.mindmap.contentEL.style.overflow = exportData.originalOverflow || '';

    // 恢复滚动位置
    this.mindmap.containerEL.scrollTop = exportData.oldScrollTop;
    this.mindmap.containerEL.scrollLeft = exportData.oldScrollLeft;

    // 恢复根节点位置
    this.mindmap.root.setPosition(exportData.rootBox.x, exportData.rootBox.y);

    // 刷新显示
    this.mindmap.refresh();
  }

  exportToSvg(){
    if(!this.mindmap){
      return;
    }

    const exportData = this.prepareForExport();
    
    // 确保有效的文件路径
    if (!this.mindmap.path) {
      new Notice("无法导出：找不到有效的文件路径");
      this.restoreMindmap(exportData);
      return;
    }

    // 增加延迟以确保DOM完全渲染
    setTimeout(() => {
      // 显示导出进度提示
      const loadingNotice = new Notice("正在导出SVG，请稍候...", 0);

      // 优化SVG导出设置
      domtoimage.toSvg(this.mindmap.contentEL, {
        bgcolor: this.plugin.settings.mindmapBackground === 'transparent' ? null : this.plugin.settings.mindmapBackground,
        width: exportData.width,
        height: exportData.height,
        style: {
          transform: 'none',
          transformOrigin: 'top left',
          fontSmooth: 'always',
          webkitFontSmoothing: 'antialiased',
          textRendering: 'optimizeLegibility'
        },
        filter: (node: any) => {
          // 过滤掉可能影响导出的元素
          if (node.classList) {
            return !node.classList.contains('export-ignore');
          }
          return true;
        }
      }).then(dataUrl => {
        try {
          loadingNotice.hide();

          // 创建优化的HTML包装
          const img = new Image();
          img.src = dataUrl;
          const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.file?.basename || "思维导图"}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }
    .mindmap-container {
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      padding: 20px;
      max-width: 100%;
      max-height: 90vh;
      overflow: auto;
    }
    img {
      max-width: 100%;
      height: auto;
      display: block;
      image-rendering: -webkit-optimize-contrast;
      image-rendering: crisp-edges;
    }
  </style>
</head>
<body>
  <div class="mindmap-container">
    ${img.outerHTML}
  </div>
</body>
</html>`;

          const fileName = this.mindmap.path.replace(/\.md$/, '.html');
          this.app.vault.adapter.write(fileName, htmlContent)
            .then(() => {
              new Notice(`思维导图已导出为HTML: ${fileName}`);
              this.restoreMindmap(exportData);
            })
            .catch(err => {
              console.error('Failed to save HTML file:', err);
              new Notice(`导出HTML失败: ${err}`);
              this.restoreMindmap(exportData);
            });
        } catch(err) {
          loadingNotice.hide();
          console.error('Error processing SVG data:', err);
          new Notice(`导出失败: ${err}`);
          this.restoreMindmap(exportData);
        }
      }).catch(err => {
        loadingNotice.hide();
        console.error('SVG export failed:', err);
        new Notice(`导出失败: ${err}`);
        this.restoreMindmap(exportData);
      });
    }, 500); // 增加延迟时间
  }

  exportToPng() {
    if (!this.mindmap) {
      return;
    }

    // 显示导出进度提示
    const loadingNotice = new Notice("正在导出PNG，请稍候...", 0);

    const exportData = this.prepareForExport();

    // 确保有效的文件路径
    if (!this.mindmap.path) {
      loadingNotice.hide();
      new Notice("无法导出：找不到有效的文件路径");
      this.restoreMindmap(exportData);
      return;
    }

    // 增加延迟以确保DOM完全渲染
    setTimeout(() => {
      // 计算最佳缩放比例，考虑设备像素比
      const devicePixelRatio = window.devicePixelRatio || 1;
      const optimalScale = Math.max(2, devicePixelRatio * 2); // 至少2倍，高DPI设备更高

      // 使用优化的PNG导出设置
      domtoimage.toPng(this.mindmap.contentEL, {
        bgcolor: this.plugin.settings.mindmapBackground === 'transparent' ? null : this.plugin.settings.mindmapBackground,
        width: exportData.width,
        height: exportData.height,
        style: {
          transform: 'none',
          transformOrigin: 'top left',
          fontSmooth: 'always',
          webkitFontSmoothing: 'antialiased',
          textRendering: 'optimizeLegibility'
        },
        scale: optimalScale,
        filter: (node: any) => {
          // 过滤掉可能影响导出的元素
          if (node.classList) {
            return !node.classList.contains('export-ignore');
          }
          return true;
        }
      }).then(async (dataUrl: string) => {
        try {
          loadingNotice.hide();
          const fileName = this.mindmap.path.replace(/\.md$/, '.png');
          const arrayBuffer = await this.dataURLtoBlob(dataUrl).arrayBuffer();

          this.app.vault.adapter.writeBinary(fileName, arrayBuffer)
            .then(() => {
              new Notice(`思维导图已导出为PNG: ${fileName}`);
              this.restoreMindmap(exportData);
            })
            .catch(err => {
              console.error('Failed to save PNG file:', err);
              new Notice(`导出PNG失败: ${err}`);
              this.restoreMindmap(exportData);
            });
        } catch (error) {
          loadingNotice.hide();
          console.error('Error processing PNG data:', error);
          new Notice(`导出PNG失败: ${error}`);
          this.restoreMindmap(exportData);
        }
      }).catch(err => {
        loadingNotice.hide();
        console.error('PNG export failed:', err);
        new Notice(`导出PNG失败: ${err}`);
        this.restoreMindmap(exportData);
      });
    }, 500); // 增加延迟时间
  }

  exportToJpeg() {
    if (!this.mindmap) {
      return;
    }

    // 显示导出进度提示
    const loadingNotice = new Notice("正在导出JPEG，请稍候...", 0);

    const exportData = this.prepareForExport();

    // 确保有效的文件路径
    if (!this.mindmap.path) {
      loadingNotice.hide();
      new Notice("无法导出：找不到有效的文件路径");
      this.restoreMindmap(exportData);
      return;
    }

    // 增加延迟以确保DOM完全渲染
    setTimeout(() => {
      // 计算最佳缩放比例，考虑设备像素比
      const devicePixelRatio = window.devicePixelRatio || 1;
      const optimalScale = Math.max(2, devicePixelRatio * 2); // 至少2倍，高DPI设备更高

      // 确定背景色（JPEG不支持透明）
      let bgColor = this.plugin.settings.mindmapBackground;
      if (bgColor === 'transparent') {
        const isDarkMode = document.body.classList.contains('theme-dark');
        bgColor = isDarkMode ? '#1e1e1e' : '#ffffff';
      }

      // 使用优化的JPEG导出设置
      domtoimage.toJpeg(this.mindmap.contentEL, {
        bgcolor: bgColor,
        width: exportData.width,
        height: exportData.height,
        style: {
          transform: 'none',
          transformOrigin: 'top left',
          fontSmooth: 'always',
          webkitFontSmoothing: 'antialiased',
          textRendering: 'optimizeLegibility'
        },
        quality: 0.98, // 提高JPEG质量到98%
        scale: optimalScale,
        filter: (node: any) => {
          // 过滤掉可能影响导出的元素
          if (node.classList) {
            return !node.classList.contains('export-ignore');
          }
          return true;
        }
      }).then(async (dataUrl: string) => {
        try {
          loadingNotice.hide();
          const fileName = this.mindmap.path.replace(/\.md$/, '.jpeg');
          const arrayBuffer = await this.dataURLtoBlob(dataUrl).arrayBuffer();

          this.app.vault.adapter.writeBinary(fileName, arrayBuffer)
            .then(() => {
              new Notice(`思维导图已导出为JPEG: ${fileName}`);
              this.restoreMindmap(exportData);
            })
            .catch(err => {
              console.error('Failed to save JPEG file:', err);
              new Notice(`导出JPEG失败: ${err}`);
              this.restoreMindmap(exportData);
            });
        } catch (error) {
          loadingNotice.hide();
          console.error('Error processing JPEG data:', error);
          new Notice(`导出JPEG失败: ${error}`);
          this.restoreMindmap(exportData);
        }
      }).catch(err => {
        loadingNotice.hide();
        console.error('JPEG export failed:', err);
        new Notice(`导出JPEG失败: ${err}`);
        this.restoreMindmap(exportData);
      });
    }, 500); // 增加延迟时间
  }

  dataURLtoBlob(dataUrl: string) {
    var arr = dataUrl.split(','), mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  mindMapChange() {
    if (this.mindmap) {
      var md = this.mindmap.getMarkdown();

      // 保护非思维导图内容
      const protectedContent = this.preserveNonMindmapContent(md);

      // 清理多余的空行
      const cleanedContent = this.cleanExtraEmptyLines(protectedContent);

      // 构建新的内容
      let newContent: string;
      if (this.yamlString && this.yamlString.trim() !== '') {
        // 确保YAML结尾只有一个换行符
        const yamlWithSingleNewline = this.yamlString.trim() + '\n';
        // 确保Markdown内容前没有多余的空行
        const trimmedContent = cleanedContent.trim();
        newContent = yamlWithSingleNewline + trimmedContent;
      } else {
        newContent = cleanedContent;
      }

      // 检查内容是否真的发生了变化，避免不必要的更新
      if (this.data !== newContent) {
        // 更新内容
        this.data = newContent;

        try {
          this.requestSave();

          // 立即应用到所有打开的 Markdown 视图，使用正确的事务方式
          this.applyChangesToMarkdownViews(newContent);
        } catch(err) {
          console.log(err);
          new Notice(`${t("Save fail")}`)
        }
      }
    }
  }

  /**
   * 保护非思维导图内容
   */
  preserveNonMindmapContent(newMindmapContent: string): string {
    // 获取原始文档内容
    const originalContent = this.data || '';

    // 移除YAML前置元数据
    let originalWithoutYaml = originalContent;
    if (this.yamlString && this.yamlString.trim() !== '') {
      originalWithoutYaml = originalContent.replace(this.yamlString, '').trim();
    }

    // 解析原始内容，提取非思维导图部分
    const preservedSections = this.extractNonMindmapSections(originalWithoutYaml);

    // 合并思维导图内容和保护的内容
    return this.mergeContentWithPreservedSections(newMindmapContent, preservedSections);
  }

  /**
   * 提取非思维导图部分的内容
   */
  extractNonMindmapSections(content: string): Map<string, {level: number, content: string, originalTitle: string, headerIndex: number}> {
    const sections = new Map<string, {level: number, content: string, originalTitle: string, headerIndex: number}>();
    const lines = content.split('\n');
    let currentSection = '';
    let currentSectionLevel = 0;
    let currentSectionContent: string[] = [];
    let beforeFirstHeader: string[] = []; // 保存第一个标题之前的内容
    let headerIndex = 0; // 标题索引，用于唯一标识标题位置

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // 检查是否是标题行
      const headerMatch = /^(#{1,6})\s+(.+)/.exec(trimmedLine);
      const isHeader = !!headerMatch;
      // 检查是否是列表项
      const isListItem = /^[\s]*[-*+]\s+/.test(line) || /^[\s]*\d+\.\s+/.test(line);

      if (isHeader) {
        // 保存第一个标题之前的内容
        if (!currentSection && beforeFirstHeader.length > 0) {
          const beforeContent = beforeFirstHeader.join('\n').trim();
          if (beforeContent) {
            sections.set('__BEFORE_FIRST_HEADER__', {
              level: 0,
              content: beforeContent,
              originalTitle: '__BEFORE_FIRST_HEADER__',
              headerIndex: -1
            });
          }
          beforeFirstHeader = [];
        }

        // 保存之前的非思维导图内容
        if (currentSection && currentSectionContent.length > 0) {
          // 保存所有非列表内容，不管是否有列表项
          const nonListContent = currentSectionContent.filter((line) => {
            return !(/^[\s]*[-*+]\s+/.test(line) || /^[\s]*\d+\.\s+/.test(line));
          }).join('\n').trim();

          if (nonListContent) {
            // 使用headerIndex作为key，确保唯一性和位置关联
            const sectionKey = `header_${headerIndex - 1}`;
            sections.set(sectionKey, {
              level: currentSectionLevel,
              content: nonListContent,
              originalTitle: currentSection,
              headerIndex: headerIndex - 1
            });
          }
        }

        // 新标题开始
        headerIndex++; // 增加标题索引
        currentSection = headerMatch[2].trim(); // 只保存标题文本，不包含#号
        currentSectionLevel = headerMatch[1].length; // 标题级别
        currentSectionContent = [];
      } else if (isListItem) {
        // 列表项不保存到 currentSectionContent 中
        // 如果还没有遇到标题，这个列表项属于第一个标题之前的内容
        if (!currentSection) {
          beforeFirstHeader = []; // 清空，因为遇到了列表项
        }
      } else {
        // 普通内容行或空行
        if (!currentSection) {
          // 还没有遇到标题，保存到第一个标题之前的内容
          beforeFirstHeader.push(line);
        } else {
          // 已经在某个标题下，保存所有非列表内容
          currentSectionContent.push(line);
        }
      }
    }

    // 保存最后一个部分
    if (currentSection && currentSectionContent.length > 0) {
      const nonListContent = currentSectionContent.filter((line) => {
        return !(/^[\s]*[-*+]\s+/.test(line) || /^[\s]*\d+\.\s+/.test(line));
      }).join('\n').trim();

      if (nonListContent) {
        const sectionKey = `header_${headerIndex}`;
        sections.set(sectionKey, {
          level: currentSectionLevel,
          content: nonListContent,
          originalTitle: currentSection,
          headerIndex: headerIndex
        });
      }
    }

    // 如果文档没有标题，保存所有内容
    if (!currentSection && beforeFirstHeader.length > 0) {
      const beforeContent = beforeFirstHeader.join('\n').trim();
      if (beforeContent) {
        sections.set('__BEFORE_FIRST_HEADER__', {
          level: 0,
          content: beforeContent,
          originalTitle: '__BEFORE_FIRST_HEADER__',
          headerIndex: -1
        });
      }
    }

    return sections;
  }

  /**
   * 合并思维导图内容和保护的内容
   */
  mergeContentWithPreservedSections(mindmapContent: string, preservedSections: Map<string, {level: number, content: string, originalTitle: string, headerIndex: number}>): string {
    const lines = mindmapContent.split('\n');
    const result: string[] = [];

    // 创建一个已使用内容的跟踪集合，防止重复使用
    const usedSections = new Set<string>();

    // 首先添加第一个标题之前的内容（如果有的话）
    const beforeFirstHeader = preservedSections.get('__BEFORE_FIRST_HEADER__');
    if (beforeFirstHeader && beforeFirstHeader.content.trim()) {
      result.push(beforeFirstHeader.content);
      result.push(''); // 添加空行分隔
      usedSections.add('__BEFORE_FIRST_HEADER__');
    }

    let currentHeaderIndex = 0; // 跟踪当前处理的标题索引

    for (const line of lines) {
      const trimmedLine = line.trim();

      // 添加思维导图行
      result.push(line);

      // 检查是否是标题，如果是，尝试找到对应的保护内容
      const headerMatch = /^(#{1,6})\s+(.+)/.exec(trimmedLine);
      if (headerMatch) {
        const headerLevel = headerMatch[1].length;
        const headerText = headerMatch[2].trim();

        // 使用标题位置索引来查找对应的保护内容
        const sectionKey = `header_${currentHeaderIndex}`;
        let preservedData = null;

        if (preservedSections.has(sectionKey) && !usedSections.has(sectionKey)) {
          preservedData = preservedSections.get(sectionKey);

          if (preservedData && preservedData.content.trim()) {
            result.push(preservedData.content);
            usedSections.add(sectionKey); // 标记为已使用
          }
        }

        currentHeaderIndex++; // 移动到下一个标题索引
      }
    }

    return result.join('\n');
  }

  /**
   * 创建一个临时的markdown视图来处理撤销历史
   */
  private async createMarkdownViewForUndo(newContent: string) {
    if (!this.file) return;

    // 简化方案：直接修改文件内容，然后触发文件变化事件
    // 这样当用户切换到markdown视图时，Obsidian会自动处理撤销历史
    try {
      await this.plugin.app.vault.modify(this.file, newContent);
      console.log('File content updated for undo support');
    } catch (error) {
      console.warn('Failed to update file content:', error);
    }
  }

  /**
   * 计算两个标题的相似度
   */
  private calculateTitleSimilarity(title1: string, title2: string): number {
    // 如果完全相同，返回1
    if (title1 === title2) return 1;

    // 移除数字后缀进行比较（如 "标题1" vs "标题"）
    const cleanTitle1 = title1.replace(/\d+$/, '').trim();
    const cleanTitle2 = title2.replace(/\d+$/, '').trim();

    if (cleanTitle1 === cleanTitle2) return 0.9; // 高相似度

    // 检查一个标题是否是另一个的子串
    if (title1.includes(title2) || title2.includes(title1)) return 0.8;
    if (cleanTitle1.includes(cleanTitle2) || cleanTitle2.includes(cleanTitle1)) return 0.75;

    // 基于单词的相似度计算
    const words1 = title1.toLowerCase().split(/\s+/);
    const words2 = title2.toLowerCase().split(/\s+/);

    let commonWords = 0;
    for (const word1 of words1) {
      if (words2.includes(word1)) {
        commonWords++;
      }
    }

    return commonWords / Math.max(words1.length, words2.length);
  }

  /**
   * 清理多余的空行
   */
  cleanExtraEmptyLines(content: string): string {
    // 将多个连续的空行替换为单个空行
    let cleaned = content.replace(/\n{3,}/g, '\n\n');

    // 清理标题前后的多余空行
    // 标题前最多保留一个空行
    cleaned = cleaned.replace(/\n{2,}(#{1,6}\s)/g, '\n\n$1');

    // 标题后不需要额外空行（除非后面是内容段落）
    cleaned = cleaned.replace(/(#{1,6}\s[^\n]+)\n{2,}(-|\d+\.)/g, '$1\n$2');

    // 列表项之间不需要空行
    cleaned = cleaned.replace(/(-\s[^\n]+)\n{2,}(-\s)/g, '$1\n$2');

    // 清理文档开头和结尾的多余空行
    cleaned = cleaned.replace(/^\n+/, '').replace(/\n+$/, '');

    return cleaned;
  }

  getFrontMatter() {
    var frontMatter = '';
    if (this.fileCache && this.fileCache.frontmatter) {
      var position = this.fileCache.frontmatterPosition;
      if (position && position['end'] && position['end'].offset) {
        var end = position['end'].offset;
        frontMatter = this.data.substr(0, end);
        // 只有当前置元数据不是空的时候才返回
        if (frontMatter.trim() !== '---\n\n---' && frontMatter.trim() !== '---\n---') {
          // 只添加一个换行符，不添加多余空行
          frontMatter += '\n';
          return frontMatter;
        }
      }
    }
    // 返回空字符串，而不是空的YAML标记
    return '';
  }

  constructor(leaf: WorkspaceLeaf, plugin: MindMapPlugin) {
    super(leaf);
    this.plugin = plugin;
    this.setColors();

    this.fileCache = {
      'frontmatter': {
        'mindmap-plugin': 'basic'
      }
    }

  }


  async onClose() {
    // Remove draggables from render, as the DOM has already detached
    //this.plugin.removeView(this);
    if (this.mindmap) {
      this.mindmap.clear();
      this.contentEl.empty();
      this.mindmap = null;
    }

    // 销毁大纲视图
    if (this.outlineView) {
      this.outlineView.destroy();
      this.outlineView = null;
    }

    // 销毁地图概览视图
    if (this.mapOverview) {
      this.mapOverview.destroy();
      this.mapOverview = null;
    }

    // 移除切换按钮
    if (this.toggleButton && this.toggleButton.parentNode) {
      this.toggleButton.parentNode.removeChild(this.toggleButton);
      this.toggleButton = null;
    }

    // 移除地图概览切换按钮
    if (this.mapToggleButton && this.mapToggleButton.parentNode) {
      this.mapToggleButton.parentNode.removeChild(this.mapToggleButton);
      this.mapToggleButton = null;
    }
  }

  clear() {

  }

  getViewData() {
    // 如果已有前置元数据且不是空的，使用它并添加正文内容
    if (this.yamlString && this.yamlString.trim() !== '' && this.yamlString.trim() !== '---\n\n---') {
      // 获取不包含前置元数据的内容
      const contentWithoutFrontMatter = this.getMdText(this.data);
      return this.yamlString + contentWithoutFrontMatter;
    }
    
    // 否则直接返回思维导图内容，不添加空的YAML前置元数据
    return this.data;
  }

  setViewData(data: string) {
    try {
      if (this.mindmap) {
        this.mindmap.clear();
        this.contentEl.empty();
      }

      this.data = data || '';

      var mdText = this.getMdText(this.data);
      var mindData = this.mdToData(mdText);
      mindData.isRoot = true;

      // 将XMindSettings映射到MindMap的Setting接口
      const mindmapSettings = {
        theme: this.plugin.settings.mindmapTheme,
        canvasSize: this.plugin.settings.mindmapCanvasSize,
        background: this.plugin.settings.mindmapBackground,
        fontSize: this.plugin.settings.mindmapFontSize,
        headLevel: this.plugin.settings.mindmapHeadLevel,
        layoutDirect: this.plugin.settings.mindmapLayoutDirect,
        color: this.plugin.settings.mindmapColor,
        exportMdModel: this.plugin.settings.mindmapExportMdModel,
        strokeArray: this.plugin.settings.mindmapStrokeArray,
        focusOnMove: this.plugin.settings.mindmapFocusOnMove
      };

      this.mindmap = new MindMap(mindData, this.contentEl, mindmapSettings);

      // 关键修复：在调用 init() 之前设置 view 属性
      this.mindmap.view = this;

      // 应用主题样式
      this.mindmap.appEl.classList.add(`mm-theme-${this.plugin.settings.mindmapTheme}`);
      this.plugin.applyThemeStyles(this.mindmap, this.plugin.settings.mindmapTheme);
      this.mindmap.colors = this.colors;

      // 初始化AI集成功能
      this.initializeAIIntegration();
      
      if (this.firstInit) {
        setTimeout(() => {
          try {
            var leaf = this.leaf;
            if (leaf && leaf.view instanceof MindMapView) {
              var view = leaf.view as MindMapView;
              
              // 确保文件存在且有路径
              if (view.file && view.file.path) {
                this.mindmap.path = view.file.path;
                this.fileCache = this.app.metadataCache.getFileCache(view.file) || this.fileCache;
                this.yamlString = this.getFrontMatter();
              } else {
                console.log("警告: 视图没有关联的文件或文件路径");
              }
            }
            
            this.mindmap.init();
            this.mindmap.refresh();
            
            // 初始化大纲视图
            this.initOutlineView();
            
            this.firstInit = false;
          } catch (error) {
            console.error("初始化思维导图时出错:", error);
            new Notice("初始化思维导图时出错");
          }
        }, 100);
      } else {
        try {
          var view = this.leaf.view as MindMapView;
          
          // 确保文件存在且有路径
          if (view.file && view.file.path) {
            this.mindmap.path = view.file.path;
            this.fileCache = this.app.metadataCache.getFileCache(view.file) || this.fileCache;
            this.yamlString = this.getFrontMatter();
          } else {
            console.log("警告: 视图没有关联的文件或文件路径");
          }
          
          this.mindmap.init();
          this.mindmap.refresh();
          
          // 更新大纲视图和地图概览的实例引用
          if (this.outlineView) {
            this.outlineView.mindmap = this.mindmap;
            this.outlineView.render();
          } else {
            // 如果大纲视图还不存在，重新初始化
            this.initOutlineView();
            return; // 因为initOutlineView会同时创建大纲视图和地图概览，所以不用继续执行下面的代码
          }
          
          if (this.mapOverview) {
            this.mapOverview.mindmap = this.mindmap;
            if (this.mapOverview.isVisible) {
              this.mapOverview.render();
            }
          } else {
            // 如果地图概览还不存在，重新初始化（虽然通常这不会发生，因为initOutlineView会同时创建两者）
            this.initOutlineView();
          }
        } catch (error) {
          console.error("刷新思维导图时出错:", error);
        }
      }
    } catch (error) {
      console.error("设置视图数据时出错:", error);
      const errorDiv = this.contentEl.createEl('div');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- Dynamic style required
      errorDiv.style.padding = '20px';
      errorDiv.textContent = '加载思维导图时出错。请尝试重新打开文件或切换到Markdown视图。';
    }
  }

  onunload() {
    this.app.workspace.offref("quick-preview");
    this.app.workspace.offref("resize");

    if (this.mindmap) {
      this.mindmap.clear();
      this.contentEl.empty();
      this.mindmap = null;
    }

    this.plugin.setMarkdownView(this.leaf);


  }

  onload() {
    super.onload();
    this.registerEvent(
      this.app.workspace.on("quick-preview", () => this.onQuickPreview, this)
    );
//    this.registerEvent(
//      this.app.workspace.on('resize', () => this.updateMindMap(), this)
//    );

    // 初始化AI集成功能
    this.initializeAIIntegration();
  }

  /**
   * 初始化AI集成功能
   */
  private initializeAIIntegration(): void {
    // 延迟初始化，确保思维导图已经创建
    setTimeout(() => {
      if (this.mindmap && this.plugin.mindmapAIIntegration) {
        this.addAIIntegrationToNodes();
      }
    }, 100);
  }

  /**
   * 为思维导图节点添加AI集成功能
   */
  private addAIIntegrationToNodes(): void {
    if (!this.mindmap || !this.plugin.mindmapAIIntegration) {
      return;
    }

    // 为所有现有节点添加AI功能
    this.mindmap.traverseBF((node: any) => {
      if (node && node.containEl) {
        this.plugin.mindmapAIIntegration.addNodeAIExpansion(node, this);
      }
    });

    // 监听新节点创建事件
    this.mindmap.on('initNode', (evt: CustomEvent) => {
      const node = evt.detail.node;
      if (node && this.plugin.mindmapAIIntegration) {
        this.plugin.mindmapAIIntegration.addNodeAIExpansion(node, this);
      }
    });
  }

  onQuickPreview(file: TFile, data: string) {
    if (file === this.file && data !== this.data) {
      this.setViewData(data);
      this.fileCache = this.app.metadataCache.getFileCache(file);
    }
  }

  updateMindMap() {
    if (this.mindmap) {
      if(Platform.isDesktopApp){
        this.mindmap.center();
      }
    }
  }

  async onFileMetadataChange(file: TFile) {
    var path = file.path;
    let md = await this.app.vault.adapter.read(path);
    this.onQuickPreview(file, md);

    // 重新设置颜色，确保颜色配置正确加载
    this.setColors();

    // 文件内容变化后，也要更新大纲视图和地图概览
    if (this.mindmap) {
      // 更新思维导图的颜色
      this.mindmap.colors = this.colors;

      // 更新背景颜色
      this.mindmap.setting.background = this.plugin.settings.mindmapBackground;
      // 延迟执行，确保mindmap数据已经更新
      setTimeout(() => {
        // 更新大纲视图
        if (this.outlineView) {
          this.outlineView.mindmap = this.mindmap;
          if (this.outlineView.isVisible) {
            this.outlineView.render();
          }
        }
        
        // 更新地图概览
        if (this.mapOverview) {
          this.mapOverview.mindmap = this.mindmap;
          if (this.mapOverview.isVisible) {
            this.mapOverview.render();
          }
        }
      }, 200);
    }
  }

  getMdText(str: string) {
    // 检查是否有前置元数据
    const hasFrontMatter = FRONT_MATTER_REGEX.test(str);
    
    if (hasFrontMatter) {
      // 有前置元数据时删除它
      var md = str.trim().replace(FRONT_MATTER_REGEX, '');
      return md.trim();
    } else {
      // 无前置元数据时直接返回
      return str.trim();
    }
  }

  mdToData(str: string) {
    function transformData(mapData: any) {
      var flag = true;
      if (mapData.t == 'blockquote') {
        mapData = mapData.c[0];
        flag = false;
        mapData.v = '> ' + mapData.v;
      }
      const regexResult = /^.+ \^([a-z0-9\-]+)$/gim.exec(mapData.v);
      const id = regexResult != null ? regexResult[1] : null

     // console.log(id);

      var map: INodeData = {
        id: id || uuid(),
        text: id ? mapData.v.replace(` ^${id}`, '') : mapData.v,
        children: [],
        expanded: id ? false:true
      };

      if (flag && mapData.c && mapData.c.length) {
        mapData.c.forEach((data: any) => {
          map.children.push(transformData(data));
        });
      }

      return map;
    }

    if (str) {
      const { root } = transformer.transform(str);
      const data = transformData(root);
      return data;

    } else {
      return {
        id: uuid(),
        text: this.app.workspace.getActiveFile()?.basename || `${t('Untitled mindmap')}`
      }
    }
  }

  /**
   * 初始化大纲视图
   */
  initOutlineView() {
    if (!this.mindmap) return;
    
    // 创建大纲视图 - 使用父容器元素
    if (!this.outlineView) {
      const containerElement = this.mindmap.containerEL || this.contentEl;
      this.outlineView = new OutlineView(containerElement, this.mindmap);
      
      // 确保大纲视图已经初始化
      this.outlineView.render();
    } else {
      // 如果已存在大纲视图，则更新其引用
      this.outlineView.mindmap = this.mindmap;
      this.outlineView.render();
    }
    
    // 创建切换按钮
    if (!this.toggleButton) {
      const containerElement = this.mindmap.containerEL || this.contentEl;
      this.toggleButton = createViewToggleButton(containerElement, this.outlineView);
    }
    
    // 创建地图概览视图
    if (!this.mapOverview) {
      const containerElement = this.mindmap.containerEL || this.contentEl;
      this.mapOverview = new MapOverview(containerElement, this.mindmap);
    } else {
      // 如果已存在地图概览，则更新其引用
      this.mapOverview.mindmap = this.mindmap;
    }
    
    // 创建地图概览切换按钮
    if (!this.mapToggleButton) {
      const containerElement = this.mindmap.containerEL || this.contentEl;
      this.mapToggleButton = createMapToggleButton(containerElement, this.mapOverview);
    }
  }

  onMoreOptionsMenu(menu: Menu) {
    // 通过onHide钩子确保菜单显示在大纲视图上方
    menu.onHide(() => {
      // 这个函数会在菜单隐藏后执行
    });
    
    // 确保菜单显示在大纲视图上方
    setTimeout(() => {
      // 查找菜单元素并修改z-index
      const menuEl = document.querySelector('.menu');
      if (menuEl && menuEl instanceof HTMLElement) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- Dynamic style required
        menuEl.style.zIndex = "10000"; // 设置更高的z-index
      }
    }, 0);
    
    // Add a menu item to force the board to markdown view
    menu
      .addItem((item) => {
        item
          .setTitle(`${t("Open as markdown")}`)
          .setIcon("document")
          .onClick(() => {
            // 确保使用有效的文件路径作为键
            const fileKey = this.file?.path || '';
            if (fileKey) {
              this.plugin.mindmapFileModes[fileKey] = "markdown";
              this.plugin.setMarkdownView(this.leaf);
            }
          });
      });

    menu.addItem((item) => {
        item
          .setTitle(`${t("Toggle Outline View" as any)}`)
          .setIcon("list")
          .onClick(() => {
            if (this.outlineView) {
              this.outlineView.toggle();
            }
          });
      });

    menu.addItem((item) => {
        item
          .setTitle(`${t("Toggle Map Overview" as any)}`)
          .setIcon("image")
          .onClick(() => {
            if (this.mapOverview) {
              this.mapOverview.toggle();
            }
          });
      });





    // TextFileView类型上不存在onPaneMenu方法，所以我们不调用它
    // super.onPaneMenu(menu,'more-options');
  }

  // 创建 mindmap AI 子菜单
  private createMindmapAISubmenu(submenu: Menu): void {
    if (!submenu || !this.file) {
      return;
    }

    // 添加基础分析功能
    submenu.addItem((item) => {
      item
        .setTitle('文档分析')
        .setIcon('file-text')
        .onClick(async () => {
          await this.processFileWithAI('请对以下文档进行详细分析：{{content}}', 'AI文档分析');
        });
    });

    submenu.addItem((item) => {
      item
        .setTitle('生成摘要')
        .setIcon('list')
        .onClick(async () => {
          await this.processFileWithAI('请为以下文档生成简洁的摘要：{{content}}', 'AI生成摘要');
        });
    });

    submenu.addItem((item) => {
      item
        .setTitle('提取关键词')
        .setIcon('tag')
        .onClick(async () => {
          await this.processFileWithAI('请从以下文档中提取关键词和要点：{{content}}', 'AI提取关键词');
        });
    });

    // 添加用户自定义Prompt选项（非默认的）
    const userCustomPrompts = this.getUserCustomPrompts();

    if (Object.keys(userCustomPrompts).length > 0) {
      (submenu as any).addSeparator();

      Object.entries(userCustomPrompts).forEach(([name, template]) => {
        submenu.addItem((item) => {
          item
            .setTitle(name)
            .setIcon('sparkles')
            .onClick(async () => {
              // 将用户自定义Prompt中的 {{highlight}} 替换为 {{content}}
              const processedTemplate = (template as string).replace(/\{\{highlight\}\}/g, '{{content}}');
              await this.processFileWithAI(processedTemplate, `AI${name}`);
            });
        });
      });
    }

    (submenu as any).addSeparator();
    submenu.addItem((item) => {
      item
        .setTitle('自定义分析...')
        .setIcon('edit')
        .onClick(() => {
          this.showFileCustomPromptDialog();
        });
    });
  }

  /**
   * 应用更改到所有打开的 Markdown 视图，使用正确的事务方式保持撤销历史
   */
  private applyChangesToMarkdownViews(newContent: string) {
    if (!this.file) {
      return;
    }

    // 查找所有打开的 Markdown 视图
    const allLeaves = this.plugin.app.workspace.getLeavesOfType("markdown");

    // 如果没有找到对应的markdown视图，我们需要打开一个markdown视图来处理撤销历史
    if (allLeaves.length === 0) {
      // 创建一个新的markdown视图来处理撤销历史
      this.createMarkdownViewForUndo(newContent);
      return;
    }

    for (const leaf of allLeaves) {
      const markdownView = leaf.view as any;

      if (markdownView.file &&
          markdownView.file.path === this.file.path &&
          markdownView.editor &&
          typeof markdownView.editor.transaction === 'function') {
        try {
          // 获取当前编辑器的完整范围
          const lastLine = markdownView.editor.lastLine();
          const lastLineLength = markdownView.editor.getLine(lastLine).length;

          console.log('Applying mindmap changes to markdown view:', {
            filePath: this.file.path,
            lastLine,
            lastLineLength,
            contentLength: newContent.length
          });

          // 使用正确的 Obsidian EditorTransaction API 格式
          const transaction = {
            changes: [{
              from: { line: 0, ch: 0 },
              to: { line: lastLine, ch: lastLineLength },
              text: newContent
            }]
          };

          // 使用 transaction 方法确保更改被正确添加到撤销历史
          // origin参数用于标识这是来自思维导图的同步操作
          markdownView.editor.transaction(transaction, 'mindmap-sync');

          console.log('Successfully applied changes to markdown view using EditorTransaction API');
        } catch (transactionError) {
          console.warn('EditorTransaction API failed, trying direct replaceRange:', transactionError);

          // 如果 transaction 方法失败，使用 replaceRange 作为备选方案
          // 注意：这种方法不会保持撤销历史
          try {
            const lastLine = markdownView.editor.lastLine();
            const lastLineLength = markdownView.editor.getLine(lastLine).length;

            markdownView.editor.replaceRange(
              newContent,
              { line: 0, ch: 0 },
              { line: lastLine, ch: lastLineLength },
              'mindmap-sync'
            );
            console.log('Successfully applied changes using replaceRange fallback (no undo history)');
          } catch (fallbackError) {
            console.warn('Failed to apply changes to markdown view:', fallbackError);
          }
        }
      }
    }
  }

  // 获取用户自定义Prompt（排除默认的）
  private getUserCustomPrompts(): Record<string, string> {
    try {
      // 默认的prompts列表
      const defaultPrompts = [
        '🤔 核心洞察',
        '📝 内容扩展',
        '🔍 深度分析',
        '💡 创意思考',
        '📊 结构化总结'
      ];

      let allPrompts: Record<string, string> = {};

      // 优先从 AISettingsManager 获取（这里有最新的用户设置）
      if ((this.plugin as any).aiSettingsManager) {
        const aiSettings = (this.plugin as any).aiSettingsManager.getSettings();
        if (aiSettings && aiSettings.prompts) {
          allPrompts = aiSettings.prompts;
        }
      } else if (this.plugin && this.plugin.settings && this.plugin.settings.ai && this.plugin.settings.ai.prompts) {
        // 降级到从主设置获取
        allPrompts = this.plugin.settings.ai.prompts;
      }

      // 过滤掉默认的prompts，只返回用户自定义的
      const userCustomPrompts: Record<string, string> = {};
      Object.entries(allPrompts).forEach(([name, template]) => {
        if (!defaultPrompts.includes(name)) {
          userCustomPrompts[name] = template;
        }
      });

      return userCustomPrompts;
    } catch (error) {
      console.error('MindMapView - 获取用户自定义Prompt时出错:', error);
      return {};
    }
  }

  // 获取所有自定义Prompt（包括默认的）
  private getAllCustomPrompts(): Record<string, string> {
    try {
      // 优先从 AISettingsManager 获取
      if ((this.plugin as any).aiSettingsManager) {
        const aiSettings = (this.plugin as any).aiSettingsManager.getSettings();
        if (aiSettings && aiSettings.prompts) {
          console.log('MindMapView - 从AISettingsManager获取所有自定义Prompt:', aiSettings.prompts);
          return aiSettings.prompts;
        }
      }

      // 降级到从主设置获取
      if (this.plugin && this.plugin.settings && this.plugin.settings.ai && this.plugin.settings.ai.prompts) {
        const prompts = this.plugin.settings.ai.prompts;
        console.log('MindMapView - 从主设置获取所有自定义Prompt:', prompts);
        return prompts;
      }

      console.log('MindMapView - 未找到自定义Prompt，返回空对象');
      return {};
    } catch (error) {
      console.error('MindMapView - 获取自定义Prompt时出错:', error);
      return {};
    }
  }

  // 处理文件的 AI 分析
  private async processFileWithAI(template: string, functionName: string): Promise<void> {
    if (!this.file || !(this.plugin as any).aiService) {
      new Notice('AI 服务未配置或文件不可用');
      return;
    }

    try {
      const content = await (this as any).app.vault.read(this.file);

      // 生成文件名
      const fileName = `${this.file.name.replace(/\.[^/.]+$/, "")}-${functionName}`;

      // 获取保存路径
      const savePath = (this.plugin as any).aiSettingsManager?.getSavePath() || '';

      // 创建流式文件写入器
      const { StreamingFileWriter } = await import('./services/ai/StreamingFileWriter');
      const writer = new StreamingFileWriter({
        app: (this as any).app,
        fileName,
        sourceFile: this.file,
        analysisType: functionName,
        savePath,
      });

      await writer.initialize();

      // 处理模板中的占位符
      const processedTemplate = template.replace(/\{\{content\}\}/g, content);

      // 使用流式输出
      if ((this.plugin as any).aiService.supportsStreaming()) {
        const streamingOptions = {
          onToken: (token: string) => {
            writer.writeToken(token);
          },
          onComplete: async () => {
            await writer.complete();
          },
          onError: (error: Error) => {
            new Notice(`${functionName}失败: ${error.message}`);
            writer.abort();
          }
        };

        await (this.plugin as any).aiService.streamResponse(processedTemplate, streamingOptions);
      } else {
        // 降级到普通方式
        const response = await (this.plugin as any).aiService.generateResponse(processedTemplate, '', '');
        await writer.writeToken(response);
        await writer.complete();
      }
    } catch (error) {
      console.error('AI 分析失败:', error);
      new Notice(`AI 分析失败: ${error.message}`);
    }
  }

  // 显示自定义提示词对话框
  private async showFileCustomPromptDialog(): Promise<void> {
    try {
      const { CustomPromptModal } = await import('./services/ai/integration/ContextMenuIntegration');
      const modal = new CustomPromptModal((this as any).app, (customPrompt: string) => {
        if (customPrompt) {
          this.processFileWithAI(customPrompt, 'AI自定义分析');
        }
      });
      modal.open();
    } catch (error) {
      console.error('Failed to load CustomPromptModal:', error);
      // 降级到简单的 prompt 对话框
      const customPrompt = prompt('请输入自定义提示词 (使用 {{content}} 作为文档内容占位符):');
      if (customPrompt) {
        this.processFileWithAI(customPrompt, 'AI自定义分析');
      }
    }
  }
}
