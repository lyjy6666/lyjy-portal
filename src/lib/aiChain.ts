/**
 * 统一的大模型调用链（视觉 + 文本）。
 *
 * 优先级约定（用户要求）：**Agnes 3.0 Flash 最高，所有 GLM-*-flash 一律排到最后**。
 *   视觉链：Agnes 3.0 Flash → Agnes 2.5 Flash → GLM 4.6 Flash(视觉) → GLM-4V-Flash
 *   文本链：Agnes 3.0 Flash → Agnes 2.5 Flash → GLM-4-Flash
 * 高优先级通道调用失败（限流 / 额度 / 网关 / 空返回）才降级到下一个，绝不直接跳过。
 *
 * 注意模型名：
 *   - 图片识别必须用视觉版 `glm-4.6v-flash`；纯文本的 `glm-4.6-flash` 传 image_url
 *     会 400「content.type 参数非法」，本账号文本侧也是 403「无权访问(1220)」。
 *   - `glm-4.6v-flash` 是思维链模型，不传 thinking:{type:'disabled'} 会把 token
 *     全花在 reasoning 上，正文为空 + finish_reason=length。
 *
 * 三家都走 OpenAI 兼容协议：
 *   messages[].content = [{ type:'text' }, { type:'image_url', image_url:{ url } }]
 *   返回 data.choices[0].message.content
 *
 * 重要约定：上游原始错误文本（含「余额不足」「资源包」等）绝不返回给前端，
 * 只写服务端日志；前端只拿到结构化的 code。
 */

export type VisionProvider = 'zhipu' | 'agnes';

export interface VisionModelSpec {
  /** 唯一标识，用于日志与前端回显 */
  id: string;
  /** 上游真实模型名 */
  model: string;
  provider: VisionProvider;
  baseUrl: string;
  apiKey: string;
  /** 该模型额外的请求参数（如关闭思维链） */
  extra?: Record<string, unknown>;
  /** 该模型的默认 max_tokens */
  maxTokens?: number;
}

const ZHIPU_BASE_URL = 'https://open.bigmodel.cn/api/paas/v4';
const AGNES_BASE_URL = 'https://apihub.agnes-ai.com/v1';

/**
 * Agnes 密钥。优先读 AGNES_VISION_API_KEY；
 * 未配置时用兜底值，避免漏配环境变量就整条链断掉。
 */
const AGNES_KEY =
  process.env.AGNES_VISION_API_KEY ||
  'sk-Dc9GQ1C4aZfQDVklSFzSF5GyzFBphn3KyPnl6s9MVjrKulc8';

const ZHIPU_KEY = process.env.ZHIPU_API_KEY || '';

/** 识别链：Agnes 3.0 Flash（最高）→ Agnes 2.5 Flash → GLM 4.6 Flash(视觉) → GLM-4V-Flash（最低） */
export const VISION_CHAIN: VisionModelSpec[] = [
  {
    id: 'agnes-3.0-flash',
    model: 'agnes-3.0-flash',
    provider: 'agnes',
    baseUrl: AGNES_BASE_URL,
    apiKey: AGNES_KEY,
    maxTokens: 2048,
  },
  {
    id: 'agnes-2.5-flash',
    model: 'agnes-2.5-flash',
    provider: 'agnes',
    baseUrl: AGNES_BASE_URL,
    apiKey: AGNES_KEY,
    maxTokens: 2048,
  },
  {
    id: 'glm-4.6v-flash',
    model: process.env.ZHIPU_VISION_MODEL || 'glm-4.6v-flash',
    provider: 'zhipu',
    baseUrl: ZHIPU_BASE_URL,
    apiKey: ZHIPU_KEY,
    // 关闭思维链：否则 token 全被 reasoning 吃掉，正文为空
    extra: { thinking: { type: 'disabled' } },
    maxTokens: 3000,
  },
  {
    id: 'glm-4v-flash',
    model: 'glm-4v-flash',
    provider: 'zhipu',
    baseUrl: ZHIPU_BASE_URL,
    apiKey: ZHIPU_KEY,
    maxTokens: 2048,
  },
];

/**
 * 快速模式识别链：GLM 4.6V Flash 优先。
 * Agnes 3.0 质量更稳但单图要 2~10 秒；拍照认作业只想快点出字时，
 * 用这条「先快后稳」的链：GLM 4.6V（最快 ~1s）→ Agnes 2.5（居中）→ Agnes 3.0（最稳）。
 * 注意：这是用户显式开启快速模式时的例外，默认链仍然把 GLM 排在最后。
 */
