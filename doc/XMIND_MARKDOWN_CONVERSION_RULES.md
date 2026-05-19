# XMind 与 Markdown 双向转换规则说明

本文档说明插件当前实际支持的 XMind ↔ Markdown 转换规则，适用于在 Obsidian 中把 `.xmind` 转为 `.md`，以及把 `.md` 转回 `.xmind`。

核心原则：Markdown 用“标题 / 缩进列表 + 行内控制标记”的方式表达 XMind 的主题、备注、标签、概要、外框、联系线、标注、折叠、图片和公式。转换会尽量保留可编辑结构，但不会完整保留 XMind 的全部视觉布局和所有私有属性。

## 推荐 Markdown 结构

插件支持两类主要写法。

### 1. 纯列表结构

适合从 XMind 导出后继续维护，也适合完整表达自由主题和多画布：

```markdown
- mm
  中心主题备注
	- 书籍名 [B]大外框 [P]标注 [^1](联系线)
	  书籍备注
		- 第01章
			- 第01节
			  小节备注
- 自由主题
	- 自由主题1
---
- 第二个画布中心主题
	- 分支主题 1
```

规则：

- 第一个顶层列表项会成为当前画布的中心主题。
- 同一画布内后续顶层列表项会成为自由主题。
- `---` 会分隔多个 XMind 画布。
- 缩进表示父子层级；Tab 会按两个空格计算。
- 列表项下面缩进的非列表文本会写入该主题的备注。

### 2. 标题 + 列表结构

适合普通 Markdown 文档转思维导图：

```markdown
# 中心主题

中心主题备注

## 一级主题

一级主题备注

### 二级主题

- 更深层主题
  主题备注
	- 子主题
```

规则：

- 第一个 `#` 标题是中心主题。
- `##`、`###` 继续形成主题层级。
- 4 级及以下常由缩进列表承载。
- 文档正文中再次出现的一级标题 `# 标题` 会作为自由主题挂到当前画布。
- YAML frontmatter 会被忽略，不参与主题转换。
- 正文中的 `---` 会分隔多个画布；frontmatter 的 `---` 不会被当成画布分隔符。

## Markdown → XMind 支持规则

### 主题标题

列表项或标题行的正文会成为 XMind 主题标题：

```markdown
- 主题标题
## 主题标题
```

标题会自动去除部分 Markdown 标记，例如 `**粗体**`、`*斜体*`、`~~删除线~~`、行内代码反引号等；对应样式会尽量写入 XMind topic style。

### 备注 notes

主题下一层缩进的普通文本会成为该主题备注：

```markdown
- 这里是问题？？
  这是备注2
  **加粗** *斜体* <u>下划线</u> [https://www.baidu.com/](https://www.baidu.com/)
  [L]无序列表1
  [L]无序列表2
  [N]有序列表1
  [N]有序列表2
```

转换到 XMind 后会生成：

- `notes.plain.content`：纯文本备注。
- `notes.realHTML.content`：带 HTML 富文本的备注。

备注中支持的富文本：

| Markdown 备注写法 | XMind realHTML |
|---|---|
| `**加粗**` | `<strong>加粗</strong>` |
| `*斜体*` | `<em>斜体</em>` |
| `<u>下划线</u>` | `<u>下划线</u>` |
| `[文本](https://example.com)` | `<a href="https://example.com">文本</a>` |
| `[L]无序列表项` | `<ul><li>无序列表项</li></ul>` |
| `[N]有序列表项` | `<ol><li>有序列表项</li></ol>` |

注意：

- `[L]` 和 `[N]` 是插件约定的备注列表标记，不是标准 Markdown 列表。
- 连续 `[L]` 会聚合为一个无序列表；连续 `[N]` 会聚合为一个有序列表。
- 空行会结束当前段落或列表。
- 备注里的普通 Markdown 列表 `- item` 不会按 notes 富文本列表处理；推荐使用 `[L]` / `[N]`。

### 标签

Markdown 标签会转换为 XMind labels：

```markdown
- XMIND包含的元素 #标签1 #标签2
```

