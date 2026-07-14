// 八字排盘引擎（纯前端化）
//
// 移植自后端 app/services/bazi/{engine,shishen,wuxing,shensha,dayun}.py，
// 在浏览器中直接计算四柱八字、十神、五行、神煞、大运，输出与前端
// BaziResult 类型完全对齐的结果。知识库通过 loadKnowledge() 异步加载。
//
// 约定（与后端一致）：
//   - 年柱以立春为界，立春前用上一年
//   - 月柱以节气「节」边界定太阳月，五虎遁起正月天干
//   - 日柱以 1900-01-01=甲子 为参考点做天数取模
//   - 时柱以五鼠遁起子时天干
//   - 大运从月柱起，阳男阴女顺排、阴男阳女逆排，起运年龄 = 距最近「节」天数 / 3
//
// 修复点：后端 shensha 的「空亡」依赖数据中并不存在的「旬空_map」字段，
// 导致空亡永远查不到。此处改为按日干支所在的「旬」直接定位空亡地支。

import { loadKnowledge, type Knowledge } from '@/lib/knowledge';
import type {
  BaziResult,
  Pillar,
  ShiShenItem,
  WuXingAnalysis,
  ShenSha,
  DaYunPeriod,
} from '@/types/bazi';

const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const WU_XING = ['木', '火', '土', '金', '水'];

// 五虎遁：年干 -> 正月(寅月)天干索引
const WU_HU_DUN: Record<string, number> = {
  甲: 2, 乙: 4, 丙: 6, 丁: 8, 戊: 0, 己: 2, 庚: 4, 辛: 6, 壬: 8, 癸: 0,
};
// 五鼠遁：日干 -> 子时天干索引
const WU_SHU_DUN: Record<string, number> = {
  甲: 0, 乙: 2, 丙: 4, 丁: 6, 戊: 8, 己: 0, 庚: 2, 辛: 4, 壬: 6, 癸: 8,
};
const YANG_GAN = ['甲', '丙', '戊', '庚', '壬'];

// 五行评分权重
const WEIGHT_STEM = 1.0;
const WEIGHT_BRANCH = 0.5;
const WEIGHT_BRANCH_MID = 0.3;
const WEIGHT_BRANCH_TAIL = 0.1;
const WEIGHT_DAY_STEM_MULTIPLIER = 2.0;
const WEIGHT_MONTH_BRANCH_MULTIPLIER = 1.5;

export interface BaziInput {
  birth_year: number;
  birth_month: number;
  birth_day: number;
  birth_hour: number;
  birth_minute?: number;
  gender: 'male' | 'female';
}

interface BaziCore {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar;
  stemIdx: [number, number, number, number]; // 年/月/日/时 天干索引
  branchIdx: [number, number, number, number]; // 年/月/日/时 地支索引
  dayStem: string;
  dayStemWuxing: string;
  yearStem: string;
  monthStem: string;
  monthBranch: string;
  dayBranch: string;
  yearBranch: string;
  dayCycleIdx: number;
  gender: '男' | '女';
  currentJieqi: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
}

// 安全取模
const pmod = (n: number, m: number): number => ((n % m) + m) % m;

// 以 UTC 计算与参考日(1900-01-01)相差天数，避免时区/DST 干扰
function daysFromRef(y: number, m: number, d: number): number {
  const ref = Date.UTC(1900, 0, 1);
  const cur = Date.UTC(y, m - 1, d);
  return Math.round((cur - ref) / 86400000);
}

function getWuxing(ganOrZhi: string, k: Knowledge): string {
  const data = k.tiangandizhi ?? {};
  const tg = data.tiangan ?? {};
  if (ganOrZhi in tg) return tg[ganOrZhi]?.wuxing ?? '';
  const dz = data.dizhi ?? {};
  if (ganOrZhi in dz) return dz[ganOrZhi]?.wuxing ?? '';
  return '';
}

