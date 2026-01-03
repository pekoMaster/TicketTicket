'use client';

import { useState } from 'react';
import {
    Calendar, Clock, MapPin, Ticket, User, Globe, Languages,
    Check, ChevronRight, ChevronLeft, Sparkles, AlertTriangle,
    Users, ArrowRight
} from 'lucide-react';

// 模擬資料
const mockEvents = [
    { name: '#きゅるるん大作戦 ～最強のホロライブ～', venue: '幕張メッセ展示ホール', dates: ['2026-01-17', '2026-01-18'] },
    { name: 'hololive SUPER EXPO 2026', venue: '東京ビッグサイト', dates: ['2026-03-15', '2026-03-16'] },
];

const seatGrades = ['VIP', 'S席', 'A席', 'B席'];
const ticketSources = ['ZAIKO', 'LAWSON'];
const ticketCountTypes = [
    { value: 'solo', label: '一人票', icon: '👤' },
    { value: 'duo', label: '二人票', icon: '👥' },
];
const listingTypes = [
    { value: 'find_companion', label: '尋找同行者', desc: '找人一起參加活動', icon: '🤝' },
    { value: 'sub_ticket_transfer', label: '子票轉讓', desc: '轉讓多餘的子票', icon: '🎫' },
    { value: 'ticket_exchange', label: '換票', desc: '與其他粉絲交換座位', icon: '🔄' },
];
const languages = ['繁體中文', '日本語', 'English', '简体中文', '한국어'];
const nationalities = ['台灣', '日本', '香港', '中國', '美國', '韓國', '其他'];

// 步驟定義
const STEPS = [
    { id: 1, title: '活動資訊', icon: Calendar },
    { id: 2, title: '票券資訊', icon: Ticket },
    { id: 3, title: '發布者', icon: User },
    { id: 4, title: '確認發佈', icon: Check },
];

