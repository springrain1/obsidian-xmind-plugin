import { App, Notice, Menu, MenuItem } from 'obsidian';
import { AIService } from '../AIService';
import { MindmapNodeContext, AIProcessingResult, StreamingOptions } from '../types/AITypes';

export class MindmapAIIntegration {
    private app: App;
    private aiService: AIService;
    private plugin: any;

    constructor(app: App, aiService: AIService, plugin?: any) {
        this.app = app;
        this.aiService = aiService;
        this.plugin = plugin;
    }

    // 为思维导图节点添加 AI 扩展功能
    addNodeAIExpansion(node: any, mindmapView: any): void {
        // 添加右键菜单选项
        if (node.el) {
            node.el.addEventListener('contextmenu', (event: MouseEvent) => {
                event.preventDefault();
                event.stopPropagation();
                this.showNodeAIMenu(node, mindmapView, event);
            });

            // 添加双击扩展功能
            node.el.addEventListener('dblclick', (event: MouseEvent) => {
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    event.stopPropagation();
                    this.quickExpandNode(node, mindmapView);
                }
            });

            // 添加悬浮窗功能
            this.addFloatingAIButton(node, mindmapView);
        }
    }

    // 添加悬浮AI按钮
    private addFloatingAIButton(node: any, mindmapView: any): void {
        if (!node.el) return;

        let floatingButton: HTMLElement | null = null;
        let hideTimeout: NodeJS.Timeout | null = null;

        // 鼠标进入节点时显示悬浮按钮
        node.el.addEventListener('mouseenter', () => {
            if (hideTimeout) {
                clearTimeout(hideTimeout);
                hideTimeout = null;
            }

            if (!floatingButton) {
                floatingButton = this.createFloatingButton(node, mindmapView);
                node.el.appendChild(floatingButton);
            }floatingButton.setCssProps({ 'display': 'block' });
        });

        // 鼠标离开节点时延迟隐藏悬浮按钮
        node.el.addEventListener('mouseleave', () => {
            if (floatingButton) {
                hideTimeout = setTimeout(() => {
                    if (floatingButton) {floatingButton.setCssProps({ 'display': 'none' });
                    }
                }, 500); // 500ms延迟
            }
        });
    }

    // 创建悬浮AI按钮
    private createFloatingButton(node: any, mindmapView: any): HTMLElement {
        const button = document.createElement('div');
        button.className = 'mindmap-ai-floating-button';
        button.textContent = "🧠";
        button.title = 'mindmap AI';

        // 设置样式
        Object.assign(button.style, {
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            width: '20px',
            height: '20px',
            backgroundColor: '#4f46e5',
            color: 'white',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '12px',
            zIndex: '1000',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            transition: 'all 0.2s ease'
        });

        // 悬停效果
        button.addEventListener('mouseenter', () => {button.setCssProps({ 'transform': 'scale(1.1)' });button.setCssProps({ 'background-color': '#3730a3' });
        });

        button.addEventListener('mouseleave', () => {button.setCssProps({ 'transform': 'scale(1)' });button.setCssProps({ 'background-color': '#4f46e5' });
        });

        // 点击事件
        button.addEventListener('click', (event: MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();
            this.showAIExpansionSubmenu(node, mindmapView);
        });

        return button;
    }

    // 显示节点 AI 菜单
    private showNodeAIMenu(node: any, mindmapView: any, event: MouseEvent): void {
        const menu = new Menu();

        // 添加 AI 扩展选项
        menu.addItem((item: MenuItem) => {
            item
                .setTitle('🧠 AI 扩展节点')
                .setIcon('brain')
                .onClick(() => {
                    this.showAIExpansionSubmenu(node, mindmapView);
                });
        });

        // 添加 AI 分析选项
        menu.addItem((item: MenuItem) => {
            item
                .setTitle('🔍 AI 深度分析')
                .setIcon('search')
                .onClick(() => {
                    this.analyzeNodeWithAI(node, mindmapView);
                });
        });

        // 添加 AI 优化选项
        menu.addItem((item: MenuItem) => {
            item
                .setTitle('✨ AI 优化内容')
                .setIcon('wand')
                .onClick(() => {
                    this.optimizeNodeWithAI(node, mindmapView);
                });
        });

        menu.showAtMouseEvent(event);
    }

    // 显示 AI 扩展子菜单
    private showAIExpansionSubmenu(node: any, mindmapView: any): void {
        const menu = new Menu();
        const prompts = this.getExpansionPrompts();

        Object.entries(prompts).forEach(([name, template]) => {
            menu.addItem((item: MenuItem) => {
                item
                    .setTitle(name)
                    .onClick(async () => {
                        await this.expandNodeWithAI(node, mindmapView, template);
                    });
            });
        });

        // 添加自定义扩展选项
        menu.addSeparator();
        menu.addItem((item: MenuItem) => {
            item
                .setTitle('自定义扩展...')
                .setIcon('edit')
                .onClick(() => {
                    this.showCustomExpansionDialog(node, mindmapView);
                });
        });

        menu.showAtMouseEvent(window.event as MouseEvent);
    }

    // 获取扩展提示词
    private getExpansionPrompts(): Record<string, string> {
        // 默认提示词
        const defaultPrompts = {
            '📝 详细展开': '基于主题"{{highlight}}"，请提供3-5个详细的子主题或要点，每个要点用简洁的短语表达。',
            '🎯 实际应用': '针对"{{highlight}}"这个主题，请提供3-4个具体的实际应用场景或案例。',
            '🔗 相关概念': '与"{{highlight}}"相关的重要概念或术语有哪些？请列出3-5个并简要说明。',
            '📊 分类整理': '请将"{{highlight}}"这个主题按照不同维度进行分类，提供3-4个分类角度。',
            '💡 创新思路': '基于"{{highlight}}"，请提供3-4个创新的思考角度或发展方向。'
        };

        // 获取用户自定义的提示词
        const customPrompts: Record<string, string> = {};
        if (this.plugin && this.plugin.settings && this.plugin.settings.ai && this.plugin.settings.ai.prompts) {
            Object.entries(this.plugin.settings.ai.prompts).forEach(([name, template]) => {
                customPrompts[`✨ ${name}`] = template as string;
            });
        }

        // 合并默认和自定义提示词
        return { ...defaultPrompts, ...customPrompts };
    }

    // 使用 AI 扩展节点
    private async expandNodeWithAI(node: any, mindmapView: any, template: string): Promise<void> {
        try {
            const context = this.extractNodeContext(node, mindmapView);
            let processingNotice = new Notice('AI 正在扩展节点...', 0);

            // 检查是否支持流式输出
            if (this.aiService.supportsStreaming()) {
                let fullResponse = '';

                const streamingOptions: StreamingOptions = {
                    onToken: (token: string) => {
                        fullResponse += token;
                        // 更新通知显示当前进度
                        processingNotice.hide();
                        processingNotice = new Notice(`AI 正在扩展节点... (${fullResponse.length} 字符)`, 0);
                    },
                    onComplete: async (response: string) => {
                        processingNotice.hide();

                        // 解析 AI 响应并创建子节点
                        await this.createChildNodesFromAIResponse(node, mindmapView, response);
                        new Notice('节点扩展完成');
                    },
                    onError: (error: Error) => {
                        processingNotice.hide();
                        new Notice(`节点扩展失败: ${error.message}`);
                        console.error('Node expansion error:', error);
                    }
                };

                await this.aiService.streamResponse(
                    template.replace('{{highlight}}', context.content),
                    streamingOptions
                );
            } else {
                // 降级到普通方式
                const response = await this.aiService.generateResponse(
                    template,
                    context.content,
                    ''
                );

                processingNotice.hide();

                // 解析 AI 响应并创建子节点
                await this.createChildNodesFromAIResponse(node, mindmapView, response);

                new Notice('节点扩展完成');
            }
        } catch (error) {
            new Notice(`节点扩展失败: ${error.message}`);
            console.error('Node expansion error:', error);
        }
    }

    // 快速扩展节点（Ctrl+双击）
    private async quickExpandNode(node: any, mindmapView: any): Promise<void> {
        const defaultTemplate = '基于主题"{{highlight}}"，请提供3-4个相关的子主题，每个用简洁的短语表达。';
        await this.expandNodeWithAI(node, mindmapView, defaultTemplate);
    }

    // 分析节点
    private async analyzeNodeWithAI(node: any, mindmapView: any): Promise<void> {
        try {
            const context = this.extractNodeContext(node, mindmapView);
            let processingNotice = new Notice('AI 正在分析节点...', 0);

            const analysisTemplate = '请对"{{highlight}}"进行深度分析，包括其定义、重要性、应用场景和潜在影响。';

            // 检查是否支持流式输出
            if (this.aiService.supportsStreaming()) {
                let fullResponse = '';

                const streamingOptions: StreamingOptions = {
                    onToken: (token: string) => {
                        fullResponse += token;
                        // 更新通知显示当前进度
                        processingNotice.hide();
                        processingNotice = new Notice(`AI 正在分析节点... (${fullResponse.length} 字符)`, 0);
                    },
                    onComplete: async (response: string) => {
                        processingNotice.hide();

                        // 创建分析结果节点
                        await this.createAnalysisNode(node, mindmapView, response);
                        new Notice('节点分析完成');
                    },
                    onError: (error: Error) => {
                        processingNotice.hide();
                        new Notice(`节点分析失败: ${error.message}`);
                        console.error('Node analysis error:', error);
                    }
                };

                await this.aiService.streamResponse(
                    analysisTemplate.replace('{{highlight}}', context.content),
                    streamingOptions
                );
            } else {
                // 降级到普通方式
                const response = await this.aiService.generateResponse(
                    analysisTemplate,
                    context.content,
                    ''
                );

                processingNotice.hide();

                // 创建分析结果节点
                await this.createAnalysisNode(node, mindmapView, response);

                new Notice('节点分析完成');
            }
        } catch (error) {
            new Notice(`节点分析失败: ${error.message}`);
            console.error('Node analysis error:', error);
        }
    }

    // 优化节点内容
    private async optimizeNodeWithAI(node: any, mindmapView: any): Promise<void> {
        try {
            const context = this.extractNodeContext(node, mindmapView);
            let processingNotice = new Notice('AI 正在优化节点...', 0);

            const optimizationTemplate = '请优化以下内容，使其更加简洁、准确和易懂："{{highlight}}"。只返回优化后的内容。';

            // 检查是否支持流式输出
            if (this.aiService.supportsStreaming()) {
                let fullResponse = '';

                const streamingOptions: StreamingOptions = {
                    onToken: (token: string) => {
                        fullResponse += token;
                        // 更新通知显示当前进度
                        processingNotice.hide();
                        processingNotice = new Notice(`AI 正在优化节点... (${fullResponse.length} 字符)`, 0);
                    },
                    onComplete: async (response: string) => {
                        processingNotice.hide();

                        // 更新节点内容
                        await this.updateNodeContent(node, mindmapView, response.trim());
                        new Notice('节点优化完成');
                    },
                    onError: (error: Error) => {
                        processingNotice.hide();
                        new Notice(`节点优化失败: ${error.message}`);
                        console.error('Node optimization error:', error);
                    }
                };

                await this.aiService.streamResponse(
                    optimizationTemplate.replace('{{highlight}}', context.content),
                    streamingOptions
                );
            } else {
                // 降级到普通方式
                const response = await this.aiService.generateResponse(
                    optimizationTemplate,
                    context.content,
                    ''
                );

                processingNotice.hide();

                // 更新节点内容
                await this.updateNodeContent(node, mindmapView, response.trim());

                new Notice('节点优化完成');
            }
        } catch (error) {
            new Notice(`节点优化失败: ${error.message}`);
            console.error('Node optimization error:', error);
        }
    }

    // 提取节点上下文
    private extractNodeContext(node: any, mindmapView: any): MindmapNodeContext {
        const content = node.topic || node.text || '';
        const level = node.level || 0;
        
        // 获取父节点内容
        let parentContent = '';
        if (node.parent) {
            parentContent = node.parent.topic || node.parent.text || '';
        }

        // 获取兄弟节点内容
        const siblings: string[] = [];
        if (node.parent && node.parent.children) {
            node.parent.children.forEach((sibling: any) => {
                if (sibling !== node) {
                    siblings.push(sibling.topic || sibling.text || '');
                }
            });
        }

        return {
            nodeId: node.id || '',
            content: content,
            level: level,
            parentContent: parentContent,
            siblings: siblings
        };
    }

    // 从 AI 响应创建子节点
    private async createChildNodesFromAIResponse(parentNode: any, mindmapView: any, response: string): Promise<void> {
        try {
            // 解析 AI 响应，提取子主题
            const childTopics = this.parseAIResponseToTopics(response);
            
            // 为每个子主题创建节点
            childTopics.forEach((topic, index) => {
                this.createChildNode(parentNode, mindmapView, topic, index);
            });

            // 刷新思维导图视图
            this.refreshMindmapView(mindmapView);
        } catch (error) {
            console.error('Error creating child nodes:', error);
            throw error;
        }
    }

    // 解析 AI 响应为主题列表
    private parseAIResponseToTopics(response: string): string[] {
        const topics: string[] = [];
        
        // 尝试多种解析方式
        const lines = response.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            // 匹配列表项（数字、字母、符号开头）
            const listItemMatch = trimmedLine.match(/^[\d\w\-\*\+•]\s*[\.、\)]\s*(.+)$/);
            if (listItemMatch) {
                topics.push(listItemMatch[1].trim());
                continue;
            }
            
            // 匹配简单的短语（排除太长的句子）
            if (trimmedLine.length > 3 && trimmedLine.length < 50 && !trimmedLine.includes('。')) {
                topics.push(trimmedLine);
            }
        }

        // 如果没有找到合适的主题，将整个响应作为一个主题
        if (topics.length === 0) {
            const sentences = response.split(/[。！？\n]/).filter(s => s.trim().length > 0);
            topics.push(...sentences.slice(0, 5).map(s => s.trim()));
        }

        return topics.slice(0, 6); // 限制最多6个子主题
    }

    // 创建子节点
    private createChildNode(parentNode: any, mindmapView: any, topic: string, index: number): void {
        try {
            // 这里需要根据具体的思维导图实现来创建节点
            // 以下是一个通用的实现示例
            const childNode = {
                id: `ai_${Date.now()}_${index}`,
                topic: topic,
                parent: parentNode,
                level: (parentNode.level || 0) + 1,
                children: []
            };

            // 添加到父节点的子节点列表
            if (!parentNode.children) {
                parentNode.children = [];
            }
            parentNode.children.push(childNode);

            // 如果有具体的思维导图 API，在这里调用
            if (mindmapView && mindmapView.mindmap && mindmapView.mindmap.addNode) {
                mindmapView.mindmap.addNode(parentNode.id, topic);
            }
        } catch (error) {
            console.error('Error creating child node:', error);
        }
    }

    // 创建分析结果节点
    private async createAnalysisNode(parentNode: any, mindmapView: any, analysis: string): Promise<void> {
        const analysisTitle = '📊 AI 分析';
        this.createChildNode(parentNode, mindmapView, analysisTitle, 0);
        
        // 可以进一步将分析内容分解为多个子节点
        const analysisPoints = this.parseAIResponseToTopics(analysis);
        if (analysisPoints.length > 1) {
            const analysisNode = parentNode.children[parentNode.children.length - 1];
            analysisPoints.forEach((point, index) => {
                this.createChildNode(analysisNode, mindmapView, point, index);
            });
        }

        this.refreshMindmapView(mindmapView);
    }

    // 更新节点内容
    private async updateNodeContent(node: any, mindmapView: any, newContent: string): Promise<void> {
        try {
            node.topic = newContent;
            node.text = newContent;

            // 如果有具体的思维导图 API，在这里调用更新方法
            if (mindmapView && mindmapView.mindmap && mindmapView.mindmap.updateNode) {
                mindmapView.mindmap.updateNode(node.id, newContent);
            }

            this.refreshMindmapView(mindmapView);
        } catch (error) {
            console.error('Error updating node content:', error);
        }
    }

    // 刷新思维导图视图
    private refreshMindmapView(mindmapView: any): void {
        try {
            if (mindmapView && mindmapView.mindmap) {
                if (mindmapView.mindmap.refresh) {
                    mindmapView.mindmap.refresh();
                }
                if (mindmapView.mindmap.render) {
                    mindmapView.mindmap.render();
                }
            }
        } catch (error) {
            console.error('Error refreshing mindmap view:', error);
        }
    }

    // 显示自定义扩展对话框
    private showCustomExpansionDialog(node: any, mindmapView: any): void {
        const customPrompt = prompt('请输入自定义扩展提示词 (使用 {{highlight}} 作为节点内容占位符):');
        if (customPrompt) {
            this.expandNodeWithAI(node, mindmapView, customPrompt);
        }
    }

    // 批量处理多个节点
    async batchProcessNodes(nodes: any[], mindmapView: any, template: string): Promise<void> {
        const processingNotice = new Notice(`正在批量处理 ${nodes.length} 个节点...`, 0);
        
        try {
            for (const node of nodes) {
                await this.expandNodeWithAI(node, mindmapView, template);
                // 添加延迟避免 API 限制
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            processingNotice.hide();
            new Notice('批量处理完成');
        } catch (error) {
            processingNotice.hide();
            new Notice(`批量处理失败: ${error.message}`);
        }
    }

    // 更新 AI 服务
    updateAIService(aiService: AIService): void {
        this.aiService = aiService;
    }

    // 检查是否可以使用 AI 功能
    isAIAvailable(): boolean {
        return this.aiService !== null;
    }

    // 清理资源
    cleanup(): void {
        // 清理任何需要清理的资源
    }

    // 更新 AI 服务
    updateAIService(aiService: AIService): void {
        this.aiService = aiService;
    }
}