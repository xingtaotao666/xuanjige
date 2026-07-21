// DeepSeek LLM 客户端（纯前端直连）
//
// 浏览器直接调用 DeepSeek OpenAI 兼容接口（已验证 api.deepseek.com 完整支持
// CORS，前端可 fetch）。API Key 优先级：用户设置（localStorage）> 构建期注入
// 的 VITE_DEEPSEEK_API_KEY（部署时通过环境变量设置，避免硬编码进仓库）。
// 无 Key 或请求失败时自动降级为规则式回应。

export type LlmKind = 'bazi' | 'yijing' | 'tarot' | 'consult' | 'palm';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | ContentPart[];
}

export type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

const API_URL = 'https://api.deepseek.com/v1/chat/completions';
const MODEL = 'deepseek-chat';
const STORAGE_KEY = 'xuanji_deepseek_key';

export function getApiKey(): string {
  try {
    const local = localStorage.getItem(STORAGE_KEY);
    if (local && local.trim()) return local.trim();
  } catch {
    // localStorage 不可用时忽略
  }
  return (import.meta.env.VITE_DEEPSEEK_API_KEY as string | undefined) ?? '';
}

export function setApiKey(key: string): void {
  try {
    if (key && key.trim()) localStorage.setItem(STORAGE_KEY, key.trim());
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 忽略
  }
}

export function hasApiKey(): boolean {
  return getApiKey().length > 0;
}

export interface CallOptions {
  temperature?: number;
  maxTokens?: number;
  kind?: LlmKind;
}

export async function callDeepSeek(
  messages: ChatMessage[],
  opts: CallOptions = {},
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return cleanOutput(fallbackResponse(messages, opts.kind ?? 'consult'));
  }
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: opts.temperature ?? 0.7,
        max_tokens: opts.maxTokens ?? 3000,
        stream: false,
      }),
    });
    if (!res.ok) {
      throw new Error(`DeepSeek API ${res.status}`);
    }
    const data = await res.json();
    const choices = data?.choices ?? [];
    if (!choices.length) throw new Error('DeepSeek 返回空 choices');
    return cleanOutput(choices[0]?.message?.content ?? '');
  } catch {
    return cleanOutput(fallbackResponse(messages, opts.kind ?? 'consult'));
  }
}

/** 清除 LLM 输出中的 Markdown 符号（与后端 _clean_output 一致）。 */
export function cleanOutput(text: string): string {
  if (!text) return text;
  return text
    .replace(/\*\*/g, '')
    .replace(/__/g, '')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/^\s*[\*\-+]\s+/gm, '')
    .replace(/`/g, '')
    .replace(/\*/g, '')
    .trim();
}

function extractUserContent(messages: ChatMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role !== 'user') continue;
    if (typeof m.content === 'string') return m.content;
    // content 是数组时，提取所有 text 块
    return (m.content as ContentPart[])
      .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map((p) => p.text)
      .join(' ');
  }
  return '';
}

/** 无 Key / 失败时的规则式降级回应。 */
function fallbackResponse(messages: ChatMessage[], kind: LlmKind): string {
  const user = extractUserContent(messages);
  if (kind === 'yijing' || user.includes('卦') || user.includes('易经')) {
    return (
      '易经参考解读（AI 解读服务暂未配置 API Key）：\n\n' +
      '当前已根据《周易》卦象完成起卦与卦辞、爻辞、变/错/综卦的解析，' +
      '可在上方卦象区查看完整信息。\n\n' +
      '如需更深入、结合您实际问题的个性化解读，请在右上角「设置」中填入 DeepSeek API Key，' +
      '即可启用 AI 大师解卦。'
    );
  }
  if (kind === 'bazi' || user.includes('八字') || user.includes('命理') || user.includes('排盘')) {
    return (
      '八字基础解读（AI 解读服务暂未配置 API Key）：\n\n' +
      '当前已完成四柱八字排盘、十神、五行强弱、神煞与大运计算，可在上方各标签页查看。\n\n' +
      '如需结合古籍文献的个性化命理解读，请在右上角「设置」中填入 DeepSeek API Key，' +
      '即可启用 AI 命理师解读。'
    );
  }
  if (kind === 'tarot' || user.includes('塔罗') || user.includes('牌阵')) {
    return (
      '塔罗参考解读（AI 解读服务暂未配置 API Key）：\n\n' +
      '当前已完成塔罗牌阵抽取，可在上方查看各张牌的牌面与位置含义。\n\n' +
      '如需结合您具体问题的深度心灵解读，请在右上角「设置」中填入 DeepSeek API Key，' +
      '即可启用 AI 塔罗大师解牌。'
    );
  }
  return (
    '感谢您的咨询（AI 解读服务暂未配置 API Key）：\n\n' +
    '八字排盘与易经起卦功能均已正常运行，规则式解读基于命理学映射数据库。\n\n' +
    '如需获得 AI 深度解读，请在右上角「设置」中配置 DeepSeek API Key。'
  );
}
