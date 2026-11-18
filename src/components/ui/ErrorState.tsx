import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({
  title = 'Unable to load content',
  message,
  onRetry,
  retryLabel = 'Try Again',
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6 rounded-[16px] bg-white border border-[#C94D4D]/30">
      <div className="w-12 h-12 rounded-full bg-[#C94D4D]/10 text-[#C94D4D] flex items-center justify-center mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="font-display text-base font-semibold text-[#26332E]">{title}</h3>
      <p className="text-sm text-[#78847D] max-w-md mt-1">{message}</p>
      {onRetry && (
        <div className="mt-4">
          <Button variant="outline" size="sm" onClick={onRetry}>
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
