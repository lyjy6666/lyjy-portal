import { NextRequest, NextResponse } from 'next/server';

// 智谱 GLM-4-Flash（永久免费，稳定）
const API_KEY = '4a11e71ff94a4534ac0126fe4ca0851d.P3s9sA1aB25cIb6u';
const BASE_URL = 'https://open.bigmodel.cn/api/paas/v4';
const MODEL = 'glm-4-flash';

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
    const { ocrText, subject, grade } = await request.json();

    if (!ocrText || typeof ocrText !== 'string' || !ocrText.trim()) {
      return NextResponse.json(
        { success: false, message: '请提供作业文本内容' },
        { status: 400 }
      );
    }

    const prompt = GRADE_PROMPT
      .replace('{subject}', subject || '数学')
      .replace('{grade}', grade || '小学')
      .replace('{content}', ocrText);

    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Zhipu API error:', response.status, errText);
      return NextResponse.json(
        { success: false, message: `AI 服务暂时不可用（${response.status}）` },
        { status: 500 }
      );
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim() || '';

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
      return NextResponse.json({
        success: true,
        result: {
          totalQuestions: 0,
          correctCount: 0,
          wrongCount: 0,
          problems: [],
          overallComment: 'AI 返回格式异常，原始内容：\n' + text,
        },
      });
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
