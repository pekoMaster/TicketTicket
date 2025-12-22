'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import Header from '@/components/layout/Header';
import SafetyBanner from '@/components/ui/SafetyBanner';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Tag from '@/components/ui/Tag';
import ReviewModal from '@/components/features/ReviewModal';
import ReportModal from '@/components/ui/ReportModal';
import HelpModal from '@/components/ui/HelpModal';
import CancellationModal from '@/components/ui/CancellationModal';
import BlockUserModal from '@/components/ui/BlockUserModal';
import { Send, Calendar, MapPin, Clock, Ticket, Tag as TagIcon, Loader2, Languages, CheckCircle, Circle, Star, Flag, Armchair, HelpCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useLanguage } from '@/contexts/LanguageContext';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

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
  event_date: string;
  venue: string;
  asking_price_jpy: number;
  meeting_location: string;
  meeting_time: string;
  ticket_type: string;
  ticket_count_type: string;
  seat_grade?: string;
  will_assist_entry?: boolean;
  status: string;
}

interface ConversationData {
  conversation: {
    id: string;
    listing_id: string;
    host_id: string;
    guest_id: string;
    listing: Listing;
    host: User;
    guest: User;
    otherUser: User;
    isHost: boolean;
    // 票券驗證狀態
    hostConfirmedAt: string | null;
    guestConfirmedAt: string | null;
    bothConfirmed: boolean;
    // 7天期限資訊
    deadlineInfo?: {
      deadlineAt: string;
      daysRemaining: number;
      isExpired: boolean;
      autoCompleted: boolean;
      completedAt: string | null;
    } | null;
    // 對話類型：inquiry(提問) -> pending(申請中) -> matched(已配對)
    conversationType?: 'inquiry' | 'pending' | 'matched';
    // 取消同行狀態
    cancellation_status?: 'pending' | 'rejected' | 'cancelled' | 'escalated' | null;
    cancellation_requested_by?: string | null;
    cancellation_reason?: string | null;
  };
  messages: Message[];
}

