import { useNavigate } from 'react-router-dom';

/** 装饰性分割线 */
function Divider() {
  return (
    <div className="my-6 flex w-full max-w-md items-center justify-center gap-0 text-bronze">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-bronze/50 to-bronze/50" />
      <span className="px-4 text-base">❋</span>
      <div className="h-px flex-1 bg-gradient-to-l from-transparent via-bronze/50 to-bronze/50" />
    </div>
  );
}

/** 三个大圆盘 visual 卡片（参考图 1 天地人盘） */
const PLATES = [
  {
    key: 'tianpan',
    title: '天盘',
    subtitle: 'Tiānpán',
    desc: '正曜地围，地添出时。更素有粘幽，涂理泊鸿封同同。',
    img: '/assets/medallion-tianpan.png',
    accent: '#8b6f47',
  },
  {
    key: 'renpan',
    title: '人盘',
    subtitle: 'Rénpán',
    desc: '正洛诌泛内颛地的地，定皮进佸全的生间横遭。',
    img: '/assets/medallion-renpan.png',
    accent: '#a13d2a',
  },
  {
    key: 'dipan',
    title: '地盘',
    subtitle: 'Dìpán',
    desc: '装调昏水图，止盘域未要正素地阐水白的支地观服。',
    img: '/assets/medallion-dipan.png',
    accent: '#4a6b5b',
  },
];

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative flex min-h-[92vh] flex-col items-center px-4 py-16">
      <div className="relative z-10 flex w-full max-w-5xl flex-col items-center">
        {/* 顶部印章小章 */}
        <div className="mb-6 flex items-center gap-3 animate-fade-in">
          <span className="seal-stamp">玄机</span>
          <div className="text-left">
            <p className="font-kai text-xs tracking-[0.4em] text-inkstone-mute">千年典籍</p>
            <p className="font-kai text-xs tracking-[0.4em] text-inkstone-mute">AI 智能</p>
          </div>
          <span className="seal-stamp" style={{ background: '#8b6f47' }}>古法</span>
        </div>

        {/* 主标题 */}
        <h1 className="mb-2 font-kai text-5xl font-bold tracking-[0.3em] text-inkstone sm:text-6xl md:text-7xl animate-rise">
          玄机阁
        </h1>

        <p className="mb-2 text-base tracking-[0.3em] text-bronze-dark sm:text-lg font-kai">
          究天人之变 · 察阴阳之机
        </p>

        <Divider />

        {/* 三大圆盘（天地人）— 参考图 1 风格 */}
        <div className="mb-10 grid w-full grid-cols-3 gap-3 sm:gap-6 animate-rise">
          {PLATES.map((plate, i) => (
            <article
              key={plate.key}
              className="elevated-card group flex flex-col items-center p-3 sm:p-5"
              style={{ animationDelay: `${0.3 + i * 0.1}s` }}
            >
              {/* 圆盘图 */}
              <div className="relative mb-3 aspect-square w-full overflow-hidden rounded-full">
                <img
                  src={plate.img}
                  alt={plate.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {/* 装饰光环 */}
                <div
                  className="absolute inset-0 rounded-full ring-1 ring-bronze/15 transition-all group-hover:ring-bronze/30"
                  aria-hidden="true"
                />
              </div>

              {/* 标题 */}
              <h3 className="font-kai text-xl font-bold text-inkstone sm:text-2xl">
                {plate.title}
              </h3>
              <p className="mt-0.5 text-[10px] tracking-wider text-inkstone-mute sm:text-xs">
                {plate.subtitle}
              </p>

              <p className="mt-3 hidden text-xs leading-relaxed text-inkstone-soft sm:block">
                {plate.desc}
              </p>
            </article>
          ))}
        </div>

        {/* 三大功能入口（用三段古风描述） */}
        <p className="mx-auto mb-6 max-w-xl text-center text-sm leading-relaxed text-inkstone-soft sm:text-base">
          融合《渊海子平》《滴天髓》《周易》《塔罗》千年典籍，
          以 RAG 检索为骨，以大模型为魂，探寻命运之纹路。
        </p>

        <div className="grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { path: '/bazi', title: '八字', sub: '四柱命理', desc: '千年命理经典 · 排盘解读', accent: '#a13d2a' },
            { path: '/yijing', title: '易经', sub: '六十四卦', desc: '古经起卦解卦 · 寻天地之机', accent: '#8b6f47' },
            { path: '/tarot', title: '塔罗', sub: '韦特牌阵', desc: '七十八张灵性之镜 · 启内心智慧', accent: '#4a6b5b' },
          ].map((f, i) => (
            <button
              key={f.path}
              onClick={() => navigate(f.path)}
              className="elevated-card group relative overflow-hidden p-4 text-left sm:p-5"
              style={{ animationDelay: `${0.6 + i * 0.1}s` }}
            >
              <div
                className="absolute left-0 right-0 top-0 h-1"
                style={{ background: `linear-gradient(to right, ${f.accent}, transparent)` }}
              />
              <div className="flex items-baseline gap-2">
                <span className="font-kai text-2xl font-bold" style={{ color: f.accent }}>
                  {f.title}
                </span>
                <span className="font-kai text-xs text-inkstone-mute">{f.sub}</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-inkstone-soft">
                {f.desc}
              </p>
              <div className="mt-3 inline-flex items-center gap-1 text-[10px] font-medium text-inkstone-mute transition-colors group-hover:text-bronze">
                <span>开启占卜</span>
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8 flex items-center gap-2 text-xs text-inkstone-mute">
          <span>仅供娱乐参考</span>
          <span className="h-3 w-px bg-bronze/40" />
          <span>RAG + 大模型</span>
          <span className="h-3 w-px bg-bronze/40" />
          <span>古为今用</span>
        </div>
      </div>

      {/* 滚动提示 */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-[float_3s_ease-in-out_infinite]">
        <div className="flex h-8 w-5 items-start justify-center rounded-full border border-bronze/40 p-1">
          <div className="h-2 w-1 rounded-full bg-bronze/60" />
        </div>
      </div>
    </section>
  );
}
