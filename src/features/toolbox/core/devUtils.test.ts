import { describe, it, expect } from 'vitest';
import {
  parseHex,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  rgbToCmyk,
  cmykToRgb,
  contrastRatio,
  wcagLevel,
  timestampToDates,
  dateToTimestamp,
  base64Encode,
  base64Decode,
  urlEncode,
  urlDecode,
  htmlEscape,
  htmlUnescape,
  unicodeEscape,
  unicodeUnescape,
  textStats,
  uuidV4,
  uuidV7,
  decodeJwt,
  testRegex,
} from './devUtils';

describe('颜色：修掉旧版除零得 NaN 的 bug', () => {
  it('纯黑转 CMYK 必须是 0,0,0,100 而不是 NaN', () => {
    const cmyk = rgbToCmyk({ r: 0, g: 0, b: 0 });
    expect(cmyk).toEqual({ c: 0, m: 0, y: 0, k: 100 });
    // 显式确认没有 NaN（旧版这里就是 NaN）
    expect(Number.isNaN(cmyk.c)).toBe(false);
    expect(Number.isNaN(cmyk.m)).toBe(false);
    expect(Number.isNaN(cmyk.y)).toBe(false);
    expect(Number.isNaN(cmyk.k)).toBe(false);
  });

  it('纯白转 CMYK', () => {
    expect(rgbToCmyk({ r: 255, g: 255, b: 255 })).toEqual({ c: 0, m: 0, y: 0, k: 0 });
  });

  it('CMYK 往返一致', () => {
    const rgb = { r: 120, g: 80, b: 200 };
    const back = cmykToRgb(rgbToCmyk(rgb));
    expect(Math.abs(back.r - rgb.r)).toBeLessThanOrEqual(1);
    expect(Math.abs(back.g - rgb.g)).toBeLessThanOrEqual(1);
    expect(Math.abs(back.b - rgb.b)).toBeLessThanOrEqual(1);
  });

  it('HEX 支持 3 位简写（旧版返回 {0,0,0}）', () => {
    expect(parseHex('#abc')).toEqual({ r: 170, g: 187, b: 204, a: 1 });
    expect(parseHex('#f00')).toEqual({ r: 255, g: 0, b: 0, a: 1 });
  });

  it('HEX 支持 4 位与 8 位（带 alpha）', () => {
    expect(parseHex('#abcd')?.a).toBeCloseTo(0.867, 2);
    expect(parseHex('#ff000080')?.a).toBeCloseTo(0.502, 2);
  });

  it('非法 HEX 返回 null 而不是静默给黑色', () => {
    expect(parseHex('#xyz')).toBeNull();
    expect(parseHex('#12345')).toBeNull();
  });

  it('HEX 往返一致', () => {
    expect(rgbToHex({ r: 170, g: 187, b: 204 })).toBe('#aabbcc');
    expect(rgbToHex({ r: 255, g: 0, b: 0 }, 0.5)).toBe('#ff000080');
  });

  it('HSL 往返一致', () => {
    const rgb = { r: 64, g: 128, b: 192 };
    const back = hslToRgb(rgbToHsl(rgb));
    expect(Math.abs(back.r - rgb.r)).toBeLessThanOrEqual(2);
    expect(Math.abs(back.g - rgb.g)).toBeLessThanOrEqual(2);
    expect(Math.abs(back.b - rgb.b)).toBeLessThanOrEqual(2);
  });

  it('WCAG 对比度', () => {
    // 黑白对比度是 21:1
    expect(contrastRatio({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 })).toBe(21);
    // 同色对比度是 1:1
    expect(contrastRatio({ r: 100, g: 100, b: 100 }, { r: 100, g: 100, b: 100 })).toBe(1);
    expect(wcagLevel(21)).toBe('AAA');
    expect(wcagLevel(4.6)).toBe('AA');
    expect(wcagLevel(1.5)).toBe('不达标');
  });
});

