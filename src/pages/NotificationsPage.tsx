import React from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { markNotificationRead } from '../services/marketplaceService';
import { formatListingDate } from '../utils/validation';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';

export function NotificationsPage() {
  const {
    t,
    lang,
    firebaseUser,
    openAuthModal,
    notifications,
    unreadNotificationCount,
    markAllNotificationsRead,
    openListing,
    navigate,
  } = useApp();

  if (!firebaseUser) {
    return (
      <div className="max-w-xl mx-auto py-8">
        <EmptyState
          icon={<Bell className="w-7 h-7" />}
          title="Sign in for Notifications"
          description="Sign in to receive alerts on new enquiries, listing activity, and announcements."
          actionLabel={t.nav.signIn}
          onAction={openAuthModal}
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#26332E]">
            {t.notifications.title}
          </h1>
          <p className="text-sm text-[#78847D] mt-1">{t.notifications.subtitle}</p>
        </div>

        {unreadNotificationCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => void markAllNotificationsRead()}>
            <CheckCheck className="w-4 h-4" />
            <span>{t.notifications.markAllRead}</span>
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-7 h-7" />}
          title={t.notifications.emptyTitle}
          description={t.notifications.emptyDesc}
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((item) => (
            <button
              key={item.notificationId}
              type="button"
              onClick={() => {
                if (!item.read) void markNotificationRead(item.notificationId);
                if (item.type === 'NEW_ENQUIRY' || item.type === 'NEW_MESSAGE') {
                  navigate('enquiries');
                } else if (item.relatedId && item.relatedId !== 'global') {
                  openListing(item.relatedId);
                }
              }}
              className={`w-full text-left rounded-[16px] border p-4 transition-colors cursor-pointer ${
                item.read
                  ? 'bg-white border-[#E4E7E1]'
                  : 'bg-[#E8F0EB]/60 border-[#173F35]/30'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-sm font-bold text-[#26332E]">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[#78847D] mt-1">{item.body}</p>
                </div>
                <span className="text-xs text-[#78847D] whitespace-nowrap shrink-0">
                  {formatListingDate(item.createdAt, lang)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
