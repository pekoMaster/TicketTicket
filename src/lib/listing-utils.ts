import { Listing } from '@/types';

/**
 * 判斷刊登是否已過期
 * 活動日期小於今天即視為過期
 */
export function isListingExpired(listing: Listing): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const eventDate = new Date(listing.eventDate);
    eventDate.setHours(0, 0, 0, 0);

    return eventDate < today;
}

/**
 * 過濾出有效（未過期）的刊登
 */
export function filterActiveListings(listings: Listing[]): Listing[] {
    return listings.filter(listing => !isListingExpired(listing));
}

/**
 * 過濾出已過期的刊登
 */
export function filterExpiredListings(listings: Listing[]): Listing[] {
    return listings.filter(listing => isListingExpired(listing));
}
