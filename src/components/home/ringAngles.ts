import type { ServiceCategory } from '@/data/services';

/**
 * 方案 A / B：所有节点均匀分布（现状行为）
 * 17 个节点 → 每 21.18°
 */
export function uniformAngles(count: number): number[] {
  const step = 360 / count;
  return Array.from({ length: count }, (_, i) => -90 + i * step);
}

/**
 * 方案 C / D：同类服务靠拢，分类之间插入额外空隙，形成视觉分组。
 *
 * 空隙总量 = 分类数 × extraGap，剩下的角度均分给所有节点，
 * 因此首尾之间也会留出一道空隙（圆环在分类交界处自然「断开」）。
 * 17 个节点 + 5 个分类 + 9° 空隙 → 每节点 18.53°，总角度刚好 360°。
 *
 * 返回顺序与 flattenServices() 一致，可直接按下标对应到节点。
 */
export function groupedAngles(categories: ServiceCategory[], extraGap = 9): number[] {
  const total = categories.reduce((sum, c) => sum + c.services.length, 0);
  if (total === 0) return [];

  const step = (360 - categories.length * extraGap) / total;
  const angles: number[] = [];
  let cursor = -90;

  categories.forEach((category) => {
    category.services.forEach(() => {
      angles.push(cursor);
      cursor += step;
    });
    cursor += extraGap; // 分类之间的空隙
  });

  return angles;
}

export type RingVariant = 'A' | 'B' | 'C' | 'D';

/** 各方案用哪种角度分配 */
export function anglesForVariant(variant: RingVariant, categories: ServiceCategory[]): number[] {
  const total = categories.reduce((sum, c) => sum + c.services.length, 0);
  if (variant === 'C' || variant === 'D') return groupedAngles(categories);
  return uniformAngles(total);
}
