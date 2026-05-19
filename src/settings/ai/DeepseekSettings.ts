import { Setting, Notice } from 'obsidian';
import { BaseAIServiceSettings, AIModel } from './AIServiceSettings';

const DEFAULT_DEEPSEEK_MODELS: AIModel[] = [
    { id: 'deepseek-chat', name: 'Deepseek Chat' },
    { id: 'deepseek-coder', name: 'Deepseek Coder' }
];

export class DeepseekSettings extends BaseAIServiceSettings {
    private modelState: any;
    private modelSelectEl: HTMLSelectElement | null = null;
    private customModelContainer: HTMLDivElement | null = null;

    constructor(plugin: any, containerEl: HTMLElement) {
        super(plugin, containerEl);
        this.modelState = this.initializeModelState();
    }

    private initializeModelState(): any {
        // 确保 deepseek 设置对象存在
        if (!this.plugin.settings.ai.deepseek) {
            this.plugin.settings.ai.deepseek = {
                apiKey: '',
                model: DEFAULT_DEEPSEEK_MODELS[0].id,
                apiAddress: '',
                isCustomModel: false,
                lastCustomModel: ''
            };
        }

        const settings = this.plugin.settings.ai.deepseek;
        let selectedModel: any;

        // 处理模型选择
        if (settings.isCustomModel) {
            // 如果之前是自定义模型，直接使用保存的模型 ID
            selectedModel = {
                id: settings.model,
                name: settings.model,
                isCustom: true
            };
        } else {
            // 处理预设模型
            const savedModel = DEFAULT_DEEPSEEK_MODELS.find(m => m.id === settings.model);
            selectedModel = savedModel || DEFAULT_DEEPSEEK_MODELS[0];

            // 如果使用了默认模型，更新设置
            if (!savedModel) {
                settings.model = selectedModel.id;
            }
        }

        return {
            selectedModel,
            apiKey: settings.apiKey || ''
        };
    }

    private async saveModelState() {
        if (!this.plugin.settings.ai.deepseek) {
            this.plugin.settings.ai.deepseek = {};
        }

        const settings = this.plugin.settings.ai.deepseek;
        const model = this.modelState.selectedModel;

        // 更新设置
        settings.model = model.id;
        settings.isCustomModel = !!model.isCustom;
        settings.apiKey = this.modelState.apiKey || '';

        // 如果是自定义模型，更新 lastCustomModel
        if (model.isCustom && model.id) {
            settings.lastCustomModel = model.id;
        }

        // 立即保存设置
        await this.plugin.saveSettings();
    }

