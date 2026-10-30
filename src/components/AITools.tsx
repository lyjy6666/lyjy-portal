'use client';

import { useMemo, useState } from 'react';
import {
  Bot, Palette, Clapperboard, Music, Code2, Briefcase, Search,
  Star, X, ExternalLink, Sparkles, Globe2, MapPin, type LucideIcon,
} from 'lucide-react';

type Region = '国内' | '海外';
type Pricing = '免费' | '半免费' | '收费';

interface AITool {
  id: number;
  name: string;
  company: string;
  url: string;
  region: Region;
  /** 功能类型：对话 / 绘画 / 视频 / 音频 / 编程 / 办公 / 搜索 */
  category: string;
  pricing: Pricing;
  /** 推荐度 1~5 */
  stars: number;
  positioning: string;
  audience: string;
  pros: string;
  cons: string;
}

/** 精选主流 AI 工具（国内 + 海外）。数据整理于 2026-10。 */
const TOOLS: AITool[] = [
  // ===== 国内 =====
  { id: 1, name: 'DeepSeek', company: '深度求索', url: 'https://chat.deepseek.com', region: '国内', category: '对话', pricing: '免费', stars: 5, positioning: '推理与代码顶尖的国产大模型', audience: '开发者、学生、数理推理需求', pros: 'R1 推理强、代码/数学突出，网页端免费，响应快', cons: '多模态较弱，高峰期偶尔排队' },
  { id: 2, name: '豆包', company: '字节跳动', url: 'https://www.doubao.com', region: '国内', category: '对话', pricing: '免费', stars: 5, positioning: '全场景本土化 AI 助手', audience: '普通用户、学生、办公人群', pros: '界面友好、功能全、核心免费，语音与多模态体验好', cons: '深度专业能力略逊头部' },
  { id: 3, name: 'Kimi', company: '月之暗面', url: 'https://kimi.moonshot.cn', region: '国内', category: '对话', pricing: '半免费', stars: 4, positioning: '超长上下文与 Agent 能力', audience: '长文档处理、办公、学生', pros: '百万字长文本解析强，擅长资料整理', cons: '高峰较慢，复杂推理偶有幻觉' },
  { id: 4, name: '通义千问', company: '阿里', url: 'https://tongyi.aliyun.com', region: '国内', category: '对话', pricing: '免费', stars: 4, positioning: '全能型国产大模型', audience: '办公、电商、开发者', pros: '长文本与多模态均衡，核心功能免费，生态齐全', cons: '回答偶有冗余' },
  { id: 5, name: '腾讯元宝', company: '腾讯', url: 'https://yuanbao.tencent.com', region: '国内', category: '对话', pricing: '免费', stars: 4, positioning: '混元 + DeepSeek 双模型助手', audience: '微信/腾讯生态用户、办公', pros: '深度接入微信生态与公众号内容，免费好用', cons: '创意与深度能力一般' },
  { id: 6, name: '文心一言', company: '百度', url: 'https://yiyan.baidu.com', region: '国内', category: '对话', pricing: '免费', stars: 3, positioning: '中文理解深厚的国产大模型', audience: '政企、办公、中文创作', pros: '中文语感好、APP/网页核心免费', cons: '代码能力偏弱，高峰响应慢' },
  { id: 7, name: '智谱清言', company: '智谱 AI', url: 'https://chatglm.cn', region: '国内', category: '对话', pricing: '半免费', stars: 3, positioning: '开源 + 闭源双轨大模型', audience: '开发者、企业、内容创作', pros: '多模态均衡、行业落地广、有免费版', cons: '免费额度有限' },
  { id: 8, name: '讯飞星火', company: '科大讯飞', url: 'https://xinghuo.xfyun.cn', region: '国内', category: '对话', pricing: '半免费', stars: 3, positioning: '语音交互见长的国产大模型', audience: '教育、语音交互、办公', pros: '语音识别/合成行业顶尖，教育场景适配好', cons: '通用创意一般' },
  { id: 9, name: '秘塔 AI 搜索', company: '秘塔', url: 'https://metaso.cn', region: '国内', category: '搜索', pricing: '免费', stars: 4, positioning: '无广告的 AI 深度搜索', audience: '研究、学习、资料检索', pros: '答案带来源、结构化好、免费无广告', cons: '长对话能力弱于通用助手' },
  { id: 10, name: '夸克', company: '阿里', url: 'https://www.quark.cn', region: '国内', category: '搜索', pricing: '免费', stars: 3, positioning: '带 AI 的浏览器与搜索', audience: '移动端用户、学生', pros: '搜索 + AI 问答 + 网盘一体，移动端体验好', cons: 'AI 深度一般' },
  { id: 11, name: '即梦 AI', company: '字节跳动', url: 'https://jimeng.jianying.com', region: '国内', category: '绘画', pricing: '半免费', stars: 5, positioning: '国产顶流 AI 绘画 / 视频', audience: '新媒体、设计、短视频创作者', pros: '中文语义强、出图质感高、图生视频方便', cons: '高级功能需付费，海外生态弱' },
  { id: 12, name: '可灵 AI', company: '快手', url: 'https://klingai.kuaishou.com', region: '国内', category: '视频', pricing: '半免费', stars: 5, positioning: '国产第一梯队 AI 视频生成', audience: '短视频、广告、影视创作者', pros: '运镜与一致性表现优秀，免费额度可玩', cons: '长视频稳定性一般' },
  { id: 13, name: '通义万相', company: '阿里', url: 'https://tongyi.aliyun.com/wanxiang', region: '国内', category: '绘画', pricing: '半免费', stars: 4, positioning: '中文友好的 AI 绘画工具', audience: '电商、设计、创作者', pros: '中文提示理解好，风格多', cons: '创意上限略逊头部' },
  { id: 14, name: '文心一格', company: '百度', url: 'https://yige.baidu.com', region: '国内', category: '绘画', pricing: '半免费', stars: 3, positioning: '商用合规的 AI 绘画', audience: '国内创作者、电商设计', pros: '版权合规、中文适配、上手简单', cons: '生成上限一般' },
  { id: 15, name: 'Vidu', company: '生数科技', url: 'https://www.vidu.cn', region: '国内', category: '视频', pricing: '半免费', stars: 4, positioning: '国产 AI 视频生成新锐', audience: '短视频、内容机构', pros: '生成质量高、参考一致性不错', cons: '知名度较低，免费额度少' },
  { id: 16, name: '剪映', company: '字节跳动', url: 'https://www.capcut.cn', region: '国内', category: '视频', pricing: '免费', stars: 4, positioning: '全场景 AI 视频剪辑', audience: '自媒体、短视频、普通用户', pros: '剪辑顶流、AI 功能全、核心免费', cons: '专业影视级能力不足' },
  { id: 17, name: '腾讯智影', company: '腾讯', url: 'https://zenvideo.qq.com', region: '国内', category: '视频', pricing: '半免费', stars: 3, positioning: 'AI 数字人与视频剪辑', audience: '企业、新媒体、教育', pros: '数字人、配音、剪辑一体', cons: '专业能力一般，生态偏封闭' },
  { id: 18, name: '海绵音乐', company: '字节跳动', url: 'https://www.haimian.com', region: '国内', category: '音频', pricing: '免费', stars: 3, positioning: 'AI 音乐生成（国产）', audience: '音乐爱好者、短视频创作者', pros: '中文歌生成体验好、免费', cons: '风格与时长有限' },
  { id: 19, name: '网易天音', company: '网易', url: 'https://tianyin.163.com', region: '国内', category: '音频', pricing: '半免费', stars: 3, positioning: 'AI 音乐创作工具', audience: '音乐创作者、内容创作者', pros: '本土化好、操作简单', cons: '生成质量略逊国际头部' },
  { id: 20, name: '讯飞配音', company: '科大讯飞', url: 'https://peiyin.xunfei.cn', region: '国内', category: '音频', pricing: '半免费', stars: 3, positioning: '中文 AI 配音合成', audience: '短视频、有声内容、企业', pros: '中文音色多、合成自然', cons: '高级音色付费' },
  { id: 21, name: 'Trae', company: '字节跳动', url: 'https://www.trae.ai', region: '国内', category: '编程', pricing: '免费', stars: 5, positioning: '本土化 AI 原生 IDE', audience: '开发者、编程学习者', pros: '中文适配好、多模型集成、核心免费', cons: '插件生态早期，大项目稳定性待提升' },
  { id: 22, name: '通义灵码', company: '阿里', url: 'https://tongyi.aliyun.com/lingma', region: '国内', category: '编程', pricing: '免费', stars: 4, positioning: '国产 AI 编程助手', audience: '开发者、企业研发', pros: 'IDE 插件好用、中文注释友好、有免费版', cons: '复杂重构能力弱于头部 Agent' },
  { id: 23, name: '文心快码', company: '百度', url: 'https://comate.baidu.com', region: '国内', category: '编程', pricing: '半免费', stars: 3, positioning: '国产 AI 编码助手', audience: '开发者、企业', pros: '中文场景与文档生成不错', cons: '生态与能力一般' },
  { id: 24, name: 'WPS AI', company: '金山办公', url: 'https://www.wps.cn', region: '国内', category: '办公', pricing: '半免费', stars: 4, positioning: '本土办公套件 AI', audience: '办公、学生、政企', pros: '深度集成 WPS，文档/表格/PPT 全能，核心免费', cons: '高级功能付费' },
  { id: 25, name: '通义听悟', company: '阿里', url: 'https://tingwu.aliyun.com', region: '国内', category: '办公', pricing: '半免费', stars: 3, positioning: '会议录音转写与纪要', audience: '会议、访谈、学生', pros: '实时转写、自动纪要、多语言', cons: '高级功能付费' },
  { id: 26, name: '幕布', company: '幕布', url: 'https://mubu.com', region: '国内', category: '办公', pricing: '半免费', stars: 3, positioning: '大纲笔记 + AI 思维导图', audience: '学生、知识管理、办公', pros: '大纲转思维导图、结构清晰', cons: 'AI 能力有限，高级功能付费' },
  { id: 27, name: '美图设计室', company: '美图', url: 'https://www.meitu.com', region: '国内', category: '绘画', pricing: '半免费', stars: 3, positioning: '电商场景 AI 设计', audience: '电商、中小企业、新媒体', pros: '海报/商品图生成、模板丰富', cons: '创意上限一般' },
  { id: 28, name: '飞书', company: '飞书', url: 'https://www.feishu.cn', region: '国内', category: '办公', pricing: '半免费', stars: 3, positioning: '协同办公 + AI 助手', audience: '企业团队、项目管理', pros: '文档/表格/会议 AI 一体，协同强', cons: '个人使用门槛，高级功能付费' },

  // ===== 海外 =====
  { id: 29, name: 'ChatGPT', company: 'OpenAI', url: 'https://chatgpt.com', region: '海外', category: '对话', pricing: '半免费', stars: 5, positioning: '通用多模态对话标杆', audience: '全场景用户、开发者、办公', pros: '推理顶尖、多模态全面、生态最完善', cons: '高级模型需订阅，国内访问受限' },
  { id: 30, name: 'Claude', company: 'Anthropic', url: 'https://claude.ai', region: '海外', category: '对话', pricing: '半免费', stars: 5, positioning: '长文本与写作见长的对话模型', audience: '创作者、企业、长文档处理', pros: '超长上下文、写作与代码强、安全合规好', cons: '国内访问门槛高' },
  { id: 31, name: 'Gemini', company: 'Google', url: 'https://gemini.google.com', region: '海外', category: '对话', pricing: '半免费', stars: 5, positioning: '原生多模态大模型', audience: '开发者、科研、办公', pros: '百万级上下文、多模态与推理强、集成 Google 生态', cons: '中文偶有偏差，国内访问受限' },
  { id: 32, name: 'Grok', company: 'xAI', url: 'https://grok.com', region: '海外', category: '对话', pricing: '半免费', stars: 4, positioning: '实时联网的对话模型', audience: '热点资讯、科技爱好者', pros: '实时联网强、风格直接', cons: '中文优化不足，国内受限' },
  { id: 33, name: 'Copilot', company: 'Microsoft', url: 'https://copilot.microsoft.com', region: '海外', category: '对话', pricing: '免费', stars: 4, positioning: '微软生态 AI 助手', audience: '办公、Windows 用户', pros: '免费、集成 Windows/Edge/Office，联网搜索好', cons: '深度能力弱于旗舰模型' },
  { id: 34, name: 'Perplexity', company: 'Perplexity', url: 'https://www.perplexity.ai', region: '海外', category: '搜索', pricing: '半免费', stars: 5, positioning: 'AI 搜索标杆', audience: '研究、学习、资讯检索', pros: '答案带来源、实时联网、体验极佳', cons: '国内访问受限' },
  { id: 35, name: 'NotebookLM', company: 'Google', url: 'https://notebooklm.google.com', region: '海外', category: '办公', pricing: '免费', stars: 4, positioning: '文档知识库 + 音频概览', audience: '学生、研究、知识整理', pros: '上传资料做问答、一键生成播客，免费', cons: '中文资料支持一般' },
  { id: 36, name: 'Midjourney', company: 'Midjourney', url: 'https://www.midjourney.com', region: '海外', category: '绘画', pricing: '收费', stars: 5, positioning: '商用级 AI 绘画天花板', audience: '设计师、创意、广告', pros: '质感与创意上限顶尖，新增视频', cons: '无免费额度，上手有门槛' },
  { id: 37, name: 'Stable Diffusion', company: 'Stability AI', url: 'https://stability.ai', region: '海外', category: '绘画', pricing: '免费', stars: 4, positioning: '开源可控的 AI 绘画', audience: '开发者、绘画爱好者', pros: '开源、插件生态庞大、可控性拉满', cons: '需硬件与门槛，商用版权自查' },
  { id: 38, name: 'Ideogram', company: 'Ideogram', url: 'https://ideogram.ai', region: '海外', category: '绘画', pricing: '半免费', stars: 4, positioning: '擅长文字排版的 AI 绘画', audience: '品牌、海报、电商设计', pros: '画面中文字生成准，海报场景强', cons: '国内受限，免费额度少' },
  { id: 39, name: 'Leonardo.AI', company: 'Leonardo', url: 'https://leonardo.ai', region: '海外', category: '绘画', pricing: '半免费', stars: 4, positioning: '游戏影视级 AI 资产', audience: '游戏、影视、3D 创作者', pros: '模型丰富、可控性强', cons: '免费额度有限，商用有约束' },
  { id: 40, name: 'Sora', company: 'OpenAI', url: 'https://sora.com', region: '海外', category: '视频', pricing: '收费', stars: 5, positioning: '物理仿真型文生视频', audience: '影视、广告、专业创作', pros: '物理与场景理解顶尖，质量极高', cons: '付费，国内受限，成本高' },
  { id: 41, name: 'Veo', company: 'Google DeepMind', url: 'https://deepmind.google/models/veo', region: '海外', category: '视频', pricing: '收费', stars: 5, positioning: '顶尖文生视频模型', audience: '影视、广告、内容机构', pros: '4K 级、连贯性顶尖、原生音频', cons: '付费，国内不可访问' },
  { id: 42, name: 'Runway', company: 'Runway', url: 'https://runwayml.com', region: '海外', category: '视频', pricing: '半免费', stars: 4, positioning: '影视级 AI 视频创作', audience: '影视后期、广告、创意', pros: '生成 + 编辑一体，专业工作流', cons: '付费门槛高，国内受限' },
  { id: 43, name: 'Pika', company: 'Pika Labs', url: 'https://pika.art', region: '海外', category: '视频', pricing: '半免费', stars: 4, positioning: '风格化 AI 视频生成', audience: '短视频、创意、广告', pros: '风格化效果好、上手简单', cons: '长视频稳定性一般' },
  { id: 44, name: 'Luma Dream Machine', company: 'Luma AI', url: 'https://lumalabs.ai/dream-machine', region: '海外', category: '视频', pricing: '半免费', stars: 4, positioning: '高质量 AI 视频生成', audience: '短视频、创意、AI 爱好者', pros: '质量高、支持图生视频与运镜', cons: '免费额度少，国内受限' },
  { id: 45, name: 'Suno', company: 'Suno', url: 'https://suno.com', region: '海外', category: '音频', pricing: '半免费', stars: 5, positioning: 'AI 音乐生成顶流', audience: '音乐人、内容创作者', pros: '整曲生成质量高、风格全', cons: '国内受限，商用版权需注意' },
  { id: 46, name: 'Udio', company: 'Udio', url: 'https://www.udio.com', region: '海外', category: '音频', pricing: '半免费', stars: 4, positioning: 'AI 音乐生成', audience: '音乐人、创作者', pros: '细节还原高、风格丰富', cons: '国内受限，免费额度少' },
  { id: 47, name: 'ElevenLabs', company: 'ElevenLabs', url: 'https://elevenlabs.io', region: '海外', category: '音频', pricing: '半免费', stars: 4, positioning: 'AI 语音合成与克隆顶流', audience: '配音、内容创作、企业', pros: '多语言、情感与克隆能力顶尖', cons: '国内受限，付费门槛高' },
  { id: 48, name: 'GitHub Copilot', company: 'GitHub', url: 'https://github.com/features/copilot', region: '海外', category: '编程', pricing: '半免费', stars: 5, positioning: 'AI 编程辅助标杆', audience: '开发者、企业研发', pros: '补全/对话/审查全链路，生态最完善', cons: '核心需订阅，国内不稳定' },
  { id: 49, name: 'Cursor', company: 'Cursor', url: 'https://cursor.com', region: '海外', category: '编程', pricing: '半免费', stars: 5, positioning: 'AI 原生代码编辑器', audience: '开发者、编程学习者', pros: '对话式编程、重构强、上手快', cons: '大项目稳定性一般，付费不低' },
  { id: 50, name: 'Claude Code', company: 'Anthropic', url: 'https://www.anthropic.com/claude-code', region: '海外', category: '编程', pricing: '收费', stars: 5, positioning: '终端原生 AI 编程 Agent', audience: '专业开发者、复杂工程', pros: '架构设计与大规模重构强，工程级首选', cons: '需付费，国内受限，门槛高' },
  { id: 51, name: 'Windsurf', company: 'Windsurf', url: 'https://windsurf.com', region: '海外', category: '编程', pricing: '半免费', stars: 4, positioning: 'AI 原生代码编辑器', audience: '开发者、海外团队', pros: '长代码处理与 Agent 能力强', cons: '国内知名度低，受限' },
  { id: 52, name: 'v0', company: 'Vercel', url: 'https://v0.dev', region: '海外', category: '编程', pricing: '半免费', stars: 4, positioning: '对话生成前端 UI', audience: '前端、产品、独立开发者', pros: '一句话生成 React/UI，直接部署', cons: '复杂项目需二次开发' },
  { id: 53, name: 'Bolt.new', company: 'StackBlitz', url: 'https://bolt.new', region: '海外', category: '编程', pricing: '半免费', stars: 4, positioning: '浏览器里的全栈 AI 开发', audience: '独立开发者、快速原型', pros: '在线生成并运行全栈应用', cons: '深度与稳定性一般' },
  { id: 54, name: 'Notion AI', company: 'Notion', url: 'https://www.notion.so', region: '海外', category: '办公', pricing: '半免费', stars: 4, positioning: '笔记与知识库 AI', audience: '内容创作、项目管理、学生', pros: '笔记/数据库/写作全场景 AI', cons: '国内不稳定，付费门槛' },
  { id: 55, name: 'Gamma', company: 'Gamma', url: 'https://gamma.app', region: '海外', category: '办公', pricing: '半免费', stars: 4, positioning: 'AI 一键生成 PPT/文档', audience: '汇报、教学、办公', pros: '输入主题即出精美幻灯片', cons: '国内受限，免费额度少' },
  { id: 56, name: 'Canva', company: 'Canva', url: 'https://www.canva.com', region: '海外', category: '绘画', pricing: '半免费', stars: 4, positioning: '小白友好的 AI 设计', audience: '运营、中小企业、学生', pros: '模板海量、AI 设计功能全', cons: '专业上限不足' },
];

