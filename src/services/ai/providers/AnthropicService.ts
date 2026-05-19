import { requestUrl } from 'obsidian';
import { AIProviderInterface, ChatMessage, AIModel, StreamingOptions } from '../types/AITypes';

export class AnthropicService implements AIProviderInterface {
    private apiKey: string;
    private apiAddress: string;
    private model: string;

    constructor(apiKey: string, apiAddress?: string, model?: string) {
        this.apiKey = apiKey;
        this.apiAddress = apiAddress || 'https://api.anthropic.com';
        this.model = model || 'claude-3-opus-20240229'; // 默认使用最新模型
    }

    async generateResponse(prompt: string): Promise<string> {
        try {
            const response = await requestUrl({
                url: `${this.apiAddress}/v1/messages`,
                method: 'POST',
                headers: {
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.model,
                    max_tokens: 4096,
                    messages: [{
                        role: 'user',
                        content: prompt
                    }]
                })
            });

            if (response.status !== 200) {
                throw new Error(`Anthropic API error: ${response.text}`);
            }

            const data = response.json;
            return data.content[0].text;
        } catch (error) {

            throw new Error('Failed to generate response from Anthropic API');
        }
    }

    async testConnection(): Promise<boolean> {
        try {
            const response = await requestUrl({
                url: `${this.apiAddress}/v1/messages`,
                method: 'POST',
                headers: {
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.model,
                    max_tokens: 1,
                    messages: [{
                        role: 'user',
                        content: 'Hi'
                    }]
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
            const response = await fetch(`${this.apiAddress}/v1/messages`, {
                method: 'POST',
                headers: {
                    'x-api-key': this.apiKey,
                    'Content-Type': 'application/json',
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: this.model,
                    max_tokens: 4096,
                    messages: messages,
                    stream: true
                }),
                signal: options.signal
            });

            if (!response.ok) {
                throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
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
                const lines = chunk.split('\n').filter(line => line.trim() && line.startsWith('data: '));

                for (const line of lines) {
                    const data = line.replace('data: ', '');

                    if (data === '[DONE]') {
                        break;
                    }

                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                            const token = parsed.delta.text;
                            fullResponse += token;
                            options.onToken?.(token);
                        }
                    } catch (parseError) {
                        // 忽略解析错误，继续处理下一行
                        console.debug('Failed to parse Anthropic streaming response line:', data);
                    }
                }
            }

            options.onComplete?.(fullResponse);
        } catch (error) {
            console.error('Anthropic streaming error:', error);
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
