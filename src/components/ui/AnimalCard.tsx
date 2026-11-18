import React, { useState } from 'react';
import { BadgeCheck, Heart, MapPin } from 'lucide-react';
import { AnimalListing } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatINR, formatListingDate } from '../../utils/validation';

interface AnimalCardProps {
  listing: AnimalListing;
  viewMode?: 'grid' | 'list';
  onOpen: (listingId: string) => void;
}

export function AnimalCard({ listing, viewMode = 'grid', onOpen }: AnimalCardProps) {
  const { lang, t, isListingSaved, toggleSaveListing } = useApp();
  const [imgError, setImgError] = useState(false);
  const saved = isListingSaved(listing.listingId);
  const title = `${listing.breed} ${listing.category}`;

  return (
    <article
      className={`group rounded-[16px] bg-white border border-[#E4E7E1] overflow-hidden transition-all duration-150 hover:border-[#245747]/50 hover:shadow-md ${
        viewMode === 'list' ? 'flex flex-col sm:flex-row' : 'flex flex-col'
      }`}
    >
      <div
        className={`relative overflow-hidden bg-[#E8F0EB] shrink-0 ${
          viewMode === 'list' ? 'sm:w-64 aspect-[4/3] sm:aspect-auto' : 'aspect-[4/3] w-full'
        }`}
      >
        {!imgError && listing.photos[0] ? (
          <img
            src={listing.photos[0]}
            alt={title}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[#E8F0EB] to-[#F7F5EF] text-[#173F35]">
            <span className="font-display font-semibold text-sm">{title}</span>
          </div>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            void toggleSaveListing(listing);
          }}
          aria-label={saved ? `Remove ${title} from favourites` : `Save ${title} to favourites`}
          className={`absolute top-3 right-3 min-h-[40px] min-w-[40px] rounded-full flex items-center justify-center transition-colors shadow-sm cursor-pointer ${
            saved
              ? 'bg-[#173F35] text-[#D6B875]'
              : 'bg-white/95 text-[#26332E] hover:text-[#173F35]'
          }`}
        >
          <Heart className="w-4 h-4" fill={saved ? 'currentColor' : 'none'} />
        </button>

        {!listing.isDemo && listing.status === 'ACTIVE' && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-[8px] bg-[#347A54] text-white text-[11px] font-semibold tracking-wide shadow-sm">
            {t.sell.livePublicBadge}
          </span>
        )}

        {listing.featured && (
          <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-[8px] bg-[#173F35]/90 text-[#D6B875] text-[11px] font-semibold tracking-wide">
            Featured
          </span>
        )}
      </div>

      <div className="flex flex-col flex-1 p-4 justify-between gap-3">
        <div>
          <div className="flex items-center justify-between gap-2 text-xs text-[#78847D]">
            <span className="truncate">
              {listing.category} · {listing.age} · {listing.gender}
            </span>
            {listing.sellerVerified && (
              <span className="inline-flex items-center gap-1 text-[#347A54] font-medium shrink-0">
                <BadgeCheck className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t.common.verified}</span>
              </span>
            )}
          </div>

          <h3 className="font-display text-base font-bold text-[#26332E] mt-1 line-clamp-1">
            {title}
          </h3>

          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="font-display text-lg font-bold text-[#173F35] tabular-nums">
              {formatINR(listing.price)}
            </span>
            {listing.milkCapacity && (
              <span className="text-xs text-[#78847D] truncate">· {listing.milkCapacity}</span>
            )}
          </div>

          <div className="mt-2 flex items-center gap-1.5 text-xs text-[#78847D]">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-[#245747]" aria-hidden="true" />
            <span className="truncate">
              {listing.village}, {listing.district}, {listing.state}
            </span>
          </div>
        </div>

        <div className="pt-2.5 border-t border-[#E4E7E1] flex items-center justify-between gap-3">
          <span className="text-xs text-[#78847D]">
            {formatListingDate(listing.publishedAt, lang)}
          </span>
          <button
            type="button"
            onClick={() => onOpen(listing.listingId)}
            className="min-h-[38px] px-3.5 rounded-[10px] bg-[#E8F0EB] text-[#173F35] text-xs font-semibold hover:bg-[#173F35] hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {t.explore.viewDetails}
          </button>
        </div>
      </div>
    </article>
  );
}