function getYinyang(ganOrZhi: string, k: Knowledge): string {
  const data = k.tiangandizhi ?? {};
  const tg = data.tiangan ?? {};
  if (ganOrZhi in tg) return tg[ganOrZhi]?.yinyang ?? '';
  const dz = data.dizhi ?? {};
  if (ganOrZhi in dz) return dz[ganOrZhi]?.yinyang ?? '';
  return '';
}

function getCangganList(branch: string, k: Knowledge): string[] {
  const dz = k.tiangandizhi?.dizhi ?? {};
  if (branch in dz && Array.isArray(dz[branch]?.canggan)) {
    return dz[branch].canggan as string[];
  }
  const cg = k.dizhi_canggan?.dizhi_canggan ?? {};
  if (branch in cg && Array.isArray(cg[branch]?.list)) {
    return cg[branch].list as string[];
  }
  return [];
}

// 返回 [权重, 类型描述]
function getHiddenStemWeight(branch: string, stem: string, k: Knowledge): [number, string] {
  const cg = k.dizhi_canggan?.dizhi_canggan ?? {};
  const info = cg[branch];
  if (!info) return [WEIGHT_BRANCH, '本气'];
  if (stem === info.benqi) return [WEIGHT_BRANCH, '本气'];
  if (stem === info.zhongqi) return [WEIGHT_BRANCH_MID, '中气'];
  if (stem === info.yuqi) return [WEIGHT_BRANCH_TAIL, '余气'];
  const list: string[] = info.list ?? [];
  if (list.length === 1) return [WEIGHT_BRANCH, '本气'];
  const idx = list.indexOf(stem);
  if (idx === 1 && list.length === 2) return [WEIGHT_BRANCH_MID, '中气'];
  const weights = [WEIGHT_BRANCH, WEIGHT_BRANCH_MID, WEIGHT_BRANCH_TAIL];
  const types = ['本气', '中气', '余气'];
  if (idx >= 0 && idx < weights.length) return [weights[idx], types[idx]];
  return [WEIGHT_BRANCH, '本气'];
}

function getNayin(stemIdx: number, branchIdx: number, k: Knowledge): [string | null, string | null] {
  const ganzhi = `${TIAN_GAN[stemIdx]}${DI_ZHI[branchIdx]}`;
  const jiazi = k.liushi_jiazi?.jiazi ?? [];
  for (const item of jiazi) {
    if (item.ganzhi === ganzhi) return [item.nayin ?? null, item.wuxing ?? null];
  }
  return [null, null];
}