export const VISION_CHAIN_FAST: VisionModelSpec[] = [
  {
    id: 'glm-4.6v-flash',
    model: process.env.ZHIPU_VISION_MODEL || 'glm-4.6v-flash',
    provider: 'zhipu',
    baseUrl: ZHIPU_BASE_URL,
    apiKey: ZHIPU_KEY,
    extra: { thinking: { type: 'disabled' } },
    maxTokens: 3000,
  },
  VISION_CHAIN[1]!, // agnes-2.5-flash
  VISION_CHAIN[0]!, // agnes-3.0-flash
];

export interface VisionAttempt {
  id: string;
  ok: boolean;
  status: number;
  /** 耗时毫秒 */
  ms: number;
  /** 失败原因，仅用于日志 */
  reason?: string;
}

export interface VisionResult {
  ok: boolean;
  text: string;
  /** 实际命中的模型 id */
  model?: string;
  attempts: VisionAttempt[];
  /** 全部失败时的上游状态码与原始文本（仅供服务端判断，不要透传） */
  lastStatus: number;
  lastRaw: string;
}

/** 单次上游请求超时。Agnes 首包较慢，给足 25s */
const DEFAULT_TIMEOUT_MS = 25_000;

interface RecognizeOptions {
  /** 识别指令，默认是一句通用 OCR 提示词 */
  prompt?: string;
  /** 单次请求超时 */
  timeoutMs?: number;
  maxTokens?: number;
  /** 快速模式：优先 GLM 4.6V（约 1 秒），失败再退到 Agnes */
  fast?: boolean;
}

const DEFAULT_PROMPT =
  '请仔细识别这张图片中的所有文字内容，完整准确地输出图片中的文字，保持原有换行与段落。只输出识别到的文字，不要添加解释或格式。如果图片中没有文字，请回复"未识别到文字"。';

/**
 * 按链依次尝试识别，返回第一个成功结果。
 * 不抛异常，失败时通过 ok=false + attempts 表达。
 */
export async function recognizeImage(
  imageDataUrl: string,
  options: RecognizeOptions = {},
): Promise<VisionResult> {
  const { prompt = DEFAULT_PROMPT, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  const chain = options.fast ? VISION_CHAIN_FAST : VISION_CHAIN;
  const attempts: VisionAttempt[] = [];
  let lastStatus = 0;
  let lastRaw = '';

  for (const spec of chain) {
    if (!spec.apiKey) {
      attempts.push({ id: spec.id, ok: false, status: 0, ms: 0, reason: 'missing api key' });
      continue;
    }

    const startedAt = Date.now();
    try {
      const response = await fetch(`${spec.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${spec.apiKey}`,
        },
        body: JSON.stringify({
          model: spec.model,
          ...spec.extra,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: imageDataUrl } },
              ],
            },
          ],
          temperature: 0.1,
          max_tokens: options.maxTokens ?? spec.maxTokens ?? 2048,
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });

      const ms = Date.now() - startedAt;

      if (!response.ok) {
        const raw = await response.text().catch(() => '');
        lastStatus = response.status;
        lastRaw = raw;
        attempts.push({ id: spec.id, ok: false, status: response.status, ms, reason: raw.slice(0, 200) });
        console.error(`[vision] ${spec.id} -> HTTP ${response.status} (${ms}ms) ${raw.slice(0, 160)}`);
        continue;
      }

      const data = await response.json();
      const text = String(data?.choices?.[0]?.message?.content ?? '').trim();

      if (!text) {
        // 思维链模型把 token 用光的典型表现：content 空、reasoning_content 有值
        const reason = data?.choices?.[0]?.message?.reasoning_content ? 'only reasoning, empty content' : 'empty content';
        attempts.push({ id: spec.id, ok: false, status: response.status, ms, reason });
        console.error(`[vision] ${spec.id} -> ${reason} (${ms}ms)`);
        continue;
      }

      attempts.push({ id: spec.id, ok: true, status: response.status, ms });
      return { ok: true, text, model: spec.id, attempts, lastStatus, lastRaw };
    } catch (error: unknown) {
      const ms = Date.now() - startedAt;
      const reason = error instanceof Error ? `${error.name}: ${error.message}` : 'unknown error';
      attempts.push({ id: spec.id, ok: false, status: 0, ms, reason });
      console.error(`[vision] ${spec.id} -> ${reason} (${ms}ms)`);
      // 超时 / 网络错误同样继续尝试下一条
      continue;
    }
  }

  return { ok: false, text: '', attempts, lastStatus, lastRaw };
}

