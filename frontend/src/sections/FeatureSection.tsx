import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const features = [
  {
    icon: '🏯',
    title: '八字排盘',
    description: '基于四柱八字的传统命理分析',
    detail: '输入生辰信息，系统自动排定年、月、日、时四柱，推算天干地支、五行生克、十神关系。',
  },
  {
    icon: '🔮',
    title: '易经占卜',
    description: '六十四卦起卦解卦，洞悉天机',
    detail: '随机起卦或数字起卦，展示卦象爻辞，分析变卦、错卦、综卦，辅助决策参考。',
  },
  {
    icon: '📚',
    title: '古籍RAG',
    description: '检索《渊海子平》《滴天髓》等典籍原文',
    detail: '基于向量知识库检索命理经典文献原文，确保解读有据可依，传承正统命理文化。',
  },
  {
    icon: '💡',
    title: 'AI解读',
    description: '大模型结合命理知识生成个性化解读',
    detail: '融合大语言模型的语言能力与专业命理知识，生成深入浅出、贴合个人命局的解读报告。',
  },
];

export default function FeatureSection() {
  return (
    <section className="relative py-24">
      {/* Section background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0d0505] to-black" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-bold text-red-400 sm:text-4xl">
            核心功能
          </h2>
          <p className="mt-3 text-sm text-gray-500">
            传统命理与现代AI的完美融合
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {features.map((feature, i) => (
            <Card
              key={i}
              className="group border-red-900/30 bg-black/50 shadow-lg shadow-red-900/5 backdrop-blur-sm transition-all duration-300 hover:border-red-700/50 hover:shadow-red-900/20"
            >
              <CardHeader>
                <span className="mb-2 text-3xl">{feature.icon}</span>
                <CardTitle className="text-lg text-red-300 group-hover:text-red-200 transition-colors">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-2 text-sm font-medium text-amber-500/80">
                  {feature.description}
                </p>
                <p className="text-xs leading-relaxed text-gray-500">
                  {feature.detail}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
