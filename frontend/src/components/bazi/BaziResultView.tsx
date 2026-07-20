import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PillarDisplay from '@/components/bazi/PillarDisplay';
import WuXingChart from '@/components/bazi/WuXingChart';
import ShiShenTable from '@/components/bazi/ShiShenTable';
import SourceCitations from '@/components/rag/SourceCitations';
import PayWall from '@/components/payment/PayWall';
import type { BaziAnalyzeResponse, ShenSha, DaYunPeriod } from '@/types';

function ShenShaBadges({ shensha }: { shensha: ShenSha[] }) {
  if (!shensha || shensha.length === 0) return null;
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-inkstone-soft">神煞</h4>
      <div className="flex flex-wrap gap-2">
        {shensha.map((ss, i) => (
          <div key={i} className="group relative">
            <Badge
              variant="secondary"
              className="cursor-help border border-bronze/30 bg-bronze/10 text-bronze-dark hover:bg-bronze/20"
            >
              {ss.name}
              {ss.tags && ss.tags.length > 0 && (
                <span className="ml-1 text-[10px] text-inkstone-soft">
                  {ss.tags.join('/')}
                </span>
              )}
            </Badge>
            {ss.description && (
              <div className="absolute bottom-full left-1/2 z-20 mb-2 hidden w-48 -translate-x-1/2 rounded border border-bronze/30 bg-cream-light/95 p-2 text-xs text-inkstone-soft shadow-lg group-hover:block">
                {ss.description}
                <div className="mt-1 text-[10px] text-inkstone-soft/70">位置: {ss.position}</div>
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
      <h4 className="mb-3 text-sm font-semibold text-inkstone-soft">大运流年</h4>
      <div className="overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {dayun.map((period, i) => (
            <div
              key={i}
              className="flex w-28 flex-col items-center rounded-lg border border-bronze/25 bg-cream-light/90 p-3"
            >
              <span className="text-[10px] text-inkstone-soft">
                {period.age_start}-{period.age_end}岁
              </span>
              <span className="mt-1 text-lg font-bold text-bronze-dark">{period.gan}{period.zhi}</span>
              <span className="mt-1 text-[10px] text-inkstone-soft">{period.shishen}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function BaziResultView({
  result,
  onReset,
  unlockKey,
}: {
  result: BaziAnalyzeResponse;
  onReset?: () => void;
  unlockKey?: string;
}) {
  return (
    <div className="space-y-8 animate-rise">
      <Card className="border-bronze/25 bg-cream-light/85 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="font-kai text-lg text-bronze-dark">四柱八字</CardTitle>
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

      <Tabs defaultValue="wuxing" className="w-full">
        <TabsList className="grid w-full grid-cols-2 gap-1 border-bronze/25 bg-cream-light/85 p-1 sm:grid-cols-4">
          <TabsTrigger value="wuxing" className="text-xs text-inkstone-soft data-[state=active]:text-bronze-dark sm:text-sm">
            五行分析
          </TabsTrigger>
          <TabsTrigger value="shishen" className="text-xs text-inkstone-soft data-[state=active]:text-bronze-dark sm:text-sm">
            十神
          </TabsTrigger>
          <TabsTrigger value="shensha" className="text-xs text-inkstone-soft data-[state=active]:text-bronze-dark sm:text-sm">
            神煞
          </TabsTrigger>
          <TabsTrigger value="dayun" className="text-xs text-inkstone-soft data-[state=active]:text-bronze-dark sm:text-sm">
            大运
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wuxing">
          <Card className="border-bronze/25 bg-cream-light/85">
            <CardHeader>
              <CardTitle className="font-kai text-sm text-bronze-dark">五行平衡</CardTitle>
            </CardHeader>
            <CardContent>
              <WuXingChart wuxing={result.bazi.wuxing} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shishen">
          <Card className="border-bronze/25 bg-cream-light/85">
            <CardHeader>
              <CardTitle className="font-kai text-sm text-bronze-dark">十神列表</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <ShiShenTable items={result.bazi.shishen} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shensha">
          <Card className="border-bronze/25 bg-cream-light/85">
            <CardHeader>
              <CardTitle className="font-kai text-sm text-bronze-dark">神煞</CardTitle>
            </CardHeader>
            <CardContent>
              <ShenShaBadges shensha={result.bazi.shensha} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dayun">
          <Card className="border-bronze/25 bg-cream-light/85">
            <CardHeader>
              <CardTitle className="font-kai text-sm text-bronze-dark">大运流年</CardTitle>
            </CardHeader>
            <CardContent>
              <DaYunTimeline dayun={result.bazi.dayun || []} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* AI 解读 — 付费解锁 */}
      {result.llm_interpretation && (
        <PayWall unlockKey={unlockKey}>
          <Card className="border-bronze/25 bg-cream-light/85 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-kai text-lg text-bronze-dark">
                <span>🤖</span> AI 解读
              </CardTitle>
              <CardDescription className="text-inkstone-soft">
                大模型基于命理知识生成的个性化分析
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert prose-sm max-w-none prose-headings:text-bronze-dark prose-p:text-inkstone/90 prose-strong:text-bronze-dark prose-li:text-inkstone/90">
                {result.llm_interpretation.split('\n').map((line, i) => {
                  const trimmed = line.trim();
                  if (/^[一二三四五六七八九十]+、/.test(trimmed) || /^（[一二三四五六七八九十]+）/.test(trimmed)) {
                    return (
                      <h3 key={i} className="mt-5 mb-2 flex items-center gap-2 text-base font-bold text-bronze-dark">
                        <span className="inline-block h-4 w-1 rounded bg-bronze" />
                        {trimmed}
                      </h3>
                    );
                  }
                  if (/^\d+[\.、]/.test(trimmed)) {
                    return (
                      <h4 key={i} className="mt-4 mb-1 text-sm font-semibold text-bronze-dark/90">
                        {trimmed}
                      </h4>
                    );
                  }
                  if (line.startsWith('## ')) {
                    return (
                      <h2 key={i} className="mt-4 mb-2 text-base font-bold text-bronze-dark">
                        {line.replace('## ', '')}
                      </h2>
                    );
                  }
                  if (line.startsWith('# ')) {
                    return (
                      <h1 key={i} className="mt-5 mb-3 text-lg font-bold text-bronze-dark">
                        {line.replace('# ', '')}
                      </h1>
                    );
                  }
                  if (line.startsWith('### ')) {
                    return (
                      <h3 key={i} className="mt-3 mb-1 text-sm font-semibold text-bronze-dark/80">
                        {line.replace('### ', '')}
                      </h3>
                    );
                  }
                  if (line.startsWith('- ') || line.startsWith('* ')) {
                    return (
                      <li key={i} className="ml-4 text-sm text-inkstone/90 list-disc">
                        {line.replace(/^[-*]\s+/, '')}
                      </li>
                    );
                  }
                  if (trimmed === '') return <br key={i} />;
                  return (
                    <p key={i} className="text-sm leading-relaxed text-inkstone/90">
                      {line}
                    </p>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </PayWall>
      )}

      {/* 引用古籍 */}
      {result.rag_sources && result.rag_sources.length > 0 && (
        <Card className="border-bronze/25 bg-cream-light/85 backdrop-blur-sm">
          <CardContent className="pt-6">
            <SourceCitations sources={result.rag_sources} />
          </CardContent>
        </Card>
      )}

      {onReset && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={onReset}
            className="border-bronze/50 text-bronze-dark hover:bg-bronze/10"
          >
            重新排盘
          </Button>
        </div>
      )}
    </div>
  );
}
