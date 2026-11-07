'use client';

/**
 * 液态玻璃（真折射版）
 *
 * 原理：`backdrop-filter: url(#filter)` 会把**元素背后的真实内容**当作 SVG 滤镜的输入，
 * 跑一遍 `feDisplacementMap`，按位移图的 R/G 通道逐像素偏移 —— 这是真折射，不是模糊伪装。
 *
 * 位移图用 canvas 按圆角矩形的 SDF（有向距离场）实时算：
 *   中心位移 0，靠近边缘时沿法线方向把背景向外挤，形成一圈可见的弯曲。
 *
 * 已知边界（实测确认）：
 *   - Safari / Firefox 不支持 `backdrop-filter: url()` → 自动退化为普通毛玻璃
 *   - 背景是纯色时看不出效果（没有纹理可扭曲）
 *   - 位移图按元素尺寸缓存，同尺寸元素共用一张，避免重复计算
 */

const SVG_NS = 'http://www.w3.org/2000/svg';
const CONTAINER_ID = 'liquid-glass-defs';

type MapOptions = {
  width: number;
  height: number;
  radius: number;
  /** 最大位移量（CSS 像素） */
  strength: number;
  /** 折射带宽度（CSS 像素） */
  band: number;
};

/** 圆角矩形有向距离场：内部为负、边界为 0、外部为正（Inigo Quilez 的标准写法） */
function roundedRectSDF(px: number, py: number, hw: number, hh: number, r: number): number {
  const qx = Math.abs(px) - hw + r;
  const qy = Math.abs(py) - hh + r;
  return Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - r;
}

