import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import './globals.css';
import { AppProvider } from '@/contexts/AppContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AdminProvider } from '@/contexts/AdminContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import SessionProvider from '@/components/providers/SessionProvider';
import ReCaptchaProvider from '@/components/providers/ReCaptchaProvider';
import MainLayout from '@/components/layout/MainLayout';

export const metadata: Metadata = {
  title: 'TicketTicket - Concert Companion Matching',
  description: 'Find your concert companion and enjoy live music together',
  keywords: ['concert', 'companion', 'matching', 'ticket', 'live music'],
  verification: {
    google: 'VasyI-zBTHn_uu8sQ8Evapg18hH-VXdID1O6VAPQI1A',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
                  <AppProvider>
                    <AdminProvider>
                      <MainLayout>
                        {children}
                      </MainLayout>
                    </AdminProvider>
                  </AppProvider>
                </LanguageProvider>
              </ThemeProvider>
            </ReCaptchaProvider>
          </SessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
