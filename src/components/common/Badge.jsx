import React from 'react';

export const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
}) => {
  const variants = {
    default: 'bg-slate-100 text-slate-800 font-bold border-slate-300',
    primary: 'bg-[#EAF3FF] text-[#123B68] font-bold border-blue-300',
    success: 'bg-emerald-50 text-emerald-800 font-bold border-emerald-300',
    warning: 'bg-amber-50 text-amber-900 font-bold border-amber-300',
    danger: 'bg-rose-50 text-rose-800 font-bold border-rose-300',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-0.5 font-semibold',
    md: 'text-xs sm:text-sm px-3 py-1 font-bold',
    lg: 'text-sm px-3.5 py-1.5 font-extrabold',
  };

  const dots = {
    default: 'bg-slate-500',
    primary: 'bg-primary',
    success: 'bg-emerald-600',
    warning: 'bg-amber-600',
    danger: 'bg-rose-600',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border whitespace-nowrap shrink-0 ${
        variants[variant] || variants.default
      } ${sizes[size] || sizes.md} ${className}`}
    >
      {dot && (
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${dots[variant] || dots.default}`}
          aria-hidden="true"
        />
      )}
      <span className="whitespace-nowrap">{children}</span>
    </span>
  );
};
