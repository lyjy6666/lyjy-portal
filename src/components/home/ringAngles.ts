/**
 * 圆环节点角度：17 个节点均匀分布，首节点在正上方（-90°）。
 * 返回顺序与 flattenServices() 一致，可直接按下标对应到节点。
 */
export function uniformAngles(count: number): number[] {
  const step = 360 / count;
  return Array.from({ length: count }, (_, i) => -90 + i * step);
}
