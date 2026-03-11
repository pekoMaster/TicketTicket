'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useAdmin } from '@/contexts/AdminContext';
import { useTranslations } from 'next-intl';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/Card';
import AuroraBackground from '@/components/ui/AuroraBackground';
import Button from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import {
    Check,
    AlertTriangle,
    Loader2,
    Users,
    Ticket,
    ChevronRight,
    Search,
    Mail,
    Phone,
} from 'lucide-react';
import Link from 'next/link';
import { 
    VerificationLevel, 
    AcceptedTicketType, 
    ACCEPTED_TICKET_TYPE_INFO, 
    getSeatGradeColor,
    TicketSource,
    TICKET_SOURCE_INFO,
    NATIONALITY_OPTIONS,
    LANGUAGE_OPTIONS
} from '@/types';

export default function RequestTicketPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const { events } = useAdmin();
    const t = useTranslations('request');
    const tCommon = useTranslations('common');

    // 表單狀態
    const [eventName, setEventName] = useState('');
    const [acceptedTypes, setAcceptedTypes] = useState<AcceptedTicketType[]>([]);
    const [seatGrades, setSeatGrades] = useState<string[]>([]);
    const [quantity, setQuantity] = useState(1);
    const [description, setDescription] = useState('');
    const [ticketSource, setTicketSource] = useState<TicketSource | ''>('');
    const [requesterNationality, setRequesterNationality] = useState('');
    const [requesterLanguages, setRequesterLanguages] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // 驗證層級
    const [verificationLevel, setVerificationLevel] = useState<VerificationLevel | null>(null);
    const [isCheckingVerification, setIsCheckingVerification] = useState(true);

    // 用戶求票計數
    const [userRequestCounts, setUserRequestCounts] = useState<Record<string, number>>({});

    // 檢查驗證層級
    useEffect(() => {
        const checkVerification = async () => {
            if (!session?.user?.dbId) {
                setIsCheckingVerification(false);
                return;
            }
            try {
                const response = await fetch(`/api/users/${session.user.dbId}`);
                if (response.ok) {
                    const data = await response.json();
                    setVerificationLevel(data.verification_level || 'unverified');
                    if (data.nationality) setRequesterNationality(data.nationality);
                    if (data.languages && Array.isArray(data.languages)) setRequesterLanguages(data.languages);
                }
            } catch (error) {
                console.error('Failed to check verification:', error);
            } finally {
                setIsCheckingVerification(false);
            }
        };
        checkVerification();
    }, [session?.user?.dbId]);

    // 取得用戶的求票數量
    useEffect(() => {
        const fetchUserRequests = async () => {
            if (!session?.user?.dbId) return;
            try {
                const response = await fetch(`/api/requests?userId=${session.user.dbId}&status=open`);
                if (response.ok) {
                    const data = await response.json();
                    const counts: Record<string, number> = {};
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    data.requests?.forEach((r: any) => {
                        counts[r.event_name] = (counts[r.event_name] || 0) + 1;
                    });
                    setUserRequestCounts(counts);
                }
            } catch (error) {
                console.error('Failed to fetch user requests:', error);
            }
        };
        fetchUserRequests();
    }, [session?.user?.dbId]);

    // 活動選項
    const eventOptions = useMemo(() => {
        const now = new Date();
        return events
            .filter((e) => {
                if (!e.isActive) return false;
                const expirationDate = e.eventEndDate || e.eventDate;
                return expirationDate > now;
            })
            .map((event) => {
                const currentCount = userRequestCounts[event.name] || 0;
                const maxAllowed = event.maxRequestsPerUser || 2;
                const isLimitReached = currentCount >= maxAllowed;
                return {
                    value: event.name,
                    label: isLimitReached
                        ? `${event.name} (${t('limitReached', { defaultValue: '已達上限' })})`
                        : event.name,
                    disabled: isLimitReached,
                };
            });
    }, [events, userRequestCounts, t]);

    // 選中的活動
    const selectedEvent = useMemo(() => {
        return events.find((e) => e.name === eventName);
    }, [events, eventName]);

    // 上限檢查
    const isLimitReached = useMemo(() => {
        if (!selectedEvent) return false;
        const currentCount = userRequestCounts[eventName] || 0;
        const maxAllowed = selectedEvent.maxRequestsPerUser || 2;
        return currentCount >= maxAllowed;
    }, [selectedEvent, eventName, userRequestCounts]);

    // 可用座位等級
    const availableSeatGrades = useMemo(() => {
        if (!selectedEvent?.ticketPriceTiers) return [];
        const grades = new Set(selectedEvent.ticketPriceTiers.map(t => t.seatGrade));
        return Array.from(grades);
    }, [selectedEvent]);

    // 處理活動選擇
    const handleEventSelect = (name: string) => {
        setEventName(name);
        setSeatGrades([]);
    };

    // 切換接受類型
    const toggleAcceptedType = (type: AcceptedTicketType) => {
        setAcceptedTypes((prev) =>
            prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
        );
    };

    // 切換座位等級
    const toggleSeatGrade = (grade: string) => {
        setSeatGrades((prev) =>
            prev.includes(grade) ? prev.filter((g) => g !== grade) : [...prev, grade]
        );
    };

    // 表單驗證
    const isFormValid = useMemo(() => {
        return (
            eventName.trim() !== '' &&
            acceptedTypes.length > 0 &&
            seatGrades.length > 0 &&
            quantity >= 1 &&
            !isLimitReached
        );
    }, [eventName, acceptedTypes, seatGrades, quantity, isLimitReached]);

    // 提交
    const handleSubmit = async () => {
        if (!session?.user?.dbId || !isFormValid) return;
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventId: selectedEvent?.id,
                    eventName,
                    acceptedTypes,
                    seatGrades,
                    quantity,
                    description: description.trim() || undefined,
                    ticketSource: ticketSource || undefined,
                    requesterNationality: requesterNationality || undefined,
                    requesterLanguages: requesterLanguages.length > 0 ? requesterLanguages : undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.code === 'MAX_REQUESTS_REACHED') {
                    alert(t('alreadyMaxRequests', {
                        current: data.current || 0,
                        max: data.max || 2,
                        defaultValue: `您已在此活動提交 ${data.current || 0} 張求票（上限 ${data.max || 2} 張）`,
                    }));
                } else {
                    alert(data.error || tCommon('publishFailed'));
                }
                return;
            }

            setShowSuccess(true);
        } catch (error) {
            console.error('Error creating request:', error);
            alert(tCommon('publishFailed'));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Loading
    if (isCheckingVerification) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    // 驗證層級不足 - 求票只需要 email 驗證 (applicant)
    if (verificationLevel && verificationLevel === 'unverified') {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Header title={t('title', { defaultValue: '求票' })} showBack />
                <main className="max-w-md mx-auto px-4 py-12">
                    <Card variant="glass" className="p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-6 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                            <Mail className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                            {t('verificationRequired', { defaultValue: '需要驗證' })}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            {t('needEmailForRequest', { defaultValue: '請先驗證 Email 才能提交求票請求' })}
                        </p>
                        <Link href="/verify-email">
                            <Button variant="primary" className="w-full">
                                {t('goVerifyEmail', { defaultValue: '前往驗證 Email' })}
                            </Button>
                        </Link>
                    </Card>
                </main>
            </div>
        );
    }

    // 成功頁面
    if (showSuccess) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
                <Card variant="glass" className="text-center max-w-md w-full">
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
                        <Check className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        🎉 {t('requestSuccess', { defaultValue: '求票已發布！' })}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {t('requestSuccessDesc', { defaultValue: '您的求票已成功發布，有票的人將會看到您的請求並與您聯繫！' })}
                    </p>
                    <Button
                        variant="primary"
                        fullWidth
                        onClick={() => router.push('/')}
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400"
                    >
                        {t('backToHome', { defaultValue: '返回首頁' })}
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative">
            <AuroraBackground />
            <Header title={t('title', { defaultValue: '求票' })} showBack />

            <div className="relative z-10 pt-20 pb-24 px-4">
                <div className="space-y-6 max-w-2xl mx-auto">

                    {/* 說明卡 */}
                    <div className="bg-emerald-50/80 dark:bg-emerald-500/10 backdrop-blur-xl border border-emerald-200/50 dark:border-emerald-500/30 rounded-2xl p-5 shadow-lg">
                        <div className="flex gap-3">
                            <Search className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                            <div className="text-sm text-emerald-800 dark:text-emerald-200 space-y-1">
                                <p className="font-semibold">{t('requestInfo', { defaultValue: '求票說明' })}</p>
                                <p className="text-emerald-700 dark:text-emerald-300">
                                    {t('requestInfoDesc', { defaultValue: '發表您的求票請求，有票的人看到後可以主動聯繫您。不需要設定價格，避免成為票券買賣。' })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 選擇活動 */}
                    <Card variant="glass">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                            {t('selectEvent', { defaultValue: '選擇活動' })}
                        </h3>
                        <Select
                            label={t('eventName', { defaultValue: '活動名稱' })}
                            placeholder={t('pleaseSelectEvent', { defaultValue: '請選擇活動' })}
                            options={eventOptions}
                            value={eventName}
                            onChange={handleEventSelect}
                            searchable
                            required
                        />

                        {/* 上限警告 */}
                        {isLimitReached && selectedEvent && (
                            <div className="flex items-start gap-2 p-3 mt-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
                                <div className="text-sm">
                                    <p className="text-red-700 dark:text-red-300 font-medium">
                                        {t('requestLimitReached', { defaultValue: '已達此活動的求票上限' })}
                                    </p>
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* 可接受類型 */}
                    {eventName && (
                        <Card variant="glass">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                {t('acceptedTypes', { defaultValue: '可接受的方式' })} <span className="text-red-500">*</span>
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                                {t('acceptedTypesDesc', { defaultValue: '選擇您可以接受的票券取得方式（可複選）' })}
                            </p>
                            <div className="space-y-2">
                                {(['find_companion', 'sub_ticket_transfer'] as const).map((type) => {
                                    const info = ACCEPTED_TICKET_TYPE_INFO[type];
                                    const isSelected = acceptedTypes.includes(type);
                                    return (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => toggleAcceptedType(type)}
                                            className={`
                        w-full py-3 px-4 rounded-xl border-2 text-left transition-all duration-200
                        ${isSelected
                                                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30'
                                                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'}
                      `}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300 dark:border-gray-500'}`}>
                                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                                </div>
                                                <div>
                                                    <p className={`font-medium ${isSelected ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-700 dark:text-gray-200'}`}>
                                                        {info.label}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{info.description}</p>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </Card>
                    )}

                    {/* 座位等級 */}
                    {eventName && acceptedTypes.length > 0 && (
                        <Card variant="glass">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                {t('wantedSeatGrades', { defaultValue: '想要的座位等級' })} <span className="text-red-500">*</span>
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                                {t('wantedSeatGradesDesc', { defaultValue: '選擇您可以接受的座位等級（可複選）' })}
                            </p>
                            {availableSeatGrades.length === 0 ? (
                                <p className="text-sm text-amber-600 dark:text-amber-400">
                                    {t('noSeatGrades', { defaultValue: '此活動尚未設定座位等級' })}
                                </p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {availableSeatGrades.map((grade) => {
                                        const isSelected = seatGrades.includes(grade);
                                        return (
                                            <button
                                                key={grade}
                                                type="button"
                                                onClick={() => toggleSeatGrade(grade)}
                                                className={`
                          py-2 px-4 rounded-lg border-2 text-sm font-medium transition-all
                          ${isSelected
                                                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                                                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-200'}
                        `}
                                            >
                                                {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                                                {grade}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </Card>
                    )}

                    {/* 票源與國籍/語言 */}
                    {eventName && acceptedTypes.length > 0 && seatGrades.length > 0 && (
                        <Card variant="glass">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                {tCommon('preferences', { defaultValue: '偏好設定' })} <span className="text-gray-400 text-sm font-normal">({tCommon('optional', { defaultValue: '選填' })})</span>
                            </h3>
                            <div className="space-y-5">
                                {/* 票源 */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                                        {tCommon('ticketSource', { defaultValue: '期望的票源' })}
                                    </label>
                                    <Select
                                        value={ticketSource}
                                        onChange={(val) => setTicketSource(val as TicketSource | '')}
                                        options={[
                                            { value: '', label: tCommon('anySource', { defaultValue: '不限票源' }) },
                                            { value: 'zaiko', label: TICKET_SOURCE_INFO.zaiko.label },
                                            { value: 'lawson', label: TICKET_SOURCE_INFO.lawson.label },
                                        ]}
                                    />
                                </div>
                                {/* 國籍 */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                                        {tCommon('nationality', { defaultValue: '您的國籍' })}
                                    </label>
                                    <Select
                                        value={requesterNationality}
                                        onChange={setRequesterNationality}
                                        options={[
                                            { value: '', label: tCommon('anyNationality', { defaultValue: '不公開（或不設定）' }) },
                                            ...NATIONALITY_OPTIONS.map(opt => ({ value: opt.value, label: tCommon(`nationalities.${opt.value}`, { defaultValue: opt.label }) }))
                                        ]}
                                    />
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        {tCommon('nationalityHelp', { defaultValue: '提供國籍有助於相同語言區的人與您聯繫。' })}
                                    </p>
                                </div>
                                {/* 語言 */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                        {tCommon('languages', { defaultValue: '您可以使用的語言' })}
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {LANGUAGE_OPTIONS.map((lang) => {
                                            const isSelected = requesterLanguages.includes(lang.value);
                                            return (
                                                <button
                                                    key={lang.value}
                                                    type="button"
                                                    onClick={() => {
                                                        setRequesterLanguages(prev => 
                                                            prev.includes(lang.value) 
                                                                ? prev.filter(l => l !== lang.value)
                                                                : [...prev, lang.value]
                                                        );
                                                    }}
                                                    className={`
                                                        py-1.5 px-3 rounded-lg border-2 text-sm font-medium transition-all
                                                        ${isSelected
                                                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                                                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-200'}
                                                    `}
                                                >
                                                    {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                                                    {tCommon(`languagesList.${lang.value}`, { defaultValue: lang.label })}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* 張數與備註 */}
                    {eventName && acceptedTypes.length > 0 && seatGrades.length > 0 && (
                        <Card variant="glass">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                {t('quantityAndNotes', { defaultValue: '張數與備註' })}
                            </h3>
                            <div className="space-y-4">
                                {/* 張數 */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                        {t('quantity', { defaultValue: '需要張數' })} <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2">
                                            {[1, 2].map((num) => (
                                                <button
                                                    key={num}
                                                    type="button"
                                                    onClick={() => setQuantity(num)}
                                                    className={`
                            w-12 h-12 rounded-xl border-2 text-lg font-bold transition-all
                            ${quantity === num
                                                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                                                            : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-gray-300'}
                          `}
                                                >
                                                    {num}
                                                </button>
                                            ))}
                                        </div>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            {t('tickets', { defaultValue: '張' })}
                                        </span>
                                    </div>
                                </div>

                                {/* 備註 */}
                                <Textarea
                                    label={t('notes', { defaultValue: '備註說明（選填）' })}
                                    placeholder={t('notesPlaceholder', { defaultValue: '例如：希望可以一起排隊聊天、只需要子票不需要同行...' })}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </Card>
                    )}

                    {/* 確認摘要與提交 */}
                    {isFormValid && (
                        <Card variant="glass">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                {t('confirmSummary', { defaultValue: '確認求票內容' })}
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">{t('eventLabel', { defaultValue: '活動' })}</span>
                                    <span className="font-medium text-gray-900 dark:text-gray-100">{eventName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">{t('acceptedLabel', { defaultValue: '接受方式' })}</span>
                                    <div className="flex gap-1">
                                        {acceptedTypes.map((type) => (
                                            <span key={type} className={`text-xs px-2 py-0.5 rounded-full ${ACCEPTED_TICKET_TYPE_INFO[type].color}`}>
                                                {ACCEPTED_TICKET_TYPE_INFO[type].label}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">{t('seatGradeLabel', { defaultValue: '座位等級' })}</span>
                                    <div className="flex gap-1">
                                        {seatGrades.map((grade) => (
                                            <span key={grade} className={`text-xs px-2 py-0.5 rounded-full ${getSeatGradeColor(grade)}`}>
                                                {grade}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">{t('quantityLabel', { defaultValue: '張數' })}</span>
                                    <span className="font-medium text-gray-900 dark:text-gray-100">{quantity} {t('tickets', { defaultValue: '張' })}</span>
                                </div>
                                {ticketSource && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">{tCommon('ticketSource', { defaultValue: '期望票源' })}</span>
                                        <span className="font-medium text-gray-900 dark:text-gray-100">{TICKET_SOURCE_INFO[ticketSource as TicketSource]?.label || ticketSource}</span>
                                    </div>
                                )}
                                {description && (
                                    <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                                        <span className="text-gray-500 dark:text-gray-400">{t('notesLabel', { defaultValue: '備註' })}</span>
                                        <p className="mt-1 text-gray-900 dark:text-gray-100">{description}</p>
                                    </div>
                                )}
                            </div>

                            <Button
                                variant="primary"
                                fullWidth
                                onClick={handleSubmit}
                                disabled={isSubmitting || !isFormValid}
                                className="mt-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>🙋 {t('submitRequest', { defaultValue: '發布求票' })}</>
                                )}
                            </Button>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
