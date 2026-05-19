# SuperMind - Obsidian 增强思维导图插件

<div align="center">

**一个功能强大、稳定可靠的 Obsidian 思维导图插件**

支持交互式编辑 • AI 智能扩展 • 多种导出格式 • 企业级稳定性

[![Version](https://img.shields.io/badge/version-2.5-blue.svg)](CHANGELOG_cn.md)
[![Platform](https://img.shields.io/badge/platform-Desktop%20%7C%20Mobile-green.svg)](#平台支持)

[English](README.md)

</div>

---

## ✨ 核心亮点

### 🎯 完整的思维导图体验
- **Native Obsidian 集成**: 无缝融入 Obsidian 工作流
- **Markdown 双向同步**: 思维导图与 Markdown 实时互转
- **13 种专业主题**: 专业主题 + 多巴胺配色，满足不同场景
- **富文本支持**: 表格、Callout、引用、代码块、嵌入内容

### 🤖 AI 智能增强
- **多 AI 服务**: OpenAI、Anthropic、Gemini、Deepseek、Ollama
- **智能扩展**: 一键生成子节点、深度分析、内容优化
- **洞察系统**: 类似 Flomo AI 洞察，多维度分析笔记
- **自定义提示词**: 完全可定制的 AI 交互

### 🏗️ 企业级稳定性
- **统一资源管理**: 集中式资源生命周期控制
- **零内存泄漏**: 完整的生命周期管理和自动清理
- **异步安全**: 防止访问已销毁对象的竞态条件
- **性能优化**: 高效的渲染和内存使用

### 🎨 丰富的导出选项
- **图片导出**: PNG、JPEG、SVG，支持水印和作者信息
- **文档导出**: 选中内容导出，12 种专业模板
- **XMind 集成**: 与 XMind 文件双向转换（桌面端）

---

## 🚀 核心功能

### 1. 思维导图编辑

#### 交互式编辑
- ✅ 直接在 Obsidian 中创建和编辑思维导图
- ✅ 支持拖拽、快捷键、右键菜单操作
- ✅ 实时预览，所见即所得
- ✅ 完整的撤销/重做历史

#### 布局和样式
- **4 种布局方向**: 居中、右侧、左侧、顺时针
- **13 种主题**: 7 种专业主题 + 6 种多巴胺配色
- **自定义颜色组**: 智能节点连线颜色系统
- **响应式画布**: 自动适应内容大小

#### 富文本渲染
| 内容类型 | 支持功能 |
|---------|---------|
| **Markdown 格式** | 加粗、斜体、高亮、删除线、代码 |
| **表格** | 完整的表格渲染和编辑 |
| **Callout** | 多种 Callout 类型，自适应主题 |
| **引用块** | 块引用、文本块显示 |
| **代码块** | 语法高亮，作为子节点渲染 |
| **嵌入内容** | Canvas、PDF++、Eagle、Excalidraw |
| **双链** | 支持内部链接跳转 |
| **脚注** | 上标渲染，内容保护 |
| **任务列表** | 可点击的复选框 |

### 2. 视图增强

#### 大纲视图
- 树状结构显示
- 实时搜索和快速定位
- 支持展开/折叠
- 与主视图同步滚动

#### 地图概览
- 小地图缩略图
- 可视化导航
- 快速跳转
- 实时更新

#### 快捷设置
- 一键切换主题
- 调整布局方向
- 修改颜色组
- 背景颜色选择器

### 3. AI 智能功能

#### 节点 AI 扩展（Plus 功能）
- **生成想法**: AI 头脑风暴
- **生成解析**: 深度内容分析
- **详细展开**: 细化节点内容
- **实际应用**: 实用场景建议
- **自定义提示词**: 完全可定制

#### 右键菜单 AI
- 弹窗显示流式输出
- 支持编辑和插入
- 智能 Callout 类型选择
- 重新生成和替换功能

#### 文件 AI 分析
- 文档分析和摘要
- 关键词提取
- 新文件流式输出
- 自定义保存路径

#### AI 洞察系统
- 多维度视角分析
- 内置视角可自定义
- 双链展开深度配置
- 数据持久化存储

#### AI Skills 技能系统（Plus 功能）
- 基于 SKILL.md 定义可扩展的 AI 工作流
- 文件夹结构：每个 Skill 含 SKILL.md + 可选 references/assets 等资源子文件夹
- 支持多种输出格式：markdown、mermaid、excalidraw、canvas、base
- 自动扫描 vault `skills/` 文件夹发现技能
- 流式输出，实时写入文件
- 智能内容提取，去除 AI 解释性文本

#### 统一保存路径管理
- 三种模式：自定义路径 / vault 根目录 / 源文件同目录
- 所有 AI 功能统一复用
- 目录不存在时自动创建

#### AI 停止按钮
- AI 洞察和 Skills 执行均支持中断
- 移动端进度指示器集成停止按钮
- 思维导图节点 AI 扩展也支持停止

#### Plus 功能授权
- **试用期**: 7 天免费试用所有 Plus 功能
- **授权方式**: 赞赏获取注册码
- **功能范围**: 节点 AI 扩展、右键菜单 AI、文件 AI 分析
- **免费功能**: 试用期结束后，其他所有功能不受限制

### 4. 导出和发布

#### 图片导出
```
支持格式: PNG, JPEG, SVG
功能:
- 可调整图片宽度
- 自定义作者信息（头像、名称、额外文本）
- 水印设置（文本/图片，透明度、旋转）
- 12 种专业模板
- 移动端分享菜单集成
```

#### 文档导出
```
功能:
- 选中内容导出
- 完整文档导出
- 卡片概要显示
- 文件名和日期控制
- 导出预览模态框
```

#### XMind 集成（桌面端）
- Markdown ↔ XMind 互转
- XMind 文件预览（缩略图）
- 文件夹自动同步
- 标签页打开 XMind

### 5. 折叠状态持久化

- 使用 `<!--c-->` 注释标记
- 与 obsidian-workflowy-plugin 兼容
- Markdown 视图联动
- 状态自动保存

---

## 📱 平台支持

### 桌面端（完整支持）
- ✅ Windows、macOS、Linux
- ✅ 所有功能可用
- ✅ XMind 集成
- ✅ 文件系统操作

### 移动端（基础支持）
- ✅ iOS、Android
- ✅ 思维导图查看和编辑
- ✅ 触摸操作
- ✅ 图片导出（分享菜单）
- ✅ Tab/Enter 虚拟按钮
- ⚠️ **不支持**: XMind 互转、文件同步

---

## 📖 使用指南

### 快速开始

#### 1. 创建思维导图
```
方式1: Ctrl+P → 搜索"创建新思维导图"
方式2: 文件夹右键 → "新建思维导图"
```

#### 2. 打开现有文件
```
方式1: Markdown 文件右键 → "打开为思维导图"
方式2: 命令面板 → "切换为 markdown 或 mindmap 模式"
```

### 快捷键速查

<details>
<summary><b>节点操作</b></summary>

| 快捷键 | 功能 |
|--------|------|
| `Shift+F2` | 编辑节点 |
| `Shift+Insert` | 插入子节点 |
| `Alt+Shift+Enter` | 添加兄弟节点/结束编辑 |
| `Shift+Delete` | 删除节点及子节点 |
| `Escape` | 取消编辑 |
| `Alt+Shift+S` | 选择节点文本 |
| `Alt+Shift+D` | 将后续兄弟移为子节点 |
| `Alt+Ctrl+Shift+D` | 将所有兄弟移为子节点 |
| `Alt+Shift+J` | 与下方节点合并 |
| `Alt+Ctrl+Shift+J` | 作为引用与下方节点合并 |

</details>

<details>
<summary><b>节点移动</b></summary>

| 快捷键 | 功能 |
|--------|------|
| `Alt+Shift+↑` | 向上移动节点 |
| `Alt+Shift+↓` | 向下移动节点 |
| `Alt+Shift+←` | 向左移动节点 |
| `Alt+Shift+→` | 向右移动节点 |

</details>

<details>
<summary><b>展开/折叠</b></summary>

| 快捷键 | 功能 |
|--------|------|
| `Alt+↓` | 展开一级 |
| `Alt+↑` | 收起一级 |
| `Alt+PageDown` | 从最大层级展开一级 |
| `Alt+PageUp` | 从最大层级收起一级 |
| `Ctrl+Shift+Space` | 切换展开/收起 |

</details>

<details>
<summary><b>文本格式化</b></summary>

| 快捷键 | 功能 |
|--------|------|
| `Alt+Shift+B` | 加粗 |
| `Alt+Shift+I` | 斜体 |
| `Alt+Shift+H` | 高亮 |
| `Alt+Shift+2` | 删除线 |
| `Alt+Shift+L` | 移除换行符 |

</details>

<details>
<summary><b>其他操作</b></summary>

| 快捷键 | 功能 |
|--------|------|
| `Alt+Shift+C` | 复制节点 |
| `Alt+Shift+V` | 粘贴节点 |
| `Alt+Shift+Z` | 撤销 |
| `Alt+Shift+Y` | 重做 |
| `Alt+Ctrl+Shift+Z` | 替换为上一次文本 |
| `Alt+E` | 居中当前节点 |
| `Alt+Shift+E` | 居中整个导图 |
| `Ctrl++` / `Ctrl+鼠标滚轮↑` | 放大视图 |
| `Ctrl+-` / `Ctrl+鼠标滚轮↓` | 缩小视图 |
| `Ctrl+0` | 重置缩放 |

</details>

### AI 功能配置

1. **设置 AI 服务**
   - 打开插件设置 → AI 服务配置
   - 选择提供商（OpenAI、Gemini、Deepseek 等）
   - 输入 API Key 和模型名称

2. **使用 AI 扩展**
   - 点击节点上的 🧠 按钮
   - 或 `Ctrl+双击` 节点
   - 选择扩展方式

3. **自定义提示词**
   - 插件设置 → AI 自定义提示词
   - 使用 `{{nodeContent}}` 占位符
   - 保存后立即生效

---

## 🛠️ 安装

### 使用 BRAT 安装（推荐）

[BRAT](https://github.com/TfTHacker/obsidian42-brat)（Beta Reviewers Auto-update Tester）允许你直接从 GitHub 安装并自动更新插件。

1. 从 Obsidian 社区插件安装 BRAT 插件
2. 在设置 → 社区插件中启用 BRAT
3. 打开 BRAT 设置，点击"Add Beta plugin"
4. 输入仓库网址：`https://github.com/springrain1/obsidian-xmind-plugin`
5. 点击"Add Plugin"，BRAT 会自动安装 SuperMind
6. 在设置 → 社区插件中启用 SuperMind

> **提示**：BRAT 会自动检查更新，并在新版本可用时通知你。

### 手动安装

1. 从 [Releases](https://github.com/springrain1/obsidian-xmind-plugin/releases) 下载最新版本
2. 解压到：`<vault>/.obsidian/plugins/obsidian-xmind-plugin/`
3. 重启 Obsidian
4. 在设置 → 社区插件中启用插件

---

## 🔄 最新版本

### v2.5 - 设置页面重构
- ✨ 设置页面两级 Tab 导航布局（通用/AI/授权），告别长页面滚动
- ✨ Dopamine 紫色渐变导航栏，浅色/深色主题兼容
- ✨ 懒加载 Tab 内容面板，Tab 状态记忆
- 🐛 修复 BASE 视图 AI 洞察无法获取筛选文档问题（适配 Obsidian 新版 DOM 结构）
- 🐛 修复 AI 子 Tab 间距不一致、授权面板 Plus 功能说明缺失等问题

📖 查看 [完整更新日志](CHANGELOG_cn.md)

---

## 💬 反馈与支持

如果你遇到任何问题或有建议：
- 在 GitHub 提交 [Issue](https://github.com/springrain1/obsidian-xmind-plugin/issues)
- 请详细描述问题和复现步骤

---

## 🙏 致谢

- Obsidian 社区
- XMind 团队
- 所有用户和支持者

---

<div align="center">

**Made with ❤️ for Obsidian**

</div>
