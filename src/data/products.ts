// 下载专区 4 个产品的静态数据
// 导航页点击不再是直接下载，而是跳转到 /product/[slug] 介绍页，
// 介绍页内再提供「立即下载」按钮触发真实下载 / 跳转外链。

export type Product = {
  slug: string;
  name: string;
  tagline: string;
  icon: string; // fontawesome 类名
  color: string; // 对应 colorClasses 的 key
  size: string;
  desc: string;
  features: { title: string; text: string }[];
  downloadUrl: string;
  downloadLabel: string;
  external: boolean;
  note?: string;
};

export const PRODUCTS: Product[] = [
  {
    slug: 'qianglilock',
    name: '强力锁（应用锁）',
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
    downloadUrl: '/强力锁.exe',
    downloadLabel: '立即下载 EXE',
    external: false,
    note: '这是一个自包含单文件 exe（约 139MB，已内置运行环境，无需安装 .NET）。下载后默认在浏览器的「下载」文件夹中，双击即可运行。若 Windows 提示「未知发布者 / SmartScreen 已保护你的电脑」，属正常现象（未做代码签名），点「更多信息 → 仍要运行」即可。若双击无反应，右键 exe → 属性 → 勾选「解除锁定」。锁屏为固定时长，时间结束自动解锁，无需设置密码。',
  },
  {
    slug: 'toolbox-desktop',
    name: '格式转换工具箱（桌面版）',
    tagline: '离线全能格式转换，70MB 独立桌面应用',
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
    downloadLabel: '前往夸克网盘下载',
    external: true,
    note: '资源托管于夸克网盘，点击后将跳转至网盘页面获取安装包。',
  },
  {
    slug: 'windows-toolbox',
    name: 'Windows Toolbox（应用程序版）',
    tagline: '原生桌面应用，功能更丰富',
    icon: 'fa-cube',
    color: 'purple',
    size: '约 148 KB',
    desc: 'Windows Toolbox 应用程序版是基于 WPF 打造的原生 Windows 桌面应用，相比网页版拥有更完整的系统级能力与更丰富的工具集。适合希望在桌面上长期驻留、随手调用的重度用户。注意：应用程序版为框架依赖型，运行前需先安装 .NET 8 桌面运行时（下方提供说明）。',
    features: [
      { title: '原生桌面体验', text: 'WPF 打造，界面流畅、与系统深度整合。' },
      { title: '功能更完整', text: '相比网页版，支持更多系统级工具与高级选项。' },
      { title: '本地优先', text: '核心处理在本地完成，稳定可靠。' },
      { title: '长期驻留', text: '可固定到开始菜单 / 任务栏，随开随用。' },
    ],
    downloadUrl: '/downloads/windows-toolbox-app.zip',
    downloadLabel: '立即下载 ZIP',
    external: false,
    note: '运行前需安装 .NET 8 桌面运行时：https://dotnet.microsoft.com/zh-cn/download/dotnet/8.0 （选「.NET Desktop Runtime 8.x」）。若想免运行时，可联系站主获取自包含发布版本。',
  },
  {
    slug: 'windows-tool-web',
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
    downloadLabel: '立即下载 EXE',
    external: false,
    note: '首次运行可能被 Windows Defender 误报（PyInstaller 打包通病），选择「仍要运行」即可。',
  },
];

export function getProduct(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}
