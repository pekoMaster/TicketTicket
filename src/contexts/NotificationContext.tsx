'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useSession } from 'next-auth/react';

// Toast 類型
export type ToastType = 'new_application' | 'application_accepted' | 'application_rejected' | 'new_message';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
    createdAt: number;
}

interface NotificationContextType {
    // 未讀狀態
    hasUnread: boolean;
    // Toast 列表
    toasts: Toast[];
    // 添加 Toast
    addToast: (type: ToastType, message: string) => void;
    // 移除 Toast
    removeToast: (id: string) => void;
    // 標記已讀
    markAsRead: () => void;
    // 檢查未讀（頁面載入時調用）
    checkUnread: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const LAST_READ_KEY = 'lastMessagesReadTime';

export function NotificationProvider({ children }: { children: ReactNode }) {
    const { data: session } = useSession();
    const [hasUnread, setHasUnread] = useState(false);
    const [toasts, setToasts] = useState<Toast[]>([]);

    // 添加 Toast
    const addToast = useCallback((type: ToastType, message: string) => {
        const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newToast: Toast = { id, type, message, createdAt: Date.now() };

        setToasts(prev => [...prev, newToast]);

        // 5 秒後自動移除
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 5000);
    }, []);

    // 移除 Toast
    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // 標記已讀
    const markAsRead = useCallback(() => {
        localStorage.setItem(LAST_READ_KEY, Date.now().toString());
        setHasUnread(false);
    }, []);

    // 檢查未讀狀態
    const checkUnread = useCallback(async () => {
        if (!session?.user?.dbId) return;

        try {
            const lastReadTime = parseInt(localStorage.getItem(LAST_READ_KEY) || '0', 10);

            // 獲取對話列表
            const convRes = await fetch('/api/conversations');
            // 獲取申請列表
            const appRes = await fetch('/api/applications');

            let hasNew = false;
            const newToasts: { type: ToastType; message: string }[] = [];

            if (convRes.ok) {
                const conversations = await convRes.json();
                for (const conv of conversations) {
                    const lastMessageTime = new Date(conv.last_message_at).getTime();
                    if (lastMessageTime > lastReadTime) {
                        hasNew = true;
                        // 只在第一次檢測到時顯示 Toast
                        if (lastReadTime > 0) {
                            newToasts.push({ type: 'new_message', message: 'newMessage' });
                        }
                        break;
                    }
                }
            }

            if (appRes.ok) {
                const appData = await appRes.json();

                // 檢查收到的申請（我是主辦方）
                for (const app of (appData.received || [])) {
                    const appTime = new Date(app.created_at).getTime();
                    if (appTime > lastReadTime && app.status === 'pending') {
                        hasNew = true;
                        if (lastReadTime > 0) {
                            newToasts.push({ type: 'new_application', message: 'newApplication' });
                        }
                        break;
                    }
                }

                // 檢查發送的申請狀態變更（我是申請者）
                for (const app of (appData.sent || [])) {
                    const updateTime = new Date(app.updated_at).getTime();
                    if (updateTime > lastReadTime) {
                        if (app.status === 'accepted') {
                            hasNew = true;
                            if (lastReadTime > 0) {
                                newToasts.push({ type: 'application_accepted', message: 'applicationAccepted' });
                            }
                        } else if (app.status === 'rejected') {
                            hasNew = true;
                            if (lastReadTime > 0) {
                                newToasts.push({ type: 'application_rejected', message: 'applicationRejected' });
                            }
                        }
                    }
                }
            }

            setHasUnread(hasNew);

            // 顯示 Toast（避免重複）
            const shownTypes = new Set<ToastType>();
            for (const t of newToasts) {
                if (!shownTypes.has(t.type)) {
                    shownTypes.add(t.type);
                    addToast(t.type, t.message);
                }
            }

        } catch (error) {
            console.error('Error checking unread:', error);
        }
    }, [session?.user?.dbId, addToast]);

    // 頁面載入時檢查
    useEffect(() => {
        if (session?.user?.dbId) {
            checkUnread();
        }
    }, [session?.user?.dbId, checkUnread]);

    return (
        <NotificationContext.Provider
            value={{
                hasUnread,
                toasts,
                addToast,
                removeToast,
                markAsRead,
                checkUnread,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotification() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
}
