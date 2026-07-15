/**
 * 塔罗引擎——洗牌、抽牌、牌阵
 */
import type {
  TarotCardPlacement,
  TarotResult,
  CardOrientation,
  SpreadType,
} from '@/types/tarot';
import { ALL_TAROT_CARDS, SPREAD_POSITIONS } from './cards';

/** Fisher-Yates 洗牌 */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 随机决定正逆位 */
function randomOrientation(): CardOrientation {
  return Math.random() < 0.5 ? 'upright' : 'reversed';
}

/** 格式化多张牌的简义文本（供 LLM prompt 使用） */
function formatMeanings(cards: TarotCardPlacement[]): string {
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

/**
 * 从整副牌中抽取 N 张，分配到指定牌阵各位置
 */
export function drawCards(
  spread: SpreadType,
  question: string,
): TarotResult {
  const positions = SPREAD_POSITIONS[spread] || ['当前指引'];
  const count = positions.length;

  // 洗牌后取前 count 张
  const shuffled = shuffle(ALL_TAROT_CARDS);

  const cards: TarotCardPlacement[] = shuffled.slice(0, count).map((card, i) => ({
    position: positions[i],
    card,
    orientation: randomOrientation(),
  }));

  const meanings = formatMeanings(cards);

  return {
    spread,
    question,
    cards,
    meanings,
  };
}

/** 获取支持的牌阵列表 */
export function getSpreadInfo(): { type: SpreadType; label: string; cardCount: number; description: string }[] {
  return [
    { type: 'single', label: '单张牌', cardCount: 1, description: '快速指引 · 一针见血' },
    { type: 'three', label: '三张牌', cardCount: 3, description: '过去 · 现在 · 未来' },
    { type: 'cross', label: '六芒星', cardCount: 6, description: '全面剖析 · 深入洞察' },
    { type: 'celtic', label: '凯尔特十字', cardCount: 10, description: '终极详占 · 无所不包' },
  ];
}
