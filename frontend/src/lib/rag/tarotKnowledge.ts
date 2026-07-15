/**
 * 塔罗知识检索——根据牌面直接检索对应知识库片段
 * 不同于通用 searchRag（单字匹配），本函数：
 * 1. 用牌的中英文名作为关键词精确查找
 * 2. 返回匹配的完整段落
 */
import type { RagSource } from '@/types/consult';

const CORPUS_PATH = 'corpus/tarot/tarot_intro.txt';
const CHUNK_MIN_CHARS = 50;

interface Chunk {
  text: string;
  book: string;
}

let _cache: Chunk[] | null = null;
let _promise: Promise<Chunk[]> | null = null;

function corpusUrl(rel: string): string {
  return `${import.meta.env.BASE_URL}${rel}`;
}

async function loadChunks(): Promise<Chunk[]> {
  if (_cache) return _cache;
  if (_promise) return _promise;
  _promise = (async () => {
    const chunks: Chunk[] = [];
    try {
      const res = await fetch(corpusUrl(CORPUS_PATH));
      if (res.ok) {
        const text = await res.text();
        for (const raw of text.split('\n\n')) {
          const para = raw.trim();
          if (!para || para.length < CHUNK_MIN_CHARS) continue;
          if (para.startsWith('#')) continue;
          chunks.push({ text: para, book: '塔罗入门' });
        }
      }
    } catch {
      // 静默
    }
    _cache = chunks;
    return chunks;
  })();
  return _promise;
}

/** 根据牌名（中、英）、位置名称、关键词，返回知识库中最相关的段落 */
export async function searchTarotKnowledge(
  cardNames: string[],
  cardKeywords: string[],
): Promise<RagSource[]> {
  const chunks = await loadChunks();

  // 为每张牌构建关键词集合
  const allKeywords = new Set<string>();
  for (const name of cardNames) {
    // 中英文名
    allKeywords.add(name.toLowerCase());
    // 单字中文：大牌如"愚者""魔术师"，小牌如"权杖"+"二"
    for (const ch of name) {
      if (ch >= '\u4e00' && ch <= '\u9fff') allKeywords.add(ch);
    }
  }
  for (const kw of cardKeywords) {
    allKeywords.add(kw.toLowerCase());
    for (const ch of kw) {
      if (ch >= '\u4e00' && ch <= '\u9fff') allKeywords.add(ch);
    }
  }

  const results: RagSource[] = [];
  const kwList = [...allKeywords].filter((k) => k.length > 0);

  for (const c of chunks) {
    const lower = c.text.toLowerCase();
    let matched = 0;
    for (const kw of kwList) {
      if (lower.includes(kw)) matched++;
    }
    if (matched > 0) {
      const score = Math.min(matched / kwList.length, 1.0);
      results.push({ book: c.book, text: c.text.slice(0, 500), score: Math.round(score * 10000) / 10000 });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 5);
}
