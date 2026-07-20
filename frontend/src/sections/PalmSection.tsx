import { useState, type FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { callDeepSeek } from '@/lib/llm/deepseek';
import { searchPalmKnowledge } from '@/lib/rag/palmKnowledge';
import SourceCitations from '@/components/rag/SourceCitations';
import type { RagSource } from '@/types/consult';

export default function PalmSection() {
  const [question, setQuestion] = useState('');
  const [palmDesc, setPalmDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [sources, setSources] = useState<RagSource[]>([]);

  const handleAnalyze = async (e: FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !palmDesc.trim()) return;
    setLoading(true);
    setResult(null);
    setSources([]);

    try {
      // 1. RAG 检索
      const ragSources = await searchPalmKnowledge(
        [palmDesc.trim(), question.trim()],
        ['手掌', '手相', ...palmDesc.split(/[,，、\s]+/).filter(Boolean)],
      );

      setSources(ragSources);

      // 2. 构建提示词
      const knowledge = ragSources
        .map((s) => `【${s.book}】\n${s.text}`)
        .join('\n\n');

      const prompt = `你是一位精通手相学的资深命理师。请根据用户描述的手相特征和问题，结合手相知识库中的专业内容，进行深入分析和解读。

用户描述的手相特征：
${palmDesc.trim()}

用户的问题：
${question.trim()}

参考知识库内容：
${knowledge || '（暂无匹配的知识库内容，请根据你对手相学的了解进行分析）'}

请从以下几个方面进行分析：
1. 手相特征解读：根据描述分析五大主线（生命线、智慧线、感情线、事业线、婚姻线）等特征的含义
2. 性格与天赋：手型、掌丘等反映的个性特质和潜在才能
3. 运势趋势：对应的人生各领域（事业、感情、健康等）的发展趋势
4. 综合建议：基于手相特征的实用建议与注意事项

注意：需要声明仅供娱乐参考，不作为专业医学或心理学诊断。`;

      // 3. LLM 调用
      const llmResult = await callDeepSeek(
        [
          { role: 'system', content: '你是一位精通中西手相学、具有深厚命理知识的资深手相解读师。回答专业、详细且有温度，适当引用传统相书典籍内容。' },
          { role: 'user', content: prompt },
        ],
        { temperature: 0.7, maxTokens: 4096 },
      );

      setResult(llmResult);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '分析失败，请稍后重试';
      setResult(`⚠️ ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setQuestion('');
    setPalmDesc('');
    setSources([]);
  };

  return (
    <section className="relative min-h-screen py-20">
      {/* 顶部装饰 */}
      <div className="absolute inset-x-0 top-0 h-48 opacity-10 pointer-events-none" aria-hidden="true">
        <div className="h-full w-full bg-gradient-to-b from-bronze/30 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mb-8 text-center">
          <h1 className="font-kai text-3xl font-bold text-inkstone sm:text-4xl">✋ 玄机阁 · 手相分析</h1>
          <p className="mt-2 text-sm text-inkstone-soft">掌中藏乾坤 · 纹里见命运</p>
        </div>

        {!result ? (
          <Card className="border-bronze/30 bg-cream-light/90 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="font-kai text-xl text-inkstone">描述你的手相特征</CardTitle>
              <CardDescription className="text-inkstone-soft">
                描述你手掌上的纹路特征（主要线条的深浅、长短、分叉、有无特殊标记等），AI 结合手相知识库为您深度解读
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAnalyze} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-inkstone-soft">你的问题（想了解哪方面？）</label>
                  <Textarea
                    placeholder="例如：我的事业发展如何？感情方面有什么需要注意的？…"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="min-h-[60px] border-bronze/35 bg-cream-light/95 text-inkstone placeholder:text-inkstone-mute/60 focus:border-bronze"
                    rows={2}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-inkstone-soft">手相特征描述</label>
                  <div className="rounded-lg border border-bronze/20 bg-cream-dark/30 p-3 text-[11px] leading-relaxed text-inkstone-soft mb-2">
                    可从以下方面描述（选填）：<br />
                    • <b>三大主线</b>：生命线（深/浅/长/短/是否清晰）、智慧线（平直/弯曲/有无分叉）、感情线（深长/断续/末端指向）<br />
                    • <b>辅助纹</b>：事业线（有无/清晰度）、婚姻线（几条/形态）、太阳线等<br />
                    • <b>手型</b>：厚实/细长/柔软/偏红、手掌大小、手指形状<br />
                    • <b>特殊纹路</b>：有无岛纹、十字纹、星纹、断掌纹等<br />
                    • <b>惯用手</b>：左撇子/右撇子
                  </div>
                  <Textarea
                    placeholder="例如：我的生命线深长清晰，弧度较大；智慧线平直延伸到掌边；感情线深长到食指基部；事业线清晰笔直；手掌偏厚实，肤色红润……"
                    value={palmDesc}
                    onChange={(e) => setPalmDesc(e.target.value)}
                    className="min-h-[120px] border-bronze/35 bg-cream-light/95 text-inkstone placeholder:text-inkstone-mute/60 focus:border-bronze"
                    rows={5}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading || !question.trim() || !palmDesc.trim()}
                  className="w-full bg-bronze font-kai text-lg text-cream shadow-paper-md hover:bg-bronze/80 disabled:opacity-40"
                >
                  {loading ? '🔮 AI 解读中…' : '🔮 AI 分析手相'}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* 分析结果 */}
            <Card className="border-bronze/30 bg-cream-light/90 backdrop-blur-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-kai text-xl text-inkstone">✋ 手相分析结果</CardTitle>
                  <CardDescription className="text-inkstone-soft">
                    {question}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="border-bronze/40 text-inkstone hover:bg-bronze/10"
                >
                  重新分析
                </Button>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none text-inkstone leading-relaxed whitespace-pre-wrap">
                  {result}
                </div>
              </CardContent>
            </Card>

            {/* 知识来源 */}
            {sources.length > 0 && (
              <SourceCitations sources={sources} />
            )}
          </div>
        )}
      </div>
    </section>
  );
}
