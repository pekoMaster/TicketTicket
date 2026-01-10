'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';

interface TutorialStep {
    targetSelector: string;
    message: string;
    position: 'top' | 'bottom' | 'left' | 'right';
}

interface TutorialOverlayProps {
    onComplete: () => void;
    hasListings: boolean;
}

export function TutorialOverlay({ onComplete, hasListings }: TutorialOverlayProps) {
    const t = useTranslations('onboarding');
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [isMobile, setIsMobile] = useState(false);

    // 檢測是否為手機
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024); // lg breakpoint
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // 使用 useMemo 來穩定 steps 陣列
    const steps: TutorialStep[] = useMemo(() => {
        const result: TutorialStep[] = [];

        // 步驟 1：刊登卡片（只在有刊登時顯示）
        if (hasListings) {
            result.push({
                targetSelector: '[data-tutorial="listing-card"]',
                message: t('tutorialStep1'),
                position: 'bottom',
            });
        }

        // 步驟 2：發布按鈕（手機版用底部導航，PC版用側邊欄）
        result.push({
            targetSelector: isMobile
                ? '[data-tutorial="mobile-publish-button"]'
                : '[data-tutorial="publish-button"]',
            message: t('tutorialStep2'),
            position: isMobile ? 'top' : 'right',
        });

        return result;
    }, [hasListings, isMobile, t]);

    // 取得目標元素位置
    useEffect(() => {
        if (steps.length === 0) {
            onComplete();
            return;
        }

        const step = steps[currentStep];
        if (!step) return;

        const updateRect = () => {
            const element = document.querySelector(step.targetSelector);
            if (element) {
                setTargetRect(element.getBoundingClientRect());
            } else {
                // 如果找不到元素，跳過這個步驟
                if (currentStep < steps.length - 1) {
                    setCurrentStep(prev => prev + 1);
                } else {
                    localStorage.setItem('hasCompletedTutorial', 'true');
                    onComplete();
                }
            }
        };

        // 延遲一下確保 DOM 已渲染
        const timer = setTimeout(updateRect, 100);
        window.addEventListener('resize', updateRect);
        window.addEventListener('scroll', updateRect, true);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updateRect);
            window.removeEventListener('scroll', updateRect, true);
        };
    }, [currentStep, steps, onComplete]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            // 教學完成
            localStorage.setItem('hasCompletedTutorial', 'true');
            onComplete();
        }
    };

    const handleSkip = () => {
        localStorage.setItem('hasCompletedTutorial', 'true');
        onComplete();
    };

    if (steps.length === 0 || !targetRect) {
        return null;
    }

    const step = steps[currentStep];
    const isLastStep = currentStep === steps.length - 1;

    // 計算泡泡框位置（改進手機支援）
    const getBubbleStyle = () => {
        const padding = 16;
        const bubbleWidth = Math.min(300, window.innerWidth - 32);
        const bubbleHeight = 150;

        switch (step.position) {
            case 'bottom':
                return {
                    top: targetRect.bottom + padding,
                    left: Math.max(padding, Math.min(targetRect.left + targetRect.width / 2 - bubbleWidth / 2, window.innerWidth - bubbleWidth - padding)),
                };
            case 'right':
                return {
                    top: targetRect.top + targetRect.height / 2 - bubbleHeight / 2,
                    left: targetRect.right + padding,
                };
            case 'left':
                return {
                    top: targetRect.top + targetRect.height / 2 - bubbleHeight / 2,
                    left: targetRect.left - bubbleWidth - padding,
                };
            case 'top':
            default:
                return {
                    top: targetRect.top - bubbleHeight - padding,
                    left: Math.max(padding, Math.min(targetRect.left + targetRect.width / 2 - bubbleWidth / 2, window.innerWidth - bubbleWidth - padding)),
                };
        }
    };

    const bubbleStyle = getBubbleStyle();

    return (
        <div className="fixed inset-0 z-[100]">
            {/* 遮罩層 - 使用 clip-path 挖洞 */}
            <div
                className="absolute inset-0 bg-black/70 transition-all duration-300"
                style={{
                    clipPath: `polygon(
            0% 0%, 
            0% 100%, 
            ${targetRect.left - 8}px 100%, 
            ${targetRect.left - 8}px ${targetRect.top - 8}px, 
            ${targetRect.right + 8}px ${targetRect.top - 8}px, 
            ${targetRect.right + 8}px ${targetRect.bottom + 8}px, 
            ${targetRect.left - 8}px ${targetRect.bottom + 8}px, 
            ${targetRect.left - 8}px 100%, 
            100% 100%, 
            100% 0%
          )`,
                }}
            />

            {/* 高亮框 */}
            <div
                className="absolute border-2 border-cyan-400 rounded-xl pointer-events-none animate-pulse"
                style={{
                    top: targetRect.top - 8,
                    left: targetRect.left - 8,
                    width: targetRect.width + 16,
                    height: targetRect.height + 16,
                    boxShadow: '0 0 20px rgba(6, 182, 212, 0.5)',
                }}
            />

            {/* 說明泡泡框 */}
            <div
                className="absolute bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-4 max-w-[300px] animate-in fade-in slide-in-from-bottom-4 duration-300"
                style={{
                    top: bubbleStyle.top,
                    left: bubbleStyle.left,
                }}
            >
                {/* 箭頭 */}
                <div
                    className={`absolute w-4 h-4 bg-white dark:bg-gray-800 transform rotate-45 ${step.position === 'bottom' ? '-top-2 left-1/2 -translate-x-1/2' :
                        step.position === 'top' ? '-bottom-2 left-1/2 -translate-x-1/2' :
                            step.position === 'right' ? '-left-2 top-1/2 -translate-y-1/2' :
                                '-right-2 top-1/2 -translate-y-1/2'
                        }`}
                />

                {/* 內容 */}
                <p className="text-gray-700 dark:text-gray-200 text-sm mb-4 relative z-10">
                    {step.message}
                </p>

                {/* 按鈕 */}
                <div className="flex gap-2 relative z-10">
                    <button
                        onClick={handleSkip}
                        className="flex-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    >
                        {t('skipTutorial')}
                    </button>
                    <button
                        onClick={handleNext}
                        className="flex-1 px-3 py-2 text-sm bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg font-medium hover:from-cyan-400 hover:to-purple-400 transition-colors"
                    >
                        {isLastStep ? t('finishTutorial') : t('nextStep')}
                    </button>
                </div>

                {/* 步驟指示器 */}
                <div className="flex justify-center gap-1 mt-3 relative z-10">
                    {steps.map((_, index) => (
                        <div
                            key={index}
                            className={`w-2 h-2 rounded-full transition-colors ${index === currentStep
                                ? 'bg-cyan-500'
                                : index < currentStep
                                    ? 'bg-cyan-300'
                                    : 'bg-gray-300 dark:bg-gray-600'
                                }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
