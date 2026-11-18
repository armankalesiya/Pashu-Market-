import React, { useMemo, useState } from 'react';
import { LayoutGrid, List, SlidersHorizontal } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AnimalCategory, AnimalGender } from '../types';
import { BREEDS_BY_CATEGORY, INDIAN_STATES_DISTRICTS } from '../utils/constants';
import { filterAndSortListings } from '../utils/validation';
import { SearchBar } from '../components/ui/SearchBar';
import { Input, Select } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { AnimalCard } from '../components/ui/AnimalCard';
import { LoadingState } from '../components/ui/LoadingState';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';

const PAGE_SIZE = 8;

export function ExplorePage() {
  const {
    t,
    lang,
    activeListings,
    listingsLoading,
    listingsError,
    refreshListings,
    categories,
    exploreFilters,
    setExploreFilters,
    selectedLocation,
    openListing,
  } = useApp();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filteredListings = useMemo(
    () => filterAndSortListings(activeListings, exploreFilters, selectedLocation),
    [activeListings, exploreFilters, selectedLocation]
  );

  const paginatedListings = useMemo(
    () => filteredListings.slice(0, visibleCount),
    [filteredListings, visibleCount]
  );

  const breedSuggestions = useMemo(() => {
    if (exploreFilters.category === 'All') {
      return Array.from(new Set(Object.values(BREEDS_BY_CATEGORY).flat()));
    }
    return BREEDS_BY_CATEGORY[exploreFilters.category] || [];
  }, [exploreFilters.category]);

  const districts = exploreFilters.state
    ? INDIAN_STATES_DISTRICTS[exploreFilters.state] || []
    : [];

  const resetAllFilters = () => {
    setExploreFilters({
      search: '',
      category: 'All',
      breed: '',
      state: '',
      district: '',
      minPrice: '',
      maxPrice: '',
      age: '',
      gender: 'All',
      sortBy: 'newest',
      nearbyOnly: false,
    });
    setVisibleCount(PAGE_SIZE);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#26332E]">
            {t.explore.title}
          </h1>
          <p className="text-sm text-[#78847D] mt-1">{t.explore.subtitle}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters((v) => !v)}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>{t.explore.filters}</span>
          </Button>
          <div className="inline-flex rounded-[12px] border border-[#E4E7E1] bg-white p-1">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              className={`min-h-[34px] min-w-[36px] rounded-[8px] flex items-center justify-center cursor-pointer ${
                viewMode === 'grid' ? 'bg-[#173F35] text-white' : 'text-[#78847D]'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              aria-label="List view"
              className={`min-h-[34px] min-w-[36px] rounded-[8px] flex items-center justify-center cursor-pointer ${
                viewMode === 'list' ? 'bg-[#173F35] text-white' : 'text-[#78847D]'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <SearchBar
        value={exploreFilters.search}
        onChange={(val) => setExploreFilters((prev) => ({ ...prev, search: val }))}
        onSubmit={(term) => setExploreFilters((prev) => ({ ...prev, search: term }))}
      />

      {showFilters && (
        <section className="rounded-[16px] bg-white border border-[#E4E7E1] p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Select
              label={t.explore.category}
              value={exploreFilters.category}
              onChange={(e) =>
                setExploreFilters((prev) => ({
                  ...prev,
                  category: e.target.value as AnimalCategory | 'All',
                  breed: '',
                }))
              }
            >
              <option value="All">{t.explore.allCategories}</option>
              {categories.map((c) => (
                <option key={c.categoryId} value={c.nameEn}>
                  {lang === 'hi' ? c.nameHi : c.nameEn}
                </option>
              ))}
            </Select>

            <Select
              label={t.explore.breed}
              value={exploreFilters.breed}
              onChange={(e) => setExploreFilters((prev) => ({ ...prev, breed: e.target.value }))}
            >
              <option value="">{t.explore.anyBreed}</option>
              {breedSuggestions.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </Select>

            <Select
              label={t.explore.state}
              value={exploreFilters.state}
              onChange={(e) =>
                setExploreFilters((prev) => ({
                  ...prev,
                  state: e.target.value,
                  district: '',
                }))
              }
            >
              <option value="">{t.explore.allStates}</option>
              {Object.keys(INDIAN_STATES_DISTRICTS).map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </Select>

            <Select
              label={t.explore.district}
              value={exploreFilters.district}
              disabled={!exploreFilters.state}
              onChange={(e) => setExploreFilters((prev) => ({ ...prev, district: e.target.value }))}
            >
              <option value="">{t.explore.allDistricts}</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>

            <Input
              label={t.explore.minPrice}
              type="number"
              min={0}
              value={exploreFilters.minPrice}
              onChange={(e) => setExploreFilters((prev) => ({ ...prev, minPrice: e.target.value }))}
              placeholder="5000"
            />

            <Input
              label={t.explore.maxPrice}
              type="number"
              min={0}
              value={exploreFilters.maxPrice}
              onChange={(e) => setExploreFilters((prev) => ({ ...prev, maxPrice: e.target.value }))}
              placeholder="250000"
            />

            <Input
              label={t.explore.age}
              value={exploreFilters.age}
              onChange={(e) => setExploreFilters((prev) => ({ ...prev, age: e.target.value }))}
              placeholder={t.explore.anyAge}
            />

            <Select
              label={t.explore.gender}
              value={exploreFilters.gender}
              onChange={(e) =>
                setExploreFilters((prev) => ({
                  ...prev,
                  gender: e.target.value as AnimalGender | 'All',
                }))
              }
            >
              <option value="All">{t.explore.allGenders}</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Pair / Group">Pair / Group</option>
            </Select>
          </div>

          <div className="pt-3 border-t border-[#E4E7E1] flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <label className="inline-flex items-center gap-2 text-sm text-[#26332E] cursor-pointer">
                <input
                  type="checkbox"
                  checked={exploreFilters.nearbyOnly}
                  onChange={(e) =>
                    setExploreFilters((prev) => ({
                      ...prev,
                      nearbyOnly: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded accent-[#173F35]"
                />
                <span>
                  {t.explore.nearbyOnly}
                  {selectedLocation.state ? ` (${selectedLocation.state})` : ''}
                </span>
              </label>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[#78847D]">{t.explore.sortBy}:</span>
                <select
                  aria-label={t.explore.sortBy}
                  value={exploreFilters.sortBy}
                  onChange={(e) =>
                    setExploreFilters((prev) => ({
                      ...prev,
                      sortBy: e.target.value as 'newest' | 'price_asc' | 'price_desc',
                    }))
                  }
                  className="min-h-[38px] rounded-[10px] border border-[#E4E7E1] bg-white px-3 text-xs font-medium text-[#26332E]"
                >
                  <option value="newest">{t.explore.sortNewest}</option>
                  <option value="price_asc">{t.explore.sortLowest}</option>
                  <option value="price_desc">{t.explore.sortHighest}</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-[#78847D] tabular-nums">
                {filteredListings.length} {t.explore.resultsCount}
              </span>
              <Button variant="ghost" size="sm" onClick={resetAllFilters}>
                {t.explore.resetFilters}
              </Button>
            </div>
          </div>
        </section>
      )}

      {listingsLoading ? (
        <LoadingState message={t.common.loading} />
      ) : listingsError ? (
        <ErrorState message={listingsError} onRetry={refreshListings} retryLabel={t.common.retry} />
      ) : paginatedListings.length === 0 ? (
        <EmptyState
          title={t.explore.noResultsTitle}
          description={t.explore.noResultsDesc}
          actionLabel={t.explore.resetFilters}
          onAction={resetAllFilters}
        />
      ) : (
        <>
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5'
                : 'flex flex-col gap-4'
            }
          >
            {paginatedListings.map((animal) => (
              <AnimalCard
                key={animal.listingId}
                listing={animal}
                viewMode={viewMode}
                onOpen={openListing}
              />
            ))}
          </div>

          {visibleCount < filteredListings.length && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
              >
                {t.explore.loadMore}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
