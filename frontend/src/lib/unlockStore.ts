/**
 * 付费解锁记录管理（纯前端 localStorage）
 * 
 * 每条结果（八字/易经）的 AI 解读需要支付 0.5 元解锁。
 * 支付后记录存到 localStorage，永久解锁该条结果。
 * 
 * 数据结构：
 * xuanjige:unlocks:v1 = {
 *   "bazi:{\"birth_year\":1990,...}": 1710400000000,
 *   "yijing:{\"question\":\"...\",...}": 1710400000001
 * }
 */

const UNLOCK_KEY = 'xuanjige:unlocks:v1';

function getUnlocks(): Record<string, number> {
  try {
    const raw = localStorage.getItem(UNLOCK_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed as Record<string, number>;
    }
    return {};
  } catch {
    return {};
  }
}

function persist(unlocks: Record<string, number>): void {
  try {
    localStorage.setItem(UNLOCK_KEY, JSON.stringify(unlocks));
  } catch {
    // 配额超限等异常静默忽略
  }
}

/** 检查指定结果是否已付费解锁 */
export function isUnlocked(unlockKey: string): boolean {
  return unlockKey in getUnlocks();
}

/** 标记指定结果为已解锁 */
export function markUnlocked(unlockKey: string): void {
  const unlocks = getUnlocks();
  unlocks[unlockKey] = Date.now();
  persist(unlocks);
}

/** 获取已解锁总数 */
export function getUnlockedCount(): number {
  return Object.keys(getUnlocks()).length;
}
