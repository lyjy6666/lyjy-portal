import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

function getUserIdFromHeader(request: NextRequest): number | null {
  const userIdStr = request.headers.get('X-User-Id');
  if (!userIdStr) return null;
  const userId = parseInt(userIdStr);
  return isNaN(userId) ? null : userId;
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromHeader(request);
    if (!userId) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    const tasks = await sql`
      SELECT * FROM tasks
      WHERE user_id = ${userId}
      ORDER BY is_pinned DESC, id DESC
    `;

    const formattedTasks = tasks.map(task => ({
      id: task.id,
      text: task.text,
      completed: task.completed,
      dueDate: task.due_date ? new Date(task.due_date) : undefined,
      isPinned: task.is_pinned,
      createdAt: new Date(task.created_at),
      updatedAt: task.updated_at ? new Date(task.updated_at) : undefined
    }));

    return NextResponse.json({ tasks: formattedTasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: '获取任务列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromHeader(request);
    if (!userId) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    const { text, dueDate } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: '请输入作业内容' },
        { status: 400 }
      );
    }

    console.log('开始处理任务:', text);

    const taskItems = await callCozeLLM(text);

    console.log('AI 分点结果:', taskItems);

    const createdTasks: any[] = [];
    for (const item of taskItems) {
      const result = await sql`
        INSERT INTO tasks (text, completed, due_date, is_pinned, user_id, updated_at)
        VALUES (${item}, false, ${dueDate ? new Date(dueDate).toISOString() : null}, false, ${userId}, NOW())
        RETURNING *
      `;
      createdTasks.push(result[0]);
    }

    const formattedTasks = createdTasks.map(task => ({
      id: task.id,
      text: task.text,
      completed: task.completed,
      dueDate: task.due_date ? new Date(task.due_date) : undefined,
      isPinned: task.is_pinned,
      createdAt: new Date(task.created_at),
      updatedAt: task.updated_at ? new Date(task.updated_at) : undefined
    }));

    return NextResponse.json({ tasks: formattedTasks });
  } catch (error) {
    console.error('Error processing tasks:', error);

    let errorMessage = '处理作业时出错，请重试';

    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    console.error('Full error:', error);

    return NextResponse.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    );
  }
}

function splitTasksLocally(text: string): string[] {
  console.log('使用本地分点备用方案');

  const cleanedText = text.trim();

  let items = cleanedText
    .split(/[\n\r]+/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (items.length === 1) {
    items = cleanedText
      .split(/[,;；、。]+(?=[^,;；、。]*?[作业练习试卷习题])/)
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (items.length === 1) {
      items = cleanedText
        .split(/[,;；、。]/)
        .map(line => line.trim())
        .filter(line => line.length > 0);
    }
  }

  const subjects = ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治', '音乐', '美术', '体育', '科学'];

  return items.map(item => {
    const hasSubjectPrefix = subjects.some(subject => item.startsWith(subject));

    if (hasSubjectPrefix) {
      return item;
    }

    const foundSubject = subjects.find(subject =>
      item.includes(subject) && item.indexOf(subject) < 5
    );

    if (foundSubject) {
      const taskWithoutSubject = item.replace(foundSubject, '').trim();
      return `${foundSubject}${taskWithoutSubject}`;
    }

    return item;
  });
}

async function callCozeLLM(text: string): Promise<string[]> {
  try {
    console.log('调用 Coze LLM...');

    const config = new Config();
    const client = new LLMClient(config);

    const systemPrompt = `你是一个专业的作业管理助手。用户会输入一段作业内容，你需要将其整理成清晰的作业列表。

**重要规则：**
1. 如果用户输入的某个科目有多个作业（例如"语文作业一张试卷三个练习册"），需要将这些作业分别列为独立的不同作业项
2. 每个作业项都必须包含科目名称作为前缀
3. 每个作业项目要简洁明了，去掉多余的词语
4. 只返回作业列表，不要有任何额外的解释或前言

**格式示例：**
输入："语文作业一张试卷三个练习册，数学作业完成习题1-10"
输出：
语文一张试卷
语文三个练习册
数学完成习题1-10

输入："英语单词抄写三遍，阅读理解两篇，作文一篇"
输出：
英语单词抄写三遍
英语阅读理解两篇
英语作文一篇`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: `请帮我将以下作业内容整理成列表：\n${text}` }
    ];

    const response = await client.invoke(messages, {
      model: 'doubao-seed-1-8-251228',
      temperature: 0.3
    });

    console.log('Coze LLM 响应:', response);

    const content = response.content || '';

    const tasksText = content.trim();
    const taskItems = tasksText
      .split('\n')
      .map((line: string) => line.replace(/^[0-9]+[.、]\s*/, '').trim())
      .filter((line: string) => line.length > 0);

    if (taskItems.length === 0) {
      console.warn('AI 没有返回有效任务，使用本地分点方案');
      return splitTasksLocally(text);
    }

    return taskItems;
  } catch (error) {
    console.error('调用 Coze LLM 失败:', error);
    console.warn('Coze LLM 调用异常，使用本地分点方案');
    return splitTasksLocally(text);
  }
}
