import { App, Editor, Menu, MenuItem, Notice, TFile, Modal, Setting } from 'obsidian';
import { AIService } from '../AIService';
import { ContextMenuContext, AIProcessingResult } from '../types/AITypes';
import { StreamingModal } from '../../../components/StreamingModal';
import { StreamingFileWriter } from '../StreamingFileWriter';

export class ContextMenuIntegration {
    private app: App;
    private aiService: AIService;
    private plugin: any;

    constructor(app: App, aiService: AIService, plugin?: any) {
        this.app = app;
        this.aiService = aiService;
        this.plugin = plugin;
    }

    // 注册编辑器右键菜单
    registerEditorMenu(menu: Menu, editor: Editor, view: any): void {
        const selectedText = editor.getSelection();
        const cursor = editor.getCursor();
        
        // 获取上下文信息
        const context = this.extractContext(editor, view.file, cursor.line);
        
        // 添加 mindmap AI 菜单项，使用原生子菜单
        menu.addItem((item: MenuItem) => {
            item
                .setTitle('mindmap AI')
                .setIcon('brain');

            // 创建子菜单
            const submenu = (item as any).setSubmenu();
            this.createAISubmenu(submenu, context, editor);
        });
    }

    // 创建 AI 子菜单
    private createAISubmenu(submenu: Menu, context: ContextMenuContext, editor: Editor): void {
        // 获取可用的提示词
        const prompts = this.getAvailablePrompts();

        Object.entries(prompts).forEach(([name, template]) => {
            submenu.addItem((item: MenuItem) => {
                item
                    .setTitle(name)
                    .onClick(async () => {
                        await this.processWithAI(context, template, editor, name);
                    });
            });
        });

        // 添加自定义提示词选项
        submenu.addSeparator();
        submenu.addItem((item: MenuItem) => {
            item
                .setTitle('自定义提示词...')
                .setIcon('edit')
                .onClick(() => {
                    this.showCustomPromptDialog(context, editor);
                });
        });
    }

    // 提取上下文信息
    private extractContext(editor: Editor, file: TFile, line: number): ContextMenuContext {
        const selectedText = editor.getSelection();
        const fullContent = editor.getValue();
        const cursor = editor.getCursor();
        
        let contextText = selectedText;
        
        // 如果没有选中文本，使用当前段落
        if (!selectedText) {
            const lineContent = editor.getLine(line);
            contextText = lineContent;
            
            // 尝试获取更多上下文（前后几行）
            const startLine = Math.max(0, line - 2);
            const endLine = Math.min(editor.lineCount() - 1, line + 2);
            const contextLines = [];
            
            for (let i = startLine; i <= endLine; i++) {
                contextLines.push(editor.getLine(i));
            }
            
            contextText = contextLines.join('\n').trim();
        }

        return {
            selectedText: contextText,
            fullContent: fullContent,
            filePath: file?.path || '',
            cursorPosition: editor.posToOffset(cursor)
        };
    }

