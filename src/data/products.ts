// 下载专区 4 个产品的静态数据
// 导航页点击不再是直接下载，而是跳转到 /product/[slug] 介绍页，
// 介绍页内再提供「立即下载」按钮触发真实下载 / 跳转外链。
//
// 注意：bytes / sha256 必须与 public/ 下真实文件一致，
// 修改安装包后请用 `sha256sum` 重新计算并更新这里，否则页面上的校验信息会失真。

export type Product = {
  slug: string;
  name: string;
  tagline: string;
  icon: string; // 保留字段：历史数据里的 fontawesome 类名
  color: string; // 强调色 key：blue | green | purple | cyan
  size: string;
  desc: string;
  features: { title: string; text: string }[];
  downloadUrl: string;
  downloadLabel: string;
  external: boolean;
  note?: string;

  // —— 可信度信息（产品页展示用）——
  version?: string;
  fileName?: string; // 本地下载时的文件名
  bytes?: number; // 精确字节数
  sha256?: string; // 文件校验值
  format?: string; // 文件格式，如 EXE / ZIP
  platform?: string; // 适用系统
  requirement?: string; // 运行环境要求
  updatedAt?: string; // 最近更新日期
  steps?: string[]; // 安装 / 使用步骤
  faq?: { q: string; a: string }[];

  /** 应用界面预览的样式 key（目前只有 'lock'），用于 app 风格介绍页 */
  preview?: string;
  /** 产品页主题：每页固定一套，不做切换 */
  theme?: 'glass' | 'organic' | 'dusk' | 'aurora';
  /** 已下线：页面显示下线说明，不再提供下载入口 */
  offline?: boolean;
  offlineNote?: string; // 下线原因（展示给用户）
};

