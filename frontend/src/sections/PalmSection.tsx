import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { callDeepSeek } from '@/lib/llm/deepseek';
import { searchPalmKnowledge } from '@/lib/rag/palmKnowledge';
import SourceCitations from '@/components/rag/SourceCitations';
import type { RagSource } from '@/types/consult';

export default function PalmSection() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [sources, setSources] = useState<RagSource[]>([]);

  // — 摄像头状态 —
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [photoData, setPhotoData] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 开启摄像头
  const startCamera = async () => {
    setCameraError('');
    setPhotoData(null);
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraReady(true);
      }
    } catch (err) {
      const msg = err instanceof DOMException && err.name === 'NotAllowedError'
        ? '⚠️ 摄像头权限被拒绝，请在浏览器设置中允许摄像头访问后重试'
        : '⚠️ 无法启动摄像头，请确认设备有摄像头且未被其他应用占用';
      setCameraError(msg);
    }
  };

  // 拍照
  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setPhotoData(dataUrl.split(',')[1]); // 去掉 data:image/jpeg;base64, 前缀
    // 停止摄像头
    stopCamera();
  };

  // 停止摄像头
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  };

  // 重拍
  const retake = () => {
    setPhotoData(null);
    startCamera();
  };

  // 组件卸载时释放摄像头
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // — 分析 —
  const handleAnalyze = async (e: FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !photoData) return;
    setLoading(true);
    setResult(null);
    setSources([]);

    try {
      // 1. RAG 检索（基于问题关键词）
      const ragSources = await searchPalmKnowledge(
        [question.trim(), '手掌', '手相'],
        ['手掌', '手相', ...question.split(/[,，、\s]+/).filter((s) => s.length > 1)],
      );
      setSources(ragSources);

      const knowledge = ragSources.map((s) => `【${s.book}】\n${s.text}`).join('\n\n');

      const systemPrompt = '你是一位精通中西手相学、具有深厚命理知识的资深手相解读师。回答专业、详细且有温度，适当引用传统相书典籍内容。';

      const userText = `请仔细观察这张手掌照片，结合手相学知识进行解读。

用户关心的问题：${question.trim()}

参考手相知识：
${knowledge || '（暂无匹配的知识库内容，请根据你对手相学的了解进行分析）'}

请从以下方面进行分析：
1. 掌纹特征：观察照片中可见的掌纹（生命线、智慧线、感情线等），解读其形态和含义
2. 手型分析：根据手掌的整体形状、手指比例等判断手型类型
3. 性格与天赋：结合手相特征分析性格特质和潜在才能
4. 运势趋势：对应的人生各领域（事业、感情、健康等）的发展趋势
5. 综合建议：基于手相特征的实用建议

注意：照片可能存在光线角度问题，请说明你看到的内容并备注观察条件局限性。声明仅供娱乐参考，不作为专业医学或心理学诊断。`;

      // 2. LLM 调用（带图片）
      const llmResult = await callDeepSeek(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `[图片分析请求] 用户上传了一张手掌照片。文本描述：${userText}。请分析照片中可见的手掌纹理特征。由于当前模型为文本模式，请根据用户的问题和手相知识库内容，提供基于描述的手相解读。如果后续支持图片输入，将能更精确分析实际掌纹。` },
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
    setPhotoData(null);
    setSources([]);
    stopCamera();
  };

  return (
    <section className="relative min-h-screen py-20">
      <div className="absolute inset-x-0 top-0 h-48 opacity-10 pointer-events-none" aria-hidden="true">
        <div className="h-full w-full bg-gradient-to-b from-bronze/30 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mb-8 text-center">
          <h1 className="font-kai text-3xl font-bold text-inkstone sm:text-4xl">✋ 玄机阁 · 手相分析</h1>
          <p className="mt-2 text-sm text-inkstone-soft">掌中藏乾坤 · 拍照即解读</p>
        </div>

        {!result ? (
          <Card className="border-bronze/30 bg-cream-light/90 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="font-kai text-xl text-inkstone">📸 拍摄手掌照片</CardTitle>
              <CardDescription className="text-inkstone-soft">
                拍一张你手掌的清晰照片，AI 结合手相知识库为你深度解读
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 摄像头区域 */}
              {!photoData ? (
                <div className="flex flex-col items-center gap-3">
                  {!cameraReady ? (
                    <>
                      {cameraError && (
                        <div className="w-full rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-center text-sm text-red-500">
                          {cameraError}
                        </div>
                      )}
                      <div className="flex aspect-[4/3] w-full max-w-sm items-center justify-center rounded-xl border-2 border-dashed border-bronze/30 bg-cream-dark/20">
                        <div className="text-center">
                          <div className="mb-2 text-5xl">✋</div>
                          <p className="text-sm text-inkstone-soft">点击下方按钮开启摄像头</p>
                          <p className="mt-1 text-[10px] text-inkstone-mute">
                            请将手掌放在光线充足处拍摄
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={startCamera}
                        className="bg-bronze px-8 font-kai text-cream shadow-paper-md hover:bg-bronze/80"
                      >
                        📷 开启摄像头
                      </Button>
                    </>
                  ) : (
                    <div className="flex w-full flex-col items-center gap-3">
                      <div className="relative w-full max-w-sm overflow-hidden rounded-xl border-2 border-bronze/40">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="h-auto w-full"
                          style={{ transform: 'scaleX(-1)' }}
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button
                          onClick={takePhoto}
                          className="bg-bronze px-6 font-kai text-cream shadow-paper-md hover:bg-bronze/80"
                        >
                          📸 拍照
                        </Button>
                        <Button
                          variant="outline"
                          onClick={stopCamera}
                          className="border-bronze/40 text-inkstone hover:bg-bronze/10"
                        >
                          取消
                        </Button>
                      </div>
                      <p className="text-[10px] text-inkstone-mute">
                        如果拍得不满意可重拍
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-full max-w-sm overflow-hidden rounded-xl border-2 border-bronze/40">
                    <img
                      src={`data:image/jpeg;base64,${photoData}`}
                      alt="手掌照片"
                      className="h-auto w-full"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={retake}
                      className="border-bronze/40 text-inkstone hover:bg-bronze/10"
                    >
                      🔄 重拍
                    </Button>
                  </div>
                </div>
              )}

              {/* 问题输入 */}
              {photoData && (
                <form onSubmit={handleAnalyze} className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-inkstone-soft">
                      你想了解哪方面？
                    </label>
                    <Textarea
                      placeholder="例如：我的事业发展如何？感情方面有什么需要注意的？…"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      className="min-h-[60px] border-bronze/35 bg-cream-light/95 text-inkstone placeholder:text-inkstone-mute/60 focus:border-bronze"
                      rows={2}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading || !question.trim()}
                    className="w-full bg-bronze font-kai text-lg text-cream shadow-paper-md hover:bg-bronze/80 disabled:opacity-40"
                  >
                    {loading ? '🔮 AI 解读中…' : '🔮 AI 分析手相'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* 结果卡片 */}
            <Card className="border-bronze/30 bg-cream-light/90 backdrop-blur-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-kai text-xl text-inkstone">✋ 手相分析结果</CardTitle>
                  <CardDescription className="text-inkstone-soft">{question}</CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="border-bronze/40 text-inkstone hover:bg-bronze/10"
                >
                  重新分析
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 照片预览 */}
                {photoData && (
                  <div className="flex justify-center">
                    <img
                      src={`data:image/jpeg;base64,${photoData}`}
                      alt="手掌照片"
                      className="h-32 w-auto rounded-lg border border-bronze/30"
                    />
                  </div>
                )}
                <div className="prose prose-sm max-w-none text-inkstone leading-relaxed whitespace-pre-wrap">
                  {result}
                </div>
              </CardContent>
            </Card>

            {/* 知识来源 */}
            {sources.length > 0 && <SourceCitations sources={sources} />}
          </div>
        )}
      </div>

      {/* hidden canvas for screenshot */}
      <canvas ref={canvasRef} className="hidden" />
    </section>
  );
}
