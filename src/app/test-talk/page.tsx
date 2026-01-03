'use client';

import { useState } from 'react';
import {
    Ticket, MapPin, Users, Sparkles, Star, Send,
    Check, Globe, Languages, AlertTriangle, ArrowLeft,
    Armchair, Clock, CheckCircle, Circle, HelpCircle, Flag,
    X, Shield, MessageCircle
} from 'lucide-react';

// 對話狀態類型
type ConversationState = 'inquiry' | 'pending' | 'matched' | 'hostConfirmed' | 'guestConfirmed' | 'bothConfirmed' | 'cancellationPending';

// 模擬資料
const mockListing = {
    eventName: '#きゅるるん大作戦 ～最強のホロライブ～',
    venue: '幕張メッセ展示ホール',
    seatGrade: 'Day1 Class A',
    ticketCountType: 'duo',
    ticketType: 'find_companion',
    askingPriceJpy: 19000,
};

const mockHost = {
    id: 'host-1',
    username: 'Yi-Hsun Hsu',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=YiHsun',
    isHost: true,
};

const mockGuest = {
    id: 'guest-1',
    username: 'Kaede Tanaka',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kaede',
    isHost: false,
};

const mockMessages = [
    { id: '1', senderId: 'guest-1', content: '你好！我對這個活動很有興趣，請問還有名額嗎？', time: '14:30', isMe: false },
    { id: '2', senderId: 'host-1', content: '你好！有的，目前還有 1 個名額喔～', time: '14:32', isMe: true },
    { id: '3', senderId: 'guest-1', content: '太好了！我想確認一下，活動當天我們要怎麼碰面呢？', time: '14:35', isMe: false },
    { id: '4', senderId: 'host-1', content: '我們可以在會場入口碰面，我會穿黑色 Hololive 外套，手上會拿應援棒！', time: '14:38', isMe: true },
    { id: '5', senderId: 'guest-1', content: '好的沒問題！那我就正式申請同行了～', time: '14:40', isMe: false },
];

const stateLabels: Record<ConversationState, { label: string; color: string; desc: string }> = {
    inquiry: { label: '提問中', color: 'bg-blue-500', desc: '雙方正在對話了解中' },
    pending: { label: '申請中', color: 'bg-amber-500', desc: '已提交申請，等待主辦方回覆' },
    matched: { label: '已配對', color: 'bg-green-500', desc: '配對成功！請確認票券資訊' },
    hostConfirmed: { label: '主辦已確認', color: 'bg-cyan-500', desc: '主辦方已確認給予票券' },
    guestConfirmed: { label: '申請者已確認', color: 'bg-purple-500', desc: '申請者已確認收到票券' },
    bothConfirmed: { label: '同行成功', color: 'bg-emerald-500', desc: '雙方都已確認，同行成功！' },
    cancellationPending: { label: '取消請求中', color: 'bg-red-500', desc: '對方希望取消同行' },
};

