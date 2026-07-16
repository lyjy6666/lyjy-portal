import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 定义安全软件类型
interface SecurityTool {
  id: number;
  name: string;
  systems: string;
  url: string;
  stars: number; // 1-5
  recommendation: string;
  pros: string;
  cons: string;
}

// 安全软件数据
const securityTools: SecurityTool[] = [
  { id: 1, name: '火绒安全 6.0', systems: 'Windows', url: 'https://www.huorong.cn/', stars: 5, recommendation: '国内口碑标杆纯净安全顶流，6.0 版本个人版永久免费，无广告无捆绑，专注纯净底层防护，国产安全首选。', pros: '6.0 版本系统资源占用极低，核心功能含病毒查杀、弹窗拦截、勒索防护、启动项管理全面升级；自定义规则强大，无冗余功能，静默防护无打扰，对流氓软件拦截能力拉满；彻底拦截办公软件、网页弹窗广告，办公环境纯净。', cons: '仅支持 Windows 系统；无 Mac/Linux 版本；企业级防护功能需付费开通；云查杀能力相对较弱。' },
  { id: 2, name: 'Microsoft Defender（Windows 11）', systems: 'Windows 10/11 系统原生自带', url: 'https://www.microsoft.com/zh-cn/windows/comprehensive-security', stars: 4.5, recommendation: '微软官方系统原生免费杀毒软件，Windows 11 用户默认安全首选，深度整合系统底层，系统内置纯净防护标杆。', pros: '完全免费，系统原生无广告无捆绑；资源占用极低，系统兼容性拉满；国际权威杀毒评测常年稳居第一梯队，查杀率比肩付费专业软件；覆盖病毒查杀、防火墙、勒索软件防护、家长控制全功能。', cons: '仅支持 Windows 10/11；对国产流氓软件拦截能力一般；无深度自定义规则。' },
  { id: 3, name: '卡巴斯基 2026（Kaspersky）', systems: 'Windows、Mac、Linux', url: 'https://www.kaspersky.com.cn/', stars: 4, recommendation: '全球顶级旗舰安全软件，2026 版本主打极致查杀率与全方位网络防护。注意：中国地区已禁售，购买前需确认本地可用性。', pros: '自研顶级杀毒引擎，国际权威评测常年位居榜首，对病毒、木马、勒索软件、零日攻击、APT 攻击查杀拦截能力拉满；2026 版本内置防火墙、隐私保护、安全支付、家长控制、VPN 功能，资源占用优化优秀。', cons: '付费软件价格较高；中国地区已禁售，无法正常购买与更新病毒库；在部分国家存在信任争议；免费版功能极其有限。' },
  { id: 4, name: 'Bitdefender 2026', systems: 'Windows、Mac', url: 'https://www.bitdefender.com/', stars: 4, recommendation: '罗马尼亚老牌顶级杀毒软件，2026 版本常年位居国际杀毒评测榜首，国际顶流，主打全方位终端安全防护。', pros: '自研杀毒引擎查杀率全球领先，对新型恶意软件、勒索病毒、钓鱼网站拦截能力极强；资源占用极低，静默防护无打扰；免费版基础防护完善，付费版覆盖防火墙、系统优化、隐私保护、家长控制全维度。', cons: '付费版价格较高；对国产流氓软件适配性一般；免费版功能相对基础。' },
  { id: 5, name: 'ESET NOD32 2026', systems: 'Windows、Mac、Linux', url: 'https://www.eset.com/cn/', stars: 4, recommendation: '欧洲老牌顶级安全软件，2026 版本主打轻量、极速、低占用、高查杀率，老旧设备友好，国际轻量顶流。', pros: '自研 ThreatSense 引擎，查杀速度快，系统资源占用极低，老旧电脑也能流畅运行；误报率极低，对病毒、木马、勒索软件、恶意脚本查杀能力强，静默运行无打扰，稳定性极强。', cons: '付费软件，免费试用版有时限；界面相对传统；对国产流氓软件适配性一般。' },
  { id: 6, name: '诺顿 2026（Norton）', systems: 'Windows、Mac', url: 'https://us.norton.com/', stars: 4, recommendation: '赛门铁克旗下全球顶级旗舰安全软件，2026 版本老牌安全厂商，主打个人数字生活全场景防护，国际老牌。', pros: '自研顶级杀毒引擎，查杀率稳居国际第一梯队；内置防火墙、VPN、密码管理器、身份盗窃保护、云备份、家长控制功能，家庭用户友好，防护维度全面，稳定性拉满。', cons: '付费软件价格较高；资源占用偏高，对低配电脑不友好；订阅制模式。' },
  { id: 7, name: '360 安全卫士 14', systems: 'Windows', url: 'https://weishi.360.cn/', stars: 3.5, recommendation: '国内用户量最高的全能型安全与系统管理工具，14 版本一站式覆盖安全防护、系统优化、功能拓展。国民级产品，但广告较多需手动关闭。', pros: '免费版功能全面，病毒查杀、木马拦截、系统修复、垃圾清理能力成熟；海量拓展工具，对国内恶意软件、钓鱼网站适配性极强，新手零门槛上手。', cons: '广告推送较多，需手动关闭；功能过于臃肿，对低配电脑不友好；安装包体积大；有捆绑安装现象。' },
  { id: 8, name: '腾讯电脑管家 14', systems: 'Windows、Mac', url: 'https://guanjia.qq.com/', stars: 3.5, recommendation: '腾讯旗下全能型安全工具，14 版本深度适配 Windows 生态，与腾讯账号体系无缝联动，国民级产品。', pros: '免费无捆绑，核心防护 + 系统优化双在线；深度整合 QQ / 微信账号安全、游戏加速、微信文件管理，对国内钓鱼网站、恶意软件拦截适配性强。', cons: '资源占用偏高，对低配电脑不友好；部分功能需登录QQ账号使用；冗余功能较多。' },
  { id: 9, name: '迈克菲 2026（McAfee）', systems: 'Windows、Mac', url: 'https://www.mcafee.com/zh-cn/index.html', stars: 3.5, recommendation: '英特尔旗下全球知名安全软件，2026 版本全球设备预装覆盖率极高，主打多设备跨平台防护，国际老牌。', pros: '自研杀毒引擎，对病毒、木马、钓鱼网站、网络攻击查杀拦截能力强；内置防火墙、实时防护、隐私保护、身份安全、家长控制功能，支持多设备统一管理，界面友好，新手易上手。', cons: '资源占用偏高，对低配电脑不友好；预装软件难以卸载干净；订阅制价格较高。' },
  { id: 10, name: 'Avast 2026', systems: 'Windows、Mac', url: 'https://www.avast.com/zh-cn/index', stars: 3.5, recommendation: '全球用户量超 4 亿的知名免费杀毒软件，2026 版本基础防护完善，新手友好度高，免费国际顶流。', pros: '免费版功能全面，覆盖实时病毒查杀、木马拦截、网页防护、邮件防护、WiFi 安全检测；AI 赋能杀毒引擎，查杀率高，对新型恶意软件响应速度快，内置免费密码管理器，付费版可解锁进阶防护功能。', cons: '免费版有广告推送；隐私争议历史；高级功能需付费。' },
  { id: 11, name: 'AVG 2026', systems: 'Windows、Mac', url: 'https://www.avg.com/zh-cn', stars: 3.5, recommendation: 'Avast 旗下知名免费杀毒软件，2026 版本主打轻量、高效的基础防护，全球用户量极大，免费国际顶流。', pros: '免费版提供完善的实时病毒查杀、木马拦截、网页防护、邮件防护、WiFi 安全检测；与 Avast 共享顶级杀毒引擎，查杀率稳居国际前列，扫描速度快，资源占用低，界面简洁，新手零门槛。', cons: '免费版有广告推送；高级功能需付费；与 Avast 功能重复。' },
  { id: 12, name: 'Avira 小红伞 2026', systems: 'Windows、Mac', url: 'https://www.avira.com/zh-cn', stars: 3.5, recommendation: '德国老牌知名免费杀毒软件，2026 版本以严谨的查杀能力和极低的误报率著称，主打纯净高效，免费国际顶流。', pros: '自研杀毒引擎，查杀率高，误报率极低，对勒索软件、木马、恶意软件拦截能力强；免费版提供基础实时防护、病毒查杀、网页防护，无广告无捆绑，德国技术严谨可靠。', cons: '免费版功能相对基础；界面广告推广付费版；无防火墙功能。' },
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

interface SecuritySoftwareProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SecuritySoftware({ isOpen, onClose }: SecuritySoftwareProps) {
  const [selectedTool, setSelectedTool] = useState<SecurityTool | null>(null);

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
                <i className="fa-solid fa-shield-halved text-2xl text-green-400"></i>
                <h3 className="text-white text-xl font-bold">安全软件</h3>
                <span className="text-xs text-white/40 bg-white/10 px-2 py-1 rounded-full">
                  共 {securityTools.length} 款软件
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

            {/* 顶部提示 */}
            <div className="px-6 py-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-b border-amber-500/30">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-triangle-exclamation text-amber-400"></i>
                <p className="text-amber-200 text-sm">
                  <span className="font-semibold">重要提示：</span>所有软件均提供官方正版链接，请勿从第三方网站、下载站下载，避免捆绑恶意软件。
                </p>
              </div>
            </div>

            {/* 主内容区 */}
            <div className="flex flex-1 min-h-0">
              {/* 左侧工具列表 */}
              <div 
                className="flex-1 overflow-y-auto p-4 space-y-2 tier-chart-scrollbar"
              >
                {securityTools.map((tool, index) => (
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
                      selectedTool?.id === tool.id ? 'border-green-500/50' : 'border-white/10 group-hover:border-white/20'
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
                        className="block w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-center py-3 rounded-xl font-medium transition-all hover:scale-[1.02] mt-4"
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
                    <i className="fa-solid fa-shield-halved text-4xl mb-3"></i>
                    <p className="text-sm">点击左侧软件查看详情</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 底部说明 */}
            <div className="px-6 py-2 border-t border-white/10 bg-black/30 text-center">
              <p className="text-white/40 text-xs">
                <i className="fa-solid fa-info-circle mr-1"></i>
                同一台电脑建议仅保留 1 款常驻后台的主防护软件，避免多款安全软件同时开启实时防护造成系统冲突
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
