import type { TarotCardPlacement } from '@/types/tarot';

const SUIT_COLORS: Record<string, string> = {
  wands: 'border-red-600/60 bg-red-950/20 text-red-300',
  cups: 'border-blue-500/60 bg-blue-950/20 text-blue-300',
  swords: 'border-amber-400/60 bg-amber-950/20 text-amber-300',
  pentacles: 'border-emerald-500/60 bg-emerald-950/20 text-emerald-300',
  major: 'border-purple-500/60 bg-purple-950/20 text-purple-300',
};

const SUIT_GLYPHS: Record<string, string> = {
  wands: '🔥',
  cups: '💧',
  swords: '⚔️',
  pentacles: '🪙',
  major: '⭐',
};

const ORIENTATION_LABEL: Record<string, string> = {
  upright: '正位',
  reversed: '逆位',
};

const ORIENTATION_CLASS: Record<string, string> = {
  upright: 'text-bronze-dark',
  reversed: 'text-amber-400',
};

export default function TarotCard({ placement, index }: { placement: TarotCardPlacement; index: number }) {
  const { card, position, orientation } = placement;
  const suitKey = card.arcana === 'major' ? 'major' : (card.suit ?? 'major');
  const colors = SUIT_COLORS[suitKey] || SUIT_COLORS.major;
  const glyph = SUIT_GLYPHS[suitKey] || '⭐';

  return (
    <div
      className={`group relative rounded-xl border-2 ${colors} bg-cream-light/85 p-4 backdrop-blur-sm transition hover:shadow-paper-md animate-rise`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* 位置标签 */}
      <div className="mb-2 flex items-center justify-between">
        <span className="rounded bg-bronze/10 px-2 py-0.5 text-[10px] text-bronze-dark font-medium">
          {position}
        </span>
        <span className={`text-xs font-medium ${ORIENTATION_CLASS[orientation]}`}>
          {ORIENTATION_LABEL[orientation]}
        </span>
      </div>

      {/* 牌面 */}
      <div className="flex flex-col items-center gap-2 py-2">
        {/* 装饰图标 */}
        <div className="text-2xl opacity-70">{glyph}</div>

        {/* 牌名 */}
        <h4 className="text-center font-kai text-base font-bold text-bronze-dark">
          {card.nameCn}
        </h4>
        <p className="text-center text-[10px] text-inkstone-soft/70">
          {card.nameEn}
        </p>

        {/* 分隔线 */}
        <div className="h-px w-12 bg-gradient-to-r from-transparent via-element/40 to-transparent" />

        {/* 元素 */}
        <span className="rounded-full border border-bronze/20 bg-bronze/5 px-2 py-0.5 text-[10px] text-bronze-dark/80">
          {card.element}
        </span>

        {/* 关键词 */}
        <p className="text-center text-[10px] leading-relaxed text-inkstone/70 line-clamp-2">
          {card.keywords}
        </p>
      </div>

      {/* 悬停时显示详细含义 */}
      <div className="absolute inset-0 z-10 hidden items-center justify-center rounded-xl bg-cream-light/95 p-3 group-hover:flex">
        <div className="max-h-full overflow-y-auto text-center">
          <p className="mb-1 font-kai text-xs font-bold text-bronze-dark">{card.nameCn}</p>
          <p className="text-[10px] leading-relaxed text-inkstone/80">
            {orientation === 'upright' ? card.meaningUpright : card.meaningReversed}
          </p>
          <p className="mt-1 text-[10px] text-inkstone-soft/60">{card.imageDesc}</p>
        </div>
      </div>
    </div>
  );
}
