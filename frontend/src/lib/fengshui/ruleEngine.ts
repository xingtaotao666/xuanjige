/**
 * 风水规则引擎 — 纯代码计算，不依赖 LLM
 * 包含：玄空飞星排盘、八宅命卦、格局判定、楼层五行
 * 输入数据 → 数学查表+循环计算 → 结构化结果
 */

// ════════════════════════════════════════════════
// 基础常量
// ════════════════════════════════════════════════

/** 二十四山（三合罗盘顺序） */
export const SHAN_24 = [
  '子','癸','丑','艮','寅','甲','卯','乙','辰','巽','巳',
  '丙','午','丁','未','坤','申','庚','酉','辛','戌','乾','亥','壬'
] as const;

export type Shan24 = typeof SHAN_24[number];

/** 二十四山（三合罗盘顺序） */
const LUO_SHU: Record<number, { gua: string; dir: string; wuxing: string; dz: string }> = {
  1: { gua:'坎', dir:'北', wuxing:'水', dz:'子' },
  2: { gua:'坤', dir:'西南', wuxing:'土', dz:'未申' },
  3: { gua:'震', dir:'东', wuxing:'木', dz:'卯' },
  4: { gua:'巽', dir:'东南', wuxing:'木', dz:'辰巳' },
  5: { gua:'中', dir:'中', wuxing:'土', dz:'' },
  6: { gua:'乾', dir:'西北', wuxing:'金', dz:'戌亥' },
  7: { gua:'兑', dir:'西', wuxing:'金', dz:'酉' },
  8: { gua:'艮', dir:'东北', wuxing:'土', dz:'丑寅' },
  9: { gua:'离', dir:'南', wuxing:'火', dz:'午' },
};

/** 九宫显示序 → 洛书数 */
const DISPLAY_ORDER = [4,9,2,3,5,7,8,1,6];

/** 三元九运 (每运20年) */
export function getYun(year: number) {
  if (year < 1864) return { yun: 0, name: '' };
  const y = Math.floor((year - 1864) / 20) + 1;
  const names = ['一白坎水','二黑坤土','三碧震木','四绿巽木','五黄中土','六白乾金','七赤兑金','八白艮土','九紫离火'];
  return { yun: y > 9 ? ((y - 1) % 9) + 1 : y, name: names[((y > 9 ? ((y - 1) % 9) + 1 : y) - 1) % 9] };
}

/** 二十四山对应的八卦和洛书数 */
function shanToGua(shan: Shan24): { gua: string; luo: number; yinYang: boolean } {
  const map: Record<string, { gua: string; luo: number; yinYang: boolean }> = {
    '子':{gua:'坎',luo:1,yinYang:false},'癸':{gua:'坎',luo:1,yinYang:false},'壬':{gua:'坎',luo:1,yinYang:true},
    '未':{gua:'坤',luo:2,yinYang:false},'坤':{gua:'坤',luo:2,yinYang:true},'申':{gua:'坤',luo:2,yinYang:false},
    '卯':{gua:'震',luo:3,yinYang:false},'乙':{gua:'震',luo:3,yinYang:false},'甲':{gua:'震',luo:3,yinYang:true},
    '辰':{gua:'巽',luo:4,yinYang:false},'巽':{gua:'巽',luo:4,yinYang:true},'巳':{gua:'巽',luo:4,yinYang:false},
    '戌':{gua:'乾',luo:6,yinYang:false},'乾':{gua:'乾',luo:6,yinYang:true},'亥':{gua:'乾',luo:6,yinYang:false},
    '丑':{gua:'艮',luo:8,yinYang:false},'艮':{gua:'艮',luo:8,yinYang:true},'寅':{gua:'艮',luo:8,yinYang:false},
    '午':{gua:'离',luo:9,yinYang:false},'丁':{gua:'离',luo:9,yinYang:false},'丙':{gua:'离',luo:9,yinYang:true},
    '酉':{gua:'兑',luo:7,yinYang:false},'辛':{gua:'兑',luo:7,yinYang:false},'庚':{gua:'兑',luo:7,yinYang:true},
  };
  return map[shan] || { gua:'', luo:0, yinYang: true };
}

