'use client';

import { useMemo, useState } from 'react';
import {
  Bot, Code2, Clapperboard, Palette, Music,
  X, ExternalLink, Trophy, Search, type LucideIcon,
} from 'lucide-react';

type Region = '国内' | '海外';

interface RankedModel {
  name: string;
  vendor: string;
  region: Region;
  url: string;
  note: string;
}

interface ModelBoard {
  key: string;
  label: string;
  icon: LucideIcon;
  /** 同一类型内按实力从高到低排列（数组顺序即排名） */
  models: RankedModel[];
}

/**
 * 分类型模型榜单 —— 数据整理于 2026 年 10 月，
 * 参考 Arena(LMArena)、Artificial Analysis、SWE-bench、RoboColiseum 等公开评测。
 * 注意：只在**同一类型内**排名，不同类型（如视频 vs 对话）不可横向比较。
 */
const BOARDS: ModelBoard[] = [
  {
    key: 'chat', label: '对话 / 通用大模型', icon: Bot,
    models: [
      { name: 'Gemini 4 Carbon', vendor: 'Google', region: '海外', url: 'https://gemini.google.com', note: '2026-10-28 登顶 AA 智能指数 v5（59 分），部分用户开放、暂未公开 API' },
      { name: 'Claude Opus 5.5', vendor: 'Anthropic', region: '海外', url: 'https://claude.ai', note: 'AA v5 58 分、LMArena 1509，写作/编程/长程任务顶级' },
      { name: 'GPT-6 Astra', vendor: 'OpenAI', region: '海外', url: 'https://chatgpt.com', note: 'AA v5 57 分，前沿推理最强档' },
      { name: 'GPT-6.1 Sol', vendor: 'OpenAI', region: '海外', url: 'https://chatgpt.com', note: 'AA v5 55 分，性能接近头部且成本约 1/8' },
      { name: 'Claude Sonnet 5.5', vendor: 'Anthropic', region: '海外', url: 'https://claude.ai', note: 'AA v5 54 分，办公/知识工作效率高' },
      { name: 'Gemini 4 Argon', vendor: 'Google', region: '海外', url: 'https://gemini.google.com', note: 'LMArena 综合第一（1520），百万 token 上下文' },
      { name: 'Muse Wonder', vendor: 'Meta', region: '海外', url: 'https://www.meta.ai', note: 'AA v5 50 分，Meta 新旗舰，部分评测领先' },
      { name: 'Claude Fable 5.1', vendor: 'Anthropic', region: '海外', url: 'https://claude.ai', note: '写作与长文见长，LMArena 1504' },
      { name: 'Claude Haiku 5.5', vendor: 'Anthropic', region: '海外', url: 'https://claude.ai', note: '轻量低价，批量处理首选' },
      { name: 'Grok', vendor: 'xAI', region: '海外', url: 'https://grok.com', note: '实时联网强，风格直接' },
      { name: 'Kimi K3.1 Pro', vendor: '月之暗面', region: '国内', url: 'https://kimi.moonshot.cn', note: '开源模型最强（AA 46 分），Terminal-Bench 4.0 第一' },
      { name: 'DeepSeek V4.1 Flash', vendor: '深度求索', region: '国内', url: 'https://chat.deepseek.com', note: '可下载开源最强档之一，调用量全球第一、性价比极高' },
      { name: 'GLM-5.3', vendor: '智谱 AI', region: '国内', url: 'https://chatglm.cn', note: '开源强档，综合均衡、可私有化' },
      { name: 'Qwen 3.7-Max', vendor: '阿里', region: '国内', url: 'https://tongyi.aliyun.com', note: '国产全能均衡，生态齐全' },
      { name: '豆包', vendor: '字节跳动', region: '国内', url: 'https://www.doubao.com', note: '全场景本土化，免费好用、语音多模态好' },
    ],
  },
  {
    key: 'code', label: '编程 / 代码', icon: Code2,
    models: [
      { name: 'Claude Opus 5.5', vendor: 'Anthropic', region: '海外', url: 'https://claude.ai', note: 'AA v5 编程/Agent 领跑（FrontierCode 2.0、Terminal-Bench 第一）' },
      { name: 'GPT-6 Astra', vendor: 'OpenAI', region: '海外', url: 'https://chatgpt.com', note: 'Terminal-Bench-Science 第一，工程 Agent 强' },
      { name: 'GPT-6.1 Sol', vendor: 'OpenAI', region: '海外', url: 'https://chatgpt.com', note: '编程接近头部且成本低，性价比之选' },
      { name: 'Kimi K3.1 Pro', vendor: '月之暗面', region: '国内', url: 'https://kimi.moonshot.cn', note: 'Terminal-Bench 4.0 第一，国产编程最强档' },
      { name: 'Claude Sonnet 5.5', vendor: 'Anthropic', region: '海外', url: 'https://claude.ai', note: 'AA-Briefcase 第一，日常编码高效' },
      { name: 'Gemini 4', vendor: 'Google', region: '海外', url: 'https://gemini.google.com', note: '百万上下文，代码库级分析优势' },
      { name: 'DeepSeek V4.1', vendor: '深度求索', region: '国内', url: 'https://chat.deepseek.com', note: '编程强、性价比高，国内开发者常用' },
      { name: 'GLM-5.3', vendor: '智谱 AI', region: '国内', url: 'https://chatglm.cn', note: '开源编程档，可私有化部署' },
      { name: 'Qwen 3.6 27B', vendor: '阿里', region: '国内', url: 'https://tongyi.aliyun.com', note: '端侧 / 私有化部署友好' },
    ],
  },
  {
    key: 'video', label: '视频生成', icon: Clapperboard,
    models: [
      { name: 'Seedance 2.5', vendor: '字节跳动', region: '国内', url: 'https://jimeng.jianying.com', note: '实测综合领先，原生单段 30 秒连贯视频' },
      { name: 'MiniMax H3', vendor: 'MiniMax 海螺', region: '国内', url: 'https://hailuoai.com', note: 'AA 视频编辑榜第一，开源多模态，商用级可控' },
      { name: '可灵 Kling 3.0', vendor: '快手', region: '国内', url: 'https://klingai.kuaishou.com', note: '电影级质感 + 性价比，中文创作者首选' },
      { name: 'Veo 3.1', vendor: 'Google', region: '海外', url: 'https://deepmind.google/models/veo', note: '音画同出，画质与物理真实感标杆；生态封闭' },
      { name: 'Wan 3.0', vendor: '阿里', region: '国内', url: 'https://tongyi.aliyun.com/wanxiang', note: '阿里视频 / 世界模型，有开源版可本地跑' },
      { name: 'Vidu', vendor: '生数科技', region: '国内', url: 'https://www.vidu.cn', note: '角色一致性 / 参考生成强' },
      { name: '混元视频', vendor: '腾讯', region: '国内', url: 'https://video.hunyuan.tencent.com', note: '腾讯开源视频模型，可本地部署' },
      { name: 'PixVerse', vendor: '爱诗科技', region: '国内', url: 'https://pixverse.ai', note: '轻量快速出片，短视频批量素材' },
      { name: 'Luma Dream Machine', vendor: 'Luma AI', region: '海外', url: 'https://lumalabs.ai/dream-machine', note: '高质量、支持图生视频与运镜' },
      { name: 'Runway Gen-4', vendor: 'Runway', region: '海外', url: 'https://runwayml.com', note: '生成 + 编辑一体化创意工作站' },
      { name: 'Pika', vendor: 'Pika Labs', region: '海外', url: 'https://pika.art', note: '风格化短视频，上手简单' },
      { name: '剪映 CapCut', vendor: '字节跳动', region: '国内', url: 'https://www.capcut.cn', note: '无限画布剪辑 + 内嵌 Seedance 生成' },
    ],
  },
  {
    key: 'image', label: '图像生成', icon: Palette,
    models: [
      { name: 'GPT Image 2.5', vendor: 'OpenAI', region: '海外', url: 'https://chatgpt.com', note: '综合最强，表情/透视/构图更自然，文字渲染强' },
      { name: 'Nano Banana 2.1', vendor: 'Google', region: '海外', url: 'https://gemini.google.com', note: '角色一致性与控制力顶级，工程化好、性价比高' },
      { name: 'Midjourney V8.2', vendor: 'Midjourney', region: '海外', url: 'https://www.midjourney.com', note: '美学与视觉方向最强，2026 新版补齐编辑能力' },
      { name: 'Qwen Image 2.0', vendor: '阿里', region: '国内', url: 'https://tongyi.aliyun.com', note: '中文文字渲染强，国内首选之一' },
      { name: 'Seedream', vendor: '字节跳动', region: '国内', url: 'https://jimeng.jianying.com', note: '中文海报与局部修改强' },
      { name: 'Grok Imagine 2.0', vendor: 'xAI', region: '海外', url: 'https://grok.com', note: 'Arena 文生图前列，生成速度快' },
      { name: 'MAI-Image 2.6', vendor: 'Microsoft', region: '海外', url: 'https://www.bing.com/images/create', note: '微软图像模型，Arena 文生图前列' },
      { name: 'FLUX 2', vendor: 'Black Forest Labs', region: '海外', url: 'https://blackforestlabs.ai', note: '开源可控，社区生态庞大' },
      { name: 'Ideogram 4.0', vendor: 'Ideogram', region: '海外', url: 'https://ideogram.ai', note: '画面内文字排版准，海报场景强' },
      { name: 'Recraft', vendor: 'Recraft', region: '海外', url: 'https://www.recraft.ai', note: '矢量 / 品牌设计强，可出 SVG' },
      { name: 'Adobe Firefly', vendor: 'Adobe', region: '海外', url: 'https://firefly.adobe.com', note: '商用版权合规，正式工作流首选' },
      { name: 'Stable Diffusion 3.5', vendor: 'Stability AI', region: '海外', url: 'https://stability.ai', note: '本地部署自由度最高，隐私可控' },
    ],
  },
  {
    key: 'audio', label: '音频 / 音乐', icon: Music,
    models: [
      { name: 'Suno V6', vendor: 'Suno', region: '海外', url: 'https://suno.com', note: '音乐生成顶流，整曲质量与风格最全' },
      { name: 'ElevenLabs', vendor: 'ElevenLabs', region: '海外', url: 'https://elevenlabs.io', note: '语音克隆 / 合成顶流，推出 ElevenMusic' },
      { name: 'Udio', vendor: 'Udio', region: '海外', url: 'https://www.udio.com', note: '音乐细节还原高，风格丰富' },
      { name: 'MiniMax Audio', vendor: 'MiniMax 海螺', region: '国内', url: 'https://hailuoai.com/audio', note: '中文语音合成 / 克隆强，音色自然' },
      { name: '海绵音乐', vendor: '字节跳动', region: '国内', url: 'https://www.haimian.com', note: '中文歌生成体验好、免费' },
      { name: '网易天音', vendor: '网易', region: '国内', url: 'https://tianyin.163.com', note: '本土化音乐创作，操作简单' },
      { name: '讯飞配音', vendor: '科大讯飞', region: '国内', url: 'https://peiyin.xunfei.cn', note: '中文配音合成自然，音色多' },
      { name: 'Fish Audio', vendor: 'Fish Audio', region: '海外', url: 'https://fish.audio', note: '开源语音克隆，TTS 效果好' },
      { name: '火山引擎语音', vendor: '字节跳动', region: '国内', url: 'https://www.volcengine.com/product/voice-tech', note: '企业级 TTS / 语音合成，稳定' },
    ],
  },
];

