'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations, useFormatter } from 'next-intl';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdmin } from '@/contexts/AdminContext';
import { MapPin, Users, Ticket, Clock, Calendar, AlignLeft } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import UserProfileModal from '@/components/ui/UserProfileModal';
import { TicketRequest, User, ACCEPTED_TICKET_TYPE_INFO } from '@/types';

interface RequestListItemProps {
    request: TicketRequest;
    user?: User;
}

export default function RequestListItem({ request, user }: RequestListItemProps) {
    const t = useTranslations('request');
    const tTicket = useTranslations('ticketType');
    const tCommon = useTranslations('common');
    const { locale } = useLanguage();
    const format = useFormatter();
    const { events } = useAdmin();
    const [showUserModal, setShowUserModal] = useState(false);

    // 查找活動資訊
    const event = events.find(e => e.name === request.eventName || e.id === request.eventId);

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString(locale, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    };

    return (
        <>
            <div className="group relative bg-white/90 dark:bg-gray-900/40 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/10 hover:bg-pink-50/50 dark:hover:bg-pink-500/5 transition-all duration-200 cursor-pointer">
                <Link href={`/request/${request.id}`} className="block p-4 sm:p-5">
                    <div className="flex flex-col gap-3">

                        {/* Row 1: Requester Info + Quantity */}
                        <div className="flex items-center justify-between gap-4">
                            {user && (
                                <div
                                    className="flex items-center gap-3 z-10 min-w-0"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setShowUserModal(true);
                                    }}
                                >
                                    <Avatar
                                        src={user.customAvatarUrl || user.avatarUrl}
                                        size="sm"
                                        className="flex-shrink-0"
                                    />
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                                            {user.username}
                                        </span>
                                        <div className="flex items-center gap-1 text-xs text-yellow-500">
                                            <span>★★★★★</span>
                                            <span className="text-gray-700 dark:text-white font-medium">{user.rating.toFixed(1)}</span>
                                            <span className="text-gray-400">({user.reviewCount})</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Quantity Badge */}
                            <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/20 flex items-center gap-2">
                                <Ticket className="w-4 h-4" />
                                <span className="font-bold text-sm">
                                    {t('needs', { count: request.quantity })}
                                </span>
                            </div>
                        </div>

                        {/* Row 2: Event Name + Tags */}
                        <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                            <h3 className="text-base font-bold text-gray-900 dark:text-white line-clamp-2 sm:truncate flex-1 group-hover:text-pink-600 dark:group-hover:text-pink-300 transition-colors">
                                {request.eventName}
                            </h3>

                            {/* Tags */}
                            <div className="flex gap-2 flex-shrink-0 flex-wrap sm:flex-nowrap">
                                {request.acceptedTypes && request.acceptedTypes.map(type => {
                                    const labelKey = type === 'find_companion' ? 'findCompanion' : 
                                                   type === 'sub_ticket_transfer' ? 'subTicketTransfer' : 'ticketExchange';
                                    return (
                                        <span key={type} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-300 border border-pink-200/50 dark:border-pink-500/30">
                                            {tTicket(labelKey)}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Row 3: Details (Date, Venue, Description Preview) */}
                        <div className="flex items-center gap-3 sm:gap-5 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                            {/* Event Date */}
                            {event?.eventDate && (
                                <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-md">
                                    <Calendar className="w-3.5 h-3.5 text-pink-500/70" />
                                    <span className="font-medium text-gray-700 dark:text-gray-300">{formatDate(event.eventDate)}</span>
                                </span>
                            )}

                            {/* Venue */}
                            {event?.venue && (
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                    <span className="truncate max-w-[150px]">{event.venue}</span>
                                </span>
                            )}

                            {/* Description Preview */}
                            {request.description && (
                                <span className="flex items-center gap-1.5 italic text-gray-400 sm:max-w-md truncate">
                                    <AlignLeft className="w-3.5 h-3.5" />
                                    {request.description}
                                </span>
                            )}

                            {/* Posted Time */}
                            <span className="flex items-center gap-1.5 ml-auto text-gray-400">
                                <Clock className="w-3 h-3" />
                                {format.relativeTime(new Date(request.createdAt))}
                            </span>
                        </div>
                    </div>
                </Link>
            </div>

            {user && (
                <UserProfileModal
                    user={user}
                    isOpen={showUserModal}
                    onClose={() => setShowUserModal(false)}
                />
            )}
        </>
    );
}
