'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
const KEY = 'lyjy_500_20261218_seen';
export default function AnniversarySplash() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' });
    if (today !== '2026-12-18') return;
    try { if (localStorage.getItem(KEY)) return; } catch { /* 无存储时本次仍可看 */ }
    // 手机说明先显示，避免两个全屏层互相争抢。
    const timer = window.setTimeout(() => setOpen(true), 1800);
    return () => window.clearTimeout(timer);
  }, []);
  const close = () => { setOpen(false); try { localStorage.setItem(KEY, '1'); } catch { /* 仍允许关闭 */ } };
  return <Dialog open={open} onOpenChange={value => { if (!value) close(); }}><DialogContent className="bg-stone-900 text-stone-100 border-stone-600 sm:max-w-xl">
    <span className="text-8xl font-serif text-amber-200" aria-hidden="true">500.</span>
    <DialogTitle>500 天，回去看一眼。</DialogTitle><DialogDescription className="text-stone-300">从 2025.08.04 的第一张主页，到今天的 V7.0。十三台旧机器都还能启动，六代线上门户也都还在。</DialogDescription>
    <Link href="/anniversary" onClick={close} className="border border-amber-200 px-5 py-3 text-center text-amber-100">进时光机</Link><button type="button" onClick={close}>这次先跳过</button>
  </DialogContent></Dialog>;
}
