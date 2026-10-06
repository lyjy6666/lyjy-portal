import { describe, it, expect } from 'vitest';
import {
  parseCsv,
  stringifyCsv,
  parseYaml,
  stringifyYaml,
  parseToml,
  stringifyToml,
  parseData,
  stringifyData,
  DataError,
} from './dataConvert';

/**
 * 数据格式互转的对抗用例。
 * 每一条都对应旧版真实出错的地方。
 */

describe('CSV：RFC-4180 状态机', () => {
  it('引号内含换行的字段要正确解析（旧版会错行）', () => {
    const csv = 'a,b\n"line1\nline2",c';
    const rows = parseCsv(csv);
    expect(rows).toEqual([
      ['a', 'b'],
      ['line1\nline2', 'c'],
    ]);
  });

  it('转义引号 "" 解析为一个引号', () => {
    const csv = 'a,b\n"say ""hi""",c';
    expect(parseCsv(csv)[1][0]).toBe('say "hi"');
  });

  it('引号内的逗号不分列', () => {
    const csv = 'a,b\n"x,y",z';
    expect(parseCsv(csv)[1]).toEqual(['x,y', 'z']);
  });

  it('CRLF 换行', () => {
    const csv = 'a,b\r\n1,2\r\n';
    expect(parseCsv(csv)).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('BOM 不影响首个字段', () => {
    const csv = '\uFEFFa,b\n1,2';
    expect(parseCsv(csv)[0][0]).toBe('a');
  });

  it('前导零与长数字保持为字符串（旧版会变成 7 / 科学计数）', () => {
    const csv = 'code,phone\n007,13800138000';
    const rows = parseCsv(csv);
    expect(rows[1][0]).toBe('007');
    expect(rows[1][1]).toBe('13800138000');
  });

  it('序列化时给含逗号/引号/换行的字段加引号', () => {
    const out = stringifyCsv([['a,b', 'x"y', 'l1\nl2']]);
    expect(out).toBe('"a,b","x""y","l1\nl2"');
  });

  it('对象数组序列化时表头取并集（列不丢）', () => {
    const out = stringifyCsv([
      { a: 1, b: 2 },
      { a: 3, c: 4 },
    ]);
    const rows = parseCsv(out);
    expect(rows[0]).toEqual(['a', 'b', 'c']);
    expect(rows[2]).toEqual(['3', '', '4']);
  });

  it('往返一致（含特殊字符）', () => {
    const data = [
      ['name', 'note'],
      ['张三', '含,逗号'],
      ['李四', '含"引号"'],
    ];
    const csv = stringifyCsv(data);
    expect(parseCsv(csv)).toEqual(data);
  });
});

describe('YAML', () => {
  it('基本映射与嵌套', () => {
    const y = ['name: test', 'server:', '  host: localhost', '  port: 8080'].join('\n');
    expect(parseYaml(y)).toEqual({ name: 'test', server: { host: 'localhost', port: 8080 } });
  });

  it('序列', () => {
    expect(parseYaml('- a\n- b\n- c')).toEqual(['a', 'b', 'c']);
  });

  it('列表套对象（旧版会把 - name: a 当成字符串）', () => {
    const y = ['- name: a', '  age: 1', '- name: b', '  age: 2'].join('\n');
    expect(parseYaml(y)).toEqual([
      { name: 'a', age: 1 },
      { name: 'b', age: 2 },
    ]);
  });

  it('内联数组与对象', () => {
    expect(parseYaml('a: [1, 2, 3]')).toEqual({ a: [1, 2, 3] });
    expect(parseYaml('a: {x: 1, y: 2}')).toEqual({ a: { x: 1, y: 2 } });
  });

  it('注释被剥离', () => {
    expect(parseYaml('a: 1 # 注释\nb: 2')).toEqual({ a: 1, b: 2 });
  });

  it('字符串里的 # 不被当注释', () => {
    expect(parseYaml('a: "x # y"')).toEqual({ a: 'x # y' });
  });

  it('带引号的字符串不参与类型推断', () => {
    expect(parseYaml('a: "007"')).toEqual({ a: '007' });
    expect(parseYaml('a: 007')).toEqual({ a: '007' }); // 前导零保留为字符串
  });

  it('多行字符串（| 保留换行）', () => {
    const y = ['a: |', '  line1', '  line2'].join('\n');
    expect(parseYaml(y)).toEqual({ a: 'line1\nline2' });
  });

  it('序列化含特殊字符的字符串会加引号（旧版会产生非法 YAML）', () => {
    const out = stringifyYaml({ a: 'x: y', b: 'has # hash', c: 'line\nbreak' });
    // 必须能重新解析回来
    expect(parseYaml(out)).toEqual({ a: 'x: y', b: 'has # hash', c: 'line\nbreak' });
  });

  it('往返一致', () => {
    const data = {
      name: '测试',
      list: [1, 2, 3],
      nested: { a: true, b: null, c: 'text' },
      items: [
        { id: 1, tag: 'x' },
        { id: 2, tag: 'y' },
      ],
    };
    expect(parseYaml(stringifyYaml(data))).toEqual(data);
  });
});

describe('TOML', () => {
  it('基本键值', () => {
    expect(parseToml('a = 1\nb = "x"\nc = true')).toEqual({ a: 1, b: 'x', c: true });
  });

  it('表', () => {
    const t = ['[server]', 'host = "localhost"', 'port = 8080'].join('\n');
    expect(parseToml(t)).toEqual({ server: { host: 'localhost', port: 8080 } });
  });

  it('数组表 [[x]]', () => {
    const t = ['[[items]]', 'id = 1', '[[items]]', 'id = 2'].join('\n');
    expect(parseToml(t)).toEqual({ items: [{ id: 1 }, { id: 2 }] });
  });

  it('行尾注释', () => {
    expect(parseToml('a = 1 # 注释')).toEqual({ a: 1 });
  });

  it('嵌套表路径 [a.b]', () => {
    expect(parseToml('[a.b]\nc = 1')).toEqual({ a: { b: { c: 1 } } });
  });

  it('序列化嵌套结构产出真正的 TOML（旧版会输出 JSON）', () => {
    const out = stringifyToml({ server: { host: 'localhost', port: 8080 } });
    expect(out).toContain('[server]');
    expect(out).not.toContain('{');
    expect(parseToml(out)).toEqual({ server: { host: 'localhost', port: 8080 } });
  });

  it('null 明确报错（旧版会输出非法 TOML）', () => {
    expect(() => stringifyToml({ a: null })).toThrow(DataError);
  });

  it('往返一致', () => {
    const data = { a: 1, b: 'x', t: { c: true }, arr: [1, 2] };
    expect(parseToml(stringifyToml(data))).toEqual(data);
  });
});

describe('统一入口', () => {
  it('JSON 往返', () => {
    const data = { a: [1, 2], b: { c: 'x' } };
    expect(parseData(stringifyData(data, 'json'), 'json')).toEqual(data);
  });

  it('JSON 错误有明确提示', () => {
    expect(() => parseData('{bad', 'json')).toThrow(/JSON 解析失败/);
  });

  it('空输入报错而不是静默返回空', () => {
    expect(() => parseData('   ', 'json')).toThrow(/输入为空/);
  });
});
