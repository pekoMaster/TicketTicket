'use client';

interface AuroraBackgroundProps {
    variant?: 'default' | 'pink' | 'cyan' | 'purple';
    className?: string;
}

export default function AuroraBackground({ variant = 'default', className = '' }: AuroraBackgroundProps) {
    // 淺色模式使用更淡的顏色
    const colorSchemes = {
        default: [
            {
                light: 'bg-indigo-200/30', dark: 'bg-purple-500/20',
                position: 'top-0 left-1/4', size: 'w-96 h-96', duration: '4s', delay: '0s'
            },
            {
                light: 'bg-purple-200/30', dark: 'bg-cyan-500/20',
                position: 'bottom-1/4 right-1/4', size: 'w-80 h-80', duration: '3s', delay: '1s'
            },
            {
                light: 'bg-pink-200/20', dark: 'bg-pink-500/10',
                position: 'top-1/2 left-1/2', size: 'w-64 h-64', duration: '5s', delay: '2s'
            },
        ],
        pink: [
            { light: 'bg-pink-200/30', dark: 'bg-pink-500/20', position: 'top-0 right-1/4', size: 'w-96 h-96', duration: '4s', delay: '0s' },
            { light: 'bg-rose-200/30', dark: 'bg-rose-500/20', position: 'bottom-1/3 left-1/4', size: 'w-80 h-80', duration: '3s', delay: '1s' },
            { light: 'bg-purple-200/20', dark: 'bg-purple-500/10', position: 'top-1/3 right-1/3', size: 'w-64 h-64', duration: '5s', delay: '2s' },
        ],
        cyan: [
            { light: 'bg-cyan-200/30', dark: 'bg-cyan-500/20', position: 'top-1/4 left-1/4', size: 'w-96 h-96', duration: '4s', delay: '0s' },
            { light: 'bg-teal-200/30', dark: 'bg-teal-500/20', position: 'bottom-1/4 right-1/3', size: 'w-80 h-80', duration: '3s', delay: '1s' },
            { light: 'bg-blue-200/20', dark: 'bg-blue-500/10', position: 'top-1/2 left-1/2', size: 'w-64 h-64', duration: '5s', delay: '2s' },
        ],
        purple: [
            { light: 'bg-indigo-200/30', dark: 'bg-indigo-500/20', position: 'top-0 right-1/4', size: 'w-96 h-96', duration: '4s', delay: '0s' },
            { light: 'bg-purple-200/30', dark: 'bg-purple-500/20', position: 'bottom-1/4 left-1/4', size: 'w-80 h-80', duration: '3s', delay: '1s' },
            { light: 'bg-violet-200/20', dark: 'bg-violet-500/10', position: 'top-1/2 left-1/2', size: 'w-64 h-64', duration: '5s', delay: '2s' },
        ],
    };

    const orbs = colorSchemes[variant];

    return (
        <div className={`fixed inset-0 overflow-hidden pointer-events-none z-0 ${className}`}>
            {/* 淺色模式背景 */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-indigo-50/50 to-gray-50 dark:from-gray-900 dark:via-indigo-950 dark:to-gray-900" />

            {/* 光球效果 */}
            {orbs.map((orb, index) => (
                <div
                    key={index}
                    className={`absolute ${orb.light} dark:${orb.dark} ${orb.position} ${orb.size} rounded-full blur-3xl animate-pulse`}
                    style={{
                        animationDuration: orb.duration,
                        animationDelay: orb.delay,
                    }}
                />
            ))}
        </div>
    );
}
