import { Archivo, Fraunces, Karla } from 'next/font/google';

/**
 * 产品下载页用到的字体。
 *
 * 只加载这 3 个（工具箱那边有 8 个，不要为了下载页把整套拉过来）：
 *   Archivo  —— glass / dusk / aurora 主题的标题与正文
 *   Fraunces —— organic 主题的衬线标题
 *   Karla    —— organic 主题的正文
 *
 * 中文走系统 CJK 回退（加载中文字体要 5~15MB，不划算）。
 */
export const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-archivo',
  display: 'swap',
});

export const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-fraunces',
  display: 'swap',
});

export const karla = Karla({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-karla',
  display: 'swap',
});

export const productFontVars = [archivo.variable, fraunces.variable, karla.variable].join(' ');
