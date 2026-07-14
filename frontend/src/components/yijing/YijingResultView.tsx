import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import GuaDisplay from '@/components/yijing/GuaDisplay';
import SourceCitations from '@/components/rag/SourceCitations';
import PayWall from '@/components/payment/PayWall';
import type { DivinateResponse } from '@/types';

export default function YijingResultView({
  result,
  onReset,
  unlockKey,
}: {
  result: DivinateResponse;
  onReset?: () => void;
  unlockKey?: string;
}) {
  return (
    <div className="space-y-8 animate-rise">
      <Card className="border-element/25 bg-card/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="font-kai text-lg text-gold">卦象</CardTitle>
          <CardDescription className="text-muted-foreground">问题: {result.gua.question}</CardDescription>
        </CardHeader>
        <CardContent>
          <GuaDisplay gua={result.gua} />
        </CardContent>
      </Card>

      {result.llm_interpretation && (
        <PayWall unlockKey={unlockKey}>
          <Card className="border-element/25 bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-kai text-lg text-gold">
              <span>🤖</span> AI 解卦
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              结合卦象爻辞与您的问题生成的个性化解读
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-invert prose-sm max-w-none prose-headings:text-gold prose-p:text-foreground/90 prose-strong:text-element prose-li:text-foreground/90">
              {result.llm_interpretation.split('\n').map((line, i) => {
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
                if (line.startsWith('- ')) {
                  return (
                    <li key={i} className="ml-4 text-sm text-foreground/90 list-disc">
                      {line.replace('- ', '')}
                    </li>
                  );
                }
                if (line.trim() === '') return <br key={i} />;
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