export default function TestTalkPage() {
    const [currentState, setCurrentState] = useState<ConversationState>('matched');
    const [isHost, setIsHost] = useState(true);
    const [inputMessage, setInputMessage] = useState('');
    const [daysRemaining, setDaysRemaining] = useState(5);

    const otherUser = isHost ? mockGuest : mockHost;
    const stateInfo = stateLabels[currentState];

    // 狀態判斷
    const isMatched = ['matched', 'hostConfirmed', 'guestConfirmed', 'bothConfirmed'].includes(currentState);
    const hostConfirmed = ['hostConfirmed', 'bothConfirmed'].includes(currentState);
    const guestConfirmed = ['guestConfirmed', 'bothConfirmed'].includes(currentState);
    const bothConfirmed = currentState === 'bothConfirmed';

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 flex flex-col">
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
                        <span>返回</span>
                    </button>
                    <div className="flex items-center gap-3">
                        <img src={otherUser.avatarUrl} alt="" className="w-8 h-8 rounded-full ring-2 ring-white/20" />
                        <span className="text-white font-medium">{otherUser.username}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button className="p-2 text-gray-400 hover:text-white transition-colors">
                            <HelpCircle className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-red-400 transition-colors">
                            <Flag className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="relative z-10 flex-1 flex flex-col max-w-3xl mx-auto w-full">
                {/* 測試控制面板 */}
                <GlassCard className="mx-4 mt-4 border-amber-500/30">
                    <h3 className="text-lg font-bold text-amber-300 mb-4">🧪 測試控制面板</h3>

                    {/* 狀態選擇 */}
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm text-gray-300 mb-2">對話狀態</label>
                            <div className="flex flex-wrap gap-2">
                                {(Object.keys(stateLabels) as ConversationState[]).map((state) => (
                                    <button
                                        key={state}
                                        onClick={() => setCurrentState(state)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${currentState === state
                                                ? `${stateLabels[state].color} text-white shadow-lg`
                                                : 'bg-white/10 text-gray-300 hover:bg-white/20'
                                            }`}
                                    >
                                        {stateLabels[state].label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 角色切換 */}
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-300">我的角色：</span>
                            <button
                                onClick={() => setIsHost(true)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isHost ? 'bg-indigo-500 text-white' : 'bg-white/10 text-gray-300'
                                    }`}
                            >
                                主辦方
                            </button>
                            <button
                                onClick={() => setIsHost(false)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${!isHost ? 'bg-pink-500 text-white' : 'bg-white/10 text-gray-300'
                                    }`}
                            >
                                申請者
                            </button>
                        </div>

                        {/* 倒數天數 */}
                        {isMatched && !bothConfirmed && (
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-gray-300">剩餘天數：</span>
                                <input
                                    type="range"
                                    min="1"
                                    max="7"
                                    value={daysRemaining}
                                    onChange={(e) => setDaysRemaining(Number(e.target.value))}
                                    className="w-32"
                                />
                                <span className={`text-sm font-bold ${daysRemaining <= 2 ? 'text-red-400' : 'text-amber-400'}`}>
                                    {daysRemaining} 天
                                </span>
                            </div>
                        )}
                    </div>

                    {/* 當前狀態說明 */}
                    <div className="mt-4 p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full ${stateInfo.color}`} />
                            <span className="text-white font-medium">{stateInfo.label}</span>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">{stateInfo.desc}</p>
                    </div>
                </GlassCard>

                {/* 取消請求通知 */}
                {currentState === 'cancellationPending' && (
                    <div className="mx-4 mt-4 bg-red-500/20 border border-red-500/40 rounded-xl p-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-400" />
                                <div>
                                    <p className="text-sm font-medium text-red-300">對方希望取消同行</p>
                                    <p className="text-xs text-red-400/80 mt-0.5">原因：個人行程有變動</p>
                                </div>
                            </div>
                            <button className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors">
                                回應
                            </button>
                        </div>
                    </div>
                )}

                {/* 安全警告 - 已配對時顯示 */}
                {isMatched && (
                    <div className="mx-4 mt-4">
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex gap-3">
                            <Shield className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                            <div className="text-sm text-amber-200">
                                <p className="font-medium">安全提醒</p>
                                <p className="text-amber-300/80 mt-1">
                                    請在安全的公共場所見面，不要提前轉帳或提供個人敏感資訊。
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 交易資訊區塊 */}
                <GlassCard className="mx-4 mt-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Ticket className="w-5 h-5 text-cyan-400" />
                        <h3 className="text-lg font-bold text-white">{mockListing.eventName}</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-300">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span>{mockListing.venue}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                            <Armchair className="w-4 h-4 text-gray-400" />
                            <span>{mockListing.seatGrade}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span>{mockListing.ticketCountType === 'duo' ? '二人票' : '一人票'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                            <span className="text-emerald-400 font-bold">¥{mockListing.askingPriceJpy.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* 提示：日期時間由雙方協調 */}
                    <div className="mt-3 pt-3 border-t border-white/10 text-sm text-blue-300/80 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        集合時間與地點由雙方自行協調
                    </div>
                </GlassCard>

                {/* 票券驗證區塊 - 已配對時顯示 */}
                {isMatched && (
                    <GlassCard className="mx-4 mt-4">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-white flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-400" />
                                票券確認
                            </h4>
                            {!bothConfirmed && (
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${daysRemaining <= 2
                                        ? 'bg-red-500/20 text-red-300'
                                        : 'bg-amber-500/20 text-amber-300'
                                    }`}>
                                    <Clock className="w-3 h-3 inline mr-1" />
                                    剩餘 {daysRemaining} 天
                                </span>
                            )}
                        </div>

                        {/* 自動完成提示 */}
                        {!bothConfirmed && (
                            <div className="mb-3 p-2 rounded-lg bg-blue-500/10 text-xs text-blue-300">
                                配對後 7 天內未確認將自動視為同行成功，系統會自動給予雙方 5 星好評。
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            {/* 主辦方確認 */}
                            <div className={`p-3 rounded-xl border ${hostConfirmed
                                    ? 'bg-green-500/10 border-green-500/30'
                                    : 'bg-white/5 border-white/10'
                                }`}>
                                <div className="flex items-center gap-2 mb-1">
                                    {hostConfirmed ? (
                                        <CheckCircle className="w-4 h-4 text-green-400" />
                                    ) : (
                                        <Circle className="w-4 h-4 text-gray-400" />
                                    )}
                                    <span className="text-sm font-medium text-white">主辦方</span>
                                </div>
                                <p className="text-xs text-gray-400">
                                    {hostConfirmed ? '已確認給予票券' : '等待確認...'}
                                </p>
                                {isHost && !bothConfirmed && (
                                    <button
                                        onClick={() => setCurrentState(hostConfirmed ? 'matched' : (guestConfirmed ? 'bothConfirmed' : 'hostConfirmed'))}
                                        className={`mt-2 w-full py-2 px-3 rounded-lg text-sm font-medium transition-all ${hostConfirmed
                                                ? 'bg-gray-500/20 text-gray-300 hover:bg-gray-500/30'
                                                : 'bg-green-500 text-white hover:bg-green-600'
                                            }`}
                                    >
                                        {hostConfirmed ? '取消確認' : '確認已給予票券'}
                                    </button>
                                )}
                            </div>

                            {/* 申請者確認 */}
                            <div className={`p-3 rounded-xl border ${guestConfirmed
                                    ? 'bg-green-500/10 border-green-500/30'
                                    : 'bg-white/5 border-white/10'
                                }`}>
                                <div className="flex items-center gap-2 mb-1">
                                    {guestConfirmed ? (
                                        <CheckCircle className="w-4 h-4 text-green-400" />
                                    ) : (
                                        <Circle className="w-4 h-4 text-gray-400" />
                                    )}
                                    <span className="text-sm font-medium text-white">申請者</span>
                                </div>
                                <p className="text-xs text-gray-400">
                                    {guestConfirmed ? '已確認收到票券' : '等待確認...'}
                                </p>
                                {!isHost && !bothConfirmed && (
                                    <button
                                        onClick={() => setCurrentState(guestConfirmed ? 'matched' : (hostConfirmed ? 'bothConfirmed' : 'guestConfirmed'))}
                                        className={`mt-2 w-full py-2 px-3 rounded-lg text-sm font-medium transition-all ${guestConfirmed
                                                ? 'bg-gray-500/20 text-gray-300 hover:bg-gray-500/30'
                                                : 'bg-green-500 text-white hover:bg-green-600'
                                            }`}
                                    >
                                        {guestConfirmed ? '取消確認' : '確認已收到票券'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* 雙方都確認後 */}
                        {bothConfirmed && (
                            <div className="mt-3 p-3 bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-xl border border-green-500/30">
                                <p className="text-sm text-green-300 mb-2 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    🎉 同行成功！感謝使用 TicketTicket
                                </p>
                                <button className="w-full py-2.5 px-4 rounded-lg font-medium bg-gradient-to-r from-yellow-500 to-orange-500 text-white flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-yellow-500/30 transition-all">
                                    <Star className="w-4 h-4" />
                                    撰寫評價
                                </button>
                            </div>
                        )}
                    </GlassCard>
                )}

                {/* 訊息區域 */}
                <div className="flex-1 px-4 py-4 space-y-3 overflow-y-auto">
                    {mockMessages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] ${msg.isMe ? 'order-2' : 'order-1'}`}>
                                {!msg.isMe && (
                                    <div className="flex items-center gap-2 mb-1">
                                        <img src={otherUser.avatarUrl} alt="" className="w-6 h-6 rounded-full" />
                                        <span className="text-xs text-gray-400">{otherUser.username}</span>
                                    </div>
                                )}
                                <div className={`px-4 py-2.5 rounded-2xl ${msg.isMe
                                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-md'
                                        : 'bg-white/10 text-white rounded-bl-md'
                                    }`}>
                                    <p className="text-sm">{msg.content}</p>
                                </div>
                                <div className={`flex items-center gap-2 mt-1 ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                                    <span className="text-xs text-gray-500">{msg.time}</span>
                                    {!msg.isMe && (
                                        <button className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                                            <Languages className="w-3 h-3" />
                                            翻譯
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 底部操作列 */}
                <div className="bg-gray-900/90 backdrop-blur-xl border-t border-white/10 px-4 py-4 safe-area-bottom">
                    {currentState === 'inquiry' && (
                        <div className="flex gap-3 mb-3">
                            <button className="flex-1 py-3 px-4 rounded-xl font-medium bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:shadow-lg hover:shadow-pink-500/30 transition-all">
                                申請同行
                            </button>
                        </div>
                    )}

                    {currentState === 'pending' && (
                        <div className="flex gap-3 mb-3">
                            {isHost ? (
                                <>
                                    <button className="flex-1 py-3 px-4 rounded-xl font-medium bg-white/10 text-gray-300">
                                        拒絕
                                    </button>
                                    <button className="flex-1 py-3 px-4 rounded-xl font-medium bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                                        同意配對
                                    </button>
                                </>
                            ) : (
                                <div className="flex-1 py-3 px-4 rounded-xl font-medium bg-amber-500/20 text-amber-300 text-center flex items-center justify-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    等待主辦方回覆中...
                                </div>
                            )}
                        </div>
                    )}

                    {/* 訊息輸入框 */}
                    <div className="flex items-center gap-3">
                        <input
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            placeholder="輸入訊息..."
                            className="flex-1 px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20"
                        />
                        <button className="p-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/30 transition-all">
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Glassmorphism Card Component
function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`relative bg-gray-900/40 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-xl ${className}`}>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            <div className="relative">{children}</div>
        </div>
    );
}
