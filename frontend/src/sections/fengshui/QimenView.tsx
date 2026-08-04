import { useState, type FC } from 'react';
import { Button } from '@/components/ui/button';
import { callDeepSeek } from '@/lib/llm/deepseek';
import {
  JIE_QI,
  GONG_WEI, GONG_WEI_NAME, BA_GUA,
  getDipanData, YUAN_JIU_XING, YUAN_BA_MEN, YANG_BA_SHEN, YIN_BA_SHEN,
} from '@/lib/qimen/qimenData';
import type { RagSource } from '@/types/consult';

interface Props { onResult: (r: string, s: RagSource[]) => void; }

/** 判断阴阳遁（简化：夏至后阴遁，冬至后阳遁） */
function isYangDun(month: number): boolean {
  return !(month >= 6 && month <= 11);
}

const QimenView: FC<Props> = ({ onResult }) => {
  const today = new Date();
  const [y, setY] = useState(today.getFullYear());
  const [m, setM] = useState(today.getMonth() + 1);
  const [d, setD] = useState(today.getDate());
  const [h, setH] = useState(today.getHours());
  const [question, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [grid, setGrid] = useState<Array<{ gw: number; dpg: string; tpg: string; jx: string; bm: string; bs: string }> | null>(null);
  const [info, setInfo] = useState('');

  const doPaipan = async () => {
    setLoading(true);
    setGrid(null);
    try {
      const yang = isYangDun(m);
      const jieqi = JIE_QI[Math.floor((m - 1) * 2 + (d > 15 ? 1 : 0)) % 24];
      const dateStr = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')} ${String(h).padStart(2,'0')}:00`;

      const sp = `你是奇门遁甲排盘专家。请根据以下输入计算排盘结果。必须严格按照以下JSON格式返回，不要任何多余文字：

{
  "isYang": true/false,
  "jushu": 数字1-9,
  "jieqi": "节气名",
  "yuan": "上元/中元/下元",
  "rigz": "日干支",
  "shigz": "时干支",
  "xunshou": "旬首",
  "grid": [
    {"gw":1,"dpg":"戊","tpg":"癸","jx":"天蓬","bm":"休门","bs":"值符"},
    ...
  ]
}

当前输入：阳历${dateStr}，节气${jieqi}，${yang?'阳遁':'阴遁'}`;

      const r = await callDeepSeek([{ role: 'system', content: sp }, { role: 'user', content: question ? `请同时回答用户问题：${question}` : '请仅输出排盘JSON' }], { temperature: 0.3, maxTokens: 2048 });

      // 尝试解析JSON
      const jsonMatch = r.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const data = JSON.parse(jsonMatch[0]);
          setInfo(`${data.isYang?'阳遁':'阴遁'}${data.jushu}局 · ${data.jieqi}${data.yuan} · ${data.rigz}日${data.shigz}时 · 旬首${data.xunshou}`);
          setGrid(data.grid);
          onResult(r, []);
          return;
        } catch {}
      }
      // 降级：用基础数据填充
      setInfo(`${yang?'阳遁':'阴遁'} · ${jieqi}`);
      const dipan = getDipanData(yang, 1);
      setGrid(GONG_WEI.map((gw) => ({
        gw,
        dpg: dipan.get(gw) || '戊',
        tpg: '?',
        jx: YUAN_JIU_XING[gw] || '?',
        bm: YUAN_BA_MEN[gw] || '?',
        bs: yang ? (YANG_BA_SHEN[GONG_WEI.indexOf(gw) % 8] || '?') : (YIN_BA_SHEN[GONG_WEI.indexOf(gw) % 8] || '?'),
      })));
      onResult(r, []);
    } catch (err) {
      onResult(`排盘失败：${err instanceof Error ? err.message : ''}`, []);
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div>
          <label className="mb-0.5 block text-[10px] text-inkstone-mute">年</label>
          <input type="number" value={y} onChange={(e) => setY(+e.target.value)} className="w-full rounded-lg border border-bronze/30 bg-cream-light/80 px-2 py-1 text-sm text-inkstone outline-none focus:border-bronze" />
        </div>
        <div>
          <label className="mb-0.5 block text-[10px] text-inkstone-mute">月</label>
          <input type="number" min={1} max={12} value={m} onChange={(e) => setM(+e.target.value)} className="w-full rounded-lg border border-bronze/30 bg-cream-light/80 px-2 py-1 text-sm text-inkstone outline-none focus:border-bronze" />
        </div>
        <div>
          <label className="mb-0.5 block text-[10px] text-inkstone-mute">日</label>
          <input type="number" min={1} max={31} value={d} onChange={(e) => setD(+e.target.value)} className="w-full rounded-lg border border-bronze/30 bg-cream-light/80 px-2 py-1 text-sm text-inkstone outline-none focus:border-bronze" />
        </div>
        <div>
          <label className="mb-0.5 block text-[10px] text-inkstone-mute">时</label>
          <input type="number" min={0} max={23} value={h} onChange={(e) => setH(+e.target.value)} className="w-full rounded-lg border border-bronze/30 bg-cream-light/80 px-2 py-1 text-sm text-inkstone outline-none focus:border-bronze" />
        </div>
      </div>
      <Button onClick={doPaipan} disabled={loading} className="w-full bg-bronze font-kai text-lg text-cream shadow-paper-md hover:bg-bronze/80 disabled:opacity-40">
        {loading ? '排盘中…' : '奇门遁甲排盘'}
      </Button>

      {grid && (
        <div className="space-y-2">
          {info && <p className="text-center text-xs text-inkstone-soft font-kai">{info}</p>}
          <div className="grid grid-cols-3 gap-1.5">
            {grid.map((g) => {
              const isCenter = g.gw === 5;
              const name = GONG_WEI_NAME[g.gw] || '';
              const bg = isCenter ? 'bg-cream-dark/40' : 'bg-cream-light/70';
              return (
                <div key={g.gw} className={`rounded-lg border border-bronze/20 ${bg} p-1.5 text-center ${isCenter ? 'opacity-40' : ''}`}>
                  <div className="flex items-center justify-between px-0.5">
                    <span className="text-[9px] text-inkstone-mute">{BA_GUA[g.gw]}</span>
                    <span className="text-[8px] text-inkstone-mute/60">{name}</span>
                  </div>
                  <div className="mt-0.5 grid grid-cols-2 gap-x-1 text-[10px]">
                    <span className="text-inkstone-soft">地:{g.dpg}</span>
                    <span className="text-bronze-dark">天:{g.tpg}</span>
                  </div>
                  <div className="mt-0.5 text-[9px] text-inkstone-soft">
                    {g.jx && <span className="mr-1">{g.jx}</span>}
                    {g.bm && <span className="mr-1 text-bronze-dark">{g.bm}</span>}
                  </div>
                  {g.bs && <div className="text-[9px] text-inkstone-mute/80">{g.bs}</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div>
        <label className="mb-0.5 block text-[10px] text-inkstone-mute">问题（可选）</label>
        <input value={question} onChange={(e) => setQ(e.target.value)} placeholder="如：事业运势如何？" className="w-full rounded-lg border border-bronze/30 bg-cream-light/80 px-2 py-1 text-sm text-inkstone outline-none focus:border-bronze" />
      </div>
    </div>
  );
};

export default QimenView;
