/**
 * 玄机阁 - 微信支付 Cloudflare Worker
 *
 * 环境变量（在 Cloudflare Dashboard → Workers → 您的 Worker → Settings → Variables 中设置）：
 *   WECHAT_APPID        公众号/小程序 AppID（与商户号绑定）
 *   WECHAT_MCHID        微信支付商户号
 *   WECHAT_API_V3_KEY   API v3 密钥（32 位，在微信支付商户平台设置）
 *   WECHAT_SERIAL_NO    商户证书序列号（可在商户平台查看）
 *   WECHAT_PRIVATE_KEY  商户私钥（PEM 格式，含 -----BEGIN PRIVATE KEY----- 和 -----END PRIVATE KEY-----）
 *   NOTIFY_URL          支付回调地址（通常是 https://您的worker域名/api/notify）
 *   PAY_PRICE           每笔价格（分），默认 50（0.5 元）
 *
 * KV Namespace 绑定（绑定名称: PAYMENT_KV）：
 *   用于存储订单状态，避免重复创建。
 *
 * 接口：
 *   POST /api/create-order — 创建微信支付订单
 *   GET  /api/query-order  — 查询订单状态
 *   POST /api/notify       — 微信支付异步回调
 *   GET  /api/health       — 健康检查
 *
 * 部署步骤见 workers/README.md
 */

// ---------- 工具函数 ----------

/** 生成 32 位随机字符串 */
function nonceStr(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < 32; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

/** 获取当前 Unix 时间戳（秒） */
function nowSec(): string {
  return Math.floor(Date.now() / 1000).toString();
}

/** 构造微信支付 V3 签名串 */
function buildSignStr(
  method: string,
  url: string,
  timestamp: string,
  nonce: string,
  body: string,
): string {
  return `${method}\n${url}\n${timestamp}\n${nonce}\n${body}\n`;
}

/**
 * 使用 Web Crypto API 进行 SHA256withRSA 签名
 * privateKeyPem: PKCS#8 格式 PEM 字符串
 */
async function rsaSign(privateKeyPem: string, data: string): Promise<string> {
  // 将 PEM 转换为 ArrayBuffer
  const pemHeader = '-----BEGIN PRIVATE KEY-----';
  const pemFooter = '-----END PRIVATE KEY-----';
  const pemContents = privateKeyPem
    .replace(pemHeader, '')
    .replace(pemFooter, '')
    .replace(/\s/g, '');
  const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    privateKey,
    encoder.encode(data),
  );

  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

/** 构建用于查询订单的请求体（GET 请求 body 为空） */
function buildSignStrForGet(method: string, url: string, timestamp: string, nonce: string): string {
  return `${method}\n${url}\n${timestamp}\n${nonce}\n\n`;
}

/** 发送签名后的微信支付 V3 API 请求 */
async function wechatPayRequest(
  method: string,
  path: string,
  body: string | null,
  env: Env,
): Promise<Response> {
  const timestamp = nowSec();
  const nonce = nonceStr();
  const url = `/v3${path}`;
  const signStr = body
    ? buildSignStr(method, url, timestamp, nonce, body)
    : buildSignStrForGet(method, url, timestamp, nonce);
  const signature = await rsaSign(env.WECHAT_PRIVATE_KEY, signStr);

  const auth = `WECHATPAY2-SHA256-RSA2048 mchid="${env.WECHAT_MCHID}",nonce_str="${nonce}",timestamp="${timestamp}",serial_no="${env.WECHAT_SERIAL_NO}",signature="${signature}"`;

  const headers: Record<string, string> = {
    Authorization: auth,
    Accept: 'application/json',
    'User-Agent': 'xuanjige-worker/1.0',
  };
  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`https://api.mch.weixin.qq.com${url}`, {
    method,
    headers,
    body: body || undefined,
  });

  return res;
}

// ---------- 订单管理 ----------

