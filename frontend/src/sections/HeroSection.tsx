import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const TRIGRAMS = ['☰', '☱', '☲', '☳', '☴', '☵', '☶', '☷'];
const WUXING_DOT = [
  'bg-wuxing-wood',
  'bg-wuxing-fire',
  'bg-wuxing-earth',
  'bg-wuxing-metal',
  'bg-wuxing-water',
];

/** 中央宇宙门户：星轨 + 八卦 + 太极 + 水墨扩散（复用 RitualLoader 视觉语汇与五行主题色） */
function CosmicPortal() {
  return (
    <div
      data-portal="cosmic"
      aria-label="玄机阁宇宙门户"
      className="portal relative mb-10 flex h-60 w-60 animate-float items-center justify-center sm:mb-12 sm:h-72 sm:w-72"
    >
      {/* 水墨扩散：三层同心圆向外晕开 */}
      <span
        className="absolute h-44 w-44 rounded-full border border-element/40 animate-ink-diffuse"
        style={{ animationDelay: '0s' }}
      />
      <span
        className="absolute h-44 w-44 rounded-full border border-element/30 animate-ink-diffuse"
        style={{ animationDelay: '0.85s' }}
      />
      <span
        className="absolute h-44 w-44 rounded-full border border-gold/25 animate-ink-diffuse"
        style={{ animationDelay: '1.7s' }}
      />

      {/* 外环：星点周天（顺转） */}
      <div className="absolute inset-0 animate-orbit">
        <div className="absolute inset-3 rounded-full border border-element/20" />
        <div className="absolute inset-8 rounded-full border border-gold/15" />
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = i * 30;
          return (
            <span
              key={i}
              className={`absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full ${WUXING_DOT[i % 5]} shadow-glow-sm`}
              style={{
                transform: `rotate(${angle}deg) translateY(-110px)`,
                opacity: i % 3 === 0 ? 1 : 0.55,
              }}
            />
          );
        })}
      </div>

      {/* 内环：八卦周天（逆转） */}
      <div className="absolute inset-0 animate-orbit-rev">
        <div className="absolute inset-6 rounded-full border border-element/15" />
        {TRIGRAMS.map((t, i) => {
          const angle = i * 45;
          return (
            <span
              key={i}
              className="absolute left-1/2 top-1/2 text-lg leading-none text-glow-element"
              style={{
                transform: `rotate(${angle}deg) translateY(-92px) rotate(${-angle}deg)`,
                textShadow: '0 0 10px rgb(var(--glow-rgb) / 0.5)',
              }}
            >
              {t}
            </span>
          );
        })}
      </div>

      {/* 太极核心 */}
      <svg
        viewBox="0 0 100 100"
        className="relative z-10 h-20 w-20 drop-shadow-[0_0_16px_rgb(var(--glow-rgb)/0.55)] animate-taiji-spin"
      >
        <circle cx="50" cy="50" r="46" fill="#0a0710" stroke="rgb(var(--accent-rgb))" strokeWidth="2.5" />
        <path
          d="M50 4 A23 23 0 0 1 50 50 A23 23 0 0 0 50 96 A46 46 0 0 1 50 4 Z"
          fill="rgb(var(--accent-rgb))"
        />
        <circle cx="50" cy="27" r="7" fill="#0a0710" />
        <circle cx="50" cy="73" r="7" fill="rgb(var(--accent-rgb))" />
      </svg>
    </div>
  );
}

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-20">
      {/* 标题后柔光晕（神秘氛围） */}
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/10 blur-3xl" />
      {/* 底部渐变，过渡到下方内容 */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />

      {/* 宇宙门户中心件 */}
      <CosmicPortal />

      {/* 文案 */}
      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <p
          className="mb-3 text-sm font-medium tracking-[0.5em] text-gold/70 animate-rise sm:text-base"
          style={{ animationDelay: '0.1s' }}
        >
          ─── AI 智能命理 ───
        </p>

        <h1
          className="mb-4 font-kai text-5xl font-bold tracking-[0.3em] text-gold title-glow animate-rise sm:text-6xl md:text-7xl lg:text-8xl"
          style={{ marginRight: '-0.3em', animationDelay: '0.2s' }}
        >
          玄机阁
        </h1>

        <p
          className="mb-10 text-sm leading-relaxed text-foreground/80 animate-rise sm:text-base"
          style={{ animationDelay: '0.35s' }}
        >
          融合千年典籍 · 易经六十四卦 · 四柱八字排盘
          <br className="hidden sm:block" />
          古籍 RAG 检索 · 大模型智能解读
        </p>

        <div
          className="flex flex-col items-center justify-center gap-4 animate-rise sm:flex-row"
          style={{ animationDelay: '0.5s' }}
        >
          <Button
            size="lg"
            onClick={() => navigate('/bazi')}
            className="w-full border border-element/50 bg-element/90 font-kai text-void shadow-glow-md backdrop-blur-sm transition hover:bg-element sm:w-44"
          >
            八字排盘
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate('/yijing')}
            className="w-full border border-element/50 font-kai text-element backdrop-blur-sm transition hover:bg-element/10 sm:w-44"
          >
            易经占卜
          </Button>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="flex h-8 w-5 items-start justify-center rounded-full border border-gold/40 p-1">
          <div className="h-2 w-1 animate-breathe rounded-full bg-gold/60" />
        </div>
      </div>
    </section>
  );
}
