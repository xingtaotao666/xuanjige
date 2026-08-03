/**
 * 风水知识检索
 */
import type { RagSource } from '@/types/consult';

const CORPUS_PATH = 'corpus/fengshui/fengshui.txt';
const CHUNK_MIN_CHARS = 60;

interface Chunk { text: string; book: string; }

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
    let currentBook = '风水';
    try {
      const res = await fetch(corpusUrl(CORPUS_PATH));
      if (res.ok) {
        const text = await res.text();
        for (const raw of text.split('\n\n')) {
          const para = raw.trim();
          if (!para) continue;
          if (para.startsWith('═══')) continue;
          if (para.startsWith('## ')) {
            currentBook = para.replace(/^##\s*/, '').split(/[：:。]/)[0].trim() || '风水';
            continue;
          }
          if (para.startsWith('### ')) continue;
          if (para.startsWith('#')) continue;
          if (para.length < CHUNK_MIN_CHARS) continue;
          chunks.push({ text: para, book: currentBook });
        }
      }
    } catch { /* */ }
    _cache = chunks;
    return chunks;
  })();
  return _promise;
}

export async function searchFengShuiKnowledge(
  descriptions: string[],
  keywords: string[],
): Promise<RagSource[]> {
  const chunks = await loadChunks();
  const allKeywords = new Set<string>();
  for (const d of descriptions) {
    allKeywords.add(d.toLowerCase());
    for (const ch of d) { if (ch >= '\u4e00' && ch <= '\u9fff') allKeywords.add(ch); }
  }
  for (const kw of keywords) {
    allKeywords.add(kw.toLowerCase());
    for (const ch of kw) { if (ch >= '\u4e00' && ch <= '\u9fff') allKeywords.add(ch); }
  }
  const results: RagSource[] = [];
  const kwList = [...allKeywords].filter((k) => k.length > 0);
  for (const c of chunks) {
    const lower = c.text.toLowerCase();
    let matched = 0;
    for (const kw of kwList) { if (lower.includes(kw)) matched++; }
    if (matched > 0) {
      results.push({ book: c.book, text: c.text.slice(0, 500), score: Math.round((matched / kwList.length) * 10000) / 10000 });
    }
  }
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 6);
}
