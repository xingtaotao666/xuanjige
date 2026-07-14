import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-element/25 bg-[#0a0710]/80">
      <div className="mx-auto max-w-7xl px-4 py-10 pb-[calc(2.5rem+env(safe-area-inset-bottom))] sm:px-6">
        <div className="grid gap-8 sm:grid-cols-3">
          {/* Brand */}
          <div>
            <h3 className="mb-3 font-kai text-lg font-bold text-gold">玄机阁</h3>
            <p className="text-sm text-muted-foreground">
              融合千年典籍与人工智能，为您解读命理天机。
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-muted-foreground">快速导航</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/" className="transition-colors hover:text-element">
                  首页
                </Link>
              </li>
              <li>
                <Link to="/bazi" className="transition-colors hover:text-element">
                  八字排盘
                </Link>
              </li>
              <li>
                <Link to="/yijing" className="transition-colors hover:text-element">
                  易经占卜
                </Link>
              </li>
              <li>
                <Link to="/about" className="transition-colors hover:text-element">
                  关于
                </Link>
              </li>
            </ul>
          </div>

          {/* Disclaimer */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-muted-foreground">免责声明</h4>
            <p className="text-sm text-muted-foreground/80 italic">
              本网站所有内容仅供娱乐参考，不构成任何专业建议。
              请理性看待，切勿沉迷。
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-element/20 pt-6 text-center">
          <p className="text-xs text-muted-foreground/70">
            &copy; {new Date().getFullYear()} 玄机阁 · AI 智能算命 &mdash; 仅供娱乐参考
          </p>
        </div>
      </div>
    </footer>
  );
}
