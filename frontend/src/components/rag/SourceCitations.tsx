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
      <h4 className="mb-3 text-sm font-semibold text-muted-foreground">
        典籍参考来源
      </h4>
      <Accordion type="single" collapsible className="space-y-2">
        {sources.map((source, i) => (
          <AccordionItem
            key={i}
            value={`source-${i}`}
            className="rounded-lg border border-element/30 bg-card/50 px-4"
          >
            <AccordionTrigger className="text-sm text-muted-foreground hover:text-element hover:no-underline">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-element/40 text-element text-[10px]"
                >
                  {source.book}
                </Badge>
                <span className="text-xs text-muted-foreground/70">
                  相关度 {Math.round(source.score * 100)}%
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <p className="mb-2 text-sm italic leading-relaxed text-muted-foreground">
                &ldquo;{source.text}&rdquo;
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground/70">相关度</span>
                <Progress
                  value={source.score * 100}
                  className="h-1.5 flex-1"
                />
                <span className="text-[10px] text-muted-foreground">
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
