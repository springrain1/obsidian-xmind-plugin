import { App, Modal, ButtonComponent, Editor, Notice, Platform } from 'obsidian';

export interface StreamingModalOptions {
    title: string;
    functionName: string;
    selectedText: string;
    editor: Editor;
    onStop?: () => void;
    onInsert?: (content: string) => void;
    onReplace?: (content: string) => void;
    onRegenerate?: () => void;
}

export class StreamingModal extends Modal {
    private options: StreamingModalOptions;
    private outputEl: HTMLTextAreaElement;
    private outputContainer: HTMLElement;
    private buttonContainer: HTMLElement;
    private stopButton?: HTMLButtonElement;
    private insertButton?: HTMLButtonElement;
    private replaceButton?: HTMLButtonElement;
    private regenerateButton?: HTMLButtonElement;

    private content: string = '';
    private isStreaming: boolean = false;
    private isCompleted: boolean = false;

    constructor(app: App, options: StreamingModalOptions) {
        super(app);
        this.options = options;
        this.setTitle(this.options.title);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        // 设置模态框样式
        this.modalEl.addClass('streaming-modal');
        this.modalEl.style.width = '80%';
        this.modalEl.style.maxWidth = '800px';
        this.modalEl.style.height = '70%';
        this.modalEl.style.maxHeight = '600px';

        // 创建主容器
        const mainContainer = contentEl.createDiv();
        mainContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 16px;
            height: 100%;
        `;

        // 原始内容显示（如果有选中文本）
        if (this.options.selectedText) {
            const originalSection = mainContainer.createDiv();
            originalSection.style.cssText = `
                max-height: 240px;
                overflow-y: auto;
                white-space: pre-wrap;
                color: var(--text-muted);
                background: var(--background-secondary);
                padding: 12px;
                border-radius: 6px;
                border: 1px solid var(--background-modifier-border);
            `;
            originalSection.textContent = this.options.selectedText;
        }

        // 功能标题
        const titleSection = mainContainer.createDiv();
        titleSection.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: bold;
            color: var(--text-normal);
        `;
        titleSection.createSpan({ text: '✨' });
        titleSection.createSpan({ text: this.options.functionName });

        // AI 输出区域
        this.outputContainer = mainContainer.createDiv();
        this.outputContainer.style.cssText = `
            position: relative;
            flex: 1;
        `;

        this.outputEl = this.outputContainer.createEl('textarea') as HTMLTextAreaElement;
        this.outputEl.style.cssText = `
            width: 100%;
            height: 240px;
            resize: none;
            border: 1px solid var(--background-modifier-border);
            border-radius: 6px;
            padding: 12px;
            font-family: var(--font-text);
            font-size: var(--font-text-size);
            line-height: 1.6;
            background: var(--background-primary);
            color: var(--text-normal);
        `;
        this.outputEl.placeholder = 'AI 正在生成内容...';

        // 按钮容器
        this.buttonContainer = mainContainer.createDiv();
        this.buttonContainer.style.cssText = `
            display: flex;
            justify-content: space-between;
            gap: 8px;
        `;

        this.createButtons();

        // 注册快捷键监听
        this.registerKeyboardShortcuts();
    }

