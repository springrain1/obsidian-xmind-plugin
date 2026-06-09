import { App } from "obsidian";

/**
 * 检查 Obsidian 编辑器中的折叠功能是否已启用
 * 此功能对于 Zoom 插件至关重要，因为它依赖于折叠功能
 */
export function isFoldingEnabled(app: App): boolean {
  const config: {
    foldHeading: boolean;
    foldIndent: boolean;
  } = {
    foldHeading: true,
    foldIndent: true,    ...((app.vault as { config?: Record<string, unknown> }).config ?? {}),
  };

  return config.foldHeading && config.foldIndent;
} 