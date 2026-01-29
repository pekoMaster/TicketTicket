import { MetadataRoute } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://ticketticket.live';
    const now = new Date();

    // 靜態頁面
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: now,
            changeFrequency: 'hourly',
            priority: 1,
        },
        {
            url: `${baseUrl}/create`,
            lastModified: now,
            changeFrequency: 'daily',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/privacy`,
            lastModified: now,
            changeFrequency: 'monthly',
            priority: 0.3,
        },
        {
            url: `${baseUrl}/terms`,
            lastModified: now,
            changeFrequency: 'monthly',
            priority: 0.3,
        },
        {
            url: `${baseUrl}/tokushoho`,
            lastModified: now,
            changeFrequency: 'monthly',
            priority: 0.3,
        },
        {
            url: `${baseUrl}/guide`,
            lastModified: now,
            changeFrequency: 'weekly',
            priority: 0.6,
        },
    ];

    // 動態刊登頁面
    let listingPages: MetadataRoute.Sitemap = [];
    try {
        const { data: listings } = await supabaseAdmin
            .from('listings')
            .select('id, updated_at')
            .eq('status', 'open')
            .order('updated_at', { ascending: false })
            .limit(100);

        if (listings) {
            listingPages = listings.map((listing) => ({
                url: `${baseUrl}/listing/${listing.id}`,
                lastModified: new Date(listing.updated_at),
                changeFrequency: 'daily' as const,
                priority: 0.7,
            }));
        }
    } catch (error) {
        console.error('Error fetching listings for sitemap:', error);
    }

    // 動態活動頁面
    let eventPages: MetadataRoute.Sitemap = [];
    try {
        const { data: events } = await supabaseAdmin
            .from('events')
            .select('id, updated_at')
            .eq('is_active', true)
            .order('updated_at', { ascending: false })
            .limit(50);

        if (events) {
            eventPages = events.map((event) => ({
                url: `${baseUrl}/events/${event.id}`,
                lastModified: new Date(event.updated_at),
                changeFrequency: 'weekly' as const,
                priority: 0.6,
            }));
        }
    } catch (error) {
        console.error('Error fetching events for sitemap:', error);
    }

    return [...staticPages, ...listingPages, ...eventPages];
}
