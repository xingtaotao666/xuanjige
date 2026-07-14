// 八字本地服务（纯前端化）
//
// 组合：八字引擎(calculateBazi) + 古籍 RAG(searchRag) + 提示词(prompt) +
// DeepSeek 直连(callDeepSeek)，在浏览器内完成「排盘 → 检索 → 解读」全流程，
// 输出与后端 BaziAnalyzeResponse 完全对齐的结构，供 api/client 透传。

import { calculateBazi, type BaziInput } from '@/lib/bazi/engine';
import { searchRag } from '@/lib/rag/retriever';
import { buildBaziPrompt } from '@/lib/prompt';
import { callDeepSeek } from '@/lib/llm/deepseek';
import { loadKnowledge } from '@/lib/knowledge';
import type { BaziAnalyzeResponse } from '@/types/bazi';
import type { AnalyzeBaziRequest, BasicBaziRequest } from '@/api/client';

/** 完整分析：排盘 + 可选 RAG + 可选 LLM 解读。 */
export async function baziAnalyze(req: AnalyzeBaziRequest): Promise<BaziAnalyzeResponse> {
  const input: BaziInput = {
    birth_year: req.birth_year,
    birth_month: req.birth_month,
    birth_day: req.birth_day,
    birth_hour: req.birth_hour,
    gender: req.gender,
  };

  const bazi = await calculateBazi(input);

  const question =
    req.question ||
    `请为命主（${req.birth_year}年${req.birth_month}月${req.birth_day}日${req.gender === 'male' ? '男' : '女'}）做专业命理解读`;

  let ragSources: BaziAnalyzeResponse['rag_sources'] = undefined;
  if (req.with_rag !== false) {
    ragSources = await searchRag(question, 5);
  }

  let llm: string | undefined;
  if (req.with_llm !== false) {
    const knowledge = await loadKnowledge();
    const { system, user } = buildBaziPrompt(bazi, ragSources ?? [], knowledge);
    llm = await callDeepSeek(
      [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      { kind: 'bazi', temperature: 0.7, maxTokens: 3000 },
    );
    if (!llm) llm = undefined;
  }

  return {
    bazi,
    llm_interpretation: llm,
    rag_sources: ragSources,
  };
}

/** 仅排盘（不含 LLM / RAG），对应后端 /api/bazi/basic。 */
export async function baziBasic(req: BasicBaziRequest): Promise<BaziAnalyzeResponse> {
  return baziAnalyze({
    ...req,
    with_llm: false,
    with_rag: false,
  });
}
