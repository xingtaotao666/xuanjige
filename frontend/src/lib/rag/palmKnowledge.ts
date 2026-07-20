/**
 * 手相知识检索——根据手相描述检索对应知识库片段
 */
import type { RagSource } from '@/types/consult';

const CORPUS_PATH = 'corpus/xiangshou/xiangshou.txt';
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
    let currentBook = '手相入门';
    try {
      const res = await fetch(corpusUrl(CORPUS_PATH));
      if (res.ok) {
        const text = await res.text();
        const parts = text.split('\n\n');
        for (const raw of parts) {
          const para = raw.trim();
          if (!para) continue;
          if (para.startsWith('### ') || para.startsWith('## ')) {
            currentBook = para.replace(/^#+\s*/, '').split(/[：:。]/)[0].trim() || '手相入门';
            continue;
          }
          if (para.startsWith('#')) continue;
          if (para.length < CHUNK_MIN_CHARS) continue;
          chunks.push({ text: para, book: currentBook });
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

/** 根据手相描述关键词，返回知识库中最相关的段落 */
export async function searchPalmKnowledge(
  descriptions: string[],
  keywords: string[],
): Promise<RagSource[]> {
  const chunks = await loadChunks();

  const allKeywords = new Set<string>();
  for (const desc of descriptions) {
    allKeywords.add(desc.toLowerCase());
    for (const ch of desc) {
      if (ch >= '\u4e00' && ch <= '\u9fff') allKeywords.add(ch);
    }
  }
  for (const kw of keywords) {
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
      results.push({
        book: c.book,
        text: c.text.slice(0, 500),
        score: Math.round(score * 10000) / 10000,
      });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 5);
}
