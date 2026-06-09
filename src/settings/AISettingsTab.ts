import { App, PluginSettingTab, Setting, Notice, TextComponent, DropdownComponent } from 'obsidian';
import { AISettingsManager } from './AISettings';
import { AIProvider, AISettings } from '../services/ai/types/AITypes';
import { AIServiceFactory } from '../services/ai/AIServiceFactory';

export class AISettingsTab {
    private app: App;
    private settingsManager: AISettingsManager;
    private containerEl: HTMLElement;
    private aiServiceFactory: AIServiceFactory;

    constructor(app: App, containerEl: HTMLElement, settingsManager: AISettingsManager) {
        this.app = app;
        this.containerEl = containerEl;
        this.settingsManager = settingsManager;
        this.aiServiceFactory = AIServiceFactory.getInstance();
    }

    display(): void {
        const { containerEl } = this;
        const settings = this.settingsManager.getSettings();

        // AI 服务配置标题
        containerEl.createEl('h2', { text: 'AI 服务配置' });

        // 提供者选择
        new Setting(containerEl)
            .setName('AI 服务提供者')
            .setDesc('选择要使用的 AI 服务提供者')
            .addDropdown(dropdown => {
                dropdown
                    .addOption('ollama', 'Ollama (本地)')
                    .addOption('openai', 'OpenAI')
                    .addOption('gemini', 'Google Gemini')
                    .addOption('anthropic', 'Anthropic Claude')
                    .addOption('deepseek', 'Deepseek')
                    .addOption('siliconflow', 'SiliconFlow')
                    .setValue(settings.provider)
                    .onChange(async (value: AIProvider) => {
                        this.settingsManager.updateProvider(value);
                        await this.saveSettings();
                        this.refreshProviderSettings();
                    });
            });

        // 连接测试按钮
        new Setting(containerEl)
            .setName('连接测试')
            .setDesc('测试当前 AI 服务提供者的连接')
            .addButton(button => {
                button
                    .setButtonText('测试连接')
                    .onClick(async () => {
                        await this.testConnection();
                    });
            });

        // 提供者特定设置容器
        const providerContainer = containerEl.createDiv('ai-provider-settings');
        this.renderProviderSettings(providerContainer, settings);

        // AI 文件保存设置
        this.renderFileSaveSettings(containerEl, settings);

        // 自定义提示词设置
        this.renderPromptSettings(containerEl, settings);
    }

    private renderProviderSettings(container: HTMLElement, settings: AISettings): void {
        container.empty();

        switch (settings.provider) {
            case 'ollama':
                this.renderOllamaSettings(container, settings);
                break;
            case 'openai':
                this.renderOpenAISettings(container, settings);
                break;
            case 'gemini':
                this.renderGeminiSettings(container, settings);
                break;
            case 'anthropic':
                this.renderAnthropicSettings(container, settings);
                break;
            case 'deepseek':
                this.renderDeepseekSettings(container, settings);
                break;
            case 'siliconflow':
                this.renderSiliconFlowSettings(container, settings);
                break;
        }
    }

    private renderFileSaveSettings(container: HTMLElement, settings: AISettings): void {
        // 参考自定义提示词的设计结构
        const titleEl = container.createEl('h2', {
            text: 'AI 文件保存设置',
            cls: 'ai-file-save-title'
        });

        const descEl = container.createEl('p', {
            text: '配置 AI 生成文件的保存位置。可以使用相对路径，例如 "AI分析" 或 "输出/AI"。留空则保存到 vault 根目录。',
            cls: 'ai-file-save-desc'
        });

        const saveSettingsContainer = container.createDiv('ai-save-settings-container');

        const setting = new Setting(saveSettingsContainer)
            .setName('保存路径')
            .setDesc('AI 生成文件的保存路径（相对于 vault 根目录）')
            .addText(text => {
                text
                    .setPlaceholder('例如: AI分析')
                    .setValue(settings.savePath || '')
                    .onChange(async (value) => {
                        this.settingsManager.updateSavePath(value);
                        await this.saveSettings();
                    });
text.inputEl.addClass('xmind-full-width-input');
            });


        // 添加路径预览
        const pathPreview = saveSettingsContainer.createDiv('path-preview');

        const updatePathPreview = () => {
            const savePath = settings.savePath || '';
            const vaultName = this.app.vault.getName();
            const fullPath = savePath ? `${vaultName}/${savePath}/` : `${vaultName}/`;
            pathPreview.textContent = `文件将保存到: ${fullPath}[文件名].md`;
        };

        updatePathPreview();

        // 监听路径变化更新预览
        const textInput = saveSettingsContainer.querySelector('input[type="text"]') as HTMLInputElement;
        if (textInput) {
            textInput.addEventListener('input', () => {
                settings.savePath = textInput.value;
                updatePathPreview();
            });
        }
    }

