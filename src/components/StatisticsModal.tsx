import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

interface StatisticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    date: string;
    homepage: number;
    search: number;
    grandmaTraining: number;
    monopoly: number;
    toolbox: number;
    homeworkSystem: number;
    fruitGame: number;
    pomodoro: number;
    tts: number;
    video: number;
  }[];
}

export default function StatisticsModal({ isOpen, onClose, data }: StatisticsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <motion.div 
        className="bg-gradient-to-br from-slate-900 to-blue-950 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-auto border border-blue-500/30"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex justify-between items-center p-6 border-b border-blue-500/20 bg-black/30 backdrop-blur-sm">
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
        
         {/* 移除背景图案，使用纯黑色背景提高对比度 */}
         <div className="p-6 space-y-8 bg-black">
          {/* Combined Chart */}
          {/* 增加背景不透明度，减少模糊效果 */}
          <div className="p-6 bg-black/90 rounded-lg border border-blue-500/20 shadow-lg">
            <h3 className="text-lg font-semibold mb-6 text-blue-300 flex items-center">
              <i className="fa-solid fa-chart-simple mr-2"></i>综合访问统计
            </h3>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
               <LineChart data={data}>
                  {/* 减少网格线的透明度，降低干扰 */}
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(59, 130, 246, 0.1)" />
                  {/* 增加坐标轴文字颜色对比度 */}
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#93c5fd' }} stroke="rgba(59, 130, 246, 0.7)" />
                  <YAxis tick={{ fontSize: 12, fill: '#93c5fd' }} stroke="rgba(59, 130, 246, 0.7)" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.98)', 
                      border: '1px solid rgba(59, 130, 246, 0.7)',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
                      color: '#ffffff'
                    }}
                    itemStyle={{ color: '#ffffff' }}
                    labelStyle={{ color: '#93c5fd' }}
                  />
                  {/* 增加线条宽度、数据点大小和颜色饱和度，提高可视性 */}
                  <Line type="monotone" dataKey="homepage" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, stroke: '#3b82f6', fill: '#1e3a8a' }} activeDot={{ r: 7, strokeWidth: 0, fill: '#3b82f6' }} />
                  <Line type="monotone" dataKey="search" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, stroke: '#8b5cf6', fill: '#312e81' }} activeDot={{ r: 7, strokeWidth: 0, fill: '#8b5cf6' }} />
                  <Line type="monotone" dataKey="toolbox" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, stroke: '#06b6d4', fill: '#0891b2' }} activeDot={{ r: 7, strokeWidth: 0, fill: '#06b6d4' }} />
                  <Line type="monotone" dataKey="homeworkSystem" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, stroke: '#10b981', fill: '#065f46' }} activeDot={{ r: 7, strokeWidth: 0, fill: '#10b981' }} />
                  <Line type="monotone" dataKey="fruitGame" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, stroke: '#f59e0b', fill: '#92400e' }} activeDot={{ r: 7, strokeWidth: 0, fill: '#f59e0b' }} />
                  <Line type="monotone" dataKey="monopoly" stroke="#eab308" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, stroke: '#eab308', fill: '#854d0e' }} activeDot={{ r: 7, strokeWidth: 0, fill: '#eab308' }} />
                  <Line type="monotone" dataKey="grandmaTraining" stroke="#ec4899" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, stroke: '#ec4899', fill: '#701a75' }} activeDot={{ r: 7, strokeWidth: 0, fill: '#ec4899' }} />
                  <Line type="monotone" dataKey="pomodoro" stroke="#f97316" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, stroke: '#f97316', fill: '#7c2d12' }} activeDot={{ r: 7, strokeWidth: 0, fill: '#f97316' }} />
                  <Line type="monotone" dataKey="tts" stroke="#d946ef" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, stroke: '#d946ef', fill: '#581c87' }} activeDot={{ r: 7, strokeWidth: 0, fill: '#d946ef' }} />
                  <Line type="monotone" dataKey="video" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, stroke: '#ef4444', fill: '#7f1d1d' }} activeDot={{ r: 7, strokeWidth: 0, fill: '#ef4444' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-4 md:gap-6 mt-6">
              {[
                { key: 'homepage', name: '主页', color: '#3b82f6' },
                { key: 'search', name: '搜索页', color: '#8b5cf6' },
                { key: 'toolbox', name: '工具箱', color: '#06b6d4' },
                { key: 'homeworkSystem', name: '作业系统', color: '#10b981' },
                { key: 'fruitGame', name: '水果游戏', color: '#f59e0b' },
                { key: 'monopoly', name: '大富翁计分器', color: '#eab308' },
                { key: 'grandmaTraining', name: '老人训练题', color: '#ec4899' },
                { key: 'pomodoro', name: '番茄钟', color: '#f97316' },
                { key: 'tts', name: '语音朗读', color: '#d946ef' },
                { key: 'video', name: '视频', color: '#ef4444' }
              ].map((item) => (
                <div key={item.key} className="flex items-center text-sm md:text-base text-white font-medium">
                  <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                  {item.name}
                </div>
              ))}
            </div>
          </div>
          
           {/* 数据卡片统计 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: '总访问量',
                value: data.reduce((sum, day) => sum + day.homepage + day.search + day.toolbox + day.homeworkSystem + day.fruitGame + day.pomodoro + day.tts + day.video, 0).toLocaleString(),
                icon: 'fa-globe',
                color: 'blue'
              },
              {
                title: '最高日访问',
                value: Math.max(...data.map(day => day.homepage + day.search + day.toolbox + day.homeworkSystem + day.fruitGame + day.pomodoro + day.tts + day.video)).toLocaleString(),
                icon: 'fa-chart-line',
                color: 'green'
              },
              {
                title: '平均日访问',
                value: Math.round(data.reduce((sum, day) => sum + day.homepage + day.search + day.toolbox + day.homeworkSystem + day.fruitGame + day.pomodoro + day.tts + day.video, 0) / data.length).toLocaleString(),
                icon: 'fa-average',
                color: 'purple'
              },
              {
                title: '最受欢迎服务',
                value: ['主页', '搜索页', '工具箱', '作业系统', '水果游戏', '大富翁', '老人训练', '番茄钟', '语音朗读', '视频'][
                  data.reduce((sums, day) => {
                    sums[0] += day.homepage;
                    sums[1] += day.search;
                    sums[2] += day.toolbox;
                    sums[3] += day.homeworkSystem;
                    sums[4] += day.fruitGame;
                    sums[5] += day.monopoly;
                    sums[6] += day.grandmaTraining;
                    sums[7] += day.pomodoro;
                    sums[8] += day.tts;
                    sums[9] += day.video;
                    return sums;
                  }, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]).indexOf(Math.max(...data.reduce((sums, day) => {
                    sums[0] += day.homepage;
                    sums[1] += day.search;
                    sums[2] += day.toolbox;
                    sums[3] += day.homeworkSystem;
                    sums[4] += day.fruitGame;
                    sums[5] += day.monopoly;
                    sums[6] += day.grandmaTraining;
                    sums[7] += day.pomodoro;
                    sums[8] += day.tts;
                    sums[9] += day.video;
                    return sums;
                  }, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0])))
                ],
                icon: 'fa-star',
                color: 'yellow'
              },
            ].map((card, index) => (
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
          
          {/* 系统状态 */}
          <div className="p-4 bg-black/80 backdrop-blur-sm rounded-lg border border-green-500/30 flex items-center">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse mr-3"></div>
            <p className="text-green-300 text-sm">系统状态正常 | 数据最后更新: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
