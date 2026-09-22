# SuperMind 更新日志
一款obsidian xmind&ai 思维导图插件

## v1.0:
- 开发xmind与Markdown本地相互转换、整合xmind-viewer插件预览功能

## v1.1:
- 加入XMind AI在线转换网站（复制文件内容后打开），插件配置可关闭需要联网的功能，保障用户隐私

## v1.2:
- 增加文件同步，全库或某一指定文件夹同名的xmind与Markdown进行绑定，修改一处两者同步

## v1.3:
- 修复格式转换文段丢失bug、多空行问题

## v1.4:
- 自动提取xmind文件的缩略图在阅读视图预览、XMind预览器服务区域可选、优化插件设置界面

## v1.5:
- 合并obsidian-enhancing-mindmap并改进：

1、保留之前的思维导图基础上，对大纲视图、地图概览和无YAML支持；

2、新增7种专业主题和6种多巴胺配色主题 ——提供现代化的视觉体验；

3、新增背景颜色选择器、节点线条智能颜色组系统。


## v1.5.1:
- 修复思维导图与markdown切换、导出png等命令功能，针对13种思维导图主题的选中节点外框颜色视觉优化。

## v1.6:

1、修复打开为思维导图，编辑三级主题时导致一二级主题下文本内容丢失问题（切勿直接编辑一二级主题）；

2、新增AI服务配置，支持本地模型和在线模型的API调用，在线模型OpenAI兼容服务内置Free Qwen3平台Qwen3-30B-A3B模型的免费 API Key；

3、Markdown视图右键菜单集成mindmap AI选项，支持自定义Prompt；

4、思维导图视图添加悬浮图标🧠悬浮按钮，点击后显示AI扩展菜单。选择扩展方式（生成想法、生成解析、详细展开、实际应用等，支持自定义Prompt），AI会基于节点内容生成子节点。（▲注意：需要使用指令模型，如DeepSeek-V3.1)


## v1.6.2:

1、修复打开为思维导图，编辑一二三级主题下文本内容可能丢失问题；

2、修复思维导图视图下，节点删除等部分类似xmind快捷键失效问题；

3、新增Markdown视图右键菜单mindmap AI、思维导图视图AI扩展下弹窗动态刷新字符量；

4、优化Markdown视图右键菜单mindmap AI，为再次生成的md文件添加时间戳，以避免生成失败。


## v1.6.4:

1、右键菜单中的 mindmap AI 功能重构（Plus功能）
- 弹窗显示模式流式输出效果
- 内容支持编辑与插入功能（Callout 格式优化），▲推理模型（如DeepSeek-R1）建议删除顶部`<think>`再插入
    智能 Callout 类型选择，根据不同功能的特性，自动选择合适的 Callout 类型：
    **分析类功能** (`核心洞察`、`深度分析`)：
    - 使用 `info` 类型
    **生成类功能** (`内容扩展`、`创意思考`)：
    - 使用 `tip`类型
    **优化类功能** (`结构化总结`、`润色文本`、`同义词替换`)：
    - 使用 `success`类型
    **翻译类功能** (`翻译为英文`、`翻译为中文`)：
    - 使用 `quote` 类型
    **技术生成功能** (`生成Mermaid`、`生成LaTeX`)：
    - 使用 `faq` 类型
    **自定义功能** (`自定义分析`、`自定义提示词`)：
    - 使用 `note` 类型
- 内容支持重新生成、替换功能

2、更多选项菜单中的 mindmap AI 功能优化（Plus功能）
- 先新建文件（文件顶部添加 YAML front matter），在新文件流式输出，实现打字机效果
- 保存路径可在插件设置界面配置
- 文件名冲突自动处理
- 内置文档分析、生成摘要、提取关键词，还支持插件设置中的自定义Prompt（与右键菜单共用提示词），内部已将{{highlight}}转义为{{content}}

3、新增Plus功能授权使用，如上两个功能可试用7天（觉得好用可自行赞赏获取注册码），过期后其它功能均不受限制


## v1.7:

1、新增：
- 思维导图视图显示表格、callout、引用、文本块（参考幕布的"笔记"功能，在思维导图节点中显示文本块）
- 每个思维导图视图都有独立的按钮和面板，分屏时不会互相影响
- 思维导图视图嵌入双链内容链接跳转功能，优化其主题搭配、增加打开图标
- 思维导图视图上添加快捷设置按钮：思维导图、主题布局、方向颜色组和背景颜色

2、修复：
- 设备序列号基于真实的硬件信息生成，而不是基于IP地址或其他易变因素，以确保序列号唯一且稳定，避免授权信息失效
- XMind文件打开方式现在都统一在标签页打开，如右键"在预览器中打开"、阅读视图下点击嵌入渲染后的XMind文件缩略图
- 所有以`- `开头的文档，出现`Sub title`，修改为纯列表Markdown打开后，根节点显示为文件名，编辑后导出时，根节点会转为`# `文件名（没有`# `标题也会自动添加），一级列表项转为`## 一级-1`
- 视图问题，切换为思维导图视图后，无法再切换为workflowy视图（联用obsidian-workflowy-plugin插件）
- 快捷键全部在视图内置，清空插件设置界面的默认快捷键配置，避免与Obsidian原生快捷键冲突
- 同文档左右分屏，右侧打开思维导图，使得当左侧编辑 Markdown 后，右侧思维导图视图会保持原来的滚动位置和缩放比例，不会自动移动到中心节点位置；以及左侧编辑Markdown时，焦点自动转移至右侧思维导图视图问题
- `显示画布概览`和`显示大纲视图`按钮和对应的部件被添加到了全局DOM层级，脱离思维导图视图的层级结构
- 解决嵌入内容存在的重复渲染
- 解决切换到Markdown视图时的文本重复问题
- 编辑有文本块的节点后，连接线正确连接到节点的居中位置
- 表格内容会变为HTML格式，利用API将HTML转换回Markdown字符串
- 解决表格、callout、引用，三者与无序列表先后顺序问题，以及callout块第二行以及后面丢失`>`问题


