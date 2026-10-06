'use client';

import { Notice, ToolPanel } from './primitives';

const CAPABILITIES: { group: string; icon: string; items: string[] }[] = [
  {
    group: '图片',
    icon: 'fa-image',
    items: [
      'JPEG / PNG / WebP / BMP 互转（按浏览器实际支持的编码能力，不支持的格式会明确禁用）',
      '质量调节、按最长边或百分比或指定宽高缩放、旋转、水平垂直翻转',
      '批量处理、压缩前后真实体积对比',
      '透明通道保留（输出格式不支持透明时会铺白底并提示）',
    ],
  },
  {
    group: '文档',
    icon: 'fa-file-lines',
    items: [
      '多张图片合成 PDF（页边距、纸张、方向、完整放入或铺满）',
      '文本转 PDF —— 两种方案：图片渲染（中文完美）或文字版（可选中，仅英文）',
      '表格转 PDF（中文正常显示）',
      '图片识字 OCR（中英文，基于 tesseract.js）',
      'Word (.docx) 转 HTML',
    ],
  },
  {
    group: '文本数据',
    icon: 'fa-table',
    items: [
      'JSON / YAML / TOML / XML / CSV / TSV 六种格式互转',
      '格式化与压缩、解析结果预览',
      'CSV 全程按字符串处理，前导零与长数字不会丢精度',
      '解析失败会明确报错，不会给出半成品',
    ],
  },
  {
    group: '代码',
    icon: 'fa-code',
    items: [
      'JS / TS / JSON / HTML / CSS / XML 的格式化',
      'JS / TS 用 terser 做语法树级压缩；HTML / CSS 保守压缩',
      '字符串、模板串、注释、正则字面量整块保护，不会被误改',
    ],
  },
  {
    group: '音视频',
    icon: 'fa-film',
    items: [
      '视频转 MP4 / WebM / MKV / MOV / GIF（按容器选择兼容的编码器组合）',
      '提取音频并转 MP3 / WAV / AAC / OGG / FLAC',
      '抽取指定时刻的画面为 PNG',
      '真实进度与取消，转码结束后自动释放内存',
    ],
  },
  {
    group: '压缩与水印',
    icon: 'fa-file-zipper',
    items: [
      '图片压缩（可选输出格式、保留透明）',
      'ZIP 打包与解压（显示真实体积增减）',
      '加文字水印（位置、透明度、旋转、平铺、颜色、字号）',
      '加图片水印（logo 等，可调大小与位置）',
      '区域遮挡（模糊 / 马赛克 / 纯色覆盖）',
    ],
  },
  {
    group: '开发工具',
    icon: 'fa-screwdriver-wrench',
    items: [
      '真 MD5 与 SHA-1 / 256 / 384 / 512，文本与文件都能算',
      '颜色格式互转（HEX 含 3/4/6/8 位、RGB、HSL、HSV、CMYK）与 WCAG 对比度检查',
      '二维码生成与识别、一维条码生成与识别（9 种格式）',
      '时间戳与日期双向转换、9 个时区、秒/毫秒/微秒',
      'Base64 / URL / HTML 实体 / Unicode 编解码、文本统计、UUID v4 与 v7',
      'JWT 解码（含过期状态）、正则测试器（含捕获组与命名组）',
    ],
  },
];

const LIMITS: { item: string; why: string }[] = [
  {
    item: 'PDF 合并 / 拆分 / 旋转 / 转图片',
    why: '需要 pdf-lib 与 pdfjs-dist 两个库，当前未安装。界面上没有这些入口，不做假按钮。',
  },
  {
    item: 'PDF 文字可选中（中文）',
    why: 'PDF 内置字体不含中文，嵌入中文字体需要 5~15MB 的字体文件。所以中文用「图片渲染」方案，代价是文字不可选中。',
  },
  {
    item: '内容感知去水印',
    why: '浏览器端做不到。所谓「智能修复」在网页里只能是像素插值，复杂背景必留痕。这里只提供遮挡（模糊/马赛克/纯色）。',
  },
  {
    item: 'JS 压缩的变量改名与死代码消除',
    why: '需要完整的语义分析，浏览器端容易出错。压缩率因此不如命令行工具，但不会压坏代码。',
  },
  {
    item: 'RAR / 7z 解压',
    why: '需要额外组件，当前只支持 ZIP。',
  },
  {
    item: 'GIF 动图编码（图片工具）',
    why: 'canvas 不支持 GIF 编码，静图会被转成 PNG。视频转 GIF 是走 FFmpeg 的，那个可以。',
  },
  {
    item: '超大文件（视频 >200MB）',
    why: 'FFmpeg 跑在 WebAssembly 里，受浏览器内存限制。',
  },
  {
    item: '证书 / 密钥解析',
    why: '需要额外的密码学库，当前未做。',
  },
];

