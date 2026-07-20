import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { decodeShare } from '@/lib/historyStore';
import { useTheme, dominantElement } from '@/components/ThemeProvider';
import BaziResultView from '@/components/bazi/BaziResultView';
import YijingResultView from '@/components/yijing/YijingResultView';
import TarotResultView from '@/components/tarot/TarotResultView';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { BaziAnalyzeResponse, DivinateResponse, TarotAnalyzeResponse } from '@/types';

export default function ShareView() {
  const [params] = useSearchParams();
  const code = params.get('d');
  const payload = code ? decodeShare(code) : null;
  const { setElement } = useTheme();

  useEffect(() => {
    if (payload?.type === 'bazi') {
      setElement(dominantElement((payload.result as BaziAnalyzeResponse).bazi.wuxing));
    } else {
      setElement('neutral');
    }
    return () => setElement('neutral');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload, setElement]);

  if (!payload) {
    return (
      <section className="relative flex min-h-screen items-center justify-center py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0710] via-[#0d0814] to-[#0a0710]" />
        <div className="relative mx-auto max-w-lg px-4">
          <Card className="border-bronze/25 bg-cream-light/85 backdrop-blur-sm">
            <CardContent className="pt-8 text-center">
              <div className="mb-3 text-5xl">🔮</div>
              <h1 className="font-kai text-2xl font-bold text-bronze-dark text-inkstone">链接已失效</h1>
              <p className="mt-3 text-sm text-inkstone-soft">
                分享链接格式有误或已损坏，无法还原命理结果。
              </p>
              <Link to="/" className="mt-6 inline-block">
                <Button className="bg-bronze font-kai text-inkstone shadow-paper-md hover:bg-bronze/80">
                  回到玄机阁
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  const isBazi = payload.type === 'bazi';
  const isYijing = payload.type === 'yijing';

  return (
    <section className="relative min-h-screen py-24">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0710] via-[#0d0814] to-[#0a0710]" />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
        {/* 分享横幅 */}
        <div className="mb-8 animate-rise rounded-xl border border-bronze/30 bg-cream-light/85 px-6 py-5 text-center backdrop-blur-sm">
          <p className="font-kai text-lg text-bronze-dark text-inkstone">
            🌟 这是朋友通过「玄机阁」分享给你的{isBazi ? '命理' : isYijing ? '占卜' : '塔罗'}结果
          </p>
          <p className="mt-2 text-xs text-inkstone-soft/80">
            内容由 AI 结合传统命理学生成，仅供娱乐与参考
          </p>
        </div>

        {isBazi ? (
          <BaziResultView result={payload.result as BaziAnalyzeResponse} />
        ) : isYijing ? (
          <YijingResultView result={payload.result as DivinateResponse} />
        ) : (
          <TarotResultView result={payload.result as TarotAnalyzeResponse} />
        )}

        {/* 行动召唤 */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link to="/bazi">
            <Button className="bg-bronze font-kai text-inkstone shadow-paper-md hover:bg-bronze/80">
              我也来排八字
            </Button>
          </Link>
          <Link to="/yijing">
            <Button
              variant="outline"
              className="border-bronze/50 text-bronze-dark hover:bg-bronze/10"
            >
              我也来占一卦
            </Button>
          </Link>
          <Link to="/tarot">
            <Button
              variant="outline"
              className="border-bronze/50 text-bronze-dark hover:bg-bronze/10"
            >
              我也来抽塔罗
            </Button>
          </Link>
          <Link to="/">
            <Button
              variant="ghost"
              className="text-inkstone-soft hover:text-inkstone"
            >
              回到首页
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
