'use client';

import Link from 'next/link';
import { useTranslations, useFormatter } from 'next-intl';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdmin } from '@/contexts/AdminContext';
import Avatar from '@/components/ui/Avatar';
import { TicketRequest, User, ACCEPTED_TICKET_TYPE_INFO } from '@/types';

interface MobileRequestItemProps {
    request: TicketRequest;
    user?: User;
    isFirstItem?: boolean;
}

export default function MobileRequestItem({ request, user, isFirstItem }: MobileRequestItemProps) {
    const t = useTranslations('request');
    const tTicket = useTranslations('ticketType');
    const tCommon = useTranslations('common');
    const { locale } = useLanguage();
    const format = useFormatter();
    const { events } = useAdmin();

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString(locale, {
            month: '2-digit',
            day: '2-digit',
        });
    };

    // 查找活動資訊
    const event = events.find(e => e.name === request.eventName || e.id === request.eventId);

    return (
        <Link href={`/request/${request.id}`} className="block" {...(isFirstItem ? { 'data-tutorial': 'mobile-request-item' } : {})}>
            <div className="bg-white/90 dark:bg-gray-800/60 backdrop-blur rounded-lg px-3 py-2.5 border border-gray-200/50 dark:border-gray-700/50 hover:border-pink-300 dark:hover:border-pink-500/50 transition-all active:scale-[0.99] overflow-hidden">
                {/* 第一列：頭像 + 活動名稱 */}
                <div className="flex items-center gap-2 mb-1.5">
                    {user && (
                        <Avatar
                            src={user.customAvatarUrl || user.avatarUrl}
                            alt={user.username}
                            size="sm"
                            className="w-8 h-8 flex-shrink-0"
                        />
                    )}
                    <span className="text-sm font-bold text-gray-900 dark:text-white truncate flex-1">
                        {request.eventName}
                    </span>
                </div>

                {/* 第二列：用戶名 + 評分 + 日期 + 需求張數 */}
                <div className="flex items-center gap-2 mb-1.5 pl-10 flex-wrap">
                    {user && (
                        <>
                            <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[80px]">{user.username}</span>
                            {user.rating && user.rating > 0 && (
                                <span className="text-[10px] text-yellow-500">★{user.rating.toFixed(1)}</span>
                            )}
                        </>
                    )}
                    {(event?.eventDate || event?.venue) && (
                        <>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500">•</span>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                {event?.eventDate ? formatDate(event.eventDate) : event?.venue}
                            </span>
                        </>
                    )}
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">•</span>
                    <span className="text-sm font-extrabold text-pink-600 dark:text-pink-400">
                        {t('needs', { count: request.quantity })}
                    </span>
                </div>

                {/* 第三列：座位 + 方式標籤 */}
                <div className="flex items-center gap-1.5 pl-10 flex-wrap">
                    {/* 票源 */}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded text-white ${
                        !request.ticketSource 
                            ? 'bg-gray-500'
                            : request.ticketSource === 'lawson'
                                ? 'bg-green-600'
                                : 'bg-blue-600'
                    }`}>
                        {!request.ticketSource ? tCommon('anySource') : request.ticketSource === 'lawson' ? 'LAWSON' : 'ZAIKO'}
                    </span>

                    {/* 票源 */}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded text-white ${
                        !request.ticketSource 
                            ? 'bg-gray-500'
                            : request.ticketSource === 'lawson'
                                ? 'bg-green-600'
                                : 'bg-blue-600'
                    }`}>
                        {!request.ticketSource ? tCommon('anySource') : request.ticketSource === 'lawson' ? 'LAWSON' : 'ZAIKO'}
                    </span>

                    {/* 座位等級 */}
                    {request.seatGrades && request.seatGrades.length > 0 && (
                        <span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded">
                            {request.seatGrades[0]}{request.seatGrades.length > 1 ? ` +${request.seatGrades.length - 1}` : ''}
                        </span>
                    )}

                    {request.acceptedTypes && request.acceptedTypes.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                            {request.acceptedTypes.slice(0, 2).map(type => {
                                const labelKey = type === 'find_companion' ? 'findCompanion' : 
                                               type === 'sub_ticket_transfer' ? 'subTicketTransfer' : 'ticketExchange';
                                return (
                                    <span key={type} className="text-[10px] bg-pink-100 dark:bg-pink-600/30 text-pink-600 dark:text-pink-300 px-1.5 py-0.5 rounded border border-pink-200/50 dark:border-pink-500/20">
                                        {tTicket(labelKey)}
                                    </span>
                                );
                            })}
                            {request.acceptedTypes.length > 2 && (
                                <span className="text-[10px] text-gray-400">+{request.acceptedTypes.length - 2}</span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}
