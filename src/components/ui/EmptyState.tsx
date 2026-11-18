import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6 rounded-[16px] bg-white border border-[#E4E7E1]">
      {icon && (
        <div className="w-14 h-14 rounded-full bg-[#E8F0EB] text-[#173F35] flex items-center justify-center mb-4">
          {icon}
        </div>
      )}
      <h3 className="font-display text-lg font-semibold text-[#26332E]">{title}</h3>
      <p className="text-sm text-[#78847D] max-w-md mt-1.5 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button variant="primary" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