const CATEGORIES: { name: string; icon: LucideIcon }[] = [
  { name: '对话', icon: Bot },
  { name: '绘画', icon: Palette },
  { name: '视频', icon: Clapperboard },
  { name: '音频', icon: Music },
  { name: '编程', icon: Code2 },
  { name: '办公', icon: Briefcase },
  { name: '搜索', icon: Search },
];

const PRICING_STYLE: Record<string, string> = {
  免费: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
  半免费: 'bg-amber-500/15 text-amber-300 border-amber-400/30',
  收费: 'bg-rose-500/15 text-rose-300 border-rose-400/30',
};

function Stars({ n }: { n: number }) {
  return (
    <div className="flex shrink-0 gap-0.5" title={`推荐度 ${n}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={12}
          className={i <= n ? 'fill-amber-400 text-amber-400' : 'text-white/20'}
        />
      ))}
    </div>
  );
}

interface AIToolsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AITools({ isOpen, onClose }: AIToolsProps) {
  const [region, setRegion] = useState<'全部' | Region>('全部');
  const [category, setCategory] = useState<string>('全部');
  const [pricing, setPricing] = useState<'全部' | Pricing>('全部');
  const [query, setQuery] = useState('');

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TOOLS.filter(
      (t) =>
        (region === '全部' || t.region === region) &&
        (category === '全部' || t.category === category) &&
        (pricing === '全部' || t.pricing === pricing) &&
        (q === '' ||
          [t.name, t.company, t.category, t.positioning].some((s) => s.toLowerCase().includes(q)))
    ).sort((a, b) => b.stars - a.stars);
  }, [region, category, pricing, query]);

  if (!isOpen) return null;

  const segBtn = (active: boolean) =>
    `px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
      active
        ? 'bg-white text-slate-900 shadow'
        : 'text-white/70 hover:text-white hover:bg-white/10'
    }`;

  const chipBtn = (active: boolean) =>
    `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
      active
        ? 'bg-sky-500/20 text-sky-200 border-sky-400/50'
        : 'bg-white/[0.04] text-white/60 border-white/10 hover:bg-white/10 hover:text-white/85'
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 shadow-2xl backdrop-blur-xl">
        {/* 标题栏 */}
        <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
          <div>
            <h3 className="flex items-center gap-2 text-xl font-bold text-white">
              <Sparkles size={18} className="text-sky-400" />
              AI 工具库
            </h3>
            <p className="mt-1 text-xs text-white/50">
              精选 {TOOLS.length} 个主流 AI 工具 · 先分国内/海外，再按用途 · 按推荐度排序
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

        {/* 筛选区 */}
        <div className="space-y-3 border-b border-white/10 p-4">
          {/* 地区 + 搜索 */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] p-1">
              {(['全部', '国内', '海外'] as const).map((r) => (
                <button key={r} onClick={() => setRegion(r)} className={segBtn(region === r)}>
                  {r === '国内' ? <MapPin size={13} className="mr-1 inline" /> : r === '海外' ? <Globe2 size={13} className="mr-1 inline" /> : null}
                  {r}
                </button>
              ))}
            </div>
            <div className="relative min-w-[180px] flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索工具名 / 公司 / 用途…"
                className="w-full rounded-full border border-white/10 bg-white/[0.04] py-2 pl-9 pr-4 text-sm text-white placeholder-white/40 outline-none focus:border-sky-400/50"
              />
            </div>
          </div>

          {/* 功能分类 */}
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => setCategory('全部')} className={chipBtn(category === '全部')}>
              <Sparkles size={12} /> 全部
            </button>
            {CATEGORIES.map((c) => (
              <button key={c.name} onClick={() => setCategory(c.name)} className={chipBtn(category === c.name)}>
                <c.icon size={12} /> {c.name}
              </button>
            ))}
          </div>

          {/* 费用 */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(['全部', '免费', '半免费', '收费'] as const).map((p) => (
              <button key={p} onClick={() => setPricing(p)} className={chipBtn(pricing === p)}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* 列表 */}
        <div className="flex-1 overflow-y-auto p-4">
          {list.length === 0 ? (
            <div className="py-16 text-center">
              <Search size={40} className="mx-auto mb-3 text-white/20" />
              <p className="text-sm text-white/50">没有匹配的工具，换个条件试试</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {list.map((t) => (
                <div
                  key={t.id}
                  className="flex flex-col rounded-xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-white/20 hover:bg-white/[0.07]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h4 className="truncate text-base font-semibold text-white">{t.name}</h4>
                        <span className="rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-white/50">
                          {t.region}
                        </span>
                        <span className={`rounded-full border px-1.5 py-0.5 text-[10px] ${PRICING_STYLE[t.pricing]}`}>
                          {t.pricing}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-white/45">
                        {t.company} · {t.category}
                      </p>
                    </div>
                    <Stars n={t.stars} />
                  </div>

                  <p className="mt-2 text-sm text-sky-300">{t.positioning}</p>
                  <p className="mt-1 text-xs text-white/60">适用：{t.audience}</p>

                  <div className="mt-2 space-y-1 text-[11px] leading-relaxed">
                    <p className="text-emerald-400/80">＋ {t.pros}</p>
                    <p className="text-rose-400/80">－ {t.cons}</p>
                  </div>

                  <a
                    href={t.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/15 py-2 text-xs font-medium text-sky-200 transition hover:bg-sky-500/25"
                  >
                    <ExternalLink size={13} /> 访问官网
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部统计 */}
        <div className="border-t border-white/10 p-3 text-center">
          <p className="text-xs text-white/50">
            共 <span className="font-semibold text-white">{list.length}</span> 个
            {region !== '全部' && ` · ${region}`}
            {category !== '全部' && ` · ${category}`}
            {pricing !== '全部' && ` · ${pricing}`}
          </p>
        </div>
      </div>
    </div>
  );
}
