import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import './globals.css';
import { AppProvider } from '@/contexts/AppContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AdminProvider } from '@/contexts/AdminContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import SessionProvider from '@/components/providers/SessionProvider';
import ReCaptchaProvider from '@/components/providers/ReCaptchaProvider';
import MainLayout from '@/components/layout/MainLayout';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';



export const metadata: Metadata = {
  metadataBase: new URL('https://ticketticket.live'),
  title: 'TicketTicket - 與世界的雜魚粉絲們一起使用"同行"！',
  description: 'TicketTicket 是專為 VTuber 粉絲打造的票券同行配對平台。尋找演唱會同行夥伴、分享子票或交換座位。與世界各地的雜魚粉絲一起享受現場活動的樂趣！支援繁體中文、日文、英文。',
  keywords: ['concert', 'companion', 'matching', 'ticket', 'live music', '同行', '演唱會', 'VTuber', 'hololive', 'TicketTicket', '票券配對'],
  verification: {
    google: 'VasyI-zBTHn_uu8sQ8Evapg18hH-VXdID1O6VAPQI1A',
  },

  openGraph: {
    title: 'TicketTicket - 票券同行配對平台',
    description: '尋找演唱會同行夥伴，與世界的雜魚粉絲一起使用同行！VTuber 粉絲專屬票券配對服務。',
    url: 'https://ticketticket.live',
    siteName: 'TicketTicket',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TicketTicket - 票券同行配對平台',
      },
    ],
    locale: 'zh_TW',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TicketTicket - 票券同行配對平台',
    description: '尋找演唱會同行夥伴，與世界的雜魚粉絲一起使用同行！',
    images: ['/og-image.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="antialiased bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <NextIntlClientProvider messages={messages}>
          <SessionProvider>
            <ReCaptchaProvider>
              <ThemeProvider>
                <LanguageProvider>
                  <CurrencyProvider>
                    <AppProvider>
                      <AdminProvider>
                        <NotificationProvider>
                          <MainLayout>
                            {children}
                          </MainLayout>
                        </NotificationProvider>
                      </AdminProvider>
                    </AppProvider>
                  </CurrencyProvider>
                </LanguageProvider>
              </ThemeProvider>
            </ReCaptchaProvider>
          </SessionProvider>
        </NextIntlClientProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
