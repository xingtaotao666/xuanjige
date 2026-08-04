import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import FengShuiCompass from '@/components/fengshui/FengShuiCompass';
import SourceCitations from '@/components/rag/SourceCitations';
import type { RagSource } from '@/types/consult';
import {
  fullAnalysis, floorWuXing,
  type FloorPlanRoom, type Shan24,
} from '@/lib/fengshui/ruleEngine';
import { recognizeFloorPlan, type FloorPlanRoomRaw, generateReport } from '@/lib/fengshui/visionApi';

// ════════════════════════════════════════════════
// Step 1: 户型图上传 + 识别
// ════════════════════════════════════════════════

const ROOM_TYPES: Array<{ value: FloorPlanRoom['type']; label: string }> = [
  { value:'door',label:'入户门' },{ value:'living',label:'客厅' },{ value:'bedroom',label:'卧室' },
  { value:'kitchen',label:'厨房' },{ value:'bathroom',label:'卫生间' },{ value:'study',label:'书房' },
  { value:'balcony',label:'阳台' },{ value:'window',label:'窗户' },{ value:'corridor',label:'走廊' },{ value:'other',label:'其他' },
];

function StepUpload({ onRooms }: { onRooms: (rooms: FloorPlanRoomRaw[]) => void }) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = (reader.result as string).split(',')[1];
      setPhoto(b64);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleRecognize = async () => {
    if (!photo) return;
    setLoading(true);
    try {
      const result = await recognizeFloorPlan(photo);
      if (result.success) {
        onRooms(result.rooms);
      } else {
        setError(result.error || '识别失败');
      }
    } catch { setError('识别服务暂不可用，请手动添加房间'); }
    finally { setLoading(false); }
  };

  const handleSkip = () => {
    // 跳过识别，给一组空的让用户手动加
    onRooms([{ id:'door1',type:'door',label:'入户门',centerX:50,centerY:5,rotation:180,width:8,height:3 }]);
  };

  return (
    <div className="space-y-4">
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl border-2 border-dashed border-bronze/30 bg-cream-dark/10">
        {photo ? (
          <img src={`data:image/jpeg;base64,${photo}`} alt="户型图" className="h-full w-full object-contain rounded-lg" />
        ) : (
          <label className="flex cursor-pointer flex-col items-center gap-2 px-8 py-12 text-center">
            <span className="text-4xl">🏠</span>
            <span className="text-sm text-inkstone-soft">点击上传户型图或手绘图纸</span>
            <span className="text-[10px] text-inkstone-mute">支持 JPG/PNG，清晰平面图效果最佳</span>
            <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
          </label>
        )}
      </div>
      {photo && (
        <div className="flex gap-3">
          <Button onClick={handleRecognize} disabled={loading} className="flex-1 bg-bronze font-kai text-cream hover:bg-bronze/80">
            {loading ? '识别中…' : 'AI 识别户型'}
          </Button>
          <Button variant="outline" onClick={() => setPhoto(null)} className="border-bronze/40 text-inkstone">重新上传</Button>
        </div>
      )}
      <Button variant="ghost" onClick={handleSkip} className="w-full text-inkstone-soft text-sm">
        跳过识别，手动添加房间
      </Button>
      {error && <p className="text-sm text-red-400 text-center">{error}</p>}
    </div>
  );
}

// ════════════════════════════════════════════════
// Step 2: 人工校正 + 手动编辑房间
// ════════════════════════════════════════════════

