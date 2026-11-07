import Link from 'next/link';
import {
  HOMEWORK_PRO_RELEASES,
  HOMEWORK_PRO_HIGHLIGHTS,
  HOMEWORK_PRO_PREVIEW,
} from '@/features/homework-pro/ui/dialogs/releases';
import '@/features/homework-pro/skins/tokens.css';
import '@/features/homework-pro/skins/pro.css';

export const metadata = {
  title: '作业管理系统 Pro · 更新记录',
  description: '作业管理系统 Pro 版的独立版本历史，不与原版更新记录混写。',
};

/**
 * Pro 版专用更新记录页面。
 * 重磅升级与常规条目装在**同一个 Pro V0.1 版本框**里，
 * 用户一眼就知道这些都是 1.0 的更新；重磅区在框内用独立视觉凸显。
 */
export default function HomeworkProUpdatesPage() {
  const release = HOMEWORK_PRO_RELEASES[0];
  if (!release) return null;

  return (
    <main data-theme="journal" className="hw-root min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <header className="mb-8">
          <p className="hw-eyebrow">LYJY · Pro 版</p>
          <h1 className="hw-display mt-2">作业管理系统 Pro · 更新记录</h1>
          <p className="hw-label mt-3">
            这里只记录 Pro 版的版本历史。原版更新记录请到
            <Link href="/homework" className="mx-1 underline underline-offset-2">原版作业管理</Link>
            查看。
          </p>
        </header>

        {/* 一个版本 = 一个框：重磅升级和常规条目都在这里面 */}
        <section className="hw-release-block">
          <div className="hw-release-head">
            <span className="hw-title text-base">{release.version}</span>
            {release.latest && <span className="hw-chip" data-active="true">最新</span>}
            {release.tag && <span className="hw-chip">{release.tag}</span>}
            <span className="hw-label hw-num ml-auto">{release.date}</span>
          </div>

          <div className="hw-release-highlight">
            <div className="flex flex-wrap items-center gap-2">
              <span className="hw-ai-tag">重磅升级</span>
              <span className="hw-ai-tag-ghost">本次核心</span>
            </div>
            <p className="hw-ai-title mt-2 text-lg">AI 深度融合，作业从记录到排期全链接管</p>

            <div className="hw-release-cards">
              {HOMEWORK_PRO_HIGHLIGHTS.map((h) => (
                <div key={h.no} className="hw-release-card">
                  <span className="hw-release-no">{h.no}</span>
                  <p className="hw-title mt-2 text-base">{h.title}</p>
                  <p className="hw-label mt-1 leading-relaxed">{h.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="hw-eyebrow mt-4">常规更新</p>
          <ul className="hw-release-list">
            {release.items.map((item, i) => (
              <li key={i}><span className="hw-release-dot" />{item}</li>
            ))}
          </ul>
        </section>

        {/* 下一版预告：虚线框与已发布的实线版本框区分开，明确是计划中 */}
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

        <div className="mt-8 flex flex-wrap gap-2">
          <Link href="/homework/pro" className="hw-btn" data-variant="primary">返回 Pro 版</Link>
          <Link href="/homework" className="hw-btn">前往原版</Link>
        </div>
      </div>
    </main>
  );
}
