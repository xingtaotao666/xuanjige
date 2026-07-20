import { Link } from 'react-router-dom';

function DecorativeLine() {
  return (
    <div className="flex w-32 items-center justify-center text-bronze/40">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-bronze/30 to-bronze/30" />
      <span className="px-2 text-[10px]">❀</span>
      <div className="h-px flex-1 bg-gradient-to-l from-transparent via-bronze/30 to-bronze/30" />
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-bronze/15 bg-parchment/60">
      <div className="mx-auto max-w-7xl px-4 py-12 pb-[calc(3rem+env(safe-area-inset-bottom))] sm:px-6">
        <div className="flex justify-center pb-6">
          <DecorativeLine />
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="font-kai text-2xl font-bold tracking-[0.15em] text-inkstone">玄机阁</span>
              <span className="seal-stamp text-[10px]" style={{ width: '1.5rem', height: '1.5rem', fontSize: '0.625rem' }}>阁</span>
            </div>
            <p className="text-sm leading-relaxed text-inkstone-soft">
              融合千年典籍与人工智能，
              <br />
              为您解读命理天机。
            </p>
            <p className="mt-3 text-xs text-inkstone-mute">
              © {new Date().getFullYear()} Xuanji · 玄机阁
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="mb-3 font-kai text-sm font-bold text-inkstone">快速导航</h4>
            <ul className="space-y-2 text-sm">
              {[
                { path: '/', label: '首页' },
                { path: '/bazi', label: '八字排盘' },
                { path: '/yijing', label: '易经占卜' },
                { path: '/tarot', label: '塔罗占卜' },
                { path: '/about', label: '关于' },
              ].map((l) => (
                <li key={l.path}>
                  <Link
                    to={l.path}
                    className="text-inkstone-soft transition-colors hover:text-bronze-dark"
                  >
                    <span className="mr-1.5 text-bronze/50">·</span>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Disclaimer */}
          <div>
            <h4 className="mb-3 font-kai text-sm font-bold text-inkstone">免责声明</h4>
            <p className="text-sm leading-relaxed text-inkstone-soft italic">
              本网站所有内容仅供娱乐参考，
              <br />
              不构成任何专业建议。
              <br />
              请理性看待，切勿沉迷。
            </p>
            <div className="mt-4 flex justify-start">
              <DecorativeLine />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
