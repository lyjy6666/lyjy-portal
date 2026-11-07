import {
  Archivo,
  Archivo_Black,
  Fraunces,
  Karla,
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  Plus_Jakarta_Sans,
  Inter,
} from 'next/font/google';

/**
 * 工具箱用到的展示字体。
 *
 * 说明：界面文案是中文，而这些是 Latin 字体，汉字会走系统 CJK 回退
 * （加载中文字体要 5~15MB，不划算）。所以中文的差异化靠**字重 / 字号 /
 * 字距 / 行高**体现；Latin 与数字（文件大小、百分比、时间戳）会真正吃到
 * 这里的字体 —— 转换工具里数字很密集，所以观感差异依然明显。
 */

export const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-archivo',
  display: 'swap',
});

export const archivoBlack = Archivo_Black({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-archivo-black',
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

export const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-mono',
  display: 'swap',
});

export const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-sans',
  display: 'swap',
});

export const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

/** 把这些 class 挂到应用根节点，字体变量才会生效 */
export const fontClassNames = [
  archivo.variable,
  archivoBlack.variable,
  fraunces.variable,
  karla.variable,
  plexMono.variable,
  plexSans.variable,
  jakarta.variable,
  inter.variable,
].join(' ');
