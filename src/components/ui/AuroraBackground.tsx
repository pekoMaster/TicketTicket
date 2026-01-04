'use client';

interface AuroraBackgroundProps {
    variant?: 'default' | 'pink' | 'cyan' | 'purple';
    className?: string;
}

export default function AuroraBackground({ variant = 'default', className = '' }: AuroraBackgroundProps) {
    // 淺色模式使用更淡的顏色，深色模式使用較飽和的顏色
    const colorSchemes = {
        default: [
            { lightColor: 'bg-indigo-300/20', darkColor: 'bg-purple-500/20', position: 'top-0 left-1/4', size: 'w-96 h-96', duration: '4s', delay: '0s' },
            { lightColor: 'bg-purple-300/20', darkColor: 'bg-cyan-500/20', position: 'bottom-1/4 right-1/4', size: 'w-80 h-80', duration: '3s', delay: '1s' },
            { lightColor: 'bg-pink-300/15', darkColor: 'bg-pink-500/10', position: 'top-1/2 left-1/2', size: 'w-64 h-64', duration: '5s', delay: '2s' },
        ],
        pink: [
            { lightColor: 'bg-pink-300/20', darkColor: 'bg-pink-500/20', position: 'top-0 right-1/4', size: 'w-96 h-96', duration: '4s', delay: '0s' },
            { lightColor: 'bg-rose-300/20', darkColor: 'bg-rose-500/20', position: 'bottom-1/3 left-1/4', size: 'w-80 h-80', duration: '3s', delay: '1s' },
            { lightColor: 'bg-purple-300/15', darkColor: 'bg-purple-500/10', position: 'top-1/3 right-1/3', size: 'w-64 h-64', duration: '5s', delay: '2s' },
        ],
        cyan: [
            { lightColor: 'bg-cyan-300/20', darkColor: 'bg-cyan-500/20', position: 'top-1/4 left-1/4', size: 'w-96 h-96', duration: '4s', delay: '0s' },
            { lightColor: 'bg-teal-300/20', darkColor: 'bg-teal-500/20', position: 'bottom-1/4 right-1/3', size: 'w-80 h-80', duration: '3s', delay: '1s' },
            { lightColor: 'bg-blue-300/15', darkColor: 'bg-blue-500/10', position: 'top-1/2 left-1/2', size: 'w-64 h-64', duration: '5s', delay: '2s' },
        ],
        purple: [
            { lightColor: 'bg-indigo-300/20', darkColor: 'bg-indigo-500/20', position: 'top-0 right-1/4', size: 'w-96 h-96', duration: '4s', delay: '0s' },
            { lightColor: 'bg-purple-300/20', darkColor: 'bg-purple-500/20', position: 'bottom-1/4 left-1/4', size: 'w-80 h-80', duration: '3s', delay: '1s' },
            { lightColor: 'bg-violet-300/15', darkColor: 'bg-violet-500/10', position: 'top-1/2 left-1/2', size: 'w-64 h-64', duration: '5s', delay: '2s' },
        ],
    };

    const orbs = colorSchemes[variant];

    return (
        <div className={`fixed inset-0 overflow-hidden pointer-events-none z-0 ${className}`}>
            {/* 基礎背景漸層 - 淺色/深色模式 */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-indigo-50/30 to-gray-50 dark:from-gray-900 dark:via-indigo-950 dark:to-gray-900" />

            {/* 光球效果 */}
            {orbs.map((orb, index) => (
                <div
                    key={index}
                    className={`absolute ${orb.lightColor} dark:${orb.darkColor} ${orb.position} ${orb.size} rounded-full blur-3xl animate-pulse`}
                    style={{
                        animationDuration: orb.duration,
                        animationDelay: orb.delay,
                    }}
                />
            ))}
        </div>
    );
}
