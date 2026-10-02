'use client';

import React from 'react';
import { useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import UpdateTimeline, { type Release } from '@/components/UpdateTimeline';
import { applyLiquidGlass, clearLiquidGlass, supportsLiquidGlass } from '@/components/home/liquidGlass';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import HolidayCalendar from '@/components/HolidayCalendar';
import MusicPlayer from '@/components/MusicPlayer';
import AITools from '@/components/AITools';
import GPUTierChart from '@/components/GPUTierChart';
import ScreenRecorder from '@/components/ScreenRecorder';
import SecuritySoftware from '@/components/SecuritySoftware';
import InputMethod from '@/components/InputMethod';
import OfficeSoftware from '@/components/OfficeSoftware';
import ScreenshotTool from '@/components/ScreenshotTool';
import CompressionTool from '@/components/CompressionTool';
import VideoPlayer from '@/components/VideoPlayer';
import SystemCleaner from '@/components/SystemCleaner';
import DesktopBeautify from '@/components/DesktopBeautify';
import HotBoard from '@/components/HotBoard';
import SnakeGame from '@/components/SnakeGame';
import PomodoroTimer from '@/components/PomodoroTimer';
import RandomDecision from '@/components/RandomDecision';
import PersonalProfile from '@/components/PersonalProfile';
import Guestbook from '@/components/Guestbook';

// 定义链接数据类型
interface LinkItem {
  id: number;
  title: string;
  icon: string;
  url: string;
}

// 定义社交媒体链接类型
interface SocialItem {
  id: number;
  icon: string;
  url: string;
  name: string;
}

// 定义名言数据类型
interface Quote {
  text: string;
  author: string;
}

/** 功能按钮的选择器，供液态玻璃批量应用 */
const TILE_SELECTOR = '.feature-button';

/** 背景遮罩（保持原样；液态玻璃只作用于按钮，不动背景） */
const OVERLAY_DARK = 'bg-gradient-to-b from-black/50 via-black/40 to-black/70';

/**
 * 主页的版本历史（越靠前越新）。
 * 「液态玻璃效果」做成链接，点击弹出使用条件说明 —— 所以需要注入回调，
 * 不能写成模块级常量。
 */
const buildHomeReleases = (onOpenGlassInfo: () => void): Release[] => [
  {
    version: 'V4.1',
    date: '2026.10.3',
    latest: true,
    items: [
      <>
        新增
        <button
          type="button"
          onClick={onOpenGlassInfo}
          className="text-blue-400 underline underline-offset-2 transition-colors hover:text-blue-300"
        >
          液态玻璃效果
        </button>
        ：功能按钮会真实折射背后的画面（不是简单模糊），边缘有一圈可见的弯曲，并带上缘镜面高光
      </>,
      '右下角新增水滴按钮，可随时开关液态玻璃效果，选择会被记住',
    ],
  },
  { version: 'v4.0', date: '2026.7.9', items: ['AI 工具等信息更新', '留言板功能完善（Beta 测试版）', '集成进一个网页'] },
  { version: 'v3.4', date: '2026.4.1', items: ['新增番茄钟功能', '新增随机决策器功能', '新增留言板功能（Beta 测试版）', '修复了一些已知问题'] },
  { version: 'v3.3', date: '2026.3.23', items: ['新增了彩蛋 2 —— 贪吃蛇，不过怎么开启请自行发掘', '新增了今日热榜功能'] },
  { version: 'v3.2', date: '2026.3.21', items: ['实用工具换新', '修复了一些已知问题'] },
  { version: 'v3.1', date: '2026.3.19', items: ['增加天梯图', '新增了一个彩蛋，等待你发现哦~'] },
  { version: 'v3.0', date: '2026.3.14', items: ['AI 工具焕新', '名人名言优化', '修复了一些已知问题'] },
  { version: 'v2.4', date: '2026.1.29', items: ['增加了假期日历', '修复了一些已知问题'] },
  { version: 'v2.2', date: '2025.8.27', items: ['新增了一些内容', '修复了一些已知问题'] },
  { version: 'v2.1', date: '2025.8.11', items: ['AI 功能 UI 界面大调整', '页面更加美观', '修复了一些已知问题，提升体验感'] },
  { version: 'v2.0', date: '2025.8.6', items: ['新增传送门等功能', '我的搜索页也上线啦，新增跳转搜索页按钮', '修复了一些已知问题'] },
  { version: 'v1.0', date: '2025.8.4', items: ['网站上线啦'] },
];

export default function HomePage() {
  // 状态管理
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentDate, setCurrentDate] = useState('');
  // 学习模态框状态
  const [isStudyModalOpen, setIsStudyModalOpen] = useState(false);




  const [greeting, setGreeting] = useState('');
  

 


  // 名言状态
  const [currentQuote, setCurrentQuote] = useState<Quote>({
    text: "生活就像海洋，只有意志坚强的人才能到达彼岸。",
    author: "马克思"
  });
  // 名言淡入淡出状态
  const [quoteVisible, setQuoteVisible] = useState(true);
  
  // 电影模态框状态
  const [isMovieModalOpen, setIsMovieModalOpen] = useState(false);
  
  // 时间胶囊模态框状态
    const [isTimeCapsuleModalOpen, setIsTimeCapsuleModalOpen] = useState(false);
   // AI工具模态框状态
   const [isAIToolsModalOpen, setIsAIToolsModalOpen] = useState(false);
   // 其他功能模态框状态
   const [isOtherModalOpen, setIsOtherModalOpen] = useState(false);
  // 实用工具模态框状态
  const [isUtilityModalOpen, setIsUtilityModalOpen] = useState(false);
   // 意见反馈弹窗状态
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  // 传送门警告弹窗状态
  const [isPortalWarningOpen, setIsPortalWarningOpen] = useState(false);
  // 更新日志弹窗状态
  const [isUpdateLogOpen, setIsUpdateLogOpen] = useState(false);
  // 传送门倒计时
  const [portalCountdown, setPortalCountdown] = useState(10);
  // 假期日历模态框状态
  const [isHolidayCalendarOpen, setIsHolidayCalendarOpen] = useState(false);
  // 显卡天梯图模态框状态
  const [isGPUTierChartOpen, setIsGPUTierChartOpen] = useState(false);
  // 今日热榜模态框状态
  const [isHotBoardOpen, setIsHotBoardOpen] = useState(false);
  // 贪吃蛇游戏状态
  const [isSnakeGameOpen, setIsSnakeGameOpen] = useState(false);
  // 贪吃蛇彩蛋提示
  const [showSnakeHint, setShowSnakeHint] = useState(false);
  // 屏幕录制模态框状态
  const [isScreenRecorderOpen, setIsScreenRecorderOpen] = useState(false);
  // 安全软件模态框状态
  const [isSecuritySoftwareOpen, setIsSecuritySoftwareOpen] = useState(false);
  // 输入法模态框状态
  const [isInputMethodOpen, setIsInputMethodOpen] = useState(false);
  // 办公软件模态框状态
  const [isOfficeSoftwareOpen, setIsOfficeSoftwareOpen] = useState(false);
  // 其他工具模态框状态
  const [isOtherToolsModalOpen, setIsOtherToolsModalOpen] = useState(false);
  // 截图工具模态框状态
  const [isScreenshotToolOpen, setIsScreenshotToolOpen] = useState(false);
  // 压缩解压工具模态框状态
  const [isCompressionToolOpen, setIsCompressionToolOpen] = useState(false);
  // 功能按钮的液态玻璃开关（默认开）
  const [liquidGlass, setLiquidGlass] = useState(true);
  // 浏览器能力检测只能在客户端做，否则 SSR/水合不一致
  const [glassSupported, setGlassSupported] = useState(false);

  useEffect(() => {
    setGlassSupported(supportsLiquidGlass());
    try {
      if (localStorage.getItem('homeLiquidGlass') === '0') setLiquidGlass(false);
    } catch {
      /* 忽略 */
    }
  }, []);

  // 液态玻璃说明弹窗（水滴按钮与更新记录里的链接都会打开它）
  const [showGlassInfo, setShowGlassInfo] = useState(false);
  const homeReleases = useMemo(() => buildHomeReleases(() => setShowGlassInfo(true)), []);

  const toggleLiquidGlass = () => {
    setLiquidGlass((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('homeLiquidGlass', next ? '1' : '0');
      } catch {
        /* 忽略 */
      }
      return next;
    });
  };

  // 本地视频播放器模态框状态
  const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState(false);
  // 系统清理优化工具模态框状态
  const [isSystemCleanerOpen, setIsSystemCleanerOpen] = useState(false);
  // 桌面美化工具模态框状态
  const [isDesktopBeautifyOpen, setIsDesktopBeautifyOpen] = useState(false);
  // 番茄钟模态框状态
  const [isPomodoroTimerOpen, setIsPomodoroTimerOpen] = useState(false);
  // 随机决策器模态框状态
  const [isRandomDecisionOpen, setIsRandomDecisionOpen] = useState(false);
  // 个人展示页状态
  const [isPersonalProfileOpen, setIsPersonalProfileOpen] = useState(false);
  // 留言板模态框状态
  const [isGuestbookOpen, setIsGuestbookOpen] = useState(false);
  // 彩蛋一状态
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  // 版本号点击计数（彩蛋一触发）
  const versionClickCount = useRef(0);
  const versionClickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 彩蛋一：连续点击左下角版本号5次触发
  const handleVersionClick = () => {
    versionClickCount.current += 1;
    if (versionClickTimer.current) clearTimeout(versionClickTimer.current);
    versionClickTimer.current = setTimeout(() => {
      versionClickCount.current = 0;
    }, 1500);
    if (versionClickCount.current >= 5) {
      versionClickCount.current = 0;
      setShowEasterEgg(true);
    }
  };
  
  // 检测是否有任何模态框打开（用于隐藏底部元素）
  const isAnyModalOpen = isStudyModalOpen || isMovieModalOpen || isTimeCapsuleModalOpen || 
    isAIToolsModalOpen || isOtherModalOpen || isUtilityModalOpen || isFeedbackModalOpen || 
    isPortalWarningOpen || isUpdateLogOpen || isHolidayCalendarOpen || isGPUTierChartOpen || isHotBoardOpen ||
    isScreenRecorderOpen || isSecuritySoftwareOpen || isInputMethodOpen || isOfficeSoftwareOpen || isOtherToolsModalOpen ||
    isScreenshotToolOpen || isCompressionToolOpen || isVideoPlayerOpen || isSystemCleanerOpen || isDesktopBeautifyOpen || isSnakeGameOpen || isPomodoroTimerOpen || isRandomDecisionOpen || isGuestbookOpen || showEasterEgg;

  // 监听方向键打开贪吃蛇游戏
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果游戏已经打开或提示正在显示，不处理（让游戏组件自己处理方向键）
      if (isSnakeGameOpen || showSnakeHint) return;
      
      // 检测方向键，先显示提示再启动游戏
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        setShowSnakeHint(true);
        // 1.5秒后关闭提示并打开游戏
        setTimeout(() => {
          setShowSnakeHint(false);
          setIsSnakeGameOpen(true);
        }, 1500);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSnakeGameOpen, showSnakeHint]);
  

  
  // 时间进度数据
  const [timeProgress, setTimeProgress] = useState({
    daily: 0,
    weekly: 0,
    monthly: 0,
    yearly: 0,
  });

  // 网站运行时间
   // 计算网站运行天数（从2025年8月4日开始）
   const calculateSiteRuntime = () => {
     const startDate = new Date('2025-08-04');
     const now = new Date();
     const diffTime = Math.abs(now.getTime() - startDate.getTime());
     const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
     return `${diffDays}天`;
   };
   
   const siteRuntime = calculateSiteRuntime();



  // 本地备份名言库 - 500条精选名言
  const backupQuotes: Quote[] = [
    // 中国古代名言
    { text: "天行健，君子以自强不息。", author: "《周易》" },
    { text: "地势坤，君子以厚德载物。", author: "《周易》" },
    { text: "学而时习之，不亦说乎？", author: "孔子" },
    { text: "三人行，必有我师焉。", author: "孔子" },
    { text: "知之者不如好之者，好之者不如乐之者。", author: "孔子" },
    { text: "己所不欲，勿施于人。", author: "孔子" },
    { text: "温故而知新，可以为师矣。", author: "孔子" },
    { text: "学而不思则罔，思而不学则殆。", author: "孔子" },
    { text: "知者乐水，仁者乐山。", author: "孔子" },
    { text: "君子坦荡荡，小人长戚戚。", author: "孔子" },
    { text: "不患人之不己知，患不知人也。", author: "孔子" },
    { text: "逝者如斯夫，不舍昼夜。", author: "孔子" },
    { text: "道不同，不相为谋。", author: "孔子" },
    { text: "知者不惑，仁者不忧，勇者不惧。", author: "孔子" },
    { text: "工欲善其事，必先利其器。", author: "孔子" },
    { text: "言必信，行必果。", author: "孔子" },
    { text: "有朋自远方来，不亦乐乎？", author: "孔子" },
    { text: "德不孤，必有邻。", author: "孔子" },
    { text: "人无远虑，必有近忧。", author: "孔子" },
    { text: "吾日三省吾身。", author: "曾子" },
    { text: "修身齐家治国平天下。", author: "《大学》" },
    { text: "博学之，审问之，慎思之，明辨之，笃行之。", author: "《中庸》" },
    { text: "天将降大任于斯人也，必先苦其心志。", author: "孟子" },
    { text: "生于忧患，死于安乐。", author: "孟子" },
    { text: "得道者多助，失道者寡助。", author: "孟子" },
    { text: "老吾老以及人之老，幼吾幼以及人之幼。", author: "孟子" },
    { text: "鱼与熊掌不可兼得。", author: "孟子" },
    { text: "民为贵，社稷次之，君为轻。", author: "孟子" },
    { text: "穷则独善其身，达则兼济天下。", author: "孟子" },
    { text: "天时不如地利，地利不如人和。", author: "孟子" },
    { text: "道可道，非常道。名可名，非常名。", author: "老子" },
    { text: "上善若水，水善利万物而不争。", author: "老子" },
    { text: "千里之行，始于足下。", author: "老子" },
    { text: "知人者智，自知者明。", author: "老子" },
    { text: "大器晚成，大音希声。", author: "老子" },
    { text: "祸兮福之所倚，福兮祸之所伏。", author: "老子" },
    { text: "合抱之木，生于毫末。", author: "老子" },
    { text: "天网恢恢，疏而不漏。", author: "老子" },
    { text: "柔弱胜刚强。", author: "老子" },
    { text: "治大国，若烹小鲜。", author: "老子" },
    { text: "吾生也有涯，而知也无涯。", author: "庄子" },
    { text: "庖丁解牛，游刃有余。", author: "庄子" },
    { text: "子非鱼，安知鱼之乐？", author: "庄子" },
    { text: "相濡以沫，不如相忘于江湖。", author: "庄子" },
    { text: "独与天地精神往来。", author: "庄子" },
    { text: "天地与我并生，万物与我为一。", author: "庄子" },
    { text: "朝菌不知晦朔，蟪蛄不知春秋。", author: "庄子" },
    { text: "君子之交淡如水，小人之交甘若醴。", author: "庄子" },
    { text: "路漫漫其修远兮，吾将上下而求索。", author: "屈原" },
    { text: "长太息以掩涕兮，哀民生之多艰。", author: "屈原" },
    { text: "亦余心之所善兮，虽九死其犹未悔。", author: "屈原" },
    { text: "举世皆浊我独清，众人皆醉我独醒。", author: "屈原" },
    { text: "不积跬步，无以至千里。", author: "荀子" },
    { text: "锲而不舍，金石可镂。", author: "荀子" },
    { text: "青，取之于蓝而青于蓝。", author: "荀子" },
    { text: "蓬生麻中，不扶而直。", author: "荀子" },
    { text: "水能载舟，亦能覆舟。", author: "荀子" },
    { text: "天行有常，不为尧存，不为桀亡。", author: "荀子" },
    { text: "知己知彼，百战不殆。", author: "孙子" },
    { text: "兵者，国之大事，死生之地，存亡之道。", author: "孙子" },
    { text: "不战而屈人之兵，善之善者也。", author: "孙子" },
    { text: "兵贵神速。", author: "孙子" },
    { text: "攻其无备，出其不意。", author: "孙子" },
    { text: "韩信用兵，多多益善。", author: "韩信" },
    { text: "燕雀安知鸿鹄之志哉。", author: "陈涉" },
    { text: "王侯将相宁有种乎？", author: "陈涉" },
    { text: "风萧萧兮易水寒，壮士一去兮不复还。", author: "荆轲" },
    { text: "人固有一死，或重于泰山，或轻于鸿毛。", author: "司马迁" },
    { text: "桃李不言，下自成蹊。", author: "司马迁" },
    { text: "智者千虑，必有一失；愚者千虑，必有一得。", author: "司马迁" },
    { text: "运筹帷幄之中，决胜千里之外。", author: "司马迁" },
    { text: "项庄舞剑，意在沛公。", author: "司马迁" },
    { text: "力拔山兮气盖世。", author: "项羽" },
    { text: "大风起兮云飞扬，威加海内兮归故乡。", author: "刘邦" },
    { text: "匈奴未灭，何以家为？", author: "霍去病" },
    { text: "老骥伏枥，志在千里。", author: "曹操" },
    { text: "烈士暮年，壮心不已。", author: "曹操" },
    { text: "对酒当歌，人生几何。", author: "曹操" },
    { text: "何以解忧，唯有杜康。", author: "曹操" },
    { text: "鞠躬尽瘁，死而后已。", author: "诸葛亮" },
    { text: "非淡泊无以明志，非宁静无以致远。", author: "诸葛亮" },
    { text: "静以修身，俭以养德。", author: "诸葛亮" },
    { text: "勿以恶小而为之，勿以善小而不为。", author: "刘备" },
    { text: "士别三日，当刮目相待。", author: "吕蒙" },
    { text: "司马昭之心，路人皆知。", author: "谚语" },
    { text: "采菊东篱下，悠然见南山。", author: "陶渊明" },
    { text: "不为五斗米折腰。", author: "陶渊明" },
    { text: "盛年不重来，一日难再晨。", author: "陶渊明" },
    { text: "问君何能尔，心远地自偏。", author: "陶渊明" },
    { text: "奇文共欣赏，疑义相与析。", author: "陶渊明" },
    { text: "粉身碎骨浑不怕，要留清白在人间。", author: "于谦" },
    { text: "千锤万凿出深山，烈火焚烧若等闲。", author: "于谦" },
    { text: "春风又绿江南岸，明月何时照我还。", author: "王安石" },
    { text: "不畏浮云遮望眼，只缘身在最高层。", author: "王安石" },
    { text: "人生自古谁无死，留取丹心照汗青。", author: "文天祥" },
    { text: "臣心一片磁针石，不指南方不肯休。", author: "文天祥" },
    { text: "海纳百川，有容乃大；壁立千仞，无欲则刚。", author: "林则徐" },
    { text: "苟利国家生死以，岂因祸福避趋之。", author: "林则徐" },
    { text: "先天下之忧而忧，后天下之乐而乐。", author: "范仲淹" },
    { text: "不以物喜，不以己悲。", author: "范仲淹" },
    { text: "居庙堂之高则忧其民，处江湖之远则忧其君。", author: "范仲淹" },
    { text: "醉翁之意不在酒，在乎山水之间也。", author: "欧阳修" },
    { text: "忧劳可以兴国，逸豫可以亡身。", author: "欧阳修" },
    { text: "大江东去，浪淘尽，千古风流人物。", author: "苏轼" },
    { text: "但愿人长久，千里共婵娟。", author: "苏轼" },
    { text: "不识庐山真面目，只缘身在此山中。", author: "苏轼" },
    { text: "人有悲欢离合，月有阴晴圆缺。", author: "苏轼" },
    { text: "竹杖芒鞋轻胜马，谁怕？一蓑烟雨任平生。", author: "苏轼" },
    { text: "回首向来萧瑟处，归去，也无风雨也无晴。", author: "苏轼" },
    { text: "横看成岭侧成峰，远近高低各不同。", author: "苏轼" },
    { text: "欲把西湖比西子，淡妆浓抹总相宜。", author: "苏轼" },
    { text: "会挽雕弓如满月，西北望，射天狼。", author: "苏轼" },
    { text: "古之立大事者，不惟有超世之才，亦必有坚忍不拔之志。", author: "苏轼" },
    { text: "山重水复疑无路，柳暗花明又一村。", author: "陆游" },
    { text: "纸上得来终觉浅，绝知此事要躬行。", author: "陆游" },
    { text: "位卑未敢忘忧国。", author: "陆游" },
    { text: "零落成泥碾作尘，只有香如故。", author: "陆游" },
    { text: "王师北定中原日，家祭无忘告乃翁。", author: "陆游" },
    { text: "小楼一夜听春雨，深巷明朝卖杏花。", author: "陆游" },
    { text: "接天莲叶无穷碧，映日荷花别样红。", author: "杨万里" },
    { text: "小荷才露尖尖角，早有蜻蜓立上头。", author: "杨万里" },
    { text: "问渠那得清如许，为有源头活水来。", author: "朱熹" },
    { text: "等闲识得东风面，万紫千红总是春。", author: "朱熹" },
    { text: "读书破万卷，下笔如有神。", author: "杜甫" },
    { text: "会当凌绝顶，一览众山小。", author: "杜甫" },
    { text: "安得广厦千万间，大庇天下寒士俱欢颜。", author: "杜甫" },
    { text: "好雨知时节，当春乃发生。", author: "杜甫" },
    { text: "出师未捷身先死，长使英雄泪满襟。", author: "杜甫" },
    { text: "朱门酒肉臭，路有冻死骨。", author: "杜甫" },
    { text: "两个黄鹂鸣翠柳，一行白鹭上青天。", author: "杜甫" },
    { text: "星垂平野阔，月涌大江流。", author: "杜甫" },
    { text: "烽火连三月，家书抵万金。", author: "杜甫" },
    { text: "感时花溅泪，恨别鸟惊心。", author: "杜甫" },
    { text: "露从今夜白，月是故乡明。", author: "杜甫" },
    { text: "笔落惊风雨，诗成泣鬼神。", author: "杜甫" },
    { text: "为人性僻耽佳句，语不惊人死不休。", author: "杜甫" },
    { text: "此曲只应天上有，人间能得几回闻。", author: "杜甫" },
    { text: "黄河之水天上来，奔流到海不复回。", author: "李白" },
    { text: "天生我材必有用，千金散尽还复来。", author: "李白" },
    { text: "长风破浪会有时，直挂云帆济沧海。", author: "李白" },
    { text: "举头望明月，低头思故乡。", author: "李白" },
    { text: "飞流直下三千尺，疑是银河落九天。", author: "李白" },
    { text: "桃花潭水深千尺，不及汪伦送我情。", author: "李白" },
    { text: "两岸猿声啼不住，轻舟已过万重山。", author: "李白" },
    { text: "抽刀断水水更流，举杯消愁愁更愁。", author: "李白" },
    { text: "蜀道难，难于上青天。", author: "李白" },
    { text: "人生得意须尽欢，莫使金樽空对月。", author: "李白" },
    { text: "安能摧眉折腰事权贵，使我不得开心颜。", author: "李白" },
    { text: "床前明月光，疑是地上霜。", author: "李白" },
    { text: "白发三千丈，缘愁似个长。", author: "李白" },
    { text: "相看两不厌，只有敬亭山。", author: "李白" },
    { text: "众鸟高飞尽，孤云独去闲。", author: "李白" },
    { text: "清水出芙蓉，天然去雕饰。", author: "李白" },
    { text: "我寄愁心与明月，随风直到夜郎西。", author: "李白" },
    { text: "孤帆远影碧空尽，唯见长江天际流。", author: "李白" },
    { text: "朝辞白帝彩云间，千里江陵一日还。", author: "李白" },
    { text: "大鹏一日同风起，扶摇直上九万里。", author: "李白" },
    { text: "沉舟侧畔千帆过，病树前头万木春。", author: "刘禹锡" },
    { text: "东边日出西边雨，道是无晴却有晴。", author: "刘禹锡" },
    { text: "旧时王谢堂前燕，飞入寻常百姓家。", author: "刘禹锡" },
    { text: "山不在高，有仙则名；水不在深，有龙则灵。", author: "刘禹锡" },
    { text: "千淘万漉虽辛苦，吹尽狂沙始到金。", author: "刘禹锡" },
    { text: "春蚕到死丝方尽，蜡炬成灰泪始干。", author: "李商隐" },
    { text: "夕阳无限好，只是近黄昏。", author: "李商隐" },
    { text: "身无彩凤双飞翼，心有灵犀一点通。", author: "李商隐" },
    { text: "此情可待成追忆，只是当时已惘然。", author: "李商隐" },
    { text: "天意怜幽草，人间重晚晴。", author: "李商隐" },
    { text: "历览前贤国与家，成由勤俭破由奢。", author: "李商隐" },
    { text: "春眠不觉晓，处处闻啼鸟。", author: "孟浩然" },
    { text: "气蒸云梦泽，波撼岳阳城。", author: "孟浩然" },
    { text: "野旷天低树，江清月近人。", author: "孟浩然" },
    { text: "待到重阳日，还来就菊花。", author: "孟浩然" },
    { text: "葡萄美酒夜光杯，欲饮琵琶马上催。", author: "王翰" },
    { text: "醉卧沙场君莫笑，古来征战几人回。", author: "王翰" },
    { text: "劝君更尽一杯酒，西出阳关无故人。", author: "王维" },
    { text: "大漠孤烟直，长河落日圆。", author: "王维" },
    { text: "独在异乡为异客，每逢佳节倍思亲。", author: "王维" },
    { text: "空山新雨后，天气晚来秋。", author: "王维" },
    { text: "明月松间照，清泉石上流。", author: "王维" },
    { text: "行到水穷处，坐看云起时。", author: "王维" },
    { text: "红豆生南国，春来发几枝。", author: "王维" },
    { text: "江流天地外，山色有无中。", author: "王维" },
    { text: "草枯鹰眼疾，雪尽马蹄轻。", author: "王维" },
    { text: "海上生明月，天涯共此时。", author: "张九龄" },
    { text: "海内存知己，天涯若比邻。", author: "王勃" },
    { text: "落霞与孤鹜齐飞，秋水共长天一色。", author: "王勃" },
    { text: "人面不知何处去，桃花依旧笑春风。", author: "崔护" },
    { text: "去年今日此门中，人面桃花相映红。", author: "崔护" },
    { text: "莫愁前路无知己，天下谁人不识君。", author: "高适" },
    { text: "忽如一夜春风来，千树万树梨花开。", author: "岑参" },
    { text: "黄沙百战穿金甲，不破楼兰终不还。", author: "王昌龄" },
    { text: "秦时明月汉时关，万里长征人未还。", author: "王昌龄" },
    { text: "洛阳亲友如相问，一片冰心在玉壶。", author: "王昌龄" },
    { text: "前不见古人，后不见来者。", author: "陈子昂" },
    { text: "念天地之悠悠，独怆然而涕下。", author: "陈子昂" },
    { text: "离离原上草，一岁一枯荣。", author: "白居易" },
    { text: "野火烧不尽，春风吹又生。", author: "白居易" },
    { text: "同是天涯沦落人，相逢何必曾相识。", author: "白居易" },
    { text: "日出江花红胜火，春来江水绿如蓝。", author: "白居易" },
    { text: "在天愿作比翼鸟，在地愿为连理枝。", author: "白居易" },
    { text: "天长地久有时尽，此恨绵绵无绝期。", author: "白居易" },
    { text: "乱花渐欲迷人眼，浅草才能没马蹄。", author: "白居易" },
    { text: "最爱湖东行不足，绿杨阴里白沙堤。", author: "白居易" },
    { text: "千呼万唤始出来，犹抱琵琶半遮面。", author: "白居易" },
    { text: "文章合为时而著，歌诗合为事而作。", author: "白居易" },
    { text: "回眸一笑百媚生，六宫粉黛无颜色。", author: "白居易" },
    { text: "黑云压城城欲摧，甲光向日金鳞开。", author: "李贺" },
    { text: "雄鸡一声天下白。", author: "李贺" },
    { text: "少年心事当拿云。", author: "李贺" },
    { text: "男儿何不带吴钩，收取关山五十州。", author: "李贺" },
    { text: "天若有情天亦老。", author: "李贺" },
    { text: "大漠沙如雪，燕山月似钩。", author: "李贺" },
    { text: "山高月小，水落石出。", author: "苏轼" },
    { text: "清风徐来，水波不兴。", author: "苏轼" },
    { text: "明月几时有，把酒问青天。", author: "苏轼" },
    { text: "人间如梦，一尊还酹江月。", author: "苏轼" },
    { text: "莫听穿林打叶声，何妨吟啸且徐行。", author: "苏轼" },
    { text: "细看来，不是杨花，点点是离人泪。", author: "苏轼" },
    { text: "枝上柳绵吹又少，天涯何处无芳草。", author: "苏轼" },
    { text: "十年生死两茫茫，不思量，自难忘。", author: "苏轼" },
    { text: "老夫聊发少年狂，左牵黄，右擎苍。", author: "苏轼" },
    { text: "乱石穿空，惊涛拍岸，卷起千堆雪。", author: "苏轼" },
    { text: "莫道不销魂，帘卷西风，人比黄花瘦。", author: "李清照" },
    { text: "寻寻觅觅，冷冷清清，凄凄惨惨戚戚。", author: "李清照" },
    { text: "此情无计可消除，才下眉头，却上心头。", author: "李清照" },
    { text: "知否，知否？应是绿肥红瘦。", author: "李清照" },
    { text: "花自飘零水自流，一种相思，两处闲愁。", author: "李清照" },
    { text: "生当作人杰，死亦为鬼雄。", author: "李清照" },
    { text: "物是人非事事休，欲语泪先流。", author: "李清照" },
    { text: "众里寻他千百度，蓦然回首，那人却在，灯火阑珊处。", author: "辛弃疾" },
    { text: "醉里挑灯看剑，梦回吹角连营。", author: "辛弃疾" },
    { text: "想当年，金戈铁马，气吞万里如虎。", author: "辛弃疾" },
    { text: "少年不识愁滋味，爱上层楼。", author: "辛弃疾" },
    { text: "青山遮不住，毕竟东流去。", author: "辛弃疾" },
    { text: "廉颇老矣，尚能饭否？", author: "辛弃疾" },
    { text: "千古兴亡多少事？悠悠。不尽长江滚滚流。", author: "辛弃疾" },
    { text: "稻花香里说丰年，听取蛙声一片。", author: "辛弃疾" },
    { text: "我见青山多妩媚，料青山见我应如是。", author: "辛弃疾" },
    { text: "把吴钩看了，栏杆拍遍，无人会，登临意。", author: "辛弃疾" },
    { text: "天下英雄谁敌手？曹刘。生子当如孙仲谋。", author: "辛弃疾" },
    { text: "落花人独立，微雨燕双飞。", author: "晏几道" },
    { text: "当时明月在，曾照彩云归。", author: "晏几道" },
    { text: "昨夜西风凋碧树，独上高楼，望尽天涯路。", author: "晏殊" },
    { text: "无可奈何花落去，似曾相识燕归来。", author: "晏殊" },
    { text: "多情自古伤离别，更那堪，冷落清秋节。", author: "柳永" },
    { text: "衣带渐宽终不悔，为伊消得人憔悴。", author: "柳永" },
    { text: "今宵酒醒何处？杨柳岸，晓风残月。", author: "柳永" },
    { text: "忍把浮名，换了浅斟低唱。", author: "柳永" },
    { text: "有三秋桂子，十里荷花。", author: "柳永" },
    { text: "人有悲欢离合，月有阴晴圆缺，此事古难全。", author: "苏轼" },
    { text: "何须浅碧深红色，自是花中第一流。", author: "李清照" },
    { text: "世事一场大梦，人生几度秋凉。", author: "苏轼" },
    { text: "人间有味是清欢。", author: "苏轼" },
    { text: "小舟从此逝，江海寄余生。", author: "苏轼" },
    { text: "竹杖芒鞋轻胜马，谁怕？一蓑烟雨任平生。", author: "苏轼" },
    { text: "此心安处是吾乡。", author: "苏轼" },
    { text: "人生如逆旅，我亦是行人。", author: "苏轼" },
    { text: "粗缯大布裹生涯，腹有诗书气自华。", author: "苏轼" },
    { text: "腹有诗书气自华。", author: "苏轼" },
    { text: "山高月小，水落石出。", author: "苏轼" },
    { text: "春风得意马蹄疾，一日看尽长安花。", author: "孟郊" },
    { text: "谁言寸草心，报得三春晖。", author: "孟郊" },
    { text: "慈母手中线，游子身上衣。", author: "孟郊" },
    { text: "夕阳西下，断肠人在天涯。", author: "马致远" },
    { text: "枯藤老树昏鸦，小桥流水人家。", author: "马致远" },
    { text: "古道西风瘦马，夕阳西下，断肠人在天涯。", author: "马致远" },
    { text: "问世间，情是何物，直教生死相许。", author: "元好问" },
    { text: "天南地北双飞客，老翅几回寒暑。", author: "元好问" },
    { text: "我是个普天下郎君领袖，盖世界浪子班头。", author: "关汉卿" },
    { text: "花落水流红，闲愁万种，无语怨东风。", author: "王实甫" },
    { text: "碧云天，黄花地，西风紧，北雁南飞。", author: "王实甫" },
    { text: "晓来谁染霜林醉？总是离人泪。", author: "王实甫" },
    // 外国名言
    { text: "生活就像海洋，只有意志坚强的人才能到达彼岸。", author: "马克思" },
    { text: "如果冬天来了，春天还会远吗？", author: "雪莱" },
    { text: "世界上只有一种真正的英雄主义，那就是在认清生活的真相后依然热爱生活。", author: "罗曼·罗兰" },
    { text: "我们唯一需要恐惧的是恐惧本身。", author: "富兰克林·罗斯福" },
    { text: "人的价值，在遭受诱惑的一瞬间被决定。", author: "柏拉图" },
    { text: "我思故我在。", author: "笛卡尔" },
    { text: "知识就是力量。", author: "培根" },
    { text: "人生而自由，却无往不在枷锁之中。", author: "卢梭" },
    { text: "存在即合理。", author: "黑格尔" },
    { text: "人是生而自由的，但却无往不在枷锁之中。", author: "卢梭" },
    { text: "我不同意你的观点，但我誓死捍卫你说话的权利。", author: "伏尔泰" },
    { text: "人不能两次踏进同一条河流。", author: "赫拉克利特" },
    { text: "给我一个支点，我就能撬起整个地球。", author: "阿基米德" },
    { text: "我爱我师，我更爱真理。", author: "亚里士多德" },
    { text: "人是万物的尺度。", author: "普罗泰戈拉" },
    { text: "认识你自己。", author: "苏格拉底" },
    { text: "吾爱吾师，吾更爱真理。", author: "亚里士多德" },
    { text: "人是政治的动物。", author: "亚里士多德" },
    { text: "幸福不是奖赏，而是结果；苦难不是惩罚，而是报应。", author: "爱比克泰德" },
    { text: "生命在于运动。", author: "伏尔泰" },
    { text: "天才就是百分之一的灵感加百分之九十九的汗水。", author: "爱迪生" },
    { text: "失败是成功之母。", author: "爱迪生" },
    { text: "天才是百分之一的灵感，百分之九十九的汗水。", author: "爱迪生" },
    { text: "想象力比知识更重要。", author: "爱因斯坦" },
    { text: "提出一个问题往往比解决一个问题更重要。", author: "爱因斯坦" },
    { text: "我没有什么特别的才能，不过喜欢寻根究底地追究问题罢了。", author: "爱因斯坦" },
    { text: "科学的灵感，决不是坐等可以等来的。", author: "爱因斯坦" },
    { text: "学习知识要善于思考，思考，再思考。", author: "爱因斯坦" },
    { text: "每个人都有一定的理想，这种理想决定着他的努力和判断的方向。", author: "爱因斯坦" },
    { text: "人只有献身于社会，才能找出那短暂而有风险的生命的意义。", author: "爱因斯坦" },
    { text: "成功=艰苦劳动+正确方法+少说空话。", author: "爱因斯坦" },
    { text: "人只有献身社会，才能找出那短暂而有风险的生命的意义。", author: "爱因斯坦" },
    { text: "一个人的价值，应该看他贡献什么，而不应当看他取得什么。", author: "爱因斯坦" },
    { text: "生活总是用自己不成文的法律支配着人类。", author: "高尔基" },
    { text: "书籍是人类进步的阶梯。", author: "高尔基" },
    { text: "我扑在书上，就像饥饿的人扑在面包上。", author: "高尔基" },
    { text: "天才出于勤奋。", author: "高尔基" },
    { text: "时间是最公平合理的，它从不多给谁一份。", author: "高尔基" },
    { text: "你要记得，永远要愉快地多给别人，少从别人那里拿取。", author: "高尔基" },
    { text: "热爱书吧——这是知识的泉源。", author: "高尔基" },
    { text: "青春是一个普通的名称，它是幸福美好的，但它也充满着艰苦的磨炼。", author: "高尔基" },
    { text: "人的知识愈广，人的本身也愈臻完善。", author: "高尔基" },
    { text: "没有什么比时间更具有说服力了，因为时间无需通知我们就可以改变一切。", author: "高尔基" },
    { text: "书是人类进步的阶梯。", author: "高尔基" },
    { text: "劳动是世界上一切欢乐和一切美好事情的源泉。", author: "高尔基" },
    { text: "不要慨叹生活的痛苦！慨叹是弱者。", author: "高尔基" },
    { text: "生命，那是自然付给人类去雕琢的宝石。", author: "诺贝尔" },
    { text: "传播知识就是播种幸福。", author: "诺贝尔" },
    { text: "人生最大的快乐不在于占有什么，而在于追求什么的过程中。", author: "诺贝尔" },
    { text: "我是世界的公民，应为人类而生。", author: "诺贝尔" },
    { text: "成功之花，人们往往惊羡它现时的明艳，然而当初，它的芽儿却浸透了奋斗的泪泉，洒满了牺牲的血雨。", author: "冰心" },
    { text: "墙角的花！你孤芳自赏时天地便小了。", author: "冰心" },
    { text: "爱在左，同情在右，走在生命路的两旁，随时撒种，随时开花。", author: "冰心" },
    { text: "世界上若没有女人，这世界至少要失去十分之五的真、十分之六的善、十分之七的美。", author: "冰心" },
    { text: "冠盖满京华，斯人独憔悴。", author: "冰心" },
    { text: "成功的花，人们只惊羡她现时的明艳！然而当初她的芽儿，浸透了奋斗的泪泉，洒遍了牺牲的血雨。", author: "冰心" },
    { text: "横眉冷对千夫指，俯首甘为孺子牛。", author: "鲁迅" },
    { text: "其实地上本没有路，走的人多了，也便成了路。", author: "鲁迅" },
    { text: "时间就像海绵里的水，只要愿挤，总还是有的。", author: "鲁迅" },
    { text: "不在沉默中爆发，就在沉默中灭亡。", author: "鲁迅" },
    { text: "我向来不惮以最坏的恶意揣测中国人。", author: "鲁迅" },
    { text: "哀其不幸，怒其不争。", author: "鲁迅" },
    { text: "哪里有天才，我是把别人喝咖啡的工夫都用在了工作上了。", author: "鲁迅" },
    { text: "真的猛士，敢于直面惨淡的人生，敢于正视淋漓的鲜血。", author: "鲁迅" },
    { text: "寄意寒星荃不察，我以我血荐轩辕。", author: "鲁迅" },
    { text: "唯有民魂是值得宝贵的，唯有他发扬起来，中国才有真进步。", author: "鲁迅" },
    { text: "读书无嗜好，就能尽其多。不先泛览群书，则会无所适从或失之偏好，广然后深，博然后专。", author: "鲁迅" },
    { text: "希望本无所谓有，也无所谓无，这就像地上的路，其实地上本没有路，走的人多了，也便成了路。", author: "鲁迅" },
    { text: "时间就是性命。无端的空耗别人的时间，其实是无异于谋财害命的。", author: "鲁迅" },
    { text: "从来如此，便对么？", author: "鲁迅" },
    { text: "度尽劫波兄弟在，相逢一笑泯恩仇。", author: "鲁迅" },
    { text: "人生最苦痛的是梦醒了无路可走。", author: "鲁迅" },
    { text: "自由的第一个前提就是自治。", author: "鲁迅" },
    { text: "人必须生活着，爱才有所附丽。", author: "鲁迅" },
    { text: "所谓天才，只不过是把别人喝咖啡的功夫都用在工作上了。", author: "鲁迅" },
    { text: "谦虚使人进步，骄傲使人落后。", author: "毛泽东" },
    { text: "世上无难事，只要肯登攀。", author: "毛泽东" },
    { text: "为人民服务。", author: "毛泽东" },
    { text: "星星之火，可以燎原。", author: "毛泽东" },
    { text: "一切反动派都是纸老虎。", author: "毛泽东" },
    { text: "人不犯我，我不犯人；人若犯我，我必犯人。", author: "毛泽东" },
    { text: "好好学习，天天向上。", author: "毛泽东" },
    { text: "数风流人物，还看今朝。", author: "毛泽东" },
    { text: "不到长城非好汉。", author: "毛泽东" },
    { text: "雄关漫道真如铁，而今迈步从头越。", author: "毛泽东" },
    { text: "红军不怕远征难，万水千山只等闲。", author: "毛泽东" },
    { text: "天若有情天亦老，人间正道是沧桑。", author: "毛泽东" },
    { text: "一万年太久，只争朝夕。", author: "毛泽东" },
    { text: "为中华之崛起而读书。", author: "周恩来" },
    { text: "为中华崛起而读书。", author: "周恩来" },
    { text: "面壁十年图破壁，难酬蹈海亦英雄。", author: "周恩来" },
    { text: "大江歌罢掉头东，邃密群科济世穷。", author: "周恩来" },
    { text: "我们要实现农业现代化、工业现代化、国防现代化和科学技术现代化。", author: "周恩来" },
    { text: "我是中国人民的儿子，我深情地爱着我的祖国和人民。", author: "邓小平" },
    { text: "发展才是硬道理。", author: "邓小平" },
    { text: "不管黑猫白猫，捉到老鼠就是好猫。", author: "邓小平" },
    { text: "科学技术是第一生产力。", author: "邓小平" },
    { text: "摸着石头过河。", author: "邓小平" },
    { text: "空谈误国，实干兴邦。", author: "邓小平" },
    { text: "贫穷不是社会主义。", author: "邓小平" },
    { text: "教育要面向现代化，面向世界，面向未来。", author: "邓小平" },
    { text: "我是中国人民的儿子。", author: "邓小平" },
    { text: "一寸光阴一寸金，寸金难买寸光阴。", author: "谚语" },
    { text: "书山有路勤为径，学海无涯苦作舟。", author: "韩愈" },
    { text: "业精于勤，荒于嬉；行成于思，毁于随。", author: "韩愈" },
    { text: "师者，所以传道受业解惑也。", author: "韩愈" },
    { text: "世有伯乐，然后有千里马。千里马常有，而伯乐不常有。", author: "韩愈" },
    { text: "不鸣则已，一鸣惊人。", author: "韩非子" },
    { text: "千里之堤，溃于蚁穴。", author: "韩非子" },
    { text: "以子之矛，攻子之盾。", author: "韩非子" },
    { text: "塞翁失马，焉知非福。", author: "《淮南子》" },
    { text: "风马牛不相及。", author: "《左传》" },
    { text: "多行不义必自毙。", author: "《左传》" },
    { text: "人谁无过？过而能改，善莫大焉。", author: "《左传》" },
    { text: "皮之不存，毛将焉附？", author: "《左传》" },
    { text: "居安思危，思则有备，有备无患。", author: "《左传》" },
    { text: "人非圣贤，孰能无过。", author: "《左传》" },
    { text: "亡羊补牢，未为迟也。", author: "《战国策》" },
    { text: "鹬蚌相争，渔翁得利。", author: "《战国策》" },
    { text: "画蛇添足，多此一举。", author: "《战国策》" },
    { text: "狐假虎威。", author: "《战国策》" },
    { text: "狡兔三窟。", author: "《战国策》" },
    { text: "士为知己者死，女为悦己者容。", author: "《战国策》" },
    { text: "前事不忘，后事之师。", author: "《战国策》" },
    { text: "见义不为，非勇也。", author: "《论语》" },
    { text: "精诚所至，金石为开。", author: "《后汉书》" },
    { text: "有志者，事竟成。", author: "《后汉书》" },
    { text: "投笔从戎。", author: "《后汉书》" },
    { text: "不入虎穴，焉得虎子。", author: "《后汉书》" },
    { text: "失之东隅，收之桑榆。", author: "《后汉书》" },
    { text: "天下兴亡，匹夫有责。", author: "顾炎武" },
    { text: "海纳百川，有容乃大。", author: "林则徐" },
    { text: "壁立千仞，无欲则刚。", author: "林则徐" },
    { text: "落红不是无情物，化作春泥更护花。", author: "龚自珍" },
    { text: "我劝天公重抖擞，不拘一格降人才。", author: "龚自珍" },
    { text: "江山代有才人出，各领风骚数百年。", author: "赵翼" },
    { text: "长风破浪会有时，直挂云帆济沧海。", author: "李白" },
    { text: "书到用时方恨少，事非经过不知难。", author: "陆游" },
    { text: "纸上得来终觉浅，绝知此事要躬行。", author: "陆游" },
    { text: "天下事以难而废者十之一，以惰而废者十之九。", author: "颜之推" },
    { text: "与朋友交，言而有信。", author: "《论语》" },
    { text: "有朋自远方来，不亦乐乎？", author: "《论语》" },
    { text: "四海之内皆兄弟。", author: "《论语》" },
    { text: "君子成人之美，不成人之恶。", author: "《论语》" },
    { text: "见贤思齐焉，见不贤而内自省也。", author: "《论语》" },
    { text: "岁寒，然后知松柏之后凋也。", author: "《论语》" },
    { text: "仁者见仁，智者见智。", author: "《易经》" },
    { text: "自强不息，厚德载物。", author: "《易经》" },
    { text: "物以类聚，人以群分。", author: "《易经》" },
    { text: "穷则变，变则通，通则久。", author: "《易经》" },
    { text: "君子藏器于身，待时而动。", author: "《易经》" },
    { text: "天行健，君子以自强不息。", author: "《易经》" },
    { text: "一阴一阳之谓道。", author: "《易经》" },
    { text: "仁者爱人，有礼者敬人。", author: "《孟子》" },
    { text: "不以规矩，不能成方圆。", author: "《孟子》" },
    { text: "尽信书，则不如无书。", author: "《孟子》" },
    { text: "人之相识，贵在相知，人之相知，贵在知心。", author: "《孟子》" },
    { text: "爱人者，人恒爱之；敬人者，人恒敬之。", author: "《孟子》" },
    { text: "登泰山而小天下。", author: "《孟子》" },
    { text: "凡事预则立，不预则废。", author: "《礼记》" },
    { text: "玉不琢，不成器；人不学，不知道。", author: "《礼记》" },
    { text: "一张一弛，文武之道。", author: "《礼记》" },
    { text: "学无止境。", author: "《礼记》" },
    { text: "学然后知不足，教然后知困。", author: "《礼记》" },
    { text: "教学相长。", author: "《礼记》" },
    { text: "大道之行也，天下为公。", author: "《礼记》" },
    { text: "青出于蓝而胜于蓝。", author: "《荀子》" },
    { text: "锲而舍之，朽木不折；锲而不舍，金石可镂。", author: "《荀子》" },
    { text: "骐骥一跃，不能十步；驽马十驾，功在不舍。", author: "《荀子》" },
    { text: "冰，水为之，而寒于水。", author: "《荀子》" },
    { text: "木受绳则直，金就砺则利。", author: "《荀子》" },
    { text: "前车之鉴。", author: "《汉书》" },
    { text: "水至清则无鱼，人至察则无徒。", author: "《汉书》" },
    { text: "临渊羡鱼，不如退而结网。", author: "《汉书》" },
    { text: "读万卷书，行万里路。", author: "刘彝" },
    { text: "读万卷书，不如行万里路。", author: "刘彝" },
    { text: "千里之行，始于足下。", author: "《老子》" },
    { text: "知足者富。", author: "《老子》" },
    { text: "知人者智，自知者明。", author: "《老子》" },
    { text: "大巧若拙，大辩若讷。", author: "《老子》" },
    { text: "信言不美，美言不信。", author: "《老子》" },
    { text: "善者不辩，辩者不善。", author: "《老子》" },
    { text: "知者不言，言者不知。", author: "《老子》" },
    { text: "天之道，损有余而补不足。", author: "《老子》" },
    { text: "飘风不终朝，骤雨不终日。", author: "《老子》" },
    { text: "道常无为而无不为。", author: "《老子》" },
    { text: "将欲取之，必先予之。", author: "《老子》" },
    { text: "庄周梦蝶。", author: "《庄子》" },
    { text: "朝三暮四。", author: "《庄子》" },
    { text: "望洋兴叹。", author: "《庄子》" },
    { text: "井底之蛙。", author: "《庄子》" },
    { text: "邯郸学步。", author: "《庄子》" },
    { text: "越俎代庖。", author: "《庄子》" },
    { text: "螳臂当车。", author: "《庄子》" },
    { text: "东施效颦。", author: "《庄子》" },
    { text: "管中窥豹，可见一斑。", author: "《世说新语》" },
    { text: "望梅止渴。", author: "《世说新语》" },
    { text: "才高八斗。", author: "《世说新语》" },
    { text: "七步成诗。", author: "《世说新语》" },
    { text: "入木三分。", author: "《世说新语》" },
    { text: "洛阳纸贵。", author: "《晋书》" },
    { text: "枕戈待旦。", author: "《晋书》" },
    { text: "闻鸡起舞。", author: "《晋书》" },
    { text: "投鞭断流。", author: "《晋书》" },
    { text: "草木皆兵。", author: "《晋书》" },
    { text: "风声鹤唳。", author: "《晋书》" },
    { text: "东山再起。", author: "《晋书》" },
    { text: "三人成虎。", author: "《战国策》" },
    { text: "画龙点睛。", author: "《历代名画记》" },
    { text: "破镜重圆。", author: "《本事诗》" },
    { text: "司空见惯。", author: "《本事诗》" },
    { text: "人面桃花。", author: "《本事诗》" },
    { text: "青梅竹马。", author: "李白" },
    { text: "两小无猜。", author: "李白" },
    { text: "破釜沉舟。", author: "《史记》" },
    { text: "四面楚歌。", author: "《史记》" },
    { text: "无颜见江东父老。", author: "《史记》" },
    { text: "完璧归赵。", author: "《史记》" },
    { text: "负荆请罪。", author: "《史记》" },
    { text: "纸上谈兵。", author: "《史记》" },
    { text: "卧薪尝胆。", author: "《史记》" },
    { text: "鸟尽弓藏，兔死狗烹。", author: "《史记》" },
    { text: "毛遂自荐。", author: "《史记》" },
    { text: "一言九鼎。", author: "《史记》" },
    { text: "萧规曹随。", author: "《史记》" },
    { text: "约法三章。", author: "《史记》" },
    { text: "背水一战。", author: "《史记》" },
    { text: "多多益善。", author: "《史记》" },
    { text: "成也萧何，败也萧何。", author: "《史记》" },
    { text: "愚公移山。", author: "《列子》" },
    { text: "夸父逐日。", author: "《山海经》" },
    { text: "精卫填海。", author: "《山海经》" },
    { text: "女娲补天。", author: "《淮南子》" },
    { text: "后羿射日。", author: "《淮南子》" },
    { text: "嫦娥奔月。", author: "《淮南子》" },
    { text: "大禹治水。", author: "《山海经》" },
    { text: "叶公好龙。", author: "《新序》" },
    { text: "杯弓蛇影。", author: "《风俗通义》" },
    { text: "掩耳盗铃。", author: "《吕氏春秋》" },
    { text: "刻舟求剑。", author: "《吕氏春秋》" },
    { text: "守株待兔。", author: "《韩非子》" },
    { text: "自相矛盾。", author: "《韩非子》" },
    { text: "滥竽充数。", author: "《韩非子》" },
    { text: "买椟还珠。", author: "《韩非子》" },
    { text: "郑人买履。", author: "《韩非子》" },
    { text: "削足适履。", author: "《淮南子》" },
    { text: "杞人忧天。", author: "《列子》" },
    { text: "歧路亡羊。", author: "《列子》" },
    { text: "疑邻盗斧。", author: "《吕氏春秋》" },
    { text: "盲人摸象。", author: "《涅槃经》" },
    { text: "对牛弹琴。", author: "《弘明集》" },
    { text: "打草惊蛇。", author: "《南唐近事》" },
    { text: "画蛇添足。", author: "《战国策》" },
    { text: "守口如瓶。", author: "《癸辛杂识》" },
    { text: "纸上谈兵。", author: "《史记》" },
    { text: "闭门造车。", author: "《中庸》" },
    { text: "夜郎自大。", author: "《史记》" },
    { text: "揠苗助长。", author: "《孟子》" },
    { text: "杯水车薪。", author: "《孟子》" },
    { text: "五十步笑百步。", author: "《孟子》" },
    { text: "始作俑者。", author: "《孟子》" },
    { text: "缘木求鱼。", author: "《孟子》" },
    { text: "明察秋毫，不见舆薪。", author: "《孟子》" },
    { text: "左右逢源。", author: "《孟子》" },
    { text: "一暴十寒。", author: "《孟子》" },
    { text: "专心致志。", author: "《孟子》" },
    { text: "以邻为壑。", author: "《孟子》" },
    { text: "好为人师。", author: "《孟子》" },
    { text: "独善其身。", author: "《孟子》" },
    { text: "与人为善。", author: "《孟子》" },
    { text: "舍生取义。", author: "《孟子》" },
    { text: "君子不器。", author: "《论语》" },
    { text: "敏而好学，不耻下问。", author: "《论语》" },
    { text: "不耻下问。", author: "《论语》" },
    { text: "举一反三。", author: "《论语》" },
    { text: "闻一知十。", author: "《论语》" },
    { text: "因材施教。", author: "《论语》" },
    { text: "有教无类。", author: "《论语》" },
    { text: "诲人不倦。", author: "《论语》" },
    { text: "学而不厌。", author: "《论语》" },
    { text: "后生可畏。", author: "《论语》" },
    { text: "当仁不让。", author: "《论语》" },
    { text: "任重道远。", author: "《论语》" },
    { text: "成人之美。", author: "《论语》" },
    { text: "见义勇为。", author: "《论语》" },
    { text: "三思而行。", author: "《论语》" },
    { text: "不亦乐乎。", author: "《论语》" },
    { text: "从心所欲。", author: "《论语》" },
    { text: "血气方刚。", author: "《论语》" },
    { text: "察言观色。", author: "《论语》" },
    { text: "名正言顺。", author: "《论语》" },
    { text: "待价而沽。", author: "《论语》" },
    { text: "怨天尤人。", author: "《论语》" },
    { text: "手足无措。", author: "《论语》" },
    { text: "慎终追远。", author: "《论语》" },
    { text: "既往不咎。", author: "《论语》" },
    { text: "尽善尽美。", author: "《论语》" },
    { text: "文质彬彬。", author: "《论语》" },
    { text: "是可忍，孰不可忍。", author: "《论语》" },
    { text: "听其言而观其行。", author: "《论语》" },
    { text: "逝者如斯。", author: "《论语》" },
    { text: "华而不实。", author: "《左传》" },
    { text: "众志成城。", author: "《国语》" },
    { text: "众口铄金。", author: "《国语》" },
    { text: "防民之口，甚于防川。", author: "《国语》" },
    { text: "高枕无忧。", author: "《战国策》" },
    { text: "门庭若市。", author: "《战国策》" },
    { text: "画龙点睛。", author: "张彦远" },
    { text: "望尘莫及。", author: "《后汉书》" },
    { text: "脍炙人口。", author: "《孟子》" },
    { text: "贪小失大。", author: "《吕氏春秋》" },
    { text: "因噎废食。", author: "《吕氏春秋》" },
    { text: "竭泽而渔。", author: "《吕氏春秋》" },
    { text: "流水不腐，户枢不蠹。", author: "《吕氏春秋》" },
    { text: "刻舟求剑。", author: "《吕氏春秋》" },
    { text: "一字千金。", author: "《吕氏春秋》" },
    { text: "奇货可居。", author: "《史记》" },
    { text: "一鸣惊人。", author: "《史记》" },
    { text: "运筹帷幄。", author: "《史记》" },
    { text: "先发制人。", author: "《汉书》" },
    { text: "后来居上。", author: "《史记》" },
    { text: "门可罗雀。", author: "《史记》" },
    { text: "桃李满天下。", author: "《韩诗外传》" },
    { text: "事半功倍。", author: "《孟子》" },
    { text: "事倍功半。", author: "《孟子》" },
    { text: "因地制宜。", author: "《吴越春秋》" },
    { text: "兼听则明，偏信则暗。", author: "《资治通鉴》" },
    { text: "口蜜腹剑。", author: "《资治通鉴》" },
    { text: "请君入瓮。", author: "《资治通鉴》" },
    { text: "桃李不言，下自成蹊。", author: "《史记》" },
    { text: "如火如荼。", author: "《国语》" },
    { text: "一发千钧。", author: "《汉书》" },
    { text: "一尘不染。", author: "《景德传灯录》" },
    { text: "千钧一发。", author: "《汉书》" },
    { text: "一箭双雕。", author: "《北史》" },
    { text: "双管齐下。", author: "《图画见闻志》" },
    { text: "南柯一梦。", author: "《南柯太守传》" },
    { text: "黄粱美梦。", author: "《枕中记》" },
    { text: "画饼充饥。", author: "《三国志》" },
    { text: "望梅止渴。", author: "《世说新语》" },
    { text: "胸有成竹。", author: "《文与可画筼筜谷偃竹记》" },
    { text: "水滴石穿。", author: "《汉书》" },
    { text: "铁杵磨成针。", author: "《方舆胜览》" },
    { text: "只要功夫深，铁杵磨成针。", author: "谚语" },
    { text: "磨杵成针。", author: "《潜确居类书》" },
    { text: "悬梁刺股。", author: "《战国策》" },
    { text: "凿壁偷光。", author: "《西京杂记》" },
    { text: "囊萤映雪。", author: "《晋书》" },
    { text: "牛角挂书。", author: "《新唐书》" },
    { text: "韦编三绝。", author: "《史记》" },
    { text: "程门立雪。", author: "《宋史》" },
    { text: "孜孜不倦。", author: "《尚书》" },
    { text: "废寝忘食。", author: "《论语》" },
    { text: "手不释卷。", author: "《三国志》" },
    { text: "博览群书。", author: "《周书》" },
    { text: "学富五车。", author: "《庄子》" },
    { text: "汗牛充栋。", author: "《陆文通先生墓表》" },
    { text: "博闻强记。", author: "《礼记》" },
    { text: "融会贯通。", author: "《朱子全书》" },
    { text: "举一反三。", author: "《论语》" },
    { text: "触类旁通。", author: "《周易》" },
    { text: "循序渐进。", author: "《论语》" },
    { text: "由浅入深。", author: "《朱子语类》" },
    { text: "熟读深思。", author: "《朱子语类》" },
    { text: "厚积薄发。", author: "《稼说送张琥》" },
    { text: "豁然开朗。", author: "《桃花源记》" },
    { text: "茅塞顿开。", author: "《孟子》" },
    { text: "恍然大悟。", author: "《五灯会元》" },
    { text: "柳暗花明。", author: "《游山西村》" },
  ];

   // 获取名言数据 - 带淡入淡出动画
   const fetchQuote = () => {
       // 先淡出
       setQuoteVisible(false);
       
       // 等待淡出完成后再切换内容并淡入
       setTimeout(() => {
           const randomIndex = Math.floor(Math.random() * backupQuotes.length);
           setCurrentQuote(backupQuotes[randomIndex]);
           setQuoteVisible(true);
       }, 300); // 300ms 淡出时间
   };
  
   // 初始获取名言并设置自动刷新
  useEffect(() => {
    fetchQuote();
    
    // 每30秒自动获取新名言
     const quoteInterval = setInterval(fetchQuote, 5000);
    
    return () => clearInterval(quoteInterval);
  }, []);
  
  // 计算时间进度并设置定时器
  useEffect(() => {
    const calculateTimeProgress = () => {
      const now = new Date();
      
      // 今日进度 (0-24小时)
      const hoursPassed = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
      const dailyProgress = Math.min(Math.round((hoursPassed / 24) * 100), 100);
      
      // 本周进度 (0-7天)
      const dayOfWeek = now.getDay() || 7; // 转换为周一为1，周日为7
      const weeklyProgress = Math.round((dayOfWeek / 7) * 100);
      
      // 本月进度 (0-当月天数)
      const dayOfMonth = now.getDate();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const monthlyProgress = Math.round((dayOfMonth / daysInMonth) * 100);
      
      // 今年进度 (0-12个月)
      const monthOfYear = now.getMonth() + 1;
      const yearlyProgress = Math.round((monthOfYear / 12) * 100);
      
      setTimeProgress({
        daily: dailyProgress,
        weekly: weeklyProgress,
        monthly: monthlyProgress,
        yearly: yearlyProgress
      });
    };
    
    // 初始化计算
    calculateTimeProgress();
    
    // 每分钟更新一次进度
    const timer = setInterval(calculateTimeProgress, 60000);
    
    return () => clearInterval(timer);
   }, []);

   // 禁用右键菜单功能
   useEffect(() => {
     const handleContextMenu = (e: Event) => {
        e.preventDefault();
        toast('为优化体验，本站禁用右键', {
          position: 'bottom-right',
          className: 'bg-black/80 text-white border-none'
        });
     };
     
     document.addEventListener('contextmenu', handleContextMenu);
     return () => {
       document.removeEventListener('contextmenu', handleContextMenu);
     };
   }, []);
   // 音乐播放器与留言板：站主还在考虑是否保留，先置灰并拦截点击
  const showPendingNotice = (name: string) => {
    toast(`站主正在考虑「${name}」是否要删除，暂时无法使用`, {
      position: 'bottom-right',
      className: 'bg-black/80 text-white border-none',
    });
  };

  // 传送门导航处理函数
    const cancelPortalNavigation = () => {
      setIsPortalWarningOpen(false);
      setPortalCountdown(10); // 重置倒计时
    };
    
    // 倒计时和自动导航效果
    useEffect(() => {
      if (!isPortalWarningOpen || portalCountdown <= 0) return;
      
      const timer = setTimeout(() => {
        setPortalCountdown(prev => prev - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    }, [isPortalWarningOpen, portalCountdown]);
    
    // 当倒计时结束时自动导航
    useEffect(() => {
      if (portalCountdown === 0 && isPortalWarningOpen) {
        confirmPortalNavigation();
      }
    }, [portalCountdown, isPortalWarningOpen]);
   
   const confirmPortalNavigation = () => {
     setIsPortalWarningOpen(false);
     // 这里可以添加实际的导航逻辑
     window.open('https://travel.moe/go', '_blank');
   };
   
   // 链接数据
      // 当前页码状态
      const [currentPage, setCurrentPage] = useState(1);
      const itemsPerPage = 6; // 每页显示6个功能按钮
      
       // 功能按钮数据
      const featureLinks: LinkItem[] = [
        { id: 1, title: '天气', icon: 'fa-solid fa-cloud-sun', url: 'https://www.msn.cn/zh-cn/weather/forecast/in-%E5%B9%BF%E4%B8%9C%E7%9C%81,%E7%BD%97%E6%B9%96%E5%8C%BA?loc=eyJsIjoi572X5rmW5Yy6IiwiciI6IuW5v%2BS4nOecgSIsImMiOiLkuK3ljY7kurrmsJHlhbHlkozlm70iLCJpIjoiQ04iLCJnIjoiemgtY24iLCJ4IjoiMTE0LjEzMTk4NDkyIiwieSI6IjIyLjU1MDE4MTUifQ%3D%3D&weadegreetype=C&ocid=ansmsnw' },
         { id: 2, title: '影视', icon: 'fa-solid fa-film', url: '#' },
        { id: 3, title: '音乐', icon: 'fa-solid fa-music', url: 'https://music.imsyy.com/' },
        { id: 4, title: '学习', icon: 'fa-solid fa-book', url: '#' },
         { id: 8, title: 'AI工具', icon: 'fa-solid fa-robot', url: '#' },
         { id: 7, title: '实用工具', icon: 'fa-solid fa-wrench', url: 'https://fly63.com/tool/home.html' },
         { id: 6, title: '时间胶囊', icon: 'fa-solid fa-hourglass-half', url: '#' },
            { id: 9, title: '传送门', icon: 'fa-solid fa-link', url: 'https://travel.moe/go' },
             { id: 11, title: '假期日历', icon: 'fa-solid fa-calendar-days', url: '#' },
             { id: 12, title: '天梯图', icon: 'fa-solid fa-chart-line', url: '#' },
             { id: 13, title: '今日热榜', icon: 'fa-solid fa-fire', url: '#' },
             { id: 14, title: '番茄钟', icon: 'fa-solid fa-clock', url: '#' },
             { id: 15, title: '随机决策', icon: 'fa-solid fa-dice', url: '#' },
             { id: 16, title: '留言板', icon: 'fa-solid fa-comments', url: '#' },
             { id: 10, title: '其他', icon: 'fa-solid fa-ellipsis-h', url: '#' },
       ];
      
      // 计算总页数
      const totalPages = Math.ceil(featureLinks.length / itemsPerPage);
      
      // 获取当前页显示的功能按钮
      const currentFeatureLinks = featureLinks.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      );
      
      // 处理鼠标滚轮事件实现翻页
      const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        if (e.deltaY > 0 && currentPage < totalPages) {
          // 向下滚动，下一页
          setCurrentPage(prev => prev + 1);
        } else if (e.deltaY < 0 && currentPage > 1) {
          // 向上滚动，上一页
          setCurrentPage(prev => prev - 1);
        }
      };
      
      // 处理页码点击事件
      const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
          setCurrentPage(page);
        }
      };

      // 液态玻璃：开关打开且浏览器支持时，把真折射应用到功能按钮上。
      // 放在这里是因为依赖 currentPage（它在本组件里声明得比较靠后）。
      useEffect(() => {
        if (!liquidGlass || !glassSupported) {
          clearLiquidGlass(TILE_SELECTOR);
          return;
        }
        // 等这一页的按钮挂载完成
        const raf = requestAnimationFrame(() => applyLiquidGlass(TILE_SELECTOR));
        const onResize = () => {
          clearLiquidGlass(TILE_SELECTOR);
          applyLiquidGlass(TILE_SELECTOR);
        };
        window.addEventListener('resize', onResize);
        return () => {
          cancelAnimationFrame(raf);
          window.removeEventListener('resize', onResize);
          clearLiquidGlass(TILE_SELECTOR);
        };
      }, [liquidGlass, glassSupported, currentPage]);

  // 社交媒体数据
