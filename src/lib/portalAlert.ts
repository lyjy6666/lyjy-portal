const KEY_PREFIX = 'portalAlertSeen:';

/** 标记某个服务的告警角标为「已读」（用户已点进去过）。 */
export function markAlertSeen(id: string): void {
  try {
    localStorage.setItem(KEY_PREFIX + id, '1');
  } catch {
    /* localStorage 不可用时忽略：角标只是提示，不影响功能 */
  }
}

/** 该服务的告警角标是否已读。 */
export function isAlertSeen(id: string): boolean {
  try {
    return localStorage.getItem(KEY_PREFIX + id) === '1';
  } catch {
    return false;
  }
}