    display(containerEl: HTMLElement): void {
        const deepseekSettingsContainer = containerEl.createEl('div', {
            cls: 'ai-service-settings'
        });

        // 添加标题
        new Setting(deepseekSettingsContainer)
            .setName('Deepseek 服务')
            .setHeading();

        // 确保 deepseek 设置对象存在
        if (!this.plugin.settings.ai.deepseek) {
            this.plugin.settings.ai.deepseek = {
                apiKey: '',
                model: DEFAULT_DEEPSEEK_MODELS[0].id
            };
        }

        const settings = this.plugin.settings.ai.deepseek;

        // API Key 设置
        new Setting(deepseekSettingsContainer)
            .setName('API 密钥')
            .setDesc('请输入您的 Deepseek API 密钥')
            .addText(text => text
                .setPlaceholder('sk-...')
                .setValue(this.modelState.apiKey)
                .onChange(async (value) => {
                    this.modelState.apiKey = value;
                    await this.saveModelState();
                }))
            .addButton(button => button
                .setButtonText('验证')
                .onClick(async () => {
                    if (!this.modelState.apiKey) {
                        new Notice('请先输入 API 密钥');
                        return;
                    }

                    // 禁用按钮，防止重复点击
                    button.setDisabled(true);
                    button.setButtonText('验证中...');

                    try {
                        if (!this.modelState.selectedModel.id) {
                            new Notice('请先选择或输入模型ID');
                            return;
                        }

                        // 临时保存当前设置
                        const originalProvider = this.plugin.settings.ai.provider;
                        const originalDeepseek = { ...this.plugin.settings.ai.deepseek };

                        // 设置临时配置进行验证
                        this.plugin.settings.ai.provider = 'deepseek';
                        this.plugin.settings.ai.deepseek = {
                            apiKey: this.modelState.apiKey,
                            model: this.modelState.selectedModel.id,
                            baseUrl: this.plugin.settings.ai.deepseek?.baseUrl || 'https://api.deepseek.com/v1',
                            isCustomModel: this.modelState.selectedModel.isCustom,
                            lastCustomModel: this.plugin.settings.ai.deepseek?.lastCustomModel || ''
                        };

                        // 更新AI服务配置
                        if (this.plugin.aiService) {
                            this.plugin.aiService.updateSettings(this.plugin.settings.ai);
                        }

                        // 测试连接和模型可用性
                        const testResult = await this.plugin.aiService?.testConnection();
                        if (testResult) {
                            new Notice('API密钥和模型验证成功！');
                        } else {
                            new Notice('验证失败：API密钥或模型ID无效');
                        }

                        // 恢复原始设置
                        this.plugin.settings.ai.provider = originalProvider;
                        this.plugin.settings.ai.deepseek = originalDeepseek;

                        // 恢复AI服务配置
                        if (this.plugin.aiService) {
                            this.plugin.aiService.updateSettings(this.plugin.settings.ai);
                        }
                    } catch (error) {
                        console.error('验证失败:', error);
                        new Notice(`验证失败：${error.message || '请检查API密钥和模型ID'}`);
                    } finally {
                        // 恢复按钮状态
                        button.setDisabled(false);
                        button.setButtonText('验证');
                    }
                }));

        // 模型选择设置
        const modelSetting = new Setting(deepseekSettingsContainer)
            .setName('模型')
            .setDesc('选择一个模型或输入自定义模型')
            .addDropdown(dropdown => {
                // 添加预设模型选项
                DEFAULT_DEEPSEEK_MODELS.forEach(model => {
                    dropdown.addOption(model.id, model.name);
                });
                // 添加自定义模型选项
                dropdown.addOption('custom', '自定义模型');

                // 设置当前值
                const currentValue = this.modelState.selectedModel.isCustom ? 'custom' : this.modelState.selectedModel.id;
                dropdown.setValue(currentValue);

                this.modelSelectEl = dropdown.selectEl;

                dropdown.onChange(async (value) => {
                    if (value === 'custom') {
                        await this.showCustomModelInput();
                    } else {
                        const selectedModel = DEFAULT_DEEPSEEK_MODELS.find(m => m.id === value);
                        if (selectedModel) {
                            // 在切换到预设模型之前，保存当前的自定义模型
                            if (this.modelState.selectedModel.isCustom) {
                                const settings = this.plugin.settings.ai.deepseek;
                                settings.lastCustomModel = this.modelState.selectedModel.id;
                                await this.plugin.saveSettings();
                            }

                            this.modelState.selectedModel = selectedModel;
                            await this.saveModelState();
                            await this.hideCustomModelInput();
                        }
                    }
                });

                return dropdown;
            });

        // 创建自定义模型输入容器
        this.customModelContainer = modelSetting.settingEl.createDiv('custom-model-container');
        this.customModelContainer.addClass('custom-model-container');

        // 将自定义输入框容器移到下拉框之前
        const dropdownEl = modelSetting.settingEl.querySelector('.setting-item-control');
        if (dropdownEl) {
            (dropdownEl as HTMLElement).addClass('openai-dropdown-container');
            dropdownEl.insertBefore(this.customModelContainer, dropdownEl.firstChild);
        }

        // 添加自定义模型输入框
        const textComponent = new Setting(this.customModelContainer)
            .addText(text => text
                .setPlaceholder('model-id')
                .setValue(this.modelState.selectedModel.isCustom ? this.modelState.selectedModel.id : '')
                .onChange(async (value) => {
                    const trimmedValue = value.trim();

                    // 如果输入为空，不更新模型
                    if (!trimmedValue) {
                        return;
                    }

                    // 检查模型 ID 格式
                    if (!/^[a-zA-Z0-9-_.]+$/.test(trimmedValue)) {
                        new Notice('模型 ID 只能包含字母、数字、下划线、点和连字符。');
                        text.setValue(this.modelState.selectedModel.id);
                        return;
                    }

                    this.modelState.selectedModel = {
                        id: trimmedValue,
                        name: trimmedValue,
                        isCustom: true
                    };
                    await this.saveModelState();
                }));

        // 移除 Setting 组件的额外样式
        const settingItem = textComponent.settingEl;
        settingItem.addClass('openai-setting-no-border');
        const controlEl = settingItem.querySelector('.setting-item-control');
        if (controlEl) {
            (controlEl as HTMLElement).addClass('openai-setting-no-margin');
        }

        // 如果当前是自定义模型，显示输入框
        if (this.modelState.selectedModel.isCustom) {
            this.showCustomModelInput();
        }

        // Provider URL 设置
        new Setting(deepseekSettingsContainer)
            .setName('提供商 URL')
            .setDesc('留空，除非您使用代理')
            .addText(text => text
                .setPlaceholder('https://api.deepseek.com')
                .setValue(this.plugin.settings.ai.deepseek?.apiAddress || '')
                .onChange(async (value) => {
                    if (!this.plugin.settings.ai.deepseek) {
                        this.plugin.settings.ai.deepseek = {};
                    }
                    this.plugin.settings.ai.deepseek.apiAddress = value;
                    await this.plugin.saveSettings();
                }));
    }

    private async showCustomModelInput() {
        if (this.customModelContainer && this.modelSelectEl) {
            this.customModelContainer.addClass('visible');
            this.modelSelectEl.value = 'custom';

            const settings = this.plugin.settings.ai.deepseek;
            const currentModel = this.modelState.selectedModel;

            // 如果当前不是自定义模型，尝试恢复上一次的自定义模型
            if (!currentModel.isCustom) {
                const modelId = settings.lastCustomModel || '';

                // 更新模型状态
                this.modelState.selectedModel = {
                    id: modelId,
                    name: modelId,
                    isCustom: true
                };

                // 更新设置
                settings.model = modelId;
                settings.isCustomModel = true;
                await this.plugin.saveSettings();

                // 更新输入框
                const inputEl = this.customModelContainer.querySelector('input');
                if (inputEl) {
                    (inputEl as HTMLInputElement).value = modelId;
                }
            }
        }
    }

    private async hideCustomModelInput() {
        if (this.customModelContainer) {
            this.customModelContainer.removeClass('visible');
        }
    }
}
