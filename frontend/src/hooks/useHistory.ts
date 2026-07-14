import { useCallback, useState } from 'react';
import {
  addRecord,
  clearRecords,
  getHistory,
  removeRecord,
  type HistoryRecord,
} from '@/lib/historyStore';

/** 响应式访问本地记忆，跨页面组件共享同一份 localStorage 数据 */
export function useHistory() {
  const [records, setRecords] = useState<HistoryRecord[]>(() => getHistory());

  const add = useCallback((rec: HistoryRecord) => {
    setRecords(addRecord(rec));
  }, []);

  const remove = useCallback((id: string) => {
    setRecords(removeRecord(id));
  }, []);

  const clear = useCallback(() => {
    clearRecords();
    setRecords([]);
  }, []);

  return { records, add, remove, clear };
}
