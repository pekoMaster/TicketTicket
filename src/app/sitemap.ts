import { MetadataRoute } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://ticketticket.live';
    const now = new Date();

    const staticPages: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: now,
            changeFrequency: 'hourly',
            priority: 1,
        },
        {
            url: `${baseUrl}/legal/privacy`,
            lastModified: now,
            changeFrequency: 'monthly',
            priority: 0.3,
        },
        {
            url: `${baseUrl}/legal/terms`,
            lastModified: now,
            changeFrequency: 'monthly',
            priority: 0.3,
        },
        {
            url: `${baseUrl}/legal/tokushoho`,
            lastModified: now,
            changeFrequency: 'monthly',
            priority: 0.3,
        },
    ];

    try {
        const { data: listings } = await supabaseAdmin
            .from('listings')
            .select('id, updated_at')
            .in('status', ['open', 'matched'])
            .order('updated_at', { ascending: false })
            .limit(500);

        const listingPages: MetadataRoute.Sitemap = (listings || []).map((l) => ({
            url: `${baseUrl}/listing/${l.id}`,
            lastModified: new Date(l.updated_at),
            changeFrequency: 'daily' as const,
            priority: 0.8,
        }));

        const { data: requests } = await supabaseAdmin
            .from('ticket_requests')
            .select('id, updated_at')
            .eq('status', 'open')
            .order('updated_at', { ascending: false })
            .limit(500);

        const requestPages: MetadataRoute.Sitemap = (requests || []).map((r) => ({
            url: `${baseUrl}/request/${r.id}`,
            lastModified: new Date(r.updated_at),
            changeFrequency: 'daily' as const,
            priority: 0.7,
        }));

        return [...staticPages, ...listingPages, ...requestPages];
    } catch (error) {
        console.error('Error generating sitemap:', error);
        return staticPages;
    }
}
