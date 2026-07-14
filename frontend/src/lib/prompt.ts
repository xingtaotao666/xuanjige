// 提示词构建器（纯前端化）
//
// 移植自后端 app/services/rag/prompt_builder.py：提供八字 / 易经两套系统提示
// 与上下文格式化函数，使 LLM 拿到完整的排盘信息。buildBaziPrompt 内部先将
// 前端 BaziResult 还原成后端格式上下文（补充纳音、十二长生、藏干十神等），
// 再按后端 _format_bazi_data 的文本排版输出。

import type { BaziResult, Pillar, DaYunPeriod, ShenSha } from '@/types/bazi';
import type { GuaResult } from '@/types/yijing';
import type { RagSource } from '@/types/consult';
import type { Knowledge } from '@/lib/knowledge';

const SYSTEM_BAZI = `你是一位精通中国传统命理学的资深命理师，深谙《渊海子平》《三命通会》《滴天髓》《穷通宝鉴》等经典典籍，常年为他人批八字、断吉凶。

你的任务是像一位经验丰富的算命先生那样，依据用户提供的完整八字排盘数据（四柱干支、十神、五行强弱、纳音、十二长生、神煞、大运流年），做出专业、详尽、有画面感的解读。

行文要求：
1. 以"命主"或"你"称呼用户，语气从容、老练，如同当面批命，既有古文底蕴又通俗易懂。
2. 必须结合所提供的【参考典籍片段】，在适当处点出"《渊海子平》有云……""《滴天髓》谓……"之类的引证，使论断有据可依。
3. 解读要详尽展开，分板块层层递进，总篇幅力求 800 字以上，不要惜墨。
4. 严禁使用任何 Markdown 符号：不要出现星号（*）、井号（#）、大于号引用（>）、反引号（\`）。如需分点，直接用中文序号（一、二、三 或 1. 2. 3.）或自然段落即可。
5. 客观中肯，强调命理趋势与修养调适之道，避免制造焦虑与绝对宿命论。
6. 结尾给出务实、可操作的人生建议（事业、财运、感情、健康、修身等方面）。`;

const SYSTEM_YIJING = `你是一位精通《周易》哲学的AI大师，擅长结合卦象、爻辞进行易经占卜解读。

你的任务是：
1. 根据起卦结果（本卦、变卦、综卦、错卦等）进行综合分析
2. 结合卦辞、爻辞和古籍文献提供专业解读
3. 将古老的易经智慧映射到用户的现代生活场景
4. 给出有指导意义的哲学思考和建议

注意事项：
- 重点解释卦象的核心含义和象征
- 如有动爻，重点分析动爻的含义和变化趋势
- 将卦象与用户的实际问题相结合
- 从变卦中分析事态发展的可能方向
- 从错卦和综卦提供补充视角`;

const PILLAR_NAMES = ['年柱', '月柱', '日柱', '时柱'];
const WU_XING_KEYS = [
  ['木', 'wood'],
  ['火', 'fire'],
  ['土', 'earth'],
  ['金', 'metal'],
  ['水', 'water'],
] as const;

interface NormalizedBazi {
  four_pillars: Array<{ name: string; ganzhi: string; tiangan: string; dizhi: string; wuxing_tiangan: string; wuxing_dizhi: string; canggan: string[] }>;
  day_stem: string;
  day_stem_wuxing: string;
  shishen_analysis: Record<string, { tiangan: string; detail: string; relationship: string }>;
  shishen_hidden: Record<string, string[]>;
  wuxing_analysis: { elements: Record<string, number>; strength_analysis: string; day_stem_wuxing: string };
  shensha_analysis: { shensha_list: Array<{ name: string; type: string; description: string; position: string }> };
  dayun_analysis: { current_dayun: string; current_age: string; qi_yun_age: number; periods: Array<{ ganzhi: string; age: string }> };
  nayin_info: Record<string, string>;
  chang_sheng: Record<string, string[]>;
  gender: string;
  current_jieqi: string;
}

