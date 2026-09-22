# 图片生成说明

## 生成方式

本 skill 使用 Antigravity 内置的 `generate_image` 工具直接生成图片，**无需配置外部 API 密钥或本地代理**。

---

## 使用方法

在写作流程中，直接调用 `generate_image` 工具，传入描述性的 Prompt 即可。

**封面图示例 Prompt**：
```
A cover image for WeChat article about [主题]. Design: gradient background from [颜色1] to [颜色2], modern tech style. Layout: Split into two distinct zones (left 40%, right 60%). Left zone: title '[中文标题]' in white, bold. Right zone: [视觉元素]. All Chinese text in simplified Chinese, clear and readable. 2.35:1 aspect ratio.
```

**内容结构图示例 Prompt**：
```
Create a hand-drawn sketch visual summary about [主题]. Use a clean white paper background. Art style: graphic recording / visual thinking, black fine-tip pen, colored markers (cyan, orange, soft red). Place main title '[标题]' centered in a 3D-style rectangular box. Surround with radially distributed doodles and diagrams. Connect ideas with arrows. Layout 16:9.
```

---

## 注意事项

- 提示词建议控制在 2000 字符以内
- 图片文字使用简体中文
- 生成后图片会自动保存为 artifact
