// 下载专区 4 个产品的静态数据
// 导航页点击不再是直接下载，而是跳转到 /product/[slug] 介绍页，
// 介绍页内再提供「立即下载」按钮触发真实下载 / 跳转外链。
//
// 注意：bytes / sha256 必须与 public/ 下真实文件一致，
// 修改安装包后请用 `sha256sum` 重新计算并更新这里，否则页面上的校验信息会失真。

export type DownloadVariant = {
  label: string;
  downloadUrl: string;
  fileName?: string;
  bytes?: number;
  format?: string;
  sha256?: string;
};

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

  /** 多版本下载（单文件版/文件夹版、绿色版/安装版）。有则产品页展示多个下载按钮 */
  variants?: DownloadVariant[];

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
    desc: '强力锁是一款轻量的 Windows 屏幕锁定工具。当你需要短暂离开座位、或想强制自己进入专注状态（防止分心刷网页）时，先选好时长，确认一遍风险提示，再经过 60 秒倒计时，桌面才会被全屏接管。锁屏会覆盖**所有显示器**，任务切换（Win+Tab / Alt+Tab / Alt+F4）与系统热键全部拦截，锁屏期间任务管理器也会被临时禁用，防止「杀进程绕过」。只保留 3 次「操纵屏幕」的应急机会（每次 20 秒，窗口会暂时让开，让你真正看到并操作桌面）。30 秒后变暗，时间到自动解锁并恢复原本的屏幕亮度。',
    features: [
      { title: '三步确认，防误触', text: '选时长 → 风险提示确认 → 60 秒倒计时（可点「立即锁屏」跳过），每一步都能返回。' },
      { title: '覆盖所有显示器', text: '每块屏一个覆盖窗口，副屏不会漏出桌面；按物理像素精确贴合，混合 DPI 也不会错位。' },
      { title: '操纵屏幕，真能操作', text: '点「操纵屏幕」或按 Ctrl+Alt+L，覆盖窗口暂时让开 20 秒，你能看到并操作桌面；时间到自动盖回。共 3 次。' },
      { title: '解锁恢复原亮度', text: '变暗前先记下你原本的亮度，解锁后按原值恢复——不会被拉到 100%。' },
      { title: '九档锁屏时长', text: '2（测试）/ 15 / 30 / 60 / 90 / 120 / 180 / 240 / 300 分钟，短至试一下、长至五小时。' },
      { title: '拦截系统热键', text: 'Win / Win+Tab / Alt+Tab / Alt+F4 / Win+D / Win+R / Ctrl+Shift+Esc 全部拦下，且不会漏到下面的程序。' },
      { title: '防杀进程绕过', text: '锁屏期间任务管理器一启动就被结束；另有守护进程盯着主程序，被结束后会自动拉起并接着倒计时。' },
      { title: 'ESC 隐藏信息', text: '按 ESC 可隐藏或显示剩余时间与当前时间，避免被人看到还剩多久。' },
    ],
    downloadUrl: '/downloads/qianglilock.exe',
    downloadLabel: '下载 EXE',
    external: false,
    note: '这是一个自包含单文件 exe（已内置运行环境，无需安装 .NET）。下载后默认在浏览器的「下载」文件夹中，双击即可运行。',
    version: 'v1.4',
    fileName: '强力锁.exe',
    bytes: 69094607,
    sha256: '50f280bc601428511cec4903265ad6140bdd4a2bb69b99a8d78a2d10d678221c',
    format: 'EXE（单文件绿色版）',
    platform: 'Windows 10 / 11（64 位）',
    requirement: '无运行库依赖，免安装',
    updatedAt: '2026-10-23',
    steps: [
      '下载 强力锁.exe 到本地任意目录（免安装，双击即用）。',
      '双击运行，在下拉框里选锁屏时长。第一次用建议选「2 分钟（测试）」先试一遍。',
      '点「开始锁屏」→ 弹出风险提示：会禁用 Win+Tab / Alt+Tab / Alt+F4 等系统热键、临时禁用任务管理器，只能等时间到自动解锁。',
      '在确认页读完风险说明、勾选「我已阅读并理解」后，点「继续」→ 进入 60 秒倒计时，准备好可点「立即锁屏」跳过，想反悔点「取消」。',
      '锁屏期间所有显示器都被覆盖，显示剩余时间与当前时间；按 ESC 可隐藏这些信息。',
      '需要临时看桌面时，点「操纵屏幕」或按 Ctrl+Alt+L，覆盖窗口会让开 20 秒（共 3 次），时间到自动盖回。',
      '倒计时结束自动解锁，屏幕亮度恢复成你原本的设置，任务管理器也一并恢复。',
    ],
    faq: [
      {
        q: 'Windows 提示「未知发布者」，会不会有风险？',
        a: '本工具未购买代码签名证书，SmartScreen 对首次出现的新程序默认拦截，这是所有个人开发工具的共性问题。你可以先用本页「文件信息」里的 SHA-256 校验下载到的文件，确认与官方值完全一致后再放行运行。',
      },
      {
        q: '锁定后会不会解不开？',
        a: '不会。锁屏是固定时长倒计时，时间到自动解锁，不依赖密码。锁定过程中还有 3 次「操纵屏幕」机会，每次 20 秒。',
      },
      {
        q: '会改系统设置吗？',
        a: '锁屏期间会持续监控，一旦发现任务管理器启动就结束它，防止用「结束进程」绕过锁屏。这个机制不改任何系统设置、不需要管理员权限，锁屏结束就停。变暗只改屏幕亮度，解锁后按原值恢复。除此之外不装服务、不留后台进程。',
      },
      {
        q: '杀毒软件能强制结束它吗？',
        a: '能，这一点不隐瞒。杀软是内核级驱动，可以同时掐掉主程序和守护进程，用户态程序无法对抗——这是 Windows 的权限模型决定的。守护进程挡的是「任务管理器 / 其他普通工具结束进程」这类随手绕过，不是防破解。需要强调的是：它只是个帮你自己专注的计时锁，不是安全软件，也不会做隐藏进程、自我复制、写自启动这些动作（那些恰恰是恶意软件的特征）。',
      },
      {
        q: '为什么 Ctrl+Alt+Del 还是能按？',
        a: 'Ctrl+Alt+Del 是 Windows 的安全注意序列（SAS），由系统内核直接处理，任何用户态程序都无法拦截——这是 Windows 的设计，不是本程序的缺陷。能做到的是：锁屏期间任务管理器一启动就被结束，所以那条绕过路径走不通。',
      },
      {
        q: '强制结束后屏幕一直是暗的怎么办？',
        a: '重新打开一次强力锁即可。程序在变暗前会把原始亮度写进本地记录，启动时检测到「上次没恢复干净」会自动还原。任务管理器策略同理。',
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
    preview: 'wpf',
    name: '调校工具箱（Windows Toolbox）',
    tagline: '性能优化、隐私防护、界面定制、系统修复 —— 一项一个开关，随时可回滚',
    icon: 'fa-cube',
    color: 'purple',
    size: '约 148 KB',
    desc: '调校工具箱是一款基于 WPF 的 Windows 系统调校工具，把散落在注册表、服务、组策略里的常见调整收进一个窗口。共 10 个板块：主页总览、性能优化、隐私防护、界面定制、网络优化、磁盘清理、游戏模式、系统修复、高级工具、软件设置。它的核心不是「一键优化」，而是「改了什么、怎么改回去」都留痕——每次修改前自动记录系统原始状态，每项可单独还原，还有「全局一键还原」兜底，全程写操作日志。本版为框架依赖型，运行前需装 .NET 8 桌面运行时，部分功能需要管理员权限。',
    features: [
      { title: '性能优化', text: '视觉效果、电源计划、系统服务预设、内存释放、SSD 专属优化、启动项扫描。' },
      { title: '隐私防护', text: '关闭诊断遥测、广告 ID、活动时间线；麦克风 / 摄像头 / 定位权限；浏览器后台驻留。' },
      { title: '界面定制', text: '恢复 Win10 经典右键菜单、文件扩展名、隐藏文件、任务栏图标与合并、开始菜单建议。' },
      { title: '网络优化', text: '协议栈与防火墙重置、公共 DNS 切换、启动项管理（注册表 Run / 启动文件夹 / 计划任务）。' },
      { title: '磁盘清理', text: '临时文件、更新缓存、缩略图缓存、事件日志、回收站；另有休眠开关与大文件扫描。' },
      { title: '游戏模式', text: '一键组合：关游戏 DVR、启用游戏模式、切高性能电源、禁后台应用，全部可独立回滚。' },
      { title: '系统修复', text: '系统文件扫描修复（SFC）、系统镜像修复（DISM）、磁盘错误扫描、注册表备份。' },
      { title: '独立回滚 + 操作日志', text: '每项修改前自动记录原始状态，可单功能还原；高危操作二次确认；支持创建系统还原点。' },
    ],
    downloadUrl: '/downloads/windows-toolbox-app.zip',
    downloadLabel: '下载 ZIP',
    external: false,
    note: '本版本为框架依赖型（体积小），运行前需安装 .NET 8 桌面运行时。',
    version: 'v1.1.0',
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
      '右键 exe → 以管理员身份运行（部分调校项需要提权，否则会提示失败）。',
      '首次使用建议先在「软件设置」里创建系统还原点，再逐项调整。',
      '想还原时，可在「全局一键还原」或单项的回滚入口恢复原始状态。',
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
    preview: 'browser',
    name: 'Windows 工具（网页版）',
    tagline: '界面精致的单文件绿色版，双击即用',
    icon: 'fa-globe',
    color: 'cyan',
    size: '约 8 MB',
    desc: '网页版和应用程序版是同一套调校能力的另一个壳：Python 打包成单文件 EXE，双击后在本机起一个服务，浏览器自动打开界面。全部操作通过本机命令行脚本执行，**每个功能都自带还原命令**，并标注风险等级（安全 / 谨慎 / 高危）——高危项执行前会弹二次确认。共 12 个模块、144 项功能：性能优化 18、隐私防护 15、界面定制 20、网络优化 12、磁盘清理 17、游戏模式 11、系统修复 19、高级工具 13、开发者模式 5、快捷工具箱 14。',
    features: [
      { title: '144 项功能，分 12 个模块', text: '从视觉效果、电源计划到右键菜单、WSL 启用，覆盖常见的系统调校场景。' },
      { title: '每项都带还原命令', text: '功能定义里同时写了「应用」与「还原」两段脚本，改错了能一键改回去。' },
      { title: '风险分级 + 二次确认', text: '144 项里 62 项安全、62 项谨慎、20 项高危；高危项执行前弹窗确认。' },
      { title: '单文件，双击即用', text: 'Python 自包含打包，无需装 Python 或 .NET；启动后自动打开浏览器。' },
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
  {
    slug: 'campus-assistant',
    theme: 'aurora',
    name: '校园助手',
    tagline: '触摸屏一体机上，一点就叫人的课堂点名朗读工具',
    icon: 'fa-graduation-cap',
    color: 'green',
    size: '约 133 MB',
    desc: '校园助手是给老师用的课堂叫号/朗读工具，专为触摸屏一体机设计。把花名册粘进去，点名字就朗读；也能按职务（如「语文课代表」）一键叫人，还能念通知、做提醒。内置离线朗读（零延迟、不联网），也支持在线朗读（音质更好）。可选接大模型，从一段通知里智能抠出人名。',
    features: [
      { title: '粘贴花名册即点即读', text: '支持每行一名、逗号/顿号分隔、甚至从一段话里抠人名；点一下就读，可多选连读。' },
      { title: '职务快捷叫人', text: '课代表、班干部一点就喊；可自定义职务和句式，记在本机。' },
      { title: '离线 + 在线朗读', text: '默认自动：离线优先零延迟（装好中文语音包即可）；也可切在线，微软 Xiaoxiao 更接近真人。' },
      { title: '通知朗读 / 便利工具 / 提醒', text: '念通知、屏幕键盘、音量一键 70%、连读 1~3 遍等课堂常用功能。' },
      { title: '可选 AI 增强', text: '接智谱 GLM-4-Flash 等免费大模型，复杂语境识别更准；不启用也不影响用。' },
      { title: '专为一体机优化', text: '无物理键盘也能用（内置屏幕键盘）；未签名 exe 首次运行按提示放行即可。' },
    ],
    downloadUrl: '/downloads/campus-assistant.exe',
    downloadLabel: '下载 EXE（单文件版）',
    external: false,
    note: '单文件版双击即用（首次启动 10~25 秒解压）。追求秒开可下载文件夹版。未签名程序，首次运行 Windows SmartScreen 会提示，点「更多信息 → 仍要运行」即可。',
    variants: [
      { label: '文件夹版（启动更快，推荐）', downloadUrl: '/downloads/campus-assistant-folder.zip', fileName: 'campus-assistant-folder.zip', bytes: 369489920, format: 'ZIP（文件夹版）', sha256: '491de59a6adce05417c974c87f45cc2d3c2db8700403e2f271249fbf09dcaf5c' },
      { label: '单文件版（一个 exe，拷着方便）', downloadUrl: '/downloads/campus-assistant.exe', fileName: 'campus-assistant.exe', bytes: 138958472, format: 'EXE（单文件版）', sha256: '7ba6201ae81b97ec2e579dae9f09a212c139f9115c205a883ab44697736b2760' },
    ],
    version: 'V3.5.0',
    fileName: 'campus-assistant.exe',
    bytes: 138958472,
    sha256: '7ba6201ae81b97ec2e579dae9f09a212c139f9115c205a883ab44697736b2760',
    format: 'EXE（单文件版）',
    platform: 'Windows 10 / 11（64 位）',
    requirement: '无需安装运行库；离线朗读需系统装中文语音包',
    updatedAt: '2026-10-30',
    steps: [
      '下载 campus-assistant.exe，放到一体机本地磁盘（如 D:\\校园助手）。',
      '双击运行；若弹 Windows SmartScreen，点「更多信息 → 仍要运行」（未签名程序正常现象，不是病毒）。',
      '首次先做语音自检：右上角「⚙ 设置 → 朗读 → 🔎 语音自检」，确认有中文语音；没有就装语音包或切「在线朗读」。',
      '把花名册粘进「叫人 → 粘贴文本找人」，点名字即朗读，可多选连读。',
      '要叫课代表/班干部用「职务快捷叫人」；念通知、设提醒在对应板块。',
    ],
    faq: [
      { q: '点了没声音？', a: '先做「语音自检」。没有中文语音就：① 装中文语音包；或 ② 设置里把朗读引擎切「在线」；或 ③ 用顶部「🔊 音量 70%」一键调高。' },
      { q: '第一次启动很慢？', a: '你用的是单文件版（每次要解压）。改用文件夹版（拷整个文件夹）启动只要 2~3 秒。' },
      { q: '能改成男声吗？', a: '能。设置 → 朗读 → 在线语音 → 选「男声·浑厚洪亮（YunjianNeural）」。' },
      { q: '能在 Mac 上用吗？', a: '暂不能。本程序专为 Windows 触摸屏一体机设计（依赖系统语音与播放），Mac/Linux 上朗读会无声。' },
    ],
  },
  {
    slug: 'papermark',
    theme: 'aurora',
    name: '试卷批注助手',
    tagline: '在 doc/PDF 试卷上手写批注，重开原样还原',
    icon: 'fa-file-pen',
    color: 'orange',
    size: '约 107 MB',
    desc: 'PaperMark（试卷批注）是给老师用的桌面批注工具：打开 .doc/.docx/.pdf 试卷，用鼠标、手指或触控笔直接在屏幕上画图批注，保存后下次打开和画完时一模一样。面向学校 Win10 触控一体机，也支持 Win11。原试卷一个字节都不动，批注存在旁边的 .annot.json 里，随文件一起走。',
    features: [
      { title: '支持多种文档', text: 'docx / doc / pdf / rtf / wps / odt / docm，保留原有排版、文字、图片。' },
      { title: '画笔 / 荧光笔 / 橡皮', text: '支持鼠标、手指、触控笔（含压感）；整笔擦、像素涂抹擦、抓手拖动。' },
      { title: '防误触「仅笔模式」', text: '笔优先、多指手势、手掌过滤三道防线，还能一键彻底屏蔽手指，只让触控笔画。' },
      { title: '无损导出', text: '导出带批注的 PDF 或每页 PNG，分辨率 150/300/600 DPI 可选，批注层无损不压缩。' },
      { title: '演示模式', text: '全屏 + 单行工具条，可收起腾出整个画面；工具栏位置、界面大小自动记住。' },
      { title: '保存还原 + 自动保存', text: '批注旁挂存 .annot.json，重开自动精确叠加；编辑时每 5 秒自动落盘。' },
    ],
    downloadUrl: '/downloads/papermark.exe',
    downloadLabel: '下载 EXE（绿色版）',
    external: false,
    note: '绿色免安装版，双击直接运行、不需要管理员权限、不写注册表。未签名程序，首次运行 SmartScreen 提示点「更多信息 → 仍要运行」即可。',
    variants: [
      { label: '绿色版（免安装，推荐）', downloadUrl: '/downloads/papermark.exe', fileName: 'papermark.exe', bytes: 112076139, format: 'EXE（绿色免安装版）', sha256: '1ad965409361f77d913c8d8d8091f0d1f0932a02f966a552b5774e0cb59f7eb3' },
      { label: '安装版（装进系统，进开始菜单）', downloadUrl: '/downloads/papermark-setup.exe', fileName: 'papermark-setup.exe', bytes: 112306397, format: 'EXE（安装版）', sha256: '39328ca4845aea04f63c5b4f0cdfc5a5b7bba4a74a166b0c34ce20ba5548f76c' },
    ],
    version: '0.3.2',
    fileName: 'papermark.exe',
    bytes: 112076139,
    sha256: '1ad965409361f77d913c8d8d8091f0d1f0932a02f966a552b5774e0cb59f7eb3',
    format: 'EXE（绿色免安装版）',
    platform: 'Windows 10 / 11（64 位）',
    requirement: '免安装、无需管理员权限',
    updatedAt: '2026-10-30',
    steps: [
      '下载 papermark.exe（绿色版），拷到 U 盘或一体机任意目录。',
      '双击运行（免安装）；若弹 SmartScreen，点「更多信息 → 仍要运行」。',
      '点「打开文档」选试卷（doc/docx/pdf 等），或把文件拖进窗口。',
      '用画笔/荧光笔在试卷上批注；写错了用「整笔擦」或「涂抹擦」。',
      '点「保存」存批注（在试卷旁生成 同名.annot.json）；点「导出」可导出带批注的 PDF/PNG。',
      '触屏上建议开「更多 ▸ 仅笔模式」，只让触控笔留痕、防手掌误触。',
    ],
    faq: [
      { q: '文件可以移动吗？批注会丢吗？', a: '可以随便移动。原试卷从不改动，批注存在旁边的 同名.annot.json。把原试卷和 .annot.json 一起移动/复制，批注就跟着走。' },
      { q: '导出会变糊吗？', a: '不会。原文档保持矢量，批注层用无损 PNG，可选 300/600 DPI，写得再细也不糊。' },
      { q: '安装版和绿色版怎么选？', a: '绿色版免安装、免管理员权限、不写注册表，拷哪用哪（推荐一体机用）；安装版会进「打开方式」，适合固定电脑。' },
      { q: '触屏写字老被手掌蹭出线？', a: '开「更多 ▸ 仅笔模式」，只有触控笔能画，手指怎么碰都不留痕。' },
    ],
  },
];

export function getProduct(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}
