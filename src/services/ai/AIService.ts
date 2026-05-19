import { AIProvider, AISettings, DEFAULT_GEMINI_MODELS, DEFAULT_SILICONFLOW_MODELS, AIModel, ChatMessage, StreamingOptions } from './types/AITypes';
import { OllamaService } from './providers/OllamaService';
import { AnthropicService } from './providers/AnthropicService';
import { GeminiService } from './providers/GeminiService';
import { SiliconFlowService } from './providers/SiliconFlowService';
import { DeepseekService } from './providers/DeepseekService';
import { OpenAIService } from './providers/OpenAIService';
import { requestUrl } from 'obsidian';

export class AIService {
    private ollamaService: OllamaService | null = null;
    private anthropicService: AnthropicService | null = null;
    private geminiService: GeminiService | null = null;
    private deepseekService: DeepseekService | null = null;
    private siliconflowService: SiliconFlowService | null = null;
    private openaiService: OpenAIService | null = null;
    private openaiCompatibleService: OpenAIService | null = null;

    // 存储当前使用的模型状态
    private currentState = {
        provider: '',
        model: ''
    };

    constructor(private settings: AISettings) {
        this.initializeServices();
    }

    private initializeServices() {
        try {
            // 清理现有服务
            this.ollamaService = null;
            this.anthropicService = null;
            this.geminiService = null;
            this.deepseekService = null;
            this.siliconflowService = null;
            this.openaiService = null;
            this.openaiCompatibleService = null;

            if (this.settings.ollama?.host) {
                this.ollamaService = new OllamaService(this.settings.ollama.host);
            }
            if (this.settings.anthropic?.apiKey) {
                this.anthropicService = new AnthropicService(
                    this.settings.anthropic.apiKey,
                    this.settings.anthropic.apiAddress,
                    this.settings.anthropic.model
                );
            }
            if (this.settings.gemini?.apiKey) {
                this.geminiService = new GeminiService(
                    this.settings.gemini.apiKey,
                    this.settings.gemini.model,
                    this.settings.gemini.baseUrl
                );
            }
            if (this.settings.deepseek?.apiKey) {
                this.deepseekService = new DeepseekService(
                    this.settings.deepseek.apiKey,
                    this.settings.deepseek.model,
                    this.settings.deepseek.baseUrl
                );
            }
            if (this.settings.siliconflow?.apiKey) {
                this.siliconflowService = new SiliconFlowService(this.settings);
            }
            if (this.settings.openai?.apiKey) {
                this.openaiService = new OpenAIService(
                    this.settings.openai.apiKey,
                    this.settings.openai.model,
                    this.settings.openai.baseUrl
                );
            }
            if (this.settings.openaiCompatible?.apiKey) {
                this.openaiCompatibleService = new OpenAIService(
                    this.settings.openaiCompatible.apiKey,
                    this.settings.openaiCompatible.model,
                    this.settings.openaiCompatible.apiAddress
                );
            }
        } catch (error) {
            console.error('Error initializing AI services:', error);
        }
        
        // 初始化使用设置中的值
        this.currentState.provider = this.settings.provider;
        switch (this.settings.provider) {
            case 'gemini':
                this.currentState.model = this.settings.gemini?.model || '';
                break;
            case 'deepseek':
                this.currentState.model = this.settings.deepseek?.model || 'deepseek-chat';
                break;
            case 'siliconflow':
                this.currentState.model = this.settings.siliconflow?.model || 'internlm/internlm2_5-7b-chat';
                break;
            case 'openai':
                this.currentState.model = this.settings.openai?.model || 'gpt-4o';
                break;
            case 'anthropic':
                this.currentState.model = this.settings.anthropic?.model || 'claude-2';
                break;
            case 'ollama':
                this.currentState.model = this.settings.ollama?.model || '';
                break;
        }
    }

    // 更新当前使用的模型
    updateModel(provider: string, model: string) {
        this.currentState.provider = provider;
        this.currentState.model = model;

        // 更新相应服务的模型
        switch (provider) {
            case 'gemini':
                if (this.geminiService) {
                    this.geminiService.updateModel(model);
                }
                break;
            case 'deepseek':
                if (this.deepseekService) {
                    this.deepseekService.updateModel(model);
                }
                break;
            case 'openai':
                if (this.openaiService) {
                    this.openaiService.updateModel(model);
                }
                break;
        }
    }

