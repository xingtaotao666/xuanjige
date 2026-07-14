import type { RagSource } from './consult'

export interface GuaYao {
  position: number;
  position_name: string;
  value: number; // 6(老阴/变) 7(少阳) 8(少阴) 9(老阳/变)
  yin_yang: string; // "阴" | "阳"
  is_changing: boolean;
  text: string;
  changing_to?: string | null;
}

export interface GuaData {
  name: string;
  xuhao: number;
  shang_gua: string;
  xia_gua: string;
  binary: string;
  description?: string;
  gua_ci?: string;
}

export interface GuaScene {
  gua_name?: string;
  gua_symbol?: string;
  description?: string;
  scenes?: string[];
  type?: string;
}

export interface GuaResult {
  primary_gua: GuaData;
  changing_lines: GuaYao[];
  bian_gua: GuaData | null;
  cuo_gua: GuaData | null;
  zong_gua: GuaData | null;
  all_yao: GuaYao[];
  gua_meaning: string;
  modern_scenes: GuaScene[];
  question: string;
}

export interface DivinateResponse {
  gua: GuaResult;
  llm_interpretation?: string;
  rag_sources?: RagSource[];
}

/** 单次投掷三枚铜钱的结果：null=未投, 0=字面(阴), 1=背面(阳) */
export type CoinFace = 0 | 1 | null;
