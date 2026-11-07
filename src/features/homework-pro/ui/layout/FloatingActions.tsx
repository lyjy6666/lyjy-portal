'use client';

import { House, ArrowUp, History, Trash2, ArrowUpRight } from 'lucide-react';
import { usePro } from '../../hooks/ProContext';

/**
 * 右下角悬浮小圆按钮组：位置、样式与原来一致。
 * 「回主页」按用户要求加回来，与「返回原版作业管理系统」并列；
 * 「更新记录」单独指向 Pro 版独立页面，不与原版混写。
 */
export function FloatingActions() {
  const { openDialog } = usePro();
  const btn = 'hw-btn hw-fab shadow-md';

  return (
    <div className="fixed bottom-5 right-5 z-30 flex flex-col gap-2">
      <a href="/" className={btn} title="返回首页" aria-label="返回首页"><House size={17} /></a>
      <a href="/homework" className={btn} title="返回原版作业管理系统" aria-label="返回原版作业管理系统"><ArrowUpRight size={17} /></a>
      <a href="/homework/pro/updates" className={btn} title="PRO 版更新记录" aria-label="PRO 版更新记录">
        <History size={17} />
      </a>
      <button type="button" className={btn} onClick={() => openDialog('recycle')}
        title="回收站" aria-label="回收站"><Trash2 size={17} /></button>
      <button type="button" className={btn}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        title="回到顶部" aria-label="回到顶部"><ArrowUp size={17} /></button>
    </div>
  );
}
