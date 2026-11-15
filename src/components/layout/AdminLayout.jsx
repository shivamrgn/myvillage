import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  LogOut,
  ArrowLeft,
  Shield,
  Menu,
  X,
  User,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { LanguageToggle } from '../common/LanguageToggle';
import { LoadingSpinner } from '../common/LoadingSpinner';

export const AdminLayout = () => {
  const { user, loading, logout, isAdmin, adminName, adminRole, adminVillage } = useAuth();
  const { t, isHindi } = useLanguage();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner text={t('common.loading')} />
      </div>
    );
  }

  // Strictly redirect unauthorized visitors to login
  if (!isAdmin) {
    return <Navigate to="/admin/login" state={{ from: location, unauthorized: true }} replace />;
  }

  const isNavActive = (path) => {
    if (path === '/admin/dashboard') {
      return location.pathname === '/admin' || location.pathname === '/admin/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const navItems = [
    {
      to: '/admin/dashboard',
      label: t('nav.dashboard'),
      icon: LayoutDashboard,
      active: isNavActive('/admin/dashboard'),
    },
    {
      to: '/admin/complaints',
      label: t('nav.complaints'),
      icon: FileText,
      active: isNavActive('/admin/complaints'),
    },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 text-civic-text font-sans antialiased">
      {/* ── DESKTOP SIDEBAR ──────────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-civic-border shadow-2xs sticky top-0 h-screen z-30 select-none">
        {/* Brand Header */}
        <div className="p-5 border-b border-civic-border bg-gradient-to-b from-white to-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1769C2] text-white font-black flex items-center justify-center shadow-xs text-sm tracking-tight shrink-0">
              GS
            </div>
            <div className="min-w-0">
              <h2 className="font-extrabold text-sm text-primary-dark tracking-tight truncate">
                {t('app.title')}
              </h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary bg-primary-light px-2 py-0.5 rounded-md mt-0.5 border border-blue-200">
                <Shield className="w-3 h-3" />
                <span>{isHindi ? 'प्रशासन पोर्टल' : 'Admin Portal'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 p-3.5 space-y-1 overflow-y-auto">
          <p className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-civic-muted">
            {isHindi ? 'मुख्य नेविगेशन' : 'Management'}
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all touch-target ${
                  item.active
                    ? 'bg-[#1769C2] text-white shadow-xs font-bold'
                    : 'text-slate-800 hover:bg-slate-100 hover:text-slate-950 font-semibold'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${item.active ? 'text-white' : 'text-civic-muted'}`} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-4 mt-4 border-t border-slate-100">
            <p className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-civic-muted">
              {isHindi ? 'पोर्टल लिंक' : 'Quick Link'}
            </p>
            <Link
              to="/"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-civic-muted hover:text-primary hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 shrink-0 text-civic-muted" />
              <span>{isHindi ? 'नागरिक पोर्टल' : 'Citizen Portal'}</span>
            </Link>
          </div>
        </nav>

        {/* User Identity & Logout at Bottom */}
        <div className="p-3.5 border-t border-civic-border bg-slate-50/70 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-civic-muted uppercase tracking-wider">
              {isHindi ? 'सक्रिय अधिकारी' : 'Logged In As'}
            </span>
            <LanguageToggle />
          </div>

          <div className="flex items-center gap-3 p-2 rounded-xl bg-white border border-civic-border shadow-2xs">
            <div className="w-9 h-9 rounded-lg bg-primary-light text-primary font-bold flex items-center justify-center shrink-0 text-xs border border-blue-200">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-civic-text truncate">{adminName}</p>
              <p className="text-[11px] text-civic-muted truncate">{adminVillage}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold text-status-error hover:bg-rose-50 rounded-xl transition-colors border border-rose-200 touch-target"
            title={t('nav.logout')}
          >
            <LogOut className="w-4 h-4" />
            <span>{t('nav.logout')}</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT CONTAINER ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar (Mobile & Desktop Header) */}
        <header className="bg-white border-b border-civic-border sticky top-0 z-20 h-16 flex items-center justify-between px-3 sm:px-6 shadow-2xs">
          {/* Brand Logo & Name (Mobile) / Breadcrumb (Desktop) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="lg:hidden flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-[#1769C2] text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                GS
              </div>
              <span className="font-extrabold text-sm sm:text-base text-primary-dark whitespace-nowrap">
                {t('app.title')}
              </span>
            </div>

            <div className="hidden lg:flex items-center gap-2 text-xs text-civic-muted">
              <span className="font-bold text-civic-text">{t('app.title')}</span>
              <span>/</span>
              <span className="text-primary font-semibold">
                {location.pathname.includes('complaint') ? t('nav.complaints') : t('nav.dashboard')}
              </span>
            </div>
          </div>

          {/* Right Header items */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isHindi ? 'प्रशासन सत्र सक्रिय' : 'Admin Session Active'}</span>
            </div>

            <div className="shrink-0">
              <LanguageToggle />
            </div>

            {/* Mobile Hamburger Menu Trigger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-xl text-civic-text hover:bg-slate-100 touch-target focus:outline-none focus:ring-2 focus:ring-primary shrink-0"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-civic-muted hover:text-primary transition-colors px-2.5 py-1.5 rounded-lg hover:bg-slate-50"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{isHindi ? 'नागरिक पोर्टल' : 'Citizen Portal'}</span>
            </Link>

            <button
              onClick={logout}
              className="hidden sm:inline-flex lg:hidden p-2 text-status-error hover:bg-rose-50 rounded-xl transition-colors touch-target"
              title={t('nav.logout')}
              aria-label={t('nav.logout')}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Mobile Slide-in Drawer + Overlay */}
        <div className="lg:hidden">
          {/* Semi-transparent dark overlay */}
          <div
            className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${
              mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
            onClick={closeMobileMenu}
            aria-hidden="true"
          />

          {/* Slide-in panel from left */}
          <div
            className={`fixed top-0 left-0 h-full w-[280px] max-w-[80vw] bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
              mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-civic-border bg-gradient-to-b from-white to-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#1769C2] text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-xs">
                  GS
                </div>
                <div>
                  <span className="font-extrabold text-sm text-primary-dark block">
                    {t('app.title')}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary-light px-1.5 py-0.5 rounded-md border border-blue-200">
                    <Shield className="w-2.5 h-2.5" />
                    <span>{isHindi ? 'प्रशासन पोर्टल' : 'Admin Portal'}</span>
                  </span>
                </div>
              </div>
              <button
                onClick={closeMobileMenu}
                className="p-2 rounded-xl text-civic-text hover:bg-slate-100 touch-target"
                aria-label="Close menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Admin Identity */}
            <div className="px-4 pt-4 pb-2">
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-civic-border">
                <div className="w-9 h-9 rounded-lg bg-primary-light text-primary font-bold flex items-center justify-center shrink-0 text-xs border border-blue-200">
                  <User className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-civic-text truncate">{adminName}</p>
                  <p className="text-[11px] text-civic-muted truncate">{adminVillage}</p>
                </div>
              </div>
            </div>

            {/* Nav Links */}
            <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
              <p className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-civic-muted">
                {isHindi ? 'मुख्य नेविगेशन' : 'Management'}
              </p>
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={closeMobileMenu}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold min-h-[48px] ${
                      item.active
                        ? 'bg-[#1769C2] text-white'
                        : 'text-slate-800 hover:bg-slate-100 font-semibold'
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              <div className="pt-3 mt-3 border-t border-slate-100">
                <p className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-civic-muted">
                  {isHindi ? 'पोर्टल लिंक' : 'Quick Link'}
                </p>
                <Link
                  to="/"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-civic-muted hover:bg-slate-50 min-h-[48px]"
                >
                  <ArrowLeft className="w-5 h-5 shrink-0" />
                  <span>{isHindi ? 'नागरिक पोर्टल' : 'Citizen Portal'}</span>
                </Link>
              </div>
            </nav>

            {/* Logout at bottom */}
            <div className="p-4 border-t border-civic-border">
              <button
                onClick={() => { closeMobileMenu(); logout(); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-bold text-status-error hover:bg-rose-50 rounded-xl transition-colors border border-rose-200 touch-target"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('nav.logout')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Page Content Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 pb-24 sm:p-6 sm:pb-8 lg:p-8">
          <Outlet />
        </main>

        {/* Mobile Sticky Bottom Navigation */}
        <div className="lg:hidden sticky bottom-0 z-30 bg-white/95 backdrop-blur-sm border-t border-civic-border flex items-center justify-around py-1.5 px-3 shadow-lg">
          <Link
            to="/admin/dashboard"
            className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl text-xs font-bold min-h-[48px] justify-center transition-colors ${
              isNavActive('/admin/dashboard') ? 'text-primary bg-primary-light/70' : 'text-civic-muted hover:text-civic-text'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>{t('nav.dashboard')}</span>
          </Link>

          <Link
            to="/admin/complaints"
            className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl text-xs font-bold min-h-[48px] justify-center transition-colors ${
              isNavActive('/admin/complaints') ? 'text-primary bg-primary-light/70' : 'text-civic-muted hover:text-civic-text'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span>{t('nav.complaints')}</span>
          </Link>

          <button
            onClick={logout}
            className="flex flex-col items-center gap-1 py-1 px-4 rounded-xl text-xs font-bold text-status-error hover:bg-rose-50 min-h-[48px] justify-center transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>{t('nav.logout')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
