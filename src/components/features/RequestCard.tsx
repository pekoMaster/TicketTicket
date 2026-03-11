'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations, useFormatter } from 'next-intl';
import { useLanguage } from '@/contexts/LanguageContext';
import { Eye, Clock, Calendar, HandHeart, CheckCircle2, Globe2 } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import UserProfileModal from '@/components/ui/UserProfileModal';
import { TicketRequest, User, ACCEPTED_TICKET_TYPE_INFO, NATIONALITY_OPTIONS, LANGUAGE_OPTIONS } from '@/types';

interface RequestCardProps {
    request: TicketRequest;
    isFirstCard?: boolean;
}

export default function RequestCard({ request, isFirstCard }: RequestCardProps) {
    const t = useTranslations('request');
    const tTicket = useTranslations('ticketType');
    const { locale } = useLanguage();
    const format = useFormatter();
    const [showUserModal, setShowUserModal] = useState(false);

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString(locale, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    };

    // 取得顯示頭像
    const getDisplayAvatar = (user?: User) => {
        if (!user) return undefined;
        return user.customAvatarUrl || user.avatarUrl;
    };

    // 渲染星星
    const renderStars = (rating: number) => {
        return (
            <div
                className="flex"
                aria-label={t('ratingStars', { rating: rating.toFixed(1) })}
                role="img"
            >
                {Array.from({ length: 5 }, (_, i) => (
                    <span
                        key={i}
                        className={i < Math.round(rating) ? 'text-pink-400' : 'text-gray-300 dark:text-gray-600'}
                        aria-hidden="true"
                    >
                        ★
                    </span>
                ))}
            </div>
        );
    };

    return (
        <>
            <div
                data-tutorial={isFirstCard ? 'request-card' : undefined}
                className="group relative bg-white/90 dark:bg-gray-900/40 backdrop-blur-xl rounded-2xl p-4 flex flex-col h-full border border-gray-200/50 dark:border-white/10 hover:border-pink-300 dark:hover:border-pink-500/50 transition-all duration-300 hover:shadow-xl dark:hover:shadow-pink-500/10 animate-fade-in"
            >
                {/* Gradient border effect (深深色懸停) */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 dark:block hidden" />

                {/* Header - 發布者資訊 */}
                {request.user && (
                    <div
                        className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-200/50 dark:border-white/10 cursor-pointer group/header hover:bg-gray-50 dark:hover:bg-white/5 transition-all -mx-4 -mt-4 px-4 pt-4 rounded-t-2xl"
                        onClick={() => setShowUserModal(true)}
                    >
                        <div className="relative">
                            <Avatar
                                src={getDisplayAvatar(request.user)}
                                size="md"
                                className="transition-all"
                            />
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className="text-sm font-semibold text-gray-800 dark:text-white block truncate">{request.user.username}</span>
                            <div className="flex items-center gap-1 text-xs">
                                {renderStars(request.user.rating || 0)}
                                <span className="text-gray-700 dark:text-white font-medium ml-1">{(request.user.rating || 0).toFixed(1)}</span>
                                <span className="text-gray-400">({request.user.reviewCount || 0})</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Body */}
                <div className="flex flex-col gap-3 mb-4">
                    {/* Event Name */}
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2 h-14 group-hover:text-pink-600 dark:group-hover:text-pink-100 transition-colors">
                        {request.eventName}
                    </h3>

                    {/* Wanted Ticket Conditions */}
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap gap-2">
                            <span className="flex items-center gap-1.5 text-sm font-medium text-pink-700 dark:text-pink-300 bg-pink-50 dark:bg-pink-900/20 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-pink-200/50 dark:border-pink-500/20">
                                <HandHeart className="w-4 h-4 text-pink-500 dark:text-pink-400" />
                                {t('needs', { count: request.quantity })}
                            </span>
                        </div>

                        {/* Accepted Types */}
                        {request.acceptedTypes && request.acceptedTypes.length > 0 && (
                            <div className="flex gap-2 flex-wrap">
                                {request.acceptedTypes.map((type) => {
                                    const info = ACCEPTED_TICKET_TYPE_INFO[type];
                                    return (
                                        <span
                                            key={type}
                                            className={`px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm ${info?.color || 'bg-gray-100 text-gray-800'}`}
                                        >
                                            {tTicket(type)}
                                        </span>
                                    );
                                })}
                            </div>
                        )}

                        {/* Preferred Seat Grades */}
                        {request.seatGrades && request.seatGrades.length > 0 && (
                            <div className="flex gap-1 flex-wrap mt-1">
                                {request.seatGrades.map((grade) => (
                                    <span
                                        key={grade}
                                        className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20"
                                    >
                                        <CheckCircle2 className="w-3 h-3" />
                                        {grade}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Additional Preferences (Ticket Source, Nationality, Language) */}
                        <div className="flex gap-1.5 flex-wrap mt-1">
                            {request.ticketSource && (
                                <span className="px-2 py-0.5 rounded text-[11px] bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-500/20">
                                    🎫 {request.ticketSource === 'zaiko' ? 'ZAIKO' : 'LAWSON'}
                                </span>
                            )}
                            {request.requesterNationality && (
                                <span className="px-2 py-0.5 rounded text-[11px] bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-500/20 flex items-center gap-1">
                                    <Globe2 className="w-3 h-3" />
                                    {NATIONALITY_OPTIONS.find(n => n.value === request.requesterNationality)?.label || request.requesterNationality}
                                </span>
                            )}
                            {request.requesterLanguages && request.requesterLanguages.length > 0 && (
                                <span className="px-2 py-0.5 rounded text-[11px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-500/20">
                                    🗣️ {request.requesterLanguages.map(l => LANGUAGE_OPTIONS.find(lo => lo.value === l)?.label || l).join(', ')}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400 mt-auto">
                    <div className="flex items-center justify-between">
                        <span className="truncate flex-1" />
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 ml-auto">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formatDate(request.createdAt)}</span>
                        </div>
                    </div>
                </div>

                {/* View / Contact Button */}
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5">
                    <Link
                        href={`/request/${request.id}`}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl font-semibold transition-all text-sm shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Eye className="w-4 h-4" />
                        {t('viewDetails')}
                    </Link>
                </div>
            </div>

            {request.user && (
                <UserProfileModal
                    user={request.user}
                    isOpen={showUserModal}
                    onClose={() => setShowUserModal(false)}
                />
            )}
        </>
    );
}
