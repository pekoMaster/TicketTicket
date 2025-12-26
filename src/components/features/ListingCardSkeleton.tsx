'use client';

import Card from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';

export default function ListingCardSkeleton() {
    return (
        <Card className="animate-fade-in flex flex-col h-full">
            {/* Header: User Info */}
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100 dark:border-gray-700 -mx-4 -mt-4 px-4 pt-4">
                <Skeleton variant="circular" width={32} height={32} />
                <Skeleton variant="text" className="flex-1 h-4" />
                <Skeleton variant="text" width={60} height={16} />
            </div>

            {/* Body: Event Info */}
            <div className="flex flex-col gap-2 mb-3 pb-3 border-b border-gray-100 dark:border-gray-700 border-dashed">
                {/* Event Name */}
                <Skeleton variant="text" className="h-6 w-3/4" />

                {/* Artist Tags */}
                <div className="flex gap-1">
                    <Skeleton variant="text" width={50} height={20} />
                    <Skeleton variant="text" width={60} height={20} />
                </div>

                {/* Seat Grade & Ticket Count */}
                <div className="flex gap-2">
                    <Skeleton variant="text" width={60} height={24} />
                    <Skeleton variant="text" width={80} height={24} />
                </div>

                {/* Listing Type Tags */}
                <div className="flex gap-2 mt-1">
                    <Skeleton variant="text" width={50} height={22} />
                    <Skeleton variant="text" width={70} height={22} />
                </div>
            </div>

            {/* Footer: Date, Nationality, Languages */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Skeleton variant="text" width={60} height={20} />
                    <Skeleton variant="text" width={80} height={16} />
                </div>
                <div className="flex gap-1">
                    <Skeleton variant="text" width={40} height={18} />
                    <Skeleton variant="text" width={40} height={18} />
                </div>
            </div>

            {/* View Button */}
            <div className="flex-grow" />
            <div className="mt-4 pt-3 flex justify-center">
                <Skeleton variant="rectangular" className="w-full h-10" />
            </div>
        </Card>
    );
}
