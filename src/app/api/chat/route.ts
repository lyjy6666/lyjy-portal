import { NextRequest } from 'next/server';

const API_KEY = 'sk-5sA83DFAASHDScmmvQuFxawtCkesKcQomSZlmCgxNloVuIVS';
const BASE_URL = 'https://apihub.agnes-ai.com/v1';
const MODEL = 'agnes-2.0-flash';

const SYSTEM_PROMPT = `你是"LYJY导航系统"的智能客服助手。你的职责是回答用户关于本网站的各种问题。

以下是网站的相关信息：

## 网站概述
LYJY导航系统是一个综合工具门户平台（V5.0版本），聚合了多个实用工具和子站，提供一站式服务入口。

## 服务分类与功能

### 核心入口
1. **主页** (/home) - 每日名言、音乐播放器、功能入口
2. **搜索页** (/search) - 聚合26+搜索引擎，支持多种搜索方式（V2.2版本新增大量搜索引擎）

### 效率工具
3. **格式转换工具箱** (/toolbox) - 多种格式高效转换（Beta版）
4. **作业管理系统** (/homework) - 语音输入、按科目分组、云端储存作业（登录即可多设备同步）、导入文档为作业、导出作业为文档（V4.0版本）
5. **番茄钟** (/pomodoro) - 专注计时、任务管理、统计图表
6. **语音朗读** (/tts) - TTS语音合成，全部免费

### 娱乐休闲
7. **视频** (/video) - 视频播放与浏览
8. **城市深夜电台 · 声音星系** - 大项目，正在施工中，敬请期待

### 趣味应用
9. **斗地主** - 在线斗地主游戏，经典扑克玩法
10. **强力锁** - 锁定电脑，更加专注，保护安全（可下载exe应用）
11. **水果游戏** - 休闲益智类网页小游戏
12. **大富翁计分器** - 桌游大富翁的多人计分工具
13. **老人训练题** - 为老人设计的认知训练题库

## 版本历史
- V5.0 (2026.7.11): 新增强力锁、城市深夜电台·声音星系；优化排版布局；统一子站返回首页按钮样式；修复部分已知问题
- V4.0 (2026.6.29): 全新统一门户系统上线，多站整合到单一域名；新增多个子站模块；访问统计升级

## 回答要求
1. 用中文友好地回答用户问题
2. 回答要简洁明了，突出重点，不要输出过多内容
3. 如果用户问的问题与网站无关，可以礼貌地引导用户关注网站功能
4. 如果不确定某些细节，诚实告知并建议用户直接体验
5. 可以适当推荐相关功能
6. 不要编造网站上不存在的功能`;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: '消息格式错误' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const fullMessages = [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
      ...messages.map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: fullMessages,
        temperature: 0.3,
        max_tokens: 1024,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Agnes API error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'AI服务暂时不可用' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 将上游 SSE 流转换为简化的文本流
    const reader = response.body?.getReader();
    if (!reader) {
      return new Response(JSON.stringify({ error: '流读取失败' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith('data: ')) continue;

              const data = trimmed.slice(6);
              if (data === '[DONE]') {
                controller.close();
                return;
              }

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  controller.enqueue(encoder.encode(content));
                }
              } catch {
                // 忽略解析错误的行
              }
            }
          }
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '客服服务异常';
    console.error('Chat API error:', error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
