import { normalizeSubjectPrefix } from '@/features/homework-pro/core/subject';
import { chatText, stripCodeFence } from '@/lib/aiChain';

/** 本地兜底分点：按行 → 中文标点 + 作业关键词 → 普通逗号 */
export function splitTasksLocally(text: string): string[] {
  const cleaned = text.trim();
  if (!cleaned) return [];

  let items = cleaned.split(/[\n\r]+/).map((s) => s.trim()).filter(Boolean);
  if (items.length === 1) {
    // 包含全角逗号「，」：旧版只写了半角，中文一句话作业拆不开
    items = cleaned.split(/[,，;；、。]+(?=[^,，;；、。]*?[作业练习试卷习题])/).map((s) => s.trim()).filter(Boolean);
    if (items.length === 1) items = cleaned.split(/[,，;；、。]/).map((s) => s.trim()).filter(Boolean);
  }
  return items.map(normalizeSubjectPrefix);
}

const SYSTEM_PROMPT = `你是一个专业的作业管理助手。用户会输入一段作业内容，你需要将其整理成清晰的作业列表。

重要规则：
1. 如果某个科目有多个作业（例如"语文作业一张试卷三个练习册"），需要分别列为独立项
2. 每个作业项都必须包含科目名称作为前缀
3. 每个作业项要简洁明了，去掉多余的词语
4. 只返回作业列表，每行一条，不要编号、不要解释、不要额外格式

格式示例：
输入："语文作业一张试卷三个练习册，数学作业完成习题1-10"
输出：
语文一张试卷
语文三个练习册
数学完成习题1-10`;

// 旧的 Coze SDK 分支依赖 COZE_WORKLOAD_IDENTITY_API_KEY，而项目配置的是另一组键名且为空，
// 导致 AI 分点 100% 抛错被静默吞掉、常年走本地规则。这里改用模型链（GLM → Agnes 自动降级）。

/**
 * AI 智能分点；失败自动回退本地规则（并记录原因，不再静默吞掉）。
 * 供 /api/homework/tasks（直接入库）与 /api/homework/parse（只解析预览）共用。
 */
export async function parseHomeworkText(text: string): Promise<{ items: string[]; source: 'ai' | 'local' }> {
  const local = () => ({ items: splitTasksLocally(text), source: 'local' as const });

  try {
    const result = await chatText(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `请帮我将以下作业内容整理成列表：\n${text}` },
      ],
      { timeoutMs: 20_000, maxTokens: 1024, temperature: 0.3 },
    );

    if (!result.ok) {
      console.warn('Homework parse AI unavailable, using local rules:', result.lastStatus);
      return local();
    }

    const items = stripCodeFence(result.text)
      .split('\n')
      .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.、)])\s*/, '').trim())
      .filter((line) => line && !/^(作业列表|以下是|输出)[:：]?$/.test(line))
      .map(normalizeSubjectPrefix);
    if (items.length) return { items, source: 'ai' };
  } catch (err) {
    console.warn('Homework parse AI failed, using local rules:', err);
  }
  return local();
}
