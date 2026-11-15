'use client';

import Link from 'next/link';
import { usePro } from '../../hooks/ProContext';
import { ProDialog } from '../common/bits';
import {
  HOMEWORK_PRO_RELEASES,
  HOMEWORK_PRO_HIGHLIGHTS,
  HOMEWORK_PRO_V02_HIGHLIGHTS,
  HOMEWORK_PRO_HIGHLIGHT_TITLE,
  HOMEWORK_PRO_PREVIEW,
} from './releases';

/**
 * Pro 版更新记录弹窗。
 * 原先右下角按钮会跳到 /homework/pro/updates 独立页面，用户反馈「应该保持跟以前一致，
 * 打开一个弹窗」。这里把同样的内容搬进 ProDialog，和其他站内弹窗观感一致。
 * V0.1 / V0.2 各一个版本框，重磅升级卡片各归各的版本。
 */
export function ReleaseDialog() {
  const { dialog, closeDialog } = usePro();

  return (
    <ProDialog
      open={dialog === 'updates'}
      onOpenChange={(v) => { if (!v) closeDialog(); }}
      title="作业管理系统 Pro · 更新记录"
      desc="这里只记录 Pro 版的版本历史，不与原版更新记录混写。"
      className="sm:max-w-[720px]"
    >
      <div className="space-y-4">
        {HOMEWORK_PRO_RELEASES.map((release) => {
          const highlights = release.version === 'Pro V0.2'
            ? HOMEWORK_PRO_V02_HIGHLIGHTS
            : release.version === 'Pro V0.1' ? HOMEWORK_PRO_HIGHLIGHTS : [];
          return (
            <section key={release.version} className="hw-release-block">
              <div className="hw-release-head">
                <span className="hw-title text-base">{release.version}</span>
                {release.latest && <span className="hw-chip" data-active="true">最新</span>}
                {release.tag && <span className="hw-chip">{release.tag}</span>}
                <span className="hw-label hw-num ml-auto">{release.date}</span>
              </div>

              {highlights.length > 0 && (
                <div className="hw-release-highlight">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="hw-ai-tag">重磅升级</span>
                    <span className="hw-ai-tag-ghost">本次核心</span>
                  </div>
                  <p className="hw-ai-title mt-2 text-lg">
                    {HOMEWORK_PRO_HIGHLIGHT_TITLE[release.version] ?? 'AI 深度融合'}
                  </p>
                  <div className="hw-release-cards">
                    {highlights.map((h) => (
                      <div key={h.no} className="hw-release-card">
                        <span className="hw-release-no">{h.no}</span>
                        <p className="hw-title mt-2 text-base">{h.title}</p>
                        <p className="hw-label mt-1 leading-relaxed">{h.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="hw-eyebrow mt-4">常规更新</p>
              <ul className="hw-release-list">
                {release.items.map((item, i) => (
                  <li key={i}><span className="hw-release-dot" />{item}</li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <section className="hw-release-preview">
        <div className="flex flex-wrap items-center gap-2">
          <span className="hw-eyebrow">更新预告</span>
          <span className="hw-chip">{HOMEWORK_PRO_PREVIEW.version}</span>
          <span className="hw-chip">计划中</span>
        </div>
        <p className="hw-title mt-2 text-base">{HOMEWORK_PRO_PREVIEW.title}</p>
        <ul className="hw-release-list">
          {HOMEWORK_PRO_PREVIEW.items.map((item, i) => (
            <li key={i}><span className="hw-release-dot" />{item}</li>
          ))}
        </ul>
        <p className="hw-label mt-3">{HOMEWORK_PRO_PREVIEW.note}</p>
      </section>

      <p className="hw-label mt-4">
        原版更新记录请到
        <Link href="/homework" className="mx-1 underline underline-offset-2">原版作业管理</Link>
        查看。
      </p>
    </ProDialog>
  );
}
