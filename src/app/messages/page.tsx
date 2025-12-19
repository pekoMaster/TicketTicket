'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Tag from '@/components/ui/Tag';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { MessageCircle, Users, Clock, Check, X, Loader2, Undo2 } from 'lucide-react';
import Link from 'next/link';

interface User {
  id: string;
  username: string;
  avatar_url?: string;
  rating: number;
  review_count: number;
}

interface Listing {
  id: string;
  event_name: string;
  venue: string;
  host_id: string;
  host?: User;
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
}

export default function MessagesPage() {
  const { data: session } = useSession();
  const t = useTranslations('messages');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [sentApplications, setSentApplications] = useState<Application[]>([]);
  const [receivedApplications, setReceivedApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [selectedWithdrawApp, setSelectedWithdrawApp] = useState<Application | null>(null);

  const currentUserId = session?.user?.dbId;

  // 獲取對話和申請資料
  const fetchData = useCallback(async () => {
    if (!currentUserId) {
      setIsLoading(false);
      return;
    }

    try {
      // 並行獲取對話和申請
      const [convoRes, appRes] = await Promise.all([
        fetch('/api/conversations'),
        fetch('/api/applications'),
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
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

      <div className="pt-14 pb-20 px-4 py-6 space-y-6">
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
                    <Avatar src={app.guest?.avatar_url} size="lg" />
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
                      <Avatar src={convo.otherUser?.avatar_url} size="lg" />
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
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {app.listing?.event_name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {app.listing?.venue}
                      </p>
                    </div>
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
      </div>
    </div>
  );
}
