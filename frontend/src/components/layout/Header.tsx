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
  { path: '/bazi', label: '八字排盘' },
  { path: '/yijing', label: '易经占卜' },
  { path: '/history', label: '记忆' },
  { path: '/about', label: '关于' },
];

export default function Header() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const historyCount = getHistory().length;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-element/25 bg-[#0a0710]/80 backdrop-blur-md pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-kai text-2xl font-bold tracking-[0.25em] text-gold title-glow">
            玄机阁
          </span>
          <span className="hidden text-sm text-muted-foreground sm:inline-block">
            | AI 智能命理
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link key={link.path} to={link.path}>
              <Button
                variant="ghost"
                className={
                  isActive(link.path)
                    ? 'text-element hover:text-element'
                    : 'text-muted-foreground hover:text-foreground'
                }
              >
                {link.label}
                {link.path === '/history' && historyCount > 0 && (
                  <span className="ml-1 rounded-full bg-element/20 px-1.5 text-[10px] text-element">
                    {historyCount}
                  </span>
                )}
              </Button>
            </Link>
          ))}
        </nav>

        {/* Settings */}
        <SettingsDialog />

        {/* Mobile hamburger */}
        <div className="md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <MenuIcon className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="border-element/30 bg-[#0a0710]/95">
              <SheetHeader>
                <SheetTitle className="font-kai text-xl text-gold">玄机阁</SheetTitle>
              </SheetHeader>
              <nav className="mt-8 flex flex-col gap-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setOpen(false)}
                  >
                    <Button
                      variant="ghost"
                      className={
                        isActive(link.path)
                          ? 'w-full justify-start text-element'
                          : 'w-full justify-start text-muted-foreground'
                      }
                    >
                      {link.label}
                      {link.path === '/history' && historyCount > 0 && (
                        <span className="ml-1 rounded-full bg-element/20 px-1.5 text-[10px] text-element">
                          {historyCount}
                        </span>
                      )}
                    </Button>
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
