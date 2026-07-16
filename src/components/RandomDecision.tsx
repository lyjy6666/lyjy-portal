import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RandomDecisionProps {
  isOpen: boolean;
  onClose: () => void;
}

const RandomDecision: React.FC<RandomDecisionProps> = ({ isOpen, onClose }) => {
  const [options, setOptions] = useState<string[]>(['选项A', '选项B']);
  const [inputValue, setInputValue] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  // 添加选项
  const addOption = () => {
    if (inputValue.trim() && options.length < 10) {
      setOptions([...options, inputValue.trim()]);
      setInputValue('');
      setResult(null);
    }
  };

  // 删除选项
  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
      setResult(null);
    }
  };

  // 随机选择
  const makeDecision = () => {
    if (options.length < 2) return;
    
    setIsSpinning(true);
    setResult(null);

    // 模拟转盘效果
    let count = 0;
    const maxCount = 15 + Math.floor(Math.random() * 10);
    
    const interval = setInterval(() => {
      setResult(options[Math.floor(Math.random() * options.length)]);
      count++;
      
      if (count >= maxCount) {
        clearInterval(interval);
        setIsSpinning(false);
      }
    }, 100);
  };

  // 重置
  const reset = () => {
    setOptions(['选项A', '选项B']);
    setInputValue('');
    setResult(null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* 背景遮罩 */}
        <motion.div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* 主内容 */}
        <motion.div
          className="relative bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 w-full max-w-md shadow-2xl"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
        >
          {/* 关闭按钮 */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
          >
            <i className="fa-solid fa-times text-lg"></i>
          </button>

          {/* 标题 */}
          <div className="text-center mb-6">
            <h3 className="text-white text-xl font-semibold flex items-center justify-center gap-2">
              <span className="text-2xl">🎲</span>
              随机决策器
            </h3>
            <p className="text-white/50 text-sm mt-1">选择困难症救星</p>
          </div>

          {/* 添加选项 */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addOption()}
              placeholder="输入选项..."
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-white/40"
              maxLength={20}
            />
            <button
              onClick={addOption}
              disabled={options.length >= 10 || !inputValue.trim()}
              className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="fa-solid fa-plus"></i>
            </button>
          </div>

          {/* 选项列表 */}
          <div className="bg-white/5 rounded-xl p-4 mb-4 max-h-40 overflow-y-auto">
            <div className="flex flex-wrap gap-2">
              {options.map((option, index) => (
                <motion.div
                  key={index}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                    result === option && !isSpinning
                      ? 'bg-yellow-500/30 text-yellow-300 ring-2 ring-yellow-400/50'
                      : 'bg-white/10 text-white/80'
                  }`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  layout
                >
                  <span>{option}</span>
                  {options.length > 2 && (
                    <button
                      onClick={() => removeOption(index)}
                      className="text-white/40 hover:text-red-400 transition-colors"
                    >
                      <i className="fa-solid fa-xmark text-xs"></i>
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
            {options.length < 2 && (
              <p className="text-white/40 text-xs text-center">至少需要2个选项</p>
            )}
          </div>

          {/* 结果显示 */}
          <AnimatePresence mode="wait">
            {result && (
              <motion.div
                key={result}
                className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-4 mb-4 text-center border border-yellow-400/30"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
              >
                <p className="text-white/60 text-sm mb-1">命运之选</p>
                <motion.p
                  className="text-2xl font-bold text-yellow-300"
                  animate={isSpinning ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.1, repeat: isSpinning ? Infinity : 0 }}
                >
                  {result}
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <button
              onClick={makeDecision}
              disabled={options.length < 2 || isSpinning}
              className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                isSpinning
                  ? 'bg-purple-500/30 text-purple-300'
                  : 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 text-white hover:from-purple-500/40 hover:to-pink-500/40'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSpinning ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  命运决定中...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-dice"></i>
                  开始选择
                </>
              )}
            </button>
            <button
              onClick={reset}
              className="px-4 py-3 rounded-xl font-medium bg-white/10 text-white/70 hover:bg-white/20 transition-all"
            >
              <i className="fa-solid fa-rotate-left"></i>
            </button>
          </div>

          {/* 提示 */}
          <p className="text-white/30 text-xs text-center mt-4">
            最多添加10个选项，按回车快速添加
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RandomDecision;