    // 获取可用的提示词
    private getAvailablePrompts(): Record<string, string> {
        // 默认提示词
        const defaultPrompts = {
            '🤔 核心洞察': '{{highlight}}。请从全新的角度重新解读上述内容，并在200字内总结其核心思想。',
            '📝 内容扩展': '基于以下内容：{{highlight}}，请提供3-5个相关的扩展要点或子主题。',
            '🔍 深度分析': '请对以下内容进行深度分析：{{highlight}}。包括背景、影响和潜在应用。',
            '💡 创意思考': '基于：{{highlight}}，请提供3个创新的思考角度或应用场景。',
            '📊 结构化总结': '请将以下内容结构化总结：{{highlight}}。使用要点形式组织信息。',
            '☀️ 润色文本': '请优化以下文本，保持原意但提升表达质量。遵循以下原则：1.保持原文核心意思不变 2.改进句子结构和语法 3.提升表达清晰度和流畅度 4.优化用词，使其更准确和专业 5.保持适当的语气和风格 6.确保逻辑连贯性 7.消除冗余表达 8.优化段落结构\n\n{{highlight}}',
            '📚 同义词替换': '请为以下内容生成最多10个不同的同义表达，产生的同义词和原文的语言相同：\n\n{{highlight}}',
            '🌐 翻译为英文': '请将以下中文内容翻译为英文，遵循以下原则：1.保持原文核心意思不变 2.使用自然流畅的英语表达 3.保持专业术语的准确性 4.保持上下文一致性 5.保留原文格式和特殊符号\n\n{{highlight}}',
            '🌐 翻译为中文': '请将以下英文内容翻译为中文，遵循以下原则：1.保持原文核心意思不变 2.使用自然流畅的中文表达 3.保持专业术语的准确性 4.保持上下文一致性 5.保留原文格式和特殊符号\n\n{{highlight}}',
            '📊 生成Mermaid': '请为以下内容生成Mermaid图表代码，善于理解文本的结构和含义，整理出结构化的模型，生成的代码可以直接插入Markdown文档中使用：\n\n{{highlight}}',
            '🧮 生成LaTeX': '请为以下内容生成LaTeX代码，善于理解文本意思，从中提取和整理出公式，生成的代码可以直接插入Markdown文档中使用：\n\n{{highlight}}'
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

    // 使用 AI 处理内容
    private async processWithAI(context: ContextMenuContext, template: string, editor: Editor, functionName?: string): Promise<void> {
        try {
            // 获取全文内容
            const fullContent = editor.getValue();

            // 检查是否需要保存到文件（生成摘要、提取关键词、文档分析等）
            const shouldSaveToFile = this.shouldSaveToFile(template);

            if (shouldSaveToFile) {
                // 使用流式文件写入
                await this.processWithStreamingFile(context, template, editor, fullContent, functionName);
            } else {
                // 使用流式弹窗
                await this.processWithStreamingModal(context, template, editor, fullContent, functionName);
            }
        } catch (error) {
            new Notice(`AI 处理失败: ${error.message}`);
            console.error('AI processing error:', error);
        }
    }

    // 使用流式文件写入处理
    private async processWithStreamingFile(context: ContextMenuContext, template: string, editor: Editor, fullContent: string, functionName?: string): Promise<void> {
        const displayName = functionName ? this.getFunctionNameFromMenuName(functionName) : this.getFunctionNameFromTemplate(template);
        const sourceFile = this.app.workspace.getActiveFile();

        // 生成文件名
        const fileName = sourceFile ? `${sourceFile.basename}-${displayName}` : `AI${displayName}`;

        // 创建流式文件写入器
        const writer = new StreamingFileWriter({
            app: this.app,
            fileName,
            sourceFile: sourceFile || undefined,
            analysisType: displayName,
            savePath: this.getAISavePath(),
        });

        try {
            await writer.initialize();

            // 检查是否支持流式输出
            if (this.aiService.supportsStreaming()) {
                const streamingOptions: StreamingOptions = {
                    onToken: async (token: string) => {
                        await writer.writeToken(token);
                    },
                    onComplete: async (response: string) => {
                        await writer.complete();
                    },
                    onError: async (error: Error) => {
                        await writer.abort();
                        new Notice(`AI 处理失败: ${error.message}`);
                    }
                };

                const prompt = template.replace('{{highlight}}', context.selectedText).replace('{{content}}', fullContent);
                await this.aiService.streamResponse(prompt, streamingOptions);
            } else {
                // 降级到普通方式
                const response = await this.aiService.generateResponse(template, context.selectedText, '', fullContent);

                // 模拟流式输出效果
                const tokens = response.split('');
                for (const token of tokens) {
                    await writer.writeToken(token);
                    await new Promise(resolve => setTimeout(resolve, 20)); // 20ms 延迟
                }
                await writer.complete();
            }
        } catch (error) {
            await writer.abort();
            throw error;
        }
    }

    // 使用流式弹窗处理
    private async processWithStreamingModal(context: ContextMenuContext, template: string, editor: Editor, fullContent: string, functionName?: string): Promise<void> {
        const displayName = functionName ? this.getFunctionNameFromMenuName(functionName) : this.getFunctionNameFromTemplate(template);

        const modal = new StreamingModal(this.app, {
            title: displayName,
            functionName: displayName,
            selectedText: context.selectedText,
            editor,
            onInsert: (content: string) => {
                this.insertCalloutContent(content, context, editor);
            },
            onReplace: (content: string) => {
                this.replaceSelectedContent(content, context, editor);
            },
            onRegenerate: () => {
                // 重新开始流式输出
                modal.startStreaming();
                this.startStreamingToModal(modal, template, context, fullContent);
            }
        });

        modal.open();
        modal.startStreaming();

        // 开始流式输出
        this.startStreamingToModal(modal, template, context, fullContent);
    }

    // 开始流式输出到模态框
    private async startStreamingToModal(modal: StreamingModal, template: string, context: ContextMenuContext, fullContent: string): Promise<void> {
        try {
            // 检查是否支持流式输出
            if (this.aiService.supportsStreaming()) {
                const streamingOptions: StreamingOptions = {
                    onToken: (token: string) => {
                        modal.appendToken(token);
                    },
                    onComplete: (response: string) => {
                        modal.completeStreaming();
                    },
                    onError: (error: Error) => {
                        modal.stopStreaming();
                        new Notice(`AI 处理失败: ${error.message}`);
                    }
                };

                const prompt = template.replace('{{highlight}}', context.selectedText).replace('{{content}}', fullContent);
                await this.aiService.streamResponse(prompt, streamingOptions);
            } else {
                // 降级到普通方式，模拟流式输出
                const response = await this.aiService.generateResponse(template, context.selectedText, '', fullContent);

                const tokens = response.split('');
                for (const token of tokens) {
                    modal.appendToken(token);
                    await new Promise(resolve => setTimeout(resolve, 30)); // 30ms 延迟，模拟打字机效果
                }
                modal.completeStreaming();
            }
        } catch (error) {
            modal.stopStreaming();
            throw error;
        }
    }

    // 从菜单名称中提取功能名称
    private getFunctionNameFromMenuName(menuName: string): string {
        // 保持完整的菜单名称，包括 emoji，确保与菜单完全一致
        return menuName;
    }

    // 从模板中提取功能名称
    private getFunctionNameFromTemplate(template: string): string {
        if (template.includes('核心洞察')) return 'AI核心洞察';
        if (template.includes('内容扩展')) return 'AI内容扩展';
        if (template.includes('深度分析')) return 'AI深度分析';
        if (template.includes('创意思考')) return 'AI创意思考';
        if (template.includes('结构化总结')) return 'AI结构化总结';
        if (template.includes('润色文本')) return 'AI润色文本';
        if (template.includes('同义词替换')) return 'AI同义词替换';
        if (template.includes('翻译为英文')) return 'AI翻译为英文';
        if (template.includes('翻译为中文')) return 'AI翻译为中文';
        if (template.includes('生成Mermaid')) return 'AI生成Mermaid';
        if (template.includes('生成LaTeX')) return 'AI生成LaTeX';
        if (template.includes('文档分析')) return 'AI文档分析';
        if (template.includes('生成摘要')) return 'AI生成摘要';
        if (template.includes('提取关键词')) return 'AI提取关键词';
        if (template.includes('自定义分析')) return 'AI自定义分析';
        return 'AI自定义提示词';
    }

    // 获取AI保存路径
    private getAISavePath(): string {
        // 从插件设置中获取保存路径，如果没有设置则返回空字符串（保存到根目录）
        try {
            // 通过插件实例获取 AI 设置
            if (this.plugin && this.plugin.aiSettingsManager) {
                return this.plugin.aiSettingsManager.getSavePath();
            }
            return '';
        } catch (error) {
            console.warn('Failed to get AI save path:', error);
            return '';
        }
    }

    // 插入 Callout 格式内容
    private insertCalloutContent(content: string, context: ContextMenuContext, editor: Editor): void {
        const cursor = editor.getCursor();

        // 如果有选中文本，在选中文本后插入
        if (context.selectedText && editor.getSelection()) {
            const selection = editor.getSelection();
            const selectionEnd = editor.getCursor('to');
            editor.setCursor(selectionEnd.line, selectionEnd.ch);
            editor.replaceSelection('\n\n' + content);
        } else {
            // 在当前光标位置插入
            editor.setCursor(cursor.line, cursor.ch);
            editor.replaceSelection('\n\n' + content);
        }
    }

    // 替换选中内容
    private replaceSelectedContent(content: string, context: ContextMenuContext, editor: Editor): void {
        if (context.selectedText && editor.getSelection()) {
            editor.replaceSelection(content);
        } else {
            // 如果没有选中文本，则在当前位置插入
            editor.replaceSelection(content);
        }
    }

    // 处理 AI 响应
    private async handleAIResponse(response: string, context: ContextMenuContext, editor: Editor): Promise<void> {
        // 获取当前光标位置
        const cursor = editor.getCursor();
        
        // 如果有选中文本，在选中文本后插入
        if (context.selectedText && editor.getSelection()) {
            const selection = editor.getSelection();
            const selectionEnd = editor.getCursor('to');
            
            // 在选中文本后插入 AI 响应
            const insertText = `\n\n**AI 分析:**\n${response}\n`;
            editor.setCursor(selectionEnd);
            editor.replaceSelection(insertText);
        } else {
            // 在当前行后插入
            const currentLine = cursor.line;
            const lineEnd = { line: currentLine, ch: editor.getLine(currentLine).length };
            
            const insertText = `\n\n**AI 分析:**\n${response}\n`;
            editor.setCursor(lineEnd);
            editor.replaceSelection(insertText);
        }
    }

    // 特殊处理某些AI功能的响应
    private processSpecialAIResponse(response: string, template: string): string {
        // 处理Mermaid图表响应
        if (template.includes('生成Mermaid') || template.includes('Mermaid图表')) {
            const mermaidMatch = response.match(/```mermaid\n([\s\S]*?)\n```/);
            if (mermaidMatch && mermaidMatch[1]) {
                return `\n\`\`\`mermaid\n${mermaidMatch[1].trim()}\n\`\`\`\n`;
            }
            // 如果没有找到代码块，但包含mermaid关键词，尝试包装
            if (response.includes('graph') || response.includes('flowchart') || response.includes('sequenceDiagram')) {
                return `\n\`\`\`mermaid\n${response.trim()}\n\`\`\`\n`;
            }
        }

        // 处理LaTeX公式响应
        if (template.includes('生成LaTeX') || template.includes('LaTeX代码')) {
            // 查找$$包围的LaTeX公式
            const latexMatch = response.match(/\$\$([\s\S]*?)\$\$/);
            if (latexMatch && latexMatch[0]) {
                return latexMatch[0].trim();
            }
            // 查找代码块中的LaTeX
            const codeBlockMatch = response.match(/```latex\n([\s\S]*?)\n```/);
            if (codeBlockMatch && codeBlockMatch[1]) {
                const innerLatexMatch = codeBlockMatch[1].match(/\$\$([\s\S]*?)\$\$/);
                if (innerLatexMatch && innerLatexMatch[0]) {
                    return innerLatexMatch[0].trim();
                }
                return `$$${codeBlockMatch[1].trim()}$$`;
            }
            // 如果包含LaTeX语法，尝试包装
            if (response.includes('\\') && (response.includes('frac') || response.includes('sum') || response.includes('int'))) {
                return `$$${response.trim()}$$`;
            }
        }

        return response;
    }

    // 判断是否需要保存到文件
    private shouldSaveToFile(template: string): boolean {
        // 需要保存到文件的功能关键词（仅限更多选项菜单中的功能）
        const saveToFileKeywords = [
            '文档分析', '生成摘要', '提取关键词', '自定义分析'
        ];

        return saveToFileKeywords.some(keyword =>
            template.includes(keyword)
        );
    }

    // 保存响应到文件
    private async saveResponseToFile(response: string, template: string, context: ContextMenuContext): Promise<void> {
        try {
            const activeFile = this.app.workspace.getActiveFile();
            if (!activeFile) {
                new Notice('无法获取当前文件信息');
                return;
            }

            // 确定文件后缀
            let suffix = '';
            if (template.includes('生成摘要') || template.includes('摘要')) {
                suffix = '-生成摘要';
            } else if (template.includes('提取关键词') || template.includes('关键词')) {
                suffix = '-提取关键词';
            } else if (template.includes('文档分析') || template.includes('分析')) {
                suffix = '-文档分析';
            } else if (template.includes('总结')) {
                suffix = '-总结';
            } else {
                suffix = '-AI处理结果';
            }

            // 创建新文件名
            const baseName = activeFile.name.replace(/\.md$/, '');
            const newFileName = `${baseName}${suffix}.md`;
            const parentPath = activeFile.path.substring(0, activeFile.path.lastIndexOf('/'));
            const newFilePath = parentPath ?
                `${parentPath}/${newFileName}` :
                newFileName;

            // 创建文件内容
            const fileContent = `# ${baseName}${suffix}\n\n**原文件:** [[${baseName}]]\n\n**处理时间:** ${new Date().toLocaleString()}\n\n## 处理结果\n\n${response}`;

            // 保存文件
            await this.app.vault.create(newFilePath, fileContent);

            // 显示成功通知
            new Notice(`结果已保存到: ${newFileName}`);

            // 打开新创建的文件
            const newFile = this.app.vault.getAbstractFileByPath(newFilePath);
            if (newFile instanceof TFile) {
                const leaf = this.app.workspace.getUnpinnedLeaf();
                await leaf.openFile(newFile);
            }
        } catch (error) {
            console.error('保存文件失败:', error);
            new Notice('保存文件失败，请检查文件权限');
        }
    }

    // 显示自定义提示词对话框
    private showCustomPromptDialog(context: ContextMenuContext, editor: Editor): void {
        const modal = new CustomPromptModal(this.app, (customPrompt: string) => {
            if (customPrompt) {
                this.processWithAI(context, customPrompt, editor);
            }
        });
        modal.open();
    }

    // 注册文件菜单（右键文件时的菜单）
    registerFileMenu(menu: Menu, file: TFile): void {
        // 安全检查：确保menu和file存在
        if (!menu) {
            console.warn('Menu is undefined in ContextMenuIntegration.registerFileMenu');
            return;
        }

        if (!file) {
            console.warn('File is undefined in ContextMenuIntegration.registerFileMenu');
            return;
        }

        if (file.extension === 'md') {
            menu.addItem((item: MenuItem) => {
                item
                    .setTitle('mindmap AI')
                    .setIcon('brain');

                // 创建子菜单
                const submenu = (item as any).setSubmenu();
                if (submenu) {
                    this.createFileAISubmenu(submenu, file);
                }
            });
        }
    }

    // 创建文件 AI 子菜单
    private createFileAISubmenu(submenu: Menu, file: TFile): void {
        // 安全检查：确保submenu存在
        if (!submenu) {
            console.warn('Submenu is undefined in createFileAISubmenu');
            return;
        }

        submenu.addItem((item: MenuItem) => {
            item
                .setTitle('文档分析')
                .setIcon('file-text')
                .onClick(async () => {
                    await this.processFileWithAI(file, '请对以下文档进行详细分析：{{content}}', 'AI文档分析');
                });
        });

        submenu.addItem((item: MenuItem) => {
            item
                .setTitle('生成摘要')
                .setIcon('list')
                .onClick(async () => {
                    await this.processFileWithAI(file, '请为以下文档生成简洁的摘要：{{content}}', 'AI生成摘要');
                });
        });

        submenu.addItem((item: MenuItem) => {
            item
                .setTitle('提取关键词')
                .setIcon('tag')
                .onClick(async () => {
                    await this.processFileWithAI(file, '请从以下文档中提取关键词和要点：{{content}}', 'AI提取关键词');
                });
        });

        // 添加用户自定义Prompt选项（非默认的）
        const userCustomPrompts = this.getUserCustomPrompts();
        if (Object.keys(userCustomPrompts).length > 0) {
            submenu.addSeparator();

            Object.entries(userCustomPrompts).forEach(([name, template]) => {
                submenu.addItem((item: MenuItem) => {
                    item
                        .setTitle(name)
                        .setIcon('sparkles')
                        .onClick(async () => {
                            // 将用户自定义Prompt中的 {{highlight}} 替换为 {{content}}
                            const processedTemplate = (template as string).replace(/\{\{highlight\}\}/g, '{{content}}');
                            await this.processFileWithAI(file, processedTemplate, `AI${name}`);
                        });
                });
            });
        }

        submenu.addSeparator();
        submenu.addItem((item: MenuItem) => {
            item
                .setTitle('自定义分析...')
                .setIcon('edit')
                .onClick(() => {
                    this.showFileCustomPromptDialog(file);
                });
        });
    }

    // 处理整个文件的 AI 分析
    private async processFileWithAI(file: TFile, promptTemplate?: string, functionName?: string): Promise<void> {
        try {
            const content = await this.app.vault.read(file);
            const template = promptTemplate || '请对以下文档内容进行全面分析和总结：{{content}}';

            // 确定功能名称
            const displayName = functionName || this.getFunctionNameFromTemplate(template);

            // 生成文件名
            const fileName = `${file.basename}-${displayName}`;

            // 创建流式文件写入器
            const writer = new StreamingFileWriter({
                app: this.app,
                fileName,
                sourceFile: file,
                analysisType: displayName,
                savePath: this.getAISavePath(),
            });

            try {
                await writer.initialize();

                // 检查是否支持流式输出
                if (this.aiService.supportsStreaming()) {
                    const streamingOptions: StreamingOptions = {
                        onToken: async (token: string) => {
                            await writer.writeToken(token);
                        },
                        onComplete: async (response: string) => {
                            await writer.complete();
                            // 在原文件底部添加嵌入链接
                            await this.addEmbedLinkToFile(file, writer.getFile()!);
                        },
                        onError: async (error: Error) => {
                            await writer.abort();
                            new Notice(`AI 处理失败: ${error.message}`);
                        }
                    };

                    const prompt = template.replace('{{content}}', content);
                    await this.aiService.streamResponse(prompt, streamingOptions);
                } else {
                    // 降级到普通方式
                    const response = await this.aiService.generateResponse(template, content, '', content);

                    // 模拟流式输出效果
                    const tokens = response.split('');
                    for (const token of tokens) {
                        await writer.writeToken(token);
                        await new Promise(resolve => setTimeout(resolve, 20)); // 20ms 延迟
                    }
                    await writer.complete();
                    // 在原文件底部添加嵌入链接
                    await this.addEmbedLinkToFile(file, writer.getFile()!);
                }
            } catch (error) {
                await writer.abort();
                throw error;
            }
        } catch (error) {
            new Notice(`文件 AI 分析失败: ${error.message}`);
            console.error('File AI analysis error:', error);
        }
    }

    // 在文件底部添加嵌入链接
    private async addEmbedLinkToFile(sourceFile: TFile, targetFile: TFile): Promise<void> {
        try {
            const sourceContent = await this.app.vault.read(sourceFile);
            const embedLink = `![[${targetFile.basename}]]`;

            // 检查是否已经存在相同的嵌入链接，避免重复添加
            if (sourceContent.includes(embedLink)) {
                console.log('Embed link already exists, skipping:', embedLink);
                return;
            }

            // 在文件底部添加嵌入链接，确保格式正确
            const newContent = sourceContent.trimEnd() + `\n\n${embedLink}\n`;

            await this.app.vault.modify(sourceFile, newContent);
            console.log('Added embed link to source file:', embedLink);
        } catch (error) {
            console.warn('Failed to add embed link to source file:', error);
        }
    }

    // 显示文件自定义提示词对话框
    private showFileCustomPromptDialog(file: TFile): void {
        const modal = new CustomPromptModal(this.app, (customPrompt: string) => {
            if (customPrompt) {
                // 将用户输入的自定义Prompt中的 {{highlight}} 替换为 {{content}}
                const processedPrompt = customPrompt.replace(/\{\{highlight\}\}/g, '{{content}}');
                this.processFileWithAI(file, processedPrompt, 'AI自定义分析');
            }
        });
        modal.open();
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
            if (this.plugin && (this.plugin as any).aiSettingsManager) {
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
            console.error('ContextMenuIntegration - 获取用户自定义Prompt时出错:', error);
            return {};
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

    // 获取支持的文件类型
    getSupportedFileTypes(): string[] {
        return ['md', 'txt'];
    }

    // 验证上下文是否有效
    private validateContext(context: ContextMenuContext): boolean {
        return context.selectedText.length > 0 || context.fullContent.length > 0;
    }

    // 清理资源
    cleanup(): void {
        // 清理任何需要清理的资源
    }
}

/**
 * 自定义提示词输入模态框
 */
export class CustomPromptModal extends Modal {
    private onSubmit: (prompt: string) => void;
    private promptInput: HTMLTextAreaElement;

    constructor(app: App, onSubmit: (prompt: string) => void) {
        super(app);
        this.onSubmit = onSubmit;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl('h2', { text: '自定义提示词' });

        new Setting(contentEl)
            .setName('提示词模板')
            .setDesc('使用 {{highlight}} 作为选中内容的占位符')
            .addTextArea(text => {
                this.promptInput = text.inputEl;
                text.setPlaceholder('请输入自定义提示词，例如：请对以下内容进行总结：{{highlight}}');
                text.inputEl.rows = 4;
text.inputEl.setCssProps({ 'width': '100%' });
                // 自动聚焦
                setTimeout(() => text.inputEl.focus(), 100);
            });

        new Setting(contentEl)
            .addButton(button => {
                button
                    .setButtonText('确定')
                    .setCta()
                    .onClick(() => {
                        const prompt = this.promptInput.value.trim();
                        if (prompt) {
                            this.onSubmit(prompt);
                            this.close();
                        } else {
                            new Notice('请输入提示词内容');
                        }
                    });
            })
            .addButton(button => {
                button
                    .setButtonText('取消')
                    .onClick(() => {
                        this.close();
                    });
            });

        // 支持回车键提交
        this.promptInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                const prompt = this.promptInput.value.trim();
                if (prompt) {
                    this.onSubmit(prompt);
                    this.close();
                }
            }
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }

    // 更新 AI 服务
    updateAIService(aiService: AIService): void {
        this.aiService = aiService;
    }
}