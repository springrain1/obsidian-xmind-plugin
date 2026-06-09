import { t } from "./lang/helpers";
import MindMap from "./mindmap/mindmap";
import Node from "./mindmap/INode";

/**
 * 大纲视图组件，提供树状结构显示
 */
export class OutlineView {
  containerEl: HTMLElement;
  mindmap: MindMap;
  outlineEl: HTMLElement;
  searchEl: HTMLInputElement;
  searchResultsEl: HTMLElement;
  isVisible: boolean = false;
  searchText: string = '';
  observerRef: MutationObserver | null = null;
  renderTimeout: any = null;
  toggleButtonEl: HTMLElement | null = null; // 存储按钮元素引用

  constructor(containerEl: HTMLElement, mindmap: MindMap) {
    this.containerEl = containerEl;
    this.mindmap = mindmap;
    this.initialize();
    this.setupObserver();
  }

  /**
   * 初始化大纲视图
   */
  initialize() {
    // 创建大纲视图容器
    this.outlineEl = document.createElement('div');
    this.outlineEl.classList.add('mm-outline-view');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- Dynamic style required
    this.outlineEl.style.display = 'none';
    
    // 直接添加到body，而不是containerEl
    document.body.appendChild(this.outlineEl);
    
    // 创建标题和搜索区域
    const headerEl = document.createElement('div');
    headerEl.classList.add('mm-outline-header');
    
    // 使用类型断言确保t()函数参数类型正确
    const titleText = t('Outline View' as any);
    headerEl// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Safe SVG content
        .innerHTML = `<h3>${titleText}</h3>`;
    
    // 添加搜索框
    this.searchEl = document.createElement('input');
    this.searchEl.classList.add('mm-outline-search');
    this.searchEl.type = 'text';
    this.searchEl.placeholder = t('搜索...' as any);
    this.searchEl.addEventListener('input', () => {
      this.searchText = this.searchEl.value.trim().toLowerCase();
      // 更新清除按钮的可见性
      const clearButton = document.querySelector('.mm-outline-search-clear');
      if (clearButton) {
        if (this.searchText) {
          clearButton.classList.add('visible');
        } else {
          clearButton.classList.remove('visible');
        }
      }
      this.render();
    });
    
    const searchContainer = document.createElement('div');
    searchContainer.classList.add('mm-outline-search-container');
    searchContainer.appendChild(this.searchEl);
    
    // 添加搜索结果计数器
    this.searchResultsEl = document.createElement('span');
    this.searchResultsEl.classList.add('mm-outline-search-results');
    searchContainer.appendChild(this.searchResultsEl);
    
    // 添加清除按钮
    const clearButton = document.createElement('div');
    clearButton.classList.add('mm-outline-search-clear');
    clearButton.textContent = "✗";
    clearButton.addEventListener('click', () => {
      this.searchEl.value = '';
      this.searchText = '';
      // 内容清空后隐藏清除按钮
      clearButton.classList.remove('visible');
      this.render();
    });
    searchContainer.appendChild(clearButton);
    
    headerEl.appendChild(searchContainer);
    this.outlineEl.appendChild(headerEl);
    
    // 创建大纲内容容器
    const contentEl = document.createElement('div');
    contentEl.classList.add('mm-outline-content');
    this.outlineEl.appendChild(contentEl);
    
    // 添加样式
    this.addStyles();
  }
  