## v1.8:

1、新增：
- 思维导图视图折叠状态的持久化：参考obsidian-workflowy-plugin项目的方案，在设置界面添加对应的UI控件，使用`<!--c-->`注释标记，实现两者折叠联动
- 右键菜单和更多选项中，以及节点AI功能支持AI获取双链、块嵌入、块引用链接解析，不是只传递链接语法本身，可在设置界面中开启
- 思维导图视图对以节点`- `开头的代码块支持（换行）

2、修复：
- 数据同步问题：在 Markdown 视图和思维导图视图之间切换时，块引用 ID（^blockid）丢失，采取不过滤 ^blockid（原有折叠采用^nodeId），直接保留在节点文本中
- 修复左右分屏同一md文件，当编辑左边的 Markdown 时，右边的思维导图会同步更新，右下角的按钮（设置、地图概览、大纲视图）丢失或点击无响应问题


## v1.9:

1、新增：
- 在Obsidian base中实现类似flomo AI洞察，完成`AI洞察主窗口`、`发现洞察视角`、`创建洞察视角`和`编辑洞察视角`页面
- AI洞察双向链接展开深度配置
- AI洞察数据持久化：所有视角的配置（包括对内置视角的修改）存储于插件的 data.json，便于下次加载

2、修复：
- 进入思维导图视图后编辑节点内容，切换回Markdown视图，部分内容重复问题
- `# `一级标题和`## `二级标题下的文本块、callout在思维导图显示问题，根据主题合理搭配，单独优化科技主题和商务主题的Callout
- 文件名规则修改，目标格式：日期-AI洞察-XXX；内容格式修改，将分析信息和文档列表合并到一个 [!info] callout 中

## v2.0:

1、新增：
- 图片导出功能，文档正文选择内容右键“导出选中内容”，文档页面右上角更多选项“导出为图片”
- 导出预览模态框中的"设置"按钮
    - 图片设置：图片宽度、卡片概要、显示文件名、显示日期
    - 作者信息：显示开关、作者名称、额外文本、头像上传、对齐方式、显示位置
    - 水印设置：启用开关、水印类型（文本/图片）、文本内容、颜色、字体大小、透明度、旋转角度、宽高等
- 设置会自动保存到插件的 data.json 中
- 优化移动端适配，移动端思维导图界面增加类似Xmind移动端的Tab和Enter虚拟按钮，编辑节点状态下也能使用
- 移动端专用的AI字符量进度指示器
- 作者信息与12大主题样式合理搭配
- 将插件名称从`XMind Integration`修改为`SuperMind`，对内部所有的相关名称置换

2、修复：
- 导出预览模态框渲染、右侧间距和颜色搭配、圆角问题、优化深色专业模板的代码块背景色等
- 优化导出预览模态框中的复制粘贴
- 移动端无法加载问题，移除不支持的功能，如Markdown与Xmind文件转换功能
- 移动端导出预览模态框的设置按钮与取消等3个按钮不在同一行，下载按钮直接调用 navigator.share() 分享图片文件
- 移动端导出预览模态框无法通过触摸滑动来滚动内容
- 移动端AI字符量弹窗位置调整，显示在文档标题区域下方
- 深色专业模板的表头和callout不显示、现代渐变模板的表头字体由黑色改为白色
- 导出设置面板中，头像预览显示不完整（x 被截断）
- 绿色自然模板和现代渐变模板的右侧边距改为0，不需要为装饰留空间

## v2.1:

1、优化：
- 为 xmind 插件的设置界面添加更具体的 CSS 选择器前缀，避免与Hinote等插件设置界面冲突

2、修复：
- zoom 命令面板和快捷键设置中命令丢失（Zoom: Zoom in和Zoom: Zoom out the entire document）
- 添加yaml的文档，重启Obsidian后偶发出现在右侧边栏渲染显示思维导图
- 修复`src/MindMapView.ts`、`main.ts`等文件中的类型错误

## v2.2:

1、新增：
- 正文中的代码块作为其标题子节点渲染，增加适配各各主题样式
- 标题节点（level < headLevel）：保留 `<br>` 用于单行标题内的视觉换行；
  列表项节点（level >= headLevel）：将 `<br>` 转换为 `\n` 用于多行续行格式（与obsidian-workflowy-plugin插件兼容）
- 思维导图视图点击标签触发全局搜索
- 增加渲染canvas、base、pdf++、Eagle等嵌入文件渲染功能
- 脚注内容的保护，思维导图视图将脚注改为上标渲染显示，`[^xxx]` 转换为 `<sup class="footnote-sup">[xxx]</sup>`；
- 增加任务列表的渲染功能，实现obsidian-workflowy-plugin插件相似的功能，复选框可点击、内容置灰

2、优化：
- 仅表格和文本块为只读，其他可编辑修改

3、修复：
- 修复当标题下直接是 Callout（没有普通文本）时，进入思维导图视图后编辑节点内容，切换回Markdown视图，丢失标题问题
- 三级标题跟随callout被替换显示的问题
- 当嵌入内容加载后节点尺寸变大，如果节点位置超出画布边界，内容会被裁剪问题
- Excalidraw 嵌入的图片（blob URL）初始渲染时未落在节点线条上问题
- 需要双击节点或者手动勾选复选框后才渲染删除线样式，解决添加的mm-todo-completed类被清除问题

