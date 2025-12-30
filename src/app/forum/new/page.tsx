'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ForumCategory, FORUM_CATEGORY_INFO } from '@/types';
import { Plus, Trash2, AlertCircle } from 'lucide-react';

export default function NewTopicPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const t = useTranslations('forum');

    const [category, setCategory] = useState<ForumCategory>('discussion');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // 投票功能
    const [enablePoll, setEnablePoll] = useState(false);
    const [pollQuestion, setPollQuestion] = useState('');
    const [pollOptions, setPollOptions] = useState(['', '']);
    const [isMultipleChoice, setIsMultipleChoice] = useState(false);

    if (status === 'loading') {
        return null;
    }

    if (!session) {
        router.push('/login?callbackUrl=/forum/new');
        return null;
    }

    const addPollOption = () => {
        if (pollOptions.length < 10) {
            setPollOptions([...pollOptions, '']);
        }
    };

    const removePollOption = (index: number) => {
        if (pollOptions.length > 2) {
            setPollOptions(pollOptions.filter((_, i) => i !== index));
        }
    };

    const updatePollOption = (index: number, value: string) => {
        const newOptions = [...pollOptions];
        newOptions[index] = value;
        setPollOptions(newOptions);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!title.trim()) {
            setError(t('titleRequired', { defaultValue: '請輸入標題' }));
            return;
        }

        if (!content.trim()) {
            setError(t('contentRequired', { defaultValue: '請輸入內容' }));
            return;
        }

        if (enablePoll) {
            if (!pollQuestion.trim()) {
                setError(t('pollQuestionRequired', { defaultValue: '請輸入投票問題' }));
                return;
            }
            const validOptions = pollOptions.filter(opt => opt.trim());
            if (validOptions.length < 2) {
                setError(t('pollOptionsRequired', { defaultValue: '請至少提供兩個投票選項' }));
                return;
            }
        }

        setSubmitting(true);

        try {
            const payload: Record<string, unknown> = {
                category,
                title: title.trim(),
                content: content.trim(),
            };

            if (enablePoll) {
                payload.poll = {
                    question: pollQuestion.trim(),
                    options: pollOptions.filter(opt => opt.trim()),
                    isMultipleChoice,
                };
            }

            const res = await fetch('/api/forum/topics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (res.ok) {
                router.push(`/forum/${data.topic.id}`);
            } else {
                setError(data.error || t('createFailed', { defaultValue: '發起討論失敗' }));
            }
        } catch (err) {
            console.error('Error creating topic:', err);
            setError(t('createFailed', { defaultValue: '發起討論失敗' }));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header title={t('newTopic', { defaultValue: '發起討論' })} showBack />

            <div className="pt-20 pb-24 px-4 max-w-2xl mx-auto">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* 錯誤訊息 */}
                    {error && (
                        <Card className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
                            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                                <AlertCircle className="w-5 h-5" />
                                {error}
                            </div>
                        </Card>
                    )}

                    {/* 分類選擇 */}
                    <Card>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                            {t('category', { defaultValue: '分類' })}
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {(Object.keys(FORUM_CATEGORY_INFO) as ForumCategory[]).map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setCategory(cat)}
                                    className={`p-3 rounded-lg border text-left transition-colors ${category === cat
                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                        }`}
                                >
                                    <span className="text-lg">{FORUM_CATEGORY_INFO[cat].icon}</span>
                                    <span className={`block text-sm mt-1 ${category === cat ? 'text-indigo-600 dark:text-indigo-400 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                                        {FORUM_CATEGORY_INFO[cat].label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </Card>

                    {/* 標題 */}
                    <Card>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                            {t('topicTitle', { defaultValue: '標題' })}
                        </label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={t('titlePlaceholder', { defaultValue: '請輸入討論標題' })}
                            maxLength={100}
                        />
                        <p className="text-xs text-gray-400 mt-1 text-right">{title.length}/100</p>
                    </Card>

                    {/* 內容 */}
                    <Card>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                            {t('topicContent', { defaultValue: '內容' })}
                        </label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder={t('contentPlaceholder', { defaultValue: '請詳細描述您的問題或建議...' })}
                            rows={8}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                        />
                    </Card>

                    {/* 投票功能 */}
                    <Card>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={enablePoll}
                                onChange={(e) => setEnablePoll(e.target.checked)}
                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                            />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                {t('addPoll', { defaultValue: '新增投票' })}
                            </span>
                        </label>

                        {enablePoll && (
                            <div className="mt-4 space-y-4">
                                <div>
                                    <Input
                                        value={pollQuestion}
                                        onChange={(e) => setPollQuestion(e.target.value)}
                                        placeholder={t('pollQuestion', { defaultValue: '投票問題' })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    {pollOptions.map((option, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <Input
                                                value={option}
                                                onChange={(e) => updatePollOption(index, e.target.value)}
                                                placeholder={`${t('option', { defaultValue: '選項' })} ${index + 1}`}
                                            />
                                            {pollOptions.length > 2 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removePollOption(index)}
                                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {pollOptions.length < 10 && (
                                    <button
                                        type="button"
                                        onClick={addPollOption}
                                        className="flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                                    >
                                        <Plus className="w-4 h-4" />
                                        {t('addOption', { defaultValue: '新增選項' })}
                                    </button>
                                )}

                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isMultipleChoice}
                                        onChange={(e) => setIsMultipleChoice(e.target.checked)}
                                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                    />
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        {t('multipleChoice', { defaultValue: '允許多選' })}
                                    </span>
                                </label>
                            </div>
                        )}
                    </Card>

                    {/* 提交按鈕 */}
                    <Button
                        type="submit"
                        fullWidth
                        disabled={submitting}
                    >
                        {submitting ? t('submitting', { defaultValue: '發布中...' }) : t('submit', { defaultValue: '發布討論' })}
                    </Button>
                </form>
            </div>
        </div>
    );
}