// ════════════════════════════════════════════════
// 核心类型
// ════════════════════════════════════════════════

export interface PalaceResult {
  gong: number;         // 洛书宫位数
  gua: string;          // 八卦名
  dir: string;          // 方位
  dz: string;           // 地支
  yunXing: number;      // 运星
  shanXing: number;     // 山星
  xiangXing: number;    // 向星
  shanXiangHe: number;  // 山向和
  jiXiong: string;      // 吉凶简评
  wuxing: string;       // 五行
}

export interface XuanKongResult {
  yun: number;
  yunName: string;
  shan: string;
  xiang: string;
  shanXingRuZhong: number;
  xiangXingRuZhong: number;
  shanShunNi: string;
  xiangShunNi: string;
  palaces: PalaceResult[];
  overall: string;       // 总体评价：旺山旺向/双星到向/上山下水/双星到坐
}

export interface BaZhaiResult {
  mingGua: number;
  mingGuaName: string;
  xiSi: boolean;        // true=西四命, false=东四命
  youNian: Record<string, { name: string; ji: boolean; wuxing: string }>; // 八方游年
}

export interface FloorPlanRoom {
  id: string;
  type: 'door' | 'window' | 'bedroom' | 'living' | 'kitchen' | 'bathroom' | 'study' | 'balcony' | 'corridor' | 'other';
  label: string;
  centerX: number;  // 相对于户型中心的位置百分比
  centerY: number;
  rotation: number; // 朝向角度 0=北
}

export interface FengShuiAnalysis {
  xuanKong: XuanKongResult;
  baZhai: BaZhaiResult;
  patterns: FengShuiPattern[];
  suggestions: string[];
}

export interface FengShuiPattern {
  name: string;
  severity: 'good' | 'neutral' | 'warning' | 'bad';
  description: string;
  relatedRoom?: string;
}

// ════════════════════════════════════════════════
// 玄空飞星排盘
// ════════════════════════════════════════════════

/** 飞星排布（从起始星+顺逆飞，填入9个洛书位的结果） */
function feiXing(startXing: number, shun: boolean): Record<number, number> {
  const result: Record<number, number> = {};
  // 洛书序飞星轨迹
  const path = [5,6,7,8,9,1,2,3,4];
  if (!shun) path.reverse();
  for (let i = 0; i < 9; i++) {
    let star = startXing + (shun ? i : -i);
    while (star > 9) star -= 9;
    while (star < 1) star += 9;
    result[path[i]] = star;
  }
  return result;
}

