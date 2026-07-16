'use client';

import React from 'react';
import Link from 'next/link';
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from 'framer-motion';

type SearchEngine = "baidu" | "bing" | "google" | "yandex" | "doubao" | "tongyi" | "duckduckgo" | "sogou" | "so" | "zhihu" | "bilibili" | "github" | "douyin" | "xiaohongshu" | "scholar" | "metaso" | "yahoo" | "kaifa" | "taobao" | "weibo" | "douban" | "toutiao" | "naver" | "mdn" | "stackoverflow" | "jd";
type Category = 'news' | 'shopping' | 'entertainment' | 'tools' | 'design' | 'dev' | 'games';

// 网站应用类型定义
interface App {
  id: string;
  name: string;
  url: string;
  icon: string; // FontAwesome 图标名称
  color: string; // 图标背景颜色
}

// 文件夹类型定义
interface Folder {
  id: Category;
  name: string;
  icon: string;
  apps: App[];
}

const searchEngines: Record<string, {
    name: string;
    url: string;
    param: string;
    color: string;
    ringColor: string;
    bgColor: string;
    icon: string;
    tag: string;
    featured?: boolean;
    aiSearch?: boolean;
}> = {
    bing: {
        name: "必应",
        url: "https://www.bing.com/search",
        param: "q",
        color: "from-blue-500 to-blue-600",
        ringColor: "rgba(37, 99, 235, 0.5)",
        bgColor: "#2563eb",
        icon: "fa-solid fa-magnifying-glass",
        tag: "",
        featured: true
    },
    google: {
        name: "谷歌",
        url: "https://www.google.com/search",
        param: "q",
        color: "from-red-500 to-orange-500",
        ringColor: "rgba(239, 68, 68, 0.5)",
        bgColor: "#ef4444",
        icon: "fa-brands fa-google",
        tag: "",
        featured: true
    },
    baidu: {
        name: "百度",
        url: "https://www.baidu.com/s",
        param: "wd",
        color: "from-sky-500 to-blue-600",
        ringColor: "rgba(14, 165, 233, 0.5)",
        bgColor: "#0ea5e9",
        icon: "fa-solid fa-paw",
        tag: "",
        featured: true
    },
    yandex: {
        name: "Yandex",
        url: "https://yandex.com/search",
        param: "text",
        color: "from-amber-500 to-red-500",
        ringColor: "rgba(245, 158, 11, 0.5)",
        bgColor: "#f59e0b",
        icon: "fa-solid fa-globe",
        tag: "",
        featured: true
    },
    duckduckgo: {
        name: "DuckDuckGo",
        url: "https://duckduckgo.com",
        param: "q",
        color: "from-orange-500 to-amber-500",
        ringColor: "rgba(249, 115, 22, 0.5)",
        bgColor: "#f97316",
        icon: "fa-solid fa-feather",
        tag: "",
        featured: true
    },
    doubao: {
        name: "豆包",
        url: "https://www.doubao.com/chat/",
        param: "q",
        aiSearch: true,
        color: "from-emerald-500 to-teal-500",
        ringColor: "rgba(16, 185, 129, 0.5)",
        bgColor: "#10b981",
        icon: "fa-solid fa-comments",
        tag: "AI",
        featured: true
    },
    tongyi: {
        name: "通义千问",
        url: "https://tongyi.aliyun.com/qianwen/",
        param: "q",
        aiSearch: true,
        color: "from-indigo-500 to-purple-500",
        ringColor: "rgba(99, 102, 241, 0.5)",
        bgColor: "#6366f1",
        icon: "fa-solid fa-sparkles",
        tag: "AI",
        featured: true
    },
    sogou: {
        name: "搜狗",
        url: "https://www.sogou.com/sogou",
        param: "query",
        color: "from-orange-500 to-red-500",
        ringColor: "rgba(249, 115, 22, 0.5)",
        bgColor: "#f97316",
        icon: "fa-solid fa-s",
        tag: ""
    },
    so: {
        name: "综合搜索",
        url: "https://www.so.com/s",
        param: "q",
        color: "from-blue-500 to-cyan-500",
        ringColor: "rgba(59, 130, 246, 0.5)",
        bgColor: "#3b82f6",
        icon: "fa-solid fa-search",
        tag: ""
    },
    zhihu: {
        name: "知乎",
        url: "https://www.zhihu.com/search",
        param: "type=content&q",
        color: "from-blue-500 to-blue-600",
        ringColor: "rgba(59, 130, 246, 0.5)",
        bgColor: "#3b82f6",
        icon: "fa-solid fa-circle-info",
        tag: ""
    },
    bilibili: {
        name: "哔哩哔哩",
        url: "https://search.bilibili.com/all",
        param: "keyword",
        color: "from-pink-500 to-purple-500",
        ringColor: "rgba(236, 72, 153, 0.5)",
        bgColor: "#ec4899",
        icon: "fa-brands fa-bilibili",
        tag: ""
    },
    github: {
        name: "GitHub",
        url: "https://github.com/search",
        param: "q",
        color: "from-gray-700 to-gray-900",
        ringColor: "rgba(31, 41, 55, 0.5)",
        bgColor: "#1f2937",
        icon: "fa-brands fa-github",
        tag: ""
    },
    douyin: {
        name: "抖音",
        url: "https://www.douyin.com/search",
        param: "s",
        color: "from-red-500 to-pink-500",
        ringColor: "rgba(239, 68, 68, 0.5)",
        bgColor: "#ef4444",
        icon: "fa-brands fa-tiktok",
        tag: ""
    },
    xiaohongshu: {
        name: "小红书",
        url: "https://www.xiaohongshu.com/search",
        param: "keyword",
        color: "from-pink-500 to-rose-500",
        ringColor: "rgba(236, 72, 153, 0.5)",
        bgColor: "#ec4899",
        icon: "fa-solid fa-book-open",
        tag: ""
    },
    scholar: {
        name: "Google Scholar",
        url: "https://scholar.google.com/scholar",
        param: "q",
        color: "from-blue-500 to-cyan-500",
        ringColor: "rgba(59, 130, 246, 0.5)",
        bgColor: "#3b82f6",
        icon: "fa-solid fa-graduation-cap",
        tag: ""
    },
    metaso: {
        name: "秘塔AI",
        url: "https://metaso.cn/",
        param: "q",
        aiSearch: true,
        color: "from-blue-500 to-indigo-500",
        ringColor: "rgba(59, 130, 246, 0.5)",
        bgColor: "#3b82f6",
        icon: "fa-solid fa-brain",
        tag: "AI"
    },
    yahoo: {
        name: "Yahoo",
        url: "https://hk.search.yahoo.com/search",
        param: "p",
        color: "from-purple-500 to-pink-500",
        ringColor: "rgba(147, 51, 234, 0.5)",
        bgColor: "#9333ea",
        icon: "fa-brands fa-yahoo",
        tag: ""
    },
    kaifa: {
        name: "开发者搜索",
        url: "https://kaifa.baidu.com/searchPage",
        param: "wd",
        color: "from-blue-500 to-cyan-500",
        ringColor: "rgba(59, 130, 246, 0.5)",
        bgColor: "#3b82f6",
        icon: "fa-solid fa-code",
        tag: ""
    },
    taobao: {
        name: "淘宝",
        url: "https://ai.taobao.com/search/index.htm",
        param: "q",
        color: "from-orange-500 to-red-500",
        ringColor: "rgba(249, 115, 22, 0.5)",
        bgColor: "#f97316",
        icon: "fa-brands fa-shopify",
        tag: ""
    },
    weibo: {
        name: "微博",
        url: "https://s.weibo.com/weibo",
        param: "q",
        color: "from-red-500 to-orange-500",
        ringColor: "rgba(239, 68, 68, 0.5)",
        bgColor: "#ef4444",
        icon: "fa-brands fa-weibo",
        tag: ""
    },
    douban: {
        name: "豆瓣",
        url: "https://www.douban.com/search",
        param: "q",
        color: "from-green-500 to-emerald-500",
        ringColor: "rgba(34, 197, 94, 0.5)",
        bgColor: "#22c55e",
        icon: "fa-solid fa-book",
        tag: ""
    },
    toutiao: {
        name: "头条搜索",
        url: "https://so.toutiao.com/search",
        param: "dvpf=pc",
        color: "from-orange-500 to-red-500",
        ringColor: "rgba(249, 115, 22, 0.5)",
        bgColor: "#f97316",
        icon: "fa-solid fa-newspaper",
        tag: ""
    },
    naver: {
        name: "NAVER",
        url: "https://search.naver.com/search.naver",
        param: "query",
        color: "from-green-500 to-emerald-500",
        ringColor: "rgba(34, 197, 94, 0.5)",
        bgColor: "#22c55e",
        icon: "fa-solid fa-n",
        tag: ""
    },
    mdn: {
        name: "MDN",
        url: "https://developer.mozilla.org/zh-CN/search",
        param: "q",
        color: "from-blue-600 to-blue-800",
        ringColor: "rgba(37, 99, 235, 0.5)",
        bgColor: "#2563eb",
        icon: "fa-solid fa-file-code",
        tag: ""
    },
    stackoverflow: {
        name: "StackOverflow",
        url: "https://stackoverflow.com/search",
        param: "q",
        color: "from-orange-500 to-amber-500",
        ringColor: "rgba(249, 115, 22, 0.5)",
        bgColor: "#f97316",
        icon: "fa-brands fa-stack-overflow",
        tag: ""
    },
    jd: {
        name: "京东",
        url: "https://search.jd.com/Search",
        param: "keyword",
        color: "from-red-500 to-red-600",
        ringColor: "rgba(239, 68, 68, 0.5)",
        bgColor: "#ef4444",
        icon: "fa-solid fa-shopping-cart",
        tag: ""
    }
};

