import React, { useState } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Modal } from './Modal';
import { Button } from './Button';

interface PWAInstallButtonProps {
  variant?: 'header' | 'card';
  className?: string;
}

export function PWAInstallButton({ variant = 'header', className = '' }: PWAInstallButtonProps) {
  const { lang } = useApp();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installing, setInstalling] = useState(false);

  if (isInstalled) {
    return null;
  }

  const label = lang === 'hi' ? 'ऐप इंस्टॉल करें' : 'Install App';
  const iosLabel = lang === 'hi' ? 'iPhone पर इंस्टॉल करें' : 'Install on iOS';

  const handleInstall = async () => {
    setInstalling(true);
    try {
      await install();
    } finally {
      setInstalling(false);
    }
  };

  if (isInstallable) {
    if (variant === 'card') {
      return (
        <div
          className={`rounded-[16px] bg-white border border-[#E4E7E1] p-4 flex items-center justify-between gap-4 ${className}`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-[12px] bg-[#173F35] text-[#D6B875] flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-display text-sm font-semibold text-[#26332E]">
                {lang === 'hi' ? 'Pashu Market ऐप' : 'Pashu Market App'}
              </div>
              <p className="text-xs text-[#78847D] truncate">
                {lang === 'hi'
                  ? 'होम स्क्रीन से तेज़ और ऐप जैसा अनुभव पाएं'
                  : 'Install on your home screen for fast app access'}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="primary"
            size="sm"
            loading={installing}
            onClick={() => void handleInstall()}
            className="shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>{label}</span>
          </Button>
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={() => void handleInstall()}
        disabled={installing}
        className={`inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-[12px] border border-[#173F35] bg-[#E8F0EB] text-[#173F35] text-xs font-semibold hover:bg-[#173F35] hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60 ${className}`}
      >
        <Download className="w-3.5 h-3.5" />
        <span>{label}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        {variant === 'card' ? (
          <div
            className={`rounded-[16px] bg-white border border-[#E4E7E1] p-4 flex items-center justify-between gap-4 ${className}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-[12px] bg-[#173F35] text-[#D6B875] flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="font-display text-sm font-semibold text-[#26332E]">
                  {lang === 'hi' ? 'Pashu Market ऐप' : 'Pashu Market App'}
                </div>
                <p className="text-xs text-[#78847D] truncate">
                  {lang === 'hi'
                    ? 'Safari से होम स्क्रीन पर जोड़ें'
                    : 'Add to your iPhone or iPad Home Screen'}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowIOSGuide(true)}
              className="shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>{iosLabel}</span>
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowIOSGuide(true)}
            className={`inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-[12px] border border-[#E4E7E1] bg-[#F7F5EF] text-[#173F35] text-xs font-semibold hover:border-[#173F35] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${className}`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{iosLabel}</span>
          </button>
        )}

        <Modal
          open={showIOSGuide}
          onClose={() => setShowIOSGuide(false)}
          title={lang === 'hi' ? 'iPhone / iPad पर ऐप इंस्टॉल करें' : 'Install on iPhone / iPad'}
          subtitle="Pashu Market"
        >
          <div className="space-y-3 text-sm text-[#26332E] leading-relaxed">
            <p>
              {lang === 'hi'
                ? '1. Safari ब्राउज़र के नीचे Share आइकन पर टैप करें।'
                : '1. Tap the Share button in the Safari toolbar.'}
            </p>
            <p>
              {lang === 'hi'
                ? '2. नीचे स्क्रॉल करें और "Add to Home Screen" चुनें।'
                : '2. Scroll down and tap "Add to Home Screen".'}
            </p>
            <p>
              {lang === 'hi'
                ? '3. ऊपर दाईं ओर "Add" पर टैप करें।'
                : '3. Tap "Add" in the top right corner.'}
            </p>
            <div className="pt-2 flex justify-end">
              <Button variant="primary" size="sm" onClick={() => setShowIOSGuide(false)}>
                {lang === 'hi' ? 'समझ गया' : 'Got it'}
              </Button>
            </div>
          </div>
        </Modal>
      </>
    );
  }

  return null;
}
