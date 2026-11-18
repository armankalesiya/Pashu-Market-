import React, { useState } from 'react';
import {
  BadgeCheck,
  Bell,
  Camera,
  ChevronRight,
  Edit3,
  FileText,
  Globe,
  Heart,
  HelpCircle,
  Info,
  ListChecks,
  LogOut,
  MapPin,
  MessageSquare,
  Phone,
  Shield,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  formatReadableFirebaseError,
  getUserProfile,
  updateUserProfile,
  uploadImageSmart,
} from '../services/marketplaceService';
import { INDIAN_STATES_DISTRICTS } from '../utils/constants';
import { validateMediaFile } from '../utils/validation';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { PWAInstallButton } from '../components/ui/PWAInstallButton';

export function ProfilePage() {
  const {
    t,
    lang,
    setLang,
    firebaseUser,
    userProfile,
    setUserProfile,
    isAdmin,
    openAuthModal,
    logout,
    myListings,
    inboxEnquiries,
    navigate,
    globalSettings,
    showToast,
  } = useApp();

  const [editOpen, setEditOpen] = useState(false);
  const [infoModal, setInfoModal] = useState<'privacy' | 'terms' | 'help' | 'about' | null>(null);

  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editState, setEditState] = useState('Gujarat');
  const [editDistrict, setEditDistrict] = useState('Bhavnagar');
  const [editVillage, setEditVillage] = useState('');
  const [editPhoto, setEditPhoto] = useState('');
  const [saving, setSaving] = useState(false);

  if (!firebaseUser) {
    return (
      <div className="max-w-xl mx-auto py-8 space-y-5">
        <EmptyState
          icon={<UserIcon className="w-7 h-7" />}
          title={t.auth.welcomeTitle}
          description={t.auth.welcomeSubtitle}
          actionLabel={t.nav.signIn}
          onAction={openAuthModal}
        />
        <PWAInstallButton variant="card" />
      </div>
    );
  }

  const openEditModal = () => {
    setEditName(userProfile?.name || firebaseUser.displayName || '');
    setEditPhone(userProfile?.phone || firebaseUser.phoneNumber || '');
    setEditEmail(userProfile?.email || firebaseUser.email || '');
    setEditState(userProfile?.state || 'Gujarat');
    setEditDistrict(userProfile?.district || 'Bhavnagar');
    setEditVillage(userProfile?.village || '');
    setEditPhoto(userProfile?.photoURL || firebaseUser.photoURL || '');
    setEditOpen(true);
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateMediaFile(file, 'image');
    if (err) {
      showToast(err, 'error');
      return;
    }
    try {
      const url = await uploadImageSmart(
        file,
        `profiles/${firebaseUser.uid}/avatar_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`,
        undefined,
        110000
      );
      setEditPhoto(url);
      showToast('Profile photo updated.', 'success');
    } catch (uploadErr) {
      showToast(formatReadableFirebaseError(uploadErr), 'error');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editName.trim().length < 2) {
      showToast('Name must be at least 2 characters.', 'error');
      return;
    }
    setSaving(true);
    try {
      await updateUserProfile(firebaseUser.uid, {
        name: editName.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim(),
        state: editState,
        district: editDistrict,
        village: editVillage.trim(),
        photoURL: editPhoto,
      });
      const updated = await getUserProfile(firebaseUser.uid);
      if (updated) setUserProfile(updated);
      setEditOpen(false);
      showToast('Profile updated!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Update failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const activeCount = myListings.filter((l) => l.status === 'ACTIVE').length;
  const soldCount = myListings.filter((l) => l.status === 'SOLD').length;

  const menuRows = [
    { icon: ListChecks, label: t.nav.myListings, onClick: () => navigate('my-listings') },
    { icon: Heart, label: t.nav.favourites, onClick: () => navigate('favourites') },
    { icon: MessageSquare, label: t.nav.enquiries, onClick: () => navigate('enquiries') },
    { icon: Bell, label: t.nav.notifications, onClick: () => navigate('notifications') },
  ];

  const policyRows = [
    { icon: Shield, label: t.profile.privacyPolicy, onClick: () => setInfoModal('privacy') },
    { icon: FileText, label: t.profile.termsConditions, onClick: () => setInfoModal('terms') },
    { icon: HelpCircle, label: t.profile.helpSupport, onClick: () => setInfoModal('help') },
    { icon: Info, label: t.profile.aboutUs, onClick: () => setInfoModal('about') },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header Card */}
      <section className="rounded-[16px] bg-white border border-[#E4E7E1] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#E8F0EB] border border-[#E4E7E1] overflow-hidden flex items-center justify-center text-[#173F35] font-display font-bold text-lg shrink-0">
            {userProfile?.photoURL || firebaseUser.photoURL ? (
              <img
                src={userProfile?.photoURL || firebaseUser.photoURL || ''}
                alt={userProfile?.name || 'User'}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              (userProfile?.name || firebaseUser.displayName || 'PM').slice(0, 2).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl font-bold text-[#26332E] truncate">
                {userProfile?.name || firebaseUser.displayName || 'Member'}
              </h1>
              {userProfile?.verified && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#347A54]">
                  <BadgeCheck className="w-4 h-4" />
                  <span>{t.profile.verifiedBadge}</span>
                </span>
              )}
            </div>
            {(userProfile?.phone || firebaseUser.phoneNumber) && (
              <p className="text-xs text-[#78847D] flex items-center gap-1.5 mt-1">
                <Phone className="w-3.5 h-3.5" />
                <span>{userProfile?.phone || firebaseUser.phoneNumber}</span>
              </p>
            )}
            {userProfile?.state && (
              <p className="text-xs text-[#78847D] flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>
                  {userProfile.village ? `${userProfile.village}, ` : ''}
                  {userProfile.district}, {userProfile.state}
                </span>
              </p>
            )}
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={openEditModal}>
          <Edit3 className="w-4 h-4" />
          <span>{t.profile.editProfile}</span>
        </Button>
      </section>

      {/* Dashboard Stats */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t.profile.totalListings, value: myListings.length },
          { label: t.profile.activeListings, value: activeCount },
          { label: t.profile.soldAnimals, value: soldCount },
          { label: t.profile.enquiriesReceived, value: inboxEnquiries.length },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-[16px] bg-white border border-[#E4E7E1] p-4"
          >
            <div className="text-xs text-[#78847D]">{stat.label}</div>
            <div className="font-display text-2xl font-bold text-[#173F35] mt-1 tabular-nums">
              {stat.value}
            </div>
          </div>
        ))}
      </section>

      {/* Admin Entry */}
      {isAdmin && (
        <button
          type="button"
          onClick={() => navigate('admin')}
          className="w-full rounded-[16px] bg-[#173F35] text-white p-4 flex items-center justify-between hover:bg-[#245747] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-[#D6B875]" />
            <span className="font-display text-sm font-semibold">{t.profile.adminDashboard}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#D6B875]" />
        </button>
      )}

      {/* Primary Menu */}
      <section className="rounded-[16px] bg-white border border-[#E4E7E1] divide-y divide-[#E4E7E1] overflow-hidden">
        {menuRows.map((row) => {
          const Icon = row.icon;
          return (
            <button
              key={row.label}
              type="button"
              onClick={row.onClick}
              className="w-full min-h-[54px] px-5 flex items-center justify-between text-sm font-medium text-[#26332E] hover:bg-[#F7F5EF] transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-[#173F35]" />
                <span>{row.label}</span>
              </span>
              <ChevronRight className="w-4 h-4 text-[#78847D]" />
            </button>
          );
        })}

        {/* Language Toggle */}
        <div className="min-h-[54px] px-5 flex items-center justify-between gap-4">
          <span className="flex items-center gap-3 text-sm font-medium text-[#26332E]">
            <Globe className="w-4 h-4 text-[#173F35]" />
            <span>{t.profile.languageLabel}</span>
          </span>
          <div className="inline-flex rounded-[10px] border border-[#E4E7E1] bg-[#F7F5EF] p-0.5">
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`px-3 py-1 rounded-[8px] text-xs font-semibold cursor-pointer ${
                lang === 'en' ? 'bg-[#173F35] text-white' : 'text-[#78847D]'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLang('hi')}
              className={`px-3 py-1 rounded-[8px] text-xs font-semibold cursor-pointer ${
                lang === 'hi' ? 'bg-[#173F35] text-white' : 'text-[#78847D]'
              }`}
            >
              हिंदी
            </button>
          </div>
        </div>
      </section>

      <PWAInstallButton variant="card" />

      {/* Info & Support */}
      <section className="rounded-[16px] bg-white border border-[#E4E7E1] divide-y divide-[#E4E7E1] overflow-hidden">
        {policyRows.map((row) => {
          const Icon = row.icon;
          return (
            <button
              key={row.label}
              type="button"
              onClick={row.onClick}
              className="w-full min-h-[52px] px-5 flex items-center justify-between text-sm font-medium text-[#26332E] hover:bg-[#F7F5EF] transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-[#78847D]" />
                <span>{row.label}</span>
              </span>
              <ChevronRight className="w-4 h-4 text-[#78847D]" />
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => void logout()}
          className="w-full min-h-[54px] px-5 flex items-center gap-3 text-sm font-semibold text-[#C94D4D] hover:bg-[#C94D4D]/5 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>{t.profile.logout}</span>
        </button>
      </section>

      {/* Edit Profile Modal */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={t.profile.editProfile}
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#E8F0EB] overflow-hidden flex items-center justify-center">
              {editPhoto ? (
                <img src={editPhoto} alt="Avatar" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-5 h-5 text-[#173F35]" />
              )}
            </div>
            <label className="cursor-pointer">
              <span className="px-3 py-2 rounded-[10px] border border-[#E4E7E1] text-xs font-semibold text-[#173F35]">
                Change Photo
              </span>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} className="sr-only" />
            </label>
          </div>

          <Input label={t.auth.fullName} value={editName} onChange={(e) => setEditName(e.target.value)} required />
          <Input label={t.auth.mobileLabel} value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
          <Input label={t.auth.emailOptional} type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label={t.auth.stateLabel}
              value={editState}
              onChange={(e) => {
                const st = e.target.value;
                setEditState(st);
                setEditDistrict((INDIAN_STATES_DISTRICTS[st] || [])[0] || '');
              }}
            >
              {Object.keys(INDIAN_STATES_DISTRICTS).map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </Select>
            <Select label={t.auth.districtLabel} value={editDistrict} onChange={(e) => setEditDistrict(e.target.value)}>
              {(INDIAN_STATES_DISTRICTS[editState] || []).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </div>

          <Input label={t.auth.villageLabel} value={editVillage} onChange={(e) => setEditVillage(e.target.value)} />

          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" loading={saving}>
              {t.profile.saveProfile}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Policy / Info Modals */}
      <Modal
        open={Boolean(infoModal)}
        onClose={() => setInfoModal(null)}
        title={
          infoModal === 'privacy'
            ? t.profile.privacyPolicy
            : infoModal === 'terms'
            ? t.profile.termsConditions
            : infoModal === 'help'
            ? t.profile.helpSupport
            : t.profile.aboutUs
        }
      >
        <div className="text-sm text-[#26332E] space-y-3 leading-relaxed">
          {infoModal === 'privacy' && (
            <p>
              Pashu Market isolates private contact credentials and user records in strict owner-only Firestore collections. We never sell phone numbers or farm addresses to third-party brokers.
            </p>
          )}
          {infoModal === 'terms' && (
            <p>
              All sellers must provide truthful breed, age, vaccination, and health information. Buyers should inspect livestock in person before transferring funds. Misleading listings are removed by platform administrators.
            </p>
          )}
          {infoModal === 'help' && (
            <div className="space-y-2">
              <p>Need assistance with a listing or account verification?</p>
              <p className="font-semibold text-[#173F35]">
                Support Phone: {globalSettings?.supportPhone || '+91 1800-202-7274'}
              </p>
              <p className="font-semibold text-[#173F35]">
                Email: {globalSettings?.supportEmail || 'support@pashumarket.in'}
              </p>
            </div>
          )}
          {infoModal === 'about' && (
            <p>
              PASHU MARKET — India&apos;s Livestock Marketplace connects dairy farmers, breeders, and livestock buyers directly across Gujarat, Haryana, Rajasthan, Uttar Pradesh, Punjab, Maharashtra, and all Indian states.
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
