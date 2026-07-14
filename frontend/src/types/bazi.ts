export interface Pillar {
  heavenly_stem: string;
  earthly_branch: string;
  stem_wuxing: string;
  branch_wuxing: string;
  stem_yinyang: string;
  branch_yinyang: string;
  canggan: string[];
  nayin?: string;
}

export interface ShiShenItem {
  gan: string;
  shishen: string;
  modern_roles?: string[];
}

export interface WuXingAnalysis {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
  summary: string;
  health_advice?: {
    body_parts: string[];
    color_advice: string;
    direction: string;
    description?: string;
  }[];
}

export interface ShenSha {
  name: string;
  tags: string[];
  description?: string;
  position: string;
}

export interface DaYunPeriod {
  age_start: number;
  age_end: number;
  gan: string;
  zhi: string;
  shishen: string;
}

export interface BaziResult {
  year_pillar: Pillar;
  month_pillar: Pillar;
  day_pillar: Pillar;
  hour_pillar: Pillar;
  shishen: ShiShenItem[];
  wuxing: WuXingAnalysis;
  shensha: ShenSha[];
  dayun?: DaYunPeriod[];
}

export interface BaziAnalyzeResponse {
  bazi: BaziResult;
  llm_interpretation?: string;
  rag_sources?: RagSource[];
}

export interface RagSource {
  book: string;
  text: string;
  score: number;
}