const RANK_STYLE: string[] = [];

interface AIToolsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AITools({ isOpen, onClose }: AIToolsProps) {
  const [activeKey, setActiveKey] = useState(BOARDS[0].key);
  const [query, setQuery] = useState('');

  const board = BOARDS.find((b) => b.key === activeKey) ?? BOARDS[0];

  const models = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return board.models;
    return board.models.filter(
      (m) => m.name.toLowerCase().includes(q) || m.vendor.toLowerCase().includes(q) || m.note.toLowerCase().includes(q)
    );
  }, [board, query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-900/85 shadow-[0_0_80px_-20px_rgba(56,189,248,0.5)] backdrop-blur-2xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/60 to-transparent" />
        {/* 标题栏 */}
        <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
          <div>
            <h3 className="flex items-center gap-2.5 text-xl font-bold">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30">
                <Trophy size={18} />
              </span>
              <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">AI 模型榜单</span>
            </h3>
            <p className="mt-1 text-xs text-white/50">
              分类型排名，不同类型不互相比较 · 数据整理于 2026 年 10 月
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
            aria-label="关闭"
          >
            <X size={20} />
          </button>
        </div>

        {/* 类型切换 + 搜索 */}
        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 p-4">
          {BOARDS.map((b) => (
            <button
              key={b.key}
              onClick={() => setActiveKey(b.key)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all ${
                activeKey === b.key
                  ? 'bg-white/10 text-white ring-1 ring-inset ring-white/15'
                  : 'text-white/50 hover:bg-white/[0.06] hover:text-white/80'
              }`}
            >
              <b.icon size={14} /> {b.label}
            </button>
          ))}
          <div className="relative ml-auto min-w-[150px] flex-1 sm:max-w-[220px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="在本榜内搜索…"
              className="w-full rounded-full border border-white/10 bg-white/[0.04] py-1.5 pl-8 pr-3 text-xs text-white placeholder-white/40 outline-none focus:border-sky-400/50"
            />
          </div>
        </div>

        {/* 榜单列表 */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6">
          <p className="py-3 text-xs text-white/40">
            {board.label} · 共 {board.models.length} 款 · 按综合实力排名（仅本类型内比较）
          </p>
          {models.map((m) => {
            const rank = board.models.indexOf(m) + 1;
            const tier = rank <= 2 ? 'T0' : rank <= 5 ? 'T1' : 'T2';
            const rankColor =
              rank === 1
                ? 'text-amber-300 [text-shadow:0_0_18px_rgba(251,191,36,0.55)]'
                : rank === 2
                ? 'text-slate-200 [text-shadow:0_0_14px_rgba(226,232,240,0.4)]'
                : rank === 3
                ? 'text-orange-400 [text-shadow:0_0_14px_rgba(251,146,60,0.4)]'
                : 'text-white/15';
            const tierStyle =
              tier === 'T0'
                ? 'text-amber-300 bg-amber-400/10'
                : tier === 'T1'
                ? 'text-sky-300 bg-sky-400/10'
                : 'text-white/40 bg-white/[0.06]';
            return (
              <div
                key={m.name}
                className="group grid grid-cols-[2.9rem_1fr_auto] items-center gap-3 border-t border-white/[0.06] py-3.5 transition-colors hover:bg-white/[0.03]"
              >
                <span className={`font-mono text-2xl font-black leading-none tabular-nums ${rankColor}`}>
                  {String(rank).padStart(2, '0')}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <h4 className="text-[0.95rem] font-semibold text-white">{m.name}</h4>
                    <span className="text-[10px] text-white/40">
                      {m.region} · {m.vendor}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed text-white/55">{m.note}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2.5">
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${tierStyle}`}>{tier}</span>
                  <a
                    href={m.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-white/45 transition-colors group-hover:border-sky-400/40 group-hover:text-sky-300"
                    aria-label={`访问 ${m.name}`}
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            );
          })}
          {models.length === 0 && (
            <p className="py-12 text-center text-sm text-white/40">本榜内没有匹配的模型</p>
          )}
        </div>

        {/* 数据说明 */}
        <div className="border-t border-white/10 px-5 py-3">
          <p className="text-[11px] leading-relaxed text-white/40">
            数据整理于 2026 年 10 月 29 日，参考 Artificial Analysis 智能指数 v5、Arena(LMArena) 等公开评测；仅在同类型内排名、不同类型不可比。注：OpenAI Sora 已于 2026 年关停，未列入视频榜。
          </p>
        </div>
      </div>
    </div>
  );
}
