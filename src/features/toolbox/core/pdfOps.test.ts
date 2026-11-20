import { describe, it, expect } from 'vitest';
import { parsePageRanges } from './pdfOps';

/**
 * 页码范围解析：用户写的页码从 1 开始，函数返回 0 基索引。
 * 每一条都对应一种真实的误操作或旧版容易出错的地方。
 */
describe('parsePageRanges', () => {
  it('单页：1 → [0]', () => {
    expect(parsePageRanges('1', 5)).toEqual([0]);
  });

  it('连续范围：1-3 → [0,1,2]', () => {
    expect(parsePageRanges('1-3', 5)).toEqual([0, 1, 2]);
  });

  it('混合：1-3,5 → [0,1,2,4]', () => {
    expect(parsePageRanges('1-3,5', 5)).toEqual([0, 1, 2, 4]);
  });

  it('忽略空白： 2, 4-6  → [1,3,4,5]', () => {
    expect(parsePageRanges(' 2, 4-6 ', 6)).toEqual([1, 3, 4, 5]);
  });

  it('重复页码只保留一次，且保持出现顺序', () => {
    expect(parsePageRanges('3,1-2,3', 5)).toEqual([2, 0, 1]);
  });

  it('末页可以取到，但不包含越界页', () => {
    expect(parsePageRanges('4-5', 5)).toEqual([3, 4]);
  });

  it('页码 0 报错', () => {
    expect(() => parsePageRanges('0', 5)).toThrow(/从 1 开始|超出范围/);
  });

  it('超出总页数报错，并说明共几页', () => {
    expect(() => parsePageRanges('1-6', 5)).toThrow(/共 5 页/);
  });

  it('逆序范围报错', () => {
    expect(() => parsePageRanges('4-2', 5)).toThrow(/逆序/);
  });

  it('空字符串 / 空片段报错', () => {
    expect(() => parsePageRanges('  ', 5)).toThrow(/不能为空/);
    expect(() => parsePageRanges('1,,3', 5)).toThrow(/空片段/);
  });

  it('非法字符报错，并给出正确写法', () => {
    expect(() => parsePageRanges('a-b', 5)).toThrow(/正确写法/);
    expect(() => parsePageRanges('1..3', 5)).toThrow(/正确写法/);
  });

  it('负数 / 小数报错', () => {
    expect(() => parsePageRanges('-1', 5)).toThrow(/正确写法/);
    expect(() => parsePageRanges('1.5', 5)).toThrow(/正确写法/);
  });

  it('总页数非法报错', () => {
    expect(() => parsePageRanges('1', 0)).toThrow(/没有可处理的页面/);
  });
});