    async generateResponse(prompt: string, highlight: string, comment?: string, fullContent?: string): Promise<string> {
        // 特别检查Ollama模型配置
        if (this.settings.provider === 'ollama') {
            if (!this.settings.ollama?.model || this.settings.ollama.model.trim() === '') {
                throw new Error('请在插件设置中配置 Ollama 模型。建议使用 deepseek-r1:8b 或其他已下载的模型。');
            }
        }

        // 如果提供了全文内容，优先使用全文内容替换{{content}}占位符
        let promptWithContext = prompt
            .replace('{{highlight}}', highlight)
            .replace('{{content}}', fullContent || highlight);

        // If comment is provided, replace its placeholder
        if (comment) {
            promptWithContext = promptWithContext.replace('{{comment}}', comment);
        }

        switch (this.settings.provider) {
            case 'openai':
                return await this.callOpenAI(promptWithContext);
            case 'openaiCompatible':
                return await this.callOpenAICompatible(promptWithContext);
            case 'anthropic':
                return await this.callAnthropic(promptWithContext);
            case 'ollama':
                return await this.callOllama(promptWithContext);
            case 'gemini':
                return await this.callGemini(promptWithContext);
            case 'deepseek':
                return await this.callDeepseek(promptWithContext);
            case 'siliconflow':
                return await this.callSiliconFlow(promptWithContext);
            default:
                throw new Error('AI 服务未配置');
        }
    }

    async chat(messages: ChatMessage[]): Promise<string> {
        switch (this.settings.provider) {
            case 'openai':
                return await this.chatWithOpenAI(messages);
            case 'openaiCompatible':
                return await this.chatWithOpenAICompatible(messages);
            case 'anthropic':
                return await this.chatWithAnthropic(messages);
            case 'ollama':
                return await this.chatWithOllama(messages);
            case 'gemini':
                return await this.chatWithGemini(messages);
            case 'deepseek':
                return await this.chatWithDeepseek(messages);
            case 'siliconflow':
                return await this.chatWithSiliconFlow(messages);
            default:
                throw new Error('AI 服务未配置');
        }
    }

    private async chatWithOpenAI(messages: ChatMessage[]): Promise<string> {
        if (!this.openaiService) {
            throw new Error('OpenAI 服务未配置');
        }
        return await this.openaiService.chat(messages);
    }

    private async chatWithOpenAICompatible(messages: ChatMessage[]): Promise<string> {
        if (!this.openaiCompatibleService) {
            throw new Error('OpenAI 兼容服务未配置');
        }
        return await this.openaiCompatibleService.chat(messages);
    }

    private async chatWithAnthropic(messages: ChatMessage[]): Promise<string> {
        if (!this.anthropicService) {
            throw new Error('Anthropic 服务未配置');
        }

        // Anthropic API 目前不支持完整的对话历史，只使用最后一条消息
        const lastMessage = messages[messages.length - 1];
        return await this.anthropicService.generateResponse(lastMessage.content);
    }

    private async chatWithOllama(messages: ChatMessage[]): Promise<string> {
        if (!this.ollamaService) {
            throw new Error('Ollama 服务未配置');
        }

        if (!this.settings.ollama?.model) {
            throw new Error('Ollama 模型未配置');
        }

        return await this.ollamaService.chat(
            this.settings.ollama.model,
            messages
        );
    }

    private async chatWithGemini(messages: ChatMessage[]): Promise<string> {
        if (!this.geminiService) {
            throw new Error('Gemini 服务未配置');
        }
        return await this.geminiService.chat(messages);
    }

    private async chatWithSiliconFlow(messages: ChatMessage[]): Promise<string> {
        if (!this.siliconflowService) {
            throw new Error('SiliconFlow 服务未配置');
        }

        try {
            return await this.siliconflowService.chat(messages);
        } catch (error) {
            throw error;
        }
    }

    private async chatWithDeepseek(messages: ChatMessage[]): Promise<string> {
        if (!this.deepseekService) {
            throw new Error('Deepseek 服务未配置');
        }
        return await this.deepseekService.chat(messages);
    }

    private async callOpenAI(prompt: string): Promise<string> {
        return await this.chatWithOpenAI([{ role: 'user', content: prompt }]);
    }

    private async callOpenAICompatible(prompt: string): Promise<string> {
        return await this.chatWithOpenAICompatible([{ role: 'user', content: prompt }]);
    }

    private async callAnthropic(prompt: string): Promise<string> {
        if (!this.anthropicService) {
            throw new Error('Anthropic 服务未配置');
        }
        return await this.anthropicService.generateResponse(prompt);
    }

    private async callOllama(prompt: string): Promise<string> {
        if (!this.ollamaService) {
            throw new Error('Ollama 服务未配置');
        }

        if (!this.settings.ollama?.model) {
            throw new Error('Ollama 模型未配置');
        }

        return await this.ollamaService.generateCompletion(
            this.settings.ollama.model,
            prompt
        );
    }

    private async callGemini(prompt: string): Promise<string> {
        if (!this.geminiService) {
            throw new Error('Gemini 服务未配置');
        }
        return await this.geminiService.generateResponse(prompt);
    }

    private async callSiliconFlow(prompt: string): Promise<string> {
        if (!this.siliconflowService) {
            throw new Error('SiliconFlow 服务未配置');
        }

        try {
            return await this.siliconflowService.chat([{
                role: 'user',
                content: prompt
            }]);
        } catch (error) {
            throw error;
        }
    }

