'use client';

import { useState } from 'react';
import {
    Ticket, MapPin, Users, Sparkles, Star, MessageCircle,
    Check, Globe, Languages, Share2, Flag, ShieldCheck,
    AlertTriangle, ArrowLeft, Armchair, Banknote
} from 'lucide-react';

// 模擬資料
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
    hostLanguages: ['繁體中文', '日本語', 'English'],
    description: '大家好！我是來自台灣的粉絲，第一次參加 Hololive 的線下活動。希望能找到一位同行者一起分享這份感動！我會說日文和英文，溝通沒問題。期待與你相遇！',
    status: 'open',
};

const mockHost = {
    id: 'host-1',
    username: 'Yi-Hsun Hsu',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=YiHsun',
    rating: 4.8,
    reviewCount: 12,
    lineId: 'yihsun_tw',
    discordId: 'yihsun#1234',
};

const ticketTypeLabels: Record<string, { label: string; color: string; icon: string }> = {
    find_companion: { label: '尋找同行者', color: 'from-blue-500 to-cyan-500', icon: '🤝' },
    sub_ticket_transfer: { label: '子票轉讓', color: 'from-purple-500 to-pink-500', icon: '🎫' },
    ticket_exchange: { label: '換票', color: 'from-orange-500 to-amber-500', icon: '🔄' },
};

