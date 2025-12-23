'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Tag, { TicketTypeTag } from '@/components/ui/Tag';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ReviewModal from '@/components/features/ReviewModal';
import { MessageCircle, Users, Clock, Check, X, Loader2, Undo2, MapPin, Star } from 'lucide-react';
import Link from 'next/link';
import { useNotification } from '@/contexts/NotificationContext';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';

interface User {
  id: string;
  username: string;
  avatar_url?: string;
  custom_avatar_url?: string;
  rating: number;
  review_count: number;
}

interface Listing {
  id: string;
  event_name: string;
  venue: string;
  host_id: string;
  host?: User;
  ticket_type?: 'find_companion' | 'sub_ticket_transfer' | 'ticket_exchange';
  ticket_count_type?: 'solo' | 'duo' | 'family';
  meeting_location?: string;
  seat_grade?: string;
  will_assist_entry?: boolean;
}

interface Application {
  id: string;
  listing_id: string;
  guest_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  message?: string;
  created_at: string;
  listing?: Listing;
  guest?: User;
}

interface Conversation {
  id: string;
  listing_id: string;
  host_id: string;
  guest_id: string;
  listing?: Listing;
  host?: User;
  guest?: User;
  otherUser?: User;
  lastMessage?: { content: string; created_at: string };
  unreadCount: number;
  conversation_type?: 'inquiry' | 'pending' | 'matched';
  isHost?: boolean;
  deadlineInfo?: {
    daysRemaining: number;
    isExpired: boolean;
  } | null;
}

interface PendingReview {
  conversationId: string;
  listingId: string;
  listing: {
    id: string;
    event_name: string;
    event_date: string;
    venue: string;
    ticket_type: string;
  };
  isHost: boolean;
  otherUser: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  completedAt: string;
  daysRemaining: number;
}

