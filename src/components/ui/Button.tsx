import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'gold' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled,
  className = '',
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary: 'bg-[#173F35] text-white hover:bg-[#245747] focus-visible:ring-[#173F35]',
    secondary: 'bg-[#E8F0EB] text-[#173F35] hover:bg-[#d7e6dc] focus-visible:ring-[#245747]',
    outline: 'bg-white text-[#26332E] border border-[#E4E7E1] hover:border-[#173F35] hover:text-[#173F35] focus-visible:ring-[#173F35]',
    gold: 'bg-[#D6B875] text-[#173F35] hover:bg-[#c8a862] focus-visible:ring-[#D6B875]',
    danger: 'bg-[#C94D4D] text-white hover:bg-[#b03f3f] focus-visible:ring-[#C94D4D]',
    ghost: 'bg-transparent text-[#26332E] hover:bg-[#E8F0EB] focus-visible:ring-[#173F35]',
  };

  const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
    sm: 'min-h-[40px] px-3.5 py-2 text-xs',
    md: 'min-h-[44px] px-5 py-2.5 text-sm',
    lg: 'min-h-[48px] px-6 py-3 text-base',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-[12px] font-medium whitespace-nowrap shrink-0 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-55 disabled:cursor-not-allowed active:scale-[0.98] cursor-pointer ${
        variantClasses[variant]
      } ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {loading && (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
}