/** 玄空飞星完整排盘 */
export function xuanKongFeiXing(year: number, shan: Shan24, xiang: Shan24): XuanKongResult {
  const { yun, name: yunName } = getYun(year);
  const yunXing = yun;
  
  // 1. 运盘：入中星=当运星，永远顺飞
  const yunPan = feiXing(yunXing, true);
  
  // 2. 山星/向星入中数字：洛书数
  const shanInfo = shanToGua(shan);
  const xiangInfo = shanToGua(xiang);
  const shanXingRuZhong = shanInfo.luo;
  const xiangXingRuZhong = xiangInfo.luo;
  
  // 3. 三元龙阴阳定顺逆（简化：人元龙为阴逆飞，地元龙/天元龙为阳顺飞）
  const shanShun = shanInfo.yinYang;
  const xiangShun = xiangInfo.yinYang;
  
  // 4. 山盘和向盘
  const shanPan = feiXing(shanXingRuZhong, shanShun);
  const xiangPan = feiXing(xiangXingRuZhong, xiangShun);
  
  // 5. 合盘
  const palaces: PalaceResult[] = DISPLAY_ORDER.map((g) => {
    const info = LUO_SHU[g];
    const shanS = shanPan[g];
    const xiangS = xiangPan[g];
    const he = shanS + xiangS;
    
    // 吉凶简评
    let jx = '平';
    if (shanS === yunXing && xiangS === yunXing) jx = '旺山旺向·大吉';
    else if (shanS === yunXing && xiangS !== yunXing) jx = '旺丁不旺财';
    else if (shanS !== yunXing && xiangS === yunXing) jx = '旺财不旺丁';
    else if (shanS === 5 || xiangS === 5) jx = '五黄大煞·凶';
    else if (shanS === 2 && xiangS === 5) jx = '二五交加·大凶';
    else if (he === 10) jx = '合十·吉';
    
    return {
      gong: g,
      gua: info.gua,
      dir: info.dir,
      dz: info.dz,
      yunXing: yunPan[g],
      shanXing: shanS,
      xiangXing: xiangS,
      shanXiangHe: he,
      jiXiong: jx,
      wuxing: info.wuxing,
    };
  });
  
  // 总体评价
  const shanPalace = palaces.find((p) => p.gua === shanInfo.gua);
  const xiangPalace = palaces.find((p) => p.gua === xiangInfo.gua);
  let overall = '';
  if (shanPalace && xiangPalace) {
    if (shanPalace.shanXing === yunXing && xiangPalace.xiangXing === yunXing) overall = '旺山旺向·丁财两旺';
    else if (shanPalace.xiangXing === yunXing && xiangPalace.xiangXing === yunXing) overall = '双星到向·旺财不旺丁';
    else if (shanPalace.shanXing === yunXing && xiangPalace.shanXing === yunXing) overall = '双星到坐·旺丁不旺财';
    else if (shanPalace.xiangXing === yunXing) overall = '上山下水·丁财两败';
    else overall = '一般格局';
  }
  
  return {
    yun, yunName, shan, xiang,
    shanXingRuZhong, xiangXingRuZhong,
    shanShunNi: shanShun ? '顺飞' : '逆飞',
    xiangShunNi: xiangShun ? '顺飞' : '逆飞',
    palaces, overall,
  };
}

// ════════════════════════════════════════════════
// 八宅命卦
// ════════════════════════════════════════════════

const BA_GUA_NAME = ['','坎','坤','震','巽','中','乾','兑','艮','离'];

/** 命卦计算（简化：100/99减出生年后两位除9取余） */
export function baZhaiMingGua(birthYear: number, gender: '男' | '女'): BaZhaiResult {
  const tail = birthYear % 100;
  let gua: number;
  
  if (gender === '男') {
    gua = (100 - tail) % 9;
    if (gua === 0) gua = 9;
  } else {
    gua = (tail - 4) % 9;
    if (gua === 0) gua = 9;
  }
  
  // 男命5寄坤2，女命5寄艮8
  if (gender === '男' && gua === 5) gua = 2;
  if (gender === '女' && gua === 5) gua = 8;
  
  const xiSi = [2,6,7,8].includes(gua);
  
  // 游年八方（简化：以命卦为伏位）
  const youNianOrder = xiSi
    ? ['乾','坤','艮','兑','坎','离','震','巽']
    : ['震','巽','坎','离','乾','坤','艮','兑'];
  const youNianNames = ['伏位','天医','延年','生气','五鬼','六煞','祸害','绝命'];
  const youNianJi = [true,true,true,true,false,false,false,false];
  const youNianWx = ['','土','金','木','火','水','土','金'];
  
  const youNian: Record<string, { name: string; ji: boolean; wuxing: string }> = {};
  youNianOrder.forEach((g, i) => {
    youNian[g] = { name: youNianNames[i], ji: youNianJi[i], wuxing: youNianWx[i] };
  });
  
  return {
    mingGua: gua,
    mingGuaName: BA_GUA_NAME[gua],
    xiSi,
    youNian,
  };
}

