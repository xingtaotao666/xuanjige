import { useState, useEffect } from 'react';
import type { CoinFace } from '@/types/yijing';
import { Button } from '@/components/ui/button';

interface CoinTossProps {
  coins: CoinFace[];
  shaking: boolean;
  currentLineName: string;
  onToss: () => void;
  disabled?: boolean;
  done: boolean;
}

/** 单枚掉落的铜钱 */
function FallenCoin({ face, index }: { face: CoinFace; index: number }) {
  // 每枚铜钱固定的随机偏移（基于 index 种子，避免每次渲染跳动）
  const dx = [ -38, 0, 38 ][index] + (Math.sin(index * 2.7) * 16);
  const dy = 70 + Math.cos(index * 1.9) * 14;
  const rot = [ -12, 8, -4 ][index];
  const isYang = face === 1; // 背面 = 阳

  return (
    <div
      className="absolute animate-coin-drop"
      style={{
        left: `calc(50% + ${dx}px)`,
        top: `${dy}px`,
        '--coin-rot': `${rot}deg`,
        '--coin-face': isYang ? '180deg' : '0deg',
        animationDelay: `${index * 0.1}s`,
      } as React.CSSProperties}
    >
      {/* 铜钱本体 */}
      <div
        className="relative h-14 w-14 rounded-full border-[3px] shadow-lg"
        style={{
          background: isYang
            ? 'linear-gradient(145deg, #c4a352 0%, #a07828 50%, #c9962e 100%)'
            : 'linear-gradient(145deg, #b8860b 0%, #8b6914 50%, #a67c00 100%)',
          borderColor: isYang ? '#ffd70080' : '#8b6914',
          transform: 'rotateX(var(--coin-face))',
          transition: 'transform 0.5s cubic-bezier(.34,1.56,.64,1)',
          boxShadow: isYang
            ? '0 0 18px rgba(255,215,0,0.45), inset 0 2px 4px rgba(255,255,255,0.25)'
            : '0 0 12px rgba(184,134,11,0.35), inset 0 2px 4px rgba(0,0,0,0.3)',
        }}
      >
        {/* 方孔 */}
        <span className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-[2px]"
          style={{ backgroundColor: isYang ? 'rgba(60,40,10,0.85)' : 'rgba(30,20,5,0.9)' }}
        />
        {/* 正面字面标记 */}
        {!isYang && (
          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-bold text-amber-900/70">
            字
          </span>
        )}
        {/* 背面标记 */}
        {isYang && (
          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-bold text-yellow-200/80">
            背
          </span>
        )}
      </div>
    </div>
  );
}

/* ══════════════ 龟壳 SVG ══════════════ */
function TurtleShellSVG({ shaking }: { shaking: boolean }) {
  return (
    <svg
      viewBox="0 0 200 120"
      className={`h-36 w-52 sm:h-44 sm:w-64 drop-shadow-2xl transition-transform ${
        shaking ? 'animate-shell-shake' : ''
      }`}
      style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.6))' }}
    >
      <defs>
        <linearGradient id="shellGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#5c4033" />
          <stop offset="40%" stopColor="#3e2723" />
          <stop offset="100%" stopColor="#211814" />
        </linearGradient>
        <linearGradient id="shellHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8d6e63" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#3e2723" stopOpacity="0" />
        </linearGradient>
        {/* 六边形脊线图案 */}
        <pattern id="hexPattern" width="20" height="17.32" patternUnits="userSpaceOnUse">
          <polygon points="10,1 19,5.66 19,11.66 10,16.32 1,11.66 1,5.66"
            fill="none" stroke="#6d4c41" strokeWidth="0.8" opacity="0.5"
          />
        </pattern>
      </defs>

      {/* 龟壳主体 —— 半圆拱形 */}
      <path
        d="M 20 105 Q 20 15, 100 10 Q 180 15, 180 105 Z"
        fill="url(#shellGrad)"
        stroke="#4e342e"
        strokeWidth="2"
      />

      {/* 壳面高光 */}
      <path
        d="M 30 95 Q 35 30, 100 22 Q 165 30, 170 95 Z"
        fill="url(#shellHighlight)"
        opacity="0.4"
      />

      {/* 六边形纹理区域 */}
      <ellipse cx="100" cy="58" rx="65" ry="38" fill="url(#hexPattern)" />

      {/* 中央脊线 */}
      <line x1="100" y1="18" x2="100" y2="102" stroke="#4e342e" strokeWidth="1.5" opacity="0.6" />

      {/* 横向肋纹 */}
      {[32, 46, 62, 78].map((cy) => (
        <path key={cy} d={`M ${40 + (cy - 30) * 0.9} ${cy} Q 100 ${cy - 6}, ${160 - (cy - 30) * 0.9} ${cy}`}
          fill="none" stroke="#5d4037" strokeWidth="0.8" opacity="0.4"
        />
      ))}

      {/* 壳边缘厚度 */}
      <path d="M 18 105 Q 18 115, 100 115 Q 182 115, 182 105"
        fill="none" stroke="#3e2723" strokeWidth="3" opacity="0.6"
      />
    </svg>
  );
}

