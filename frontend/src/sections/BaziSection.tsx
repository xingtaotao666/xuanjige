import { useState, type FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBazi } from '@/hooks/useBazi';
import PillarDisplay from '@/components/bazi/PillarDisplay';
import WuXingChart from '@/components/bazi/WuXingChart';
import ShiShenTable from '@/components/bazi/ShiShenTable';
import SourceCitations from '@/components/rag/SourceCitations';
import type { DaYunPeriod, ShenSha } from '@/types/bazi';

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

function ShenShaBadges({ shensha }: { shensha: ShenSha[] }) {
  if (!shensha || shensha.length === 0) return null;
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-gray-400">神煞</h4>
      <div className="flex flex-wrap gap-2">
        {shensha.map((ss, i) => (
          <div key={i} className="group relative">
            <Badge
              variant="secondary"
              className="cursor-help bg-red-950/40 text-red-300 hover:bg-red-900/50"
            >
              {ss.name}
              {ss.tags && ss.tags.length > 0 && (
                <span className="ml-1 text-[10px] text-gray-500">
                  {ss.tags.join('/')}
                </span>
              )}
            </Badge>
            {ss.description && (
              <div className="absolute bottom-full left-1/2 z-20 mb-2 hidden w-48 -translate-x-1/2 rounded border border-red-900/40 bg-black/95 p-2 text-xs text-gray-400 shadow-lg group-hover:block">
                {ss.description}
                <div className="mt-1 text-[10px] text-gray-600">位置: {ss.position}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function DaYunTimeline({ dayun }: { dayun: DaYunPeriod[] }) {
  if (!dayun || dayun.length === 0) return null;
  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold text-gray-400">大运流年</h4>
      <div className="overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {dayun.map((period, i) => (
            <div
              key={i}
              className="flex w-28 flex-col items-center rounded-lg border border-red-900/30 bg-black/50 p-3"
            >
              <span className="text-[10px] text-gray-500">
                {period.age_start}-{period.age_end}岁
              </span>
              <span className="mt-1 text-lg font-bold text-amber-300">
                {period.gan}{period.zhi}
              </span>
              <span className="mt-1 text-[10px] text-gray-500">
                {period.shishen}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function BaziSection() {
  const { loading, error, result, analyze, reset } = useBazi();

  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [hour, setHour] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [question, setQuestion] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
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
    setSubmitted(false);
    setYear('');
    setMonth('');
    setDay('');
    setHour('');
    setGender('male');
    setQuestion('');
  };

  return (
    <section className="relative min-h-screen py-24">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0d0505] to-black" />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-red-400 sm:text-4xl">
            八字排盘
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            输入生辰信息，获取专业命理分析
          </p>
        </div>

        {/* Form section */}
        {!submitted && (
          <Card className="mx-auto max-w-2xl border-red-900/30 bg-black/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-amber-300">输入生辰信息</CardTitle>
              <CardDescription className="text-gray-500">
                请准确填写您的出生年月日时
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-3">
                  {/* Year */}
                  <div className="space-y-1.5">
                    <Label htmlFor="year" className="text-gray-300">出生年</Label>
                    <Input
                      id="year"
                      type="number"
                      placeholder="如 1990"
                      min={1900}
                      max={2030}
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="border-red-900/40 bg-black/60 text-gray-200 placeholder:text-gray-600 focus:border-red-500"
                      required
                    />
                  </div>

                  {/* Month */}
                  <div className="space-y-1.5">
                    <Label htmlFor="month" className="text-gray-300">出生月</Label>
                    <Input
                      id="month"
                      type="number"
                      placeholder="1-12"
                      min={1}
                      max={12}
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      className="border-red-900/40 bg-black/60 text-gray-200 placeholder:text-gray-600 focus:border-red-500"
                      required
                    />
                  </div>

                  {/* Day */}
                  <div className="space-y-1.5">
                    <Label htmlFor="day" className="text-gray-300">出生日</Label>
                    <Input
                      id="day"
                      type="number"
                      placeholder="1-31"
                      min={1}
                      max={31}
                      value={day}
                      onChange={(e) => setDay(e.target.value)}
                      className="border-red-900/40 bg-black/60 text-gray-200 placeholder:text-gray-600 focus:border-red-500"
                      required
                    />
                  </div>
                </div>

                {/* Hour */}
                <div className="space-y-1.5">
                  <Label htmlFor="hour" className="text-gray-300">出生时辰</Label>
                  <Select value={hour} onValueChange={setHour} required>
                    <SelectTrigger className="border-red-900/40 bg-black/60 text-gray-200 focus:border-red-500">
                      <SelectValue placeholder="选择时辰" />
                    </SelectTrigger>
                    <SelectContent className="border-red-900/30 bg-black/95 text-gray-200">
                      {DIZHI_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Gender */}
                <div className="space-y-1.5">
                  <Label className="text-gray-300">性别</Label>
                  <RadioGroup
                    value={gender}
                    onValueChange={(v) => setGender(v as 'male' | 'female')}
                    className="flex gap-6"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="male" id="male" className="border-red-500 text-red-500" />
                      <Label htmlFor="male" className="text-gray-300 cursor-pointer">男</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="female" id="female" className="border-red-500 text-red-500" />
                      <Label htmlFor="female" className="text-gray-300 cursor-pointer">女</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Question */}
                <div className="space-y-1.5">
                  <Label htmlFor="question" className="text-gray-300">
                    想向大师请教什么？
                    <span className="ml-1 text-xs text-gray-600">(选填)</span>
                  </Label>
                  <Textarea
                    id="question"
                    placeholder="例如：近期事业运势如何？想了解感情方面的走向..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="min-h-[80px] border-red-900/40 bg-black/60 text-gray-200 placeholder:text-gray-600 focus:border-red-500"
                    rows={3}
                  />
                </div>

                {error && (
                  <div className="rounded bg-red-950/40 p-3 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-red-700 text-white hover:bg-red-600"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Spinner /> 排盘中...
                    </span>
                  ) : (
                    '开始排盘'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Loading state */}
        {loading && submitted && (
          <div className="flex flex-col items-center justify-center py-20">
            <Spinner className="mb-4 h-10 w-10 text-red-500" />
            <p className="text-sm text-gray-400">正在推算八字命理...</p>
          </div>
        )}

        {/* Results section */}
        {result && !loading && (
          <div className="space-y-8">
            {/* 四柱八字 */}
            <Card className="border-red-900/30 bg-black/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg text-amber-300">四柱八字</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2 sm:gap-3">
                  <PillarDisplay pillar={result.bazi.year_pillar} label="年柱" />
                  <PillarDisplay pillar={result.bazi.month_pillar} label="月柱" />
                  <PillarDisplay pillar={result.bazi.day_pillar} label="日柱" />
                  <PillarDisplay pillar={result.bazi.hour_pillar} label="时柱" />
                </div>
              </CardContent>
            </Card>

            {/* Detail tabs */}
            <Tabs defaultValue="wuxing" className="w-full">
              <TabsList className="grid w-full grid-cols-2 gap-1 border-red-900/30 bg-black/60 p-1 sm:grid-cols-4">
                <TabsTrigger value="wuxing" className="text-xs text-gray-400 data-[state=active]:text-red-300 sm:text-sm">
                  五行分析
                </TabsTrigger>
                <TabsTrigger value="shishen" className="text-xs text-gray-400 data-[state=active]:text-red-300 sm:text-sm">
                  十神
                </TabsTrigger>
                <TabsTrigger value="shensha" className="text-xs text-gray-400 data-[state=active]:text-red-300 sm:text-sm">
                  神煞
                </TabsTrigger>
                <TabsTrigger value="dayun" className="text-xs text-gray-400 data-[state=active]:text-red-300 sm:text-sm">
                  大运
                </TabsTrigger>
              </TabsList>

              <TabsContent value="wuxing">
                <Card className="border-red-900/30 bg-black/60">
                  <CardHeader>
                    <CardTitle className="text-sm text-amber-300">五行平衡</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <WuXingChart wuxing={result.bazi.wuxing} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="shishen">
                <Card className="border-red-900/30 bg-black/60">
                  <CardHeader>
                    <CardTitle className="text-sm text-amber-300">十神列表</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <ShiShenTable items={result.bazi.shishen} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="shensha">
                <Card className="border-red-900/30 bg-black/60">
                  <CardHeader>
                    <CardTitle className="text-sm text-amber-300">神煞</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ShenShaBadges shensha={result.bazi.shensha} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="dayun">
                <Card className="border-red-900/30 bg-black/60">
                  <CardHeader>
                    <CardTitle className="text-sm text-amber-300">大运流年</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DaYunTimeline dayun={result.bazi.dayun || []} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* AI Interpretation */}
            {result.llm_interpretation && (
              <Card className="border-red-900/30 bg-black/60 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-amber-300">
                    <span>🤖</span> AI 解读
                  </CardTitle>
                  <CardDescription className="text-gray-500">
                    大模型基于命理知识生成的个性化分析
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-invert prose-sm max-w-none prose-headings:text-amber-300 prose-p:text-gray-300 prose-strong:text-red-300 prose-li:text-gray-300">
                    {result.llm_interpretation.split('\n').map((line, i) => {
                      const trimmed = line.trim();
                      // 中文序号标题：一、二、三... 十、 或 （一）
                      if (/^[一二三四五六七八九十]+、/.test(trimmed) || /^（[一二三四五六七八九十]+）/.test(trimmed)) {
                        return (
                          <h3 key={i} className="mt-5 mb-2 flex items-center gap-2 text-base font-bold text-amber-300">
                            <span className="inline-block h-4 w-1 rounded bg-red-600" />
                            {trimmed}
                          </h3>
                        );
                      }
                      // 阿拉伯序号标题：1. 2. 3. 或 1、
                      if (/^\d+[\.、]/.test(trimmed)) {
                        return (
                          <h4 key={i} className="mt-4 mb-1 text-sm font-semibold text-amber-200/90">
                            {trimmed}
                          </h4>
                        );
                      }
                      if (line.startsWith('## ')) {
                        return (
                          <h2 key={i} className="mt-4 mb-2 text-base font-bold text-amber-300">
                            {line.replace('## ', '')}
                          </h2>
                        );
                      }
                      if (line.startsWith('# ')) {
                        return (
                          <h1 key={i} className="mt-5 mb-3 text-lg font-bold text-red-300">
                            {line.replace('# ', '')}
                          </h1>
                        );
                      }
                      if (line.startsWith('### ')) {
                        return (
                          <h3 key={i} className="mt-3 mb-1 text-sm font-semibold text-amber-200/80">
                            {line.replace('### ', '')}
                          </h3>
                        );
                      }
                      if (line.startsWith('- ') || line.startsWith('* ')) {
                        return (
                          <li key={i} className="ml-4 text-sm text-gray-300 list-disc">
                            {line.replace(/^[-*]\s+/, '')}
                          </li>
                        );
                      }
                      if (trimmed === '') return <br key={i} />;
                      return (
                        <p key={i} className="text-sm leading-relaxed text-gray-300">
                          {line}
                        </p>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* RAG Sources */}
            {result.rag_sources && result.rag_sources.length > 0 && (
              <Card className="border-red-900/30 bg-black/60 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <SourceCitations sources={result.rag_sources} />
                </CardContent>
              </Card>
            )}

            {/* Reset button */}
            <div className="text-center">
              <Button
                variant="outline"
                onClick={handleReset}
                className="border-red-700/50 text-red-400 hover:bg-red-950/30"
              >
                重新排盘
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
