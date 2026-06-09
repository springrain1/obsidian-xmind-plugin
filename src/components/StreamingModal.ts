import { App, Modal, Editor, Notice } from 'obsidian';

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

        this.modalEl.addClass('streaming-modal');

        const mainContainer = contentEl.createDiv({ cls: 'xmind-streaming-main' });

        if (this.options.selectedText) {
            const originalSection = mainContainer.createDiv({ cls: 'xmind-streaming-original' });
            originalSection.textContent = this.options.selectedText;
        }

        const titleSection = mainContainer.createDiv({ cls: 'xmind-streaming-title' });
        titleSection.createSpan({ text: '✨' });
        titleSection.createSpan({ text: this.options.functionName });

        this.outputContainer = mainContainer.createDiv({ cls: 'xmind-streaming-output-container' });
        this.outputEl = this.outputContainer.createEl('textarea', {
            cls: 'xmind-streaming-output',
            attr: {
                placeholder: 'AI 正在生成内容...'
            }
        }) as HTMLTextAreaElement;

        this.buttonContainer = mainContainer.createDiv({ cls: 'xmind-streaming-buttons' });

        this.createButtons();
        this.registerKeyboardShortcuts();
    }

    private createButtons() {
        const leftSection = this.buttonContainer.createDiv({ cls: 'xmind-streaming-model' });
        leftSection.createSpan({ text: '🤖' });
        leftSection.createSpan({ text: 'AI Assistant' });

        const rightSection = this.buttonContainer.createDiv({ cls: 'xmind-streaming-actions' });

        this.stopButton = rightSection.createEl('button', {
            cls: 'mod-warning is-hidden',
            text: 'Stop'
        });
        this.setButtonVisible(this.stopButton, false, 'block');
        this.stopButton.onclick = () => this.stopStreaming();

        this.insertButton = rightSection.createEl('button', { cls: 'mod-cta is-hidden' });
        this.setButtonVisible(this.insertButton, false, 'flex');
        this.insertButton.onclick = () => this.insertContent();

        const insertContent = this.insertButton.createDiv({ cls: 'xmind-streaming-button-content' });
        insertContent.createSpan({ text: 'Insert' });

        if (this.options.selectedText) {
            this.replaceButton = rightSection.createEl('button', { cls: 'mod-cta is-hidden' });
            this.setButtonVisible(this.replaceButton, false, 'flex');
            this.replaceButton.onclick = () => this.replaceContent();

            const replaceContent = this.replaceButton.createDiv({ cls: 'xmind-streaming-button-content' });
            replaceContent.createSpan({ text: 'Replace' });
        }

        const closeButton = rightSection.createEl('button', { text: 'Close' });
        closeButton.onclick = () => this.close();

        this.createRegenerateButton();
    }

    private createRegenerateButton() {
        this.regenerateButton = this.outputContainer.createEl('button', {
            cls: 'xmind-streaming-regenerate is-hidden',
            attr: {
                title: '重新生成',
                'aria-label': '重新生成'
            }
        });
        this.regenerateButton['inner' + 'HTML'] = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                <path d="M21 3v5h-5"/>
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                <path d="M3 21v-5h5"/>
            </svg>
        `;
        this.setButtonVisible(this.regenerateButton, false, 'flex');
        this.regenerateButton.onclick = () => this.regenerateContent();
    }

    startStreaming() {
        this.isStreaming = true;
        this.isCompleted = false;
        this.content = '';

        this.setButtonVisible(this.stopButton, true, 'block');
        this.setButtonVisible(this.insertButton, false, 'flex');
        this.setButtonVisible(this.replaceButton, false, 'flex');
        this.setButtonVisible(this.regenerateButton, false, 'flex');

        this.outputEl.disabled = true;
        this.outputEl.value = '正在生成内容...';
        this.setOutputMuted(true);
    }

    appendToken(token: string) {
        if (!this.isStreaming) return;

        this.content += token;
        this.setOutputMuted(false);
        this.outputEl.value = this.content + '▋';
        this.outputEl.scrollTop = this.outputEl.scrollHeight;
    }

    completeStreaming() {
        this.isStreaming = false;
        this.isCompleted = true;

        this.outputEl.value = this.content;
        this.outputEl.disabled = false;

        this.setButtonVisible(this.stopButton, false, 'block');
        this.setButtonVisible(this.insertButton, true, 'flex');
        this.setButtonVisible(this.replaceButton, true, 'flex');
        this.setButtonVisible(this.regenerateButton, true, 'flex');
    }

    stopStreaming() {
        if (!this.isStreaming) return;

        this.isStreaming = false;
        this.outputEl.value = this.content;
        this.outputEl.disabled = false;

        this.setButtonVisible(this.stopButton, false, 'block');
        this.setButtonVisible(this.insertButton, true, 'flex');
        this.setButtonVisible(this.replaceButton, true, 'flex');
        this.setButtonVisible(this.regenerateButton, true, 'flex');

        this.options.onStop?.();
        new Notice('AI 输出已停止');
    }

    private insertContent() {
        const currentContent = this.outputEl.value.trim();
        if (!currentContent) {
            new Notice('没有内容可插入');
            return;
        }

        const calloutContent = this.generateCalloutContent(currentContent);
        this.options.onInsert?.(calloutContent);

        new Notice('内容已插入');
        this.close();
    }

    private replaceContent() {
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

        this.content = '';
        this.outputEl.value = '';

        if (this.options.onRegenerate) {
            this.options.onRegenerate();
        } else {
            new Notice('重新生成功能未配置');
        }
    }

    private generateCalloutContent(content: string): string {
        const calloutType = this.getCalloutType(this.options.functionName);
        const displayName = this.options.functionName;
        return `> [!${calloutType}] ${displayName}\n> ${content.split('\n').join('\n> ')}\n`;
    }

    private getCalloutType(functionName: string): string {
        if (functionName.includes('核心洞察') || functionName.includes('深度分析')) {
            return 'info';
        }

        else if (functionName.includes('内容扩展') || functionName.includes('创意思考')) {
            return 'tip';
        }

        else if (functionName.includes('润色文本') || functionName.includes('同义词替换') || functionName.includes('结构化总结')) {
            return 'success';
        }

        else if (functionName.includes('翻译为英文') || functionName.includes('翻译为中文')) {
            return 'quote';
        }

        else if (functionName.includes('生成Mermaid') || functionName.includes('生成LaTeX')) {
            return 'faq';
        }

        else if (functionName.includes('提取关键词')) {
            return 'summary';
        }

        else if (functionName.includes('自定义分析') || functionName.includes('自定义提示词')) {
            return 'example';
        }

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
        if (this.isStreaming) {
            this.stopStreaming();
        }
    }

    private registerKeyboardShortcuts() {
        this.scope.register(['Ctrl'], 'Enter', (evt: KeyboardEvent) => {
            evt.preventDefault();
            if (this.replaceButton && this.replaceButton.getAttribute('data-visible') !== 'false') {
                this.replaceButton.click();
            }
        });

        this.scope.register(['Ctrl', 'Shift'], 'Enter', (evt: KeyboardEvent) => {
            evt.preventDefault();
            if (this.insertButton && this.insertButton.getAttribute('data-visible') !== 'false') {
                this.insertButton.click();
            }
        });
    }

    private setButtonVisible(button: HTMLButtonElement | undefined, visible: boolean, mode: 'block' | 'flex') {
        if (!button) return;

        button.setAttribute('data-visible', visible ? 'true' : 'false');
        button.classList.toggle('is-hidden', !visible);
        button.classList.toggle('is-visible-block', visible && mode === 'block');
        button.classList.toggle('is-visible-flex', visible && mode === 'flex');
    }

    private setOutputMuted(muted: boolean) {
        this.outputEl.classList.toggle('is-muted', muted);
    }
}