## v2.3:

### 🚀 核心架构优化

1、**内存管理系统重构**
- 实现统一的 `ResourceManager` 资源管理器,集中管理事件监听器、定时器和观察者
- 所有组件 (INode, MindMap, MindMapView) 支持完整的生命周期管理
- 添加 `dispose()` 方法,确保组件销毁时正确释放所有资源
- **[破坏性变更]** 完全移除 `INode.mindmap` 属性及向后兼容层,统一使用 `getMindMap()` 方法(已修复由此导致的50+处潜在空指针异常)

2、**异步安全性增强**
- 在所有异步回调中添加 `isDestroyed` 检查,防止访问已销毁对象
- 重构 `_delay()` 方法,所有异步资源通过 ResourceManager 管理
- 优化 MarkdownRenderer 渲染回调的生命周期控制
- 修复 `appFocusIn/appFocusOut` 事件处理中的空指针异常

3、**开发模式诊断工具** (仅开发模式启用)
- 新增 `DiagnosticStats` 类:跟踪资源使用情况,检测内存泄漏
- 新增 `PerformanceMarker` 类:测量关键操作性能,识别性能瓶颈
- 集成到 ResourceManager,自动统计资源分配和释放

4、**项目结构优化**
- 插件入口文件 `main.ts` 迁移至项目根目录
- 修复 `src/` 子目录下所有相关模块的导入路径
- 清理冗余的 `src/zoom-manager.ts` 文件

### 🐛 问题修复

1、**内存泄漏修复**
- 修复 `onunload()` 中未调用 `mindmap.dispose()` 导致的资源泄漏
- 修复事件监听器未正确移除导致的内存泄漏
- 修复 ResizeObserver 和定时器未清理的问题
- 修复 DOM 元素引用未释放的问题

2、**稳定性提升**
- 所有清理操作添加幂等性保证,可安全多次调用
- 添加完整的错误处理,确保部分清理失败时其他资源仍被清理
- 优化视图切换时的资源清理顺序
- 修复 `MapOverview.destroy()` 中的空指针异常

3、**类型兼容性修复**
- 修复 `settingTab.ts` 中 `this.app` 属性类型错误
- 修复 `SettingsService.ts` 中 `debugMode` 属性名错误 (应为 `globalDebugMode`)
- 修复 `xmind-to-md.ts` 和 `md-to-xmind.ts` 中 `Buffer` 类型不兼容问题
- 修复 `xmind-markdown-processor.ts` 中 `MarkdownPostProcessorContext` 类型错误
- 修复 `debug-logger.ts` 导入路径错误


## v2.4:

### 🤖 AI Skills 技能系统（Plus 功能）

1、**SKILL.md 技能定义**
- 基于 Markdown 的技能定义格式，支持 YAML 元数据（名称、描述、输出类型、变量等）+ Prompt 模板
- 支持多种输出类型：markdown、mermaid、excalidraw（Obsidian 模式 / 标准模式 / 动画模式）、canvas（Obsidian Canvas / JSON Canvas）、base
- 内置默认技能模板，用户可在 vault 的 `skills/` 文件夹下自定义技能

2、**技能管理器**
- 自动扫描 vault 中 `skills/` 文件夹，发现和加载 SKILL.md 技能文件
- 设置界面中的 Skills 管理面板，支持查看、启用/禁用技能
- 技能注册表，支持按输出类型筛选

3、**技能执行器**
- 流式输出：AI 生成内容通过 `StreamingFileWriter` 实时写入文件，实现打字机效果
- 智能内容提取：自动去除 AI 输出中的解释性文本，仅保留可渲染的有效内容
- 支持 Excalidraw 内容提取（保留 `%%` 标记后的完整内容）、Mermaid 代码块提取、Canvas JSON 提取等
- 文件名生成规则：`{YYYYMMDD}-{技能名称}{-源文件名}.{扩展名}`
- 文件名冲突自动处理（添加数字后缀）

### 📁 统一保存路径管理

- 新增三种保存路径模式：
  - **自定义路径**（custom）：用户指定的固定路径
  - **Vault 根目录**（root）：保存到 vault 根目录
  - **源文件同目录**（source）：保存到当前文件所在目录
- 所有 AI 功能统一复用：右键菜单 AI、更多选项 AI、AI 洞察、AI Skills
- 设置界面下拉选择模式 + 条件显示自定义路径输入框
- 目录不存在时自动创建（使用 Obsidian API `vault.createFolder()`）

### ⚙️ AI 设置增强

1、**maxTokens 可配置**
- 在 AI 服务设置中新增最大输出 Token 数配置项
- 支持范围 256 ~ 100000，默认 8192
- 所有 AI 提供商（OpenAI、Anthropic、Gemini、Deepseek、Ollama、硅基流动）统一使用

2、**AI 停止按钮**
- AI 洞察生成和 Skills 技能执行均支持中断
- 移动端进度指示器集成停止按钮，点击即可取消正在进行的 AI 请求
- 思维导图视图节点 AI 扩展也支持停止
- 基于 AbortController 实现，确保资源正确释放

### 🐛 问题修复

- 修复 maxTokens 设置项字体颜色在深色主题下不可见问题
- 修复 AI 进度弹窗未居中显示问题
- 修复 Excalidraw 内容提取在 `%%` 标记处被截断问题
- 修复 AI 生成文件时目录不存在导致失败问题（`AIInsightSystem`、`StreamingFileWriter`、`OutputHandler` 均添加目录自动创建）
- 修复 Obsidian API 使用不规范问题（移除 `@ts-ignore` 和 `as any` 强制转换，使用正式 API `vault.createFolder()`）
- 修复文件名重复时未正确去重问题


