import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import TarotCard from '@/components/tarot/TarotCard';
import SourceCitations from '@/components/rag/SourceCitations';
import PayWall from '@/components/payment/PayWall';
import type { TarotAnalyzeResponse } from '@/types/tarot';

export default function TarotResultView({
  result,
  onReset,
  unlockKey,
}: {
  result: TarotAnalyzeResponse;
  onReset?: () => void;
  unlockKey?: string;
}) {
  const { tarot } = result;
  const spreadLabels: Record<string, string> = {
    single: '单张牌',
    three: '三张牌',
    cross: '六芒星',
    celtic: '凯尔特十字',
  };

  return (
    <div className="space-y-8 animate-rise">
      {/* 牌面展示 */}
      <Card className="border-element/25 bg-card/60 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-kai text-lg text-gold">🃏 塔罗牌阵</CardTitle>
              <CardDescription className="text-muted-foreground">
                {spreadLabels[tarot.spread] || tarot.spread} · {tarot.cards.length} 张牌
              </CardDescription>
            </div>
          </div>
          {tarot.question && (
            <p className="text-sm text-muted-foreground/80">所问：{tarot.question}</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tarot.cards.map((placement, i) => (
              <TarotCard key={i} placement={placement} index={i} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI 解读 — 付费解锁 */}
      {result.llm_interpretation && (
        <PayWall unlockKey={unlockKey}>
          <Card className="border-element/25 bg-card/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-kai text-lg text-gold">
                <span>🔮</span> AI 塔罗解读
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                结合牌阵与您的问题生成的个性化占卜解读
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert prose-sm max-w-none prose-headings:text-gold prose-p:text-foreground/90 prose-strong:text-element prose-li:text-foreground/90">
                {result.llm_interpretation.split('\n').map((line, i) => {
                  const trimmed = line.trim();
                  if (/^[一二三四五六七八九十]+[、\.]/.test(trimmed) || /^（[一二三四五六七八九十]+）/.test(trimmed)) {
                    return (
                      <h3 key={i} className="mt-5 mb-2 flex items-center gap-2 text-base font-bold text-gold">
                        <span className="inline-block h-4 w-1 rounded bg-element" />
                        {trimmed}
                      </h3>
                    );
                  }
                  if (/^\d+[\.、]/.test(trimmed)) {
                    return (
                      <h4 key={i} className="mt-4 mb-1 text-sm font-semibold text-gold/90">
                        {trimmed}
                      </h4>
                    );
                  }
                  if (line.startsWith('## ')) {
                    return (
                      <h2 key={i} className="mt-4 mb-2 text-base font-bold text-gold">
                        {line.replace('## ', '')}
                      </h2>
                    );
                  }
                  if (line.startsWith('# ')) {
                    return (
                      <h1 key={i} className="mt-5 mb-3 text-lg font-bold text-element">
                        {line.replace('# ', '')}
                      </h1>
                    );
                  }
                  if (line.startsWith('### ')) {
                    return (
                      <h3 key={i} className="mt-3 mb-1 text-sm font-semibold text-gold/80">
                        {line.replace('### ', '')}
                      </h3>
                    );
                  }
                  if (line.startsWith('- ') || line.startsWith('* ')) {
                    return (
                      <li key={i} className="ml-4 text-sm text-foreground/90 list-disc">
                        {line.replace(/^[-*]\s+/, '')}
                      </li>
                    );
                  }
                  if (trimmed === '') return <br key={i} />;
                  return (
                    <p key={i} className="text-sm leading-relaxed text-foreground/90">
                      {line}
                    </p>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </PayWall>
      )}

      {/* 引用古籍 / 塔罗知识 */}
      {result.rag_sources && result.rag_sources.length > 0 && (
        <Card className="border-element/25 bg-card/60 backdrop-blur-sm">
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
            className="border-element/50 text-element hover:bg-element/10"
          >
            重新占卜
          </Button>
        </div>
      )}
    </div>
  );
}
