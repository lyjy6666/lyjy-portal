import { describe, it, expect } from 'vitest';
import { tokenize } from './codeTokenize';
import { formatJsLike, minifyJsLike, formatCss, formatMarkup } from './codeFormat';

/**
 * 对抗用例。
 *
 * 每一条都对应旧版真实翻车的输入 —— 旧版用正则做格式化和压缩，
 * 无法区分「这串字符在字符串里 / 注释里 / 是正则字面量」，于是把代码改坏。
 * 这些用例就是用来证明新版不会再犯的。
 */

/** 去掉所有空白，方便比较语义是否等价 */
const squash = (s: string) => s.replace(/\s+/g, '');

describe('tokenizer：字符串 / 注释 / 正则的区分', () => {
  it('字符串里的 // 不能当注释', () => {
    const src = 'const u = "http://example.com";';
    const tokens = tokenize(src);
    const comments = tokens.filter((t) => t.type === 'line-comment');
    expect(comments).toHaveLength(0);
    const str = tokens.find((t) => t.type === 'string');
    expect(str?.value).toBe('"http://example.com"');
  });

  it('字符串里的 /* 不能当块注释', () => {
    const src = 'const a = "/* not a comment */";';
    expect(tokenize(src).filter((t) => t.type === 'block-comment')).toHaveLength(0);
  });

  it('真正的注释要被识别', () => {
    const src = 'a; // 真注释\n/* 块注释 */ b;';
    const t = tokenize(src);
    expect(t.filter((x) => x.type === 'line-comment')).toHaveLength(1);
    expect(t.filter((x) => x.type === 'block-comment')).toHaveLength(1);
  });

  it('正则字面量要整块消费（含字符类里的斜杠）', () => {
    const src = 'const re = /a[/]b/gi;';
    const re = tokenize(src).find((t) => t.type === 'regex');
    expect(re?.value).toBe('/a[/]b/gi');
  });

  it('除号不能被当成正则起始', () => {
    const src = 'const r = a / b / c;';
    expect(tokenize(src).filter((t) => t.type === 'regex')).toHaveLength(0);
  });

  it('模板串里的 ${} 内是代码，字符串里的 ${} 不是', () => {
    const src = 'const s = `x${a + b}y`;';
    const t = tokenize(src);
    // 模板串被拆成 template / code / template 若干段，其中应包含 a 与 b 两个标识符
    const names = t.filter((x) => x.type === 'name').map((x) => x.value);
    expect(names).toContain('a');
    expect(names).toContain('b');
  });

  it('转义引号不会提前结束字符串', () => {
    const src = 'const s = "a\\"b";';
    const str = tokenize(src).find((t) => t.type === 'string');
    expect(str?.value).toBe('"a\\"b"');
  });
});

describe('格式化：绝不能改动内容', () => {
  it('字符串里的 return(x) 不能被改成 return (x)', () => {
    const src = 'const s = "return(x)";';
    const out = formatJsLike(src);
    expect(out).toContain('"return(x)"');
    expect(out).not.toContain('"return (x)"');
  });

  it('格式化不改变代码语义（去空白后应一致）', () => {
    const src = 'function f(a,b){if(a){return b}else{return a}}';
    expect(squash(formatJsLike(src))).toBe(squash(src));
  });

  it('字符串内的空白不能被压缩', () => {
    const src = 'const s = "a    b";';
    expect(formatJsLike(src)).toContain('"a    b"');
  });
});

describe('压缩：宁可不压，不可压错', () => {
  it('压缩后字符串里的 // 仍在', () => {
    const src = 'const u = "http://x";';
    const out = minifyJsLike(src);
    expect(out).toContain('http://x');
  });

  it('a - -b 不能被压成 a--b', () => {
    const src = 'const r = a - -b;';
    const out = minifyJsLike(src);
    expect(out).not.toContain('a--b');
    // 语义等价：去空白后应与原文一致
    expect(squash(out)).toBe(squash(src));
  });

  it('a + +b 不能被压成 a++b', () => {
    const src = 'const r = a + +b;';
    expect(minifyJsLike(src)).not.toContain('a++b');
  });

  it('return 与标识符之间必须留空格', () => {
    const src = 'function f(){ return x; }';
    const out = minifyJsLike(src);
    expect(out).toContain('return x');
    expect(out).not.toContain('returnx');
  });

  it('压缩不会把字符串里的空白压掉', () => {
    const src = 'const s = "a   b";';
    expect(minifyJsLike(src)).toContain('"a   b"');
  });

  it('压缩后仍能通过语法解析（用 Function 构造器验证）', () => {
    const src = [
      'const url = "http://a.com/b";',
      'const r = 10 - -5;',
      'const re = /[/]/;',
      'function f(x) { return x + 1; }',
      'const t = `a${f(1)}b`;',
    ].join('\n');
    const out = minifyJsLike(src);
    expect(() => new Function(out)).not.toThrow();
  });
});

describe('CSS 格式化：函数内与字符串内的符号不能动', () => {
  it('content 里的分号不能换行', () => {
    const src = '.a{content:"x;y"}';
    const out = formatCss(src);
    expect(out).toContain('"x;y"');
  });

  it('calc 里 + 两侧的空格必须保留', () => {
    const src = '.a{width:calc(100% + 10px)}';
    const out = formatCss(src);
    expect(out).toContain('calc(100% + 10px)');
  });
});

describe('HTML/XML 格式化：不能被正文里的 < 破坏', () => {
  it('正文里的 a < b 不能当成标签', () => {
    const src = '<p>a < b</p>';
    const out = formatMarkup(src);
    expect(out).toContain('a < b');
  });

  it('属性值里的 > 不能提前结束标签', () => {
    const src = '<a href="x > y">t</a>';
    const out = formatMarkup(src);
    expect(out).toContain('href="x > y"');
  });

  it('script 内的 JS 不能被当标签处理', () => {
    const src = '<script>if(a<b){c()}</script>';
    const out = formatMarkup(src);
    expect(out).toContain('if(a<b){c()}');
  });

  it('注释整块保留', () => {
    const src = '<div><!-- 注释 --></div>';
    expect(formatMarkup(src)).toContain('<!-- 注释 -->');
  });
});
