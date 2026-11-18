import React from 'react';
import { ChevronRight } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, subtitle, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-4 mb-5">
      <div>
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#26332E] tracking-tight">
          {title}
        </h2>
        {subtitle && <p className="text-sm text-[#78847D] mt-1">{subtitle}</p>}
      </div>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-1 text-sm font-semibold text-[#173F35] hover:text-[#245747] whitespace-nowrap shrink-0 min-h-[40px] px-2 transition-colors cursor-pointer"
        >
          <span>{actionLabel}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
