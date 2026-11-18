import React, { useState } from 'react';
import { CategoryConfig } from '../../types';
import { useApp } from '../../context/AppContext';

interface CategoryCardProps {
  category: CategoryConfig;
  count?: number;
  onSelect: (categoryName: CategoryConfig['nameEn']) => void;
}

export function CategoryCard({ category, count, onSelect }: CategoryCardProps) {
  const { lang } = useApp();
  const [imgError, setImgError] = useState(false);
  const label = lang === 'hi' ? category.nameHi : category.nameEn;

  return (
    <button
      type="button"
      onClick={() => onSelect(category.nameEn)}
      className="group flex flex-col overflow-hidden rounded-[16px] bg-white border border-[#E4E7E1] text-left transition-all duration-150 hover:border-[#173F35] hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#173F35] cursor-pointer"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#E8F0EB]">
        {!imgError && category.imageUrl ? (
          <img
            src={category.imageUrl}
            alt={label}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-[#E8F0EB] to-[#F7F5EF] text-[#173F35] font-display font-bold text-lg">
            {label}
          </div>
        )}
      </div>
      <div className="px-3.5 py-3 flex items-center justify-between gap-2">
        <span className="font-display text-sm font-semibold text-[#26332E] truncate">
          {label}
        </span>
        {typeof count === 'number' && (
          <span className="text-xs text-[#78847D] tabular-nums shrink-0">{count}</span>
        )}
      </div>
    </button>
  );
}
