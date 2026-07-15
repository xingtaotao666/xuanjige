import { useState, useRef, useCallback, useMemo, type FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useTarot } from '@/hooks/useTarot';
import TarotResultView from '@/components/tarot/TarotResultView';
import { useHistory } from '@/hooks/useHistory';
import {
  buildShareUrl,
  genId,
  makeRecordKey,
  type InputSnapshot,
} from '@/lib/historyStore';
import type { SpreadType, TarotCardPlacement } from '@/types/tarot';
import { SPREAD_POSITIONS, ALL_TAROT_CARDS } from '@/lib/tarot/cards';

/* ==================== 步骤定义 ==================== */
type Step =
  | 'prepare'    // 事前准备
  | 'question'   // 定问题
  | 'spread'     // 选牌阵
  | 'shuffle'    // 洗牌
  | 'cut'        // 切牌
  | 'draw'       // 抽牌摆阵
  | 'reveal'     // 翻牌解读
  | 'complete';  // 收尾（AI 解读）

const SPREAD_OPTIONS: { type: SpreadType; label: string; count: number; desc: string }[] = [
  { type: 'single', label: '单张牌', count: 1, desc: '快速指引 · 一针见血' },
  { type: 'three', label: '三张牌', count: 3, desc: '过去 · 现在 · 未来' },
  { type: 'cross', label: '六芒星', count: 6, desc: '全面剖析 · 深入洞察' },
  { type: 'celtic', label: '凯尔特十字', count: 10, desc: '终极详占 · 无所不包' },
];

