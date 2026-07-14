import type { RagSource } from '@/types/bazi';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface SourceCitationsProps {
  sources: RagSource[];
}

export default function SourceCitations({ sources }: SourceCitationsProps) {
  if (!sources || sources.length === 0) return null;

  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold text-gray-400">
        典籍参考来源
      </h4>
      <Accordion type="single" collapsible className="space-y-2">
        {sources.map((source, i) => (
          <AccordionItem
            key={i}
            value={`source-${i}`}
            className="rounded-lg border border-red-900/30 bg-black/40 px-4"
          >
            <AccordionTrigger className="text-sm text-gray-300 hover:text-red-300 hover:no-underline">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-red-800/50 text-red-400 text-[10px]"
                >
                  {source.book}
                </Badge>
                <span className="text-xs text-gray-500">
                  相关度 {Math.round(source.score * 100)}%
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <p className="mb-2 text-sm italic leading-relaxed text-gray-400">
                &ldquo;{source.text}&rdquo;
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-600">相关度</span>
                <Progress
                  value={source.score * 100}
                  className="h-1.5 flex-1"
                />
                <span className="text-[10px] text-gray-500">
                  {Math.round(source.score * 100)}%
                </span>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
