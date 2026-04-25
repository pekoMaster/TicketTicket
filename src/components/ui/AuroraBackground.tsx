'use client';

interface AuroraBackgroundProps {
    variant?: 'default' | 'pink' | 'cyan' | 'purple';
    className?: string;
}

interface OrbConfig {
    light: string;
    dark: string;
    position: string;
    size: string;
    duration: string;
    delay: string;
}

const COLOR_SCHEMES: Record<string, OrbConfig[]> = {
    default: [
        { light: 'bg-indigo-300/20', dark: 'dark:bg-purple-500/20', position: 'top-0 left-1/4', size: 'w-96 h-96', duration: '4s', delay: '0s' },
        { light: 'bg-purple-300/20', dark: 'dark:bg-cyan-500/20', position: 'bottom-1/4 right-1/4', size: 'w-80 h-80', duration: '3s', delay: '1s' },
        { light: 'bg-pink-300/15', dark: 'dark:bg-pink-500/10', position: 'top-1/2 left-1/2', size: 'w-64 h-64', duration: '5s', delay: '2s' },
    ],
    pink: [
        { light: 'bg-pink-300/20', dark: 'dark:bg-pink-500/20', position: 'top-0 right-1/4', size: 'w-96 h-96', duration: '4s', delay: '0s' },
        { light: 'bg-rose-300/20', dark: 'dark:bg-rose-500/20', position: 'bottom-1/3 left-1/4', size: 'w-80 h-80', duration: '3s', delay: '1s' },
        { light: 'bg-purple-300/15', dark: 'dark:bg-purple-500/10', position: 'top-1/3 right-1/3', size: 'w-64 h-64', duration: '5s', delay: '2s' },
    ],
    cyan: [
        { light: 'bg-cyan-300/20', dark: 'dark:bg-cyan-500/20', position: 'top-1/4 left-1/4', size: 'w-96 h-96', duration: '4s', delay: '0s' },
        { light: 'bg-teal-300/20', dark: 'dark:bg-teal-500/20', position: 'bottom-1/4 right-1/3', size: 'w-80 h-80', duration: '3s', delay: '1s' },
        { light: 'bg-blue-300/15', dark: 'dark:bg-blue-500/10', position: 'top-1/2 left-1/2', size: 'w-64 h-64', duration: '5s', delay: '2s' },
    ],
    purple: [
        { light: 'bg-indigo-300/20', dark: 'dark:bg-indigo-500/20', position: 'top-0 right-1/4', size: 'w-96 h-96', duration: '4s', delay: '0s' },
        { light: 'bg-purple-300/20', dark: 'dark:bg-purple-500/20', position: 'bottom-1/4 left-1/4', size: 'w-80 h-80', duration: '3s', delay: '1s' },
        { light: 'bg-violet-300/15', dark: 'dark:bg-violet-500/10', position: 'top-1/2 left-1/2', size: 'w-64 h-64', duration: '5s', delay: '2s' },
    ],
};

export default function AuroraBackground({ variant = 'default', className = '' }: AuroraBackgroundProps) {
    const orbs = COLOR_SCHEMES[variant];

    return (
        <div className={`fixed inset-0 overflow-hidden pointer-events-none z-0 ${className}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-indigo-50/30 to-gray-50 dark:from-gray-900 dark:via-indigo-950 dark:to-gray-900" />

            {orbs.map((orb, index) => (
                <div
                    key={index}
                    className={`aurora-orb absolute ${orb.light} ${orb.dark} ${orb.position} ${orb.size} rounded-full blur-3xl animate-pulse`}
                    style={{
                        animationDuration: orb.duration,
                        animationDelay: orb.delay,
                    }}
                />
            ))}
        </div>
    );
}
