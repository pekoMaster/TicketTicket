import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Ticket, Calendar, MapPin, ChevronRight, Users, Edit3, Trash2, History } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Tag, { TicketTypeTag } from '@/components/ui/Tag';
import { Listing } from '@/types';
import { isListingExpired } from '@/lib/listing-utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProfileListingsProps {
    listings: Listing[];
    onDelete: (id: string) => void;
}

export default function ProfileListings({ listings, onDelete }: ProfileListingsProps) {
    const t = useTranslations('profile');
    const tStatus = useTranslations('status');
    const tCommon = useTranslations('common');
    const router = useRouter();
    const { locale } = useLanguage();

    const [activeTab, setActiveTabTab] = useState<'active' | 'history'>('active');

    const activeListings = useMemo(() =>
        listings.filter((l) => !isListingExpired(l))
        , [listings]);

    const expiredListings = useMemo(() =>
        listings.filter((l) => isListingExpired(l))
        , [listings]);

    const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleDateString(locale, {
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <div className="space-y-4">
            {/* Sub-tabs */}
            {listings.length > 0 && (
                <div className="flex gap-2 p-1 bg-gray-100/80 dark:bg-gray-800/80 rounded-xl backdrop-blur">
                    <button
                        onClick={() => setActiveTabTab('active')}
                        className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === 'active'
                            ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'text-gray-600 hover:bg-white/50 dark:text-gray-400 dark:hover:bg-gray-700/50'
                            }`}
                    >
                        <Ticket className="w-3.5 h-3.5 inline mr-1.5" />
                        {t('activeListings')} ({activeListings.length})
                    </button>
                    <button
                        onClick={() => setActiveTabTab('history')}
                        className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === 'history'
                            ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'text-gray-600 hover:bg-white/50 dark:text-gray-400 dark:hover:bg-gray-700/50'
                            }`}
                    >
                        <History className="w-3.5 h-3.5 inline mr-1.5" />
                        {t('historyListings')} ({expiredListings.length})
                    </button>
                </div>
            )}

            {/* Active Listings */}
            {activeTab === 'active' && (
                <div className="space-y-3">
                    {activeListings.length > 0 ? (
                        activeListings.map((listing) => (
                            <Card key={listing.id} className="dark:bg-gray-800 dark:border-gray-700 hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-600/50 transition-all duration-200 cursor-pointer">
                                <Link href={`/listing/${listing.id}`}>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <TicketTypeTag type={listing.ticketType} size="sm" />
                                                <Tag
                                                    variant={
                                                        listing.status === 'open'
                                                            ? 'success'
                                                            : listing.status === 'matched'
                                                                ? 'info'
                                                                : 'default'
                                                    }
                                                    size="sm"
                                                >
                                                    {listing.status === 'open' && tStatus('open')}
                                                    {listing.status === 'matched' && tStatus('matched')}
                                                    {listing.status === 'closed' && tStatus('closed')}
                                                </Tag>
                                            </div>
                                            <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                                {listing.eventName}
                                            </p>
                                            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {formatDate(listing.eventDate)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-3.5 h-3.5" />
                                                    {listing.venue}
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                    </div>
                                </Link>

                                {/* Management Buttons */}
                                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => router.push('/messages')}
                                        className="flex-1 text-xs"
                                    >
                                        <Users className="w-3.5 h-3.5 mr-1" />
                                        {t('manageApplications')}
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => router.push(`/listing/${listing.id}/edit`)}
                                        className="flex-1 text-xs"
                                        disabled={listing.status === 'matched'}
                                    >
                                        <Edit3 className="w-3.5 h-3.5 mr-1" />
                                        {t('editListing')}
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => onDelete(listing.id)}
                                        className="text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </Card>
                        ))
                    ) : (
                        <div className="text-center py-10">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Ticket className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{t('noActiveListings')}</h3>
                            <p className="text-gray-500 dark:text-gray-400 mt-1 mb-4">開始您的第一次票券交換吧！</p>
                            <Link href="/create">
                                <Button variant="primary">{t('createFirst')}</Button>
                            </Link>
                        </div>
                    )}
                </div>
            )}

            {/* History Listings */}
            {activeTab === 'history' && (
                <div className="space-y-3">
                    {expiredListings.length > 0 ? (
                        expiredListings.map((listing) => (
                            <Card key={listing.id} className="dark:bg-gray-800 dark:border-gray-700 opacity-75 hover:opacity-100 transition-all duration-200 cursor-pointer">
                                <Link href={`/listing/${listing.id}`}>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <TicketTypeTag type={listing.ticketType} size="sm" />
                                                <Tag variant="default" size="sm">
                                                    {t('expired')}
                                                </Tag>
                                            </div>
                                            <p className="font-medium text-gray-600 dark:text-gray-400 truncate">
                                                {listing.eventName}
                                            </p>
                                            <div className="flex items-center gap-3 text-sm text-gray-400 dark:text-gray-500 mt-1">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {formatDate(listing.eventDate)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-3.5 h-3.5" />
                                                    {listing.venue}
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
                                    </div>
                                </Link>
                            </Card>
                        ))
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-500 dark:text-gray-400 text-sm">{t('noHistory')}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
