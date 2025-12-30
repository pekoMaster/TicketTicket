import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' }, // Google OAuth
      { protocol: 'https', hostname: 'cdn.discordapp.com' }, // Discord OAuth
      { protocol: 'https', hostname: 'profile.line-scdn.net' }, // LINE OAuth
      { protocol: 'https', hostname: '*.supabase.co' }, // Supabase Storage
      { protocol: 'https', hostname: 'xkdwoipnbsugvzvnugbv.supabase.co' }, // Your Supabase
    ],
  },
};

export default withNextIntl(nextConfig);
