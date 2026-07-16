import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 定义桌面美化工具类型
interface DesktopBeautifyTool {
  id: number;
  name: string;
  systems: string;
  url: string;
  stars: number;
  recommendation: string;
  pros: string;
  cons: string;
}

// 桌面美化工具数据
const desktopBeautifyTools: DesktopBeautifyTool[] = [
  { id: 1, name: 'Wallpaper Engine 2.0', systems: 'Windows', url: 'https://store.steampowered.com/app/431960/Wallpaper_Engine/', stars: 5, recommendation: '全球动态壁纸天花板，Steam 销量冠军，桌面美化首选。', pros: '动态壁纸资源库海量，涵盖二次元、风景、科技、创意等全类型，支持视频、网页、3D、交互式壁纸；硬件加速优化顶级，壁纸运行流畅，资源占用极低，不影响系统性能；支持壁纸自定义、剪辑、特效添加，可制作专属壁纸；内置锁屏美化、音频可视化、桌面图标美化功能；一次性买断制，价格极低，无后续付费。', cons: '仅支持 Windows 系统；无官方 Mac 版本；需安装 Steam 平台；部分高画质 3D 壁纸对显卡有一定要求；Mac 仅能通过第三方工具使用。' },
  { id: 2, name: 'Rainmeter 4.5', systems: 'Windows', url: 'https://www.rainmeter.net/', stars: 5, recommendation: '开源免费桌面定制神器，极客首选，可 100% 自定义桌面。', pros: '完全开源免费无广告无捆绑，无任何功能限制；可高度自定义桌面，支持皮肤插件拓展，实现桌面仪表盘、系统监控、天气、日历、快捷启动、音乐可视化全功能；全球皮肤资源库海量，可打造专属个性化桌面；资源占用极低，稳定性极强，自定义自由度拉满。', cons: '上手门槛极高，新手需要大量学习成本；原生无基础功能，需手动安装皮肤插件；无 Mac/Linux 版本；部分第三方皮肤资源占用偏高。' },
  { id: 3, name: 'Fences 6', systems: 'Windows', url: 'https://www.stardock.com/products/fences/', stars: 4.5, recommendation: '桌面图标分区管理标杆工具，彻底解决桌面杂乱问题，职场办公首选。', pros: '桌面图标分区管理发明者，可将桌面图标按类型、用途分组收纳，一键整理杂乱桌面；支持分区折叠、自动排序、规则自动分类，新文件自动归入对应分区；支持桌面快照、备份还原，多显示器完美适配；界面极简，与 Windows 系统风格完美统一，资源占用极低。', cons: '仅支持 Windows 系统；无免费版，免费试用仅 30 天，核心功能需付费买断；无 Mac/Linux 版本；高阶功能对个人用户有冗余。' },
  { id: 4, name: 'TranslucentTB 2026', systems: 'Windows 10/11', url: 'https://github.com/TranslucentTB/TranslucentTB', stars: 4.5, recommendation: '开源免费任务栏美化工具，一键实现任务栏透明/模糊/亚克力效果。', pros: '完全开源免费无广告无捆绑，微软商店一键安装，零门槛；一键实现 Windows 任务栏透明、模糊、亚克力、纯色效果，支持动态效果切换；支持多显示器适配、深色模式、全屏自动隐藏；资源占用极低，常驻后台无感知，与系统深度整合，无兼容性问题。', cons: '仅支持 Windows 10/11；功能单一，仅能美化任务栏；无 Mac/Linux 版本；自定义自由度有限。' },
  { id: 5, name: 'WindowBlinds 11', systems: 'Windows 10/11', url: 'https://www.stardock.com/products/windowblinds/', stars: 4.5, recommendation: 'Stardock 出品专业级窗口美化工具，可自定义 Windows 全套视觉风格。', pros: '专业级窗口视觉美化工具，可自定义窗口标题栏、按钮、滚动条、边框全套视觉风格；内置海量正版皮肤主题，支持透明、毛玻璃、亚克力效果；与 Fences、Start11 完美兼容，可打造全套桌面美化方案；硬件加速优化完善，资源占用极低，稳定性极强。', cons: '仅支持 Windows 系统；无免费版，免费试用仅 30 天，需付费买断；无 Mac/Linux 版本；部分皮肤与新版系统兼容性偶有问题。' },
  { id: 6, name: 'DeskScapes 11', systems: 'Windows 10/11', url: 'https://www.stardock.com/products/deskscapes/', stars: 4, recommendation: 'Stardock 出品动态壁纸工具，Wallpaper Engine 平替，企业级稳定。', pros: 'Stardock 出品专业级动态壁纸工具，支持视频、动画、图片壁纸，海量正版壁纸资源库；内置壁纸编辑器，可自定义制作专属动态壁纸；支持多显示器适配、定时切换、深色模式；与 Fences、WindowBlinds 完美兼容，可打造全套桌面美化方案，稳定性极强。', cons: '仅支持 Windows 系统；无免费版，需付费买断；无 Mac/Linux 版本；壁纸资源库丰富度不及 Wallpaper Engine；高阶自定义功能有差距。' },
  { id: 7, name: 'iCollections 8', systems: 'MacOS', url: 'https://naarakstudio.com/icollections/', stars: 4, recommendation: 'Mac 平台桌面图标分区管理标杆工具，Fences 的 Mac 替代品。', pros: '原生适配 MacOS 全系芯片，与苹果系统深度整合，无任何兼容问题；可将桌面图标按类型、用途分组收纳，支持分区、相册、日历、网页挂件；支持自动整理、规则分类、桌面快照；界面极简高颜值，操作零门槛，资源占用极低，完美适配苹果生态。', cons: '仅支持 Mac 系统；无免费版，需付费买断；无 Windows/Linux 版本；高阶自定义功能不及 Windows 平台 Fences。' },
  { id: 8, name: 'TrafficMonitor 1.84', systems: 'Windows 10/11', url: 'https://github.com/zhongyang219/TrafficMonitor', stars: 4, recommendation: '开源免费任务栏系统监控工具，实时显示网速、CPU、内存，装机必备。', pros: '完全开源免费无广告无捆绑，微软商店一键安装；可在任务栏、桌面悬浮窗实时显示网速、CPU 占用、内存占用、温度、硬盘读写；支持皮肤自定义、插件拓展、历史流量统计；与 Windows 系统深度整合，资源占用极低，常驻后台无感知，稳定性极强。', cons: '仅支持 Windows 系统；无 Mac/Linux 版本；功能单一，仅系统监控相关；部分皮肤需手动安装，新手友好度一般。' },
  { id: 9, name: 'RollWall', systems: 'Windows', url: 'https://www.rollwall.com/', stars: 3.5, recommendation: '国产免费壁纸定时切换工具，轻量极简，壁纸党省心之选。', pros: '完全免费无广告无捆绑，安装包体积极小，极致轻量化；支持定时自动切换壁纸，可按文件夹、时间间隔、随机/顺序模式切换；支持壁纸历史记录、收藏夹、快捷键切换；资源占用极低，常驻后台无感知，操作零门槛，老旧电脑也能流畅运行。', cons: '仅支持 Windows 系统；无 Mac/Linux 版本；功能单一，仅壁纸切换相关；无动态壁纸、壁纸编辑功能；官方更新频率较低。' },
  { id: 10, name: 'DesktopGuru', systems: 'Windows', url: 'https://www.desktopguru.com/', stars: 3, recommendation: '国产轻量级桌面整理工具，一键整理杂乱桌面，新手友好。', pros: '完全免费无广告无捆绑，一键整理桌面图标，自动分类收纳；支持图标分区、折叠、自动排序、壁纸更换；内置桌面日历、待办事项、天气挂件；界面简洁，操作零门槛，资源占用极低，老旧电脑适配好。', cons: '仅支持 Windows 系统；无 Mac/Linux 版本；自定义自由度不及头部工具；高阶功能缺失；官方更新频率低。' },
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

interface DesktopBeautifyProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DesktopBeautify({ isOpen, onClose }: DesktopBeautifyProps) {
  const [selectedTool, setSelectedTool] = useState<DesktopBeautifyTool | null>(null);

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
                <i className="fa-solid fa-palette text-2xl text-violet-400"></i>
                <h3 className="text-white text-xl font-bold">桌面美化工具</h3>
                <span className="text-xs text-white/40 bg-white/10 px-2 py-1 rounded-full">
                  共 {desktopBeautifyTools.length} 款工具
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
                {desktopBeautifyTools.map((tool, index) => (
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
                      selectedTool?.id === tool.id ? 'border-violet-500/50' : 'border-white/10 group-hover:border-white/20'
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
                        className="block w-full bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white text-center py-3 rounded-xl font-medium transition-all hover:scale-[1.02] mt-4"
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
                <span>数据更新时间：2026年3月 | 仅供参考</span>
                <span>点击工具卡片查看详细信息</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