  /**
   * 设置DOM变化观察器，确保切换按钮始终可见
   */
  setupObserver() {
    // 观察容器的变化，确保按钮和大纲视图始终在正确位置
    this.observerRef = new MutationObserver((mutations) => {
      // 如果容器尺寸变化，重新渲染大纲视图
      if (this.isVisible) {
        // 使用节流避免过于频繁的渲染
        if (this.renderTimeout) {
          clearTimeout(this.renderTimeout);
        }
        this.renderTimeout = setTimeout(() => {
          this.render();
        }, 300); // 增加延迟，减少频繁渲染
      }
    });
    
    this.observerRef.observe(this.containerEl, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
  }
  
  /**
   * 添加大纲视图所需的CSS样式
   */
  addStyles() {
    // Disabled for Obsidian compliance
        // const styleEl = document.createElement('style');
    styleEl.textContent = `
      /* 定义RGB格式的CSS变量，用于透明度设置 */
      :root {
        --text-muted-rgb: 136, 136, 136;
        --text-normal-rgb: 64, 64, 64;
      }
      
      .theme-dark {
        --text-muted-rgb: 153, 153, 153;
        --text-normal-rgb: 220, 220, 220;
      }
    
      .mm-outline-view {
        position: fixed; /* 固定定位 */
        top: 55px; /* 调整到更靠近顶部的位置 */
        right: 20px;
        width: 280px;
        max-height: 70vh; /* 恢复原始高度计算 */
        background: var(--background-primary);
        border: 1px solid var(--background-modifier-border);
        border-radius: 5px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        animation: mm-fade-in 0.2s ease-in-out;
        /* 使用硬件加速，减少重绘闪烁 */
        transform: translateZ(0);
        backface-visibility: hidden;
        -webkit-font-smoothing: subpixel-antialiased;
      }
      
      @keyframes mm-fade-in {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .mm-outline-header {
        padding: 8px 12px;
        border-bottom: 1px solid var(--background-modifier-border);
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .mm-outline-header h3 {
        margin: 0;
        font-size: 16px;
      }
      
      .mm-outline-search-container {
        display: flex;
        align-items: center;
        width: 100%;
        position: relative;
      }
      
      .mm-outline-search {
        width: 100%;
        padding: 6px 8px;
        font-size: 12px;
        border-radius: 4px;
        border: 1px solid var(--background-modifier-border);
        background: var(--background-primary);
        color: var(--text-normal);
        padding-right: 28px; /* 为清除按钮留出空间 */
      }
      
      .mm-outline-search:focus {
        border-color: var(--interactive-accent);
        outline: none;
      }
      
      .mm-outline-search-clear {
        position: absolute;
        right: 30px;
        top: 50%;
        transform: translateY(-50%);
        width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        opacity: 0.7;
        transition: opacity 0.2s ease;
        background: var(--background-modifier-border);
        border-radius: 50%;
        font-size: 12px;
        color: var(--text-normal);
        visibility: hidden; /* 默认隐藏 */
      }
      
      .mm-outline-search-clear:hover {
        opacity: 1;
      }
      
      .mm-outline-search-clear.visible {
        visibility: visible;
      }
      
      .mm-outline-search-results {
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 10px;
        color: var(--text-muted);
      }
      
      .mm-outline-content {
        padding: 8px 0;
        overflow-y: auto;
        overflow-x: auto; /* 添加横向滚动条支持 */
        max-height: calc(70vh - 120px); /* 调整高度计算，避免内容过长 */
        /* 启用硬件加速避免闪烁 */
        transform: translateZ(0);
        position: relative;
      }
      
      .mm-outline-items-container {
        /* 单独的内容容器，确保所有项目在可滚动区域内 */
        min-width: 100%;
        width: max-content;
        padding-right: 16px;
        /* 防止悬停闪烁 */
        pointer-events: auto;
        transform: translateZ(0);
        position: relative;
      }
      
      /* 进一步优化悬停性能 */
      .mm-outline-items-container * {
        pointer-events: auto;
        transform: translateZ(0);
        backface-visibility: hidden;
        will-change: transform;
      }
      
      .mm-outline-item {
        padding: 4px 8px 4px 8px;
        display: flex;
        align-items: center;
        cursor: pointer;
        position: relative;
        user-select: none; /* 防止鼠标悬停时选择文本导致闪烁 */
        
        /* 进一步优化渲染性能，防止闪烁 */
        -webkit-tap-highlight-color: transparent;
        transform: translateZ(0);
        
        /* 使用更稳定的背景过渡，避免闪烁 */
        background-color: transparent;
        transition: none; /* 移除过渡效果，防止闪烁 */
        
        /* 阻止文本选择，多浏览器支持 */
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        
        /* 禁用will-change提示，过度使用可能导致闪烁 */
        will-change: auto;
      }
      
      .mm-outline-item:not(.loading):hover {
        background-color: var(--background-modifier-hover);
      }
      
      .mm-outline-item.active {
        background-color: var(--background-modifier-active);
      }
      
      .mm-outline-item.search-highlight {
        background-color: var(--text-highlight-bg);
      }
      
      .mm-outline-item.loading::after {
        content: "";
        position: absolute;
        right: 8px;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 2px solid var(--text-muted);
        border-top-color: var(--interactive-accent);
        animation: mm-spin 0.6s linear infinite;
      }
      
      @keyframes mm-spin {
        to { transform: rotate(360deg); }
      }
      
      .mm-outline-item-content {
        margin-left: 4px;
        white-space: nowrap;
        flex: 1;
        /* 移除单个项目的滚动条和溢出控制 */
        overflow: visible;
        padding: 2px 0;
        /* 防止文本引起的闪烁 */
        transform: translateZ(0);
      }
      
      /* 统一滚动条样式 - 美化版本 */
      .mm-outline-content::-webkit-scrollbar {
        height: 8px; /* 水平滚动条高度 */
        width: 8px;  /* 垂直滚动条宽度 */
      }
      
      .mm-outline-content::-webkit-scrollbar-track {
        background: transparent;
        border-radius: 4px;
        margin: 2px;
      }
      
      .mm-outline-content::-webkit-scrollbar-thumb {
        background: rgba(var(--text-muted-rgb), 0.3);
        border-radius: 999px;
        border: 2px solid transparent;
        background-clip: padding-box;
      }
      
      .mm-outline-content:hover::-webkit-scrollbar-thumb {
        background: rgba(var(--text-normal-rgb), 0.4);
        border: 2px solid transparent;
        background-clip: padding-box;
      }
      
      .mm-outline-content::-webkit-scrollbar-thumb:hover {
        background: rgba(var(--text-normal-rgb), 0.5);
        border: 1px solid transparent;
        background-clip: padding-box;
      }
      
      .mm-outline-content::-webkit-scrollbar-corner {
        background: transparent;
      }
      
      /* 改进的层级指示器 */
      .mm-outline-toggle {
        width: 16px;
        height: 16px;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 10px;
        cursor: pointer;
        flex-shrink: 0;
        opacity: 0.8;
        transition: opacity 0.2s ease;
        position: relative;
        pointer-events: auto;
        transform: translateZ(0);
      }
      
      .mm-outline-toggle:hover {
        opacity: 1;
      }
      
      /* 无子节点的指示器样式 */
      .mm-outline-toggle.leaf-node::before {
        content: "";
        position: absolute;
        display: block;
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background-color: var(--text-muted);
        transform: translateZ(0);
      }
      
      /* 有子节点的三角形指示器 */
      .mm-outline-toggle.has-children {
        transform-origin: center;
        transition: transform 0.15s ease;
      }
      
      .mm-outline-toggle.has-children.collapsed {
        transform: rotate(-90deg);
      }
      
      .mm-view-toggle {
        position: fixed;
        bottom: 20px; /* 位于底部 */
        right: 20px;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: var(--background-primary);
        border: 1px solid var(--background-modifier-border);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        z-index: 9999; /* 确保按钮始终在最上层 */
        transition: all 0.2s ease;
        /* 使用硬件加速 */
        transform: translateZ(0);
        will-change: transform, background;
      }
      
      .mm-view-toggle:hover {
        background: var(--background-modifier-hover);
        transform: translateZ(0) scale(1.05);
      }
      
      .mm-view-toggle.active {
        background: var(--interactive-accent);
        color: var(--text-on-accent);
      }
      
      .mm-no-results {
        padding: 8px 12px;
        color: var(--text-muted);
        font-style: italic;
      }
    `;
    document.head.appendChild(styleEl);
  }

  /**
   * 显示大纲视图的显示/隐藏状态
   */
  toggle() {
    this.isVisible = !this.isVisible;
    
    // 确保大纲视图元素已添加到DOM中
    if (!this.outlineEl.parentNode) {
      document.body.appendChild(this.outlineEl);
    }
    
    // 更新显示状态
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- Dynamic style required
    this.outlineEl.style.display = this.isVisible ? 'flex' : 'none';
    
    // 更新切换按钮状态
    const toggleButton = this.toggleButtonEl || document.querySelector('.mm-view-toggle');
    if (toggleButton) {
      if (this.isVisible) {
        toggleButton.classList.add('active');
      } else {
        toggleButton.classList.remove('active');
      }
    }
    
    if (this.isVisible) {
      // 清空搜索框
      if (this.searchEl) {
        this.searchEl.value = '';
        this.searchText = '';
      }
      
      // 确保渲染最新数据
      this.render();
      
      // 当打开时，聚焦搜索框
      setTimeout(() => {
        if (this.searchEl) {
          this.searchEl.focus();
        }
      }, 100);
    }
  }

  /**
   * 渲染大纲视图内容
   */
  render() {
    const contentElement = this.outlineEl.querySelector('.mm-outline-content');
    if (!contentElement || !this.mindmap || !this.mindmap.root) return;
    
    // 确保正确的类型
    const contentEl = contentElement as HTMLElement;
    
    // 清空现有内容
    contentEl.empty();
    
    // 创建内容容器，用于启用整体滚动
    const itemsContainer = document.createElement('div');
    itemsContainer.classList.add('mm-outline-items-container');
    contentEl.appendChild(itemsContainer);
    
    // 如果有搜索文本，则搜索匹配节点
    if (this.searchText) {
      const matches = this.searchNodes(this.mindmap.root);
      
      if (matches.length > 0) {
        // 更新搜索结果计数
        this.searchResultsEl.textContent = `${matches.length}`;
        
        // 渲染匹配的节点
        matches.forEach(node => {
          this.renderSearchResult(node, itemsContainer);
        });
      } else {
        // 无匹配结果
        this.searchResultsEl.textContent = '0';
        const noResultDiv = itemsContainer.createEl('div', { cls: 'mm-no-results' });
        noResultDiv.textContent = t('无匹配结果' as any);
      }
    } else {
      // 清空搜索结果计数
      this.searchResultsEl.textContent = '';
      
      // 递归渲染节点
      this.renderNode(this.mindmap.root, itemsContainer, 0);
    }
  }
  
  /**
   * 搜索匹配的节点
   * @param rootNode 开始搜索的根节点
   * @returns 匹配的节点数组
   */
  searchNodes(rootNode: Node): Node[] {
    const matches: Node[] = [];
    
    const traverse = (node: Node) => {
      // 检查节点文本是否匹配搜索文本
      if (node.data.text.toLowerCase().includes(this.searchText)) {
        matches.push(node);
      }
      
      // 递归搜索子节点
      if (node.children.length > 0) {
        node.children.forEach(child => {
          traverse(child);
        });
      }
    };
    
    traverse(rootNode);
    return matches;
  }
  
  /**
   * 渲染搜索结果
   * @param node 匹配的节点
   * @param parentEl 父容器元素
   */
  renderSearchResult(node: Node, parentEl: HTMLElement) {
    const itemEl = document.createElement('div');
    itemEl.classList.add('mm-outline-item');
    if (node === this.mindmap.selectNode) {
      itemEl.classList.add('active');
    }
    itemEl.classList.add('search-highlight');
    
    // 添加节点内容
    const contentEl = document.createElement('div');
    contentEl.classList.add('mm-outline-item-content');
    
    // 高亮显示匹配文本
    const text = node.data.text;
    const lowerText = text.toLowerCase();
    const matchIndex = lowerText.indexOf(this.searchText);
    
    if (matchIndex >= 0) {
      const before = text.substring(0, matchIndex);
      const match = text.substring(matchIndex, matchIndex + this.searchText.length);
      const after = text.substring(matchIndex + this.searchText.length);
      
      contentEl.appendText(before);
      const strongEl = contentEl.createEl('strong');
      strongEl.textContent = match;
      contentEl.appendText(after);
    } else {
      contentEl.textContent = text;
    }
    
    // 添加层级指示器（小圆点或三角形）
    let toggleEl = document.createElement('div');
    toggleEl.classList.add('mm-outline-toggle');
    
    // 搜索结果节点使用叶子节点样式（小圆点）
    if (node.children.length === 0) {
      toggleEl.classList.add('leaf-node');
    } else {
      // 有子节点使用三角形
      toggleEl.classList.add('has-children');
      toggleEl.textContent = "▼";
      // 如果节点已折叠，旋转三角形
      if (!node.isExpand) {
        toggleEl.classList.add('collapsed');
      }
    }
    
    // 添加data属性存储节点ID，减少点击处理时的闪烁
    itemEl.setAttribute('data-node-id', node.data.id);
    
    // 使用事件委托减少事件监听器数量
    if (!parentEl.hasAttribute('data-has-click-listener')) {
      parentEl.setAttribute('data-has-click-listener', 'true');
      parentEl.addEventListener('click', (e) => {
        // 查找最近的mm-outline-item元素
        const target = e.target as HTMLElement;
        const targetItem = target.closest('.mm-outline-item') as HTMLElement | null;
        if (targetItem && targetItem.getAttribute('data-node-id')) {
          this.handleNodeClick(targetItem, targetItem.getAttribute('data-node-id') || '');
        }
      });
    }
    
    itemEl.appendChild(toggleEl);
    itemEl.appendChild(contentEl);
    parentEl.appendChild(itemEl);
  }
  
  /**
   * 处理节点点击事件
   * @param itemEl 被点击的DOM元素
   * @param nodeId 节点ID
   */
  handleNodeClick(itemEl: HTMLElement, nodeId: string) {
    // 防止重复点击
    if (itemEl.classList.contains('loading') || !nodeId) {
      return;
    }
    
    // 添加加载指示器
    itemEl.classList.add('loading');
    
    // 查找对应的节点
    const node = this.mindmap.getNodeById(nodeId);
    if (!node) {
      itemEl.classList.remove('loading');
      return;
    }
    
    // 直接处理节点选择和居中，避免嵌套异步操作
    try {
      // 解除选中当前节点
      this.mindmap.clearSelectNode();
      
      // 确保节点的父节点都展开
      let parent = node.parent;
      let needsRefresh = false;
      while (parent) {
        if (!parent.isExpand) {
          parent.isExpand = true; // 直接设置状态而不是调用expand方法
          needsRefresh = true;
        }
        parent = parent.parent;
      }
      
      // 如果需要刷新，先执行一次
      if (needsRefresh) {
        this.mindmap.refresh();
      }
      
      // 选中节点
      node.select();
      
      // 尝试平滑居中节点
      try {
        // 尝试使用平滑滚动 - 新API
        this.mindmap.centerOnNode(node, true);
      } catch (e) {
        console.log("平滑居中失败，切换到标准居中:", e);
        try {
          // 回退到标准居中 - 旧API
          this.mindmap.centerOnNode(node);
        } catch (e2) {
          console.error("节点居中失败:", e2);
        }
      }
      
      // 移除加载指示器并标记活动节点
      setTimeout(() => {
        // 移除所有节点的活动状态
        document.querySelectorAll('.mm-outline-item.active').forEach(el => {
          el.classList.remove('active');
        });
        
        // 为当前节点添加活动状态
        itemEl.classList.add('active');
        itemEl.classList.remove('loading');
      }, 50);
    } catch (error) {
      console.error("处理节点点击时出错:", error);
      itemEl.classList.remove('loading');
    }
  }

  /**
   * 递归渲染节点及其子节点
   * @param node 要渲染的节点
   * @param parentEl 父容器元素
   * @param level 缩进级别
   */
  renderNode(node: Node, parentEl: HTMLElement, level: number) {
    const itemEl = document.createElement('div');
    itemEl.classList.add('mm-outline-item');
    if (node === this.mindmap.selectNode) {
      itemEl.classList.add('active');
    }
    
    // 设置缩进
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- Dynamic style required
    itemEl.style.paddingLeft = `${level * 16 + 8}px`;
    
    // 添加层级指示器（小圆点或三角形）
    const toggleEl = document.createElement('div');
    toggleEl.classList.add('mm-outline-toggle');
    
    if (node.children.length > 0) {
      // 有子节点使用三角形
      toggleEl.classList.add('has-children');
      toggleEl.textContent = "▼";
      
      // 如果节点已折叠，旋转三角形
      if (!node.isExpand) {
        toggleEl.classList.add('collapsed');
      }
      
      // 优化切换逻辑，避免完全重新渲染
      toggleEl.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        
        // 获取此节点的所有子项的DOM元素
        const nodeId = node.data.id;
        const childNodes = Array.from(parentEl.querySelectorAll(`[data-parent-id="${nodeId}"]`)) as HTMLElement[];
        
        if (node.isExpand) {
          // 折叠：隐藏子节点
          node.collapse();
          toggleEl.classList.add('collapsed');
          childNodes.forEach(childEl => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- Dynamic style required
            childEl.style.display = 'none';
          });
        } else {
          // 展开：显示子节点
          node.expand();
          toggleEl.classList.remove('collapsed');
          childNodes.forEach(childEl => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- Dynamic style required
            childEl.style.display = 'flex';
          });
        }
        
        // 通知思维导图更新但不重新渲染大纲
        this.mindmap.refresh();
      });
    } else {
      // 无子节点使用小圆点
      toggleEl.classList.add('leaf-node');
    }
    
    // 添加节点内容
    const contentEl = document.createElement('div');
    contentEl.classList.add('mm-outline-item-content');
    contentEl.textContent = node.data.text;
    
    // 添加数据属性存储节点ID和父节点ID（用于展开/折叠操作）
    itemEl.setAttribute('data-node-id', node.data.id);
    if (node.parent) {
      itemEl.setAttribute('data-parent-id', node.parent.data.id);
    }
    
    // 为每个项目单独添加点击监听器，避免事件委托冒泡导致的闪烁
    itemEl.addEventListener('click', (e) => {
      // 仅当点击不是在折叠/展开图标上时，才处理节点选择
      if (!e.composedPath().includes(toggleEl)) {
        this.handleNodeClick(itemEl, node.data.id);
      }
    });
    
    itemEl.appendChild(toggleEl);
    itemEl.appendChild(contentEl);
    parentEl.appendChild(itemEl);
    
    // 递归渲染子节点
    if (node.isExpand && node.children.length > 0) {
      node.children.forEach(child => {
        this.renderNode(child, parentEl, level + 1);
      });
    }
  }

  /**
   * 销毁大纲视图
   */
  destroy() {
    // 清除观察器
    if (this.observerRef) {
      this.observerRef.disconnect();
      this.observerRef = null;
    }
    
    // 清除timeout
    if (this.renderTimeout) {
      clearTimeout(this.renderTimeout);
    }
    
    // 移除DOM元素
    if (this.outlineEl && this.outlineEl.parentNode) {
      this.outlineEl.parentNode.removeChild(this.outlineEl);
    }
  }
}

