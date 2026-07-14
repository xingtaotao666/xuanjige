/**
 * 支付 API 封装 —— 对接 Cloudflare Worker 微信支付接口
 *
 * 当用户配置了 Worker URL 后，所有支付流程通过 Worker 完成：
 * 1. createOrder → 微信支付 Native API 返回 code_url
 * 2. 前端展示二维码（用户扫码支付）
 * 3. queryOrder → 轮询支付状态
 * 4. 成功 → 本地解锁
 */

const WORKER_URL_KEY = 'xuanjige:payment:workerUrl';

// ---------- Worker URL 配置 ----------

export function getWorkerUrl(): string {
  try {
    return localStorage.getItem(WORKER_URL_KEY) || '';
  } catch {
    return '';
  }
}

export function setWorkerUrl(url: string): void {
  try {
    localStorage.setItem(WORKER_URL_KEY, url);
  } catch {
    // 静默
  }
}

export function hasWorkerUrl(): boolean {
  return !!getWorkerUrl();
}

// ---------- API 请求 ----------

export interface CreateOrderRequest {
  recordKey: string;
  description?: string;
}

export interface CreateOrderResponse {
  outTradeNo: string;
  codeUrl: string;
  totalFee: number;
}

export interface QueryOrderResponse {
  status: 'NOTPAY' | 'SUCCESS' | 'REFUND' | 'CLOSED';
  paidAt?: number;
}

/** 创建支付订单 */
export async function createOrder(
  req: CreateOrderRequest,
): Promise<CreateOrderResponse> {
  const base = getWorkerUrl().replace(/\/+$/, '');
  const res = await fetch(`${base}/api/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recordKey: req.recordKey,
      description: req.description || '玄机阁 - AI 命理解读',
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`支付服务错误 (${res.status}): ${text}`);
  }
  const data: CreateOrderResponse = await res.json();
  if (!data.codeUrl) throw new Error('支付服务未返回二维码');
  return data;
}

/** 查询订单状态 */
export async function queryOrder(
  outTradeNo: string,
): Promise<QueryOrderResponse> {
  const base = getWorkerUrl().replace(/\/+$/, '');
  const res = await fetch(`${base}/api/query-order?out_trade_no=${encodeURIComponent(outTradeNo)}`);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`查询订单失败 (${res.status}): ${text}`);
  }
  return res.json() as Promise<QueryOrderResponse>;
}

/** 生成微信支付二维码 URL（调用第三方 API） */
export function getQrCodeImageUrl(codeUrl: string, size = 200): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(codeUrl)}`;
}
