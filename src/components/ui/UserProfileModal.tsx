'use client';

import { useEffect, useState } from 'react';
import { X, Star, CheckCircle, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Avatar from './Avatar';
import { User } from '@/types';

// LINE 和 Discord 圖示
const LineIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.349 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
  </svg>
);

const DiscordIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

interface UserProfileModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

export default function UserProfileModal({ user, isOpen, onClose }: UserProfileModalProps) {
  const t = useTranslations('userProfile');
  const [userDetails, setUserDetails] = useState<{
    successfulMeetups: number;
    showLine: boolean;
    showDiscord: boolean;
    lineId: string | null;
    discordId: string | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 頭像優先顯示自訂頭像
  const getDisplayAvatar = (u: User) => {
    return u.customAvatarUrl || u.avatarUrl;
  };

  // 獲取用戶詳細資訊
  useEffect(() => {
    if (isOpen && user.id) {
      setIsLoading(true);
      fetch(`/api/users/${user.id}`)
        .then(res => res.json())
        .then(data => {
          setUserDetails({
            successfulMeetups: data.successfulMeetups || 0,
            showLine: data.showLine || false,
            showDiscord: data.showDiscord || false,
            lineId: data.lineId,
            discordId: data.discordId,
          });
        })
        .catch(err => {
          console.error('Failed to fetch user details:', err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, user.id]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* 彈窗內容 */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-fade-in">
        {/* 關閉按鈕 */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10"
        >
          <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>

        {/* 頭像區域 - 漸層背景 */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 pt-8 pb-12 px-4 text-center">
          <div className="relative inline-block">
            <Avatar
              src={getDisplayAvatar(user)}
              size="xl"
              className="ring-4 ring-white dark:ring-gray-800"
            />
            <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>

        {/* 用戶資訊 */}
        <div className="px-6 pb-6 -mt-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
            {/* 名稱 */}
            <h3 className="text-xl font-bold text-center text-gray-900 dark:text-gray-100 mb-1">
              {user.username}
            </h3>

            {/* 評價 */}
            <div className="flex items-center justify-center gap-1 mb-4">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                {user.rating?.toFixed(1) || '0.0'}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({user.reviewCount || 0} {t('reviews')})
              </span>
            </div>

            {/* 成功同行次數 */}
            <div className="flex items-center justify-center gap-2 py-3 bg-green-50 dark:bg-green-900/30 rounded-lg mb-4">
              <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-green-700 dark:text-green-300 font-medium">
                {isLoading ? '...' : (userDetails?.successfulMeetups || 0)} {t('successfulMeetups')}
              </span>
            </div>

            {/* 已連結帳號 */}
            <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-3">
                {t('linkedAccounts')}
              </p>
              <div className="flex items-center justify-center gap-4">
                {/* Google - 所有用戶都有 */}
                <div className="flex flex-col items-center gap-1">
                  <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-700">
                    <GoogleIcon />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Google</span>
                </div>

                {/* LINE */}
                <div className="flex flex-col items-center gap-1">
                  <div className={`p-2 rounded-full ${
                    userDetails?.lineId && userDetails?.showLine
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-500'
                  }`}>
                    <LineIcon />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">LINE</span>
                </div>

                {/* Discord */}
                <div className="flex flex-col items-center gap-1">
                  <div className={`p-2 rounded-full ${
                    userDetails?.discordId && userDetails?.showDiscord
                      ? 'bg-indigo-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-500'
                  }`}>
                    <DiscordIcon />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Discord</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