支持：

- 中文、英文、数字、下划线、短横线、斜杠。
- 例如：`#标签1`、`#project/a`、`#todo-item`。

XMind → Markdown 时，XMind labels 会回写到主题标题后：

```markdown
## XMIND包含的元素 #标签1 #标签2
```

### 链接

主题标题中的第一个 Markdown 链接会成为 XMind topic href：

```markdown
- [一句话超链接笔记，和代码块样式，](http://www.baidu.com/)
```

转换结果：

- XMind 主题标题为 `一句话超链接笔记，和代码块样式，`
- XMind 主题 `href` 为 `http://www.baidu.com/`

如果一个标题中有多个链接：

- 第一个链接作为主题超链接。
- 后续链接会追加到备注中，格式为“其他链接”。

### Obsidian wikilink 与嵌入

支持识别 Obsidian 内链：

```markdown
- [[页面名]]
- [[页面名|显示文本]]
- [[页面名#标题]]
```

规则：

- wikilink 会转换为普通链接引用。
- 显示文本会作为主题标题中的可见文字。
- 第一个链接会成为 XMind href，后续链接进入备注“其他链接”。

支持图片嵌入：

```markdown
- 图片 ![[image.png|300]]
```

规则：

- 如果嵌入目标是图片后缀，会作为 XMind 图片处理。
- `|300` 会作为图片宽度；`|300x200` 会作为宽高。

### 图片

支持标准 Markdown 图片：

```markdown
- 图片
  ![图片](./assets/demo.png)
```

转换规则：

- 本地图片会被打包进 `.xmind` 的 `resources/` 目录，并写入 manifest。
- 远程图片 URL 会直接作为图片 src 保留。
- 支持常见图片类型：`png`、`jpg`、`jpeg`、`gif`、`webp`、`bmp`、`svg`。
- 同一图片重复引用会复用同一个资源。
- 如果本地图片文件找不到，会保留原路径作为 `image.src`。

XMind → Markdown 时：

- XMind 内部资源会导出到 Markdown 文件旁边的 `_assets` 文件夹。
- 默认输出标准 Markdown 图片：`![图片](./xxx_assets/image.png)`。
- 如果转换上下文指定 Obsidian 图片风格，会输出 `![[path]]`。

### 公式

支持行内或块级 LaTeX：

```markdown
- 公式 $A+B=C$
```

或：

```markdown
- 公式
  $$
  A+B=C
  $$
```

转换规则：

- Markdown → XMind：写入 XMind MathJax extension：`provider: org.xmind.ui.mathJax`。
- XMind → Markdown：MathJax extension 会输出为 `$...$` 或 `$$...$$`。
- 公式节点不会同时导出 MathJax 渲染图片，避免重复。

### 任务状态

主题标题开头支持任务标记：

```markdown
- [ ] 待办
- [x] 完成
- [/] 进行中
- [-] 取消
```

对应 XMind marker：

| Markdown | XMind marker |
|---|---|
| `[ ]` | `task-todo` |
| `[x]` / `[X]` | `task-done` |
| `[/]` | `task-doing` |
| `[-]` | `task-cancelled` |

XMind → Markdown 时，会根据 markerId 里的关键词推断任务状态，例如 `done`、`checked`、`finish` 会转为 `[x]`。

### 普通图标 / marker

非任务 marker 会转为 Markdown 标签形式：

```markdown
- 图标 #priority-1
```

规则：

- Markdown → XMind：`#priority-1` 会作为 label 写入，而不是 XMind marker。
- XMind → Markdown：非任务 markerId 会以 `#markerId` 输出。

因此，当前对 XMind 内置图标的回写更偏向文本标记，不保证完整恢复 XMind 图标语义。

### 文字样式

主题标题支持基础样式：

```markdown
- **加粗内容**
- *斜体内容*
- ~~删除线内容~~
```

转换为 XMind topic style：

| Markdown | XMind style |
|---|---|
| `**text**` | `fo:font-weight: bold` |
| `*text*` | `fo:font-style: italic` |
| `~~text~~` | `fo:text-decoration: line-through` |