export default function AboutTool() {
  return (
    <div className="space-y-5">
      <ToolPanel>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span
            className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            V3.0.0
          </span>
          <span className="text-[12px] font-semibold">整体重写版</span>
          <span className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
            2026.10.7
          </span>
        </div>
        <ul className="mt-3 space-y-1 text-[12px] leading-relaxed">
          <li>· 修复全部已知计算错误：JS 压缩破坏字符串、文档转 PDF 单位混用导致内容丢失、音频假格式、WebM 必失败、假 MD5、条码识别用错库等</li>
          <li>· 文档转 PDF 支持中文，两种方案可选（图片渲染 / 文字版）</li>
          <li>· 音视频转换的输出格式与所选一致；进度均为真实进度</li>
          <li>· 全部转换在本地浏览器完成，文件不上传</li>
          <li>· 新增「做不到的事」清单，界面不再有虚假承诺</li>
          <li>· 核心逻辑有 100+ 个自动化测试覆盖</li>
        </ul>
      </ToolPanel>

      <ToolPanel title="这个工具箱做了什么" subtitle="所有处理都在你的浏览器本地完成，文件不会上传到任何服务器">
        <div className="space-y-5">
          {CAPABILITIES.map((c) => (
            <div key={c.group}>
              <h4 className="tb-title flex items-center gap-2 text-[13px]">
                <i className={`fa-solid ${c.icon} text-[11px]`} style={{ color: 'var(--primary)' }} />
                {c.group}
              </h4>
              <ul className="mt-2 space-y-1">
                {c.items.map((it) => (
                  <li key={it} className="flex gap-2 text-[12px] leading-relaxed">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full" style={{ background: 'var(--primary)' }} />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </ToolPanel>

      <ToolPanel
        title="做不到的事"
        subtitle="这些是能力边界，不是待办 —— 所以界面上没有对应入口"
      >
        <div className="space-y-3">
          {LIMITS.map((l) => (
            <div
              key={l.item}
              className="p-3"
              style={{
                border: 'var(--tb-border-w) solid var(--border)',
                borderRadius: 'var(--tb-panel-radius)',
              }}
            >
              <p className="text-[13px] font-semibold">{l.item}</p>
              <p className="mt-1 text-[12px] leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                {l.why}
              </p>
            </div>
          ))}
        </div>
      </ToolPanel>

      <Notice tone="info">
        <strong>关于「修复」的说明：</strong>这一版是对旧工具箱的完全重写。
        旧版有 15 个会算出错误结果或直接崩溃的问题，包括：JS 压缩把 <code>&quot;http://x&quot;</code> 里的
        <code>//</code> 当注释删掉、文档转 PDF 因单位混用导致第 14 行起内容全部丢失、
        音频选 MP3 实际输出 WAV、视频选 WebM 必定失败、MD5 是假的、条码识别错用了二维码库、
        去水印只是像素插值却宣称智能修复……这些问题现在都已修正，且核心逻辑有 100+ 个自动化测试覆盖。
      </Notice>

      <Notice tone="warn">
        <strong>关于体积与速度：</strong>重活（音视频转码、OCR、PDF 生成）用的是按需加载的
        WebAssembly 组件，首次使用需要下载（FFmpeg 约 30MB，OCR 语言包约 10MB），
        之后会走浏览器缓存。所有依赖都不会进入首屏。
      </Notice>
    </div>
  );
}
