import React, { useMemo } from 'react';
import { Heart } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AnimalCard } from '../components/ui/AnimalCard';
import { EmptyState } from '../components/ui/EmptyState';

export function FavouritesPage() {
  const { t, favourites, activeListings, openListing, navigate } = useApp();

  const savedListings = useMemo(() => {
    const ids = new Set(favourites.map((f) => f.listingId));
    return activeListings.filter((item) => ids.has(item.listingId));
  }, [favourites, activeListings]);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#26332E]">
          {t.favourites.title}
        </h1>
        <p className="text-sm text-[#78847D] mt-1">{t.favourites.subtitle}</p>
      </div>

      {savedListings.length === 0 ? (
        <EmptyState
          icon={<Heart className="w-7 h-7" />}
          title={t.favourites.emptyTitle}
          description={t.favourites.emptyDesc}
          actionLabel={t.favourites.browseAnimals}
          onAction={() => navigate('explore')}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {savedListings.map((animal) => (
            <AnimalCard key={animal.listingId} listing={animal} onOpen={openListing} />
          ))}
        </div>
      )}
    </div>
  );
}
