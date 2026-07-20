import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useHistory } from '@/hooks/useHistory';
import { useTheme, dominantElement } from '@/components/ThemeProvider';
import BaziResultView from '@/components/bazi/BaziResultView';
import YijingResultView from '@/components/yijing/YijingResultView';
import TarotResultView from '@/components/tarot/TarotResultView';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buildShareUrl, type SharePayload, type HistoryRecord } from '@/lib/historyStore';
import type { BaziAnalyzeResponse, DivinateResponse, TarotAnalyzeResponse } from '@/types';

function formatDate(ts: number): string {
  try {
    return new Date(ts).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export default function HistoryPage() {
  const { records, remove, clear } = useHistory();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [shareFeedback, setShareFeedback] = useState('');
  const { setElement } = useTheme();

  const handleShareRecord = async (rec: HistoryRecord) => {
    const payload: SharePayload = {
      v: 1,
      type: rec.type,
      createdAt: rec.createdAt,
      input: rec.input,
      result: rec.result,
    };
    const url = buildShareUrl(payload);
    try {
      await navigator.clipboard.writeText(url);
      setShareFeedback(`${rec.type === 'bazi' ? '八字命盘' : '易经卦象'}分享链接已复制 ✦`);
    } catch {
      setShareFeedback('复制失败，可手动复制当前页地址分享');
    }
    setTimeout(() => setShareFeedback(''), 3000);
  };

  // 展开某条八字记录时，联动全站五行主题
  useEffect(() => {
    const rec = records.find((r) => r.id === expanded);
    if (rec?.type === 'bazi') {
      setElement(dominantElement((rec.result as BaziAnalyzeResponse).bazi.wuxing));
    } else {
      setElement('neutral');
    }
    return () => setElement('neutral');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded, records, setElement]);

  return (
    <section className="relative min-h-screen py-24">
      <div className="relative mx-auto max-w-4xl px-4 sm:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-kai text-3xl font-bold text-bronze-dark text-inkstone sm:text-4xl">我的记忆</h1>
            <p className="mt-2 text-sm text-inkstone-soft">
              您在本机算过的命盘与卦象，仅保存在此设备浏览器中
            </p>
          </div>
          {records.length > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                if (window.confirm('确定要清空全部本地记忆吗？此操作不可恢复。')) {
                  clear();
                  setExpanded(null);
                }
              }}
              className="border-red-500/40 text-red-300 hover:bg-red-500/10"
            >
              清空全部
            </Button>
          )}
        </div>

        {records.length === 0 ? (
          <Card className="border-bronze/25 bg-cream-light/85 backdrop-blur-sm">
            <CardContent className="py-16 text-center">
              <div className="mb-3 text-5xl">📜</div>
              <p className="text-inkstone-soft">还没有任何记忆</p>
              <p className="mt-1 text-sm text-inkstone-soft/70">
                去排一卦或算一次八字，结果可一键存入这里
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Link to="/bazi">
                  <Button className="bg-bronze font-kai text-inkstone shadow-paper-md hover:bg-bronze/80">
                    八字排盘
                  </Button>
                </Link>
                <Link to="/yijing">
                  <Button
                    variant="outline"
                    className="border-bronze/50 text-bronze-dark hover:bg-bronze/10"
                  >
                    易经占卜
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {shareFeedback && (
              <p className="text-center text-sm text-bronze-dark/90 animate-rise">{shareFeedback}</p>
            )}
            {records.map((rec) => {
              const isOpen = expanded === rec.id;
              return (
                <div key={rec.id} className="space-y-4">
                  <Card className="border-bronze/25 bg-cream-light/85 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className="border border-bronze/30 bg-bronze/10 text-bronze-dark"
                          >
                            {rec.type === 'bazi' ? '八字' : rec.type === 'yijing' ? '易经' : '塔罗'}
                          </Badge>
                          <CardTitle className="truncate font-kai text-base text-bronze-dark">
                            {rec.title}
                          </CardTitle>
                        </div>
                        <p className="mt-1 text-xs text-inkstone-soft/70">
                          {formatDate(rec.createdAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpanded(isOpen ? null : rec.id)}
                          className="text-bronze-dark hover:bg-bronze/10"
                        >
                          {isOpen ? '收起' : '查看'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShareRecord(rec)}
                          className="text-bronze-dark hover:bg-bronze/10"
                        >
                          分享
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (window.confirm('删除这条记忆？')) {
                              remove(rec.id);
                              if (isOpen) setExpanded(null);
                            }
                          }}
                          className="text-red-300 hover:bg-red-500/10"
                        >
                          删除
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>

                  {isOpen && (
                    <div className="animate-rise">
                      {rec.type === 'bazi' ? (
                        <BaziResultView result={rec.result as BaziAnalyzeResponse} unlockKey={rec.key} />
                      ) : rec.type === 'yijing' ? (
                        <YijingResultView result={rec.result as DivinateResponse} unlockKey={rec.key} />
                      ) : (
                        <TarotResultView result={rec.result as TarotAnalyzeResponse} unlockKey={rec.key} />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