// ════════════════════════════════════════════════
// 户型格局判定
// ════════════════════════════════════════════════

/** 根据户型方位数据，判定风水格局问题 */
export function analyzePatterns(
  rooms: FloorPlanRoom[],
  direction: number, // 房屋朝向度数 0=北
): FengShuiPattern[] {
  const patterns: FengShuiPattern[] = [];
  
  const door = rooms.find((r) => r.type === 'door');
  const kitchen = rooms.find((r) => r.type === 'kitchen');
  const bathroom = rooms.find((r) => r.type === 'bathroom');
  const bedrooms = rooms.filter((r) => r.type === 'bedroom');
  
  // 归一化房间中心到 360°
  const normalize = (n: number) => ((n + direction) % 360 + 360) % 360;
  
  // 1. 穿堂煞判定：大门与窗户/阳台在一条直线上
  const windows = rooms.filter((r) => r.type === 'window' || r.type === 'balcony');
  if (door && windows.length > 0) {
    for (const w of windows) {
      const dx = Math.abs(door.centerX - w.centerX);
      const dy = Math.abs(door.centerY - w.centerY);
      if (Math.max(dx, dy) < 25 && (dx < 8 || dy < 8)) {
        patterns.push({ name:'穿堂煞', severity:'warning', description:'大门与窗户/阳台直通，气场直进直出，财气难聚', relatedRoom: `${door.label}→${w.label}` });
        break;
      }
    }
  }
  
  // 2. 厨卫位置判定
  if (kitchen) {
    const kAng = normalize(kitchen.rotation);
    if (kAng >= 315 || kAng < 45) patterns.push({ name:'厨房在西北', severity:'warning', description:'厨房在西北（乾位），火克金，不利男主财运和健康', relatedRoom: kitchen.label });
    if (kAng >= 225 && kAng < 315) patterns.push({ name:'厨房在西', severity:'neutral', description:'厨房在兑位，金火相克，注意呼吸道和口腔健康', relatedRoom: kitchen.label });
    if (kAng >= 135 && kAng < 225) patterns.push({ name:'厨房在南', severity:'neutral', description:'厨房在离位，火上加火，易引起家人烦躁上火', relatedRoom: kitchen.label });
  }
  
  if (bathroom) {
    const bAng = normalize(bathroom.rotation);
    if (bAng >= 315 || bAng < 45) patterns.push({ name:'卫生间在西北', severity:'bad', description:'卫生间在西北（乾位），水污乾金，严重不利男主事业和健康', relatedRoom: bathroom.label });
    if (bAng >= 45 && bAng < 135) patterns.push({ name:'卫生间在东北', severity:'warning', description:'卫生间在艮位（少男主位），不利家中少男运程', relatedRoom: bathroom.label });
    if (bAng >= 135 && bAng < 225) patterns.push({ name:'卫生间在南', severity:'warning', description:'卫生间在离位（火位），水火相冲，不利中女和心脏', relatedRoom: bathroom.label });
  }
  
  // 3. 门对门判定
  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      if (rooms[i].type === 'door' || rooms[j].type === 'door') continue;
      const dx = Math.abs(rooms[i].centerX - rooms[j].centerX);
      const dy = Math.abs(rooms[i].centerY - rooms[j].centerY);
      if (dx < 6 && dy < 6) {
        patterns.push({ name:'门对门', severity:'neutral', description:`${rooms[i].label}与${rooms[j].label}门对门，易引发口舌`, relatedRoom: `${rooms[i].label}↔${rooms[j].label}` });
      }
    }
  }
  
  // 4. 卧室方位
  for (const bed of bedrooms) {
    const bAng = normalize(bed.rotation);
    if (bAng >= 225 && bAng < 315) patterns.push({ name:'卧室在西', severity:'neutral', description:'卧室在兑位，金气过重，可能影响睡眠质量', relatedRoom: bed.label });
  }
  
  return patterns;
}

