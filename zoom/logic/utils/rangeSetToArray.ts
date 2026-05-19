import { RangeSet, RangeValue } from "@codemirror/state";

/**
 * 将 RangeSet 转换为数组
 * 用于提取装饰器的范围信息
 */
export function rangeSetToArray<T extends RangeValue>(
  rs: RangeSet<T>
): Array<{ from: number; to: number }> {
  const res = [];
  const i = rs.iter();
  while (i.value !== null) {
    res.push({ from: i.from, to: i.to });
    i.next();
  }
  return res;
} 