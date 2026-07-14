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
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-[#0a0a0f]" />

      {/* 两侧暗边 */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-3xl px-4 text-center">
        {/* 品牌名 */}
        <h1
          className="mb-3 text-5xl font-bold tracking-[0.3em] sm:text-6xl md:text-7xl lg:text-8xl"
          style={{
            fontFamily: "'Noto Serif SC', 'SimSun', 'STSong', serif",
            color: '#d4a843',
            textShadow: '0 2px 40px rgba(212,168,67,0.4), 0 0 80px rgba(180,100,20,0.2)',
          }}
        >
          玄机阁
        </h1>

        <p className="mb-2 text-base font-medium tracking-widest text-amber-400/70 sm:text-lg">
          ─── AI 智能命理 ───
        </p>

        <p className="mb-10 text-sm leading-relaxed text-gray-300/90 sm:text-base">
          融合千年典籍 · 易经六十四卦 · 四柱八字排盘
          <br className="hidden sm:block" />
          古籍 RAG 检索 · 大模型智能解读
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button
            size="lg"
            onClick={() => navigate('/bazi')}
            className="w-full border border-amber-700/50 bg-amber-900/50 text-amber-200 shadow-lg shadow-amber-950/40 hover:bg-amber-800/60 hover:text-amber-100 backdrop-blur-sm sm:w-44"
          >
            八字排盘
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate('/yijing')}
            className="w-full border-red-700/50 text-red-400 hover:bg-red-950/30 hover:text-red-300 backdrop-blur-sm sm:w-44"
          >
            易经占卜
          </Button>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="flex h-8 w-5 items-start justify-center rounded-full border border-amber-700/40 p-1">
          <div className="h-2 w-1 rounded-full bg-amber-600/60" />
        </div>
      </div>
    </section>
  );
}
