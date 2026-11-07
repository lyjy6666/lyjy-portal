import { NextRequest, NextResponse } from 'next/server';
import { requireHomeworkUser } from '@/lib/homeworkAuth';
import { chatText, stripCodeFence, TEXT_CHAIN } from '@/lib/aiChain';

/**
 * AI 用时推测：根据年级 + 作业内容，估算每条作业需要的分钟数。
 * 与 OCR / 批改同族鉴权；模型链（GLM → Agnes 自动降级）全部不可用时回退本地规则，
 * 保证「用时推测」这项功能始终可用，不会因上游配额把用户卡住。
 */

const SYSTEM_PROMPT = `你是一个熟悉中小学学习节奏的助教。根据「年级」「薄弱项」和「作业内容」，估算每条作业所需的完成时间（分钟）。

规则：
1. 只输出一个 JSON 数字数组，长度必须与输入条数一致，顺序一一对应
2. 每个数字在 5 到 180 之间，取 5 的倍数
3. 参考年级：小学偏快、初中中等、高中偏慢；试卷/作文/实验报告明显更久，背诵/抄写按篇幅估算
4. 落在「薄弱项」里的科目，要额外多给 15%~25% 的时间（学生做得慢、要反复想）
5. 不要输出任何解释、不要包裹在代码块里

示例：
输入：{"grade":"小学","weak":["数学"],"items":["数学完成习题1-10", "语文背诵第三课"]}
输出：[40, 15]`;

/** 判断一条作业是否命中薄弱项（作业文本里带科目名即可） */
function isWeak(item: string, weak: string[]): boolean {
  return weak.some((w) => w && item.includes(w));
}

/** 本地规则兜底：AI 不可用也能给出合理数值 */
function localEstimate(items: string[], grade: string, weak: string[] = []): number[] {
  const factor = grade === '小学' ? 0.85 : grade === '高中' ? 1.25 : 1;
  return items.map((t) => {
    let min = 15 + Math.min(35, Math.floor(t.length / 4));
    if (/试卷|卷子|测试|模考/.test(t)) min += 25;
    if (/作文|报告|实验|论文/.test(t)) min += 35;
    if (/背诵|抄写|听写|默写/.test(t)) min += 15;
    if (/习题|练习册|题|页/.test(t)) {
      const range = t.match(/(\d+)\s*[~～\-—到]\s*(\d+)/);
      if (range) min += Math.min(60, Math.max(2, Number(range[2]) - Number(range[1]) + 1) * 2);
      else min += 10;
    }
    // 薄弱科目按 +20% 加权，与 AI 提示词里的 15%~25% 保持一致口径
    if (isWeak(t, weak)) min *= 1.2;
    return Math.max(5, Math.min(180, Math.round((min * factor) / 5) * 5));
  });
}

export async function POST(request: NextRequest) {
  try {
    if (!requireHomeworkUser(request)) {
      return NextResponse.json({ success: false, message: '请先登录后再使用用时推测' }, { status: 401 });
    }

    const body = await request.json();
    const items: string[] = Array.isArray(body.items)
      ? body.items.filter((x: unknown) => typeof x === 'string' && x.trim()).slice(0, 60).map((x: string) => x.trim())
      : [];
    const grade = typeof body.grade === 'string' && body.grade ? body.grade : '初中';
    // 薄弱项来自个人中心的学习画像，只接受字符串数组，防止脏数据进提示词
    const weak: string[] = Array.isArray(body.weak)
      ? body.weak.filter((x: unknown) => typeof x === 'string' && x.trim()).slice(0, 12).map((x: string) => x.trim())
      : [];

    if (!items.length) {
      return NextResponse.json({ success: false, message: '请先输入至少一条作业内容' }, { status: 400 });
    }

    const fallback = () => {
      const estimates = localEstimate(items, grade, weak);
      return NextResponse.json({
        success: true,
        source: 'local',
        estimates,
        total: estimates.reduce((a, b) => a + b, 0),
        notice: 'AI 通道繁忙，已按年级、薄弱项与作业类型给出本地估值',
      });
    };

    if (!TEXT_CHAIN.some((m) => Boolean(m.apiKey))) return fallback();

    try {
      const result = await chatText(
        [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `输入：${JSON.stringify({ grade, weak, items })}` },
        ],
        { timeoutMs: 20_000, maxTokens: 512, temperature: 0.2 },
      );
      if (!result.ok) {
        console.warn('Estimate AI unavailable, using local rules:', result.lastStatus);
        return fallback();
      }
      const parsed = JSON.parse(stripCodeFence(result.text));
      if (!Array.isArray(parsed) || parsed.length !== items.length) return fallback();
      const estimates = parsed.map((n, i) =>
        Math.max(5, Math.min(180, Math.round((Number(n) || localEstimate([items[i]!], grade, weak)[0] || 20) / 5) * 5)),
      );
      return NextResponse.json({
        success: true,
        source: 'ai',
        estimates,
        total: estimates.reduce((a, b) => a + b, 0),
      });
    } catch (err) {
      console.warn('Estimate AI failed, using local rules:', err);
      return fallback();
    }
  } catch (error: unknown) {
    console.error('Homework estimate error:', error);
    return NextResponse.json({ success: false, message: '用时推测暂时不可用，请稍后重试' }, { status: 500 });
  }
}