## v2.5:

### 🎨 设置页面重构

1、**两级 Tab 导航布局**
- 设置页面从单一长页面重构为三个主 Tab（通用、AI、授权🔑）+ 子 Tab 导航
- 通用 Tab 下设"思维导图"、"XMind"、"其它"三个子 Tab
- AI Tab 下设"服务配置"、"公共配置"、"Prompt"、"Skills"四个子 Tab
- 授权 Tab 无子 Tab，直接显示 Plus 授权内容
- 懒加载 Tab 内容面板，仅在首次激活时渲染
- Tab 状态记忆，重新打开设置页面恢复上次查看的 Tab

2、**Dopamine 紫色渐变导航栏**
- 主 Tab 导航栏使用紫色渐变背景，按钮激活/悬停状态
- 子 Tab 导航栏使用较小内边距和背景色高亮
- 浅色/深色主题自动适配（渐变亮度/饱和度调整）
- 所有新增 CSS 类使用 `mm-settings-` 前缀，避免样式冲突

3、**代码架构优化**
- 新增 `SettingsTabLayout` 统一设置页面类，替代旧的 `XMindSettingTab`
- 渲染函数提取到 `src/settings/renderers/` 目录（GeneralRenderers、AIRenderers、LicenseRenderer）
- 移除 AI 设置中的硬编码内联样式（如 `background-color: #978bd0`），改用 CSS 类
- PromptSettingsTab 和 SkillsSettingsTab 直接复用，传入新容器

### 🐛 问题修复

- 修复 AI 子 Tab（公共配置、Prompt、Skills）内容与导航栏之间缺少间距问题
- 修复 Prompt 和 Skills 子 Tab 标题文字对齐不一致问题
- 修复授权面板第 4 步获取注册码流程缺少 Plus 功能说明括号内容

### 🔧 BASE 视图兼容性修复

- 修复 BASE 视图 AI 洞察显示"0 条笔记"、"未找到可分析的文档"问题
- 适配 Obsidian 新版 BASE 视图 DOM 结构变更（内部链接从 `<a class="internal-link" href="...">` 变为 `<span class="internal-link" data-href="...">`）
- `BaseDocumentResolver` 选择器从 `a.internal-link` 改为 `.internal-link`，兼容新旧版本
- 属性读取优先 `data-href`，fallback 到 `href`，确保向后兼容


## v2.6:

### 🔄 批量 XMind 与 Markdown 转换

1、**文件列表批量操作**
- Obsidian 文件列表支持文件夹右键批量转换所有 XMind/Markdown 文件
- 按住 Alt 键多选文件进行批量转换
- 支持双向转换：XMind ↔ Markdown

2、**全面格式支持**
- 文字颜色和背景色
- 笔记（含有序无序列表）
- 标签
- 概要
- 外框
- 折叠状态
- 公式
- 图片
- 自由主题
- 多 sheet

3、**大纲笔记支持**
- 新增命令（Ctrl+P）：支持"一二三级标题 + 无序列表"与"全部无序列表"相互转换
- 兼容 obsidian-workflowy-plugin 插件渲染编辑


## v2.7:

### ⚙️ XMind 转换设置

1、**附件路径选项**
- XMind → Markdown 附件（如图片）三种保存路径模式：
  - **使用 Obsidian 默认附件路径**（默认）
  - **原文件所在路径**：保存到源文件同目录
  - **自定义路径**：用户指定目录
- 可选开启保留 XMind 文件名文件夹结构

### 🐛 问题修复

1、**思维导图视图画布概览**
- 修复画布概览鼠标拖动后还会滑动一段距离的惯性问题

2、**AI 服务配置**
- 新增上下文窗口 Token 数配置项

3、**思维导图视图备注与分隔符**
- 修复备注 notes 丢失问题
- 修复 `---` 分隔符丢失问题
- 内容层将自由主题和另一 sheet 自动变为标题名下方的二级标题

4、**XMind → Markdown 备注格式**
- note 加粗斜体用更稳定的写法表达同样的视觉效果
- 现在优先输出 `<strong>` / `<em>`，避免连续 `*` 在 Obsidian 中被错配


## v2.8:

### 🎨 思维导图视图增强

1、**表格渲染**
- 思维导图视图新增渲染节点表格
- 支持表格节点下子节点

2、**块级组件渲染**
- 修复 Callout、表格、代码块、引用块组件渲染
- 标题下的 Obsidian 块级组件现在会作为可渲染子节点保留

### 🐛 问题修复

1、**Markdown 转换问题**
- 修复思维导图视图回写 Markdown 时，Callout、表格、代码块、引用块组件之间空行被清掉的问题
- 修复 note 空行丢失问题

2、**节点层级问题**
- 修复思维导图视图新增节点后，转为 Markdown 后内容对应层级错位问题

3、**列表转换问题**
- 修复"三级标题 + 无序列表"与"全部无序列表"转换后的同级别无序列表之间存在空行问题
- 保留 note 空行

### 🤖 AI 技能增强

4、**新增技能：xmind-mdoutline-generator**
- 基于原文提取出思维导图大纲
- 自动添加 XMind 独有组件（概要、外框等）

## v2.9:

### 🌍 全局国际化 (i18n)

1、**全量多语言包支持**
- 全面消除插件代码中的硬编码中文字符，支持简体中文、繁体中文和英文界面的无缝切换。
- 基于 `opencc-js` 对繁体中文翻译进行了精细化调整，确保词汇更符合各地区语言习惯。
- 所有的错误提示、异常处理、设置界面、通知弹窗均已全面实现国际化。