export const PRODUCTS: Product[] = [
  {
    slug: 'qianglilock',
    theme: 'aurora',
    preview: 'lock',
    name: '强力锁',
    tagline: '一键锁定电脑，专注当下、守护隐私',
    icon: 'fa-lock',
    color: 'blue',
    size: '约 68 MB',
    desc: '强力锁是一款轻量的 Windows 屏幕锁定工具。当你需要短暂离开座位、或想强制自己进入专注状态（防止分心刷网页）时，一键即可锁住整个桌面，按你设定的时长自动锁定，时间到了才自动解锁。锁屏期间任务切换（Win+Tab / Alt+Tab / Alt+F4）均被禁用，屏幕 30 秒后自动变暗，还提供 3 次临时操作机会应急使用。适合学生自习、办公防打扰、公共场合临时离开等场景。',
    features: [
      { title: '一键全屏锁定', text: '点击即锁屏，覆盖整个桌面，禁用任务切换（Win+Tab / Alt+Tab / Alt+F4）防绕过。' },
      { title: '多档锁屏时长', text: '支持 2 / 8 / 15 / 30 / 60 / 90 / 120 / 180 / 240 / 300 分钟，短至测试、长至数小时。' },
      { title: '临时操作机会', text: '锁屏中提供 3 次「操纵屏幕」机会，每次 20 秒，应急查看不中断锁定。' },
      { title: '屏幕自动变暗', text: '锁屏 30 秒后屏幕自动变暗，进一步隔绝干扰、保护隐私。' },
      { title: '极简单文件', text: '绿色版 exe，无需安装、不写注册表，双击即用。' },
    ],
    downloadUrl: '/downloads/qianglilock.exe',
    downloadLabel: '下载 EXE',
    external: false,
    note: '这是一个自包含单文件 exe（已内置运行环境，无需安装 .NET）。下载后默认在浏览器的「下载」文件夹中，双击即可运行。',
    version: 'v1.0',
    fileName: '强力锁.exe',
    bytes: 71710489,
    sha256: 'fa65c252d2f1c061f6ba8c4a7f3da2a8076ffcfc555d15f87643b1649aafdbc5',
    format: 'EXE（单文件绿色版）',
    platform: 'Windows 10 / 11（64 位）',
    requirement: '无运行库依赖，免安装',
    updatedAt: '2026-08-20',
    steps: [
      '下载 强力锁.exe 到本地任意目录（无需安装，不写注册表）。',
      '双击运行，在界面上选择锁定时长。',
      '点击「开始锁定」，桌面立即被全屏遮罩接管，任务切换快捷键失效。',
      '锁屏期间有 3 次应急操作机会，每次 20 秒，用于临时查看屏幕内容。',
      '倒计时结束自动解锁，无需密码，也不会出现「忘记密码」的情况。',
    ],
    faq: [
      {
        q: 'Windows 提示「未知发布者」，会不会有风险？',
        a: '本工具未购买代码签名证书，SmartScreen 对首次出现的新程序默认拦截，这是所有个人开发工具的共性问题。你可以先用本页「文件信息」里的 SHA-256 校验下载到的文件，确认与官方值完全一致后再放行运行。',
      },
      {
        q: '锁定后会不会解不开？',
        a: '不会。锁屏是固定时长倒计时，时间到自动解锁，不依赖密码。锁定过程中还有 3 次应急操作机会，每次 20 秒。',
      },
      {
        q: '会写注册表或留下残留文件吗？',
        a: '不会。单文件绿色版，所有逻辑都在 exe 内部完成，退出后不残留。',
      },
    ],
  },
  {
    slug: 'toolbox-desktop',
    offline: true,
    offlineNote: '该项目已下线，不再提供下载。需要格式转换请使用网页版工具箱。',
    theme: 'aurora',
    name: '格式转换工具箱（桌面版）',
    tagline: '离线全能格式转换，文件不出本机',
    icon: 'fa-download',
    color: 'green',
    size: '约 70 MB',
    desc: '格式转换工具箱桌面版是一款完全离线运行的本地应用，涵盖图片、文档、音频、视频、代码、压缩等数十种格式互转，以及水印、压缩、开发小工具等实用功能。所有转换都在你本机完成，文件不上传任何服务器，安全又高效。无需联网即可使用全部功能。',
    features: [
      { title: '全离线转换', text: '文件不出本机，隐私零泄露，断网照样干活。' },
      { title: '覆盖多品类', text: '图片 / 文档 / 音频 / 视频 / 代码 / 压缩 一应俱全。' },
      { title: '批量处理', text: '支持多选文件批量转换，效率翻倍。' },
      { title: '内置实用工具', text: '压缩解压、加水印、开发辅助等小工具随取随用。' },
    ],
    downloadUrl: 'https://pan.quark.cn/s/1c01905791bc',
    downloadLabel: '前往网盘下载',
    external: true,
    note: '安装包体积较大，托管于夸克网盘，点击后跳转到网盘页面获取。',
    version: 'v1.0',
    format: 'ZIP 压缩包',
    platform: 'Windows 10 / 11（64 位）',
    requirement: '完全离线运行，无需联网',
    updatedAt: '2026-08-13',
    steps: [
      '点击「前往网盘下载」，跳转到夸克网盘页面。',
      '登录网盘账号后转存到自己网盘，或直接下载到本地。',
      '解压压缩包到任意目录，运行主程序即可，无需安装。',
    ],
    faq: [
      {
        q: '为什么这个要跳到网盘？',
        a: '桌面版安装包体积较大，本站带宽有限，托管在网盘可以保证下载速度与稳定性。',
      },
      {
        q: '转换过程会上传文件吗？',
        a: '不会。所有转换都在本机完成，程序不需要联网，断网状态下功能完全可用。',
      },
      {
        q: '网盘链接打不开怎么办？',
        a: '链接失效通常是网盘侧的临时问题，可稍后重试，或通过导航页右下角的「智能客服」反馈。',
      },
    ],
  },
  {
    slug: 'windows-toolbox',
    theme: 'aurora',
    name: 'Windows Toolbox（应用程序版）',
    tagline: '原生桌面应用，功能更丰富',
    icon: 'fa-cube',
    color: 'purple',
    size: '约 148 KB',
    desc: 'Windows Toolbox 应用程序版是基于 WPF 打造的原生 Windows 桌面应用，相比网页版拥有更完整的系统级能力与更丰富的工具集。适合希望在桌面上长期驻留、随手调用的重度用户。注意：应用程序版为框架依赖型，运行前需先安装 .NET 8 桌面运行时。',
    features: [
      { title: '原生桌面体验', text: 'WPF 打造，界面流畅、与系统深度整合。' },
      { title: '功能更完整', text: '相比网页版，支持更多系统级工具与高级选项。' },
      { title: '本地优先', text: '核心处理在本地完成，稳定可靠。' },
      { title: '长期驻留', text: '可固定到开始菜单 / 任务栏，随开随用。' },
    ],
    downloadUrl: '/downloads/windows-toolbox-app.zip',
    downloadLabel: '下载 ZIP',
    external: false,
    note: '本版本为框架依赖型（体积小），运行前需安装 .NET 8 桌面运行时。',
    version: 'v1.0',
    fileName: 'windows-toolbox-app.zip',
    bytes: 151499,
    sha256: 'b7e6e721539b06c528a6e36075c0c606c68635fcdd9d7fa3fe392d4b726c7a49',
    format: 'ZIP 压缩包',
    platform: 'Windows 10 / 11（64 位）',
    requirement: '.NET 8 桌面运行时（Desktop Runtime x64）',
    updatedAt: '2026-08-13',
    steps: [
      '下载 ZIP 并解压到任意目录（建议放在非系统盘）。',
      '安装 .NET 8 桌面运行时：到 dotnet.microsoft.com 下载页选择「.NET Desktop Runtime 8.x」的 x64 版本。',
      '双击解压目录中的 exe 启动程序。',
      '如需常驻，右键 exe → 固定到「开始」屏幕或任务栏。',
    ],
    faq: [
      {
        q: '为什么只有 148 KB？',
        a: '应用程序版是「框架依赖型」发布，公共运行库不打包进程序，所以体积很小，代价是需要系统预先安装 .NET 8 桌面运行时。',
      },
      {
        q: '没装 .NET 运行时会怎样？',
        a: '双击后会弹出提示，要求安装对应版本的 .NET Desktop Runtime。按提示安装后即可正常运行，无需重装本程序。',
      },
      {
        q: '需要管理员权限吗？',
        a: '常规使用不需要。只有涉及系统级设置的个别工具会请求提权，届时 Windows 会弹窗确认。',
      },
    ],
  },
  {
    slug: 'windows-tool-web',
    theme: 'aurora',
    name: 'Windows 工具（网页版）',
    tagline: '界面精致的单文件绿色版，双击即用',
    icon: 'fa-globe',
    color: 'cyan',
    size: '约 8 MB',
    desc: 'Windows 工具网页版是一个用 Python 打包的单文件 EXE（PyInstaller 自包含）。它内置了本地服务器，双击即可运行、无需安装任何依赖，界面精致、体积小巧，是「随拷随用」的最佳选择。适合临时使用、U 盘携带、不想安装运行时的用户。',
    features: [
      { title: '单文件绿色版', text: '一个 EXE 搞定一切，不写注册表、不残留。' },
      { title: '无需安装', text: '自包含运行环境，双击即用，告别运行时烦恼。' },
      { title: '内置本地服务', text: '内部启动本地服务器，界面即开即用。' },
      { title: '便于携带', text: '体积小，放进 U 盘随身带走。' },
    ],
    downloadUrl: '/downloads/windows-toolbox-web.exe',
    downloadLabel: '下载 EXE',
    external: false,
    note: '自包含单文件，无需安装 .NET 或 Python，双击即可运行。',
    version: 'v1.0',
    fileName: 'windows-toolbox-web.exe',
    bytes: 8214787,
    sha256: '45df9148325b347440ea50a37e7960ac8d78ac49b67b447ecd8f12939de9ff2c',
    format: 'EXE（单文件绿色版）',
    platform: 'Windows 10 / 11（64 位）',
    requirement: '无依赖，双击即用',
    updatedAt: '2026-08-13',
    steps: [
      '下载 exe 到本地任意目录，无需安装。',
      '双击运行，程序会在本机启动一个内置服务。',
      '浏览器自动打开工具界面；关闭程序窗口即退出服务。',
      '如需携带，直接把 exe 拷进 U 盘即可。',
    ],
    faq: [
      {
        q: 'Defender 报毒怎么办？',
        a: 'PyInstaller 打包的程序长期被各家杀软启发式误报，这是打包方式的已知问题。建议先用本页的 SHA-256 校验文件，确认与官方值一致后再决定是否放行。',
      },
      {
        q: '启动后提示端口被占用？',
        a: '说明该端口已被其他程序使用。关闭冲突程序后重试即可；多次重试仍失败可反馈给站主。',
      },
      {
        q: '会和应用程序版冲突吗？',
        a: '不会。两者可共存，网页版启动的是本地服务，应用程序版是独立桌面程序。',
      },
    ],
  },
];

export function getProduct(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}
