import { useState, type FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { callDeepSeek } from '@/lib/llm/deepseek';
import { searchFengShuiKnowledge } from '@/lib/rag/fengshuiKnowledge';
import FengShuiCompass from '@/components/fengshui/FengShuiCompass';
import QimenView from '@/sections/fengshui/QimenView';
import FengShuiPipeline from '@/sections/fengshui/FengShuiPipeline';
import SourceCitations from '@/components/rag/SourceCitations';
import type { RagSource } from '@/types/consult';

const TABS = ['智能分析', '宅体分析', '奇门遁甲', '玄空九宫', '布煞', '择日参考', '水法'] as const;
type Tab = typeof TABS[number];

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-xl bg-cream-dark/40 p-1">
      {TABS.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`rounded-lg px-3 py-1.5 text-sm font-kai transition-colors ${
            active === t
              ? 'bg-bronze text-cream shadow-sm'
              : 'text-inkstone-soft hover:bg-bronze/10'
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={`mb-1 block text-xs font-medium text-inkstone-soft ${className ?? ''}`}>{children}</label>;
}

// ========== 宅体分析 ==========
function ZhaiTiView({ onResult }: { onResult: (r: string, s: RagSource[]) => void }) {
  const [zhuangXiu, setZX] = useState('2024');
  const [zuo, setZuo] = useState('子');
  const [xiang, setXiang] = useState('午');
  const [louCeng, setLC] = useState('1');
  const [xingBie, setXB] = useState('男');
  const [shengNian, setSN] = useState('1990');
  const [question, setQ] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCompassChange = (d: string, opp: string) => {
    setZuo(d);
    setXiang(opp);
  };

  const handleAnalyze = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const kw = ['风水', '阳宅', '八宅', '玄空', zuo, xiang, `坐${zuo}`, `向${xiang}`];
    let sources: RagSource[] = [];
    try {
      sources = await searchFengShuiKnowledge([question, zuo + '山' + xiang + '向', shengNian], kw);
    } catch {}
    try {
      const knowledge = sources.map((s) => `【${s.book}】${s.text}`).join('\n\n');
      const sp = '你是一位精通玄空飞星、八宅明镜、阳宅三要、水法择日的资深风水师。请根据提供的住宅信息和古籍参考，给出专业的风水分析和实用建议。声明仅供娱乐参考。';
      const ut = `住宅信息：
- 装修/建成时间：${zhuangXiu}年
- 坐向：坐${zuo}向${xiang}（${zuo}山${xiang}向）
- 总楼层/所在层：${louCeng}层/第${louCeng}层
- 宅主性别：${xingBie}，出生年：${shengNian}
- 具体问题：${question || '请给出综合风水分析'}

参考风水古籍知识：
${knowledge || '暂无匹配的古籍内容'}

请从以下方面分析：
1. 玄空飞星：根据坐向推算宅运盘，分析各宫位吉凶
2. 八宅命卦：根据宅主年命推算命卦，判断宅命是否相配
3. 阳宅三要：门/主/灶的布局建议
4. 楼层五行：楼层与宅主五行的生克关系
5. 水法建议：收水放水的吉位判断
6. 综合调整建议`;

      const r = await callDeepSeek([{ role: 'system', content: sp }, { role: 'user', content: ut }], { temperature: 0.5, maxTokens: 4096 });
      onResult(r, sources);
    } catch (err) {
      onResult(`分析失败：${err instanceof Error ? err.message : '请稍后重试'}`, sources);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleAnalyze} className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div><Label>建成/装修年份</Label><input value={zhuangXiu} onChange={(e) => setZX(e.target.value)} className="w-full rounded-lg border border-bronze/30 bg-cream-light/80 px-3 py-1.5 text-sm text-inkstone outline-none focus:border-bronze" /></div>
        <div><Label>楼层</Label><input value={louCeng} onChange={(e) => setLC(e.target.value)} className="w-full rounded-lg border border-bronze/30 bg-cream-light/80 px-3 py-1.5 text-sm text-inkstone outline-none focus:border-bronze" /></div>
        <div><Label>宅主性别</Label><select value={xingBie} onChange={(e) => setXB(e.target.value)} className="w-full rounded-lg border border-bronze/30 bg-cream-light/80 px-3 py-1.5 text-sm text-inkstone outline-none focus:border-bronze"><option>男</option><option>女</option></select></div>
        <div><Label>出生年</Label><input value={shengNian} onChange={(e) => setSN(e.target.value)} className="w-full rounded-lg border border-bronze/30 bg-cream-light/80 px-3 py-1.5 text-sm text-inkstone outline-none focus:border-bronze" /></div>
      </div>
      <div>
        <Label>坐向选择 · 拖拽旋转罗盘</Label>
        <FengShuiCompass value={zuo} onChange={handleCompassChange} />
      </div>
      <div className="text-center text-[11px] text-inkstone-mute">
        当前：坐 <strong>{zuo}</strong> 向 <strong>{xiang}</strong>（{zuo}山{xiang}向）
      </div>
      <div><Label>你的问题（可选，留空则综合解读）</Label>
        <Textarea placeholder="如：我想了解住宅的财运和健康运势" value={question} onChange={(e) => setQ(e.target.value)}
          className="min-h-[50px] border-bronze/35 bg-cream-light/95 text-inkstone placeholder:text-inkstone-mute/60 focus:border-bronze" rows={2} />
      </div>
      <Button type="submit" disabled={loading}
        className="w-full bg-bronze font-kai text-lg text-cream shadow-paper-md hover:bg-bronze/80 disabled:opacity-40">
        {loading ? '🔮 风水分析中…' : '🔮 开始风水分析'}
      </Button>
    </form>
  );
}

// ========== 玄空九宫 ==========
function XuanKongView({ onResult }: { onResult: (r: string, s: RagSource[]) => void }) {
  const [year, setYear] = useState('2024');
  const [zuo, setZuo] = useState('子');
  const [xiang, setXiang] = useState('午');
  const [du, setDu] = useState('180');
  const [loading, setLoading] = useState(false);

  const dirs: string[] = '子癸丑艮寅甲卯乙辰巽巳丙午丁未坤申庚酉辛戌乾亥壬'.match(/.{1,2}/g) ?? [];

  const handleDo = async () => {
    setLoading(true);
    const kw = ['玄空飞星', '九宫', '飞星', zuo + '山' + xiang + '向', year];
    let sources: RagSource[] = [];
    try { sources = await searchFengShuiKnowledge([zuo + '山' + xiang + '向', '玄空', '飞星', year], kw); } catch {}
    try {
      const k = sources.map((s) => `【${s.book}】${s.text}`).join('\n\n');
      const sp = '你是一位精通玄空飞星的风水师。请详细排盘分析。';
      const ut = `房屋${year}年建成，坐${zuo}向${xiang}（${zuo}山${xiang}向），朝向${du}度。请做玄空飞星排盘分析：
1. 定运盘：根据建成年份确定元运，排出运盘
2. 定山向星：确定山星和向星入中数字
3. 排山盘和向盘：按坐向阴阳确定顺逆飞
4. 合成宅命盘：各宫山向星组合
5. 九宫逐宫详批：每宫的山星/向星/运星组合吉凶
6. 总体评价与布局建议
参考古籍：${k || '无匹配'}`;
      const r = await callDeepSeek([{ role: 'system', content: sp }, { role: 'user', content: ut }], { temperature: 0.5, maxTokens: 4096 });
      onResult(r, sources);
    } catch (err) { onResult(`分析失败：${err instanceof Error ? err.message : ''}`, sources); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div><Label>房屋建成年份</Label><input value={year} onChange={(e) => setYear(e.target.value)} className="w-full rounded-lg border border-bronze/30 bg-cream-light/80 px-3 py-1.5 text-sm text-inkstone outline-none focus:border-bronze" /></div>
        <div><Label>坐山</Label><select value={zuo} onChange={(e) => setZuo(e.target.value)} className="w-full rounded-lg border border-bronze/30 bg-cream-light/80 px-3 py-1.5 text-sm text-inkstone outline-none focus:border-bronze">{dirs.map((d) => <option key={d} value={d}>{d}</option>)}</select></div>
        <div><Label>朝向</Label><select value={xiang} onChange={(e) => setXiang(e.target.value)} className="w-full rounded-lg border border-bronze/30 bg-cream-light/80 px-3 py-1.5 text-sm text-inkstone outline-none focus:border-bronze">{dirs.map((d) => <option key={d} value={d}>{d}</option>)}</select></div>
        <div><Label>朝向度数</Label><input value={du} onChange={(e) => setDu(e.target.value)} className="w-full rounded-lg border border-bronze/30 bg-cream-light/80 px-3 py-1.5 text-sm text-inkstone outline-none focus:border-bronze" /></div>
      </div>
      <Button onClick={handleDo} disabled={loading} className="w-full bg-bronze font-kai text-lg text-cream shadow-paper-md hover:bg-bronze/80 disabled:opacity-40">
        {loading ? '🧮 排盘中…' : '🧮 玄空飞星排盘分析'}
      </Button>
    </div>
  );
}

// ========== 布煞 ==========
function BushaView({ onResult }: { onResult: (r: string, s: RagSource[]) => void }) {
  const cats = [{ k: '命局', d: '日柱九宫' }, { k: '年煞', d: '太岁年煞' }, { k: '月煞', d: '月建月煞' }, { k: '紫白', d: '紫白飞星' }, { k: '年吉', d: '年四吉方' }, { k: '月吉', d: '月吉方位' }, { k: '都天', d: '十二都天' }, { k: '龙门', d: '龙门八法' }, { k: '八煞', d: '八煞水法' }, { k: '流财', d: '流年财位' }, { k: '文昌', d: '文昌位' }, { k: '桃花', d: '桃花位' }];
  const [selCat, setCat] = useState('命局');
  const [loading, setLoading] = useState(false);

  const handleDo = async () => {
    setLoading(true);
    let sources: RagSource[] = [];
    try { sources = await searchFengShuiKnowledge([selCat, '九宫', '布煞'], [selCat, '九宫', '煞']); } catch {}
    try {
      const k = sources.map((s) => `【${s.book}】${s.text}`).join('\n\n');
      const r = await callDeepSeek([
        { role: 'system', content: '你是风水布煞九宫专家。请详细分析选定的九宫类别。' },
        { role: 'user', content: `请分析风水九宫中的「${selCat}」类别。当前日期为${new Date().toLocaleDateString('zh-CN')}。\n\n参考知识：${k || '无'}` },
      ], { temperature: 0.5, maxTokens: 3072 });
      onResult(r, sources);
    } catch (err) { onResult(`分析失败：${err instanceof Error ? err.message : ''}`, sources); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-1.5">
        {cats.map((c) => (
          <button key={c.k} onClick={() => setCat(c.k)}
            className={`rounded-lg border px-2 py-1.5 text-xs transition-colors ${selCat === c.k ? 'bg-bronze text-cream border-bronze' : 'bg-cream-light/60 text-inkstone-soft border-bronze/20 hover:border-bronze/40'}`}>
            {c.k}<br /><span className="opacity-60 text-[9px]">{c.d}</span>
          </button>
        ))}
      </div>
      <Button onClick={handleDo} disabled={loading} className="w-full bg-bronze font-kai text-lg text-cream shadow-paper-md hover:bg-bronze/80 disabled:opacity-40">
        {loading ? '🔮 分析中…' : `🔮 分析：${selCat}九宫`}
      </Button>
    </div>
  );
}

// ========== 择日 ==========
function ZeRiView({ onResult }: { onResult: (r: string, s: RagSource[]) => void }) {
  const purposes = ['入宅', '开业', '嫁娶', '修造', '动土', '出行', '安葬', '签约'];
  const [sel, setSel] = useState('入宅');
  const [loading, setLoading] = useState(false);

  const handleDo = async () => {
    setLoading(true);
    let sources: RagSource[] = [];
    try { sources = await searchFengShuiKnowledge([sel, '择日', '吉日'], [sel, '择日', '吉日']); } catch {}
    try {
      const k = sources.map((s) => `【${s.book}】${s.text}`).join('\n\n');
      const r = await callDeepSeek([
        { role: 'system', content: '你是精通择日学的风水师。请为指定用途推荐吉日。' },
        { role: 'user', content: `当前日期：${new Date().toLocaleDateString('zh-CN')}。请为「${sel}」推荐近期的吉日，说明吉日原因和宜忌。\n风水择日知识：${k || '无'}` },
      ], { temperature: 0.5, maxTokens: 3072 });
      onResult(r, sources);
    } catch (err) { onResult(`分析失败：${err instanceof Error ? err.message : ''}`, sources); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {purposes.map((p) => (
          <button key={p} onClick={() => setSel(p)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-kai transition-colors ${sel === p ? 'bg-bronze text-cream border-bronze' : 'bg-cream-light/60 text-inkstone-soft border-bronze/20 hover:border-bronze/40'}`}>
            {p}
          </button>
        ))}
      </div>
      <Button onClick={handleDo} disabled={loading} className="w-full bg-bronze font-kai text-lg text-cream shadow-paper-md hover:bg-bronze/80 disabled:opacity-40">
        {loading ? '📅 推算中…' : `📅 推荐${sel}吉日`}
      </Button>
    </div>
  );
}