2、**AI 菜单提示词国际化**
- 为 11 项默认 AI 提示词（包含“核心洞察”、“内容扩展”、“生成 Mermaid”等）的 UI 展现名称和 prompt 模板实现了全语种支持。
- 优化了文档右键菜单项的条件渲染与功能识别逻辑，根据当前用户的系统语言动态匹配对应的 AI 功能指引。

3、**流式组件样式智能分发适配**
- 重构了 AI 结果流式弹窗（StreamingModal）的 Callout 渲染规则，针对不同语言环境传递的内部函数名称，采用多维词汇映射的容错匹配方案，保证最终呈现 UI 的美观度和样式的一致性。

## v3.0：

### 🤖 PiAI 引擎全量重构

1、**AI 服务内核迁移至 PiAI**
- 移除旧版自研 AI 服务（OpenAI、Anthropic、Gemini、Deepseek、Ollama、SiliconFlow 等分散 Provider 文件），统一改用 `@earendil-works/pi-ai` 引擎
- 新增 `PiAIService` 统一服务层，整合模型注册、凭据存储、流式输出与生命周期管理
- Provider 改为声明式注册，天然支持 OpenAI、Deepseek、Anthropic、Gemini、OpenAI 兼容端点等

2、**凭据安全与 OAuth 登录**
- 新增 `ObsidianCredentialStore`，API Key 由明文设置迁移至独立凭据存储，`fetchJson` 支持请求中断
- 新增 AI 认证弹窗（AIAuthModal），支持 API Key 与 OAuth 授权两种方式，适配桌面与移动端
- 新增 CodeBuddy Provider 完整实现：设备码 OAuth 流程、JWT 解析、鉴权请求、流式响应与跨平台网络层适配
- 旧版设置自动迁移（`normalizeAISettings`），无需用户重新配置

3、**模型配置面板重构**
- 新增统一的模型配置面板（AIModelSettingsPanel），一个面板即可管理多模型档案
- 支持模型档案切换、自定义端点、上下文窗口等配置
- 新增设置归一化测试，保障新旧配置兼容

### 🛠️ Pi Agent 工具调用（Agent Skills 标准）

4、**Agent 工具集**
- 新增 `AgentTools`：提供 `read`、`edit`、`write`、`ls`、`find`、`grep`、`bash` 等 Obsidian 原生工具
- `edit` 支持 `edits[]` 批量局部替换，避免 AI 为改一处而重写全文，节省 Token 并防止截断
- `grep` / `find` 支持跨库正则全文检索与文件名检索，多文档洞察按需提炼，显著降低上下文占用
- 工具输出物理截断保护（2000 行 / 50KB），阻断上下文撑爆

5、**技能执行器（ReAct Agent Loop）**
- `SkillExecutor` 重构为多轮 ReAct 工具调用循环，遵循 Agent Skills 渐进式披露标准
- System Prompt 按 Agent Skills 标准构建，技能按需通过工具加载 SKILL.md、references 与脚本
- `SkillManager` 生成 XML 格式技能列表供系统提示词使用
- `SkillParser` 新增技能名与描述校验，`PiAIService` 新增 `streamSimple` 简化流式调用

### 📂 文件与文件夹右键 AI

6、**多选与文件夹上下文菜单**
- 文件列表支持多选文件、文件夹右键直接发起 AI 洞察
- 文件夹右键可批量收集 Markdown 文档进行 AI 分析
- AI 洞察支持从所选中文件/文件夹直接收集文档，交互更顺畅
- 新增中英文右键菜单本地化文案

### 🐛 问题修复与优化

7、**稳定性与兼容性**
- `PiAIService` 引入生命周期管理，插件卸载时取消所有在途认证、发现、流式与刷新任务
- `fetchJson` 处理空响应体，必要时回退解析文本
- 按 Provider 动态解析服务地址（如 codebuddy、openai-codex）
- esbuild 目标调整为 ES2020，新增 Node 模块 shim 与原生模块缺失告警，提升构建兼容性
- AI 认证弹窗样式重做，适配不同屏幕尺寸

## v3.1：

### 🎯 Skill 任务抽屉与多轮会话交互 (Skill Task Drawer)

1、**非阻塞式任务执行抽屉**
- 全新任务执行抽屉 UI（Skill Task Drawer）替代原有阻塞式模态弹窗，移除灰色背景遮罩；执行过程中用户可无缝继续在 Obsidian 中阅读与编辑笔记。
- 引入 `SkillAgentSession` 会话状态管理，支持多轮连续追问与微调；用户可针对已生成的产物直接输入后续修正指令（如补充模块、调整排版），告别单次执行后重头再来的割裂体验。
- 实时活动流（Activity Feed）动态可视化展示 Agent 的工具调用过程（read / edit / write / bash）、实时 Token 消耗统计与执行轮次。
- 产物卡片（Artifact Card）智能检测并锁定最终交付物文件，支持一键在 Obsidian 叶节点中快速打开。

2、**极简悬浮小气泡（Collapsible Floating Bubble）**
- 任务抽屉支持一键最小化折叠为屏幕右下角的轻巧悬浮气泡，带有呼吸脉冲指示灯（Pulse Dot）实时反馈 Agent 执行状态。
- 点击气泡随时平滑展开抽屉，不遮挡主笔记工作区；支持在执行过程中一键安全中止（Abort）。
- 上下文解绑控制（Detach）：支持在抽屉中一键移除已绑定的源文档上下文，灵活切换为无上下文模式独立执行。

### 👁️ 多模态视觉与智能链接解析 (Multimodal Vision & Link Resolver)