注意：这些样式作用于整个主题，不是局部文字 run；标题文本会去除 Markdown 标记。

### 文字颜色与背景色

主题标题支持以下 HTML 片段：

```markdown
- <font color=#797EC9>文字颜色，包括123456</font>
- <mark style="background-color:#9C27B0;">背景色，包括1234567</mark>
```

转换规则：

- `<font color=...>` 会转为主题文字颜色 `fo:color`。
- `<mark style="background-color:...">` 会转为主题填充色 `svg:fill`，并设置 `fill-pattern: solid`。
- XMind → Markdown 时，如识别到文字颜色或填充色，会输出对应的 `<font>` 或 `<mark>`。

### 折叠

支持两种折叠写法：

```markdown
- 折叠 <!--c-->
- 折叠 [F]
```

转换为 XMind：

- 设置主题 `branch: folded`。

XMind → Markdown 时，折叠主题会输出：

```markdown
- 折叠 <!--c-->
```

### 标注 callout

使用 `[P]` 表示 XMind 标注：

```markdown
- 书籍名 [P]标注
```

也支持：

```markdown
- 书籍名 [P](标注)
```

转换规则：

- Markdown → XMind：在主题 children 中生成 callout。
- XMind → Markdown：callout 会输出为 `[P]标注`。

### 外框 boundary

使用 `[B]` 或 `[B数字]` 表示外框范围：

```markdown
- 书籍名 [B]大外框
- 另一个主题 [B]
```

```markdown
- 主题 1 [B1]外框1
- 主题 2 [B1]
```

规则：

- 同一个父主题下，连续带有同一外框标记的子主题会形成一个 XMind boundary。
- 外框范围由连续区间决定；中间断开后会形成新的范围。
- 标题可以写在范围开始处：`[B]大外框`、`[B1]外框1`。
- 可用 `[B] 标题` 独立行作为外框标题元数据。
- 默认外框样式：深色填充、白色标题文字、虚线、中等线宽。

XMind → Markdown 时：

- 单个外框通常输出 `[B]标题`。
- 多个外框或嵌套概要场景会自动使用 `[B1]`、`[B2]` 等编号，减少歧义。

### 概要 summary

使用 `[G]` 或 `[G数字]` 表示概要范围：

```markdown
- 这里是问题？？ [G1]概要1
- 这是一句话或一段话的笔记 [G1]
```

规则：

- 同一个父主题下，连续带有同一概要标记的子主题会形成一个 XMind summary。
- 标题可以写在范围开始处：`[G]概要`、`[G1]概要1`。
- 默认概要主题样式：白色填充、黑色文本、中等线宽。

概要子主题写法：

```markdown
- 普通主题 [G1]概要1
- 另一个普通主题 [G1]
- [G1] 子主题 1
- [G1] 子主题 2
```

规则：

- 以 `[G1] ` 开头的列表项会作为概要主题的子主题，而不是普通主题。
- 该写法只在列表项解析中生效。
- 嵌套概要子主题会被提升到最近的概要拥有者下，避免层级错位。

XMind → Markdown 时：

- 概要范围内的普通主题会带 `[G]` / `[G1]` 标记。
- 概要主题的子主题会输出为 `- [G] 子主题` 或 `- [G1] 子主题`。

### 联系线 relationship

用成对编号表达联系线：

```markdown
- 来源主题 [^1](联系线)
- 目标主题 [1]
```

规则：

- `[^1]` 表示联系线起点。
- `[1]` 表示联系线终点。
- `[^1](联系线)` 中括号后的标题会成为 XMind relationship title。
- 编号必须配对；只有起点或只有终点不会生成完整联系线。
- 默认联系线使用曲线、虚线、中等线宽。

XMind → Markdown 时：

- 起点主题输出 `[^1](标题)`。
- 终点主题输出 `[1]`。
- 多条联系线会按读取顺序编号。

### 表格

普通 Markdown 表格会被转换为一个子主题：

```markdown
| 字段 | 说明 |
|---|---|
| A | B |
```

