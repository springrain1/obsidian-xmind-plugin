---
name: xmind-creator
description: Create and edit XMind mind maps (.xmind) with intelligent skeleton routing (MindMap, Timeline, Fishbone, OrgChart, LogicChart, TreeChart, BraceMap, Grid, Matrix, TreeTable, Spreadsheet) and 53 official color themes. Use when the user asks for a mind map, 脑图, 思维导图, 时间线, 鱼骨图, 架构图, 树形图, 括号图, or .xmind file.
---

# XMind Creator

将笔记、需求、演化史、排障分析或对话内容转换为结构化的 XMind 原生思维导图文件（`.xmind`）。

## 意图识别与骨架路由（Recipes）

在起草思维导图前，严格根据用户的主题意图选择最佳骨架（`skeleton`）与色彩调色板（`color`），在 Markdown 最顶部声明 YAML Frontmatter：

| 场景分类 (Recipe) | 典型触发词与场景 | 推荐 skeleton | 推荐 color |
|---|---|---|---|
| **时序演进 (timeline-narrative)** | 演化史、版本路线图、传记、会议日程、复盘时序 | `Timeline-1` (横向) 或 `Timeline-2` (纵向) | `Rainbow` 或 `Dawn` |
| **根因追溯 (causal-ribs)** | 事故调查、故障复盘、鱼骨图、因果分析、缺陷归因 | `Fishbone-1` (左向鱼头) | `Energy` 或 `Code` |
| **分工与层级 (hierarchy-tree)** | 部门架构、组织编制、WBS 项目分解、权责清单 | `OrgChart-1` (向下树形) | `Sophisticated` |
| **流程推导 (process-playbook)** | SOP 流程、排障手册、业务流转、逻辑推导 | `LogicChart-1` (向右展开) | `Code` |
| **二维对比 (matrix-compare)** | 竞品对比、SWOT、多维评测、特性矩阵 | `Spreadsheet-1` (二维矩阵) 或 `Matrix-1` | `Classic` |
| **分类归纳 (structure-tree)** | 知识体系、分类树、构成拆解、目录大纲 | `TreeChart-1` (树形) 或 `BraceMap-1` (括号图) | `GreenTea` |
| **看板与网格 (grid-board)** | 状态看板、四象限、清单分栏 | `Grid-1` | `Candy` |
| **快速通用概览 (quick-map)** | 读书大纲、头脑风暴、概念梳理、备忘总结 | `MindMap-1` (经典双向) | `Rainbow` |

完整骨架族（每族均有多个编号变体，共 42 个规范键，大小写不敏感且支持别名）：`MindMap-1..5`、`Timeline-1..7`、`Fishbone-1..3`、`OrgChart-1..3`、`LogicChart-1..3`、`TreeChart-1..6`、`BraceMap-1..3`、`Grid-1..5`、`Matrix-1..3`、`TreeTable-1..3`、`Spreadsheet-1`。

配色主题共 53 套：`Classic` `Classic-Colorful` `Rainbow` `Rainbow-Dark` `Energy` `Freshness` `Space` `Code` `Dawn` `Sophisticated` `Mono` `Gray` `Dancing` `Kimono` `Islands` `Roses` `Rainforest` `GreenTea` `Innocence` `Macaron` `Woodland` `Cream` `Hawaii` `Pinecone` `Dystopia` `Forid` `Quaint` `Variety` `Dazzling` `Vintage` `Dessert` `Vanllia` `Candy` `CyberPunk` `Sakura` `Fire` `Christmas` `DeepSea` `Violet` `Iris` `Painter` `Aurora` `Hills` `Cartoon` `Jungle` `Amethyst` `Geek` `Crimson` `Vivid-Light` `Vivid-Dark` `Vivid-Colorful` `Light-Grayish` `Light-Colorful` 等。可用 `color: 主题名/N`（N=1~6）选择主题的主色轮换变体。

## 输出规则（严格遵守）

