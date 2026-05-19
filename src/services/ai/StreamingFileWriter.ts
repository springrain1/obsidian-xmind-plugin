import { App, TFile, Notice } from 'obsidian';

export interface StreamingFileWriterOptions {
    app: App;
    fileName: string;
    sourceFile?: TFile;
    analysisType: string;
    savePath?: string;
    onProgress?: (writtenChars: number) => void;
    onComplete?: (file: TFile) => void;
    onError?: (error: Error) => void;
}

export class StreamingFileWriter {
    private app: App;
    private fileName: string;
    private sourceFile?: TFile;
    private analysisType: string;
    private savePath: string;
    private onProgress?: (writtenChars: number) => void;
    private onComplete?: (file: TFile) => void;
    private onError?: (error: Error) => void;
    
    private file?: TFile;
    private content: string = '';
    private isWriting: boolean = false;
    private writeQueue: string[] = [];
    private currentNotice?: Notice;

    constructor(options: StreamingFileWriterOptions) {
        this.app = options.app;
        this.fileName = options.fileName;
        this.sourceFile = options.sourceFile;
        this.analysisType = options.analysisType;
        this.savePath = options.savePath || '';
        this.onProgress = options.onProgress;
        this.onComplete = options.onComplete;
        this.onError = options.onError;
    }

    async initialize(): Promise<void> {
        try {
            // 生成唯一文件名，避免冲突
            const uniqueFileName = await this.generateUniqueFileName();
            const filePath = this.savePath ? `${this.savePath}/${uniqueFileName}` : uniqueFileName;

            // 创建 YAML front matter
            const frontMatter = this.generateFrontMatter();

            // 创建文件
            this.file = await this.app.vault.create(filePath, frontMatter);
            this.content = frontMatter;

            // 自动打开新创建的文件，让用户可以看到流式输出过程
            const leaf = this.app.workspace.getUnpinnedLeaf();
            if (leaf) {
                await leaf.openFile(this.file);
            }

            // 显示进度通知
            this.currentNotice = new Notice(`正在生成 ${this.analysisType}...`, 0);

        } catch (error) {
            this.onError?.(error as Error);
            throw error;
        }
    }

    private generateFrontMatter(): string {
        const now = new Date();
        const timestamp = now.toLocaleString('zh-CN');

        let frontMatter = '---\n';
        if (this.sourceFile) {
            frontMatter += `原文件: "[[${this.sourceFile.basename}]]"\n`;
        }
        frontMatter += `分析时间: "${timestamp}"\n`;
        frontMatter += '---\n\n';

        return frontMatter;
    }

    private async generateUniqueFileName(): Promise<string> {
        const baseName = this.fileName;
        let counter = 0;
        let fileName = `${baseName}.md`;

        // 检查文件是否存在，如果存在则添加数字后缀
        // 需要考虑完整的文件路径
        let fullPath = this.savePath ? `${this.savePath}/${fileName}` : fileName;

        while (await this.app.vault.adapter.exists(fullPath)) {
            counter++;
            fileName = `${baseName}_${counter}.md`;
            fullPath = this.savePath ? `${this.savePath}/${fileName}` : fileName;
        }

        return fileName;
    }

    async writeToken(token: string): Promise<void> {
        if (!this.file) {
            throw new Error('File not initialized');
        }

        this.writeQueue.push(token);
        
        if (!this.isWriting) {
            this.processWriteQueue();
        }
    }

    private async processWriteQueue(): Promise<void> {
        if (this.isWriting || this.writeQueue.length === 0) {
            return;
        }

        this.isWriting = true;

        try {
            // 批量处理队列中的 tokens，提高性能
            const tokensToWrite = this.writeQueue.splice(0, Math.min(10, this.writeQueue.length));
            const newContent = tokensToWrite.join('');
            
            this.content += newContent;
            
            // 更新文件内容
            await this.app.vault.modify(this.file!, this.content);
            
            // 更新进度
            this.onProgress?.(this.content.length);
            
            // 更新通知
            if (this.currentNotice) {
                this.currentNotice.hide();
                this.currentNotice = new Notice(
                    `正在生成 ${this.analysisType}... (${this.content.length - this.generateFrontMatter().length} 字符)`, 
                    0
                );
            }
            
        } catch (error) {
            this.onError?.(error as Error);
        } finally {
            this.isWriting = false;
            
            // 继续处理剩余的队列
            if (this.writeQueue.length > 0) {
                setTimeout(() => this.processWriteQueue(), 50); // 50ms 延迟，模拟打字机效果
            }
        }
    }

    async complete(): Promise<void> {
        // 等待所有写入完成
        while (this.writeQueue.length > 0 || this.isWriting) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (this.currentNotice) {
            this.currentNotice.hide();
        }

        if (this.file) {
            // 在源文件中添加嵌入链接
            if (this.sourceFile) {
                await this.addEmbedLinkToSource();
            }
            
            new Notice(`${this.analysisType}完成，已保存到 ${this.file.name}`);
            this.onComplete?.(this.file);
        }
    }

    private async addEmbedLinkToSource(): Promise<void> {
        if (!this.sourceFile || !this.file) return;

        try {
            const sourceContent = await this.app.vault.read(this.sourceFile);
            const embedLink = `\n\n![[${this.file.basename}]]\n`;
            const newContent = sourceContent + embedLink;
            
            await this.app.vault.modify(this.sourceFile, newContent);
        } catch (error) {
            console.warn('Failed to add embed link to source file:', error);
        }
    }

    async abort(): Promise<void> {
        this.writeQueue = [];
        
        if (this.currentNotice) {
            this.currentNotice.hide();
        }
        
        if (this.file) {
            try {
                await this.app.vault.delete(this.file);
            } catch (error) {
                console.warn('Failed to delete aborted file:', error);
            }
        }
        
        new Notice(`${this.analysisType}已取消`);
    }

    getFile(): TFile | undefined {
        return this.file;
    }

    getWrittenLength(): number {
        return this.content.length - this.generateFrontMatter().length;
    }
}