function buildPillar(stemIdx: number, branchIdx: number, k: Knowledge): Pillar {
  const stem = TIAN_GAN[stemIdx];
  const branch = DI_ZHI[branchIdx];
  const [nayin] = getNayin(stemIdx, branchIdx, k);
  return {
    heavenly_stem: stem,
    earthly_branch: branch,
    stem_wuxing: getWuxing(stem, k),
    branch_wuxing: getWuxing(branch, k),
    stem_yinyang: getYinyang(stem, k),
    branch_yinyang: getYinyang(branch, k),
    canggan: getCangganList(branch, k),
    nayin: nayin ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// 节气辅助
// ---------------------------------------------------------------------------

interface JieqiBoundary {
  name: string;
  bm: number; // 用于排序的月份 (1月 -> 13)
  bd: number;
}

function getJieqiBoundaries(k: Knowledge): JieqiBoundary[] {
  const all = k.jieqi?.all_jieqi ?? [];
  const boundaries: JieqiBoundary[] = [];
  for (const j of all) {
    if (j.jieqi_type !== '节') continue;
    const [mStr, dStr] = String(j.gongli_start).split('-');
    let m = parseInt(mStr, 10);
    const d = parseInt(dStr, 10);
    if (m === 1) m += 12; // 跨年：1月视为第13月
    boundaries.push({ name: j.name, bm: m, bd: d });
  }
  boundaries.sort((a, b) => (a.bm - b.bm) || (a.bd - b.bd));
  return boundaries;
}

function liChunDay(k: Knowledge): number {
  const all = k.jieqi?.all_jieqi ?? [];
  for (const j of all) {
    if (j.name === '立春') {
      const [, dStr] = String(j.gongli_start).split('-');
      return parseInt(dStr, 10);
    }
  }
  return 4;
}

function getLiChunAdjustedYear(year: number, month: number, day: number, k: Knowledge): number {
  const lc = liChunDay(k);
  if (month === 1 || (month === 2 && day < lc)) return year - 1;
  return year;
}

// 返回太阳月序号：0=寅月, 1=卯月, ..., 11=丑月
function determineSolarMonth(month: number, day: number, boundaries: JieqiBoundary[]): number {
  const sortMonth = month > 1 ? month : month + 12;
  for (let i = 0; i < boundaries.length; i++) {
    const b = boundaries[i];
    if (sortMonth < b.bm || (sortMonth === b.bm && day < b.bd)) {
      return pmod(i - 1, boundaries.length);
    }
  }
  return boundaries.length - 1;
}

function getCurrentJieqiName(month: number, day: number, k: Knowledge): string {
  const all = k.jieqi?.all_jieqi ?? [];
  for (const j of all) {
    const [smStr, sdStr] = String(j.gongli_start).split('-');
    const [emStr, edStr] = String(j.gongli_end).split('-');
    const sm = parseInt(smStr, 10);
    const sd = parseInt(sdStr, 10);
    const em = parseInt(emStr, 10);
    const ed = parseInt(edStr, 10);
    if (sm === em) {
      if (month === sm && sd <= day && day <= ed) return j.name;
    } else {
      if ((month === sm && day >= sd) || (month === em && day <= ed)) return j.name;
    }
  }
  return '';
}

// ---------------------------------------------------------------------------
// 大运辅助：找最近「节」气
// ---------------------------------------------------------------------------

function findJieqiDirection(
  bY: number,
  bM: number,
  bD: number,
  boundaries: JieqiBoundary[],
  forward: boolean,
): { days: number } {
  const dates: { t: number; name: string }[] = [];
  for (const b of boundaries) {
    const realMonth = b.bm > 12 ? b.bm - 12 : b.bm;
    const tryYears = [bY, bY + 1];
    for (const yr of tryYears) {
      const t = Date.UTC(yr, realMonth - 1, b.bd);
      dates.push({ t, name: b.name });
    }
  }
  dates.sort((a, b2) => a.t - b2.t);
  const birthT = Date.UTC(bY, bM - 1, bD);
  if (forward) {
    for (const d of dates) {
      if (d.t > birthT) return { days: Math.max(1, Math.round((d.t - birthT) / 86400000)) };
    }
    return { days: 1 };
  } else {
    let found: { t: number } | null = null;
    for (const d of dates) {
      if (d.t < birthT) found = d; else break;
    }
    if (found) return { days: Math.max(1, Math.round((birthT - found.t) / 86400000)) };
    return { days: 1 };
  }
}

// ---------------------------------------------------------------------------
// 主计算：构建四柱核心
// ---------------------------------------------------------------------------

async function buildCore(input: BaziInput): Promise<BaziCore> {
  const k = await loadKnowledge();
  const gender = input.gender === 'male' ? '男' : '女';

  // 年柱
  const baziYear = getLiChunAdjustedYear(input.birth_year, input.birth_month, input.birth_day, k);
  const ysIdx = pmod(baziYear - 4, 10);
  const ybIdx = pmod(baziYear - 4, 12);
  const yearPillar = buildPillar(ysIdx, ybIdx, k);

  // 月柱
  const boundaries = getJieqiBoundaries(k);
  const solarMonthOrder = determineSolarMonth(input.birth_month, input.birth_day, boundaries);
  const yearStem = TIAN_GAN[ysIdx];
  const yinStemIdx = WU_HU_DUN[yearStem] ?? 0;
  const msIdx = pmod(yinStemIdx + solarMonthOrder, 10);
  const mbIdx = pmod(solarMonthOrder + 2, 12); // 寅=index2
  const monthPillar = buildPillar(msIdx, mbIdx, k);

  // 日柱
  const days = daysFromRef(input.birth_year, input.birth_month, input.birth_day);
  const dayCycleIdx = pmod(days, 60);
  const dsIdx = pmod(dayCycleIdx, 10);
  const dbIdx = pmod(dayCycleIdx, 12);
  const dayPillar = buildPillar(dsIdx, dbIdx, k);

  // 时柱
  const hour = input.birth_hour;
  let hbIdx: number;
  if (hour === 23 || hour === 0) hbIdx = 0; // 子
  else hbIdx = pmod(Math.floor((hour + 1) / 2), 12);
  const dayStem = TIAN_GAN[dsIdx];
  const ziStemIdx = WU_SHU_DUN[dayStem] ?? 0;
  const hsIdx = pmod(ziStemIdx + hbIdx, 10);
  const hourPillar = buildPillar(hsIdx, hbIdx, k);

  return {
    year: yearPillar,
    month: monthPillar,
    day: dayPillar,
    hour: hourPillar,
    stemIdx: [ysIdx, msIdx, dsIdx, hsIdx],
    branchIdx: [ybIdx, mbIdx, dbIdx, hbIdx],
    dayStem,
    dayStemWuxing: getWuxing(dayStem, k),
    yearStem,
    monthStem: TIAN_GAN[msIdx],
    monthBranch: DI_ZHI[mbIdx],
    dayBranch: DI_ZHI[dbIdx],
    yearBranch: DI_ZHI[ybIdx],
    dayCycleIdx,
    gender,
    currentJieqi: getCurrentJieqiName(input.birth_month, input.birth_day, k),
    birthYear: input.birth_year,
    birthMonth: input.birth_month,
    birthDay: input.birth_day,
  };
}

// ---------------------------------------------------------------------------
// 十神
// ---------------------------------------------------------------------------

function calcShishen(core: BaziCore, k: Knowledge): ShiShenItem[] {
  const dayStemLookup = k.shishen_rules?.day_stem_lookup ?? {};
  const modernMappings = k.shishen_modern?.mappings ?? [];
  const modernMap: Record<string, string[]> = {};
  for (const m of modernMappings) {
    if (m.shen) modernMap[m.shen] = m.modern_roles ?? [];
  }
  const lookup = dayStemLookup[core.dayStem] ?? {};
  const pillars = [core.year, core.month, core.day, core.hour];
  const result: ShiShenItem[] = [];
  for (let i = 0; i < 4; i++) {
    const stem = pillars[i].heavenly_stem;
    let name = '';
    if (i === 2) name = '比肩'; // 日干本身
    else name = lookup[stem] ?? '';
    result.push({ gan: stem, shishen: name, modern_roles: modernMap[name] ?? [] });
  }
  return result;
}

// ---------------------------------------------------------------------------
// 五行评分
// ---------------------------------------------------------------------------

interface WxScore {
  score: number;
  status: string;
}

function wxStatus(score: number): string {
  if (score >= 4.0) return '旺';
  if (score >= 2.5) return '偏旺';
  if (score >= 1.5) return '中和';
  if (score >= 0.5) return '偏弱';
  return '弱';
}

function calcWuxing(core: BaziCore, k: Knowledge): WuXingAnalysis {
  const scores: Record<string, WxScore> = {};
  for (const wx of WU_XING) scores[wx] = { score: 0, status: '弱' };

  const pillars = [core.year, core.month, core.day, core.hour];
  // 天干
  for (let i = 0; i < 4; i++) {
    const stem = pillars[i].heavenly_stem;
    const wx = getWuxing(stem, k);
    if (!wx || !(wx in scores)) continue;
    let w = WEIGHT_STEM;
    if (i === 2) w *= WEIGHT_DAY_STEM_MULTIPLIER; // 日干加倍
    scores[wx].score += w;
  }
  // 地支藏干
  for (let i = 0; i < 4; i++) {
    const branch = pillars[i].earthly_branch;
    const hidden = pillars[i].canggan;
    if (!hidden || hidden.length === 0) {
      const wx = getWuxing(branch, k);
      if (wx && wx in scores) {
        let w = WEIGHT_BRANCH;
        if (i === 1) w *= WEIGHT_MONTH_BRANCH_MULTIPLIER; // 月支加倍
        scores[wx].score += w;
      }
      continue;
    }
    for (const hs of hidden) {
      const wx = getWuxing(hs, k);
      if (!wx || !(wx in scores)) continue;
      const [w] = getHiddenStemWeight(branch, hs, k);
      let weight = w;
      if (i === 1) weight *= WEIGHT_MONTH_BRANCH_MULTIPLIER; // 月支加倍
      scores[wx].score += weight;
    }
  }

  for (const wx of WU_XING) scores[wx].status = wxStatus(scores[wx].score);

  const summary = WU_XING.map((wx) => `${wx}${scores[wx].status}`).join('、');

  // 健康建议
  const healthMappings = k.wuxing_health?.mappings ?? [];
  const healthAdvice: WuXingAnalysis['health_advice'] = [];
  for (const m of healthMappings) {
    const wx = m.wuxing;
    const state = m.state;
    if (!(wx in scores)) continue;
    const st = scores[wx].status;
    let matched = false;
    if (state === '旺' && (st === '旺' || st === '偏旺')) matched = true;
    else if (state === '弱' && (st === '弱' || st === '偏弱')) matched = true;
    if (matched) {
      healthAdvice.push({
        body_parts: m.body_parts ?? [],
        color_advice: m.color_advice ?? '',
        direction: m.direction ?? '',
        description: m.description ?? '',
      });
    }
  }

  return {
    wood: round2(scores['木'].score),
    fire: round2(scores['火'].score),
    earth: round2(scores['土'].score),
    metal: round2(scores['金'].score),
    water: round2(scores['水'].score),
    summary,
    health_advice: healthAdvice,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ---------------------------------------------------------------------------
// 神煞
// ---------------------------------------------------------------------------

function calcShensha(core: BaziCore, k: Knowledge): ShenSha[] {
  const rulesList = k.shensha_rules?.shensha_list ?? [];
  const events = k.shensha_events?.mappings ?? [];
  const eventMap: Record<string, { tags: string[]; description: string }> = {};
  for (const e of events) {
    if (e.shensha) eventMap[e.shensha] = { tags: e.tags ?? [], description: e.description ?? '' };
  }

  const dayStem = core.dayStem;
  const yearStem = core.yearStem;
  const dayBranch = core.dayBranch;
  const yearBranch = core.yearBranch;
  const branches = [core.year.earthly_branch, core.month.earthly_branch, core.day.earthly_branch, core.hour.earthly_branch];
  const pillarNames = ['年柱', '月柱', '日柱', '时柱'];

  const out: ShenSha[] = [];
  const seen = new Set<string>();

  for (const rule of rulesList) {
    const name = rule.name;
    const lookupType = rule.lookup_type;
    const rules = rule.rules ?? {};
    const results: Array<[string, number]> = []; // [branch, pillarIndex]

    if (lookupType === '日干') {
      const targets = rules[dayStem];
      hitFromList(targets, branches, results);
    } else if (lookupType === '年干') {
      const targets = rules[yearStem];
      hitFromList(targets, branches, results);
    } else if (lookupType === '日干或年干') {
      for (const key of Object.keys(rules)) {
        if (key.includes(dayStem) || key.includes(yearStem)) {
          hitFromList(rules[key], branches, results);
        }
      }
    } else if (lookupType === '日支或年支') {
      let keyUsed: string | null = null;
      for (const key of Object.keys(rules)) {
        if (key.includes(dayBranch) || key.includes(yearBranch)) {
          keyUsed = key;
          break;
        }
      }
      if (keyUsed) hitFromList(rules[keyUsed], branches, results);
    } else if (lookupType === '日柱') {
      if (name === '空亡') {
        const xunStart = Math.floor(core.dayCycleIdx / 10) * 10;
        const xunGanzhi = `${TIAN_GAN[pmod(xunStart, 10)]}${DI_ZHI[pmod(xunStart, 12)]}`;
        const xunName = `${xunGanzhi}旬`;
        const kong = (rules[xunName] as string[]) ?? [];
        for (const kb of kong) {
          for (let i = 0; i < branches.length; i++) {
            if (branches[i] === kb) results.push([kb, i]);
          }
        }
      }
    } else if (lookupType === '月份') {
      const mb = core.monthBranch;
      for (const key of Object.keys(rules)) {
        const target = rules[key];
        if (mb === key) {
          hitFromList(target, branches, results);
          break;
        }
        if (key.includes(mb)) {
          // 月德贵人：返回天干，找对应天干所在柱
          const tStem = Array.isArray(target) ? target[0] : target;
          for (let i = 0; i < core.stemIdx.length; i++) {
            if (TIAN_GAN[core.stemIdx[i]] === tStem) {
              results.push([core.branchIdx[i] !== undefined ? branches[i] : branches[i], i]);
            }
          }
          break;
        }
      }
    }

    if (results.length === 0) continue;
    if (seen.has(name)) continue;
    seen.add(name);

    const detailPillars = Array.from(new Set(results.map((r) => pillarNames[r[1]])));
    const ev = eventMap[name] ?? { tags: [], description: '' };
    out.push({
      name,
      tags: ev.tags,
      description: ev.description || rule.description || '',
      position: detailPillars.join('、'),
    });
  }

  return out;
}

function hitFromList(targets: unknown, branches: string[], results: Array<[string, number]>): void {
  if (!targets) return;
  const arr = Array.isArray(targets) ? targets : [targets];
  for (const t of arr) {
    for (let i = 0; i < branches.length; i++) {
      if (branches[i] === t) results.push([t, i]);
    }
  }
}

// ---------------------------------------------------------------------------
// 大运
// ---------------------------------------------------------------------------

function calcDayun(core: BaziCore, k: Knowledge): DaYunPeriod[] {
  const yearStem = core.yearStem;
  const isYang = YANG_GAN.includes(yearStem);
  const forward = (isYang && core.gender === '男') || (!isYang && core.gender === '女');

  const boundaries = getJieqiBoundaries(k);
  const { days } = findJieqiDirection(
    core.birthYear,
    core.birthMonth,
    core.birthDay,
    boundaries,
    forward,
  );
  const qiYunFloat = days / 3.0;
  const qiYunInt = Math.ceil(qiYunFloat);

  const dayStemLookup = k.shishen_rules?.day_stem_lookup ?? {};
  const lookup = dayStemLookup[core.dayStem] ?? {};

  const periods: DaYunPeriod[] = [];
  for (let i = 0; i < 8; i++) {
    const sIdx = pmod(core.stemIdx[1] + (forward ? i : -i), 10);
    const bIdx = pmod(core.branchIdx[1] + (forward ? i : -i), 12);
    const ageStart = qiYunInt + i * 10;
    const ageEnd = ageStart + 9;
    const gan = TIAN_GAN[sIdx];
    const zhi = DI_ZHI[bIdx];
    periods.push({
      age_start: ageStart,
      age_end: ageEnd,
      gan,
      zhi,
      shishen: lookup[gan] ?? '',
    });
  }
  return periods;
}

// ---------------------------------------------------------------------------
// 对外入口
// ---------------------------------------------------------------------------

export async function calculateBazi(input: BaziInput): Promise<BaziResult> {
  const k = await loadKnowledge();
  const core = await buildCore(input);

  const shishen = calcShishen(core, k);
  const wuxing = calcWuxing(core, k);
  const shensha = calcShensha(core, k);
  const dayun = calcDayun(core, k);

  return {
    year_pillar: core.year,
    month_pillar: core.month,
    day_pillar: core.day,
    hour_pillar: core.hour,
    shishen,
    wuxing,
    shensha,
    dayun,
  };
}
