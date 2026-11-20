import { describe, it, expect } from 'vitest';
import {
  DEFAULT_BATCH_OPTIONS,
  applyReplace,
  applyTextBatch,
  splitLines,
  textStats,
  type TextBatchOptions,
} from './textBatch';

const opts = (patch: Partial<TextBatchOptions>): TextBatchOptions => ({
  ...DEFAULT_BATCH_OPTIONS,
  ...patch,
});

describe('splitLines / textStats', () => {
  it('CRLF 与 CR 都按换行处理', () => {
    expect(splitLines('a\r\nb\rc')).toEqual(['a', 'b', 'c']);
  });

  it('统计行数、字符数、唯一行数、空行数', () => {
    expect(textStats('a\nb\na\n')).toEqual({
      lines: 4,
      chars: 6,
      uniqueLines: 3,
      emptyLines: 1,
    });
  });
});

describe('applyReplace', () => {
  it('字面量模式：点号不当通配符，且 $1 不当捕获组', () => {
    expect(
      applyReplace('a.b aXb $1', {
        ...DEFAULT_BATCH_OPTIONS.replace,
        enabled: true,
        pattern: 'a.b',
        replacement: '$1',
        literal: true,
        global: true,
      })
    ).toBe('$1 aXb $1');
  });

  it('正则模式 + 全局：替换全部匹配', () => {
    expect(
      applyReplace('a1 b22 c333', {
        ...DEFAULT_BATCH_OPTIONS.replace,
        enabled: true,
        pattern: '\\d+',
        replacement: '#',
        literal: false,
        global: true,
      })
    ).toBe('a# b# c#');
  });

  it('flags 生效：i 忽略大小写', () => {
    expect(
      applyReplace('Foo FOO foo', {
        ...DEFAULT_BATCH_OPTIONS.replace,
        enabled: true,
        pattern: 'foo',
        replacement: 'bar',
        literal: false,
        flags: 'gi',
      })
    ).toBe('bar bar bar');
  });

  it('非全局只替换第一处', () => {
    expect(
      applyReplace('a-a-a', {
        ...DEFAULT_BATCH_OPTIONS.replace,
        enabled: true,
        pattern: 'a',
        replacement: 'x',
        literal: true,
        global: false,
      })
    ).toBe('x-a-a');
  });

  it('非法正则明确报错', () => {
    expect(() =>
      applyReplace('x', {
        ...DEFAULT_BATCH_OPTIONS.replace,
        enabled: true,
        pattern: '[',
        literal: false,
      })
    ).toThrow(/正则表达式无效/);
  });
});

describe('applyTextBatch', () => {
  it('行去重保留首次出现', () => {
    const r = applyTextBatch('b\na\nb\nc\na', opts({ dedupe: true }));
    expect(r.text).toBe('b\na\nc');
  });

  it('去空行与修剪空白', () => {
    const r = applyTextBatch(' a \n\n  \n b ', opts({ removeEmpty: true, trimLines: true }));
    expect(r.text).toBe('a\nb');
  });

  it('字典序 / 长度序', () => {
    expect(applyTextBatch('b\na\nc', opts({ sort: 'asc' })).text).toBe('a\nb\nc');
    expect(applyTextBatch('b\na\nc', opts({ sort: 'desc' })).text).toBe('c\nb\na');
    expect(applyTextBatch('bbb\na\ncc', opts({ sort: 'len-asc' })).text).toBe('a\ncc\nbbb');
    expect(applyTextBatch('a\ncc\nbbb', opts({ sort: 'len-desc' })).text).toBe('bbb\ncc\na');
  });

  it('大小写与前后缀', () => {
    expect(applyTextBatch('hello world', opts({ caseMode: 'upper' })).text).toBe('HELLO WORLD');
    expect(applyTextBatch('HeLLo', opts({ caseMode: 'lower' })).text).toBe('hello');
    expect(applyTextBatch('hello', opts({ caseMode: 'title' })).text).toBe('Hello');
    expect(applyTextBatch('x\ny', opts({ prefix: '「', suffix: '」' })).text).toBe('「x」\n「y」');
  });

  it('组合：替换 → 去空 → 去重 → 排序 → 统计', () => {
    const r = applyTextBatch(
      'apple\n\nApple\nbanana\napple',
      opts({
        replace: {
          ...DEFAULT_BATCH_OPTIONS.replace,
          enabled: true,
          pattern: 'Apple',
          replacement: 'apple',
          literal: true,
          flags: '',
          global: true,
        },
        removeEmpty: true,
        dedupe: true,
        sort: 'asc',
        caseMode: 'none',
      })
    );
    expect(r.text).toBe('apple\nbanana');
    expect(r.stats).toEqual({ lines: 2, chars: 12, uniqueLines: 2, emptyLines: 0 });
  });

  it('非法正则会让整批处理失败，不返回半成品', () => {
    expect(() =>
      applyTextBatch(
        'x',
        opts({
          replace: {
            ...DEFAULT_BATCH_OPTIONS.replace,
            enabled: true,
            pattern: '(',
            literal: false,
          },
        })
      )
    ).toThrow(/正则表达式无效/);
  });
});
