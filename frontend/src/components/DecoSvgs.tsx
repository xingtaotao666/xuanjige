/** 玄机阁装饰性 SVG 素材集 */

/** 顶部分隔装饰线（古铜色云纹） */
export function TopDivider({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 12" className={className} aria-hidden="true" preserveAspectRatio="none">
      <defs>
        <linearGradient id="tdG" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="30%" stopColor="#8b6f47" stopOpacity="0.35" />
          <stop offset="50%" stopColor="#8b6f47" stopOpacity="0.60" />
          <stop offset="70%" stopColor="#8b6f47" stopOpacity="0.35" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
      {/* 中间点 */}
      <circle cx="60" cy="6" r="2.5" fill="#c4a352" opacity="0.6" />
      {/* 左边线 */}
      <line x1="4" y1="6" x2="56" y2="6" stroke="url(#tdG)" strokeWidth="0.8" />
      {/* 右边线 */}
      <line x1="64" y1="6" x2="116" y2="6" stroke="url(#tdG)" strokeWidth="0.8" />
    </svg>
  );
}

/** 角落装饰纹样 */
export function CornerDeco({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <path
        d="M2 38 V2 H38"
        fill="none"
        stroke="#8b6f47"
        strokeWidth="0.8"
        strokeLinecap="round"
        opacity="0.35"
      />
      <path
        d="M6 34 V6 H34"
        fill="none"
        stroke="#c4a352"
        strokeWidth="0.5"
        strokeLinecap="round"
        opacity="0.25"
      />
      <circle cx="38" cy="2" r="1.5" fill="#a13d2a" opacity="0.3" />
    </svg>
  );
}

/** 朱红印章「玄机」 */
export function XuanjiSeal({ size = 60 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 60 60"
      width={size}
      height={size}
      aria-hidden="true"
      style={{ transform: 'rotate(-4deg)' }}
    >
      <defs>
        <filter id="seal_s">
          <feGaussianBlur stdDeviation="0.5" />
          <feComponentTransfer><feFuncA type="linear" slope="0.85" /></feComponentTransfer>
        </filter>
      </defs>
      <rect x="4" y="4" width="52" height="52" rx="4" fill="#a13d2a" opacity="0.9" filter="url(#seal_s)" />
      <rect x="7" y="7" width="46" height="46" rx="2.5" fill="none" stroke="#f5ecdb" strokeWidth="0.8" opacity="0.55" />
      <text
        x="30" y="28"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#f5ecdb"
        fontFamily="serif"
        fontSize="14"
        fontWeight="bold"
        letterSpacing="2"
        opacity="0.95"
      >
        玄
      </text>
      <text
        x="30" y="44"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#f5ecdb"
        fontFamily="serif"
        fontSize="14"
        fontWeight="bold"
        letterSpacing="2"
        opacity="0.95"
      >
        机
      </text>
    </svg>
  );
}

/** 苍青小章（用于标题装饰） */
export function SageStamp({ text = '古法', size = 36 }: { text?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      aria-hidden="true"
      style={{ transform: 'rotate(2deg)' }}
    >
      <rect x="2" y="2" width="36" height="36" rx="2" fill="#6e7d63" opacity="0.85" />
      <text
        x="20" y="22"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#faf3e2"
        fontFamily="serif"
        fontSize={text.length > 2 ? 9 : 11}
        fontWeight="bold"
        opacity="0.95"
      >
        {text}
      </text>
    </svg>
  );
}

/** 底部装饰线（古铜回纹） */
export function BottomBorder({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 1440 12" className={className} aria-hidden="true" preserveAspectRatio="none">
      <defs>
        <pattern id="bb_p" x="0" y="0" width="20" height="12" patternUnits="userSpaceOnUse">
          <rect x="0" y="4" width="8" height="4" fill="#8b6f47" opacity="0.20" rx="0.5" />
          <rect x="10" y="0" width="8" height="12" fill="none" stroke="#8b6f47" strokeWidth="0.5" opacity="0.12" />
        </pattern>
      </defs>
      <rect width="1440" height="12" fill="url(#bb_p)" />
    </svg>
  );
}

/** 八卦（老阳/少阴/少阳/老阴 极简符号） */
export function TrigramsRow({ className = '' }: { className?: string }) {
  const trigrams = [
    { lines: [1, 1, 1], name: '乾' },
    { lines: [0, 1, 0], name: '离' },
    { lines: [0, 0, 1], name: '艮' },
    { lines: [1, 1, 0], name: '兑' },
    { lines: [0, 0, 0], name: '坤' },
    { lines: [1, 0, 1], name: '坎' },
    { lines: [1, 0, 0], name: '震' },
    { lines: [0, 1, 1], name: '巽' },
  ];
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {trigrams.map((t, i) => (
        <div key={i} className="flex flex-col items-center gap-[2px]">
          {t.lines.map((l, j) => (
            <div
              key={j}
              className="h-[2px] rounded-full"
              style={{
                width: l ? 12 : 6,
                background: l ? '#8b6f47' : '#8b6f47',
                opacity: l ? 0.6 : 0.35,
              }}
            />
          ))}
          <span className="text-[7px] text-bronze/40 mt-[2px]">{t.name}</span>
        </div>
      ))}
    </div>
  );
}
