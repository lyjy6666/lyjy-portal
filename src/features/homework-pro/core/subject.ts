/**
 * 科目表：前后端唯一真源。
 *
 * 旧版前端 extractSubject 用 20 个科目，后端 splitTasksLocally 却只认 13 个，
 * 导致 AI 兜底分点后的科目归类与列表视图不一致。这里统一成一份，
 * 服务端 tasks/route.ts 直接 import 本文件（纯 TS，无 DOM/React 依赖）。
 */

/** 按长度降序排列，保证「英语单词」优先于「英语」被命中 */
export const SUBJECTS: string[] = [
  '道德与法治', '信息技术', '思想品德', '英语单词', '英语阅读', '英语作文',
  '语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治',
  '音乐', '美术', '体育', '科学', '编程', '计算机',
].sort((a, b) => b.length - a.length);

export const OTHER_SUBJECT = '其他';

/** 从作业文本推断科目；命中不到返回「其他」 */
export function extractSubject(text: string): string {
  const clean = (text || '').trim();
  if (!clean) return OTHER_SUBJECT;
  for (const subject of SUBJECTS) {
    if (clean.includes(subject)) return subject;
  }
  return OTHER_SUBJECT;
}

/** 科目前缀归一化：给没有科目开头的条目补上前缀（AI 分点本地兜底用） */
export function normalizeSubjectPrefix(item: string): string {
  const clean = item.trim();
  if (!clean) return clean;
  if (SUBJECTS.some((s) => clean.startsWith(s))) return clean;

  const found = SUBJECTS.find((s) => {
    const at = clean.indexOf(s);
    return at >= 0 && at < 5;
  });
  if (found) return `${found}${clean.replace(found, '').trim()}`;
  return clean;
}

/**
 * 稳定的科目标色索引（1..8）。
 * 跨皮肤只调整明度，保持色相一致，避免换肤后「数学变了个颜色」的认知漂移。
 */
const SUBJECT_COLOR_OVERRIDES: Record<string, number> = {
  语文: 1, 数学: 2, 英语: 3, 英语单词: 3, 英语阅读: 3, 英语作文: 3,
  物理: 4, 化学: 5, 生物: 6, 历史: 7, 地理: 8, 政治: 2,
  科学: 5, 信息技术: 4, 编程: 4, 计算机: 4,
};

export function subjectColorIndex(subject: string): number {
  if (SUBJECT_COLOR_OVERRIDES[subject]) return SUBJECT_COLOR_OVERRIDES[subject];
  if (subject === OTHER_SUBJECT) return 0;
  // 未知科目用字符和做稳定散列
  let sum = 0;
  for (const ch of subject) sum += ch.codePointAt(0) ?? 0;
  return (sum % 8) + 1;
}
