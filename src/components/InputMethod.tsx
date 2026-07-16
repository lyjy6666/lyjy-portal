import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 定义输入法类型
interface InputMethodTool {
  id: number;
  name: string;
  systems: string;
  url: string;
  stars: number;
  recommendation: string;
  pros: string;
  cons: string;
}

// 输入法数据
const inputMethodTools: InputMethodTool[] = [
  { id: 1, name: '搜狗输入法 V12', systems: 'Windows、Mac、Linux', url: 'https://pinyin.sogou.com/', stars: 5, recommendation: '国内用户量最高的国民级输入法，V12 版本 AI 能力全面升级，词库生态最完善的全场景拼音输入法标杆。', pros: 'V12 版本 AI 能力全面升级，海量词库实时更新，网络热词、全行业专业词库全覆盖；支持全拼、双拼、五笔全输入模式；智能联想、模糊音纠错能力行业顶尖；AI 助手支持智能润色、翻译、续写；皮肤、快捷短语、表情包功能丰富，办公、聊天全场景适配；跨设备云同步完善。', cons: '免费版有弹窗广告与资讯推送，冗余功能多，有一定系统资源占用；多数进阶功能需登录账号。' },
  { id: 2, name: '微信输入法 1.8', systems: 'Windows、Mac', url: 'https://z.weixin.qq.com/', stars: 4.5, recommendation: '微信官方出品的纯净轻量化输入法，1.8 版本主打极致隐私保护，深度适配腾讯生态，办公聊天双适配。', pros: '完全无广告、无捆绑、无资讯推送，界面极简纯净；1.8 版本深度适配微信 / QQ 生态，文件引用、表情包联动便捷；长句输入准确率高，模糊音纠错能力优秀；隐私保护拉满，无多余用户数据收集；资源占用极低，老旧设备友好。', cons: '专业领域词库覆盖不足，词库丰富度不及头部产品；自定义设置自由度低，皮肤、拓展功能极少；双拼、五笔等小众模式适配不完善。' },
  { id: 3, name: '讯飞输入法 V10', systems: 'Windows、Mac', url: 'https://srf.xunfei.cn/', stars: 4.5, recommendation: '科大讯飞旗下主打语音输入的输入法，V10 版本语音交互能力全球领先，融合星火大模型升级 AI 键，长文本录入、会议记录办公首选。', pros: 'V10 版本语音输入识别率超 98%，支持多语种、多方言、离线语音识别，语音交互顶流；融合讯飞星火大模型，行业首创 AI 键，支持一键开启个性化 AI 对话、润色续写、智能问答；长句、专业术语输入准确率高；支持全拼、双拼、五笔、手写输入；纯净无广告，资源占用低，跨设备同步功能完善。', cons: '纯文字输入的词库丰富度不及搜狗、百度；自定义设置自由度一般；高阶语音、AI 功能需登录，免费版有语音时长限制。' },
  { id: 4, name: '百度输入法 V10', systems: 'Windows、Mac、Linux', url: 'https://srf.baidu.com/', stars: 4, recommendation: '百度旗下 AI 赋能全能型输入法，V10 版本 AI 语音能力全面升级，主打高输入准确率，兼顾纯净度与全场景功能性。', pros: 'V10 版本 AI 加持长句、生僻词输入准确率极高；AI 语音输入识别率行业领先；海量词库覆盖热词与全行业专业词库；支持全拼、双拼、五笔、手写、语音输入；无强制弹窗广告，纯净模式可选；跨设备云同步完善。', cons: '部分拓展功能需登录账号；冗余功能较多，资源占用高于原生输入法；偶尔有可关闭的资讯推送。' },
  { id: 5, name: 'RIME 中州韵输入法引擎（小狼毫/鼠须管）', systems: 'Windows（小狼毫）、Mac（鼠须管）、Linux', url: 'https://rime.im/', stars: 4, recommendation: '开源免费、极致自定义的专业级输入法引擎，极客、双拼 / 五笔用户、隐私敏感用户首选。', pros: '完全开源免费，无广告、无联网、无任何用户数据收集，隐私保护拉满；支持全输入方案，全拼、双拼、五笔、仓颉、方言、古汉语全适配；100% 深度自定义，码表、词库、界面、快捷键均可自由修改；无冗余功能，资源占用极低，稳定性拉满。', cons: '上手门槛极高，新手需大量学习成本；原生无图形化设置界面，需手动修改配置文件；无云同步功能，无智能热词、联想等大众化功能。' },
  { id: 6, name: '微软拼音输入法', systems: 'Windows 全版本原生自带', url: 'https://www.microsoft.com/zh-cn/', stars: 4, recommendation: 'Windows 系统原生免费输入法，零安装、纯净无广告，系统级兼容，办公场景首选原生工具。', pros: '完全免费，系统原生无广告无捆绑，零安装成本；与 Windows 深度整合，兼容性拉满，无卡顿、兼容问题；支持全拼、双拼、五笔，长句输入准确率高；U 模式生僻字输入、办公符号适配极佳。', cons: '词库更新慢，网络热词、专业词库覆盖不足；自定义设置自由度低，无个性化拓展功能；跨设备云同步限制多。' },
  { id: 7, name: '谷歌拼音输入法', systems: 'Windows、Mac', url: 'https://tools.google.com/dlpage/pinyin', stars: 3.5, recommendation: '谷歌旗下开源免费输入法，主打纯净无广告、隐私保护，简洁高效，谷歌生态用户、中英文混合输入场景首选。', pros: '完全开源免费，无广告、无捆绑，界面极简；中英文混合输入准确率极高，英文联想、纠错能力顶尖；支持全拼、双拼，输入逻辑流畅；隐私保护拉满，无多余数据收集，资源占用极低。', cons: '官方已停止更新，国内无服务器，云同步功能无法使用；词库更新停滞，国内热词、专业词库覆盖不足；无五笔模式，自定义功能少。' },
  { id: 8, name: 'QQ 输入法 V6', systems: 'Windows、Mac', url: 'https://qq.pinyin.cn/', stars: 3.5, recommendation: '腾讯旗下轻量化输入法，V6 版本深度适配 QQ 生态，兼顾纯净度与功能性，办公、聊天双适配。', pros: 'V6 版本界面纯净轻量，无强制弹窗广告，可开启纯净模式；词库丰富，支持全拼、双拼、五笔全模式；深度适配 QQ 生态，账号同步、表情包联动便捷；智能联想、长句输入准确率高，资源占用低，老旧电脑适配好。', cons: '功能丰富度不及搜狗，专业词库覆盖不足；更新频率低，新功能上线慢；拓展功能、皮肤数量较少。' },
  { id: 9, name: '手心输入法', systems: 'Windows、Mac', url: 'https://www.xinshuru.com/', stars: 3.5, recommendation: '国内口碑极佳的纯净无广告输入法，主打轻量化、无捆绑，专注输入本身，办公场景友好。', pros: '完全无广告、无弹窗、无资讯推送，界面极简纯净；安装包体积极小，系统资源占用极低；支持全拼、双拼、五笔，智能联想、纠错能力优秀；词库可自定义，支持跨设备云同步，无强制登录要求。', cons: '词库更新速度慢，网络热词覆盖不足；拓展功能极少，无个性化皮肤、表情包等功能；官方更新频率低，新系统适配有延迟。' },
  { id: 10, name: '拼音加加输入法', systems: 'Windows', url: 'https://www.pinyinjiajia.cn/', stars: 3, recommendation: '老牌轻量化拼音输入法，主打极简输入、高效盲打，适合追求输入效率的办公用户。', pros: '安装包体积极小，无广告、无捆绑，资源占用极低；输入逻辑极简，支持双拼、全拼，盲打效率极高；支持自定义短语、词库，生僻字输入便捷；稳定性极强，老旧电脑适配完美。', cons: '官方已停止更新，新系统适配有风险；无云同步功能，词库更新停滞；无智能联想、热词更新功能；仅支持 Windows 系统。' },
];