export default function MessagesPage() {
  const { data: session } = useSession();
  const t = useTranslations('messages');
  const { markAsRead } = useNotification();
  const supabase = useSupabaseClient();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [sentApplications, setSentApplications] = useState<Application[]>([]);
  const [receivedApplications, setReceivedApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [selectedWithdrawApp, setSelectedWithdrawApp] = useState<Application | null>(null);
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState<PendingReview | null>(null);

  const currentUserId = session?.user?.dbId;

  // 獲取對話和申請資料
  const fetchData = useCallback(async () => {
    if (!currentUserId) {
      setIsLoading(false);
      return;
    }

    try {
      // 並行獲取對話、申請和待評價
      const [convoRes, appRes, pendingRes] = await Promise.all([
        fetch('/api/conversations'),
        fetch('/api/applications'),
        fetch('/api/reviews/pending'),
      ]);

      if (convoRes.ok) {
        const convoData = await convoRes.json();
        setConversations(convoData);
      }

      if (appRes.ok) {
        const appData = await appRes.json();
        // 過濾掉已撤回的申請
        const activeSent = (appData.sent || []).filter(
          (app: Application) => app.status !== 'cancelled'
        );
        setSentApplications(activeSent);
        setReceivedApplications(appData.received || []);
      }

      if (pendingRes.ok) {
        const pendingData = await pendingRes.json();
        setPendingReviews(pendingData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchData();
    // 進入消息頁面時標記為已讀
    markAsRead();
  }, [fetchData, markAsRead]);

  // Supabase Realtime 訂閱 - 自動更新
  useEffect(() => {
    if (!currentUserId) return;

    // 訂閱 messages 變化（新訊息）
    const messagesChannel = supabase
      .channel('messages-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => {
          // 有新訊息時重新獲取數據
          fetchData();
        }
      )
      .subscribe();

    // 訂閱 applications 變化（新申請、狀態變更）
    const applicationsChannel = supabase
      .channel('applications-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'applications',
        },
        () => {
          // 申請狀態變化時重新獲取數據
          fetchData();
        }
      )
      .subscribe();

    // 訂閱 conversations 變化（新對話）
    const conversationsChannel = supabase
      .channel('conversations-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(applicationsChannel);
      supabase.removeChannel(conversationsChannel);
    };
  }, [currentUserId, supabase, fetchData]);

  // 待處理的申請（收到的）
  const pendingApplications = receivedApplications.filter(
    (app) => app.status === 'pending'
  );

  // 處理接受申請
  const handleAccept = async (applicationId: string) => {
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'accepted' }),
      });

      if (response.ok) {
        // 重新載入資料
        await fetchData();
      }
    } catch (error) {
      console.error('Error accepting application:', error);
    }
  };

  // 處理拒絕申請
  const handleReject = async (applicationId: string) => {
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' }),
      });

      if (response.ok) {
        // 重新載入資料
        await fetchData();
      }
    } catch (error) {
      console.error('Error rejecting application:', error);
    }
  };

  // 處理撤回申請
  const handleWithdraw = async () => {
    if (!selectedWithdrawApp) return;

    setWithdrawingId(selectedWithdrawApp.id);
    try {
      const response = await fetch(`/api/applications/${selectedWithdrawApp.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      if (response.ok) {
        await fetchData();
        setShowWithdrawModal(false);
        setSelectedWithdrawApp(null);
      }
    } catch (error) {
      console.error('Error withdrawing application:', error);
    } finally {
      setWithdrawingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header title={t('title')} />
        <div className="pt-14 flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header title={t('title')} />

      <div className="pt-20 pb-20 px-4 space-y-6">
        {/* 待處理申請 */}
        {pendingApplications.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('pending')}</h2>
              <span className="bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 text-xs font-medium px-2 py-0.5 rounded-full">
                {pendingApplications.length}
              </span>
            </div>

            <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
              {pendingApplications.map((app) => (
                <Card key={app.id}>
                  <div className="flex items-start gap-3">
                    <Avatar src={app.guest?.custom_avatar_url || app.guest?.avatar_url} size="lg" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{app.guest?.username}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{app.listing?.event_name}</p>
                      {app.message && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
                          「{app.message}」
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleReject(app.id)}
                    >
                      <X className="w-4 h-4 mr-1" />
                      {t('reject')}
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleAccept(app.id)}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      {t('accept')}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* 已配對對話 */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('conversations')}</h2>
          </div>

          {conversations.length > 0 ? (
            <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
              {conversations.map((convo) => {
                const isHost = convo.host_id === currentUserId;
                return (
                  <Link key={convo.id} href={`/chat/${convo.id}`}>
                    <Card hoverable className="flex items-center gap-3">
                      <Avatar src={convo.otherUser?.custom_avatar_url || convo.otherUser?.avatar_url} size="lg" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 dark:text-gray-100">{convo.otherUser?.username}</p>
                          <Tag variant={isHost ? 'purple' : 'info'} size="sm">
                            {isHost ? t('imHost') : t('imGuest')}
                          </Tag>
                          {convo.unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs font-medium px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                              {convo.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{convo.listing?.event_name}</p>
                        {/* 對話類型標籤 */}
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {convo.conversation_type === 'inquiry' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                              {t('typeInquiry', { defaultValue: '諮詢中' })}
                            </span>
                          )}
                          {convo.conversation_type === 'pending' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                              {t('typePending', { defaultValue: '申請中' })}
                            </span>
                          )}
                          {convo.conversation_type === 'matched' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                              {t('typeMatched', { defaultValue: '已配對' })}
                            </span>
                          )}
                          {/* 角色標籤 - 顯示對方的身份 */}
                          {convo.isHost ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                              {t('otherIsApplicant', { defaultValue: '對方：申請者' })}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                              {t('otherIsHost', { defaultValue: '對方：主辦方' })}
                            </span>
                          )}
                          {/* 協助入場標籤 */}
                          {convo.listing?.ticket_type === 'find_companion' && convo.listing?.will_assist_entry && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              {t('willAssistEntry', { defaultValue: '可協助入場' })}
                            </span>
                          )}
                          {/* 票種資訊標籤 */}
                          {convo.listing?.ticket_count_type && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                              {convo.listing.ticket_count_type === 'solo' ? '一人票' : convo.listing.ticket_count_type === 'duo' ? '二人票' : '家庭票'}
                            </span>
                          )}
                          {convo.listing?.seat_grade && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                              {convo.listing.seat_grade}
                            </span>
                          )}
                        </div>
                        {convo.lastMessage && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-1">
                            {convo.lastMessage.content}
                          </p>
                        )}
                      </div>
                      <MessageCircle className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">{t('noConversations')}</p>
              <Link
                href="/"
                className="text-indigo-500 dark:text-indigo-400 font-medium mt-2 inline-block"
              >
                {t('goExplore')}
              </Link>
            </div>
          )}
        </section>

        {/* 我的申請狀態 */}
        {sentApplications.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('myApplications')}</h2>
            </div>

            <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
              {sentApplications.map((app) => (
                <Card key={app.id}>
                  {/* 標題行：活動名稱 + 申請狀態 */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                      {app.listing?.event_name}
                    </p>
                    <Tag
                      variant={
                        app.status === 'pending'
                          ? 'warning'
                          : app.status === 'accepted'
                            ? 'success'
                            : app.status === 'cancelled'
                              ? 'default'
                              : 'error'
                      }
                    >
                      {app.status === 'pending' && t('waiting')}
                      {app.status === 'accepted' && t('accepted')}
                      {app.status === 'rejected' && t('rejected')}
                      {app.status === 'cancelled' && t('cancelled')}
                    </Tag>
                  </div>

                  {/* 詳細資訊 */}
                  <div className="flex items-start gap-3">
                    {/* 主辦方頭像 */}
                    {app.listing?.host && (
                      <Avatar src={app.listing.host.custom_avatar_url || app.listing.host.avatar_url} size="md" className="flex-shrink-0" />
                    )}

                    <div className="flex-1 min-w-0 space-y-1.5">
                      {/* 票種類型 */}
                      <div className="flex flex-wrap items-center gap-2">
                        {app.listing?.ticket_type && (
                          <TicketTypeTag type={app.listing.ticket_type} size="sm" />
                        )}
                        {/* 主辦方名稱 */}
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {app.listing?.host?.username}
                        </span>
                      </div>

                      {/* 座位等級 + 價格 */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                        {app.listing?.seat_grade && (
                          <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                            {app.listing.seat_grade}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 撤回按鈕 - 只在 pending 狀態顯示 */}
                  {app.status === 'pending' && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <Button
                        variant="secondary"
                        size="sm"
                        fullWidth
                        onClick={() => {
                          setSelectedWithdrawApp(app);
                          setShowWithdrawModal(true);
                        }}
                        loading={withdrawingId === app.id}
                      >
                        <Undo2 className="w-4 h-4 mr-1" />
                        {t('withdraw')}
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* 待評價的已完成活動 */}
        {pendingReviews.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-yellow-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('pendingReviews')}</h2>
              <span className="bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-400 text-xs font-medium px-2 py-0.5 rounded-full">
                {pendingReviews.length}
              </span>
            </div>

            <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
              {pendingReviews.map((review) => (
                <Card key={review.conversationId}>
                  <div className="flex items-start gap-3">
                    <Avatar src={review.otherUser.avatarUrl} size="lg" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100">{review.otherUser.username}</p>
                        <Tag variant={review.isHost ? 'purple' : 'info'} size="sm">
                          {review.isHost ? t('imHost') : t('imGuest')}
                        </Tag>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{review.listing.event_name}</p>
                      {review.daysRemaining > 0 && (
                        <p className="text-xs text-orange-500 mt-1">
                          {t('autoReviewIn', { days: review.daysRemaining })}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <Button
                      fullWidth
                      size="sm"
                      onClick={() => {
                        setSelectedReview(review);
                        setShowReviewModal(true);
                      }}
                    >
                      <Star className="w-4 h-4 mr-1" />
                      {t('writeReview')}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* 撤回確認 Modal */}
      <Modal
        isOpen={showWithdrawModal}
        onClose={() => {
          setShowWithdrawModal(false);
          setSelectedWithdrawApp(null);
        }}
        title={t('withdrawConfirmTitle')}
      >
        <div className="p-4">
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {t('withdrawConfirmMessage')}
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                setShowWithdrawModal(false);
                setSelectedWithdrawApp(null);
              }}
            >
              {t('cancel')}
            </Button>
            <Button
              fullWidth
              onClick={handleWithdraw}
              loading={withdrawingId !== null}
              className="bg-red-600 hover:bg-red-700"
            >
              {t('confirmWithdraw')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 評價彈窗 */}
      {selectedReview && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedReview(null);
          }}
          listingId={selectedReview.listingId}
          reviewableUsers={[{
            id: selectedReview.otherUser.id,
            username: selectedReview.otherUser.username,
            avatar_url: selectedReview.otherUser.avatarUrl,
          }]}
          isHost={selectedReview.isHost}
          onSubmitSuccess={() => {
            setShowReviewModal(false);
            setSelectedReview(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
