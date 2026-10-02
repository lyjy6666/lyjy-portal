'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { ServiceItem } from '@/data/services';
import { resolveService } from '@/lib/serviceNav';

/**
 * 统一的「打开一个服务」入口。
 *
 * 首页圆环的圆圈点击、卡片里的按钮、列表布局的整行点击，
 * 全部调用同一个 open()，保证行为完全一致：
 *   - 不可用 → toast 提示
 *   - 外链   → 新标签打开
 *   - 下载   → 触发浏览器下载
 *   - 内链   → 客户端路由跳转（不再整页刷新）
 */
export function useServiceNav() {
  const router = useRouter();

  return useCallback(
    (service: ServiceItem) => {
      const target = resolveService(service);

      if (target.mode === 'soon') {
        toast(target.message ?? '正在筹备中，敬请期待');
        return;
      }

      if (target.mode === 'external') {
        window.open(target.href, '_blank', 'noopener,noreferrer');
        return;
      }

      if (target.mode === 'download') {
        const a = document.createElement('a');
        a.href = target.href;
        a.download = '';
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      }

      router.push(target.href);
    },
    [router]
  );
}
