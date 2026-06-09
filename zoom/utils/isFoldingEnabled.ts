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
    foldIndent: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Type inference limitation
    ...(app.vault as any).config,
  };

  return config.foldHeading && config.foldIndent;
} 