// ════════════════════════════════════════════════
// 楼层五行
// ════════════════════════════════════════════════

export function floorWuXing(floor: number): string {
  const t = floor % 10;
  if (t === 1 || t === 6) return '水';
  if (t === 2 || t === 7) return '火';
  if (t === 3 || t === 8) return '木';
  if (t === 4 || t === 9) return '金';
  return '土';
}

/** 楼层与命卦五行生克 */
export function floorVsMingGua(floor: number, mingGuaWuXing: string): string {
  const fwx = floorWuXing(floor);
  const sheng: Record<string, string> = { '水木':'吉·楼层生命','木火':'吉·楼层生命','火土':'吉·楼层生命','土金':'吉·楼层生命','金水':'吉·楼层生命',
    '水火':'凶·楼层克命','火金':'凶·楼层克命','金木':'凶·楼层克命','木土':'凶·楼层克命','土水':'凶·楼层克命',
    '水水':'平·比和','木木':'平·比和','火火':'平·比和','土土':'平·比和','金金':'平·比和',
    '水金':'泄·命生楼层','木水':'泄·命生楼层','火木':'泄·命生楼层','土火':'泄·命生楼层','金土':'泄·命生楼层' };
  return sheng[mingGuaWuXing + fwx] || '平';
}

// ════════════════════════════════════════════════
// 综合风水分析
// ════════════════════════════════════════════════

export function fullAnalysis(
  year: number,
  shan: Shan24,
  xiang: Shan24,
  birthYear: number,
  gender: '男' | '女',
  floor: number,
  rooms: FloorPlanRoom[],
  direction: number,
): FengShuiAnalysis {
  const xk = xuanKongFeiXing(year, shan, xiang);
  const bz = baZhaiMingGua(birthYear, gender);
  const patterns = analyzePatterns(rooms, direction);
  
  // 住宅与命卦匹配度
  const houseGua = DISPLAY_ORDER.indexOf(shanToGua(shan).luo) + 1;
  if (bz.xiSi === [2,6,7,8].includes(houseGua)) {
    patterns.unshift({ name:'宅命相配', severity:'good', description:'宅卦与命卦同属，住宅与宅主气场和谐' });
  } else {
    patterns.unshift({ name:'宅命不配', severity:'warning', description:'宅卦与命卦不同属，需通过风水调整来平衡' });
  }
  
  // 楼层匹配
  const fMatch = floorVsMingGua(floor, LUO_SHU[bz.mingGua]?.wuxing || '土');
  patterns.push({ name:`楼层${floorWuXing(floor)}`, severity: fMatch.includes('吉') ? 'good' : fMatch.includes('凶') ? 'warning' : 'neutral', description: `楼层五行${floorWuXing(floor)}，与命卦${bz.mingGuaName}${LUO_SHU[bz.mingGua]?.wuxing}：${fMatch}` });
  
  // 生成建议
  const suggestions: string[] = [];
  const badPatterns = patterns.filter((p) => p.severity === 'bad' || p.severity === 'warning');
  if (badPatterns.length === 0) {
    suggestions.push('整体格局较佳，无需大改动');
  }
  for (const p of badPatterns) {
    if (p.name === '穿堂煞') suggestions.push('在大门与阳台之间设置屏风或玄关柜，阻隔直冲气流');
    if (p.name === '厨房在西北') suggestions.push('厨房西北角放置黄色陶瓷摆件（土泄火生金），或用黄色系装修');
    if (p.name === '卫生间在西北') suggestions.push('保持卫生间干燥清洁，门口放置阔叶绿植吸收湿气，挂五帝钱化解');
    if (p.name === '卫生间在东北') suggestions.push('卫生间放置白色物品（金泄土），保持明亮通风');
    if (p.name === '宅命不配') suggestions.push('将主卧安排在命卦吉方（参考八宅游年），大门开在宅卦吉方');
  }
  
  return { xuanKong: xk, baZhai: bz, patterns, suggestions };
}