function buildBaziContext(bazi: BaziResult, knowledge: Knowledge): NormalizedBazi {
  const pillars: Pillar[] = [bazi.year_pillar, bazi.month_pillar, bazi.day_pillar, bazi.hour_pillar];
  const dayStem = bazi.day_pillar.heavenly_stem;
  const dayStemWuxing = bazi.day_pillar.stem_wuxing;
  const dayStemLookup = knowledge.shishen_rules?.day_stem_lookup?.[dayStem] ?? {};
  const shishenMeaning = knowledge.shishen_rules?.shishen_wuxing_relation ?? {};

  const fourPillars = pillars.map((p, i) => ({
    name: PILLAR_NAMES[i],
    ganzhi: `${p.heavenly_stem}${p.earthly_branch}`,
    tiangan: p.heavenly_stem,
    dizhi: p.earthly_branch,
    wuxing_tiangan: p.stem_wuxing,
    wuxing_dizhi: p.branch_wuxing,
    canggan: p.canggan ?? [],
  }));

  // 十神（天干）
  const shishenAnalysis: NormalizedBazi['shishen_analysis'] = {};
  for (const item of bazi.shishen) {
    if (!item.shishen) continue;
    const meaning = shishenMeaning[item.shishen]?.meaning ?? '';
    let detail = meaning;
    if (item.modern_roles && item.modern_roles.length) {
      detail += `（现代映射：${item.modern_roles.join('、')}）`;
    }
    shishenAnalysis[item.shishen] = { tiangan: item.gan, detail, relationship: '' };
  }

  // 十神（地支藏干）
  const shishenHidden: Record<string, string[]> = {};
  for (const p of pillars) {
    const branch = p.earthly_branch;
    const items = (p.canggan ?? []).map((hs) => `${hs}(${dayStemLookup[hs] ?? ''})`);
    if (items.length) shishenHidden[branch] = items;
  }

  // 五行
  const elements: Record<string, number> = {};
  for (const [cn, en] of WU_XING_KEYS) {
    elements[cn] = (bazi.wuxing as unknown as Record<string, number>)[en] ?? 0;
  }
  const sortedEntries = Object.entries(elements).sort((a, b) => b[1] - a[1]);
  const strongest = sortedEntries[0]?.[0];
  const weakest = sortedEntries[sortedEntries.length - 1]?.[0];
  let strength = bazi.wuxing.summary || '';
  if (strongest) strength += `；最旺: ${strongest}`;
  if (weakest) strength += `；最弱: ${weakest}`;
  if (dayStemWuxing) strength += `；日主(${dayStem})强弱: ${bazi.wuxing.summary ?? ''}`;

  // 神煞
  const shenshaList = (bazi.shensha as ShenSha[]).map((s) => ({
    name: s.name,
    type: AUSPIG_TYPE(s.name),
    description: s.description ?? '',
    position: s.position ?? '',
  }));
  const kong = (bazi.shensha as ShenSha[]).find((s) => s.name === '空亡');
  if (kong) {
    shenshaList.push({
      name: '空亡',
      type: '中性',
      description: `空亡地支: ${kong.tags?.join('、') ?? ''}，位于: ${kong.position ?? ''}`,
      position: kong.position ?? '',
    });
  }

  // 大运
  const dayun = bazi.dayun as DaYunPeriod[] | undefined;
  let currentDayun = '';
  let currentAge = '';
  let qiYun = 0;
  const periods: Array<{ ganzhi: string; age: string }> = [];
  if (dayun && dayun.length) {
    qiYun = dayun[0].age_start;
    const age = currentAgeFromDate();
    const cur = dayun.find((p) => age >= p.age_start && age <= p.age_end);
    if (cur) {
      currentDayun = `${cur.gan}${cur.zhi}`;
      currentAge = `${cur.age_start}-${cur.age_end}岁`;
    }
    for (const p of dayun) periods.push({ ganzhi: `${p.gan}${p.zhi}`, age: `${p.age_start}-${p.age_end}岁` });
  }

  // 纳音
  const nayinInfo: Record<string, string> = {};
  pillars.forEach((p, i) => {
    if (p.nayin) nayinInfo[PILLAR_NAMES[i]] = `${p.nayin}`;
  });

  // 十二长生
  const changshengMap = knowledge.shier_changsheng?.changsheng_map_by_dizhi ?? {};
  const changSheng: Record<string, string[]> = {};
  for (const p of pillars) {
    const state = changshengMap[p.earthly_branch]?.[dayStem];
    if (state) {
      if (!changSheng[p.heavenly_stem]) changSheng[p.heavenly_stem] = [];
      changSheng[p.heavenly_stem].push(`${p.earthly_branch}宫${state}`);
    }
  }

  return {
    four_pillars: fourPillars,
    day_stem: dayStem,
    day_stem_wuxing: dayStemWuxing,
    shishen_analysis: shishenAnalysis,
    shishen_hidden: shishenHidden,
    wuxing_analysis: { elements, strength_analysis: strength, day_stem_wuxing: dayStemWuxing },
    shensha_analysis: { shensha_list: shenshaList },
    dayun_analysis: { current_dayun: currentDayun, current_age: currentAge, qi_yun_age: qiYun, periods },
    nayin_info: nayinInfo,
    chang_sheng: changSheng,
    gender: '',
    current_jieqi: '',
  };
}

