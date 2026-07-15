/**
 * 塔罗知识检索——根据牌面直接检索对应知识库片段
 * 自动解析 tarot_intro.txt 中的 `###` 标题提取各书原文
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

/** 从 `### 标题` 中提取书名（去掉《》符号） */
function extractBookName(header: string): string {
  // 匹配 ### 《书名》 或 ### 《书名》（《别名》）— 作者
  let name = header.replace(/^#+\s*/, '').trim();
  // 提取《》内的内容
  const match = name.match(/《(.+?)》/);
  if (match) return match[1];
  // 没有《》就取冒号/句号前的部分
  const cut = name.split(/[：:。]/)[0];
  return cut || '塔罗入门';
}

async function loadChunks(): Promise<Chunk[]> {
  if (_cache) return _cache;
  if (_promise) return _promise;
  _promise = (async () => {
    const chunks: Chunk[] = [];
    let currentBook = '塔罗入门';
    try {
      const res = await fetch(corpusUrl(CORPUS_PATH));
      if (res.ok) {
        const text = await res.text();
        const parts = text.split('\n\n');
        for (const raw of parts) {
          const para = raw.trim();
          if (!para) continue;

          // 检测标题行
          if (para.startsWith('### ') || para.startsWith('## ')) {
            currentBook = extractBookName(para);
            continue;
          }
          if (para.startsWith('#')) continue; // 其他标题跳过

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

/** 根据牌名（中、英）、关键词，返回知识库中最相关的段落 */
export async function searchTarotKnowledge(
  cardNames: string[],
  cardKeywords: string[],
): Promise<RagSource[]> {
  const chunks = await loadChunks();

  // 为每张牌构建关键词集合
  const allKeywords = new Set<string>();
  for (const name of cardNames) {
    allKeywords.add(name.toLowerCase());
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
