import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Bell, Send, Trash2, Check, ExternalLink } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
    UserProfile,
    NotificationPreferences,
    DEFAULT_NOTIFICATION_PREFERENCES,
    NOTIFICATION_TYPE_INFO,
    NotificationType
} from '@/types';
import Link from 'next/link';

interface NotificationSettingsProps {
    profile: UserProfile | null;
    onUpdate: () => void;
}

export default function NotificationSettings({ profile, onUpdate }: NotificationSettingsProps) {
    const t = useTranslations('profileSettings');

    const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>(
        profile?.notificationPreferences || DEFAULT_NOTIFICATION_PREFERENCES
    );

    // Webhook state
    const [webhookUrl, setWebhookUrl] = useState('');
    const [webhookName, setWebhookName] = useState('');
    const [webhookActive, setWebhookActive] = useState(false);
    const [isSavingWebhook, setIsSavingWebhook] = useState(false);
    const [isTestingWebhook, setIsTestingWebhook] = useState(false);
    const [isDeletingWebhook, setIsDeletingWebhook] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Track which specific toggle is saving: "type-channel" (e.g., "new_application-email")
    const [savingItem, setSavingItem] = useState<string | null>(null);

    // Sync props to state
    useEffect(() => {
        if (profile?.notificationPreferences) {
            setNotificationPrefs(profile.notificationPreferences);
        }
    }, [profile]);

    // Fetch webhook on mount
    useEffect(() => {
        const fetchWebhook = async () => {
            try {
                const res = await fetch('/api/webhooks');
                if (res.ok) {
                    const data = await res.json();
                    if (data.webhook) {
                        setWebhookUrl(data.webhook.webhook_url || '');
                        setWebhookName(data.webhook.webhook_name || '');
                        setWebhookActive(data.webhook.is_active || false);
                    }
                }
            } catch (e) {
                console.error(e);
            }
        };
        if (profile?.id) fetchWebhook();
    }, [profile]);

    const updatePreference = async (type: NotificationType, channel: 'email' | 'discord' | 'line', newValue: boolean) => {
        const loadingKey = `${type}-${channel}`;
        setSavingItem(loadingKey);

        // Prepare the new state object for the API request
        const currentTypePrefs = notificationPrefs[type] || { email: false, discord: false, line: false };
        const newPrefs = {
            ...notificationPrefs,
            [type]: { ...currentTypePrefs, [channel]: newValue }
        };

        console.log(`[Frontend] Saving ${loadingKey} to ${newValue}`);

        try {
            const res = await fetch('/api/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationPreferences: newPrefs }),
            });

            if (res.ok) {
                const data = await res.json();
                console.log('[Frontend] Save response data:', data);

                // CRITICAL: Update state ONLY after server confirmation
                if (data.notificationPreferences) {
                    setNotificationPrefs(data.notificationPreferences);
                } else {
                    setNotificationPrefs(newPrefs);
                }

                // Refresh parent state to prevent reversion on tab switch
                onUpdate();
                setMessage({ type: 'success', text: t('saveSuccess') });
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            console.error('Failed to update prefs:', error);
            setMessage({ type: 'error', text: t('saveError') });
        } finally {
            setSavingItem(null);
        }
    };

    const handleSaveWebhook = async () => {
        if (!webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
            setMessage({ type: 'error', text: t('webhook.invalidUrl') });
            return;
        }
        setIsSavingWebhook(true);
        try {
            const res = await fetch('/api/webhooks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ webhookUrl, webhookName }),
            });
            if (res.ok) {
                setWebhookActive(true);
                setMessage({ type: 'success', text: t('webhook.saved') });
            } else {
                setMessage({ type: 'error', text: t('saveError') });
            }
        } catch (e) {
            setMessage({ type: 'error', text: t('saveError') });
        } finally {
            setIsSavingWebhook(false);
        }
    };

    const handleTestWebhook = async () => {
        setIsTestingWebhook(true);
        try {
            const res = await fetch('/api/webhooks/test', { method: 'POST' });
            if (res.ok) {
                setMessage({ type: 'success', text: t('webhook.testSuccess') });
            } else {
                setMessage({ type: 'error', text: t('webhook.testFailed') });
            }
        } catch (e) {
            setMessage({ type: 'error', text: t('webhook.testFailed') });
        } finally {
            setIsTestingWebhook(false);
        }
    };

    const handleDeleteWebhook = async () => {
        if (!confirm(t('webhook.delete') + '?')) return;
        setIsDeletingWebhook(true);
        try {
            const res = await fetch('/api/webhooks', { method: 'DELETE' });
            if (res.ok) {
                setWebhookUrl('');
                setWebhookName('');
                setWebhookActive(false);
                setMessage({ type: 'success', text: t('webhook.deleted') });
            }
        } catch (e) {
            setMessage({ type: 'error', text: t('saveError') });
        } finally {
            setIsDeletingWebhook(false);
        }
    };

    // Clear message
    useEffect(() => {
        if (message) {
            const t = setTimeout(() => setMessage(null), 3000);
            return () => clearTimeout(t);
        }
    }, [message]);

    return (
        <div className="space-y-6">
            {message && (
                <div className={`fixed bottom-8 right-8 z-[100] px-4 py-3 rounded-lg flex items-center gap-3 shadow-xl transform transition-all duration-300 animate-in slide-in-from-bottom-5 border ${message.type === 'success' ? 'bg-white dark:bg-gray-800 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400' : 'bg-white dark:bg-gray-800 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'}`}>
                    <span className="text-base font-medium">{message.text}</span>
                </div>
            )}

            {/* Subscription Shortcut */}
            <Card variant="glass" className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-100 dark:border-indigo-800">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-800 rounded-full">
                            <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
                        </div>
                        <div>
                            <h3 className="font-medium text-gray-900 dark:text-gray-100">{t('mySubscriptions')}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">管理您的活動訂閱與關鍵字通知</p>
                        </div>
                    </div>
                    <Link href="/profile/subscriptions">
                        <Button variant="secondary" size="sm">
                            {t('viewMore')} <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                    </Link>
                </div>
            </Card>

            {/* Notification Preferences */}
            <Card variant="glass">
                <div className="flex items-center gap-2 mb-2">
                    <Bell className="w-5 h-5 text-indigo-500" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('notifications.title')}</h2>
                </div>
                <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('notifications.description')}</p>
                    <span className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full animate-in fade-in">
                        {t('autoSaved')}
                    </span>
                </div>

                {/* Header Row (Desktop) */}
                <div className="hidden sm:grid grid-cols-[1fr_60px_60px_60px] gap-2 mb-3 px-2">
                    <div></div>
                    <div className="text-center text-xs font-medium text-gray-500 dark:text-gray-400">{t('notifications.email')}</div>
                    <div className="text-center text-xs font-medium text-gray-500 dark:text-gray-400">{t('notifications.discord')}</div>
                    <div className="text-center text-xs font-medium text-gray-500 dark:text-gray-400">{t('notifications.line')}</div>
                </div>

                <div className="space-y-6">
                    {[
                        {
                            id: 'activity',
                            types: ['new_application', 'application_accepted', 'application_rejected', 'new_review'] as NotificationType[]
                        },
                        {
                            id: 'discovery',
                            types: ['subscription_match'] as NotificationType[]
                        },
                        {
                            id: 'system',
                            types: ['listing_expired', 'system'] as NotificationType[]
                        }
                    ].map((group) => (
                        <div key={group.id} className="space-y-2">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 px-2 flex items-center gap-2">
                                <span className="w-1 h-4 bg-indigo-500 rounded-full"></span>
                                {t(`notifications.groups.${group.id}`)}
                            </h3>

                            <div className="space-y-2">
                                {group.types.map((type) => {
                                    const info = NOTIFICATION_TYPE_INFO[type];
                                    const prefs = notificationPrefs[type] || { email: false, discord: false, line: false };
                                    const hasDiscord = !!profile?.discordId;

                                    return (
                                        <div key={type} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/70 transition-colors">
                                            <div className="sm:grid sm:grid-cols-[1fr_60px_60px_60px] sm:gap-2 sm:items-center">
                                                {/* Label */}
                                                <div className="mb-2 sm:mb-0">
                                                    <div className="flex items-center gap-2">
                                                        <span>{info.icon}</span>
                                                        <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                                            {t(`notifications.types.${type}`)}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                                                        {t(`notifications.types.${type}_desc`)}
                                                    </p>
                                                </div>

                                                {/* Toggles */}
                                                {['email', 'discord', 'line'].map((channel) => {
                                                    const ch = channel as 'email' | 'discord' | 'line';
                                                    if (ch === 'discord' && !info.supportsDiscord) return <span key={ch} className="text-xs text-gray-400 mx-auto block text-center">-</span>;
                                                    if (ch === 'line' && !info.supportsLine) return <span key={ch} className="text-xs text-gray-400 mx-auto block text-center">-</span>;
                                                    if (ch === 'discord' && !hasDiscord) return <span key={ch} className="text-xs text-orange-500 mx-auto block text-center leading-tight">{t('notifications.discordRequired')}</span>;
                                                    if (ch === 'line') return <span key={ch} className="text-xs text-gray-400 mx-auto block text-center transform scale-90">{t('notifications.lineComingSoon')}</span>;

                                                    const isLoading = savingItem === `${type}-${ch}`;
                                                    const isChecked = !!prefs[ch];

                                                    return (
                                                        <div key={ch} className="flex sm:block justify-between items-center mt-2 sm:mt-0">
                                                            <span className="sm:hidden text-xs text-gray-500 capitalize">{ch}</span>
                                                            <button
                                                                type="button"
                                                                disabled={isLoading}
                                                                onClick={() => updatePreference(type, ch, !isChecked)}
                                                                className={`relative w-10 h-5 rounded-full transition-colors mx-auto ${isChecked
                                                                    ? (ch === 'discord' ? 'bg-[#5865F2]' : 'bg-indigo-500')
                                                                    : 'bg-gray-300 dark:bg-gray-600'
                                                                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                            >
                                                                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isChecked ? 'translate-x-5' : 'translate-x-0'} flex items-center justify-center`}>
                                                                    {isLoading && <div className="w-2.5 h-2.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />}
                                                                </span>
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Discord Webhook */}
            <Card variant="glass">
                <div className="flex items-center gap-2 mb-2">
                    <Bell className="w-5 h-5 text-indigo-500" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('webhook.title')}</h2>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('webhook.description')}</p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('webhook.name')}
                        </label>
                        <input
                            type="text"
                            value={webhookName}
                            onChange={(e) => setWebhookName(e.target.value)}
                            placeholder={t('webhook.namePlaceholder')}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('webhook.url')} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="url"
                            value={webhookUrl}
                            onChange={(e) => setWebhookUrl(e.target.value)}
                            placeholder="https://discord.com/api/webhooks/..."
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button variant="primary" onClick={handleSaveWebhook} loading={isSavingWebhook} disabled={!webhookUrl} className="flex-1">
                            {t('webhook.save')}
                        </Button>
                        {webhookActive && (
                            <>
                                <Button variant="secondary" onClick={handleTestWebhook} loading={isTestingWebhook}>
                                    <Send className="w-4 h-4" />
                                </Button>
                                <Button variant="secondary" onClick={handleDeleteWebhook} loading={isDeletingWebhook} className="text-red-500 hover:text-red-600">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </>
                        )}
                    </div>
                    {webhookActive && (
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                                <Check className="w-4 h-4" />
                                <span className="text-sm font-medium">{t('webhook.active')}</span>
                            </div>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
