// 易经本地服务（纯前端化）
//
// 组合：起卦解卦引擎(analyzeGua / divinateByNumbers / divinateByRandom) +
// 古籍 RAG(searchRag) + 提示词(prompt) + DeepSeek 直连(callDeepSeek)，
// 在浏览器内完成「起卦 → 检索 → 解读」全流程，输出 DivinateResponse。

import {
  analyzeGua,
  divinateByNumbers,
  divinateByRandom,
} from '@/lib/yijing/engine';
import { searchRag } from '@/lib/rag/retriever';
import { buildYijingPrompt } from '@/lib/prompt';
import { callDeepSeek } from '@/lib/llm/deepseek';
import type { DivinateResponse } from '@/types/yijing';
import type { DivinateRequest } from '@/api/client';

/** 起卦 + 可选 RAG + 可选 LLM 解读。 */
export async function yijingDivinate(req: DivinateRequest): Promise<DivinateResponse> {
  let yaoValues: number[];
  if (req.method === 'numbers') {
    yaoValues = divinateByNumbers(req.num1 ?? 0, req.num2 ?? 0, req.num3 ?? 0);
  } else if (req.yao_values && req.yao_values.length === 6) {
    yaoValues = req.yao_values;
  } else {
    // 兜底：随机摇卦（实际 UI 中 coins 模式已传入 yao_values）
    yaoValues = divinateByRandom();
  }

  const gua = analyzeGua(yaoValues, req.question);

  const searchQuery = `${req.question || gua.question} ${gua.primary_gua.name}`;

  let ragSources: DivinateResponse['rag_sources'] = undefined;
  if (req.with_rag !== false) {
    ragSources = await searchRag(searchQuery, 5);
  }

  let llm: string | undefined;
  if (req.with_llm !== false) {
    const { system, user } = buildYijingPrompt(gua, ragSources ?? []);
    llm = await callDeepSeek(
      [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      { kind: 'yijing', temperature: 0.7, maxTokens: 3000 },
    );
    if (!llm) llm = undefined;
  }

  return {
    gua,
    llm_interpretation: llm,
    rag_sources: ragSources,
  };
}