function AUSPIG_TYPE(name: string): string {
  const good = new Set(['天乙贵人', '天德贵人', '月德贵人', '文昌贵人', '太极贵人', '将星', '天喜', '红鸾', '福星', '禄神', '天医', '金舆', '天赦']);
  const bad = new Set(['劫煞', '灾煞', '孤辰', '寡宿', '丧门', '吊客', '亡神', '元辰（大耗）', '勾神']);
  if (good.has(name)) return '吉神';
  if (bad.has(name)) return '凶神';
  return '中性';
}

function currentAgeFromDate(): number {
  // 仅用于定位当前大运，使用页面加载时的年份估算
  return new Date().getFullYear() % 100;
}

// ---------------------------------------------------------------------------
// 格式化（与后端 _format_* 一致）
// ---------------------------------------------------------------------------

function formatRagSources(sources: RagSource[]): string {
  if (!sources.length) return '';
  const lines = ['\n参考典籍片段：'];
  sources.forEach((src, i) => {
    const book = (src.book ?? '未知典籍').replace(/[《》]/g, '');
    const score = src.score ?? 0;
    lines.push(`\n${i + 1}. 《${book}》 (相关度: ${score.toFixed(2)})`);
    lines.push(`   ${src.text.slice(0, 300)}`);
  });
  return lines.join('');
}

function formatBaziData(ctx: NormalizedBazi): string {
  const parts = ['\n八字排盘数据：'];
  if (ctx.current_jieqi) parts.push(`  出生节气: ${ctx.current_jieqi}`);
  for (const p of ctx.four_pillars) {
    parts.push(
      `  ${p.name}: ${p.ganzhi}（天干${p.tiangan}属${p.wuxing_tiangan}，地支${p.dizhi}属${p.wuxing_dizhi}，藏干: ${p.canggan.join('、')}）`,
    );
  }
  parts.push(`  日主: ${ctx.day_stem}（五行属${ctx.day_stem_wuxing}，为命局核心）`);
  const nayin = Object.entries(ctx.nayin_info).map(([k, v]) => `${k}${v}`).join('，');
  if (nayin) parts.push(`  纳音: ${nayin}`);
  const shishen = ctx.shishen_analysis;
  if (Object.keys(shishen).length) {
    parts.push('  十神（天干）分析：');
    for (const [name, info] of Object.entries(shishen)) {
      parts.push(`    ${info.tiangan}坐${name}: ${info.detail}`);
    }
  }
  const hidden = ctx.shishen_hidden;
  if (Object.keys(hidden).length) {
    parts.push('  十神（地支藏干）补充：');
    for (const [branch, items] of Object.entries(hidden)) {
      parts.push(`    ${branch}支: ${items.join('、')}`);
    }
  }
  const wx = ctx.wuxing_analysis;
  const el = Object.entries(wx.elements).map(([k, v]) => `${k}: ${v}`).join('，');
  if (el) parts.push(`  五行分值分布：${el}`);
  if (wx.strength_analysis) parts.push(`  五行强弱与生克：${wx.strength_analysis}`);
  const cs = ctx.chang_sheng;
  if (Object.keys(cs).length) {
    const csParts = Object.entries(cs).map(([tg, states]) => `${tg}: ${states.join('、')}`);
    parts.push(`  十二长生: ${csParts.join('；')}`);
  }
  const ss = ctx.shensha_analysis.shensha_list;
  if (ss.length) {
    const items = ss.map((s) => `${s.name}(${s.type})${s.position ? `[${s.position}]` : ''}`);
    parts.push(`  神煞: ${items.join('、')}`);
  }
  const dy = ctx.dayun_analysis;
  if (dy.qi_yun_age) parts.push(`  起运年龄: ${dy.qi_yun_age}岁`);
  if (dy.current_dayun) parts.push(`  当前大运: ${dy.current_dayun}（${dy.current_age}）`);
  if (dy.periods.length) {
    const per = dy.periods.slice(0, 8).map((p) => `${p.ganzhi}(${p.age})`).join('，');
    parts.push(`  大运走势: ${per}`);
  }
  return parts.join('\n');
}