describe('时间戳', () => {
  it('秒 / 毫秒 / 微秒 换算一致', () => {
    const a = timestampToDates('1700000000', 's', 'UTC');
    const b = timestampToDates('1700000000000', 'ms', 'UTC');
    expect(a.iso).toBe(b.iso);
    expect(a.iso).toBe('2023-11-14T22:13:20.000Z');
  });

  it('时区生效', () => {
    const cn = timestampToDates('1700000000', 's', 'Asia/Shanghai');
    expect(cn.formatted).toContain('2023');
    // 上海比 UTC 早 8 小时
    expect(cn.formatted).toMatch(/06:13:20|06:13/);
  });

  it('非数字明确报错（旧版会得到 Invalid Date 却不提示）', () => {
    expect(() => timestampToDates('abc', 's', 'UTC')).toThrow(/必须是数字/);
  });

  it('超范围明确报错', () => {
    expect(() => timestampToDates('99999999999999999', 'ms', 'UTC')).toThrow();
  });

  it('日期 → 时间戳', () => {
    const r = dateToTimestamp('2023-11-14T22:13:20Z');
    expect(r.s).toBe(1700000000);
    expect(r.ms).toBe(1700000000000);
    expect(r.us).toBe(1700000000000000);
  });

  it('无法识别的日期报错', () => {
    expect(() => dateToTimestamp('不是日期')).toThrow(/无法识别/);
  });
});

describe('文本工具', () => {
  it('Base64 往返（含中文）', () => {
    const s = '你好 world 🌍';
    expect(base64Decode(base64Encode(s))).toBe(s);
  });

  it('URL 编码往返', () => {
    const s = 'a b&c=d/中文';
    expect(urlDecode(urlEncode(s))).toBe(s);
  });

  it('HTML 转义往返', () => {
    const s = '<script>alert("x")</script> & more';
    expect(htmlUnescape(htmlEscape(s))).toBe(s);
  });

  it('HTML 支持数字实体', () => {
    expect(htmlUnescape('&#65;&#x42;')).toBe('AB');
  });

  it('Unicode 转义往返（含增补平面）', () => {
    const s = 'a中🌍';
    expect(unicodeUnescape(unicodeEscape(s))).toBe(s);
  });

  it('文本统计', () => {
    const r = textStats('hello world\n你好');
    expect(r.words).toBe(3);
    expect(r.lines).toBe(2);
    expect(r.cjk).toBe(2);
    expect(r.bytes).toBeGreaterThan(r.chars);
  });
});

describe('UUID', () => {
  it('v4 格式正确且唯一', () => {
    const a = uuidV4();
    const b = uuidV4();
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(a).not.toBe(b);
  });

  it('v7 版本位正确且按时间递增', () => {
    const a = uuidV7();
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    const b = uuidV7();
    // 前 12 位是毫秒时间戳，后生成的不会更小
    expect(a.slice(0, 12) <= b.slice(0, 12)).toBe(true);
  });
});

describe('JWT', () => {
  it('解析 header / payload / 过期状态', () => {
    // 构造一个 payload 里 exp 已过期的 token（签名随便写，因为这里只做解码）
    const payload = { sub: '123', name: '测试', exp: 1000000000 };
    const b64url = (o: unknown) =>
      Buffer.from(JSON.stringify(o)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const token = `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url(payload)}.sig`;

    const r = decodeJwt(token);
    expect(r.header).toEqual({ alg: 'HS256', typ: 'JWT' });
    expect((r.payload as Record<string, unknown>).name).toBe('测试');
    expect(r.expired).toBe(true);
  });

  it('段数不对明确报错', () => {
    expect(() => decodeJwt('a.b')).toThrow(/三段/);
  });
});

describe('正则测试', () => {
  it('基本匹配', () => {
    const r = testRegex('\\d+', 'g', 'a1b22c333');
    expect(r.error).toBeNull();
    expect(r.matches.map((m) => m.value)).toEqual(['1', '22', '333']);
  });

  it('捕获组', () => {
    const r = testRegex('(\\w)(\\d)', 'g', 'a1');
    expect(r.matches[0].groups).toEqual(['a', '1']);
  });

  it('命名捕获组', () => {
    const r = testRegex('(?<year>\\d{4})', 'g', '2026');
    expect(r.matches[0].named).toEqual({ year: '2026' });
  });

  it('非法正则返回错误而不是抛异常', () => {
    const r = testRegex('([', 'g', 'x');
    expect(r.error).not.toBeNull();
  });

  it('空匹配不会死循环（旧版会卡死）', () => {
    const r = testRegex('a*', 'g', 'bbb');
    expect(r.error).toBeNull();
    expect(r.matches.length).toBeGreaterThan(0);
  });

  it('超过上限会截断并标记', () => {
    const r = testRegex('.', 'g', 'x'.repeat(500), 10);
    expect(r.matches).toHaveLength(10);
    expect(r.truncated).toBe(true);
  });
});
