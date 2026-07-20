import { useState, useEffect, type FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useBazi } from '@/hooks/useBazi';
import { useTheme, dominantElement } from '@/components/ThemeProvider';
import RitualLoader from '@/components/RitualLoader';
import BaziResultView from '@/components/bazi/BaziResultView';
import { useHistory } from '@/hooks/useHistory';
import {
  buildShareUrl,
  genId,
  makeRecordKey,
  type BaziInputSnapshot,
} from '@/lib/historyStore';

const DIZHI_OPTIONS = [
  { value: '0', label: '子时 23:00-00:59' },
  { value: '1', label: '丑时 01:00-02:59' },
  { value: '2', label: '寅时 03:00-04:59' },
  { value: '3', label: '卯时 05:00-06:59' },
  { value: '4', label: '辰时 07:00-08:59' },
  { value: '5', label: '巳时 09:00-10:59' },
  { value: '6', label: '午时 11:00-12:59' },
  { value: '7', label: '未时 13:00-14:59' },
  { value: '8', label: '申时 15:00-16:59' },
  { value: '9', label: '酉时 17:00-18:59' },
  { value: '10', label: '戌时 19:00-20:59' },
  { value: '11', label: '亥时 21:00-22:59' },
];

export default function BaziSection() {
  const { loading, error, result, analyze, reset } = useBazi();
  const { setElement } = useTheme();
  const { records, add } = useHistory();

  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [hour, setHour] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [question, setQuestion] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState('');

  // 结果返回时，根据五行主导元素切换全站强调色
  useEffect(() => {
    if (result) setElement(dominantElement(result.bazi.wuxing));
  }, [result, setElement]);

  const buildInput = (): BaziInputSnapshot => ({
    birth_year: parseInt(year, 10),
    birth_month: parseInt(month, 10),
    birth_day: parseInt(day, 10),
    birth_hour: parseInt(hour, 10),
    gender,
    question: question || undefined,
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFeedback('');
    setSubmitted(true);
    analyze({
      birth_year: parseInt(year, 10),
      birth_month: parseInt(month, 10),
      birth_day: parseInt(day, 10),
      birth_hour: parseInt(hour, 10),
      gender,
      with_llm: true,
      with_rag: true,
      question: question || undefined,
    });
  };

  const handleReset = () => {
    reset();
    setElement('neutral');
    setSubmitted(false);
    setFeedback('');
    setYear('');
    setMonth('');
    setDay('');
    setHour('');
    setGender('male');
    setQuestion('');
  };

  const handleSave = () => {
    if (!result) return;
    const input = buildInput();
    const key = makeRecordKey('bazi', input);
    const existed = records.some((r) => r.key === key);
    add({
      id: genId(),
      key,
      type: 'bazi',
      createdAt: Date.now(),
      title: `${year}年${month}月${day}日 · ${gender === 'male' ? '男' : '女'}${
        question ? ` · ${question.slice(0, 12)}` : ''
      }`,
      input,
      result,
    });
    setFeedback(existed ? '该命盘已在您的记忆中' : '已存入本地记忆 ✦');
  };

  const handleShare = async () => {
    if (!result) return;
    const url = buildShareUrl({
      v: 1,
      type: 'bazi',
      createdAt: Date.now(),
      input: buildInput(),
      result,
    });
    try {
      await navigator.clipboard.writeText(url);
      setFeedback('分享链接已复制到剪贴板 🔗');
    } catch {
      setFeedback('复制失败，可手动复制当前页面地址分享');
    }
  };

  return (
    <section className="relative min-h-screen py-24">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0710] via-[#0d0814] to-[#0a0710]" />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mb-10 text-center">
          <h1 className="font-kai text-3xl font-bold text-bronze-dark title-glow sm:text-4xl">八字排盘</h1>
          <p className="mt-2 text-sm text-inkstone-soft">输入生辰信息，获取专业命理分析</p>
        </div>

        {/* Form section */}
        {!submitted && (
          <Card className="mx-auto max-w-2xl border-bronze/25 bg-cream-light/85 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-kai text-bronze-dark">输入生辰信息</CardTitle>
              <CardDescription className="text-inkstone-soft">请准确填写您的出生年月日时</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="year" className="text-inkstone/90">出生年</Label>
                    <Input
                      id="year"
                      type="number"
                      placeholder="如 1990"
                      min={1900}
                      max={2030}
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="border-bronze/30 bg-cream-light/95 text-inkstone placeholder:text-inkstone-soft/60 focus:border-bronze"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="month" className="text-inkstone/90">出生月</Label>
                    <Input
                      id="month"
                      type="number"
                      placeholder="1-12"
                      min={1}
                      max={12}
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      className="border-bronze/30 bg-cream-light/95 text-inkstone placeholder:text-inkstone-soft/60 focus:border-bronze"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="day" className="text-inkstone/90">出生日</Label>
                    <Input
                      id="day"
                      type="number"
                      placeholder="1-31"
                      min={1}
                      max={31}
                      value={day}
                      onChange={(e) => setDay(e.target.value)}
                      className="border-bronze/30 bg-cream-light/95 text-inkstone placeholder:text-inkstone-soft/60 focus:border-bronze"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="hour" className="text-inkstone/90">出生时辰</Label>
                  <Select value={hour} onValueChange={setHour} required>
                    <SelectTrigger className="border-bronze/30 bg-cream-light/95 text-inkstone focus:border-bronze">
                      <SelectValue placeholder="选择时辰" />
                    </SelectTrigger>
                    <SelectContent className="border-bronze/30 bg-cream-light/95 text-inkstone">
                      {DIZHI_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-inkstone/90">性别</Label>
                  <RadioGroup
                    value={gender}
                    onValueChange={(v) => setGender(v as 'male' | 'female')}
                    className="flex gap-6"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="male" id="male" className="border-bronze text-bronze-dark" />
                      <Label htmlFor="male" className="cursor-pointer text-inkstone/90">男</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="female" id="female" className="border-bronze text-bronze-dark" />
                      <Label htmlFor="female" className="cursor-pointer text-inkstone/90">女</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="question" className="text-inkstone/90">
                    想向大师请教什么？<span className="ml-1 text-xs text-inkstone-soft/70">(选填)</span>
                  </Label>
                  <Textarea
                    id="question"
                    placeholder="例如：近期事业运势如何？想了解感情方面的走向..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="min-h-[80px] border-bronze/30 bg-cream-light/95 text-inkstone placeholder:text-inkstone-soft/60 focus:border-bronze"
                    rows={3}
                  />
                </div>

                {error && (
                  <div className="rounded bg-red-950/40 p-3 text-sm text-red-300">{error}</div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-bronze font-kai text-inkstone shadow-glow-md transition hover:bg-bronze/80"
                >
                  {loading ? '排盘中…' : '开始排盘'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Loading state —— 仪式感动效 */}
        {loading && submitted && (
          <RitualLoader
            variant="bazi"
            label="正在推算八字命理…"
            sublabel="周天星斗 · 演算五行生克"
          />
        )}

        {/* Results section */}
        {result && !loading && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                variant="outline"
                onClick={handleSave}
                className="border-bronze/50 text-bronze-dark hover:bg-bronze/10"
              >
                💾 存入记忆
              </Button>
              <Button
                variant="default"
                onClick={handleShare}
                className="bg-bronze text-inkstone shadow-glow-md transition hover:bg-bronze/80"
              >
                🔗 复制分享链接
              </Button>
            </div>
            {feedback && (
              <p className="text-center text-sm text-bronze-dark/90 animate-rise">{feedback}</p>
            )}
            <BaziResultView result={result} onReset={handleReset} unlockKey={makeRecordKey('bazi', buildInput())} />
          </div>
        )}
      </div>
    </section>
  );
}
