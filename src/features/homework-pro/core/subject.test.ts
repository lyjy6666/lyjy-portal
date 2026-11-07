import { describe, it, expect } from 'vitest';
import { SUBJECTS, extractSubject, normalizeSubjectPrefix, subjectColorIndex } from './subject';

describe('科目表', () => {
  it('长科目排在短科目之前（英语单词优先于英语）', () => {
    expect(SUBJECTS.indexOf('英语单词')).toBeLessThan(SUBJECTS.indexOf('英语'));
  });

  it('推断科目并归一化前缀', () => {
    expect(extractSubject('数学完成习题1-10')).toBe('数学');
    expect(extractSubject('英语单词抄写三遍')).toBe('英语单词');
    expect(extractSubject('随便写点什么')).toBe('其他');
    expect(normalizeSubjectPrefix('一张试卷')).toBe('一张试卷');
    expect(normalizeSubjectPrefix('数学 完成习题')).toContain('数学');
  });

  it('科目标色稳定且为 1..8（其他 = 0）', () => {
    expect(subjectColorIndex('数学')).toBe(subjectColorIndex('数学'));
    expect(subjectColorIndex('其他')).toBe(0);
    for (const s of SUBJECTS) {
      const idx = subjectColorIndex(s);
      expect(idx).toBeGreaterThanOrEqual(1);
      expect(idx).toBeLessThanOrEqual(8);
    }
  });
});
