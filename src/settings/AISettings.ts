import { AISettings, AIProvider } from '../services/ai/types/AITypes';

export class AISettingsManager {
    private settings: AISettings;

    constructor(initialSettings?: Partial<AISettings>) {
        this.settings = this.getDefaultSettings();
        if (initialSettings) {
            this.updateSettings(initialSettings);
        }
    }

    private getDefaultSettings(): AISettings {
        return {
            provider: 'ollama',
            ollama: {
                host: 'http://localhost:11434',
                model: '',
                availableModels: []
            },
            gemini: {
                apiKey: '',
                model: 'gemini-1.5-flash',
                baseUrl: '',
                isCustomModel: false
            },
            openai: {
                apiKey: '',
                model: 'gpt-4o',
                baseUrl: '',
                isCustomModel: false,
                lastCustomModel: ''
            },
            anthropic: {
                apiKey: '',
                model: 'claude-3-opus-20240229',
                availableModels: [],
                apiAddress: '',
                isCustomModel: false,
                lastCustomModel: ''
            },
            deepseek: {
                apiKey: '',
                model: 'deepseek-chat',
                baseUrl: '',
                isCustomModel: false,
                lastCustomModel: ''
            },
            siliconflow: {
                apiKey: '',
                model: 'deepseek-ai/DeepSeek-V3',
                baseUrl: '',
                isCustomModel: false,
                lastCustomModel: ''
            },
            prompts: {
                '🤔 核心洞察': '{{highlight}}。请从全新的角度重新解读上述内容，并在200字内总结其核心思想。',
                '📝 内容扩展': '基于以下内容：{{highlight}}，请提供3-5个相关的扩展要点或子主题。',
                '🔍 深度分析': '请对以下内容进行深度分析：{{highlight}}。包括背景、影响和潜在应用。',
                '💡 创意思考': '基于：{{highlight}}，请提供3个创新的思考角度或应用场景。',
                '📊 结构化总结': '请将以下内容结构化总结：{{highlight}}。使用要点形式组织信息。'
            },
            savePath: '' // 默认保存到根目录
        };
    }

    getSettings(): AISettings {
        return { ...this.settings };
    }

    updateSettings(newSettings: Partial<AISettings>): void {
        this.settings = { ...this.settings, ...newSettings };
    }

    updateProvider(provider: AIProvider): void {
        this.settings.provider = provider;
    }

    updateProviderConfig(provider: AIProvider, config: any): void {
        switch (provider) {
            case 'ollama':
                this.settings.ollama = { ...this.settings.ollama, ...config };
                break;
            case 'gemini':
                this.settings.gemini = { ...this.settings.gemini, ...config };
                break;
            case 'openai':
                this.settings.openai = { ...this.settings.openai, ...config };
                break;
            case 'openaiCompatible':
                this.settings.openaiCompatible = { ...this.settings.openaiCompatible, ...config };
                break;
            case 'anthropic':
                this.settings.anthropic = { ...this.settings.anthropic, ...config };
                break;
            case 'deepseek':
                this.settings.deepseek = { ...this.settings.deepseek, ...config };
                break;
            case 'siliconflow':
                this.settings.siliconflow = { ...this.settings.siliconflow, ...config };
                break;
        }
    }

    addCustomPrompt(name: string, template: string): void {
        this.settings.prompts[name] = template;
    }

    removeCustomPrompt(name: string): void {
        delete this.settings.prompts[name];
    }

    // 保存路径管理
    updateSavePath(savePath: string): void {
        this.settings.savePath = savePath;
    }

    getSavePath(): string {
        return this.settings.savePath || '';
    }

    updatePrompt(name: string, template: string): void {
        this.settings.prompts[name] = template;
    }

    getPrompts(): Record<string, string> {
        return { ...this.settings.prompts };
    }

    validateSettings(): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        // 验证当前提供者的配置
        switch (this.settings.provider) {
            case 'ollama':
                if (!this.settings.ollama?.host) {
                    errors.push('Ollama 主机地址未配置');
                }
                if (!this.settings.ollama?.model) {
                    errors.push('Ollama 模型未选择');
                }
                break;
            case 'gemini':
                if (!this.settings.gemini?.apiKey) {
                    errors.push('Gemini API 密钥未配置');
                }
                break;
            case 'openai':
                if (!this.settings.openai?.apiKey) {
                    errors.push('OpenAI API 密钥未配置');
                }
                break;
            case 'anthropic':
                if (!this.settings.anthropic?.apiKey) {
                    errors.push('Anthropic API 密钥未配置');
                }
                break;
            case 'deepseek':
                if (!this.settings.deepseek?.apiKey) {
                    errors.push('Deepseek API 密钥未配置');
                }
                break;
            case 'siliconflow':
                if (!this.settings.siliconflow?.apiKey) {
                    errors.push('SiliconFlow API 密钥未配置');
                }
                break;
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    exportSettings(): string {
        return JSON.stringify(this.settings, null, 2);
    }

    importSettings(settingsJson: string): boolean {
        try {
            const importedSettings = JSON.parse(settingsJson);
            this.updateSettings(importedSettings);
            return true;
        } catch (error) {
            return false;
        }
    }

    resetToDefaults(): void {
        this.settings = this.getDefaultSettings();
    }

    // 获取提供者的显示名称
    getProviderDisplayName(provider: AIProvider): string {
        const names = {
            'ollama': 'Ollama (本地)',
            'gemini': 'Google Gemini',
            'openai': 'OpenAI',
            'openaiCompatible': 'OpenAI兼容',
            'anthropic': 'Anthropic Claude',
            'deepseek': 'Deepseek',
            'siliconflow': 'SiliconFlow'
        };
        return names[provider] || provider;
    }

    // 检查提供者是否已配置
    isProviderConfigured(provider: AIProvider): boolean {
        switch (provider) {
            case 'ollama':
                return !!(this.settings.ollama?.host && this.settings.ollama?.model);
            case 'gemini':
                return !!(this.settings.gemini?.apiKey);
            case 'openai':
                return !!(this.settings.openai?.apiKey);
            case 'openaiCompatible':
                return !!(this.settings.openaiCompatible?.apiKey && this.settings.openaiCompatible?.model && this.settings.openaiCompatible?.apiAddress);
            case 'anthropic':
                return !!(this.settings.anthropic?.apiKey);
            case 'deepseek':
                return !!(this.settings.deepseek?.apiKey);
            case 'siliconflow':
                return !!(this.settings.siliconflow?.apiKey);
            default:
                return false;
        }
    }
}