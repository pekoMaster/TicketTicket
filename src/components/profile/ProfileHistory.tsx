import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Check, ChevronRight, Star } from 'lucide-react';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Tag, { TicketTypeTag } from '@/components/ui/Tag';
import ReviewCard from '@/components/features/ReviewCard';
import { CompletedMatch, ApiReview } from '@/types';

interface ProfileHistoryProps {
    completedMatches: CompletedMatch[];
    userReviews: ApiReview[];
    userId: string;
}

export default function ProfileHistory({ completedMatches, userReviews, userId }: ProfileHistoryProps) {
    const t = useTranslations('profile');
    const tReview = useTranslations('review');

    return (
        <div className="space-y-8">

            {/* Completed Matches Section */}
            <section>
                <div className="flex items-center justify-between mb-3 px-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        {t('completedMatches')}
                    </h3>
                    {completedMatches.length > 0 && (
                        <Link href="/profile/completed" className="text-xs text-indigo-500 hover:text-indigo-600">
                            {t('viewMore')}
                        </Link>
                    )}
                </div>

                {completedMatches.length > 0 ? (
                    <div className="space-y-3">
                        {completedMatches.map((match) => (
                            <Card key={match.id} className="dark:bg-gray-800 dark:border-gray-700">
                                <Link href={`/listing/${match.listingId}`}>
                                    <div className="flex items-center gap-3">
                                        <Avatar src={match.otherUser.avatarUrl} size="md" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                {/* eslint-disable-next-line */}
                                                <TicketTypeTag type={match.listing.ticket_type as any} size="sm" />
                                                <Tag variant={match.isHost ? 'purple' : 'info'} size="sm">
                                                    {match.isHost ? t('iWasHost') : t('iWasGuest')}
                                                </Tag>
                                            </div>
                                            <p className="font-medium text-gray-900 dark:text-gray-100 line-clamp-2 break-words">
                                                {match.listing.event_name}
                                            </p>
                                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                <span>{t('matchedWith')}: {match.otherUser.username}</span>
                                                {match.myReview && (
                                                    <span className="flex items-center gap-1">
                                                        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                                                        {match.myReview.rating}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                    </div>
                                </Link>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="text-center py-6 border-dashed">
                        <p className="text-gray-500 text-sm">{t('noCompleted')}</p>
                    </Card>
                )}
            </section>

            {/* Reviews Section */}
            <section>
                <div className="flex items-center justify-between mb-3 px-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        {tReview('receivedReviews')}
                    </h3>
                    {userReviews.length > 0 && (
                        <Link href={`/reviews/${userId}`} className="text-xs text-indigo-500 hover:text-indigo-600">
                            {tReview('viewAll')}
                        </Link>
                    )}
                </div>

                {userReviews.length > 0 ? (
                    <div className="space-y-3">
                        {userReviews.slice(0, 5).map((review) => (
                            // eslint-disable-next-line
                            <ReviewCard key={review.id} review={review} showEvent />
                        ))}
                        {userReviews.length > 5 && (
                            <Link
                                href={`/reviews/${userId}`}
                                className="block text-center py-3 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                                {tReview('viewAll')} ({userReviews.length})
                            </Link>
                        )}
                    </div>
                ) : (
                    <Card className="text-center py-6 border-dashed">
                        <p className="text-gray-500 text-sm">{tReview('noReviewsYet')}</p>
                    </Card>
                )}
            </section>
        </div>
    );
}