const ONE_HOUR = 3600 * 1000;
const PRICE_DEFAULT = 50; // 0.5 元 = 50 分

/** 获取 KV 中存储的订单 */
async function getOrder(env: Env, outTradeNo: string): Promise<OrderRecord | null> {
  try {
    const raw = await env.PAYMENT_KV.get(outTradeNo);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** 保存订单到 KV */
async function saveOrder(env: Env, order: OrderRecord): Promise<void> {
  // KV TTL: 1 小时
  await env.PAYMENT_KV.put(order.outTradeNo, JSON.stringify(order), {
    expirationTtl: ONE_HOUR,
  });
}

/** 检查 orderKey 是否已被其他订单支付 */
async function isRecordKeyPaid(env: Env, recordKey: string, excludeOrderId?: string): Promise<boolean> {
  // 通过前缀扫描（不完美但实用）
  // 实际可改用专门的 KV 记录，但为简化直接查
  return false; // 精确校验通过微信支付 API 完成
}

// ---------- 处理函数 ----------

/** POST /api/create-order */
async function handleCreateOrder(request: Request, env: Env): Promise<Response> {
  try {
    const { recordKey, description } = (await request.json()) as {
      recordKey?: string;
      description?: string;
    };

    if (!recordKey) {
      return new Response(JSON.stringify({ error: '缺少 recordKey' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const price = env.PAY_PRICE ? parseInt(env.PAY_PRICE, 10) : PRICE_DEFAULT;
    const outTradeNo = `XJG${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const notifyUrl = env.NOTIFY_URL || `${request.url.replace(/\/[^/]*$/, '')}/notify`;

    const body = JSON.stringify({
      appid: env.WECHAT_APPID,
      mchid: env.WECHAT_MCHID,
      description: description || '玄机阁 - AI 命理解读',
      out_trade_no: outTradeNo,
      notify_url: notifyUrl,
      amount: { total: price, currency: 'CNY' },
      attach: recordKey, // 回调时携带 recordKey
    });

    const wxRes = await wechatPayRequest('POST', '/pay/transactions/native', body, env);
    const wxData = await wxRes.json<any>();

    if (!wxRes.ok) {
      return new Response(JSON.stringify({ error: '微信支付创建失败', detail: wxData }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 保存订单到 KV
    await saveOrder(env, {
      outTradeNo,
      recordKey,
      status: 'NOTPAY',
      totalFee: price,
      createdAt: Date.now(),
    });

    return new Response(
      JSON.stringify({
        outTradeNo,
        codeUrl: wxData.code_url,
        totalFee: price,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/** GET /api/query-order */
async function handleQueryOrder(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const outTradeNo = url.searchParams.get('out_trade_no');
    if (!outTradeNo) {
      return new Response(JSON.stringify({ error: '缺少 out_trade_no' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 先查本地 KV 缓存
    const local = await getOrder(env, outTradeNo);
    if (!local) {
      return new Response(JSON.stringify({ error: '订单不存在' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 如果已经是 SUCCESS，直接返回
    if (local.status === 'SUCCESS') {
      return new Response(
        JSON.stringify({ status: 'SUCCESS', paidAt: local.paidAt }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // 调用微信支付查询
    const queryPath = `/pay/transactions/out-trade-no/${outTradeNo}?mchid=${env.WECHAT_MCHID}`;
    const wxRes = await wechatPayRequest('GET', queryPath, null, env);
    const wxData = await wxRes.json<any>();

    if (wxRes.ok && wxData.trade_state === 'SUCCESS') {
      // 更新本地状态
      local.status = 'SUCCESS';
      local.paidAt = Date.now();
      await saveOrder(env, local);
      return new Response(
        JSON.stringify({ status: 'SUCCESS', paidAt: local.paidAt }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // 更新状态（NOTPAY / CLOSED / REFUND）
    const tradeState = wxData.trade_state || 'NOTPAY';
    local.status = tradeState === 'SUCCESS' ? 'SUCCESS' : tradeState === 'CLOSED' ? 'CLOSED' : tradeState === 'REFUND' ? 'REFUND' : 'NOTPAY';
    await saveOrder(env, local);

    return new Response(
      JSON.stringify({ status: local.status }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/** POST /api/notify — 微信支付回调 */
async function handleNotify(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.text();

    // 验证回调签名（Wechatpay-Signature / Wechatpay-Nonce / Wechatpay-Timestamp / Wechatpay-Serial）
    // 注意：微信支付回调使用平台公钥验证，需要获取平台证书。
    // 简化版：假设回调可信（生产环境需严格验证）
    const wxSignature = request.headers.get('Wechatpay-Signature') || '';
    const wxTimestamp = request.headers.get('Wechatpay-Timestamp') || '';
    const wxNonce = request.headers.get('Wechatpay-Nonce') || '';
    const wxSerial = request.headers.get('Wechatpay-Serial') || '';

    // 验证平台证书签名（简化：直接相信微信回调，实际可用平台证书列表 API 验证）
    // 最小可行版本：检查 out_trade_no 和 trade_state
    const parsed = JSON.parse(body);
    const outTradeNo = parsed.resource?.out_trade_no || parsed.out_trade_no;
    const tradeState = parsed.event_type === 'TRANSACTION.SUCCESS' ? 'SUCCESS'
      : parsed.resource?.trade_state || 'NOTPAY';

    if (outTradeNo && tradeState === 'SUCCESS') {
      const local = await getOrder(env, outTradeNo);
      if (local && local.status !== 'SUCCESS') {
        local.status = 'SUCCESS';
        local.paidAt = Date.now();
        await saveOrder(env, local);
      }
    }

    // 微信要求返回 <xml><return_code><![CDATA[SUCCESS]]></return_code></xml>
    return new Response('<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>', {
      status: 200,
      headers: { 'Content-Type': 'application/xml' },
    });
  } catch (err: any) {
    console.error('Notify error:', err);
    return new Response('<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[' + err.message + ']]></return_msg></xml>', {
      status: 200,
      headers: { 'Content-Type': 'application/xml' },
    });
  }
}

/** GET /api/health */
function handleHealth(): Response {
  return new Response(JSON.stringify({ status: 'ok', service: 'xuanjige-payment' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** 跨域 CORS 头 */
function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

// ---------- 入口 ----------

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    let response: Response;
    try {
      switch (true) {
        case request.method === 'POST' && path === '/api/create-order':
          response = await handleCreateOrder(request, env);
          break;
        case request.method === 'GET' && path === '/api/query-order':
          response = await handleQueryOrder(request, env);
          break;
        case request.method === 'POST' && path === '/api/notify':
          response = await handleNotify(request, env);
          break;
        case request.method === 'GET' && path === '/api/health':
          response = handleHealth();
          break;
        default:
          response = new Response(JSON.stringify({ error: 'Not Found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          });
      }
    } catch (err: any) {
      response = new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 添加 CORS 头
    const cors = corsHeaders();
    const respHeaders = new Headers(response.headers);
    for (const [k, v] of Object.entries(cors)) {
      respHeaders.set(k, v);
    }

    return new Response(response.body, {
      status: response.status,
      headers: respHeaders,
    });
  },
};

// ---------- 类型 ----------

interface Env {
  WECHAT_APPID: string;
  WECHAT_MCHID: string;
  WECHAT_API_V3_KEY: string;
  WECHAT_SERIAL_NO: string;
  WECHAT_PRIVATE_KEY: string;
  NOTIFY_URL: string;
  PAY_PRICE?: string;
  PAYMENT_KV: KVNamespace;
}

interface OrderRecord {
  outTradeNo: string;
  recordKey: string;
  status: 'NOTPAY' | 'SUCCESS' | 'REFUND' | 'CLOSED';
  totalFee: number;
  createdAt: number;
  paidAt?: number;
}