const socialItems: SocialItem[] = [
  { id: 1, icon: 'fa-brands fa-github', url: 'https://github.com/lyjy6666', name: 'GitHub' },
  { id: 2, icon: 'fa-brands fa-tiktok', url: 'https://www.douyin.com/user/MS4wLjABAAAAK2HSwJN07NwDYxX-0A3YpvAPQ00MSUw-TCqKM-xlBFT70ozZdm9FxHgSHGapYT_S', name: '抖音' },
  { id: 3, icon: 'fa-brands fa-bilibili', url: 'https://space.bilibili.com/1983970346?spm_id_from=333.1007.0.0', name: 'bilibili' },
];

  // 更新时间和日期
  useEffect(() => {
    // 设置初始日期
    updateDate();
    
    // 设置问候语
    setGreeting(getGreeting());
    
    // 更新时间
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // 更新日期（每天更新一次）
    const dateTimer = setInterval(() => {
      updateDate();
      setGreeting(getGreeting());
    }, 86400000); // 24小时

    return () => {
      clearInterval(timer);
      clearInterval(dateTimer);
    };
  }, []);

  // 更新日期函数
  const updateDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    };
    setCurrentDate(new Date().toLocaleDateString('zh-CN', options));
  };

  // 获取问候语函数
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return '凌晨好';
    if (hour < 9) return '早上好';
    if (hour < 12) return '上午好';
    if (hour < 14) return '中午好';
    if (hour < 18) return '下午好';
    if (hour < 22) return '晚上好';
    return '夜深了';
  };

  // 格式化时间显示
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
     <div className="min-h-screen flex flex-col relative overflow-hidden">
       {/* 背景图片 */}
       <div className="absolute inset-0 z-0">
            <img 
     src="https://lf-code-agent.coze.cn/obj/x-ai-cn/268624684546/attachment/20241210m7963n_20250804152700.webp" 
    alt="Background" 
            className="w-full h-full object-cover"
          />
         {/* 背景渐变覆盖层，增强文字可读性 */}
         <div className={`absolute inset-0 ${OVERLAY_DARK}`}></div>
       </div>
 


        {/* 顶部通知栏 */}
        <div className="relative z-10 bg-gradient-to-r from-black/50 via-black/40 to-black/50 text-white text-sm py-2 px-4 backdrop-blur-md flex justify-center">
          <span>{greeting}，欢迎来到我的主页</span>
           </div>
  
         {/* 搜索框 - 位于欢迎消息下方 */}
         <div 
           className="search-container relative z-10 bg-black/40 backdrop-blur-md py-1.5 px-4 border-b border-white/15 cursor-pointer group"
           onClick={() => window.location.href = '/search'}
         >
           <div className="container mx-auto flex items-center justify-center">
             <div className="relative w-full max-w-2xl">
               <input
                 type="text"
                 placeholder="点击搜索..."
                 className="w-full pl-10 pr-4 py-2 rounded-full border border-white/20 bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all duration-300 group-hover:border-blue-400 group-hover:bg-white/15"
                 readOnly
               />
               <i className="fa-solid fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 group-hover:text-blue-400 transition-colors"></i>
             </div>
           </div>
         </div>
  
         {/* 主内容区 */}
         <main className="relative z-10 flex-grow container mx-auto px-4 py-12 flex flex-col md:flex-row items-center justify-center md:justify-between max-w-5xl">
         {/* 左侧：头像和名称 */}
         <div className="left-content-area flex flex-col items-center md:items-start mb-10 md:mb-0 md:mr-10">
           <div className="avatar-container relative mb-6 flex items-center gap-5">
             <div 
               onClick={() => setIsPersonalProfileOpen(true)}
               className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg cursor-pointer hover:scale-105 hover:border-white/40 transition-all duration-300 group"
               title="点击查看个人展示页"
             >
                <img 
                   src="https://lf-code-agent.coze.cn/obj/x-ai-cn/268624684546/attachment/49a4d7337146cc652592d861806afccf_20250804153303.jpg" 
                   alt="Avatar" 
                   className="w-full h-full object-cover rounded-full opacity-80 group-hover:opacity-100 transition-opacity"
                 />
                {/* 悬停提示 */}
                <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                  <i className="fa-solid fa-user text-white opacity-0 group-hover:opacity-100 transition-opacity text-2xl"></i>
                </div>
             </div>
             {/* 艺术字标题 */}
             <h1 
               className="text-5xl md:text-6xl text-white select-none"
               style={{ 
                 textShadow: '0 2px 15px rgba(255,255,255,0.3)',
                 letterSpacing: '0.05em'
               }}
             >
               𝓁𝓎𝒿𝓎
             </h1>
           </div>
              <div className="hidden">
                {/* 已移至顶部的模态框状态 */}
              </div>
           
           {/* 简介/引用区域 */}
             {/* 名言区域 - 可点击切换 */}
             <div 
               className="quote-container mt-8 bg-white/10 backdrop-blur-xl p-6 rounded-xl border border-white/15 max-w-md w-full cursor-pointer hover:bg-white/15 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
               onClick={fetchQuote}
               title="点击切换名言"
             >
               <p className={`text-white/90 text-base md:text-lg italic leading-relaxed transition-all duration-300 ${quoteVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                  「  {currentQuote.text}  」
               </p>
               <p className={`text-white/70 text-sm mt-3 text-right transition-all duration-300 ${quoteVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                 - {currentQuote.author}
               </p>

             </div>
         </div>
 
         {/* 右侧：日期时间和链接 / 个人展示页 */}
         <div className="right-content-area w-full md:w-auto">
          <AnimatePresence mode="wait">
            {!isPersonalProfileOpen ? (
              <motion.div
                key="main-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
              >
            <div className="grid grid-cols-1 gap-4 mb-8">
              {/* 日期时间卡片 */}
              <div className="bg-white/10 backdrop-blur-xl p-5 rounded-xl border border-white/15 w-full shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-white/70 text-sm mb-1">{currentDate}</p>
                    <p className="text-white text-3xl font-mono font-light">{formatTime(currentTime)}</p>
                  </div>
                  {/* 音乐播放器：站主还在考虑是否保留，先置灰 */}
                  <div className="music-player relative opacity-40 grayscale">
                    <MusicPlayer />
                    <button
                      type="button"
                      aria-label="音乐播放器（暂不可用）"
                      onClick={() => showPendingNotice('音乐播放器')}
                      className="absolute inset-0 z-20 cursor-not-allowed rounded-full"
                    />
                  </div>
                </div>
              </div>
           </div>
 
            {/* 链接卡片网格 */}
              {/* 添加鼠标滚轮事件监听器实现翻页 */}
              <div 
                className="grid grid-cols-2 md:grid-cols-3 gap-4"
                onWheel={handleWheel}
                style={{ touchAction: 'none' }} // 防止触摸设备上的默认滚动行为
              >
                {/* 当前页的功能按钮 */}
                {currentFeatureLinks.map(link => (
                  <a 
                    key={link.id}
                    href={link.url}
                     className={`feature-button group bg-white/10 backdrop-blur-md p-5 rounded-xl border border-white/15 hover:bg-white/20 transition-all duration-300 flex flex-col items-center justify-center shadow-md hover:shadow-xl hover:scale-[1.02] ${link.id === 16 ? 'opacity-45 grayscale cursor-not-allowed hover:scale-100 hover:bg-white/10' : ''}`}
                      aria-label={link.title}
                        onClick={(e) => {
                          e.preventDefault();
                          // 留言板：站主还在考虑是否保留，只给提示不打开
                          if (link.id === 16) {
                            showPendingNotice('留言板');
                            return;
                          }
                          if (link.id === 1 || link.id === 3) {
                            // 天气和音乐按钮在新标签页打开
                            window.open(link.url, '_blank');
                           } else if (link.id === 2) {
                             // 影视按钮打开模态框
                             setIsMovieModalOpen(true);
                            } else if (link.id === 11) {
                              // 打开假期日历模态框
                              setIsHolidayCalendarOpen(true);
                            } else if (link.id === 12) {
                              // 打开显卡天梯图模态框
                              setIsGPUTierChartOpen(true);
                            } else if (link.id === 13) {
                              // 打开今日热榜模态框
                              setIsHotBoardOpen(true);
                            } else if (link.id === 14) {
                              // 打开番茄钟模态框
                              setIsPomodoroTimerOpen(true);
                            } else if (link.id === 15) {
                              // 打开随机决策器模态框
                              setIsRandomDecisionOpen(true);
                            } else if (link.id === 16) {
                              // 打开留言板模态框
                              setIsGuestbookOpen(true);
                            } else if (link.id === 4) {
                             setIsStudyModalOpen(true);
                           } else if (link.id === 7) {
                              setIsUtilityModalOpen(true);
                          } else if (link.id === 8) {
                              setIsAIToolsModalOpen(true);
                          } else if (link.id === 6) {
                              // 打开时间胶囊模态框
                              setIsTimeCapsuleModalOpen(true);
                          } else if (link.id === 9) {
                              // 打开传送门警告弹窗
                              setIsPortalWarningOpen(true);
                           } else if (link.id === 10) {
                               // 打开"其他"功能模态框
                            setIsOtherModalOpen(true);
                       }
                      }}
                  >
                    <i className={`${link.icon} text-white/80 text-xl mb-2 group-hover:text-white transition-colors`}></i>
                    <span className="text-white/80 text-sm group-hover:text-white transition-colors flex items-center gap-1">
                      {link.title}
                      {link.id === 16 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full">Beta</span>
                      )}
                    </span>
                  </a>
                ))}
              </div>
              
               {/* 分页按钮 - 移到假期日历下 */}
               {totalPages > 1 && (
                 <div className="mt-8 flex justify-center">
                   <div className="relative w-1/2 bg-white/20 h-1 rounded-full cursor-pointer flex">
                     {Array.from({ length: totalPages }, (_, i) => i + 1).map((page, index) => (
                       <button
                         key={page}
                         onClick={() => handlePageChange(page)}
                         className={`h-full transition-all duration-300 ${
                           currentPage === page ? 'bg-white/40' : 'hover:bg-white/30'
                         } ${
                           index === 0 ? 'rounded-l-full' : ''
                         } ${
                           index === totalPages - 1 ? 'rounded-r-full' : ''
                         }`}
                         style={{ width: `${100 / totalPages}%` }}
                         aria-label={`第${page}页`}
                       ></button>
                     ))}
                   </div>
                 </div>
               )}
              </motion.div>
            ) : (
              <PersonalProfile 
                isOpen={isPersonalProfileOpen} 
                onClose={() => setIsPersonalProfileOpen(false)} 
              />
            )}
          </AnimatePresence>
            {isMovieModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* 背景遮罩 */}
                <div 
                  className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                  onClick={() => setIsMovieModalOpen(false)}
                ></div>
                
                {/* 模态框内容 */}
                <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/15 p-6 w-full max-w-md shadow-2xl">
                  <div className="flex justify-between items-center mb-6">
                     <h3 className="text-white text-xl font-semibold">选择影视网站</h3>
                    <button 
                      onClick={() => setIsMovieModalOpen(false)}
                      className="text-white/60 hover:text-white transition-colors"
                    >
                      <i className="fa-solid fa-times text-lg"></i>
                    </button>
                  </div>
                  
                     <div className="space-y-4">
                       <a 
                         href="https://jpyy.com" 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="block w-full bg-white/15 hover:bg-white/25 hover:shadow-lg transition-all duration-300 p-4 rounded-xl text-white text-left font-medium"
                         onClick={() => setIsMovieModalOpen(false)}
                       >
                         <i className="fa-solid fa-film mr-2"></i>金牌影院（微卡，但无广）
                       </a>
                       
                       <a 
                         href="https://ixkw.cc" 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="block w-full bg-white/15 hover:bg-white/25 hover:shadow-lg transition-all duration-300 p-4 rounded-xl text-white text-left font-medium"
                         onClick={() => setIsMovieModalOpen(false)}
                       >
                          <i className="fa-solid fa-video mr-2"></i>星空影院（不卡，但视频中有广）
                        </a>
                        
                         <a 
                           href="https://jzb762.com/" 
                           target="_blank" 
                           rel="noopener noreferrer"
                           className="block w-full bg-white/15 hover:bg-white/25 hover:shadow-lg transition-all duration-300 p-4 rounded-xl text-white text-left font-medium"
                           onClick={() => setIsMovieModalOpen(false)}
                         >
                           <i className="fa-solid fa-tv mr-2"></i>极直播（体育比赛直播）
                         </a>
                      </div>
                  
                  <p className="text-white/40 text-xs text-center mt-6">
                    点击外部区域或关闭按钮也可关闭
                  </p>
                </div>
              </div>
              )}

      {/* 更新日志弹窗 */}
              {isUpdateLogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  {/* 背景遮罩 */}
                  <div 
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    onClick={() => setIsUpdateLogOpen(false)}
                  ></div>
                  
                  {/* 弹窗内容 */}
                  <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/15 p-6 w-full max-w-md mx-auto shadow-2xl">
                    {/* 标题栏 */}
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="text-lg font-semibold text-white">更新记录</h3>
                        <p className="mt-1 text-[11px] tracking-wide text-white/40">LYJY 主页 · 版本历史</p>
                      </div>
                      <button
                        onClick={() => setIsUpdateLogOpen(false)}
                        className="text-white/60 hover:text-white transition-colors"
                        aria-label="关闭"
                      >
                        <i className="fa-solid fa-times text-lg"></i>
                      </button>
                    </div>
                    
                    {/* 内容区域 */}
                    <div className="max-h-[60vh] overflow-y-auto pr-1">
                      <UpdateTimeline releases={homeReleases} />
                    </div>
                    
                    {/* 底部按钮 */}
                    <div className="p-4 border-t border-gray-200 flex justify-end">
                      <button 
                        onClick={() => setIsUpdateLogOpen(false)}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-lg transition-all duration-300 hover:shadow-lg"
                      >
                        我知道了
                      </button>
                    </div>
                  </div>
                </div>
              )}
    </div>
         

          {/* 其他功能模态框 */}
          {isOtherModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* 背景遮罩 */}
              <div 
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={() => setIsOtherModalOpen(false)}
              ></div>
              
              {/* Modal content */}
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/15 p-6 w-full max-w-md shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-white text-xl font-semibold">其他功能</h3>
                  <button 
                    onClick={() => setIsOtherModalOpen(false)}
                    className="text-white/60 hover:text-white transition-colors"
                    aria-label="关闭"
                  >
                    <i className="fa-solid fa-times text-lg"></i>
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-white text-lg font-medium mb-4">特别鸣谢</h4>
                    <div className="space-y-4 text-white">
                      <div>
                        <p className="text-white/90 mb-2">个人空间网：</p>
                        <a href="http://gerenzhuye.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm break-all">gerenzhuye.com</a>
                      </div>

                      <div>
                        <p className="text-white/90 mb-2">Trae：</p>
                        <a href="https://trae.ai/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm break-all">https://trae.ai/</a>
                      </div>

                      <div>
                        <p className="text-white/90 mb-2">WorkBuddy AI：</p>
                        <a href="https://www.workbuddy.cn/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm break-all">https://www.workbuddy.cn/</a>
                      </div>

                      <div>
                        <p className="text-white/90 mb-2">Codex：</p>
                        <a href="https://chatgpt.com/codex" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm break-all">https://chatgpt.com/codex</a>
                      </div>

                      <div>
                        <p className="text-white/90 mb-2">imsyy：</p>
                        <div className="flex flex-col space-y-1">
                          <a href="https://www.imsyy.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm break-all">https://www.imsyy.com/</a>
                          <a href="https://music.imsyy.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm break-all">https://music.imsyy.com/</a>
                       </div>
                     </div>
                     
                     <div className="pt-6 border-t border-white/10">
                       <h4 className="text-white text-lg font-medium mb-4">意见反馈</h4>
                        <button 
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 hover:shadow-lg"
                          onClick={() => {
                            setIsOtherModalOpen(false);
                            setIsFeedbackModalOpen(true);
                          }}
                        >
                         <i className="fa-solid fa-comment-dots mr-2"></i>提交意见反馈
                       </button>
                     </div>
                    </div>
                  </div>
                  
                </div>
                
                <p className="text-white/40 text-xs text-center mt-6">
                   点击外部区域或关闭按钮可关闭
                 </p>
               </div>
            </div>
          )}

          {/* 屏幕录制工具模态框 */}
          <ScreenRecorder 
            isOpen={isScreenRecorderOpen} 
            onClose={() => setIsScreenRecorderOpen(false)} 
          />

          {/* 安全软件模态框 */}
          <SecuritySoftware 
            isOpen={isSecuritySoftwareOpen} 
            onClose={() => setIsSecuritySoftwareOpen(false)} 
          />

          {/* 输入法模态框 */}
          <InputMethod 
            isOpen={isInputMethodOpen} 
            onClose={() => setIsInputMethodOpen(false)} 
          />

          {/* 办公软件模态框 */}
          <OfficeSoftware 
            isOpen={isOfficeSoftwareOpen} 
            onClose={() => setIsOfficeSoftwareOpen(false)} 
          />

          {/* 截图工具模态框 */}
          <ScreenshotTool 
            isOpen={isScreenshotToolOpen} 
            onClose={() => setIsScreenshotToolOpen(false)} 
          />

          {/* 压缩解压工具模态框 */}
          <CompressionTool 
            isOpen={isCompressionToolOpen} 
            onClose={() => setIsCompressionToolOpen(false)} 
          />

          {/* 本地视频播放器模态框 */}
          <VideoPlayer 
            isOpen={isVideoPlayerOpen} 
            onClose={() => setIsVideoPlayerOpen(false)} 
          />

          {/* 系统清理优化工具模态框 */}
          <SystemCleaner 
            isOpen={isSystemCleanerOpen} 
            onClose={() => setIsSystemCleanerOpen(false)} 
          />

          {/* 桌面美化工具模态框 */}
          <DesktopBeautify 
            isOpen={isDesktopBeautifyOpen} 
            onClose={() => setIsDesktopBeautifyOpen(false)} 
          />

          {/* 其他工具模态框 */}
          {isOtherToolsModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* 背景遮罩 */}
              <div 
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={() => setIsOtherToolsModalOpen(false)}
              ></div>
              
              {/* Modal content */}
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/15 w-full max-w-md shadow-2xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-white/10">
                  <h3 className="text-white text-xl font-semibold">其他工具</h3>
                  <button 
                    onClick={() => setIsOtherToolsModalOpen(false)}
                    className="text-white/60 hover:text-white transition-colors"
                    aria-label="关闭"
                  >
                    <i className="fa-solid fa-times text-lg"></i>
                  </button>
                </div>
                
                {/* 内容区域 - 可滚动 */}
                <div className="p-6 space-y-3 overflow-y-auto flex-1">
                  <a 
                    href="https://calc.kafuchino.top/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block w-full bg-white/15 hover:bg-white/25 hover:shadow-lg transition-all duration-300 p-4 rounded-xl text-white text-left font-medium"
                    onClick={() => setIsOtherToolsModalOpen(false)}
                  >
                    <i className="fa-solid fa-calculator mr-2 text-yellow-400"></i>kafuchino 函数计算器
                    <p className="text-white/50 text-xs mt-1">强大的在线函数计算工具</p>
                  </a>
                  
                  <a 
                    href="https://wstools.top/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block w-full bg-white/15 hover:bg-white/25 hover:shadow-lg transition-all duration-300 p-4 rounded-xl text-white text-left font-medium"
                    onClick={() => setIsOtherToolsModalOpen(false)}
                  >
                    <i className="fa-solid fa-tools mr-2 text-green-400"></i>万事通在线工具箱
                    <p className="text-white/50 text-xs mt-1">集成多种实用小工具</p>
                  </a>
                  
                  <a 
                    href="https://www.fly63.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block w-full bg-white/15 hover:bg-white/25 hover:shadow-lg transition-all duration-300 p-4 rounded-xl text-white text-left font-medium"
                    onClick={() => setIsOtherToolsModalOpen(false)}
                  >
                    <i className="fa-solid fa-globe mr-2 text-blue-400"></i>fly63 知识库
                    <p className="text-white/50 text-xs mt-1">技术知识分享平台</p>
                  </a>
                  
                  <a 
                    href="https://kaifa.baidu.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block w-full bg-white/15 hover:bg-white/25 hover:shadow-lg transition-all duration-300 p-4 rounded-xl text-white text-left font-medium"
                    onClick={() => setIsOtherToolsModalOpen(false)}
                  >
                    <i className="fa-solid fa-code mr-2 text-purple-400"></i>百度开发者中心
                    <p className="text-white/50 text-xs mt-1">百度官方开发者资源</p>
                  </a>
                </div>
                
                <p className="text-white/40 text-xs text-center pb-4">
                  点击外部区域或关闭按钮可关闭
                </p>
              </div>
            </div>
          )}

          {/* 学习模态框 */}
          {isStudyModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* 背景遮罩 */}
              <div 
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={() => setIsStudyModalOpen(false)}
              ></div>
              
              {/* 模态框内容 */}
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/15 p-6 w-full max-w-md shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-white text-xl font-semibold">学习资源</h3>
                  <button 
                    onClick={() => setIsStudyModalOpen(false)}
                    className="text-white/60 hover:text-white transition-colors"
                    aria-label="关闭"
                  >
                    <i className="fa-solid fa-times text-lg"></i>
                  </button>
                </div>
                
                    <div className="space-y-4">
                        <a 
                          href="https://calc.kafuchino.top/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block w-full bg-white/15 hover:bg-white/25 hover:shadow-lg transition-all duration-300 p-4 rounded-xl text-white text-left font-medium"
                          onClick={() => setIsStudyModalOpen(false)}
                        >
                          <i className="fa-solid fa-calculator mr-2"></i>函数计算器
                       </a>
                       
                       <a 
                         href="https://fanyi.youdao.com/" 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="block w-full bg-white/15 hover:bg-white/25 hover:shadow-lg transition-all duration-300 p-4 rounded-xl text-white text-left font-medium"
                         onClick={() => setIsStudyModalOpen(false)}
                       >
                         <i className="fa-solid fa-language mr-2"></i>有道翻译
                       </a>
                    </div>
                
                <p className="text-white/40 text-xs text-center mt-6">
                  点击外部区域或关闭按钮可关闭
                </p>
              </div>
            </div>
          )}
          {/* 时间胶囊模态框 */}
          {isTimeCapsuleModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* 背景遮罩 */}
              <div 
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={() => setIsTimeCapsuleModalOpen(false)}
              ></div>
              
              {/* 模态框内容 */}
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/15 p-6 w-full max-w-md shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-white text-xl font-semibold">时间胶囊</h3>
                  <button 
                    onClick={() => setIsTimeCapsuleModalOpen(false)}
                    className="text-white/60 hover:text-white transition-colors"
                    aria-label="关闭"
                  >
                    <i className="fa-solid fa-times text-lg"></i>
                  </button>
                </div>
                
                <div className="space-y-6 text-white">
                  <div>
                    <p className="text-white/90 mb-2">今日已经度过了 {Math.floor(currentTime.getHours())} 小时</p>
                    <div className="w-full bg-white/10 rounded-full h-2.5 mb-1">
                      <div 
                        className="bg-blue-500 h-2.5 rounded-full" 
                        style={{ width: `${timeProgress.daily}%` }}
                      ></div>
                    </div>
                    <p className="text-right text-sm text-white/70">{timeProgress.daily}%</p>
                  </div>
                  
                  <div>
                    <p className="text-white/90 mb-2">本周已经度过了 {currentTime.getDay() || 7} 天</p>
                    <div className="w-full bg-white/10 rounded-full h-2.5 mb-1">
                      <div 
                        className="bg-blue-500 h-2.5 rounded-full" 
                        style={{ width: `${timeProgress.weekly}%` }}
                      ></div>
                    </div>
                    <p className="text-right text-sm text-white/70">{timeProgress.weekly}%</p>
                  </div>
                  
                  <div>
                    <p className="text-white/90 mb-2">本月已经度过了 {currentTime.getDate()} 天</p>
                    <div className="w-full bg-white/10 rounded-full h-2.5 mb-1">
                      <div 
                        className="bg-blue-500 h-2.5 rounded-full" 
                        style={{ width: `${timeProgress.monthly}%` }}
                      ></div>
                    </div>
                    <p className="text-right text-sm text-white/70">{timeProgress.monthly}%</p>
                  </div>
                  
                  <div>
                    <p className="text-white/90 mb-2">今年已经度过了 {currentTime.getMonth() + 1} 个月</p>
                    <div className="w-full bg-white/10 rounded-full h-2.5 mb-1">
                      <div 
                        className="bg-blue-500 h-2.5 rounded-full" 
                        style={{ width: `${timeProgress.yearly}%` }}
                      ></div>
                    </div>
                    <p className="text-right text-sm text-white/70">{timeProgress.yearly}%</p>
                  </div>
                  
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-white/90">本站已经运行了 {siteRuntime}</p>
                  </div>
                </div>
                
                <p className="text-white/40 text-xs text-center mt-6">
                  点击外部区域或关闭按钮可关闭
                </p>
              </div>
            </div>
          )}
          
           {/* 实用工具模态框 */}
           {isUtilityModalOpen && (
             <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
               {/* 背景遮罩 */}
               <div 
                 className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                 onClick={() => setIsUtilityModalOpen(false)}
               ></div>
               
               {/* 模态框内容 */}
               <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/15 w-full max-w-4xl shadow-2xl overflow-hidden">
                 {/* 标题栏 */}
                 <div className="flex justify-between items-center px-8 py-4 border-b border-white/10 bg-black/30">
                   <h3 className="text-white text-2xl font-semibold">实用工具</h3>
                   <button 
                     onClick={() => setIsUtilityModalOpen(false)}
                     className="text-white/60 hover:text-white transition-colors"
                     aria-label="关闭"
                   >
                     <i className="fa-solid fa-times text-2xl"></i>
                   </button>
                 </div>
                 
                 {/* 工具卡片 */}
                 <div className="p-8">
                   {/* 第一排 */}
                   <div className="grid grid-cols-5 gap-6 mb-6">
                     <button 
                       onClick={() => {
                         setIsUtilityModalOpen(false);
                         setIsScreenRecorderOpen(true);
                       }}
                       className="flex flex-col items-center gap-3 p-5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-all duration-300 hover:scale-[1.02]"
                     >
                       <i className="fa-solid fa-video text-4xl text-red-400"></i>
                       <span className="text-white/80 text-base">屏幕录制</span>
                     </button>
                     <button 
                       onClick={() => {
                         setIsUtilityModalOpen(false);
                         setIsSecuritySoftwareOpen(true);
                       }}
                       className="flex flex-col items-center gap-3 p-5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-xl transition-all duration-300 hover:scale-[1.02]"
                     >
                       <i className="fa-solid fa-shield-halved text-4xl text-green-400"></i>
                       <span className="text-white/80 text-base">安全软件</span>
                     </button>
                     <button 
                       onClick={() => {
                         setIsUtilityModalOpen(false);
                         setIsInputMethodOpen(true);
                       }}
                       className="flex flex-col items-center gap-3 p-5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl transition-all duration-300 hover:scale-[1.02]"
                     >
                       <i className="fa-solid fa-keyboard text-4xl text-blue-400"></i>
                       <span className="text-white/80 text-base">输入法</span>
                     </button>
                     <button 
                       onClick={() => {
                         setIsUtilityModalOpen(false);
                         setIsOfficeSoftwareOpen(true);
                       }}
                       className="flex flex-col items-center gap-3 p-5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-xl transition-all duration-300 hover:scale-[1.02]"
                     >
                       <i className="fa-solid fa-briefcase text-4xl text-purple-400"></i>
                       <span className="text-white/80 text-base">办公软件</span>
                     </button>
                     <button 
                       onClick={() => {
                         setIsUtilityModalOpen(false);
                         setIsScreenshotToolOpen(true);
                       }}
                       className="flex flex-col items-center gap-3 p-5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-xl transition-all duration-300 hover:scale-[1.02]"
                     >
                       <i className="fa-solid fa-camera text-4xl text-cyan-400"></i>
                       <span className="text-white/80 text-base">截图工具</span>
                     </button>
                   </div>
                   {/* 第二排 */}
                   <div className="grid grid-cols-5 gap-6">
                     <button 
                       onClick={() => {
                         setIsUtilityModalOpen(false);
                         setIsCompressionToolOpen(true);
                       }}
                       className="flex flex-col items-center gap-3 p-5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl transition-all duration-300 hover:scale-[1.02]"
                     >
                       <i className="fa-solid fa-file-zipper text-4xl text-amber-400"></i>
                       <span className="text-white/80 text-base">压缩解压</span>
                     </button>
                     <button 
                       onClick={() => {
                         setIsUtilityModalOpen(false);
                         setIsVideoPlayerOpen(true);
                       }}
                       className="flex flex-col items-center gap-3 p-5 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/20 rounded-xl transition-all duration-300 hover:scale-[1.02]"
                     >
                       <i className="fa-solid fa-play text-4xl text-pink-400"></i>
                       <span className="text-white/80 text-base">视频播放器</span>
                     </button>
                     <button 
                       onClick={() => {
                         setIsUtilityModalOpen(false);
                         setIsSystemCleanerOpen(true);
                       }}
                       className="flex flex-col items-center gap-3 p-5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl transition-all duration-300 hover:scale-[1.02]"
                     >
                       <i className="fa-solid fa-broom text-4xl text-emerald-400"></i>
                       <span className="text-white/80 text-base">系统清理</span>
                     </button>
                     <button 
                       onClick={() => {
                         setIsUtilityModalOpen(false);
                         setIsDesktopBeautifyOpen(true);
                       }}
                       className="flex flex-col items-center gap-3 p-5 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 rounded-xl transition-all duration-300 hover:scale-[1.02]"
                     >
                       <i className="fa-solid fa-palette text-4xl text-violet-400"></i>
                       <span className="text-white/80 text-base">桌面美化</span>
                     </button>
                     <button 
                       onClick={() => {
                         setIsUtilityModalOpen(false);
                         setIsOtherToolsModalOpen(true);
                       }}
                       className="flex flex-col items-center gap-3 p-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-300 hover:scale-[1.02]"
                     >
                       <i className="fa-solid fa-toolbox text-4xl text-white/60"></i>
                       <span className="text-white/80 text-base">其他工具</span>
                     </button>
                   </div>
                 </div>
                 
                 <p className="text-white/40 text-xs text-center pb-4">
                   点击外部区域或关闭按钮也可关闭
                 </p>
               </div>
             </div>
           )}
           
            {/* AI工具模态框 */}
            <AITools 
              isOpen={isAIToolsModalOpen} 
              onClose={() => setIsAIToolsModalOpen(false)} 
            />
            
               </main>

              {/* 假期日历模态框 */}
              <HolidayCalendar 
                isOpen={isHolidayCalendarOpen} 
                onClose={() => setIsHolidayCalendarOpen(false)} 
              />

              {/* 显卡天梯图模态框 */}
              <GPUTierChart 
                isOpen={isGPUTierChartOpen} 
                onClose={() => setIsGPUTierChartOpen(false)} 
              />

              {/* 今日热榜模态框 */}
              <HotBoard
                isOpen={isHotBoardOpen}
                onClose={() => setIsHotBoardOpen(false)}
              />

              {/* 贪吃蛇彩蛋提示 */}
              <AnimatePresence>
                {showSnakeHint && (
                  <motion.div
                    className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.div
                      className="bg-black/80 backdrop-blur-md px-12 py-8 rounded-2xl border border-green-500/30 shadow-2xl"
                      initial={{ scale: 0.8, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.8, y: 20 }}
                      transition={{ type: "spring", damping: 20 }}
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <motion.div
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 0.5, repeat: 2 }}
                          className="text-5xl"
                        >
                          🐍
                        </motion.div>
                        <div>
                          <p className="text-2xl font-bold text-green-400">彩蛋二</p>
                          <p className="text-white/80 text-lg">贪吃蛇游戏</p>
                        </div>
                      </div>
                      <motion.div
                        className="h-1 bg-green-500 rounded-full overflow-hidden"
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 1.5, ease: "linear" }}
                      />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 贪吃蛇游戏 */}
              <SnakeGame
                isOpen={isSnakeGameOpen}
                onClose={() => setIsSnakeGameOpen(false)}
              />

              {/* 彩蛋一：版本号彩蛋弹窗 */}
              <AnimatePresence>
                {showEasterEgg && (
                  <motion.div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div
                      className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                      onClick={() => setShowEasterEgg(false)}
                    ></div>
                    <motion.div
                      className="relative bg-gradient-to-br from-purple-600/30 to-pink-600/30 backdrop-blur-xl rounded-2xl border border-yellow-400/40 p-8 w-full max-w-md shadow-2xl text-center"
                      initial={{ scale: 0.5, y: 30, rotate: -5 }}
                      animate={{ scale: 1, y: 0, rotate: 0 }}
                      exit={{ scale: 0.5, y: 30, opacity: 0 }}
                      transition={{ type: "spring", damping: 15 }}
                    >
                      <button
                        className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
                        onClick={() => setShowEasterEgg(false)}
                        aria-label="关闭"
                      >
                        <i className="fa-solid fa-times text-lg"></i>
                      </button>
                      <motion.div
                        animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
                        className="text-7xl mb-4"
                      >
                        🎉
                      </motion.div>
                      <p className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mb-3">彩蛋一</p>
                      <p className="text-white/90 text-lg mb-2">恭喜你发现了隐藏彩蛋！</p>
                      <p className="text-white/70 text-sm mb-6">你是个善于探索的人，连续点击版本号5次解锁了这个秘密~</p>
                      <p className="text-white/50 text-xs mb-6">提示：还有另一个彩蛋哦，试试按下方向键 ↑ ↓ ← →</p>
                      <button
                        className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-medium py-2 px-8 rounded-full transition-all duration-300 hover:shadow-lg hover:scale-105"
                        onClick={() => setShowEasterEgg(false)}
                      >
                        太棒了！
                      </button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 番茄钟 */}
              <PomodoroTimer
                isOpen={isPomodoroTimerOpen}
                onClose={() => setIsPomodoroTimerOpen(false)}
              />

              {/* 随机决策器 */}
              <RandomDecision
                isOpen={isRandomDecisionOpen}
                onClose={() => setIsRandomDecisionOpen(false)}
              />

              {/* 留言板 */}
              <Guestbook
                isOpen={isGuestbookOpen}
                onClose={() => setIsGuestbookOpen(false)}
              />

               {/* 左下角版本号 - 与版本动画无缝衔接 */}
   <div
     onClick={handleVersionClick}
     title="版本号"
     className={`version-badge fixed bottom-6 left-6 text-4xl font-black transform -rotate-12 z-20 transition-all duration-500 cursor-pointer ${isAnyModalOpen && !isSnakeGameOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
     style={{
       background: 'linear-gradient(to right, #fb923c, #fcd34d, #fb923c)',
       WebkitBackgroundClip: 'text',
       WebkitTextFillColor: 'transparent',
       backgroundClip: 'text',
       textShadow: '0 0 20px rgba(251, 146, 60, 0.5)',
     }}
   >
     V4.1
   </div>

  {/* 液态玻璃说明入口（右下角，位于「返回首页」「更新日志」之上） */}
  <button
    type="button"
    onClick={() => setShowGlassInfo(true)}
    title="液态玻璃效果：查看说明与开关"
    aria-haspopup="dialog"
    className={`fixed bottom-36 right-6 z-[60] w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 ${
      liquidGlass && glassSupported
        ? 'bg-gradient-to-br from-sky-400 to-cyan-500 text-white shadow-sky-500/30'
        : 'bg-black/55 text-white/45 border border-white/20'
    } ${isAnyModalOpen && !isSnakeGameOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
  >
    <i className={`fa-solid fa-droplet ${liquidGlass && glassSupported ? '' : 'opacity-60'}`}></i>
  </button>

  {/* 液态玻璃说明弹窗：水滴按钮与更新记录里的链接都会打开它 */}
  {showGlassInfo && (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      onClick={() => setShowGlassInfo(false)}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/15 bg-slate-900/95 p-5 shadow-2xl shadow-black/50 backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="液态玻璃效果说明"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/60 to-transparent" />

        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
              <i className="fa-solid fa-droplet text-sky-400"></i>
              液态玻璃效果
            </h3>
            <p className="mt-1 text-[11px] tracking-wide text-white/40">关于这个效果的说明</p>
          </div>
          <button
            type="button"
            onClick={() => setShowGlassInfo(false)}
            aria-label="关闭"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/40 transition-all hover:bg-white/10 hover:text-white"
          >
            <i className="fa-solid fa-times"></i>
          </button>
        </div>

        <p className="text-xs leading-relaxed text-white/70">
          功能按钮会真实折射背后的画面（不是简单模糊），边缘有一圈可见的弯曲，并带上缘镜面高光。
        </p>

        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
          <p className="mb-2 text-[11px] font-medium tracking-wide text-white/50">使用条件</p>
          <ul className="space-y-2">
            {[
              '需要 Chrome / Edge 等支持「backdrop-filter 引用 SVG 滤镜」的浏览器',
              'Safari 与 Firefox 暂不支持，会自动退化为普通毛玻璃',
              '折射效果依赖背景内容，纯色背景下基本看不出来',
            ].map((t) => (
              <li key={t} className="flex gap-2 text-xs leading-relaxed text-white/60">
                <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-sky-400/70" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3">
          <div>
            <p className="text-sm text-white/90">开启液态玻璃</p>
            <p className="mt-0.5 text-[11px] text-white/40">
              {glassSupported ? '关闭后按钮会变回普通毛玻璃' : '当前浏览器不支持真折射，无法开启'}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={liquidGlass && glassSupported}
            disabled={!glassSupported}
            onClick={toggleLiquidGlass}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300 ${
              liquidGlass && glassSupported ? 'bg-sky-500' : 'bg-white/15'
            } ${glassSupported ? '' : 'cursor-not-allowed opacity-50'}`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-md transition-all duration-300 ${
                liquidGlass && glassSupported ? 'left-6' : 'left-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  )}

            {/* 意见反馈弹窗 */}
            {isFeedbackModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* 背景遮罩 */}
                <div 
                  className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                  onClick={() => setIsFeedbackModalOpen(false)}
                ></div>
                
                {/* 弹窗内容 */}
                <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/15 p-8 w-full max-w-md shadow-2xl transform transition-all duration-300 scale-100">
                  <button 
                    className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
                    onClick={() => setIsFeedbackModalOpen(false)}
                    aria-label="关闭"
                  >
                    <i className="fa-solid fa-times text-lg"></i>
                  </button>
                  
                  <div className="text-center py-6">
                    <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <i className="fa-solid fa-envelope text-blue-400 text-2xl"></i>
                    </div>
                    
                    <h3 className="text-white text-xl font-semibold mb-4">意见反馈</h3>
                    
                    <p className="text-white/90 text-base mb-6 leading-relaxed">
                      请通过 lyjy0505@qq.com 联系我，<br />感谢您的宝贵意见
                    </p>
                    
                    <button 
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-all duration-300 hover:shadow-lg"
                      onClick={() => setIsFeedbackModalOpen(false)}
                    >
                      我知道了
                    </button>
                  </div>
                </div>
              </div>
            )}
            
             {/* 传送门警告弹窗 */}
             {isPortalWarningOpen && (
               <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                 {/* 背景遮罩 */}
                 <div 
                   className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                   onClick={cancelPortalNavigation}
                 ></div>
                 
                 {/* 弹窗内容 */}
                 <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/15 p-8 w-full max-w-md shadow-2xl transform transition-all duration-300 scale-100">
                   <button 
                     className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
                     onClick={cancelPortalNavigation}
                     aria-label="关闭"
                   >
                     <i className="fa-solid fa-times text-lg"></i>
                   </button>
                   
                   <div className="text-center py-6">
                     <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                       <i className="fa-solid fa-exclamation-triangle text-yellow-400 text-2xl"></i>
                     </div>
                     
                     <h3 className="text-white text-xl font-semibold mb-4">安全提示</h3>
                     
                     <p className="text-white/90 text-base mb-6 leading-relaxed">
                       您即将前往任意网站，请注意保护好您的财产安全
                     </p>
                     
                     <p className="text-white/70 text-sm mb-8">
                       将在 <span className="text-yellow-400 font-medium">{portalCountdown}</span> 秒后自动前往
                     </p>
                     
                     <div className="flex justify-center gap-4">
                       <button 
                         className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-6 rounded-lg transition-all duration-300 hover:shadow-lg"
                         onClick={cancelPortalNavigation}
                       >
                         取消
                       </button>
                       <button 
                         className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-all duration-300 hover:shadow-lg"
                         onClick={confirmPortalNavigation}
                       >
                         前往
                       </button>
                     </div>
                   </div>
                 </div>
               </div>
             )}
   


          {/* 底部社交链接 */}

           <button 
  onClick={() => setIsUpdateLogOpen(true)}
  className={`social-link fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg z-50 transition-all duration-300 hover:scale-110 ${isAnyModalOpen && !isSnakeGameOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
  aria-label="查看更新日志"
>
  <i className="fa-solid fa-history"></i>
</button>

          {/* 返回首页按钮 */}
          <Link
            href="/"
            className={`fixed bottom-20 right-6 z-50 w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg hover:scale-110 transition-all duration-300 flex items-center justify-center ${isAnyModalOpen && !isSnakeGameOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            title="返回首页"
          >
            <i className="fa-solid fa-house text-white"></i>
          </Link>

          <footer className={`footer-container relative z-10 bg-black/40 text-white py-6 px-4 backdrop-blur-sm transition-all duration-300 ${isAnyModalOpen && !isSnakeGameOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <div className="container mx-auto flex justify-center space-x-6">
             {socialItems.map(item => (
                 <a 
                   key={item.id}
                   href={item.url}
                   className="social-link text-white/60 hover:text-white transition-colors hover:scale-110 duration-300"
                   aria-label={item.name}
                   target={item.name === '抖音' || item.name === 'GitHub' ? '_blank' : undefined}
                   rel={(item.name === '抖音' || item.name === 'GitHub') ? 'noopener noreferrer' : undefined}
                 >
                   <i className={item.icon}></i>
                 </a>
             ))}
       </div>
       

       </footer>
     </div>
   );
}