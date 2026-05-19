import { App, Notice, TFile, FileSystemAdapter, EventRef } from 'obsidian';
import * as path from 'path';
import XMindPlugin from './main';
import { convertMarkdownToXMind } from './md-to-xmind';
import { convertXMindToMarkdown } from './xmind-to-md';
import { createDebugLogger, DebugLogger } from './debug-logger';

/**
 * 文件同步管理器类
 * 用于实现XMind和Markdown文件之间的自动同步功能
 */
export class FileSyncManager {
    plugin: XMindPlugin;
    private logger: DebugLogger;

    // 最近处理的文件，用于防止递归触发
    private recentlySyncedFiles: Map<string, number> = new Map(); // 修改为Map，记录时间戳
    private fileEventRefs: EventRef[] = [];
    private SYNC_MARK_TIMEOUT: number = 3000; // 从10秒改为3秒，减少等待时间

    constructor(plugin: XMindPlugin) {
        this.plugin = plugin;
        this.logger = createDebugLogger(plugin);
        this.logger.info('初始化文件同步管理器');
    }
    
    /**
     * 初始化文件同步监听
     */
    async initialize(): Promise<void> {
        try {
            // 检查插件是否启用了文件同步功能
            if (!this.plugin.settings.enableFileSync) {
                this.logger.info('文件同步功能已禁用');
                return;
            }
            
            // 清理可能已存在的事件引用
            this.fileEventRefs = [];
            
            // 注册文件修改事件监听
            // @ts-ignore - 忽略TypeScript的类型错误，vault.on方法确实存在
            const modifyEventRef = this.plugin.app.vault.on('modify', async (file: any) => {
                if (file instanceof TFile) {
                    await this.handleFileModified(file);
                }
            });
            this.plugin.registerEvent(modifyEventRef);
            this.fileEventRefs.push(modifyEventRef);
            
            // 注册文件创建事件监听
            // @ts-ignore - 忽略TypeScript的类型错误，vault.on方法确实存在
            const createEventRef = this.plugin.app.vault.on('create', async (file: any) => {
                if (file instanceof TFile) {
                    await this.handleFileCreated(file);
                }
            });
            this.plugin.registerEvent(createEventRef);
            this.fileEventRefs.push(createEventRef);
            
            this.logger.success('文件同步事件监听器已成功注册');
        } catch (error) {
            this.logger.error('注册文件同步事件监听器失败', error);
        }
    }
    
