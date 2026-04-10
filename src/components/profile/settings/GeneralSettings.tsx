import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { User, Camera, Loader2, ShieldCheck, Check, AlertCircle, MessageCircle, Unlink, ExternalLink } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Avatar from '@/components/ui/Avatar';
import ThemeSwitcher from '@/components/ui/ThemeSwitcher';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import CurrencySwitcher from '@/components/ui/CurrencySwitcher';
import { UserProfile } from '@/types';

interface GeneralSettingsProps {
    profile: UserProfile | null;
    onUpdate: () => void;
}

export default function GeneralSettings({ profile, onUpdate }: GeneralSettingsProps) {
    const t = useTranslations('profileSettings');
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [username, setUsername] = useState(profile?.username || '');
    const [showLine, setShowLine] = useState(profile?.showLine || false);
    const [showDiscord, setShowDiscord] = useState(profile?.showDiscord || false);
    const [isLinking, setIsLinking] = useState<'line' | 'discord' | null>(null);

    const displayAvatarUrl = profile?.customAvatarUrl || profile?.avatarUrl;

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Only image files are allowed');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            alert('Image size must be less than 2MB');
            return;
        }

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('avatar', file);

            const response = await fetch('/api/profile/avatar', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                onUpdate();
                setSaveMessage({ type: 'success', text: t('saveSuccess') });
            } else {
                alert(t('saveError'));
            }
        } catch (error) {
            console.error('Error uploading avatar:', error);
            alert(t('saveError'));
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleRemoveAvatar = async () => {
        if (!confirm('Are you sure?')) return;
        setIsUploading(true);
        try {
            const response = await fetch('/api/profile/avatar', { method: 'DELETE' });
            if (response.ok) {
                onUpdate();
                setSaveMessage({ type: 'success', text: t('saveSuccess') });
            }
        } catch (error) {
            console.error('Error removing avatar:', error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
            const response = await fetch('/api/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    showLine,
                    showDiscord,
                }),
            });

            if (response.ok) {
                onUpdate();
                setSaveMessage({ type: 'success', text: t('saveSuccess') });
                setTimeout(() => setSaveMessage(null), 3000);
            } else {
                setSaveMessage({ type: 'error', text: t('saveError') });
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            setSaveMessage({ type: 'error', text: t('saveError') });
        } finally {
            setIsSaving(false);
        }
    };

    const handleConnect = (provider: 'line' | 'discord') => {
        setIsLinking(provider);
        window.location.href = `/api/auth/link/${provider}`;
    };

    const handleDisconnect = async (provider: 'line' | 'discord') => {
        if (!confirm(t('disconnect') + '?')) return;
        setIsLinking(provider);
        try {
            const response = await fetch('/api/auth/unlink', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider }),
            });

            if (response.ok) {
                onUpdate();
            } else {
                alert(t('saveError'));
            }
        } catch (error) {
            console.error('Error disconnecting:', error);
        } finally {
            setIsLinking(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Save Message Toast */}
            {saveMessage && (
                <div className={`fixed top-24 right-4 z-50 p-3 rounded-lg flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-top-2 ${saveMessage.type === 'success'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/80 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/80 dark:text-red-200'
                    }`}>
                    {saveMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span className="text-sm font-medium">{saveMessage.text}</span>
                </div>
            )}

            {/* App Settings (New Location) */}
            <Card variant="glass">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('appSettings')}</h2>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300">{t('theme')}</span>
                        <ThemeSwitcher />
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300">{t('language')}</span>
                        <LanguageSwitcher />
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300">{t('currency', { defaultValue: '幣值' })}</span>
                        <CurrencySwitcher />
                    </div>
                </div>
            </Card>

            {/* Basic Info */}
            <Card variant="glass">
                <div className="flex items-center gap-2 mb-4">
                    <User className="w-5 h-5 text-indigo-500" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('basicInfo')}</h2>
                </div>

                <div className="flex flex-col items-center mb-6">
                    <div className="relative">
                        <Avatar src={displayAvatarUrl} size="xl" className="w-24 h-24" />
                        <button
                            onClick={handleAvatarClick}
                            disabled={isUploading}
                            className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-indigo-600 transition-colors disabled:opacity-50"
                        >
                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{t('uploadHint')}</p>
                    {profile?.customAvatarUrl && (
                        <button onClick={handleRemoveAvatar} className="text-sm text-red-500 hover:text-red-600 mt-2">
                            {t('removeAvatar')}
                        </button>
                    )}
                </div>

                <div className="space-y-4">
                    <Input
                        label={t('username')}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder={t('usernamePlaceholder')}
                        maxLength={50}
                    />
                    <Button fullWidth onClick={handleSaveProfile} loading={isSaving}>
                        {t('save')}
                    </Button>
                </div>
            </Card>

            {/* Phone Verification */}
            <Card variant="glass">
                <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-500" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('phoneVerification')}</h2>
                </div>

                {profile?.verificationLevel === 'host' ? (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                            <Check className="w-5 h-5" />
                            <span className="font-medium">{t('phoneVerified')}</span>
                        </div>
                        <p className="text-sm text-green-600 dark:text-green-400 mt-1">{t('phoneVerifiedHint')}</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                                <AlertCircle className="w-5 h-5" />
                                <span className="font-medium">{t('phoneNotVerified')}</span>
                            </div>
                            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">{t('phoneVerificationRequired')}</p>
                        </div>
                        <Button variant="primary" fullWidth onClick={() => router.push('/verify-phone')}>
                            {t('verifyPhone')}
                        </Button>
                    </div>
                )}
            </Card>

            {/* Linked Accounts */}
            <Card variant="glass">
                <div className="flex items-center gap-2 mb-2">
                    <MessageCircle className="w-5 h-5 text-indigo-500" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('linkedAccounts')}</h2>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('linkedAccountsHint')}</p>

                {/* LINE */}
                <div className="space-y-4 mb-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <svg className="w-6 h-6 text-[#00B900]" viewBox="0 0 24 24" fill="currentColor"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" /></svg>
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">LINE</p>
                                    {profile?.lineId ? (
                                        <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                                            <Check className="w-3 h-3" /> {t('connected')}: {profile.lineId}
                                        </p>
                                    ) : (
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('notConnected')}</p>
                                    )}
                                </div>
                            </div>
                            {profile?.lineId ? (
                                <button onClick={() => handleDisconnect('line')} disabled={isLinking === 'line'} className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg">
                                    {isLinking === 'line' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlink className="w-4 h-4" />}
                                    {t('disconnect')}
                                </button>
                            ) : (
                                <button onClick={() => handleConnect('line')} disabled={isLinking === 'line'} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[#00B900] text-white rounded-lg">
                                    {isLinking === 'line' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                                    {t('connect')}
                                </button>
                            )}
                        </div>
                        {profile?.lineId && (
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                                <span className="text-sm text-gray-600 dark:text-gray-400">{t('showOnProfile')}</span>
                                <button onClick={() => { setShowLine(!showLine); handleSaveProfile(); }} className={`relative w-11 h-6 rounded-full transition-colors ${showLine ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${showLine ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Discord */}
                <div className="space-y-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <svg className="w-6 h-6 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" /></svg>
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">Discord</p>
                                    {profile?.discordId ? (
                                        <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                                            <Check className="w-3 h-3" /> {t('connected')}: {profile.discordId}
                                        </p>
                                    ) : (
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('notConnected')}</p>
                                    )}
                                </div>
                            </div>
                            {profile?.discordId ? (
                                <button onClick={() => handleDisconnect('discord')} disabled={isLinking === 'discord'} className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg">
                                    {isLinking === 'discord' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlink className="w-4 h-4" />}
                                    {t('disconnect')}
                                </button>
                            ) : (
                                <button onClick={() => handleConnect('discord')} disabled={isLinking === 'discord'} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[#5865F2] text-white rounded-lg">
                                    {isLinking === 'discord' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                                    {t('connect')}
                                </button>
                            )}
                        </div>
                        {profile?.discordId && (
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                                <span className="text-sm text-gray-600 dark:text-gray-400">{t('showOnProfile')}</span>
                                <button onClick={() => { setShowDiscord(!showDiscord); handleSaveProfile(); }} className={`relative w-11 h-6 rounded-full transition-colors ${showDiscord ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${showDiscord ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
}