转换规则：

- 生成标题为 `表格: 字段 | 说明` 的主题。
- 表格 Markdown 原文写入该主题备注。
- 添加 marker：`table`。

### 代码块

Markdown fenced code block 会被转换为一个子主题：

````markdown
```js
console.log('hello');
```
````

转换规则：

- 生成标题为 `代码块` 或 `代码块: js` 的主题。
- 代码内容写入该主题备注。
- 添加 marker：`code`。

## XMind → Markdown 支持规则

### 支持读取的 XMind 内容

优先读取 `.xmind` 包内：

- `content.json`
- `content.xml`
- 任意路径下的 `content.json` / `content.xml`

如果标准内容文件解析失败，会扫描压缩包内其他 JSON，寻找包含 `rootTopic` 的内容。

现代 XMind 的 `content.json` 支持更完整；旧版 `content.xml` 只有保守解析能力，主要提取主题标题、层级、plain notes 和 labels。

### 画布 sheet

- 多个 XMind sheet 会导出为多个 Markdown section。
- section 之间用 `---` 分隔。
- 每个 sheet 的 rootTopic 输出为一级标题或纯列表中心主题，取决于后续 Markdown 模式转换流程。

### 主题层级

XMind → Markdown 默认渲染：

- 中心主题：`# 中心主题`
- 第一层主题：`## 主题`
- 第二层主题：`### 主题`
- 更深层主题：缩进列表 `- 主题`

示例：

```markdown
# mm

## 书籍名

### 第01章

- 第01节
	- 这里是问题？？
```

### 自由主题

XMind 的 detached topics 会输出为新的一级标题：

```markdown
# 自由主题

## 自由主题1
```

在纯列表模式中，可表示为另一个顶层列表项。

### 备注 notes

XMind notes 读取优先级：

1. `notes.realHTML.content`
2. `notes.html.content`
3. `notes.plain.content`

realHTML/html 会转换为 Markdown 备注：

| XMind notes HTML | Markdown |
|---|---|
| `<strong>` / `<b>` | `**text**` |
| `<em>` / `<i>` | `*text*` |
| `<u>` | `<u>text</u>` |
| `<a href="url">text</a>` | `[text](url)` |
| `<ul><li>item</li></ul>` | `[L]item` |
| `<ol><li>item</li></ol>` | `[N]item` |
| `<br>` / 段落标签 | 换行 |

如果没有 HTML notes，则使用 plain notes 原文。

### 样式

XMind topic style 会尽量转换为 Markdown 标记：

| XMind style | Markdown |
|---|---|
| `fo:font-weight: bold` 或数值 `>= 600` | `**text**` |
| `fo:font-style: italic` | `*text*` |
| `fo:text-decoration: line-through` | `~~text~~` |
| `fo:color` | `<font color=...>text</font>` |
| `svg:fill` | `<mark style="background-color:...;">text</mark>` |

如果 XMind 使用 `titleSegments` / `titleRuns`，会优先按片段输出 `<font>` 或 `<mark>`。

### 标签、图标和任务

- XMind labels 输出为 `#标签`。
- 任务 marker 输出为 `[ ]`、`[x]`、`[/]`、`[-]`。
- 非任务 marker 输出为 `#markerId`。

### 概要、外框、标注、联系线

XMind 中的结构会被编码为行内控制标记：

| XMind 元素 | Markdown 标记 |
|---|---|
| 外框 boundary | `[B]`、`[B1]`、`[B2]` |
| 概要 summary | `[G]`、`[G1]`、`[G2]` |
| 概要子主题 | `- [G] 子主题` |
| 标注 callout | `[P]标注` |
| 联系线起点 | `[^1](标题)` |
| 联系线终点 | `[1]` |
| 折叠 | `<!--c-->` |

当同一个父主题下只有一个简单外框或概要时，通常使用 `[B]` / `[G]`。当有多个或嵌套结构时，会自动编号。

### 图片资源

- XMind 内部 `xap:resources/...` 图片会导出到 Markdown 文件旁边的资源目录。
- 外部 URL 图片会保留 URL。
- MathJax 公式图片不会重复导出。

