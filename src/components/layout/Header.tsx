'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShoppingCart,
  User,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { Logo } from './Logo';
import { SearchBox } from './SearchBox';
import { ThemeSwitcher } from './ThemeSwitcher';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import type { Category } from '@/types';
import { cn } from '@/lib/utils';
import { LogOut } from 'lucide-react';

interface HeaderProps {
  categories: Category[];
}

export function Header({ categories }: HeaderProps) {
  const pathname = usePathname();
  const { itemCount, openMiniCart } = useCart();
  const { user, loading: authLoading, logout } = useAuth();
  const { t, dir } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const megaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMegaOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (megaRef.current && !megaRef.current.contains(e.target as Node)) {
        setMegaOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <>
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-border">
        {/* Main header */}
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className={cn('flex items-center justify-between h-16 gap-4', dir === 'rtl' && 'flex-row-reverse')}>
            {/* Mobile hamburger */}
            <button
              className="lg:hidden flex items-center justify-center h-10 w-10 rounded-lg hover:bg-surface-elevated focus-ring text-text"
              onClick={() => setMobileOpen(true)}
              aria-label={t('home.openMenu')}
            >
              <Menu className="h-5 w-5" />
            </button>

            <Logo showTagline />

            {/* Search bar - desktop */}
            <div className="hidden md:flex flex-1 max-w-xl mx-4">
              <SearchBox className="w-full" />
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              <LanguageSwitcher />
              <ThemeSwitcher compact />
              {authLoading ? (
                <div className="h-10 w-10 rounded-lg flex items-center justify-center text-muted">
                  <User className="h-5 w-5" />
                </div>
              ) : user ? (
                <div className="flex items-center gap-1">
                  <Link
                    href="/account"
                    className="flex items-center gap-2 h-10 px-3 rounded-lg hover:bg-surface-elevated focus-ring text-text"
                    aria-label={t('nav.account')}
                  >
                    <User className="h-5 w-5" />
                    <span className="hidden sm:inline text-sm font-medium max-w-[80px] truncate">{user.name || user.email}</span>
                  </Link>
                  <button
                    onClick={() => logout()}
                    className="flex items-center justify-center h-10 w-10 rounded-lg hover:bg-surface-elevated focus-ring text-muted hover:text-danger transition-colors"
                    aria-label={t('nav.logout')}
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-2 h-10 px-3 rounded-lg hover:bg-surface-elevated focus-ring text-text"
                  aria-label={t('nav.login')}
                >
                  <User className="h-5 w-5" />
                  <span className="hidden sm:inline text-sm font-medium">{t('nav.login')}</span>
                </Link>
              )}
              <button
                onClick={openMiniCart}
                className="relative flex items-center justify-center h-10 w-10 rounded-lg hover:bg-surface-elevated focus-ring text-text"
aria-label={t('home.cartItems', { n: hydrated ? itemCount : 0 })}
              >
                <ShoppingCart className="h-5 w-5" />
                {hydrated && itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 min-w-[1.25rem] px-1 rounded-full bg-gold-gradient text-background text-[0.625rem] font-bold flex items-center justify-center">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Mobile search */}
          <div className="md:hidden pb-3">
            <SearchBox className="w-full" />
          </div>
        </div>

        {/* Category nav - desktop */}
        <nav className="hidden lg:block border-t border-border">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className={cn('flex items-center gap-1', dir === 'rtl' && 'flex-row-reverse')}>
              {/* All categories mega menu */}
              <div ref={megaRef} className="relative">
                <button
                  onClick={() => setMegaOpen((v) => !v)}
                  className="flex items-center gap-1 h-11 px-3 text-sm font-medium text-text hover:text-gold transition-colors focus-ring rounded-lg"
                  aria-expanded={megaOpen}
                  aria-haspopup="true"
                >
                  {t('nav.categories')}
                  <ChevronDown
                    className={cn('h-4 w-4 transition-transform', megaOpen && 'rotate-180')}
                  />
                </button>
                {megaOpen && (
                  <div className={cn('absolute top-full z-50 w-[600px] bg-surface border border-border rounded-lg shadow-2xl p-4 grid grid-cols-2 gap-4 animate-fade-in', dir === 'rtl' ? 'right-0' : 'left-0')}>
                    {categories.map((cat) => (
                      <div key={cat.id}>
                        <Link
                          href={`/category/${cat.slug}`}
                          className="block text-sm font-semibold text-gold hover:text-gold-light transition-colors mb-2"
                        >
                          {cat.name}
                        </Link>
                        <ul className="space-y-1">
                          {cat.subcategories.map((sub) => (
                            <li key={sub.id}>
                              <Link
                                href={`/category/${sub.slug}`}
                                className="text-xs text-muted hover:text-text transition-colors"
                              >
                                {sub.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="h-5 w-px bg-border mx-1" />
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="h-11 flex items-center px-3 text-sm text-muted hover:text-gold transition-colors focus-ring rounded-lg"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className={cn('absolute top-0 bottom-0 w-[85%] max-w-sm bg-surface border-border flex flex-col animate-fade-in', dir === 'rtl' ? 'right-0 border-l' : 'left-0 border-r')}>
            <div className={cn('flex items-center justify-between p-4 border-b border-border', dir === 'rtl' && 'flex-row-reverse')}>
              <Logo />
              <button
                onClick={() => setMobileOpen(false)}
                className="h-10 w-10 flex items-center justify-center rounded-lg hover:bg-surface-elevated focus-ring"
                aria-label={t('home.closeMenu')}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-4">
              <p className="text-xs uppercase tracking-wider text-muted mb-2">{t('nav.categories')}</p>
              <ul className="space-y-1">
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/category/${cat.slug}`}
                      className="block py-2.5 px-3 rounded-lg text-sm font-medium text-text hover:bg-surface-elevated transition-colors"
                    >
                      {cat.name}
                    </Link>
                    <ul className={cn('mb-1', dir === 'rtl' ? 'mr-3' : 'ml-3')}>
                      {cat.subcategories.map((sub) => (
                        <li key={sub.id}>
                          <Link
                            href={`/category/${sub.slug}`}
                            className="block py-2 px-3 rounded-lg text-xs text-muted hover:text-gold transition-colors"
                          >
                            {sub.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
