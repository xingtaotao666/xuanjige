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
  | 'prepare'
  | 'question'
  | 'spread'
  | 'shuffle'
  | 'cut'
  | 'draw'
  | 'complete';

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
  const { loading, error, result, stage, divinate, reset } = useTarot();
  const { add } = useHistory();

  // — 基础状态 —
  const [step, setStep] = useState<Step>('question');
  const [question, setQuestion] = useState('');
  const [spread, setSpread] = useState<SpreadType>('three');
  const [feedback, setFeedback] = useState('');

  // — 手动输牌模式 —
  const [manualMode, setManualMode] = useState(false);
  const [manualCards, setManualCards] = useState('');

  // — 洗牌 —
  const [shuffling, setShuffling] = useState(false);
  const [shuffleDone, setShuffleDone] = useState(false); // 洗牌动画已完成
  // — 切牌 —
  const [cutting, setCutting] = useState(false);
  const [cutDone, setCutDone] = useState(false);
  const cutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // — 3×3 抽牌矩阵 —
  const [gridCards, setGridCards] = useState<TarotCardPlacement[]>([]);
  /** 正在翻转显示内容的位置（点击后加入，800ms 后移除） */
  const [flippingPositions, setFlippingPositions] = useState<Set<number>>(new Set());
  /** 已选择的牌（每选一张追加），不按位置索引 */
  const [selectedCards, setSelectedCards] = useState<TarotCardPlacement[]>([]);
  const [selectionStep, setSelectionStep] = useState(0);
  const remainingDeckRef = useRef<TarotCardPlacement[]>([]);
  const [reshuffling, setReshuffling] = useState(false);

  // — 最终手牌 —
  const drawnCards = useMemo(() => {
    const positions = SPREAD_POSITIONS[spread] || ['当前指引'];
    return selectedCards.slice(0, positions.length).map((c, i) => ({
      ...c,
      position: positions[i] || `位置${i + 1}`,
    }));
  }, [selectedCards, spread]);

  // — AI 解读（传入已选的牌，不重新抽牌） —
  const doDivinate = useCallback(() => {
    if (question.trim() && drawnCards.length > 0) {
      divinate({
        question: question.trim(),
        spread,
        with_llm: true,
        with_rag: true,
        cards: drawnCards,
      });
    }
  }, [question, spread, divinate, drawnCards]);

  // — 手动输牌 AI 分析 —
  const manualDivinate = useCallback(() => {
    if (!question.trim() || !manualCards.trim()) return;
    setStep('complete');
    
    // 解析用户输入的牌名，匹配卡牌库
    const text = manualCards.trim();
    const matched: TarotCardPlacement[] = [];
    const lines = text.split(/[,，、\n]/).map((s) => s.trim()).filter(Boolean);
    for (const line of lines) {
      const isRev = /逆位|reversed/i.test(line);
      const cleanName = line.replace(/正位|逆位|upright|reversed/gi, '').trim();
      // 在 ALL_TAROT_CARDS 中查找
      const found = ALL_TAROT_CARDS.find(
        (c) =>
          c.nameCn.includes(cleanName) ||
          cleanName.includes(c.nameCn) ||
          c.nameEn.toLowerCase().includes(cleanName.toLowerCase()) ||
          cleanName.toLowerCase().includes(c.nameEn.toLowerCase()),
      );
      if (found) {
        matched.push({
          position: `用户输入 #${matched.length + 1}`,
          card: found,
          orientation: isRev ? 'reversed' : 'upright',
        });
      }
    }
    if (matched.length === 0) {
      // 一张都没匹配到 → 直接把文字作为 question 发送
      setStep('complete');
      divinate({
        question: `牌面：${manualCards.trim()}\n\n问题：${question.trim()}`,
        spread: 'single',
        with_llm: true,
        with_rag: true,
      });
      return;
    }
    setStep('complete');
    divinate({
      question: question.trim(),
      spread: matched.length <= 1 ? 'single' : matched.length <= 3 ? 'three' : 'cross',
      with_llm: true,
      with_rag: true,
      cards: matched,
    });
  }, [question, manualCards, divinate, setStep]);

  // — 重置 —
  const handleReset = () => {
    if (cutTimer.current) clearTimeout(cutTimer.current);
    reset();
    setStep('prepare');
    setFeedback('');
    setQuestion('');
    setSpread('three');
    setShuffling(false);
    setShuffleDone(false);
    setCutting(false);
    setCutDone(false);
    setGridCards([]);
    setFlippingPositions(new Set());
    setSelectedCards([]);
    setSelectionStep(0);
    remainingDeckRef.current = [];
    setReshuffling(false);
  };

  /* ================================================================
     步骤过渡
     ================================================================ */

  /** 进入洗牌步骤（手动点击"开始洗牌"才触发动画） */
  const enterShuffle = () => {
    setStep('shuffle');
    setShuffling(false);
    setShuffleDone(false);
  };

  /** 手动点击洗牌按钮 → 启动洗牌动画 */
  const triggerShuffle = () => {
    setShuffling(true);
    setShuffleDone(false);
    setTimeout(() => {
      setShuffling(false);
      setShuffleDone(true);
    }, 2500);
  };

  /** 手动确认洗牌完成 → 进入切牌 */
  const confirmShuffle = () => {
    setStep('cut');
    setCutting(true);
    setCutDone(false);
    cutTimer.current = setTimeout(() => {
      setCutting(false);
      setCutDone(true);
    }, 2500);
  };

  /** 直接进入抽牌步骤：初始化 3×3 牌阵并跳转 */
  const startDraw = () => {
    const shuffled = shuffle(ALL_TAROT_CARDS);
    const grid: TarotCardPlacement[] = shuffled.slice(0, 9).map((card) => ({
      position: '',
      card,
      orientation: Math.random() < 0.5 ? 'upright' : 'reversed',
    }));
    remainingDeckRef.current = shuffle(shuffled.slice(9)).map((card) => ({
      position: '',
      card,
      orientation: Math.random() < 0.5 ? ('upright' as const) : ('reversed' as const),
    }));
    setGridCards(grid);
    setFlippingPositions(new Set());
    setSelectedCards([]);
    setSelectionStep(0);
    setStep('draw');
  };

  /** 手动确认切牌完成 → 进入抽牌 */
  const confirmCut = () => {
    const shuffled = shuffle(ALL_TAROT_CARDS);
    const grid: TarotCardPlacement[] = shuffled.slice(0, 9).map((card) => ({
      position: '',
      card,
      orientation: Math.random() < 0.5 ? 'upright' : 'reversed',
    }));
    remainingDeckRef.current = shuffle(shuffled.slice(9)).map((card) => ({
      position: '',
      card,
      orientation: Math.random() < 0.5 ? 'upright' : 'reversed',
    }));
    setGridCards(grid);
    setFlippingPositions(new Set());
    setSelectedCards([]);
    setSelectionStep(0);
    setStep('draw');
  };

  /** 选中一张牌：
   *  1) 立即记录、翻转显示牌面
   *  2) 350ms 后跳走到已选区，原位补新牌 → 可再次点击
   */
  const selectGridCard = (gridIdx: number) => {
    const positions = SPREAD_POSITIONS[spread] || ['当前指引'];
    if (flippingPositions.has(gridIdx)) return; // 正在翻转中，不可点击
    if (selectionStep >= positions.length) return;

    const card = gridCards[gridIdx];
    if (!card) return;

    // 记录到已选列表
    setSelectedCards((prev) => [...prev, { ...card }]);
    // 标记翻转（显示牌面）
    setFlippingPositions((prev) => {
      const n = new Set(prev);
      n.add(gridIdx);
      return n;
    });
    const nextStep = selectionStep + 1;
    setSelectionStep(nextStep);

    // 1.2s 后：翻转牌跳走，原位补新牌
    setTimeout(() => {
      setFlippingPositions((prev) => {
        const n = new Set(prev);
        n.delete(gridIdx);
        return n;
      });
      setGridCards((prev) => {
        const next = [...prev];
        const remain = remainingDeckRef.current;
        if (remain.length > 0) {
          next[gridIdx] = remain.splice(0, 1)[0];
          remainingDeckRef.current = remain;
        } else {
          const usedNumbers = new Set(selectedCards.map((c) => c.card.number));
          const pool = ALL_TAROT_CARDS.filter((c) => !usedNumbers.has(c.number));
          const fresh = shuffle(pool).map((card) => ({
            position: '',
            card,
            orientation: Math.random() < 0.5 ? ('upright' as const) : ('reversed' as const),
          }));
          remainingDeckRef.current = fresh.slice(1);
          next[gridIdx] = fresh[0];
        }
        return next;
      });
    }, 1200);

    if (nextStep >= positions.length) {
      setTimeout(() => {
        setStep('complete');
        if (!result) {
          doDivinate();
        }
      }, 1400);
    }
  };

  /** 换一批：未在翻转中的位置全部补新牌 */
  const reshuffleGrid = () => {
    if (selectionStep >= (SPREAD_POSITIONS[spread] || []).length) return;

    setReshuffling(true);
    setTimeout(() => {
      setReshuffling(false);

      const remain = remainingDeckRef.current;
      if (remain.length === 0) {
        const usedNumbers = new Set(selectedCards.map((c) => c.card.number));
        const pool = ALL_TAROT_CARDS.filter((c) => !usedNumbers.has(c.number));
        const fresh = shuffle(pool).map((card) => ({
          position: '',
          card,
          orientation: Math.random() < 0.5 ? ('upright' as const) : ('reversed' as const),
        }));
        remainingDeckRef.current = fresh;
      }

      setGridCards((prev) => {
        const next = [...prev];
        const toReplace: number[] = [];
        for (let i = 0; i < next.length; i++) {
          if (!flippingPositions.has(i)) toReplace.push(i);
        }
        const r = remainingDeckRef.current;
        const takeCount = Math.min(toReplace.length, r.length);
        const fresh = r.splice(0, takeCount);
        remainingDeckRef.current = r;
        for (let j = 0; j < takeCount; j++) next[toReplace[j]] = fresh[j];
        return next;
      });
    }, 400);
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
    const url = buildShareUrl({
      v: 1, type: 'tarot', createdAt: Date.now(), input: buildInput(), result,
    });
    try {
      await navigator.clipboard.writeText(url);
      setFeedback('分享链接已复制到剪贴板 🔗');
    } catch { setFeedback('复制失败'); }
  };

  /* ================================================================
     渲染
     ================================================================ */
  const steps: { key: Step; label: string }[] = [
    { key: 'prepare', label: '准备' },
    { key: 'question', label: '定问题' },
    { key: 'spread', label: '选牌阵' },
    { key: 'shuffle', label: '洗牌' },
    { key: 'cut', label: '切牌' },
    { key: 'draw', label: '抽牌' },
    { key: 'complete', label: '解读' },
  ];
  const stepIdx = steps.findIndex((s) => s.key === step);
  const spreadInfo = SPREAD_OPTIONS.find((o) => o.type === spread);
  const needTotal = spreadInfo?.count || 0;

  return (
    <section className="relative min-h-screen overflow-hidden py-20">
      {/* 顶部装饰条：塔罗夜空渐变（极淡，不抢内容焦点） */}
      <div
        className="absolute inset-x-0 top-0 h-64 overflow-hidden opacity-20"
        aria-hidden="true"
      >
        <img
          src="./assets/tarot-stars-bg.png"
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-cream" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6">

        {/* 标题 */}
        <div className="mb-6 text-center">
          <h1 className="font-kai text-3xl font-bold text-inkstone sm:text-4xl">
            {step === 'complete' ? '塔罗解读' : '玄机阁 · 塔罗占卜'}
          </h1>
          <p className="mt-2 text-sm text-inkstone-soft">78 张韦特塔罗 · 洞见过去现在未来</p>
        </div>

        {/* ———— 步骤指示器 ———— */}
        <div className="mb-10 flex items-center justify-center gap-1 sm:gap-2">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-1 sm:gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold transition sm:h-8 sm:w-8 sm:text-xs ${
                  i === stepIdx
                    ? 'bg-bronze text-[#0a0f2a] shadow-paper-sm'
                    : i < stepIdx
                      ? 'bg-bronze/20 text-inkstone-soft/60'
                      : 'bg-cream-light/10 text-inkstone/30'
                }`}
              >
                {i < stepIdx ? '✓' : i + 1}
              </div>
              <span
                className={`hidden text-[10px] sm:inline ${
                  i === stepIdx ? 'text-inkstone' : i < stepIdx ? 'text-inkstone-soft/60' : 'text-inkstone/30'
                }`}
              >
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <div className={`mx-1 h-px w-3 sm:w-5 ${i < stepIdx ? 'bg-bronze/40' : 'bg-bronze/15'}`} />
              )}
            </div>
          ))}
        </div>

        {/* ———— 模式切换：抽牌 / 手动输牌 ———— */}
        {step !== 'complete' && (
          <div className="mb-6 flex items-center justify-center gap-3">
            <button
              onClick={() => { if (!manualMode) return; setManualMode(false); reset(); setStep('question');  }}
              className={`rounded-full px-4 py-1.5 font-kai text-sm transition-all ${
                !manualMode
                  ? 'bg-bronze text-cream shadow-paper-md'
                  : 'border border-bronze/30 text-inkstone-soft hover:bg-bronze/10'
              }`}
            >
              🃏 抽牌模式
            </button>
            <button
              onClick={() => { if (manualMode) return; setManualMode(true); reset(); setStep('question');  }}
              className={`rounded-full px-4 py-1.5 font-kai text-sm transition-all ${
                manualMode
                  ? 'bg-bronze text-cream shadow-paper-md'
                  : 'border border-bronze/30 text-inkstone-soft hover:bg-bronze/10'
              }`}
            >
              ✏️ 手动输牌
            </button>
          </div>
        )}

        {/* ———— 手动输牌界面 ———— */}
        {manualMode && step === 'question' && (
          <Card className="mx-auto max-w-2xl border-bronze/30 bg-cream-light/90 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="font-kai text-xl text-inkstone">✏️ 手动输牌 · AI 分析</CardTitle>
              <CardDescription className="text-inkstone-soft">
                输入你抽到的牌名和正逆位，AI 会结合塔罗知识为您深度解读
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 提问 */}
              <div>
                <label className="mb-1 block text-xs font-medium text-inkstone-soft">你的问题</label>
                <Textarea
                  placeholder="例如：近期事业发展如何？"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="min-h-[60px] border-bronze/35 bg-cream-light/95 text-inkstone placeholder:text-inkstone-mute/60 focus:border-bronze"
                  rows={2}
                />
              </div>
              {/* 输牌 */}
              <div>
                <label className="mb-1 block text-xs font-medium text-inkstone-soft">
                  你抽到的牌（用逗号或换行分隔）
                </label>
                <div className="rounded-lg border border-bronze/20 bg-cream-dark/30 p-3 text-[11px] leading-relaxed text-inkstone-soft">
                  支持输入牌的中文名或英文名，例如：<br />
                  <code className="text-bronze-dark">女皇 正位，魔术师 逆位，星星 正位</code>
                </div>
                <Textarea
                  placeholder="女皇 正位，魔术师 逆位，星星 正位，命运之轮 正位"
                  value={manualCards}
                  onChange={(e) => setManualCards(e.target.value)}
                  className="mt-2 min-h-[80px] border-bronze/35 bg-cream-light/95 text-inkstone placeholder:text-inkstone-mute/60 focus:border-bronze"
                  rows={3}
                />
              </div>
              <Button
                onClick={manualDivinate}
                disabled={loading || !question.trim() || !manualCards.trim()}
                className="w-full bg-bronze font-kai text-lg text-cream shadow-paper-md hover:bg-bronze/80 disabled:opacity-40"
              >
                {loading ? '🔮 AI 解读中…' : '🔮 AI 分析'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ================================================================
            STEP 1: 事前准备
            ================================================================ */}
        {step === 'prepare' && (
          <Card className="mx-auto max-w-lg border-bronze/30 bg-cream-light/90 backdrop-blur-md backdrop-blur-sm">
            <CardContent className="py-10 text-center">
              {/* 2 张示例塔罗牌展示 */}
              <div className="mb-6 flex items-end justify-center gap-3">
                <img
                  src="./assets/tarot-magician.png"
                  alt="The Magician"
                  className="h-32 w-auto rounded-lg shadow-paper-sm"
                  style={{ transform: 'rotate(-6deg)' }}
                />
                <img
                  src="./assets/tarot-empress.png"
                  alt="The Empress"
                  className="h-32 w-auto rounded-lg shadow-paper-sm"
                  style={{ transform: 'rotate(6deg)' }}
                />
              </div>
              <h2 className="mb-3 font-kai text-2xl text-inkstone">塔罗占卜 · 事前准备</h2>
              <div className="mx-auto max-w-sm space-y-3 text-left text-sm text-inkstone-soft/80">
                <p>❶ &nbsp; 找一个安静的环境，放下杂念</p>
                <p>❷ &nbsp; 全程保持内心专注，你的意念会通过选择传达给塔罗</p>
                <p>❸ &nbsp; 问题越具体，解读越有深度</p>
                <p>❹ &nbsp; 以开放的心态接受塔罗的指引</p>
              </div>
              <div className="mt-8 flex justify-center gap-2">
                <Button variant="ghost" onClick={() => { reset(); setStep('question'); }}
                  className="text-inkstone hover:bg-bronze/10">
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
          <Card className="mx-auto max-w-2xl border-bronze/30 bg-cream-light/90 backdrop-blur-md backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-kai text-inkstone">请说出您的问题</CardTitle>
              <CardDescription className="text-inkstone-soft">
                将您心中所念凝练为一句话，塔罗将据此回应
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e: FormEvent) => { e.preventDefault(); startDraw(); }} className="space-y-5">
                <Textarea
                  placeholder="例如：近期事业发展如何？我和他/她的关系走向？…"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="min-h-[100px] border-bronze/35 bg-cream-light/95 backdrop-blur-md text-inkstone placeholder:text-inkstone-mute/60 focus:border-bronze"
                  rows={4}
                  required
                  autoFocus
                />
                <Button type="submit" className="w-full bg-bronze font-kai text-inkstone shadow-paper-md hover:bg-bronze/80">
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
          <Card className="mx-auto max-w-2xl border-bronze/30 bg-cream-light/90 backdrop-blur-md backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-kai text-inkstone">选择牌阵</CardTitle>
              <CardDescription className="text-inkstone-soft">
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
                        ? 'border-[#c4a352] bg-bronze/15 shadow-paper-sm'
                        : 'border-bronze/35 bg-parchment/50 hover:border-bronze/60'
                    }`}
                  >
                    <div className="flex items-baseline justify-between">
                      <span className="font-kai text-base text-inkstone">{opt.label}</span>
                      <span className="text-[10px] text-inkstone-soft">{opt.count}张</span>
                    </div>
                    <p className="mt-1 text-xs text-inkstone-soft/80">{opt.desc}</p>
                  </button>
                ))}
              </div>
              <p className="text-center text-xs text-inkstone-soft/70 animate-rise">
                已选：{spreadInfo?.label || spread} · {needTotal}张
              </p>
              <Button
                onClick={enterShuffle}
                className="w-full bg-bronze font-kai text-inkstone shadow-paper-md hover:bg-bronze/80"
              >
                开始仪式 · 洗牌
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ================================================================
            STEP 4: 手动洗牌（用户点击触发动画，再手动确认完成）
            ================================================================ */}
        {step === 'shuffle' && (
          <div className="flex flex-col items-center gap-8">
            <div className="text-center">
              <p className="font-kai text-lg text-inkstone-soft/90">集中精神 · 洗牌</p>
              <p className="mt-1 text-xs text-inkstone-soft/70">点击按钮给予牌能量，感受牌在您手中流动</p>
            </div>

            {/* 牌叠 */}
            <div className="relative h-48 w-32">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={`card-stack-layer tarot-back h-48 w-32 ${shuffling ? 'animate-shuffle-card' : ''}`}
                  style={{ top: `${i * 2}px`, left: `${i * 2}px`, zIndex: 5 - i, animationDelay: `${i * 0.05}s` }}
                />
              ))}
            </div>

            {!shuffling && !shuffleDone && (
              <Button onClick={triggerShuffle} className="bg-bronze px-10 font-kai text-inkstone shadow-paper-md hover:bg-bronze/80">
                🔀 点击开始洗牌
              </Button>
            )}
            {shuffling && (
              <p className="animate-breathe text-sm text-inkstone/70">牌正在流转…</p>
            )}
            {shuffleDone && !shuffling && (
              <Button onClick={confirmShuffle} className="bg-bronze px-10 font-kai text-inkstone shadow-paper-md hover:bg-bronze/80">
                ✓ 洗好了，切牌
              </Button>
            )}
          </div>
        )}

        {/* ================================================================
            STEP 5: 手动切牌
            ================================================================ */}
        {step === 'cut' && (
          <div className="flex flex-col items-center gap-8">
            <div className="text-center">
              <p className="font-kai text-lg text-inkstone-soft/90">切牌 · 分三叠</p>
              <p className="mt-1 text-xs text-inkstone-soft/70">将牌分为三叠，再由直觉合并</p>
            </div>

            <div className="flex items-end gap-6">
              <div className="flex flex-col items-center gap-2">
                <div className={`tarot-back h-32 w-20 ${cutting ? 'animate-float' : ''}`} />
                <span className="text-xs text-inkstone-soft/50">左</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className={`tarot-back h-40 w-24 ${cutting ? 'animate-deck-float' : ''}`}
                  style={{ animationDelay: '0.3s' }} />
                <span className="text-xs text-inkstone-soft/50">中</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className={`tarot-back h-28 w-20 ${cutting ? 'animate-float' : ''}`}
                  style={{ animationDelay: '0.6s' }} />
                <span className="text-xs text-inkstone-soft/50">右</span>
              </div>
            </div>

            {cutting && (
              <p className="animate-breathe text-sm text-inkstone/70">牌的能量正在融合…</p>
            )}
            {cutDone && !cutting && (
              <Button onClick={confirmCut} className="bg-bronze px-10 font-kai text-inkstone shadow-paper-md hover:bg-bronze/80">
                ✓ 切好了，开始抽牌
              </Button>
            )}
          </div>
        )}

        {/* ================================================================
            STEP 6: 抽牌 — 3×3 矩阵 + 选牌后翻转显示内容再跳转
            ================================================================ */}
        {step === 'draw' && gridCards.length > 0 && (
          <div className="flex flex-col items-center gap-5">
            <div className="text-center">
              <p className="font-kai text-2xl font-bold text-inkstone sm:text-3xl">🃏 抽 牌</p>
              <p className="mt-2 text-sm text-inkstone-soft">凭直觉点选下方牌背 · 已选 {selectionStep}/{needTotal}</p>
            </div>

            {/* 3×3 矩阵 — 自适应手机/平板/桌面 */}
            <div className="grid w-full max-w-lg grid-cols-3 gap-3 sm:gap-5">
              {gridCards.map((card, gridIdx) => {
                const isFlipping = flippingPositions.has(gridIdx);
                const isFresh = !isFlipping && selectionStep < needTotal;

                return (
                  <div
                    key={gridIdx}
                    className={`flex flex-col items-center gap-1 ${
                      isFlipping ? 'animate-card-jump' : ''
                    }`}
                  >
                    <button
                      onClick={() => selectGridCard(gridIdx)}
                      disabled={!isFresh}
                      style={{ width: '128px', height: '176px' }}
                      className={`card-perspective sm:!w-40 sm:!h-56 transition-all duration-300 ${
                        isFresh
                          ? 'cursor-pointer hover:scale-105 hover:shadow-paper-lg'
                          : isFlipping
                            ? 'cursor-default shadow-paper-lg'
                            : 'cursor-default'
                      } ${reshuffling && isFresh ? 'animate-pulse-glow' : ''}`}
                    >
                      <div className={`card-inner h-full w-full ${isFlipping ? 'card-flipped' : ''}`}>
                        {/* 背面 */}
                        <div className="card-back tarot-back flex items-center justify-center rounded-xl border border-bronze/25 text-[clamp(0.6rem,4vw,1rem)]">
                          <span className="font-kai text-inkstone/50">?</span>
                        </div>
                        {/* 正面（翻转时显示）— AI 生成塔罗图 + 文字覆盖 */}
                        <div
                          className="card-front flex items-end justify-center rounded-xl border border-gold-deep/50 p-1 shadow-lg"
                          style={{
                            backgroundImage: 'url(./assets/tarot-front-star.png)',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }}
                        >
                          {/* 半透明遮罩 */}
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-inkstone/80 via-inkstone/20 to-transparent" />
                          {/* 文字内容 */}
                          <div className="relative z-10 mb-1 text-center">
                            <div className="font-kai font-bold text-cream leading-tight text-[clamp(0.6rem,3.5vw,0.9rem)] drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                              {card.card.nameCn}
                            </div>
                            <div className="text-[clamp(0.45rem,2.5vw,0.65rem)] text-[#c4a352] font-kai">
                              {card.orientation === 'upright' ? '正位' : '逆位'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* 换一批按钮（移到网格下方、已选区上方，常驻可见） */}
            {selectionStep < needTotal && (
              <Button
                variant="outline"
                onClick={reshuffleGrid}
                disabled={reshuffling}
                className="border-bronze/50 text-inkstone hover:bg-bronze/10 font-kai"
              >
                {reshuffling ? '🔄 正在重新洗牌…' : '🔄 换一批'}
              </Button>
            )}

            {/* 已选区 — 选中的牌跳转到这里 */}
            {selectedCards.length > 0 && (
              <div className="w-full rounded-xl border border-bronze/25 bg-parchment/40 p-4 backdrop-blur-sm">
                <p className="mb-2 text-center text-[11px] text-inkstone/70 font-kai">✦ 已选 {selectedCards.length}/{needTotal} 张 ✦</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {selectedCards.map((c, i) => (
                    <div key={`${c.card.number}-${i}`} className="flex flex-col items-center gap-0.5 animate-rise">
                      <div className="flex w-12 sm:w-16 aspect-[5/7] items-center justify-center rounded-lg border border-bronze/35 bg-card/80 p-0.5 text-center shadow-paper-sm">
                        <div>
                          <p className="text-[clamp(0.45rem,2.5vw,0.65rem)] font-bold text-inkstone leading-tight">{c.card.nameCn}</p>
                          <p className="text-[clamp(0.35rem,2vw,0.5rem)] text-inkstone-soft">{c.orientation === 'upright' ? '正位' : '逆位'}</p>
                        </div>
                      </div>
                      <span className="text-[clamp(0.35rem,2vw,0.55rem)] text-inkstone">{SPREAD_POSITIONS[spread]?.[i] || `#${i + 1}`}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 进度条 */}
            <div className="flex w-full max-w-xs items-center gap-2">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-cream-light/90 backdrop-blur-md">
                <div
                  className="h-full rounded-full bg-bronze transition-all duration-500"
                  style={{ width: `${(selectionStep / needTotal) * 100}%` }}
                />
              </div>
              <span className="text-xs text-inkstone-soft/70">{selectionStep}/{needTotal}</span>
            </div>
          </div>
        )}

        {/* ================================================================
            STEP 7: 收尾 / AI 解读
            ================================================================ */}
        {step === 'complete' && (
          <div className="space-y-6">
            <div className="animate-rise rounded-xl border border-bronze/30 bg-bronze/10 px-6 py-5 text-center backdrop-blur-sm">
              <p className="font-kai text-lg text-inkstone">🌟 塔罗已揭示 · 答案在你心中</p>
              <p className="mt-1 text-xs text-inkstone-soft/80">
                牌阵已展开，塔罗的智慧已传达。结合 AI 深度解读获取更多洞见。
              </p>
            </div>

            {/* 牌快览 */}
            <div className="flex flex-wrap justify-center gap-2">
              {drawnCards.map((c, i) => (
                <div key={i} className="flex w-20 flex-col items-center gap-0.5">
                  <div className="flex h-28 w-20 items-center justify-center rounded-lg border border-bronze/30 bg-cream-light/90 p-1 text-center">
                    <div>
                      <p className="text-[10px] font-bold text-inkstone leading-tight">{c.card.nameCn}</p>
                      <p className="text-[8px] text-inkstone-soft">{c.position}</p>
                      <p className="text-[8px] text-inkstone">{c.orientation === 'upright' ? '正位' : '逆位'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 加载中 — 分阶段显示：RAG 检索 / DS 解读 */}
            {loading && !result && (
              <div className="flex flex-col items-center gap-4 py-12 animate-rise">
                <div className="relative h-16 w-16">
                  <div className="absolute inset-0 rounded-full border-2 border-bronze/35" />
                  <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-element" />
                  <div className="absolute inset-0 flex items-center justify-center text-2xl">🔮</div>
                </div>
                <p className="font-kai text-base text-inkstone animate-breathe">
                  {stage?.message || '塔罗师正在解读牌面…'}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-inkstone-soft/60">
                  <span className={stage?.stage === 'rag' ? 'text-inkstone font-bold' : ''}>
                    ① 检索知识库
                  </span>
                  <span>→</span>
                  <span className={stage?.stage === 'llm' ? 'text-inkstone font-bold' : ''}>
                    ② AI 解读
                  </span>
                  <span>→</span>
                  <span className={stage?.stage === 'done' ? 'text-inkstone font-bold' : ''}>
                    ③ 完成
                  </span>
                </div>
              </div>
            )}

            {/* AI 解读出错提示 */}
            {error && !loading && !result && (
              <div className="rounded-lg border border-red-500/30 bg-red-950/30 p-4 text-center text-sm text-red-300">
                <p>⚠️ {error}</p>
                <p className="mt-2 text-xs text-red-400/70">可尝试重新占卜或在右上角设置中配置 DeepSeek API Key</p>
              </div>
            )}

            {/* 保存/分享 */}
            {result && (
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button variant="outline" onClick={handleSave} className="border-bronze/50 text-inkstone hover:bg-bronze/10">
                  💾 存入记忆
                </Button>
                <Button variant="default" onClick={handleShare} className="bg-bronze text-inkstone shadow-paper-md hover:bg-bronze/80">
                  🔗 复制分享链接
                </Button>
              </div>
            )}
            {feedback && <p className="text-center text-sm text-inkstone-soft/90 animate-rise">{feedback}</p>}

            {/* AI 解读 + RAG 内容来源（测试阶段免费展示） */}
            {result && (
              <TarotResultView
                result={result}
                onReset={handleReset}
                unlockKey=""
              />
            )}
          </div>
        )}

        {/* ———— 全局错误 ———— */}
        {error && step !== 'complete' && (
          <div className="mt-4 rounded bg-red-950/40 p-3 text-center text-sm text-red-300">
            {error}
          </div>
        )}

      </div>
    </section>
  );
}