    private createButtons() {
        // 左侧：模型信息
        const leftSection = this.buttonContainer.createDiv();
        leftSection.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 12px;
            font-weight: bold;
            color: var(--text-faint);
        `;
        leftSection.createSpan({ text: '🤖' });
        leftSection.createSpan({ text: 'AI Assistant' });

        // 右侧：操作按钮
        const rightSection = this.buttonContainer.createDiv();
        rightSection.style.cssText = `
            display: flex;
            gap: 8px;
        `;

        // Stop 按钮（仅在流式输出时显示）
        this.stopButton = rightSection.createEl('button');
        this.stopButton.textContent = 'Stop';
        this.stopButton.className = 'mod-warning';
        this.stopButton.style.display = 'none';
        this.stopButton.onclick = () => this.stopStreaming();

        // Insert 按钮（完成后显示）
        this.insertButton = rightSection.createEl('button');
        this.insertButton.className = 'mod-cta';
        this.insertButton.style.cssText = `
            display: none;
            align-items: center;
            gap: 4px;
        `;
        this.insertButton.onclick = () => this.insertContent();

        const insertContent = this.insertButton.createDiv();
        insertContent.style.cssText = `
            display: flex;
            align-items: center;
            gap: 4px;
        `;
        insertContent.createSpan({ text: 'Insert' });



        // Replace 按钮（完成后显示，仅当有选中文本时）
        if (this.options.selectedText) {
            this.replaceButton = rightSection.createEl('button');
            this.replaceButton.className = 'mod-cta';
            this.replaceButton.style.cssText = `
                display: none;
                align-items: center;
                gap: 4px;
            `;
            this.replaceButton.onclick = () => this.replaceContent();

            const replaceContent = this.replaceButton.createDiv();
            replaceContent.style.cssText = `
                display: flex;
                align-items: center;
                gap: 4px;
            `;
            replaceContent.createSpan({ text: 'Replace' });


        }

        // Close 按钮
        const closeButton = rightSection.createEl('button');
        closeButton.textContent = 'Close';
        closeButton.onclick = () => this.close();

        // 创建重新生成按钮（在输出文本框右下角）
        this.createRegenerateButton();
    }

    private createRegenerateButton() {
        // 创建重新生成按钮
        this.regenerateButton = this.outputContainer.createEl('button');
        this.regenerateButton// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Safe SVG content
        .innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 20px; height: 20px; min-width: 20px; min-height: 20px; flex-shrink: 0;">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                <path d="M21 3v5h-5"/>
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                <path d="M3 21v-5h5"/>
            </svg>
        `;
        this.regenerateButton.title = '重新生成';
        this.regenerateButton.style.cssText = `
            position: absolute;
            bottom: 8px;
            right: 8px;
            width: 32px;
            height: 32px;
            border: 1px solid var(--background-modifier-border);
            border-radius: 6px;
            background: var(--background-primary);
            color: var(--text-muted);
            cursor: pointer;
            display: none;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            z-index: 10;
        `;

        // 悬停效果
        this.regenerateButton.addEventListener('mouseenter', () => {
            this.regenerateButton!.style.background = 'var(--background-modifier-hover)';
            this.regenerateButton!.style.color = 'var(--text-normal)';
            this.regenerateButton!.style.transform = 'scale(1.05)';
        });

        this.regenerateButton.addEventListener('mouseleave', () => {
            this.regenerateButton!.style.background = 'var(--background-primary)';
            this.regenerateButton!.style.color = 'var(--text-muted)';
            this.regenerateButton!.style.transform = 'scale(1)';
        });

        // 点击事件
        this.regenerateButton.onclick = () => this.regenerateContent();
    }

    startStreaming() {
        this.isStreaming = true;
        this.isCompleted = false;
        this.content = '';

        // 显示 Stop 按钮
        if (this.stopButton) {
            this.stopButton.style.display = 'inline-block';
        }

        // 隐藏 Insert/Replace 按钮
        if (this.insertButton) {
            this.insertButton.style.display = 'none';
        }
        if (this.replaceButton) {
            this.replaceButton.style.display = 'none';
        }

        // 隐藏重新生成按钮
        if (this.regenerateButton) {
            this.regenerateButton.style.display = 'none';
        }

        // 设置输出区域为只读状态
        this.outputEl.disabled = true;
        this.outputEl.value = '正在生成内容...';
        this.outputEl.style.color = 'var(--text-muted)';
    }

    appendToken(token: string) {
        if (!this.isStreaming) return;

        this.content += token;

        // 重置样式
        this.outputEl.style.color = 'var(--text-normal)';

        // 更新显示内容，添加打字机效果
        this.outputEl.value = this.content + '▋'; // 添加光标效果

        // 自动滚动到底部
        this.outputEl.scrollTop = this.outputEl.scrollHeight;
    }

    completeStreaming() {
        this.isStreaming = false;
        this.isCompleted = true;

        // 移除光标效果，启用编辑
        this.outputEl.value = this.content;
        this.outputEl.disabled = false;

        // 隐藏 Stop 按钮
        if (this.stopButton) {
            this.stopButton.style.display = 'none';
        }

        // 显示 Insert/Replace 按钮
        if (this.insertButton) {
            this.insertButton.style.display = 'flex';
        }
        if (this.replaceButton) {
            this.replaceButton.style.display = 'flex';
        }

        // 显示重新生成按钮
        if (this.regenerateButton) {
            this.regenerateButton.style.display = 'flex';
        }
    }

