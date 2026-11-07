/**
 * 主题字体栈（实际字体由 tokens.css 的 --hw-font-* 变量驱动，这里仅保留 Portal 作用域类）。
 * 刻意不引入 next/font/google：作业系统要能离线用，且 Windows/macOS 自带的
 * 宋体/楷体/等宽/黑体已能拉开足够大的气质差异，零网络依赖、零字体文件。
 */
export const SKIN_FONTS = {
  portalClass: 'hw-font-scope',
} as const;
