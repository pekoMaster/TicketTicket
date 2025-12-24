'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Avatar from '@/components/ui/Avatar';
import ReviewCard from '@/components/features/ReviewCard';
import StarRating from '@/components/ui/StarRating';
import { Star, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ReviewerInfo {
  id: string;
  username: string;
  avatar_url?: string;
  custom_avatar_url?: string;
}

interface ListingInfo {
  id: string;
  event_name: string;
  event_date: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer: ReviewerInfo;
  listing: ListingInfo;
}

interface UserInfo {
  id: string;
  username: string;
  avatarUrl: string | null;
  rating: number;
  reviewCount: number;
}

interface ReviewsResponse {
  user: UserInfo;
  reviews: Review[];
  ratingDistribution: Record<number, number>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function UserReviewsPage() {
  const params = useParams();
  const userId = params.userId as string;
  const t = useTranslations('reviews');
  const tReview = useTranslations('review');

  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchReviews = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/users/${userId}/reviews?page=${currentPage}&limit=10`);
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, [userId, currentPage]);

  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">{t('notFound')}</p>
      </div>
    );
  }

  const { user, reviews, ratingDistribution, pagination } = data;
  const totalRatings = Object.values(ratingDistribution).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header
        title={t('userReviews', { name: user.username })}
        showBack
      />

      <div className="pt-20 pb-20 px-4 max-w-2xl mx-auto">
        {/* 用戶資訊卡片 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6">
          <div className="flex items-center gap-4">
            <Avatar src={user.avatarUrl || undefined} size="xl" />
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {user.username}
              </h2>
              <StarRating
                value={user.rating || 0}
                readonly
                showValue
                totalReviews={user.reviewCount}
              />
            </div>
          </div>
        </div>

        {/* 評分分布 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
            {t('ratingDistribution')}
          </h3>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratingDistribution[star] || 0;
              const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;

              return (
                <div key={star} className="flex items-center gap-2">
                  <div className="flex items-center gap-1 w-12">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{star}</span>
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400 w-8 text-right">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 評價列表 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
            {t('allReviews')} ({pagination.total})
          </h3>

          {reviews.length === 0 ? (
            <div className="text-center py-8">
              <Star className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">{tReview('noReviewsYet')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={{
                    id: review.id,
                    rating: review.rating,
                    comment: review.comment,
                    created_at: review.created_at,
                    reviewer: {
                      id: review.reviewer.id,
                      username: review.reviewer.username,
                      avatar_url: review.reviewer.avatar_url,
                      custom_avatar_url: review.reviewer.custom_avatar_url,
                    },
                    listing: review.listing ? {
                      id: review.listing.id,
                      event_name: review.listing.event_name,
                      event_date: review.listing.event_date,
                    } : undefined,
                  }}
                  showEvent
                />
              ))}
            </div>
          )}

          {/* 分頁控制 */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || isLoading}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>

              <span className="text-sm text-gray-600 dark:text-gray-400">
                {t('page', { current: currentPage, total: pagination.totalPages })}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={currentPage === pagination.totalPages || isLoading}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
