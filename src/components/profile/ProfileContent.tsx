'use client';

import ProfileListings from './ProfileListings';
import ProfileApplications from './ProfileApplications';
import ProfileHistory from './ProfileHistory';
import ProfileRequests from './ProfileRequests';
import { CompletedMatch, ApiReview, TicketRequest } from '@/types';


interface ProfileContentProps {
    activeTab: 'listings' | 'requests' | 'applications' | 'history';
    userId: string;
    // eslint-disable-next-line
    listings: any[]; // Replace with specific type if available
    requests: TicketRequest[];
    // eslint-disable-next-line
    applications: any[];
    completedMatches: CompletedMatch[];
    userReviews: ApiReview[];
    isMyProfile: boolean;
    onRefresh: () => void;
    onEditListing: (id: string) => void;
    onDeleteListing: (id: string) => void;
    onDeleteRequest: (id: string) => void;
    onWithdrawApplication: (id: string) => void;
}

export default function ProfileContent({
    activeTab,
    userId,
    listings,
    requests,
    applications,
    completedMatches,
    userReviews,
    // eslint-disable-next-line
    isMyProfile,
    // eslint-disable-next-line
    onRefresh,
    // eslint-disable-next-line
    onEditListing,
    onDeleteListing,
    onDeleteRequest,
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

    if (activeTab === 'requests') {
        return (
            <ProfileRequests
                requests={requests}
                onDelete={onDeleteRequest}
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
