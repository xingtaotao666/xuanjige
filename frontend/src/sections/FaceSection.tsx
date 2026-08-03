import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { analyzeImage } from '@/lib/llm/vision';
import { searchFaceKnowledge } from '@/lib/rag/faceKnowledge';
import SourceCitations from '@/components/rag/SourceCitations';
import type { RagSource } from '@/types/consult';

function CameraCapture({
  onPhoto,
  placeholder,
}: {
  onPhoto: (base64: string) => void;
  placeholder: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  const start = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setReady(true);
      }
    } catch (err) {
      setError(
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? '摄像头权限被拒绝，请在浏览器设置中允许后重试'
          : '无法启动摄像头，请确认设备有摄像头',
      );
    }
  };

  const take = () => {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c) return;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(v, 0, 0);
    onPhoto(c.toDataURL('image/jpeg', 0.85).split(',')[1]);
    stop();
  };

  const stop = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setReady(false);
  };

  useEffect(() => () => stop(), []);

  if (error) return <div className="text-sm text-red-500 text-center py-4">{error}</div>;

  return (
    <div className="flex flex-col items-center gap-3">
      {ready ? (
        <>
          <div className="relative w-full max-w-sm overflow-hidden rounded-xl border-2 border-bronze/40">
            <video ref={videoRef} autoPlay playsInline muted className="h-auto w-full" />
          </div>
          <div className="flex gap-3">
            <Button onClick={take} className="bg-bronze px-6 font-kai text-cream shadow-paper-md hover:bg-bronze/80">
              拍照
            </Button>
            <Button variant="outline" onClick={stop} className="border-bronze/40 text-inkstone hover:bg-bronze/10">
              取消
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="flex aspect-[4/3] w-full max-w-sm items-center justify-center rounded-xl border-2 border-dashed border-bronze/30 bg-cream-dark/20">
            <div className="text-center">
              <div className="mb-2 text-5xl">{placeholder}</div>
              <p className="text-sm text-inkstone-soft">请将面部放在光线充足处</p>
            </div>
          </div>
          <Button onClick={start} className="bg-bronze px-8 font-kai text-cream shadow-paper-md hover:bg-bronze/80">
            开启前置摄像头
          </Button>
        </>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

export default function FaceSection() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [sources, setSources] = useState<RagSource[]>([]);
  const [photoData, setPhotoData] = useState<string | null>(null);

  const handlePhoto = (b64: string) => setPhotoData(b64);

  const handleAnalyze = async (e: FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !photoData) return;
    setLoading(true);
    setResult(null);
    setSources([]);

    try {
      const ragSources = await searchFaceKnowledge(
        [question.trim(), '面相', '五官', '三停', '十二宫'],
        ['面相', '五官', '三停', '十二宫', ...question.split(/[,，、\s]+/).filter((s) => s.length > 1)],
      );
      setSources(ragSources);

      const knowledge = ragSources.map((s) => `【${s.book}】\n${s.text}`).join('\n\n');

      const systemPrompt =
        '你是一位精通麻衣神相、柳庄相法、相理衡真等传统面相学经典的资深面相解读师。回答专业、详细、有温度，适当引用古籍原文。声明仅供娱乐参考。';

      const userText = `请分析这张面部照片，结合面相学进行解读。

用户问题：${question.trim()}

参考古籍知识：
${knowledge || '（暂无匹配的古籍内容，请根据面相学知识分析）'}

请从以下方面分析：
1. 整体神韵：面部气色、神态的第一印象
2. 五官特征：眉/眼/鼻/口/耳的形态和含义
3. 三停分析：上停（额头）/中停（鼻区）/下停（下巴）的运势解读
4. 十二宫要点：相关宫位的吉凶提示
5. 综合建议：基于面相特征的实用参考`;

      const response = await analyzeImage({
        imageBase64: photoData,
        mimeType: 'image/jpeg',
        systemPrompt,
        userText,
        knowledge,
      });

      setResult(response.text);
    } catch (err) {
      setResult(`分析失败：${err instanceof Error ? err.message : '请稍后重试'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setQuestion('');
    setPhotoData(null);
    setSources([]);
  };

  return (
    <section className="relative min-h-screen py-20">
      <div className="absolute inset-x-0 top-0 h-48 opacity-10 pointer-events-none" aria-hidden="true">
        <div className="h-full w-full bg-gradient-to-b from-bronze/30 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mb-8 text-center">
          <h1 className="font-kai text-3xl font-bold text-inkstone sm:text-4xl">玄机阁 · 面相分析</h1>
          <p className="mt-2 text-sm text-inkstone-soft">相由心生 · 镜观祸福</p>
        </div>

        {!result ? (
          <Card className="border-bronze/30 bg-cream-light/90 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="font-kai text-xl text-inkstone">📸 拍摄面部照片</CardTitle>
              <CardDescription className="text-inkstone-soft">
                用前置摄像头拍一张清晰的面部正面照，AI 结合《麻衣神相》《柳庄相法》等古籍为你深度解读
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!photoData ? (
                <CameraCapture onPhoto={handlePhoto} placeholder="🧑" />
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-full max-w-sm overflow-hidden rounded-xl border-2 border-bronze/40">
                    <img src={`data:image/jpeg;base64,${photoData}`} alt="面部照片" className="h-auto w-full" />
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setPhotoData(null)} className="border-bronze/40 text-inkstone hover:bg-bronze/10">
                      重拍
                    </Button>
                  </div>
                </div>
              )}

              {photoData && (
                <form onSubmit={handleAnalyze} className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-inkstone-soft">你想了解哪方面？</label>
                    <Textarea
                      placeholder="例如：我最近的事业运势如何？感情方面有什么需要注意的？…"
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
                    {loading ? '🔮 AI 解读中…' : '🔮 AI 分析面相'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="border-bronze/30 bg-cream-light/90 backdrop-blur-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-kai text-xl text-inkstone">面相分析结果</CardTitle>
                  <CardDescription className="text-inkstone-soft">{question}</CardDescription>
                </div>
                <Button variant="outline" onClick={handleReset} className="border-bronze/40 text-inkstone hover:bg-bronze/10">
                  重新分析
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {photoData && (
                  <div className="flex justify-center">
                    <img src={`data:image/jpeg;base64,${photoData}`} alt="面部照片" className="h-32 w-auto rounded-lg border border-bronze/30" />
                  </div>
                )}
                <div className="prose prose-sm max-w-none text-inkstone leading-relaxed whitespace-pre-wrap">
                  {result}
                </div>
              </CardContent>
            </Card>
            {sources.length > 0 && <SourceCitations sources={sources} />}
          </div>
        )}
      </div>
    </section>
  );
}
