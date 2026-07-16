import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 定义系统清理工具类型
interface SystemCleanerTool {
  id: number;
  name: string;
  systems: string;
  url: string;
  stars: number;
  recommendation: string;
  pros: string;
  cons: string;
}

// 系统清理与优化工具数据
const systemCleanerTools: SystemCleanerTool[] = [
  { id: 1, name: 'Everything 1.4', systems: 'Windows', url: 'https://www.voidtools.com/zh-cn/', stars: 5, recommendation: '文件搜索速度天花板级工具，毫秒级全盘检索，装机必备首选。', pros: '完全免费无广告无捆绑，安装包不足 3MB，极致轻量化；毫秒级全盘文件名检索，性能吊打 Windows 原生搜索；支持正则表达式、高级语法、HTTP/FTP/ETP 远程搜索；资源占用极低，常驻后台无感知，支持实时索引更新，国内用户适配性拉满。', cons: '仅支持 Windows 系统；无 Mac/Linux 版本；仅按文件名搜索，不支持文件内容检索；界面设计偏功能性，美化一般。' },
  { id: 2, name: 'Dism++ 2026', systems: 'Windows 7/10/11', url: 'https://www.chuyu.me/zh-Hans.html', stars: 5, recommendation: '国产顶流系统精简与深度优化工具，C 盘清理能力天花板，进阶用户首选。', pros: '完全免费开源无广告无捆绑，国产良心工具；基于 CBS底层 API 实现 WinSxS 清理、系统精简、启动项管理、补丁管理；C 盘清理深度行业顶尖，可释放数 GB 空间；支持系统备份还原、热清理技术，无需重启 PE，操作高效稳定。', cons: '仅支持 Windows 系统；界面偏技术向，新手误操作有系统异常风险；无 Mac/Linux 版本；官方更新频率较低，新版系统适配偶尔滞后。' },
  { id: 3, name: '火绒安全工具箱 6.0', systems: 'Windows', url: 'https://www.huorong.cn/tools', stars: 4.5, recommendation: '火绒旗下纯净免费系统工具集合，无广告无捆绑，国产良心装机必备。', pros: '个人版完全免费无广告无捆绑，无任何流氓行为；工具箱涵盖垃圾清理、启动项管理、弹窗拦截、右键菜单管理、文件粉碎、流量监控；彻底拦截广告弹窗、流氓软件捆绑，优化效果明显；资源占用极低，静默运行无打扰，自定义规则强大。', cons: '仅支持 Windows 系统；无 Mac/Linux 版本；高阶系统优化功能不及专业工具；清理深度不及 Dism++ 等专精工具。' },
  { id: 4, name: 'Geek Uninstaller 2.0', systems: 'Windows', url: 'https://geekuninstaller.com/', stars: 4.5, recommendation: '专精型软件卸载工具，彻底清理残留文件与注册表，办公电脑必备。', pros: '免费版无广告无捆绑，安装包不足 10MB，极致轻量化；一键卸载软件，深度扫描清理注册表、文件夹残留，彻底解决软件卸载不干净的问题；支持强制卸载、批量卸载、Windows 应用卸载；启动速度极快，资源占用极低，操作零门槛。', cons: '仅支持 Windows 系统；免费版仅支持个人非商用，无批量卸载功能；核心全功能需付费买断；无 Mac/Linux 版本；无系统清理、优化功能。' },
  { id: 5, name: 'WizTree 4.0', systems: 'Windows', url: 'https://wiztreefree.com/', stars: 4.5, recommendation: '极速磁盘空间分析工具，MFT 直读技术毫秒级扫描，找大文件神器。', pros: '免费版无广告无捆绑，性能吊打同类工具；采用 MFT 直读技术，毫秒级完成全盘扫描，可视化树状图直观展示文件占用；快速定位大文件、冗余文件，释放磁盘空间效率极高；支持导出扫描结果、CSV 文件，资源占用极低。', cons: '仅支持 Windows 系统；无 Mac/Linux 版本；NTFS 格式性能最佳，其他文件系统速度大幅下降；无文件清理、删除功能，仅分析展示。' },
  { id: 6, name: 'CCleaner 6.2', systems: 'Windows、Mac', url: 'https://www.ccleaner.com/zh-cn', stars: 4, recommendation: '全球老牌系统清理标杆工具，清理深度行业顶尖，专业用户首选。', pros: '免费版核心清理功能完善，无广告无捆绑；垃圾清理、注册表清理、浏览器缓存清理、历史记录清理能力拉满，清理深度极高；内置启动项管理、软件卸载、磁盘分析、文件粉碎功能；系统兼容性强，老旧系统也能完美适配，资源占用极低。', cons: '免费版有功能限制，高阶系统优化、实时监控功能需付费解锁；曾经有过隐私争议，需关闭数据收集；Mac 版功能精简；注册表清理新手操作有风险。' },
  { id: 7, name: 'BleachBit 4.6', systems: 'Windows、Mac、Linux', url: 'https://www.bleachbit.org/', stars: 4, recommendation: '开源免费跨平台系统清理工具，隐私保护拉满，开源爱好者首选。', pros: '完全开源免费无广告无捆绑，无任何功能限制；全平台完美适配，Linux 发行版全覆盖；深度清理系统垃圾、浏览器缓存、历史记录、临时文件，支持文件粉碎、隐私数据彻底清除；无任何用户数据收集，隐私保护拉满；资源占用极低，支持命令行操作。', cons: '界面偏技术向，新手友好度一般；无软件卸载、启动项管理进阶功能；注册表清理功能较弱；官方中文适配不完善。' },
  { id: 8, name: 'SpaceSniffer 1.3', systems: 'Windows', url: 'http://www.uderzo.it/main_products/space_sniffer/', stars: 4, recommendation: '经典磁盘空间可视化分析工具，树状图直观展示文件分布，找文件利器。', pros: '免费版无广告无捆绑，免安装单文件运行，极致便携；可视化树状图直观展示磁盘文件分布，快速定位大文件、冗余文件夹；支持 NTFS/FAT32 全格式，过滤筛选功能强大；资源占用极低，扫描速度快，操作零门槛。', cons: '仅支持 Windows 系统；无 Mac/Linux 版本；扫描速度不及 WizTree（MFT 直读）；界面设计偏老旧；无清理、删除功能，仅分析展示。' },
  { id: 9, name: '360 安全卫士清理 14', systems: 'Windows', url: 'https://weishi.360.cn/jisuban/', stars: 3, recommendation: '360 旗下国民级系统清理工具，功能全面新手友好，国内用户基数最大。', pros: '完全免费，国民级装机量，国内用户适配性拉满；功能全面，覆盖垃圾清理、软件卸载、启动项管理、弹窗拦截、系统修复；对国内流氓软件、恶意程序拦截能力极强；一键优化，操作零门槛，新手友好；老旧系统、低配电脑适配完善。', cons: '免费版有部分功能限制，高阶功能需开通会员；冗余功能较多，资源占用比轻量化工具高；无 Mac/Linux 版本；偶有产品推广与资讯推送，纯净度不及火绒。' },
  { id: 10, name: '腾讯电脑管家清理 14', systems: 'Windows、Mac', url: 'https://guanjia.qq.com/', stars: 3, recommendation: '腾讯旗下国民级系统管理工具，纯净无捆绑，国内用户适配性强。', pros: '免费版无广告无捆绑，功能全面，覆盖病毒查杀、垃圾清理、软件卸载、启动项管理、弹窗拦截、系统修复；与微信/QQ 生态深度联动，账号安全、游戏加速功能完善；界面简洁，操作零门槛，新手友好；对国内流氓软件、钓鱼网站适配性强。', cons: '免费版有部分功能限制，高阶功能需开通会员；冗余功能较多，资源占用比轻量化工具高；Mac 版功能严重精简；偶有资讯推送。' },
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

interface SystemCleanerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SystemCleaner({ isOpen, onClose }: SystemCleanerProps) {
  const [selectedTool, setSelectedTool] = useState<SystemCleanerTool | null>(null);

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
                <i className="fa-solid fa-broom text-2xl text-emerald-400"></i>
                <h3 className="text-white text-xl font-bold">系统清理与优化工具</h3>
                <span className="text-xs text-white/40 bg-white/10 px-2 py-1 rounded-full">
                  共 {systemCleanerTools.length} 款工具
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
                {systemCleanerTools.map((tool, index) => (
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
                      selectedTool?.id === tool.id ? 'border-emerald-500/50' : 'border-white/10 group-hover:border-white/20'
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
                        className="block w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-center py-3 rounded-xl font-medium transition-all hover:scale-[1.02] mt-4"
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
