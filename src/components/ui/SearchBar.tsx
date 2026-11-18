import React, { useMemo, useRef, useState } from 'react';
import { Clock, Search, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BREEDS_BY_CATEGORY, INDIAN_STATES_DISTRICTS } from '../../utils/constants';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: (term: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, onSubmit, placeholder }: SearchBarProps) {
  const { t, searchHistory, addSearchHistory, clearSearchHistory } = useApp();
  const [focused, setFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    const q = value.trim().toLowerCase();
    const allBreeds = Object.entries(BREEDS_BY_CATEGORY).flatMap(([cat, breeds]) =>
      breeds.map((b) => `${b} ${cat}`)
    );
    const allStates = Object.keys(INDIAN_STATES_DISTRICTS);
    const pool = [...allBreeds, ...allStates];
    if (!q) return pool.slice(0, 6);
    return pool.filter((item) => item.toLowerCase().includes(q)).slice(0, 6);
  }, [value]);

  const handleSelect = (term: string) => {
    onChange(term);
    addSearchHistory(term);
    setFocused(false);
    onSubmit(term);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          addSearchHistory(value);
          setFocused(false);
          onSubmit(value);
        }}
        className="flex items-center w-full rounded-[12px] bg-white border border-[#E4E7E1] focus-within:border-[#173F35] focus-within:ring-2 focus-within:ring-[#173F35]/15 transition-all"
      >
        <Search className="w-5 h-5 text-[#78847D] ml-3.5 shrink-0" aria-hidden="true" />
        <input
          type="search"
          value={value}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 180)}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || t.home.searchPlaceholder}
          aria-label={placeholder || t.home.searchPlaceholder}
          className="w-full min-h-[46px] bg-transparent px-3 py-2 text-sm text-[#26332E] placeholder:text-[#78847D] focus:outline-none"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Clear search"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center text-[#78847D] hover:text-[#26332E] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <button
          type="submit"
          className="mr-1.5 px-4 min-h-[38px] rounded-[10px] bg-[#173F35] text-white text-xs font-semibold hover:bg-[#245747] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          {t.nav.explore}
        </button>
      </form>

      {focused && (searchHistory.length > 0 || suggestions.length > 0) && (
        <div className="absolute left-0 right-0 top-full mt-2 z-30 rounded-[16px] bg-white border border-[#E4E7E1] shadow-lg p-3">
          {searchHistory.length > 0 && !value.trim() && (
            <div className="mb-3">
              <div className="flex items-center justify-between px-2 mb-1.5">
                <span className="text-xs font-semibold text-[#78847D]">
                  {t.home.recentSearches}
                </span>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    clearSearchHistory();
                  }}
                  className="text-xs font-medium text-[#173F35] hover:underline cursor-pointer"
                >
                  {t.home.clearHistory}
                </button>
              </div>
              <div className="flex flex-col">
                {searchHistory.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(term);
                    }}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] text-left text-sm text-[#26332E] hover:bg-[#E8F0EB] transition-colors cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5 text-[#78847D]" />
                    <span>{term}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {suggestions.length > 0 && (
            <div>
              <div className="px-2 mb-1 text-xs font-semibold text-[#78847D]">
                Suggestions
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {suggestions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(item);
                    }}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-[10px] text-left text-sm text-[#26332E] hover:bg-[#E8F0EB] transition-colors cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5 text-[#78847D]" />
                    <span className="truncate">{item}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
