'use client';

import { Suspense } from 'react';
import ProfileListings from './ProfileListings';
import ProfileApplications from './ProfileApplications';
import ProfileHistory from './ProfileHistory';
import { UserProfile, CompletedMatch, ApiReview, ApiApplication } from '@/types';


interface ProfileContentProps {
    activeTab: 'listings' | 'applications' | 'history';
    userId: string;
    // eslint-disable-next-line
    listings: any[]; // Replace with specific type if available
    // eslint-disable-next-line
    applications: any[];
    completedMatches: CompletedMatch[];
    userReviews: ApiReview[];
    isMyProfile: boolean;
    onRefresh: () => void;
    onEditListing: (id: string) => void;
    onDeleteListing: (id: string) => void;
    onWithdrawApplication: (id: string) => void;
}

export default function ProfileContent({
    activeTab,
    userId,
    listings,
    applications,
    completedMatches,
    userReviews,
    isMyProfile,
    onRefresh,
    onEditListing,
    onDeleteListing,
    onWithdrawApplication
}: ProfileContentProps) {

    if (activeTab === 'listings') {
        return (
            <ProfileListings
                listings={listings}
                onDelete={onDeleteListing}
            />
        );
    }

    if (activeTab === 'applications') {
        return (
            <ProfileApplications
                applications={applications}
                onWithdraw={onWithdrawApplication}
            />
        );
    }

    if (activeTab === 'history') {
        return (
            <ProfileHistory
                completedMatches={completedMatches}
                userReviews={userReviews}
                userId={userId}
            />
        );
    }

    return null;
}
