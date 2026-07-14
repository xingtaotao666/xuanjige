import type { WuXingAnalysis } from '@/types/bazi';

interface WuXingChartProps {
  wuxing: WuXingAnalysis;
}

const elements = [
  { key: 'wood' as const, label: '木', color: 'bg-emerald-500', textColor: 'text-emerald-400' },
  { key: 'fire' as const, label: '火', color: 'bg-red-500', textColor: 'text-red-400' },
  { key: 'earth' as const, label: '土', color: 'bg-amber-500', textColor: 'text-amber-400' },
  { key: 'metal' as const, label: '金', color: 'bg-gray-300', textColor: 'text-gray-200' },
  { key: 'water' as const, label: '水', color: 'bg-blue-500', textColor: 'text-blue-400' },
];

export default function WuXingChart({ wuxing }: WuXingChartProps) {
  const values = elements.map((e) => wuxing[e.key]);
  const maxVal = Math.max(...values, 1);

  return (
    <div className="space-y-3">
      {elements.map((el) => {
        const val = wuxing[el.key];
        const widthPct = (val / maxVal) * 100;
        return (
          <div key={el.key} className="flex items-center gap-3">
            <span className={`w-6 text-right text-sm font-bold ${el.textColor}`}>
              {el.label}
            </span>
            <div className="flex-1">
              <div className="h-5 w-full overflow-hidden rounded-full bg-gray-800">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${el.color}`}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </div>
            <span className="w-8 text-right text-sm text-gray-400">{val}</span>
          </div>
        );
      })}

      {wuxing.summary && (
        <p className="mt-3 text-xs italic text-gray-500">
          {typeof wuxing.summary === 'string' ? wuxing.summary : JSON.stringify(wuxing.summary)}
        </p>
      )}

      {wuxing.health_advice && wuxing.health_advice.length > 0 && (
        <div className="mt-4 space-y-2">
          <h5 className="text-xs font-semibold text-gray-400">健康建议</h5>
          {wuxing.health_advice.map((advice, i) => (
            <div key={i} className="rounded bg-gray-800/50 p-2 text-xs text-gray-400">
              {advice.description && (
                <p className="mb-1">{advice.description}</p>
              )}
              <p>宜补部位: {advice.body_parts.join('、')}</p>
              <p>色彩: {advice.color_advice}</p>
              <p>方位: {advice.direction}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
