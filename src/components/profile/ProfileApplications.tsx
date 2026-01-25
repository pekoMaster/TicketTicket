import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Users, ChevronRight, X } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Tag, { TicketTypeTag } from '@/components/ui/Tag';
import { ApiApplication } from '@/types';

interface ProfileApplicationsProps {
    applications: ApiApplication[];
    onWithdraw: (id: string) => void;
}

export default function ProfileApplications({ applications, onWithdraw }: ProfileApplicationsProps) {
    const t = useTranslations('profile');
    const tMessages = useTranslations('messages');

    return (
        <div className="space-y-4">
            {applications.length > 0 ? (
                <div className="space-y-3">
                    {applications.map((application) => (
                        <Card key={application.id} className="dark:bg-gray-800 dark:border-gray-700 hover:shadow-md transition-all">
                            <Link href={`/listing/${application.listing_id}`}>
                                <div className="flex items-start gap-3">
                                    {/* Host Avatar */}
                                    <Avatar
                                        src={application.listing.host?.custom_avatar_url || application.listing.host?.avatar_url}
                                        size="md"
                                        className="flex-shrink-0"
                                    />

                                    <div className="flex-1 min-w-0">
                                        {/* Status + Type */}
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <Tag
                                                variant={
                                                    application.status === 'pending'
                                                        ? 'warning'
                                                        : application.status === 'accepted'
                                                            ? 'success'
                                                            : 'default'
                                                }
                                                size="sm"
                                            >
                                                {application.status === 'pending' && tMessages('waiting')}
                                                {application.status === 'accepted' && tMessages('accepted')}
                                                {application.status === 'rejected' && tMessages('rejected')}
                                            </Tag>
                                            {/* eslint-disable-next-line */}
                                            <TicketTypeTag type={application.listing.ticket_type as any} size="sm" />
                                        </div>

                                        {/* Event Name */}
                                        <p className="font-medium text-gray-900 dark:text-gray-100 line-clamp-2 break-words mb-1">
                                            {application.listing.event_name}
                                        </p>

                                        {/* Host Info */}
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                                            <span>{application.listing.host?.username}</span>
                                            <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                                                {application.listing.seat_grade}
                                            </span>
                                        </div>
                                    </div>

                                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                                </div>
                            </Link>

                            {/* Withdraw Button */}
                            {application.status === 'pending' && (
                                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => onWithdraw(application.id)}
                                        className="w-full text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                                    >
                                        <X className="w-3.5 h-3.5 mr-1" />
                                        {t('withdrawApplication')}
                                    </Button>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{t('noApplications')}</p>
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                        {t('goExplore')}
                    </Link>
                </div>
            )}
        </div>
    );
}
