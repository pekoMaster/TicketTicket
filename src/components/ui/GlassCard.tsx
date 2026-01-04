'use client';

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface GlassCardProps {
    children: ReactNode;
    title?: string;
    subtitle?: string;
    icon?: LucideIcon;
    className?: string;
    headerClassName?: string;
    variant?: 'default' | 'aurora' | 'success' | 'warning' | 'info';
    noPadding?: boolean;
}

export default function GlassCard({
    children,
    title,
    subtitle,
    icon: Icon,
    className = '',
    headerClassName = '',
    variant = 'default',
    noPadding = false,
}: GlassCardProps) {
    // 淺色模式和深色模式的變體樣式
    const variantStyles = {
        default: 'bg-white/90 dark:bg-gray-900/40 border-gray-200/50 dark:border-white/10',
        aurora: 'bg-gradient-to-br from-indigo-50/90 via-purple-50/90 to-pink-50/90 dark:from-cyan-500/10 dark:via-purple-500/10 dark:to-pink-500/10 border-indigo-200/50 dark:border-cyan-500/20',
        success: 'bg-emerald-50/90 dark:bg-emerald-500/10 border-emerald-200/50 dark:border-emerald-500/30',
        warning: 'bg-amber-50/90 dark:bg-amber-500/10 border-amber-200/50 dark:border-amber-500/30',
        info: 'bg-blue-50/90 dark:bg-blue-500/10 border-blue-200/50 dark:border-blue-500/30',
    };

    // 圖標漸層色
    const iconGradients = {
        default: 'from-indigo-500 to-purple-500',
        aurora: 'from-cyan-500 to-purple-500',
        success: 'from-emerald-500 to-teal-500',
        warning: 'from-amber-500 to-orange-500',
        info: 'from-blue-500 to-cyan-500',
    };

    return (
        <div
            className={`
        relative backdrop-blur-xl rounded-2xl border shadow-sm dark:shadow-xl
        ${variantStyles[variant]}
        ${noPadding ? '' : 'p-6'}
        ${className}
      `}
        >
            {/* 玻璃光澤效果 - 僅深色模式 */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none dark:block hidden" />

            <div className="relative">
                {(title || Icon) && (
                    <div className={`flex items-center gap-3 mb-4 ${headerClassName}`}>
                        {Icon && (
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${iconGradients[variant]} flex items-center justify-center shadow-lg`}>
                                <Icon className="w-5 h-5 text-white" />
                            </div>
                        )}
                        <div>
                            {title && <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>}
                            {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
                        </div>
                    </div>
                )}
                {children}
            </div>
        </div>
    );
}

// 資訊列組件 - 用於顯示標籤-值對
interface InfoRowProps {
    label: string;
    value: ReactNode;
    icon?: ReactNode;
}

export function InfoRow({ label, value, icon }: InfoRowProps) {
    return (
        <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-white/10 last:border-0">
            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                {icon}
                {label}
            </span>
            <span className="text-gray-900 dark:text-white font-medium">{value}</span>
        </div>
    );
}

// Aurora 價格顯示組件
interface AuroraPriceDisplayProps {
    askingPrice: number;
    originalPrice: number;
    askingLabel?: string;
    originalLabel?: string;
}

export function AuroraPriceDisplay({
    askingPrice,
    originalPrice,
    askingLabel = '希望分攤',
    originalLabel = '定價'
}: AuroraPriceDisplayProps) {
    return (
        <div className="relative rounded-xl overflow-hidden mt-6">
            {/* 淺色模式背景 */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-100 to-cyan-100 dark:from-emerald-500/20 dark:to-cyan-500/20" />

            <div className="relative grid grid-cols-2 divide-x divide-gray-200 dark:divide-white/10 backdrop-blur-sm">
                <div className="p-4 text-center">
                    <span className="text-xs text-emerald-600 dark:text-emerald-300 block mb-1">{askingLabel}</span>
                    <span className="text-3xl font-bold text-emerald-700 dark:text-white">¥{askingPrice.toLocaleString()}</span>
                </div>
                <div className="p-4 text-center bg-gray-50 dark:bg-black/20">
                    <span className="text-xs text-gray-500 dark:text-white/50 block mb-1">{originalLabel}</span>
                    <span className="text-3xl font-medium text-gray-600 dark:text-white/70">¥{originalPrice.toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
}
