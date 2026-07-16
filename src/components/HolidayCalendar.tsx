import React from 'react';
import { useState, useEffect } from 'react';
  import { motion } from 'framer-motion';

  // 定义假期类型
  interface Holiday {
    id: number;
    name: string;
    date: string;
    description: string;
    icon: string;
  }

  // 2026年主要假期数据
  const holidays2026: Holiday[] = [
    { id: 1, name: '元旦', date: '2026-01-01', description: '元旦节', icon: 'fa-calendar-day' },
    { id: 2, name: '春节', date: '2026-02-17', description: '农历正月初一', icon: 'fa-fire' },
    { id: 3, name: '清明节', date: '2026-04-04', description: '清明节', icon: 'fa-leaf' },
    { id: 4, name: '劳动节', date: '2026-05-01', description: '国际劳动节', icon: 'fa-hands-helping' },
    { id: 5, name: '端午节', date: '2026-06-22', description: '农历五月初五', icon: 'fa-utensils' },
    { id: 6, name: '中秋节', date: '2026-09-29', description: '农历八月十五', icon: 'fa-moon' },
    { id: 7, name: '国庆节', date: '2026-10-01', description: '国庆节', icon: 'fa-flag' },
    { id: 8, name: '圣诞节', date: '2026-12-25', description: '圣诞节', icon: 'fa-tree' },
  ];

  // 计算两个日期之间的天数差
  const calculateDaysRemaining = (targetDateString: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const targetDate = new Date(targetDateString);
    targetDate.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  // 获取当前年份剩余假期数量
  const getRemainingYearHolidays = (holidays: Holiday[]): number => {
    const today = new Date();
    return holidays.filter(holiday => {
      const holidayDate = new Date(holiday.date);
      return holidayDate >= today && holidayDate.getFullYear() === today.getFullYear();
    }).length;
  };

  // 获取当前月份剩余假期数量
  const getRemainingMonthHolidays = (holidays: Holiday[]): number => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    return holidays.filter(holiday => {
      const holidayDate = new Date(holiday.date);
      return holidayDate >= today && 
             holidayDate.getMonth() === currentMonth && 
             holidayDate.getFullYear() === currentYear;
    }).length;
  };

  const HolidayCalendar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const [upcomingHolidays, setUpcomingHolidays] = useState<Holiday[]>([]);
    const [remainingYearHolidays, setRemainingYearHolidays] = useState(0);
    const [remainingMonthHolidays, setRemainingMonthHolidays] = useState(0);
  const [currentMonth] = useState(new Date().toLocaleDateString('zh-CN', { month: 'long' }));
    const [currentYear] = useState(new Date().getFullYear());

    // 初始化和更新数据
    useEffect(() => {
      if (isOpen) {
        // 筛选出未来的假期并按日期排序
        const futureHolidays = holidays2026
          .filter(holiday => calculateDaysRemaining(holiday.date) >= 0)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        setUpcomingHolidays(futureHolidays);
        setRemainingYearHolidays(getRemainingYearHolidays(holidays2026));
        setRemainingMonthHolidays(getRemainingMonthHolidays(holidays2026));
      }
    }, [isOpen]);

    // 如果模态框未打开，则不渲染任何内容
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* 背景遮罩 */}
        <div 
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        ></div>
        
        {/* 模态框内容 - 改为横向布局 */}
        <motion.div 
          className="relative bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 w-full max-w-4xl shadow-2xl"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-white text-xl font-semibold">2026年假期日历</h3>
            <button 
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors"
              aria-label="关闭"
            >
              <i className="fa-solid fa-times text-lg"></i>
            </button>
          </div>
          
          {/* 假期统计 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/15 p-4 rounded-xl flex flex-col items-center justify-center">
              <h4 className="text-white/70 text-sm mb-1">{currentYear}年剩余假期</h4>
              <p className="text-white text-2xl font-semibold">{remainingYearHolidays}</p>
            </div>
            <div className="bg-white/15 p-4 rounded-xl flex flex-col items-center justify-center">
              <h4 className="text-white/70 text-sm mb-1">{currentMonth}剩余假期</h4>
              <p className="text-white text-2xl font-semibold">{remainingMonthHolidays}</p>
            </div>
            <div className="bg-white/15 p-4 rounded-xl flex flex-col items-center justify-center">
              <h4 className="text-white/70 text-sm mb-1">总假期数</h4>
              <p className="text-white text-2xl font-semibold">{holidays2026.length}</p>
            </div>
            <div className="bg-white/15 p-4 rounded-xl flex flex-col items-center justify-center">
              <h4 className="text-white/70 text-sm mb-1">全年进度</h4>
              <p className="text-white text-2xl font-semibold">
                {Math.round((new Date().getMonth() + 1) / 12 * 100)}%
              </p>
            </div>
          </div>
          
          {/* 即将到来的假期列表 - 改为横向滚动 */}
          <div className="mb-4">
            {upcomingHolidays.length > 0 ? (
              <div className="overflow-x-auto pb-4 -mx-6 px-6">
                <div className="flex space-x-4 min-w-max">
                  {upcomingHolidays.map((holiday, index) => {
                    const daysRemaining = calculateDaysRemaining(holiday.date);
                    const holidayDate = new Date(holiday.date);
                    const formattedDate = holidayDate.toLocaleDateString('zh-CN', { 
                      month: 'short', 
                      day: 'numeric',
                      weekday: 'short'
                    });
                    
                    return (
                      <motion.div 
                        key={holiday.id}
                        className="bg-white/15 p-5 rounded-xl w-64 flex-shrink-0"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="bg-blue-500/20 p-3 rounded-full">
                            <i className={`fa-solid ${holiday.icon} text-blue-400`}></i>
                          </div>
                          <div className="bg-white/20 px-4 py-2 rounded-xl text-center">
                            <p className="text-white/70 text-xs">还剩</p>
                            <p className="text-white text-xl font-semibold">{daysRemaining}</p>
                            <p className="text-white/70 text-xs">天</p>
                          </div>
                        </div>
                        <h4 className="text-white font-medium text-lg mb-2">{holiday.name}</h4>
                        <p className="text-white/70 text-sm mb-1">{formattedDate}</p>
                        <p className="text-white/60 text-xs">{holiday.description}</p>
                        
                        {/* 进度条 */}
                        <div className="mt-4">
                          <div className="w-full bg-white/10 rounded-full h-1.5 mb-1">
                            <div 
                              className="bg-blue-500 h-1.5 rounded-full" 
                              style={{ width: `${Math.min(100, Math.max(0, 100 - (daysRemaining / 365) * 100))}%` }}
                            ></div>
                          </div>
                          <p className="text-right text-xs text-white/50">
                            {Math.min(100, Math.max(0, 100 - (daysRemaining / 365) * 100)).toFixed(0)}%
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-white/50">
                <i className="fa-solid fa-calendar-check text-4xl mb-4"></i>
                <p className="text-lg">2026年假期已全部结束</p>
              </div>
            )}
          </div>
          
          {/* 底部提示 */}
          <p className="text-white/40 text-xs text-center">
            点击外部区域或关闭按钮可关闭
          </p>
        </motion.div>
      </div>
    );
  };

  export default HolidayCalendar;