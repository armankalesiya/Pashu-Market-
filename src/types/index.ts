export type LanguageCode = 'en' | 'hi';

export type AnimalCategory =
  | 'Cow'
  | 'Buffalo'
  | 'Goat'
  | 'Sheep'
  | 'Horse'
  | 'Camel'
  | 'Donkey'
  | 'Poultry'
  | 'Other Livestock';

export type AnimalGender = 'Female' | 'Male' | 'Pair / Group';

export type ListingStatus = 'ACTIVE' | 'SOLD' | 'INACTIVE' | 'HIDDEN';

export type EnquiryStatus = 'OPEN' | 'REPLIED' | 'RESOLVED';

export type ReportStatus = 'OPEN' | 'REVIEWED' | 'DISMISSED' | 'ACTION_TAKEN';

export type NotificationType =
  | 'NEW_ENQUIRY'
  | 'NEW_MESSAGE'
  | 'LISTING_PUBLISHED'
  | 'LISTING_SOLD'
  | 'LISTING_UPDATED'
  | 'ADMIN_ANNOUNCEMENT';

export type AppRoute =
  | 'home'
  | 'explore'
  | 'detail'
  | 'sell'
  | 'my-listings'
  | 'favourites'
  | 'enquiries'
  | 'notifications'
  | 'profile'
  | 'admin';

export interface UserProfile {
  uid: string;
  name: string;
  phone: string;
  email: string;
  state: string;
  district: string;
  village: string;
  photoURL: string;
  verified: boolean;
  suspended: boolean;
  role: 'user' | 'admin';
  language: LanguageCode;
  termsAccepted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SellerSummary {
  uid: string;
  name: string;
  photoURL: string;
  state: string;
  district: string;
  village: string;
  verified: boolean;
  suspended: boolean;
  memberSince: string;
  updatedAt: string;
}

export interface AnimalListing {
  listingId: string;
  sellerId: string;
  sellerName: string;
  sellerPhoto: string;
  sellerVerified: boolean;
  category: AnimalCategory;
  breed: string;
  age: string;
  gender: AnimalGender;
  color: string;
  weight: string;
  milkCapacity: string;
  healthStatus: string;
  vaccinationStatus: string;
  pregnancyStatus: string;
  description: string;
  price: number;
  negotiable: boolean;
  photos: string[];
  videoURL: string;
  state: string;
  district: string;
  village: string;
  locationDescription: string;
  contactNumber: string;
  whatsappEnabled: boolean;
  status: ListingStatus;
  featured: boolean;
  views: number;
  publishedAt: string;
  updatedAt: string;
  isDemo?: boolean;
}

export interface FavouriteItem {
  favouriteId: string;
  userId: string;
  listingId: string;
  createdAt: string;
}

export interface EnquiryItem {
  enquiryId: string;
  listingId: string;
  listingTitle: string;
  listingPhoto: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  sellerId: string;
  sellerName: string;
  message: string;
  reply: string;
  contactRequested: boolean;
  status: EnquiryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  notificationId: string;
  userId: string;
  senderId: string;
  type: NotificationType;
  title: string;
  body: string;
  relatedId: string;
  read: boolean;
  createdAt: string;
}

export interface ReportItem {
  reportId: string;
  listingId: string;
  listingTitle: string;
  reporterId: string;
  reason: string;
  details: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryConfig {
  categoryId: string;
  nameEn: AnimalCategory;
  nameHi: string;
  slug: string;
  order: number;
  active: boolean;
  imageUrl: string;
  updatedAt: string;
}

export interface ReviewItem {
  reviewId: string;
  sellerId: string;
  reviewerId: string;
  reviewerName: string;
  listingId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface AppSettings {
  settingId: string;
  announcementTitle: string;
  announcementBody: string;
  announcementActive: boolean;
  supportPhone: string;
  supportEmail: string;
  updatedAt: string;
}

export interface ExploreFilters {
  search: string;
  category: AnimalCategory | 'All';
  breed: string;
  state: string;
  district: string;
  minPrice: string;
  maxPrice: string;
  age: string;
  gender: AnimalGender | 'All';
  sortBy: 'newest' | 'price_asc' | 'price_desc';
  nearbyOnly: boolean;
}
