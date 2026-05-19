import { requestUrl } from 'obsidian';
import { AIProviderInterface, ChatMessage, AIModel, StreamingOptions } from '../types/AITypes';

export class GeminiService implements AIProviderInterface {
    private apiKey: string;
    private baseUrl: string;
    private model: string;

    constructor(apiKey: string, model: string = 'gemini-pro', baseUrl?: string) {
        this.apiKey = apiKey;
        this.model = model;
        this.baseUrl = baseUrl || 'https://generativelanguage.googleapis.com';
    }

    // 更新当前使用的模型
    updateModel(model: string) {
        this.model = model;
    }

    async generateResponse(prompt: string): Promise<string> {
        try {
            const url = `${this.baseUrl}/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
            const requestBody = {
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    maxOutputTokens: 2048,
                    temperature: 0.7
                }
            };

            const response = await requestUrl({
                url,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (response.status !== 200) {

                throw new Error(`Gemini API error (${response.status}): ${response.text}`);
            }

            const data = response.json;
            if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {

                throw new Error('Invalid response format from Gemini API');
            }

            return data.candidates[0].content.parts[0].text;
        } catch (error) {

            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to generate response from Gemini API');
        }
    }

    async chat(messages: { role: string, content: string }[]): Promise<string> {
        try {
            const url = `${this.baseUrl}/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
            // 将 OpenAI 格式的消息转换为 Gemini 格式
            const contents = messages.map(msg => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            }));

            const requestBody = {
                contents,
                generationConfig: {
                    maxOutputTokens: 2048,
                    temperature: 0.7
                }
            };

            const response = await requestUrl({
                url,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (response.status !== 200) {

                throw new Error(`Gemini Chat API error (${response.status}): ${response.text}`);
            }

            const data = response.json;
            if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {

                throw new Error('Invalid response format from Gemini Chat API');
            }

            return data.candidates[0].content.parts[0].text;
        } catch (error) {

            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to chat with Gemini API');
        }
    }

    async testConnection(): Promise<boolean> {
        try {
            // 首先检查模型信息
            const modelUrl = `${this.baseUrl}/v1beta/models/${this.model}?key=${this.apiKey}`;
            const modelResponse = await requestUrl({
                url: modelUrl,
                method: 'GET'
            });

            if (modelResponse.status !== 200) {
                return false;
            }

            // 然后测试实际生成能力
            const testUrl = `${this.baseUrl}/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
            const testResponse = await requestUrl({
                url: testUrl,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: 'test'
                        }]
                    }],
                    generationConfig: {
                        maxOutputTokens: 1,
                        temperature: 0
                    }
                })
            });

            return testResponse.status === 200;
        } catch (error) {
            console.warn('Gemini connection test failed:', error);
            return false;
        }
    }

    /**
     * 流式聊天方法
     */
    async streamChat(messages: ChatMessage[], options: StreamingOptions): Promise<void> {
        try {
            const contents = messages.map(msg => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            }));

            const response = await fetch(`${this.baseUrl}/v1beta/models/${this.model}:streamGenerateContent?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: contents,
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 4096
                    }
                }),
                signal: options.signal
            });

            if (!response.ok) {
                throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('Failed to get response reader');
            }

            const decoder = new TextDecoder();
            let fullResponse = '';

            while (true) {
                const { done, value } = await reader.read();

                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n').filter(line => line.trim());

                for (const line of lines) {
                    try {
                        const parsed = JSON.parse(line);
                        if (parsed.candidates && parsed.candidates[0]?.content?.parts) {
                            const parts = parsed.candidates[0].content.parts;
                            for (const part of parts) {
                                if (part.text) {
                                    const token = part.text;
                                    fullResponse += token;
                                    options.onToken?.(token);
                                }
                            }
                        }
                    } catch (parseError) {
                        // 忽略解析错误，继续处理下一行
                        console.debug('Failed to parse Gemini streaming response line:', line);
                    }
                }
            }

            options.onComplete?.(fullResponse);
        } catch (error) {
            console.error('Gemini streaming error:', error);
            options.onError?.(error as Error);
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
