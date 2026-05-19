export type AIProvider = 'openai' | 'openaiCompatible' | 'anthropic' | 'gemini' | 'ollama' | 'deepseek' | 'siliconflow';
export type OpenAIModel = 'gpt-4o' | 'gpt-4o-mini';
export type AnthropicModel = 'claude-3-opus-20240229' | 'claude-3-sonnet-20240229' | 'claude-3-haiku-20240307' | 'claude-2' | 'claude-instant-1';

export interface AIModel {
    id: string;
    name: string;
    isCustom?: boolean;
}

export interface DeepseekModel extends AIModel {}

export interface DeepseekModelState {
    selectedModel: DeepseekModel;
    apiKey: string;
}

export const DEFAULT_DEEPSEEK_MODELS: DeepseekModel[] = [
    { id: 'deepseek-chat', name: 'Deepseek Chat' },
    { id: 'deepseek-reasoner', name: 'Deepseek Reasoner' }
];

export interface GeminiModel extends AIModel {}

export interface GeminiModelState {
    selectedModel: GeminiModel;
    apiKey: string;
}

export const DEFAULT_GEMINI_MODELS: GeminiModel[] = [
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
    { id: 'gemini-2.0-flash-lite-preview-02-05', name: 'Gemini 2.0 Flash Lite' }
];

export const DEFAULT_SILICONFLOW_MODELS: AIModel[] = [
    { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek V3', isCustom: false },
    { id: 'Qwen/Qwen2.5-7B-Instruct', name: 'Qwen2.5 7B', isCustom: false },
    { id: 'Qwen/Qwen2.5-14B-Instruct', name: 'Qwen2.5 14B', isCustom: false },
    { id: 'Pro/Qwen/Qwen2-7B-Instruct', name: 'Qwen2 7B', isCustom: false },
    { id: 'Pro/THUDM/glm-4-9b-chat', name: 'GLM-4 9B', isCustom: false },
    { id: 'google/gemma-2-9b-it', name: 'Gemma2 9B', isCustom: false },
];

export interface AISettings {
    provider: AIProvider;
    openai?: {
        apiKey: string;
        model: string;
        baseUrl?: string;
        isCustomModel?: boolean;
        lastCustomModel?: string;
    };
    siliconflow?: {
        apiKey: string;
        model: string;
        baseUrl?: string;
        isCustomModel?: boolean;
        lastCustomModel?: string;
    };
    anthropic?: {
        apiKey: string;
        model: string;
        availableModels?: string[];
        apiAddress?: string;
        isCustomModel?: boolean;
        lastCustomModel?: string;
    };
    openaiCompatible?: {
        apiKey: string;
        model: string;
        apiAddress?: string;
        isCustomModel?: boolean;
        lastCustomModel?: string;
    };
    ollama?: {
        host: string;
        model: string;
        availableModels?: string[];
    };
    gemini?: {
        apiKey: string;
        model: string;
        baseUrl?: string;
        isCustomModel?: boolean;
    };
    deepseek?: {
        apiKey: string;
        model: string;
        baseUrl?: string;
        isCustomModel?: boolean;
        lastCustomModel?: string;
    };
    prompts: {
        [key: string]: string;
    };
    savePath?: string; // AI 生成文件的保存路径
}

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface StreamingOptions {
    onToken?: (token: string) => void;
    onComplete?: (fullResponse: string) => void;
    onError?: (error: Error) => void;
    signal?: AbortSignal;
}

export interface PromptTemplate {
    id: string;
    name: string;
    template: string;
    category?: string;
    variables: string[];
}

export interface MindmapNodeContext {
    nodeId: string;
    content: string;
    level: number;
    parentContent?: string;
    siblings?: string[];
}

export interface ContextMenuContext {
    selectedText: string;
    fullContent: string;
    filePath: string;
    cursorPosition: number;
}

export interface AIProcessingResult {
    success: boolean;
    content?: string;
    error?: string;
    metadata?: Record<string, any>;
}

export interface AIProviderInterface {
    generateResponse(prompt: string): Promise<string>;
    chat(messages: ChatMessage[]): Promise<string>;
    streamChat?(messages: ChatMessage[], options: StreamingOptions): Promise<void>;
    streamResponse?(prompt: string, options: StreamingOptions): Promise<void>;
    testConnection(): Promise<boolean>;
    listModels?(): Promise<AIModel[]>;
}