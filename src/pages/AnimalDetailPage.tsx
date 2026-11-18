import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  Flag,
  Heart,
  MapPin,
  Maximize2,
  MessageCircle,
  MessageSquare,
  Phone,
  Star,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  fetchSellerReviews,
  getListingById,
  incrementListingViews,
  sendEnquiry,
  submitListingReport,
} from '../services/marketplaceService';
import { AnimalListing, ReviewItem } from '../types';
import { formatINR, formatListingDate } from '../utils/validation';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input, Select, Textarea } from '../components/ui/Input';
import { AnimalCard } from '../components/ui/AnimalCard';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';

export function AnimalDetailPage() {
  const {
    selectedListingId,
    activeListings,
    myListings,
    navigate,
    openListing,
    t,
    lang,
    firebaseUser,
    userProfile,
    openAuthModal,
    isListingSaved,
    toggleSaveListing,
    sellers,
    showToast,
  } = useApp();

  const [listing, setListing] = useState<AnimalListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);

  // Enquiry modal
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [enquiryMsg, setEnquiryMsg] = useState('');
  const [shareContact, setShareContact] = useState(true);
  const [sendingEnquiry, setSendingEnquiry] = useState(false);

  // Report modal
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Misleading Information');
  const [reportDetails, setReportDetails] = useState('');
  const [sendingReport, setSendingReport] = useState(false);

  useEffect(() => {
    if (!selectedListingId) return;
    setActivePhotoIndex(0);
    const localFound =
      activeListings.find((a) => a.listingId === selectedListingId) ||
      myListings.find((a) => a.listingId === selectedListingId);

    if (localFound) {
      setListing(localFound);
      setLoading(false);
      void incrementListingViews(localFound);
      void fetchSellerReviews(localFound.sellerId).then(setReviews);
      return;
    }

    setLoading(true);
    void getListingById(selectedListingId)
      .then((fetched) => {
        setListing(fetched);
        if (fetched) {
          void incrementListingViews(fetched);
          void fetchSellerReviews(fetched.sellerId).then(setReviews);
        }
      })
      .finally(() => setLoading(false));
  }, [selectedListingId, activeListings, myListings]);

  const sellerMeta = useMemo(() => {
    if (!listing) return null;
    return sellers.find((s) => s.uid === listing.sellerId) || null;
  }, [listing, sellers]);

  const relatedListings = useMemo(() => {
    if (!listing) return [];
    return activeListings
      .filter((a) => a.listingId !== listing.listingId && a.category === listing.category)
      .slice(0, 4);
  }, [listing, activeListings]);

  if (loading) return <LoadingState message={t.common.loading} />;

  if (!listing) {
    return (
      <ErrorState
        title="Listing Not Found"
        message="This livestock listing may have been removed or marked inactive."
        onRetry={() => navigate('explore')}
        retryLabel={t.detail.backToExplore}
      />
    );
  }

  const title = `${listing.breed} ${listing.category}`;
  const saved = isListingSaved(listing.listingId);
  const sellerVerified = Boolean(listing.sellerVerified || sellerMeta?.verified);
  const cleanPhone = listing.contactNumber.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    `Hello ${listing.sellerName}, I saw your ${title} (${formatINR(listing.price)}) on Pashu Market.`
  )}`;

  const specs = [
    { label: t.detail.category, value: listing.category },
    { label: t.detail.breed, value: listing.breed },
    { label: t.detail.age, value: listing.age },
    { label: t.detail.gender, value: listing.gender },
    { label: t.detail.color, value: listing.color },
    { label: t.detail.weight, value: listing.weight || '—' },
    { label: t.detail.milkCapacity, value: listing.milkCapacity || '—' },
    { label: t.detail.healthStatus, value: listing.healthStatus },
    { label: t.detail.vaccinationStatus, value: listing.vaccinationStatus },
    { label: t.detail.pregnancyStatus, value: listing.pregnancyStatus || '—' },
  ];

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser || !userProfile) {
      openAuthModal();
      return;
    }
    if (listing.isDemo) {
      showToast(t.detail.demoEnquiryNotice, 'info');
      setEnquiryOpen(false);
      return;
    }
    if (listing.sellerId === firebaseUser.uid) {
      showToast('You cannot send an enquiry on your own listing.', 'error');
      return;
    }
    if (enquiryMsg.trim().length < 2) {
      showToast('Please write a short message to the seller.', 'error');
      return;
    }
    setSendingEnquiry(true);
    try {
      await sendEnquiry({
        listing,
        buyer: userProfile,
        message: enquiryMsg.trim(),
        contactRequested: shareContact,
      });
      setEnquiryMsg('');
      setEnquiryOpen(false);
      showToast('Enquiry sent to seller!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to send enquiry.', 'error');
    } finally {
      setSendingEnquiry(false);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) {
      openAuthModal();
      return;
    }
    if (listing.isDemo) {
      showToast('Starter preview listings cannot be reported.', 'info');
      setReportOpen(false);
      return;
    }
    setSendingReport(true);
    try {
      await submitListingReport({
        listing,
        reason: reportReason,
        details: reportDetails.trim(),
      });
      setReportDetails('');
      setReportOpen(false);
      showToast('Report submitted for admin review.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to submit report.', 'error');
    } finally {
      setSendingReport(false);
    }
  };

  return (
    <div className="space-y-8 pb-20 lg:pb-8">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate('explore')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#173F35] hover:text-[#245747] min-h-[40px] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.detail.backToExplore}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (!firebaseUser) {
              openAuthModal();
              return;
            }
            setReportOpen(true);
          }}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#78847D] hover:text-[#C94D4D] min-h-[36px] cursor-pointer"
        >
          <Flag className="w-3.5 h-3.5" />
          <span>{t.detail.reportListing}</span>
        </button>
      </div>

      {listing.status === 'SOLD' && (
        <div className="rounded-[12px] bg-[#D6B875]/25 border border-[#D6B875] px-4 py-3 text-sm font-semibold text-[#173F35]">
          {t.detail.soldBanner}
        </div>
      )}

      {listing.status === 'ACTIVE' && !listing.isDemo && (
        <div className="rounded-[12px] bg-[#E8F0EB] border border-[#347A54]/30 px-4 py-3 flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-[#173F35]">
            {t.detail.livePublicBanner}
          </span>
          <span className="px-2.5 py-1 rounded-[8px] bg-[#347A54] text-white text-[11px] font-bold tracking-wide shrink-0">
            {t.sell.livePublicBadge}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Gallery & Video */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-[4/3] w-full rounded-[16px] overflow-hidden bg-[#E8F0EB] border border-[#E4E7E1]">
            {listing.photos[activePhotoIndex] ? (
              <img
                src={listing.photos[activePhotoIndex]}
                alt={`${title} photo ${activePhotoIndex + 1}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#173F35] font-display font-bold">
                {title}
              </div>
            )}
            <button
              type="button"
              onClick={() => setFullscreenOpen(true)}
              aria-label="Open fullscreen image viewer"
              className="absolute bottom-3 right-3 min-h-[40px] px-3 rounded-[10px] bg-white/95 text-[#26332E] text-xs font-semibold flex items-center gap-1.5 shadow-sm hover:bg-white cursor-pointer"
            >
              <Maximize2 className="w-4 h-4" />
              <span>Fullscreen</span>
            </button>
          </div>

          {listing.photos.length > 1 && (
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
              {listing.photos.map((photo, idx) => (
                <button
                  key={`${photo}_${idx}`}
                  type="button"
                  onClick={() => setActivePhotoIndex(idx)}
                  className={`w-20 h-16 rounded-[12px] overflow-hidden border-2 shrink-0 cursor-pointer ${
                    idx === activePhotoIndex ? 'border-[#173F35]' : 'border-[#E4E7E1]'
                  }`}
                >
                  <img
                    src={photo}
                    alt={`${title} thumbnail ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {listing.videoURL && (
            <div className="rounded-[16px] overflow-hidden bg-black border border-[#E4E7E1]">
              <video src={listing.videoURL} controls className="w-full max-h-[360px]" />
            </div>
          )}

          {/* Description */}
          <div className="rounded-[16px] bg-white border border-[#E4E7E1] p-6">
            <h2 className="font-display text-lg font-bold text-[#26332E]">
              {t.detail.description}
            </h2>
            <p className="mt-2.5 text-sm text-[#26332E] leading-relaxed whitespace-pre-line">
              {listing.description}
            </p>
          </div>

          {/* Specifications */}
          <div className="rounded-[16px] bg-white border border-[#E4E7E1] p-6">
            <h2 className="font-display text-lg font-bold text-[#26332E] mb-4">
              {t.detail.specsTitle}
            </h2>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {specs.map((item) => (
                <div key={item.label} className="border-b border-[#E4E7E1] pb-2.5">
                  <dt className="text-xs text-[#78847D]">{item.label}</dt>
                  <dd className="text-sm font-semibold text-[#26332E] mt-0.5">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Right: Price, Actions & Seller Card */}
        <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-20">
          <div className="rounded-[16px] bg-white border border-[#E4E7E1] p-6 space-y-5">
            <div>
              <div className="text-xs text-[#78847D]">
                {listing.category} · {formatListingDate(listing.publishedAt, lang)}
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#26332E] mt-1">
                {title}
              </h1>

              <div className="mt-3 flex items-baseline gap-3">
                <span className="font-display text-3xl font-extrabold text-[#173F35] tabular-nums">
                  {formatINR(listing.price)}
                </span>
                <span className="text-xs font-semibold text-[#245747]">
                  · {listing.negotiable ? t.detail.negotiable : t.detail.fixedPrice}
                </span>
              </div>

              <div className="mt-3 flex items-start gap-2 text-sm text-[#78847D]">
                <MapPin className="w-4 h-4 text-[#173F35] mt-0.5 shrink-0" />
                <span>
                  {listing.village}, {listing.district}, {listing.state}
                  {listing.locationDescription ? ` — ${listing.locationDescription}` : ''}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <a
                href={`tel:${listing.contactNumber}`}
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-[12px] bg-[#173F35] text-white text-sm font-semibold hover:bg-[#245747] transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span>{t.detail.callSeller}</span>
              </a>

              {listing.whatsappEnabled ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-[12px] bg-[#347A54] text-white text-sm font-semibold hover:opacity-95 transition-opacity"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{t.detail.whatsappSeller}</span>
                </a>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (!firebaseUser) {
                      openAuthModal();
                      return;
                    }
                    setEnquiryOpen(true);
                  }}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{t.detail.sendEnquiry}</span>
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <Button
                variant="secondary"
                onClick={() => {
                  if (!firebaseUser) {
                    openAuthModal();
                    return;
                  }
                  setEnquiryOpen(true);
                }}
              >
                <MessageSquare className="w-4 h-4" />
                <span>{t.detail.sendEnquiry}</span>
              </Button>

              <Button variant="outline" onClick={() => void toggleSaveListing(listing)}>
                <Heart
                  className={`w-4 h-4 ${saved ? 'text-[#173F35]' : ''}`}
                  fill={saved ? 'currentColor' : 'none'}
                />
                <span>{saved ? t.detail.savedFavourite : t.detail.addFavourite}</span>
              </Button>
            </div>
          </div>

          {/* Seller Card */}
          <div className="rounded-[16px] bg-white border border-[#E4E7E1] p-6 space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-[#E8F0EB] text-[#173F35] font-display font-bold flex items-center justify-center overflow-hidden shrink-0">
                {listing.sellerPhoto || sellerMeta?.photoURL ? (
                  <img
                    src={listing.sellerPhoto || sellerMeta?.photoURL}
                    alt={listing.sellerName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  listing.sellerName.slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-display text-base font-bold text-[#26332E] truncate">
                    {listing.sellerName}
                  </h3>
                  {sellerVerified && (
                    <BadgeCheck
                      className="w-4 h-4 text-[#347A54] shrink-0"
                      aria-label={t.detail.verifiedSeller}
                    />
                  )}
                </div>
                <p className="text-xs text-[#78847D] mt-0.5">
                  {listing.district}, {listing.state}
                  {sellerMeta?.memberSince &&
                    ` · ${t.detail.memberSince} ${formatListingDate(sellerMeta.memberSince, lang)}`}
                </p>
              </div>
            </div>

            {reviews.length > 0 && (
              <div className="pt-3 border-t border-[#E4E7E1] space-y-2">
                <div className="text-xs font-semibold text-[#78847D]">Seller Reviews</div>
                {reviews.slice(0, 2).map((rev) => (
                  <div key={rev.reviewId} className="text-xs text-[#26332E] space-y-0.5">
                    <div className="flex items-center gap-1 font-semibold">
                      <Star className="w-3.5 h-3.5 text-[#D6B875]" fill="currentColor" />
                      <span>{rev.rating}/5</span>
                      <span className="text-[#78847D] font-normal">· {rev.reviewerName}</span>
                    </div>
                    <p className="text-[#78847D]">{rev.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related Animals */}
      {relatedListings.length > 0 && (
        <section className="pt-4">
          <h2 className="font-display text-xl font-bold text-[#26332E] mb-4">
            {t.detail.relatedTitle}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {relatedListings.map((item) => (
              <AnimalCard key={item.listingId} listing={item} onOpen={openListing} />
            ))}
          </div>
        </section>
      )}

      {/* Mobile Sticky Contact Action Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E4E7E1] px-4 py-2.5 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs text-[#78847D]">{title}</div>
          <div className="font-display text-base font-bold text-[#173F35] tabular-nums">
            {formatINR(listing.price)}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={`tel:${listing.contactNumber}`}
            className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3.5 rounded-[12px] bg-[#173F35] text-white text-xs font-semibold"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>{t.detail.callSeller}</span>
          </a>
          <Button
            variant="gold"
            size="sm"
            onClick={() => {
              if (!firebaseUser) {
                openAuthModal();
                return;
              }
              setEnquiryOpen(true);
            }}
          >
            {t.detail.sendEnquiry}
          </Button>
        </div>
      </div>

      {/* Fullscreen Image Lightbox */}
      <Modal
        open={fullscreenOpen}
        onClose={() => setFullscreenOpen(false)}
        title={title}
        maxWidthClass="max-w-4xl"
      >
        <div className="space-y-4">
          <img
            src={listing.photos[activePhotoIndex]}
            alt={title}
            referrerPolicy="no-referrer"
            className="w-full max-h-[70vh] object-contain rounded-[12px] bg-[#F7F5EF]"
          />
          {listing.photos.length > 1 && (
            <div className="flex items-center justify-center gap-2">
              {listing.photos.map((p, idx) => (
                <button
                  key={`${p}_fs_${idx}`}
                  type="button"
                  onClick={() => setActivePhotoIndex(idx)}
                  className={`w-16 h-12 rounded-[8px] overflow-hidden border-2 cursor-pointer ${
                    idx === activePhotoIndex ? 'border-[#173F35]' : 'border-[#E4E7E1]'
                  }`}
                >
                  <img src={p} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Send Enquiry Modal */}
      <Modal
        open={enquiryOpen}
        onClose={() => setEnquiryOpen(false)}
        title={t.detail.enquiryModalTitle}
        subtitle={`${title} · ${formatINR(listing.price)}`}
      >
        <form onSubmit={handleEnquirySubmit} className="space-y-4">
          <Textarea
            label={t.detail.enquiryMessageLabel}
            rows={4}
            value={enquiryMsg}
            onChange={(e) => setEnquiryMsg(e.target.value)}
            placeholder={t.detail.enquiryMessagePlaceholder}
            required
          />
          <label className="flex items-center gap-2 text-sm text-[#26332E] cursor-pointer">
            <input
              type="checkbox"
              checked={shareContact}
              onChange={(e) => setShareContact(e.target.checked)}
              className="h-4 w-4 rounded accent-[#173F35]"
            />
            <span>{t.detail.shareContactLabel}</span>
          </label>
          <div className="flex justify-end gap-2.5">
            <Button variant="outline" onClick={() => setEnquiryOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" loading={sendingEnquiry}>
              {t.detail.submitEnquiry}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Report Modal */}
      <Modal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title={t.detail.reportModalTitle}
        subtitle={title}
      >
        <form onSubmit={handleReportSubmit} className="space-y-4">
          <Select
            label={t.detail.reportReasonLabel}
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
          >
            <option value="Misleading Information">Misleading Information</option>
            <option value="Suspected Fraud or Scam">Suspected Fraud or Scam</option>
            <option value="Already Sold">Already Sold</option>
            <option value="Inappropriate Media">Inappropriate Media</option>
          </Select>
          <Textarea
            label={t.detail.reportDetailsLabel}
            rows={3}
            value={reportDetails}
            onChange={(e) => setReportDetails(e.target.value)}
            placeholder="Describe the issue..."
          />
          <div className="flex justify-end gap-2.5">
            <Button variant="outline" onClick={() => setReportOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" variant="danger" loading={sendingReport}>
              {t.detail.submitReport}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
