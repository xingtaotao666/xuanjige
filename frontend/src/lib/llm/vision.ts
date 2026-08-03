/**
 * 视觉模型 API 占位服务
 *
 * 待视觉 API 密钥就绪后替换此文件中的实现即可。
 * 当前方案：将图片 base64 和文本 prompt 一起发送到 LLM 进行分析。
 * 未来可接入：DeepSeek-Vision / Qwen-VL / Gemini Vision / GPT-4V 等。
 */

import { callDeepSeek } from './deepseek';

export interface VisionRequest {
  /** base64 编码的图片数据（不含 data:image/xxx;base64, 前缀） */
  imageBase64: string;
  /** 图片 MIME 类型，如 image/jpeg */
  mimeType?: string;
  /** 系统提示词 */
  systemPrompt: string;
  /** 用户问题文本 */
  userText: string;
  /** 知识库补充内容 */
  knowledge?: string;
}

export interface VisionResponse {
  /** AI 分析结果文本 */
  text: string;
  /** 使用的模型标识 */
  model: string;
}

// ═══════════════════════════════════════════════════
// 占位实现 — 文本模式（等视觉 API key 后替换）
// ═══════════════════════════════════════════════════

const MODEL_NAME = 'deepseek-chat（文本模式，待升级视觉模型）';

export async function analyzeImage(req: VisionRequest): Promise<VisionResponse> {
  const { systemPrompt, userText, knowledge } = req;

  const enrichedText = [
    userText,
    knowledge ? `\n\n参考古籍知识：\n${knowledge}` : '',
    '\n\n注意：当前使用文本分析模式。用户已上传照片，但模型暂未接入图片输入。请基于知识库内容和用户描述给出分析。视觉模型接入后将能直接识别照片中的实际特征。',
  ].join('\n');

  const result = await callDeepSeek(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: enrichedText },
    ],
    { temperature: 0.7, maxTokens: 4096 },
  );

  return { text: result, model: MODEL_NAME };
}

// ═══════════════════════════════════════════════════
// 视觉模型接入后替换为以下实现（示意）：
// ═══════════════════════════════════════════════════
//
// const VISION_MODEL = 'deepseek-vision'; // 或 qwen-vl-plus / gpt-4o
// const VISION_API_URL = 'https://api.deepseek.com/v1/chat/completions';
//
// export async function analyzeImage(req: VisionRequest): Promise<VisionResponse> {
//   const apiKey = getApiKey();
//   const res = await fetch(VISION_API_URL, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
//     body: JSON.stringify({
//       model: VISION_MODEL,
//       messages: [
//         { role: 'system', content: req.systemPrompt },
//         {
//           role: 'user',
//           content: [
//             { type: 'image_url', image_url: { url: `data:${req.mimeType || 'image/jpeg'};base64,${req.imageBase64}` } },
//             { type: 'text', text: `${req.userText}\n\n${req.knowledge || ''}` },
//           ],
//         },
//       ],
//       temperature: 0.7,
//       max_tokens: 4096,
//     }),
//   });
//   const data = await res.json();
//   return { text: data.choices[0].message.content, model: VISION_MODEL };
// }
