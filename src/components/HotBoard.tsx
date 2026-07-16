import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface HotBoardProps {
  isOpen: boolean;
  onClose: () => void;
}

interface HotItem {
  title: string;
  hot?: number | string;
  url: string;
  rank?: number;
}

interface HotBoardData {
  type: string;
  update_time: string;
  list: HotItem[];
}

// 支持的平台配置
const platforms = [
  { id: 'weibo', name: '微博热搜', icon: 'fa-brands fa-weibo', color: '#ff8200' },
  { id: 'zhihu', name: '知乎热榜', icon: 'fa-brands fa-zhihu', color: '#0084ff' },
  { id: 'bilibili', name: 'B站热榜', icon: 'fa-brands fa-bilibili', color: '#00a1d6' },
  { id: 'douyin', name: '抖音热点', icon: 'fa-brands fa-tiktok', color: '#000000' },
  { id: 'toutiao', name: '今日头条', icon: 'fa-solid fa-newspaper', color: '#f85959' },
  { id: 'baidu', name: '百度热搜', icon: 'fa-brands fa-google', color: '#2932e1' },
  { id: 'netease-news', name: '网易新闻', icon: 'fa-solid fa-newspaper', color: '#c43c3c' },
  { id: '36kr', name: '36氪', icon: 'fa-solid fa-fire', color: '#0478f2' },
  { id: 'ithome', name: 'IT之家', icon: 'fa-solid fa-microchip', color: '#d32f2f' },
  { id: 'juejin', name: '掘金热榜', icon: 'fa-solid fa-gem', color: '#1e80ff' },
  { id: 'weixin', name: '微信热文', icon: 'fa-brands fa-weixin', color: '#07c160' },
  { id: 'douban-movie', name: '豆瓣电影', icon: 'fa-solid fa-film', color: '#00b51d' },
];

const HotBoard: React.FC<HotBoardProps> = ({ isOpen, onClose }) => {
  const [activePlatform, setActivePlatform] = useState('weibo');
  const [hotData, setHotData] = useState<HotBoardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取热榜数据
  const fetchHotBoard = useCallback(async (type: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`https://uapis.cn/api/v1/misc/hotboard?type=${type}`);
      if (!response.ok) {
        throw new Error('获取热榜失败');
      }
      const data = await response.json();
      setHotData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取热榜失败');
      setHotData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // 切换平台时获取数据
  useEffect(() => {
    if (isOpen && activePlatform) {
      fetchHotBoard(activePlatform);
    }
  }, [isOpen, activePlatform, fetchHotBoard]);

  // 格式化热度值
  const formatHot = (hot: number | string | undefined): string => {
    if (!hot) return '';
    const num = typeof hot === 'string' ? parseInt(hot) : hot;
    if (isNaN(num)) return String(hot);
    if (num >= 100000000) return `${(num / 100000000).toFixed(1)}亿`;
    if (num >= 10000) return `${(num / 10000).toFixed(1)}万`;
    return String(num);
  };

  // 获取当前平台信息
  const currentPlatform = platforms.find(p => p.id === activePlatform);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* 背景遮罩 */}
        <motion.div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* 模态框内容 */}
        <motion.div
          className="relative bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 w-full max-w-5xl shadow-2xl overflow-hidden"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          {/* 标题栏 */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-white/10 bg-black/30">
            <div className="flex items-center gap-3">
              <i className="fa-solid fa-fire text-2xl text-orange-400"></i>
              <h3 className="text-white text-2xl font-semibold">今日热榜</h3>
              {hotData?.update_time && (
                <span className="text-white/40 text-sm ml-2">
                  更新于 {hotData.update_time}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors"
              aria-label="关闭"
            >
              <i className="fa-solid fa-times text-2xl"></i>
            </button>
          </div>

          <div className="flex h-[600px]">
            {/* 左侧平台列表 */}
            <div className="w-48 border-r border-white/10 bg-black/20 overflow-y-auto">
              <div className="p-2 space-y-1">
                {platforms.map((platform) => (
                  <button
                    key={platform.id}
                    onClick={() => setActivePlatform(platform.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      activePlatform === platform.id
                        ? 'bg-white/20 text-white'
                        : 'text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <i 
                      className={platform.icon} 
                      style={{ color: activePlatform === platform.id ? platform.color : undefined }}
                    ></i>
                    <span className="text-sm font-medium">{platform.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 右侧热榜内容 */}
            <div className="flex-1 overflow-hidden">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-white/20 border-t-orange-400 rounded-full animate-spin"></div>
                    <p className="text-white/60">加载中...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="h-full flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <i className="fa-solid fa-exclamation-circle text-4xl text-red-400"></i>
                    <p className="text-white/60">{error}</p>
                    <button
                      onClick={() => fetchHotBoard(activePlatform)}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                    >
                      重试
                    </button>
                  </div>
                </div>
              ) : hotData?.list ? (
                <div className="h-full overflow-y-auto p-6">
                  <div className="space-y-2">
                    {hotData.list.map((item, index) => (
                      <a
                        key={index}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-xl transition-all group"
                      >
                        {/* 排名 */}
                        <div
                          className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm ${
                            index < 3
                              ? index === 0
                                ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white'
                                : index === 1
                                ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white'
                                : 'bg-gradient-to-br from-amber-600 to-amber-700 text-white'
                              : 'bg-white/10 text-white/60'
                          }`}
                        >
                          {index + 1}
                        </div>

                        {/* 标题 */}
                        <div className="flex-1 min-w-0">
                          <p className="text-white/90 truncate group-hover:text-white transition-colors">
                            {item.title}
                          </p>
                        </div>

                        {/* 热度 */}
                        {item.hot && (
                          <div className="flex items-center gap-1 text-white/40 text-sm">
                            <i className="fa-solid fa-fire text-orange-400"></i>
                            <span>{formatHot(item.hot)}</span>
                          </div>
                        )}

                        {/* 箭头 */}
                        <i className="fa-solid fa-arrow-right text-white/20 group-hover:text-white/40 group-hover:translate-x-1 transition-all"></i>
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* 底部提示 */}
          <div className="px-6 py-3 border-t border-white/10 bg-black/20 text-center">
            <p className="text-white/40 text-sm">
              数据来源：{currentPlatform?.name || '未知'} · 点击条目可跳转查看详情
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default HotBoard;
