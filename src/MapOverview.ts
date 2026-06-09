import MindMap from './mindmap/mindmap';
import { t } from './lang/helpers';

/**
 * 思维导图概览视图类
 * 提供类似XMind缩略图功能，展示整个思维导图的概览，并可通过点击定位
 */
export class MapOverview {
  containerEl: HTMLElement;
  mindmap: MindMap;
  overviewEl: HTMLElement;
  isVisible: boolean = false;
  viewportIndicatorEl: HTMLElement;
  miniMapEl: HTMLElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  scale: number = 0.15; // 缩略图比例
  dragging: boolean = false;
  lastX: number = 0;
  lastY: number = 0;
  resizeObserver: ResizeObserver;
  renderTimeout: any = null;
  scrollHandler: any = null; // 滚动处理函数引用
  wheelHandler: any = null;  // 缩放处理函数引用
  nodeExpandHandler: any = null; // 节点展开处理函数
  nodeCollapseHandler: any = null; // 节点折叠处理函数
  
  /**
   * 构造函数
   * @param containerEl 容器元素
   * @param mindmap 思维导图实例
   */
  constructor(containerEl: HTMLElement, mindmap: MindMap) {
    this.containerEl = containerEl;
    this.mindmap = mindmap;
    this.initialize();
    this.setupResizeObserver();
    this.setupEventListeners();
  }
  
  /**
   * 初始化概览视图
   */
  initialize() {
    this.overviewEl = document.createElement('div');
    this.overviewEl.classList.add('mm-map-overview');
    this.overviewEl.style.display = 'none';
    
    // 创建缩略图容器 - 移除标题栏，使界面更简洁
    this.miniMapEl = document.createElement('div');
    this.miniMapEl.classList.add('mm-map-overview-content');
    
    // 创建Canvas用于绘制思维导图
    this.canvas = document.createElement('canvas');
    this.canvas.classList.add('mm-map-overview-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.miniMapEl.appendChild(this.canvas);
    
    // 创建视口指示器
    this.viewportIndicatorEl = document.createElement('div');
    this.viewportIndicatorEl.classList.add('mm-map-overview-viewport');
    this.miniMapEl.appendChild(this.viewportIndicatorEl);
    
    // 添加事件监听器
    this.miniMapEl.addEventListener('mousedown', this.handleMouseDown.bind(this));
    window.addEventListener('mousemove', this.handleMouseMove.bind(this));
    window.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.miniMapEl.addEventListener('click', this.handleClick.bind(this));
    
    this.overviewEl.appendChild(this.miniMapEl);
    
    document.body.appendChild(this.overviewEl);
    this.addStyles();
  }
  
  /**
   * 设置大小变化观察器
   */
  setupResizeObserver() {
    // 监听容器大小变化
    this.resizeObserver = new ResizeObserver(() => {
      if (this.isVisible) {
        this.render();
      }
    });
    
    this.resizeObserver.observe(this.containerEl);
    this.resizeObserver.observe(document.body); // 也观察body元素变化
  }
  
  /**
   * 设置事件监听器，包括滚动和缩放事件
   */
  setupEventListeners() {
    // 监听容器滚动事件
    this.scrollHandler = this.handleContainerScroll.bind(this);
    this.containerEl.addEventListener('scroll', this.scrollHandler, { passive: true });
    
    // 监听缩放事件（鼠标滚轮）
    this.wheelHandler = this.handleWheel.bind(this);
    this.containerEl.addEventListener('wheel', this.wheelHandler, { passive: true });
    
    // 监听思维导图缩放变化
    if (this.mindmap && this.mindmap.on) {
      // 监听思维导图的自定义事件
      this.mindmap.on('scale', () => {
        if (this.isVisible) {
          this.render();
        }
      });
      
      // 监听思维导图节点变化
      this.mindmap.on('nodeChanged', () => {
        if (this.isVisible) {
          this.render();
        }
      });

      // 监听节点展开和折叠事件
      this.nodeExpandHandler = () => {
        if (this.isVisible) {
          this.render();
        }
      };
      
      this.nodeCollapseHandler = () => {
        if (this.isVisible) {
          this.render();
        }
      };
      
      this.mindmap.on('expand', this.nodeExpandHandler);
      this.mindmap.on('collapse', this.nodeCollapseHandler);
      
      // 在节点添加和删除后也更新
      this.mindmap.on('nodeAdded', () => {
        if (this.isVisible) {
          this.render();
        }
      });
      
      this.mindmap.on('nodeRemoved', () => {
        if (this.isVisible) {
          this.render();
        }
      });
    }
    
    // 监听DOM变化以捕获折叠/展开
    const observer = new MutationObserver((mutations) => {
      if (this.isVisible) {
        // 只在DOM变化且概览可见时重新渲染
        this.render();
      }
    });
    
    observer.observe(this.containerEl, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });
  }
  
