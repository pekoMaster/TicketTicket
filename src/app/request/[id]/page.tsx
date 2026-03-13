'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useApp } from '@/contexts/AppContext';
import { useTranslations, useFormatter } from 'next-intl';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdmin } from '@/contexts/AdminContext';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/Card';
import GlassCard from '@/components/ui/GlassCard';
import AuroraBackground from '@/components/ui/AuroraBackground';
import Modal from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Input';
import Avatar from '@/components/ui/Avatar';
import StarRating from '@/components/ui/StarRating';
import SafetyBanner from '@/components/ui/SafetyBanner';
import AgreementModal from '@/components/ui/AgreementModal';
import {
  Calendar,
  AlertTriangle,
  Ticket,
  MessageCircle,
  Check,
  Loader2,
  Trash2,
  MoreVertical,
  Flag,
  Share2,
  MapPin,
  Globe2,
  Users,
} from 'lucide-react';
import ReportModal from '@/components/ui/ReportModal';
import ShareModal from '@/components/ui/ShareModal';
import { TicketType } from '@/types';

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { requests, fetchRequests } = useApp();
  const t = useTranslations('request');
  const tTicket = useTranslations('ticketType');
  const tCommon = useTranslations('common');
  const tApply = useTranslations('apply');
  const { locale } = useLanguage();
  const format = useFormatter();
  const { events } = useAdmin();

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showApplyAgreement, setShowApplyAgreement] = useState(false);
  const [applyMessage, setApplyMessage] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [isCheckingApplication, setIsCheckingApplication] = useState(true);

  // Host management states
  const [showHostMenu, setShowHostMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Report and Share
  const [showReportModal, setShowReportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Find the request and event
  const request = requests.find((r) => r.id === params.id);
  const event = events.find(e => e.name === request?.eventName || e.id === request?.eventId);
  const user = request?.user;
  const currentUserId = session?.user?.dbId;

  // Check if current user is the creator
  const isCreator = request?.userId === currentUserId;

  // Initial fetch if requests are empty
  useEffect(() => {
    if (requests.length === 0) {
      fetchRequests(true);
    }
  }, [requests.length, fetchRequests]);

  // Check if user has already replied/applied to this request
  const checkApplication = useCallback(async () => {
    if (!currentUserId || !request) {
      setIsCheckingApplication(false);
      return;
    }

    try {
      const response = await fetch(`/api/applications`);
      if (response.ok) {
        // Here we just use a generic fetch if we haven't tracked request applications specifically.
        // Wait, the API for request applications isn't exported into a global GET /applications yet.
        // We can just rely on the API returning 409 Conflict if already applied.
        // For accurate UI, we might want an endpoint or just ignore the "hasApplied" state and let the API reject it.
        // For now, assume not applied until they try, but typically if they applied, they can see it in messages.
        setHasApplied(false);
      }
    } catch (error) {
      console.error('Error checking application:', error);
    } finally {
      setIsCheckingApplication(false);
    }
  }, [currentUserId, request]);

  useEffect(() => {
    checkApplication();
  }, [checkApplication]);

  // Translate ticket types
  const getTicketTypeInfo = (type: TicketType) => {
    const typeMapping: Record<TicketType, { labelKey: string }> = {
      find_companion: { labelKey: 'findCompanion' },
      sub_ticket_transfer: { labelKey: 'subTicketTransfer' },
      ticket_exchange: { labelKey: 'ticketExchange' },
    };
    const { labelKey } = typeMapping[type];
    return {
      label: tTicket(labelKey),
      color: type === 'find_companion' ? 'from-blue-500 to-cyan-500' :
             type === 'sub_ticket_transfer' ? 'from-purple-500 to-pink-500' : 'from-orange-500 to-amber-500'
    };
  };

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
         <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Handle Contact / Apply
  const handleApply = async () => {
    if (!currentUserId || isApplying) return;

    setIsApplying(true);

    try {
      const response = await fetch(`/api/requests/${request.id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: applyMessage || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setHasApplied(true);
        setShowApplyModal(false);
        if (data.conversationId) {
          router.push(`/chat/${data.conversationId}`);
        } else {
          alert('聯絡成功！'); // Success
        }
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

  // Handle Delete Request (for creator)
  const handleDelete = async () => {
    if (!isCreator) return;
    setIsDeleting(true);
    try {
      const resp = await fetch(`/api/requests/${request.id}`, { method: 'DELETE' });
      if (resp.ok) {
        setShowDeleteModal(false);
        // Remove locally from state if needed, or re-fetch
        fetchRequests(true);
        router.push('/profile');
      } else {
        alert('刪除失敗');
      }
    } catch (e) {
      console.error(e);
      alert('刪除失敗');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative">
      <AuroraBackground />
      <Header
        title={t('viewDetails')}
        showBack
        rightAction={isCreator ? (
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
                      setShowDeleteModal(true);
                    }}
                    className="w-full px-4 py-2.5 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    {tCommon('delete')}
                  </button>
                </div>
              </>
            )}
          </div>
        ) : undefined}
      />

      <div className="relative z-10 pt-20 pb-32 max-w-3xl mx-auto px-4">
        <GlassCard className="mb-6">
          <div className="mb-4">
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white font-semibold bg-gradient-to-r from-pink-500 to-purple-500 shadow-lg`}>
              <span className="text-xl">🙋</span>
              {t('title')}
            </span>
          </div>

          <div className="flex items-start justify-between gap-3 mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{request.eventName}</h1>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowShareModal(true)}
                className="flex-shrink-0 p-2 rounded-lg text-gray-400 dark:text-gray-400 hover:text-pink-500 hover:bg-pink-50 transition-all"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700 dark:text-blue-200">
                  <p className="font-medium">{t('requestInfo')}</p>
                  <p className="text-blue-600 dark:text-blue-300/80 mt-1">
                    {t('requestInfoDesc')}
                  </p>
                </div>
              </div>

              {/* Event Date & Venue */}
              {(event?.eventDate || event?.venue) && (
                <div className="pt-3 mt-1 border-t border-blue-200/50 dark:border-blue-500/20 flex flex-wrap gap-x-6 gap-y-2">
                  {event.eventDate && (
                    <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      <span>{format.dateTime(new Date(event.eventDate), { dateStyle: 'long', timeStyle: 'short' })}</span>
                    </div>
                  )}
                  {event.venue && (
                    <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      <span>{event.venue}</span>
                    </div>
                  )}
                </div>
              )}
          </div>
        </GlassCard>

        {/* Request Details */}
        <div className="px-4 py-4">
          <GlassCard title={t('quantityAndNotes')} icon={Ticket}>
            <div className="space-y-3">
              {/* Needs amount */}
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">{t('quantityLabel')}</span>
                <span className="font-bold text-gray-900 dark:text-gray-100 text-lg">{t('needs', { count: request.quantity })}</span>
              </div>
              
              {/* Accepted Types */}
              {request.acceptedTypes && request.acceptedTypes.length > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">{t('acceptedLabel')}</span>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {request.acceptedTypes.map((type) => {
                      const info = getTicketTypeInfo(type);
                      return (
                        <span key={type} className={`px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-gradient-to-r ${info.color}`}>
                          {info.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Wanted Seats */}
              {request.seatGrades && request.seatGrades.length > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">{t('seatGradeLabel')}</span>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {request.seatGrades.map((grade) => (
                      <span key={grade} className="px-2 py-0.5 rounded text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                        {grade}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Preferences (Source, Nationality, Language) */}
              {(request.ticketSource || request.requesterNationality || (request.requesterLanguages && request.requesterLanguages.length > 0)) && (
                <div className="pt-3 mt-1 border-t border-gray-100 dark:border-gray-700 space-y-3">
                  {request.ticketSource && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-gray-400 text-xs">{tCommon('ticketSource')}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-500/20">
                        🎫 {request.ticketSource === 'zaiko' ? 'ZAIKO' : 'LAWSON'}
                      </span>
                    </div>
                  )}
                  {request.requesterNationality && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-gray-400 text-xs">{tCommon('nationality')}</span>
                      <span className="text-xs font-medium flex items-center gap-1 text-gray-700 dark:text-gray-300">
                        <Globe2 className="w-3 h-3 text-blue-500" />
                        {tCommon(`nationalities.${request.requesterNationality}`, { defaultValue: request.requesterNationality })}
                      </span>
                    </div>
                  )}
                  {request.requesterLanguages && request.requesterLanguages.length > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-gray-400 text-xs">{tCommon('languages')}</span>
                      <div className="flex flex-wrap gap-1 justify-end">
                        {request.requesterLanguages.map(l => (
                          <span key={l} className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50">
                            {tCommon(`languagesList.${l}`, { defaultValue: l })}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Description / Notes */}
        {request.description && (
          <div className="px-4 pb-4">
            <GlassCard>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">{t('notesLabel')}</h3>
              <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{request.description}</p>
            </GlassCard>
          </div>
        )}

        {/* User Info */}
        {user && (
          <div className="px-4 pb-4">
            <GlassCard>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900 dark:text-white">{t('requester')}</h3>
                 {!isCreator && session?.user && (
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    title={tCommon('report')}
                  >
                    <Flag className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex items-start gap-4">
                <Avatar src={user.customAvatarUrl || user.avatarUrl} size="lg" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100">{user.username}</p>
                  <Link href={`/reviews/${user.id}`} className="inline-block hover:opacity-80 transition-opacity">
                    <StarRating value={user.rating} readonly size="sm" showValue totalReviews={user.reviewCount} />
                  </Link>
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        <div className="px-4 pb-4">
          <SafetyBanner variant="listing" />
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-200/50 dark:border-white/10 px-4 py-4 safe-area-bottom">
        <div className="max-w-3xl mx-auto">
          {isCreator ? (
             <div className="flex-1 py-3.5 px-6 rounded-xl font-semibold bg-gray-200 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 flex items-center justify-center">
               {t('yourRequest')}
             </div>
          ) : hasApplied ? (
            <div className="flex gap-3">
               <div className="flex-1 py-3.5 px-6 rounded-xl font-semibold bg-gray-200 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
                 <Check className="w-5 h-5" />
                 {t('contacted')}
               </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => setShowApplyAgreement(true)}
                className="flex-1 py-3.5 px-6 rounded-xl font-semibold bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                {t('iCanHelp')}
              </button>
            </div>
          )}
        </div>
      </div>

      <AgreementModal
        isOpen={showApplyAgreement}
        onAgree={() => {
          setShowApplyAgreement(false);
          setShowApplyModal(true);
        }}
        onCancel={() => setShowApplyAgreement(false)}
        variant="apply"
      />

      <Modal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        title={t('contactRequester')}
      >
        <div className="p-4">
          <div className="mb-4">
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              {t('contactConfirmDesc', { username: user?.username || tCommon('defaultUser'), eventName: request.eventName })}
            </p>
          </div>
          <Textarea
            label={tApply('intro')}
            placeholder={tApply('introPlaceholder')}
            value={applyMessage}
            onChange={(e) => setApplyMessage(e.target.value)}
            rows={4}
            maxLength={200}
          />
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setShowApplyModal(false)}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {tCommon('cancel')}
            </button>
            <button
              onClick={handleApply}
              disabled={isApplying}
              className="flex-1 px-4 py-2.5 rounded-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
            >
              {isApplying ? <Loader2 className="w-5 h-5 animate-spin" /> : tCommon('sendMessage')}
            </button>
          </div>
        </div>
      </Modal>

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          reportedUserId={user?.id || ''}
          reportedUserName={user?.username || ''}
        />
      )}

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          title={request.eventName}
          url={typeof window !== 'undefined' ? window.location.href : ''}
        />
      )}
      
      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={t('deleteRequest')}
      >
        <div className="p-4 text-center">
           <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
           <p className="text-gray-600 dark:text-gray-300 mb-6">{t('deleteConfirm')}</p>
           <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-[1] px-4 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                {tCommon('cancel')}
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-[2] px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center justify-center disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="animate-spin w-5 h-5" /> : tCommon('confirmDelete')}
              </button>
           </div>
        </div>
      </Modal>
    </div>
  );
}
