interface RitualLoaderProps {
  variant?: 'bazi' | 'yijing';
  label?: string;
  sublabel?: string;
}

const TRIGRAMS = ['☰', '☱', '☲', '☳', '☴', '☵', '☶', '☷'];

/** 水墨扩散：三层同心圆向外晕开 */
function InkDiffusion() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <span
        className="absolute h-40 w-40 rounded-full border border-element/50 animate-ink-diffuse"
        style={{ animationDelay: '0s' }}
      />
      <span
        className="absolute h-40 w-40 rounded-full border border-element/40 animate-ink-diffuse"
        style={{ animationDelay: '0.85s' }}
      />
      <span
        className="absolute h-40 w-40 rounded-full border border-gold/30 animate-ink-diffuse"
        style={{ animationDelay: '1.7s' }}
      />
    </div>
  );
}

/** 星轨旋转：细环 + 周天星点 */
function OrbitRing() {
  const stars = Array.from({ length: 12 });
  return (
    <div className="absolute inset-0 animate-orbit">
      <div className="absolute inset-3 rounded-full border border-element/20" />
      <div className="absolute inset-8 rounded-full border border-gold/15" />
      {stars.map((_, i) => {
        const angle = i * 30;
        return (
          <span
            key={i}
            className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-element shadow-glow-sm"
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
      <div className="absolute inset-2 rounded-full border border-element/20" />
      {TRIGRAMS.map((t, i) => {
        const angle = i * 45;
        return (
          <span
            key={i}
            className="absolute left-1/2 top-1/2 text-xl leading-none text-glow-element"
            style={{
              transform: `rotate(${angle}deg) translateY(-66px) rotate(${-angle}deg)`,
              textShadow: '0 0 10px rgb(var(--glow-rgb) / 0.5)',
            }}
          >
            {t}
          </span>
        );
      })}
    </div>
  );
}

/** 太极 */
function Taiji() {
  return (
    <svg viewBox="0 0 100 100" className="h-16 w-16 drop-shadow-[0_0_14px_rgb(var(--glow-rgb)/0.5)] animate-taiji-spin">
      <circle cx="50" cy="50" r="46" fill="#0a0710" stroke="rgb(var(--accent-rgb))" strokeWidth="2.5" />
      <path
        d="M50 4 A23 23 0 0 1 50 50 A23 23 0 0 0 50 96 A46 46 0 0 1 50 4 Z"
        fill="rgb(var(--accent-rgb))"
      />
      <circle cx="50" cy="27" r="7" fill="#0a0710" />
      <circle cx="50" cy="73" r="7" fill="rgb(var(--accent-rgb))" />
    </svg>
  );
}

/** 旋转符卡：3D 翻转的朱印符箓 */
function TalismanCard() {
  return (
    <div className="[perspective:600px]">
      <div className="animate-card-spin rounded-md border border-gold/60 bg-gradient-to-b from-amber-950/70 to-black/80 px-3 py-4 shadow-gold-glow">
        <div className="font-kai text-2xl leading-tight text-gold">符</div>
        <div className="mt-1 h-px w-full bg-gold/40" />
        <div className="mt-1 font-kai text-[10px] tracking-widest text-gold/70">敕令</div>
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
          {variant === 'yijing' ? <Taiji /> : <TalismanCard />}
        </div>
      </div>

      <p className="mt-6 text-center font-kai text-base tracking-widest text-glow-element animate-breathe">
        {label}
      </p>
      {sublabel && (
        <p className="mt-2 text-center text-xs tracking-wide text-muted-foreground animate-breathe">
          {sublabel}
        </p>
      )}

      {/* 流光分隔 */}
      <div className="mt-5 h-px w-40 overflow-hidden rounded bg-gradient-to-r from-transparent via-gold/60 to-transparent bg-[length:200%_100%] animate-shimmer" />
    </div>
  );
}
