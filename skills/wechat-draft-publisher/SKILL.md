---
name: wechat-draft-publisher
description: 将指定的 Vault HTML 文章和封面提交到微信公众号草稿箱，并生成轻量发布结果报告。
allowed-tools: read, write, find, bash
---

# 微信公众号草稿发布助手

调用桌面端安全隔离脚本，将已完成排版的 HTML 文章与封面图推送至微信公众号后台草稿箱，便于作者在手机端或网页端进行最终扫码预览与群发。

---

## ⚠️ 安全红线与凭据规范

1. **绝对禁止通过 Agent 写入真实凭据**：
   - 严禁使用 `write` 将真实 `AppID`、`AppSecret` 或 Token 写入 Vault 文件中；
   - 严禁把包含密钥的配置文件读入模型上下文；
2. **推荐凭据配置位置**：
   - 推荐用户在本地个人用户目录下人工创建配置文件：`~/.wechat-publisher/config.json`；
   - `examples/config.json.example` 仅作为字段格式参考。

---

## 执行步骤与调用约束

```text
步骤 1: 确定三项输入资产 (原始 Markdown 路径、格式化 HTML 路径、封面图精确路径)
  │
步骤 2: 凭据状态与环境确认 (检查 Python 与 requests 依赖，不代写密钥)
  │
步骤 3: 桌面端物理绝对路径调用 (借助 VAULT_PATH 环境变量执行 publisher.py)
  │
步骤 4: 写入轻量发布报告交付抽屉 (write 写入 _publish-report.md，标记 isFinal: true)
```

---

### 步骤 1：明确输入资产路径

不再盲目扫描“最新文件”，必须获取以下三项明确输入：

1. **原始 Markdown 路径**：用于通过 `read` 工具读取 Frontmatter 中的标题与 `cover` 元数据；
2. **格式化 HTML 路径**：即 `wechat-article-formatter` 交付的 `*_formatted.html` 文件；
3. **封面图路径**：由前序 `generate_image` 生成的真实路径（如 `attachments/ai-images/image-xxx.png`）。

*注：前序会话中已存在的 Artifact 直接使用；若缺失，调用 `find` 列出候选文件供用户确认。*

---

### 步骤 2：构造安全的跨平台脚本调用

由于 `bash` 工具在桌面端执行时工作目录为系统临时目录，**所有路径必须拼装为物理绝对路径**。  
运行时已为环境自动注入 `VAULT_PATH`（当前 Vault 的绝对根路径）：

#### Windows 环境调用（cmd.exe）
```bat
python "%VAULT_PATH%\skills\wechat-draft-publisher\scripts\publisher.py" ^
  --markdown "%VAULT_PATH%\{Markdown相对路径}" ^
  --content "%VAULT_PATH%\{HTML相对路径}" ^
  --cover "%VAULT_PATH%\{封面相对路径}" ^
  --title "{文章标题}"
```

#### macOS / Linux 环境调用（sh）
```sh
python "$VAULT_PATH/skills/wechat-draft-publisher/scripts/publisher.py" \
  --markdown "$VAULT_PATH/{Markdown相对路径}" \
  --content "$VAULT_PATH/{HTML相对路径}" \
  --cover "$VAULT_PATH/{封面相对路径}" \
  --title "{文章标题}"
```

**执行原则**：
- 严格遵循确认弹窗机制，等待用户授权；
- 参数中使用带双引号的安全转义；
- 缺少 Python 或 `requests` 库时，明确向用户报告环境缺失并停止，严禁在后台静默安装未授权包。

---

### 步骤 3：写入任务抽屉最终交付报告

发布成功后，微信 API 会返回草稿的 `media_id`。  
由于发布属于远程网络调用，本身不产生正文产物，**必须通过 `write` 写入一份轻量交付报告**，以便任务抽屉产生可追踪的完成状态卡片：

```json
{
  "path": "WeChat_Articles/{文章名}_publish-report.md",
  "content": "...",
  "isFinal": true
}
```

#### 报告内容格式

```markdown
# 微信公众号草稿提交结果

- **发布状态**：✅ 成功提交至草稿箱
- **文章标题**：{文章标题}
- **草稿 Media ID**：`{接口实际返回的 media_id}`
- **提交时间**：{当前时间戳}
- **管理后台**：https://mp.weixin.qq.com/

---
> 💡 **后续操作指引**：
> 1. 请登录微信公众平台后台，进入「内容与互动」→「草稿箱」；
> 2. 打开本篇草稿核对格式与配图；
> 3. 使用手机微信扫码预览无误后，即可安排群发。
```

> ⚠️ **注意**：微信官方 API 不提供单篇文章后台直达编辑链接，请勿在报告中伪造虚假直达 URL，以 `media_id` 与草稿箱指引为准。

---

## 质量验收检查

- [ ] 仅声明小写合法工具（`read`, `write`, `find`, `bash`）
- [ ] 绝无将 AppSecret 写入 Vault 文件或打印在输出中的行为
- [ ] 脚本命令使用 `%VAULT_PATH%` / `$VAULT_PATH` 物理路径，无当前目录依赖
- [ ] 产物报告通过 `write(..., isFinal: true)` 正式交付
