import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { WuXingAnalysis } from '@/types/bazi';

export type ElementKey = 'neutral' | 'wood' | 'fire' | 'earth' | 'metal' | 'water';

interface ThemeContextValue {
  element: ElementKey;
  setElement: (e: ElementKey) => void;
}

const ElementLabels: Record<ElementKey, string> = {
  neutral: '中和',
  wood: '木',
  fire: '火',
  earth: '土',
  metal: '金',
  water: '水',
};

export function elementLabel(e: ElementKey): string {
  return ElementLabels[e];
}

const ThemeContext = createContext<ThemeContextValue>({
  element: 'neutral',
  setElement: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [element, setElement] = useState<ElementKey>('neutral');

  useEffect(() => {
    document.documentElement.setAttribute('data-element', element);
  }, [element]);

  return (
    <ThemeContext.Provider value={{ element, setElement }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

/**
 * 从五行评分中找出主导元素，用于动态主题。
 * wuxing 字段：{ wood, fire, earth, metal, water }
 */
export function dominantElement(wuxing: WuXingAnalysis): ElementKey {
  const scores: Record<Exclude<ElementKey, 'neutral'>, number> = {
    wood: wuxing.wood ?? 0,
    fire: wuxing.fire ?? 0,
    earth: wuxing.earth ?? 0,
    metal: wuxing.metal ?? 0,
    water: wuxing.water ?? 0,
  };
  let best: ElementKey = 'neutral';
  let max = -1;
  (Object.keys(scores) as Exclude<ElementKey, 'neutral'>[]).forEach((k) => {
    if (scores[k] > max) {
      max = scores[k];
      best = k;
    }
  });
  return best;
}
