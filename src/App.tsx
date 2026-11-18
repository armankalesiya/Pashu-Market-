import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { SplashScreen } from './components/ui/SplashScreen';
import { OfflineIndicator } from './components/ui/OfflineIndicator';
import { AppHeader } from './navigation/AppHeader';
import { BottomNavigation } from './navigation/BottomNavigation';
import { AuthModal } from './pages/AuthModal';
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { AnimalDetailPage } from './pages/AnimalDetailPage';
import { SellPage } from './pages/SellPage';
import { MyListingsPage } from './pages/MyListingsPage';
import { FavouritesPage } from './pages/FavouritesPage';
import { EnquiriesPage } from './pages/EnquiriesPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';

function AppContent() {
  const { route, showSplash, dismissSplash, toast, navigate, t } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F5EF] text-[#26332E]">
      {showSplash && <SplashScreen onContinue={dismissSplash} />}

      <AppHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6 pb-20 lg:pb-10">
        {route === 'home' && <HomePage />}
        {route === 'explore' && <ExplorePage />}
        {route === 'detail' && <AnimalDetailPage />}
        {route === 'sell' && <SellPage />}
        {route === 'my-listings' && <MyListingsPage />}
        {route === 'favourites' && <FavouritesPage />}
        {route === 'enquiries' && <EnquiriesPage />}
        {route === 'notifications' && <NotificationsPage />}
        {route === 'profile' && <ProfilePage />}
        {route === 'admin' && <AdminPage />}
      </main>

      <footer className="hidden lg:block border-t border-[#E4E7E1] bg-white">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between text-xs text-[#78847D]">
          <span>
            © {new Date().getFullYear()} {t.brandName} · {t.tagline}
          </span>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => navigate('explore')}
              className="hover:text-[#173F35] cursor-pointer"
            >
              {t.nav.explore}
            </button>
            <button
              type="button"
              onClick={() => navigate('sell')}
              className="hover:text-[#173F35] cursor-pointer"
            >
              {t.nav.sell}
            </button>
            <button
              type="button"
              onClick={() => navigate('profile')}
              className="hover:text-[#173F35] cursor-pointer"
            >
              {t.nav.profile}
            </button>
          </div>
        </div>
      </footer>

      <BottomNavigation />
      <AuthModal />
      <OfflineIndicator />

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 max-w-sm rounded-[12px] px-4 py-3 text-sm font-medium shadow-lg border ${
            toast.type === 'error'
              ? 'bg-[#C94D4D] text-white border-[#C94D4D]'
              : toast.type === 'success'
              ? 'bg-[#173F35] text-white border-[#D6B875]'
              : 'bg-white text-[#26332E] border-[#E4E7E1]'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}
