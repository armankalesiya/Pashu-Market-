import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '../firebase/config';
import {
  checkIsAdminUser,
  fetchCategories,
  fetchGlobalSettings,
  fetchPublicSellers,
  getListingById,
  getUserProfile,
  markNotificationRead,
  subscribeActiveListings,
  subscribeFavourites,
  subscribeNotifications,
  subscribeSellerListings,
  subscribeUserEnquiries,
  toggleFavouriteListing,
  updateUserProfile,
} from '../services/marketplaceService';
import {
  AnimalListing,
  AppRoute,
  AppSettings,
  CategoryConfig,
  EnquiryItem,
  ExploreFilters,
  FavouriteItem,
  LanguageCode,
  NotificationItem,
  SellerSummary,
  UserProfile,
} from '../types';
import { DEFAULT_CATEGORIES, STARTER_LISTINGS, STARTER_SELLERS } from '../utils/constants';
import { getTranslations } from '../utils/i18n';

interface AppContextValue {
  route: AppRoute;
  selectedListingId: string | null;
  editingListing: AnimalListing | null;
  showSplash: boolean;
  dismissSplash: () => void;
  navigate: (nextRoute: AppRoute, options?: { listingId?: string; editListing?: AnimalListing | null }) => void;
  openListing: (listingId: string) => void;
  lang: LanguageCode;
  setLang: (next: LanguageCode) => void;
  t: ReturnType<typeof getTranslations>;
  authReady: boolean;
  firebaseUser: User | null;
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile | null) => void;
  isAdmin: boolean;
  needsRegistration: boolean;
  setNeedsRegistration: (val: boolean) => void;
  authModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  logout: () => Promise<void>;
  activeListings: AnimalListing[];
  liveListings: AnimalListing[];
  hasLiveListings: boolean;
  listingsLoading: boolean;
  listingsError: string | null;
  refreshListings: () => void;
  addOptimisticListing: (listing: AnimalListing) => void;
  myListings: AnimalListing[];
  categories: CategoryConfig[];
  sellers: SellerSummary[];
  globalSettings: AppSettings | null;
  favourites: FavouriteItem[];
  isListingSaved: (listingId: string) => boolean;
  toggleSaveListing: (listing: AnimalListing) => Promise<void>;
  inboxEnquiries: EnquiryItem[];
  sentEnquiries: EnquiryItem[];
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  markAllNotificationsRead: () => Promise<void>;
  selectedLocation: { state: string; district: string };
  setSelectedLocation: (loc: { state: string; district: string }) => void;
  locationModalOpen: boolean;
  openLocationModal: () => void;
  closeLocationModal: () => void;
  exploreFilters: ExploreFilters;
  setExploreFilters: React.Dispatch<React.SetStateAction<ExploreFilters>>;
  searchHistory: string[];
  addSearchHistory: (term: string) => void;
  clearSearchHistory: () => void;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const DEFAULT_FILTERS: ExploreFilters = {
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
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') return false;
    }
    return true;
  });

  const [route, setRoute] = useState<AppRoute>('home');
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [editingListing, setEditingListing] = useState<AnimalListing | null>(null);
  const [lang, setLangState] = useState<LanguageCode>(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('pm_lang') : null;
    return saved === 'hi' ? 'hi' : 'en';
  });

  const [authReady, setAuthReady] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const [liveListings, setLiveListings] = useState<AnimalListing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [listingsError, setListingsError] = useState<string | null>(null);
  const [myListings, setMyListings] = useState<AnimalListing[]>([]);
  const [categories, setCategories] = useState<CategoryConfig[]>(DEFAULT_CATEGORIES);
  const [sellers, setSellers] = useState<SellerSummary[]>(STARTER_SELLERS);
  const [globalSettings, setGlobalSettings] = useState<AppSettings | null>(null);
  const [favourites, setFavourites] = useState<FavouriteItem[]>([]);
  const [demoFavouriteIds, setDemoFavouriteIds] = useState<string[]>([]);
  const [inboxEnquiries, setInboxEnquiries] = useState<EnquiryItem[]>([]);
  const [sentEnquiries, setSentEnquiries] = useState<EnquiryItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const [selectedLocation, setSelectedLocation] = useState<{ state: string; district: string }>({
    state: '',
    district: '',
  });
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [exploreFilters, setExploreFilters] = useState<ExploreFilters>(DEFAULT_FILTERS);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      const raw = window.localStorage.getItem('pm_search_history');
      return raw ? JSON.parse(raw) : ['Gir Cow', 'Murrah Buffalo', 'Rajasthan'];
    } catch {
      return [];
    }
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3800);
  }, []);

  const dismissSplash = useCallback(() => setShowSplash(false), []);

  useEffect(() => {
    if (!showSplash) return;
    const timer = setTimeout(() => setShowSplash(false), 1400);
    return () => clearTimeout(timer);
  }, [showSplash]);

  const setLang = useCallback(
    (next: LanguageCode) => {
      setLangState(next);
      try {
        window.localStorage.setItem('pm_lang', next);
      } catch {
        // Ignore storage errors
      }
      if (firebaseUser && userProfile) {
        void updateUserProfile(firebaseUser.uid, { language: next }).catch(() => {});
      }
    },
    [firebaseUser, userProfile]
  );

  const navigate = useCallback(
    (nextRoute: AppRoute, options?: { listingId?: string; editListing?: AnimalListing | null }) => {
      if (options?.listingId !== undefined) setSelectedListingId(options.listingId);
      if (options?.editListing !== undefined) {
        setEditingListing(options.editListing);
      } else {
        setEditingListing(null);
      }
      setRoute(nextRoute);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    []
  );

  const openListing = useCallback(
    (listingId: string) => {
      setSelectedListingId(listingId);
      setRoute('detail');
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    []
  );

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (!user) {
        setUserProfile(null);
        setIsAdmin(false);
        setNeedsRegistration(false);
        setMyListings([]);
        setFavourites([]);
        setInboxEnquiries([]);
        setSentEnquiries([]);
        setNotifications([]);
        setAuthReady(true);
        return;
      }

      try {
        const [profile, adminFlag] = await Promise.all([
          getUserProfile(user.uid),
          checkIsAdminUser(user.uid, user.email, user.emailVerified),
        ]);
        setIsAdmin(adminFlag);
        if (profile) {
          setUserProfile(profile);
          setNeedsRegistration(false);
          if (profile.language) setLangState(profile.language);
          if (!selectedLocation.state && profile.state) {
            setSelectedLocation({ state: profile.state, district: profile.district });
          }
        } else {
          setUserProfile(null);
          setNeedsRegistration(true);
          setAuthModalOpen(true);
        }
      } catch (err) {
        console.error('Auth profile load error:', err);
      } finally {
        setAuthReady(true);
      }
    });
    return () => unsub();
  }, [selectedLocation.state]);

  useEffect(() => {
    setListingsLoading(true);
    setListingsError(null);
    const unsub = subscribeActiveListings(
      (items) => {
        setLiveListings(items);
        setListingsLoading(false);
      },
      (err) => {
        setListingsError(err.message);
        setListingsLoading(false);
      }
    );
    return () => unsub();
  }, [refreshTick]);

  useEffect(() => {
    void fetchCategories().then(setCategories);
    void fetchPublicSellers().then(setSellers);
    void fetchGlobalSettings().then(setGlobalSettings);
  }, [refreshTick]);

  useEffect(() => {
    if (!authReady || !firebaseUser) return;
    const unsubMy = subscribeSellerListings(firebaseUser.uid, setMyListings);
    const unsubFav = subscribeFavourites(firebaseUser.uid, setFavourites);
    const unsubInbox = subscribeUserEnquiries(firebaseUser.uid, 'seller', setInboxEnquiries);
    const unsubSent = subscribeUserEnquiries(firebaseUser.uid, 'buyer', setSentEnquiries);
    const unsubNotif = subscribeNotifications(firebaseUser.uid, setNotifications);
    return () => {
      unsubMy();
      unsubFav();
      unsubInbox();
      unsubSent();
      unsubNotif();
    };
  }, [authReady, firebaseUser]);

  const activeListings = useMemo(() => {
    if (liveListings.length === 0) return STARTER_LISTINGS;
    const liveIds = new Set(liveListings.map((l) => l.listingId));
    const remainingStarter = STARTER_LISTINGS.filter((s) => !liveIds.has(s.listingId));
    return [...liveListings, ...remainingStarter];
  }, [liveListings]);

  const isListingSaved = useCallback(
    (listingId: string) => {
      if (favourites.some((f) => f.listingId === listingId)) return true;
      return demoFavouriteIds.includes(listingId);
    },
    [favourites, demoFavouriteIds]
  );

  const toggleSaveListing = useCallback(
    async (listing: AnimalListing) => {
      if (!firebaseUser) {
        setAuthModalOpen(true);
        showToast('Please sign in to save favourites.', 'info');
        return;
      }
      if (listing.isDemo) {
        const existsInFirestore = await getListingById(listing.listingId).catch(() => null);
        if (!existsInFirestore) {
          setDemoFavouriteIds((prev) =>
            prev.includes(listing.listingId)
              ? prev.filter((id) => id !== listing.listingId)
              : [...prev, listing.listingId]
          );
          showToast(
            demoFavouriteIds.includes(listing.listingId)
              ? 'Removed from saved list'
              : 'Saved to favourites',
            'success'
          );
          return;
        }
      }

      const saved = favourites.some((f) => f.listingId === listing.listingId);
      await toggleFavouriteListing(firebaseUser.uid, listing.listingId, saved);
      showToast(saved ? 'Removed from favourites' : 'Saved to favourites', 'success');
    },
    [firebaseUser, favourites, demoFavouriteIds, showToast]
  );

  const unreadNotificationCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const markAllNotificationsRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.read);
    await Promise.all(unread.map((n) => markNotificationRead(n.notificationId)));
  }, [notifications]);

  const addSearchHistory = useCallback((term: string) => {
    const clean = term.trim();
    if (!clean) return;
    setSearchHistory((prev) => {
      const next = [clean, ...prev.filter((item) => item.toLowerCase() !== clean.toLowerCase())].slice(0, 6);
      try {
        window.localStorage.setItem('pm_search_history', JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
  }, []);

  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
    try {
      window.localStorage.removeItem('pm_search_history');
    } catch {
      // Ignore
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    setUserProfile(null);
    setIsAdmin(false);
    setNeedsRegistration(false);
    setRoute('home');
    showToast('Signed out successfully.', 'info');
  }, [showToast]);

  const t = useMemo(() => getTranslations(lang), [lang]);

  const value: AppContextValue = {
    route,
    selectedListingId,
    editingListing,
    showSplash,
    dismissSplash,
    navigate,
    openListing,
    lang,
    setLang,
    t,
    authReady,
    firebaseUser,
    userProfile,
    setUserProfile,
    isAdmin,
    needsRegistration,
    setNeedsRegistration,
    authModalOpen,
    openAuthModal: () => setAuthModalOpen(true),
    closeAuthModal: () => setAuthModalOpen(false),
    logout,
    activeListings,
    liveListings,
    hasLiveListings: liveListings.length > 0,
    listingsLoading,
    listingsError,
    refreshListings: () => setRefreshTick((v) => v + 1),
    addOptimisticListing: (listing: AnimalListing) => {
      setLiveListings((prev) => [
        listing,
        ...prev.filter((item) => item.listingId !== listing.listingId),
      ]);
      setMyListings((prev) => [
        listing,
        ...prev.filter((item) => item.listingId !== listing.listingId),
      ]);
    },
    myListings,
    categories,
    sellers,
    globalSettings,
    favourites: [
      ...favourites,
      ...demoFavouriteIds
        .filter((id) => !favourites.some((f) => f.listingId === id))
        .map((id) => ({
          favouriteId: `demo_${id}`,
          userId: firebaseUser?.uid || 'guest',
          listingId: id,
          createdAt: new Date().toISOString(),
        })),
    ],
    isListingSaved,
    toggleSaveListing,
    inboxEnquiries,
    sentEnquiries,
    notifications,
    unreadNotificationCount,
    markAllNotificationsRead,
    selectedLocation,
    setSelectedLocation,
    locationModalOpen,
    openLocationModal: () => setLocationModalOpen(true),
    closeLocationModal: () => setLocationModalOpen(false),
    exploreFilters,
    setExploreFilters,
    searchHistory,
    addSearchHistory,
    clearSearchHistory,
    toast,
    showToast,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