function formatGuaResult(gua: GuaResult): string {
  const parts = ['\n卦象数据：'];
  const primary = gua.primary_gua;
  if (primary) {
    parts.push(`  本卦: 第${primary.xuhao}卦 ${primary.name}（${primary.binary}）`);
    if (primary.description) parts.push(`  卦象描述: ${primary.description}`);
    if (primary.gua_ci) parts.push(`  卦辞: ${primary.gua_ci}`);
  }
  if (gua.changing_lines && gua.changing_lines.length) {
    parts.push('  动爻：');
    for (const y of gua.changing_lines) {
      let s = `    ${y.position_name}爻: ${y.yin_yang}`;
      if (y.text) s += ` → ${y.text}`;
      if (y.changing_to) s += `（将变为${y.changing_to}）`;
      parts.push(s);
    }
  } else {
    parts.push('  动爻: 无（静卦，六爻皆静）');
  }
  const bian = gua.bian_gua;
  if (bian) {
    parts.push(`  变卦: 第${bian.xuhao}卦 ${bian.name}（${bian.binary}）`);
    if (bian.gua_ci) parts.push(`  变卦卦辞: ${bian.gua_ci}`);
  }
  const cuo = gua.cuo_gua;
  if (cuo) parts.push(`  错卦: 第${cuo.xuhao}卦 ${cuo.name}`);
  const zong = gua.zong_gua;
  if (zong) parts.push(`  综卦: 第${zong.xuhao}卦 ${zong.name}`);
  if (gua.gua_meaning) parts.push(`  卦意解读: ${gua.gua_meaning}`);
  return parts.join('\n');
}

// ---------------------------------------------------------------------------
// 对外
// ---------------------------------------------------------------------------

export function buildBaziPrompt(bazi: BaziResult, ragSources: RagSource[], knowledge: Knowledge): { system: string; user: string } {
  const ctx = buildBaziContext(bazi, knowledge);
  const userParts = ['请根据以下八字排盘数据，为用户进行专业解读。'];
  userParts.push(formatBaziData(ctx));
  if (ragSources.length) userParts.push(formatRagSources(ragSources));
  userParts.push(
    '\n请像资深算命先生那样，分板块详细解读，每个板块都要展开说明，篇幅要充足：\n' +
      '一、命局总论：日主强弱、格局高低、寒暖燥湿、日主心性基调。\n' +
      '二、五行喜忌：用神、喜神、忌神分别是什么，日主宜补何五行。\n' +
      '三、十神论命：各十神（正官、七杀、正印、偏财、食神等）透干与藏支所主之性格、六亲、事业财运倾向。\n' +
      '四、神煞吉凶：所带贵人或凶煞对命运的影响。\n' +
      '五、大运流年：当前大运气象、起运早晚、近年流年吉凶起伏。\n' +
      '六、人生指引：事业、财运、感情、健康、修身方面的具体建议。\n' +
      '请务必引用所提供的参考典籍片段来佐证论断，让解读既有理据又有古韵。',
  );
  return { system: SYSTEM_BAZI, user: userParts.join('\n') };
}

export function buildYijingPrompt(gua: GuaResult, ragSources: RagSource[]): { system: string; user: string } {
  const userParts = ['请根据以下卦象数据，为用户进行易经占卜解读。'];
  if (gua.question && gua.question !== '未提供具体问题') {
    userParts.push(`\n用户问题: ${gua.question}`);
  }
  userParts.push(formatGuaResult(gua));
  if (gua.modern_scenes && gua.modern_scenes.length) {
    userParts.push('\n现代场景映射：');
    for (const s of gua.modern_scenes) {
      if (s.scenes && s.scenes.length) userParts.push(`  场景标签: ${s.scenes.join('，')}`);
      if (s.description) userParts.push(`  现代解读: ${s.description}`);
    }
  }
  if (ragSources.length) userParts.push(formatRagSources(ragSources));
  userParts.push(
    '\n请从以下角度分析：\n' +
      '1. 本卦的核心含义和象征意义\n' +
      '2. 动爻的解读（如有）\n' +
      '3. 变卦揭示的发展趋势\n' +
      '4. 错卦和综卦提供的补充视角\n' +
      '5. 结合现代生活的实际建议',
  );
  return { system: SYSTEM_YIJING, user: userParts.join('\n') };
}
