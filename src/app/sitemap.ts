import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://ticketticket.live';
    const now = new Date();

    // 只包含公開頁面（不需要登入即可訪問的頁面）
    return [
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
}
