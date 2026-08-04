/**
 * 户型图视觉识别 API 占位
 * 输入户型图片 → 输出结构化房间数据
 * 待 VL 大模型 API 就绪后替换
 */

export interface FloorPlanRoomRaw {
  id: string;
  type: 'door' | 'window' | 'bedroom' | 'living' | 'kitchen' | 'bathroom' | 'study' | 'balcony' | 'corridor' | 'other';
  label: string;
  centerX: number;
  centerY: number;
  rotation: number;
  width: number;
  height: number;
}

export interface FloorPlanResult {
  success: boolean;
  rooms: FloorPlanRoomRaw[];
  rawBoundary?: { width: number; height: number };
  error?: string;
}

// ════════════════════════════════════════════
// 占位实现 — 返回模拟数据
// ════════════════════════════════════════════

export async function recognizeFloorPlan(_imageBase64: string): Promise<FloorPlanResult> {
  // TODO: 替换为真实 VL API 调用
  // 当前返回模拟数据，方便开发和 UI 调试
  return {
    success: true,
    rooms: [
      { id:'door1', type:'door', label:'入户门', centerX:50, centerY:5, rotation:180, width:8, height:3 },
      { id:'living1', type:'living', label:'客厅', centerX:50, centerY:35, rotation:180, width:60, height:50 },
      { id:'kitchen1', type:'kitchen', label:'厨房', centerX:20, centerY:35, rotation:180, width:25, height:25 },
      { id:'bathroom1', type:'bathroom', label:'卫生间', centerX:20, centerY:70, rotation:180, width:20, height:20 },
      { id:'bedroom1', type:'bedroom', label:'主卧', centerX:60, centerY:70, rotation:180, width:40, height:35 },
      { id:'bedroom2', type:'bedroom', label:'次卧', centerX:60, centerY:35, rotation:180, width:25, height:25 },
      { id:'window1', type:'window', label:'客厅窗', centerX:50, centerY:95, rotation:0, width:20, height:3 },
      { id:'balcony1', type:'balcony', label:'阳台', centerX:50, centerY:90, rotation:180, width:60, height:10 },
    ],
    rawBoundary: { width: 100, height: 100 },
  };

  /* 真实调用示例（VL模型就绪后取消注释）：
  const apiKey = getVLKey();
  const res = await fetch('https://api.example.com/vl/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      image: _imageBase64,
      prompt: `分析这张户型图，识别所有房间。输出JSON格式：
{ "rooms": [{ "id":"唯一ID", "type":"door/window/bedroom/living/kitchen/bathroom/study/balcony/corridor/other", "label":"名称", "centerX":百分比数字, "centerY":百分比数字, "rotation":朝向角度0-360, "width":宽度百分比, "height":高度百分比 }] }`,
    }),
  });
  const data = await res.json();
  return { success: true, rooms: data.rooms };
  */
}

// ════════════════════════════════════════════
// 生成分析报告（RAG + LLM 文案加工）
// ════════════════════════════════════════════

import { callDeepSeek } from '@/lib/llm/deepseek';
import { searchFengShuiKnowledge } from '@/lib/rag/fengshuiKnowledge';
import type { RagSource } from '@/types/consult';
import type { FengShuiAnalysis } from './ruleEngine';

export interface FengShuiReport {
  text: string;
  sources: RagSource[];
}

export async function generateReport(analysis: FengShuiAnalysis, question: string): Promise<FengShuiReport> {
  const keywords = [
    ...analysis.patterns.map((p) => p.name),
    ...analysis.xuanKong.palaces.filter((p) => p.jiXiong.includes('凶') || p.jiXiong.includes('煞')).map((p) => p.gua + p.jiXiong),
    analysis.xuanKong.overall,
    analysis.baZhai.mingGuaName + '命',
  ];
  
  let sources: RagSource[] = [];
  try { sources = await searchFengShuiKnowledge(keywords, keywords); } catch {}
  
  const systemPrompt = `你是风水文案撰写师。你的任务是把结构化的风水分析数据，转化为温和、通顺、通俗的人居环境分析文案。

切记：
1. 你没有判断吉凶的权力，所有吉凶判断必须基于提供的结构化数据
2. 必须引用提供的古籍知识原文（标注出处）
3. 使用温和的语气，声明"仅供娱乐参考"
4. 不要编造任何不在数据中的风水理论`;

  const dataStr = `## 玄空飞星排盘
运势：${analysis.xuanKong.yunName}（${analysis.xuanKong.yun}运）
坐向：坐${analysis.xuanKong.shan}向${analysis.xuanKong.xiang}
总体：${analysis.xuanKong.overall}

各宫简况：
${analysis.xuanKong.palaces.map((p) => `- ${p.gua}宫(${p.dir})：运星${p.yunXing}·山星${p.shanXing}·向星${p.xiangXing} ${p.jiXiong}`).join('\n')}

## 八宅命卦
命卦：${analysis.baZhai.mingGuaName}（${analysis.baZhai.xiSi ? '西四命' : '东四命'}）

## 户型格局
${analysis.patterns.map((p) => `- [${p.severity === 'good' ? '✓' : p.severity === 'warning' ? '⚠' : p.severity === 'bad' ? '✗' : '○'}] ${p.name}：${p.description}`).join('\n')}

## 调整建议
${analysis.suggestions.map((s) => `- ${s}`).join('\n')}

## 参考古籍
${sources.map((s) => `【${s.book}】${s.text.slice(0, 300)}`).join('\n\n')}

用户问题：${question || '请给出综合分析'}`;

  const text = await callDeepSeek([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: dataStr },
  ], { temperature: 0.5, maxTokens: 4096 });
  
  return { text, sources };
}
