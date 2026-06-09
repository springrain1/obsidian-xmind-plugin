import { StateEffect, StateField } from "@codemirror/state";

/**
 * 缩放状态接口
 */
export interface ZoomState {
  position: number;
  range: { from: number; to: number };
}

/**
 * 缩放入效果
 * 用于放大到特定内容区域
 */
export const zoomInEffect = StateEffect.define<ZoomState>();

/**
 * 缩放出效果
 * 用于返回到完整文档视图
 */
export const zoomOutEffect = StateEffect.define<null>();

/**
 * 缩放状态字段
 * 存储当前缩放状态信息
 */
export const zoomStateField = StateField.define<ZoomState | null>({
  create: () => null,
  update: (value, tr) => {
    for (const e of tr.effects) {
      if (e.is(zoomInEffect)) {
        return e.value;
      }
      if (e.is(zoomOutEffect)) {
        return null;
      }
    }
    return value;
  },
});

// 将状态字段添加到效果上，以便在其他地方访问
// @ts-ignore -- Legacy code compatibility
zoomInEffect.field = zoomStateField; 