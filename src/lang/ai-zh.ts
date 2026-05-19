// AI 服务相关的中文翻译
export const AI_TRANSLATIONS = {
    // 通用 AI 术语
    'ai.service': 'AI 服务',
    'ai.provider': 'AI 提供者',
    'ai.model': 'AI 模型',
    'ai.processing': 'AI 处理中',
    'ai.completed': 'AI 处理完成',
    'ai.failed': 'AI 处理失败',
    'ai.unavailable': 'AI 服务不可用',
    'ai.configured': 'AI 已配置',
    'ai.not_configured': 'AI 未配置',

    // 设置相关
    'ai.settings.title': 'AI 服务配置',
    'ai.settings.provider': 'AI 服务提供者',
    'ai.settings.provider.desc': '选择要使用的 AI 服务提供者',
    'ai.settings.test_connection': '测试连接',
    'ai.settings.test_connection.desc': '测试当前 AI 服务提供者的连接',
    'ai.settings.test_connection.success': '连接测试成功！',
    'ai.settings.test_connection.failed': '连接测试失败，请检查配置',
    'ai.settings.api_key': 'API 密钥',
    'ai.settings.api_key.desc': '输入您的 API 密钥',
    'ai.settings.base_url': '基础 URL',
    'ai.settings.base_url.desc': '自定义 API 基础 URL (可选)',
    'ai.settings.model': '模型',
    'ai.settings.model.desc': '选择要使用的模型',
    'ai.settings.host': '服务器地址',
    'ai.settings.host.desc': '服务器的地址',

    // 提供者名称
    'ai.provider.ollama': 'Ollama (本地)',
    'ai.provider.openai': 'OpenAI',
    'ai.provider.gemini': 'Google Gemini',
    'ai.provider.anthropic': 'Anthropic Claude',
    'ai.provider.deepseek': 'Deepseek',
    'ai.provider.siliconflow': 'SiliconFlow',

    // Ollama 特定
    'ai.ollama.title': 'Ollama 设置',
    'ai.ollama.host': '服务器地址',
    'ai.ollama.host.placeholder': 'http://localhost:11434',
    'ai.ollama.model': '模型',
    'ai.ollama.model.placeholder': '请选择模型...',
    'ai.ollama.refresh_models': '刷新模型列表',
    'ai.ollama.models_updated': 'Ollama 模型列表已更新',
    'ai.ollama.models_failed': '获取 Ollama 模型列表失败',
    'ai.ollama.not_running': 'Ollama 服务未运行。请启动服务。',
    'ai.ollama.connection_failed': '无法连接到 Ollama 服务。请确保服务正在运行。',

    // OpenAI 特定
    'ai.openai.title': 'OpenAI 设置',
    'ai.openai.api_key.placeholder': 'sk-...',
    'ai.openai.base_url.placeholder': 'https://api.openai.com/v1',

    // Gemini 特定
    'ai.gemini.title': 'Google Gemini 设置',
    'ai.gemini.api_key.placeholder': 'AIza...',
    'ai.gemini.base_url.placeholder': 'https://generativelanguage.googleapis.com',

    // Anthropic 特定
    'ai.anthropic.title': 'Anthropic Claude 设置',
    'ai.anthropic.api_key.placeholder': 'sk-ant-...',
    'ai.anthropic.api_address': 'API 地址',
    'ai.anthropic.api_address.placeholder': 'https://api.anthropic.com',

    // Deepseek 特定
    'ai.deepseek.title': 'Deepseek 设置',
    'ai.deepseek.api_key.placeholder': 'sk-...',
    'ai.deepseek.base_url.placeholder': 'https://api.deepseek.com/v1',

    // SiliconFlow 特定
    'ai.siliconflow.title': 'SiliconFlow 设置',
    'ai.siliconflow.api_key.placeholder': 'sk-...',
    'ai.siliconflow.base_url.placeholder': 'https://api.siliconflow.cn/v1',

    // 自定义提示词
    'ai.prompts.title': '自定义提示词',
    'ai.prompts.desc': '您可以创建自定义提示词模板。使用 {{highlight}} 作为选中文本的占位符，{{comment}} 作为注释的占位符。',
    'ai.prompts.add': '添加新提示词',
    'ai.prompts.add.desc': '创建一个新的自定义提示词模板',
    'ai.prompts.add.button': '添加提示词',
    'ai.prompts.edit': '编辑此提示词模板',
    'ai.prompts.delete': '删除',
    'ai.prompts.name': '请输入提示词名称:',
    'ai.prompts.template': '请输入提示词模板 (使用 {{highlight}} 作为占位符):',

    // 默认提示词
    'ai.prompts.default.core_insight': '🤔 核心洞察',
    'ai.prompts.default.content_expansion': '📝 内容扩展',
    'ai.prompts.default.deep_analysis': '🔍 深度分析',
    'ai.prompts.default.creative_thinking': '💡 创意思考',
    'ai.prompts.default.structured_summary': '📊 结构化总结',

    // 右键菜单
    'ai.menu.mindmap_ai': 'mindmap AI',
    'ai.menu.custom_prompt': '自定义提示词...',
    'ai.menu.file_analysis': 'mindmap AI 分析',

    // 思维导图 AI 功能
    'ai.mindmap.expand_node': '🧠 AI 扩展节点',
    'ai.mindmap.analyze_node': '🔍 AI 深度分析',
    'ai.mindmap.optimize_node': '✨ AI 优化内容',
    'ai.mindmap.custom_expansion': '自定义扩展...',
    'ai.mindmap.expanding': 'AI 正在扩展节点...',
    'ai.mindmap.analyzing': 'AI 正在分析节点...',
    'ai.mindmap.optimizing': 'AI 正在优化节点...',
    'ai.mindmap.expansion_completed': '节点扩展完成',
    'ai.mindmap.analysis_completed': '节点分析完成',
    'ai.mindmap.optimization_completed': '节点优化完成',
    'ai.mindmap.expansion_failed': '节点扩展失败',
    'ai.mindmap.analysis_failed': '节点分析失败',
    'ai.mindmap.optimization_failed': '节点优化失败',

    // 扩展提示词
    'ai.expansion.detailed': '📝 详细展开',
    'ai.expansion.practical': '🎯 实际应用',
    'ai.expansion.related': '🔗 相关概念',
    'ai.expansion.categorize': '📊 分类整理',
    'ai.expansion.innovative': '💡 创新思路',

    // 处理状态
    'ai.processing.analyzing_file': 'AI 正在分析文件...',
    'ai.processing.generating': 'AI 正在生成内容...',
    'ai.processing.completed': 'AI 处理完成',
    'ai.processing.failed': 'AI 处理失败',
    'ai.processing.cancelled': 'AI 处理已取消',

    // 错误消息
    'ai.error.not_configured': 'AI 服务未配置',
    'ai.error.connection_failed': '连接失败，请检查网络设置',
    'ai.error.api_key_missing': 'API 密钥未配置',
    'ai.error.model_not_selected': '模型未选择',
    'ai.error.invalid_response': 'API 返回无效的响应格式',
    'ai.error.rate_limit': 'API 请求频率限制，请稍后重试',
    'ai.error.quota_exceeded': 'API 配额已用完',
    'ai.error.network_error': '网络错误，请检查网络连接',
    'ai.error.timeout': '请求超时，请重试',
    'ai.error.unknown': '未知错误',

    // 成功消息
    'ai.success.analysis_saved': 'AI 分析完成，结果已保存到',
    'ai.success.content_generated': 'AI 内容生成完成',
    'ai.success.node_updated': '节点内容已更新',
    'ai.success.batch_completed': '批量处理完成',

    // 确认对话框
    'ai.confirm.delete_prompt': '确定要删除这个提示词吗？',
    'ai.confirm.reset_settings': '确定要重置 AI 设置吗？',
    'ai.confirm.batch_process': '确定要批量处理选中的节点吗？',

    // 帮助文本
    'ai.help.prompt_variables': '可用变量: {{highlight}} - 选中的文本, {{comment}} - 注释内容',
    'ai.help.node_expansion': 'Ctrl+双击节点可快速扩展',
    'ai.help.context_menu': '右键点击可访问 AI 功能',
    'ai.help.batch_selection': '选择多个节点后可进行批量处理',

    // 配置验证
    'ai.validation.host_required': '主机地址未配置',
    'ai.validation.model_required': '模型未选择',
    'ai.validation.api_key_required': 'API 密钥未配置',
    'ai.validation.invalid_url': '无效的 URL 格式',
    'ai.validation.connection_test_required': '请先测试连接',

    // 模型相关
    'ai.models.loading': '正在加载模型列表...',
    'ai.models.load_failed': '加载模型列表失败',
    'ai.models.no_models': '没有可用的模型',
    'ai.models.custom': '自定义模型',
    'ai.models.default': '默认模型',

    // 批量操作
    'ai.batch.processing': '正在批量处理',
    'ai.batch.completed': '批量处理完成',
    'ai.batch.failed': '批量处理失败',
    'ai.batch.cancelled': '批量处理已取消',
    'ai.batch.progress': '进度',

    // 导入导出
    'ai.export.settings': '导出 AI 设置',
    'ai.import.settings': '导入 AI 设置',
    'ai.export.prompts': '导出提示词',
    'ai.import.prompts': '导入提示词',
    'ai.export.success': '导出成功',
    'ai.import.success': '导入成功',
    'ai.export.failed': '导出失败',
    'ai.import.failed': '导入失败',

    // 快捷键
    'ai.shortcuts.expand_node': 'Ctrl+双击: 快速扩展节点',
    'ai.shortcuts.context_menu': '右键: 显示 AI 菜单',
    'ai.shortcuts.custom_prompt': 'Ctrl+Shift+A: 自定义提示词',

    // 统计信息
    'ai.stats.requests_today': '今日请求次数',
    'ai.stats.tokens_used': '已使用令牌',
    'ai.stats.nodes_created': '已创建节点',
    'ai.stats.analysis_count': '分析次数'
};

// 获取翻译文本的辅助函数
export function getAITranslation(key: string, fallback?: string): string {
    return AI_TRANSLATIONS[key] || fallback || key;
}

// 格式化翻译文本（支持参数替换）
export function formatAITranslation(key: string, params: Record<string, string> = {}): string {
    let text = getAITranslation(key);
    
    Object.entries(params).forEach(([param, value]) => {
        text = text.replace(new RegExp(`\\{\\{${param}\\}\\}`, 'g'), value);
    });
    
    return text;
}