    private renderOllamaSettings(container: HTMLElement, settings: AISettings): void {
        container.createEl('h3', { text: 'Ollama 设置' });

        new Setting(container)
            .setName('服务器地址')
            .setDesc('Ollama 服务器的地址 (例如: http://localhost:11434)')
            .addText(text => {
                text
                    .setPlaceholder('http://localhost:11434')
                    .setValue(settings.ollama?.host || '')
                    .onChange(async (value) => {
                        this.settingsManager.updateProviderConfig('ollama', { host: value });
                        await this.saveSettings();
                    });
            });

        new Setting(container)
            .setName('模型')
            .setDesc('选择要使用的 Ollama 模型')
            .addDropdown(dropdown => {
                dropdown.addOption('', '请选择模型...');
                if (settings.ollama?.availableModels) {
                    settings.ollama.availableModels.forEach(model => {
                        dropdown.addOption(model, model);
                    });
                }
                dropdown
                    .setValue(settings.ollama?.model || '')
                    .onChange(async (value) => {
                        this.settingsManager.updateProviderConfig('ollama', { model: value });
                        await this.saveSettings();
                    });
            })
            .addButton(button => {
                button
                    .setButtonText('刷新模型列表')
                    .onClick(async () => {
                        await this.refreshOllamaModels();
                    });
            });
    }

    private renderOpenAISettings(container: HTMLElement, settings: AISettings): void {
        container.createEl('h3', { text: 'OpenAI 设置' });

        new Setting(container)
            .setName('API 密钥')
            .setDesc('输入您的 OpenAI API 密钥')
            .addText(text => {
                text
                    .setPlaceholder('sk-...')
                    .setValue(settings.openai?.apiKey || '')
                    .onChange(async (value) => {
                        this.settingsManager.updateProviderConfig('openai', { apiKey: value });
                        await this.saveSettings();
                    });
                text.inputEl.type = 'password';
            });

        new Setting(container)
            .setName('基础 URL')
            .setDesc('自定义 API 基础 URL (可选)')
            .addText(text => {
                text
                    .setPlaceholder('https://api.openai.com/v1')
                    .setValue(settings.openai?.baseUrl || '')
                    .onChange(async (value) => {
                        this.settingsManager.updateProviderConfig('openai', { baseUrl: value });
                        await this.saveSettings();
                    });
            });

        new Setting(container)
            .setName('模型')
            .setDesc('选择要使用的 OpenAI 模型')
            .addDropdown(dropdown => {
                dropdown
                    .addOption('gpt-4o', 'GPT-4o')
                    .addOption('gpt-4o-mini', 'GPT-4o Mini')
                    .addOption('gpt-4', 'GPT-4')
                    .addOption('gpt-4-turbo', 'GPT-4 Turbo')
                    .addOption('gpt-3.5-turbo', 'GPT-3.5 Turbo')
                    .setValue(settings.openai?.model || 'gpt-4o')
                    .onChange(async (value) => {
                        this.settingsManager.updateProviderConfig('openai', { model: value });
                        await this.saveSettings();
                    });
            });
    }

    private renderGeminiSettings(container: HTMLElement, settings: AISettings): void {
        container.createEl('h3', { text: 'Google Gemini 设置' });

        new Setting(container)
            .setName('API 密钥')
            .setDesc('输入您的 Google Gemini API 密钥')
            .addText(text => {
                text
                    .setPlaceholder('AIza...')
                    .setValue(settings.gemini?.apiKey || '')
                    .onChange(async (value) => {
                        this.settingsManager.updateProviderConfig('gemini', { apiKey: value });
                        await this.saveSettings();
                    });
                text.inputEl.type = 'password';
            });

        new Setting(container)
            .setName('基础 URL')
            .setDesc('自定义 API 基础 URL (可选)')
            .addText(text => {
                text
                    .setPlaceholder('https://generativelanguage.googleapis.com')
                    .setValue(settings.gemini?.baseUrl || '')
                    .onChange(async (value) => {
                        this.settingsManager.updateProviderConfig('gemini', { baseUrl: value });
                        await this.saveSettings();
                    });
            });

        new Setting(container)
            .setName('模型')
            .setDesc('选择要使用的 Gemini 模型')
            .addDropdown(dropdown => {
                dropdown
                    .addOption('gemini-1.5-flash', 'Gemini 1.5 Flash')
                    .addOption('gemini-1.5-pro', 'Gemini 1.5 Pro')
                    .addOption('gemini-2.0-flash', 'Gemini 2.0 Flash')
                    .addOption('gemini-2.0-flash-lite-preview-02-05', 'Gemini 2.0 Flash Lite')
                    .setValue(settings.gemini?.model || 'gemini-1.5-flash')
                    .onChange(async (value) => {
                        this.settingsManager.updateProviderConfig('gemini', { model: value });
                        await this.saveSettings();
                    });
            });
    }