3、**多模态大模型自动适配**
- `PiAIService` 升级视觉模型动态支持判定（`resolveProfileVisionSupport`），兼容各大主流多模态模型及自定义 OpenAI 兼容端点，支持直接处理图片输入。
- 隐私防泄漏保护：可通过 `blockImages` 配置一键关闭所有图片读取，防止意外上传敏感图像。
- 统一 Prompt 模板解析引擎：支持单趟正则解析 `{{highlight}}`、`{{content}}`、`{{nodeContent}}`、`{{fullContent}}`、`{{markdownContext}}` 及 `${var}` 等多种占位符，未显式声明占位符时自动追加上下文。

4、**富文本与图片附件智能解析提取**
- 重构 `LinkResolver` 链接解析器，支持递归解析 Wiki 链接、嵌入块引用及本地与网络图片（`![[image.png]]`、`[alt](url)` 等）。
- 无论是在文档右键 AI、思维导图节点 AI 扩展，还是多文档 AI 洞察系统，均会自动提取并打包相关插图/图表给视觉模型，实现图文融合的深度分析。

### 🧠 XMind 深度互通与原生新建技能 (XMind Integration & Creator Skill)

5、**原生新建 XMind 技能（xmind-creator）**
- 新增第 7 个内置核心技能：`xmind-creator`，让 AI 直接基于对话、需求或笔记大纲生成原生 `.xmind` 思维导图文件。
- 依托底层强大的编译引擎，AI 仅需输出结构化 Markdown，即可自动编译并包含外框（Boundary `[B]`）、概要（Summary `[G]`）、标注（Callout `[P]`）、跨分支联系（Relationship `[^1]`）、待办状态（Task `[ ]`）、分类标签（`#tag`）、主题备注（Notes `> `）和数学公式（Math `$..$`）。

6、**XMind 文件免转换直接参与 AI 洞察与分析**
- 文件列表右键或文件夹批量分析时，全面支持 `.xmind` 文件；
- 洞察系统与右键菜单可无感将 `.xmind` 文件在内存中快速转码为 Markdown 大纲并提取图片附件，支持跨文件集直接生成汇总导图与核心洞察。
- 优化 XMind ↔ Markdown 转换中的图片提取与防重复落盘复用机制（`reuseExistingImage`）。

### 🛡️ 工具链安全性与架构精简

7、**工具执行确认与沙箱隔离**
- AI 设置中新增「Skills 工具调用确认」选项（`requireToolConfirmation`），可配置关键工具（write / edit / bash）执行前是否弹出用户授权确认弹窗，兼顾自主执行与安全掌控。
- 提取独立的 `truncateOutput` 物理截断工具，严格防范工具输出撑爆上下文；系统 Shell 脚本执行隔离至系统临时目录，执行完毕后自动清理过程文件。
- 产物自动内嵌：支持在源文档末尾自动追加产物双链（`![[artifact]]`），并在思维导图视图中实时自适应刷新布局。

8、**代码瘦身与全量国际化**
- 大幅移除旧版废弃的 XMind 查看器视图类、陈旧 Markdown 差异对比类及未使用的配置项（清理 -4300+ 行冗余代码），显著降低插件包体积与内存占用。
- 补充中英繁三语本地化资源包，全面覆盖抽屉交互、模型管理面板与确认弹窗。

### ⚡ AI 任务抽屉 Slash 命令与多技能顺序流水线 (Slash Commands & Skill Pipeline)

8、**抽屉 Slash (`/`) 技能自动联想与资产接力协议**
- **0 Token 本地 Slash 模糊联想 (`DrawerSkillSuggest`)**：对齐现有的 `@` 文件联想架构，在抽屉输入框键入 `/` 即刻弹出本地已启用的全部技能列表，展示图标、本地化名称、说明与 `/slug` 指令，支持上下键选择与回车自动补全，具备完整的行首/空白字符防误触守卫。
- **多轮会话资产自动接力协议 (Context Handover)**：会话级自动追踪前序轮次生成的 Markdown 交付物、封面图与排版 HTML 路径；当后续轮次输入 `/wechat-article-formatter` 或 `/wechat-draft-publisher` 等斜杠命令时，自动将前序资产路径作为标准资产指针注入，实现“起草 ➔ 排版 ➔ 发布”公众号全流程在同一抽屉内 0 粘贴无缝流转。
- **动态抽屉技能感知与状态更新**：在首轮输入（如 `/wechat-km-writer ...`）或后续多轮中敲击 `/` 命令切换技能时，抽屉标题栏图标与名称即时动态刷新，并自动将工作区基准目录（`baseDir`）切换到新技能所在路径。
- **设置面板冷启动回弹加固**：修复设置面板在 Obsidian 重启冷启动阶段因网络目录尚未就绪而过度防御将已保存模型误重置为 `'auto'` 并清空思考档位的缺陷；只要用户已有保存配置，100% 严格尊重用户选择。

## v3.2：

### 🚀 通用 AI Copilot 与多源上下文注入 (Universal Copilot & Context Injection)

1、**通用 AI Copilot 模式与动态技能路由**
- 支持无需指定前置技能直接唤起通用 AI Copilot 任务抽屉，随心向智能助手提问或下达跨任务指令。
- 动态技能感知：通用模式下，模型通过 `read` 工具读取某个特定技能配置时，抽屉自动识别并实时同步更新标题与技能图标。
- 专属技能卡片平铺选择：在初态表单中支持一键锁定已启用的专属技能或切换回通用助手。
- 抽屉单例守护（Guard）：已有正在运行或折叠为悬浮球的抽屉时，再次唤起会自动平滑展开并聚焦输入框，杜绝重复创建幽灵弹窗。

