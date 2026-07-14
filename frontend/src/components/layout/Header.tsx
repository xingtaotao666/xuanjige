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

const navLinks = [
  { path: '/', label: '首页' },
  { path: '/bazi', label: '八字排盘' },
  { path: '/yijing', label: '易经占卜' },
  { path: '/about', label: '关于' },
];

export default function Header() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-red-900/30 bg-black/80 backdrop-blur-md pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold tracking-wider text-red-500">
            玄机阁
          </span>
          <span className="hidden text-sm text-gray-400 sm:inline-block">
            | AI 智能算命
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
                    ? 'text-red-400 hover:text-red-300'
                    : 'text-gray-300 hover:text-white'
                }
              >
                {link.label}
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
              <Button variant="ghost" size="icon" className="text-gray-300">
                <MenuIcon className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="border-red-900/30 bg-black/95">
              <SheetHeader>
                <SheetTitle className="text-xl text-red-500">玄机阁</SheetTitle>
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
                          ? 'w-full justify-start text-red-400'
                          : 'w-full justify-start text-gray-300'
                      }
                    >
                      {link.label}
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
