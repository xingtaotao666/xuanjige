import { useNavigate } from 'react-router-dom';

/** 八卦外环 + 太极核心（古铜色版） */
function BaguaPortal() {
  return (
    <div
      data-portal="bagua"
      aria-label="玄机阁门户"
      className="relative mb-12 flex h-64 w-64 items-center justify-center sm:mb-16 sm:h-80 sm:w-80"
    >
      {/* 外环：八卦三爻点（顺转） */}
      <div
        className="absolute inset-0 animate-[orbit_60s_linear_infinite]"
      >
        <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
          <circle cx="100" cy="100" r="95" fill="none" stroke="#8b6f47" strokeWidth="0.5" opacity="0.30" />
          <circle cx="100" cy="100" r="80" fill="none" stroke="#c4a352" strokeWidth="0.5" opacity="0.40" />
          {/* 八卦三爻符号外圈 */}
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i * 45 * Math.PI) / 180;
            const x = 100 + 88 * Math.cos(angle - Math.PI / 2);
            const y = 100 + 88 * Math.sin(angle - Math.PI / 2);
            const isYang = i % 3 === 0;
            return (
              <g key={i} transform={`translate(${x - 8}, ${y - 8})`}>
                <line x1="0" y1="2" x2="16" y2="2" stroke="#5a3f23" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="0" y1="9" x2={isYang ? "16" : "8"} y2="9" stroke="#5a3f23" strokeWidth="1.5" strokeLinecap="round" />
                <line x1={isYang ? "0" : "8"} y1="16" x2="16" y2="16" stroke="#5a3f23" strokeWidth="1.5" strokeLinecap="round" />
              </g>
            );
          })}
        </svg>
      </div>

      {/* 中环：玉青水墨晕开 */}
      <div className="absolute inset-8 animate-[breathe_5s_ease-in-out_infinite]">
        <div className="h-full w-full rounded-full bg-gradient-to-br from-jade/15 via-sage/10 to-cream-dark/0 blur-xl" />
      </div>

      {/* 太极核心（古铜配色） */}
      <div className="relative z-10">
        <svg viewBox="0 0 100 100" className="h-28 w-28 drop-shadow-[0_4px_12px_rgba(139,111,71,0.30)]">
          <defs>
            <linearGradient id="taijG" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#faf3e2" />
              <stop offset="100%" stopColor="#ede1c8" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="46" fill="url(#taijG)" stroke="#8b6f47" strokeWidth="1.8" />
          <path
            d="M50 4 A23 23 0 0 1 50 50 A23 23 0 0 0 50 96 A46 46 0 0 1 50 4 Z"
            fill="#5a3f23"
          />
          <circle cx="50" cy="27" r="7" fill="#faf3e2" stroke="#8b6f47" strokeWidth="0.8" />
          <circle cx="50" cy="73" r="7" fill="#5a3f23" stroke="#8b6f47" strokeWidth="0.8" />
          {/* 极眼点 */}
          <circle cx="50" cy="27" r="2" fill="#5a3f23" />
          <circle cx="50" cy="73" r="2" fill="#faf3e2" />
        </svg>
      </div>
    </div>
  );
}

const FEATURES = [
  {
    path: '/bazi',
    title: '八字',
    subtitle: '四柱命理',
    desc: '千年命理经典 · 排盘解读',
    accent: '#a13d2a',
  },
  {
    path: '/yijing',
    title: '易经',
    subtitle: '六十四卦',
    desc: '古经起卦解卦 · 寻天地之机',
    accent: '#8b6f47',
  },
  {
    path: '/tarot',
    title: '塔罗',
    subtitle: '韦特牌阵',
    desc: '七十八张灵性之镜 · 启内心智慧',
    accent: '#4a6b5b',
  },
];

