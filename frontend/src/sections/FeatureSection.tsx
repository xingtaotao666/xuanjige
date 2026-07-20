/** 核心功能特色 */
const features = [
  {
    icon: '☯',
    title: '八字排盘',
    subtitle: 'BaZi · Natal Chart',
    desc: '基于生辰年月的天干地支，推算十神关系、五行强弱、神煞格局。',
    color: '#a13d2a',
  },
  {
    icon: '☰',
    title: '易经占卜',
    subtitle: 'I Ching · 64 Hexagrams',
    desc: '随机起卦或数字起卦，铜钱摇卦定爻，解析卦象爻辞与变错综卦。',
    color: '#8b6f47',
  },
  {
    icon: '✦',
    title: '塔罗占卜',
    subtitle: 'Tarot · 78 Cards',
    desc: '韦特塔罗四大牌阵，AI 结合牌面象征与您的问题生成深度解读。',
    color: '#4a6b5b',
  },
  {
    icon: '❋',
    title: '古籍 RAG',
    subtitle: 'RAG · Ancient Texts',
    desc: '检索《渊海子平》《滴天髓》《周易》《塔罗》原著，确保解读有据可依。',
    color: '#a3823a',
  },
  {
    icon: '✧',
    title: 'AI 解读',
    subtitle: 'AI · Personalized',
    desc: '融合大模型的语言能力与命理知识，生成贴合个人的深度解读。',
    color: '#8b6f47',
  },
  {
    icon: '◈',
    title: '保存记忆',
    subtitle: 'Memory · Local',
    desc: '占卜记录本地保存，随时回看历史轨迹与人生阶段的连贯解读。',
    color: '#4a9c7a',
  },
];

function DecorativeLine() {
  return (
    <div className="my-3 flex w-full items-center justify-center text-bronze/50">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-bronze/30 to-bronze/30" />
      <span className="px-3 text-xs">❀</span>
      <div className="h-px flex-1 bg-gradient-to-l from-transparent via-bronze/30 to-bronze/30" />
    </div>
  );
}

export default function FeatureSection() {
  return (
    <section className="relative py-24">
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        {/* 标题 */}
        <div className="mb-14 text-center">
          <p className="mb-2 font-kai text-sm tracking-[0.5em] text-bronze">— 核心功能 —</p>
          <h2 className="font-kai text-3xl font-bold text-inkstone sm:text-4xl">
            古法今用 · 一站式命理体验
          </h2>
          <DecorativeLine />
          <p className="mt-3 text-sm text-inkstone-soft">
            传统命理智慧 × 现代 AI 技术
          </p>
        </div>

        {/* 功能网格 */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <article
              key={i}
              className="elevated-card relative overflow-hidden p-6"
            >
              {/* 左侧色条 */}
              <div
                className="absolute left-0 top-6 bottom-6 w-1 rounded-r-full"
                style={{ background: feature.color }}
              />

              {/* 图标 + 标题 */}
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className="font-kai text-2xl"
                      style={{ color: feature.color }}
                    >
                      {feature.icon}
                    </span>
                    <h3 className="font-kai text-xl font-bold text-inkstone">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-xs tracking-wider text-inkstone-mute">
                    {feature.subtitle}
                  </p>
                </div>
              </div>

              <DecorativeLine />

              <p className="text-sm leading-relaxed text-inkstone-soft">
                {feature.desc}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
