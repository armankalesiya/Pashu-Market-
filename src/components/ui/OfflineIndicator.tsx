import React from 'react';
import { WifiOff } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const { lang } = useApp();

  if (isOnline) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 lg:bottom-6 left-4 z-50 flex items-center gap-2 rounded-[12px] bg-[#173F35] border border-[#D6B875] px-3.5 py-2 text-xs font-semibold text-white shadow-lg"
    >
      <WifiOff className="w-3.5 h-3.5 text-[#D6B875] shrink-0" />
      <span>
        {lang === 'hi'
          ? 'ऑफ़लाइन मोड — इंटरनेट कनेक्शन नहीं है'
          : 'Offline Mode — Reconnect for live listings'}
      </span>
    </div>
  );
}