export default function TestCreatePage() {
    // 表單狀態
    const [currentStep, setCurrentStep] = useState(1);
    const [eventName, setEventName] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [meetingTime, setMeetingTime] = useState('');
    const [ticketSource, setTicketSource] = useState('');
    const [seatGrade, setSeatGrade] = useState('');
    const [ticketCountType, setTicketCountType] = useState('');
    const [listingType, setListingType] = useState('');
    const [willAssistEntry, setWillAssistEntry] = useState(false);
    const [askingPrice, setAskingPrice] = useState(19000);
    const [nationality, setNationality] = useState('');
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
    const [description, setDescription] = useState('');

    // 驗證狀態
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const selectedEvent = mockEvents.find(e => e.name === eventName);
    const originalPrice = 19000;

    // 欄位驗證
    const validateField = (field: string, value: string | string[]) => {
        if (field === 'eventName' && !value) return '請選擇活動';
        if (field === 'eventDate' && !value) return '請選擇日期';
        if (field === 'nationality' && !value) return '請選擇國籍';
        if (field === 'languages' && (value as string[]).length === 0) return '請至少選擇一種語言';
        return '';
    };

    const handleBlur = (field: string, value: string | string[]) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        const error = validateField(field, value);
        setErrors(prev => ({ ...prev, [field]: error }));
    };

    const toggleLanguage = (lang: string) => {
        setSelectedLanguages(prev =>
            prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
        );
    };

    const canProceed = () => {
        switch (currentStep) {
            case 1: return eventName && eventDate && meetingTime;
            case 2: return ticketSource && seatGrade && ticketCountType && listingType;
            case 3: return nationality && selectedLanguages.length > 0;
            default: return true;
        }
    };

    const nextStep = () => {
        if (currentStep < 4 && canProceed()) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900">
            {/* Aurora Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '3s', animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} />
            </div>

            <div className="relative z-10 max-w-3xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                        <Sparkles className="w-8 h-8 text-yellow-400" />
                        發佈新刊登
                        <Sparkles className="w-8 h-8 text-yellow-400" />
                    </h1>
                    <p className="text-gray-400">使用 UI/UX Pro Max 優化的發佈流程</p>
                </div>

                {/* Step Progress Indicator */}
                <div className="mb-8">
                    <div className="flex items-center justify-between relative">
                        {/* Progress Line */}
                        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-700">
                            <div
                                className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
                                style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                            />
                        </div>

                        {/* Step Icons */}
                        {STEPS.map((step, index) => {
                            const StepIcon = step.icon;
                            const isActive = currentStep === step.id;
                            const isCompleted = currentStep > step.id;

                            return (
                                <div key={step.id} className="relative z-10 flex flex-col items-center">
                                    <button
                                        onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                                        disabled={step.id > currentStep}
                                        className={`
                      w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                      ${isCompleted
                                                ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-cyan-500/30'
                                                : isActive
                                                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/30 scale-110'
                                                    : 'bg-gray-800 text-gray-500 border border-gray-700'}
                    `}
                                    >
                                        {isCompleted ? <Check className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                                    </button>
                                    <span className={`mt-2 text-xs font-medium ${isActive ? 'text-white' : 'text-gray-500'}`}>
                                        {step.title}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Form Content - Glassmorphism Cards */}
                <div className="space-y-6">
                    {/* Step 1: 活動資訊 */}
                    {currentStep === 1 && (
                        <div className="animate-fade-in">
                            <GlassCard title="活動資訊" icon={Calendar}>
                                <div className="space-y-6">
                                    {/* 活動選擇 */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-200 mb-2">
                                            選擇活動 <span className="text-pink-400">*</span>
                                        </label>
                                        <div className="space-y-2">
                                            {mockEvents.map((event) => (
                                                <button
                                                    key={event.name}
                                                    onClick={() => setEventName(event.name)}
                                                    onBlur={() => handleBlur('eventName', eventName)}
                                                    className={`
                            w-full p-4 rounded-xl text-left transition-all duration-300
                            ${eventName === event.name
                                                            ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-2 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                                                            : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'}
                          `}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="font-semibold text-white">{event.name}</p>
                                                            <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                                                                <MapPin className="w-3.5 h-3.5" />
                                                                {event.venue}
                                                            </p>
                                                        </div>
                                                        {eventName === event.name && (
                                                            <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center">
                                                                <Check className="w-4 h-4 text-white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                        {touched.eventName && errors.eventName && (
                                            <p className="mt-2 text-sm text-red-400 flex items-center gap-1" role="alert">
                                                <AlertTriangle className="w-4 h-4" />
                                                {errors.eventName}
                                            </p>
                                        )}
                                    </div>

                                    {/* 日期時間 */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-200 mb-2">
                                                活動日期 <span className="text-pink-400">*</span>
                                            </label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="date"
                                                    value={eventDate}
                                                    onChange={(e) => setEventDate(e.target.value)}
                                                    onBlur={() => handleBlur('eventDate', eventDate)}
                                                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-200 mb-2">
                                                集合時間 <span className="text-pink-400">*</span>
                                            </label>
                                            <div className="relative">
                                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="time"
                                                    value={meetingTime}
                                                    onChange={(e) => setMeetingTime(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-amber-400">⏰ 時間以日本時間 (JST) 為準</p>

                                    {/* 場地地址（自動填入） */}
                                    {selectedEvent && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-200 mb-2">場地地址</label>
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="text"
                                                    value={selectedEvent.venue}
                                                    readOnly
                                                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-400 cursor-not-allowed"
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">✓ 已根據選擇的活動自動填入</p>
                                        </div>
                                    )}
                                </div>
                            </GlassCard>
                        </div>
                    )}

                    {/* Step 2: 票券資訊 */}
                    {currentStep === 2 && (
                        <div className="animate-fade-in">
                            <GlassCard title="票券資訊" icon={Ticket}>
                                <div className="space-y-6">
                                    {/* 票源選擇 */}
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
                                                            : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:scale-102'}
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
                            py-2.5 px-5 rounded-xl font-medium transition-all duration-300
                            ${seatGrade === grade
                                                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 scale-105'
                                                            : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:scale-102'}
                          `}
                                                >
                                                    {grade}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 票種類型 */}
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
                                                            : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:scale-102'}
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
                                            {listingTypes.map((type) => {
                                                const isDisabled = type.value === 'sub_ticket_transfer' && (ticketCountType === 'solo' || ticketSource === 'LAWSON');
                                                return (
                                                    <button
                                                        key={type.value}
                                                        onClick={() => !isDisabled && setListingType(type.value)}
                                                        disabled={isDisabled}
                                                        className={`
                              w-full p-4 rounded-xl text-left transition-all duration-300 flex items-start gap-3
                              ${isDisabled
                                                                ? 'bg-gray-800/50 text-gray-600 cursor-not-allowed opacity-50'
                                                                : listingType === type.value
                                                                    ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 border-2 border-pink-500/50 shadow-lg shadow-pink-500/10'
                                                                    : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'}
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
                                                );
                                            })}
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
                                                    <p className="text-sm text-emerald-400">幫助同行者順利入場（如電子票掃碼等）</p>
                                                </div>
                                            </label>
                                        </div>
                                    )}

                                    {/* 價格設定 - Aurora Style */}
                                    {seatGrade && ticketCountType && (
                                        <div className="relative rounded-xl overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20" />
                                            <div className="relative p-4 backdrop-blur-sm">
                                                <label className="block text-sm font-medium text-gray-200 mb-3">價格設定</label>
                                                <div className="grid grid-cols-2 divide-x divide-white/10">
                                                    <div className="pr-4 text-center">
                                                        <span className="text-xs text-emerald-300 block mb-1">希望分攤</span>
                                                        <div className="flex items-center justify-center gap-1">
                                                            <span className="text-3xl font-bold text-white">¥</span>
                                                            <input
                                                                type="number"
                                                                value={askingPrice}
                                                                onChange={(e) => setAskingPrice(Number(e.target.value))}
                                                                className="w-24 text-3xl font-bold text-white bg-transparent border-b-2 border-emerald-500/50 focus:border-emerald-400 focus:outline-none text-center"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="pl-4 text-center bg-black/20">
                                                        <span className="text-xs text-white/50 block mb-1">定價</span>
                                                        <span className="text-3xl font-medium text-white/70">¥{originalPrice.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                                {ticketCountType === 'duo' && listingType === 'sub_ticket_transfer' && (
                                                    <p className="text-xs text-amber-400 mt-3 text-center">
                                                        💡 二人票子票轉讓，價格上限為定價一半：¥{Math.floor(originalPrice / 2).toLocaleString()}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </GlassCard>
                        </div>
                    )}

                    {/* Step 3: 發布者資訊 */}
                    {currentStep === 3 && (
                        <div className="animate-fade-in">
                            <GlassCard title="發布者資訊" icon={User}>
                                <div className="space-y-6">
                                    {/* 國籍 */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-200 mb-2 flex items-center gap-2">
                                            <Globe className="w-4 h-4" />
                                            國籍 <span className="text-pink-400">*</span>
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {nationalities.map((nat) => (
                                                <button
                                                    key={nat}
                                                    onClick={() => setNationality(nat)}
                                                    onBlur={() => handleBlur('nationality', nationality)}
                                                    className={`
                            py-2 px-4 rounded-xl font-medium transition-all duration-300
                            ${nationality === nat
                                                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 scale-105'
                                                            : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:scale-102'}
                          `}
                                                >
                                                    {nat}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 語言 */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-200 mb-2 flex items-center gap-2">
                                            <Languages className="w-4 h-4" />
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
                                        {selectedLanguages.length === 0 && touched.languages && (
                                            <p className="mt-2 text-sm text-red-400 flex items-center gap-1" role="alert">
                                                <AlertTriangle className="w-4 h-4" />
                                                請至少選擇一種語言
                                            </p>
                                        )}
                                    </div>

                                    {/* 其他備註 */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-200 mb-2">其他備註</label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="任何想讓申請者知道的資訊..."
                                            rows={4}
                                            maxLength={500}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all resize-none"
                                        />
                                        <p className="text-xs text-gray-500 text-right mt-1">{description.length}/500</p>
                                    </div>
                                </div>
                            </GlassCard>
                        </div>
                    )}

                    {/* Step 4: 確認發佈 */}
                    {currentStep === 4 && (
                        <div className="animate-fade-in">
                            <GlassCard title="確認發佈" icon={Check}>
                                <div className="space-y-6">
                                    {/* 摘要卡片 */}
                                    <div className="bg-gradient-to-br from-purple-500/10 to-cyan-500/10 rounded-xl p-6 border border-white/10">
                                        <h4 className="text-lg font-bold text-white mb-4">📋 刊登摘要</h4>

                                        <div className="space-y-4">
                                            <SummaryRow label="活動" value={eventName} />
                                            <SummaryRow label="日期" value={eventDate} />
                                            <SummaryRow label="集合時間" value={meetingTime} />
                                            <SummaryRow label="票源" value={ticketSource} />
                                            <SummaryRow label="座位" value={seatGrade} />
                                            <SummaryRow label="票種" value={ticketCountTypes.find(t => t.value === ticketCountType)?.label || ''} />
                                            <SummaryRow label="類型" value={listingTypes.find(t => t.value === listingType)?.label || ''} />
                                            <SummaryRow label="國籍" value={nationality} />
                                            <SummaryRow label="語言" value={selectedLanguages.join(', ')} />
                                        </div>

                                        {/* 價格摘要 */}
                                        <div className="mt-6 pt-4 border-t border-white/10">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-400">希望分攤</span>
                                                <span className="text-2xl font-bold text-emerald-400">¥{askingPrice.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 合規提醒 */}
                                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex gap-3">
                                        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                                        <div className="text-sm text-amber-200">
                                            <p className="font-medium">發佈前請確認</p>
                                            <p className="text-amber-300/80 mt-1">請確保您的刊登符合活動主辦方的轉讓規定。違規刊登可能會被移除。</p>
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>
                        </div>
                    )}
                </div>

                {/* Navigation Buttons */}
                <div className="mt-8 flex gap-4">
                    {currentStep > 1 && (
                        <button
                            onClick={prevStep}
                            className="flex-1 py-3.5 px-6 rounded-xl font-semibold bg-white/10 text-white hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                        >
                            <ChevronLeft className="w-5 h-5" />
                            上一步
                        </button>
                    )}

                    {currentStep < 4 ? (
                        <button
                            onClick={nextStep}
                            disabled={!canProceed()}
                            className={`
                flex-1 py-3.5 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2
                ${canProceed()
                                    ? 'bg-gradient-to-r from-cyan-600 to-purple-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-[1.02]'
                                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'}
              `}
                        >
                            下一步
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    ) : (
                        <button
                            className="flex-1 py-3.5 px-6 rounded-xl font-semibold bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                        >
                            確認發佈
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Custom Animation Styles */}
            <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
        </div>
    );
}

// Glassmorphism Card Component
function GlassCard({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
    return (
        <div className="relative bg-gray-900/40 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl">
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

            <div className="relative">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Icon className="w-5 h-5 text-cyan-400" />
                    {title}
                </h3>
                {children}
            </div>
        </div>
    );
}

// Summary Row Component
function SummaryRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between items-center">
            <span className="text-gray-400">{label}</span>
            <span className="text-white font-medium">{value || '-'}</span>
        </div>
    );
}
