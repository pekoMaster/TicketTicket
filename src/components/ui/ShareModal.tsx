'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Modal from '@/components/ui/Modal';
import {
    Share2,
    Copy,
    Check,
    X as XIcon,
    Facebook,
    MessageCircle,
    Send,
    Phone,
} from 'lucide-react';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    url: string;
    title: string;
    description?: string;
}

// SNS Platform definitions
const SNS_PLATFORMS = [
    {
        id: 'x',
        name: 'X (Twitter)',
        icon: XIcon,
        color: 'bg-black hover:bg-gray-800',
        getUrl: (url: string, text: string) =>
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    },
    {
        id: 'facebook',
        name: 'Facebook',
        icon: Facebook,
        color: 'bg-[#1877F2] hover:bg-[#166FE5]',
        getUrl: (url: string) =>
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
        id: 'line',
        name: 'LINE',
        icon: MessageCircle,
        color: 'bg-[#00B900] hover:bg-[#00A000]',
        getUrl: (url: string, text: string) =>
            `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    },
    {
        id: 'telegram',
        name: 'Telegram',
        icon: Send,
        color: 'bg-[#0088CC] hover:bg-[#0077B5]',
        getUrl: (url: string, text: string) =>
            `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    },
    {
        id: 'whatsapp',
        name: 'WhatsApp',
        icon: Phone,
        color: 'bg-[#25D366] hover:bg-[#20BD5A]',
        getUrl: (url: string, text: string) =>
            `https://wa.me/?text=${encodeURIComponent(text + '\n' + url)}`,
    },
];

export default function ShareModal({
    isOpen,
    onClose,
    url,
    title,
    description,
}: ShareModalProps) {
    const t = useTranslations('share');
    const [copied, setCopied] = useState(false);
    const [canNativeShare, setCanNativeShare] = useState(false);

    // Check if Web Share API is available
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCanNativeShare(typeof navigator !== 'undefined' && !!navigator.share);
    }, []);

    // Generate share text
    const shareText = description
        ? `🎫 ${title}\n${description}`
        : `🎫 ${title}`;

    // Handle native share (Web Share API)
    const handleNativeShare = async () => {
        try {
            await navigator.share({
                title: title,
                text: shareText,
                url: url,
            });
            onClose();
        } catch (err) {
            // User cancelled or error - do nothing
            console.log('Share cancelled or failed:', err);
        }
    };

    // Handle copy link
    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    // Handle SNS share
    const handleSNSShare = (platform: typeof SNS_PLATFORMS[0]) => {
        const shareUrl = platform.getUrl(url, shareText);
        window.open(shareUrl, '_blank', 'width=600,height=400');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('title', { defaultValue: '分享' })}>
            <div className="space-y-4">
                {/* Preview */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-sm">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{shareText}</p>
                    <p className="text-indigo-600 dark:text-indigo-400 mt-1 truncate">{url}</p>
                </div>

                {/* Native Share Button (if available) */}
                {canNativeShare && (
                    <button
                        onClick={handleNativeShare}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                    >
                        <Share2 className="w-5 h-5" />
                        {t('nativeShare', { defaultValue: '分享...' })}
                    </button>
                )}

                {/* Divider */}
                {canNativeShare && (
                    <div className="relative flex items-center">
                        <div className="flex-grow border-t border-gray-200 dark:border-gray-600"></div>
                        <span className="flex-shrink mx-3 text-xs text-gray-400 dark:text-gray-500">
                            {t('orShareVia', { defaultValue: '或選擇平台' })}
                        </span>
                        <div className="flex-grow border-t border-gray-200 dark:border-gray-600"></div>
                    </div>
                )}

                {/* SNS Platforms Grid */}
                <div className="grid grid-cols-5 gap-2">
                    {SNS_PLATFORMS.map((platform) => {
                        const Icon = platform.icon;
                        return (
                            <button
                                key={platform.id}
                                onClick={() => handleSNSShare(platform)}
                                className={`flex flex-col items-center justify-center p-3 rounded-lg text-white transition-colors ${platform.color}`}
                                title={platform.name}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="text-[10px] mt-1 truncate w-full text-center">
                                    {platform.name.split(' ')[0]}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Copy Link Button */}
                <button
                    onClick={handleCopyLink}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors border ${copied
                        ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-green-600 dark:text-green-400'
                        : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
                        }`}
                >
                    {copied ? (
                        <>
                            <Check className="w-5 h-5" />
                            {t('copied', { defaultValue: '已複製！' })}
                        </>
                    ) : (
                        <>
                            <Copy className="w-5 h-5" />
                            {t('copyLink', { defaultValue: '複製連結' })}
                        </>
                    )}
                </button>
            </div>
        </Modal>
    );
}
