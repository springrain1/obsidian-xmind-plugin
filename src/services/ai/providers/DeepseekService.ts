import { requestUrl } from 'obsidian';
import { AIProviderInterface, ChatMessage, AIModel, StreamingOptions } from '../types/AITypes';

export class DeepseekService implements AIProviderInterface {
    private baseUrl: string;
    private model: string;

    constructor(
        private apiKey: string,
        model: string = 'deepseek-chat',
        baseUrl?: string
    ) {
        this.model = model;
        this.baseUrl = baseUrl || 'https://api.deepseek.com/v1';
    }

    // 更新当前使用的模型
    updateModel(model: string) {
        this.model = model;
    }

    async generateResponse(prompt: string): Promise<string> {
        const messages = [
            { role: 'user', content: prompt }
        ];
        return await this.chat(messages);
    }

    async chat(messages: { role: string, content: string }[]): Promise<string> {
        try {
            const response = await requestUrl({
                url: `${this.baseUrl}/chat/completions`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 4096,
                    frequency_penalty: 0,
                    presence_penalty: 0
                })
            });

            if (response.status !== 200) {

                throw new Error(`Deepseek API error (${response.status}): ${response.text}`);
            }

            const data = response.json;
            if (!data.choices?.[0]?.message?.content) {

                throw new Error('Invalid response format from Deepseek API');
            }

            return data.choices[0].message.content;
        } catch (error) {

            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to generate response from Deepseek API');
        }
    }

    async testConnection(): Promise<boolean> {
        try {
            // 使用一个简单的测试消息来验证连接
            const response = await requestUrl({
                url: `${this.baseUrl}/chat/completions`,
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [{ role: 'user', content: 'test' }],
                    max_tokens: 10
                })
            });

            return response.status === 200;
        } catch (error) {

            return false;
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
                    messages: messages.map(msg => ({
                        role: msg.role,
                        content: msg.content
                    })),
                    stream: true
                }),
                signal: options.signal
            });

            if (!response.ok) {
                throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
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
                            console.debug('Failed to parse DeepSeek streaming response line:', data);
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

    async listModels(): Promise<AIModel[]> {
        // DeepSeek 的默认模型列表
        return [
            { id: 'deepseek-chat', name: 'DeepSeek Chat', isCustom: false },
            { id: 'deepseek-coder', name: 'DeepSeek Coder', isCustom: false },
            { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', isCustom: false }
        ];
    }
}
