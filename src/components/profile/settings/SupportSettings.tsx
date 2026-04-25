import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Bug, FileText, HelpCircle, LogOut, ChevronRight, Scale, Ticket } from 'lucide-react';
import { signOut } from 'next-auth/react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Link from 'next/link';
import { UserProfile } from '@/types';

interface SupportSettingsProps {
    profile: UserProfile | null;
}

export default function SupportSettings({ profile }: SupportSettingsProps) {
    const t = useTranslations('profileSettings');
    const tLegal = useTranslations('legal');
    const tProfile = useTranslations('profile');
    const tCommon = useTranslations('common');

    const [bugModalOpen, setBugModalOpen] = useState(false);
    const [bugTitle, setBugTitle] = useState('');
    const [bugDescription, setBugDescription] = useState('');
    const [isSubmittingBug, setIsSubmittingBug] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleSubmitBug = async () => {
        if (!bugTitle.trim() || !bugDescription.trim()) return;
        setIsSubmittingBug(true);
        try {
            const response = await fetch('/api/bug-reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: bugTitle, description: bugDescription }),
            });
            if (response.ok) {
                setSaveMessage({ type: 'success', text: 'Report submitted successfully' });
                setBugModalOpen(false);
                setBugTitle('');
                setBugDescription('');
            } else {
                setSaveMessage({ type: 'error', text: 'Failed to submit report' });
            }
        } catch (e) {
            setSaveMessage({ type: 'error', text: 'Failed to submit report' });
        } finally {
            setIsSubmittingBug(false);
        }
    };

    // eslint-disable-next-line
    const MenuItem = ({ icon, label, href, onClick, className }: any) => {
        const content = (
            <div className={`flex items-center gap-3 px-4 py-3.5 w-full text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${className}`}>
                <span className="text-gray-500 dark:text-gray-400">{icon}</span>
                <span className="flex-1 font-medium text-gray-900 dark:text-gray-100">{label}</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
        );

        if (onClick) {
            return <button onClick={onClick} className="w-full">{content}</button>;
        }
        return <Link href={href} className="block w-full">{content}</Link>;
    };

    return (
        <div className="space-y-6">
            {saveMessage && (
                <div className="fixed bottom-4 right-4 z-50 p-3 bg-green-100 text-green-800 rounded-lg shadow-lg">
                    {saveMessage.text}
                </div>
            )}

            {/* Support Actions */}
            <h3 className="font-medium text-gray-900 dark:text-gray-100 ml-1">{t('helpSupport')}</h3>
            <Card padding="none" className="overflow-hidden">
                <button
                    onClick={() => setBugModalOpen(true)}
                    className="flex items-center gap-3 px-4 py-3.5 w-full text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                    <Bug className="w-5 h-5 text-red-500" />
                    <span className="flex-1 font-medium text-gray-900 dark:text-gray-100">{t('reportBug')}</span>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
                <MenuItem icon={<HelpCircle className="w-5 h-5" />} label={t('helpSupport')} href="#" />
            </Card>

            {/* Legal Links */}
            <h3 className="font-medium text-gray-900 dark:text-gray-100 ml-1">{t('legal')}</h3>
            <Card padding="none" className="overflow-hidden">
                <MenuItem icon={<FileText className="w-5 h-5" />} label={t('terms')} href="/legal/terms" />
                <MenuItem icon={<FileText className="w-5 h-5" />} label={t('privacy')} href="/legal/privacy" />
                <MenuItem icon={<Scale className="w-5 h-5" />} label={tLegal('tokushoho')} href="/legal/tokushoho" />
                <MenuItem icon={<Ticket className="w-5 h-5" />} label={tLegal('ticketRegulations')} href="/legal/ticket-regulations" />
            </Card>

            {/* Account Actions */}
            <Card padding="none" className="overflow-hidden border-red-100 dark:border-red-900/30">
                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="flex items-center gap-3 px-4 py-3.5 w-full text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="flex-1 font-medium">{tProfile('logout')}</span>
                    <ChevronRight className="w-5 h-5 text-red-300" />
                </button>
            </Card>

            {/* Bug Report Modal */}
            <Modal
                isOpen={bugModalOpen}
                onClose={() => setBugModalOpen(false)}
                title={t('reportBugTitle')}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('bugTitleLabel')}</label>
                        <input
                            type="text"
                            value={bugTitle}
                            onChange={(e) => setBugTitle(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                            maxLength={200}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('bugDescriptionLabel')}</label>
                        <textarea
                            value={bugDescription}
                            onChange={(e) => setBugDescription(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 resize-none"
                            rows={5}
                            maxLength={5000}
                        />
                    </div>
                    <div className="flex gap-2 justify-end">
                        <Button variant="secondary" onClick={() => setBugModalOpen(false)}>{tCommon('cancel')}</Button>
                        <Button variant="primary" onClick={handleSubmitBug} loading={isSubmittingBug} disabled={!bugTitle || !bugDescription}>{tCommon('submit')}</Button>
                    </div>
                </div>
            </Modal>

            <div className="text-center text-xs text-gray-400 mt-8">
                App Version 1.0.0
            </div>
        </div>
    );
}
