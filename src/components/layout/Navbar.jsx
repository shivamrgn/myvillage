import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, FileText, Search, HelpCircle, Shield, UserCheck } from 'lucide-react';
import { LanguageToggle } from '../common/LanguageToggle';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../hooks/useAuth';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { t, isHindi } = useLanguage();
  const { isAdmin } = useAuth();
  const location = useLocation();

  const navLinks = [
    { to: '/', label: t('nav.home'), icon: null },
    { to: '/report', label: t('nav.report'), icon: FileText, highlight: true },
    { to: '/track', label: t('nav.track'), icon: Search },
    { to: '/help', label: t('nav.help'), icon: HelpCircle },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-civic-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 sm:h-20">
          {/* Brand Logo & Name */}
          <Link
            to="/"
            className="flex items-center gap-3 focus:outline-none"
            aria-label="Gram Samadhan Home"
          >
            <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-lg tracking-wider shrink-0">
              GS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl text-primary-dark tracking-tight">
                  {isHindi ? 'ग्राम समाधान' : 'Gram Samadhan'}
                </span>
              </div>
              <p className="text-xs text-civic-muted hidden xs:block">
                {t('app.subtitle')}
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2" aria-label="Main Navigation">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors min-h-[44px] ${
                    isActive(link.to)
                      ? 'bg-[#EAF3FF] text-[#123B68] border border-blue-200 shadow-2xs'
                      : link.highlight
                      ? 'bg-[#1769C2] text-white hover:bg-[#1358a3] shadow-xs'
                      : 'text-slate-800 hover:bg-slate-100 hover:text-[#123B68]'
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  <span>{link.label}</span>
                </Link>
              );
            })}

            <div className="h-6 w-px bg-slate-200 mx-2" />

            {/* Language Switcher */}
            <LanguageToggle />

            {/* Admin Portal Link */}
            {isAdmin ? (
              <Link
                to="/admin/dashboard"
                className="ml-2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-primary-dark text-white hover:bg-slate-900 transition-colors min-h-[40px] shadow-2xs"
              >
                <UserCheck className="w-4 h-4 text-primary-light" />
                <span>{t('nav.dashboard')}</span>
              </Link>
            ) : (
              <Link
                to="/admin/login"
                className="ml-2 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-primary hover:bg-slate-100 transition-colors min-h-[40px] border border-slate-200"
              >
                <Shield className="w-3.5 h-3.5 text-primary" />
                <span>{t('nav.admin')}</span>
              </Link>
            )}
          </nav>

          {/* Mobile Right Controls */}
          <div className="flex items-center gap-2 md:hidden">
            <LanguageToggle />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2.5 rounded-xl text-civic-text hover:bg-slate-100 touch-target flex items-center justify-center"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden border-t border-civic-border bg-white px-4 pt-3 pb-6 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-bold min-h-[48px] ${
                  isActive(link.to)
                    ? 'bg-[#EAF3FF] text-[#123B68] border border-blue-200'
                    : link.highlight
                    ? 'bg-[#1769C2] text-white shadow-xs'
                    : 'text-slate-800 hover:bg-slate-50'
                }`}
              >
                {Icon && <Icon className="w-5 h-5 shrink-0" />}
                <span>{link.label}</span>
              </Link>
            );
          })}

          <div className="pt-3 border-t border-slate-100">
            <Link
              to={isAdmin ? '/admin/dashboard' : '/admin/login'}
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl text-sm font-bold text-primary-dark bg-primary-light border border-blue-200 min-h-[48px]"
            >
              <Shield className="w-4 h-4 text-primary" />
              <span>{isAdmin ? t('nav.dashboard') : t('nav.admin')}</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