1. 调用 `write` 工具，`path` **必须以 `.xmind` 结尾**
2. `content` **必须是包含 YAML Frontmatter 的纯 Markdown 正文**，严禁使用 \`\`\` 代码块包裹
3. **严禁输出 JSON / XML / XMind 数据结构** —— 插件会在落盘时自动编译为二进制 ZIP
4. 结构组织：
   - 顶部 Frontmatter 声明 `skeleton` 与 `color`（可选高级视觉：`background` 画布底色、`font` 字体、`grid-columns` 网格列数、`line-width` 线宽、`line-tapered` 渐细、`numbering` 编号）
   - 推荐标题风格：`# H1` 为中心主题，`## H2` 为一级分支，下级推荐用 `- 无序列表` 缩进
   - 或纯列表风格：第一个顶层 `- 节点` 为中心主题，Tab 缩进表示层级
   - 多画布：在文档正文用 `---` 水平分割线划分不同的 Sheet
5. 单图建议：深度 3–4 层，单节点子分支 ≤ 7 个，保持视觉清爽

## XMind 高级组件标记速查

底层转码引擎原生支持以下行内控制标记，书写在 Markdown 中即可自动编译为 XMind 高级节点：

| 组件 | Markdown 标记 | 位置与用法 | 效果示例 |
|---|---|---|---|
| **外框 (Boundary)** | `[B]标题` 或 `[B1]` | 主题行末尾；连续带同标记的主题归入同一外框 | `## 核心微服务 [B]核心服务集群` |
| **概要 (Summary)** | `[G]标题` 或 `[G1]` | 主题行末尾；概要的子节点以 `- [G1] 子主题` 写入 | `## 基础服务 [G]支撑底座` |
| **标注 (Callout)** | `[P]简短标注` | 主题行末尾；依附于主题的独立悬浮气泡 | `- 鉴权网关 [P]要求双因子验证` |
| **联系 (Relationship)** | 起点 `[^1](说明)`，终点 `[1]` | 跨分支建立连线箭头，数字编号必须成对出现 | `- 前端 [^1](调用鉴权)` ... `- 认证中心 [1]` |
| **任务状态 (Task)** | 行首写 `[ ]` `[x]` `[/]` `[-]` | 标记待办、完成、进行中、取消 | `- [ ] 数据库索引重构` |
| **分类标签 (Label)** | `#标签名` | 主题行内任意位置，支持多个 | `- 支付结算 #P0 #Q3重点` |
| **主题备注 (Notes)** | 缩进文本 或 `> 引用文本` | 主题正下方，用于承载长篇说明而不破坏导图结构 | `> 需兼容旧版 v1.0 协议` |
| **数学公式 (Math)** | `$公式$` 或 `$$公式$$` | 原生编译为 MathJax 扩展节点 | `$E=mc^2$` |
| **初始折叠 (Fold)** | `<!--c-->` | 默认收起复杂的子分支 | `- 归档历史模块 <!--c-->` |
| **局部排版 (Layout)** | `#layout/xxx` 或 `#排版/xxx` | 主题行末尾；将该子树切换为指定结构，导出时自动剔除该标签，不残留贴纸 | `## 研发团队 #layout/org` |
| **节点定宽 (Width)** | `#width/420` 或 `#宽度/420` | 主题行内；手动指定节点卡片宽度（px），导出时自动消费剥离 | `## 架构总结 #width/420` |
| **多级编号 (Numbering)** | `#numbering/arabic` 或 `roman` | 主题行内；为该分支子节点开启动态阶梯编号，导出时自动消费剥离 | `## 实施规程 #numbering/arabic` |
| **任务项目元数据** | `📅 日期` `[duration:: ...]` `[progress:: ...]` `@人名` | 紧随复选框；原生写入 XMind 任务扩展，记录截止日期、工期、进度与负责人 | `- [/] 视觉打通 📅 2026-05-01 [duration:: 3d] [progress:: 50%] @韩梅梅` |
| **节点视觉强调** | `<span style="...">` | 包裹节点文字；支持 `font-size: 20pt` 与 `border-color: red`（自动补 1pt 边框） | `### <span style="font-size: 20pt; border-color: #e53935;">致命安全漏洞</span>` |
| **图标标记 (Marker)** | `#marker/<id>` 或 `#标记/<id>` | 主题行内任意位置；原样透传 XMind 图标 markerId，往返无损，未知 id 也不报错 | `- 关键路径 #marker/flag-green` |

