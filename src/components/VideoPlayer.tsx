import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 定义视频播放器类型
interface VideoPlayerTool {
  id: number;
  name: string;
  systems: string;
  url: string;
  stars: number;
  recommendation: string;
  pros: string;
  cons: string;
}

// 本地视频播放器数据
const videoPlayerTools: VideoPlayerTool[] = [
  { id: 1, name: 'PotPlayer 1.38', systems: 'Windows', url: 'https://potplayer.daum.net/', stars: 5, recommendation: 'Windows平台全能视频播放器标杆，1.38 版本解码能力天花板，装机必备首选，Windows 顶流。', pros: '完全免费无广告无捆绑，无任何功能限制；1.38 版本自研解码引擎，支持几乎所有视频、音频格式，无无法播放的文件；支持4K/8K/HDR/3D视频，硬件加速优化顶级，低配电脑也能流畅播放高清视频；字幕自动匹配、音轨切换、倍速播放、画面调节功能拉满；自定义自由度极高，支持皮肤、插件拓展。', cons: '仅支持Windows系统；无官方Mac/Linux版本；上手有一定学习成本，高阶设置较复杂；官方原版无中文，需安装汉化包。' },
  { id: 2, name: 'VLC 3.0.21', systems: 'Windows、Mac、Linux、全平台', url: 'https://www.videolan.org/vlc/', stars: 5, recommendation: '全球公认开源免费全能播放器，3.0.21 版本全平台适配，格式兼容性天花板，开源跨平台顶流。', pros: '完全开源免费无广告无捆绑，无任何功能限制；3.0.21 版本全平台完美适配，支持几乎所有操作系统、所有音视频格式，甚至支持损坏文件修复播放；支持4K/8K/HDR、直播流、光盘、ISO镜像播放；硬件加速优化完善，资源占用极低，稳定性拉满；插件生态极其丰富，可无限拓展功能。', cons: '界面设计偏老旧，新手友好度一般；默认设置播放体验不及专属平台播放器；字幕美化、画面调节功能不及头部工具；高阶设置门槛高。' },
  { id: 3, name: 'MPV 0.39', systems: 'Windows、Mac、Linux', url: 'https://mpv.io/', stars: 5, recommendation: '开源免费极简播放器，0.39 版本极客首选，解码能力顶尖，凭老电脑 4K 秒开、CPU 占用极低走红，可高度自定义，极客开源顶流。', pros: '完全开源免费无广告，无任何功能限制；0.39 版本全平台适配，解码能力拉满，支持所有音视频格式，4K/8K/HDR完美适配；硬件加速优化顶级，资源占用极低，启动速度毫秒级，老旧电脑也能流畅播放 4K 视频，CPU 占用极低；支持命令行操作、脚本自定义、插件拓展，可100%自定义播放界面与功能。', cons: '原生无图形化操作界面，上手门槛极高，新手完全无法使用；默认无字幕匹配、播放列表等基础功能，需手动配置；无官方中文适配。' },
  { id: 4, name: 'IINA 1.3（Mac）', systems: 'MacOS', url: 'https://iina.io/', stars: 4.5, recommendation: 'Mac平台原生免费播放器标杆，1.3 版本完美适配苹果生态，颜值与实力并存，Mac 原生顶流。', pros: '完全开源免费无广告，1.3 版本原生适配MacOS全系芯片，与苹果系统深度整合；基于MPV内核，解码能力拉满，支持几乎所有音视频格式；界面极简高颜值，完美适配Mac深色模式、触控板手势；支持4K/HDR/在线流媒体、字幕自动匹配、画中画播放；资源占用极低，启动速度极快。', cons: '仅支持Mac系统；无Windows/Linux版本；进阶自定义功能不及PotPlayer；部分冷门格式适配有瑕疵。' },
  { id: 5, name: 'MPC-HC 2.2', systems: 'Windows', url: 'https://mpc-hc.org/', stars: 4.5, recommendation: 'Windows开源免费轻量级播放器，2.2 版本老电脑救星，极致轻量化，老牌开源顶流。', pros: '完全开源免费无广告，2.2 版本安装包不足10MB，极致轻量化；基于经典MPC内核，解码能力强，支持全主流音视频格式；硬件加速优化完善，Windows XP等老旧系统、低配电脑也能流畅运行；资源占用极低，启动速度极快，无任何冗余功能。', cons: '仅支持Windows系统；界面设计偏老旧；无字幕自动匹配、在线流媒体等进阶功能；部分新格式需手动安装解码器。' },
  { id: 6, name: 'Infuse 7（Mac/iOS）', systems: 'MacOS、iOS、Apple TV', url: 'https://firecore.com/infuse', stars: 4.5, recommendation: 'Apple 生态顶级播放器，7 版本完美适配 Mac/iOS/Apple TV，主打海报墙、元数据管理，Apple 生态顶流。', pros: '7 版本原生适配 Apple 全系设备，与苹果生态深度整合；支持几乎所有音视频格式，解码能力强；独家海报墙、元数据自动匹配功能，可打造个人影视库；支持 4K/HDR/杜比视界/杜比全景声、硬件加速、字幕自动匹配、AirPlay 投屏；界面极简高颜值，资源占用极低。', cons: '仅支持 Apple 生态；高阶功能需付费订阅 Pro 版，价格不低；无 Windows/Android 版本；对非 Apple 生态用户不友好。' },
  { id: 7, name: 'MX Player 1.45（Android）', systems: 'Android', url: 'https://www.mxplayer.in/', stars: 4, recommendation: 'Android 平台用户量最大的播放器，1.45 版本全格式兼容，安卓顶流。', pros: '1.45 版本完全免费，支持几乎所有音视频格式，解码能力强；支持 4K/HDR、硬件加速、多核心解码优化；支持字幕自动匹配、在线流媒体、倍速播放、手势控制；界面简洁，操作零门槛，对安卓设备适配完美；插件生态丰富。', cons: '仅支持 Android 系统；免费版有广告推送；无 Windows/Mac/iOS 版本；部分高阶功能需付费解锁。' },
  { id: 8, name: 'nPlayer 3（iOS）', systems: 'iOS、iPadOS', url: 'https://nplayer.com/', stars: 4, recommendation: 'iOS 平台顶级播放器，3 版本全格式兼容，主打高画质播放，iOS 顶流。', pros: '3 版本支持几乎所有音视频格式，无需转码直接播放；支持 4K/HDR、硬件加速、杜比视界/杜比全景声；支持字幕自动匹配、音轨切换、倍速播放、手势控制、画中画；支持 SMB/FTP/UPnP/DLNA 网络流媒体播放；界面简洁，操作零门槛，对 iOS 设备适配完美。', cons: '仅支持 iOS/iPadOS 系统；无免费版，需付费买断，门槛不低；无 Windows/Mac/Android 版本；高阶自定义功能较少。' },
  { id: 9, name: '星幕播放器', systems: 'Windows', url: 'https://www.starsplayer.com/', stars: 3.5, recommendation: '国产免费轻量播放器，主打纯净无广告、全格式兼容，国产轻量。', pros: '完全免费无广告无捆绑，安装包体积极小；支持全主流音视频格式，解码能力强；支持4K/HDR、硬件加速、字幕自动匹配、倍速播放、画面调节；界面简洁，操作零门槛，资源占用极低，老旧电脑适配好。', cons: '仅支持Windows系统；无Mac/Linux版本；高阶自定义功能较少；官方更新频率一般；知名度较低。' },
  { id: 10, name: 'QQ影音', systems: 'Windows、Mac', url: 'https://player.qq.com/', stars: 3.5, recommendation: '腾讯旗下国产老牌免费播放器，纯净无广告，全格式兼容，国产老牌。', pros: '完全免费无广告无捆绑，腾讯官方出品；支持全主流音视频格式，解码能力强；支持4K/HDR、硬件加速、字幕自动匹配、倍速播放、画面调节、截图、GIF录制；界面简洁，操作零门槛，资源占用极低，国内用户适配性强。', cons: '官方更新频率较低，新格式适配有延迟；高阶自定义功能较少；无Linux版本；Mac版功能比Windows版有精简。' },
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

interface VideoPlayerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VideoPlayer({ isOpen, onClose }: VideoPlayerProps) {
  const [selectedTool, setSelectedTool] = useState<VideoPlayerTool | null>(null);

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
                <i className="fa-solid fa-play text-2xl text-pink-400"></i>
                <h3 className="text-white text-xl font-bold">本地视频播放器</h3>
                <span className="text-xs text-white/40 bg-white/10 px-2 py-1 rounded-full">
                  共 {videoPlayerTools.length} 款工具
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
                {videoPlayerTools.map((tool, index) => (
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
                      selectedTool?.id === tool.id ? 'border-pink-500/50' : 'border-white/10 group-hover:border-white/20'
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
                        className="block w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white text-center py-3 rounded-xl font-medium transition-all hover:scale-[1.02] mt-4"
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
