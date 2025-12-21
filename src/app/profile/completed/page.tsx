'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Tag, { TicketTypeTag } from '@/components/ui/Tag';
import StarRating from '@/components/ui/StarRating';
import { Calendar, MapPin, Loader2, ChevronLeft, ChevronRight, Check, Star } from 'lucide-react';
import Link from 'next/link';

interface CompletedItem {
    id: string;
    listingId: string;
    listing: {
        id: string;
        event_name: string;
        event_date: string;
        venue: string;
        ticket_type: string;
        seat_grade?: string;
        asking_price_jpy?: number;
    };
    isHost: boolean;
    otherUser: {
        id: string;
        username: string;
        avatarUrl?: string;
        rating: number;
    };
    completedAt: string;
    myReview: {
        id: string;
        rating: number;
        comment?: string;
        isAuto?: boolean;
        createdAt: string;
    } | null;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function CompletedMatchesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const t = useTranslations('completed');
    const tCommon = useTranslations('common');

    const [items, setItems] = useState<CompletedItem[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async (page: number) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/profile/completed?page=${page}&limit=10`);
            if (response.ok) {
                const data = await response.json();
                setItems(data.items);
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error('Error fetching completed matches:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login?callbackUrl=/profile/completed');
        } else if (session?.user?.dbId) {
            fetchData(1);
        }
    }, [status, session, router, fetchData]);

    const handlePageChange = (newPage: number) => {
        fetchData(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    if (isLoading && items.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header title={t('title')} showBack />

            <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
                {items.length === 0 ? (
                    <Card className="text-center py-12">
                        <Check className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">{t('noCompleted')}</p>
                    </Card>
                ) : (
                    <>
                        <div className="space-y-4">
                            {items.map((item) => (
                                <Link key={item.id} href={`/listing/${item.listingId}`}>
                                    <Card hoverable className="p-4">
                                        <div className="flex items-start gap-4">
                                            {/* 配對對象頭像 */}
                                            <Avatar src={item.otherUser.avatarUrl} size="lg" />

                                            {/* 活動資訊 */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                                        {item.listing.event_name}
                                                    </h3>
                                                    <TicketTypeTag type={item.listing.ticket_type as 'find_companion' | 'main_ticket_transfer' | 'sub_ticket_transfer' | 'ticket_exchange'} size="sm" />
                                                </div>

                                                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mb-2">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-4 h-4" />
                                                        {formatDate(item.listing.event_date)}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="w-4 h-4" />
                                                        {item.listing.venue}
                                                    </span>
                                                </div>

                                                {/* 配對對象 */}
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                                        {t('matchedWith')}:
                                                    </span>
                                                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                        {item.otherUser.username}
                                                    </span>
                                                    <Tag variant={item.isHost ? 'purple' : 'info'} size="sm">
                                                        {item.isHost ? t('iWasHost') : t('iWasGuest')}
                                                    </Tag>
                                                </div>

                                                {/* 我的評價 */}
                                                {item.myReview ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                                            {t('myReview')}:
                                                        </span>
                                                        <StarRating value={item.myReview.rating} readonly size="sm" />
                                                        {item.myReview.isAuto && (
                                                            <Tag variant="default" size="sm">{t('autoReview')}</Tag>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-orange-500">{t('notReviewed')}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* 完成日期 */}
                                            <div className="text-right text-sm text-gray-400 dark:text-gray-500">
                                                <p>{t('completedAt')}</p>
                                                <p>{formatDate(item.completedAt)}</p>
                                            </div>
                                        </div>
                                    </Card>
                                </Link>
                            ))}
                        </div>

                        {/* 分頁 */}
                        {pagination.totalPages > 1 && (
                            <div className="flex items-center justify-center gap-4 mt-8">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    disabled={pagination.page <= 1}
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                >
                                    <ChevronLeft className="w-4 h-4 mr-1" />
                                    {tCommon('previous')}
                                </Button>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {pagination.page} / {pagination.totalPages}
                                </span>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    disabled={pagination.page >= pagination.totalPages}
                                    onClick={() => handlePageChange(pagination.page + 1)}
                                >
                                    {tCommon('next')}
                                    <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