/** 优雅分割线（中间圆点 + 两边细线） */
function Divider() {
  return (
    <div className="my-6 flex w-full max-w-md items-center justify-center gap-0 text-bronze">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-bronze/50 to-bronze/50" />
      <span className="px-4 text-base">❋</span>
      <div className="h-px flex-1 bg-gradient-to-l from-transparent via-bronze/50 to-bronze/50" />
    </div>
  );
}

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative flex min-h-[88vh] flex-col items-center justify-center overflow-hidden px-4 py-20">
      <div className="relative z-10 flex flex-col items-center">
        {/* 顶部印章小章 */}
        <div className="mb-8 flex items-center gap-3 animate-fade-in">
          <span className="seal-stamp">玄机</span>
          <div className="text-left">
            <p className="font-kai text-xs tracking-[0.4em] text-inkstone-mute">千年典籍</p>
            <p className="font-kai text-xs tracking-[0.4em] text-inkstone-mute">AI 智能</p>
          </div>
          <span className="seal-stamp" style={{ background: '#8b6f47' }}>古法</span>
        </div>

        {/* 中央八卦太极 */}
        <BaguaPortal />

        {/* 标题 */}
        <h1 className="mb-3 font-kai text-6xl font-bold tracking-[0.3em] text-inkstone sm:text-7xl md:text-8xl animate-rise">
          玄机阁
        </h1>

        <p className="mb-2 text-base tracking-[0.3em] text-bronze-dark sm:text-lg font-kai">
          究天人之变 · 察阴阳之机
        </p>

        <Divider />

        <p className="mx-auto mb-10 max-w-xl text-sm leading-relaxed text-inkstone-soft sm:text-base">
          融合《渊海子平》《滴天髓》《周易》《塔罗》千年典籍，
          <br className="hidden sm:block" />
          以 RAG 检索为骨，以大模型为魂，探寻命运之纹路。
        </p>

        {/* 三大功能卡片 */}
        <div className="grid w-full max-w-3xl grid-cols-1 gap-4 animate-rise sm:grid-cols-3">
          {FEATURES.map((f, i) => (
            <button
              key={f.path}
              onClick={() => navigate(f.path)}
              className="elevated-card group relative overflow-hidden p-6 text-left"
              style={{ animationDelay: `${0.6 + i * 0.1}s` }}
            >
              {/* 顶部装饰小条 */}
              <div
                className="absolute left-0 right-0 top-0 h-1"
                style={{ background: `linear-gradient(to right, ${f.accent}, transparent)` }}
              />
              {/* 角标 */}
              <div
                className="absolute -right-3 -top-3 h-12 w-12 rounded-full opacity-10 transition-opacity group-hover:opacity-20"
                style={{ background: f.accent }}
              />

              <div className="mb-3 flex items-baseline gap-2">
                <span
                  className="font-kai text-3xl font-bold"
                  style={{ color: f.accent }}
                >
                  {f.title}
                </span>
                <span className="font-kai text-sm text-inkstone-mute">
                  {f.subtitle}
                </span>
              </div>

              <p className="text-sm leading-relaxed text-inkstone-soft">
                {f.desc}
              </p>

              <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-inkstone-mute transition-colors group-hover:text-bronze">
                <span>开启占卜</span>
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </div>
            </button>
          ))}
        </div>

        {/* 底部标语 */}
        <div className="mt-10 flex items-center gap-2 text-xs text-inkstone-mute">
          <span>仅供娱乐参考</span>
          <span className="h-3 w-px bg-bronze/40" />
          <span>RAG + 大模型</span>
          <span className="h-3 w-px bg-bronze/40" />
          <span>古为今用</span>
        </div>
      </div>

      {/* 滚动提示 */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-[float_3s_ease-in-out_infinite]">
        <div className="flex h-8 w-5 items-start justify-center rounded-full border border-bronze/40 p-1">
          <div className="h-2 w-1 rounded-full bg-bronze/60" />
        </div>
      </div>
    </section>
  );
}