/** 判定「未识别到文字」这类正常空结果 */
export function isEmptyText(text: string): boolean {
  const normalized = text.replace(/[\s，。,.]/g, '');
  return !normalized || normalized === '未识别到文字' || normalized === '未识别到任何文字';
}

/** 上游原始错误统一转成可操作的中文提示，绝不透传原文 */
export function friendlyVisionMessage(lastStatus: number, lastRaw: string): string {
  if (/余额|资源包|1113|insufficient|quota|arrears/i.test(lastRaw) || lastStatus === 429) {
    return '图片识别服务暂时繁忙，请直接把作业内容输入到下方文本框，不影响继续记作业';
  }
  if (lastStatus === 401 || lastStatus === 403) {
    return '图片识别通道鉴权异常，请稍后重试或直接输入文字';
  }
  return '图片识别暂时不可用，请直接输入文字或稍后重试';
}

/* ------------------------------------------------------------------ */
/* 文本链路：智能分点 / 用时推测 / AI 批改                              */
/* ------------------------------------------------------------------ */

export interface TextModelSpec {
  id: string;
  model: string;
  baseUrl: string;
  apiKey: string;
  maxTokens?: number;
}

/**
 * 文本链：Agnes 3.0 Flash（最高）→ Agnes 2.5 Flash → GLM-4-Flash（最低）。
 * 高优先级通道失败才降级，避免「智能排期 / 用时推测 / AI 批改」因单通道限流整体不可用。
 */
export const TEXT_CHAIN: TextModelSpec[] = [
  { id: 'agnes-3.0-flash', model: 'agnes-3.0-flash', baseUrl: AGNES_BASE_URL, apiKey: AGNES_KEY, maxTokens: 1024 },
  { id: 'agnes-2.5-flash', model: 'agnes-2.5-flash', baseUrl: AGNES_BASE_URL, apiKey: AGNES_KEY, maxTokens: 1024 },
  { id: 'glm-4-flash', model: 'glm-4-flash', baseUrl: ZHIPU_BASE_URL, apiKey: ZHIPU_KEY, maxTokens: 1024 },
];

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface TextResult {
  ok: boolean;
  text: string;
  model?: string;
  attempts: VisionAttempt[];
  lastStatus: number;
  lastRaw: string;
}

interface ChatOptions {
  timeoutMs?: number;
  maxTokens?: number;
  temperature?: number;
}

/** 文本补全：按链降级，失败不抛异常，由调用方决定本地兜底 */
export async function chatText(messages: ChatMessage[], options: ChatOptions = {}): Promise<TextResult> {
  const { timeoutMs = 20_000, temperature = 0.3 } = options;
  const attempts: VisionAttempt[] = [];
  let lastStatus = 0;
  let lastRaw = '';

  for (const spec of TEXT_CHAIN) {
    if (!spec.apiKey) {
      attempts.push({ id: spec.id, ok: false, status: 0, ms: 0, reason: 'missing api key' });
      continue;
    }
    const startedAt = Date.now();
    try {
      const response = await fetch(`${spec.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${spec.apiKey}` },
        body: JSON.stringify({
          model: spec.model,
          messages,
          temperature,
          max_tokens: options.maxTokens ?? spec.maxTokens ?? 1024,
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      const ms = Date.now() - startedAt;

      if (!response.ok) {
        const raw = await response.text().catch(() => '');
        lastStatus = response.status;
        lastRaw = raw;
        attempts.push({ id: spec.id, ok: false, status: response.status, ms, reason: raw.slice(0, 200) });
        console.error(`[text] ${spec.id} -> HTTP ${response.status} (${ms}ms) ${raw.slice(0, 160)}`);
        continue;
      }

      const data = await response.json();
      const text = String(data?.choices?.[0]?.message?.content ?? '').trim();
      if (!text) {
        attempts.push({ id: spec.id, ok: false, status: response.status, ms, reason: 'empty content' });
        console.error(`[text] ${spec.id} -> empty content (${ms}ms)`);
        continue;
      }
      attempts.push({ id: spec.id, ok: true, status: response.status, ms });
      return { ok: true, text, model: spec.id, attempts, lastStatus, lastRaw };
    } catch (error: unknown) {
      const ms = Date.now() - startedAt;
      const reason = error instanceof Error ? `${error.name}: ${error.message}` : 'unknown error';
      attempts.push({ id: spec.id, ok: false, status: 0, ms, reason });
      console.error(`[text] ${spec.id} -> ${reason} (${ms}ms)`);
      continue;
    }
  }

  return { ok: false, text: '', attempts, lastStatus, lastRaw };
}

/** 去除模型偶尔加的 ```json 包裹 */
export function stripCodeFence(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
}

