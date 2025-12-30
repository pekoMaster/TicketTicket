'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ShareModal from '@/components/ui/ShareModal';
import { ForumTopic, ForumCategory, FORUM_CATEGORY_INFO } from '@/types';
import {
    MessageSquare,
    ThumbsUp,
    Eye,
    Pin,
    Lock,
    Unlock,
    Share2,
    Edit,
    Trash2,
    Send,
    Loader2,
    CheckCircle
} from 'lucide-react';

export default function TopicDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { data: session } = useSession();
    const router = useRouter();
    const t = useTranslations('forum');

    const [topic, setTopic] = useState<ForumTopic | null>(null);
    const [loading, setLoading] = useState(true);
    const [replyContent, setReplyContent] = useState('');
    const [submittingReply, setSubmittingReply] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    // 主題編輯狀態
    const [isEditingTopic, setIsEditingTopic] = useState(false);
    const [editTopicTitle, setEditTopicTitle] = useState('');
    const [editTopicContent, setEditTopicContent] = useState('');

    // 分類名稱翻譯
    const getCategoryLabel = (cat: ForumCategory) => {
        const labelKey = FORUM_CATEGORY_INFO[cat].labelKey;
        return t(labelKey);
    };

    const fetchTopic = async () => {
        try {
            const res = await fetch(`/api/forum/topics/${id}`);
            if (res.ok) {
                const data = await res.json();
                setTopic(data);
            } else {
                router.push('/forum');
            }
        } catch (error) {
            console.error('Error fetching topic:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTopic();
    }, [id]);

    const isAuthor = session?.user?.dbId === topic?.authorId;
    const isAdmin = session?.user?.role === 'super_admin' || session?.user?.role === 'sub_admin';

    const handleLike = async (topicId?: string, replyId?: string) => {
        if (!session) return;

        try {
            const res = await fetch('/api/forum/likes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topicId, replyId }),
            });

            if (res.ok) {
                fetchTopic();
            }
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    };

    const handleReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyContent.trim() || !session) return;

        setSubmittingReply(true);
        try {
            const res = await fetch(`/api/forum/topics/${id}/replies`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: replyContent }),
            });

            if (res.ok) {
                setReplyContent('');
                fetchTopic();
            }
        } catch (error) {
            console.error('Error posting reply:', error);
        } finally {
            setSubmittingReply(false);
        }
    };

    const handleVote = async (optionId: string) => {
        if (!session || !topic?.poll) return;
        if (topic.poll.myVotes && topic.poll.myVotes.length > 0) return;

        try {
            const res = await fetch('/api/forum/polls/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pollId: topic.poll.id,
                    optionIds: [optionId]
                }),
            });

            if (res.ok) {
                fetchTopic();
            }
        } catch (error) {
            console.error('Error voting:', error);
        }
    };

    const handleTogglePin = async () => {
        if (!isAdmin || !topic) return;

        try {
            await fetch(`/api/forum/topics/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isPinned: !topic.isPinned }),
            });
            fetchTopic();
        } catch (error) {
            console.error('Error toggling pin:', error);
        }
    };

    const handleToggleLock = async () => {
        if (!isAdmin || !topic) return;

        try {
            await fetch(`/api/forum/topics/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isLocked: !topic.isLocked }),
            });
            fetchTopic();
        } catch (error) {
            console.error('Error toggling lock:', error);
        }
    };

    const handleDeleteTopic = async () => {
        if (!isAdmin) return;
        if (!confirm(t('confirmDelete'))) return;

        try {
            const res = await fetch(`/api/forum/topics/${id}`, { method: 'DELETE' });
            if (res.ok) {
                router.push('/forum');
            }
        } catch (error) {
            console.error('Error deleting topic:', error);
        }
    };

    const handleDeleteReply = async (replyId: string) => {
        if (!isAdmin) return;
        if (!confirm(t('confirmDeleteReply'))) return;

        try {
            const res = await fetch(`/api/forum/topics/${id}/replies/${replyId}`, { method: 'DELETE' });
            if (res.ok) {
                fetchTopic();
            }
        } catch (error) {
            console.error('Error deleting reply:', error);
        }
    };

    const handleEditReply = async (replyId: string) => {
        if (!editContent.trim()) return;

        try {
            const res = await fetch(`/api/forum/topics/${id}/replies/${replyId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: editContent }),
            });

            if (res.ok) {
                setEditingReplyId(null);
                setEditContent('');
                fetchTopic();
            }
        } catch (error) {
            console.error('Error editing reply:', error);
        }
    };

    const handleEditTopic = async () => {
        if (!editTopicTitle.trim() || !editTopicContent.trim()) return;

        try {
            const res = await fetch(`/api/forum/topics/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: editTopicTitle,
                    content: editTopicContent
                }),
            });

            if (res.ok) {
                setIsEditingTopic(false);
                fetchTopic();
            }
        } catch (error) {
            console.error('Error editing topic:', error);
        }
    };

    const startEditTopic = () => {
        if (topic) {
            setEditTopicTitle(topic.title);
            setEditTopicContent(topic.content);
            setIsEditingTopic(true);
        }
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleString();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (!topic) {
        return null;
    }

    const totalVotes = topic.poll?.options.reduce((sum, opt) => sum + opt.voteCount, 0) || 0;
    const hasVoted = topic.poll?.myVotes && topic.poll.myVotes.length > 0;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header title={topic.title} showBack />

            <div className="pt-20 pb-24 px-4 max-w-3xl mx-auto">
                {/* 主題卡片 */}
                <Card className="mb-6">
                    {/* 標題和分類 */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2 flex-wrap">
                            {topic.isPinned && <Pin className="w-4 h-4 text-orange-500" />}
                            {topic.isLocked && <Lock className="w-4 h-4 text-gray-400" />}
                            <span className={`text-xs px-2 py-0.5 rounded-full ${FORUM_CATEGORY_INFO[topic.category].color}`}>
                                {FORUM_CATEGORY_INFO[topic.category].icon} {getCategoryLabel(topic.category)}
                            </span>
                        </div>

                        <button
                            onClick={() => setShowShareModal(true)}
                            className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        >
                            <Share2 className="w-5 h-5" />
                        </button>

                        {/* 作者編輯按鈕 */}
                        {(isAuthor || isAdmin) && !topic.isLocked && !isEditingTopic && (
                            <button
                                onClick={startEditTopic}
                                className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                title={t('edit')}
                            >
                                <Edit className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    {/* 標題 */}
                    {isEditingTopic ? (
                        <input
                            type="text"
                            value={editTopicTitle}
                            onChange={(e) => setEditTopicTitle(e.target.value)}
                            className="w-full text-xl font-bold px-3 py-2 mb-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        />
                    ) : (
                        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                            {topic.title}
                        </h1>
                    )}

                    {/* 作者資訊 */}
                    <div className="flex items-center gap-3 mb-4">
                        <img
                            src={topic.author?.customAvatarUrl || topic.author?.avatarUrl || '/default-avatar.png'}
                            alt=""
                            className="w-10 h-10 rounded-full"
                        />
                        <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                                {topic.author?.username}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {formatDate(topic.createdAt)}
                            </p>
                        </div>
                    </div>

                    {/* 內容 */}
                    {isEditingTopic ? (
                        <div className="mb-4 space-y-3">
                            <textarea
                                value={editTopicContent}
                                onChange={(e) => setEditTopicContent(e.target.value)}
                                rows={8}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none"
                            />
                            <div className="flex gap-2">
                                <Button onClick={handleEditTopic}>
                                    {t('save')}
                                </Button>
                                <Button variant="secondary" onClick={() => setIsEditingTopic(false)}>
                                    {t('cancel')}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-4">
                            {topic.content}
                        </div>
                    )}

                    {/* 投票區 */}
                    {topic.poll && (
                        <Card className="bg-gray-50 dark:bg-gray-800/50 mb-4">
                            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                                📊 {topic.poll.question}
                            </h3>
                            <div className="space-y-2">
                                {topic.poll.options.map((option) => {
                                    const percentage = totalVotes > 0 ? Math.round((option.voteCount / totalVotes) * 100) : 0;
                                    const isSelected = topic.poll?.myVotes?.includes(option.id);

                                    return (
                                        <button
                                            key={option.id}
                                            onClick={() => !hasVoted && handleVote(option.id)}
                                            disabled={hasVoted || !session}
                                            className={`w-full text-left p-3 rounded-lg border transition-colors relative overflow-hidden ${isSelected
                                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                                                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                                } ${hasVoted || !session ? 'cursor-default' : 'cursor-pointer'}`}
                                        >
                                            {hasVoted && (
                                                <div
                                                    className="absolute inset-y-0 left-0 bg-indigo-100 dark:bg-indigo-900/50 transition-all"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            )}
                                            <div className="relative flex items-center justify-between">
                                                <span className="flex items-center gap-2">
                                                    {isSelected && <CheckCircle className="w-4 h-4 text-indigo-500" />}
                                                    {option.optionText}
                                                </span>
                                                {hasVoted && (
                                                    <span className="text-sm text-gray-500">
                                                        {option.voteCount} ({percentage}%)
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-xs text-gray-400 mt-2">
                                {t('totalVotes', { count: totalVotes })}
                            </p>
                        </Card>
                    )}

                    {/* 統計和操作 */}
                    <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-4">
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                                <Eye className="w-4 h-4" /> {topic.viewCount}
                            </span>
                            <span className="flex items-center gap-1">
                                <MessageSquare className="w-4 h-4" /> {topic.replyCount}
                            </span>
                            <button
                                onClick={() => handleLike(topic.id)}
                                className={`flex items-center gap-1 transition-colors ${topic.isLikedByMe ? 'text-indigo-500' : 'hover:text-indigo-500'
                                    }`}
                            >
                                <ThumbsUp className={`w-4 h-4 ${topic.isLikedByMe ? 'fill-current' : ''}`} />
                                {topic.likeCount}
                            </button>
                        </div>

                        {/* 管理員操作 */}
                        {isAdmin && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleTogglePin}
                                    className={`p-2 rounded-lg transition-colors ${topic.isPinned ? 'text-orange-500 bg-orange-50 dark:bg-orange-900/30' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                    title={topic.isPinned ? t('unpin') : t('pin')}
                                >
                                    <Pin className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={handleToggleLock}
                                    className={`p-2 rounded-lg transition-colors ${topic.isLocked ? 'text-red-500 bg-red-50 dark:bg-red-900/30' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                    title={topic.isLocked ? t('unlock') : t('lock')}
                                >
                                    {topic.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={handleDeleteTopic}
                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                                    title={t('delete')}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </Card>

                {/* 回覆區 */}
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
                        {t('replies')} ({topic.replyCount})
                    </h2>

                    {topic.replies && topic.replies.length > 0 ? (
                        <div className="space-y-4">
                            {topic.replies.map((reply, index) => (
                                <Card key={reply.id} className="relative">
                                    <div className="absolute top-2 right-2 text-xs text-gray-400">
                                        #{index + 1}
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <img
                                            src={reply.author?.customAvatarUrl || reply.author?.avatarUrl || '/default-avatar.png'}
                                            alt=""
                                            className="w-8 h-8 rounded-full flex-shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                                    {reply.author?.username}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    {formatDate(reply.createdAt)}
                                                </span>
                                                {new Date(reply.updatedAt).getTime() > new Date(reply.createdAt).getTime() + 1000 && (
                                                    <span className="text-xs text-gray-400">({t('edited')})</span>
                                                )}
                                            </div>

                                            {editingReplyId === reply.id ? (
                                                <div className="space-y-2">
                                                    <textarea
                                                        value={editContent}
                                                        onChange={(e) => setEditContent(e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm resize-none"
                                                        rows={3}
                                                    />
                                                    <div className="flex gap-2">
                                                        <Button size="sm" onClick={() => handleEditReply(reply.id)}>
                                                            {t('save')}
                                                        </Button>
                                                        <Button size="sm" variant="secondary" onClick={() => setEditingReplyId(null)}>
                                                            {t('cancel')}
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">
                                                    {reply.content}
                                                </p>
                                            )}

                                            <div className="flex items-center gap-4 mt-2">
                                                <button
                                                    onClick={() => handleLike(undefined, reply.id)}
                                                    className={`flex items-center gap-1 text-xs transition-colors ${reply.isLikedByMe ? 'text-indigo-500' : 'text-gray-400 hover:text-indigo-500'
                                                        }`}
                                                >
                                                    <ThumbsUp className={`w-3.5 h-3.5 ${reply.isLikedByMe ? 'fill-current' : ''}`} />
                                                    {reply.likeCount}
                                                </button>

                                                {/* 編輯按鈕（作者且未鎖定） */}
                                                {session?.user?.dbId === reply.authorId && !topic.isLocked && (
                                                    <button
                                                        onClick={() => { setEditingReplyId(reply.id); setEditContent(reply.content); }}
                                                        className="text-xs text-gray-400 hover:text-indigo-500"
                                                    >
                                                        <Edit className="w-3.5 h-3.5" />
                                                    </button>
                                                )}

                                                {/* 刪除按鈕（管理員） */}
                                                {isAdmin && (
                                                    <button
                                                        onClick={() => handleDeleteReply(reply.id)}
                                                        className="text-xs text-red-400 hover:text-red-500"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="text-center py-8 text-gray-500 dark:text-gray-400">
                            {t('noReplies')}
                        </Card>
                    )}
                </div>

                {/* 回覆表單 */}
                {topic.isLocked ? (
                    <Card className="bg-gray-100 dark:bg-gray-800 text-center py-4">
                        <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
                            <Lock className="w-4 h-4" />
                            {t('topicLocked')}
                        </div>
                    </Card>
                ) : session ? (
                    <Card>
                        <form onSubmit={handleReply}>
                            <textarea
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder={t('replyPlaceholder')}
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none mb-3"
                            />
                            <div className="flex justify-end">
                                <Button type="submit" disabled={!replyContent.trim() || submittingReply}>
                                    {submittingReply ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4 mr-2" />
                                            {t('postReply')}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Card>
                ) : (
                    <Card className="text-center py-4">
                        <p className="text-gray-500 dark:text-gray-400 mb-2">
                            {t('loginToReply')}
                        </p>
                        <Button onClick={() => router.push(`/login?callbackUrl=/forum/${id}`)}>
                            {t('login')}
                        </Button>
                    </Card>
                )}
            </div>

            {/* 分享 Modal */}
            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                title={topic.title}
                description={topic.content.slice(0, 100) + (topic.content.length > 100 ? '...' : '')}
                url={typeof window !== 'undefined' ? window.location.href : ''}
            />
        </div>
    );
}
