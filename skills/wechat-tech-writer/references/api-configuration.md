# 图片生成说明

## 生成方式

本 skill 使用 Antigravity 内置的 `generate_image` 工具直接生成图片，**无需配置外部 API 密钥或本地代理**。

---

## 使用方法

在写作流程中，直接调用 `generate_image` 工具，传入描述性的 Prompt 即可。

**封面图示例 Prompt**：
```
A stunning cover for [主题], gradient [配色], title '[标题]', subtitle '[副标题]' in Chinese, modern tech style, 3D visual elements, clean design, 16:9 aspect ratio. All Chinese text in simplified Chinese, clear and readable.
```

**内容配图示例 Prompt**：
```
A clean performance comparison chart for [对比主题]. Horizontal bar chart, minimalist style, gradient from blue (#3b82f6) to purple (#7c3aed). All text in simplified Chinese. 16:9 aspect ratio.
```

---

## 注意事项

- 提示词建议控制在 2000 字符以内
- 图片文字使用简体中文
- 生成后图片会自动保存为 artifact

## 优势

- ✅ 无需配置 API 密钥
- ✅ 无需本地代理
- ✅ 无需安装 Python 依赖
- ✅ 任何环境下都可使用
