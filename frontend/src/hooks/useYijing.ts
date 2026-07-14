import { useState, useCallback } from 'react';
import { divinate, getHexagram, type DivinateRequest } from '../api/client';
import type { DivinateResponse, GuaData } from '../types/yijing';

interface UseYijingReturn {
  loading: boolean;
  error: string | null;
  result: DivinateResponse | null;
  hexagram: GuaData | null;
  divinate: (data: DivinateRequest) => Promise<void>;
  fetchHexagram: (sequence: number) => Promise<void>;
  reset: () => void;
}

export function useYijing(): UseYijingReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DivinateResponse | null>(null);
  const [hexagram, setHexagram] = useState<GuaData | null>(null);

  const performDivinate = useCallback(async (data: DivinateRequest) => {
    setLoading(true);
    setError(null);
    try {
      const res = await divinate(data);
      setResult(res);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '起卦失败';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHexagram = useCallback(async (sequence: number) => {
    setLoading(true);
    setError(null);
    try {
      const gua = await getHexagram(sequence);
      setHexagram(gua);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '获取卦象失败';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setResult(null);
    setHexagram(null);
  }, []);

  return {
    loading,
    error,
    result,
    hexagram,
    divinate: performDivinate,
    fetchHexagram,
    reset,
  };
}