2、**跨笔记划词选区直投与统一附件胶囊**
- 文档划词右键投喂：阅读长笔记时选中文本片段，右键一键「发送所选内容到 AI 抽屉」（`arrow-up-right`），作为参考上下文存入待发送队列。
- 精准行号与边界修正：记录 1-based 行号范围，自动处理末行行首（`ch===0`）空尾行溢出边界。
- 渐进式披露防爆机制：选区超过 6,000 字符时自动退化为 offset/limit 结构化读取指针，避免长文本直接塞入造成的 Token 浪费与模型幻觉。
- 统一待发送附件行：图片微缩卡片与文本/文件胶囊统一排版，对齐 16×16px 白底细边框关闭 X 按钮，文件名超长自动省略截断，彻底解决全局按钮样式撑破胶囊边框问题。

3、**0 Token 本地 `@` 文件模糊联想（DrawerFileSuggest）**
- 在追问输入框键入 `@` 即可唤起纯本地文件模糊搜索浮层，毫秒级联想 Vault 内可用文件（.md, .json, .csv, .xmind 等）。
- 100% 本地运算：基于 Obsidian 原生模糊算法，零网络请求、零 LLM Token 消耗。
- 键盘导航（上下键选择、Enter/Tab 挂载、Escape 取消）与中文输入法防抖保护；选中后自动剥离 `@query` 并将文件以 `$VAULT_PATH/` 轻量指针挂载为胶囊。
- 输入栏占位提示词全面升级：清晰指引 `@` 引用文件、划词右键投喂文本、粘贴或拖拽图片等完整多通道操作。

### 📚 知识库 Wiki Agent (LLM-Wiki) 与整库级技能

4、**Karpathy 风格个人知识库构建 Agent（wiki 技能）**
- 全新内置第 8 个核心技能 `wiki`，将自动化百科编纂、全库预扫描与渐进吸收能力引入 Obsidian。
- 抽屉内置快捷指令建议按钮组：支持一键填入 `/wiki ingest`、`/wiki absorb 10`、`/wiki query <问题>`、`/wiki status`、`/wiki cleanup`、`/wiki breakdown`。
- 配套脚本（`ingest.py`, `absorb.py`, `cleanup.py`, `breakdown.py`, `wiki_utils.py`）开箱即用，支持随插件版本升级自动检测并补齐 extraFiles 资产。

5、**Vault 级技能范围隔离机制**
- 架构层引入 `isVaultLevelSkill` 判定，严格区分单文档处理技能与全库级技能。
- 多文件/文件夹右键触发时，自动计算公共父目录作用域（`getCommonFolderScope`）传递扫描范围指针，严防整库笔记内容直接塞入造成的上下文炸弹。

### 🛠️ 解析器引擎加固与缺陷修复

6、**加固型 YAML 块标量解析引擎**
- `SkillParser` 全面支持 YAML 多行块标量语法（`|`, `>`, `>-`, `|-` 等）。
- 严格区分字面块（`|`，保留行间换行与段落空行）与折叠块（`>`，连续行折叠为空格）。
- 独占行首 `---` 分隔符匹配：修复块文本中包含普通 `---` 标记时误切断 frontmatter 的缺陷。
- 彻底保证块标量结束后紧跟的常规 key-value 字段 100% 完整保留、零丢键。

7、**边界防护与全量测试**
- 纠正 `detectSkillFromPath` 宽泛匹配，严格限制为真实注册的 `s.filePath` 前后缀比对，杜绝库内普通同名笔记越界误判。
- `startDrawerSession` 全链路包裹异常防御，彻底消除初始化失败导致抽屉控件被永久死锁在执行态的隐患。
- 添加 Vault 文件胶囊时增加重复检测提示（`file_already_added`）。
- 自动化单测扩充至 26 个测试套件共 375 项测试，通过率 100%。

## v3.3：

### 🚀 Google Antigravity 官方 Provider 与 OAuth 鉴权体系

1、**官方标准 Loopback + PKCE 授权流**

- 深度集成 Google Antigravity OAuth 鉴权体系：基于桌面端本地回环服务器（Loopback 51121 端口）与 PKCE (S256) 验证协议，实现点击授权后浏览器自动回调完成安全登录。
- 提供贴心的手动粘贴回调兜底交互，自动适配端口受限或无法唤起外部浏览器的极端场景。
- 完整接入 Antigravity 全系列大模型：支持 `gemini-3-pro`、`gemini-3-flash` 以及具备深度推理思考能力的 `claude-4-6-sonnet` 等顶尖模型，并在模型目录中支持层级分组呈现。
- 共享 `platform-fetch` 网络层，桌面端统一使用 Electron / Node 原生流式拉取，并具备移动端系统沙箱限制的优雅守卫。

### 🌐 原生 Web Access 联网搜索与网页抓取子系统 (Zero Dependencies)

2、**零额外依赖的高性能联网检索**
- 为 Agent 任务抽屉与 Skills 新增原生 `web_search` 和 `web_fetch` 工具，完全基于 Obsidian 原生能力与 Node 内置模块，实现 **0 新增 npm 依赖**。
- 多服务商架构与智能容灾（Auto 路由）：开箱即用免密 DuckDuckGo、中文权威检索推荐博查 (Bocha)、AI 专业事实检索 Tavily、高质量网页 Markdown 格式化提取 Jina。
- 严密的企业级 SSRF 防御屏障：彻底阻断私有 IP、回环地址（127.0.0.1 等）、云厂商元数据地址（169.254.169.254）、危险协议（file/gopher/ftp）以及 DNS 重绑定攻击。
- 智能正文降噪提取（`extractor.ts`）：基于 Obsidian 原生 `htmlToMarkdown` 与启发式算法剔除脚本、样式与导航噪音，严防长篇网页撑爆 LLM 上下文。

