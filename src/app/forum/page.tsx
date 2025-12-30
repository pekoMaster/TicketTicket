'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { ForumTopic, ForumCategory, FORUM_CATEGORY_INFO } from '@/types';
import {
    MessageSquare,
    ThumbsUp,
    Eye,
    Pin,
    Lock,
    Plus,
    Filter,
    ChevronDown,
    Loader2
} from 'lucide-react';

export default function ForumPage() {
    const { data: session } = useSession();
    const t = useTranslations('forum');

    const [topics, setTopics] = useState<ForumTopic[]>([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState<ForumCategory | ''>('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showCategoryFilter, setShowCategoryFilter] = useState(false);

    const fetchTopics = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (category) params.set('category', category);
            params.set('page', page.toString());
            params.set('limit', '20');

            const res = await fetch(`/api/forum/topics?${params}`);
            const data = await res.json();

            if (res.ok) {
                setTopics(data.topics);
                setTotalPages(data.totalPages);
            }
        } catch (error) {
            console.error('Error fetching topics:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTopics();
    }, [category, page]);

    const formatDate = (date: Date) => {
        const d = new Date(date);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return t('justNow', { defaultValue: '剛剛' });
        if (diffMins < 60) return t('minutesAgo', { count: diffMins, defaultValue: `${diffMins} 分鐘前` });
        if (diffHours < 24) return t('hoursAgo', { count: diffHours, defaultValue: `${diffHours} 小時前` });
        if (diffDays < 7) return t('daysAgo', { count: diffDays, defaultValue: `${diffDays} 天前` });
        return d.toLocaleDateString();
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header title={t('title', { defaultValue: '討論區' })} showBack />

            <div className="pt-20 pb-24 px-4 max-w-4xl mx-auto">
                {/* 標題和發帖按鈕 */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {t('title', { defaultValue: '討論區' })}
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {t('subtitle', { defaultValue: '回報問題、提供建議、參與討論' })}
                        </p>
                    </div>
                    {session && (
                        <Link href="/forum/new">
                            <Button className="flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                {t('newTopic', { defaultValue: '發起討論' })}
                            </Button>
                        </Link>
                    )}
                </div>

                {/* 分類篩選 */}
                <div className="mb-4">
                    <div className="relative">
                        <button
                            onClick={() => setShowCategoryFilter(!showCategoryFilter)}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                        >
                            <Filter className="w-4 h-4" />
                            {category ? FORUM_CATEGORY_INFO[category].label : t('allCategories', { defaultValue: '全部分類' })}
                            <ChevronDown className="w-4 h-4" />
                        </button>

                        {showCategoryFilter && (
                            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 min-w-[160px]">
                                <button
                                    onClick={() => { setCategory(''); setShowCategoryFilter(false); setPage(1); }}
                                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${!category ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : ''}`}
                                >
                                    {t('allCategories', { defaultValue: '全部分類' })}
                                </button>
                                {(Object.keys(FORUM_CATEGORY_INFO) as ForumCategory[]).map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => { setCategory(cat); setShowCategoryFilter(false); setPage(1); }}
                                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${category === cat ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : ''}`}
                                    >
                                        {FORUM_CATEGORY_INFO[cat].icon} {FORUM_CATEGORY_INFO[cat].label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 主題列表 */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    </div>
                ) : topics.length === 0 ? (
                    <Card className="text-center py-12">
                        <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">
                            {t('noTopics', { defaultValue: '目前沒有討論主題' })}
                        </p>
                        {session && (
                            <Link href="/forum/new">
                                <Button variant="secondary" className="mt-4">
                                    {t('beFirst', { defaultValue: '成為第一個發起討論的人' })}
                                </Button>
                            </Link>
                        )}
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {topics.map((topic) => (
                            <Link key={topic.id} href={`/forum/${topic.id}`}>
                                <Card hoverable className="p-4">
                                    <div className="flex items-start gap-3">
                                        {/* 作者頭像 */}
                                        <img
                                            src={topic.author?.customAvatarUrl || topic.author?.avatarUrl || '/default-avatar.png'}
                                            alt=""
                                            className="w-10 h-10 rounded-full flex-shrink-0"
                                        />

                                        <div className="flex-1 min-w-0">
                                            {/* 標題行 */}
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {topic.isPinned && (
                                                    <Pin className="w-4 h-4 text-orange-500 flex-shrink-0" />
                                                )}
                                                {topic.isLocked && (
                                                    <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                )}
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${FORUM_CATEGORY_INFO[topic.category].color}`}>
                                                    {FORUM_CATEGORY_INFO[topic.category].icon} {FORUM_CATEGORY_INFO[topic.category].label}
                                                </span>
                                                <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                                    {topic.title}
                                                </h3>
                                            </div>

                                            {/* 作者和時間 */}
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                {topic.author?.username} · {formatDate(topic.createdAt)}
                                            </p>

                                            {/* 統計 */}
                                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 dark:text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <Eye className="w-3.5 h-3.5" />
                                                    {topic.viewCount}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <MessageSquare className="w-3.5 h-3.5" />
                                                    {topic.replyCount}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <ThumbsUp className="w-3.5 h-3.5" />
                                                    {topic.likeCount}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}

                {/* 分頁 */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-6">
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                        >
                            {t('prevPage', { defaultValue: '上一頁' })}
                        </Button>
                        <span className="px-4 py-2 text-sm text-gray-500">
                            {page} / {totalPages}
                        </span>
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={page === totalPages}
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        >
                            {t('nextPage', { defaultValue: '下一頁' })}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
