'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useLanguage } from '@/contexts/LanguageContext';
import { Calendar, Users, Armchair } from 'lucide-react';
import Tag from '@/components/ui/Tag';
import Avatar from '@/components/ui/Avatar';
import UserProfileModal from '@/components/ui/UserProfileModal';
import { Listing, User, LANGUAGE_OPTIONS, TICKET_COUNT_TYPE_INFO, TICKET_SOURCE_INFO } from '@/types';

interface ListingListItemProps {
    listing: Listing;
    host?: User;
}

export default function ListingListItem({ listing, host }: ListingListItemProps) {
    const t = useTranslations('listing');
    const tTicket = useTranslations('ticketType');
    const { locale } = useLanguage();
    const [showUserModal, setShowUserModal] = useState(false);

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString(locale, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    };

    const getDisplayAvatar = (user: User) => {
        return user.customAvatarUrl || user.avatarUrl;
    };

    const getTicketCountLabel = (type: string) => {
        const info = TICKET_COUNT_TYPE_INFO[type as keyof typeof TICKET_COUNT_TYPE_INFO];
        return info?.label || type;
    };

    const getMainTagInfo = () => {
        if (listing.ticketType === 'find_companion' && listing.willAssistEntry) {
            return { label: t('canAssistEntry', { defaultValue: '可協助入場' }), variant: 'success' as const };
        }
        const typeLabels: Record<string, { label: string; variant: 'success' | 'info' | 'warning' }> = {
            find_companion: { label: tTicket('findCompanion', { defaultValue: '尋找同行者' }), variant: 'success' },
            sub_ticket_transfer: { label: tTicket('subTicketTransfer', { defaultValue: '子票轉讓' }), variant: 'info' },
            ticket_exchange: { label: tTicket('ticketExchange', { defaultValue: '換票' }), variant: 'warning' },
        };
        return typeLabels[listing.ticketType] || { label: listing.ticketType, variant: 'info' as const };
    };

    const mainTag = getMainTagInfo();

    return (
        <>
            <div className="block bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <Link href={`/listing/${listing.id}`} className="block p-4">
                    <div className="flex flex-col gap-2">
                        {/* Row 1: Event Info & Host */}
                        <div className="flex items-center gap-4 flex-wrap">
                            {/* Event Name */}
                            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 truncate max-w-[200px] lg:max-w-[300px]" title={listing.eventName}>
                                {listing.eventName}
                            </h3>

                            {/* Seat Grade */}
                            {listing.seatGrade && (
                                <span className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded whitespace-nowrap">
                                    <Armchair className="w-3.5 h-3.5" />
                                    {listing.seatGrade}
                                </span>
                            )}

                            {/* Ticket Count Type */}
                            {listing.ticketCountType && (
                                <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 px-2 py-0.5 rounded border border-gray-100 dark:border-gray-700 whitespace-nowrap">
                                    <Users className="w-3.5 h-3.5" />
                                    {getTicketCountLabel(listing.ticketCountType)}
                                </span>
                            )}

                            {/* Event Date */}
                            <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                <span>{formatDate(listing.eventDate)}</span>
                            </div>

                            {/* Ticket Source TAG */}
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap ${listing.ticketSource === 'lawson'
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                                }`}>
                                {TICKET_SOURCE_INFO[listing.ticketSource || 'zaiko'].label}
                            </span>

                            {/* Listing Type */}
                            <Tag variant={mainTag.variant} size="sm" className="whitespace-nowrap">
                                {mainTag.label}
                            </Tag>

                            {/* Spacer to push Host to right */}
                            <div className="flex-1 min-w-[20px]" />

                            {/* Host Info */}
                            {host && (
                                <div
                                    className="flex items-center gap-2 cursor-pointer z-10"
                                    onClick={(e) => {
                                        e.preventDefault(); // Prevent navigating to listing
                                        setShowUserModal(true);
                                    }}
                                >
                                    <Avatar src={getDisplayAvatar(host)} size="sm" />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate max-w-[150px]">
                                        {host.username}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Row 2: Artist Tags */}
                        {listing.artistTags && listing.artistTags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-1">
                                {listing.artistTags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-300"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </Link>
            </div>

            {host && (
                <UserProfileModal
                    user={host}
                    isOpen={showUserModal}
                    onClose={() => setShowUserModal(false)}
                />
            )}
        </>
    );
}
