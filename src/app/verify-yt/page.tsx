'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

function VerifyYouTubeContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'invalid'>('loading');
    const [verificationData, setVerificationData] = useState<{
        ytChannelName?: string;
        discordUserId?: string;
    } | null>(null);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('invalid');
            setErrorMessage('缺少驗證 Token，請從 Discord 重新取得驗證連結。');
            return;
        }

        // 向後端驗證 Token 是否有效
        fetch(`/api/verify-yt/check?token=${token}`)
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    setStatus('invalid');
                    setErrorMessage(data.error);
                } else {
                    setVerificationData(data);
                    setStatus('ready');
                }
            })
            .catch(err => {
                setStatus('error');
                setErrorMessage('無法連接伺服器，請稍後再試。');
            });
    }, [token]);

    const handleStartVerify = () => {
        // 建構 YouTube OAuth URL
        const clientId = process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID;
        const redirectUri = `${window.location.origin}/verify-yt/callback`;
        const scope = 'https://www.googleapis.com/auth/youtube.force-ssl';

        // 將 Token 放入 state
        const state = btoa(JSON.stringify({ token }));

        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${clientId}&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `response_type=code&` +
            `scope=${encodeURIComponent(scope)}&` +
            `access_type=offline&` +
            `prompt=consent&` +
            `state=${state}`;

        window.location.href = authUrl;
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
            <div className="bg-gray-800/80 backdrop-blur-sm p-8 rounded-2xl shadow-2xl max-w-md w-full border border-gray-700">
                {/* Logo / 標題 */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 mx-auto mb-4 bg-red-600 rounded-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">
                        YouTube 會員驗證
                    </h1>
                </div>

                {/* 載入中 */}
                {status === 'loading' && (
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
                        <p className="text-gray-300">正在載入...</p>
                    </div>
                )}

                {/* Token 無效 */}
                {status === 'invalid' && (
                    <div className="text-center">
                        <div className="text-yellow-500 text-6xl mb-4">⚠️</div>
                        <h2 className="text-xl font-bold text-white mb-2">驗證連結無效</h2>
                        <p className="text-gray-400 mb-6">{errorMessage}</p>
                        <p className="text-gray-500 text-sm">
                            請返回 Discord 使用 <code className="bg-gray-700 px-2 py-1 rounded">/verify-yt start</code> 取得新的驗證連結
                        </p>
                    </div>
                )}

                {/* 錯誤 */}
                {status === 'error' && (
                    <div className="text-center">
                        <div className="text-red-500 text-6xl mb-4">❌</div>
                        <h2 className="text-xl font-bold text-white mb-2">發生錯誤</h2>
                        <p className="text-gray-400 mb-6">{errorMessage}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-6 rounded-lg transition duration-200"
                        >
                            重試
                        </button>
                    </div>
                )}

                {/* 準備就緒 */}
                {status === 'ready' && verificationData && (
                    <>
                        <p className="text-gray-300 mb-6 text-center">
                            驗證您是否為 <span className="text-red-400 font-semibold">{verificationData.ytChannelName}</span> 的付費會員
                        </p>

                        <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
                            <h3 className="text-white font-medium mb-3">驗證步驟：</h3>
                            <ol className="text-gray-300 text-sm space-y-2">
                                <li className="flex items-start">
                                    <span className="bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">1</span>
                                    點擊下方按鈕
                                </li>
                                <li className="flex items-start">
                                    <span className="bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">2</span>
                                    使用 Google 帳號登入
                                </li>
                                <li className="flex items-start">
                                    <span className="bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">3</span>
                                    授權讀取您的 YouTube 資訊
                                </li>
                                <li className="flex items-start">
                                    <span className="bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">4</span>
                                    系統自動驗證您的會員身份
                                </li>
                            </ol>
                        </div>

                        <button
                            onClick={handleStartVerify}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0012.545 2C6.477 2 1.545 6.932 1.545 13s4.932 11 11 11c6.352 0 10.545-4.463 10.545-10.747 0-.723-.076-1.423-.219-2.014h-10.326z"/>
                            </svg>
                            使用 Google 帳號驗證
                        </button>

                        <div className="mt-6 p-4 bg-gray-700/30 rounded-lg">
                            <p className="text-gray-400 text-xs text-center">
                                🔒 我們只會讀取您的頻道資訊和會員狀態，不會存取其他資料。
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default function VerifyYouTubePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
            </div>
        }>
            <VerifyYouTubeContent />
        </Suspense>
    );
}
