'use client';

import { useState } from 'react';
import {
    Ticket, MapPin, Users, Sparkles, MessageCircle,
    Check, Globe, Languages, AlertTriangle, ArrowLeft,
    Armchair, Save, X, ChevronDown
} from 'lucide-react';

// 模擬資料 - 從現有刊登載入
const mockListing = {
    id: 'test-1',
    eventName: '#きゅるるん大作戦 ～最強のホロライブ～',
    venue: '幕張メッセ展示ホール',
    seatGrade: 'Day1 Class A',
    ticketCountType: 'duo',
    ticketSource: 'zaiko',
    ticketType: 'find_companion',
    willAssistEntry: true,
    askingPriceJpy: 19000,
    originalPriceJpy: 19000,
    hostNationality: '台灣',
    hostLanguages: ['繁體中文', '日本語'],
    description: '大家好！我是來自台灣的粉絲，第一次參加 Hololive 的線下活動。',
    status: 'open',
};

const mockEvents = [
    { name: '#きゅるるん大作戦 ～最強のホロライブ～', venue: '幕張メッセ展示ホール' },
    { name: 'hololive SUPER EXPO 2026', venue: '東京ビッグサイト' },
];

const seatGrades = ['VIP', 'S席', 'A席', 'B席', 'Day1 Class A', 'Day2 Class A'];
const ticketSources = ['ZAIKO', 'LAWSON'];
const ticketCountTypes = [
    { value: 'solo', label: '一人票', icon: '👤' },
    { value: 'duo', label: '二人票', icon: '👥' },
];
const listingTypes = [
    { value: 'find_companion', label: '尋找同行者', desc: '找人一起參加活動', icon: '🤝' },
    { value: 'sub_ticket_transfer', label: '子票轉讓', desc: '轉讓多餘的子票', icon: '🎫' },
];
const languages = ['繁體中文', '日本語', 'English', '简体中文', '한국어'];
const nationalities = ['台灣', '日本', '香港', '中國', '美國', '韓國', '其他'];

