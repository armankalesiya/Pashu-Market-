import React from 'react';
import { Logo } from './Logo';

interface SplashScreenProps {
  onContinue: () => void;
}

export function SplashScreen({ onContinue }: SplashScreenProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#173F35] text-white px-6"
      role="region"
      aria-label="Welcome to Pashu Market"
    >
      <div className="flex flex-col items-center text-center max-w-sm">
        <Logo variant="light" size="lg" showTagline={false} />
        <p className="mt-3 text-sm font-medium tracking-wide text-[#D6B875]">
          India&apos;s Livestock Marketplace
        </p>
        <div className="mt-8 w-48 h-1.5 rounded-full bg-[#245747] overflow-hidden">
          <div className="h-full w-2/3 bg-[#D6B875] rounded-full animate-pulse" />
        </div>
        <button
          type="button"
          onClick={onContinue}
          className="mt-8 text-xs font-medium text-[#E8F0EB]/80 hover:text-white underline underline-offset-4 cursor-pointer"
        >
          Enter Marketplace
        </button>
      </div>
    </div>
  );
}
