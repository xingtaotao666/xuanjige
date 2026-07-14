import type { GuaResult, GuaYao } from '@/types/yijing';

interface GuaDisplayProps {
  gua: GuaResult;
}

function YaoLine({ yao, highlight }: { yao: GuaYao; highlight: boolean }) {
  const isYang = yao.value === 7 || yao.value === 9; // 阳爻：少阳7 / 老阳9
  return (
    <div className="flex items-center justify-center gap-3">
      <div
        className={`flex items-center justify-center ${
          highlight ? 'animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]' : ''
        }`}
      >
        {isYang ? (
          <div className="flex gap-2">
            <div className="h-1.5 w-16 rounded bg-amber-400/90" />
            <div className="h-1.5 w-4 rounded bg-amber-400/90" />
            <div className="h-1.5 w-16 rounded bg-amber-400/90" />
          </div>
        ) : (
          <div className="flex gap-2">
            <div className="h-1.5 w-[38px] rounded bg-amber-600/70" />
            <div className="h-1.5 w-[38px] rounded bg-amber-600/70" />
          </div>
        )}
      </div>
      {highlight && (
        <span className="text-[10px] text-red-400">{yao.value === 9 ? '○' : '×'}</span>
      )}
    </div>
  );
}

export default function GuaDisplay({ gua }: GuaDisplayProps) {
  const allYao = gua.all_yao || [];

  // 从初爻(下)到上爻(上)，显示时反转（上爻在上）
  const sortedYao = [...allYao].sort((a, b) => b.position - a.position);

  return (
    <div className="flex flex-col items-center">
      {/* 卦名 */}
      <div className="mb-4 text-center">
        <h3 className="text-2xl font-bold text-amber-300">{gua.primary_gua.name}</h3>
        <p className="text-xs text-gray-500">
          第{gua.primary_gua.xuhao}卦 · {gua.primary_gua.shang_gua} · {gua.primary_gua.xia_gua}
        </p>
        <p className="mt-1 text-xs text-gray-600 font-mono">{gua.primary_gua.binary}</p>
      </div>

      {/* 六爻 */}
      <div className="space-y-2 rounded-lg border border-red-900/40 bg-black/60 px-8 py-5 shadow-lg">
        {sortedYao.map((yao) => (
          <YaoLine key={yao.position} yao={yao} highlight={yao.is_changing} />
        ))}
      </div>

      {/* 变卦 */}
      {gua.bian_gua && (
        <div className="mt-6 text-center">
          <p className="mb-1 text-xs text-gray-500">变卦</p>
          <span className="text-lg font-bold text-amber-400">{gua.bian_gua.name}</span>
          <span className="ml-2 text-xs text-gray-500">第{gua.bian_gua.xuhao}卦</span>
        </div>
      )}

      {/* 错卦 / 综卦 */}
      <div className="mt-3 flex gap-4 text-xs text-gray-500">
        {gua.cuo_gua && (
          <span>
            错卦: <span className="text-amber-400/70">{gua.cuo_gua.name}</span>
          </span>
        )}
        {gua.zong_gua && (
          <span>
            综卦: <span className="text-amber-400/70">{gua.zong_gua.name}</span>
          </span>
        )}
      </div>

      {/* 卦意 */}
      {gua.gua_meaning && (
        <p className="mt-4 max-w-md text-center text-sm italic text-gray-400">{gua.gua_meaning}</p>
      )}

      {/* 现代对应场景 */}
      {gua.modern_scenes && gua.modern_scenes.length > 0 && (
        <div className="mt-4 w-full max-w-md">
          <h4 className="mb-2 text-xs font-semibold text-gray-500 text-center">现代对应</h4>
          <div className="space-y-3 text-center">
            {gua.modern_scenes.map((scene, i) => (
              <div key={i} className="rounded-lg border border-red-900/30 bg-black/40 px-3 py-2">
                {scene.gua_name && (
                  <p className="text-xs font-semibold text-amber-300/90">
                    {scene.type ? `${scene.type} · ${scene.gua_name}` : scene.gua_name}
                  </p>
                )}
                {scene.description && (
                  <p className="mt-1 text-xs text-gray-400">{scene.description}</p>
                )}
                {scene.scenes && scene.scenes.length > 0 && (
                  <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                    {scene.scenes.map((s: string, j: number) => (
                      <span
                        key={j}
                        className="rounded-full bg-red-950/40 px-2.5 py-1 text-xs text-gray-400"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