export default function TestEditPage() {
    // 表單狀態 - 從 mockListing 初始化
    const [eventName, setEventName] = useState(mockListing.eventName);
    const [ticketSource, setTicketSource] = useState(mockListing.ticketSource.toUpperCase());
    const [seatGrade, setSeatGrade] = useState(mockListing.seatGrade);
    const [ticketCountType, setTicketCountType] = useState(mockListing.ticketCountType);
    const [listingType, setListingType] = useState(mockListing.ticketType);
    const [willAssistEntry, setWillAssistEntry] = useState(mockListing.willAssistEntry);
    const [askingPrice, setAskingPrice] = useState(mockListing.askingPriceJpy);
    const [nationality, setNationality] = useState(mockListing.hostNationality);
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>(mockListing.hostLanguages);
    const [description, setDescription] = useState(mockListing.description);

    // UI 狀態
    const [showSuccess, setShowSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showEventDropdown, setShowEventDropdown] = useState(false);

    const originalPrice = mockListing.originalPriceJpy;
    const selectedEvent = mockEvents.find(e => e.name === eventName);

    const toggleLanguage = (lang: string) => {
        setSelectedLanguages(prev =>
            prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
        );
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        // 模擬提交
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsSubmitting(false);
        setShowSuccess(true);
    };

    // 成功畫面
    if (showSuccess) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 flex items-center justify-center p-4">
                <GlassCard className="text-center max-w-sm w-full">
                    <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
                        <Check className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">更新成功！</h2>
                    <p className="text-gray-400 mb-6">您的刊登已成功更新</p>
                    <button
                        onClick={() => setShowSuccess(false)}
                        className="w-full py-3 px-6 rounded-xl font-semibold bg-gradient-to-r from-cyan-600 to-purple-600 text-white hover:shadow-lg hover:shadow-cyan-500/30 transition-all"
                    >
                        繼續編輯
                    </button>
                </GlassCard>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900">
            {/* Aurora Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '3s', animationDelay: '1s' }} />
            </div>

            {/* Header */}
            <div className="relative z-20 bg-gray-900/80 backdrop-blur-xl border-b border-white/10 sticky top-0">
                <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
                    <button className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                        <span>取消</span>
                    </button>
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-yellow-400" />
                        <span className="text-white font-medium">編輯刊登</span>
                        <Sparkles className="w-5 h-5 text-yellow-400" />
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors font-medium disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Save className="w-5 h-5" />
                        )}
                        <span>儲存</span>
                    </button>
                </div>
            </div>

            <div className="relative z-10 max-w-3xl mx-auto px-4 py-6 pb-32">
                {/* 編輯提醒 */}
                <GlassCard className="mb-6 border-amber-500/30">
                    <div className="flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-200">
                            <p className="font-medium">編輯注意事項</p>
                            <p className="text-amber-300/80 mt-1">
                                更改刊登內容後，已提交的申請將保留。如需重新審核申請者，請考慮重新發布。
                            </p>
                        </div>
                    </div>
                </GlassCard>

                {/* 活動資訊 */}
                <GlassCard className="mb-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Ticket className="w-5 h-5 text-cyan-400" />
                        活動資訊
                    </h3>

                    <div className="space-y-4">
                        {/* 活動選擇 */}
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-200 mb-2">
                                選擇活動 <span className="text-pink-400">*</span>
                            </label>
                            <button
                                onClick={() => setShowEventDropdown(!showEventDropdown)}
                                className="w-full p-4 rounded-xl text-left transition-all bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-between"
                            >
                                <div>
                                    <p className="font-semibold text-white">{eventName}</p>
                                    <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                                        <MapPin className="w-3.5 h-3.5" />
                                        {selectedEvent?.venue}
                                    </p>
                                </div>
                                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showEventDropdown ? 'rotate-180' : ''}`} />
                            </button>

                            {showEventDropdown && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-white/10 rounded-xl overflow-hidden z-50 shadow-xl">
                                    {mockEvents.map((event) => (
                                        <button
                                            key={event.name}
                                            onClick={() => {
                                                setEventName(event.name);
                                                setShowEventDropdown(false);
                                            }}
                                            className={`w-full p-4 text-left hover:bg-white/10 transition-colors flex items-center justify-between
                        ${eventName === event.name ? 'bg-cyan-500/10' : ''}`}
                                        >
                                            <div>
                                                <p className="font-medium text-white">{event.name}</p>
                                                <p className="text-sm text-gray-400">{event.venue}</p>
                                            </div>
                                            {eventName === event.name && (
                                                <Check className="w-5 h-5 text-cyan-400" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 提示：日期時間由雙方協調 */}
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 flex gap-2">
                            <AlertTriangle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                            <p className="text-sm text-blue-300/80">
                                活動日期、集合時間與地點由雙方在配對成功後自行協調
                            </p>
                        </div>
                    </div>
                </GlassCard>

                {/* 票券資訊 */}
                <GlassCard className="mb-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Ticket className="w-5 h-5 text-cyan-400" />
                        票券資訊
                    </h3>

                    <div className="space-y-6">
                        {/* 票源 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-200 mb-2">
                                票源 <span className="text-pink-400">*</span>
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {ticketSources.map((source) => (
                                    <button
                                        key={source}
                                        onClick={() => setTicketSource(source)}
                                        className={`
                      py-3 px-4 rounded-xl font-semibold transition-all duration-300
                      ${ticketSource === source
                                                ? source === 'ZAIKO'
                                                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30 scale-105'
                                                    : 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg shadow-green-500/30 scale-105'
                                                : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'}
                    `}
                                    >
                                        {source}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 座位等級 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-200 mb-2">
                                座位等級 <span className="text-pink-400">*</span>
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {seatGrades.map((grade) => (
                                    <button
                                        key={grade}
                                        onClick={() => setSeatGrade(grade)}
                                        className={`
                      py-2.5 px-4 rounded-xl font-medium transition-all duration-300
                      ${seatGrade === grade
                                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 scale-105'
                                                : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'}
                    `}
                                    >
                                        {grade}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 票種 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-200 mb-2">
                                票種 <span className="text-pink-400">*</span>
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {ticketCountTypes.map((type) => (
                                    <button
                                        key={type.value}
                                        onClick={() => setTicketCountType(type.value)}
                                        className={`
                      py-3 px-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2
                      ${ticketCountType === type.value
                                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30 scale-105'
                                                : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'}
                    `}
                                    >
                                        <span className="text-xl">{type.icon}</span>
                                        {type.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 刊登類型 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-200 mb-2">
                                刊登類型 <span className="text-pink-400">*</span>
                            </label>
                            <div className="space-y-2">
                                {listingTypes.map((type) => (
                                    <button
                                        key={type.value}
                                        onClick={() => setListingType(type.value)}
                                        className={`
                      w-full p-4 rounded-xl text-left transition-all duration-300 flex items-start gap-3
                      ${listingType === type.value
                                                ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 border-2 border-pink-500/50 shadow-lg shadow-pink-500/10'
                                                : 'bg-white/5 border border-white/10 hover:bg-white/10'}
                    `}
                                    >
                                        <span className="text-2xl">{type.icon}</span>
                                        <div className="flex-1">
                                            <p className="font-semibold text-white">{type.label}</p>
                                            <p className="text-sm text-gray-400">{type.desc}</p>
                                        </div>
                                        {listingType === type.value && (
                                            <div className="w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center">
                                                <Check className="w-4 h-4 text-white" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 協助入場 */}
                        {listingType === 'find_companion' && (
                            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={willAssistEntry}
                                        onChange={(e) => setWillAssistEntry(e.target.checked)}
                                        className="w-5 h-5 rounded border-emerald-500 text-emerald-500 focus:ring-emerald-500"
                                    />
                                    <div>
                                        <span className="font-medium text-white">我可以協助入場</span>
                                        <p className="text-sm text-emerald-400">幫助同行者順利入場</p>
                                    </div>
                                </label>
                            </div>
                        )}

                        {/* 價格 - Aurora Style */}
                        <div className="relative rounded-xl overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20" />
                            <div className="relative p-4 backdrop-blur-sm">
                                <label className="block text-sm font-medium text-gray-200 mb-3">價格設定</label>
                                <div className="grid grid-cols-2 divide-x divide-white/10">
                                    <div className="pr-6 py-2 text-center">
                                        <span className="text-xs text-emerald-300 block mb-1">希望分攤</span>
                                        <div className="flex items-center justify-center gap-1">
                                            <span className="text-2xl font-bold text-white">¥</span>
                                            <input
                                                type="number"
                                                value={askingPrice}
                                                onChange={(e) => setAskingPrice(Number(e.target.value))}
                                                className="w-28 text-2xl font-bold text-white bg-transparent border-b-2 border-emerald-500/50 focus:border-emerald-400 focus:outline-none text-center"
                                            />
                                        </div>
                                    </div>
                                    <div className="pl-6 py-2 text-center bg-black/20">
                                        <span className="text-xs text-white/50 block mb-1">定價</span>
                                        <span className="text-2xl font-medium text-white/70">¥{originalPrice.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </GlassCard>

                {/* 發布者資訊 */}
                <GlassCard className="mb-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-cyan-400" />
                        發布者資訊
                    </h3>

                    <div className="space-y-6">
                        {/* 國籍 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-200 mb-2">
                                國籍 <span className="text-pink-400">*</span>
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {nationalities.map((nat) => (
                                    <button
                                        key={nat}
                                        onClick={() => setNationality(nat)}
                                        className={`
                      py-2 px-4 rounded-xl font-medium transition-all duration-300
                      ${nationality === nat
                                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 scale-105'
                                                : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'}
                    `}
                                    >
                                        {nat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 語言 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-200 mb-2">
                                可用語言 <span className="text-pink-400">*</span>
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {languages.map((lang) => (
                                    <button
                                        key={lang}
                                        onClick={() => toggleLanguage(lang)}
                                        className={`
                      py-2 px-4 rounded-full font-medium transition-all duration-300
                      ${selectedLanguages.includes(lang)
                                                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30 scale-105'
                                                : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'}
                    `}
                                    >
                                        {lang}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </GlassCard>

                {/* 其他備註 */}
                <GlassCard className="mb-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-cyan-400" />
                        其他備註
                    </h3>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="任何想讓申請者知道的資訊..."
                        rows={4}
                        maxLength={500}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all resize-none"
                    />
                    <p className="text-xs text-gray-500 text-right mt-1">{description.length}/500</p>
                </GlassCard>
            </div>

            {/* 底部操作列 */}
            <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 z-30 bg-gray-900/90 backdrop-blur-xl border-t border-white/10 px-4 py-4 safe-area-bottom">
                <div className="max-w-3xl mx-auto flex gap-3">
                    <button className="flex-1 py-3.5 px-6 rounded-xl font-semibold bg-white/10 text-white hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                        <X className="w-5 h-5" />
                        取消
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex-1 py-3.5 px-6 rounded-xl font-semibold bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Save className="w-5 h-5" />
                        )}
                        儲存變更
                    </button>
                </div>
            </div>
        </div>
    );
}

// Glassmorphism Card Component
function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`relative bg-gray-900/40 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl ${className}`}>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            <div className="relative">{children}</div>
        </div>
    );
}