// 渲染星级
const renderStars = (stars: number) => {
  const fullStars = Math.floor(stars);
  const hasHalfStar = stars % 1 !== 0;
  const emptyStars = 5 - Math.ceil(stars);
  
  return (
    <span className="text-yellow-400">
      {'★'.repeat(fullStars)}
      {hasHalfStar && '☆'}
      {'☆'.repeat(emptyStars)}
      <span className="text-white/60 text-xs ml-1">({stars} 星)</span>
    </span>
  );
};

interface InputMethodProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InputMethod({ isOpen, onClose }: InputMethodProps) {
  const [selectedTool, setSelectedTool] = useState<InputMethodTool | null>(null);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* 主容器 */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-md rounded-2xl border border-white/10 w-full max-w-5xl h-[85vh] shadow-2xl overflow-hidden flex flex-col"
          >
            {/* 标题栏 */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-black/30">
              <div className="flex items-center gap-3">
                <i className="fa-solid fa-keyboard text-2xl text-blue-400"></i>
                <h3 className="text-white text-xl font-bold">输入法</h3>
                <span className="text-xs text-white/40 bg-white/10 px-2 py-1 rounded-full">
                  共 {inputMethodTools.length} 款输入法
                </span>
              </div>
              <button
                onClick={onClose}
                className="text-white/60 hover:text-white transition-colors p-2"
                aria-label="关闭"
              >
                <i className="fa-solid fa-times text-lg"></i>
              </button>
            </div>

            {/* 主内容区 */}
            <div className="flex flex-1 min-h-0">
              {/* 左侧工具列表 */}
              <div 
                className="flex-1 overflow-y-auto p-4 space-y-2 tier-chart-scrollbar"
              >
                {inputMethodTools.map((tool, index) => (
                  <motion.div
                    key={tool.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(index * 0.015, 0.5) }}
                    onClick={() => setSelectedTool(tool)}
                    className={`relative cursor-pointer group transition-all duration-300 ${
                      selectedTool?.id === tool.id ? 'scale-[1.02]' : 'hover:scale-[1.01]'
                    }`}
                  >
                    <div className={`relative h-14 bg-white/5 rounded-lg overflow-hidden border transition-colors ${
                      selectedTool?.id === tool.id ? 'border-blue-500/50' : 'border-white/10 group-hover:border-white/20'
                    }`}>
                      {/* 内容 */}
                      <div className="absolute inset-0 flex items-center px-4">
                        {/* 排名 */}
                        <div className="w-8 text-center shrink-0">
                          <span className={`text-sm font-bold ${
                            index < 3 ? 'text-yellow-400' : 'text-white/60'
                          }`}>
                            {index < 3 ? ['🥇', '🥈', '🥉'][index] : `#${index + 1}`}
                          </span>
                        </div>
                        
                        {/* 名称 */}
                        <div className="flex-1 ml-3 min-w-0">
                          <span className="text-white font-semibold text-sm truncate block">{tool.name}</span>
                        </div>
                        
                        {/* 星级 */}
                        <div className="text-right shrink-0">
                          {renderStars(tool.stars)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* 右侧详情面板 */}
              <AnimatePresence mode="wait">
                {selectedTool ? (
                  <motion.div
                    key={selectedTool.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="w-80 border-l border-white/10 bg-black/20 p-5 overflow-y-auto tier-chart-scrollbar"
                  >
                    {/* 关闭按钮 */}
                    <button
                      onClick={() => setSelectedTool(null)}
                      className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
                    >
                      <i className="fa-solid fa-times"></i>
                    </button>

                    {/* 工具名称 */}
                    <div className="mb-4">
                      <h4 className="text-white text-lg font-bold mb-1">{selectedTool.name}</h4>
                      <div className="flex items-center gap-2">
                        {renderStars(selectedTool.stars)}
                      </div>
                    </div>

                    {/* 适配系统 */}
                    <div className="mb-4">
                      <h5 className="text-white/80 text-xs font-semibold mb-2 flex items-center gap-2">
                        <i className="fa-solid fa-desktop"></i>适配系统
                      </h5>
                      <div className="bg-white/5 rounded-lg p-2">
                        <p className="text-white/80 text-sm">{selectedTool.systems}</p>
                      </div>
                    </div>

                    {/* 推荐理由 */}
                    <div className="mb-4">
                      <h5 className="text-white/80 text-xs font-semibold mb-2 flex items-center gap-2">
                        <i className="fa-solid fa-thumbs-up"></i>推荐理由
                      </h5>
                      <div className="bg-white/5 rounded-lg p-2">
                        <p className="text-white/80 text-sm">{selectedTool.recommendation}</p>
                      </div>
                    </div>

                    {/* 核心优点 */}
                    <div className="mb-4">
                      <h5 className="text-white/80 text-xs font-semibold mb-2 flex items-center gap-2">
                        <i className="fa-solid fa-check text-green-400"></i>核心优点
                      </h5>
                      <div className="bg-green-500/10 rounded-lg p-2 border border-green-500/20">
                        <p className="text-green-300/90 text-sm">{selectedTool.pros}</p>
                      </div>
                    </div>

                    {/* 不足之处 */}
                    <div className="mb-4">
                      <h5 className="text-white/80 text-xs font-semibold mb-2 flex items-center gap-2">
                        <i className="fa-solid fa-exclamation-triangle text-orange-400"></i>不足之处
                      </h5>
                      <div className="bg-orange-500/10 rounded-lg p-2 border border-orange-500/20">
                        <p className="text-orange-300/90 text-sm">{selectedTool.cons}</p>
                      </div>
                    </div>

                    {/* 下载按钮 */}
                    {selectedTool.url && (
                      <a
                        href={selectedTool.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white text-center py-3 rounded-xl font-medium transition-all hover:scale-[1.02] mt-4"
                      >
                        <i className="fa-solid fa-download mr-2"></i>前往官网下载
                      </a>
                    )}
                    {!selectedTool.url && (
                      <div className="block w-full bg-white/10 text-white/60 text-center py-3 rounded-xl font-medium mt-4">
                        <i className="fa-solid fa-info-circle mr-2"></i>系统内置，无需下载
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-80 border-l border-white/10 bg-black/20 p-5 flex flex-col items-center justify-center text-white/40"
                  >
                    <i className="fa-solid fa-keyboard text-4xl mb-3"></i>
                    <p className="text-sm">点击左侧输入法查看详情</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 底部说明 */}
            <div className="px-6 py-2 border-t border-white/10 bg-black/30 text-center">
              <p className="text-white/40 text-xs">
                <i className="fa-solid fa-info-circle mr-1"></i>
                建议仅保留 1-2 款常用输入法，避免安装过多造成系统资源占用
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
