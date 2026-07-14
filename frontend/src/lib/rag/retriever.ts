// 古籍关键词 RAG 检索（纯前端化）
//
// 等价后端 app/services/rag/retriever.py 的「中文关键字回退检索」分支：
// 浏览器端 fetch 静态分发的古籍语料（public/corpus/*.txt），按段落切分，
// 对用户查询做单字中文切分 + 停用字过滤，统计段落命中关键词数量排序，
// 返回最相关的古籍片段。零模型加载，完全离线可用。

import type { RagSource } from '@/types/consult';

const CORPUS_FILES: Array<{ path: string; book: string }> = [
  { path: 'corpus/ditian_sui/wuxing.txt', book: '滴天髓' },
  { path: 'corpus/meihua_yishu/tiyong.txt', book: '梅花易数' },
  { path: 'corpus/qiongton_baojian/yongshang.txt', book: '穷通宝鉴' },
  { path: 'corpus/sanming_tonghui/shishen.txt', book: '三命通会' },
  { path: 'corpus/xieji_bianfang/huangli.txt', book: '协纪辨方' },
  { path: 'corpus/yijing/guaci.txt', book: '周易' },
  { path: 'corpus/yuanhai_ziping/jueci.txt', book: '渊海子平' },
];

const CHUNK_MIN_CHARS = 50;
const STOP = new Set('的了的在是与和及之其此该等年月日时柱干支五行');

interface Chunk {
  text: string;
  book: string;
}

let _chunksCache: Chunk[] | null = null;
let _chunksPromise: Promise<Chunk[]> | null = null;

function corpusUrl(rel: string): string {
  return `${import.meta.env.BASE_URL}${rel}`;
}

function tokenizeQuery(query: string): string[] {
  const tokens: string[] = [];
  for (const part of query.toLowerCase().split(/\s+/)) {
    if ([...part].some((c) => c.charCodeAt(0) < 128)) tokens.push(part);
  }
  for (const ch of query) {
    if (ch >= '一' && ch <= '鿿') tokens.push(ch);
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of tokens) {
    if (t.length > 0 && !STOP.has(t) && !seen.has(t)) {
      seen.add(t);
      out.push(t);
    }
  }
  return out;
}

async function loadChunks(): Promise<Chunk[]> {
  if (_chunksCache) return _chunksCache;
  if (_chunksPromise) return _chunksPromise;
  _chunksPromise = (async () => {
    const chunks: Chunk[] = [];
    await Promise.all(
      CORPUS_FILES.map(async (f) => {
        try {
          const res = await fetch(corpusUrl(f.path));
          if (!res.ok) return;
          const text = await res.text();
          for (const raw of text.split('\n\n')) {
            const para = raw.trim();
            if (!para || para.length < CHUNK_MIN_CHARS) continue;
            if (para.startsWith('#')) continue;
            chunks.push({ text: para, book: f.book });
          }
        } catch {
          // 单个文件失败不影响整体
        }
      }),
    );
    _chunksCache = chunks;
    return chunks;
  })();
  return _chunksPromise;
}

/** 关键词检索，返回最相关片段。 */
export async function searchRag(query: string, n = 5): Promise<RagSource[]> {
  const chunks = await loadChunks();
  const keywords = tokenizeQuery(query);
  if (keywords.length === 0) return [];

  const results: RagSource[] = [];
  for (const c of chunks) {
    const lower = c.text.toLowerCase();
    let matched = 0;
    for (const kw of keywords) {
      if (kw.length > 1 ? lower.includes(kw) : lower.includes(kw)) matched++;
    }
    if (matched > 0) {
      const score = Math.min(matched / keywords.length, 1.0);
      results.push({ book: c.book, text: c.text.slice(0, 500), score: round4(score) });
    }
  }
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, n);
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