    private renderAnthropicSettings(container: HTMLElement, settings: AISettings): void {
        container.createEl('h3', { text: 'Anthropic Claude 设置' });

        new Setting(container)
            .setName('API 密钥')
            .setDesc('输入您的 Anthropic API 密钥')
            .addText(text => {
                text
                    .setPlaceholder('sk-ant-...')
                    .setValue(settings.anthropic?.apiKey || '')
                    .onChange(async (value) => {
                        this.settingsManager.updateProviderConfig('anthropic', { apiKey: value });
                        await this.saveSettings();
                    });
                text.inputEl.type = 'password';
            });

        new Setting(container)
            .setName('API 地址')
            .setDesc('自定义 API 地址 (可选)')
            .addText(text => {
                text
                    .setPlaceholder('https://api.anthropic.com')
                    .setValue(settings.anthropic?.apiAddress || '')
                    .onChange(async (value) => {
                        this.settingsManager.updateProviderConfig('anthropic', { apiAddress: value });
                        await this.saveSettings();
                    });
            });

        new Setting(container)
            .setName('模型')
            .setDesc('选择要使用的 Claude 模型')
            .addDropdown(dropdown => {
                dropdown
                    .addOption('claude-3-opus-20240229', 'Claude 3 Opus')
                    .addOption('claude-3-sonnet-20240229', 'Claude 3 Sonnet')
                    .addOption('claude-3-haiku-20240307', 'Claude 3 Haiku')
                    .addOption('claude-2', 'Claude 2')
                    .addOption('claude-instant-1', 'Claude Instant')
                    .setValue(settings.anthropic?.model || 'claude-3-opus-20240229')
                    .onChange(async (value) => {
                        this.settingsManager.updateProviderConfig('anthropic', { model: value });
                        await this.saveSettings();
                    });
            });
    }

    private renderDeepseekSettings(container: HTMLElement, settings: AISettings): void {
        container.createEl('h3', { text: 'Deepseek 设置' });

        new Setting(container)
            .setName('API 密钥')
            .setDesc('输入您的 Deepseek API 密钥')
            .addText(text => {
                text
                    .setPlaceholder('sk-...')
                    .setValue(settings.deepseek?.apiKey || '')
                    .onChange(async (value) => {
                        this.settingsManager.updateProviderConfig('deepseek', { apiKey: value });
                        await this.saveSettings();
                    });
                text.inputEl.type = 'password';
            });

        new Setting(container)
            .setName('基础 URL')
            .setDesc('自定义 API 基础 URL (可选)')
            .addText(text => {
                text
                    .setPlaceholder('https://api.deepseek.com/v1')
                    .setValue(settings.deepseek?.baseUrl || '')
                    .onChange(async (value) => {
                        this.settingsManager.updateProviderConfig('deepseek', { baseUrl: value });
                        await this.saveSettings();
                    });
            });

        new Setting(container)
            .setName('模型')
            .setDesc('选择要使用的 Deepseek 模型')
            .addDropdown(dropdown => {
                dropdown
                    .addOption('deepseek-chat', 'Deepseek Chat')
                    .addOption('deepseek-coder', 'Deepseek Coder')
                    .addOption('deepseek-reasoner', 'Deepseek Reasoner')
                    .setValue(settings.deepseek?.model || 'deepseek-chat')
                    .onChange(async (value) => {
                        this.settingsManager.updateProviderConfig('deepseek', { model: value });
                        await this.saveSettings();
                    });
            });
    }

