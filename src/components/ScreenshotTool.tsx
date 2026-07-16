import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 定义截图工具类型
interface ScreenshotTool {
  id: number;
  name: string;
  systems: string;
  url: string;
  stars: number;
  recommendation: string;
  pros: string;
  cons: string;
}

// 截图工具数据
const screenshotTools: ScreenshotTool[] = [
  { id: 1, name: 'Snipaste 3.0', systems: 'Windows、Mac', url: 'https://www.snipaste.com/', stars: 5, recommendation: '全球口碑标杆级截图 + 贴图工具，3.0 版本全新升级新增 OCR 文字识别，办公效率神器，截图工具行业首选。', pros: '完全无广告无捆绑，免费版核心功能拉满；截图精准度拉满，支持全屏/选区/窗口/滚动截图；3.0 版本新增原生 OCR 文字识别，办公文字提取效率翻倍；独家贴图功能可将截图钉在屏幕顶层，办公对照、教程制作效率翻倍；标注工具齐全，快捷键完全自定义，资源占用极低。', cons: 'Mac版功能比Windows版有精简；高阶批量功能需付费解锁；3.0 OCR 识别准确率不及专业 OCR 工具。' },
  { id: 2, name: 'PixPin 2.0', systems: 'Windows、Mac', url: 'https://pixpinapp.com/', stars: 5, recommendation: '2026 年国产免费全能截图新标杆，2.0 版本一站式覆盖截图、贴图、长截图、OCR、录屏、GIF 全功能，Snipaste 的强力竞品。', pros: '完全免费无广告无捆绑，Windows 与 Mac 双平台原生适配；功能极度全面，截图、贴图、滚动长截图、离线 OCR 文字识别、录屏、GIF 录制一站式覆盖；离线 OCR 无需联网即可识别，隐私保护拉满；2.0 版本标注工具全面升级，支持序号、马赛克、模糊打码、AI 智能标注；快捷键自定义完善，资源占用极低，持续活跃更新。', cons: '上线时间较短，生态、皮肤资源不及老牌工具丰富；Mac 版仍处测试阶段，偶发兼容性小问题；高阶批量处理功能较弱。' },
  { id: 3, name: 'CleanShot X 2（Mac）', systems: 'MacOS', url: 'https://cleanshot.com/', stars: 4.5, recommendation: 'Mac平台旗舰级全能截图工具，2.0 版本功能无短板，专业内容创作者、职场人首选。', pros: '完美适配MacOS生态，无广告无捆绑；支持全类型截图、超长滚动截图、OCR多语种识别、贴图、屏幕录制；2.0 版本内置专业标注、图像编辑、背景虚化、AI 一键去瑕疵功能；支持云端分享、批量处理，导出格式丰富。', cons: '仅支持Mac系统；免费版有水印+功能限制；核心全功能需付费订阅，门槛不低；资源占用比轻量工具高。' },
  { id: 4, name: 'Shottr 2（Mac）', systems: 'MacOS', url: 'https://shottr.cc/', stars: 4.5, recommendation: 'Mac专属顶级免费截图工具，2.0 版本完美适配苹果生态，替代 Snipaste 的 Mac 首选。', pros: '完全免费无广告，完美适配MacOS全系芯片；支持全屏/选区/窗口/滚动长截图、OCR识别、贴图功能；2.0 版本标注工具齐全，支持像素级测量、取色器、模糊打码、AI 智能选区；原生适配Mac快捷键，资源占用极低，启动速度极快。', cons: '仅支持Mac系统；无Windows/Linux版本；批量处理功能较弱；高阶自定义功能较少。' },
  { id: 5, name: 'FastStone Capture 10', systems: 'Windows', url: 'https://www.faststone.org/FSCaptureDetail.htm', stars: 4.5, recommendation: '老牌全能型截图工具，10 版本功能全面无短板，职场办公、教程制作专业首选。', pros: '安装包体积极小，无广告无捆绑；支持全屏/选区/窗口/滚动截图/长截图/游戏截图；10 版本内置专业图像编辑器，标注、修图、格式转换一站式完成；支持屏幕录制、标尺、取色器等附加功能，快捷键自定义完善。', cons: '仅支持Windows系统；免费版有30天试用期限；买断制付费门槛不低；界面设计偏老旧。' },
  { id: 6, name: 'ShareX 15', systems: 'Windows', url: 'https://getsharex.com/', stars: 4.5, recommendation: '免费开源全能型截图 + 录屏工具，15 版本功能极度丰富，效率控、技术人员首选。', pros: '完全免费开源无广告，无任何功能限制；支持全类型截图、GIF录制、OCR识别、屏幕录制；15 版本内置截图标注、图像编辑、文件自动分享、自动化工作流全面升级；支持自定义快捷键、插件拓展，上传渠道极其丰富。', cons: '界面偏技术向，新手上手有一定门槛；高帧率游戏截图优化一般；无Mac/Linux官方版本。' },
  { id: 7, name: '天若OCR 2', systems: 'Windows', url: 'https://tianruoocr.cn/', stars: 4, recommendation: '国产轻量化截图 + OCR识别神器，2.0 版本主打截图即识别，办公文字提取首选。', pros: '免费开源无广告，安装包体积极小；快捷键一键截图，2.0 版本秒级识别图片/PDF/视频中的文字，识别准确率大幅提升；支持多语种识别、一键翻译、排版还原、分段复制；可常驻后台，资源占用极低，操作零门槛。', cons: '无官方Mac版本；免费版依赖第三方接口，需简单配置；离线识别能力弱；无批量识别、长文档识别功能。' },
  { id: 8, name: 'QQ截图（QQ内置）', systems: 'Windows、Mac', url: 'https://im.qq.com/pcqq/', stars: 4, recommendation: '国民级免费内置截图工具，功能全面，零安装成本，全人群通用首选。', pros: '完全免费，安装QQ即可使用，零额外安装成本；支持全屏/选区/窗口/长截图、OCR识别、贴图、屏幕录制；标注工具齐全，支持箭头、文字、马赛克、序号标注；操作零门槛，适配国内用户习惯，稳定性极强。', cons: '必须登录QQ才能使用；无独立客户端，无法脱离QQ运行；自定义自由度低；批量处理功能缺失。' },
  { id: 9, name: 'PicPick 7', systems: 'Windows', url: 'https://picpick.app/zh/', stars: 4, recommendation: '全能型截图 + 图像编辑工具，7 版本一站式覆盖办公截图、修图全需求，职场办公首选。', pros: '个人免费版无广告，功能全面；支持全类型截图、长截图、滚动截图；7 版本内置专业级图像编辑器，媲美精简版Photoshop；自带取色器、标尺、白板、屏幕录制等办公辅助工具；界面友好，新手零门槛。', cons: '免费版仅个人非商用可用；商业使用需付费买断；无Mac版本；批量处理功能需付费解锁。' },
  { id: 10, name: 'Flameshot 12', systems: 'Windows、Mac、Linux', url: 'https://flameshot.org/', stars: 4, recommendation: '开源免费跨平台截图工具，12 版本 Linux 系统截图首选，极客、开源爱好者首选。', pros: '完全免费开源无广告，全平台完美适配，Linux发行版全覆盖；12 版本支持全屏/选区截图，标注工具极其丰富；快捷键完全自定义，支持命令行操作、脚本自动化；内置图片编辑、一键分享功能，资源占用极低。', cons: '原生无滚动长截图功能；OCR识别功能需插件拓展；界面偏技术向，新手友好度一般；贴图功能需插件拓展。' },
  { id: 11, name: 'Greenshot 1.3', systems: 'Windows、Mac', url: 'https://getgreenshot.org/', stars: 4, recommendation: '开源免费轻量级截图工具，1.3 版本主打纯净无广告，中小企业、日常办公首选。', pros: '完全免费开源无广告，无任何功能限制；支持全屏/选区/窗口/滚动截图；内置齐全的标注工具，支持一键导出、打印、分享；资源占用极低，老旧电脑也能流畅运行，新手零门槛上手。', cons: 'Mac版功能精简，更新频率低；无贴图功能；OCR识别能力一般；自定义自由度不及头部工具。' },
  { id: 12, name: 'Lightshot', systems: 'Windows、Mac、Linux', url: 'https://app.prntscr.com/', stars: 4, recommendation: '全球知名超轻量截图工具，主打一键截图 + 快速分享，临时截图、跨平台用户首选。', pros: '安装包不足1MB，极致轻量化，无广告无捆绑；一键启动选区截图，标注工具简洁够用；截图完成可一键生成云端分享链接，跨设备访问便捷；全平台适配，资源占用极低，操作零门槛。', cons: '无长截图、贴图、OCR核心功能；功能单一，仅满足基础截图需求；云端分享国内访问速度一般。' },
  { id: 13, name: 'Screenpresso 2', systems: 'Windows', url: 'https://www.screenpresso.com/', stars: 3.5, recommendation: '轻量级全能截图 + 录屏工具，2 版本主打教程制作、办公演示，新手友好。', pros: '免费版无广告，支持全屏/选区/窗口/滚动长截图、高清录屏；2 版本内置标注工具、图像编辑器全面升级，支持一键生成分享链接；支持批量处理、水印添加、格式转换；界面简洁，操作零门槛，对低配电脑友好。', cons: '仅支持Windows系统；免费版有功能限制，导出带水印；核心全功能需付费买断；无Mac/Linux版本。' },
  { id: 14, name: 'Monosnap', systems: 'Windows、Mac', url: 'https://monosnap.com/', stars: 3.5, recommendation: '跨平台截图 + 云存储工具，主打团队协作、远程办公，多人共享首选。', pros: '免费版无广告，支持全类型截图、录屏、OCR识别；内置标注工具、图像编辑功能；自带免费云端存储空间，截图自动同步，一键分享权限设置便捷；支持团队协作、评论互动，跨平台适配完善。', cons: '免费版云存储空间、单文件大小有限制；核心进阶功能需付费订阅；国内访问云端服务速度一般；批量处理能力较弱。' },
  { id: 15, name: 'Ksnip 1.2', systems: 'Windows、Mac、Linux', url: 'https://github.com/ksnip/ksnip', stars: 3.5, recommendation: '开源免费跨平台截图工具，1.2 版本全系统适配，功能均衡，开源爱好者首选。', pros: '完全免费开源无广告，全平台完美适配；支持全屏/选区/窗口/滚动长截图；1.2 版本内置丰富的标注工具、图像编辑器；支持OCR识别、贴图、一键分享、快捷键自定义；支持命令行操作，资源占用极低。', cons: '界面设计偏简陋，新手友好度一般；OCR识别准确率不及头部工具；无批量处理功能；更新频率较低。' },
  { id: 16, name: '截图王', systems: 'Windows', url: 'https://www.jietuwang.cc/', stars: 3.5, recommendation: '国产免费轻量化截图工具，主打极简操作，新手友好，日常办公首选。', pros: '完全免费无广告，安装包体积极小；支持全屏/选区/窗口/长截图、OCR识别、贴图；标注工具齐全，操作零门槛，一键启动；支持快捷键自定义、批量截图、水印添加；资源占用极低，老旧电脑适配好。', cons: '仅支持Windows系统；无Mac/Linux版本；高阶编辑功能不足；官方更新频率低。' },
  { id: 17, name: '微信PC版截图（微信内置）', systems: 'Windows、Mac', url: 'https://pc.weixin.qq.com/', stars: 3.5, recommendation: '全民级免费内置截图工具，极简操作，零安装成本，日常办公、聊天首选。', pros: '完全免费，安装微信即可使用，零额外成本；快捷键一键启动，支持全屏/选区/窗口截图、OCR识别、翻译；标注工具简洁够用，操作零门槛，适配全年龄段用户；与微信无缝联动，截图可直接发送聊天。', cons: '必须登录微信才能使用，无独立客户端；无长截图、贴图、屏幕录制功能；自定义自由度极低；功能单一。' },
  { id: 18, name: '火绒安全截图（火绒内置）', systems: 'Windows', url: 'https://www.huorong.cn/', stars: 3, recommendation: '纯净无广告内置截图工具，安装火绒即可使用，安全办公首选。', pros: '完全免费无广告无捆绑，无任何功能限制；支持全屏/选区/窗口截图，标注工具简洁够用；与火绒安全深度整合，无额外资源占用，稳定性极强；无任何弹窗、推送，办公环境纯净。', cons: '必须安装火绒安全才能使用，无独立客户端；无长截图、OCR识别、贴图功能；自定义自由度极低；功能单一。' },
  { id: 19, name: 'GIMP 3.0', systems: 'Windows、Mac、Linux', url: 'https://www.gimp.org/', stars: 3, recommendation: '开源免费专业级图像编辑工具，3.0 版本大升级，附带精准截图功能，专业设计、修图用户首选。', pros: '完全免费开源无广告，3.0 版本 GTK3 重写，媲美Photoshop的专业编辑能力；支持全类型精准截图，截图后可直接进行专业级修图、编辑；全平台适配，插件生态丰富，自定义自由度拉满；无任何功能限制。', cons: '上手门槛极高，新手学习成本大；仅截图需求的话功能冗余；启动速度慢，资源占用偏高；无专门的截图快捷键、贴图、OCR功能。' },
  { id: 20, name: '剪映专业版截图', systems: 'Windows、Mac', url: 'https://www.capcut.cn/', stars: 3, recommendation: '视频剪辑工具内置截图功能，主打自媒体、视频创作者截图需求。', pros: '完全免费无广告，安装剪映专业版即可使用；支持视频帧精准截图、全屏/窗口截图；截图后可直接进行剪辑、修图、调色、特效添加；内置海量素材、模板，自媒体创作者一站式出片；全平台适配，操作零门槛。', cons: '必须安装剪映才能使用，无独立客户端；无长截图、OCR、贴图功能；仅适合视频创作者，纯办公截图需求功能冗余；自定义自由度低。' },
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

interface ScreenshotToolProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ScreenshotTool({ isOpen, onClose }: ScreenshotToolProps) {
  const [selectedTool, setSelectedTool] = useState<ScreenshotTool | null>(null);

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
                <i className="fa-solid fa-camera text-2xl text-cyan-400"></i>
                <h3 className="text-white text-xl font-bold">截图工具</h3>
                <span className="text-xs text-white/40 bg-white/10 px-2 py-1 rounded-full">
                  共 {screenshotTools.length} 款工具
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
                {screenshotTools.map((tool, index) => (
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
                      selectedTool?.id === tool.id ? 'border-cyan-500/50' : 'border-white/10 group-hover:border-white/20'
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
                        className="block w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white text-center py-3 rounded-xl font-medium transition-all hover:scale-[1.02] mt-4"
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
