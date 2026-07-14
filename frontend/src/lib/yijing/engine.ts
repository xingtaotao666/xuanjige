// 易经起卦解卦引擎（纯前端化）
//
// 移植自后端 app/services/yijing/engine.py，并修正了后端「变卦」位序 bug：
// 后端将变卦二进制按 [初..上] 顺序拼接，与数据文件中 shang+xia 的约定不一致，
// 会导致变卦识别错误。此处统一采用「上卦(四五六爻) + 下卦(初二三爻)」约定，
// 本卦 / 变卦 / 错卦 / 综卦 均按经典易理正确计算。

import { HEXAGRAMS, GUA_SCENES, getHexagramByBinary, type Hexagram } from './data';
import { getGuaci, getYaoci } from './guaci';
import type { GuaData, GuaResult, GuaScene, GuaYao } from '@/types/yijing';

const POSITION_NAMES = ['初', '二', '三', '四', '五', '上'];

// 数字起卦法中的数字 -> 八卦名称映射（先天八卦数）
const NUM_TO_TRIGRAM: Record<number, string> = {
  1: '乾', 2: '兑', 3: '离', 4: '震', 5: '巽', 6: '坎', 7: '艮', 0: '坤',
};

// 把一组 6 爻值转成「上卦(四五六爻) + 下卦(初二三爻)」的二进制串
// yaoValues: [初, 二, 三, 四, 五, 上]，值范围 6|7|8|9
function toBinary(yaoValues: number[], map: (v: number) => '0' | '1'): string {
  const bits = yaoValues.map(map);
  const shang = bits[3] + bits[4] + bits[5]; // 四、五、上
  const xia = bits[0] + bits[1] + bits[2]; // 初、二、三
  return shang + xia;
}

const isYang = (v: number) => v === 7 || v === 9; // 少阳 / 老阳 为阳
const yangBit = (v: number): '0' | '1' => (isYang(v) ? '1' : '0');

// 变卦：老阴(6)变阳、老阳(9)变阴；少阳(7)/少阴(8) 不变
const bianBit = (v: number): '0' | '1' => (v === 6 || v === 7 ? '1' : '0');
// 错卦：全部阴阳取反
const cuoBit = (v: number): '0' | '1' => (isYang(v) ? '0' : '1');

/** 把 Hexagram 数据转换为前端 GuaData（附带卦辞）。 */
function toGuaData(hex: Hexagram | undefined): GuaData | null {
  if (!hex) return null;
  return {
    name: hex.name,
    xuhao: hex.xuhao,
    shang_gua: hex.shang_gua,
    xia_gua: hex.xia_gua,
    binary: hex.binary,
    description: hex.description,
    gua_ci: getGuaci(hex.name),
  };
}

/**
 * 完整卦象分析。
 * @param yaoValues 6 个爻值 [初, 二, 三, 四, 五, 上]，范围 6|7|8|9
 * @param question  用户问题（可选）
 */
