import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 定义办公软件类型
interface OfficeTool {
  id: number;
  name: string;
  systems: string;
  url: string;
  stars: number;
  recommendation: string;
  pros: string;
  cons: string;
  category: string;
}

// 分类定义
const categories = [
  { id: 'office', name: '基础办公套件', icon: 'fa-file-word', color: 'blue', count: 4 },
  { id: 'collab', name: '协同办公与项目管理', icon: 'fa-users', color: 'green', count: 6 },
  { id: 'notes', name: '笔记与知识管理', icon: 'fa-sticky-note', color: 'yellow', count: 1 },
];

// 办公软件数据
const officeTools: OfficeTool[] = [
  // 基础办公套件
  { id: 1, name: 'Microsoft 365（Office 2026）', systems: 'Windows、Mac', url: 'https://www.microsoft.com/zh-cn/microsoft-365/office', stars: 5, category: 'office', recommendation: '全球办公软件行业标杆，2026 版本深度集成 Copilot AI 助手，文档、表格、演示全场景旗舰工具，职场办公通用标准。', pros: '功能全面且专业，Word/Excel/PowerPoint/Outlook 覆盖全办公场景；2026 版本 Copilot AI 深度嵌入全组件，支持文档智能生成、数据分析、PPT 自动排版、邮件草拟，AI 效率翻倍；格式兼容性拉满，是行业通用标准，无格式错乱问题；功能深度极强，Excel 函数、PPT 动画、Word 排版能力无出其右；跨设备协同、云同步完善。', cons: '订阅制价格昂贵，Copilot AI 需额外付费订阅；对电脑配置有一定要求，老旧设备运行卡顿；部分高阶功能学习门槛高；免费版仅网页版可用，功能严重受限。' },
  { id: 2, name: 'WPS Office 2026', systems: 'Windows、Mac、Linux', url: 'https://www.wps.cn/', stars: 5, category: 'office', recommendation: '国产全能型办公套件，2026 版本完美兼容 Office 格式，WPS AI（灵犀）全模块深度集成，本土化顶流，国内职场、教育场景首选。', pros: '个人免费版功能完善，完美兼容 Office 全格式，无格式错乱问题；安装包体积小，对低配电脑友好；2026 版本 WPS AI（灵犀）全模块深度集成，支持文档智能生成、润色校对、PPT 原生生成、表格 AI 函数、PDF 智能处理、Markdown 兼容；内置海量模板、思维导图、流程图功能，一站式覆盖全办公场景；云文档、跨设备协同适配国内用户习惯。', cons: '免费版有弹窗广告、资讯推送；WPS AI 高阶能力需开通会员；超大文件处理能力不及 Office；部分复杂函数、宏命令兼容性有瑕疵。' },
  { id: 3, name: 'LibreOffice 25', systems: 'Windows、Mac、Linux', url: 'https://zh-cn.libreoffice.org/', stars: 3.5, category: 'office', recommendation: '开源免费办公套件，25 版本完全无功能限制，个人办公、Linux 用户首选。', pros: '完全开源免费，无广告无水印，无任何功能限制；25 版本覆盖文档、表格、演示、绘图、PDF 全基础功能；跨全平台适配，Linux 系统完美兼容；无任何付费诱导，离线使用无限制。', cons: '界面偏老旧，上手有一定门槛；复杂文档编辑、格式转换准确率一般；宏命令、高级函数兼容性不及 Office；批量处理功能不完善。' },
  { id: 4, name: '永中 Office', systems: 'Windows、Mac、Linux', url: 'https://www.yozosoft.com/', stars: 3, category: 'office', recommendation: '国产老牌办公套件，主打集成文档、表格、演示一体化，国产办公适配之选。', pros: '国产自主研发，集成文档、表格、演示三大应用于一体，数据互通便捷；完全免费个人版，无广告无捆绑；跨平台适配，Linux 系统支持完善；对老旧系统、低配电脑友好，资源占用低。', cons: '功能丰富度、专业度不及 Microsoft Office、WPS；界面设计偏老旧，更新频率低；格式兼容性有瑕疵，复杂文档排版偶有问题；用户基数小，生态插件少。' },
  // 协同办公与项目管理
  { id: 5, name: 'Google Workspace 2026', systems: 'Windows、Mac、网页版', url: 'https://workspace.google.com/', stars: 4.5, category: 'collab', recommendation: '全球顶级协同办公套件，2026 版本深度集成 Gemini AI，文档、表格、会议云端协同办公标杆，跨国团队首选。', pros: '2026 版本深度集成 Gemini AI，支持文档智能生成、会议实时翻译、邮件智能回复；Docs/Sheets/Slides/Meet/Drive 云端协同能力全球顶尖，多人实时编辑无延迟；全平台网页版即开即用，零安装成本；企业级安全防护、权限管理拉满；生态插件极其丰富。', cons: '国内无法直接访问，需科学上网；订阅制价格昂贵；离线编辑能力弱，极度依赖网络；全中文适配不完善。' },
  { id: 6, name: '飞书 7', systems: 'Windows、Mac、网页版', url: 'https://www.feishu.cn/', stars: 4.5, category: 'collab', recommendation: '字节跳动旗下新一代企业级协同办公平台，7 版本飞书 AI 助手（艾莉）全面升级，中大型企业首选。', pros: '7 版本功能全面且深度整合，即时通讯、会议、文档、项目管理、OKR、审批一站式覆盖；飞书 AI 助手（艾莉同学）全面升级，Agent 形态常驻联系人，可智能问答、会议纪要、文档摘要、任务自动生成；多人实时协同能力顶尖，文档、会议、项目无缝联动；界面简洁，操作逻辑流畅，上手门槛低；企业级数据安全与权限管理完善。', cons: '免费版有功能、存储空间限制；高阶企业功能、AI 高阶能力需付费开通，价格不低；中小企业使用有功能冗余；对传统办公模式用户有一定学习成本。' },
  { id: 7, name: '钉钉 8', systems: 'Windows、Mac、网页版', url: 'https://www.dingtalk.com/', stars: 4, category: 'collab', recommendation: '阿里巴巴旗下企业级协同办公平台，8 版本国内中小企业覆盖率最高，一站式办公全场景覆盖。', pros: '8 版本功能全面，覆盖即时通讯、会议、审批、考勤、项目管理、文档协同全办公场景；免费版可满足中小企业绝大多数需求；与支付宝、阿里云生态深度整合；稳定性极强，支持万人级会议、千人级协同；企业级安全防护拉满。', cons: '免费版有部分功能限制；高阶企业功能需付费开通；对个人用户友好度低，冗余功能多；系统资源占用偏高。' },
  { id: 8, name: '腾讯文档', systems: 'Windows、Mac、网页版', url: 'https://docs.qq.com/', stars: 4, category: 'collab', recommendation: '腾讯旗下云端协同办公套件，深度适配微信 / QQ 生态，主打轻量化多人协作，国内团队办公首选。', pros: '完全免费基础功能，网页版即开即用，零安装成本；深度适配微信 / QQ 生态，一键分享、权限设置便捷；支持多人实时协同编辑，修改痕迹实时留存；完美兼容 Office 格式，内置海量模板；跨设备同步便捷，稳定性强。', cons: '高阶功能需开通会员；离线编辑能力弱；复杂表格、专业排版功能不及桌面端 Office；超大文件处理能力有限。' },
  { id: 9, name: '金山文档', systems: 'Windows、Mac、网页版', url: 'https://www.kdocs.cn/', stars: 4, category: 'collab', recommendation: 'WPS 旗下云端协同办公套件，主打多人实时协作，零安装、全平台适配，团队办公首选。', pros: '完全免费基础功能，网页版即开即用，零安装成本；支持多人实时协同编辑文档、表格、演示文稿，修改痕迹实时同步；完美兼容 Office 格式，内置海量模板；云存储自动保存，不怕文件丢失；跨平台全设备适配。', cons: '高阶功能需开通会员；离线编辑能力弱，极度依赖网络；超大文件、复杂函数处理能力不足；复杂排版格式兼容性有瑕疵。' },
  { id: 10, name: '石墨文档', systems: 'Windows、Mac、网页版', url: 'https://shimo.im/', stars: 3.5, category: 'collab', recommendation: '国产云端协同文档工具，主打多人实时协作与文档沉淀，国内团队办公适配之选。', pros: '完全免费基础功能，网页版即开即用；支持多人实时协同编辑文档、表格、演示，修改痕迹实时同步；完美兼容 Office 格式；界面极简，操作零门槛；跨设备同步便捷，稳定性强。', cons: '高阶功能需开通会员；离线编辑能力弱；复杂表格、专业排版功能不及桌面端 Office；超大文件处理能力有限；生态不及腾讯文档、金山文档丰富。' },
  // 笔记与知识管理
  { id: 11, name: 'Notion 2', systems: 'Windows、Mac、网页版', url: 'https://www.notion.so/', stars: 4.5, category: 'notes', recommendation: '全球顶级全能型笔记与知识库工具，2 版本 Notion AI 全面升级，主打极致自定义，个人与团队一站式知识管理、项目管理首选。', pros: '2 版本 100% 自定义，支持笔记、数据库、看板、日历、思维导图、知识库全功能；块编辑模式灵活度拉满，可搭建个人知识库、团队项目管理系统、企业官网等全场景；Notion AI 全面升级，支持自定义代理、AI 速记、企业搜索（可对接 Slack / GitHub 等），文档智能生成、问答检索能力拉满；多人协同能力极强，权限管理精细；全平台跨设备同步，生态插件丰富。', cons: '国内无官方服务器，同步速度慢，偶尔无法访问；上手门槛极高，新手需要大量学习成本；Notion AI 高阶能力需付费订阅；免费版有存储空间、协作者数量限制；全中文适配不完善，部分功能无汉化。' },
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

// 获取分类颜色
const getCategoryColor = (color: string) => {
  const colors: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
    blue: { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-300', iconBg: 'bg-blue-500/10' },
    red: { bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'text-red-300', iconBg: 'bg-red-500/10' },
    yellow: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-300', iconBg: 'bg-yellow-500/10' },
    purple: { bg: 'bg-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-300', iconBg: 'bg-purple-500/10' },
    green: { bg: 'bg-green-500/20', border: 'border-green-500/30', text: 'text-green-300', iconBg: 'bg-green-500/10' },
    orange: { bg: 'bg-orange-500/20', border: 'border-orange-500/30', text: 'text-orange-300', iconBg: 'bg-orange-500/10' },
    cyan: { bg: 'bg-cyan-500/20', border: 'border-cyan-500/30', text: 'text-cyan-300', iconBg: 'bg-cyan-500/10' },
    pink: { bg: 'bg-pink-500/20', border: 'border-pink-500/30', text: 'text-pink-300', iconBg: 'bg-pink-500/10' },
  };
  return colors[color] || colors.blue;
};

interface OfficeSoftwareProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OfficeSoftware({ isOpen, onClose }: OfficeSoftwareProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('office');
  const [selectedTool, setSelectedTool] = useState<OfficeTool | null>(null);

  // 过滤当前分类的工具
  const filteredTools = officeTools.filter(tool => tool.category === selectedCategory);

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
                <i className="fa-solid fa-briefcase text-2xl text-purple-400"></i>
                <h3 className="text-white text-xl font-bold">办公软件</h3>
                <span className="text-xs text-white/40 bg-white/10 px-2 py-1 rounded-full">
                  共 {officeTools.length} 款软件
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
              {/* 左侧分类导航 */}
              <div className="w-44 border-r border-white/10 bg-black/20 py-3 overflow-y-auto tier-chart-scrollbar flex-shrink-0">
                <div className="flex flex-col gap-1 px-2">
                  {categories.map((cat) => {
                    const colorStyle = getCategoryColor(cat.color);
                    const isActive = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategory(cat.id);
                          setSelectedTool(null);
                        }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all text-left ${
                          isActive 
                            ? `${colorStyle.bg} ${colorStyle.border} border ${colorStyle.text}` 
                            : 'bg-white/5 border border-transparent text-white/60 hover:bg-white/10 hover:text-white/80'
                        }`}
                      >
                        <i className={`fa-solid ${cat.icon} w-4 text-center`}></i>
                        <span className="flex-1 truncate">{cat.name}</span>
                        <span className={`text-xs ${isActive ? colorStyle.text : 'text-white/40'}`}>
                          {cat.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 中间工具列表 */}
              <div 
                className="flex-1 overflow-y-auto p-4 space-y-2 tier-chart-scrollbar"
              >
                {filteredTools.map((tool, index) => (
                  <motion.div
                    key={tool.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(index * 0.03, 0.3) }}
                    onClick={() => setSelectedTool(tool)}
                    className={`relative cursor-pointer group transition-all duration-300 ${
                      selectedTool?.id === tool.id ? 'scale-[1.02]' : 'hover:scale-[1.01]'
                    }`}
                  >
                    <div className={`relative h-14 bg-white/5 rounded-lg overflow-hidden border transition-colors ${
                      selectedTool?.id === tool.id ? 'border-purple-500/50' : 'border-white/10 group-hover:border-white/20'
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
                        className="block w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white text-center py-3 rounded-xl font-medium transition-all hover:scale-[1.02] mt-4"
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
                    <i className="fa-solid fa-briefcase text-4xl mb-3"></i>
                    <p className="text-sm">点击左侧软件查看详情</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 底部说明 */}
            <div className="px-6 py-2 border-t border-white/10 bg-black/30 text-center">
              <p className="text-white/40 text-xs">
                <i className="fa-solid fa-info-circle mr-1"></i>
                同类型软件建议仅保留 1 款主力工具，避免多款同类软件同时常驻后台造成系统卡顿
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
