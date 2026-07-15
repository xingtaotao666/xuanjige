/**
 * 塔罗占卜服务——编排抽牌 → RAG → LLM
 * 支持传入预抽好的牌（本地选牌流程），不再重新抽牌
 */
import type { TarotRequest, TarotAnalyzeResponse, TarotResult } from '@/types/tarot';
import { drawCards } from '@/lib/tarot/engine';
import { searchRag } from '@/lib/rag/retriever';
import { callDeepSeek } from '@/lib/llm/deepseek';
import { buildTarotPrompt } from '@/lib/prompt';
import { loadKnowledge } from '@/lib/knowledge';

/** 格式化多张牌的简义文本（同 engine.ts 中的 formatMeanings） */
function formatMeanings(cards: TarotResult['cards']): string {
  return cards
    .map(
      (p) =>
        `【${p.position}】${p.card.nameCn}（${p.card.nameEn}）${p.orientation === 'upright' ? '正位' : '逆位'}\n` +
        `  关键词：${p.card.keywords}\n` +
        `  含义：${p.orientation === 'upright' ? p.card.meaningUpright : p.card.meaningReversed}\n` +
        `  元素：${p.card.element}`,
    )
    .join('\n');
}

/** 构建 RAG 检索查询：综合用户问题 + 牌面内容（牌名、位置、正逆位、关键词、含义） */
function buildRagQuery(question: string, cards: TarotResult['cards']): string {
  const cardPart = cards
    .map((p) => `${p.card.nameCn} ${p.card.nameEn} ${p.card.keywords} ${p.position} ${p.orientation === 'upright' ? '正位' : '逆位'}`)
    .join(' ');
  return `${question} ${cardPart}`;
}

export interface TarotDivinationStage {
  stage: 'rag' | 'llm' | 'done';
  message: string;
}

export async function tarotDivinate(
  req: TarotRequest,
  onStage?: (stage: TarotDivinationStage) => void,
): Promise<TarotAnalyzeResponse> {
  const { question, spread = 'three', with_llm = true, with_rag = true, cards } = req;

  // 1. 抽牌 — 使用预抽好的牌，或重新抽
  const tarot: TarotResult = cards
    ? { spread, question, cards, meanings: formatMeanings(cards) }
    : drawCards(spread, question);

  // 2. RAG 检索（基于牌面 + 用户问题）
  let ragSources = undefined;
  if (with_rag) {
    onStage?.({ stage: 'rag', message: '🔍 正在检索塔罗经典知识库…' });
    const ragQuery = buildRagQuery(question, tarot.cards);
    ragSources = await searchRag(ragQuery, 5, ['塔罗入门']);
  }

  // 3. LLM 解读
  let llmInterpretation: string | undefined;
  if (with_llm) {
    onStage?.({ stage: 'llm', message: '🤖 塔罗师正在结合牌面为您撰写解读…' });
    const knowledge = await loadKnowledge();
    const { system, user } = buildTarotPrompt(tarot, ragSources ?? [], knowledge);
    llmInterpretation = await callDeepSeek(
      [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      { kind: 'tarot', temperature: 0.7, maxTokens: 3000 },
    );
  }

  onStage?.({ stage: 'done', message: '✓ 解读完成' });

  return {
    tarot,
    llm_interpretation: llmInterpretation,
    rag_sources: ragSources,
  };
}