### 局部子树混排（命名空间标签）

同一张图内不同分支可采用不同结构：在分支标题行末尾加 `#layout/<结构>`（或中文 `#排版/<结构>`）。支持的结构标识：`timeline`、`org`（架构图）、`fishbone`（鱼骨图）、`logic`（逻辑图）、`map`（思维导图）、`tree`。普通 `#标签` 仍作为业务贴纸保留，仅带 `layout/` / `排版/` 前缀的会被识别为排版指令并在导出时消费剔除。

```markdown
## 研发团队架构 #layout/org
- 前端组
- 后端组

## 业务发展大事记 #layout/timeline
- 2023 种子轮
- 2024 正式上线
```

### 二维矩阵表格（原生 Markdown 表格 → XMind Spreadsheet）

直接书写标准 Markdown 表格即可自动编译为 XMind 官方二维对比矩阵：表头首列为中心主题，表头其余列为列维度，数据行首列为一级行主题，单元格内容作为带列名标签的子节点。**表格所在文档不要再写 `#` 标题**，让表格自身成为整图。

```markdown
| 竞品评测 | 核心优势 | 缺点短板 | 适用人群 |
| --- | --- | --- | --- |
| **产品 A** | 响应快，生态好 | 售价较高 | 团队企业 |
| **产品 B** | 价格亲民，开源 | 插件生态较少 | 个人极客 |
```

> 深入的边界规则（如多层复杂外框编号、富文本备注规范）可按需阅读 `references/XMIND_MARKDOWN_CONVERSION_RULES.md`。

## 示例

### 示例 1：时序演进路线图 (Timeline)

```markdown
---
skeleton: Timeline-1
color: Rainbow
---

# 产品发展演进史

## 2024 Q1 架构重构
- 核心引擎解耦
- 支持多端同步

## 2024 Q2 AI 深度赋能
- 集成 Pi-AI Agent
- 智能思维导图路由

## 2024 Q3 跨平台发布
- 移动端原生优化
```

### 示例 2：经典架构规划图 (MindMap)

```markdown
---
skeleton: MindMap-1
color: Energy
---

# 电商中台架构规划

## 用户与网关 #核心入口
- 统一 API 网关 [P]承载百万并发 [^1](RPC调用)
- 用户认证中心 [1]
  > 基于 OAuth 2.1 与 JWT 无状态校验

## 交易履约链路 [B]核心交易外框
- [x] 订单创建服务
- [/] 库存预占服务
- [ ] 支付清算通道

## 仓储物流 [G]供应链履约
- WMS 仓储管理
- TMS 运输调度
- [G] 自动化履约率达 98%

## 历史遗留系统 <!--c-->
- 旧版单体应用
```

## 既有脑图微调规范

当用户要求修改、扩充或调整既有的 `.xmind` 脑图时，遵循以下标准闭环：
1. **读取**：调用 `read(path: "xxx.xmind")`，底层引擎会自动将 `.xmind` 逆向导出为带 `skeleton` 与 `color` Frontmatter 的 Markdown 大纲；
2. **修改**：在此 Markdown 基础上进行局部的文字增删或分支修改；
3. **回写**：调用 `write(path: "xxx.xmind", content: updatedMarkdown)` 重新落盘，引擎会自动沿用原有的骨架与配色样式。
*注：`.xmind` 是二进制归档文件，禁止直接调用 `edit` 工具。*
