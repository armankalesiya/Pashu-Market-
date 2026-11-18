import { AnimalListing, ExploreFilters, LanguageCode } from '../types';

export const BLUEPRINT_LIMITS = {
  idMax: 128,
  idPattern: /^[a-zA-Z0-9_-]+$/,
  nameMin: 2,
  nameMax: 100,
  breedMin: 2,
  breedMax: 80,
  ageMin: 1,
  ageMax: 40,
  colorMin: 1,
  colorMax: 60,
  healthMin: 2,
  healthMax: 120,
  vaccinationMin: 2,
  vaccinationMax: 120,
  descriptionMin: 10,
  descriptionMax: 2000,
  stateMax: 80,
  districtMax: 80,
  villageMax: 120,
  locationDescMax: 300,
  phoneMin: 8,
  phoneMax: 20,
  enquiryMsgMin: 2,
  enquiryMsgMax: 1000,
  maxPrice: 50000000,
  maxPhotos: 10,
  maxImageBytes: 5 * 1024 * 1024,
  maxVideoBytes: 25 * 1024 * 1024,
} as const;

export function formatINR(amount: number): string {
  if (!Number.isFinite(amount) || amount < 0) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

export function formatListingDate(isoDate: string, lang: LanguageCode = 'en'): string {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(lang === 'hi' ? 'hi-IN' : 'en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function normalizeIndianPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (raw.trim().startsWith('+')) return `+${digits}`;
  return digits ? `+${digits}` : '';
}

export function isValidPhoneInput(raw: string): boolean {
  const normalized = normalizeIndianPhone(raw);
  return /^\+\d{10,15}$/.test(normalized);
}

export function validateMediaFile(
  file: { type: string; size: number },
  kind: 'image' | 'video'
): string | null {
  if (kind === 'image') {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      return 'Only JPG, PNG, or WebP images are allowed.';
    }
    if (file.size <= 0 || file.size > BLUEPRINT_LIMITS.maxImageBytes) {
      return 'Each image must be under 5 MB.';
    }
    return null;
  }
  const allowedVideo = ['video/mp4', 'video/webm', 'video/quicktime'];
  if (!allowedVideo.includes(file.type)) {
    return 'Only MP4, WebM, or MOV videos are allowed.';
  }
  if (file.size <= 0 || file.size > BLUEPRINT_LIMITS.maxVideoBytes) {
    return 'Video must be under 25 MB.';
  }
  return null;
}

export interface SellFormValidationInput {
  category: string;
  breed: string;
  age: string;
  gender: string;
  color: string;
  healthStatus: string;
  vaccinationStatus: string;
  description: string;
  price: number | string;
  photosCount: number;
  state: string;
  district: string;
  village: string;
  sellerName: string;
  contactNumber: string;
}

export function validateSellListingInput(input: SellFormValidationInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.category) errors.category = 'Category is required.';
  if (!input.breed || input.breed.trim().length < BLUEPRINT_LIMITS.breedMin) {
    errors.breed = 'Enter a valid breed name (at least 2 characters).';
  }
  if (!input.age || input.age.trim().length < BLUEPRINT_LIMITS.ageMin) {
    errors.age = 'Age is required.';
  }
  if (!input.gender) errors.gender = 'Gender is required.';
  if (!input.color || input.color.trim().length < BLUEPRINT_LIMITS.colorMin) {
    errors.color = 'Color is required.';
  }
  if (!input.healthStatus || input.healthStatus.trim().length < BLUEPRINT_LIMITS.healthMin) {
    errors.healthStatus = 'Health status is required.';
  }
  if (!input.vaccinationStatus || input.vaccinationStatus.trim().length < BLUEPRINT_LIMITS.vaccinationMin) {
    errors.vaccinationStatus = 'Vaccination status is required.';
  }
  if (input.photosCount < 1) {
    errors.photos = 'Upload at least 1 photo of the animal.';
  } else if (input.photosCount > BLUEPRINT_LIMITS.maxPhotos) {
    errors.photos = `Maximum ${BLUEPRINT_LIMITS.maxPhotos} photos allowed.`;
  }
  const numericPrice = Number(input.price);
  if (!Number.isFinite(numericPrice) || numericPrice <= 0 || numericPrice > BLUEPRINT_LIMITS.maxPrice) {
    errors.price = 'Enter a valid selling price in INR.';
  }
  if (!input.state.trim()) errors.state = 'State is required.';
  if (!input.district.trim()) errors.district = 'District is required.';
  if (!input.village.trim()) errors.village = 'Village or city is required.';
  if (!input.description || input.description.trim().length < BLUEPRINT_LIMITS.descriptionMin) {
    errors.description = 'Description must be at least 10 characters.';
  }
  if (!input.sellerName || input.sellerName.trim().length < BLUEPRINT_LIMITS.nameMin) {
    errors.sellerName = 'Seller name is required.';
  }
  if (!isValidPhoneInput(input.contactNumber)) {
    errors.contactNumber = 'Enter a valid 10-digit Indian mobile number.';
  }
  return errors;
}

export function filterAndSortListings(
  listings: AnimalListing[],
  filters: ExploreFilters,
  userLocation?: { state: string; district: string }
): AnimalListing[] {
  const searchLower = filters.search.trim().toLowerCase();
  const breedLower = filters.breed.trim().toLowerCase();
  const ageLower = filters.age.trim().toLowerCase();
  const minP = filters.minPrice ? Number(filters.minPrice) : 0;
  const maxP = filters.maxPrice ? Number(filters.maxPrice) : Number.POSITIVE_INFINITY;

  const filtered = listings.filter((item) => {
    if (item.status !== 'ACTIVE') return false;
    if (filters.category !== 'All' && item.category !== filters.category) return false;
    if (filters.gender !== 'All' && item.gender !== filters.gender) return false;
    if (filters.state && item.state !== filters.state) return false;
    if (filters.district && item.district !== filters.district) return false;
    if (filters.nearbyOnly && userLocation?.state) {
      if (item.state !== userLocation.state) return false;
      if (userLocation.district && item.district !== userLocation.district) {
        // Still allow same state if district matches or broaden to state match when userLocation has state
      }
    }
    if (Number.isFinite(minP) && item.price < minP) return false;
    if (Number.isFinite(maxP) && maxP > 0 && item.price > maxP) return false;
    if (breedLower && !item.breed.toLowerCase().includes(breedLower)) return false;
    if (ageLower && !item.age.toLowerCase().includes(ageLower)) return false;
    if (searchLower) {
      const haystack = `${item.category} ${item.breed} ${item.state} ${item.district} ${item.village} ${item.description} ${item.sellerName}`.toLowerCase();
      if (!haystack.includes(searchLower)) return false;
    }
    return true;
  });

  return [...filtered].sort((a, b) => {
    if (filters.sortBy === 'price_asc') return a.price - b.price;
    if (filters.sortBy === 'price_desc') return b.price - a.price;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
}

export function sanitizeListingPayload(raw: string, maxLen: number): string {
  return raw.trim().slice(0, maxLen);
}