    private renderSiliconFlowSettings(container: HTMLElement, settings: AISettings): void {
        container.createEl('h3', { text: 'SiliconFlow 设置' });

        new Setting(container)
            .setName('API 密钥')
            .setDesc('输入您的 SiliconFlow API 密钥')
            .addText(text => {
                text
                    .setPlaceholder('sk-...')
                    .setValue(settings.siliconflow?.apiKey || '')
                    .onChange(async (value) => {
                        this.settingsManager.updateProviderConfig('siliconflow', { apiKey: value });
                        await this.saveSettings();
                    });
                text.inputEl.type = 'password';
            });

        new Setting(container)
            .setName('基础 URL')
            .setDesc('自定义 API 基础 URL (可选)')
            .addText(text => {
                text
                    .setPlaceholder('https://api.siliconflow.cn/v1')
                    .setValue(settings.siliconflow?.baseUrl || '')
                    .onChange(async (value) => {
                        this.settingsManager.updateProviderConfig('siliconflow', { baseUrl: value });
                        await this.saveSettings();
                    });
            });

        new Setting(container)
            .setName('模型')
            .setDesc('选择要使用的 SiliconFlow 模型')
            .addDropdown(dropdown => {
                dropdown
                    .addOption('deepseek-ai/DeepSeek-V3', 'DeepSeek V3')
                    .addOption('Qwen/Qwen2.5-7B-Instruct', 'Qwen2.5 7B')
                    .addOption('Qwen/Qwen2.5-14B-Instruct', 'Qwen2.5 14B')
                    .addOption('Pro/Qwen/Qwen2-7B-Instruct', 'Qwen2 7B')
                    .addOption('Pro/THUDM/glm-4-9b-chat', 'GLM-4 9B')
                    .addOption('google/gemma-2-9b-it', 'Gemma2 9B')
                    .setValue(settings.siliconflow?.model || 'deepseek-ai/DeepSeek-V3')
                    .onChange(async (value) => {
                        this.settingsManager.updateProviderConfig('siliconflow', { model: value });
                        await this.saveSettings();
                    });
            });
    }

    private renderPromptSettings(container: HTMLElement, settings: AISettings): void {
        container.createEl('h2', { text: '自定义提示词' });
        container.createEl('p', { 
            text: '您可以创建自定义提示词模板。使用 {{highlight}} 作为选中文本的占位符，{{comment}} 作为注释的占位符。' 
        });

        const promptsContainer = container.createDiv('ai-prompts-container');
        
        // 显示现有提示词
        Object.entries(settings.prompts).forEach(([name, template]) => {
            const promptSetting = new Setting(promptsContainer)
                .setName(name)
                .setDesc('点击编辑此提示词模板')
                .addTextArea(text => {
                    text
                        .setValue(template)
                        .onChange(async (value) => {
                            this.settingsManager.updatePrompt(name, value);
                            await this.saveSettings();
                        });
                    text.inputEl.rows = 3;
text.inputEl.addClass('xmind-full-width-input');
                })
                .addButton(button => {
                    button
                        .setButtonText('删除')
                        .setWarning()
                        .onClick(async () => {
                            this.settingsManager.removeCustomPrompt(name);
                            await this.saveSettings();
                            this.refreshPromptSettings();
                        });
                });
        });

        // 添加新提示词
        new Setting(promptsContainer)
            .setName('添加新提示词')
            .setDesc('创建一个新的自定义提示词模板')
            .addButton(button => {
                button
                    .setButtonText('添加提示词')
                    .onClick(() => {
                        this.showAddPromptModal();
                    });
            });
    }

    private async refreshOllamaModels(): void {
        try {
            const aiService = this.aiServiceFactory.getAIService();
            if (aiService) {
                const models = await aiService.listOllamaModels();
                this.settingsManager.updateProviderConfig('ollama', { availableModels: models });
                await this.saveSettings();
                this.refreshProviderSettings();
                new Notice('Ollama 模型列表已更新');
            }
        } catch (error) {
            new Notice('获取 Ollama 模型列表失败: ' + error.message);
        }
    }

    private async testConnection(): void {
        try {
            const aiService = this.aiServiceFactory.getAIService();
            if (aiService) {
                const isConnected = await aiService.testConnection();
                if (isConnected) {
                    new Notice('连接测试成功！');
                } else {
                    new Notice('连接测试失败，请检查配置');
                }
            } else {
                new Notice('AI 服务未初始化');
            }
        } catch (error) {
            new Notice('连接测试失败: ' + error.message);
        }
    }

    private refreshProviderSettings(): void {
        const providerContainer = this.containerEl.querySelector('.ai-provider-settings') as HTMLElement;
        if (providerContainer) {
            this.renderProviderSettings(providerContainer, this.settingsManager.getSettings());
        }
    }

    private refreshPromptSettings(): void {
        const promptsContainer = this.containerEl.querySelector('.ai-prompts-container') as HTMLElement;
        if (promptsContainer) {
            promptsContainer.empty();
            this.renderPromptSettings(this.containerEl, this.settingsManager.getSettings());
        }
    }

    private showAddPromptModal(): void {
        // 简化版本，直接使用 prompt
        const name = prompt('请输入提示词名称:');
        if (name) {
            const template = prompt('请输入提示词模板 (使用 {{highlight}} 作为占位符):');
            if (template) {
                this.settingsManager.addCustomPrompt(name, template);
                this.saveSettings();
                this.refreshPromptSettings();
            }
        }
    }

    private async saveSettings(): Promise<void> {
        // 这个方法需要由父组件实现，用于保存设置到 Obsidian
        // 这里只是一个占位符
    }
}