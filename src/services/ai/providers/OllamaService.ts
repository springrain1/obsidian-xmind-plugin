import { requestUrl, Notice } from 'obsidian';
import { AIProviderInterface, ChatMessage, AIModel, StreamingOptions } from '../types/AITypes';

interface OllamaResponse {
    response: string;
    error?: string;
}

interface OllamaModel {
    name: string;
    modified_at: string;
    size: number;
}

interface OllamaModelsResponse {
    models: OllamaModel[];
}

interface OllamaVersionResponse {
    version: string;
}

export class OllamaService implements AIProviderInterface {
    private retryAttempts = 3;
    private retryDelay = 1000; // ms
    private baseUrl: string;

    constructor(host: string = 'http://localhost:11434') {
        // Ensure the host has a protocol and normalize the URL
        if (!host.startsWith('http://') && !host.startsWith('https://')) {
            host = 'http://' + host;
        }
        // Remove trailing slash if present
        this.baseUrl = host.replace(/\/$/, '');
    }

    async listModels(): Promise<string[]> {
        try {
            await this.ensureConnection();

            const response = await this.makeRequest({
                endpoint: '/api/tags',
                method: 'GET'
            }) as OllamaModelsResponse;

            if (!response || !response.models) {
                throw new Error('Invalid API response format');
            }

            return response.models.map((model: OllamaModel) => model.name);
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async generateCompletion(model: string, prompt: string): Promise<string> {
        try {
            await this.ensureConnection();

            const response = await this.makeRequest({
                endpoint: '/api/generate',
                method: 'POST',
                body: JSON.stringify({
                    model,
                    prompt,
                    stream: false
                })
            });

            if (!response || !response.response) {
                throw new Error('Invalid API response format');
            }

            return response.response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async pullModel(modelName: string): Promise<void> {
        try {
            new Notice(`Downloading model ${modelName}...`);
            const response = await this.makeRequest({
                endpoint: '/api/pull',
                method: 'POST',
                body: JSON.stringify({
                    name: modelName
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to download model: ${response.status}`);
            }

            new Notice(`Model ${modelName} downloaded successfully`);
        } catch (error) {
            throw new Error(`Failed to download model: ${error.message}`);
        }
    }

    async chat(model: string, messages: { role: string, content: string }[]): Promise<string> {
        try {
            await this.ensureConnection();

            const response = await this.makeRequest({
                endpoint: '/api/chat',
                method: 'POST',
                body: JSON.stringify({
                    model,
                    messages,
                    stream: false
                })
            });

            if (!response || !response.message?.content) {
                throw new Error('Invalid API response format');
            }

            return response.message.content;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    private async ensureConnection(): Promise<void> {
        if (!this.baseUrl) {
            throw new Error('Ollama service not configured. Please set the host in settings.');
        }
        const isConnected = await this.testConnection();
        if (!isConnected) {
            throw new Error('Unable to connect to Ollama service. Please ensure the service is running.');
        }
    }

    async testConnection(): Promise<boolean> {
        if (!this.baseUrl) {
            return false;
        }

        try {
            // 首先测试服务连接
            const versionResponse = await this.makeRequest({
                endpoint: '/api/version',
                method: 'GET'
            });

            if (!versionResponse?.version) {
                return false;
            }

            // 然后测试模型可用性
            if (this.model) {
                const testResponse = await this.makeRequest({
                    endpoint: '/api/generate',
                    method: 'POST',
                    body: {
                        model: this.model,
                        prompt: 'test',
                        stream: false,
                        options: {
                            num_predict: 1,
                            temperature: 0
                        }
                    }
                });

                return !!testResponse;
            }

            return true;
        } catch (error) {
            console.warn('Ollama connection test failed:', error);
            return false;
        }
    }

    private async makeRequest(params: {
        endpoint: string;
        method: string;
        body?: string;
    }): Promise<any> {
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                const url = new URL(params.endpoint, this.baseUrl).toString();
                
                const response = await requestUrl({
                    url,
                    method: params.method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: params.body,
                    throw: false
                });

                if (response.status === 200) {
                    try {
                        // Some Ollama endpoints might return empty responses
                        if (!response.text) {
                            return {};
                        }

                        // Try to parse as JSON
                        const jsonResponse = JSON.parse(response.text);
                        return jsonResponse;
                    } catch (e) {
                        throw new Error('Invalid JSON response from server');
                    }
                }

                // Handle non-200 responses
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorJson = JSON.parse(response.text);
                    if (errorJson.error) {
                        errorMessage = errorJson.error;
                    }
                } catch (e) {
                    // If we can't parse the error as JSON, use the raw text
                    if (response.text) {
                        errorMessage = response.text;
                    }
                }
                throw new Error(errorMessage);
            } catch (error) {
                lastError = error;
                if (attempt < this.retryAttempts) {
                    await this.delay(this.retryDelay * attempt);
                    continue;
                }
                break;
            }
        }

        throw lastError;
    }

    private handleError(error: any): Error {
        if (error.message.includes('ECONNREFUSED')) {
            new Notice('Ollama service is not running. Please start the service.');
            return new Error('Unable to connect to Ollama service. Please ensure the service is running.');
        }
        if (error instanceof TypeError && error.message.includes('Invalid URL')) {
            return new Error(`Invalid Ollama service URL: ${this.baseUrl}`);
        }
        return error;
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 流式聊天方法
     */
    async streamChat(messages: ChatMessage[], options: StreamingOptions): Promise<void> {
        try {
            await this.ensureConnection();

            const response = await fetch(`${this.baseUrl}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'llama2', // 默认模型，应该从外部传入
                    messages,
                    stream: true
                }),
                signal: options.signal
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
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
                    const lines = chunk.split('\n').filter(line => line.trim());

                    for (const line of lines) {
                        try {
                            const data = JSON.parse(line);
                            if (data.message?.content) {
                                const token = data.message.content;
                                fullResponse += token;
                                options.onToken?.(token);
                            }

                            if (data.done) {
                                options.onComplete?.(fullResponse);
                                return;
                            }
                        } catch (parseError) {
                            // 忽略解析错误，继续处理下一行
                            console.debug('Failed to parse streaming response line:', line);
                        }
                    }
                }

                options.onComplete?.(fullResponse);
            } finally {
                reader.releaseLock();
            }
        } catch (error) {
            const handledError = this.handleError(error);
            options.onError?.(handledError);
            throw handledError;
        }
    }

    /**
     * 流式响应生成方法
     */
    async streamResponse(prompt: string, options: StreamingOptions): Promise<void> {
        try {
            await this.ensureConnection();

            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'llama2', // 默认模型，应该从外部传入
                    prompt,
                    stream: true
                }),
                signal: options.signal
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
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
                    const lines = chunk.split('\n').filter(line => line.trim());

                    for (const line of lines) {
                        try {
                            const data = JSON.parse(line);
                            if (data.response) {
                                const token = data.response;
                                fullResponse += token;
                                options.onToken?.(token);
                            }

                            if (data.done) {
                                options.onComplete?.(fullResponse);
                                return;
                            }
                        } catch (parseError) {
                            // 忽略解析错误，继续处理下一行
                            console.debug('Failed to parse streaming response line:', line);
                        }
                    }
                }

                options.onComplete?.(fullResponse);
            } finally {
                reader.releaseLock();
            }
        } catch (error) {
            const handledError = this.handleError(error);
            options.onError?.(handledError);
            throw handledError;
        }
    }
}