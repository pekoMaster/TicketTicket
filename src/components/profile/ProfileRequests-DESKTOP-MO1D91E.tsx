import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Ticket, Calendar, MapPin, ChevronRight, Trash2, Edit3, MessageCircle } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Tag from '@/components/ui/Tag';
import { TicketRequest } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProfileRequestsProps {
    requests: TicketRequest[];
    onDelete: (id: string) => void;
}

export default function ProfileRequests({ requests, onDelete }: ProfileRequestsProps) {
    const t = useTranslations('profile');
    const tStatus = useTranslations('status');
    const router = useRouter();
    const { locale } = useLanguage();

    const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleDateString(locale, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    return (
        <div className="space-y-4">
            {requests.length > 0 ? (
                requests.map((request) => (
                    <Card key={request.id} className="dark:bg-gray-800 dark:border-gray-700 hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-600/50 transition-all duration-200 cursor-pointer">
                        <Link href={`/request/${request.id}`}>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Tag
                                            variant={
                                                request.status === 'open'
                                                    ? 'success'
                                                    : request.status === 'matched'
                                                        ? 'info'
                                                        : 'default'
                                            }
                                            size="sm"
                                        >
                                            {request.status === 'open' && tStatus('open')}
                                            {request.status === 'matched' && tStatus('matched')}
                                            {request.status === 'closed' && tStatus('closed')}
                                        </Tag>
                                        <Tag variant="info" size="sm">
                                            {request.quantity} 張
                                        </Tag>
                                    </div>
                                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                        {request.eventName}
                                    </p>
                                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {t('createdAt', { date: formatDate(request.createdAt) })}
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
                                <MessageCircle className="w-3.5 h-3.5 mr-1" />
                                {t('viewMessages')}
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => onDelete(request.id)}
                                className="text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 px-4 flex-[0.3]"
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
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{t('noRequests')}</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 mb-4">{t('createFirstRequest')}</p>
                    <Link href="/request">
                        <Button variant="primary">{t('publishRequest')}</Button>
                    </Link>
                </div>
            )}
        </div>
    );
}
