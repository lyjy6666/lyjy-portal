import { NextRequest, NextResponse } from 'next/server';
import { requireHomeworkUser } from '@/lib/homeworkAuth';
import { chatText, TEXT_CHAIN } from '@/lib/aiChain';

const GRADE_PROMPT = `你是一位经验丰富的{subject}{grade}教师，现在要批改学生提交的作业内容（已通过 OCR 识别为文本）。

作业内容如下：
{content}

请按以下步骤工作：
1. 仔细分析所有题目的题干和学生作答内容
2. 逐题判断对错，找出错题
3. 对每道错题给出正确答案和解析
4. 针对每道错题出 1-2 道相似题（举一反三），帮助学生巩固
5. 给出整体点评

你必须严格返回以下 JSON 格式（不要输出任何其他内容、不要 markdown 代码块、不要解释说明）：
{
  "totalQuestions": 数字,
  "correctCount": 数字,
  "wrongCount": 数字,
  "problems": [
    {
      "question": "题目内容",
      "studentAnswer": "学生写的答案（如果空题则为空字符串）",
      "correctAnswer": "正确答案",
      "explanation": "解析说明",
      "similarProblems": ["相似题1", "相似题2"]
    }
  ],
  "overallComment": "整体点评"
}

注意：
- 如果全部正确，problems 返回空数组 []
- 如果内容中没有题目，totalQuestions 返回 0
- similarProblems 每题最多 2 道
- 所有文本用中文`;

export async function POST(request: NextRequest) {
  try {
    // 挡住匿名调用刷 Key；Pro 版用验签 Bearer，原版用 X-User-Id，双头兼容
    if (!requireHomeworkUser(request)) {
      return NextResponse.json({ success: false, message: '请先登录后再使用 AI 批改' }, { status: 401 });
    }
    if (!TEXT_CHAIN.some((m) => Boolean(m.apiKey))) {
      return NextResponse.json({ success: false, message: 'AI 批改通道尚未配置' }, { status: 503 });
    }

    const { ocrText, subject, grade, weak } = await request.json();

    if (!ocrText || typeof ocrText !== 'string' || !ocrText.trim()) {
      return NextResponse.json(
        { success: false, message: '请提供作业文本内容' },
        { status: 400 }
      );
    }

    // 学习画像里的薄弱项：命中时多讲基础、多出同类基础题
    const weakList: string[] = Array.isArray(weak)
      ? weak.filter((x: unknown) => typeof x === 'string' && x.trim()).slice(0, 12).map((x: string) => x.trim())
      : [];
    const weakHint = weakList.length
      ? `\n6. 该生的薄弱项是：${weakList.join('、')}。若本次批改的科目属于薄弱项，解析要更基础、步骤更细，相似题以基础巩固题为主。`
      : '';

    const prompt = GRADE_PROMPT
      .replace('{subject}', subject || '数学')
      .replace('{grade}', grade || '小学')
      .replace('{content}', ocrText)
      .replace('5. 给出整体点评', `5. 给出整体点评${weakHint}`);

    // 模型链：GLM → Agnes 自动降级；上游原文只进日志，不透传给用户
    const ai = await chatText([{ role: 'user', content: prompt }], {
      timeoutMs: 60_000,
      maxTokens: 4096,
      temperature: 0.2,
    });

    if (!ai.ok) {
      console.error('Grade AI unavailable:', ai.lastStatus, ai.attempts.map((a) => `${a.id}:${a.status || a.reason}`).join(','));
      return NextResponse.json(
        { success: false, message: 'AI 批改服务暂时繁忙，请稍后重试一次' },
        { status: 200 },
      );
    }

    const text = ai.text;

    // 提取 JSON
    let jsonStr = text;
    const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      jsonStr = fenceMatch[1].trim();
    }
    const firstBrace = jsonStr.indexOf('{');
    const lastBrace = jsonStr.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonStr = jsonStr.slice(firstBrace, lastBrace + 1);
    }

    let result;
    try {
      result = JSON.parse(jsonStr);
    } catch {
      // 不能把解析失败伪装成「全部正确」，否则用户会以为作业没问题
      return NextResponse.json({
        success: false,
        message: 'AI 批改结果格式异常，请重试一次',
      }, { status: 502 });
    }

    result.totalQuestions = Number(result.totalQuestions) || 0;
    result.correctCount = Number(result.correctCount) || 0;
    result.wrongCount = Number(result.wrongCount) || 0;
    result.problems = Array.isArray(result.problems) ? result.problems : [];
    result.overallComment = result.overallComment || '';

    return NextResponse.json({ success: true, result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '批改失败';
    console.error('Homework grade error:', error);
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
