import { useState, useCallback } from 'react';
import { analyzeBazi, basicBazi, type AnalyzeBaziRequest, type BasicBaziRequest } from '../api/client';
import type { BaziAnalyzeResponse } from '../types/bazi';

interface UseBaziReturn {
  loading: boolean;
  error: string | null;
  result: BaziAnalyzeResponse | null;
  analyze: (data: AnalyzeBaziRequest) => Promise<void>;
  basic: (data: BasicBaziRequest) => Promise<void>;
  reset: () => void;
}

export function useBazi(): UseBaziReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BaziAnalyzeResponse | null>(null);

  const analyze = useCallback(async (data: AnalyzeBaziRequest) => {
    setLoading(true);
    setError(null);
    try {
      const res = await analyzeBazi(data);
      setResult(res);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '八字分析失败';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const basic = useCallback(async (data: BasicBaziRequest) => {
    setLoading(true);
    setError(null);
    try {
      const res = await basicBazi(data);
      setResult(res);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '基础排盘失败';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setResult(null);
  }, []);

  return { loading, error, result, analyze, basic, reset };
}
