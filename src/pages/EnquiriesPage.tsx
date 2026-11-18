import React, { useState } from 'react';
import { Check, MessageSquare, Send } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { replyToEnquiry, resolveEnquiryAsBuyer } from '../services/marketplaceService';
import { EnquiryItem } from '../types';
import { formatListingDate } from '../utils/validation';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';

export function EnquiriesPage() {
  const {
    t,
    lang,
    firebaseUser,
    openAuthModal,
    inboxEnquiries,
    sentEnquiries,
    openListing,
    navigate,
    showToast,
  } = useApp();

  const [tab, setTab] = useState<'inbox' | 'sent'>('inbox');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  if (!firebaseUser) {
    return (
      <div className="max-w-xl mx-auto py-8">
        <EmptyState
          icon={<MessageSquare className="w-7 h-7" />}
          title="Sign in to View Enquiries"
          description="Sign in to view incoming buyer enquiries and messages you sent to sellers."
          actionLabel={t.nav.signIn}
          onAction={openAuthModal}
        />
      </div>
    );
  }

  const activeList = tab === 'inbox' ? inboxEnquiries : sentEnquiries;

  const handleReply = async (enquiry: EnquiryItem) => {
    const text = (replyDrafts[enquiry.enquiryId] || '').trim();
    if (!text) return;
    setBusyId(enquiry.enquiryId);
    try {
      await replyToEnquiry(enquiry, text, 'REPLIED');
      setReplyDrafts((prev) => ({ ...prev, [enquiry.enquiryId]: '' }));
      showToast('Reply sent to buyer!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to reply.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleResolve = async (enquiry: EnquiryItem) => {
    setBusyId(enquiry.enquiryId);
    try {
      if (tab === 'inbox') {
        await replyToEnquiry(enquiry, enquiry.reply || 'Marked resolved by seller.', 'RESOLVED');
      } else {
        await resolveEnquiryAsBuyer(enquiry.enquiryId);
      }
      showToast('Enquiry marked as resolved.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update status.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#26332E]">
          {t.enquiries.title}
        </h1>
        <p className="text-sm text-[#78847D] mt-1">{t.enquiries.subtitle}</p>
      </div>

      <div className="grid grid-cols-2 gap-1 p-1 rounded-[12px] bg-white border border-[#E4E7E1] max-w-md">
        <button
          type="button"
          onClick={() => setTab('inbox')}
          className={`min-h-[40px] rounded-[10px] text-xs font-semibold cursor-pointer ${
            tab === 'inbox' ? 'bg-[#173F35] text-white' : 'text-[#78847D]'
          }`}
        >
          {t.enquiries.inboxTab} ({inboxEnquiries.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('sent')}
          className={`min-h-[40px] rounded-[10px] text-xs font-semibold cursor-pointer ${
            tab === 'sent' ? 'bg-[#173F35] text-white' : 'text-[#78847D]'
          }`}
        >
          {t.enquiries.sentTab} ({sentEnquiries.length})
        </button>
      </div>

      {activeList.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="w-7 h-7" />}
          title={tab === 'inbox' ? t.enquiries.emptyInboxTitle : t.enquiries.emptySentTitle}
          description={tab === 'inbox' ? t.enquiries.emptyInboxDesc : t.enquiries.emptySentDesc}
          actionLabel={t.explore.title}
          onAction={() => navigate('explore')}
        />
      ) : (
        <div className="space-y-4">
          {activeList.map((enq) => (
            <div
              key={enq.enquiryId}
              className="rounded-[16px] bg-white border border-[#E4E7E1] p-5 space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  {enq.listingPhoto && (
                    <img
                      src={enq.listingPhoto}
                      alt={enq.listingTitle}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-[10px] object-cover bg-[#E8F0EB] shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => openListing(enq.listingId)}
                      className="font-display text-sm font-bold text-[#173F35] hover:underline text-left truncate block cursor-pointer"
                    >
                      {enq.listingTitle}
                    </button>
                    <div className="text-xs text-[#78847D] mt-0.5">
                      {tab === 'inbox' ? `From ${enq.buyerName}` : `To ${enq.sellerName}`} ·{' '}
                      {formatListingDate(enq.createdAt, lang)} · {enq.status}
                    </div>
                    {tab === 'inbox' && enq.contactRequested && enq.buyerPhone && (
                      <div className="text-xs font-medium text-[#245747] mt-0.5">
                        Callback Phone: {enq.buyerPhone}
                      </div>
                    )}
                  </div>
                </div>

                {enq.status !== 'RESOLVED' && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busyId === enq.enquiryId}
                    onClick={() => void handleResolve(enq)}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{t.enquiries.markResolved}</span>
                  </Button>
                )}
              </div>

              <div className="rounded-[12px] bg-[#F7F5EF] p-3.5 text-sm text-[#26332E]">
                {enq.message}
              </div>

              {enq.reply && (
                <div className="rounded-[12px] bg-[#E8F0EB] p-3.5 text-sm text-[#173F35]">
                  <span className="font-semibold">Seller Reply: </span>
                  {enq.reply}
                </div>
              )}

              {tab === 'inbox' && enq.status !== 'RESOLVED' && (
                <div className="flex items-center gap-2 pt-1">
                  <Input
                    value={replyDrafts[enq.enquiryId] || ''}
                    onChange={(e) =>
                      setReplyDrafts((prev) => ({ ...prev, [enq.enquiryId]: e.target.value }))
                    }
                    placeholder={t.enquiries.replyPlaceholder}
                  />
                  <Button
                    variant="primary"
                    size="md"
                    disabled={busyId === enq.enquiryId || !(replyDrafts[enq.enquiryId] || '').trim()}
                    onClick={() => void handleReply(enq)}
                  >
                    <Send className="w-4 h-4" />
                    <span>{t.enquiries.sendReply}</span>
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