// 定义各类文件夹和应用数据
const folders: Folder[] = [
  {
    id: 'news',
    name: '资讯',
    icon: 'fa-newspaper',
    apps: [
      { id: 'weibo', name: '微博', url: 'https://weibo.com', icon: 'fa-comment-dots', color: '#E6162D' },
      { id: 'zhihu', name: '知乎', url: 'https://zhihu.com', icon: 'fa-question-circle', color: '#0066FF' },
      { id: 'toutiao', name: '头条', url: 'https://www.toutiao.com', icon: 'fa-fire', color: '#FF6700' },
      { id: 'tieba', name: '贴吧', url: 'https://tieba.baidu.com', icon: 'fa-comments', color: '#00A0E9' },
      { id: '163', name: '网易新闻', url: 'https://news.163.com', icon: 'fa-newspaper', color: '#D81B60' },
      { id: 'sina', name: '新浪新闻', url: 'https://news.sina.com.cn', icon: 'fa-rss', color: '#D32F2F' },
      { id: '36kr', name: '36氪', url: 'https://36kr.com', icon: 'fa-chart-line', color: '#2196F3' },
      { id: 'huxiu', name: '虎嗅', url: 'https://www.huxiu.com', icon: 'fa-lightbulb', color: '#FF9800' },
    ]
  },
  {
    id: 'shopping',
    name: '购物',
    icon: 'fa-shopping-cart',
    apps: [
      { id: 'taobao', name: '淘宝', url: 'https://www.taobao.com', icon: 'fa-shopping-bag', color: '#FF5000' },
      { id: 'jd', name: '京东', url: 'https://www.jd.com', icon: 'fa-shopping-basket', color: '#E1251B' },
      { id: 'pdd', name: '拼多多', url: 'https://www.pinduoduo.com', icon: 'fa-tag', color: '#E02E24' },
      { id: 'suning', name: '苏宁', url: 'https://www.suning.com', icon: 'fa-thumbs-up', color: '#E40000' },
      { id: 'tmall', name: '天猫', url: 'https://www.tmall.com', icon: 'fa-star', color: '#FF0036' },
      { id: 'vip', name: '唯品会', url: 'https://www.vip.com', icon: 'fa-gem', color: '#FF69B4' },
      { id: 'amazon', name: '亚马逊', url: 'https://www.amazon.cn', icon: 'fa-amazon', color: '#FF9900' },
      { id: 'dianping', name: '大众点评', url: 'https://www.dianping.com', icon: 'fa-utensils', color: '#F37021' },
    ]
  },
  {
    id: 'entertainment',
    name: '影音',
    icon: 'fa-film',
    apps: [
      { id: 'iqiyi', name: '爱奇艺', url: 'https://www.iqiyi.com', icon: 'fa-play-circle', color: '#12B7F5' },
      { id: 'youku', name: '优酷', url: 'https://www.youku.com', icon: 'fa-video', color: '#FF6700' },
      { id: 'qqmusic', name: 'QQ音乐', url: 'https://y.qq.com', icon: 'fa-music', color: '#12B7F5' },
      { id: 'netease', name: '网易云', url: 'https://music.163.com', icon: 'fa-cloud', color: '#C20C0C' },
      { id: 'kugou', name: '酷狗', url: 'https://www.kugou.com', icon: 'fa-headphones', color: '#2BA1F7' },
      { id: 'kuwo', name: '酷我', url: 'https://www.kuwo.cn', icon: 'fa-compact-disc', color: '#FF69B4' },
      { id: 'douyu', name: '斗鱼', url: 'https://www.douyu.com', icon: 'fa-fish', color: '#FF5E00' },
      { id: 'huya', name: '虎牙', url: 'https://www.huya.com', icon: 'fa-paw', color: '#FB7299' },
    ]
  },
  {
    id: 'tools',
    name: '工具',
    icon: 'fa-tools',
    apps: [
      { id: 'fanyi', name: '翻译', url: 'https://fanyi.baidu.com', icon: 'fa-language', color: '#4385F5' },
      { id: 'calculator', name: '计算器', url: 'https://www.calculator.net', icon: 'fa-calculator', color: '#34A853' },
      { id: 'calendar', name: '日历', url: 'https://calendar.google.com', icon: 'fa-calendar-alt', color: '#FBBC04' },
      { id: 'notion', name: '笔记', url: 'https://www.notion.so', icon: 'fa-sticky-note', color: '#2E2E2E' },
      { id: 'wenku', name: '文库', url: 'https://wenku.baidu.com', icon: 'fa-book-open', color: '#FF6600' },
      { id: 'pdf', name: 'PDF转换', url: 'https://www.ilovepdf.com', icon: 'fa-file-pdf', color: '#E91E63' },
      { id: 'color', name: '取色器', url: 'https://colorhunt.co', icon: 'fa-palette', color: '#FF5722' },
      { id: 'json', name: 'JSON格式化', url: 'https://www.json.cn', icon: 'fa-code', color: '#00BCD4' },
      { id: 'base64', name: 'Base64', url: 'https://www.base64decode.org', icon: 'fa-hashtag', color: '#795548' },
      { id: 'image', name: '图片压缩', url: 'https://tinypng.com', icon: 'fa-compress', color: '#00E676' },
    ]
  },
  {
    id: 'design',
    name: '设计',
    icon: 'fa-paint-brush',
    apps: [
      { id: 'figma', name: 'Figma', url: 'https://www.figma.com', icon: 'fa-square', color: '#0ACF83' },
      { id: 'behance', name: 'Behance', url: 'https://www.behance.net', icon: 'fa-behance', color: '#053EFF' },
      { id: 'dribbble', name: 'Dribbble', url: 'https://dribbble.com', icon: 'fa-dribbble', color: '#EA4C89' },
      { id: 'canva', name: 'Canva', url: 'https://www.canva.com', icon: 'fa-heart', color: '#00C4CC' },
      { id: 'pinterest', name: 'Pinterest', url: 'https://www.pinterest.com', icon: 'fa-pinterest', color: '#E60023' },
      { id: 'adobe', name: 'Adobe', url: 'https://www.adobe.com', icon: 'fa-pen-nib', color: '#FF0000' },
      { id: 'unsplash', name: 'Unsplash', url: 'https://unsplash.com', icon: 'fa-camera', color: '#000000' },
      { id: 'iconfont', name: 'Iconfont', url: 'https://www.iconfont.cn', icon: 'fa-icons', color: '#FF3366' },
    ]
  },
  {
    id: 'dev',
    name: '开发',
    icon: 'fa-code',
    apps: [
      { id: 'github', name: 'GitHub', url: 'https://github.com', icon: 'fa-github', color: '#24292E' },
      { id: 'stackoverflow', name: 'StackOverflow', url: 'https://stackoverflow.com', icon: 'fa-stack-overflow', color: '#F58025' },
      { id: 'mdn', name: 'MDN', url: 'https://developer.mozilla.org', icon: 'fa-book', color: '#3C4146' },
      { id: 'npm', name: 'NPM', url: 'https://www.npmjs.com', icon: 'fa-box', color: '#CB3837' },
      { id: 'gitlab', name: 'GitLab', url: 'https://about.gitlab.com', icon: 'fa-gitlab', color: '#FC6D26' },
      { id: 'v2ex', name: 'V2EX', url: 'https://www.v2ex.com', icon: 'fa-users', color: '#FFFFFF' },
      { id: 'segmentfault', name: '思否', url: 'https://segmentfault.com', icon: 'fa-layer-group', color: '#00A3E0' },
      { id: 'juejin', name: '掘金', url: 'https://juejin.cn', icon: 'fa-compass', color: '#1E80FF' },
      { id: 'codepen', name: 'CodePen', url: 'https://codepen.io', icon: 'fa-codepen', color: '#000000' },
      { id: 'typescript', name: 'TypeScript', url: 'https://www.typescriptlang.org', icon: 'fa-file-code', color: '#3178C6' },
    ]
  },
  {
    id: 'games',
    name: '游戏',
    icon: 'fa-gamepad',
    apps: [
      { id: 'steam', name: 'Steam', url: 'https://store.steampowered.com', icon: 'fa-steam', color: '#1B2838' },
      { id: 'epic', name: 'Epic', url: 'https://www.epicgames.com', icon: 'fa-gamepad', color: '#2A2A2A' },
      { id: 'battlenet', name: '暴雪', url: 'https://www.blizzard.com', icon: 'fa-snowflake', color: '#00AEFF' },
      { id: 'riot', name: 'Riot', url: 'https://www.riotgames.com', icon: 'fa-trophy', color: '#E94B3C' },
      { id: 'taptap', name: 'TapTap', url: 'https://www.taptap.cn', icon: 'fa-mobile-alt', color: '#FF5722' },
      { id: 'gog', name: 'GOG', url: 'https://www.gog.com', icon: 'fa-star', color: '#86328A' },
      { id: 'itch', name: 'itch.io', url: 'https://itch.io', icon: 'fa-gamepad', color: '#FA5C5C' },
      { id: 'origin', name: 'Origin', url: 'https://www.origin.com', icon: 'fa-play', color: '#F56C2C' },
    ]
  }
];

