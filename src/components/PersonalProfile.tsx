import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PersonalProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

// 个人成长时间线数据
const timelineData = [
  {
    year: '2011',
    title: '出生',
    description: '来到这个世界，开启人生旅程',
    icon: 'fa-solid fa-baby',
  },
  {
    year: '2017',
    title: '步入小学',
    description: '开始正式的学习生涯',
    icon: 'fa-solid fa-school',
  },
  {
    year: '2019',
    title: '接触编程',
    description: '发现编程的乐趣，开始学习前端开发',
    icon: 'fa-solid fa-code',
  },
  {
    year: '2023',
    title: '升入初中',
    description: '进入一所新学校，开启初中生活',
    icon: 'fa-solid fa-graduation-cap',
  },
  {
    year: '2025',
    title: '搭建个人主页',
    description: '创建属于自己的个人网站',
    icon: 'fa-solid fa-globe',
  },
  {
    year: '未来',
    title: '继续前行',
    description: '追逐梦想，成为更好的自己',
    icon: 'fa-solid fa-rocket',
  },
];

// 打字机动效组件
const TypewriterText = ({ 
  text, 
  delay = 0, 
  speed = 80, 
  onComplete 
}: { 
  text: string; 
  delay?: number; 
  speed?: number;
  onComplete?: () => void;
}) => {
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    
    const startTyping = () => {
      let index = 0;
      const type = () => {
        if (index < text.length) {
          setDisplayText(text.slice(0, index + 1));
          index++;
          timeout = setTimeout(type, speed);
        } else {
          setIsComplete(true);
          onComplete?.();
        }
      };
      type();
    };

    const delayTimeout = setTimeout(startTyping, delay);
    
    return () => {
      clearTimeout(delayTimeout);
      clearTimeout(timeout);
    };
  }, [text, delay, speed, onComplete]);

  return (
    <span>
      {displayText}
      {!isComplete && (
        <span className="inline-block w-0.5 h-5 bg-white/80 ml-1 animate-pulse" />
      )}
    </span>
  );
};

export default function PersonalProfile({ isOpen, onClose }: PersonalProfileProps) {
  const [phase, setPhase] = useState<'typing' | 'waiting' | 'timeline'>('typing');
  const [visibleNodes, setVisibleNodes] = useState<number[]>([]);

  // 重置状态
  useEffect(() => {
    if (isOpen) {
      setPhase('typing');
      setVisibleNodes([]);
    }
  }, [isOpen]);

  // 打字完成后的处理
  const handleTypingComplete = useCallback(() => {
    setPhase('waiting');
    // 等待3秒后显示时间线
    setTimeout(() => {
      setPhase('timeline');
    }, 3000);
  }, []);

  // 逐个显示时间线节点
  useEffect(() => {
    if (phase === 'timeline') {
      timelineData.forEach((_, index) => {
        setTimeout(() => {
          setVisibleNodes(prev => [...prev, index]);
        }, index * 600); // 每个节点间隔600ms
      });
    }
  }, [phase]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full h-full flex flex-col"
        >
          {/* 关闭按钮 */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 hover:bg-white/20 transition-all duration-300 group"
            aria-label="关闭个人展示页"
          >
            <i className="fa-solid fa-arrow-left text-white/80 group-hover:text-white transition-colors"></i>
          </button>

          {/* 自我介绍区域 */}
          <AnimatePresence>
            {(phase === 'typing' || phase === 'waiting') && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ 
                  opacity: 0, 
                  y: -20, 
                  scale: 0.9,
                  transition: { duration: 0.5, ease: 'easeInOut' }
                }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/10"
              >
                <h2 className="text-3xl font-bold text-white mb-4 flex items-center gap-4">
                  <i className="fa-solid fa-user text-white/80 text-2xl"></i>
                  关于我
                </h2>
                <div className="text-white/90 text-lg leading-relaxed min-h-[3rem]">
                  <TypewriterText 
                    text="你好！我是来自深圳市罗湖区的一名初三学生，今年15岁，男生。" 
                    delay={300}
                    speed={60}
                    onComplete={handleTypingComplete}
                  />
                </div>
                {/* 等待中的提示动画 */}
                {phase === 'waiting' && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 flex justify-center"
                  >
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="w-2 h-2 bg-white/50 rounded-full"
                          animate={{ 
                            y: [0, -8, 0],
                            opacity: [0.5, 1, 0.5]
                          }}
                          transition={{ 
                            duration: 0.6, 
                            repeat: Infinity,
                            delay: i * 0.15
                          }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* 个人成长时间线 */}
          <AnimatePresence>
            {phase === 'timeline' && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="flex-1 overflow-y-auto custom-scrollbar bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/10"
              >
                <motion.h3 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-3xl font-bold text-white mb-6 flex items-center gap-4"
                >
                  <i className="fa-solid fa-road text-white/80 text-2xl"></i>
                  成长轨迹
                </motion.h3>
                
                <div className="relative pb-4">
                  {/* 时间线竖线 */}
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: '100%' }}
                    transition={{ duration: 2, ease: 'easeOut' }}
                    className="absolute left-4 top-0 w-0.5 bg-gradient-to-b from-white/40 via-white/20 to-transparent"
                  />
                  
                  {/* 时间线节点 */}
                  <div className="space-y-5">
                    {timelineData.map((item, index) => (
                      <AnimatePresence key={item.year}>
                        {visibleNodes.includes(index) && (
                          <motion.div
                            initial={{ opacity: 0, x: -50, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            transition={{ 
                              duration: 0.8, 
                              ease: [0.25, 0.46, 0.45, 0.94] // ease-out cubic
                            }}
                            className="relative pl-12"
                          >
                            {/* 节点图标 */}
                            <motion.div 
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ 
                                duration: 0.6, 
                                delay: 0.2,
                                type: 'spring',
                                stiffness: 150
                              }}
                              className="absolute left-0 w-8 h-8 bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-white/40 shadow-lg"
                            >
                              <i className={`${item.icon} text-white text-sm`}></i>
                            </motion.div>
                            
                            {/* 内容卡片 */}
                            <motion.div 
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.5, delay: 0.3 }}
                              className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 hover:bg-white/15 hover:border-white/20 transition-all duration-300 hover:shadow-lg"
                              whileHover={{ scale: 1.02, x: 5 }}
                            >
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-white/60 text-sm font-mono tracking-wider">{item.year}</span>
                                <h4 className="text-white font-semibold">{item.title}</h4>
                              </div>
                              <p className="text-white/70 text-sm leading-relaxed">{item.description}</p>
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
