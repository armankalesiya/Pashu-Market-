import React, { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  Database,
  EyeOff,
  Megaphone,
  ShieldAlert,
  Star,
  Trash2,
  UserX,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  adminSaveAnnouncement,
  adminSaveCategory,
  adminSeedStarterCatalog,
  adminToggleUserSuspend,
  adminToggleUserVerify,
  adminUpdateListing,
  adminUpdateReportStatus,
  deleteListing,
  fetchAdminDashboardData,
} from '../services/marketplaceService';
import { AnimalCategory, AnimalListing, CategoryConfig, EnquiryItem, ReportItem, UserProfile } from '../types';
import { formatINR } from '../utils/validation';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { LoadingState } from '../components/ui/LoadingState';
import { EmptyState } from '../components/ui/EmptyState';

export function AdminPage() {
  const { t, isAdmin, openListing, refreshListings, globalSettings, showToast } = useApp();
  const [tab, setTab] = useState<'users' | 'listings' | 'reports' | 'categories' | 'announcements'>('users');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [listings, setListings] = useState<AnimalListing[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [enquiries, setEnquiries] = useState<EnquiryItem[]>([]);
  const [categories, setCategories] = useState<CategoryConfig[]>([]);

  const [userSearch, setUserSearch] = useState('');
  const [listingSearch, setListingSearch] = useState('');
  const [seeding, setSeeding] = useState(false);

  // Announcement form
  const [annTitle, setAnnTitle] = useState(globalSettings?.announcementTitle || '');
  const [annBody, setAnnBody] = useState(globalSettings?.announcementBody || '');
  const [annActive, setAnnActive] = useState(globalSettings?.announcementActive || false);
  const [supportPhone, setSupportPhone] = useState(globalSettings?.supportPhone || '+91 1800-202-7274');
  const [supportEmail, setSupportEmail] = useState(globalSettings?.supportEmail || 'support@pashumarket.in');

  // New Category form
  const [newCatEn, setNewCatEn] = useState('');
  const [newCatHi, setNewCatHi] = useState('');

  const loadAdmin = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminDashboardData();
      setUsers(data.users);
      setListings(data.listings);
      setReports(data.reports);
      setEnquiries(data.enquiries);
      setCategories(data.categories);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Admin load failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) void loadAdmin();
  }, [isAdmin]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.state.toLowerCase().includes(q) ||
        u.phone.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    );
  }, [users, userSearch]);

  const filteredListings = useMemo(() => {
    const q = listingSearch.trim().toLowerCase();
    if (!q) return listings;
    return listings.filter(
      (l) =>
        l.breed.toLowerCase().includes(q) ||
        l.category.toLowerCase().includes(q) ||
        l.sellerName.toLowerCase().includes(q) ||
        l.state.toLowerCase().includes(q)
    );
  }, [listings, listingSearch]);

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto py-8">
        <EmptyState
          icon={<ShieldAlert className="w-7 h-7" />}
          title="Restricted Area"
          description={t.admin.accessDenied}
        />
      </div>
    );
  }

  if (loading) return <LoadingState message="Loading admin analytics..." />;

  const newUsersCount = users.filter(
    (u) => Date.now() - new Date(u.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000
  ).length;

  const stats = [
    { label: 'Total Users', value: users.length },
    { label: 'New Users (7d)', value: newUsersCount },
    { label: 'Total Listings', value: listings.length },
    { label: 'Active Listings', value: listings.filter((l) => l.status === 'ACTIVE').length },
    { label: 'Sold Listings', value: listings.filter((l) => l.status === 'SOLD').length },
    { label: 'Open Reports', value: reports.filter((r) => r.status === 'OPEN').length },
    { label: 'Total Enquiries', value: enquiries.length },
  ];

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await adminSeedStarterCatalog();
      await loadAdmin();
      refreshListings();
      showToast('Starter catalog and categories seeded into Firestore!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Seeding failed.', 'error');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#26332E]">
            {t.admin.title}
          </h1>
          <p className="text-sm text-[#78847D] mt-1">{t.admin.subtitle}</p>
        </div>
        <Button variant="secondary" size="sm" loading={seeding} onClick={handleSeed}>
          <Database className="w-4 h-4" />
          <span>{seeding ? t.admin.seeding : t.admin.seedCatalog}</span>
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-[16px] bg-white border border-[#E4E7E1] p-4">
            <div className="text-xs text-[#78847D]">{s.label}</div>
            <div className="font-display text-2xl font-bold text-[#173F35] mt-1 tabular-nums">
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-[12px] bg-white border border-[#E4E7E1] overflow-x-auto">
        {(
          [
            ['users', `Users (${users.length})`],
            ['listings', `Listings (${listings.length})`],
            ['reports', `Reports (${reports.length})`],
            ['categories', `Categories (${categories.length})`],
            ['announcements', 'Announcements'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`min-h-[40px] px-4 rounded-[10px] text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
              tab === id ? 'bg-[#173F35] text-white' : 'text-[#78847D] hover:text-[#26332E]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <div className="space-y-4">
          <Input
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            placeholder="Search users by name, phone, email, or state..."
          />
          <div className="rounded-[16px] bg-white border border-[#E4E7E1] divide-y divide-[#E4E7E1]">
            {filteredUsers.length === 0 ? (
              <div className="p-6 text-sm text-[#78847D]">No users found.</div>
            ) : (
              filteredUsers.map((u) => (
                <div
                  key={u.uid}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display text-sm font-bold text-[#26332E]">
                        {u.name}
                      </span>
                      {u.verified && <BadgeCheck className="w-4 h-4 text-[#347A54]" />}
                      {u.suspended && (
                        <span className="text-xs font-semibold text-[#C94D4D]">Suspended</span>
                      )}
                    </div>
                    <div className="text-xs text-[#78847D] mt-0.5">
                      {u.district}, {u.state} · {u.phone || u.email || u.uid}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant={u.verified ? 'outline' : 'secondary'}
                      size="sm"
                      onClick={async () => {
                        await adminToggleUserVerify(u.uid, !u.verified);
                        await loadAdmin();
                        showToast(u.verified ? 'Verification removed.' : 'Seller verified!', 'success');
                      }}
                    >
                      <BadgeCheck className="w-3.5 h-3.5" />
                      <span>{u.verified ? 'Unverify' : 'Verify Seller'}</span>
                    </Button>
                    <Button
                      variant={u.suspended ? 'outline' : 'danger'}
                      size="sm"
                      onClick={async () => {
                        await adminToggleUserSuspend(u.uid, !u.suspended);
                        await loadAdmin();
                        showToast(u.suspended ? 'User unsuspended.' : 'User suspended.', 'info');
                      }}
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>{u.suspended ? 'Unsuspend' : 'Suspend'}</span>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === 'listings' && (
        <div className="space-y-4">
          <Input
            value={listingSearch}
            onChange={(e) => setListingSearch(e.target.value)}
            placeholder="Search listings by breed, category, seller, or state..."
          />
          <div className="rounded-[16px] bg-white border border-[#E4E7E1] divide-y divide-[#E4E7E1]">
            {filteredListings.map((l) => (
              <div
                key={l.listingId}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {l.photos[0] && (
                    <img
                      src={l.photos[0]}
                      alt={l.breed}
                      referrerPolicy="no-referrer"
                      className="w-14 h-12 rounded-[10px] object-cover shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => openListing(l.listingId)}
                      className="font-display text-sm font-bold text-[#173F35] hover:underline truncate block cursor-pointer"
                    >
                      {l.breed} {l.category} · {formatINR(l.price)}
                    </button>
                    <div className="text-xs text-[#78847D]">
                      Seller: {l.sellerName} · Status: {l.status} {l.featured ? '· Featured' : ''}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Button
                    variant={l.featured ? 'gold' : 'outline'}
                    size="sm"
                    onClick={async () => {
                      await adminUpdateListing(l.listingId, { featured: !l.featured });
                      await loadAdmin();
                      refreshListings();
                    }}
                  >
                    <Star className="w-3.5 h-3.5" />
                    <span>{l.featured ? 'Unfeature' : 'Feature'}</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const nextStatus = l.status === 'HIDDEN' ? 'ACTIVE' : 'HIDDEN';
                      await adminUpdateListing(l.listingId, { status: nextStatus });
                      await loadAdmin();
                      refreshListings();
                    }}
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>{l.status === 'HIDDEN' ? 'Unhide' : 'Hide'}</span>
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={async () => {
                      await deleteListing(l.listingId);
                      await loadAdmin();
                      refreshListings();
                      showToast('Listing deleted.', 'info');
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'reports' && (
        <div className="rounded-[16px] bg-white border border-[#E4E7E1] divide-y divide-[#E4E7E1]">
          {reports.length === 0 ? (
            <div className="p-6 text-sm text-[#78847D]">No listing reports submitted.</div>
          ) : (
            reports.map((r) => (
              <div key={r.reportId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <button
                    type="button"
                    onClick={() => openListing(r.listingId)}
                    className="font-display text-sm font-bold text-[#173F35] hover:underline cursor-pointer"
                  >
                    {r.listingTitle}
                  </button>
                  <div className="text-xs text-[#C94D4D] font-semibold mt-0.5">
                    {r.reason} · {r.status}
                  </div>
                  {r.details && <p className="text-xs text-[#78847D] mt-1">{r.details}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      await adminUpdateReportStatus(r.reportId, 'DISMISSED');
                      await loadAdmin();
                    }}
                  >
                    Dismiss
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={async () => {
                      await adminUpdateReportStatus(r.reportId, 'ACTION_TAKEN');
                      await adminUpdateListing(r.listingId, { status: 'HIDDEN' });
                      await loadAdmin();
                      refreshListings();
                    }}
                  >
                    Hide Listing
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'categories' && (
        <div className="space-y-4">
          <div className="rounded-[16px] bg-white border border-[#E4E7E1] p-5 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <Input
              label="Category Name (English)"
              value={newCatEn}
              onChange={(e) => setNewCatEn(e.target.value)}
              placeholder="e.g. Cow"
            />
            <Input
              label="Category Name (Hindi)"
              value={newCatHi}
              onChange={(e) => setNewCatHi(e.target.value)}
              placeholder="e.g. गाय"
            />
            <Button
              variant="primary"
              onClick={async () => {
                if (!newCatEn.trim() || !newCatHi.trim()) return;
                const slug = newCatEn.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
                await adminSaveCategory({
                  categoryId: slug,
                  nameEn: newCatEn.trim() as AnimalCategory,
                  nameHi: newCatHi.trim(),
                  slug,
                  order: categories.length + 1,
                  active: true,
                  imageUrl: '',
                });
                setNewCatEn('');
                setNewCatHi('');
                await loadAdmin();
                refreshListings();
              }}
            >
              Save Category
            </Button>
          </div>
          <div className="rounded-[16px] bg-white border border-[#E4E7E1] divide-y divide-[#E4E7E1]">
            {categories.map((cat) => (
              <div key={cat.categoryId} className="p-4 flex items-center justify-between">
                <div>
                  <span className="font-display text-sm font-bold text-[#26332E]">
                    {cat.nameEn} / {cat.nameHi}
                  </span>
                  <span className="text-xs text-[#78847D] ml-2">
                    ({cat.active ? 'Active' : 'Inactive'})
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await adminSaveCategory({ ...cat, active: !cat.active });
                    await loadAdmin();
                    refreshListings();
                  }}
                >
                  {cat.active ? 'Disable' : 'Enable'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'announcements' && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await adminSaveAnnouncement({
              announcementTitle: annTitle.trim(),
              announcementBody: annBody.trim(),
              announcementActive: annActive,
              supportPhone: supportPhone.trim(),
              supportEmail: supportEmail.trim(),
            });
            refreshListings();
            showToast('Platform settings & announcement saved.', 'success');
          }}
          className="rounded-[16px] bg-white border border-[#E4E7E1] p-6 space-y-4 max-w-2xl"
        >
          <div className="flex items-center gap-2 font-display text-base font-bold text-[#173F35]">
            <Megaphone className="w-5 h-5" />
            <span>Global Announcement & Support Settings</span>
          </div>
          <Input
            label="Announcement Title"
            value={annTitle}
            onChange={(e) => setAnnTitle(e.target.value)}
            placeholder="e.g. Monsoon Vaccination Drive"
          />
          <Input
            label="Announcement Message"
            value={annBody}
            onChange={(e) => setAnnBody(e.target.value)}
            placeholder="Ensure FMD vaccination records are updated on dairy listings."
          />
          <label className="flex items-center gap-2 text-sm text-[#26332E] cursor-pointer">
            <input
              type="checkbox"
              checked={annActive}
              onChange={(e) => setAnnActive(e.target.checked)}
              className="h-4 w-4 accent-[#173F35]"
            />
            <span>Display announcement banner across marketplace</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Support Phone" value={supportPhone} onChange={(e) => setSupportPhone(e.target.value)} />
            <Input label="Support Email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} />
          </div>
          <Button type="submit" variant="primary">
            Publish Settings
          </Button>
        </form>
      )}
    </div>
  );
}
