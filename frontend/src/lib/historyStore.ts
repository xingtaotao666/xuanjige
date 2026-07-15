// 本地记忆（localStorage）与分享链接（URL 编码）的核心库
// 所有数据均保存在用户本机浏览器，不经过任何服务器。

import type { BaziAnalyzeResponse, DivinateResponse, TarotAnalyzeResponse } from '@/types';

export type RecordType = 'bazi' | 'yijing' | 'tarot';

export interface BaziInputSnapshot {
  birth_year: number;
  birth_month: number;
  birth_day: number;
  birth_hour: number;
  gender: 'male' | 'female';
  question?: string;
}

export interface YijingInputSnapshot {
  question: string;
  method: 'coins' | 'numbers';
  num1?: number;
  num2?: number;
  num3?: number;
  yao_values?: number[];
}

export type InputSnapshot = BaziInputSnapshot | YijingInputSnapshot;

export interface HistoryRecord {
  /** 唯一 id（用于删除） */
  id: string;
  /** 去重键：同一输入只保留一条 */
  key: string;
  type: RecordType;
  createdAt: number;
  /** 列表展示标题 */
  title: string;
  input: InputSnapshot;
  result: BaziAnalyzeResponse | DivinateResponse | TarotAnalyzeResponse;
}

export interface SharePayload {
  v: 1;
  type: RecordType;
  createdAt: number;
  input: InputSnapshot;
  result: BaziAnalyzeResponse | DivinateResponse | TarotAnalyzeResponse;
}

const HISTORY_KEY = 'xuanjige:history:v1';

// ---------- Unicode 安全的 base64 ----------
function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

function base64ToUtf8(b64: string): string {
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

// ---------- 历史记录 ----------
export function getHistory(): HistoryRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as HistoryRecord[]) : [];
  } catch {
    return [];
  }
}

function persist(records: HistoryRecord[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(records));
  } catch {
    // 配额超限等异常：静默忽略，避免阻断使用
  }
}

/** 新增一条记录；若 key 已存在则跳过（返回原数组） */
export function addRecord(rec: HistoryRecord): HistoryRecord[] {
  const list = getHistory();
  if (list.some((r) => r.key === rec.key)) return list;
  const next = [rec, ...list];
  persist(next);
  return next;
}

export function removeRecord(id: string): HistoryRecord[] {
  const next = getHistory().filter((r) => r.id !== id);
  persist(next);
  return next;
}

export function clearRecords(): void {
  persist([]);
}

// ---------- 分享链接 ----------
export function encodeShare(p: SharePayload): string {
  return utf8ToBase64(JSON.stringify(p));
}

export function decodeShare(code: string): SharePayload | null {
  try {
    const obj = JSON.parse(base64ToUtf8(code));
    if (
      obj &&
      obj.v === 1 &&
      (obj.type === 'bazi' || obj.type === 'yijing') &&
      obj.result
    ) {
      return obj as SharePayload;
    }
    return null;
  } catch {
    return null;
  }
}

/** 生成可分享的完整 URL（基于当前站点地址） */
export function buildShareUrl(p: SharePayload): string {
  const base = window.location.origin + window.location.pathname;
  return `${base}#/share?d=${encodeURIComponent(encodeShare(p))}`;
}

// ---------- 工具 ----------
export function makeRecordKey(
  type: RecordType,
  input: InputSnapshot,
): string {
  return `${type}:${JSON.stringify(input)}`;
}

export function genId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