export default function TestInfoPage() {
    const [hasApplied, setHasApplied] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);

    const ticketTypeInfo = ticketTypeLabels[mockListing.ticketType];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900">
            {/* Aurora Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '3s', animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} />
            </div>

            {/* Header */}
            <div className="relative z-20 bg-gray-900/80 backdrop-blur-xl border-b border-white/10 sticky top-0">
                <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
                    <button className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                        <span>返回</span>
                    </button>
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-yellow-400" />
                        <span className="text-white font-medium">票券詳情</span>
                        <Sparkles className="w-5 h-5 text-yellow-400" />
                    </div>
                    <button
                        onClick={() => setShowShareModal(true)}
                        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <Share2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="relative z-10 max-w-3xl mx-auto px-4 py-6 pb-32">
                {/* 主要資訊卡片 */}
                <GlassCard className="mb-6">
                    {/* 票券類型標籤 */}
                    <div className="mb-4">
                        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white font-semibold bg-gradient-to-r ${ticketTypeInfo.color} shadow-lg`}>
                            <span className="text-xl">{ticketTypeInfo.icon}</span>
                            {ticketTypeInfo.label}
                        </span>
                    </div>

                    {/* 活動名稱 */}
                    <h1 className="text-2xl font-bold text-white mb-4">{mockListing.eventName}</h1>

                    {/* 活動地點（僅顯示場館） */}
                    <div className="flex items-center gap-3 text-gray-300 mb-4">
                        <MapPin className="w-5 h-5 text-cyan-400" />
                        <span>{mockListing.venue}</span>
                    </div>

                    {/* 提示：日期時間由雙方協調 */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-200">
                            <p className="font-medium">關於集合時間與地點</p>
                            <p className="text-blue-300/80 mt-1">
                                活動日期、集合時間與地點由雙方在配對成功後自行協調。
                            </p>
                        </div>
                    </div>
                </GlassCard>

                {/* 票種資訊卡片 */}
                <GlassCard className="mb-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Ticket className="w-5 h-5 text-cyan-400" />
                        票券資訊
                    </h3>

                    <div className="space-y-4">
                        {/* 座位等級 */}
                        <InfoRow
                            label="座位等級"
                            value={mockListing.seatGrade}
                            icon={<Armchair className="w-4 h-4 text-indigo-400" />}
                        />

                        {/* 幾人票 */}
                        <InfoRow
                            label="票種"
                            value={mockListing.ticketCountType === 'duo' ? '二人票' : '一人票'}
                            icon={<Users className="w-4 h-4 text-purple-400" />}
                        />

                        {/* 票源 */}
                        <InfoRow
                            label="票源"
                            value={
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${mockListing.ticketSource === 'zaiko'
                                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white'
                                    : 'bg-gradient-to-r from-green-600 to-green-500 text-white'
                                    }`}>
                                    {mockListing.ticketSource.toUpperCase()}
                                </span>
                            }
                        />

                        {/* 協助入場 */}
                        {mockListing.willAssistEntry && (
                            <InfoRow
                                label="協助入場"
                                value={
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-emerald-600 to-green-500 text-white shadow-lg shadow-green-500/20">
                                        <Check className="w-4 h-4" />
                                        主辦會協助
                                    </span>
                                }
                            />
                        )}
                    </div>

                    {/* 價格區塊 - Aurora Style */}
                    <div className="relative rounded-xl overflow-hidden mt-6">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20" />
                        <div className="relative grid grid-cols-2 divide-x divide-white/10 backdrop-blur-sm">
                            <div className="p-4 text-center">
                                <span className="text-xs text-emerald-300 block mb-1">希望分攤</span>
                                <span className="text-3xl font-bold text-white">¥{mockListing.askingPriceJpy.toLocaleString()}</span>
                            </div>
                            <div className="p-4 text-center bg-black/20">
                                <span className="text-xs text-white/50 block mb-1">定價</span>
                                <span className="text-3xl font-medium text-white/70">¥{mockListing.originalPriceJpy.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </GlassCard>

                {/* 描述卡片 */}
                {mockListing.description && (
                    <GlassCard className="mb-6">
                        <h3 className="text-lg font-bold text-white mb-3">其他說明</h3>
                        <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{mockListing.description}</p>
                    </GlassCard>
                )}

                {/* 主辦方資訊卡片 */}
                <GlassCard className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white">主辦方</h3>
                        <button className="p-2 text-gray-400 hover:text-red-400 transition-colors rounded-lg hover:bg-white/5">
                            <Flag className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex items-start gap-4">
                        {/* 頭像 */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full blur-sm opacity-50" />
                            <img
                                src={mockHost.avatarUrl}
                                alt={mockHost.username}
                                className="relative w-16 h-16 rounded-full ring-2 ring-white/30"
                            />
                        </div>

                        {/* 資訊 */}
                        <div className="flex-1">
                            <p className="text-lg font-semibold text-white">{mockHost.username}</p>

                            {/* 評價 */}
                            <div className="flex items-center gap-2 mt-1">
                                <div className="flex items-center gap-1 text-yellow-400">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <Star
                                            key={i}
                                            className={`w-4 h-4 ${i <= Math.round(mockHost.rating) ? 'fill-current' : 'opacity-30'}`}
                                        />
                                    ))}
                                </div>
                                <span className="text-white font-medium">{mockHost.rating}</span>
                                <span className="text-gray-400">({mockHost.reviewCount} 評價)</span>
                            </div>

                            {/* 國籍和語言 */}
                            <div className="flex flex-wrap gap-3 mt-3 text-sm">
                                <span className="inline-flex items-center gap-1.5 text-gray-300">
                                    <Globe className="w-4 h-4 text-cyan-400" />
                                    {mockListing.hostNationality}
                                </span>
                                <span className="inline-flex items-center gap-1.5 text-gray-300">
                                    <Languages className="w-4 h-4 text-purple-400" />
                                    {mockListing.hostLanguages.join(', ')}
                                </span>
                            </div>

                            {/* 聯絡方式 - 申請後顯示 */}
                            {hasApplied && (
                                <div className="flex items-center gap-2 mt-3">
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00B900]/20 rounded-lg border border-[#00B900]/30">
                                        <span className="text-[#00B900] font-medium text-sm">LINE: {mockHost.lineId}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#5865F2]/20 rounded-lg border border-[#5865F2]/30">
                                        <span className="text-[#5865F2] font-medium text-sm">Discord: {mockHost.discordId}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </GlassCard>

                {/* 安全提醒 */}
                <GlassCard className="mb-6 border-emerald-500/30">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <p className="font-semibold text-emerald-300">零手續費</p>
                            <p className="text-sm text-emerald-400/80 mt-1">
                                TicketTicket 不收取任何手續費。所有交易由雙方直接進行，請確保在安全的環境下完成。
                            </p>
                        </div>
                    </div>
                </GlassCard>

                {/* 測試控制 */}
                <GlassCard className="mb-6 border-amber-500/30">
                    <h3 className="text-lg font-bold text-amber-300 mb-3">🧪 測試控制</h3>
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={hasApplied}
                                onChange={(e) => setHasApplied(e.target.checked)}
                                className="w-5 h-5 rounded border-amber-500 text-amber-500 focus:ring-amber-500"
                            />
                            <span className="text-amber-200">模擬已申請狀態（顯示聯絡方式）</span>
                        </label>
                    </div>
                </GlassCard>
            </div>

            {/* 底部操作列 */}
            <div className="fixed bottom-0 left-0 right-0 z-30 bg-gray-900/90 backdrop-blur-xl border-t border-white/10 px-4 py-4 safe-area-bottom">
                <div className="max-w-3xl mx-auto">
                    {hasApplied ? (
                        <div className="flex gap-3">
                            <button
                                onClick={() => setHasApplied(false)}
                                className="flex-1 py-3.5 px-6 rounded-xl font-semibold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all flex items-center justify-center gap-2"
                            >
                                取消申請
                            </button>
                            <div className="flex-1 py-3.5 px-6 rounded-xl font-semibold bg-gray-700/50 text-gray-400 flex items-center justify-center gap-2">
                                <Check className="w-5 h-5" />
                                等待回覆中
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-3">
                            <button className="flex-1 py-3.5 px-6 rounded-xl font-semibold bg-white/10 text-white hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                                <MessageCircle className="w-5 h-5" />
                                發問
                            </button>
                            <button
                                onClick={() => setHasApplied(true)}
                                className="flex-1 py-3.5 px-6 rounded-xl font-semibold bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                            >
                                申請同行
                            </button>
                        </div>
                    )}
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

// Info Row Component
function InfoRow({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
    return (
        <div className="flex justify-between items-center py-3 border-b border-white/10 last:border-0">
            <span className="text-gray-400 flex items-center gap-2">
                {icon}
                {label}
            </span>
            <span className="text-white font-medium">{value}</span>
        </div>
    );
}
