// 玄机阁 前端服务层（纯前端化 · 零后端）
//
// 原 axios 后端调用已全部改写为浏览器内本地引擎 + DeepSeek 直连。
// 导出的函数签名与原后端版本保持一致，因此 hooks（useBazi / useYijing）
// 无需任何改动即可平滑切换到纯前端模式。

import type { BaziAnalyzeResponse } from '../types/bazi';
import type { DivinateResponse, GuaData } from '../types/yijing';
import type { ConsultResponse } from '../types/consult';
import type { TarotAnalyzeResponse, TarotRequest } from '../types/tarot';

import { baziAnalyze, baziBasic } from '@/lib/services/baziService';
import { yijingDivinate } from '@/lib/services/yijingService';
import { tarotDivinate } from '@/lib/services/tarotService';
import { getHexagramByXuhao } from '@/lib/yijing/data';
import { getGuaci } from '@/lib/yijing/guaci';

// --- BaZi ---

export interface BasicBaziRequest {
  birth_year: number;
  birth_month: number;
  birth_day: number;
  birth_hour: number;
  gender: 'male' | 'female';
  calendar?: 'lunar' | 'solar';
}

export interface AnalyzeBaziRequest extends BasicBaziRequest {
  with_llm?: boolean;
  with_rag?: boolean;
  question?: string;
}

export const analyzeBazi = (data: AnalyzeBaziRequest): Promise<BaziAnalyzeResponse> =>
  baziAnalyze(data);

export const basicBazi = (data: BasicBaziRequest): Promise<BaziAnalyzeResponse> =>
  baziBasic(data);

// --- YiJing ---

export interface DivinateRequest {
  question: string;
  method?: 'coins' | 'numbers' | 'random';
  num1?: number;
  num2?: number;
  num3?: number;
  /** 铜钱投掷法：前端投掷三枚铜钱生成的 6 个爻值 [初,二,三,四,五,上] */
  yao_values?: number[];
  with_llm?: boolean;
  with_rag?: boolean;
}

export const divinate = (data: DivinateRequest): Promise<DivinateResponse> =>
  yijingDivinate(data);

/** 按卦序取单个卦象（用于占卜历史回看），返回 GuaData（不含爻辞详情）。 */
export const getHexagram = async (sequence: number): Promise<GuaData> => {
  const hex = getHexagramByXuhao(sequence);
  if (!hex) throw new Error(`未找到第 ${sequence} 卦`);
  return {
    name: hex.name,
    xuhao: hex.xuhao,
    shang_gua: hex.shang_gua,
    xia_gua: hex.xia_gua,
    binary: hex.binary,
    description: hex.description,
    gua_ci: getGuaci(hex.name),
  };
};

// --- Tarot ---

export const analyzeTarot = (data: TarotRequest): Promise<TarotAnalyzeResponse> =>
  tarotDivinate(data);

// --- Consult（纯前端模式已下线，保留签名避免导入报错） ---

export interface ConsultRequest {
  question: string;
  topic?: string;
}

export const consult = async (_data: ConsultRequest): Promise<ConsultResponse> => {
  throw new Error('纯前端模式下暂不支持在线咨询，请使用「八字排盘」或「易经占卜」。');
};

// --- Knowledge（纯前端模式已由本地引擎直接加载，无需后端接口） ---

export interface StructuredKnowledge {
  categories: Record<string, unknown>;
  topics: string[];
}

export const getKnowledgeStructured = async (): Promise<StructuredKnowledge> => ({
  categories: {},
  topics: [],
});

export interface CorpusEntry {
  id: string;
  title: string;
  content: string;
  source: string;
}

export const getKnowledgeCorpus = async (): Promise<CorpusEntry[]> => [];

export interface KnowledgeMapping {
  [key: string]: string[];
}

export const getKnowledgeMappings = async (): Promise<KnowledgeMapping> => ({});

export default {} as Record<string, never>;