### 🎨 统一 AI 多提供商生图大模型架构 (Image Generation Runtime)

3、**ImagesModels 独立运行时与跨服务商生态**
- 引入 `@earendil-works/pi-ai` 平行独立的 `ImagesModels` 运行时，生图模型与文本对话模型解耦，支持独立配置、并行调用与零静默回退。
- 全面支持三大生图大模型平台：
  - **Google Antigravity**：支持 `gemini-3-pro-image` 高清绘图，无缝透传 16:9、1:1、9:16 等宽高比；
  - **OpenRouter 官方生图目录**：内置 52+ 顶级图像大模型（Flux.2-flex, SDXL, Seedream 等），支持动态拉取模型列表与 `aspect_ratio` 参数透传；
  - **自定义 OpenAI-compatible / 硅基流动端点**：提供 `openai-images` 与 `siliconflow` 协议分流，同时兼容 `b64_json` 直出与远程 URL 流式下载转码。
- 凭据安全隔离：自定义生图密钥独立保存于 `image-generation:custom` 命名空间，绝不落入明文配置文件。
- 移动端安全落盘：`AgentTools` 采用 Obsidian 原生 `base64ToArrayBuffer` 替换 Node 原生 `Buffer`，保障 iOS/Android/桌面全端二进制安全。
- 扁平化配置面板：在 AI 模型设置面板浏览态底部直接内联 `renderImageServiceSection`，无需额外弹窗即可完成服务商切换与模型管理。

### 📝 微信公众号矩阵技能现代化改造 (WeChat Skills Suite)

4、**4 大核心微信写作技能原生契约对齐**
- **技术科普写作 (`wechat-tech-writer`)**：强制在撰写正文前优先生成 16:9 封面图，规范 Agent 工具链，杜绝多轮重复交互。
- **知识管理深度写作 (`wechat-km-writer`)**：基于真实案例与认知模型撰写高质长文，自动化执行「封面图 + 核心架构图」双图协作流。
- **微信排版转换器 (`wechat-article-formatter`)**：纯原生 Mode A 转换管线，内嵌优雅排版 CSS，自动将 `![[...]]` 转换为适配微信后台的带外边距与圆角图片容器，代码块转为精美高仿 Mac 终端样式。
- **草稿箱一键发布 (`wechat-draft-publisher`)**：遵循 `$VAULT_PATH` 路径契约，严格禁止 AppSecret 存入 Vault，一键提交草稿箱并输出轻量状态报告。

### 🌍 全界面深度国际化与呈现解耦 (Comprehensive i18n & UX)

5、**UI 彻底告别中英混杂与硬编码**
- 清除 Copilot 抽屉、AI 认证登录弹窗（`AIAuthModal`）、设置面板及视图报错中的所有硬编码中文，全部抽离为 `skills.drawer.*` 与 `ai.auth.*` 等规范词条。
- 呈现层与 Prompt 意图解耦（`skill-i18n.ts`）：为内置全部 15 个技能在 `zh-cn` / `en` / `zh-tw` 提供纯正优美的本地化名称与功能描述，告别直显带有 Prompt 路由关键词的英文 Frontmatter；自建技能保持平滑回退。

### 🛡️ Agent 架构健壮性与防泄漏改进

6、**元数据解耦与重入安全防护**
- 引入 frontmatter `scope: 'vault' | 'content'` 规范，`isVaultLevelSkill` 优先基于元数据识别，彻底解耦硬编码 `wiki` 的限制。
- 抽屉重入防泄漏守卫：在 `renderDrawerLayout` 重新渲染时显式销毁旧版 `DrawerFileSuggest`，消除潜在的事件监听器泄漏隐患。
- 自动化单测套件扩充并实现全套测试文件全绿通过，通过率 100%。

### 🧠 CodeBuddy 订阅服务深度推理与多模态视觉解封 (CodeBuddy Thinking & Vision Hardening)

7、**CodeBuddy 推理档位透传与多模态能力重构**
- **动态绑定推理兼容模式**：将 `compat.supportsReasoningEffort` 与模型远端推理能力（`supportsReasoning`）动态绑定，修复此前硬编码 `false` 导致底座抹除 `reasoning_effort` 的底层 Bug，使 DeepSeek-v4.1 flash、混元推理版等深度思考模型完全恢复档位控制。
- **契约化思考档位全映射**：采用原生 `ThinkingLevelMap` 契约，遍历 Pi 全量标准档位（`PI_THINKING_LEVELS`），对远端未声明档位显式标记为 `null`；当 `canDisableThinking === false` 时将 `off` 标记为 `null`，杜绝用户在 UI 误选未支持档位产生上游 400 报错。
- **智能推理档位初始预选**：基于模型支持档位（`thinkingLevelMap`）智能推导首选推荐档位（优先 `high`），在模型切换与下拉渲染时自动选用有效推荐级别，废除向底座注入无效 `thinkingLevelMap.default` 或污染数据面的做法。
- **解封多模态图片输入**：废除基于模型 ID 正则模式匹配的脆弱白名单，直接基于服务端结构化能力声明（`!m.disabledMultimodal && m.supportsImages !== false`）放行图片多模态，确保思维导图 AI 洞察与 Agent 抽屉图片附件在所有兼容模型下透传无阻。
- **健壮性防线与网络载荷断言**：对远端 `supportedEfforts` 实施严格的 `Array.isArray` 运行时数组守卫与非空清洗；重构单测用例对真实网络请求体（HTTP Payload）进行全量断言，自动化测试套件全绿通过。

