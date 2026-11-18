import React from 'react';

interface LogoProps {
  variant?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export function Logo({ variant = 'dark', size = 'md', showTagline = false }: LogoProps) {
  const textColor = variant === 'light' ? 'text-white' : 'text-[#173F35]';
  const subColor = variant === 'light' ? 'text-[#D6B875]' : 'text-[#78847D]';
  const iconSize = size === 'lg' ? 44 : size === 'sm' ? 28 : 34;

  return (
    <div className="inline-flex items-center gap-2.5 shrink-0">
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect
          width="40"
          height="40"
          rx="11"
          fill={variant === 'light' ? '#245747' : '#173F35'}
          stroke="#D6B875"
          strokeWidth="1.5"
        />
        <path
          d="M11 13C11.5 16.5 13.8 18.8 16.5 19.5C15.5 22 15.8 25.5 17.4 27.8C18.2 29 19.2 29.5 20 29.5C20.8 29.5 21.8 29 22.6 27.8C24.2 25.5 24.5 22 23.5 19.5C26.2 18.8 28.5 16.5 29 13C27 14.3 25 15.2 22.5 15.2H17.5C15 15.2 13 14.3 11 13Z"
          stroke="#D6B875"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="17.8" cy="21.5" r="1.1" fill="#FFFFFF" />
        <circle cx="22.2" cy="21.5" r="1.1" fill="#FFFFFF" />
      </svg>
      <div className="flex flex-col leading-none">
        <span
          className={`font-display font-bold tracking-tight whitespace-nowrap ${
            size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-base' : 'text-lg'
          } ${textColor}`}
        >
          PASHU MARKET
        </span>
        {showTagline && (
          <span className={`text-[11px] font-medium mt-1 whitespace-nowrap ${subColor}`}>
            India&apos;s Livestock Marketplace
          </span>
        )}
      </div>
    </div>
  );
}
