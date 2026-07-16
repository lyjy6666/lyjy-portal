import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 定义压缩解压工具类型
interface CompressionTool {
  id: number;
  name: string;
  systems: string;
  url: string;
  stars: number;
  recommendation: string;
  pros: string;
  cons: string;
}

// 压缩解压工具数据
const compressionTools: CompressionTool[] = [
  { id: 1, name: '7-Zip 24', systems: 'Windows、Linux', url: 'https://www.7-zip.org/', stars: 5, recommendation: '全球公认开源免费压缩解压标杆，24 版本无广告无限制，装机必备首选。', pros: '完全开源免费，无广告无捆绑，无任何功能限制；24 版本自研7z格式压缩比行业顶尖，远超同类软件；支持几乎所有压缩格式，兼容ZIP、RAR、7z、ISO等全格式；支持加密压缩、分卷压缩、批量处理、命令行操作；安装包不足2MB，资源占用极低，老旧电脑适配完美。', cons: '无官方Mac版本；界面设计偏老旧，新手友好度一般；无额外拓展功能，仅专注压缩解压核心需求。' },
  { id: 2, name: 'Bandizip 7', systems: 'Windows、Mac', url: 'https://www.bandisoft.com/bandizip/', stars: 5, recommendation: '韩国顶流跨平台高颜值全能压缩解压工具，7 版本新手友好，国内用户首选。', pros: '7 版本免费版无广告无捆绑，界面极简美观，操作零门槛；压缩解压速度极快，支持全格式兼容，完美适配RAR、7z、ZIP等主流格式；支持加密压缩、分卷压缩、批量处理、图片预览、恶意文件扫描；全平台适配，对新系统、新芯片适配完美。', cons: '免费版有部分功能限制；高阶批量处理、格式转换、智能修复功能需付费解锁；Mac版功能比Windows版有明显精简。' },
  { id: 3, name: 'NanaZip 3', systems: 'Windows 10/11', url: 'https://github.com/M2Team/NanaZip', stars: 5, recommendation: '7-Zip 现代化分支开源免费压缩工具，3 版本完美适配 Windows 11，微软商店上架的原生级工具，Windows 11 新系统压缩首选。', pros: '完全开源免费无广告，3 版本基于 7-Zip 内核开发，压缩比、兼容性拉满；微软商店上架的原生级工具，非第三方魔改；完美适配 Windows 10/11，原生支持右键菜单一步解压、深色模式、高 DPI 缩放；支持全格式压缩解压，加密、分卷、批量处理功能完善；一键安装，新手零门槛，彻底解决 WinRAR 弹窗广告痛点。', cons: '仅支持 Windows 10/11，不兼容老旧系统；无 Mac/Linux 版本；界面自定义自由度低；拓展功能不及 7-Zip 丰富。' },
  { id: 4, name: 'WinRAR 7.1', systems: 'Windows、Mac、Linux', url: 'https://www.win-rar.com/', stars: 4.5, recommendation: '全球老牌经典压缩解压工具，7.1 版本 RAR 格式发明者，格式兼容性天花板，老牌国际。', pros: 'RAR格式原生支持，格式兼容性拉满，几乎无无法解压的文件；7.1 版本压缩解压速度快，支持加密压缩、分卷压缩、批量处理、文件修复；对老旧系统、老旧文件兼容性极强，稳定性拉满；安装包体积极小，资源占用极低。', cons: '免费版有弹窗广告，付费买断门槛高；界面设计多年未更新，偏老旧；压缩比不及7-Zip；Mac版功能精简，适配性一般。' },
  { id: 5, name: 'PeaZip 10', systems: 'Windows、Linux、Mac', url: 'https://peazip.github.io/', stars: 4, recommendation: '开源免费跨平台全能压缩工具，10 版本全格式支持，隐私保护拉满，开源跨平台。', pros: '完全开源免费无广告，10 版本无任何功能限制；支持200+压缩格式，全平台完美适配；支持强加密压缩、分卷压缩、批量处理、文件校验、安全删除；界面可自定义，支持命令行操作，无任何用户数据收集，隐私保护拉满。', cons: '界面设计偏技术向，新手友好度一般；RAR格式仅支持解压，不支持压缩；压缩速度不及头部商业工具；官方中文适配不完善。' },
  { id: 6, name: 'The Unarchiver 4（Mac）', systems: 'MacOS', url: 'https://theunarchiver.com/', stars: 4, recommendation: 'Mac平台装机必备免费解压工具，4 版本完美解决 Mac 原生解压兼容问题，Mac 解压顶流。', pros: '完全免费无广告无捆绑，Mac App Store一键安装；4 版本原生适配MacOS全系芯片，支持几乎所有压缩格式，解决Mac原生无法解压RAR、7z、ISO等格式的痛点；解压速度快，资源占用极低，操作零门槛，自动适配编码无乱码。', cons: '仅支持解压，不支持压缩功能；仅适配Mac系统；无加密、分卷、批量处理进阶功能；界面极简，无自定义设置。' },
  { id: 7, name: '360压缩 5', systems: 'Windows', url: 'https://yasuo.360.cn/', stars: 3.5, recommendation: '国产免费压缩解压工具，5 版本新手友好，国内格式适配性强，国民级产品。', pros: '完全免费无广告（可开启纯净模式），界面简洁，操作零门槛；支持全格式压缩解压，对国内特殊格式、分卷文件适配性极强；支持加密压缩、分卷压缩、批量处理、恶意文件扫描、图片预览；内置云解压功能，与360云盘深度联动。', cons: '仅支持Windows系统；默认安装有捆绑推荐，需手动关闭纯净模式；无Mac/Linux版本；压缩比不及7-Zip；偶尔有资讯推送。' },
  { id: 8, name: '好压 6', systems: 'Windows', url: 'https://haozip.2345.cc/', stars: 3.5, recommendation: '国产老牌免费压缩解压工具，6 版本兼容性强，老旧系统友好，国产轻量。', pros: '完全免费，6 版本支持全格式压缩解压，对老旧文件、特殊格式兼容性极强；支持加密压缩、分卷压缩、批量处理、文件修复、图片格式转换；界面简洁，操作零门槛，对老旧电脑、老旧系统适配完美；资源占用极低。', cons: '免费版有弹窗广告、资讯推送；安装时有捆绑软件推荐，需手动取消；无Mac/Linux版本；压缩比一般；官方更新频率低。' },
  { id: 9, name: '快压 5', systems: 'Windows', url: 'https://www.kuaizip.com/', stars: 3, recommendation: '国产免费压缩解压工具，5 版本主打自有 KZ 格式高压缩比，国产轻量。', pros: '完全免费，5 版本自研 KZ 格式压缩比高；支持全主流格式压缩解压，界面简洁，操作零门槛；支持加密压缩、分卷压缩、批量处理；安装包体积极小，资源占用极低，老旧电脑适配好。', cons: '免费版有弹窗广告、捆绑安装现象；KZ 格式为私有格式，兼容性差；无Mac/Linux版本；压缩比不及7-Zip；口碑一般。' },
  { id: 10, name: '2345好压', systems: 'Windows', url: 'https://haozip.2345.cc/', stars: 3, recommendation: '国产老牌免费压缩解压工具，兼容性强，老旧系统友好，国产轻量。', pros: '完全免费，支持全格式压缩解压，对老旧文件、特殊格式兼容性极强；支持加密压缩、分卷压缩、批量处理、文件修复；界面简洁，操作零门槛，对老旧电脑、老旧系统适配完美；资源占用极低。', cons: '免费版有弹窗广告、资讯推送较多；安装时有捆绑软件推荐，需手动取消；无Mac/Linux版本；压缩比一般；口碑一般。' },
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

interface CompressionToolProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CompressionTool({ isOpen, onClose }: CompressionToolProps) {
  const [selectedTool, setSelectedTool] = useState<CompressionTool | null>(null);

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
                <i className="fa-solid fa-file-zipper text-2xl text-amber-400"></i>
                <h3 className="text-white text-xl font-bold">压缩解压工具</h3>
                <span className="text-xs text-white/40 bg-white/10 px-2 py-1 rounded-full">
                  共 {compressionTools.length} 款工具
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
                {compressionTools.map((tool, index) => (
                  <motion.div
                    key={tool.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(index * 0.02, 0.5) }}
                    onClick={() => setSelectedTool(tool)}
                    className={`relative cursor-pointer group transition-all duration-300 ${
                      selectedTool?.id === tool.id ? 'scale-[1.02]' : 'hover:scale-[1.01]'
                    }`}
                  >
                    <div className={`relative h-14 bg-white/5 rounded-lg overflow-hidden border transition-colors ${
                      selectedTool?.id === tool.id ? 'border-amber-500/50' : 'border-white/10 group-hover:border-white/20'
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
                        className="block w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-center py-3 rounded-xl font-medium transition-all hover:scale-[1.02] mt-4"
                      >
                        <i className="fa-solid fa-download mr-2"></i>前往官网下载
                      </a>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-80 border-l border-white/10 bg-black/20 p-5 flex flex-col items-center justify-center text-white/40"
                  >
                    <i className="fa-solid fa-mouse-pointer text-4xl mb-3"></i>
                    <p className="text-sm">点击左侧工具查看详情</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 底部说明 */}
            <div className="px-6 py-2 bg-black/30 border-t border-white/10">
              <div className="flex items-center justify-between text-xs text-white/40">
                <span>数据更新时间：2026年7月 | 仅供参考</span>
                <span>点击工具卡片查看详细信息</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
