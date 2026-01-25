'use client';

import { useTranslations } from 'next-intl';
import { Ticket, Users, History } from 'lucide-react';

interface ProfileTabsProps {
    activeTab: 'listings' | 'applications' | 'history';
    onTabChange: (tab: 'listings' | 'applications' | 'history') => void;
}

export default function ProfileTabs({ activeTab, onTabChange }: ProfileTabsProps) {
    const t = useTranslations('profile');

    const tabs = [
        { id: 'listings', label: t('myListings'), icon: <Ticket className="w-4 h-4" /> },
        { id: 'applications', label: t('myApplications'), icon: <Users className="w-4 h-4" /> },
        { id: 'history', label: "歷史記錄", icon: <History className="w-4 h-4" /> }, // Ensure key exists or use hardcode/fallback
    ] as const;

    return (
        <div className="sticky top-14 z-20 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 pt-2">
            <div className="flex px-4 gap-4 overflow-x-auto no-scrollbar">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        // eslint-disable-next-line
                        onClick={() => onTabChange(tab.id as any)}
                        className={`
              flex items-center gap-2 pb-3 px-1 border-b-2 transition-colors whitespace-nowrap
              ${activeTab === tab.id
                                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}
            `}
                    >
                        {tab.icon}
                        <span className="text-sm font-medium">{tab.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