  /**
   * 添加样式
   */
  addStyles() {
    // Disabled for Obsidian compliance
        // const styleEl = document.createElement('style');
    styleEl.textContent = `
      /* 定义RGB格式的CSS变量，用于透明度设置 */
      :root {
        --interactive-accent-rgb: 14, 210, 247;
        --background-modifier-border-rgb: 127, 132, 151;
      }
      
      .theme-dark {
        --interactive-accent-rgb: 76, 175, 223;
        --background-modifier-border-rgb: 50, 56, 62;
      }
    
      .mm-map-overview {
        position: fixed;
        bottom: 70px; /* 位于按钮上方 */
        right: 20px; /* 与大纲视图平齐 */
        width: 280px;
        height: 200px;
        background: var(--background-primary);
        border: 1px solid var(--background-modifier-border);
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        animation: mm-fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        transform: translateZ(0);
      }
      
      @keyframes mm-fade-in {
        from { opacity: 0; transform: scale(0.92) translateY(10px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }
      
      .mm-map-overview-content {
        flex: 1;
        position: relative;
        overflow: hidden;
        background: var(--background-primary);
        border-radius: 8px;
      }
      
      .mm-map-overview-canvas {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }
      
      .mm-map-overview-viewport {
        position: absolute;
        border: 2px solid rgba(var(--interactive-accent-rgb), 0.9);
        background-color: rgba(var(--interactive-accent-rgb), 0.1);
        box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05), 
                    0 0 0 3px rgba(var(--interactive-accent-rgb), 0.2),
                    inset 0 0 0 1px rgba(var(--interactive-accent-rgb), 0.3);
        cursor: move;
        transition: box-shadow 0.2s ease;
        pointer-events: all;
      }
      
      .mm-map-overview-viewport:hover {
        box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1), 
                    0 0 0 4px rgba(var(--interactive-accent-rgb), 0.3),
                    inset 0 0 0 1px rgba(var(--interactive-accent-rgb), 0.4);
      }
      
      .mm-map-overview-toggle {
        position: fixed;
        bottom: 70px; /* 在大纲视图按钮上方 */
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
        z-index: 9999;
        transition: all 0.2s ease;
        transform: translateZ(0);
      }
      
      .mm-map-overview-toggle:hover {
        background: var(--background-modifier-hover);
        transform: translateZ(0) scale(1.05);
      }
      
      .mm-map-overview-toggle.active {
        background: var(--interactive-accent);
        color: var(--text-on-accent);
      }
      
      /* 点击特效动画 */
      .mm-map-click-effect {
        position: absolute;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: rgba(var(--interactive-accent-rgb), 0.6);
        transform: translate(-50%, -50%);
        pointer-events: none;
        animation: mm-click-ripple 0.5s ease-out forwards;
        z-index: 10;
      }
      
      @keyframes mm-click-ripple {
        0% {
          opacity: 1;
          transform: translate(-50%, -50%) scale(0.3);
        }
        100% {
          opacity: 0;
          transform: translate(-50%, -50%) scale(2);
        }
      }
    `;
    document.head.appendChild(styleEl);
  }
  
