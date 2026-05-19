import { StateEffect } from "@codemirror/state";

/**
 * 定义缩放功能所需的状态效果
 */

export interface ZoomInRange {
  from: number;
  to: number;
}

export type ZoomInStateEffect = StateEffect<ZoomInRange>;

/**
 * 放大效果，用于显示指定范围的内容
 */
export const zoomInEffect = StateEffect.define<ZoomInRange>();

/**
 * 缩小效果，用于显示所有内容
 */
export const zoomOutEffect = StateEffect.define<void>();

/**
 * 检查一个效果是否为放大效果
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isZoomInEffect(e: StateEffect<any>): e is ZoomInStateEffect {
  return e.is(zoomInEffect);
} 