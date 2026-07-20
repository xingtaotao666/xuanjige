import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MenuIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import SettingsDialog from './SettingsDialog';
import { getHistory } from '@/lib/historyStore';

const navLinks = [
  { path: '/', label: '首页' },
  { path: '/bazi', label: '八字' },
  { path: '/yijing', label: '易经' },
  { path: '/tarot', label: '塔罗' },
  { path: '/history', label: '记忆' },
  { path: '/about', label: '关于' },
];

/** 极简八卦 logo SVG */
function BaguaLogo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="logoG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8b6f47" />
          <stop offset="100%" stopColor="#5a3f23" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="14" fill="none" stroke="url(#logoG)" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="10" fill="none" stroke="url(#logoG)" strokeWidth="0.8" opacity="0.5" />
      {/* 八卦三爻（简化） */}
      <g stroke="url(#logoG)" strokeWidth="1.4" strokeLinecap="round">
        <line x1="8" y1="9" x2="24" y2="9" />
        <line x1="10" y1="13" x2="22" y2="13" strokeDasharray="4 4" />
        <line x1="8" y1="17" x2="24" y2="17" />
        <line x1="10" y1="21" x2="22" y2="21" strokeDasharray="4 4" />
        <line x1="8" y1="25" x2="24" y2="25" />
        <line x1="10" y1="29" x2="22" y2="29" strokeDasharray="4 4" />
      </g>
    </svg>
  );
}

export default function Header() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const historyCount = getHistory().length;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-bronze/15 bg-cream/85 backdrop-blur-md pt-[env(safe-area-inset-top)] shadow-paper-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <BaguaLogo className="h-7 w-7" />
          <span className="font-kai text-xl font-bold tracking-[0.2em] text-inkstone sm:text-2xl">
            玄机阁
          </span>
          <span className="hidden text-xs text-inkstone-mute sm:inline-block">
            Xuanji
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link key={link.path} to={link.path}>
              <span
                className={`relative inline-block px-4 py-2 font-kai text-base transition-colors ${
                  isActive(link.path)
                    ? 'text-bronze-dark'
                    : 'text-inkstone-soft hover:text-inkstone'
                }`}
              >
                {link.label}
                {link.path === '/history' && historyCount > 0 && (
                  <span className="ml-1 rounded-full bg-seal-red/15 px-1.5 text-[10px] text-seal-red">
                    {historyCount}
                  </span>
                )}
                {isActive(link.path) && (
                  <span className="absolute -bottom-0.5 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-bronze" />
                )}
              </span>
            </Link>
          ))}
        </nav>

        {/* Settings */}
        <SettingsDialog />

        {/* Mobile hamburger */}
        <div className="md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-inkstone-soft hover:text-inkstone">
                <MenuIcon className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="border-bronze/20 bg-cream/95">
              <SheetHeader>
                <SheetTitle className="font-kai text-xl text-inkstone">玄机阁</SheetTitle>
              </SheetHeader>
              <nav className="mt-8 flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setOpen(false)}
                  >
                    <span
                      className={`block rounded-md px-4 py-2.5 font-kai text-base transition-colors ${
                        isActive(link.path)
                          ? 'bg-bronze/10 text-bronze-dark'
                          : 'text-inkstone-soft hover:bg-bronze/5 hover:text-inkstone'
                      }`}
                    >
                      {link.label}
                      {link.path === '/history' && historyCount > 0 && (
                        <span className="ml-1 rounded-full bg-seal-red/15 px-1.5 text-[10px] text-seal-red">
                          {historyCount}
                        </span>
                      )}
                    </span>
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