  /**
   * 处理容器滚动事件
   */
  handleContainerScroll() {
    if (this.isVisible && !this.dragging) {
      // 使用requestAnimationFrame来优化性能
      requestAnimationFrame(() => {
        this.updateViewportIndicator();
      });
    }
  }
  
  /**
   * 处理鼠标滚轮事件（缩放）
   */
  handleWheel(event: WheelEvent) {
    if (this.isVisible) {
      // 使用requestAnimationFrame优化性能
      requestAnimationFrame(() => {
        this.renderMiniMap();
        this.updateViewportIndicator();
      });
    }
  }
  
  /**
   * 切换概览视图显示/隐藏
   */
  toggle() {
    this.isVisible = !this.isVisible;
    this.overviewEl.style.display = this.isVisible ? 'flex' : 'none';
    
    // 更新切换按钮状态
    const toggleButton = document.querySelector('.mm-map-overview-toggle');
    if (toggleButton) {
      if (this.isVisible) {
        toggleButton.classList.add('active');
        this.render();
      } else {
        toggleButton.classList.remove('active');
      }
    }
    
    // 当显示时立即更新视图
    if (this.isVisible) {
      this.renderMiniMap();
      this.updateViewportIndicator();
    }
  }
  
  /**
   * 渲染概览视图
   */
  render() {
    if (!this.mindmap || !this.isVisible) return;
    
    // 防止频繁渲染
    if (this.renderTimeout) {
      clearTimeout(this.renderTimeout);
    }
    
    this.renderTimeout = setTimeout(() => {
      this.renderMiniMap();
      this.updateViewportIndicator();
    }, 50); // 降低延迟以增强响应性
  }
  
  /**
   * 渲染小地图 - 彩色版本
   */
  renderMiniMap() {
    // 清除Canvas
    const width = this.miniMapEl.clientWidth;
    const height = this.miniMapEl.clientHeight;
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx.clearRect(0, 0, width, height);
    
    const nodes = this.getAllVisibleNodes();
    
    if (nodes.length === 0) return;
    
    // 计算所有节点的边界
    const bounds = this.calculateNodesBounds(nodes);
    const contentWidth = bounds.maxX - bounds.minX + 400; // 增加边距
    const contentHeight = bounds.maxY - bounds.minY + 400; // 增加边距
    
    // 确定缩放比例
    const scaleX = width / contentWidth;
    const scaleY = height / contentHeight;
    this.scale = Math.min(scaleX, scaleY);
    
    // 计算偏移以使内容居中
    const offsetX = (width / 2) - ((bounds.maxX + bounds.minX) / 2) * this.scale;
    const offsetY = (height / 2) - ((bounds.maxY + bounds.minY) / 2) * this.scale;
    
    // 绘制连线
    nodes.forEach(node => {
      if (node.parent) {
        const parentBox = node.parent.getBox();
        const childBox = node.getBox();
        
        const px = (parentBox.x + parentBox.width / 2) * this.scale + offsetX;
        const py = (parentBox.y + parentBox.height / 2) * this.scale + offsetY;
        const cx = (childBox.x + childBox.width / 2) * this.scale + offsetX;
        const cy = (childBox.y + childBox.height / 2) * this.scale + offsetY;
        
        // 使用节点的实际颜色绘制连线
        const stroke = node.stroke || 'var(--text-normal)';
        this.ctx.strokeStyle = stroke;
        this.ctx.lineWidth = 1.5;
        
        // 绘制曲线连接
        this.ctx.beginPath();
        this.ctx.moveTo(px, py);
        
        // 绘制贝塞尔曲线或直线
        if (Math.abs(py - cy) > 10) {
          // 水平方向较远时使用贝塞尔曲线
          const ctrlPointX = (px + cx) / 2;
          const ctrlPointY = py;
          const ctrlPointX2 = (px + cx) / 2;
          const ctrlPointY2 = cy;
          
          this.ctx.bezierCurveTo(ctrlPointX, ctrlPointY, ctrlPointX2, ctrlPointY2, cx, cy);
        } else {
          // 否则使用直线
          this.ctx.lineTo(cx, cy);
        }
        
        this.ctx.stroke();
      }
    });
    
    // 绘制节点
    nodes.forEach(node => {
      const box = node.getBox();
      const x = box.x * this.scale + offsetX;
      const y = box.y * this.scale + offsetY;
      const w = Math.max(box.width * this.scale, 4);
      const h = Math.max(box.height * this.scale, 3);
      
      // 使用节点的实际颜色
      const level = node.getLevel();
      // 获取节点颜色 - 使用实际颜色而不是默认颜色
      let fillColor = node.stroke;
      if (!fillColor) {
        if (level === 0) {
          // 根节点
          fillColor = 'var(--interactive-accent)';
        } else if (level === 1) {
          // 一级节点
          fillColor = 'var(--text-accent)';
        } else {
          // 其他节点
          fillColor = 'var(--text-muted)';
        }
      }
      
      this.ctx.fillStyle = fillColor;
      
      // 根节点使用阴影效果
      if (level === 0) {
        this.ctx.shadowColor = 'rgba(0,0,0,0.2)';
        this.ctx.shadowBlur = 2;
      } else {
        this.ctx.shadowBlur = 0;
      }
      
      // 节点是选中状态时使用不同的边框
      if (node === this.mindmap.selectNode) {
        this.ctx.strokeStyle = 'var(--interactive-accent)';
        this.ctx.lineWidth = 1.5;
        // 选中节点使用圆角矩形+边框
        this.roundRect(x, y, w, h, 2);
        this.ctx.stroke();
      } else {
        // 普通节点使用圆角矩形
        this.roundRect(x, y, w, h, 2);
      }
    });
  }
  
