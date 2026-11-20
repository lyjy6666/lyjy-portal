/**
 * 中文/日文输入法组合期间按 Enter 是「确认候选词」，不是提交表单。
 * 所有 onKeyDown 里的 Enter 分支都必须先过这一关。
 */
export function isComposing(e: { nativeEvent: KeyboardEvent }): boolean {
  const native = e.nativeEvent as KeyboardEvent & { keyCode?: number };
  return native.isComposing === true || native.keyCode === 229;
}

export const TASK_DRAG_MIME = 'text/homework-task';

/**
 * 读取拖拽载荷并校验。
 * 旧代码用 Number(getData(...))：取不到时 Number('') === 0 会绕过校验，
 * 于是向 id=0 发写请求，日历/周计划还会弹「改期成功」的假提示。
 */
export function readDragTaskId(
  e: { dataTransfer: DataTransfer },
  tasks: readonly { id: number }[],
): number | null {
  const raw = e.dataTransfer.getData(TASK_DRAG_MIME);
  if (!raw) return null;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) return null;
  return tasks.some((t) => t.id === id) ? id : null;
}
