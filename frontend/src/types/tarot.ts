import type { RagSource } from './consult';

/** 塔罗牌组：大阿尔卡纳 / 小阿尔卡纳 */
export type ArcanaType = 'major' | 'minor';

/** 花色（小阿尔卡纳） */
export type TarotSuit = 'wands' | 'cups' | 'swords' | 'pentacles';

/** 牌面位置：正位 / 逆位 */
export type CardOrientation = 'upright' | 'reversed';

/** 单张塔罗牌定义 */
export interface TarotCardDef {
  /** 编号（大牌 0-21，小牌 1-14） */
  number: number;
  /** 中文名称 */
  nameCn: string;
  /** 英文名称 */
  nameEn: string;
  /** 所属组 */
  arcana: ArcanaType;
  /** 花色（仅小牌） */
  suit?: TarotSuit;
  /** 关键词（中文逗号分隔） */
  keywords: string;
  /** 正位核心含义 */
  meaningUpright: string;
  /** 逆位核心含义 */
  meaningReversed: string;
  /** 对应元素 */
  element: string;
  /** 对应星座/行星（大牌） */
  astrology?: string;
  /** 视觉描述 */
  imageDesc: string;
}

/** 牌阵中的一张牌（含位置与朝向） */
export interface TarotCardPlacement {
  /** 牌在牌阵中的位置名称 */
  position: string;
  /** 牌定义 */
  card: TarotCardDef;
  /** 正位/逆位 */
  orientation: CardOrientation;
}

/** 支持的牌阵类型 */
export type SpreadType = 'single' | 'three' | 'cross' | 'celtic';

/** 塔罗计算后的结果 */
export interface TarotResult {
  /** 牌阵类型 */
  spread: SpreadType;
  /** 用户的问题 */
  question: string;
  /** 抽到的牌（含位置信息） */
  cards: TarotCardPlacement[];
  /** 对每张牌的简要解读（引擎生成，供 LLM 参考） */
  meanings: string;
}

/** 塔罗分析请求 */
export interface TarotRequest {
  question: string;
  spread?: SpreadType;
  with_llm?: boolean;
  with_rag?: boolean;
  /** 预抽好的牌（本地选牌后传入，不再重新抽） */
  cards?: TarotCardPlacement[];
}

/** 塔罗分析完整响应 */
export interface TarotAnalyzeResponse {
  tarot: TarotResult;
  llm_interpretation?: string;
  rag_sources?: RagSource[];
}
