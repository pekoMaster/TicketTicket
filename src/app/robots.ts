import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = 'https://ticketticket.live';

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/api/',
                    '/admin/',
                    '/profile/',
                    '/messages/',
                    '/notifications/',
                    '/create/',
                ],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