  /**
   * 绘制圆角矩形
   */
  roundRect(x: number, y: number, w: number, h: number, r: number) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.ctx.beginPath();
    this.ctx.moveTo(x + r, y);
    this.ctx.arcTo(x + w, y, x + w, y + h, r);
    this.ctx.arcTo(x + w, y + h, x, y + h, r);
    this.ctx.arcTo(x, y + h, x, y, r);
    this.ctx.arcTo(x, y, x + w, y, r);
    this.ctx.closePath();
    this.ctx.fill();
  }
  
  /**
   * 更新视口指示器位置
   */
  updateViewportIndicator() {
    if (!this.mindmap || !this.isVisible) return;
    
    const containerRect = this.containerEl.getBoundingClientRect();
    const contentRect = this.mindmap.contentEL.getBoundingClientRect();
    const miniMapRect = this.miniMapEl.getBoundingClientRect();
    
    // 获取当前思维导图的缩放级别
    const mindmapScale = this.mindmap.mindScale ? this.mindmap.mindScale / 100 : 1;
    
    // 计算思维导图内容区域的边界
    const bounds = this.calculateNodesBounds(this.getAllVisibleNodes());
    const contentWidth = bounds.maxX - bounds.minX + 400;
    const contentHeight = bounds.maxY - bounds.minY + 400;
    
    // 计算缩放比例和偏移量
    const width = this.miniMapEl.clientWidth;
    const height = this.miniMapEl.clientHeight;
    const scaleX = width / contentWidth;
    const scaleY = height / contentHeight;
    const scale = Math.min(scaleX, scaleY);
    
    const offsetX = (width / 2) - ((bounds.maxX + bounds.minX) / 2) * scale;
    const offsetY = (height / 2) - ((bounds.maxY + bounds.minY) / 2) * scale;
    
    // 计算可视区域在缩略图中的位置和大小
    const scrollLeft = this.containerEl.scrollLeft;
    const scrollTop = this.containerEl.scrollTop;
    const viewWidth = containerRect.width;
    const viewHeight = containerRect.height;
    
    // 计算视口在缩略图中的位置，考虑思维导图的缩放
    const viewX = scrollLeft * scale + offsetX;
    const viewY = scrollTop * scale + offsetY;
    
    // 缩放对视口大小的影响
    const viewW = (viewWidth / mindmapScale) * scale;
    const viewH = (viewHeight / mindmapScale) * scale;
    
    // 使用transform代替直接改变left/top，提高性能
    this.viewportIndicatorEl.style.transform = `translate(${viewX}px, ${viewY}px)`;
    this.viewportIndicatorEl.style.width = `${viewW}px`;
    this.viewportIndicatorEl.style.height = `${viewH}px`;
  }
  
  /**
   * 计算节点边界
   */
  calculateNodesBounds(nodes: any[]) {
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    
    nodes.forEach(node => {
      const box = node.getBox();
      minX = Math.min(minX, box.x);
      minY = Math.min(minY, box.y);
      maxX = Math.max(maxX, box.x + box.width);
      maxY = Math.max(maxY, box.y + box.height);
    });
    
    // 如果没有节点或计算出的边界无效，使用默认值
    if (minX === Infinity || minY === Infinity || maxX === -Infinity || maxY === -Infinity) {
      return { minX: 0, minY: 0, maxX: 1000, maxY: 1000 };
    }
    
    return { minX, minY, maxX, maxY };
  }
  
  /**
   * 获取所有可见节点
   */
  getAllVisibleNodes() {
    const nodes: any[] = [];
    
    // 遍历所有节点
    this.mindmap.traverseDF((node: any) => {
      if (node.isShow()) {
        nodes.push(node);
      }
    });
    
    return nodes;
  }
  
  /**
   * 处理鼠标按下事件
   */
  handleMouseDown(e: MouseEvent) {
    if (e.button !== 0) return; // 只处理左键点击
    
    // 检查是否点击在视口指示器上
    const rect = this.viewportIndicatorEl.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (
      x >= rect.left && x <= rect.right &&
      y >= rect.top && y <= rect.bottom
    ) {
      this.dragging = true;
      this.lastX = x;
      this.lastY = y;
      
      // 增加视觉反馈
      this.viewportIndicatorEl.style.cursor = 'grabbing';
      this.viewportIndicatorEl.style.boxShadow = '0 0 0 1px rgba(0, 0, 0, 0.15), 0 0 0 4px rgba(var(--interactive-accent-rgb), 0.4)';
      
      e.preventDefault();
    }
  }
  
  /**
   * 处理鼠标移动事件
   */
  handleMouseMove(e: MouseEvent) {
    if (!this.dragging) return;
    
    const dx = e.clientX - this.lastX;
    const dy = e.clientY - this.lastY;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    
    // 转换鼠标移动到思维导图滚动，考虑当前缩放
    const scale = 1 / this.scale;
    this.containerEl.scrollLeft += dx * scale;
    this.containerEl.scrollTop += dy * scale;
    
    // 实时更新视口位置，实现平滑的交互体验
    this.updateViewportIndicator();
  }
  
  /**
   * 处理鼠标抬起事件
   */
  handleMouseUp(e: MouseEvent) {
    if (this.dragging) {
      // 重置视觉状态
      this.viewportIndicatorEl.style.cursor = 'move';
      this.viewportIndicatorEl.style.boxShadow = '';
    }
    this.dragging = false;
  }
  
  /**
   * 处理点击事件
   */
  handleClick(e: MouseEvent) {
    // 忽略已经处理过的拖拽操作
    if (this.dragging) return;
    
    // 计算点击位置在思维导图中的对应位置
    const rect = this.miniMapEl.getBoundingClientRect();
    const bounds = this.calculateNodesBounds(this.getAllVisibleNodes());
    const contentWidth = bounds.maxX - bounds.minX + 400;
    const contentHeight = bounds.maxY - bounds.minY + 400;
    
    // 计算缩放比例和偏移量
    const width = this.miniMapEl.clientWidth;
    const height = this.miniMapEl.clientHeight;
    const scaleX = width / contentWidth;
    const scaleY = height / contentHeight;
    const scale = Math.min(scaleX, scaleY);
    
    const offsetX = (width / 2) - ((bounds.maxX + bounds.minX) / 2) * scale;
    const offsetY = (height / 2) - ((bounds.maxY + bounds.minY) / 2) * scale;
    
    // 将点击位置转换回思维导图坐标
    const x = (e.clientX - rect.left - offsetX) / scale;
    const y = (e.clientY - rect.top - offsetY) / scale;
    
    // 找出点击位置最近的节点
    const node = this.findClosestNode(x, y);
    if (node) {
      // 添加点击反馈特效
      const clickEffect = document.createElement('div');
      clickEffect.className = 'mm-map-click-effect';
      clickEffect.style.left = (e.clientX - rect.left) + 'px';
      clickEffect.style.top = (e.clientY - rect.top) + 'px';
      this.miniMapEl.appendChild(clickEffect);
      
      // 动画结束后移除
      setTimeout(() => {
        clickEffect.remove();
      }, 500);
      
      // 定位到该节点
      this.mindmap.centerOnNode(node, true);
    }
  }
  
  /**
   * 找到最接近指定坐标的节点
   * @param x X坐标
   * @param y Y坐标
   * @returns 找到的节点
   */
  findClosestNode(x: number, y: number): any {
    const nodes = this.getAllVisibleNodes();
    let closestNode = null;
    let minDistance = Infinity;
    
    nodes.forEach(node => {
      const box = node.getBox();
      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;
      
      const dx = centerX - x;
      const dy = centerY - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < minDistance) {
        minDistance = distance;
        closestNode = node;
      }
    });
    
    return closestNode;
  }
  
  /**
   * 销毁组件
   */
  destroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    
    // 移除事件监听器
    window.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    window.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    
    // 移除滚动和缩放监听器
    if (this.scrollHandler && this.containerEl) {
      this.containerEl.removeEventListener('scroll', this.scrollHandler);
    }
    
    if (this.wheelHandler && this.containerEl) {
      this.containerEl.removeEventListener('wheel', this.wheelHandler);
    }
    
    // 移除节点展开/折叠监听器
    if (this.mindmap && this.mindmap.off) {
      if (this.nodeExpandHandler) {
        this.mindmap.off('expand', this.nodeExpandHandler);
      }
      if (this.nodeCollapseHandler) {
        this.mindmap.off('collapse', this.nodeCollapseHandler);
      }
    }
    
    if (this.overviewEl && this.overviewEl.parentNode) {
      this.overviewEl.parentNode.removeChild(this.overviewEl);
    }
    
    const toggleButton = document.querySelector('.mm-map-overview-toggle');
    if (toggleButton && toggleButton.parentNode) {
      toggleButton.parentNode.removeChild(toggleButton);
    }
  }
}

