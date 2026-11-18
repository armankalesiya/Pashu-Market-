import React from 'react';
import { Compass, Heart, Home, PlusCircle, User } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function BottomNavigation() {
  const { route, navigate, t } = useApp();

  if (route === 'detail') return null;

  const items = [
    { id: 'home' as const, label: t.nav.home, icon: Home },
    { id: 'explore' as const, label: t.nav.explore, icon: Compass },
    { id: 'sell' as const, label: t.nav.sell, icon: PlusCircle, highlighted: true },
    { id: 'favourites' as const, label: t.nav.favourites, icon: Heart },
    { id: 'profile' as const, label: t.nav.profile, icon: User },
  ];

  return (
    <nav
      aria-label="Mobile bottom navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E4E7E1] pb-safe"
    >
      <div className="grid grid-cols-5 items-center h-16 max-w-xl mx-auto px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = route === item.id;
          if (item.highlighted) {
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.id)}
                aria-label={item.label}
                className="flex flex-col items-center justify-center min-h-[48px] cursor-pointer"
              >
                <span
                  className={`inline-flex items-center justify-center px-3.5 py-1.5 rounded-[12px] border transition-colors ${
                    active
                      ? 'bg-[#173F35] text-[#D6B875] border-[#173F35]'
                      : 'bg-[#D6B875] text-[#173F35] border-[#D6B875]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </span>
                <span
                  className={`text-[10px] font-semibold mt-0.5 whitespace-nowrap ${
                    active ? 'text-[#173F35]' : 'text-[#26332E]'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.id)}
              aria-label={item.label}
              className={`flex flex-col items-center justify-center min-h-[48px] transition-colors cursor-pointer ${
                active ? 'text-[#173F35]' : 'text-[#78847D] hover:text-[#26332E]'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={active ? 2.4 : 1.9} />
              <span
                className={`text-[11px] mt-1 whitespace-nowrap ${
                  active ? 'font-semibold text-[#173F35]' : 'font-medium'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
