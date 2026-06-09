import { Setting } from 'obsidian';
import { OpenAISettings } from './ai/OpenAISettings';
import { OpenAICompatibleSettings } from './ai/OpenAICompatibleSettings';
import { AnthropicSettings } from './ai/AnthropicSettings';
import { DeepseekSettings } from './ai/DeepseekSettings';
import { GeminiSettings } from './ai/GeminiSettings';
import { OllamaSettings } from './ai/OllamaSettings';
import { SiliconFlowSettings } from './ai/SiliconFlowSettings';
import { PromptSettingsTab } from './PromptSettingsTab';

export class AIServiceTab {
    private plugin: any;
    private containerEl: HTMLElement;

    constructor(plugin: any, containerEl: HTMLElement) {
        this.plugin = plugin;
        this.containerEl = containerEl;
    }

    display(): void {
        // AI 服务设置
        new Setting(this.containerEl)
            .setName('AI 服务')
            .setDesc('选择 AI 服务提供商')
            .addDropdown(dropdown => {
                const options = {
                    'openai': 'OpenAI',
                    'openaiCompatible': 'OpenAI 兼容',
                    'gemini': 'Gemini',
                    'anthropic': 'Anthropic',
                    'deepseek': 'Deepseek',
                    'siliconflow': 'SiliconFlow',
                    'ollama': 'Ollama (本地)'
                };

                return dropdown
                    .addOptions(options)
                    .setValue(this.plugin.settings.ai.provider)
                    .onChange(async (value) => {
                        this.plugin.settings.ai.provider = value;
                        await this.plugin.saveSettings();
                        // 重新显示设置
                        this.containerEl.empty();
                        this.display();
                    });
            });

        // 根据选择的服务显示相应的设置
        switch (this.plugin.settings.ai.provider) {
            case 'openai':
                new OpenAISettings(this.plugin, this.containerEl).display(this.containerEl);
                break;
            case 'openaiCompatible':
                new OpenAICompatibleSettings(this.plugin, this.containerEl).display(this.containerEl);
                break;
            case 'gemini':
                new GeminiSettings(this.plugin, this.containerEl).display(this.containerEl);
                break;
            case 'anthropic':
                new AnthropicSettings(this.plugin, this.containerEl).display(this.containerEl);
                break;
            case 'ollama':
                new OllamaSettings(this.plugin, this.containerEl).display(this.containerEl);
                break;
            case 'deepseek':
                new DeepseekSettings(this.plugin, this.containerEl).display(this.containerEl);
                break;
            case 'siliconflow':
                new SiliconFlowSettings(this.plugin, this.containerEl).display(this.containerEl);
                break;
        }

        // 显示 Prompt 设置
        new PromptSettingsTab(this.plugin, this.containerEl).display();

        // AI 文件保存设置（放在自定义Prompt下方）
        this.renderFileSaveSettings();
    }

    private renderFileSaveSettings(): void {
        // 参考 PromptSettingsTab 的设计风格
        const container = this.containerEl.createEl('div', {
            cls: 'file-save-settings-container'
        });

        // 标题容器，参考 prompt-settings-header 的设计
        const headerContainer = container.createEl('div', {
            cls: 'file-save-settings-header setting-item-heading'
        });

        // 使用 h4 标题，与 PromptSettingsTab 保持一致
        headerContainer.createEl('h4', {
            text: 'AI 文件保存设置',
            cls: 'file-save-settings-title'
        });

        // 确保 AI 设置对象存在
        if (!this.plugin.settings.ai) {
            this.plugin.settings.ai = {};
        }

        // 设置项容器
        const settingContainer = container.createEl('div', {
            cls: 'file-save-setting-item'
        });

        const setting = new Setting(settingContainer)
            .setName('保存路径')
            .setDesc('AI 生成文件的保存路径（相对于 vault 根目录，留空则保存到根目录）')
            .addText(text => {
                text
                    .setPlaceholder('例如: xmind 或 pages/ADC')
                    .setValue(this.plugin.settings.ai.savePath || '')
                    .onChange(async (value) => {
                        // 标准化路径：去除首尾空白，统一使用正斜杠
                        const normalizedPath = value.trim().replace(/\\/g, '/');
                        this.plugin.settings.ai.savePath = normalizedPath;

                        // 同步到 AI 设置管理器
                        if (this.plugin.aiSettingsManager) {
                            this.plugin.aiSettingsManager.updateSavePath(normalizedPath);
                        }

                        await this.plugin.saveSettings();
                    });text.inputEl.setCssProps({ 'width': '100%' });
            });
    }
}