    stopStreaming() {
        if (!this.isStreaming) return;

        this.isStreaming = false;

        // 移除光标效果，启用编辑
        this.outputEl.value = this.content;
        this.outputEl.disabled = false;

        // 隐藏 Stop 按钮
        if (this.stopButton) {
            this.stopButton.style.display = 'none';
        }

        // 显示 Insert/Replace 按钮
        if (this.insertButton) {
            this.insertButton.style.display = 'flex';
        }
        if (this.replaceButton) {
            this.replaceButton.style.display = 'flex';
        }

        // 显示重新生成按钮
        if (this.regenerateButton) {
            this.regenerateButton.style.display = 'flex';
        }

        this.options.onStop?.();
        new Notice('AI 输出已停止');
    }

    private insertContent() {
        // 获取当前编辑器中的内容（用户可能已经修改）
        const currentContent = this.outputEl.value.trim();
        if (!currentContent) {
            new Notice('没有内容可插入');
            return;
        }

        // 生成 Callout 格式
        const calloutContent = this.generateCalloutContent(currentContent);
        this.options.onInsert?.(calloutContent);

        new Notice('内容已插入');
        this.close();
    }

    private replaceContent() {
        // 获取当前编辑器中的内容（用户可能已经修改）
        const currentContent = this.outputEl.value.trim();
        if (!currentContent) {
            new Notice('没有内容可替换');
            return;
        }

        this.options.onReplace?.(currentContent);
        new Notice('内容已替换');
        this.close();
    }

    private regenerateContent() {
        if (this.isStreaming) {
            new Notice('正在生成中，请稍候...');
            return;
        }

        // 清空当前内容
        this.content = '';
        this.outputEl.value = '';

        // 调用重新生成回调
        if (this.options.onRegenerate) {
            this.options.onRegenerate();
        } else {
            new Notice('重新生成功能未配置');
        }
    }

    private generateCalloutContent(content: string): string {
        const calloutType = this.getCalloutType(this.options.functionName);
        // 使用完整的功能名称，与菜单名称完全一致
        const displayName = this.options.functionName;
        return `> [!${calloutType}] ${displayName}\n> ${content.split('\n').join('\n> ')}\n`;
    }

    private getCalloutType(functionName: string): string {
        // 根据功能名称选择合适的 Callout 类型

        // 分析类功能 (核心洞察、深度分析)
        if (functionName.includes('核心洞察') || functionName.includes('深度分析')) {
            return 'info';
        }

        // 生成类功能 (内容扩展、创意思考)
        else if (functionName.includes('内容扩展') || functionName.includes('创意思考')) {
            return 'tip';
        }

        // 优化类功能 (润色文本、同义词替换、结构化总结)
        else if (functionName.includes('润色文本') || functionName.includes('同义词替换') || functionName.includes('结构化总结')) {
            return 'success';
        }

        // 翻译类功能 (翻译为英文、翻译为中文)
        else if (functionName.includes('翻译为英文') || functionName.includes('翻译为中文')) {
            return 'quote';
        }

        // 技术生成功能 (生成Mermaid、生成LaTeX)
        else if (functionName.includes('生成Mermaid') || functionName.includes('生成LaTeX')) {
            return 'faq';
        }

        // 关键词提取
        else if (functionName.includes('提取关键词')) {
            return 'summary';
        }

        // 自定义功能 (自定义分析、自定义提示词)
        else if (functionName.includes('自定义分析') || functionName.includes('自定义提示词')) {
            return 'example';
        }

        // 默认类型
        else {
            return 'note';
        }
    }

    getContent(): string {
        return this.outputEl ? this.outputEl.value : this.content;
    }

    isStreamingActive(): boolean {
        return this.isStreaming;
    }

    onClose() {
        // 清理资源
        if (this.isStreaming) {
            this.stopStreaming();
        }
    }

    private registerKeyboardShortcuts() {
        // 监听键盘事件
        this.scope.register(['Ctrl'], 'Enter', (evt: KeyboardEvent) => {
            evt.preventDefault();
            if (this.replaceButton && this.replaceButton.style.display !== 'none') {
                this.replaceButton.click();
            }
        });

        this.scope.register(['Ctrl', 'Shift'], 'Enter', (evt: KeyboardEvent) => {
            evt.preventDefault();
            if (this.insertButton && this.insertButton.style.display !== 'none') {
                this.insertButton.click();
            }
        });
    }
}
