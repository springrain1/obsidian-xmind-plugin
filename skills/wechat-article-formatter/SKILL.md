---
name: wechat-article-formatter
description: 将 Vault 中的 Markdown 文章转换为带内联样式、适配微信公众号的 HTML。
allowed-tools: read, write, edit, find, grep, bash
---

# 微信公众号文章排版格式化工具

将 Vault 中的 Markdown 文章转换为适配微信公众号编辑器的内联样式精美 HTML，支持深色极客风、科技风、极简风等专业排版规范。

---

## ⚡ 执行流程（原生优先）

```text
步骤 1: 确定输入文件 (优先使用前序会话路径，或向用户确认)
  │
步骤 2: 读取精选排版模板 (使用 read 读取内置 HTML 模板结构与内联样式)
  │
步骤 3: 模式 A 原生转换 (默认：模型直接解析 Markdown，输出内联样式 HTML，无需 Python)
  │       ├─ 剥离 Frontmatter 和 H1 标题
  │       ├─ 将 Obsidian 图片双链 ![[...]] 转换为 HTML 本地相对 <img> 路径
  │       └─ 将代码块渲染为微信兼容的 <div> + <br> + &nbsp; 结构
  │
步骤 4: 交付 HTML 产物 (write 写入 Vault，标记 isFinal: true)
  │
步骤 5: 质量自检与发布指引 (使用 read 抽检验证，给出微信复制粘贴指南)
```

---

### 步骤 1：获取输入 Markdown 文件

按以下优先级确定目标文件路径，**严禁使用 shell 自动猜测最新文件（如 `ls -t | head`）**：

1. **用户明确指定**：用户在指令中直接提供了文章的 Vault 相对路径（如 `WeChat_Articles/DeepSeek.md`）；
2. **前序工具会话继承**：紧接在 `wechat-tech-writer` 或 `wechat-km-writer` 后执行时，直接继承上一个任务写入的文件路径；
3. **模糊检索确认**：若不明确，调用 `find(pattern="*.md")` 列出候选笔记，由用户确认后再行读取。

---

### 步骤 2：读取参考排版模板

通过 `read` 工具读取技能目录内的模板文件以学习内联样式与组件结构（**严禁执行 `cd ~/.gemini/...`**）：

```text
read(path="examples/极客暗黑风.html")
```

**内置模板选项**：
- `examples/极客暗黑风.html`（⭐ 默认推荐：终端窗口导语、深色代码卡片、线框高亮，适用于技术解析、AI 与产品评测）；
- `examples/VSCode 蓝色科技风.html`（序号章节标题、功能卡片、操作步骤，适用于实操教程）；
- `examples/红蓝对决·深度测评模板.html`（双色对比卡片、数据表格、引用金句，适用于两款产品横向评测）；
- `examples/现代极简风.html`（清爽素雅，适用于随笔与方法论散文）。

---

### 步骤 3：模式 A 原生转换（默认且唯一的无依赖规范）

无需依赖本地 Python 环境或外部包，完全在模型中完成内联 HTML 构筑：

1. **跳过 H1 标题与 Frontmatter**：
   - 微信公众号编辑器顶部有单独的标题输入框；
   - 必须剥离 Markdown 中的 YAML frontmatter 和 `# 一级标题`，从导语块或二级标题（`##`）开始渲染；
   - 在 HTML 顶部加入提示注释：`<!-- ⚠️ 标题请在微信公众号编辑器中单独填写 -->`。

2. **Obsidian 图片双链解析**：
   - 匹配 Markdown 中的双链图片语法：`![[attachments/ai-images/image-xxx.png]]` 或 `![[image-xxx.png]]`；
   - 计算该图片相对于即将输出的 HTML 文件的相对路径（例如：`../attachments/ai-images/image-xxx.png`）；
   - 转换为标准内联居中样式的 HTML 标签：
     ```html
     <div style="text-align: center; margin: 20px 0;">
       <img src="../attachments/ai-images/image-xxx.png" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" alt="配图" />
     </div>
     ```
   - 最终 HTML 中**严禁残留**任何 `![[...]]` 或 Markdown 图片标记。

3. **代码块微信兼容化**：
   - 微信富文本编辑器对标准 `<pre><code>` 兼容性差，常导致换行错乱或背景丢失；
   - 将代码块转换为带内联样式的深色卡片：外层 `<div style="background: #1e1e1e; color: #d4d4d4; padding: 16px; border-radius: 8px; font-family: Consolas, monospace; font-size: 13px; line-height: 1.6; overflow-x: auto;">`，换行使用 `<br>`，缩进使用 `&nbsp;&nbsp;`。

4. **所有样式 100% 内联**：
   - 所有排版颜色、字体、边距必须直接写在元素的 `style=""` 属性中；
   - 严禁引入外部 `<link rel="stylesheet">` 或 `<style>` 标签，微信粘贴时会过滤非内联样式。

---

### 步骤 4：交付 HTML 最终产物

调用 `write` 工具保存 HTML 文件，并标记 `isFinal: true`：

```json
{
  "path": "WeChat_Articles/{文章名}_formatted.html",
  "content": "<!DOCTYPE html><html>...</html>",
  "isFinal": true
}
```

---

### 步骤 5：质量自检与发布指引

1. **质量抽检**：调用 `read(path="WeChat_Articles/{文章名}_formatted.html", limit: 30)` 检查头部样式与标签闭合，严禁使用 shell `head` 命令；
2. **发布指引**：在任务总结中向用户说明：
   - 标题已提取并在后台单独填写；
   - 用浏览器打开生成的 HTML 文件，按 `Ctrl+A` 全选 → `Ctrl+C` 复制，直接粘贴进微信公众号后台；
   - 若本地图片未自动同步，可在微信编辑器中一键替换或使用配套的发布器上传。

---

### 附：模式 B 脚本辅助转换（显式可选）

> ⚠️ 仅当用户明确要求使用本地脚本，且确认本机已安装 Python 及 `requirements.txt` 依赖时作为备用路线。

调用命令必须使用物理绝对路径（环境变量 `VAULT_PATH` 由运行时自动提供）：

```bat
python "%VAULT_PATH%\skills\wechat-article-formatter\scripts\markdown_to_html.py" ^
  --input "%VAULT_PATH%\WeChat_Articles\文章.md" ^
  --theme tech
```

---

## 质量验收标准

- [ ] 输出 HTML 不含 `#` 一级标题及 YAML Frontmatter
- [ ] 所有 Obsidian 双链 `![[...]]` 均已转换为有效的 `<img src="...">` 相对路径
- [ ] 代码块已转为微信兼容的深色容器，缩进与换行正常
- [ ] 样式均为元素级 `style="..."` 内联，无外部 CSS 依赖
- [ ] 产物通过 `write(..., isFinal: true)` 稳定落盘并交付任务抽屉
- [ ] 默认流程完全零 Python、零 Bash 依赖
