import React, { forwardRef } from 'react';

export const Input = forwardRef(
  (
    {
      label,
      error,
      helperText,
      id,
      className = '',
      type = 'text',
      required = false,
      ...props
    },
    ref
  ) => {
    const inputId = id || props.name;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm sm:text-base font-semibold text-civic-text"
          >
            {label}
            {required && <span className="text-status-error ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          required={required}
          className={`block w-full rounded-xl border px-4 py-3 text-civic-text placeholder-civic-muted text-base bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-slate-50 disabled:text-slate-400 min-h-[48px] ${
            error
              ? 'border-status-error focus:border-status-error focus:ring-status-error/20'
              : 'border-civic-border'
          } ${className}`}
          {...props}
        />
        {error && <p className="text-xs sm:text-sm text-status-error font-medium">{error}</p>}
        {helperText && !error && (
          <p className="text-xs text-civic-muted">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
