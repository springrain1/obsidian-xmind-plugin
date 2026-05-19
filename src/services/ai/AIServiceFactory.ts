import { AIService } from './AIService';
import { AISettings, AIProvider } from './types/AITypes';
import { OllamaService } from './providers/OllamaService';
import { GeminiService } from './providers/GeminiService';
import { DeepseekService } from './providers/DeepseekService';
import { AnthropicService } from './providers/AnthropicService';
import { SiliconFlowService } from './providers/SiliconFlowService';
import { OpenAIService } from './providers/OpenAIService';

export class AIServiceFactory {
    private static instance: AIServiceFactory;
    private aiService: AIService | null = null;
    private serviceRegistry: Map<AIProvider, any> = new Map();

    private constructor() {}

    static getInstance(): AIServiceFactory {
        if (!AIServiceFactory.instance) {
            AIServiceFactory.instance = new AIServiceFactory();
        }
        return AIServiceFactory.instance;
    }

    createAIService(settings: AISettings): AIService {
        if (this.aiService) {
            this.aiService.updateSettings(settings);
            return this.aiService;
        }

        this.aiService = new AIService(settings);
        return this.aiService;
    }

    getAIService(): AIService | null {
        return this.aiService;
    }

    // 注册服务提供者
    registerProvider(provider: AIProvider, serviceClass: any) {
        this.serviceRegistry.set(provider, serviceClass);
    }

    // 获取服务提供者
    getProvider(provider: AIProvider): any {
        return this.serviceRegistry.get(provider);
    }

    // 初始化默认服务提供者
    initializeDefaultProviders() {
        this.registerProvider('ollama', OllamaService);
        this.registerProvider('gemini', GeminiService);
        this.registerProvider('deepseek', DeepseekService);
        this.registerProvider('anthropic', AnthropicService);
        this.registerProvider('siliconflow', SiliconFlowService);
        this.registerProvider('openai', OpenAIService);
    }

    // 清理资源
    cleanup() {
        this.aiService = null;
        this.serviceRegistry.clear();
    }

    // 检查服务是否可用
    isServiceAvailable(provider: AIProvider, settings: AISettings): boolean {
        switch (provider) {
            case 'ollama':
                return !!(settings.ollama?.host);
            case 'gemini':
                return !!(settings.gemini?.apiKey);
            case 'deepseek':
                return !!(settings.deepseek?.apiKey);
            case 'anthropic':
                return !!(settings.anthropic?.apiKey);
            case 'siliconflow':
                return !!(settings.siliconflow?.apiKey);
            case 'openai':
                return !!(settings.openai?.apiKey);
            default:
                return false;
        }
    }

    // 获取可用的服务提供者列表
    getAvailableProviders(settings: AISettings): AIProvider[] {
        const providers: AIProvider[] = ['ollama', 'gemini', 'deepseek', 'anthropic', 'siliconflow', 'openai'];
        return providers.filter(provider => this.isServiceAvailable(provider, settings));
    }
}