    /**
     * 检查文件是否在需要同步的文件夹内
     * @param filePath 文件路径
     * @returns 是否需要同步
     */
    isInSyncFolders(filePath: string): boolean {
        // 如果同步模式为全库，直接返回true
        if (this.plugin.settings.syncMode === 'all') {
            return true;
        }
        
        // 检查文件是否在指定的同步文件夹内
        const folders = this.plugin.settings.syncFolders || [];
        if (folders.length === 0) {
            return false; // 如果没有指定任何文件夹，不同步
        }
        
        // 标准化文件路径
        const normalizedFilePath = filePath.replace(/\\/g, '/');
        
        // 检查文件路径是否在任一指定文件夹内
        for (const folder of folders) {
            // 标准化文件夹路径并去除空白
            const normalizedFolder = folder.trim().replace(/\\/g, '/');
            if (!normalizedFolder) continue;
            
            // 标准化路径比较 - 直接比较开头而不是全路径
            // 这样可以匹配子文件夹中的文件
            if (normalizedFilePath === normalizedFolder || 
                normalizedFilePath.startsWith(normalizedFolder + '/')) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * 处理文件修改事件
     * @param file 被修改的文件
     */
    async handleFileModified(file: TFile): Promise<void> {
        // 检查插件是否启用了文件同步功能
        if (!this.plugin.settings.enableFileSync) {
            return;
        }
        
        // 如果文件扩展名既不是md也不是xmind，忽略
        if (file.extension !== 'md' && file.extension !== 'xmind') {
            return;
        }
        
        // 检查该文件是否在需要同步的文件夹内
        if (!this.isInSyncFolders(file.path)) {
            return;
        }
        
        // 获取文件基本信息用于跟踪
        const fileKey = this.getFileKey(file);
        
        // 检查该文件是否最近已被同步过，防止递归触发
        const now = Date.now();
        const lastSyncTime = this.recentlySyncedFiles.get(fileKey);
        
        if (lastSyncTime && (now - lastSyncTime < this.SYNC_MARK_TIMEOUT)) {
            this.logger.log(`文件 ${file.path} (key: ${fileKey}) 最近已同步过，跳过`);
            return;
        }
        
        try {
            // 清除可能存在的旧同步标记
            this.clearSyncMark(fileKey);
            
            this.logger.log(`处理文件修改事件: ${file.path} (${file.extension}) [key: ${fileKey}]`);
            
            // 查找对应的另一种类型文件
            const pairedFile = await this.findPairedFile(file);
            
            if (!pairedFile) {
                this.logger.log(`未找到文件 ${file.path} 的配对文件，无法进行同步`);
                return;
            }

            this.logger.log(`找到配对文件: ${pairedFile.path} (${pairedFile.extension})`);
            
            // 获取文件状态
            // @ts-ignore - 忽略TypeScript的类型错误
            const adapter = this.plugin.app.vault.adapter;
            let sourceFileTime = 0;
            let targetFileTime = 0;
            
            try {
                // 尝试获取源文件修改时间
                try {
                    // @ts-ignore - 忽略TypeScript的类型错误
                    if (file.stat && typeof file.stat.mtime === 'number') {
                        // @ts-ignore - 忽略TypeScript的类型错误
                        sourceFileTime = file.stat.mtime;
                        this.logger.log(`通过TFile.stat获取源文件时间: ${new Date(sourceFileTime).toLocaleString()}`);
                    }
                } catch (e) {
                    this.logger.warn('通过TFile.stat获取源文件时间失败:', e);
                }
                
                if (sourceFileTime === 0) {
                    // 如果直接获取失败，尝试从adapter获取
                    try {
                        // @ts-ignore - 忽略TypeScript的类型错误
                        const sourceStat = await adapter.stat(file.path);
                        if (sourceStat && typeof sourceStat.mtime === 'number') {
                            sourceFileTime = sourceStat.mtime;
                            this.logger.log(`通过adapter获取源文件时间: ${new Date(sourceFileTime).toLocaleString()}`);
                        }
                    } catch (e) {
                        console.warn('通过adapter获取源文件时间失败:', e);
                    }
                }
                
                // 尝试获取目标文件修改时间
                try {
                    // @ts-ignore - 忽略TypeScript的类型错误
                    if (pairedFile.stat && typeof pairedFile.stat.mtime === 'number') {
                        // @ts-ignore - 忽略TypeScript的类型错误
                        targetFileTime = pairedFile.stat.mtime;
                        console.log(`通过TFile.stat获取目标文件时间: ${new Date(targetFileTime).toLocaleString()}`);
                    }
                } catch (e) {
                    console.warn('通过TFile.stat获取目标文件时间失败:', e);
                }
                
                if (targetFileTime === 0) {
                    // 如果直接获取失败，尝试从adapter获取
                    try {
                        // @ts-ignore - 忽略TypeScript的类型错误
                        const targetStat = await adapter.stat(pairedFile.path);
                        if (targetStat && typeof targetStat.mtime === 'number') {
                            targetFileTime = targetStat.mtime;
                            console.log(`通过adapter获取目标文件时间: ${new Date(targetFileTime).toLocaleString()}`);
                        }
                    } catch (e) {
                        console.warn('通过adapter获取目标文件时间失败:', e);
                    }
                }
                
                // 比较修改时间，判断是否需要同步
                if (sourceFileTime === 0 || targetFileTime === 0) {
                    // 如果任一时间为0，说明获取时间失败，为安全起见，执行同步
                    console.log('无法获取完整的修改时间信息，将执行同步');
                    await this.syncFiles(file, pairedFile);
                } else if (sourceFileTime > targetFileTime) {
                    // 源文件比目标文件新，进行同步
                    console.log(`源文件更新 (${new Date(sourceFileTime).toLocaleString()} > ${new Date(targetFileTime).toLocaleString()})，开始同步`);
                    await this.syncFiles(file, pairedFile);
                } else if (Math.abs(sourceFileTime - targetFileTime) < 2000) {
                    // 如果时间差小于2秒，可能是因为时间精度问题，仍然执行同步
                    console.log(`源文件和目标文件修改时间非常接近，将执行同步`);
                    await this.syncFiles(file, pairedFile);
                } else {
                    // 其他情况，不需要同步
                    console.log(`源文件未更新 (${new Date(sourceFileTime).toLocaleString()} <= ${new Date(targetFileTime).toLocaleString()})，不需要同步`);
                }
            } catch (error) {
                console.error('获取文件修改时间时出错:', error);
                // 出错时，为安全起见，执行同步
                console.log('由于获取时间出错，将执行同步');
                await this.syncFiles(file, pairedFile);
            }
        } catch (error) {
            console.error('处理文件修改事件时出错:', error);
        }
    }
    
    /**
     * 处理文件创建事件
     * @param file 新创建的文件
     */
    async handleFileCreated(file: TFile): Promise<void> {
        // 检查插件是否启用了文件同步功能
        if (!this.plugin.settings.enableFileSync) {
            return;
        }
        
        // 如果文件扩展名既不是md也不是xmind，忽略
        if (file.extension !== 'md' && file.extension !== 'xmind') {
            return;
        }
        
        // 检查该文件是否在需要同步的文件夹内
        if (!this.isInSyncFolders(file.path)) {
            return;
        }
        
        try {
            // 查找是否已存在对应的另一种类型文件
            const pairedFile = await this.findPairedFile(file);
            
            if (!pairedFile) {
                console.log(`未找到文件 ${file.path} 的配对文件，无需进行新文件同步`);
                return;
            }
            
            console.log('发现新创建文件的配对文件:', pairedFile.path);
            
            // 获取文件状态
            // @ts-ignore - 忽略TypeScript的类型错误
            const adapter = this.plugin.app.vault.adapter;
            let sourceFileTime = 0;
            let targetFileTime = 0;
            
            try {
                // 安全地获取文件修改时间 - 使用try/catch和类型断言
                try {
                    // @ts-ignore - 忽略TypeScript的类型错误
                    if (file.stat && typeof file.stat.mtime === 'number') {
                        // @ts-ignore - 忽略TypeScript的类型错误
                        sourceFileTime = file.stat.mtime;
                    }
                } catch (e) { /* 忽略错误 */ }
                
                if (sourceFileTime === 0) {
                    // 如果直接获取失败，尝试从adapter获取
                    try {
                        // @ts-ignore - 忽略TypeScript的类型错误
                        const sourceStat = await adapter.stat(file.path);
                        if (sourceStat && typeof sourceStat.mtime === 'number') {
                            sourceFileTime = sourceStat.mtime;
                        }
                    } catch (e) { /* 忽略错误 */ }
                }
                
                try {
                    // @ts-ignore - 忽略TypeScript的类型错误
                    if (pairedFile.stat && typeof pairedFile.stat.mtime === 'number') {
                        // @ts-ignore - 忽略TypeScript的类型错误
                        targetFileTime = pairedFile.stat.mtime;
                    }
                } catch (e) { /* 忽略错误 */ }
                
                if (targetFileTime === 0) {
                    // 如果直接获取失败，尝试从adapter获取
                    try {
                        // @ts-ignore - 忽略TypeScript的类型错误
                        const targetStat = await adapter.stat(pairedFile.path);
                        if (targetStat && typeof targetStat.mtime === 'number') {
                            targetFileTime = targetStat.mtime;
                        }
                    } catch (e) { /* 忽略错误 */ }
                }
                
                // 比较修改时间，以较新的为准进行同步
                if (sourceFileTime > targetFileTime) {
                    // 新文件比已存在的配对文件更新，同步到配对文件
                    console.log('新文件更新，同步到已存在文件');
                    await this.syncFiles(file, pairedFile);
                } else {
                    // 已存在的配对文件更新，同步到新文件
                    console.log('已存在文件更新，同步到新文件');
                    await this.syncFiles(pairedFile, file);
                }
            } catch (error) {
                console.error('获取文件修改时间时出错:', error);
            }
        } catch (error) {
            console.error('处理文件创建事件时出错:', error);
        }
    }
    
    /**
     * 查找与给定文件匹配的配对文件
     * @param file 源文件
     * @returns 匹配的配对文件，如果没有找到则返回null
     */
    async findPairedFile(file: TFile): Promise<TFile | null> {
        try {
            // 获取不带扩展名的文件名
            const baseName = file.name.replace(`.${file.extension}`, '');
            console.log(`查找文件 ${file.path} 的配对文件，基本名称: ${baseName}`);
            
            // 设置要查找的文件扩展名
            const targetExtension = file.extension === 'md' ? 'xmind' : 'md';
            console.log(`目标扩展名: ${targetExtension}`);
            
            // 获取所有文件
            // @ts-ignore - 忽略TypeScript的类型错误
            const files = this.plugin.app.vault.getFiles();
            
            if (!files || files.length === 0) {
                console.log('未能获取到文件列表');
                return null;
            }
            
            console.log(`获取到文件总数: ${files.length}`);
            
            // 区分同步模式:
            if (this.plugin.settings.syncMode === 'all') {
                console.log('使用全库模式查找配对文件');
                
                // 全库模式: 首先尝试查找完全匹配的文件名
                const exactNameMatch = files.find(f => {
                    const fBaseName = f.name.replace(`.${f.extension}`, '');
                    return fBaseName === baseName && 
                           f.extension === targetExtension &&
                           f.path !== file.path; // 确保不是自己
                });
                
                if (exactNameMatch) {
                    console.log('找到完全匹配的配对文件:', exactNameMatch.path);
                    return exactNameMatch;
                }
                
                // 如果没有找到精确匹配，尝试不区分大小写的匹配
                const caseInsensitiveMatch = files.find(f => {
                    const fBaseName = f.name.replace(`.${f.extension}`, '').toLowerCase();
                    return fBaseName === baseName.toLowerCase() && 
                           f.extension === targetExtension &&
                           f.path !== file.path; // 确保不是自己
                });
                
                if (caseInsensitiveMatch) {
                    console.log('找到不区分大小写匹配的配对文件:', caseInsensitiveMatch.path);
                    return caseInsensitiveMatch;
                }
                
                console.log('全库模式未找到匹配的配对文件');
            } else {
                console.log('使用指定文件夹模式查找配对文件');
                
                // 获取文件所在目录
                let fileDir = '';
                // @ts-ignore
                if (file.parent && file.parent.path) {
                    // @ts-ignore
                    fileDir = file.parent.path;
                } else {
                    // 如果不存在parent属性，从path中提取目录部分
                    const pathParts = file.path.split('/');
                    pathParts.pop(); // 移除文件名部分
                    fileDir = pathParts.join('/');
                }
                
                console.log(`文件所在目录: ${fileDir}`);
                
                // 构建同目录下预期的目标文件路径
                let targetPath = '';
                
                // 处理根目录文件
                if (fileDir === '' || fileDir === '/') {
                    targetPath = `${baseName}.${targetExtension}`;
                } else {
                    // 确保目录路径不以/开头，以避免双斜杠
                    const normalizedDir = fileDir.startsWith('/') ? fileDir.substring(1) : fileDir;
                    targetPath = `${normalizedDir}/${baseName}.${targetExtension}`;
                }
                
                console.log(`预期的目标文件路径: ${targetPath}`);
                
                // 1. 首先尝试精确路径匹配（同目录下的文件）
                // @ts-ignore - 使用API获取文件
                const exactFile = this.plugin.app.vault.getFileByPath(targetPath);
                if (exactFile instanceof TFile) {
                    console.log('找到同目录精确匹配的配对文件:', exactFile.path);
                    return exactFile;
                }
                
                // 2. 如果精确匹配失败，尝试在同目录中查找相似名称的文件
                // 获取当前目录中的所有文件
                const filesInSameDir = files.filter(f => {
                    let fDir = '';
                    // @ts-ignore
                    if (f.parent && f.parent.path) {
                        // @ts-ignore
                        fDir = f.parent.path;
                    } else {
                        const fPathParts = f.path.split('/');
                        fPathParts.pop();
                        fDir = fPathParts.join('/');
                    }
                    return fDir === fileDir;
                });
                
                console.log(`同目录下文件数: ${filesInSameDir.length}`);
                
                // 首先尝试精确名称匹配
                const exactNameMatch = filesInSameDir.find(f => 
                    f.name.replace(`.${f.extension}`, '') === baseName &&
                    f.extension === targetExtension
                );
                
                if (exactNameMatch) {
                    console.log('找到同目录精确名称匹配的配对文件:', exactNameMatch.path);
                    return exactNameMatch;
                }
                
                // 然后尝试不区分大小写的匹配
                const caseInsensitiveMatch = filesInSameDir.find(f => 
                    f.name.replace(`.${f.extension}`, '').toLowerCase() === baseName.toLowerCase() &&
                    f.extension === targetExtension
                );
                
                if (caseInsensitiveMatch) {
                    console.log('找到同目录不区分大小写匹配的配对文件:', caseInsensitiveMatch.path);
                    return caseInsensitiveMatch;
                }
                
                console.log('指定文件夹模式未找到匹配的配对文件');
            }
            
            console.log(`未找到任何匹配 ${file.path} 的配对文件`);
            return null;
        } catch (error) {
            console.error('查找配对文件过程中发生错误:', error);
            return null;
        }
    }
    
    /**
     * 同步源文件到目标文件
     * @param sourceFile 源文件
     * @param targetFile 目标文件
     */
    async syncFiles(sourceFile: TFile, targetFile: TFile): Promise<void> {
        try {
            // 记录此次同步操作，使用文件键而非文件路径
            const sourceKey = this.getFileKey(sourceFile);
            const targetKey = this.getFileKey(targetFile);
            
            this.markFileSynced(sourceKey);
            this.markFileSynced(targetKey);
            
            this.logger.log(`开始同步文件: ${sourceFile.path} -> ${targetFile.path} [keys: ${sourceKey}, ${targetKey}]`);
            
            // 获取Obsidian适配器及基础路径
            const adapter = this.plugin.app.vault.adapter as FileSystemAdapter;
            const basePath = adapter.getBasePath();
            
            // 构建完整的文件路径 - 处理Windows和Unix路径的兼容性
            const sourcePath = path.normalize(path.join(basePath, sourceFile.path));
            const targetPath = path.normalize(path.join(basePath, targetFile.path));
            
            console.log(`源文件完整路径: ${sourcePath}`);
            console.log(`目标文件完整路径: ${targetPath}`);
            
            // 检查文件是否存在
            const sourceExists = await adapter.exists(sourceFile.path);
            const targetExists = await adapter.exists(targetFile.path);
            
            if (!sourceExists) {
                throw new Error(`源文件不存在: ${sourcePath}`);
            }
            
            console.log(`源文件存在: ${sourceExists}, 目标文件存在: ${targetExists}`);
            
            if (!this.plugin.settings.xmindPath) {
                new Notice('同步失败：请先在插件设置中配置XMind可执行文件路径');
                console.error('XMind可执行文件路径未设置');
                return;
            }
            
            console.log(`XMind可执行文件路径: ${this.plugin.settings.xmindPath}`);
            
            // 根据文件类型选择转换命令
            if (sourceFile.extension === 'md' && targetFile.extension === 'xmind') {
                // 从Markdown转换到XMind
                console.log(`开始将Markdown转换为XMind: ${sourcePath} -> ${targetPath}`);
                try {
                    await convertMarkdownToXMind(sourcePath, targetPath, this.plugin.settings.xmindPath, this.logger);
                    this.logger.success(`Markdown到XMind转换成功`);
                    new Notice(`已同步 ${sourceFile.name} 到 ${targetFile.name}`);
                } catch (error) {
                    this.logger.error(`Markdown到XMind转换失败`, error);
                    new Notice(`同步失败: ${error.message}`);
                    // 取消同步标记，允许再次尝试
                    this.clearSyncMark(sourceKey);
                    this.clearSyncMark(targetKey);
                    return;
                }
            } else if (sourceFile.extension === 'xmind' && targetFile.extension === 'md') {
                // 从XMind转换到Markdown
                console.log(`开始将XMind转换为Markdown: ${sourcePath} -> ${targetPath}`);
                try {
                    await convertXMindToMarkdown(sourcePath, targetPath, this.plugin.settings.xmindPath, this.logger);
                    this.logger.success(`XMind到Markdown转换成功`);
                    new Notice(`已同步 ${sourceFile.name} 到 ${targetFile.name}`);
                } catch (error) {
                    this.logger.error(`XMind到Markdown转换失败`, error);
                    new Notice(`同步失败: ${error.message}`);
                    // 取消同步标记，允许再次尝试
                    this.clearSyncMark(sourceKey);
                    this.clearSyncMark(targetKey);
                    return;
                }
            } else {
                throw new Error(`不支持的文件类型: ${sourceFile.extension} -> ${targetFile.extension}`);
            }
            
            // 刷新Obsidian文件列表
            try {
                // 提取目标文件所在目录
                let dirPath = '';
                // @ts-ignore - 忽略TypeScript的类型错误
                if (targetFile.parent && targetFile.parent.path) {
                    // @ts-ignore - 忽略TypeScript的类型错误
                    dirPath = targetFile.parent.path;
                } else {
                    const pathParts = targetFile.path.split('/');
                    pathParts.pop(); // 移除文件名部分
                    dirPath = pathParts.join('/');
                }
                
                console.log(`刷新目录: ${dirPath || '根目录'}`);
                
                // 列出目录内容以刷新缓存
                if (dirPath) {
                    await adapter.list(dirPath);
                } else {
                    await adapter.list('/');
                }
                
                console.log(`文件列表刷新完成`);
            } catch (error) {
                console.error('刷新文件列表时出错:', error);
            }
            
            // 延迟删除同步标记，防止过早清除导致递归触发
            console.log(`设置延时清除同步标记, 延迟: ${this.SYNC_MARK_TIMEOUT}ms, keys: ${sourceKey}, ${targetKey}`);
            setTimeout(() => {
                this.clearSyncMark(sourceKey);
                this.clearSyncMark(targetKey);
                console.log(`已清除文件同步标记, keys: ${sourceKey}, ${targetKey}`);
            }, this.SYNC_MARK_TIMEOUT);
            
            console.log(`文件同步流程完成`);
        } catch (error) {
            console.error('同步文件时出错:', error);
            new Notice(`同步失败: ${error.message}`);
            
            // 清除同步标记，允许下次再试
            this.clearSyncMark(this.getFileKey(sourceFile));
            this.clearSyncMark(this.getFileKey(targetFile));
        }
    }
    
    /**
     * 获取文件的唯一键值（用于同步标记）
     * 使用文件名和扩展名而非完整路径，解决因路径表示不一致导致的标记问题
     * @param file 文件对象
     * @returns 文件键值
     */
    private getFileKey(file: TFile): string {
        return `${file.name}_${file.extension}`;
    }
    
    /**
     * 标记文件已同步
     * @param fileKey 文件键值
     */
    markFileSynced(fileKey: string): void {
        this.recentlySyncedFiles.set(fileKey, Date.now());
    }
    
    /**
     * 检查文件是否最近已被同步
     * @param fileKey 文件键值
     * @returns 是否最近已同步
     */
    isRecentlySynced(fileKey: string): boolean {
        const lastSyncTime = this.recentlySyncedFiles.get(fileKey);
        if (!lastSyncTime) return false;
        
        const now = Date.now();
        return (now - lastSyncTime) < this.SYNC_MARK_TIMEOUT;
    }
    
    /**
     * 清除文件同步标记
     * @param fileKey 文件键值
     */
    clearSyncMark(fileKey: string): void {
        this.recentlySyncedFiles.delete(fileKey);
    }
    
    /**
     * 卸载，清理资源
     */
    unload(): void {
        // 清理同步文件标记
        this.recentlySyncedFiles.clear();
        
        // 清理事件监听器
        this.fileEventRefs = [];
        
        console.log('文件同步管理器已卸载');
    }
    
    /**
     * 手动触发文件同步，强制忽略同步时间标记
     * 专用于用户手动执行同步
     * @param filePath 要同步的文件路径
     */
    async forceSync(filePath: string): Promise<void> {
        try {
            // @ts-ignore - 忽略TypeScript的类型错误
            const file = this.plugin.app.vault.getAbstractFileByPath(filePath);
            if (file instanceof TFile) {
                console.log('手动强制触发文件同步:', file.path);

                // 先清除可能存在的同步标记
                this.clearSyncMark(this.getFileKey(file));
                
                // 查找配对文件
                const pairedFile = await this.findPairedFile(file);
                if (!pairedFile) {
                    throw new Error(`未找到文件 ${file.path} 的配对文件，无法进行同步`);
                }
                
                // 清除配对文件的同步标记
                this.clearSyncMark(this.getFileKey(pairedFile));
                
                // 直接强制同步
                await this.syncFiles(file, pairedFile);
                return;
            }
            throw new Error('找不到指定文件');
        } catch (error) {
            console.error('手动强制同步文件失败:', error);
            throw error;
        }
    }
    
    /**
     * 调试文件路径，便于排查问题
     * 此函数会尝试多种方式打印文件路径信息
     */
    async debugFilePaths(): Promise<void> {
        try {
            console.log('==== 文件同步路径调试 ====');
            
            // 获取适配器基础路径
            const adapter = this.plugin.app.vault.adapter as FileSystemAdapter;
            console.log('基础路径:', adapter.getBasePath());
            
            // 获取当前所有文件
            // @ts-ignore - 忽略TypeScript的类型错误
            const files = this.plugin.app.vault.getFiles();
            if (files && files.length > 0) {
                console.log('文件总数:', files.length);
                console.log('文件路径示例:');
                
                // 打印前5个文件的信息
                for (let i = 0; i < Math.min(5, files.length); i++) {
                    const file = files[i];
                    console.log(`文件 ${i+1}:`, {
                        path: file.path,
                        name: file.name,
                        extension: file.extension,
                        key: this.getFileKey(file)
                    });
                }
                
                // 查找Markdown文件
                const mdFiles = files.filter(f => f.extension === 'md');
                console.log('Markdown文件数量:', mdFiles.length);
                if (mdFiles.length > 0) {
                    console.log('Markdown文件示例:', mdFiles[0].path);
                }
                
                // 查找XMind文件
                const xmindFiles = files.filter(f => f.extension === 'xmind');
                console.log('XMind文件数量:', xmindFiles.length);
                if (xmindFiles.length > 0) {
                    console.log('XMind文件示例:', xmindFiles[0].path);
                }
                
                // 查找潜在的配对文件
                for (const mdFile of mdFiles.slice(0, 3)) { // 只检查前3个
                    const baseName = mdFile.name.replace('.md', '');
                    const potentialXmind = xmindFiles.find(f => 
                        f.name.replace('.xmind', '') === baseName);
                    
                    if (potentialXmind) {
                        console.log('发现潜在的配对文件:',
                            mdFile.path, '<=>', potentialXmind.path);
                        
                        // 检查这些文件的实际路径是否与期望路径匹配
                        await this.findPairedFile(mdFile);
                    }
                }
            } else {
                console.log('无法获取文件列表或文件列表为空');
            }
            
            // 打印同步标记状态
            console.log('当前同步标记状态:');
            this.recentlySyncedFiles.forEach((time, key) => {
                console.log(`- ${key}: ${new Date(time).toLocaleString()}`);
            });
            
            console.log('==== 文件同步路径调试结束 ====');
        } catch (error) {
            console.error('文件路径调试过程中出错:', error);
        }
    }
    
    /**
     * 重置同步状态
     * 在切换同步模式、插件启用状态变更时调用
     */
    resetSyncState(): void {
        // 清空最近同步过的文件列表
        this.recentlySyncedFiles.clear();
        console.log('文件同步状态已重置');
    }
    
    /**
     * 更新同步设置
     * 当用户更改设置时调用此方法
     */
    updateSettings(): void {
        // 重置同步状态
        this.resetSyncState();
        
        // 重新初始化（如果需要）
        if (this.plugin.settings.enableFileSync) {
            console.log('同步设置已更新，同步模式:', this.plugin.settings.syncMode);
            if (this.plugin.settings.syncMode === 'folders') {
                console.log('指定文件夹:', this.plugin.settings.syncFolders);
            }
        } else {
            console.log('文件同步功能已禁用');
        }
    }
} 