/** Fisher-Yates 洗牌 */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ==================== 主组件 ==================== */
export default function TarotSection() {
  const { loading, error, result, divinate, reset } = useTarot();
  const { add } = useHistory();

  // — 基础状态 —
  const [step, setStep] = useState<Step>('prepare');
  const [question, setQuestion] = useState('');
  const [spread, setSpread] = useState<SpreadType>('three');
  const [feedback, setFeedback] = useState('');

  // — 洗牌 / 切牌动画 —
  const [shuffling, setShuffling] = useState(false);
  const [cutting, setCutting] = useState(false);
  const shuffleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // — 3×3 抽牌矩阵 —
  const [gridCards, setGridCards] = useState<TarotCardPlacement[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [selectionStep, setSelectionStep] = useState(0); // 当前选的是第几张
  const remainingDeckRef = useRef<TarotCardPlacement[]>([]); // 剩余牌堆，每次选完补充新牌

  // — 最终确定的手牌（按选中顺序） —
  const drawnCards = useMemo(() => {
    const positions = SPREAD_POSITIONS[spread] || ['当前指引'];
    return selectedIndices.slice(0, positions.length).map((gridIdx, i) => ({
      ...gridCards[gridIdx],
      position: positions[i] || `位置${i + 1}`,
    }));
  }, [gridCards, selectedIndices, spread]);

  // — 翻牌状态 —
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  // — 提交 AI 解读（只在进入 complete 时调用） —
  const doDivinate = useCallback(() => {
    if (question.trim()) {
      divinate({ question: question.trim(), spread, with_llm: true, with_rag: true });
    }
  }, [question, spread, divinate]);

  // — 重置一切 —
  const handleReset = () => {
    if (shuffleTimer.current) clearTimeout(shuffleTimer.current);
    if (cutTimer.current) clearTimeout(cutTimer.current);
    reset();
    setStep('prepare');
    setFeedback('');
    setQuestion('');
    setSpread('three');
    setShuffling(false);
    setCutting(false);
    setGridCards([]);
    setSelectedIndices([]);
    setSelectionStep(0);
    remainingDeckRef.current = [];
    setRevealed(new Set());
  };

  /* ================================================================
     步骤过渡函数
     ================================================================ */

  const goSpread = () => setStep('spread');

  const startShuffle = () => {
    setStep('shuffle');
    setShuffling(true);
    shuffleTimer.current = setTimeout(() => {
      setShuffling(false);
      setStep('cut');
      setCutting(true);
      cutTimer.current = setTimeout(() => {
        setCutting(false);

        // 切牌完成 → 准备 3×3 牌矩阵
        const shuffled = shuffle(ALL_TAROT_CARDS);
        const grid: TarotCardPlacement[] = shuffled.slice(0, 9).map((card) => ({
          position: '',
          card,
          orientation: Math.random() < 0.5 ? 'upright' : 'reversed',
        }));
        // 剩下的牌存起来，每次选完补充新牌
        remainingDeckRef.current = shuffle(shuffled.slice(9)).map((card) => ({
          position: '',
          card,
          orientation: Math.random() < 0.5 ? 'upright' : 'reversed',
        }));
        setGridCards(grid);
        setSelectedIndices([]);
        setSelectionStep(0);
        setRevealed(new Set());
        setStep('draw');
      }, 2500);
    }, 3000);
  };

  /** 从 3×3 矩阵中选择一张牌，然后刷新剩余位置的牌面 */
  const selectGridCard = (gridIdx: number) => {
    const positions = SPREAD_POSITIONS[spread] || ['当前指引'];
    if (selectedIndices.includes(gridIdx)) return; // 已选
    if (selectionStep >= positions.length) return; // 已选满

    // 计算更新后的选中集合（包含本次点击）
    const updatedSelected = [...selectedIndices, gridIdx];
    setSelectedIndices(updatedSelected);
    const nextStep = selectionStep + 1;

    // 刷新未选中的牌格：从剩余牌堆中抽新牌替换
    const remaining = remainingDeckRef.current;
    if (remaining.length > 0) {
      setGridCards((prev) => {
        const next = [...prev];
        // 为每个未选中的位置换上新鲜牌（用 updatedSelected 保证正确）
        const toReplace: number[] = [];
        for (let i = 0; i < next.length; i++) {
          if (!updatedSelected.includes(i)) {
            toReplace.push(i);
          }
        }
        const takeCount = Math.min(toReplace.length, remaining.length);
        const fresh = remaining.splice(0, takeCount);
        remainingDeckRef.current = remaining;
        for (let j = 0; j < takeCount; j++) {
          next[toReplace[j]] = fresh[j];
        }
        return next;
      });
    }

    // 选满后短暂延迟进入翻牌
    if (nextStep >= positions.length) {
      setTimeout(() => {
        setStep('reveal');
      }, 600);
    }
    setSelectionStep(nextStep);
  };

  const toggleReveal = (idx: number) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      next.add(idx);
      const positions = SPREAD_POSITIONS[spread] || ['当前指引'];
      if (next.size >= positions.length) {
        setTimeout(() => setStep('complete'), 1200);
      }
      return next;
    });
  };

  /** 进入 complete 时触发 AI 解读 */
  const goComplete = () => {
    setStep('complete');
    if (!result) {
      doDivinate();
    }
  };

  /* ================================================================
     保存 / 分享
     ================================================================ */

  const buildInput = (): InputSnapshot => ({ question, method: 'coins' } as InputSnapshot);

  const handleSave = () => {
    if (!result) return;
    const key = makeRecordKey('tarot', buildInput());
    add({
      id: genId(),
      key,
      type: 'tarot',
      createdAt: Date.now(),
      title: question.trim().slice(0, 20) || '塔罗占卜',
      input: buildInput(),
      result,
    });
    setFeedback('已存入本地记忆 ✦');
  };

  const handleShare = async () => {
    if (!result) return;
    const url = buildShareUrl({ v: 1, type: 'tarot', createdAt: Date.now(), input: buildInput(), result });
    try {
      await navigator.clipboard.writeText(url);
      setFeedback('分享链接已复制到剪贴板 🔗');
    } catch { setFeedback('复制失败'); }
  };

  /* ================================================================
     渲染：步骤指示器
     ================================================================ */
  const steps: { key: Step; label: string }[] = [
    { key: 'prepare', label: '准备' },
    { key: 'question', label: '定问题' },
    { key: 'spread', label: '选牌阵' },
    { key: 'shuffle', label: '洗牌' },
    { key: 'cut', label: '切牌' },
    { key: 'draw', label: '抽牌' },
    { key: 'reveal', label: '翻牌' },
    { key: 'complete', label: '解读' },
  ];
  const stepIdx = steps.findIndex((s) => s.key === step);
  const spreadInfo = SPREAD_OPTIONS.find((o) => o.type === spread);
  const needTotal = spreadInfo?.count || 0;

  return (
    <section className="relative min-h-screen py-20">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0710] via-[#0d0814] to-[#0a0710]" />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
        {/* 标题 */}
        <div className="mb-6 text-center">
          <h1 className="font-kai text-3xl font-bold text-gold title-glow sm:text-4xl">
            {step === 'complete' ? '塔罗解读' : '玄机阁 · 塔罗占卜'}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">78 张韦特塔罗 · 洞见过去现在未来</p>
        </div>

        {/* ———— 步骤指示器 ———— */}
        <div className="mb-10 flex items-center justify-center gap-1 sm:gap-2">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-1 sm:gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold transition sm:h-8 sm:w-8 sm:text-xs ${
                  i === stepIdx
                    ? 'bg-element text-void shadow-glow-sm'
                    : i < stepIdx
                      ? 'bg-element/20 text-element/60'
                      : 'bg-card/60 text-muted-foreground/40'
                }`}
              >
                {i < stepIdx ? '✓' : i + 1}
              </div>
              <span
                className={`hidden text-[10px] sm:inline ${
                  i === stepIdx ? 'text-element' : i < stepIdx ? 'text-element/60' : 'text-muted-foreground/40'
                }`}
              >
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <div className={`mx-1 h-px w-3 sm:w-5 ${i < stepIdx ? 'bg-element/30' : 'bg-element/10'}`} />
              )}
            </div>
          ))}
        </div>

        {/* ================================================================
            STEP 1: 事前准备
            ================================================================ */}
        {step === 'prepare' && (
          <Card className="mx-auto max-w-lg border-element/25 bg-card/60 backdrop-blur-sm">
            <CardContent className="py-12 text-center">
              <div className="mb-6 text-6xl animate-float">🔮</div>
              <h2 className="mb-3 font-kai text-2xl text-gold">塔罗占卜 · 事前准备</h2>
              <div className="mx-auto max-w-sm space-y-3 text-left text-sm text-muted-foreground/90">
                <p>❶ &nbsp; 找一个安静的环境，放下杂念</p>
                <p>❷ &nbsp; 全程保持内心专注，你的意念会通过选择传达给塔罗</p>
                <p>❸ &nbsp; 问题越具体，解读越有深度</p>
                <p>❹ &nbsp; 以开放的心态接受塔罗的指引</p>
              </div>
              <div className="mt-8 flex justify-center gap-2">
                <Button variant="ghost" onClick={() => { reset(); setStep('question'); }}
                  className="text-element hover:bg-element/10">
                  我准备好了，开始占卜
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ================================================================
            STEP 2: 定问题
            ================================================================ */}
        {step === 'question' && (
          <Card className="mx-auto max-w-2xl border-element/25 bg-card/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-kai text-gold">请说出您的问题</CardTitle>
              <CardDescription className="text-muted-foreground">
                将您心中所念凝练为一句话，塔罗将据此回应
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e: FormEvent) => { e.preventDefault(); goSpread(); }}
                className="space-y-5"
              >
                <Textarea
                  placeholder="例如：近期事业发展如何？我和他/她的关系走向？…"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="min-h-[100px] border-element/30 bg-[#0a0710]/60 text-foreground placeholder:text-muted-foreground/60 focus:border-element"
                  rows={4}
                  required
                  autoFocus
                />
                <Button
                  type="submit"
                  className="w-full bg-element font-kai text-void shadow-glow-md hover:bg-element/80"
                >
                  下一步
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* ================================================================
            STEP 3: 选牌阵
            ================================================================ */}
        {step === 'spread' && (
          <Card className="mx-auto max-w-2xl border-element/25 bg-card/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-kai text-gold">选择牌阵</CardTitle>
              <CardDescription className="text-muted-foreground">
                不同牌阵揭示不同深度的信息，请根据你的问题选择
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                {SPREAD_OPTIONS.map((opt) => (
                  <button
                    key={opt.type}
                    onClick={() => setSpread(opt.type)}
                    className={`rounded-xl border p-4 text-left transition ${
                      spread === opt.type
                        ? 'border-element bg-element/10 shadow-glow-sm'
                        : 'border-element/30 bg-card/40 hover:border-element/60'
                    }`}
                  >
                    <div className="flex items-baseline justify-between">
                      <span className="font-kai text-base text-gold">{opt.label}</span>
                      <span className="text-[10px] text-muted-foreground">{opt.count}张</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground/80">{opt.desc}</p>
                  </button>
                ))}
              </div>
              <p className="text-center text-xs text-muted-foreground/70 animate-rise">
                已选：{spreadInfo?.label || spread} · {needTotal}张
              </p>
              <Button
                onClick={() => { startShuffle(); }}
                className="w-full bg-element font-kai text-void shadow-glow-md hover:bg-element/80"
              >
                开始仪式 · 洗牌
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ================================================================
            STEP 4: 洗牌（自动动画 + 手动点击触发）
            ================================================================ */}
        {step === 'shuffle' && (
          <div className="flex flex-col items-center gap-8">
            <div className="text-center">
              <p className="font-kai text-lg text-gold/90">集中精神 · 洗牌</p>
              <p className="mt-1 text-xs text-muted-foreground/70">在心中默念您的问题，感受牌的能量</p>
            </div>

            {/* 牌叠动画 */}
            <div className="relative h-48 w-32">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={`card-stack-layer tarot-back h-48 w-32 ${
                    shuffling ? 'animate-shuffle-card' : ''
                  }`}
                  style={{
                    top: `${i * 2}px`,
                    left: `${i * 2}px`,
                    zIndex: 5 - i,
                    animationDelay: `${i * 0.05}s`,
                  }}
                />
              ))}
            </div>

            <Button
              onClick={startShuffle}
              disabled={shuffling}
              className="bg-element px-10 font-kai text-void shadow-glow-md hover:bg-element/80"
            >
              点击洗牌
            </Button>
          </div>
        )}

        {/* ================================================================
            STEP 5: 切牌（自动动画）
            ================================================================ */}
        {step === 'cut' && (
          <div className="flex flex-col items-center gap-8">
            <div className="text-center">
              <p className="font-kai text-lg text-gold/90">切牌 · 分三叠</p>
              <p className="mt-1 text-xs text-muted-foreground/70">将牌分为三叠，再由直觉合并</p>
            </div>

            <div className="flex items-end gap-6">
              {/* 左叠 */}
              <div className="flex flex-col items-center gap-2">
                <div className={`tarot-back h-32 w-20 ${cutting ? 'animate-float' : ''}`} />
                <span className="text-xs text-muted-foreground/50">左</span>
              </div>
              {/* 中叠（原牌叠） */}
              <div className="flex flex-col items-center gap-2">
                <div className={`tarot-back h-40 w-24 ${cutting ? 'animate-deck-float' : ''}`}
                  style={{ animationDelay: '0.3s' }} />
                <span className="text-xs text-muted-foreground/50">中</span>
              </div>
              {/* 右叠 */}
              <div className="flex flex-col items-center gap-2">
                <div className={`tarot-back h-28 w-20 ${cutting ? 'animate-float' : ''}`}
                  style={{ animationDelay: '0.6s' }} />
                <span className="text-xs text-muted-foreground/50">右</span>
              </div>
            </div>

            <p className="animate-breathe text-sm text-element/70">
              {cutting ? '牌的能量正在融合…' : '切牌完成'}
            </p>
          </div>
        )}

        {/* ================================================================
            STEP 6: 抽牌摆阵 — 3×3 矩阵
            ================================================================ */}
        {step === 'draw' && gridCards.length > 0 && (
          <div className="flex flex-col items-center gap-6">
            <div className="text-center">
              <p className="font-kai text-lg text-gold/90">凭直觉选牌</p>
              <p className="text-xs text-muted-foreground/70">
                从 9 张牌中选出 {needTotal} 张 · 已选 {selectionStep}/{needTotal}
              </p>
            </div>

            {/* 3×3 牌矩阵 */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {gridCards.map((_, gridIdx) => {
                const isSelected = selectedIndices.includes(gridIdx);
                const selectOrder = selectedIndices.indexOf(gridIdx);
                const isActive = !isSelected && selectionStep < needTotal;

                return (
                  <div key={gridIdx} className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => selectGridCard(gridIdx)}
                      disabled={!isActive}
                      className={`card-perspective h-32 w-22 sm:h-40 sm:w-28 transition-all duration-300 ${
                        isActive
                          ? 'cursor-pointer hover:scale-105 hover:shadow-glow-lg'
                          : isSelected
                            ? 'cursor-default opacity-40 scale-95'
                            : 'cursor-default'
                      } ${!isActive && !isSelected ? 'opacity-30' : ''}`}
                    >
                      <div className={`card-inner h-full w-full ${isSelected ? 'card-flipped' : ''}`}>
                        {/* 背面（未选时显示） */}
                        <div className="card-back tarot-back flex items-center justify-center rounded-xl border border-element/20">
                          <span className="font-kai text-xs text-gold/50">?</span>
                        </div>
                        {/* 正面（选中后显示牌面） */}
                        <div className="card-front flex items-center justify-center rounded-xl border border-element/30 bg-card p-1 sm:p-2">
                          <div className="text-center">
                            <div className="text-[11px] sm:text-sm font-kai font-bold text-gold leading-tight">
                              {gridCards[gridIdx].card.nameCn}
                            </div>
                            <div className="mt-0.5 text-[8px] sm:text-[10px] text-muted-foreground/70">
                              {gridCards[gridIdx].orientation === 'upright' ? '正位' : '逆位'}
                            </div>
                            {isSelected && (
                              <div className="mt-0.5 text-[9px] sm:text-[11px] text-element/80">
                                ← 第{selectOrder + 1}张
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* 进度条 */}
            <div className="flex w-full max-w-xs items-center gap-2">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-card/60">
                <div
                  className="h-full rounded-full bg-element transition-all duration-500"
                  style={{ width: `${(selectionStep / needTotal) * 100}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground/70">
                {selectionStep}/{needTotal}
              </span>
            </div>

            {/* 已选牌预览 */}
            {selectionStep > 0 && (
              <div className="flex flex-wrap justify-center gap-2 animate-rise">
                {selectedIndices.map((gridIdx, i) => (
                  <div key={gridIdx} className="flex flex-col items-center gap-0.5">
                    <div className="flex h-20 w-14 items-center justify-center rounded-lg border border-element/25 bg-card/70 p-1 text-center">
                      <div>
                        <p className="text-[9px] font-bold text-gold leading-tight">
                          {gridCards[gridIdx].card.nameCn}
                        </p>
                        <p className="text-[8px] text-muted-foreground">
                          {gridCards[gridIdx].orientation === 'upright' ? '正位' : '逆位'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[9px] text-element/70">{SPREAD_POSITIONS[spread]?.[i] || `#${i + 1}`}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================================================================
            STEP 7: 翻牌解读
            ================================================================ */}
        {step === 'reveal' && (
          <div className="flex flex-col items-center gap-6">
            <div className="text-center">
              <p className="font-kai text-lg text-gold/90">翻牌 · 逐张揭示</p>
              <p className="text-xs text-muted-foreground/70">点击牌面 · 揭开塔罗的启示</p>
            </div>

            <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
              {drawnCards.map((c, i) => {
                const isRev = revealed.has(i);
                return (
                  <div key={i} className="flex w-28 flex-col items-center gap-1.5">
                    <button
                      onClick={() => toggleReveal(i)}
                      disabled={isRev}
                      className="card-perspective h-40 w-28"
                    >
                      <div className={`card-inner h-full w-full ${isRev ? 'card-flipped' : ''}`}>
                        {/* 背面 */}
                        <div className="card-back tarot-back flex items-center justify-center rounded-xl">
                          <span className="font-kai text-lg text-gold/40">{i + 1}</span>
                        </div>
                        {/* 正面 */}
                        <div className="card-front flex items-center justify-center rounded-xl border border-element/30 bg-card p-2">
                          <div className="text-center">
                            <div className="text-sm font-kai font-bold text-gold leading-tight">{c.card.nameCn}</div>
                            <div className="mt-1 text-[10px] text-muted-foreground/70">
                              {c.orientation === 'upright' ? '正位' : '逆位'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                    <span className={`text-[10px] ${isRev ? 'text-element' : 'text-muted-foreground/40'}`}>
                      {c.position}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* 已翻开牌的简要含义 */}
            {revealed.size > 0 && (
              <div className="mx-auto max-w-lg space-y-2 animate-rise">
                {[...revealed].sort().map((i) => {
                  const c = drawnCards[i];
                  if (!c) return null;
                  return (
                    <div key={i} className="rounded-lg border border-element/20 bg-card/40 px-4 py-2">
                      <p className="text-xs font-bold text-gold">
                        {c.card.nameCn}
                        <span className="ml-1 font-normal text-muted-foreground">
                          · {c.position} · {c.orientation === 'upright' ? '正位' : '逆位'}
                        </span>
                      </p>
                      <p className="mt-0.5 text-[11px] text-foreground/70 line-clamp-2">
                        {c.orientation === 'upright' ? c.card.meaningUpright : c.card.meaningReversed}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {revealed.size >= needTotal && (
              <Button
                onClick={goComplete}
                className="bg-element font-kai text-void shadow-glow-md hover:bg-element/80"
                disabled={loading}
              >
                {loading ? 'AI 解读中…' : '查看完整解读'}
              </Button>
            )}
          </div>
        )}

        {/* ================================================================
            STEP 8: 收尾 / AI 解读
            ================================================================ */}
        {step === 'complete' && (
          <div className="space-y-6">
            {/* 收尾横幅 */}
            <div className="animate-rise rounded-xl border border-element/25 bg-element/5 px-6 py-5 text-center backdrop-blur-sm">
              <p className="font-kai text-lg text-gold">🌟 塔罗已揭示 · 答案在你心中</p>
              <p className="mt-1 text-xs text-muted-foreground/80">
                牌阵已展开，塔罗的智慧已传达。结合 AI 深度解读获取更多洞见。
              </p>
            </div>

            {/* 已翻开的牌快览 */}
            <div className="flex flex-wrap justify-center gap-2">
              {drawnCards.map((c, i) => (
                <div key={i} className="flex w-20 flex-col items-center gap-0.5">
                  <div className="flex h-28 w-20 items-center justify-center rounded-lg border border-element/25 bg-card/70 p-1 text-center">
                    <div>
                      <p className="text-[10px] font-bold text-gold leading-tight">{c.card.nameCn}</p>
                      <p className="text-[8px] text-muted-foreground">{c.position}</p>
                      <p className="text-[8px] text-element">{c.orientation === 'upright' ? '正位' : '逆位'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 保存 / 分享（仅在有 result 时显示） */}
            {result && (
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button variant="outline" onClick={handleSave} className="border-element/50 text-element hover:bg-element/10">
                  💾 存入记忆
                </Button>
                <Button variant="default" onClick={handleShare} className="bg-element text-void shadow-glow-md hover:bg-element/80">
                  🔗 复制分享链接
                </Button>
              </div>
            )}
            {feedback && <p className="text-center text-sm text-gold/90 animate-rise">{feedback}</p>}

            {/* 加载中状态 */}
            {loading && !result && (
              <div className="flex flex-col items-center gap-4 py-12">
                <div className="inline-block h-10 w-10 animate-spin rounded-full border-3 border-element border-t-transparent" />
                <p className="text-sm text-element/80 font-kai">塔罗师正在解读牌面…</p>
              </div>
            )}

            {/* AI 解读（带 PayWall） — 当 result 存在时显示 */}
            {result && (
              <TarotResultView
                result={result}
                onReset={handleReset}
                unlockKey={makeRecordKey('tarot', buildInput())}
              />
            )}
          </div>
        )}

        {/* ———— 错误提示 ———— */}
        {error && (
          <div className="mt-4 rounded bg-red-950/40 p-3 text-center text-sm text-red-300">
            {error}
          </div>
        )}

      </div>
    </section>
  );
}