/** 生成位移图（data URL）。R/G 通道分别编码 X/Y 方向的位移，128 表示不偏移 */
function buildDisplacementMap(
  { width, height, radius, strength, band }: MapOptions,
  dpr: number
): string {
  const cw = Math.max(2, Math.round(width * dpr));
  const ch = Math.max(2, Math.round(height * dpr));
  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const img = ctx.createImageData(cw, ch);
  const data = img.data;
  const hw = width / 2;
  const hh = height / 2;
  const r = Math.max(0, Math.min(radius, hw, hh));
  const bandCss = Math.max(2, Math.min(band, Math.min(hw, hh) * 0.9));
  const eps = 0.75;

  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      // 转成以元素中心为原点的 CSS 像素坐标
      const px = (x + 0.5) / dpr - hw;
      const py = (y + 0.5) / dpr - hh;
      const d = roundedRectSDF(px, py, hw, hh, r);

      let cr = 128;
      let cg = 128;

      if (d < 0) {
        // t：0 = 正好在边缘，1 = 已到折射带内侧
        const t = Math.min(1, -d / bandCss);
        // 凸透镜剖面：边缘与带内侧都为 0，带中间最强
        const profile = 4 * t * (1 - t);

        if (profile > 0.002) {
          // 数值梯度求 SDF 法线（对圆角矩形比「从中心径向」准，长条元素不会畸变）
          const gx =
            roundedRectSDF(px + eps, py, hw, hh, r) - roundedRectSDF(px - eps, py, hw, hh, r);
          const gy =
            roundedRectSDF(px, py + eps, hw, hh, r) - roundedRectSDF(px, py - eps, hw, hh, r);
          const len = Math.hypot(gx, gy) || 1;
          cr = 128 + 127 * (gx / len) * profile;
          cg = 128 + 127 * (gy / len) * profile;
        }
      }

      const i = (y * cw + x) * 4;
      data[i] = cr;
      data[i + 1] = cg;
      data[i + 2] = 128;
      data[i + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL('image/png');
}

/** 取（或创建）一个可放 filter 的隐藏 svg 容器 */
function ensureContainer(): SVGSVGElement {
  const existing = document.getElementById(CONTAINER_ID) as SVGSVGElement | null;
  if (existing) return existing;
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('id', CONTAINER_ID);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.style.position = 'absolute';
  svg.style.width = '0';
  svg.style.height = '0';
  svg.style.overflow = 'hidden';
  svg.style.pointerEvents = 'none';
  document.body.appendChild(svg);
  return svg;
}

const mapCache = new Map<string, string>();
const filterCache = new Map<string, string>();
let seq = 0;

/** 按尺寸缓存位移图：同尺寸的按钮共用一张，不必各算一遍 */
function getFilterId(opts: MapOptions, dpr: number): string {
  const key = `${Math.round(opts.width)}x${Math.round(opts.height)}x${Math.round(
    opts.radius
  )}x${opts.strength}x${opts.band}x${dpr}`;

  const cached = filterCache.get(key);
  if (cached) return cached;

  let dataUrl = mapCache.get(key);
  if (!dataUrl) {
    dataUrl = buildDisplacementMap(opts, dpr);
    if (!dataUrl) return '';
    mapCache.set(key, dataUrl);
  }

  const id = `lg-filter-${++seq}`;
  const svg = ensureContainer();

  const filter = document.createElementNS(SVG_NS, 'filter');
  filter.setAttribute('id', id);
  // 允许位移后取到元素外侧的像素，否则边缘会出现空白
  filter.setAttribute('x', '-20%');
  filter.setAttribute('y', '-20%');
  filter.setAttribute('width', '140%');
  filter.setAttribute('height', '140%');
  filter.setAttribute('color-interpolation-filters', 'sRGB');

  const feImage = document.createElementNS(SVG_NS, 'feImage');
  feImage.setAttribute('href', dataUrl);
  feImage.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', dataUrl);
  feImage.setAttribute('x', '0');
  feImage.setAttribute('y', '0');
  feImage.setAttribute('width', String(opts.width));
  feImage.setAttribute('height', String(opts.height));
  feImage.setAttribute('preserveAspectRatio', 'none');
  feImage.setAttribute('result', 'map');

  const disp = document.createElementNS(SVG_NS, 'feDisplacementMap');
  disp.setAttribute('in', 'SourceGraphic');
  disp.setAttribute('in2', 'map');
  // 位移量 = scale × (通道值/255 - 0.5)，通道最大偏离 127/255 → 系数约 2
  disp.setAttribute('scale', String(opts.strength * 2));
  disp.setAttribute('xChannelSelector', 'R');
  disp.setAttribute('yChannelSelector', 'G');

  filter.appendChild(feImage);
  filter.appendChild(disp);
  svg.appendChild(filter);

  filterCache.set(key, id);
  return id;
}

/** 浏览器是否支持 backdrop-filter 引用 SVG 滤镜（Safari / Firefox 不支持） */
let supportedCache: boolean | null = null;
export function supportsLiquidGlass(): boolean {
  if (supportedCache !== null) return supportedCache;
  if (typeof window === 'undefined' || typeof CSS === 'undefined' || !CSS.supports) {
    supportedCache = false;
    return false;
  }
  supportedCache =
    CSS.supports('backdrop-filter', 'url(#lg-test)') ||
    CSS.supports('-webkit-backdrop-filter', 'url(#lg-test)');
  return supportedCache;
}

export type LiquidGlassOptions = {
  /** 折射带宽度（px）。不传则按元素尺寸自适应 */
  band?: number;
  /** 最大位移量（px）。不传则按元素尺寸自适应 */
  strength?: number;
  /** 中景模糊半径（px），默认 2 —— 液态玻璃的特征是中心通透、边缘折射 */
  blur?: number;
};

/**
 * 按元素尺寸自适应：
 * 折射带和位移量如果固定，小按钮上会「整块都是边缘」，大卡片上又几乎看不见。
 * 这里按短边比例给值，并做上下限夹取。
 */
function resolveParams(width: number, height: number, options: LiquidGlassOptions) {
  const short = Math.min(width, height);
  const band = options.band ?? Math.max(4, Math.min(22, short * 0.18));
  const strength = options.strength ?? Math.max(2.5, Math.min(11, short * 0.09));
  const blur = options.blur ?? 2;
  return { band, strength, blur };
}

const APPLIED_ATTR = 'data-liquid-glass';

/**
 * 把液态玻璃应用到页面上所有匹配 `selector` 的元素。
 * 用命令式而不是每个元素一个 hook，避免改动按钮的渲染结构（那些按钮带一长串 onClick 分支）。
 */
export function applyLiquidGlass(selector: string, options: LiquidGlassOptions = {}): void {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  const targets = Array.from(document.querySelectorAll<HTMLElement>(selector));
  if (!supportsLiquidGlass()) return;

  targets.forEach((el) => {
    const width = el.offsetWidth;
    const height = el.offsetHeight;
    if (width < 4 || height < 4) return;

    // 圆角取计算样式，避免和 Tailwind 的 rounded-* 脱节
    const radius = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
    const { band, strength, blur } = resolveParams(width, height, options);

    const id = getFilterId({ width, height, radius, strength, band }, dpr);
    if (!id) return;

    const value = `url(#${id}) blur(${blur}px) saturate(180%) brightness(1.06)`;
    el.style.backdropFilter = value;
    el.style.setProperty('-webkit-backdrop-filter', value);
    // 镜面高光：上缘一道亮边 + 内壁微光，这是「玻璃」观感的关键（折射本身只负责弯折）
    el.style.boxShadow = [
      'inset 0 1px 0 rgba(255,255,255,0.5)',
      'inset 0 -1px 1px rgba(255,255,255,0.16)',
      'inset 0 0 24px rgba(255,255,255,0.08)',
      '0 6px 18px rgba(0,0,0,0.28)',
    ].join(', ');
    el.setAttribute(APPLIED_ATTR, id);
  });
}

/** 撤销液态玻璃，恢复到纯 CSS 毛玻璃 */
export function clearLiquidGlass(selector: string): void {
  document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
    el.style.backdropFilter = '';
    el.style.removeProperty('-webkit-backdrop-filter');
    el.style.boxShadow = '';
    el.removeAttribute(APPLIED_ATTR);
  });
}
