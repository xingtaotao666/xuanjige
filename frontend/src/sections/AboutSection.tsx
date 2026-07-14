import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const pipeline = [
  {
    step: '01',
    title: '知识库构建',
    description: '收录《渊海子平》《滴天髓》《三命通会》《周易》《梅花易数》等经典命理典籍，建立结构化向量知识库。',
  },
  {
    step: '02',
    title: 'RAG 检索',
    description: '根据用户输入和排盘结果，从知识库中检索最相关的古籍原文段落，确保解读有文献依据。',
  },
  {
    step: '03',
    title: 'AI 分析',
    description: '大语言模型结合检索到的典籍知识与命理规则，进行综合分析推理，生成个性化解读。',
  },
  {
    step: '04',
    title: '结果呈现',
    description: '以美观直观的界面展示排盘结果、五行分析、卦象变爻等专业内容，辅以通俗易懂的现代解读。',
  },
];

export default function AboutSection() {
  return (
    <section className="relative min-h-screen py-24">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0710] via-[#0d0814] to-[#0a0710]" />

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6">
        {/* Title */}
        <div className="mb-14 text-center">
          <h1 className="font-kai text-3xl font-bold text-gold title-glow sm:text-4xl">
            关于玄机阁
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            千年智慧，AI 赋能
          </p>
        </div>

        {/* Description */}
        <Card className="mb-10 border-element/25 bg-card/60 backdrop-blur-sm">
          <CardContent className="pt-6">
            <p className="leading-relaxed text-foreground/90">
              玄机阁是一款融合传统命理文化与人工智能技术的智能算命平台。
              我们致力于将中华千年典籍中的命理智慧，通过现代 AI 技术进行传承和创新，
              为用户提供专业、有趣的命理解读体验。
            </p>
          </CardContent>
        </Card>

        {/* How it works */}
        <h2 className="mb-6 font-kai text-xl font-bold text-gold/90">运作原理</h2>
        <div className="mb-10 space-y-4">
          {pipeline.map((item) => (
            <Card
              key={item.step}
              className="border-element/20 bg-card/50 backdrop-blur-sm"
            >
              <CardContent className="flex gap-4 pt-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-element/15 text-sm font-bold text-element">
                  {item.step}
                </div>
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-element">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tech stack */}
        <h2 className="mb-6 font-kai text-xl font-bold text-gold/90">技术栈</h2>
        <Card className="mb-10 border-element/25 bg-card/60 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="border-element/40 text-element">
                React + TypeScript
              </Badge>
              <Badge variant="outline" className="border-element/40 text-element">
                Tailwind CSS
              </Badge>
              <Badge variant="outline" className="border-element/40 text-element">
                shadcn/ui
              </Badge>
              <Badge variant="outline" className="border-element/40 text-element">
                FastAPI
              </Badge>
              <Badge variant="outline" className="border-element/40 text-element">
                LangChain
              </Badge>
              <Badge variant="outline" className="border-element/40 text-element">
                向量数据库
              </Badge>
              <Badge variant="outline" className="border-element/40 text-element">
                大语言模型
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <Card className="border-gold/40 bg-gold/5 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="font-kai text-base text-gold">免责声明</CardTitle>
            <CardDescription className="text-gold/60">
              请理性看待
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-gold/60">
              本网站所有命理分析结果仅供娱乐参考，不构成任何专业建议。
              命理学是中华传统文化的一部分，其分析结果不应作为人生重大决策的唯一依据。
              请保持理性思考，切勿沉迷。愿您以开放的心态体验传统文化之美。
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