export default function SearchPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedEngine, setSelectedEngine] = useState<SearchEngine>("bing");
    const [isFocused, setIsFocused] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [timeOfDay, setTimeOfDay] = useState("morning");
  const [showUpdateLog, setShowUpdateLog] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showAppGrid, setShowAppGrid] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Category[]>([]);
  const [appSearchQuery, setAppSearchQuery] = useState("");
  const [showTimeHint, setShowTimeHint] = useState(false);
  const dropdownWrapperRef = useRef<HTMLDivElement>(null);

  // 3秒后显示时间提示
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTimeHint(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // 10秒后自动隐藏提示（如果用户没有点击时间）
  useEffect(() => {
    let autoHideTimer: ReturnType<typeof setTimeout>;
    if (showTimeHint) {
      autoHideTimer = setTimeout(() => {
        setShowTimeHint(false);
      }, 10000);
    }
    return () => {
      if (autoHideTimer) {
        clearTimeout(autoHideTimer);
      }
    };
  }, [showTimeHint]);

  // 处理时间点击
  const handleTimeClick = () => {
    setShowAppGrid(!showAppGrid);
    setShowTimeHint(false); // 点击时间后隐藏提示
    // 点击时间时重置展开的文件夹
    if (!showAppGrid) {
      setExpandedFolders([]);
      setAppSearchQuery("");
    }
  };

  // 切换文件夹展开状态（单选模式）
  const toggleFolder = (folderId: Category) => {
    setExpandedFolders(prev =>
      prev.includes(folderId)
        ? [] // 如果已展开，则关闭所有
        : [folderId] // 否则只展开这一个
    );
  };

  // 处理网站点击
  const handleAppClick = (url: string) => {
    window.open(url, "_blank");
  };

  // 点击外部关闭搜索引擎下拉菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownWrapperRef.current && !dropdownWrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // 过滤文件夹和应用
  const filteredFolders = folders.filter(folder => {
    if (!appSearchQuery.trim()) return true;
    const searchLower = appSearchQuery.toLowerCase();
    // 搜索文件夹名称
    if (folder.name.toLowerCase().includes(searchLower)) return true;
    // 搜索文件夹内的应用
    return folder.apps.some(app =>
      app.name.toLowerCase().includes(searchLower)
    );
  });


    useEffect(() => {
        const hour = new Date().getHours();

        if (hour < 12) {
            setTimeOfDay("morning");
        } else if (hour < 18) {
            setTimeOfDay("afternoon");
        } else {
            setTimeOfDay("evening");
        }
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => {
            clearInterval(timer);
        };
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();

        if (!searchQuery.trim())
            return;

        const engine = searchEngines[selectedEngine];
        const searchUrl = new URL(engine.url);
        searchUrl.searchParams.set(engine.param, searchQuery);
        window.open(searchUrl.toString(), "_blank");
    };

    // AI引擎搜索时在页面内展示提示
    const isAIEngine = (searchEngines[selectedEngine] as { aiSearch?: boolean }).aiSearch;

    const getGreeting = () => {
        switch (timeOfDay) {
        case "morning":
            return "早上好";
        case "afternoon":
            return "下午好";
        case "evening":
            return "晚上好";
        default:
            return "你好";
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            {/* FontAwesome 图标 */}
            <link
              rel="stylesheet"
              href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
            />
            {/* 背景图 */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <div
                    className="absolute inset-0 bg-[url('https://coze-coding-project.tos.coze.site/coze_storage_7603202760753872959/image/generate_image_e1c63e9a-52b1-4720-a583-0dcee9b6728f.jpeg?sign=1804772530-8e5692a888-0-d85c70ce4b7715d716a4a54d83d85a18270642ea1b58aad935817558a6a46fdf')] bg-cover bg-center opacity-70"
                    aria-hidden="true"></div>
                <div
                    className="absolute inset-0"
                    style={{
                        background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.6) 100%)'
                    }}
                ></div>
            </div>
            {/* 主内容 */}
            <main
                className="flex-1 flex flex-col items-center justify-center relative z-10 px-4 py-8">
                {/* 自定义滚动条 */}
                <style>{`
            .custom-scrollbar::-webkit-scrollbar {
              width: 8px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: rgba(255, 255, 255, 0.05);
              border-radius: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: rgba(255, 255, 255, 0.2);
              border-radius: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: rgba(255, 255, 255, 0.3);
            }
          `}</style>
                <h2
                    className="text-[clamp(2rem,6vw,4rem)] font-medium mb-0.5 drop-shadow-lg text-white"
                    style={{
                        textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)"
                    }}>
                    lyjy的搜索起始页~
                </h2>
                <div className="flex items-center gap-4 mb-1">
                    <motion.p
                        className={`text-[clamp(1rem,2vw,1.25rem)] text-white cursor-pointer drop-shadow-lg relative ${showTimeHint ? 'animate-pulse' : ''}`}
                        style={{
                            fontSize: "72px",
                            textShadow: showTimeHint
                                ? "0 0 20px rgba(255, 255, 255, 0.8), 0 0 40px rgba(255, 255, 255, 0.6), 3px 3px 6px rgba(0, 0, 0, 0.9)"
                                : "3px 3px 6px rgba(0, 0, 0, 0.9)"
                        }}
                        onClick={handleTimeClick}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {currentTime.toLocaleTimeString("zh-CN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit"
                        })}
                    </motion.p>
                    {showTimeHint && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="relative inline-flex items-center justify-center px-2 py-1 z-50"
                        >
                            <svg
                                className="absolute inset-0 -left-1 -top-1 -right-1 -bottom-1"
                                width="220"
                                height="80"
                                viewBox="0 0 220 80"
                            >
                                <motion.ellipse
                                    cx="95"
                                    cy="32"
                                    rx="85"
                                    ry="28"
                                    fill="none"
                                    stroke="white"
                                    strokeWidth="3"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 1.5, ease: "easeInOut" }}
                                />
                            </svg>
                            <span
                                className="text-white text-lg font-medium drop-shadow-lg whitespace-nowrap relative z-10"
                                style={{
                                    textShadow: "2px 2px 4px rgba(0, 0, 0, 0.9)",
                                    marginLeft: "12px",
                                    marginTop: "8px"
                                }}
                            >
                                👆 点击时间试试
                            </span>
                        </motion.div>
                    )}
                </div>
                <h1
                    className="text-[clamp(2rem,5vw,3.5rem)] font-bold text-white mb-0.5 tracking-tight drop-shadow-lg"
                    style={{
                        textShadow: "3px 3px 6px rgba(0, 0, 0, 0.9)"
                    }}>
                    {getGreeting()}
                </h1>
                <p
                    className="text-[clamp(1rem,2vw,1.25rem)] text-white mb-1.5 drop-shadow-lg"
                    style={{
                        textShadow: "2px 2px 4px rgba(0, 0, 0, 0.9)"
                    }}>今天是 {new Date().toLocaleDateString("zh-CN", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                    })}
                </p>
                {/* 搜索框 */}
                <div className="w-full max-w-3xl">
                    <form onSubmit={handleSearch} className="relative">
                        <div
                            className={`relative w-full transition-all duration-300 ${isFocused ? "scale-[1.02]" : "scale-100"}`}
                        >
                            {/* 搜索输入框 */}
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                                placeholder={`用 ${searchEngines[selectedEngine].name} 搜索${isAIEngine ? '（AI将跳转新页面）' : '...'}`}
                                className={`
                                    w-full pl-6 pr-16 py-4 rounded-full
                                    bg-white/95 dark:bg-gray-800/95
                                    border border-gray-200 dark:border-gray-700
                                    shadow-[0_8px_30px_-8px_rgba(0,0,0,0.18),0_4px_10px_-3px_rgba(0,0,0,0.12)]
                                    focus:outline-none
                                    focus:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.28),0_4px_12px_-2px_rgba(0,0,0,0.14)]
                                    focus:scale-[1.01]
                                    transition-all duration-300
                                    text-gray-800 dark:text-white
                                    text-sm
                                    placeholder:text-gray-400 dark:placeholder:text-gray-500
                                `}
                                style={{
                                    boxShadow: isFocused
                                        ? `0 0 0 3px ${searchEngines[selectedEngine].ringColor}, 0 8px 30px -8px rgba(0,0,0,0.25)`
                                        : undefined
                                }}
                            />

                            {/* 搜索按钮 */}
                            <motion.button
                                type="submit"
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.92 }}
                                className={`
                                    absolute right-2 top-1/2 -translate-y-1/2
                                    w-9 h-9 rounded-full
                                    flex items-center justify-center
                                    shadow-lg hover:shadow-xl
                                    transition-all duration-300
                                    text-white
                                    bg-gradient-to-br ${searchEngines[selectedEngine].color}
                                `}
                            >
                                <i className="fa-solid fa-magnifying-glass text-sm"></i>
                            </motion.button>
                        </div>

                        {/* 搜索引擎横向选择栏 */}
                        <div className="mt-3 flex items-center justify-center gap-1.5 flex-wrap overflow-x-auto pb-1 custom-scrollbar">
                            {Object.entries(searchEngines)
                                .filter(([, engine]) => engine.featured)
                                .map(([key, engine]) => (
                                    <motion.button
                                        key={key}
                                        type="button"
                                        onClick={() => {
                                            if (key === "doubao") {
                                                window.open(engine.url, "_blank");
                                            } else {
                                                setSelectedEngine(key as SearchEngine);
                                            }
                                        }}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.92 }}
                                        className={`
                                            group relative flex items-center gap-1.5 px-3 py-1.5 rounded-full
                                            text-xs font-medium whitespace-nowrap
                                            transition-all duration-300
                                            ${selectedEngine === key
                                                ? `text-white shadow-lg bg-gradient-to-br ${engine.color}`
                                                : "text-gray-600 dark:text-gray-300 bg-white/70 dark:bg-gray-800/70 hover:bg-white dark:hover:bg-gray-700/80 border border-gray-200/60 dark:border-gray-700/60 shadow-sm hover:shadow-md"
                                            }
                                            ${key === "baidu" ? (selectedEngine === key ? "" : "hover:border-red-300/60 dark:hover:border-red-800/60") : ""}
                                        `}
                                    >
                                        <i className={`${engine.icon} ${selectedEngine === key ? "text-white" : ""}`}></i>
                                        <span>{engine.name}</span>
                                        {engine.tag && (
                                            <span className={`text-[8px] font-bold px-1 py-0.5 rounded-full uppercase ${
                                                selectedEngine === key
                                                    ? "bg-white/30 text-white"
                                                    : engine.color.includes("green") || engine.color.includes("emerald") || engine.color.includes("teal") || engine.color.includes("purple") || engine.color.includes("indigo")
                                                        ? "bg-white/60 text-gray-700"
                                                        : "bg-black/10 text-gray-700 dark:bg-white/20 dark:text-gray-200"
                                            }`}>
                                                {engine.tag}
                                            </span>
                                        )}
                                        {key === "baidu" && selectedEngine !== key && (
                                            <span className="text-[8px] font-bold text-red-500">⚠</span>
                                        )}
                                        {key === "google" && selectedEngine !== key && (
                                            <span className="text-[8px] font-bold text-amber-500">⚠</span>
                                        )}
                                    </motion.button>
                                ))}

                            {/* 更多按钮 */}
                            <div ref={dropdownWrapperRef} className="relative inline-block">
                            <motion.button
                                type="button"
                                onClick={() => setShowDropdown(!showDropdown)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.92 }}
                                className={`
                                    relative flex items-center gap-1.5 px-3 py-1.5 rounded-full
                                    text-xs font-medium whitespace-nowrap
                                    transition-all duration-300
                                    text-gray-600 dark:text-gray-300 bg-white/70 dark:bg-gray-800/70 hover:bg-white dark:hover:bg-gray-700/80 border border-gray-200/60 dark:border-gray-700/60 shadow-sm hover:shadow-md
                                `}
                            >
                                <i className="fa-solid fa-chevron-down text-[10px]"></i>
                                <span>更多</span>
                                <span className="text-[10px] text-gray-400 bg-gray-200 dark:bg-gray-700/50 px-1.5 py-0.5 rounded-full">
                                    {Object.keys(searchEngines).length - Object.values(searchEngines).filter(e => e.featured).length}
                                </span>
                            </motion.button>
                        </div>
                        </div>

                        {/* 更多引擎下拉菜单 - 横向排列 */}
                        <AnimatePresence>
                            {showDropdown && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                                    transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="relative">
                                        {/* 小三角指示器 */}
                                        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-white dark:bg-gray-800 border-l border-t border-gray-200/60 dark:border-gray-700/60"></div>

                                        <div className="relative rounded-xl bg-white/95 dark:bg-gray-800/95 border border-gray-200/60 dark:border-gray-700/60 shadow-[0_16px_48px_-4px_rgba(0,0,0,0.28),0_4px_12px_-2px_rgba(0,0,0,0.1)] overflow-hidden backdrop-blur-xl p-2">
                                            {/* 引擎横向网格 */}
                                            <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
                                                {Object.entries(searchEngines)
                                                    .filter(([key]) => !searchEngines[key as keyof typeof searchEngines]?.featured)
                                                    .map(([key, engine], idx) => (
                                                        <motion.button
                                                            key={key}
                                                            initial={{ opacity: 0, scale: 0.8 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            transition={{ delay: idx * 0.03 }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (key === "doubao") {
                                                                    window.open(engine.url, "_blank");
                                                                } else {
                                                                    setSelectedEngine(key as SearchEngine);
                                                                }
                                                                setShowDropdown(false);
                                                            }}
                                                            whileHover={{ scale: 1.08 }}
                                                            whileTap={{ scale: 0.92 }}
                                                            className={`
                                                                flex items-center gap-1.5 px-3 py-1.5 rounded-full
                                                                text-xs font-medium whitespace-nowrap
                                                                transition-all duration-300
                                                                ${selectedEngine === key
                                                                    ? `text-white shadow-lg bg-gradient-to-br ${engine.color}`
                                                                    : "text-gray-600 dark:text-gray-300 bg-gray-100/80 dark:bg-gray-700/80 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-200/60 dark:border-gray-600/60 hover:shadow-md"
                                                                }
                                                            `}
                                                        >
                                                            <i className={`${engine.icon.includes('fa-') ? engine.icon : 'fa-solid ' + engine.icon} ${selectedEngine === key ? "text-white" : ""}`}></i>
                                                            <span>{engine.name}</span>
                                                            {engine.tag && (
                                                                <span className={`text-[8px] font-bold px-1 py-0.5 rounded-full uppercase ${
                                                                    selectedEngine === key
                                                                        ? "bg-white/30 text-white"
                                                                        : "bg-black/10 text-gray-600 dark:bg-white/20 dark:text-gray-200"
                                                                }`}>
                                                                    {engine.tag}
                                                                </span>
                                                            )}
                                                        </motion.button>
                                                    ))}
                                            </div>

                                            {/* 底部装饰 */}
                                            <div className="h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 via-pink-500 to-orange-500"></div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </form>
                </div>
            </main>
            {/* 更新日志按钮 */}
            <div className="fixed bottom-24 right-6 z-40">
                <button
                    onClick={() => setShowUpdateLog(true)}
                    className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    aria-label="查看更新日志">
                    <i className="fa-solid fa-history"></i>
                </button>
            </div>
            {/* 更新日志弹窗 */}
            {showUpdateLog && <div
                className="fixed inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                <div
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto animate-in zoom-in-95 duration-300 border border-white/20 dark:border-gray-700/60">
                    <div
                        className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">更新日志</h3>
                        <button
                            onClick={() => setShowUpdateLog(false)}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                            aria-label="关闭">
                            <i className="fa-solid fa-times text-lg"></i>
                        </button>
                    </div>
                    <div className="p-5 space-y-6">
                        <div className="border-l-4 border-blue-500 pl-4 py-1">
                            <h4 className="font-semibold text-lg text-gray-800 dark:text-white">2026.7.11 更新 V2.2</h4>
                            <ul
                                className="list-disc pl-5 mt-2 space-y-1 text-gray-600 dark:text-gray-300">
                                <li>新增了大量搜索引擎</li>
                            </ul>
                        </div>
                        <div className="border-l-4 border-gray-300 pl-4 py-1">
                            <h4 className="font-semibold text-lg text-gray-800 dark:text-white">2026.3.11 更新 V2.1</h4>
                            <ul
                                className="list-disc pl-5 mt-2 space-y-1 text-gray-600 dark:text-gray-300">
                                <li>优化了一下动画，增加了一些功能</li>
                            </ul>
                        </div>
                        <div className="border-l-4 border-gray-300 pl-4 py-1">
                            <h4 className="font-semibold text-lg text-gray-800 dark:text-white">2026.1.29 更新 V2.0</h4>
                            <ul
                                className="list-disc pl-5 mt-2 space-y-1 text-gray-600 dark:text-gray-300">
                                <li>增加大量功能</li>
                                <li>修复了一些已知问题</li>
                            </ul>
                        </div>
                        <div className="border-l-4 border-gray-300 pl-4 py-1">
                            <h4 className="font-semibold text-lg text-gray-800 dark:text-white">2025.8.27 更新 v1.2</h4>
                            <ul
                                className="list-disc pl-5 mt-2 space-y-1 text-gray-600 dark:text-gray-300">
                                <li>修复了一些已知问题</li>
                            </ul>
                        </div>
                        <div className="border-l-4 border-gray-300 pl-4 py-1">
                            <h4 className="font-semibold text-lg text-gray-800 dark:text-white">2025.8.10 更新 v1.1</h4>
                            <ul
                                className="list-disc pl-5 mt-2 space-y-1 text-gray-600 dark:text-gray-300">
                                <li>新增豆包、千问搜索</li>
                                <li>修复已知问题</li>
                            </ul>
                        </div>
                        <div className="border-l-4 border-gray-300 pl-4 py-1">
                            <h4 className="font-semibold text-lg text-gray-800 dark:text-white">2025.8.6 发布 v1.0</h4>
                            <ul
                                className="list-disc pl-5 mt-2 space-y-1 text-gray-600 dark:text-gray-300">
                                <li>网站上线啦，支持搜索哦</li>
                            </ul>
                        </div>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 flex justify-end">
                        <button
                            onClick={() => setShowUpdateLog(false)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">我知道了
                                                      </button>
                    </div>
                </div>
            </div>}
            {/* 返回首页按钮 */}
            <Link
              href="/"
              className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 shadow-lg hover:scale-110 transition-all duration-300 flex items-center justify-center"
              title="返回首页"
            >
              <i className="fa-solid fa-house text-white"></i>
            </Link>
            {/* 页脚 */}
            <footer
                className="py-4 text-center text-gray-500 dark:text-gray-400 text-sm relative z-10">
                 <p>© {new Date().getFullYear()}快速搜索起始页</p>
            </footer>

            {/* 应用网格菜单 */}
            {showAppGrid && (
                <motion.div
                    className="fixed inset-0 bg-black/90 backdrop-blur-xl z-40 flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl rounded-2xl p-6 w-full max-w-7xl max-h-[85vh] overflow-hidden shadow-2xl border border-white/15"
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        {/* 顶部栏 */}
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <motion.i
                                    className="fa-solid fa-grid-2 text-blue-400"
                                    animate={{ rotate: [0, 360] }}
                                    transition={{ duration: 0.8, ease: "easeInOut" }}
                                ></motion.i>
                                <span>常用应用</span>
                            </h2>
                            <motion.button
                                onClick={() => setShowAppGrid(false)}
                                className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <i className="fa-solid fa-times text-2xl"></i>
                            </motion.button>
                        </div>

                        {/* 搜索框 */}
                        <div className="mb-6">
                            <div className="relative">
                                <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                                <input
                                    type="text"
                                    value={appSearchQuery}
                                    onChange={(e) => setAppSearchQuery(e.target.value)}
                                    placeholder="搜索应用或分类..."
                                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                                />
                            </div>
                        </div>

                        {/* 分类标签栏 */}
                        <div className="mb-6 overflow-x-auto pb-2">
                            <div className="flex gap-2">
                                <motion.button
                                    onClick={() => setExpandedFolders([])}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                                        expandedFolders.length === 0
                                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                                            : 'bg-white/5 text-gray-300 hover:bg-white/10'
                                    }`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <i className="fa-solid fa-layer-group mr-2"></i>
                                    全部
                                </motion.button>
                                {folders.map((folder) => (
                                    <motion.button
                                        key={folder.id}
                                        onClick={() => toggleFolder(folder.id)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                                            expandedFolders.includes(folder.id)
                                                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                                                : 'bg-white/5 text-gray-300 hover:bg-white/10'
                                        }`}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <i className={`fa-solid ${folder.icon} mr-2`}></i>
                                        {folder.name}
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        {/* 应用网格 */}
                        <div className="overflow-y-auto max-h-[50vh] pr-2 custom-scrollbar">
                            {appSearchQuery ? (
                                // 搜索模式：显示匹配的应用
                                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                                    {filteredFolders.map((folder) =>
                                        folder.apps
                                            .filter(app =>
                                                app.name.toLowerCase().includes(appSearchQuery.toLowerCase())
                                            )
                                            .map((app, index) => (
                                                <motion.button
                                                    key={app.id}
                                                    onClick={() => handleAppClick(app.url)}
                                                    className="flex flex-col items-center p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300 group"
                                                    whileHover={{ scale: 1.1, y: -4, rotate: [0, 2, -2, 0] }}
                                                    whileTap={{ scale: 0.9 }}
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: index * 0.05 }}
                                                >
                                                    <div
                                                        className="w-12 h-12 rounded-xl flex items-center justify-center mb-2 shadow-lg group-hover:shadow-2xl transition-all"
                                                        style={{ backgroundColor: app.color }}
                                                    >
                                                        <i className={`fa-solid ${app.icon} text-white text-xl`}></i>
                                                    </div>
                                                    <span className="text-white text-xs text-center font-medium">{app.name}</span>
                                                </motion.button>
                                            ))
                                    )}
                                </div>
                            ) : expandedFolders.length > 0 ? (
                                // 展开模式：显示选中的分类应用
                                expandedFolders.map((folderId) => {
                                    const folder = folders.find(f => f.id === folderId);
                                    if (!folder) return null;

                                    return (
                                        <div key={folder.id} className="mb-6">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                                                    <i className={`fa-solid ${folder.icon} text-white`}></i>
                                                </div>
                                                <h3 className="text-lg font-bold text-white">{folder.name}</h3>
                                                <span className="px-2 py-1 bg-white/10 rounded-full text-xs text-gray-300">
                                                    {folder.apps.length} 个应用
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                                                {folder.apps.map((app, index) => (
                                                    <motion.button
                                                        key={app.id}
                                                        onClick={() => handleAppClick(app.url)}
                                                        className="flex flex-col items-center p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300 group"
                                                        whileHover={{ scale: 1.1, y: -4, rotate: [0, 2, -2, 0] }}
                                                        whileTap={{ scale: 0.9 }}
                                                        initial={{ opacity: 0, y: 30, scale: 0.8 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        transition={{ delay: index * 0.04, type: "spring", damping: 15 }}
                                                    >
                                                        <div
                                                            className="w-12 h-12 rounded-xl flex items-center justify-center mb-2 shadow-lg group-hover:shadow-2xl transition-all"
                                                            style={{ backgroundColor: app.color }}
                                                        >
                                                            <i className={`fa-solid ${app.icon} text-white text-xl`}></i>
                                                        </div>
                                                        <span className="text-white text-xs text-center font-medium">{app.name}</span>
                                                    </motion.button>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                // 默认模式：显示所有分类预览和快速访问
                                <div className="space-y-8">
                                    {/* 快速访问 */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <i className="fa-solid fa-bolt text-yellow-400"></i>
                                            <h3 className="text-lg font-bold text-white">快速访问</h3>
                                        </div>
                                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                                            {[
                                                { url: 'https://www.douyin.com', icon: 'fa-brands fa-tiktok', name: '抖音', color: 'bg-black' },
                                                { url: 'https://www.bilibili.com', icon: 'fa-brands fa-bilibili', name: '哔哩哔哩', color: 'bg-pink-500' },
                                                { url: 'https://www.youtube.com', icon: 'fa-brands fa-youtube', name: 'YouTube', color: 'bg-red-600' },
                                                { url: 'https://www.twitter.com', icon: 'fa-brands fa-twitter', name: 'X', color: 'bg-black' },
                                                { url: 'https://www.instagram.com', icon: 'fa-brands fa-instagram', name: 'Instagram', color: 'bg-gradient-to-br from-purple-600 to-pink-500' },
                                                { url: 'https://www.facebook.com', icon: 'fa-brands fa-facebook', name: 'Facebook', color: 'bg-blue-600' },
                                                { url: 'https://www.linkedin.com', icon: 'fa-brands fa-linkedin', name: 'LinkedIn', color: 'bg-blue-700' },
                                                { url: 'https://www.reddit.com', icon: 'fa-brands fa-reddit', name: 'Reddit', color: 'bg-orange-600' },
                                                { url: 'https://discord.com', icon: 'fa-brands fa-discord', name: 'Discord', color: 'bg-indigo-600' },
                                                { url: 'https://www.telegram.org', icon: 'fa-brands fa-telegram', name: 'Telegram', color: 'bg-blue-400' },
                                            ].map((item, index) => (
                                                <motion.button
                                                    key={index}
                                                    onClick={() => handleAppClick(item.url)}
                                                    className="flex flex-col items-center p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300 group"
                                                    whileHover={{ scale: 1.1, y: -4, rotate: [0, 2, -2, 0] }}
                                                    whileTap={{ scale: 0.9 }}
                                                    initial={{ opacity: 0, y: 30, scale: 0.8 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    transition={{ delay: index * 0.04, type: "spring", damping: 15 }}
                                                >
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 shadow-lg group-hover:shadow-2xl transition-all ${item.color}`}>
                                                        <i className={`${item.icon} text-white text-xl`}></i>
                                                    </div>
                                                    <span className="text-white text-xs text-center font-medium">{item.name}</span>
                                                </motion.button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 分类预览 */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <i className="fa-solid fa-folder-open text-blue-400"></i>
                                            <h3 className="text-lg font-bold text-white">分类浏览</h3>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
                                            {folders.map((folder, index) => (
                                                <motion.button
                                                    key={folder.id}
                                                    onClick={() => toggleFolder(folder.id)}
                                                    className="flex flex-col items-center p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-300 group"
                                                    whileHover={{ scale: 1.08, y: -4 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    initial={{ opacity: 0, y: 30, scale: 0.8 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    transition={{ delay: index * 0.05, type: "spring", damping: 15 }}
                                                >
                                                    <motion.div
                                                        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-3 shadow-lg group-hover:shadow-2xl transition-all"
                                                        whileHover={{ rotate: [0, -5, 5, 0] }}
                                                        transition={{ duration: 0.5 }}
                                                    >
                                                        <i className={`fa-solid ${folder.icon} text-white text-2xl`}></i>
                                                    </motion.div>
                                                    <span className="text-white text-sm font-medium">{folder.name}</span>
                                                    <span className="text-gray-400 text-xs mt-1">{folder.apps.length} 个应用</span>
                                                </motion.button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
}