## 推荐写法

### 完整示例

```markdown
- mm
  3213123123
	- 书籍名 [B]大外框 [P]标注 [^1](联系线)
	  3234324
		- 第01章
		  3234324
			- 第01节
			  32432432
				- 这里是问题？？ [G1]概要1
				  这是备注2
				  **加粗** *斜体* <u>下划线</u> [https://www.baidu.com/](https://www.baidu.com/)
				  [L]无序列表1
				  [L]无序列表2
				  [N]有序列表1
				  [N]有序列表2
					- **这里是答案1**
					- <font color=#DC2D1E>这里是答案2</font>
					- [G1] 子主题 1 [G2]概要2 [B2]外框2
					- [G1] 子主题 2 [G2] [B2]
					- [G1] 子主题 3 [G2]
					- [G1] 子主题 4 [G2]
				- 这是一句话或一段话的笔记 [G1] [B1]外框1
	- XMIND包含的元素 #标签1 #标签2 [1]
	  这是备注1
	  **加粗** *斜体* <u>下划线</u> [https://www.baidu.com/](https://www.baidu.com/)
	  [L]无序列表1
	  [L]无序列表2
	  [N]有序列表1
	  [N]有序列表2
		- <font color=#797EC9>文字颜色，包括123456</font>
		- <mark style="background-color:#9C27B0;">背景色，包括1234567</mark>
		- 文本
			- ~~我是删除线内容~~
			- *我是斜体内容*
			- **我是加粗内容**
		- 折叠 <!--c-->
			- 子主题 1
			- 子主题 2
			- 子主题 3
		- 图标 #priority-1
		- [一句话超链接笔记，和代码块样式，](http://www.baidu.com/)
		  这是内容
		- 公式
		  $A+B=C$
		- 图片
		  ![图片](./mm_or_assets/image.png)
- 自由主题
	- 自由主题1
	- 自由主题2
---
- 中心主题
	- 分支主题 1
	- 分支主题 2
```

## 当前限制

- 不保证完整保留 XMind 的坐标布局、主题结构样式、所有图标语义、边框细节、连接点、复杂主题模板等私有属性。
- Markdown 标题内的粗体、斜体、删除线会作为整个主题样式处理，不支持只给标题中的局部文字加粗/斜体/删除线。
- `<font>` 和 `<mark>` 支持局部片段读取，但 Markdown → XMind 最终会写成主题级颜色或背景色。
- 备注 notes 的富文本转换覆盖常见 HTML：粗体、斜体、下划线、链接、换行、无序/有序列表；复杂嵌套 HTML 不保证完整还原。
- 普通 Markdown 列表用于主题层级，不用于 notes 列表；notes 列表请用 `[L]` / `[N]`。
- 表格和代码块会转成普通主题加备注，不会成为 XMind 原生表格或代码块对象。
- Obsidian callout `> [!note]` 当前不会转为 XMind 标注；XMind 标注请使用 `[P]`。
- Obsidian 高亮 `==text==` 当前不会转为 XMind 背景色；请使用 `<mark style="background-color:#xxxxxx;">text</mark>`。
- 联系线必须使用成对编号：`[^1]` 表示起点，`[1]` 表示终点；编号未配对不会生成 relationship。
- 旧版 `content.xml` 的 XMind 文件只做保守解析，建议使用现代 `.xmind` 的 `content.json`。

## 使用建议

- 如果目标是稳定往返转换，优先使用纯列表结构。
- 缩进建议统一使用 Tab，或统一使用两个空格；不要混用不规则缩进。
- XMind 特有结构统一写在主题标题行末尾：`[B]`、`[G]`、`[P]`、`[^1]`、`[1]`、`<!--c-->`。
- 备注中的富文本列表统一使用 `[L]` / `[N]`。
- 图片尽量使用相对路径，便于打包进 `.xmind`。
- 需要保留 XMind 原生视觉细节时，以 XMind 文件为主；Markdown 更适合作为可读、可编辑、可版本管理的结构表达。