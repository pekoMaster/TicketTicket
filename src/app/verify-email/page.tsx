'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { CheckCircle, XCircle, Mail, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';

type PageState = 'loading' | 'success' | 'error' | 'pending';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const t = useTranslations('verification');
  const { locale } = useLanguage();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [cooldown, setCooldown] = useState(0);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const token = searchParams.get('token');

    if (success === 'true') {
      setPageState('success');
    } else if (error) {
      setPageState('error');
      switch (error) {
        case 'missing_token':
          setErrorMessage(t('errors.missingToken'));
          break;
        case 'invalid_token':
          setErrorMessage(t('errors.invalidToken'));
          break;
        case 'expired_token':
          setErrorMessage(t('errors.expiredToken'));
          break;
        case 'already_verified':
          setErrorMessage(t('errors.alreadyVerified'));
          break;
        case 'update_failed':
          setErrorMessage(t('errors.updateFailed'));
          break;
        default:
          setErrorMessage(t('errors.unknown'));
      }
    } else if (token) {
      // 如果有 token，API 會處理驗證並重定向
      setPageState('loading');
    } else {
      // 沒有參數，顯示待驗證狀態
      setPageState('pending');
    }
  }, [searchParams, t]);

  // 冷卻時間倒數
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleResendEmail = async () => {
    if (cooldown > 0 || isSending) return;

    setIsSending(true);
    try {
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale }),
      });

      const data = await response.json();

      if (response.ok) {
        setCooldown(60); // 60 秒冷卻
      } else {
        if (response.status === 401 && data.error === 'user_deleted') {
          // 用戶已被刪除，強制登出並導向登入頁
          alert('此帳號已被刪除，請重新註冊');
          await signOut({ callbackUrl: '/login' });
          return;
        } else if (response.status === 429) {
          // 從錯誤訊息解析等待時間
          const match = data.error.match(/(\d+)/);
          if (match) {
            setCooldown(parseInt(match[1]) * 60);
          }
          setErrorMessage(t('errors.tooManyRequests'));
          setPageState('error');
        } else {
          setErrorMessage(data.error || t('errors.sendFailed'));
          setPageState('error');
        }
      }
    } catch {
      setErrorMessage(t('errors.sendFailed'));
      setPageState('error');
    } finally {
      setIsSending(false);
    }
  };

  if (status === 'loading' || pageState === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header title={t('title')} showBack />

      <main className="max-w-md mx-auto px-4 py-12">
        <Card className="p-8 text-center">
          {pageState === 'success' && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                {t('success.title')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                {t('success.description')}
              </p>
              <Link href="/">
                <Button variant="primary" className="w-full">
                  {t('success.goHome')}
                </Button>
              </Link>
            </>
          )}

          {pageState === 'error' && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                {t('error.title')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                {errorMessage}
              </p>
              {session?.user && (
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={handleResendEmail}
                  disabled={cooldown > 0}
                >
                  {cooldown > 0 ? (
                    `${t('resendIn')} ${cooldown}s`
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      {t('resendEmail')}
                    </>
                  )}
                </Button>
              )}
            </>
          )}

          {pageState === 'pending' && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                {isSending ? (
                  <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
                ) : (
                  <Mail className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                {isSending ? t('sending') : t('pending.title')}
              </h1>
              {!isSending && (
                <>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {t('pending.description')}
                  </p>
                  {session?.user?.email && (
                    <p className="text-sm text-indigo-600 dark:text-indigo-400 mb-8">
                      {session.user.email}
                    </p>
                  )}
                </>
              )}
              <Button
                variant="primary"
                className="w-full"
                onClick={handleResendEmail}
                disabled={cooldown > 0 || isSending}
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('sending')}
                  </>
                ) : cooldown > 0 ? (
                  `${t('resendIn')} ${cooldown}s`
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    {t('sendEmail')}
                  </>
                )}
              </Button>
              {!isSending && (
                <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                  {t('pending.checkSpam')}
                </p>
              )}
            </>
          )}
        </Card>
      </main>
    </div>
  );
}
