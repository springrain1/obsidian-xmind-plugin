import { requestUrl } from 'obsidian';
import { AIProviderInterface, ChatMessage, AIModel, StreamingOptions } from '../types/AITypes';

export class OpenAIService implements AIProviderInterface {
    private apiKey: string;
    private baseUrl: string;
    private model: string;

    constructor(apiKey: string, model: string = 'gpt-4o', baseUrl?: string) {
        this.apiKey = apiKey;
        this.model = model;
        this.baseUrl = baseUrl || 'https://api.openai.com/v1';
    }

    // 更新当前使用的模型
    updateModel(model: string) {
        this.model = model;
    }

    async generateResponse(prompt: string): Promise<string> {
        const messages = [
            { role: 'user' as const, content: prompt }
        ];
        return await this.chat(messages);
    }

    async chat(messages: ChatMessage[]): Promise<string> {
        try {
            // 构建请求体
            const requestBody: any = {
                model: this.model,
                messages: messages,
                temperature: 0.7,
                max_tokens: 4096
            };

            // 为特定模型添加enable_thinking参数
            if (this.shouldEnableThinking()) {
                requestBody.enable_thinking = false;
            }

            const response = await requestUrl({
                url: `${this.baseUrl}/chat/completions`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(requestBody)
            });

            if (response.status !== 200) {
                throw new Error(`OpenAI API 错误 (${response.status}): ${response.text}`);
            }

            const data = response.json;
            if (!data.choices?.[0]?.message?.content) {
                throw new Error('OpenAI API 返回无效的响应格式');
            }

            return data.choices[0].message.content;
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('从 OpenAI API 生成响应失败');
        }
    }

    /**
     * 判断是否应该启用thinking模式
     * 对于特定模型（如包含free:前缀的模型），默认禁用thinking以提高响应速度
     */
    private shouldEnableThinking(): boolean {
        // 检查模型ID是否包含需要快速响应的标识
        const fastResponseModels = [
            'free:', // free:Qwen3-30B-A3B等免费模型
            'qwen', // Qwen系列模型
            'deepseek', // DeepSeek系列模型
        ];

        const modelLower = this.model.toLowerCase();
        return fastResponseModels.some(prefix => modelLower.includes(prefix));
    }

    async testConnection(): Promise<boolean> {
        try {
            // 首先测试API连接
            const modelsResponse = await requestUrl({
                url: `${this.baseUrl}/models`,
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });

            if (modelsResponse.status !== 200) {
                return false;
            }

            // 然后测试模型可用性 - 发送一个简单的测试请求
            const testResponse = await requestUrl({
                url: `${this.baseUrl}/chat/completions`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [{ role: 'user', content: 'test' }],
                    max_tokens: 1,
                    temperature: 0
                })
            });

            return testResponse.status === 200;
        } catch (error) {
            console.warn('OpenAI connection test failed:', error);
            return false;
        }
    }

    async listModels(): Promise<AIModel[]> {
        try {
            const response = await requestUrl({
                url: `${this.baseUrl}/models`,
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });

            if (response.status !== 200) {
                throw new Error(`获取模型列表失败: ${response.text}`);
            }

            const data = response.json;
            const chatModels = data.data.filter((model: any) => 
                model.id.includes('gpt') && !model.id.includes('instruct')
            );

            return chatModels.map((model: any) => ({
                id: model.id,
                name: model.id,
                isCustom: false
            }));
        } catch (error) {
            // 返回默认模型列表作为后备
            return [
                { id: 'gpt-4o', name: 'GPT-4o', isCustom: false },
                { id: 'gpt-4o-mini', name: 'GPT-4o Mini', isCustom: false },
                { id: 'gpt-4', name: 'GPT-4', isCustom: false },
                { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', isCustom: false },
                { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', isCustom: false }
            ];
        }
    }

    /**
     * 流式聊天方法
     */
    async streamChat(messages: ChatMessage[], options: StreamingOptions): Promise<void> {
        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages,
                    stream: true
                }),
                signal: options.signal
            });

            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('Failed to get response reader');
            }

            const decoder = new TextDecoder();
            let fullResponse = '';

            try {
                while (true) {
                    const { done, value } = await reader.read();

                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n').filter(line => line.trim() && line.startsWith('data: '));

                    for (const line of lines) {
                        const data = line.replace('data: ', '');

                        if (data === '[DONE]') {
                            options.onComplete?.(fullResponse);
                            return;
                        }

                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices?.[0]?.delta?.content;

                            if (content) {
                                fullResponse += content;
                                options.onToken?.(content);
                            }
                        } catch (parseError) {
                            // 忽略解析错误，继续处理下一行
                            console.debug('Failed to parse streaming response line:', data);
                        }
                    }
                }

                options.onComplete?.(fullResponse);
            } finally {
                reader.releaseLock();
            }
        } catch (error) {
            options.onError?.(error as Error);
            throw error;
        }
    }

    /**
     * 流式响应生成方法
     */
    async streamResponse(prompt: string, options: StreamingOptions): Promise<void> {
        const messages: ChatMessage[] = [{ role: 'user', content: prompt }];
        return this.streamChat(messages, options);
    }
}