function RoomEditor({ room, onChange, onDelete }: {
  room: FloorPlanRoomRaw;
  onChange: (r: FloorPlanRoomRaw) => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-lg border border-bronze/20 bg-cream-light/60 p-2">
      <div className="grid grid-cols-3 gap-1.5">
        <select value={room.type} onChange={(e) => onChange({ ...room, type: e.target.value as FloorPlanRoom['type'] })}
          className="rounded border border-bronze/20 bg-cream-light px-1.5 py-1 text-xs text-inkstone outline-none">
          {ROOM_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <input value={room.label} onChange={(e) => onChange({ ...room, label: e.target.value })}
          className="rounded border border-bronze/20 bg-cream-light px-1.5 py-1 text-xs text-inkstone outline-none" placeholder="名称" />
        <button onClick={onDelete} className="text-xs text-red-400 hover:text-red-600">删除</button>
      </div>
      <div className="mt-1 grid grid-cols-5 gap-1">
        {(['centerX','centerY','rotation','width','height'] as const).map((k) => (
          <div key={k} className="flex flex-col">
            <span className="text-[8px] text-inkstone-mute">{k === 'centerX' ? 'X%' : k === 'centerY' ? 'Y%' : k === 'rotation' ? '角°' : k === 'width' ? '宽%' : '高%'}</span>
            <input type="number" value={room[k]} onChange={(e) => onChange({ ...room, [k]: +e.target.value })}
              className="w-full rounded border border-bronze/20 bg-cream-light px-1 py-0.5 text-[10px] text-inkstone outline-none" />
          </div>
        ))}
      </div>
    </div>
  );
}

function StepEdit({ rooms, onConfirm }: { rooms: FloorPlanRoomRaw[]; onConfirm: (rooms: FloorPlanRoomRaw[]) => void }) {
  const [data, setData] = useState<FloorPlanRoomRaw[]>(rooms);

  const update = (idx: number, r: FloorPlanRoomRaw) => {
    const next = [...data]; next[idx] = r; setData(next);
  };
  const remove = (idx: number) => setData(data.filter((_, i) => i !== idx));
  const add = () => {
    setData([...data, { id:`manual_${Date.now()}`, type:'bedroom', label:'新房间', centerX:50, centerY:50, rotation:180, width:20, height:20 }]);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-inkstone-soft">AI 识别结果如有偏差，请在下方调整坐标和类型。每个房间的 X/Y 坐标是从左上角算起的百分比位置。</p>
      <div className="max-h-72 space-y-2 overflow-y-auto">
        {data.map((r, i) => <RoomEditor key={r.id} room={r} onChange={(nr) => update(i, nr)} onDelete={() => remove(i)} />)}
      </div>
      <Button variant="outline" onClick={add} className="w-full border-bronze/30 text-inkstone-soft text-sm">+ 添加房间</Button>
      <Button onClick={() => onConfirm(data)} className="w-full bg-bronze font-kai text-cream hover:bg-bronze/80">
        确认房间布局，进入下一步
      </Button>
    </div>
  );
}

// ════════════════════════════════════════════════
// Step 3: 输入房屋基本信息
// ════════════════════════════════════════════════

function StepInfo({ onAnalyze }: {
  onAnalyze: (params: { year: number; shan: Shan24; xiang: Shan24; birthYear: number; gender: '男' | '女'; floor: number; direction: number; question: string }) => void;
}) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [shan, setShan] = useState<Shan24>('子');
  const [xiang, setXiang] = useState<Shan24>('午');
  const [birthYear, setBY] = useState(1990);
  const [gender, setG] = useState<'男' | '女'>('男');
  const [floor, setF] = useState(1);
  const [direction, setDir] = useState(180);
  const [question, setQ] = useState('');

  const compassChange = useCallback((d: string, opp: string) => {
    setShan(d as Shan24); setXiang(opp as Shan24);
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-inkstone-soft">坐向选择 · 拖拽旋转罗盘</label>
        <FengShuiCompass value={shan} onChange={compassChange} />
        <p className="mt-1 text-center text-[11px] text-inkstone-mute">坐<strong>{shan}</strong>向<strong>{xiang}</strong></p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <div><label className="mb-0.5 block text-[10px] text-inkstone-mute">建房年份</label><input type="number" value={year} onChange={(e) => setYear(+e.target.value)} className="w-full rounded-lg border border-bronze/30 bg-cream-light/80 px-2 py-1 text-sm text-inkstone outline-none focus:border-bronze" /></div>
        <div><label className="mb-0.5 block text-[10px] text-inkstone-mute">朝向度数</label><input type="number" value={direction} onChange={(e) => setDir(+e.target.value)} className="w-full rounded-lg border border-bronze/30 bg-cream-light/80 px-2 py-1 text-sm text-inkstone outline-none focus:border-bronze" /></div>
        <div><label className="mb-0.5 block text-[10px] text-inkstone-mute">楼层</label><input type="number" value={floor} onChange={(e) => setF(+e.target.value)} className="w-full rounded-lg border border-bronze/30 bg-cream-light/80 px-2 py-1 text-sm text-inkstone outline-none focus:border-bronze" /></div>
        <div><label className="mb-0.5 block text-[10px] text-inkstone-mute">宅主性别</label><select value={gender} onChange={(e) => setG(e.target.value as '男' | '女')} className="w-full rounded-lg border border-bronze/30 bg-cream-light/80 px-2 py-1 text-sm text-inkstone outline-none focus:border-bronze"><option>男</option><option>女</option></select></div>
        <div><label className="mb-0.5 block text-[10px] text-inkstone-mute">出生年</label><input type="number" value={birthYear} onChange={(e) => setBY(+e.target.value)} className="w-full rounded-lg border border-bronze/30 bg-cream-light/80 px-2 py-1 text-sm text-inkstone outline-none focus:border-bronze" /></div>
        <div><label className="mb-0.5 block text-[10px] text-inkstone-mute">楼层五行</label><p className="mt-0.5 text-sm text-bronze-dark font-kai">{floorWuXing(floor)}</p></div>
      </div>
      <div>
        <label className="mb-0.5 block text-[10px] text-inkstone-mute">你的问题（可选）</label>
        <Textarea placeholder="如：想了解整体风水格局" value={question} onChange={(e) => setQ(e.target.value)}
          className="min-h-[40px] border-bronze/35 bg-cream-light/95 text-inkstone placeholder:text-inkstone-mute/60 focus:border-bronze text-sm" rows={2} />
      </div>
      <Button onClick={() => onAnalyze({ year, shan, xiang, birthYear, gender, floor, direction, question })}
        className="w-full bg-bronze font-kai text-lg text-cream shadow-paper-md hover:bg-bronze/80">
        开始风水分析
      </Button>
    </div>
  );
}

// ════════════════════════════════════════════════
// 主管线组件
// ════════════════════════════════════════════════

export default function FengShuiPipeline() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [rooms, setRooms] = useState<FloorPlanRoomRaw[]>([]);
  const [params, setParams] = useState<ReturnType<typeof fullAnalysis> | null>(null);
  const [report, setReport] = useState<string | null>(null);
  const [sources, setSources] = useState<RagSource[]>([]);
  const [loading, setLoading] = useState(false);

  const handleRooms = (r: FloorPlanRoomRaw[]) => { setRooms(r); setStep(2); };
  const handleConfirm = (_r: FloorPlanRoomRaw[]) => { setRooms(_r); setStep(3); };
  const handleAnalyze = async (p: { year: number; shan: Shan24; xiang: Shan24; birthYear: number; gender: '男' | '女'; floor: number; direction: number; question: string }) => {
    setParams(p as unknown as ReturnType<typeof fullAnalysis>);
    setLoading(true);
    setStep(4);

    try {
      const analysis = fullAnalysis(p.year, p.shan, p.xiang, p.birthYear, p.gender, p.floor, rooms as FloorPlanRoom[], p.direction);
      setParams(analysis as unknown as ReturnType<typeof fullAnalysis>);

      const result = await generateReport(analysis, p.question);
      setReport(result.text);
      setSources(result.sources);
    } catch (err) {
      setReport(`报告生成失败：${err instanceof Error ? err.message : ''}`);
    } finally { setLoading(false); }
  };

  const handleReset = () => { setStep(1); setRooms([]); setParams(null); setReport(null); setSources([]); };

  const stepNames = ['上传户型图', '校正布局', '填写信息', '分析报告'];

  return (
    <section className="relative min-h-screen py-20">
      <div className="absolute inset-x-0 top-0 h-48 opacity-10 pointer-events-none" aria-hidden="true">
        <div className="h-full w-full bg-gradient-to-b from-bronze/30 to-transparent" />
      </div>
      <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mb-8 text-center">
          <h1 className="font-kai text-3xl font-bold text-inkstone sm:text-4xl">玄机阁 · 风水分析</h1>
          <p className="mt-2 text-sm text-inkstone-soft">上传户型 · AI识别 · 规则引擎 · 古籍参考</p>
        </div>

        {/* 步骤指示器 */}
        <div className="mb-6 flex items-center justify-center gap-1">
          {stepNames.map((name, i) => (
            <div key={name} className="flex items-center gap-1">
              <div className={`rounded-full px-2.5 py-0.5 text-xs font-kai transition-colors ${
                step > i + 1 ? 'bg-bronze/20 text-bronze-dark' :
                step === i + 1 ? 'bg-bronze text-cream' : 'bg-cream-dark/30 text-inkstone-mute'
              }`}>{i + 1}. {name}</div>
              {i < 3 && <span className="text-inkstone-mute/30">→</span>}
            </div>
          ))}
        </div>

        {step < 4 ? (
          <Card className="border-bronze/30 bg-cream-light/90 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="font-kai text-xl text-inkstone">第{step}步：{stepNames[step - 1]}</CardTitle>
              <CardDescription className="text-inkstone-soft">
                {step === 1 && '上传清晰的户型平面图，AI 自动识别各房间位置'}
                {step === 2 && `识别出 ${rooms.length} 个房间，请检查并调整坐标（拖拽或直接修改数值）`}
                {step === 3 && `已确认 ${rooms.length} 个房间，请填写房屋基本信息`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {step === 1 && <StepUpload onRooms={handleRooms} />}
              {step === 2 && <StepEdit rooms={rooms} onConfirm={handleConfirm} />}
              {step === 3 && <StepInfo onAnalyze={handleAnalyze} />}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {loading && !report && (
              <Card className="border-bronze/30 bg-cream-light/90 backdrop-blur-md">
                <CardContent className="py-12 text-center">
                  <div className="mb-3 text-5xl animate-pulse">🔮</div>
                  <p className="text-inkstone-soft font-kai">规则引擎计算中，RAG检索古籍，AI生成报告…</p>
                </CardContent>
              </Card>
            )}

            {report && params && (
              <>
                <Card className="border-bronze/30 bg-cream-light/90 backdrop-blur-md">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="font-kai text-xl text-inkstone">风水分析报告</CardTitle>
                      <CardDescription className="text-inkstone-soft">
                        引擎：{params.xuanKong.yunName} · 坐{params.xuanKong.shan}向{params.xuanKong.xiang}
                      </CardDescription>
                    </div>
                    <Button variant="outline" onClick={handleReset} className="border-bronze/40 text-inkstone hover:bg-bronze/10">重新分析</Button>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none text-inkstone leading-relaxed whitespace-pre-wrap">{report}</div>
                  </CardContent>
                </Card>
                {sources.length > 0 && <SourceCitations sources={sources} />}
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
