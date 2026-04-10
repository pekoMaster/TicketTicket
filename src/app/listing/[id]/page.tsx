'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useApp } from '@/contexts/AppContext';
import { useAdmin } from '@/contexts/AdminContext';
import { useTranslations } from 'next-intl';
import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/Card';
import GlassCard, { InfoRow, AuroraPriceDisplay } from '@/components/ui/GlassCard';
import AuroraBackground from '@/components/ui/AuroraBackground';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Input';
import { TicketTypeTag } from '@/components/ui/Tag';
import Avatar from '@/components/ui/Avatar';
import StarRating from '@/components/ui/StarRating';
import SafetyBanner from '@/components/ui/SafetyBanner';
import AgreementModal from '@/components/ui/AgreementModal';
import CurrencyBadge from '@/components/ui/CurrencyBadge';
import { getCurrencySymbol } from '@/lib/currency';
import { useCurrency } from '@/contexts/CurrencyContext';
import { TicketType, Listing, LANGUAGE_OPTIONS, NATIONALITY_OPTIONS } from '@/types';
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  AlertTriangle,
  Ticket,
  MessageCircle,
  Check,
  Loader2,
  Star,
  Edit3,
  Trash2,
  MoreVertical,
  ArrowLeftRight,
  Banknote,
  ShieldCheck,
  Globe,
  Languages,
  Flag,
  Share2,
  Bell,
} from 'lucide-react';
import ReviewModal from '@/components/features/ReviewModal';
import ReportModal from '@/components/ui/ReportModal';
import ShareModal from '@/components/ui/ShareModal';
import SubscriptionModal from '@/components/ui/SubscriptionModal';

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { listings, deleteListing, updateListing } = useApp();
  const { events } = useAdmin();
  const t = useTranslations('listing');
  const tApply = useTranslations('apply');
  const tTicket = useTranslations('ticketType');
  const tCommon = useTranslations('common');
  const tCreate = useTranslations('create');
  const { locale } = useLanguage();

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showApplyAgreement, setShowApplyAgreement] = useState(false); // 申請警告彈窗
  const [applyMessage, setApplyMessage] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [isCheckingApplication, setIsCheckingApplication] = useState(true);

  // Host management states
  const [showHostMenu, setShowHostMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Review states
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [isHostForReview, setIsHostForReview] = useState(false);
  const [reviewableUsers, setReviewableUsers] = useState<Array<{
    id: string;
    username: string;
    avatar_url?: string;
    custom_avatar_url?: string;
  }>>([]);
  const tReview = useTranslations('review');

  // Inquiry states
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [isInquiring, setIsInquiring] = useState(false);
  const [hasInquiry, setHasInquiry] = useState(false);
  const [existingConversationId, setExistingConversationId] = useState<string | null>(null);
  const [inquiryCount, setInquiryCount] = useState(0);
  const [applicationCount, setApplicationCount] = useState(0);

  // Share state
  const [showShareModal, setShowShareModal] = useState(false);

  // Subscription state
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const tSub = useTranslations('subscription');

  const listing = listings.find((l) => l.id === params.id);
  const host = listing?.host;
  const currentUserId = session?.user?.dbId;
  const currentEvent = events.find(e => e.name === listing?.eventName);
  const currency = currentEvent?.currency || 'JPY';
  const { preferredCurrency, convertPrice } = useCurrency();

  // 檢查是否為主辦方
  const isHost = listing?.hostId === currentUserId;

  // 判斷是否為換票類型
  const isExchangeMode = listing?.ticketType === 'ticket_exchange';

  // 檢查是否已申請
  const checkApplication = useCallback(async () => {
    if (!currentUserId || !listing) {
      setIsCheckingApplication(false);
      return;
    }

    try {
      const response = await fetch('/api/applications');
      if (response.ok) {
        const data = await response.json();
        const existingApp = data.sent?.find(
          (app: { listing_id: string; status: string }) =>
            app.listing_id === listing.id && app.status !== 'cancelled'
        );
        if (existingApp) {
          setHasApplied(true);
          setApplicationStatus(existingApp.status);
        } else {
          setHasApplied(false);
          setApplicationStatus(null);
        }
      }
    } catch (error) {
      console.error('Error checking application:', error);
    } finally {
      setIsCheckingApplication(false);
    }
  }, [currentUserId, listing]);

  // 檢查是否可以評價
  const checkCanReview = useCallback(async () => {
    if (!currentUserId || !listing) return;

    try {
      const response = await fetch(`/api/reviews/can-review/${listing.id}`);
      if (response.ok) {
        const data = await response.json();
        setCanReview(data.canReview);
        setIsHostForReview(data.isHost || false);
        setReviewableUsers(data.reviewableUsers || []);
      }
    } catch (error) {
      console.error('Error checking review eligibility:', error);
    }
  }, [currentUserId, listing]);

  // 檢查是否已有諮詢對話並獲取統計
  const checkInquiry = useCallback(async () => {
    if (!listing) return;

    try {
      // 獲取諮詢/申請人數
      const countRes = await fetch(`/api/inquiries?listingId=${listing.id}`);
      if (countRes.ok) {
        const data = await countRes.json();
        setInquiryCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error checking inquiry:', error);
    }
  }, [listing]);

  // 處理發問
  const handleInquiry = async () => {
    if (!currentUserId || !listing || isInquiring) return;

    setIsInquiring(true);
    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: listing.id,
          message: inquiryMessage.trim() || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setExistingConversationId(data.conversationId);
        setHasInquiry(true);
        setShowInquiryModal(false);
        // 跳轉到對話頁面
        router.push(`/chat/${data.conversationId}`);
      } else {
        const error = await response.json();
        console.error('Inquiry error:', error);
      }
    } catch (error) {
      console.error('Error starting inquiry:', error);
    } finally {
      setIsInquiring(false);
    }
  };

  useEffect(() => {
    checkApplication();
  }, [checkApplication]);

  useEffect(() => {
    checkInquiry();
  }, [checkInquiry]);

  useEffect(() => {
    if (hasApplied || isHost) {
      checkCanReview();
    }
  }, [hasApplied, isHost, checkCanReview]);

  // Helper to get ticket type info translations
  const getTicketTypeInfo = (type: TicketType) => {
    const typeMapping: Record<TicketType, { labelKey: string; warningKey: string }> = {
      find_companion: { labelKey: 'findCompanion', warningKey: 'findCompanionWarning' },
      sub_ticket_transfer: { labelKey: 'subTicketTransfer', warningKey: 'subTicketTransferWarning' },
      ticket_exchange: { labelKey: 'ticketExchange', warningKey: 'ticketExchangeWarning' },
    };
    const { labelKey, warningKey } = typeMapping[type];
    return {
      label: tTicket(labelKey),
      warning: tTicket(warningKey),
    };
  };

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-500">{t('detail')}</p>
      </div>
    );
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Tokyo',
    });
  };

  const handleApply = async () => {
    if (!currentUserId) return;

    setIsApplying(true);

    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: listing.id,
          message: applyMessage || undefined,
        }),
      });

      if (response.ok) {
        setHasApplied(true);
        setApplicationStatus('pending');
        setShowApplyModal(false);
        setShowSuccessModal(true);
      } else {
        const error = await response.json();
        alert(error.error || tCommon('applyFailed'));
      }
    } catch (error) {
      console.error('Error applying:', error);
      alert(tCommon('applyFailed'));
    } finally {
      setIsApplying(false);
    }
  };

  const ticketInfo = getTicketTypeInfo(listing.ticketType);

  // 處理刪除刊登
  const handleDelete = async () => {
    setIsDeleting(true);
    const success = await deleteListing(listing.id);
    setIsDeleting(false);
    if (success) {
      setShowDeleteModal(false);
      router.push('/profile');
    } else {
      alert(tCommon('deleteFailed'));
    }
  };

  // 處理更新狀態
  const handleUpdateStatus = async (newStatus: 'open' | 'matched' | 'closed') => {
    setIsUpdatingStatus(true);
    const success = await updateListing(listing.id, { status: newStatus });
    setIsUpdatingStatus(false);
    setShowStatusMenu(false);
    if (!success) {
      alert(tCommon('updateFailed'));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative">
      {/* Aurora 背景效果 */}
      <AuroraBackground />
      <Header
        title={t('detail')}
        showBack
        rightAction={isHost ? (
          <div className="relative">
            <button
              onClick={() => setShowHostMenu(!showHostMenu)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            {showHostMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowHostMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 py-1 z-50">
                  <button
                    onClick={() => {
                      setShowHostMenu(false);
                      router.push(`/listing/${listing.id}/edit`);
                    }}
                    className="w-full px-4 py-2.5 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    {t('edit')}
                  </button>
                  <button
                    onClick={() => {
                      setShowHostMenu(false);
                      setShowStatusMenu(true);
                    }}
                    className="w-full px-4 py-2.5 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Clock className="w-4 h-4" />
                    {t('changeStatus')}
                  </button>
                  <button
                    onClick={() => {
                      setShowHostMenu(false);
                      setShowDeleteModal(true);
                    }}
                    className="w-full px-4 py-2.5 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t('delete')}
                  </button>
                </div>
              </>
            )}
          </div>
        ) : undefined}
      />

      <div className="relative z-10 pt-20 pb-32 max-w-3xl mx-auto px-4">
        {/* 主要資訊卡片 - Glassmorphism */}
        <GlassCard className="mb-6">
          {/* 票券類型標籤 - 漸層風格 */}
          <div className="mb-4">
            {(() => {
              const typeStyles: Record<string, { color: string; icon: string }> = {
                find_companion: { color: 'from-blue-500 to-cyan-500', icon: '🤝' },
                sub_ticket_transfer: { color: 'from-purple-500 to-pink-500', icon: '🎫' },
                ticket_exchange: { color: 'from-orange-500 to-amber-500', icon: '🔄' },
              };
              const style = typeStyles[listing.ticketType] || typeStyles.find_companion;
              const labels: Record<string, string> = {
                find_companion: tTicket('findCompanion'),
                sub_ticket_transfer: tTicket('subTicketTransfer'),
                ticket_exchange: tTicket('ticketExchange'),
              };
              return (
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white font-semibold bg-gradient-to-r ${style.color} shadow-lg`}>
                  <span className="text-xl">{style.icon}</span>
                  {labels[listing.ticketType]}
                </span>
              );
            })()}
          </div>

          {/* 活動名稱 */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{listing.eventName}</h1>
            <div className="flex items-center gap-1">
              {/* 訂閱按鈕 */}
              {!isHost && session?.user && (
                <button
                  onClick={() => setShowSubscriptionModal(true)}
                  className="flex-shrink-0 p-2 rounded-lg text-gray-400 dark:text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all"
                  title={tSub('subscribeButton')}
                >
                  <Bell className="w-5 h-5" />
                </button>
              )}
              {/* 分享按鈕 */}
              <button
                onClick={() => setShowShareModal(true)}
                className="flex-shrink-0 p-2 rounded-lg text-gray-400 dark:text-gray-400 hover:text-pink-500 dark:hover:text-white hover:bg-pink-50 dark:hover:bg-white/10 transition-all"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 場館資訊 */}
          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300 mb-4">
            <MapPin className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />
            <span>{listing.venue}</span>
          </div>

          {/* 協調提示 - Glassmorphism 風格 */}
          <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-xl p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700 dark:text-blue-200">
              <p className="font-medium">{t('aboutMeetup', { defaultValue: '關於集合時間與地點' })}</p>
              <p className="text-blue-600 dark:text-blue-300/80 mt-1">
                {t('coordinationNote', { defaultValue: '活動日期、集合時間與地點由雙方在配對成功後自行協調。' })}
              </p>
            </div>
          </div>
        </GlassCard>

        {/* 票種資訊 */}
        <div className="px-4 py-4">
          <GlassCard title={t('ticketInfo')} icon={Ticket}>

            <div className="space-y-3">
              {/* 座位等級 */}
              {listing.seatGrade && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">{t('seatGradeLabel')}</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{listing.seatGrade}</span>
                </div>
              )}

              {/* 幾人票 */}
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">{t('ticketPeopleCount', { defaultValue: '購票人數' })}</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {listing.ticketPeopleCount}人票
                </span>
              </div>

              {/* 參考原價 */}
              {(() => {
                const selectedEvent = events.find(e => e.name === listing.eventName);
                const priceTier = selectedEvent?.ticketPriceTiers?.find(
                  tier => tier.seatGrade === listing.seatGrade
                );
                if (priceTier?.priceJpy) {
                  return (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        <Banknote className="w-4 h-4 text-green-500" />
                        <span className="text-gray-500 dark:text-gray-400">{t('referencePrice', { defaultValue: '參考原價' })}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-green-600 dark:text-green-400">{getCurrencySymbol(currency)}{priceTier.priceJpy.toLocaleString()}</span>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{t('referencePriceNote', { defaultValue: '僅供參考' })}</p>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* 票種類型 */}
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">{t('ticketTypeLabel')}</span>
                <TicketTypeTag type={listing.ticketType} size="sm" />
              </div>

              {/* 協助入場 - 只有同行者類型才顯示 */}
              {listing.ticketType === 'find_companion' && listing.willAssistEntry && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">{t('willAssistEntryLabel', { defaultValue: '協助入場' })}</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {t('hostWillAssist', { defaultValue: '主辦會協助入場' })}
                  </span>
                </div>
              )}

              {isExchangeMode ? (
                /* 換票模式 */
                <>
                  {/* 想換的活動 */}
                  {listing.exchangeEventName && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-gray-500 dark:text-gray-400">{t('wantToExchange')}</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100 text-right max-w-[200px] truncate">{listing.exchangeEventName}</span>
                    </div>
                  )}

                  {/* 想換的票種等級 */}
                  {((listing.exchangeSeatGrades && listing.exchangeSeatGrades.length > 0) || listing.exchangeSeatGrade) && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-gray-500 dark:text-gray-400">{t('wantSeatGrade')}</span>
                      <div className="flex flex-wrap gap-1 justify-end">
                        {(listing.exchangeSeatGrades || (listing.exchangeSeatGrade ? [listing.exchangeSeatGrade] : [])).map((grade) => (
                          <span
                            key={grade}
                            className="px-2 py-0.5 rounded text-sm font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                          >
                            {grade === 'any' ? tCreate('anyGrade') : grade}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* 一般模式 */
                <></>
              )}
            </div>

            {/* 價格區塊 - Aurora Style (如 test-info) */}
            {listing.originalPriceJpy > 0 && (
              <div className="relative rounded-xl overflow-hidden mt-6">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-100 to-cyan-100 dark:from-emerald-500/20 dark:to-cyan-500/20" />
                <div className="relative grid grid-cols-2 divide-x divide-gray-200 dark:divide-white/10 backdrop-blur-sm">
                  <div className="p-4 text-center">
                    <span className="text-xs text-emerald-600 dark:text-emerald-300 block mb-1">{t('askingPrice', { defaultValue: '希望分攤' })}</span>
                    <span className="text-3xl font-bold text-emerald-700 dark:text-white">{getCurrencySymbol(currency)}{listing.askingPriceJpy.toLocaleString()}</span>
                    {currency !== preferredCurrency && convertPrice(listing.askingPriceJpy, currency) !== null && (
                      <span className="text-sm text-gray-500 dark:text-gray-400 block mt-1">
                        (約 {getCurrencySymbol(preferredCurrency)}{convertPrice(listing.askingPriceJpy, currency)?.toLocaleString()})
                      </span>
                    )}
                    {currency !== 'JPY' && <CurrencyBadge currency={currency} className="mt-2" />}
                  </div>
                  <div className="p-4 text-center bg-gray-50/50 dark:bg-black/20">
                    <span className="text-xs text-gray-500 dark:text-white/50 block mb-1">{t('originalPrice', { defaultValue: '定價' })}</span>
                    <span className="text-3xl font-medium text-gray-600 dark:text-white/70">{getCurrencySymbol(currency)}{listing.originalPriceJpy.toLocaleString()}</span>
                    {currency !== preferredCurrency && convertPrice(listing.originalPriceJpy, currency) !== null && (
                      <span className="text-sm text-gray-500 dark:text-gray-400 block mt-1">
                        (約 {getCurrencySymbol(preferredCurrency)}{convertPrice(listing.originalPriceJpy, currency)?.toLocaleString()})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </GlassCard>
        </div>

        {/* 票券類型警告 - 只有主辦方看得到，且排除尋找同行者 */}
        {isHost && ticketInfo.warning && listing.ticketType !== 'find_companion' && listing.ticketType !== 'ticket_exchange' && (
          <div className="px-4 pb-4">
            <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-orange-800 dark:text-orange-300">{ticketInfo.label}</p>
                <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">{ticketInfo.warning}</p>
              </div>
            </div>
          </div>
        )}

        {/* 描述 */}
        {listing.description && (
          <div className="px-4 pb-4">
            <GlassCard>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">{t('description')}</h3>
              <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{listing.description}</p>
            </GlassCard>
          </div>
        )}

        {/* 主辦方資訊 */}
        {host && (
          <div className="px-4 pb-4">
            <GlassCard>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900 dark:text-white">{t('host')}</h3>
                {!isHost && session?.user && (
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    title={t('report')}
                  >
                    <Flag className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex items-start gap-4">
                {/* 頭像 */}
                <Avatar src={host.customAvatarUrl || host.avatarUrl} size="lg" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100">{host.username}</p>
                  {/* 評價 - 可點擊跳轉 */}
                  <Link href={`/reviews/${host.id}`} className="inline-block hover:opacity-80 transition-opacity">
                    <StarRating
                      value={host.rating}
                      readonly
                      size="sm"
                      showValue
                      totalReviews={host.reviewCount}
                    />
                  </Link>
                  {/* 國籍和語言 */}
                  <div className="flex flex-wrap gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {listing.hostNationality && (
                      <span className="inline-flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5" />
                        {t(`common.nationalities.${listing.hostNationality}`, { defaultValue: listing.hostNationality })}
                      </span>
                    )}
                    {listing.hostLanguages && listing.hostLanguages.length > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Languages className="w-3.5 h-3.5" />
                        {listing.hostLanguages.map(code => t(`common.languagesList.${code}`, { defaultValue: code })).join(', ')}
                      </span>
                    )}
                  </div>
                  {/* 已申請後顯示聯絡方式圖示 */}
                  {hasApplied && (host.showLine || host.showDiscord) && (
                    <div className="flex items-center gap-2 mt-2">
                      {host.showLine && host.lineId && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-[#00B900]/10 rounded-full" title={`LINE: ${host.lineId}`}>
                          <svg className="w-4 h-4 text-[#00B900]" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                          </svg>
                          <span className="text-xs text-[#00B900] font-medium">{host.lineId}</span>
                        </div>
                      )}
                      {host.showDiscord && host.discordId && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-[#5865F2]/10 rounded-full" title={`Discord: ${host.discordId}`}>
                          <svg className="w-4 h-4 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
                          </svg>
                          <span className="text-xs text-[#5865F2] font-medium">{host.discordId}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {/* 評價按鈕 */}
        {canReview && reviewableUsers.length > 0 && (
          <div className="px-4 pb-4">
            <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/30 border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/50 rounded-full flex items-center justify-center">
                    <Star className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {isHostForReview ? tReview('reviewGuest') : tReview('reviewHost')}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{tReview('leaveReview')}</p>
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">{tReview('confirmBeforeReview')}</p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => setShowReviewModal(true)}
                >
                  {tReview('writeReview')}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* 安全提醒 */}
        <div className="px-4 pb-4">
          <SafetyBanner variant="listing" />
        </div>

        {/* 零手續費聲明 - Glassmorphism Style */}
        <div className="px-4 pb-4">
          <div className="relative bg-white/80 dark:bg-gray-900/40 backdrop-blur-xl rounded-2xl p-5 border border-emerald-200/50 dark:border-emerald-500/30 shadow-xl">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-50/50 dark:from-white/5 to-transparent pointer-events-none" />
            <div className="relative flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="font-semibold text-emerald-700 dark:text-emerald-300">{t('noFeeTitle')}</p>
                <p className="text-sm text-emerald-600/80 dark:text-emerald-400/80 mt-1">{t('noFeeDesc')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部操作列 - Glassmorphism Style (如 test-info) */}
      <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-200/50 dark:border-white/10 px-4 py-4 safe-area-bottom">
        <div className="max-w-3xl mx-auto">
          {isCheckingApplication ? (
            <div className="flex-1 py-3.5 px-6 rounded-xl font-semibold bg-gray-200 dark:bg-gray-700/50 text-gray-400 flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              {tCommon('loading')}
            </div>
          ) : isHost ? (
            <div className="flex-1 py-3.5 px-6 rounded-xl font-semibold bg-gray-200 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 flex items-center justify-center">
              {t('ownListing', { defaultValue: '自己主辦的活動' })}
            </div>
          ) : hasApplied ? (
            <div className="flex gap-3">
              <button
                className="flex-1 py-3.5 px-6 rounded-xl font-semibold bg-red-500/20 text-red-500 dark:text-red-400 border border-red-300 dark:border-red-500/30 hover:bg-red-500/30 transition-all flex items-center justify-center gap-2"
              >
                {t('cancelApply', { defaultValue: '取消申請' })}
              </button>
              <div className="flex-1 py-3.5 px-6 rounded-xl font-semibold bg-gray-200 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
                <Check className="w-5 h-5" />
                {applicationStatus === 'pending' && t('applied')}
                {applicationStatus === 'accepted' && t('matched')}
                {applicationStatus === 'rejected' && t('rejected')}
              </div>
            </div>
          ) : listing.availableSlots === 0 ? (
            <div className="flex-1 py-3.5 px-6 rounded-xl font-semibold bg-gray-200 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 flex items-center justify-center">
              {t('full')}
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => setShowInquiryModal(true)}
                className="flex-1 py-3.5 px-6 rounded-xl font-semibold bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                {t('askQuestion', { defaultValue: '發問' })}
              </button>
              <button
                onClick={() => setShowApplyAgreement(true)}
                className="flex-1 py-3.5 px-6 rounded-xl font-semibold bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
              >
                {t('apply')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 申請警告彈窗 */}
      <AgreementModal
        isOpen={showApplyAgreement}
        onAgree={() => {
          setShowApplyAgreement(false);
          setShowApplyModal(true);
        }}
        onCancel={() => setShowApplyAgreement(false)}
        variant="apply"
      />

      {/* 申請 Modal */}
      <Modal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        title={tApply('title')}
      >
        <div className="p-4">
          <div className="mb-4">
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              {listing.eventName}
            </p>
          </div>

          <Textarea
            label={tApply('intro')}
            placeholder={tApply('introPlaceholder')}
            value={applyMessage}
            onChange={(e) => setApplyMessage(e.target.value)}
            rows={4}
            maxLength={200}
            showCount
          />

          <SafetyBanner variant="listing" className="mt-4" />

          <Button
            fullWidth
            className="mt-4"
            onClick={handleApply}
            loading={isApplying}
          >
            {tApply('submit')}
          </Button>
        </div>
      </Modal>

      {/* 發問 Modal */}
      <Modal
        isOpen={showInquiryModal}
        onClose={() => setShowInquiryModal(false)}
        title={t('inquiryTitle', { defaultValue: '向主辦發問' })}
      >
        <div className="p-4">
          <div className="mb-4">
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              {listing.eventName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('inquiryDesc', { defaultValue: '有任何問題可以先向主辦詢問，再決定是否要申請' })}
            </p>
          </div>

          <Textarea
            label={t('inquiryLabel', { defaultValue: '您的問題（選填）' })}
            placeholder={t('inquiryPlaceholder', { defaultValue: '想問什麼呢？例如：請問集合時間可以提早嗎？' })}
            value={inquiryMessage}
            onChange={(e) => setInquiryMessage(e.target.value)}
            rows={3}
            maxLength={200}
            showCount
          />

          <div className="mt-4 flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowInquiryModal(false)}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              className="flex-1"
              onClick={handleInquiry}
              loading={isInquiring}
            >
              {t('startChat', { defaultValue: '開始對話' })}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 成功 Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title=""
      >
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{tApply('success')}</h3>
          <p className="text-gray-500 mb-6">
            {tApply('successMessage')}
          </p>
          <Button fullWidth onClick={() => {
            setShowSuccessModal(false);
            router.push('/');
          }}>
            {tApply('backHome')}
          </Button>
        </div>
      </Modal>

      {/* 評價 Modal */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        listingId={listing.id}
        reviewableUsers={reviewableUsers}
        isHost={isHostForReview}
        onSubmitSuccess={() => {
          setCanReview(false);
          setReviewableUsers([]);
        }}
      />

      {/* 刪除確認 Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={t('deleteConfirmTitle')}
      >
        <div className="p-4">
          <p className="text-gray-600 mb-6">{t('deleteConfirmMessage')}</p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setShowDeleteModal(false)}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              fullWidth
              onClick={handleDelete}
              loading={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {t('delete')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 狀態更改 Modal */}
      <Modal
        isOpen={showStatusMenu}
        onClose={() => setShowStatusMenu(false)}
        title={t('changeStatus')}
      >
        <div className="p-4 space-y-2">
          {(['open', 'matched', 'closed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => handleUpdateStatus(status)}
              disabled={isUpdatingStatus || listing.status === status}
              className={`
                w-full px-4 py-3 text-left rounded-lg transition-colors flex items-center justify-between
                ${listing.status === status
                  ? 'bg-indigo-50 text-indigo-700 font-medium'
                  : 'hover:bg-gray-50 text-gray-700'}
                ${isUpdatingStatus ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <span>
                {status === 'open' && t('statusOpen')}
                {status === 'matched' && t('statusMatched')}
                {status === 'closed' && t('statusClosed')}
              </span>
              {listing.status === status && (
                <Check className="w-5 h-5 text-indigo-600" />
              )}
            </button>
          ))}
        </div>
      </Modal>

      {/* 檢舉彈窗 */}
      {
        host && (
          <ReportModal
            isOpen={showReportModal}
            onClose={() => setShowReportModal(false)}
            reportedUserId={host.id}
            reportedUserName={host.username}
            listingId={listing.id}
          />
        )
      }

      {/* 分享彈窗 */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        url={typeof window !== 'undefined' ? window.location.href : `https://ticketticket.live/listing/${listing.id}`}
        title={listing.eventName}
        description={(() => {
          const ticketTypeLabels: Record<string, string> = {
            find_companion: `🎫 ${t('shareCompanion', { defaultValue: '尋找一起去的夥伴！' })}`,
            sub_ticket_transfer: `🎟️ ${t('shareTransfer', { defaultValue: '子票轉讓中！' })}`,
            ticket_exchange: `🔄 ${t('shareExchange', { defaultValue: '換票募集中！' })}`,
          };
          const typeText = ticketTypeLabels[listing.ticketType] || '';
          const dateText = `📅 ${formatDate(listing.eventDate)}`;
          const venueText = `📍 ${listing.venue}`;
          const seatText = listing.seatGrade ? `💺 ${listing.seatGrade}${t('shareSeatSuffix', { defaultValue: '席' })}` : '';
          const callToAction = `\n\n👉 ${t('shareCallToAction', { defaultValue: '快來看看詳情！' })}`;

          return [typeText, dateText, venueText, seatText].filter(Boolean).join('\n') + callToAction;
        })()}
      />

      {/* 訂閱彈窗 */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        eventId={events.find(e => e.name === listing.eventName)?.id}
        eventName={listing.eventName}
        seatGrades={(() => {
          // 從 events 中獲取該活動可用的座位等級
          const event = events.find(e => e.name === listing.eventName);
          if (event?.ticketPriceTiers) {
            const grades = [...new Set(event.ticketPriceTiers.map(tier => tier.seatGrade))];
            return grades;
          }
          return ['SS', 'S', 'A', 'B'];
        })()}
      />
    </div >
  );
}
