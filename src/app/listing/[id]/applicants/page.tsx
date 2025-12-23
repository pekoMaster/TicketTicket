'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Tag from '@/components/ui/Tag';
import {
    Users,
    MessageCircle,
    Check,
    X,
    Loader2,
    Star,
    Calendar,
    MapPin,
    Clock,
    AlertTriangle,
    ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

interface User {
    id: string;
    username: string;
    avatar_url?: string;
    custom_avatar_url?: string;
    rating: number;
    review_count: number;
}

interface Application {
    id: string;
    guest_id: string;
    status: 'pending' | 'accepted' | 'rejected';
    message?: string;
    created_at: string;
    selected_at?: string;
    guest: User;
}

interface Conversation {
    id: string;
    guest_id: string;
    conversation_type: 'inquiry' | 'application' | 'matched';
    guest: User;
    last_message?: {
        content: string;
        created_at: string;
    };
}

interface Listing {
    id: string;
    event_name: string;
    event_date: string;
    venue: string;
    status: string;
    available_slots: number;
    total_slots: number;
    inquiry_count: number;
    application_count: number;
}

export default function ApplicantsPage() {
    const params = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const t = useTranslations('applicants');
    const tCommon = useTranslations('common');
    const listingId = params.id as string;

    const [listing, setListing] = useState<Listing | null>(null);
    const [applications, setApplications] = useState<Application[]>([]);
    const [inquiries, setInquiries] = useState<Conversation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedApplicant, setSelectedApplicant] = useState<Application | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isSelecting, setIsSelecting] = useState(false);
    const [activeTab, setActiveTab] = useState<'applications' | 'inquiries'>('applications');

    // 獲取刊登和申請者資料
    const fetchData = useCallback(async () => {
        if (!session?.user?.dbId) return;

        try {
            // 獲取刊登詳情
            const listingRes = await fetch(`/api/listings/${listingId}`);
            if (!listingRes.ok) {
                router.push('/messages');
                return;
            }
            const listingData = await listingRes.json();

            // 確認是主辦方
            if (listingData.host_id !== session.user.dbId) {
                router.push('/messages');
                return;
            }

            setListing(listingData);

            // 獲取申請者列表
            const appsRes = await fetch(`/api/listings/${listingId}/applicants`);
            if (appsRes.ok) {
                const appsData = await appsRes.json();
                setApplications(appsData.applications || []);
                setInquiries(appsData.inquiries || []);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [listingId, session?.user?.dbId, router]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // 選擇申請者
    const handleSelectApplicant = async () => {
        if (!selectedApplicant || isSelecting) return;

        setIsSelecting(true);
        try {
            const response = await fetch(`/api/listings/${listingId}/select`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicationId: selectedApplicant.id }),
            });

            if (response.ok) {
                setShowConfirmModal(false);
                // 重新載入資料
                fetchData();
            } else {
                const error = await response.json();
                console.error('Selection error:', error);
            }
        } catch (error) {
            console.error('Error selecting applicant:', error);
        } finally {
            setIsSelecting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (!listing) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Header title={t('title', { defaultValue: '申請者管理' })} showBack />
                <main className="max-w-2xl mx-auto px-4 py-8">
                    <p className="text-center text-gray-500">{t('notFound', { defaultValue: '找不到刊登' })}</p>
                </main>
            </div>
        );
    }

    const pendingApplications = applications.filter(a => a.status === 'pending');
    const hasSelected = applications.some(a => a.status === 'accepted');

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 lg:pb-8">
            <Header title={t('title', { defaultValue: '申請者管理' })} showBack />

            <main className="max-w-2xl mx-auto px-4 py-4">
                {/* 刊登資訊卡 */}
                <Card className="p-4 mb-4">
                    <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {listing.event_name}
                    </h2>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(listing.event_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{listing.venue}</span>
                        </div>
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-sm">
                        <span className="text-indigo-600 dark:text-indigo-400">
                            {t('inquiryCount', { count: inquiries.length, defaultValue: `${inquiries.length} 人諮詢中` })}
                        </span>
                        <span className="text-green-600 dark:text-green-400">
                            {t('applicationCount', { count: pendingApplications.length, defaultValue: `${pendingApplications.length} 人已申請` })}
                        </span>
                    </div>
                </Card>

                {/* Tab 切換 */}
                <div className="flex mb-4 bg-white dark:bg-gray-800 rounded-lg p-1">
                    <button
                        onClick={() => setActiveTab('applications')}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${activeTab === 'applications'
                            ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                    >
                        {t('applicationsTab', { defaultValue: '已申請' })} ({pendingApplications.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('inquiries')}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${activeTab === 'inquiries'
                            ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                    >
                        {t('inquiriesTab', { defaultValue: '諮詢中' })} ({inquiries.length})
                    </button>
                </div>

                {/* 已選中提示 */}
                {hasSelected && (
                    <Card className="p-4 mb-4 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                            <Check className="w-5 h-5" />
                            <span>{t('alreadySelected', { defaultValue: '您已選擇配對對象，其他申請者將收到未配對成功的通知' })}</span>
                        </div>
                    </Card>
                )}

                {/* 申請者列表 */}
                {activeTab === 'applications' && (
                    <div className="space-y-3">
                        {pendingApplications.length === 0 ? (
                            <Card className="p-8 text-center">
                                <Users className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                                <p className="text-gray-500 dark:text-gray-400">
                                    {t('noApplications', { defaultValue: '目前沒有申請者' })}
                                </p>
                            </Card>
                        ) : (
                            pendingApplications.map((app) => (
                                <Card key={app.id} className="p-4">
                                    <div className="flex items-start gap-3">
                                        <Avatar
                                            src={app.guest.custom_avatar_url || app.guest.avatar_url}
                                            alt={app.guest.username}
                                            size="lg"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                                    {app.guest.username}
                                                </span>
                                                <div className="flex items-center gap-1 text-amber-500">
                                                    <Star className="w-4 h-4 fill-current" />
                                                    <span className="text-sm">{app.guest.rating.toFixed(1)}</span>
                                                    <span className="text-gray-400 text-xs">({app.guest.review_count})</span>
                                                </div>
                                            </div>
                                            {app.message && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                                    {app.message}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-400 mt-1">
                                                {t('appliedAt', { defaultValue: '申請於' })} {new Date(app.created_at).toLocaleString('zh-TW', { hour12: false })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mt-4">
                                        <Link href={`/chat/${app.id}`} className="flex-1">
                                            <Button variant="secondary" fullWidth>
                                                <MessageCircle className="w-4 h-4 mr-2" />
                                                {t('chat', { defaultValue: '聊天' })}
                                            </Button>
                                        </Link>
                                        {!hasSelected && (
                                            <Button
                                                className="flex-1"
                                                onClick={() => {
                                                    setSelectedApplicant(app);
                                                    setShowConfirmModal(true);
                                                }}
                                            >
                                                <Check className="w-4 h-4 mr-2" />
                                                {t('select', { defaultValue: '選擇' })}
                                            </Button>
                                        )}
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                )}

                {/* 諮詢中列表 */}
                {activeTab === 'inquiries' && (
                    <div className="space-y-3">
                        {inquiries.length === 0 ? (
                            <Card className="p-8 text-center">
                                <MessageCircle className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                                <p className="text-gray-500 dark:text-gray-400">
                                    {t('noInquiries', { defaultValue: '目前沒有諮詢' })}
                                </p>
                            </Card>
                        ) : (
                            inquiries.map((inq) => (
                                <Link key={inq.id} href={`/chat/${inq.id}`}>
                                    <Card className="p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Avatar
                                                src={inq.guest.custom_avatar_url || inq.guest.avatar_url}
                                                alt={inq.guest.username}
                                                size="md"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-gray-900 dark:text-gray-100">
                                                        {inq.guest.username}
                                                    </span>
                                                    <Tag variant="info" size="sm">
                                                        {t('inquiring', { defaultValue: '諮詢中' })}
                                                    </Tag>
                                                </div>
                                                {inq.last_message && (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                                        {inq.last_message.content}
                                                    </p>
                                                )}
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-gray-400" />
                                        </div>
                                    </Card>
                                </Link>
                            ))
                        )}
                    </div>
                )}
            </main>

            {/* 確認選擇 Modal */}
            <Modal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                title={t('confirmTitle', { defaultValue: '確認選擇' })}
            >
                <div className="p-4">
                    {selectedApplicant && (
                        <>
                            <div className="flex items-center gap-3 mb-4">
                                <Avatar
                                    src={selectedApplicant.guest.custom_avatar_url || selectedApplicant.guest.avatar_url}
                                    alt={selectedApplicant.guest.username}
                                    size="lg"
                                />
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">
                                        {selectedApplicant.guest.username}
                                    </p>
                                    <div className="flex items-center gap-1 text-amber-500 text-sm">
                                        <Star className="w-4 h-4 fill-current" />
                                        <span>{selectedApplicant.guest.rating.toFixed(1)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
                                <div className="flex gap-2">
                                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-amber-800 dark:text-amber-200">
                                        <p className="font-medium mb-1">{t('confirmWarningTitle', { defaultValue: '選擇後無法更改' })}</p>
                                        <p>{t('confirmWarningDesc', { defaultValue: '選擇後，其他申請者將收到「未配對成功」的通知，且無法再變更選擇。' })}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="secondary"
                                    className="flex-1"
                                    onClick={() => setShowConfirmModal(false)}
                                >
                                    {tCommon('cancel')}
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={handleSelectApplicant}
                                    loading={isSelecting}
                                >
                                    {t('confirmSelect', { defaultValue: '確認選擇' })}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </Modal>
        </div>
    );
}
