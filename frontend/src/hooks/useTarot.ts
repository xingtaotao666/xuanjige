/**
 * 塔罗占卜 Hook
 */
import { useState, useCallback } from 'react';
import { analyzeTarot } from '@/api/client';
import type { TarotRequest, TarotAnalyzeResponse } from '@/types/tarot';

interface UseTarotReturn {
  loading: boolean;
  error: string | null;
  result: TarotAnalyzeResponse | null;
  divinate: (data: TarotRequest) => Promise<void>;
  reset: () => void;
}

export function useTarot(): UseTarotReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TarotAnalyzeResponse | null>(null);

  const performDivinate = useCallback(async (data: TarotRequest) => {
    setLoading(true);
    setError(null);
    try {
      const res = await analyzeTarot(data);
      setResult(res);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '塔罗占卜失败';
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

  return {
    loading,
    error,
    result,
    divinate: performDivinate,
    reset,
  };
}
