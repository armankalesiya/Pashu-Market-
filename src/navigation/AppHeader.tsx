import React, { useEffect, useState } from 'react';
import { Bell, MapPin, ShieldCheck, User as UserIcon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Logo } from '../components/ui/Logo';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { PWAInstallButton } from '../components/ui/PWAInstallButton';
import { INDIAN_STATES_DISTRICTS } from '../utils/constants';

export function AppHeader() {
  const {
    route,
    navigate,
    t,
    lang,
    setLang,
    firebaseUser,
    userProfile,
    isAdmin,
    openAuthModal,
    unreadNotificationCount,
    selectedLocation,
    setSelectedLocation,
    locationModalOpen,
    openLocationModal,
    closeLocationModal,
  } = useApp();

  const [draftState, setDraftState] = useState(selectedLocation.state);
  const [draftDistrict, setDraftDistrict] = useState(selectedLocation.district);

  useEffect(() => {
    if (locationModalOpen) {
      setDraftState(selectedLocation.state);
      setDraftDistrict(selectedLocation.district);
    }
  }, [locationModalOpen, selectedLocation.state, selectedLocation.district]);

  const locationLabel = selectedLocation.district
    ? `${selectedLocation.district}, ${selectedLocation.state}`
    : selectedLocation.state || t.common.allIndia;

  const navItems = [
    { id: 'home' as const, label: t.nav.home },
    { id: 'explore' as const, label: t.nav.explore },
    { id: 'sell' as const, label: t.nav.sell },
    { id: 'enquiries' as const, label: t.nav.enquiries },
    { id: 'favourites' as const, label: t.nav.favourites },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E4E7E1]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-8">
          <button
            type="button"
            onClick={() => navigate('home')}
            className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#173F35] rounded-[12px] cursor-pointer shrink-0"
            aria-label="PASHU MARKET Home"
          >
            <Logo variant="dark" size="sm" />
          </button>

          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium" aria-label="Primary navigation">
            {navItems.map((item) => {
              const active = route === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.id)}
                  className={`py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    active
                      ? 'text-[#173F35] font-semibold underline underline-offset-8 decoration-2 decoration-[#173F35]'
                      : 'text-[#78847D] hover:text-[#173F35]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
            {isAdmin && (
              <button
                type="button"
                onClick={() => navigate('admin')}
                className={`inline-flex items-center gap-1 py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  route === 'admin'
                    ? 'text-[#173F35] font-semibold underline underline-offset-8 decoration-2'
                    : 'text-[#245747] hover:text-[#173F35]'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-[#D6B875]" />
                <span>{t.nav.admin}</span>
              </button>
            )}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <PWAInstallButton variant="header" className="hidden xl:inline-flex" />
            <button
              type="button"
              onClick={openLocationModal}
              aria-label="Change location"
              className="hidden sm:inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-[12px] bg-[#F7F5EF] border border-[#E4E7E1] text-xs font-medium text-[#26332E] hover:border-[#173F35] max-w-[170px] cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-[#173F35] shrink-0" />
              <span className="truncate">{locationLabel}</span>
            </button>

            <button
              type="button"
              onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
              aria-label={lang === 'en' ? 'Switch language to Hindi' : 'Switch language to English'}
              className="min-h-[40px] px-2.5 rounded-[12px] border border-[#E4E7E1] text-xs font-semibold text-[#173F35] hover:bg-[#E8F0EB] whitespace-nowrap shrink-0 cursor-pointer"
            >
              {lang === 'en' ? 'हिंदी' : 'EN'}
            </button>

            <button
              type="button"
              onClick={() => navigate('notifications')}
              aria-label={t.nav.notifications}
              className="relative min-h-[40px] min-w-[40px] rounded-[12px] border border-[#E4E7E1] flex items-center justify-center text-[#26332E] hover:border-[#173F35] hover:text-[#173F35] cursor-pointer shrink-0"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#173F35] text-[#D6B875] text-[10px] font-bold flex items-center justify-center tabular-nums">
                  {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                </span>
              )}
            </button>

            {firebaseUser ? (
              <button
                type="button"
                onClick={() => navigate('profile')}
                aria-label={t.nav.profile}
                className="inline-flex items-center gap-2 min-h-[40px] px-2.5 sm:px-3 rounded-[12px] bg-[#173F35] text-white text-xs font-semibold hover:bg-[#245747] whitespace-nowrap shrink-0 cursor-pointer"
              >
                <UserIcon className="w-4 h-4 text-[#D6B875]" />
                <span className="hidden sm:inline max-w-[110px] truncate">
                  {userProfile?.name || t.nav.profile}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={openAuthModal}
                className="min-h-[40px] px-3 sm:px-4 rounded-[12px] bg-[#173F35] text-white text-xs font-semibold hover:bg-[#245747] whitespace-nowrap shrink-0 cursor-pointer"
              >
                {t.nav.signIn}
              </button>
            )}
          </div>
        </div>
      </header>

      <Modal
        open={locationModalOpen}
        onClose={closeLocationModal}
        title={t.common.locationLabel}
        subtitle="Filter nearby livestock by Indian State and District"
      >
        <div className="space-y-4">
          <Select
            label={t.explore.state}
            value={draftState}
            onChange={(e) => {
              setDraftState(e.target.value);
              setDraftDistrict('');
            }}
          >
            <option value="">{t.common.allIndia}</option>
            {Object.keys(INDIAN_STATES_DISTRICTS).map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </Select>

          {draftState && (
            <Select
              label={t.explore.district}
              value={draftDistrict}
              onChange={(e) => setDraftDistrict(e.target.value)}
            >
              <option value="">{t.explore.allDistricts}</option>
              {(INDIAN_STATES_DISTRICTS[draftState] || []).map((dist) => (
                <option key={dist} value={dist}>
                  {dist}
                </option>
              ))}
            </Select>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedLocation({ state: '', district: '' });
                closeLocationModal();
              }}
            >
              {t.common.allIndia}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setSelectedLocation({ state: draftState, district: draftDistrict });
                closeLocationModal();
              }}
            >
              {t.common.save}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
