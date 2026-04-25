'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations, useFormatter } from 'next-intl';
import { useLanguage } from '@/contexts/LanguageContext';
import { MapPin, Users, Armchair, Clock, Check } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import UserProfileModal from '@/components/ui/UserProfileModal';
import CurrencyBadge from '@/components/ui/CurrencyBadge';
import { Listing, User, LANGUAGE_OPTIONS, TICKET_SOURCE_INFO, CurrencyCode } from '@/types';
import { getCurrencySymbol } from '@/lib/currency';
import { useCurrency } from '@/contexts/CurrencyContext';
import { getDisplayAvatar } from '@/lib/listing-display-utils';

interface ListingListItemProps {
    listing: Listing;
    host?: User;
    currency?: CurrencyCode;
}

export default function ListingListItem({ listing, host, currency = 'JPY' }: ListingListItemProps) {
    const t = useTranslations('listing');
    const tTicket = useTranslations('ticketType');
    const tCommon = useTranslations('common');
    const { locale } = useLanguage();
    const format = useFormatter();
    const [showUserModal, setShowUserModal] = useState(false);
    const { preferredCurrency, convertPrice } = useCurrency();

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString(locale, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    };

    return (
        <>
            {/* V4 Glassmorphism List Item - 3-Row Layout */}
            <div className="group relative bg-white/90 dark:bg-gray-900/40 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/10 hover:bg-pink-50/50 dark:hover:bg-pink-500/5 transition-all duration-200 cursor-pointer">
                <Link href={`/listing/${listing.id}`} className="block p-4 sm:p-5">
                    <div className="flex flex-col gap-3">

                        {/* Row 1: Host Info + Price */}
                        <div className="flex items-center justify-between gap-4">
                            {/* Left: Host */}
                            {host && (
                                <div
                                    className="flex items-center gap-3 z-10 min-w-0"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setShowUserModal(true);
                                    }}
                                >
                                    <Avatar
                                        src={getDisplayAvatar(host)}
                                        size="sm"
                                        className="flex-shrink-0"
                                    />
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                                            {host.username}
                                        </span>
                                        <div className="flex items-center gap-1 text-xs text-pink-500 dark:text-pink-400">
                                            <span>★★★★★</span>
                                            <span className="text-gray-700 dark:text-white font-medium">{host.rating.toFixed(1)}</span>
                                            <span className="text-gray-400">({host.reviewCount})</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Right: Price - Aurora Style */}
                            {listing.originalPriceJpy > 0 && (() => {
                                const convertedAsking = currency !== preferredCurrency ? convertPrice(listing.askingPriceJpy, currency) : null;
                                const convertedOriginal = currency !== preferredCurrency ? convertPrice(listing.originalPriceJpy, currency) : null;
                                return (
                                    <div className="flex flex-col items-end gap-1">
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-emerald-500/10 dark:to-cyan-500/10 flex-shrink-0">
                                            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                                                {getCurrencySymbol(currency)}{listing.askingPriceJpy.toLocaleString()}
                                            </span>
                                            <span className="text-gray-400 text-xs">/</span>
                                            <span className="text-gray-500 dark:text-gray-400 text-sm">
                                                {getCurrencySymbol(currency)}{listing.originalPriceJpy.toLocaleString()}
                                            </span>
                                            {currency !== 'JPY' && <CurrencyBadge currency={currency} />}
                                        </div>
                                        {convertedAsking !== null && (
                                            <div className="text-[10px] text-gray-500 dark:text-gray-400">
                                                約 {getCurrencySymbol(preferredCurrency)}{convertedAsking.toLocaleString()} / {getCurrencySymbol(preferredCurrency)}{convertedOriginal?.toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Row 2: Event Name + Tags */}
                        <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                            <h3 className="text-base font-bold text-gray-900 dark:text-white line-clamp-2 sm:truncate flex-1 group-hover:text-pink-600 dark:group-hover:text-pink-300 transition-colors">
                                {listing.eventName}
                            </h3>

                            {/* Tags */}
                            <div className="flex gap-2 flex-shrink-0 flex-wrap sm:flex-nowrap">
                                {/* Ticket Source - Gradient */}
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm ${
                                    !listing.ticketSource 
                                        ? 'bg-gradient-to-r from-gray-600 to-gray-500 text-white shadow-gray-500/20'
                                        : listing.ticketSource === 'lawson'
                                            ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-green-500/20'
                                            : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-blue-500/20'
                                    }`}>
                                    {!listing.ticketSource ? tCommon('anySource') : TICKET_SOURCE_INFO[listing.ticketSource].label}
                                </span>

                                {/* Entry Assist */}
                                {listing.ticketType === 'find_companion' && listing.willAssistEntry && (
                                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-600 to-green-500 text-white shadow-sm flex items-center gap-1">
                                        <Check className="w-3 h-3" />
                                        <span className="hidden sm:inline">{t('canAssistEntry', { defaultValue: '可協助入場' })}</span>
                                        <span className="sm:hidden">{t('assistShort')}</span>
                                    </span>
                                )}

                                {/* Sub-ticket transfer */}
                                {listing.ticketType === 'sub_ticket_transfer' && (
                                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-sm">
                                        {tTicket('subTicketTransfer', { defaultValue: '子票轉讓' })}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Row 3: Details - Icon + Text */}
                        <div className="flex items-center gap-3 sm:gap-5 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                            {/* Seat Grade */}
                            {listing.seatGrade && (
                                <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-md">
                                    <Armchair className="w-3.5 h-3.5 text-pink-500 dark:text-pink-400" />
                                    <span className="font-medium text-gray-700 dark:text-gray-300">{listing.seatGrade}</span>
                                </span>
                            )}

                            {/* Ticket Count */}
                            {listing.ticketPeopleCount > 0 && (
                                <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-md">
                                    <Users className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
                                    <span className="font-medium text-gray-700 dark:text-gray-300">{t('peopleTicket', { count: listing.ticketPeopleCount })}</span>
                                </span>
                            )}

                            {/* Venue */}
                            {listing.venue && (
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                    <span className="truncate max-w-[100px] sm:max-w-[150px]">{listing.venue}</span>
                                </span>
                            )}

                            {/* Posted Time - Push to right */}
                            <span className="flex items-center gap-1.5 ml-auto text-gray-400">
                                <Clock className="w-3 h-3" />
                                {format.relativeTime(new Date(listing.createdAt))}
                            </span>
                        </div>
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
