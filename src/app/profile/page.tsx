'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useApp } from '@/contexts/AppContext';
import { useTranslations } from 'next-intl';
import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import StarRating from '@/components/ui/StarRating';
import {
  Check,
  Settings,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import ProfileTabs from '@/components/profile/ProfileTabs';
import ProfileContent from '@/components/profile/ProfileContent';
import { UserProfile, CompletedMatch, ApiReview, ApiApplication } from '@/types';

export default function ProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { listings, deleteListing, requests, fetchRequests } = useApp();
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userReviews, setUserReviews] = useState<ApiReview[]>([]);
  const [myApplications, setMyApplications] = useState<ApiApplication[]>([]);
  const [completedMatches, setCompletedMatches] = useState<CompletedMatch[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Tabs
  const [activeTab, setActiveTab] = useState<'listings' | 'requests' | 'applications' | 'history'>('listings');

  // Delete listing modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Delete request modal
  const [showDeleteRequestModal, setShowDeleteRequestModal] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null);
  const [isDeletingRequest, setIsDeletingRequest] = useState(false);

  // Withdraw application modal
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [applicationToWithdraw, setApplicationToWithdraw] = useState<string | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Fetch Data
  const fetchUserData = useCallback(async () => {
    if (!session?.user?.dbId) {
      setIsLoadingProfile(false);
      return;
    }

    try {
      const [profileRes, reviewsRes, applicationsRes, completedRes] = await Promise.all([
        fetch('/api/profile'),
        fetch(`/api/reviews?userId=${session.user.dbId}`),
        fetch('/api/applications'),
        fetch('/api/profile/completed?limit=5'),
        fetchRequests(true), // Ensure requests are fetched
      ]);

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setUserProfile({
          id: profileData.id,
          username: profileData.username,
          email: profileData.email || '',
          avatarUrl: profileData.avatarUrl,
          customAvatarUrl: profileData.customAvatarUrl,
          rating: profileData.rating || 0,
          reviewCount: profileData.reviewCount || 0,
          isVerified: profileData.isVerified || false,
          role: profileData.role || 'user',
          verificationLevel: profileData.verificationLevel || 'unverified',
          createdAt: profileData.createdAt ? new Date(profileData.createdAt) : new Date(),
        });
      } else if (profileRes.status === 401) {
        const errorData = await profileRes.json();
        if (errorData.error === 'user_deleted') {
          alert('此帳號已被刪除，請重新註冊');
          await signOut({ callbackUrl: '/login' });
          return;
        }
      }

      if (reviewsRes.ok) {
        const reviewsData = await reviewsRes.json();
        setUserReviews(reviewsData);
      }

      if (applicationsRes.ok) {
        const applicationsData = await applicationsRes.json();
        const activeApplications = (applicationsData.sent || []).filter(
          (app: any) => app.status !== 'cancelled'
        );
        setMyApplications(activeApplications);
      }

      if (completedRes.ok) {
        const completedData = await completedRes.json();
        setCompletedMatches(completedData.items || []);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  }, [session?.user?.dbId]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const currentUser = userProfile || (session?.user ? {
    id: session.user.dbId || session.user.id || '',
    username: session.user.name || tCommon('defaultUser'),
    email: session.user.email || '',
    avatarUrl: session.user.image || undefined,
    customAvatarUrl: undefined,
    rating: 0,
    reviewCount: 0,
    isVerified: false,
    role: 'user',
    verificationLevel: 'unverified',
    createdAt: new Date(),
  } as UserProfile : null);

  const myListings = useMemo(() => {
    if (!currentUser) return [];
    return listings.filter((l) => l.hostId === currentUser.id);
  }, [currentUser, listings]);

  const myRequests = useMemo(() => {
    if (!currentUser) return [];
    return requests.filter((r) => r.userId === currentUser.id);
  }, [currentUser, requests]);

  const handleDeleteListing = async () => {
    if (!listingToDelete) return;
    setIsDeleting(true);
    const success = await deleteListing(listingToDelete);
    setIsDeleting(false);
    if (success) {
      setShowDeleteModal(false);
      setListingToDelete(null);
    } else {
      alert(tCommon('deleteFailed'));
    }
  };

  const handleDeleteRequest = async () => {
    if (!requestToDelete) return;
    setIsDeletingRequest(true);
    try {
      const response = await fetch(`/api/requests/${requestToDelete}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setShowDeleteRequestModal(false);
        setRequestToDelete(null);
        fetchRequests(true); // Refetch requests
      } else {
        alert(tCommon('deleteFailed'));
      }
    } catch (error) {
      console.error('Error deleting request:', error);
      alert(tCommon('deleteFailed'));
    } finally {
      setIsDeletingRequest(false);
    }
  };

  const handleWithdrawApplication = async () => {
    if (!applicationToWithdraw) return;
    setIsWithdrawing(true);
    try {
      const response = await fetch(`/api/applications/${applicationToWithdraw}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setMyApplications(prev => prev.filter(app => app.id !== applicationToWithdraw));
        setShowWithdrawModal(false);
        setApplicationToWithdraw(null);
      } else {
        alert(tCommon('deleteFailed'));
      }
    } catch (error) {
      console.error('Error withdrawing application:', error);
      alert(tCommon('deleteFailed'));
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">{t('title')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header with Settings Icon */}
      <Header
        title={t('title')}
        rightAction={
          <Link href="/profile/settings" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <Settings className="w-6 h-6 text-gray-700 dark:text-gray-200" />
          </Link>
        }
      />

      <div className="pt-20 pb-24 px-4 space-y-6">
        {/* Hero Card */}
        <Card variant="glass" className="relative overflow-hidden">
          {/* Background Decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-pink-500/10" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-pink-500/20 to-transparent rounded-full blur-xl" />

          <div className="relative">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-full blur-sm opacity-50 scale-105" />
                <div className="relative ring-4 ring-white/50 dark:ring-gray-700/50 rounded-full">
                  <Avatar src={currentUser.customAvatarUrl || currentUser.avatarUrl} size="xl" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-indigo-900 to-gray-900 dark:from-white dark:via-indigo-200 dark:to-white bg-clip-text text-transparent truncate">
                  {currentUser.username}
                </h2>
                <div className="mt-1">
                  <StarRating
                    value={currentUser.rating}
                    readonly
                    size="sm"
                    showValue
                    totalReviews={currentUser.reviewCount}
                  />
                </div>
                {currentUser.isVerified && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/30">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      {t('verified')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-gray-200/50 dark:border-gray-700/50">
              <button onClick={() => setActiveTab('listings')} className="text-center group cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/50 p-2 rounded-lg transition-colors">
                <p className="text-3xl font-bold bg-gradient-to-br from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                  {listings.filter((l) => l.hostId === currentUser.id).length}
                </p>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">{t('listings')}</p>
              </button>
              <button onClick={() => setActiveTab('applications')} className="text-center group cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/50 p-2 rounded-lg transition-colors">
                <p className="text-3xl font-bold bg-gradient-to-br from-pink-600 to-rose-600 dark:from-pink-400 dark:to-rose-400 bg-clip-text text-transparent">
                  {myApplications.length}
                </p>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">{t('applications')}</p>
              </button>
              <button onClick={() => setActiveTab('history')} className="text-center group cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/50 p-2 rounded-lg transition-colors">
                <p className="text-3xl font-bold bg-gradient-to-br from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent">
                  {userReviews.length}
                </p>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">{t('reviews')}</p>
              </button>
            </div>
          </div>
        </Card>

        {/* Sticky Tabs */}
        <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Content Area */}
        <div className="min-h-[300px] animate-in slide-in-from-bottom-2 duration-300 fade-in">
          <ProfileContent
            activeTab={activeTab}
            userId={currentUser.id}
            listings={myListings}
            requests={myRequests}
            applications={myApplications}
            completedMatches={completedMatches}
            userReviews={userReviews}
            isMyProfile={true}
            onRefresh={fetchUserData}
            onEditListing={(id) => router.push(`/create?edit=${id}`)}
            onDeleteListing={(id) => {
              setListingToDelete(id);
              setShowDeleteModal(true);
            }}
            onDeleteRequest={(id) => {
              setRequestToDelete(id);
              setShowDeleteRequestModal(true);
            }}
            onWithdrawApplication={(id) => {
              setApplicationToWithdraw(id);
              setShowWithdrawModal(true);
            }}
          />
        </div>
      </div>

      {/* Modals */}
      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={tCommon('deleteConfirmTitle')}
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            {tCommon('deleteConfirmMessage')}
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              variant="primary"
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteListing}
              loading={isDeleting}
            >
              {tCommon('confirmDelete')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Request Modal */}
      <Modal
        isOpen={showDeleteRequestModal}
        onClose={() => setShowDeleteRequestModal(false)}
        title={tCommon('deleteConfirmTitle')}
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            {tCommon('deleteConfirmMessage')}
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteRequestModal(false)}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              variant="primary"
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteRequest}
              loading={isDeletingRequest}
            >
              {tCommon('confirmDelete')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Withdraw Modal */}
      <Modal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        title={t('withdrawConfirmTitle')}
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            {t('withdrawConfirmMessage')}
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => setShowWithdrawModal(false)}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              variant="primary"
              className="bg-red-600 hover:bg-red-700"
              onClick={handleWithdrawApplication}
              loading={isWithdrawing}
            >
              {t('confirmWithdraw')}
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
