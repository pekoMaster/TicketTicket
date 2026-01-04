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
}

export default function GlassCard({
    children,
    title,
    subtitle,
    icon: Icon,
    className = '',
    headerClassName = '',
    variant = 'default',
}: GlassCardProps) {
    // 淺色模式和深色模式的變體樣式
    const variantStyles = {
        default: 'bg-white/80 dark:bg-white/5 border-gray-200 dark:border-white/10',
        aurora: 'bg-gradient-to-br from-indigo-50/80 via-purple-50/80 to-pink-50/80 dark:from-cyan-500/10 dark:via-purple-500/10 dark:to-pink-500/10 border-indigo-200 dark:border-cyan-500/20',
        success: 'bg-emerald-50/80 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20',
        warning: 'bg-amber-50/80 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20',
        info: 'bg-blue-50/80 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20',
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
        backdrop-blur-xl rounded-2xl border p-6 
        shadow-sm dark:shadow-xl
        ${variantStyles[variant]}
        ${className}
      `}
        >
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
    );
}
