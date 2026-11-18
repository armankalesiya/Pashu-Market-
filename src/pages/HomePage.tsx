import React, { useMemo, useState } from 'react';
import { BadgeCheck, CheckCircle2, MapPin, Megaphone, Search, ShieldCheck, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { GENERATED_IMAGES, POPULAR_BREEDS } from '../utils/constants';
import { SearchBar } from '../components/ui/SearchBar';
import { Button } from '../components/ui/Button';
import { CategoryCard } from '../components/ui/CategoryCard';
import { AnimalCard } from '../components/ui/AnimalCard';
import { SectionHeader } from '../components/ui/SectionHeader';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';

export function HomePage() {
  const {
    t,
    lang,
    navigate,
    openListing,
    activeListings,
    liveListings,
    hasLiveListings,
    listingsLoading,
    listingsError,
    refreshListings,
    categories,
    sellers,
    globalSettings,
    selectedLocation,
    openLocationModal,
    setExploreFilters,
  } = useApp();

  const [heroSearch, setHeroSearch] = useState('');
  const [heroImgErr, setHeroImgErr] = useState(false);

  const locationLabel = selectedLocation.district
    ? `${selectedLocation.district}, ${selectedLocation.state}`
    : selectedLocation.state || t.common.allIndia;

  const featuredAnimals = useMemo(() => {
    const featured = activeListings.filter((l) => l.featured && !liveListings.some((live) => live.listingId === l.listingId));
    const combined = [...liveListings, ...featured];
    return (combined.length > 0 ? combined : activeListings).slice(0, 4);
  }, [activeListings, liveListings]);

  const recentAnimals = useMemo(() => activeListings.slice(0, 4), [activeListings]);

  const nearbyAnimals = useMemo(() => {
    if (!selectedLocation.state) return activeListings.slice(0, 4);
    const matching = activeListings.filter((l) => l.state === selectedLocation.state);
    return (matching.length > 0 ? matching : activeListings).slice(0, 4);
  }, [activeListings, selectedLocation.state]);

  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of activeListings) {
      map[item.category] = (map[item.category] || 0) + 1;
    }
    return map;
  }, [activeListings]);

  const handleSearchSubmit = (term: string) => {
    setExploreFilters((prev) => ({ ...prev, search: term }));
    navigate('explore');
  };

  return (
    <div className="space-y-12 pb-12">
      {globalSettings?.announcementActive && globalSettings.announcementTitle && (
        <div className="rounded-[12px] bg-[#E8F0EB] border border-[#245747]/20 px-4 py-3 flex items-start gap-3">
          <Megaphone className="w-4 h-4 text-[#173F35] mt-0.5 shrink-0" />
          <div className="text-sm text-[#26332E]">
            <span className="font-semibold text-[#173F35]">{globalSettings.announcementTitle}: </span>
            <span>{globalSettings.announcementBody}</span>
          </div>
        </div>
      )}

      {/* Search Bar & Mobile Location Trigger */}
      <section aria-label="Search livestock" className="space-y-3">
        <div className="sm:hidden flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={openLocationModal}
            className="inline-flex items-center gap-1.5 min-h-[36px] px-3 rounded-[12px] bg-white border border-[#E4E7E1] text-xs font-medium text-[#26332E] hover:border-[#173F35] cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-[#173F35] shrink-0" />
            <span>{locationLabel}</span>
          </button>
          <span className="text-xs text-[#78847D]">{t.common.locationLabel}</span>
        </div>
        <SearchBar value={heroSearch} onChange={setHeroSearch} onSubmit={handleSearchSubmit} />
      </section>

      {/* Main Hero */}
      <section className="rounded-[16px] overflow-hidden bg-[#173F35] text-white border border-[#245747]">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-6 p-6 sm:p-10 flex flex-col justify-center">
            <p className="text-xs font-semibold tracking-wider text-[#D6B875] uppercase mb-2">
              {t.tagline}
            </p>
            <h1
              className="font-display text-3xl sm:text-4xl lg:text-[42px] font-bold leading-tight text-white"
              style={{ textWrap: 'balance' }}
            >
              {t.home.heroTitle}
            </h1>
            <p className="mt-3 text-base text-[#E8F0EB] leading-relaxed max-w-xl">
              {t.home.heroSubtitle}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button
                variant="gold"
                size="lg"
                onClick={() => navigate('explore')}
              >
                {t.home.buyAnimal}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="!bg-transparent !text-white !border-[#D6B875]/60 hover:!bg-[#245747]"
                onClick={() => navigate('sell')}
              >
                {t.home.sellAnimal}
              </Button>
            </div>
          </div>

          <div className="lg:col-span-6 min-h-[240px] lg:min-h-[360px] bg-[#245747]">
            {!heroImgErr ? (
              <img
                src={GENERATED_IMAGES.hero}
                alt="Indian Gir cows and Murrah buffaloes grazing at golden hour"
                referrerPolicy="no-referrer"
                onError={() => setHeroImgErr(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center p-8 text-[#D6B875] font-display text-xl font-bold">
                PASHU MARKET
              </div>
            )}
          </div>
        </div>
      </section>

      {!hasLiveListings && (
        <div className="rounded-[12px] bg-white border border-[#E4E7E1] px-4 py-3 text-xs text-[#78847D] flex items-center justify-between gap-3">
          <span>{t.home.demoNotice}</span>
          <button
            type="button"
            onClick={() => navigate('sell')}
            className="text-[#173F35] font-semibold hover:underline whitespace-nowrap shrink-0 cursor-pointer"
          >
            {t.home.sellAnimal}
          </button>
        </div>
      )}

      {/* Categories */}
      <section>
        <SectionHeader
          title={t.home.categoriesTitle}
          subtitle={t.home.categoriesSubtitle}
          actionLabel={t.home.viewAll}
          onAction={() => {
            setExploreFilters((prev) => ({ ...prev, category: 'All' }));
            navigate('explore');
          }}
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <CategoryCard
              key={cat.categoryId}
              category={cat}
              count={categoryCounts[cat.nameEn] || 0}
              onSelect={(categoryName) => {
                setExploreFilters((prev) => ({ ...prev, category: categoryName }));
                navigate('explore');
              }}
            />
          ))}
        </div>
      </section>

      {/* Featured Animals */}
      <section>
        <SectionHeader
          title={t.home.featuredTitle}
          subtitle={t.home.featuredSubtitle}
          actionLabel={t.home.viewAll}
          onAction={() => navigate('explore')}
        />
        {listingsLoading && featuredAnimals.length === 0 ? (
          <LoadingState message={t.common.loading} />
        ) : listingsError && featuredAnimals.length === 0 ? (
          <ErrorState message={listingsError} onRetry={refreshListings} retryLabel={t.common.retry} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredAnimals.map((animal) => (
              <AnimalCard key={animal.listingId} listing={animal} onOpen={openListing} />
            ))}
          </div>
        )}
      </section>

      {/* Recently Added */}
      <section>
        <SectionHeader
          title={t.home.recentTitle}
          subtitle={t.home.recentSubtitle}
          actionLabel={t.home.viewAll}
          onAction={() => {
            setExploreFilters((prev) => ({ ...prev, sortBy: 'newest' }));
            navigate('explore');
          }}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {recentAnimals.map((animal) => (
            <AnimalCard key={`recent_${animal.listingId}`} listing={animal} onOpen={openListing} />
          ))}
        </div>
      </section>

      {/* Nearby Animals */}
      <section>
        <SectionHeader
          title={t.home.nearbyTitle}
          subtitle={
            selectedLocation.state
              ? `${selectedLocation.district ? `${selectedLocation.district}, ` : ''}${selectedLocation.state}`
              : t.home.nearbySubtitle
          }
          actionLabel={t.home.viewAll}
          onAction={() => {
            setExploreFilters((prev) => ({
              ...prev,
              state: selectedLocation.state,
              district: selectedLocation.district,
              nearbyOnly: Boolean(selectedLocation.state),
            }));
            navigate('explore');
          }}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {nearbyAnimals.map((animal) => (
            <AnimalCard key={`nearby_${animal.listingId}`} listing={animal} onOpen={openListing} />
          ))}
        </div>
      </section>

      {/* Popular Breeds */}
      <section>
        <SectionHeader title={t.home.popularBreedsTitle} subtitle={t.home.popularBreedsSubtitle} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {POPULAR_BREEDS.map((breed) => (
            <button
              key={breed.name}
              type="button"
              onClick={() => {
                setExploreFilters((prev) => ({
                  ...prev,
                  category: breed.category,
                  breed: breed.name,
                }));
                navigate('explore');
              }}
              className="group rounded-[16px] bg-white border border-[#E4E7E1] overflow-hidden text-left hover:border-[#173F35] transition-all cursor-pointer"
            >
              <div className="aspect-[16/10] bg-[#E8F0EB] overflow-hidden">
                <img
                  src={breed.image}
                  alt={breed.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <div className="text-xs text-[#78847D]">
                  {breed.category} · {breed.origin}
                </div>
                <h3 className="font-display text-base font-bold text-[#26332E] mt-0.5">
                  {breed.name}
                </h3>
                <p className="text-xs text-[#78847D] mt-1">
                  {lang === 'hi' ? breed.traitHi : breed.traitEn}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Trusted Sellers */}
      <section>
        <SectionHeader title={t.home.trustedSellersTitle} subtitle={t.home.trustedSellersSubtitle} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {sellers.slice(0, 3).map((seller) => (
            <div
              key={seller.uid}
              className="rounded-[16px] bg-white border border-[#E4E7E1] p-5 flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-[#E8F0EB] text-[#173F35] font-display font-bold flex items-center justify-center shrink-0 overflow-hidden">
                {seller.photoURL ? (
                  <img
                    src={seller.photoURL}
                    alt={seller.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  seller.name.slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-display text-sm font-bold text-[#26332E] truncate">
                    {seller.name}
                  </h3>
                  {seller.verified && (
                    <BadgeCheck className="w-4 h-4 text-[#347A54] shrink-0" aria-label="Verified seller" />
                  )}
                </div>
                <p className="text-xs text-[#78847D] flex items-center gap-1 mt-0.5 truncate">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span>
                    {seller.village ? `${seller.village}, ` : ''}
                    {seller.district}, {seller.state}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="rounded-[16px] bg-white border border-[#E4E7E1] p-6 sm:p-8">
        <SectionHeader title={t.home.howItWorksTitle} subtitle={t.home.howItWorksSubtitle} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-[12px] bg-[#E8F0EB] text-[#173F35] flex items-center justify-center">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="font-display text-base font-bold text-[#26332E]">
              01. {t.home.step1Title}
            </h3>
            <p className="text-sm text-[#78847D] leading-relaxed">{t.home.step1Desc}</p>
          </div>
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-[12px] bg-[#E8F0EB] text-[#173F35] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-display text-base font-bold text-[#26332E]">
              02. {t.home.step2Title}
            </h3>
            <p className="text-sm text-[#78847D] leading-relaxed">{t.home.step2Desc}</p>
          </div>
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-[12px] bg-[#E8F0EB] text-[#173F35] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-display text-base font-bold text-[#26332E]">
              03. {t.home.step3Title}
            </h3>
            <p className="text-sm text-[#78847D] leading-relaxed">{t.home.step3Desc}</p>
          </div>
        </div>
        <div className="mt-6 pt-5 border-t border-[#E4E7E1] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-[#347A54] font-medium">
            <CheckCircle2 className="w-4 h-4" />
            <span>Direct farm-to-farm transactions with zero hidden commissions</span>
          </div>
          <Button variant="primary" size="sm" onClick={() => navigate('explore')}>
            {t.home.buyAnimal}
          </Button>
        </div>
      </section>
    </div>
  );
}
