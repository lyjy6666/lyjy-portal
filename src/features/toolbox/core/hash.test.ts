import { describe, it, expect } from 'vitest';
import { hashText } from './hash';
import { minifyJs, minifyHtml, minifyCss } from './minify';

/**
 * 哈希用**标准测试向量**验证 —— 这是唯一可靠的验证方式。
 * 旧版的「MD5」其实是 SHA-256 的复制，用向量一测就露馅。
 */
describe('哈希：标准测试向量', () => {
  it('MD5 已知向量', async () => {
    expect(await hashText('', 'MD5')).toBe('d41d8cd98f00b204e9800998ecf8427e');
    expect(await hashText('abc', 'MD5')).toBe('900150983cd24fb0d6963f7d28e17f72');
    expect(await hashText('The quick brown fox jumps over the lazy dog', 'MD5')).toBe(
      '9e107d9d372bb6826bd81d3542a419d6'
    );
  });

  it('SHA-1 已知向量', async () => {
    expect(await hashText('abc', 'SHA-1')).toBe('a9993e364706816aba3e25717850c26c9cd0d89d');
  });

  it('SHA-256 已知向量', async () => {
    expect(await hashText('abc', 'SHA-256')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
    );
  });

  it('MD5 与 SHA-256 结果必须不同（旧版两者相同）', async () => {
    const md5 = await hashText('abc', 'MD5');
    const sha = await hashText('abc', 'SHA-256');
    expect(md5).not.toBe(sha);
    expect(md5).toHaveLength(32);
    expect(sha).toHaveLength(64);
  });

  it('中文按 UTF-8 编码', async () => {
    // "中文" 的 UTF-8 字节是 e4b8ad e69687
    expect(await hashText('中文', 'MD5')).toBe('a7bac2239fcdcb3a067903d8077c4a07');
  });
});

describe('压缩：terser 保证语义不变', () => {
  it('字符串里的 // 不能被当注释删掉（旧版会）', async () => {
    const src = 'const u = "http://example.com/a"; console.log(u);';
    const out = await minifyJs(src);
    expect(out).toContain('http://example.com/a');
  });

  it('a - -b 不能被压成 a--b', async () => {
    const src = 'const a = 10, b = 5; const r = a - -b; console.log(r);';
    const out = await minifyJs(src);
    // 语义验证：执行结果必须一致
    const run = (code: string) => {
      const logs: unknown[] = [];
      new Function('console', code)({ log: (v: unknown) => logs.push(v) });
      return logs;
    };
    expect(run(out)).toEqual(run(src));
  });

  it('压缩后行为与原文一致（多语句综合）', async () => {
    const src = `
      function fib(n) { return n < 2 ? n : fib(n - 1) + fib(n - 2); }
      const url = "https://a.b/c?d=1";
      const re = /[/]/;
      const t = \`x\${fib(7)}y\`;
      console.log(fib(10), url, re.source, t);
    `;
    const out = await minifyJs(src);
    const run = (code: string) => {
      const logs: unknown[] = [];
      new Function('console', code)({ log: (...v: unknown[]) => logs.push(v) });
      return logs;
    };
    expect(run(out)).toEqual(run(src));
  });

  it('保留 console 调用（不误删有副作用的代码）', async () => {
    const src = 'console.log("hello");';
    expect(await minifyJs(src)).toContain('console.log');
  });
});

describe('HTML 压缩：保护 pre / textarea / script / style', () => {
  it('pre 内的空白必须原样保留', () => {
    const src = '<div><pre>  a    b\n  c</pre></div>';
    const out = minifyHtml(src);
    expect(out).toContain('  a    b\n  c');
  });

  it('script 内的代码不能被折叠空白', () => {
    const src = '<script>const s = "a   b";</script>';
    const out = minifyHtml(src);
    expect(out).toContain('"a   b"');
  });

  it('注释被删除', () => {
    expect(minifyHtml('<div><!-- x --></div>')).toBe('<div></div>');
  });

  it('条件注释保留', () => {
    const src = '<!--[if IE]><p>x</p><![endif]-->';
    expect(minifyHtml(src)).toContain('[if IE]');
  });

  it('属性值里的 > 不会截断标签', () => {
    const src = '<a href="x > y">t</a>';
    expect(minifyHtml(src)).toContain('href="x > y"');
  });
});

describe('CSS 压缩：calc 与字符串保护', () => {
  it('calc 里 + 两侧的空格必须保留', () => {
    const src = '.a { width: calc(100% + 10px); }';
    const out = minifyCss(src);
    expect(out).toContain('calc(100% + 10px)');
  });

  it('字符串里的分号不能被当声明分隔符', () => {
    const src = '.a { content: "x;y"; }';
    expect(minifyCss(src)).toContain('"x;y"');
  });

  it('注释被删除但保留授权注释', () => {
    expect(minifyCss('/* x */ .a{}')).toBe('.a{}');
    expect(minifyCss('/*! license */ .a{}')).toContain('/*! license */');
  });

  it('基本空白折叠', () => {
    expect(minifyCss('.a  {  color : red ;  }')).toBe('.a{color:red}');
  });
});