/* ══════════════ 主组件 ══════════════ */
export default function CoinToss({
  coins,
  shaking,
  currentLineName,
  onToss,
  disabled,
  done,
}: CoinTossProps) {
  const [revealed, setRevealed] = useState(false);

  // 当 shaking 结束后显示掉落铜钱
  useEffect(() => {
    if (!shaking && coins.every((c) => c !== null)) {
      const t = setTimeout(() => setRevealed(true), 150);
      return () => clearTimeout(t);
    }
    if (shaking) {
      setRevealed(false);
    }
  }, [shaking, coins]);

  const allRevealed = coins.every((c) => c !== null) && revealed;

  return (
    <div className="relative flex flex-col items-center gap-5">
      {/* 状态文字 */}
      <p className="text-sm text-bronze-dark/90">
        {done
          ? '六爻已成，正在解卦…'
          : `正在卜第「${currentLineName}」爻`
        }
      </p>

      {/* ═══ 龟壳 + 铜钱区域 ═══ */}
      <div className="relative flex h-56 w-full items-start justify-center sm:h-64">
        {/* ===== 龟壳 ===== */}
        <div className="relative z-20 pt-2">
          <TurtleShellSVG shaking={shaking} />

          {/* 摇动时壳内的铜钱闪烁 */}
          {shaking && (
            <div className="absolute inset-0 flex items-center justify-center">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="absolute h-10 w-10 animate-coin-shake rounded-full border-2 border-amber-500/60 bg-gradient-to-br from-amber-400/80 to-amber-600/80"
                  style={{
                    left: `${40 + i * 28}%`,
                    top: '42%',
                    animationDelay: `${i * 0.08}s`,
                    boxShadow: '0 0 12px rgba(245,158,11,0.4)',
                  }}
                >
                  <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-[1px] bg-black/60" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ===== 掉落的铜钱 ===== */}
        {allRevealed && !shaking && (
          <div className="absolute inset-x-0 top-0 z-10">
            {coins.map((face, i) =>
              face !== null ? <FallenCoin key={i} face={face} index={i} /> : null
            )}
          </div>
        )}
      </div>

      {/* 法则说明 */}
      <p className="text-center text-xs text-inkstone-soft/80">
        古法金钱课 · 三枚铜钱一爻 · 字阴背阳
      </p>

      {/* 摇卦按钮 */}
      <Button
        type="button"
        onClick={onToss}
        disabled={disabled || shaking || done}
        className={`
          relative overflow-hidden rounded-xl px-8 py-3 text-base font-semibold tracking-widest
          transition-all duration-300
          ${shaking
            ? 'cursor-default bg-stone-700 text-stone-400'
            : 'bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 text-amber-50 shadow-lg shadow-amber-900/40 hover:shadow-amber-800/50 hover:brightness-110 active:scale-95'
          }
        `}
      >
        {shaking ? (
          <span className="flex items-center gap-2">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
            摇卦中…
          </span>
        ) : done ? (
          '已成卦'
        ) : (
          '🐢 摇卦'
        )}
      </Button>

      {/* ═══ 内联关键帧动画 ═══ */}
      <style>{`
        @keyframes shell-shake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          10%   { transform: translateX(-10px) rotate(-4deg); }
          20%   { transform: translateX(10px) rotate(4deg); }
          30%   { transform: translateX(-8px) rotate(-3deg); }
          40%   { transform: translateX(8px) rotate(3deg); }
          50%   { transform: translateX(-6px) rotate(-2deg); }
          60%   { transform: translateX(6px) rotate(2deg); }
          70%   { transform: translateX(-4px) rotate(-1deg); }
          80%   { transform: translateX(4px) rotate(1deg); }
          90%   { transform: translateX(-2px) rotate(0deg); }
        }
        .animate-shell-shake {
          animation: shell-shake 0.75s ease-in-out;
        }

        @keyframes coin-shake-inner {
          0%, 100% { transform: translateY(0) scale(1) rotateY(0deg); }
          25% { transform: translateY(-12px) scale(1.15) rotateY(180deg); }
          50% { transform: translateY(4px) scale(0.9) rotateY(360deg); }
          75% { transform: translateY(-8px) scale(1.1) rotateY(540deg); }
        }
        .animate-coin-shake {
          animation: coin-shake-inner 0.22s ease-in-out infinite;
        }

        @keyframes coin-drop-fall {
          0% {
            opacity: 0;
            transform: translateY(-30px) scale(0.5) rotateZ(var(--coin-rot, 0deg));
          }
          40% {
            opacity: 1;
            transform: translateY(10px) scale(1.1) rotateZ(var(--coin-rot, 0deg));
          }
          70% {
            transform: translateY(-6px) scale(0.97);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1) rotateZ(var(--coin-rot, 0deg));
          }
        }
        .animate-coin-drop {
          animation: coin-drop-fall 0.55s cubic-bezier(.34,1.56,.64,1) forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}
