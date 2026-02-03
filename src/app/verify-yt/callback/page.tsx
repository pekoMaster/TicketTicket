'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

function VerifyCallbackContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<'verifying' | 'success' | 'failed' | 'not_member'>('verifying');
    const [message, setMessage] = useState('');
    const [details, setDetails] = useState<{
        ytChannelName?: string;
        roleGranted?: boolean;
    } | null>(null);

    useEffect(() => {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        // 處理 OAuth 錯誤
        if (error) {
            setStatus('failed');
            setMessage(error === 'access_denied' ? '您取消了授權' : `授權失敗: ${error}`);
            return;
        }

        if (!code || !state) {
            setStatus('failed');
            setMessage('缺少必要參數');
            return;
        }

        // 解析 state
        let token: string;
        try {
            const stateData = JSON.parse(atob(state));
            token = stateData.token;
        } catch {
            setStatus('failed');
            setMessage('無效的 state 參數');
            return;
        }

        // 發送到後端進行驗證
        fetch('/api/verify-yt/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, token })
        })
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    if (data.code === 'NOT_MEMBER') {
                        setStatus('not_member');
                        setMessage(data.message || '您不是該頻道的會員');
                    } else {
                        setStatus('failed');
                        setMessage(data.error);
                    }
                } else if (data.success) {
                    setStatus('success');
                    setDetails({
                        ytChannelName: data.youtubeChannelName,
                        roleGranted: data.roleGranted
                    });
                } else {
                    setStatus('failed');
                    setMessage('驗證失敗');
                }
            })
            .catch(err => {
                console.error('Verification error:', err);
                setStatus('failed');
                setMessage('連線錯誤，請稍後再試');
            });
    }, [searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
            <div className="bg-gray-800/80 backdrop-blur-sm p-8 rounded-2xl shadow-2xl max-w-md w-full border border-gray-700 text-center">

                {/* 驗證中 */}
                {status === 'verifying' && (
                    <>
                        <div className="w-20 h-20 mx-auto mb-6 relative">
                            <div className="absolute inset-0 rounded-full border-4 border-gray-600"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-red-500 border-t-transparent animate-spin"></div>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">驗證中...</h2>
                        <p className="text-gray-400">正在確認您的會員身份，請稍候</p>
                    </>
                )}

                {/* 成功 */}
                {status === 'success' && (
                    <>
                        <div className="w-20 h-20 mx-auto mb-6 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">驗證成功！</h2>
                        <p className="text-gray-300 mb-6">
                            您已成功驗證為會員
                        </p>

                        {details && (
                            <div className="bg-gray-700/50 rounded-lg p-4 mb-6 text-left">
                                {details.ytChannelName && (
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-gray-400">您的 YouTube 頻道</span>
                                        <span className="text-white font-medium">{details.ytChannelName}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">身分組</span>
                                    <span className="text-green-400 font-medium">
                                        {details.roleGranted ? '✅ 已自動給予' : '⏳ 等待處理'}
                                    </span>
                                </div>
                            </div>
                        )}

                        <p className="text-gray-500 text-sm">
                            您可以關閉此頁面，返回 Discord 查看您的新身分組
                        </p>
                    </>
                )}

                {/* 不是會員 */}
                {status === 'not_member' && (
                    <>
                        <div className="w-20 h-20 mx-auto mb-6 bg-yellow-500 rounded-full flex items-center justify-center">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">您不是會員</h2>
                        <p className="text-gray-300 mb-6">{message}</p>

                        <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
                            <p className="text-gray-400 text-sm">
                                如果您確定已加入會員，請確認：
                            </p>
                            <ul className="text-gray-400 text-sm mt-2 text-left list-disc list-inside">
                                <li>您使用的是加入會員的 Google 帳號</li>
                                <li>會員訂閱仍在有效期內</li>
                                <li>已完成付款流程</li>
                            </ul>
                        </div>

                        <button
                            onClick={() => window.close()}
                            className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-6 rounded-lg transition duration-200"
                        >
                            關閉視窗
                        </button>
                    </>
                )}

                {/* 失敗 */}
                {status === 'failed' && (
                    <>
                        <div className="w-20 h-20 mx-auto mb-6 bg-red-500 rounded-full flex items-center justify-center">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">驗證失敗</h2>
                        <p className="text-gray-300 mb-6">{message}</p>

                        <div className="space-y-3">
                            <button
                                onClick={() => router.back()}
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-6 rounded-lg transition duration-200"
                            >
                                重新驗證
                            </button>
                            <button
                                onClick={() => window.close()}
                                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-6 rounded-lg transition duration-200"
                            >
                                關閉視窗
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default function VerifyCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
            </div>
        }>
            <VerifyCallbackContent />
        </Suspense>
    );
}