export default function ChatPage() {
  const params = useParams();
  const { data: session } = useSession();
  const supabase = useSupabaseClient();
  const conversationId = params.id as string;
  const tCommon = useTranslations('common');
  const tListing = useTranslations('listing');
  const tChat = useTranslations('chat');
  const tVerification = useTranslations('verification');

  const [conversationData, setConversationData] = useState<ConversationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [translatingIds, setTranslatingIds] = useState<Set<string>>(new Set());
  const [isConfirming, setIsConfirming] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showApplyConfirm, setShowApplyConfirm] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  // New modal states
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [cancellationMode, setCancellationMode] = useState<'request' | 'respond'>('request');
  const [showBlockModal, setShowBlockModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { locale } = useLanguage();
  const router = useRouter();

  // 處理申請加入
  const handleApply = async () => {
    if (isApplying) return;
    setIsApplying(true);

    try {
      const response = await fetch(`/api/conversations/${conversationId}/apply`, {
        method: 'POST',
      });

      if (response.ok) {
        // 更新對話類型
        setConversationData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            conversation: {
              ...prev.conversation,
              conversationType: 'pending',
            },
          };
        });
        setShowApplyConfirm(false);
      } else {
        const data = await response.json();
        if (data.error === 'EMAIL_VERIFICATION_REQUIRED') {
          alert(tChat('emailVerificationRequired', { defaultValue: '需要先驗證 Email 才能申請' }));
        }
      }
    } catch (error) {
      console.error('Error applying:', error);
    } finally {
      setIsApplying(false);
    }
  };

  // 處理同意申請
  const handleAccept = async () => {
    if (isAccepting) return;
    setIsAccepting(true);

    try {
      const response = await fetch(`/api/conversations/${conversationId}/accept`, {
        method: 'POST',
      });

      if (response.ok) {
        // 重新獲取完整對話資料（包含 deadlineInfo 等新創建的資料）
        await fetchConversation();
      }
    } catch (error) {
      console.error('Error accepting:', error);
    } finally {
      setIsAccepting(false);
    }
  };

  // 處理確認票券
  const handleConfirm = async (action: 'confirm' | 'cancel') => {
    if (isConfirming) return;
    setIsConfirming(true);

    try {
      const response = await fetch(`/api/conversations/${conversationId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        const data = await response.json();
        // 更新對話狀態
        setConversationData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            conversation: {
              ...prev.conversation,
              hostConfirmedAt: data.conversation.hostConfirmedAt,
              guestConfirmedAt: data.conversation.guestConfirmedAt,
              bothConfirmed: data.conversation.bothConfirmed,
            },
          };
        });

        // 如果雙方都確認了，自動顯示評價視窗
        if (data.conversation.bothConfirmed) {
          setShowReviewModal(true);
        }
      }
    } catch (error) {
      console.error('Error confirming ticket:', error);
    } finally {
      setIsConfirming(false);
    }
  };

  // 獲取對話資料
  const fetchConversation = useCallback(async () => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`);
      if (response.ok) {
        const data = await response.json();

        setConversationData((prev) => {
          // 如果沒有舊資料，直接使用新資料
          if (!prev) return data;

          // 保留正在發送的臨時訊息 (optimistic updates)
          const pendingMessages = prev.messages.filter(m => m.id.startsWith('temp-'));

          // 如果沒有臨時訊息，直接使用新資料
          if (pendingMessages.length === 0) return data;

          // 如果有臨時訊息，確保它們不會被覆蓋，同時避免重複
          // 這裡假設後端回傳的訊息不包含 temp- 開頭的 ID
          return {
            ...data,
            messages: [...data.messages, ...pendingMessages]
          };
        });
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  // 輪詢機制 (取代不可用的 Realtime)
  useEffect(() => {
    if (!conversationId) return;

    // 初始載入
    fetchConversation();

    const pollInterval = setInterval(() => {
      // 只有在視窗可見時才更新，節省資源
      if (document.visibilityState === 'visible') {
        fetchConversation();
      }
    }, 4000); // 每 4 秒更新一次

    return () => clearInterval(pollInterval);
  }, [conversationId, fetchConversation]);

  // Supabase Realtime 訂閱
  useEffect(() => {
    if (!conversationId || !session?.user?.dbId) return;

    const currentUserId = session.user.dbId;

    // 訂閱此對話的新訊息
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // 收到新訊息時，加入到訊息列表
          const newMessage = payload.new as Message;

          // 如果是自己發送的訊息，忽略（已經透過樂觀更新處理了）
          if (newMessage.sender_id === currentUserId) {
            // 只需要更新臨時訊息的 ID
            setConversationData((prev) => {
              if (!prev) return prev;
              // 檢查是否已經有這個真實 ID
              const existsReal = prev.messages.some((m) => m.id === newMessage.id);
              if (existsReal) return prev;

              // 找到對應的臨時訊息（相同內容且時間接近）
              const tempIndex = prev.messages.findIndex((m) =>
                m.id.startsWith('temp-') &&
                m.content === newMessage.content &&
                m.sender_id === newMessage.sender_id
              );

              if (tempIndex !== -1) {
                // 替換臨時訊息
                const newMessages = [...prev.messages];
                newMessages[tempIndex] = newMessage;
                return { ...prev, messages: newMessages };
              }

              return prev;
            });
            return;
          }

          // 對方發送的訊息，正常加入
          setConversationData((prev) => {
            if (!prev) return prev;
            // 避免重複加入
            const exists = prev.messages.some((m) => m.id === newMessage.id);
            if (exists) return prev;
            return {
              ...prev,
              messages: [...prev.messages, newMessage],
            };
          });
        }
      )
      .subscribe();

    // 清理訂閱
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, supabase, session?.user?.dbId]);

  // 滾動到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversationData?.messages]);

  // 翻譯訊息
  const handleTranslate = async (messageId: string, text: string) => {
    if (translatingIds.has(messageId) || translations[messageId]) return;

    setTranslatingIds(prev => new Set(prev).add(messageId));

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLang: locale }),
      });

      if (response.ok) {
        const data = await response.json();
        setTranslations(prev => ({ ...prev, [messageId]: data.translatedText }));
      }
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setTranslatingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(messageId);
        return newSet;
      });
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-TW', {
      month: 'short',
      day: 'numeric',
    });
  };

  const handleSend = async () => {
    if (!inputMessage.trim() || isSending || !session?.user?.dbId) return;

    const messageContent = inputMessage.trim();
    setInputMessage('');
    setIsSending(true);

    // 樂觀更新：立即顯示訊息
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: session.user.dbId,
      content: messageContent,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    setConversationData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        messages: [...prev.messages, optimisticMessage],
      };
    });

    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: messageContent }),
      });

      if (response.ok) {
        const data = await response.json();
        // 用真實訊息替換臨時訊息
        setConversationData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: prev.messages.map((m) =>
              m.id === tempId ? data : m
            ),
          };
        });
      } else {
        // 發送失敗，移除臨時訊息
        setConversationData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: prev.messages.filter((m) => m.id !== tempId),
          };
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // 發送失敗，移除臨時訊息
      setConversationData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: prev.messages.filter((m) => m.id !== tempId),
        };
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!conversationData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">{tChat('notFound')}</p>
      </div>
    );
  }

  const { conversation, messages } = conversationData;
  const { listing, otherUser } = conversation;
  const currentUserId = session?.user?.dbId;
  const conversationType = conversation.conversationType || 'inquiry';
  const isMatched = conversationType === 'matched';
  const isPending = conversationType === 'pending';
  const isInquiry = conversationType === 'inquiry';

  // 檢查是否有待處理的取消請求需要回應（不使用 useEffect 來避免 hooks 規則問題）
  const hasPendingCancellation = conversation?.cancellation_status === 'pending';
  const isRequester = conversation?.cancellation_requested_by === currentUserId;
  const shouldShowCancellationPrompt = hasPendingCancellation && !isRequester && currentUserId;

  // 注意：自動顯示取消請求回應彈窗的邏輯已移至下方的 JSX 渲染中處理

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <Header
        title={otherUser ? tCommon('chatWith', { name: otherUser.username }) : tCommon('chat')}
        showBack
        rightAction={
          otherUser && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowHelpModal(true)}
                className="p-2 text-gray-500 hover:text-indigo-500 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
                title={tCommon('help', { defaultValue: '幫助' })}
              >
                <HelpCircle className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowReportModal(true)}
                className="p-2 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                title={tCommon('report')}
              >
                <Flag className="w-5 h-5" />
              </button>
            </div>
          )
        }
      />

      <div className="flex-1 flex flex-col pt-14">
        {/* 安全警告 - 只在已配對時顯示 */}
        {isMatched && (
          <div className="px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
            <SafetyBanner variant="chat" />
          </div>
        )}

        {/* 取消請求待處理通知 - 給收到請求的一方 */}
        {shouldShowCancellationPrompt && (
          <div className="px-4 py-3 bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  {tChat('cancellationPending', { defaultValue: '對方希望取消同行' })}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-300 mt-0.5">
                  {conversation?.cancellation_reason}
                </p>
              </div>
              <button
                onClick={() => {
                  setCancellationMode('respond');
                  setShowCancellationModal(true);
                }}
                className="px-3 py-1.5 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors"
              >
                {tChat('respond', { defaultValue: '回應' })}
              </button>
            </div>
          </div>
        )}

        {/* 交易資訊區塊 */}
        <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 border-b border-indigo-100 dark:border-indigo-800">
          {/* 活動名稱 */}
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
            <Ticket className="w-4 h-4 text-indigo-500" />
            {listing.event_name}
          </h3>

          {/* 詳細資訊 */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            {/* 集合時間 */}
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
              <span className="truncate">{listing.meeting_time || formatDate(listing.event_date)}</span>
            </div>

            {/* 集合地點 */}
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
              <span className="truncate">{listing.meeting_location}</span>
            </div>

            {/* 座位等級 */}
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <Armchair className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
              <span className="text-gray-500 dark:text-gray-400">{tChat('labels.seatGrade')}:</span>
              <span className="truncate font-medium text-gray-900 dark:text-gray-100">{listing.seat_grade || tChat('seatGrade.unknown')}</span>
            </div>

            {/* 票種類型 (幾人票) */}
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <TagIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
              <span className="text-gray-500 dark:text-gray-400">{tChat('labels.ticketCount')}:</span>
              <Tag
                variant={listing.ticket_count_type === 'solo' ? 'default' : listing.ticket_count_type === 'duo' ? 'info' : 'purple'}
                size="sm"
              >
                {tChat(`ticketCount.${listing.ticket_count_type || 'duo'}`)}
              </Tag>
            </div>

            {/* 刊登類型 */}
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <Ticket className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
              <span className="text-gray-500 dark:text-gray-400">{tChat('labels.listingType')}:</span>
              <Tag
                variant={
                  listing.ticket_type === 'find_companion' ? 'success' :
                    listing.ticket_type === 'ticket_exchange' ? 'warning' : 'info'
                }
                size="sm"
              >
                {tChat(`listingType.${listing.ticket_type || 'find_companion'}`)}
              </Tag>
            </div>
          </div>


        </div>

        {/* 票券驗證區塊 - 只在已配對時顯示 */}
        {isMatched && (
          <div className="px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                {tVerification('title')}
              </h4>
              {/* 7天期限倒數 */}
              {conversation.deadlineInfo && !conversation.bothConfirmed && (
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${conversation.deadlineInfo.daysRemaining <= 2
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                  }`}>
                  <Clock className="w-3 h-3" />
                  {tVerification('daysRemaining', {
                    days: conversation.deadlineInfo.daysRemaining,
                    defaultValue: `剩餘 ${conversation.deadlineInfo.daysRemaining} 天`
                  })}
                </div>
              )}
            </div>

            {/* 7天自動完成提示 */}
            {conversation.deadlineInfo && !conversation.bothConfirmed && (
              <div className="mb-3 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-xs text-blue-700 dark:text-blue-300">
                {tVerification('autoCompleteHint', {
                  defaultValue: '配對後 7 天內未確認將自動視為同行成功，系統會自動給予雙方 5 星好評。'
                })}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {/* 主辦方確認狀態 */}
              <div className={`p-3 rounded-lg border ${conversation.hostConfirmedAt
                ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                : 'bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600'
                }`}>
                <div className="flex items-center gap-2 mb-1">
                  {conversation.hostConfirmedAt ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Circle className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {tVerification('hostStatus')}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {conversation.hostConfirmedAt
                    ? tVerification('ticketGiven')
                    : tVerification('waitingHost')
                  }
                </p>
                {conversation.isHost && !conversation.bothConfirmed && (
                  <Button
                    size="sm"
                    className="mt-2 w-full"
                    onClick={() => handleConfirm(conversation.hostConfirmedAt ? 'cancel' : 'confirm')}
                    variant={conversation.hostConfirmedAt ? 'secondary' : 'primary'}
                    disabled={isConfirming}
                  >
                    {isConfirming ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : conversation.hostConfirmedAt ? (
                      tVerification('cancelConfirm')
                    ) : (
                      tVerification('confirmGiven')
                    )}
                  </Button>
                )}
              </div>

              {/* 申請人確認狀態 */}
              <div className={`p-3 rounded-lg border ${conversation.guestConfirmedAt
                ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                : 'bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600'
                }`}>
                <div className="flex items-center gap-2 mb-1">
                  {conversation.guestConfirmedAt ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Circle className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {tVerification('guestStatus')}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {conversation.guestConfirmedAt
                    ? tVerification('ticketReceived')
                    : tVerification('waitingGuest')
                  }
                </p>
                {!conversation.isHost && !conversation.bothConfirmed && (
                  <Button
                    size="sm"
                    className="mt-2 w-full"
                    onClick={() => handleConfirm(conversation.guestConfirmedAt ? 'cancel' : 'confirm')}
                    variant={conversation.guestConfirmedAt ? 'secondary' : 'primary'}
                    disabled={isConfirming}
                  >
                    {isConfirming ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : conversation.guestConfirmedAt ? (
                      tVerification('cancelConfirm')
                    ) : (
                      tVerification('confirmReceived')
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* 雙方都確認後顯示成功訊息和評價按鈕 */}
            {conversation.bothConfirmed && (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-700 dark:text-green-300 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {tVerification('completed')}
                </p>
                <Button
                  size="sm"
                  onClick={() => window.location.href = `/listing/${conversation.listing_id}`}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Star className="w-4 h-4" />
                  {tVerification('writeReview')}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* 訊息區域 */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 dark:text-gray-500 text-sm">{tChat('startConversation')}</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === currentUserId;
              const sender = isMe
                ? (conversation.isHost ? conversation.host : conversation.guest)
                : otherUser;

              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}
                >
                  {!isMe && <Avatar src={sender?.custom_avatar_url || sender?.avatar_url} size="sm" />}

                  <div
                    className={`
                      max-w-[70%] rounded-2xl px-4 py-2
                      ${isMe
                        ? 'bg-indigo-500 text-white rounded-tr-sm'
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-sm shadow-sm'}
                    `}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    {/* 翻譯結果 */}
                    {translations[msg.id] && (
                      <div className={`mt-2 pt-2 border-t ${isMe ? 'border-indigo-400' : 'border-gray-200 dark:border-gray-600'}`}>
                        <p className={`text-xs mb-1 ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                          {tChat('translated')}
                        </p>
                        <p className="text-sm whitespace-pre-wrap">{translations[msg.id]}</p>
                      </div>
                    )}
                    <p className={`text-xs mt-1 ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                      {formatTime(msg.created_at)}
                    </p>
                  </div>

                  {/* 翻譯按鈕 - 只有接收方才顯示，放在對話框外右側 */}
                  {!isMe && !translations[msg.id] && (
                    <button
                      onClick={() => handleTranslate(msg.id, msg.content)}
                      disabled={translatingIds.has(msg.id)}
                      className={`
                        p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
                        text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                        ${translatingIds.has(msg.id) ? 'opacity-50' : ''}
                      `}
                      title={tChat('translate')}
                    >
                      {translatingIds.has(msg.id) ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Languages className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 輸入區域 */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 px-4 py-3 pb-6 safe-area-bottom">
          {/* 申請人在 pending 狀態時顯示提示 */}
          {isPending && !conversation.isHost && (
            <div className="mb-3 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-sm text-amber-700 dark:text-amber-300 text-center">
              {tChat('pendingStatus', { defaultValue: '申請中，等待主辦方回覆' })}
            </div>
          )}

          {/* 主辦方在 pending 狀態時顯示同意按鈕 */}
          {isPending && conversation.isHost && (
            <div className="mb-3">
              <Button
                variant="primary"
                className="w-full"
                onClick={handleAccept}
                disabled={isAccepting}
              >
                {isAccepting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                {tChat('acceptApplication', { defaultValue: '同意申請' })}
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              placeholder={tCommon('inputMessage')}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isSending}
              className="
                flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full
                focus:outline-none focus:ring-2 focus:ring-indigo-500
                text-sm disabled:opacity-50
                text-gray-900 dark:text-gray-100
                placeholder-gray-500 dark:placeholder-gray-400
              "
            />
            <Button
              onClick={handleSend}
              disabled={!inputMessage.trim() || isSending}
              className="!rounded-full !px-4"
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>

            {/* 申請人在 inquiry 狀態時顯示申請按鈕 */}
            {isInquiry && !conversation.isHost && (
              <Button
                variant="primary"
                onClick={() => setShowApplyConfirm(true)}
                disabled={isApplying}
                className="whitespace-nowrap"
              >
                {isApplying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  tChat('apply', { defaultValue: '申請加入' })
                )}
              </Button>
            )}
          </div>
        </div>

        {/* 申請確認對話框 */}
        {showApplyConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-sm w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                {tChat('applyConfirmTitle', { defaultValue: '確認申請' })}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {tChat('applyConfirmMessage', { defaultValue: '確定要申請加入這個同行嗎？申請後主辦方將收到通知。' })}
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowApplyConfirm(false)}
                  disabled={isApplying}
                >
                  {tCommon('cancel')}
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handleApply}
                  disabled={isApplying}
                >
                  {isApplying ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  {tCommon('confirm')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 評價彈窗 */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        listingId={conversation.listing_id}
        reviewableUsers={[otherUser]}
        isHost={conversation.isHost}
        onSubmitSuccess={() => setShowReviewModal(false)}
      />

      {/* 檢舉彈窗 */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        reportedUserId={otherUser.id}
        reportedUserName={otherUser.username}
        conversationId={conversationId}
        listingId={conversation.listing_id}
      />

      {/* 幫助選單 */}
      <HelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        conversationType={conversationType}
        otherUserName={otherUser.username}
        onCancelRequest={() => {
          setCancellationMode('request');
          setShowCancellationModal(true);
        }}
        onReport={() => setShowReportModal(true)}
        onBlock={() => setShowBlockModal(true)}
      />

      {/* 取消同行彈窗 */}
      <CancellationModal
        isOpen={showCancellationModal}
        onClose={() => setShowCancellationModal(false)}
        conversationId={conversationId}
        eventName={listing.event_name}
        mode={cancellationMode}
        cancellationReason={(conversation as Record<string, unknown>).cancellation_reason as string | undefined}
        onSuccess={() => {
          fetchConversation();
          setShowCancellationModal(false);
        }}
      />

      {/* 封鎖用戶彈窗 */}
      <BlockUserModal
        isOpen={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        userId={otherUser.id}
        userName={otherUser.username}
        onSuccess={() => {
          router.push('/messages');
        }}
      />
    </div>
  );
}