export function analyzeGua(yaoValues: number[], question?: string): GuaResult {
  if (!yaoValues || yaoValues.length !== 6) {
    throw new Error('需要 6 个爻值');
  }

  // 1. 本卦
  const primaryBinary = toBinary(yaoValues, yangBit);
  const primaryHex = getHexagramByBinary(primaryBinary);
  if (!primaryHex) throw new Error(`无法识别卦象: binary=${primaryBinary}`);
  const primaryGua = toGuaData(primaryHex)!;

  // 2. 六爻
  const allYao: GuaYao[] = [];
  const changingLines: GuaYao[] = [];
  for (let i = 0; i < 6; i++) {
    const v = yaoValues[i];
    const yinyang = isYang(v) ? '阳' : '阴';
    const isChanging = v === 6 || v === 9;
    const prefix = isYang(v) ? '九' : '六';
    const key = `${POSITION_NAMES[i]}${prefix}`;
    const yao: GuaYao = {
      position: i,
      position_name: POSITION_NAMES[i],
      value: v,
      yin_yang: yinyang,
      is_changing: isChanging,
      text: getYaoci(primaryGua.name, key),
      changing_to: v === 6 ? '阳' : v === 9 ? '阴' : null,
    };
    allYao.push(yao);
    if (isChanging) changingLines.push(yao);
  }

  // 3. 变卦（仅当有动爻）
  let bianGua: GuaData | null = null;
  if (changingLines.length > 0) {
    const bianBinary = toBinary(yaoValues, bianBit);
    bianGua = toGuaData(getHexagramByBinary(bianBinary));
  }

  // 4. 错卦（六爻全反）
  const cuoGua = toGuaData(getHexagramByBinary(toBinary(yaoValues, cuoBit)));

  // 5. 综卦（卦象上下颠倒）
  // 综卦二进制 = [初,二,三][四,五,上]（将 lines 整体反转后取 shang+xia 约定）
  const zongBinary =
    `${yangBit(yaoValues[2])}${yangBit(yaoValues[1])}${yangBit(yaoValues[0])}` +
    `${yangBit(yaoValues[5])}${yangBit(yaoValues[4])}${yangBit(yaoValues[3])}`;
  const zongGua = toGuaData(getHexagramByBinary(zongBinary));

  // 6. 卦意解读（优先卦辞，其次描述）
  const guaMeaning = primaryGua.gua_ci || primaryGua.description || '';

  // 7. 现代场景（本卦 + 变卦补充）
  const modernScenes: GuaScene[] = findScenes(primaryGua.name);
  if (bianGua && bianGua.name !== primaryGua.name) {
    const bianScenes = findScenes(bianGua.name);
    if (bianScenes.length > 0) {
      modernScenes.push({
        ...bianScenes[0],
        type: '变卦参考',
      } as GuaScene);
    }
  }

  return {
    primary_gua: primaryGua,
    all_yao: allYao,
    changing_lines: changingLines,
    bian_gua: bianGua,
    cuo_gua: cuoGua,
    zong_gua: zongGua,
    gua_meaning: guaMeaning,
    modern_scenes: modernScenes,
    question: question && question.trim() ? question : '未提供具体问题',
  };
}

function findScenes(guaName: string): GuaScene[] {
  const entry = GUA_SCENES.find((s) => s.gua_name === guaName);
  return entry ? [{ ...entry }] : [];
}

/**
 * 随机起卦：模拟三枚铜钱摇卦法。
 * 每枚铜钱字面=2(阴) / 背面=3(阳)，三枚之和即爻值，范围 6~9。
 */
export function divinateByRandom(): number[] {
  const lines: number[] = [];
  for (let i = 0; i < 6; i++) {
    let total = 0;
    for (let c = 0; c < 3; c++) total += Math.random() < 0.5 ? 2 : 3;
    lines.push(total);
  }
  return lines;
}

/**
 * 数字起卦（梅花易数法）：num1->上卦，num2->下卦，num3->动爻位置。
 */
export function divinateByNumbers(num1: number, num2: number, num3: number): number[] {
  const shangNum = ((num1 % 8) + 8) % 8;
  const xiaNum = ((num2 % 8) + 8) % 8;
  const changingPos = (((num3 - 1) % 6) + 6) % 6;

  const shangName = NUM_TO_TRIGRAM[shangNum];
  const xiaName = NUM_TO_TRIGRAM[xiaNum];
  if (!shangName || !xiaName) throw new Error(`无效的卦数: shang=${shangNum}, xia=${xiaNum}`);

  const shangHex = HEXAGRAMS.find((h) => h.name === shangName);
  const xiaHex = HEXAGRAMS.find((h) => h.name === xiaName);
  const shangBinary = shangHex ? shangHex.binary.slice(0, 3) : '000';
  const xiaBinary = xiaHex ? xiaHex.binary.slice(0, 3) : '000';

  // 组合成六爻：上卦(高3位) + 下卦(低3位)
  const fullBinary = shangBinary + xiaBinary;
  const lines: number[] = [];
  for (let i = 0; i < 6; i++) {
    const bit = fullBinary[i];
    if (bit === '1') lines.push(i !== changingPos ? 7 : 9);
    else lines.push(i !== changingPos ? 8 : 6);
  }
  return lines;
}
