import type { Pillar } from '@/types/bazi';

interface PillarDisplayProps {
  pillar: Pillar;
  label: string;
}

const wuxingColor = (wx: string) => {
  switch (wx) {
    case '木': return 'text-emerald-400';
    case '火': return 'text-red-400';
    case '土': return 'text-amber-400';
    case '金': return 'text-gray-200';
    case '水': return 'text-blue-400';
    default: return 'text-gray-300';
  }
};

const yinyangIcon = (yy: string) => {
  if (yy === '阳') return '◻';
  return '●';
};

export default function PillarDisplay({ pillar, label }: PillarDisplayProps) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-element/30 bg-[#0a0710]/60 px-2 py-2 shadow-lg shadow-glow-sm backdrop-blur-sm sm:px-4 sm:py-3">
      {/* Label */}
      <span className="mb-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-widest sm:text-xs sm:mb-2">
        {label}
      </span>

      {/* Heavenly Stem */}
      <div
        className={`text-2xl font-bold leading-none sm:text-3xl ${wuxingColor(pillar.stem_wuxing)}`}
        title={`天干: ${pillar.heavenly_stem} (${pillar.stem_wuxing}, ${pillar.stem_yinyang})`}
      >
        {pillar.heavenly_stem}
        <span className="ml-0.5 text-[10px] align-top opacity-60 sm:text-xs">
          {yinyangIcon(pillar.stem_yinyang)}
        </span>
      </div>

      {/* Earthly Branch */}
      <div
        className={`mt-1 text-2xl font-bold leading-none sm:text-3xl ${wuxingColor(pillar.branch_wuxing)}`}
        title={`地支: ${pillar.earthly_branch} (${pillar.branch_wuxing}, ${pillar.branch_yinyang})`}
      >
        {pillar.earthly_branch}
        <span className="ml-0.5 text-[10px] align-top opacity-60 sm:text-xs">
          {yinyangIcon(pillar.branch_yinyang)}
        </span>
      </div>

      {/* 藏干 */}
      {pillar.canggan && pillar.canggan.length > 0 && (
        <div className="mt-2 flex flex-wrap justify-center gap-1">
          {pillar.canggan.map((cg, i) => (
            <span
              key={i}
              className="rounded bg-card/50 px-1.5 py-0.5 text-[10px] text-muted-foreground"
            >
              {cg}
            </span>
          ))}
        </div>
      )}

      {/* 纳音 */}
      {pillar.nayin && (
        <span className="mt-2 text-[11px] italic text-muted-foreground">
          {pillar.nayin}
        </span>
      )}
    </div>
  );
}
