'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Phone, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { initRecaptcha, sendPhoneVerificationCode, clearRecaptcha, type ConfirmationResult } from '@/lib/firebase';
import { PHONE_COUNTRY_CODES } from '@/types';

type PageState = 'input' | 'verify' | 'success' | 'error';

export default function VerifyPhonePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const t = useTranslations('phoneVerification');

  const [pageState, setPageState] = useState<PageState>('input');
  const [countryCode, setCountryCode] = useState('+81');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  // 冷卻時間倒數
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // 清理 reCAPTCHA
  useEffect(() => {
    return () => {
      clearRecaptcha();
    };
  }, []);

  // 未登入導向
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/verify-phone');
    }
  }, [status, router]);

  const handleSendCode = async () => {
    if (!phoneNumber || isLoading || cooldown > 0) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      // 初始化 reCAPTCHA
      const recaptcha = initRecaptcha('recaptcha-container');

      // 格式化電話號碼
      const fullPhoneNumber = `${countryCode}${phoneNumber.replace(/^0+/, '')}`;

      // 發送驗證碼
      const result = await sendPhoneVerificationCode(fullPhoneNumber, recaptcha);
      setConfirmationResult(result);
      setPageState('verify');
      setCooldown(60);
    } catch (error) {
      console.error('Failed to send verification code:', error);
      setErrorMessage(t('errors.sendFailed'));
      clearRecaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || !confirmationResult || isLoading) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      // 驗證 Firebase 驗證碼
      await confirmationResult.confirm(verificationCode);

      // 更新資料庫
      const fullPhoneNumber = `${countryCode}${phoneNumber.replace(/^0+/, '')}`;
      const response = await fetch('/api/auth/verify-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: fullPhoneNumber,
          phoneCountryCode: countryCode,
        }),
      });

      if (response.ok) {
        setPageState('success');
      } else {
        const data = await response.json();
        if (data.error === 'Phone number already in use') {
          setErrorMessage(t('errors.phoneInUse'));
        } else {
          setErrorMessage(data.error || t('errors.verifyFailed'));
        }
        setPageState('error');
      }
    } catch (error) {
      console.error('Failed to verify code:', error);
      setErrorMessage(t('errors.invalidCode'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (cooldown > 0) return;

    clearRecaptcha();
    setVerificationCode('');
    setPageState('input');
  };

  if (status === 'loading') {
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
        <Card className="p-8">
          {pageState === 'success' ? (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                {t('success.title')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                {t('success.description')}
              </p>
              <Button variant="primary" className="w-full" onClick={() => router.push('/create')}>
                {t('success.createListing')}
              </Button>
            </div>
          ) : pageState === 'error' ? (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                {t('error.title')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                {errorMessage}
              </p>
              <Button variant="primary" className="w-full" onClick={() => {
                setPageState('input');
                setErrorMessage('');
                clearRecaptcha();
              }}>
                {t('error.tryAgain')}
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-6 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                  <Phone className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {pageState === 'input' ? t('input.title') : t('verify.title')}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {pageState === 'input' ? t('input.description') : t('verify.description')}
                </p>
              </div>

              {pageState === 'input' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('input.phoneNumber')}
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="w-28 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      >
                        {PHONE_COUNTRY_CODES.map((code) => (
                          <option key={code.value} value={code.value}>
                            {code.value}
                          </option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder="9012345678"
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400"
                      />
                    </div>
                  </div>

                  {errorMessage && (
                    <p className="text-sm text-red-500">{errorMessage}</p>
                  )}

                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={handleSendCode}
                    disabled={!phoneNumber || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t('input.sending')}
                      </>
                    ) : (
                      t('input.sendCode')
                    )}
                  </Button>

                  <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                    {t('input.notice')}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('verify.code')}
                    </label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      maxLength={6}
                      className="w-full px-4 py-3 text-center text-2xl tracking-widest border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  {errorMessage && (
                    <p className="text-sm text-red-500 text-center">{errorMessage}</p>
                  )}

                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={handleVerifyCode}
                    disabled={verificationCode.length !== 6 || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t('verify.verifying')}
                      </>
                    ) : (
                      t('verify.verify')
                    )}
                  </Button>

                  <div className="text-center">
                    <button
                      onClick={handleResendCode}
                      disabled={cooldown > 0}
                      className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline disabled:text-gray-400 disabled:no-underline"
                    >
                      {cooldown > 0
                        ? `${t('verify.resendIn')} ${cooldown}s`
                        : t('verify.resend')
                      }
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>

        {/* reCAPTCHA container (invisible) */}
        <div id="recaptcha-container" ref={recaptchaContainerRef}></div>
      </main>
    </div>
  );
}
