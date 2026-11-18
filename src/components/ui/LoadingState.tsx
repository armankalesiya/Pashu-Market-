import React from 'react';

export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center rounded-[16px] bg-white border border-[#E4E7E1]">
      <div className="w-10 h-10 rounded-full border-3 border-[#E8F0EB] border-t-[#173F35] animate-spin mb-4" />
      <p className="text-sm font-medium text-[#78847D]">{message}</p>
    </div>
  );
}