// ========== 水法 ==========
function ShuiFaView({ onResult }: { onResult: (r: string, s: RagSource[]) => void }) {
  const dirs: string[] = '子癸丑艮寅甲卯乙辰巽巳丙午丁未坤申庚酉辛戌乾亥壬'.match(/.{1,2}/g) ?? [];
  const [zuo, setZuo] = useState('子');
  const [lai, setLai] = useState('申');
  const [qu, setQu] = useState('辰');
  const [loading, setLoading] = useState(false);

  const handleDo = async () => {
    setLoading(true);
    let sources: RagSource[] = [];
    try { sources = await searchFengShuiKnowledge([zuo, lai, qu, '水法', '长生', '龙门'], ['水法', '长生诀', zuo, lai, qu]); } catch {}
    try {
      const k = sources.map((s) => `【${s.book}】${s.text}`).join('\n\n');
      const r = await callDeepSeek([
        { role: 'system', content: '你是精通水法长生诀的风水师。请分析来水去水的吉凶。' },
        { role: 'user', content: `住宅坐${zuo}向${dirs[(dirs.indexOf(zuo) + 12) % 24]}。来水方：${lai}，去水方：${qu}。请用水法长生诀分析来水去水吉凶，并结合龙门八法给出建议。\n\n风水知识：${k || '无'}` },
      ], { temperature: 0.5, maxTokens: 3072 });
      onResult(r, sources);
    } catch (err) { onResult(`分析失败：${err instanceof Error ? err.message : ''}`, sources); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div><Label>坐向</Label><select value={zuo} onChange={(e) => setZuo(e.target.value)} className="w-full rounded-lg border border-bronze/30 bg-cream-light/80 px-3 py-1.5 text-sm text-inkstone outline-none focus:border-bronze">{dirs.map((d) => <option key={d} value={d}>{d}山{dirs[(dirs.indexOf(d) + 12) % 24]}向</option>)}</select></div>
        <div><Label>来水方</Label><select value={lai} onChange={(e) => setLai(e.target.value)} className="w-full rounded-lg border border-bronze/30 bg-cream-light/80 px-3 py-1.5 text-sm text-inkstone outline-none focus:border-bronze">{dirs.map((d) => <option key={d} value={d}>{d}</option>)}</select></div>
        <div><Label>去水方</Label><select value={qu} onChange={(e) => setQu(e.target.value)} className="w-full rounded-lg border border-bronze/30 bg-cream-light/80 px-3 py-1.5 text-sm text-inkstone outline-none focus:border-bronze">{dirs.map((d) => <option key={d} value={d}>{d}</option>)}</select></div>
      </div>
      <Button onClick={handleDo} disabled={loading} className="w-full bg-bronze font-kai text-lg text-cream shadow-paper-md hover:bg-bronze/80 disabled:opacity-40">
        {loading ? '💧 分析中…' : '💧 水法分析'}
      </Button>
    </div>
  );
}

// ========== 主组件 ==========
export default function FengShuiSection() {
  const [tab, setTab] = useState<Tab>('宅体分析');
  const [result, setResult] = useState<string | null>(null);
  const [sources, setSources] = useState<RagSource[]>([]);

  const handleResult = (r: string, s: RagSource[]) => { setResult(r); setSources(s); };
  const handleReset = () => { setResult(null); setSources([]); };

  return (
    <section className="relative min-h-screen py-20">
      <div className="absolute inset-x-0 top-0 h-48 opacity-10 pointer-events-none" aria-hidden="true">
        <div className="h-full w-full bg-gradient-to-b from-bronze/30 to-transparent" />
      </div>
      <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mb-8 text-center">
          <h1 className="font-kai text-3xl font-bold text-inkstone sm:text-4xl">玄机阁 · 风水分析</h1>
          <p className="mt-2 text-sm text-inkstone-soft">宅藏乾坤 · 气定吉凶</p>
        </div>

        {!result ? (
          <Card className="border-bronze/30 bg-cream-light/90 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="font-kai text-xl text-inkstone">风水分析</CardTitle>
              <CardDescription className="text-inkstone-soft">
                输入住宅信息，结合玄空飞星、八宅明镜、阳宅三要等古籍为你分析风水
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <TabBar active={tab} onChange={setTab} />
              {tab === '智能分析' && <FengShuiPipeline />}
              {tab === '宅体分析' && <ZhaiTiView onResult={handleResult} />}
              {tab === '奇门遁甲' && <QimenView onResult={handleResult} />}
              {tab === '玄空九宫' && <XuanKongView onResult={handleResult} />}
              {tab === '布煞' && <BushaView onResult={handleResult} />}
              {tab === '择日参考' && <ZeRiView onResult={handleResult} />}
              {tab === '水法' && <ShuiFaView onResult={handleResult} />}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="border-bronze/30 bg-cream-light/90 backdrop-blur-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-kai text-xl text-inkstone">{tab} · 分析结果</CardTitle>
                </div>
                <Button variant="outline" onClick={handleReset} className="border-bronze/40 text-inkstone hover:bg-bronze/10">
                  重新分析
                </Button>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none text-inkstone leading-relaxed whitespace-pre-wrap">{result}</div>
              </CardContent>
            </Card>
            {sources.length > 0 && <SourceCitations sources={sources} />}
          </div>
        )}
      </div>
    </section>
  );
}
