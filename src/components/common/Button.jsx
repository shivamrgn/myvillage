import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon: Icon,
  className = '',
  type = 'button',
  onClick,
  style = {},
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.99] touch-target';

  const variants = {
    primary:
      'bg-primary btn-primary bg-[#1769C2] hover:bg-[#1358a3] text-white shadow-xs focus-visible:ring-[#1769C2]',
    dark:
      'bg-[#123B68] hover:bg-slate-900 text-white shadow-xs focus-visible:ring-[#123B68]',
    secondary:
      'bg-[#EAF3FF] hover:bg-blue-100 text-[#123B68] font-bold border border-blue-300 shadow-2xs focus-visible:ring-[#1769C2]',
    outline:
      'border-2 border-[#1769C2] text-[#1769C2] font-bold hover:bg-[#EAF3FF] hover:text-[#123B68] focus-visible:ring-[#1769C2]',
    ghost:
      'text-slate-800 font-bold hover:bg-slate-100 hover:text-slate-950 border border-slate-300 shadow-2xs focus-visible:ring-slate-300',
    success:
      'bg-[#16A36A] hover:bg-emerald-700 text-white shadow-xs focus-visible:ring-[#16A36A]',
    danger:
      'bg-[#DC4545] hover:bg-rose-700 text-white shadow-xs focus-visible:ring-[#DC4545]',
  };

  // Direct inline styles guarantee 100% visible colors regardless of CSS/caching state
  const defaultInlineStyles = {
    primary: {
      backgroundColor: '#1769C2',
      color: '#FFFFFF',
    },
    dark: {
      backgroundColor: '#123B68',
      color: '#FFFFFF',
    },
    secondary: {
      backgroundColor: '#EAF3FF',
      color: '#123B68',
    },
    outline: {
      backgroundColor: '#FFFFFF',
      color: '#1769C2',
    },
    ghost: {
      backgroundColor: '#FFFFFF',
      color: '#1E293B',
    },
    success: {
      backgroundColor: '#16A36A',
      color: '#FFFFFF',
    },
    danger: {
      backgroundColor: '#DC4545',
      color: '#FFFFFF',
    },
  };

  const sizes = {
    sm: 'text-sm px-3.5 py-2 gap-1.5 min-h-[44px]',
    md: 'text-base px-5 py-3 gap-2 min-h-[48px]',
    lg: 'text-base sm:text-lg px-6 py-3.5 gap-2.5 min-h-[52px]',
  };

  return (
    <button
      type={type}
      style={{
        ...(defaultInlineStyles[variant] || {}),
        ...style,
      }}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      disabled={disabled || isLoading}
      onClick={onClick}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin shrink-0" aria-hidden="true" />
      ) : Icon ? (
        <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
      ) : null}
      <span>{children}</span>
    </button>
  );
};