/**
 * 创建地图概览切换按钮
 * @param containerEl 容器元素
 * @param mapOverview 地图概览实例
 */
export function createMapToggleButton(containerEl: HTMLElement, mapOverview: MapOverview) {
  // 检查是否已经存在按钮，避免重复创建
  let existingButton = document.querySelector('.mm-map-overview-toggle');
  if (existingButton) {
    existingButton.remove();
  }
  
  const buttonEl = document.createElement('div');
  buttonEl.classList.add('mm-map-overview-toggle');
  if (mapOverview.isVisible) {
    buttonEl.classList.add('active');
  }
  
  const tooltipText = t('Toggle Map Overview' as any);
  buttonEl.setAttribute('title', tooltipText);
  
  // 使用地图图标
  buttonEl// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Safe SVG content
        .innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
  
  buttonEl.style.pointerEvents = 'auto';
  
  buttonEl.addEventListener('click', () => {
    mapOverview.toggle();
  }, { capture: true });
  
  // 添加到文档中，固定位置
  document.body.appendChild(buttonEl);
  
  // 位置在大纲视图按钮的左侧
  const updateButtonPosition = () => {
    buttonEl.style.position = 'fixed';
    buttonEl.style.bottom = '20px'; // 与大纲视图按钮在同一高度
    buttonEl.style.right = '70px';  // 位于大纲视图按钮左侧
    buttonEl.style.zIndex = '9999';
  };
  
  updateButtonPosition();
  
  window.addEventListener('scroll', updateButtonPosition, { passive: true });
  window.addEventListener('resize', updateButtonPosition, { passive: true });
  
  return buttonEl;
} 