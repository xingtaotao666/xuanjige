interface RitualLoaderProps {
  variant?: 'bazi' | 'yijing';
  label?: string;
  sublabel?: string;
}

const TRIGRAMS = ['☰', '☱', '☲', '☳', '☴', '☵', '☶', '☷'];

/** 墨晕扩散（古铜色版） */
function InkDiffusion() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <span
        className="absolute h-40 w-40 rounded-full border border-bronze/40 animate-ink-diffuse"
        style={{ animationDelay: '0s' }}
      />
      <span
        className="absolute h-40 w-40 rounded-full border border-bronze/30 animate-ink-diffuse"
        style={{ animationDelay: '0.85s' }}
      />
      <span
        className="absolute h-40 w-40 rounded-full border border-sage/25 animate-ink-diffuse"
        style={{ animationDelay: '1.7s' }}
      />
    </div>
  );
}

/** 星轨旋转（古铜色版） */
function OrbitRing() {
  const stars = Array.from({ length: 12 });
  return (
    <div className="absolute inset-0 animate-orbit">
      <div className="absolute inset-3 rounded-full border border-bronze/20" />
      <div className="absolute inset-8 rounded-full border border-sage/20" />
      {stars.map((_, i) => {
        const angle = i * 30;
        return (
          <span
            key={i}
            className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-bronze shadow-paper-sm"
            style={{
              transform: `rotate(${angle}deg) translateY(-76px)`,
              opacity: i % 3 === 0 ? 1 : 0.55,
            }}
          />
        );
      })}
    </div>
  );
}

/** 八卦环：八经卦绕周天旋转 */
function BaguaRing() {
  return (
    <div className="absolute inset-0 animate-orbit-rev">
      <div className="absolute inset-2 rounded-full border border-bronze/25" />
      {TRIGRAMS.map((t, i) => {
        const angle = i * 45;
        return (
          <span
            key={i}
            className="absolute left-1/2 top-1/2 text-xl leading-none text-bronze"
            style={{
              transform: `rotate(${angle}deg) translateY(-66px) rotate(${-angle}deg)`,
            }}
          >
            {t}
          </span>
        );
      })}
    </div>
  );
}

/** 太极（古铜米色） */
function Taiji() {
  return (
    <svg viewBox="0 0 100 100" className="h-16 w-16 drop-shadow-[0_2px_8px_rgba(139,111,71,0.30)] animate-taiji-spin">
      <defs>
        <linearGradient id="tJG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#faf3e2" />
          <stop offset="100%" stopColor="#ede1c8" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill="url(#tJG)" stroke="#8b6f47" strokeWidth="1.5" />
      <path
        d="M50 4 A23 23 0 0 1 50 50 A23 23 0 0 0 50 96 A46 46 0 0 1 50 4 Z"
        fill="#5a3f23"
      />
      <circle cx="50" cy="27" r="7" fill="#faf3e2" stroke="#8b6f47" strokeWidth="0.5" />
      <circle cx="50" cy="73" r="7" fill="#5a3f23" stroke="#8b6f47" strokeWidth="0.5" />
      <circle cx="50" cy="27" r="2" fill="#5a3f23" />
      <circle cx="50" cy="73" r="2" fill="#faf3e2" />
    </svg>
  );
}

/** 古铜符卡（取代朱印符箓） */
function BronzeTalisman() {
  return (
    <div className="[perspective:600px]">
      <div className="animate-card-spin rounded-md border border-bronze/50 bg-gradient-to-b from-cream-dark/60 to-cream/80 px-3 py-4 shadow-paper-sm">
        <div className="font-kai text-2xl leading-tight text-bronze-dark">玄</div>
        <div className="mt-1 h-px w-full bg-bronze/30" />
        <div className="mt-1 font-kai text-[10px] tracking-widest text-bronze/70">机</div>
      </div>
    </div>
  );
}

export default function RitualLoader({
  variant = 'bazi',
  label = '正在推算…',
  sublabel,
}: RitualLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
      <div className="relative flex h-44 w-44 items-center justify-center">
        <InkDiffusion />
        {variant === 'yijing' ? <BaguaRing /> : <OrbitRing />}
        <div className="relative z-10">
          {variant === 'yijing' ? <Taiji /> : <BronzeTalisman />}
        </div>
      </div>

      <p className="mt-6 text-center font-kai text-base tracking-widest text-bronze-dark animate-breathe">
        {label}
      </p>
      {sublabel && (
        <p className="mt-2 text-center text-xs tracking-wide text-inkstone-soft animate-breathe">
          {sublabel}
        </p>
      )}

      {/* 古铜流光分隔 */}
      <div className="mt-5 h-px w-40 overflow-hidden rounded bg-gradient-to-r from-transparent via-bronze/60 to-transparent bg-[length:200%_100%] animate-shimmer" />
    </div>
  );
}
