import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { type WebsiteStats } from '@/lib/utils';

interface StatisticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: WebsiteStats[];
}

// 按导航页的 4 大分类组织服务，每个分类独立一张折线图
const CATEGORY_CONFIG: {
  id: string;
  name: string;
  icon: string;
  color: string;
  services: { key: keyof WebsiteStats; name: string; color: string }[];
}[] = [
  {
    id: 'core',
    name: '核心入口',
    icon: 'fa-compass',
    color: 'blue',
    services: [
      { key: 'homepage', name: '主页', color: '#3b82f6' },
      { key: 'search', name: '搜索页', color: '#8b5cf6' },
    ],
  },
  {
    id: 'tools',
    name: '效率工具',
    icon: 'fa-tools',
    color: 'cyan',
    services: [
      { key: 'toolbox', name: '工具箱', color: '#06b6d4' },
      { key: 'homeworkSystem', name: '作业系统', color: '#10b981' },
      { key: 'pomodoro', name: '番茄钟', color: '#f97316' },
      { key: 'tts', name: '语音朗读', color: '#d946ef' },
    ],
  },
  {
    id: 'entertainment',
    name: '娱乐休闲',
    icon: 'fa-play',
    color: 'red',
    services: [
      { key: 'movie', name: '影视资源', color: '#ef4444' },
      { key: 'video', name: '视频播放器', color: '#f59e0b' },
    ],
  },
  {
    id: 'fun',
    name: '趣味应用',
    icon: 'fa-gamepad',
    color: 'yellow',
    services: [
      { key: 'fruitGame', name: '水果游戏', color: '#f59e0b' },
      { key: 'monopoly', name: '大富翁计分器', color: '#eab308' },
      { key: 'grandmaTraining', name: '老人训练题', color: '#ec4899' },
    ],
  },
];

const ALL_SERVICES = CATEGORY_CONFIG.flatMap((cat) => cat.services);

const tooltipStyle = {
  backgroundColor: 'rgba(15, 23, 42, 0.98)',
  border: '1px solid rgba(59, 130, 246, 0.7)',
  borderRadius: '8px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
  color: '#ffffff',
};

const axisTick = { fontSize: 11, fill: '#93c5fd' };
const axisStroke = 'rgba(59, 130, 246, 0.7)';
const gridStroke = 'rgba(59, 130, 246, 0.1)';

export default function StatisticsModal({ isOpen, onClose, data }: StatisticsModalProps) {
  if (!isOpen) return null;

  // 顶部数据卡片：总访问量、最高日访问、平均日访问、最受欢迎服务
  const totalVisits = data.reduce(
    (sum, day) => sum + ALL_SERVICES.reduce((s, svc) => s + (day[svc.key] as number), 0),
    0
  );
  const dailyTotals = data.map((day) =>
    ALL_SERVICES.reduce((s, svc) => s + (day[svc.key] as number), 0)
  );
  const maxDaily = Math.max(...dailyTotals);
  const avgDaily = Math.round(totalVisits / data.length);

  const serviceSums = ALL_SERVICES.map((svc) =>
    data.reduce((sum, day) => sum + (day[svc.key] as number), 0)
  );
  const maxIdx = serviceSums.indexOf(Math.max(...serviceSums));
  const mostPopular = ALL_SERVICES[maxIdx].name;

  const cards = [
    { title: '总访问量', value: totalVisits.toLocaleString(), icon: 'fa-globe', color: 'blue' },
    { title: '最高日访问', value: maxDaily.toLocaleString(), icon: 'fa-chart-line', color: 'green' },
    { title: '平均日访问', value: avgDaily.toLocaleString(), icon: 'fa-average', color: 'purple' },
    { title: '最受欢迎服务', value: mostPopular, icon: 'fa-star', color: 'yellow' },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <motion.div
        className="bg-gradient-to-br from-slate-900 to-blue-950 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-auto border border-blue-500/30"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex justify-between items-center p-6 border-b border-blue-500/20 bg-black/30 backdrop-blur-sm sticky top-0 z-10">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            <i className="fa-solid fa-chart-line mr-2"></i>网站访问统计 (最近30天)
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-blue-500/20 transition-colors text-blue-300"
          >
            <i className="fa-solid fa-times"></i>
          </button>
        </div>

        <div className="p-6 space-y-6 bg-black">
          {/* 顶部数据卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card, index) => (
              <motion.div
                key={index}
                className={`bg-black/80 backdrop-blur-sm rounded-lg p-4 border border-${card.color}-500/30 shadow-lg`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className={`text-${card.color}-300 text-sm font-medium`}>{card.title}</h3>
                  <i className={`fa-solid ${card.icon} text-${card.color}-400`}></i>
                </div>
                <p className="text-white text-xl font-bold">{card.value}</p>
              </motion.div>
            ))}
          </div>

          {/* 4 个分类折线图：每个分类独立一张图 */}
          {CATEGORY_CONFIG.map((cat) => (
            <div
              key={cat.id}
              className="p-6 bg-black/90 rounded-lg border border-blue-500/20 shadow-lg"
            >
              <h3 className={`text-lg font-semibold mb-4 text-${cat.color}-300 flex items-center`}>
                <i className={`fa-solid ${cat.icon} mr-2`}></i>
                {cat.name}
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="date" tick={axisTick} stroke={axisStroke} />
                    <YAxis tick={axisTick} stroke={axisStroke} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      itemStyle={{ color: '#ffffff' }}
                      labelStyle={{ color: '#93c5fd' }}
                    />
                    {cat.services.map((svc) => (
                      <Line
                        key={svc.key}
                        type="monotone"
                        dataKey={svc.key as string}
                        name={svc.name}
                        stroke={svc.color}
                        strokeWidth={3}
                        dot={{ r: 3, strokeWidth: 2, stroke: svc.color, fill: '#0f172a' }}
                        activeDot={{ r: 6, strokeWidth: 0, fill: svc.color }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-4 md:gap-6 mt-4">
                {cat.services.map((svc) => (
                  <div
                    key={svc.key}
                    className="flex items-center text-sm md:text-base text-white font-medium"
                  >
                    <div
                      className="w-4 h-4 rounded-full mr-2"
                      style={{ backgroundColor: svc.color }}
                    ></div>
                    {svc.name}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* 系统状态 */}
          <div className="p-4 bg-black/80 backdrop-blur-sm rounded-lg border border-green-500/30 flex items-center">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse mr-3"></div>
            <p className="text-green-300 text-sm">
              系统状态正常 | 数据最后更新: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
