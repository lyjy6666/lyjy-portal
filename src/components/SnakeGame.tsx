import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SnakeGameProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Position {
  x: number;
  y: number;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const CELL_SIZE = 20;
const BASE_INTERVAL = 100; // 基础游戏间隔

// 难度选项
const DIFFICULTY_OPTIONS = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

// 获取页面上需要碰撞检测的元素
const getCollisionElements = (): Rect[] => {
  const rects: Rect[] = [];
  
  const selectors = [
    '.avatar-container',
    '.quote-container',
    '.feature-button',
    '.music-player',
    '.social-link',
    '.version-badge',
    '.search-container',
    '.left-content-area',
    '.right-content-area',
    '.footer-container',
    '.bg-black\\/40',
  ];

  selectors.forEach(selector => {
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          rects.push({
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
          });
        }
      });
    } catch (e) {
      // 忽略无效选择器
    }
  });

  return rects;
};

const SnakeGame: React.FC<SnakeGameProps> = ({ isOpen, onClose }) => {
  const [snake, setSnake] = useState<Position[]>([{ x: 200, y: 200 }]);
  const [food, setFood] = useState<Position>({ x: 300, y: 300 });
  const [direction, setDirection] = useState<Position>({ x: 1, y: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameOverReason, setGameOverReason] = useState('');
  const [difficulty, setDifficulty] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  
  const directionRef = useRef(direction);
  const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const collisionElementsRef = useRef<Rect[]>([]);

  // 根据难度计算游戏间隔（难度越高，速度越快）
  const getInterval = useCallback(() => {
    return Math.max(20, Math.floor(BASE_INTERVAL / difficulty));
  }, [difficulty]);

  // 根据难度计算增长节数
  const getGrowthCount = useCallback(() => {
    return Math.ceil(difficulty);
  }, [difficulty]);

  const getScreenSize = () => ({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const generateFood = useCallback((_currentSnake: Position[]): Position => {
    const { width, height } = getScreenSize();
    let newFood: Position;
    let attempts = 0;
    
    do {
      newFood = {
        x: Math.floor(Math.random() * (width - 60)) + 30,
        y: Math.floor(Math.random() * (height - 60)) + 30,
      };
      attempts++;
      
      const inCollision = collisionElementsRef.current.some(rect => 
        newFood.x >= rect.x - 20 && newFood.x <= rect.x + rect.width + 20 &&
        newFood.y >= rect.y - 20 && newFood.y <= rect.y + rect.height + 20
      );
      
      if (!inCollision) break;
    } while (attempts < 100);
    
    return newFood;
  }, []);

  const checkCollisionWithElements = useCallback((head: Position): boolean => {
    return collisionElementsRef.current.some(rect => 
      head.x >= rect.x - 5 && head.x <= rect.x + rect.width + 5 &&
      head.y >= rect.y - 5 && head.y <= rect.y + rect.height + 5
    );
  }, []);

  const resetGame = useCallback(() => {
    collisionElementsRef.current = getCollisionElements();
    
    const { width, height } = getScreenSize();
    const startX = Math.floor(width / 2);
    const startY = Math.floor(height / 2);
    const initialSnake = [{ x: startX, y: startY }];
    setSnake(initialSnake);
    setFood(generateFood(initialSnake));
    setDirection({ x: 1, y: 0 });
    directionRef.current = { x: 1, y: 0 };
    setScore(0);
    setGameOver(false);
    setGameOverReason('');
    setIsPlaying(true);
  }, [generateFood]);

  // 游戏主循环
  useEffect(() => {
    if (!isPlaying || gameOver || !isOpen) return;

    const moveSnake = () => {
      if (Math.random() < 0.1) {
        collisionElementsRef.current = getCollisionElements();
      }

      setSnake(prevSnake => {
        const { width, height } = getScreenSize();
        const newHead: Position = {
          x: prevSnake[0].x + directionRef.current.x * CELL_SIZE,
          y: prevSnake[0].y + directionRef.current.y * CELL_SIZE,
        };

        // 穿墙
        if (newHead.x < 0) newHead.x = width - CELL_SIZE;
        if (newHead.x >= width) newHead.x = 0;
        if (newHead.y < 0) newHead.y = height - CELL_SIZE;
        if (newHead.y >= height) newHead.y = 0;

        // 检查是否撞到自己
        if (prevSnake.some(segment => 
          Math.abs(segment.x - newHead.x) < CELL_SIZE / 2 && 
          Math.abs(segment.y - newHead.y) < CELL_SIZE / 2
        )) {
          setGameOver(true);
          setIsPlaying(false);
          setGameOverReason('撞到自己了！');
          if (score > highScore) {
            setHighScore(score);
          }
          return prevSnake;
        }

        // 检查是否撞到UI元素
        if (checkCollisionWithElements(newHead)) {
          setGameOver(true);
          setIsPlaying(false);
          setGameOverReason('撞到障碍物了！');
          if (score > highScore) {
            setHighScore(score);
          }
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // 检查是否吃到食物
        if (Math.abs(newHead.x - food.x) < CELL_SIZE * 1.5 && 
            Math.abs(newHead.y - food.y) < CELL_SIZE * 1.5) {
          // 根据难度得分
          const baseScore = 10;
          const bonusScore = Math.floor(baseScore * difficulty);
          setScore(prev => prev + bonusScore);
          setFood(generateFood(newSnake));
          
          // 根据难度增长蛇身：难度越高，增长越多
          const growthCount = getGrowthCount();
          if (growthCount > 1) {
            // 在蛇尾添加额外的节点
            const tail = newSnake[newSnake.length - 1];
            for (let i = 1; i < growthCount; i++) {
              newSnake.push({ x: tail.x, y: tail.y });
            }
          }
          return newSnake;
        }

        newSnake.pop();
        return newSnake;
      });
    };

    gameLoopRef.current = setInterval(moveSnake, getInterval());

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [isPlaying, gameOver, food, score, highScore, generateFood, isOpen, checkCollisionWithElements, difficulty, getInterval, getGrowthCount]);

  // 键盘控制
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowUp':
          if (directionRef.current.y !== 1) {
            const newDir = { x: 0, y: -1 };
            setDirection(newDir);
            directionRef.current = newDir;
          }
          e.preventDefault();
          break;
        case 'ArrowDown':
          if (directionRef.current.y !== -1) {
            const newDir = { x: 0, y: 1 };
            setDirection(newDir);
            directionRef.current = newDir;
          }
          e.preventDefault();
          break;
        case 'ArrowLeft':
          if (directionRef.current.x !== 1) {
            const newDir = { x: -1, y: 0 };
            setDirection(newDir);
            directionRef.current = newDir;
          }
          e.preventDefault();
          break;
        case 'ArrowRight':
          if (directionRef.current.x !== -1) {
            const newDir = { x: 1, y: 0 };
            setDirection(newDir);
            directionRef.current = newDir;
          }
          e.preventDefault();
          break;
        case 'Escape':
          onClose();
          break;
        case ' ':
          if (gameOver || !isPlaying) {
            resetGame();
          }
          e.preventDefault();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, gameOver, isPlaying, resetGame, onClose]);

  // 重置状态当关闭时
  useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
      setGameOver(false);
      setScore(0);
      setSnake([{ x: 200, y: 200 }]);
      setDirection({ x: 1, y: 0 });
      directionRef.current = { x: 1, y: 0 };
      setShowSettings(false);
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    } else {
      resetGame();
    }
  }, [isOpen, resetGame]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {/* 分数显示 - 左上角 */}
      <motion.div
        className="fixed top-20 left-6 z-[90] flex flex-col gap-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
      >
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
          <i className="fa-solid fa-star text-yellow-400"></i>
          <span className="text-white font-bold">{score}</span>
        </div>
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
          <i className="fa-solid fa-trophy text-amber-400"></i>
          <span className="text-white/70 text-sm">{highScore}</span>
        </div>
      </motion.div>

      {/* 设置和退出 - 右上角 */}
      <motion.div
        className="fixed top-20 right-6 z-[90] flex items-center gap-3"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
      >
        {/* 难度显示 */}
        <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20 flex items-center gap-2">
          <i className="fa-solid fa-gauge-high text-blue-400"></i>
          <span className="text-white text-sm">{difficulty}x</span>
        </div>
        
        {/* 设置按钮 */}
        <div className="relative">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20 hover:bg-black/70 transition-colors"
          >
            <i className="fa-solid fa-gear text-white"></i>
          </button>
          
          {/* 设置下拉菜单 */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                className="absolute top-12 right-0 bg-black/80 backdrop-blur-md rounded-xl border border-white/20 p-4 min-w-[160px]"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <p className="text-white/60 text-xs mb-3 uppercase tracking-wider">难度选择</p>
                <div className="grid grid-cols-2 gap-2">
                  {DIFFICULTY_OPTIONS.map(d => (
                    <button
                      key={d}
                      onClick={() => {
                        setDifficulty(d);
                        setShowSettings(false);
                        if (!isPlaying || gameOver) {
                          resetGame();
                        }
                      }}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        difficulty === d
                          ? 'bg-green-500 text-white'
                          : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                      }`}
                    >
                      {d}x
                    </button>
                  ))}
                </div>
                <p className="text-white/40 text-xs mt-3">
                  难度越高，速度越快，得分越多
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* 退出按钮 */}
        <button
          onClick={onClose}
          className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20 hover:bg-red-500/50 transition-colors"
        >
          <i className="fa-solid fa-xmark text-white"></i>
        </button>
      </motion.div>

      {/* 蛇 */}
      {snake.map((segment, index) => (
        <motion.div
          key={index}
          className="fixed z-[80] rounded-sm"
          style={{
            left: segment.x,
            top: segment.y,
            width: CELL_SIZE - 2,
            height: CELL_SIZE - 2,
            background: index === 0 
              ? 'linear-gradient(135deg, #22c55e, #16a34a)' 
              : 'linear-gradient(135deg, #4ade80, #22c55e)',
            boxShadow: index === 0 ? '0 0 15px rgba(34, 197, 94, 0.6)' : '0 0 5px rgba(34, 197, 94, 0.3)',
          }}
          initial={false}
          transition={{ duration: 0.05 }}
        >
          {index === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
            </div>
          )}
        </motion.div>
      ))}

      {/* 食物（苹果） */}
      <motion.div
        className="fixed z-[80] flex items-center justify-center text-2xl"
        style={{
          left: food.x,
          top: food.y,
          width: CELL_SIZE,
          height: CELL_SIZE,
        }}
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 0.6, repeat: Infinity }}
      >
        🍎
      </motion.div>

      {/* 游戏结束提示 */}
      {gameOver && (
        <motion.div
          className="fixed inset-0 z-[85] flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="bg-black/80 backdrop-blur-md px-8 py-6 rounded-2xl pointer-events-auto border border-white/20">
            <p className="text-3xl font-bold text-white mb-2 text-center">游戏结束!</p>
            <p className="text-red-400 mb-2 text-center text-sm">{gameOverReason}</p>
            <p className="text-white/80 mb-4 text-center">得分: {score}</p>
            <button
              onClick={resetGame}
              className="w-full px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium"
            >
              再来一局
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SnakeGame;
