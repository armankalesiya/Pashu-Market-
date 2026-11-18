import React, { useMemo, useState } from 'react';
import { CheckCircle2, Edit3, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { deleteListing, updateOwnerListing } from '../services/marketplaceService';
import { AnimalListing } from '../types';
import { formatINR } from '../utils/validation';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';

export function MyListingsPage() {
  const {
    t,
    firebaseUser,
    openAuthModal,
    myListings,
    navigate,
    openListing,
    showToast,
  } = useApp();

  const [tab, setTab] = useState<'ALL' | 'ACTIVE' | 'SOLD' | 'INACTIVE'>('ALL');
  const [deleteTarget, setDeleteTarget] = useState<AnimalListing | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (tab === 'ALL') return myListings;
    return myListings.filter((item) => item.status === tab);
  }, [myListings, tab]);

  if (!firebaseUser) {
    return (
      <div className="max-w-xl mx-auto py-8">
        <EmptyState
          title={t.sell.signInRequiredTitle}
          description="Sign in to view and manage your animal listings."
          actionLabel={t.nav.signIn}
          onAction={openAuthModal}
        />
      </div>
    );
  }

  const handleStatusChange = async (
    listing: AnimalListing,
    nextStatus: 'ACTIVE' | 'SOLD' | 'INACTIVE'
  ) => {
    setBusyId(listing.listingId);
    try {
      await updateOwnerListing(listing.listingId, { status: nextStatus });
      showToast(`Listing marked as ${nextStatus}.`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Status update failed.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.listingId);
    try {
      await deleteListing(deleteTarget.listingId);
      setDeleteTarget(null);
      showToast('Listing deleted.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const tabs = [
    { id: 'ALL' as const, label: `${t.myListings.tabAll} (${myListings.length})` },
    {
      id: 'ACTIVE' as const,
      label: `${t.myListings.tabActive} (${myListings.filter((l) => l.status === 'ACTIVE').length})`,
    },
    {
      id: 'SOLD' as const,
      label: `${t.myListings.tabSold} (${myListings.filter((l) => l.status === 'SOLD').length})`,
    },
    {
      id: 'INACTIVE' as const,
      label: `${t.myListings.tabInactive} (${myListings.filter((l) => l.status === 'INACTIVE').length})`,
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#26332E]">
            {t.myListings.title}
          </h1>
          <p className="text-sm text-[#78847D] mt-1">{t.myListings.subtitle}</p>
        </div>
        <Button variant="primary" onClick={() => navigate('sell')}>
          <Plus className="w-4 h-4" />
          <span>{t.myListings.postNew}</span>
        </Button>
      </div>

      <div className="flex items-center gap-1 p-1 rounded-[12px] bg-white border border-[#E4E7E1] overflow-x-auto">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`min-h-[40px] px-4 rounded-[10px] text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              tab === item.id
                ? 'bg-[#173F35] text-white'
                : 'text-[#78847D] hover:text-[#26332E]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={t.myListings.emptyTitle}
          description={t.myListings.emptyDesc}
          actionLabel={t.myListings.postNew}
          onAction={() => navigate('sell')}
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => {
            const busy = busyId === item.listingId;
            return (
              <div
                key={item.listingId}
                className="rounded-[16px] bg-white border border-[#E4E7E1] p-4 flex flex-col sm:flex-row gap-4 justify-between"
              >
                <div className="flex gap-4 min-w-0">
                  <button
                    type="button"
                    onClick={() => openListing(item.listingId)}
                    className="w-28 h-24 rounded-[12px] overflow-hidden bg-[#E8F0EB] shrink-0 cursor-pointer"
                  >
                    {item.photos[0] && (
                      <img
                        src={item.photos[0]}
                        alt={item.breed}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </button>
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                      <span
                        className={
                          item.status === 'ACTIVE'
                            ? 'px-2 py-0.5 rounded-[6px] bg-[#347A54] text-white'
                            : 'text-[#245747]'
                        }
                      >
                        {item.status === 'ACTIVE' ? t.sell.livePublicBadge : item.status}
                      </span>
                      <span className="text-[#78847D]">
                        · {item.views || 0} {t.myListings.views}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => openListing(item.listingId)}
                      className="font-display text-base font-bold text-[#26332E] hover:text-[#173F35] text-left truncate block cursor-pointer"
                    >
                      {item.breed} {item.category}
                    </button>
                    <div className="font-display text-lg font-bold text-[#173F35] tabular-nums">
                      {formatINR(item.price)}
                    </div>
                    <p className="text-xs text-[#78847D] truncate">
                      {item.village}, {item.district}, {item.state}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {item.status !== 'SOLD' && item.status !== 'HIDDEN' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() => navigate('sell', { editListing: item })}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{t.myListings.edit}</span>
                      </Button>

                      <Button
                        variant="gold"
                        size="sm"
                        disabled={busy}
                        onClick={() => void handleStatusChange(item, 'SOLD')}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{t.myListings.markSold}</span>
                      </Button>

                      {item.status === 'ACTIVE' ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={busy}
                          onClick={() => void handleStatusChange(item, 'INACTIVE')}
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>{t.myListings.deactivate}</span>
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={busy}
                          onClick={() => void handleStatusChange(item, 'ACTIVE')}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{t.myListings.reactivate}</span>
                        </Button>
                      )}
                    </>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy}
                    className="!text-[#C94D4D]"
                    onClick={() => setDeleteTarget(item)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t.myListings.delete}</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={t.myListings.delete}
      >
        <div className="space-y-4">
          <p className="text-sm text-[#26332E]">{t.myListings.confirmDelete}</p>
          <div className="flex justify-end gap-2.5">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              {t.common.cancel}
            </Button>
            <Button variant="danger" loading={Boolean(busyId)} onClick={handleConfirmDelete}>
              {t.myListings.delete}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
