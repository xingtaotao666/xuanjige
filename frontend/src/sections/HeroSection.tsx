import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* ===== 玄机阁背景图（带暗角遮罩）===== */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/xuanji-bg.png')" }}
      />
      {/* 渐变遮罩 —— 让文字可读，底部过渡到页面 */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0710]/75 via-[#0a0710]/55 to-[#0a0710]" />

      {/* 两侧暗边 */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0710]/60 via-transparent to-[#0a0710]/60" />

      {/* 标题后柔光晕（神秘氛围） */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/10 blur-3xl" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-3xl px-4 text-center">
        {/* 品牌名 */}
        <h1 className="mb-3 font-kai text-5xl font-bold tracking-[0.3em] text-gold title-glow sm:text-6xl md:text-7xl lg:text-8xl">
          玄机阁
        </h1>

        <p className="mb-2 text-base font-medium tracking-[0.4em] text-gold/70 sm:text-lg">
          ─── AI 智能命理 ───
        </p>

        <p className="mb-10 text-sm leading-relaxed text-foreground/80 sm:text-base">
          融合千年典籍 · 易经六十四卦 · 四柱八字排盘
          <br className="hidden sm:block" />
          古籍 RAG 检索 · 大模型智能解读
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
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
