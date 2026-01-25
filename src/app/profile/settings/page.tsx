'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Header from '@/components/layout/Header';
import { Loader2, User, Bell, HelpCircle } from 'lucide-react';
import { UserProfile } from '@/types';
import GeneralSettings from '@/components/profile/settings/GeneralSettings';
import NotificationSettings from '@/components/profile/settings/NotificationSettings';
import SupportSettings from '@/components/profile/settings/SupportSettings';

export default function ProfileSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('profileSettings');

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'support'>('general');

  // Handle direct tab link
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['general', 'notifications', 'support'].includes(tab)) {
      setActiveTab(tab as any);
    }
  }, [searchParams]);

  // Auth check
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/profile/settings');
    }
  }, [status, router]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.dbId) {
      fetchProfile();
    }
  }, [session]);

  const tabs = [
    { id: 'general', label: t('notifications.groups.system'), icon: <User className="w-4 h-4" /> }, // Borrowing keys or use new ones
    { id: 'notifications', label: t('notifications.title'), icon: <Bell className="w-4 h-4" /> },
    { id: 'support', label: t('helpSupport'), icon: <HelpCircle className="w-4 h-4" /> },
  ];

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header title={t('title')} showBack />
        <div className="pt-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header title={t('title')} showBack />

      <div className="pt-20 pb-24 px-4 max-w-2xl mx-auto space-y-6">

        {/* Segmented Control */}
        <div className="flex p-1 bg-gray-200 dark:bg-gray-800 rounded-xl relative">
          {/* Animated Background (Primitive implementation for now, framer-motion would be better) */}
          <div className="absolute inset-y-1 transition-all duration-300 ease-spring"
            style={{
              width: `${100 / tabs.length}%`,
              left: `${(tabs.findIndex(t => t.id === activeTab)) * (100 / tabs.length)}%`,
            }}
          >
            <div className="h-full w-full bg-white dark:bg-gray-700 rounded-lg shadow-sm"></div>
          </div>

          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium relative z-10 transition-colors duration-200 ${activeTab === tab.id ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="animate-in slide-in-from-bottom-2 duration-300 fade-in">
          {activeTab === 'general' && (
            <GeneralSettings profile={profile} onUpdate={fetchProfile} />
          )}
          {activeTab === 'notifications' && (
            <NotificationSettings profile={profile} onUpdate={fetchProfile} />
          )}
          {activeTab === 'support' && (
            <SupportSettings profile={profile} />
          )}
        </div>
      </div>
    </div>
  );
}