    private async callDeepseek(prompt: string): Promise<string> {
        if (!this.deepseekService) {
            throw new Error('Deepseek 服务未配置');
        }
        return await this.deepseekService.generateResponse(prompt);
    }

    async testConnection(): Promise<boolean> {
        switch (this.settings.provider) {
            case 'openai':
                if (!this.openaiService) return false;
                return await this.openaiService.testConnection();
            case 'openaiCompatible':
                if (!this.openaiCompatibleService) return false;
                return await this.openaiCompatibleService.testConnection();
            case 'anthropic':
                if (!this.anthropicService) return false;
                return await this.anthropicService.testConnection();
            case 'ollama':
                if (!this.ollamaService) return false;
                return await this.ollamaService.testConnection();
            case 'gemini':
                if (!this.geminiService) return false;
                return await this.geminiService.testConnection();
            case 'deepseek':
                if (!this.deepseekService) return false;
                return await this.deepseekService.testConnection();
            case 'siliconflow':
                if (!this.siliconflowService) return false;
                return await this.siliconflowService.testConnection();
            default:
                return false;
        }
    }

    async listOllamaModels(): Promise<string[]> {
        if (!this.ollamaService) {
            throw new Error('Ollama 服务未配置');
        }
        return await this.ollamaService.listModels();
    }

    async listGeminiModels(): Promise<{id: string, name: string}[]> {
        if (!this.geminiService) {
            throw new Error('Gemini 服务未配置');
        }
        return Promise.resolve(DEFAULT_GEMINI_MODELS);
    }

    async listDeepseekModels(): Promise<{id: string, name: string}[]> {
        if (!this.deepseekService) {
            throw new Error('Deepseek 服务未配置');
        }
        return Promise.resolve([
            { id: 'deepseek-chat', name: 'Deepseek Chat' },
            { id: 'deepseek-coder', name: 'Deepseek Coder' }
        ]);
    }

    async listSiliconFlowModels(): Promise<AIModel[]> {
        return DEFAULT_SILICONFLOW_MODELS;
    }

    async listOpenAIModels(): Promise<AIModel[]> {
        const models: AIModel[] = [
            { id: 'gpt-4', name: 'GPT-4', isCustom: false },
            { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', isCustom: false },
            { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', isCustom: false }
        ];

        if (this.settings.openai?.isCustomModel && this.settings.openai?.model) {
            models.push({
                id: this.settings.openai.model,
                name: this.settings.openai.model,
                isCustom: true
            });
        }

        return models;
    }

    // 更新设置
    updateSettings(newSettings: AISettings) {
        this.settings = newSettings;
        this.initializeServices();
    }

    /**
     * 流式聊天方法
     */
    async streamChat(messages: ChatMessage[], options: StreamingOptions): Promise<void> {
        switch (this.settings.provider) {
            case 'openai':
                if (!this.openaiService) throw new Error('OpenAI 服务未配置');
                return await this.openaiService.streamChat?.(messages, options);
            case 'openaiCompatible':
                if (!this.openaiCompatibleService) throw new Error('OpenAI Compatible 服务未配置');
                return await this.openaiCompatibleService.streamChat?.(messages, options);
            case 'ollama':
                if (!this.ollamaService) throw new Error('Ollama 服务未配置');
                return await this.ollamaService.streamChat?.(messages, options);
            case 'anthropic':
                if (!this.anthropicService) throw new Error('Anthropic 服务未配置');
                return await this.anthropicService.streamChat?.(messages, options);
            case 'gemini':
                if (!this.geminiService) throw new Error('Gemini 服务未配置');
                return await this.geminiService.streamChat?.(messages, options);
            case 'deepseek':
                if (!this.deepseekService) throw new Error('Deepseek 服务未配置');
                return await this.deepseekService.streamChat?.(messages, options);
            case 'siliconflow':
                if (!this.siliconflowService) throw new Error('SiliconFlow 服务未配置');
                // SiliconFlow 暂不支持流式输出，降级到普通聊天
                const siliconflowResponse = await this.siliconflowService.chat(messages);
                options.onComplete?.(siliconflowResponse);
                return;
            default:
                throw new Error('AI 服务未配置');
        }
    }

    /**
     * 流式响应生成方法
     */
    async streamResponse(prompt: string, options: StreamingOptions): Promise<void> {
        const messages: ChatMessage[] = [{ role: 'user', content: prompt }];
        return this.streamChat(messages, options);
    }

    /**
     * 检查当前提供者是否支持流式输出
     */
    supportsStreaming(): boolean {
        switch (this.settings.provider) {
            case 'openai':
            case 'openaiCompatible':
            case 'ollama':
            case 'deepseek':
                return true;
            case 'anthropic':
            case 'gemini':
                return true;
            case 'siliconflow':
                return false; // 暂不支持，但会降级到普通聊天
            default:
                return false;
        }
    }
}