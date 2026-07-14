import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useYijing } from '@/hooks/useYijing';
import GuaDisplay from '@/components/yijing/GuaDisplay';
import CoinToss from '@/components/yijing/CoinToss';
import SourceCitations from '@/components/rag/SourceCitations';
import RitualLoader from '@/components/RitualLoader';
import type { CoinFace } from '@/types/yijing';

const YAO_NAMES = ['初', '二', '三', '四', '五', '上'];

function randFace(): CoinFace {
  return Math.random() < 0.5 ? 1 : 0;
}

/** 实时显示已投掷出的爻（自下而上：初爻在下、上爻在上） */
function YaoPreview({ yaoValues }: { yaoValues: number[] }) {
  if (yaoValues.length === 0) {
    return (
      <div className="rounded-lg border border-element/40 bg-[#0a0710]/60 px-6 py-4 text-center text-xs text-muted-foreground/70">
        尚未投掷，静心默念您的问题
      </div>
    );
  }
  const ordered = [...yaoValues].reverse();
  return (
    <div className="space-y-1.5 rounded-lg border border-element/40 bg-[#0a0710]/60 px-6 py-4">
      {ordered.map((v, idx) => {
        const posIndex = yaoValues.length - 1 - idx;
        const isYang = v === 7 || v === 9;
        const isChanging = v === 6 || v === 9;
        return (
          <div key={idx} className="flex items-center gap-2">
            <span className="w-6 text-right text-[10px] text-muted-foreground">{YAO_NAMES[posIndex]}</span>
            <div
              className={`flex gap-1.5 ${
                isChanging ? 'drop-shadow-[0_0_6px_rgb(var(--glow-rgb)/0.7)]' : ''
              }`}
            >
              {isYang ? (
                <div className="h-1.5 w-20 rounded bg-amber-400" />
              ) : (
                <>
                  <div className="h-1.5 w-[36px] rounded bg-amber-600/70" />
                  <div className="h-1.5 w-[36px] rounded bg-amber-600/70" />
                </>
              )}
            </div>
            {isChanging && (
              <span className="text-[10px] text-element">{v === 6 ? '×' : '○'}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function YijingSection() {
  const { loading, error, result, divinate, reset } = useYijing();

  const [question, setQuestion] = useState('');
  const [method, setMethod] = useState<'coins' | 'numbers'>('coins');
  const [num1, setNum1] = useState('');
  const [num2, setNum2] = useState('');
  const [num3, setNum3] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const [yaoValues, setYaoValues] = useState<number[]>([]);
  const [coins, setCoins] = useState<CoinFace[]>([null, null, null]);
  const [shaking, setShaking] = useState(false);

  const timerRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const clearTimers = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const doDivinate = (values: number[]) => {
    divinate({ question, method: 'coins', yao_values: values, with_llm: true, with_rag: true });
  };

  const doNumbers = () => {
    divinate({
      question,
      method: 'numbers',
      num1: parseInt(num1, 10),
      num2: parseInt(num2, 10),
      num3: parseInt(num3, 10),
      with_llm: true,
      with_rag: true,
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setSubmitted(true);
    if (method === 'numbers') {
      doNumbers();
    }
  };

  const handleToss = () => {
    if (shaking || yaoValues.length >= 6) return;
    setShaking(true);
    intervalRef.current = window.setInterval(() => {
      setCoins([randFace(), randFace(), randFace()]);
    }, 90);
    timerRef.current = window.setTimeout(() => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      const finalCoins: CoinFace[] = [randFace(), randFace(), randFace()];
      setCoins(finalCoins);
      setShaking(false);
      const value = finalCoins.reduce<number>((s, f) => s + (f === 1 ? 3 : 2), 0);
      const next = [...yaoValues, value];
      setYaoValues(next);
      if (next.length === 6) {
        doDivinate(next);
      }
    }, 900);
  };

  const handleTossAll = () => {
    if (shaking || yaoValues.length >= 6) return;
    setShaking(true);
    const local: number[] = [...yaoValues];
    intervalRef.current = window.setInterval(() => {
      const finalCoins: CoinFace[] = [randFace(), randFace(), randFace()];
      setCoins(finalCoins);
      const value = finalCoins.reduce<number>((s, f) => s + (f === 1 ? 3 : 2), 0);
      local.push(value);
      setYaoValues([...local]);
      if (local.length >= 6) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setShaking(false);
        doDivinate([...local]);
      }
    }, 650);
  };

  const handleReset = () => {
    clearTimers();
    reset();
    setSubmitted(false);
    setQuestion('');
    setMethod('coins');
    setNum1('');
    setNum2('');
    setNum3('');
    setYaoValues([]);
    setCoins([null, null, null]);
    setShaking(false);
  };

  const currentLineName = YAO_NAMES[yaoValues.length] ?? '上';

  return (
    <section className="relative min-h-screen py-24">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0710] via-[#0d0814] to-[#0a0710]" />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mb-10 text-center">
          <h1 className="font-kai text-3xl font-bold text-gold title-glow sm:text-4xl">玄机阁 · 易经占卜</h1>
          <p className="mt-2 text-sm text-muted-foreground">金钱课起卦 · 龟壳摇卦定乾坤</p>
        </div>

        {/* ===== 起卦表单 ===== */}
        {!submitted && (
          <Card className="mx-auto max-w-2xl border-element/25 bg-card/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-kai text-gold">起卦</CardTitle>
              <CardDescription className="text-muted-foreground">心中默念您想问的事情，再掷铜钱起卦</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="question" className="text-foreground/90">请说出您想问的事情</Label>
                  <Textarea
                    id="question"
                    placeholder="例如：近期事业发展如何？..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="min-h-[80px] border-element/30 bg-[#0a0710]/60 text-foreground placeholder:text-muted-foreground/60 focus:border-element"
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-foreground/90">起卦方式</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setMethod('coins')}
                      className={`w-full rounded-md border px-3 py-2 text-sm transition ${
                        method === 'coins'
                          ? 'border-element bg-element font-kai text-void'
                          : 'border-element/40 bg-[#0a0710]/40 text-muted-foreground hover:border-element/60'
                      }`}
                    >
                      铜钱投掷
                    </button>
                    <button
                      type="button"
                      onClick={() => setMethod('numbers')}
                      className={`w-full rounded-md border px-3 py-2 text-sm transition ${
                        method === 'numbers'
                          ? 'border-element bg-element font-kai text-void'
                          : 'border-element/40 bg-[#0a0710]/40 text-muted-foreground hover:border-element/60'
                      }`}
                    >
                      数字起卦
                    </button>
                  </div>
                </div>

                {method === 'numbers' && (
                  <div className="grid gap-4 sm:grid-cols-3">
                    {[
                      { id: 'num1', label: '数字一 (1-100)', val: num1, set: setNum1 },
                      { id: 'num2', label: '数字二 (1-100)', val: num2, set: setNum2 },
                      { id: 'num3', label: '数字三 (1-100)', val: num3, set: setNum3 },
                    ].map((f) => (
                      <div key={f.id} className="space-y-1.5">
                        <Label htmlFor={f.id} className="text-foreground/90">{f.label}</Label>
                        <Input
                          id={f.id}
                          type="number"
                          placeholder="如 3"
                          min={1}
                          max={100}
                          value={f.val}
                          onChange={(e) => f.set(e.target.value)}
                          className="border-element/30 bg-[#0a0710]/60 text-foreground placeholder:text-muted-foreground/60 focus:border-element"
                          required={method === 'numbers'}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {error && (
                  <div className="rounded bg-red-950/40 p-3 text-sm text-red-300">{error}</div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-element font-kai text-void shadow-glow-md transition hover:bg-element/80"
                >
                  {method === 'coins' ? '开始摇卦' : '开始占卜'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* ===== 铜钱投掷阶段 ===== */}
        {submitted && method === 'coins' && !result && (
          <div className="space-y-6">
            <p className="text-center text-sm text-muted-foreground">所问：{question}</p>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-element/25 bg-card/60 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <CoinToss
                    coins={coins}
                    shaking={shaking}
                    currentLineName={currentLineName}
                    onToss={handleToss}
                    done={yaoValues.length >= 6}
                  />
                </CardContent>
              </Card>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground">已卜之爻（自下而上）</h4>
                <YaoPreview yaoValues={yaoValues} />
                <Button
                  type="button"
                  onClick={handleTossAll}
                  disabled={shaking || yaoValues.length >= 6}
                  className="w-full border border-element/50 bg-[#0a0710]/40 text-element hover:bg-element/10"
                >
                  一键连摇六爻
                </Button>
                <p className="text-xs text-muted-foreground/70">
                  每爻摇龟壳一次，三枚铜钱自壳中而出；字面为阴、背面为阳
                </p>
              </div>
            </div>

            {loading && (
              <RitualLoader variant="yijing" label="六爻既成，正在解卦…" sublabel="感而遂通 · 寂然不动" />
            )}
          </div>
        )}

        {/* ===== 数字起卦加载 ===== */}
        {submitted && method === 'numbers' && !result && (
          <RitualLoader variant="yijing" label="正在起卦解卦…" sublabel="感而遂通 · 寂然不动" />
        )}

        {/* ===== 结果展示 ===== */}
        {result && !loading && (
          <div className="space-y-8 animate-rise">
            <Card className="border-element/25 bg-card/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="font-kai text-lg text-gold">卦象</CardTitle>
                <CardDescription className="text-muted-foreground">问题: {result.gua.question}</CardDescription>
              </CardHeader>
              <CardContent>
                <GuaDisplay gua={result.gua} />
              </CardContent>
            </Card>

            {result.llm_interpretation && (
              <Card className="border-element/25 bg-card/60 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-kai text-lg text-gold">
                    <span>🤖</span> AI 解卦
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    结合卦象爻辞与您的问题生成的个性化解读
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-invert prose-sm max-w-none prose-headings:text-gold prose-p:text-foreground/90 prose-strong:text-element prose-li:text-foreground/90">
                    {result.llm_interpretation.split('\n').map((line, i) => {
                      if (line.startsWith('## ')) {
                        return (
                          <h2 key={i} className="mt-4 mb-2 text-base font-bold text-gold">
                            {line.replace('## ', '')}
                          </h2>
                        );
                      }
                      if (line.startsWith('# ')) {
                        return (
                          <h1 key={i} className="mt-5 mb-3 text-lg font-bold text-element">
                            {line.replace('# ', '')}
                          </h1>
                        );
                      }
                      if (line.startsWith('### ')) {
                        return (
                          <h3 key={i} className="mt-3 mb-1 text-sm font-semibold text-gold/80">
                            {line.replace('### ', '')}
                          </h3>
                        );
                      }
                      if (line.startsWith('- ')) {
                        return (
                          <li key={i} className="ml-4 text-sm text-foreground/90 list-disc">
                            {line.replace('- ', '')}
                          </li>
                        );
                      }
                      if (line.trim() === '') return <br key={i} />;
                      return (
                        <p key={i} className="text-sm leading-relaxed text-foreground/90">
                          {line}
                        </p>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {result.rag_sources && result.rag_sources.length > 0 && (
              <Card className="border-element/25 bg-card/60 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <SourceCitations sources={result.rag_sources} />
                </CardContent>
              </Card>
            )}

            <div className="text-center">
              <Button
                variant="outline"
                onClick={handleReset}
                className="border-element/50 text-element hover:bg-element/10"
              >
                重新占卜
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