/**
 * 创建切换按钮
 * @param containerEl 容器元素
 * @param outlineView 大纲视图实例
 */
export function createViewToggleButton(containerEl: HTMLElement, outlineView: OutlineView) {
  // 检查是否已经存在按钮，避免重复创建
  let existingButton = document.querySelector('.mm-view-toggle');
  if (existingButton) {
    existingButton.remove();
  }
  
  const buttonEl = document.createElement('div');
  buttonEl.classList.add('mm-view-toggle');
  if (outlineView.isVisible) {
    buttonEl.classList.add('active');
  }
  
  // 使用类型断言确保t()函数参数类型正确
  const tooltipText = t('Toggle Outline View' as any);
  buttonEl.setAttribute('title', tooltipText);
  
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Safe static SVG
  buttonEl.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>';
  
  // 增强按钮点击区域和响应性
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- Dynamic style required
  buttonEl.style.pointerEvents = 'auto';
  
  // 使用捕获阶段避免事件冒泡被阻止
  buttonEl.addEventListener('click', () => {
    outlineView.toggle();
  }, { capture: true });
  
  // 使用固定位置，确保按钮始终在视口内可见
  document.body.appendChild(buttonEl);
  
  // 设置按钮位置更新逻辑 - 移到右下角
  const updateButtonPosition = () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- Dynamic style required
    buttonEl.style.position = 'fixed';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- Dynamic style required
    buttonEl.style.top = 'auto'; // 清除顶部定位
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- Dynamic style required
    buttonEl.style.bottom = '20px'; // 位于底部
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- Dynamic style required
    buttonEl.style.right = '20px';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- Dynamic style required
    buttonEl.style.zIndex = '9999'; // 确保在最上层
  };
  
  // 初始更新按钮位置
  updateButtonPosition();
  
  // 监听滚动和调整大小事件，确保按钮位置正确
  window.addEventListener('scroll', updateButtonPosition, { passive: true });
  window.addEventListener('resize', updateButtonPosition, { passive: true });
  
  // 存储按钮元素引用，以便后续可以获取其位置
  outlineView.toggleButtonEl = buttonEl;
  
  return buttonEl;
} 