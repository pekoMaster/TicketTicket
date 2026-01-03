'use client';

import { useState } from 'react';
import { Calendar, Eye, Users, Armchair, Clock, Sparkles } from 'lucide-react';

// 模擬資料
const mockListing = {
  id: 'test-1',
  eventName: '#きゅるるん大作戦 ～最強のホロライブ～',
  seatGrade: 'Day1 Class A',
  ticketCountType: 'duo',
  ticketSource: 'zaiko',
  ticketType: 'find_companion',
  willAssistEntry: true,
  askingPriceJpy: 19000,
  originalPriceJpy: 19000,
  hostNationality: 'zh-TW',
  hostLanguages: ['zh-TW', 'ja', 'en'],
  eventDate: new Date('2026-01-17'),
  createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2天前
};

const mockHost = {
  username: 'Yi-Hsun Hsu',
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=YiHsun',
  rating: 4.8,
  reviewCount: 12,
};

export default function TestCardPage() {
  const [selectedDesign, setSelectedDesign] = useState<'current' | 'v2' | 'v3' | 'v4'>('current');

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <Sparkles className="w-8 h-8 text-yellow-400" />
            ListingCard UI 測試
            <Sparkles className="w-8 h-8 text-yellow-400" />
          </h1>
          <p className="text-gray-400">使用 UI/UX Pro Max Skill 分析後的改進版本</p>
        </div>

        {/* Design Selector */}
        <div className="flex justify-center gap-3 mb-8 flex-wrap">
          {[
            { key: 'current', label: '目前設計', color: 'indigo' },
            { key: 'v2', label: 'V2 (Glassmorphism)', color: 'cyan' },
            { key: 'v3', label: 'V3 (Aurora UI)', color: 'purple' },
            { key: 'v4', label: 'V4 (混合版)', color: 'pink' },
          ].map((option) => (
            <button
              key={option.key}
              onClick={() => setSelectedDesign(option.key as 'current' | 'v2' | 'v3' | 'v4')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${selectedDesign === option.key
                ? option.color === 'indigo'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                  : option.color === 'cyan'
                    ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/30'
                    : option.color === 'purple'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                      : 'bg-pink-600 text-white shadow-lg shadow-pink-500/30'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Cards Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Current Design */}
          <div className={selectedDesign === 'current' ? 'ring-2 ring-indigo-500 rounded-xl' : 'opacity-50'}>
            <CurrentCard listing={mockListing} host={mockHost} />
          </div>

          {/* V2 - Glassmorphism */}
          <div className={selectedDesign === 'v2' ? 'ring-2 ring-cyan-500 rounded-xl' : 'opacity-50'}>
            <GlassmorphismCard listing={mockListing} host={mockHost} />
          </div>

          {/* V3 - Aurora UI */}
          <div className={selectedDesign === 'v3' ? 'ring-2 ring-purple-500 rounded-xl' : 'opacity-50'}>
            <AuroraCard listing={mockListing} host={mockHost} />
          </div>

          {/* V4 - Hybrid (Glassmorphism + Aurora Price) */}
          <div className={selectedDesign === 'v4' ? 'ring-2 ring-pink-500 rounded-xl' : 'opacity-50'}>
            <HybridCard listing={mockListing} host={mockHost} />
          </div>
        </div>

        {/* Analysis */}
        <div className="mt-12 bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">📊 UI/UX Pro Max 分析報告</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-300">目前設計</h3>
              <ul className="space-y-1 text-gray-400">
                <li>✅ 資訊清晰</li>
                <li>✅ 響應式布局</li>
                <li>⚠️ 視覺層次較平</li>
                <li>⚠️ 互動感不足</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-cyan-400">Glassmorphism V2</h3>
              <ul className="space-y-1 text-gray-400">
                <li>✅ 現代化玻璃效果</li>
                <li>✅ 更強的視覺層次</li>
                <li>✅ 漸變邊框效果</li>
                <li>✅ 懸停動畫優化</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-purple-400">Aurora UI V3</h3>
              <ul className="space-y-1 text-gray-400">
                <li>✅ 極光漸變效果</li>
                <li>✅ 動態光暈背景</li>
                <li>✅ 高級視覺體驗</li>
                <li>⚠️ 效能消耗較高</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-pink-400">混合版 V4 ⭐</h3>
              <ul className="space-y-1 text-gray-400">
                <li>✅ V2 玻璃擬態基底</li>
                <li>✅ V3 極光價格設計</li>
                <li>✅ 最佳視覺平衡</li>
                <li>✅ 效能優秀</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 目前設計（模擬）
function CurrentCard({ listing, host }: { listing: typeof mockListing; host: typeof mockHost }) {
  return (
    <div className="bg-gray-800 rounded-xl p-4 flex flex-col h-full hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-700 cursor-pointer hover:bg-gray-700/50 transition-colors -mx-4 -mt-4 px-4 pt-4 rounded-t-xl">
        <img src={host.avatarUrl} className="w-8 h-8 rounded-full" alt="" />
        <span className="text-sm font-medium text-gray-200 flex-1">{host.username}</span>
        <div className="flex items-center gap-1 text-xs text-yellow-400">
          <span>★</span>
          <span>{host.rating}</span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-2 mb-3 pb-3 border-b border-dashed border-gray-700">
        <h3 className="text-lg font-bold text-white line-clamp-1">{listing.eventName}</h3>

        <div className="flex flex-wrap gap-2 items-center text-sm">
          <span className="flex items-center gap-1 font-medium text-gray-300 bg-gray-700 px-2 py-0.5 rounded">
            <Armchair className="w-3.5 h-3.5" />
            {listing.seatGrade}
          </span>
          <span className="flex items-center gap-1 text-gray-400 bg-gray-800/50 px-2 py-0.5 rounded border border-gray-700">
            <Users className="w-3.5 h-3.5" />
            二人票
          </span>
        </div>

        <div className="mt-1 flex gap-1">
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-900/30 text-blue-300">ZAIKO</span>
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-green-900/30 text-green-300">可協助入場</span>
        </div>

        {/* Price */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="flex flex-col items-center p-1.5 rounded border border-emerald-800 bg-emerald-900/20">
            <span className="text-[10px] text-emerald-400">希望分攤</span>
            <span className="font-bold text-emerald-300">¥{listing.askingPriceJpy.toLocaleString()}</span>
          </div>
          <div className="flex flex-col items-center p-1.5 rounded border border-gray-700 bg-gray-800">
            <span className="text-[10px] text-gray-400">定價</span>
            <span className="text-gray-300">¥{listing.originalPriceJpy.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="space-y-2 text-xs text-gray-400">
        <div className="flex items-center justify-between">
          <span className="bg-indigo-900/20 px-2 py-0.5 rounded text-indigo-400">繁體中文</span>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>2026/01/17</span>
            <span className="text-gray-600">•</span>
            <Clock className="w-3 h-3" />
            <span>2 日前</span>
          </div>
        </div>
      </div>

      {/* Button */}
      <div className="flex-grow" />
      <div className="mt-4 pt-3">
        <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors text-sm">
          <Eye className="w-4 h-4" />
          詳細
        </button>
      </div>
    </div>
  );
}

// V2 - Glassmorphism 設計
function GlassmorphismCard({ listing, host }: { listing: typeof mockListing; host: typeof mockHost }) {
  return (
    <div className="group relative bg-gray-900/40 backdrop-blur-xl rounded-2xl p-4 flex flex-col h-full border border-white/10 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10">
      {/* Gradient border effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-transparent to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />

      {/* Header with glass effect */}
      <div className="flex items-center gap-3 mb-3 pb-3 border-b border-white/10 cursor-pointer group/header hover:bg-white/5 transition-all -mx-4 -mt-4 px-4 pt-4 rounded-t-2xl">
        <div className="relative">
          <img src={host.avatarUrl} className="w-10 h-10 rounded-full ring-2 ring-cyan-500/30 group-hover/header:ring-cyan-500/60 transition-all" alt="" />
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-white block truncate">{host.username}</span>
          <div className="flex items-center gap-1 text-xs text-cyan-400">
            <span>★★★★★</span>
            <span className="text-gray-400">({host.reviewCount})</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-3 mb-4">
        <h3 className="text-lg font-bold text-white line-clamp-2 leading-tight group-hover:text-cyan-100 transition-colors">
          {listing.eventName}
        </h3>

        <div className="flex flex-wrap gap-2">
          <span className="flex items-center gap-1.5 text-sm font-medium text-white/90 bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/10">
            <Armchair className="w-4 h-4 text-cyan-400" />
            {listing.seatGrade}
          </span>
          <span className="flex items-center gap-1.5 text-sm text-white/70 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
            <Users className="w-4 h-4 text-purple-400" />
            二人票
          </span>
        </div>

        <div className="flex gap-2">
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20">
            ZAIKO
          </span>
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-600 to-green-500 text-white shadow-lg shadow-green-500/20">
            ✓ 可協助入場
          </span>
        </div>

        {/* Price with glass effect */}
        <div className="grid grid-cols-2 gap-3 mt-1">
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 p-3 border border-emerald-500/30 group/price hover:border-emerald-400/50 transition-all cursor-default">
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 to-transparent opacity-0 group-hover/price:opacity-100 transition-opacity" />
            <span className="text-xs text-emerald-400 block mb-0.5">希望分攤</span>
            <span className="text-xl font-bold text-emerald-300 tracking-tight">
              ¥{listing.askingPriceJpy.toLocaleString()}
            </span>
          </div>
          <div className="rounded-xl bg-white/5 p-3 border border-white/10">
            <span className="text-xs text-gray-400 block mb-0.5">定價</span>
            <span className="text-xl font-medium text-gray-300 tracking-tight">
              ¥{listing.originalPriceJpy.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="space-y-2 text-xs text-gray-400 mt-auto">
        <div className="flex items-center justify-between">
          <span className="bg-indigo-500/20 px-2 py-1 rounded-lg text-indigo-300 font-medium">🇹🇼 繁體中文</span>
          <div className="flex items-center gap-2 text-gray-400">
            <Calendar className="w-3.5 h-3.5" />
            <span>2026/01/17</span>
          </div>
        </div>
        <div className="flex gap-1 flex-wrap">
          {['繁體中文', '日本語', 'English'].map(lang => (
            <span key={lang} className="px-2 py-0.5 rounded-md text-[10px] bg-blue-500/10 text-blue-300 border border-blue-500/20">
              {lang}
            </span>
          ))}
        </div>
      </div>

      {/* Button */}
      <div className="mt-4 pt-3">
        <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-semibold transition-all text-sm shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98]">
          <Eye className="w-4 h-4" />
          查看詳細
        </button>
      </div>
    </div>
  );
}

// V3 - Aurora UI 設計
function AuroraCard({ listing, host }: { listing: typeof mockListing; host: typeof mockHost }) {
  return (
    <div className="group relative rounded-2xl p-4 flex flex-col h-full overflow-hidden">
      {/* Aurora background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-indigo-900/50 to-cyan-900/50" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-purple-500/20 via-transparent to-transparent animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-cyan-500/20 via-transparent to-transparent animate-pulse" style={{ animationDuration: '3s', animationDelay: '1s' }} />

      {/* Glass overlay */}
      <div className="absolute inset-0 backdrop-blur-sm bg-black/20 rounded-2xl border border-white/10" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full blur-sm opacity-50" />
            <img src={host.avatarUrl} className="relative w-12 h-12 rounded-full ring-2 ring-white/30" alt="" />
          </div>
          <div className="flex-1">
            <span className="text-base font-bold text-white block">{host.username}</span>
            <div className="flex items-center gap-1 text-sm">
              <span className="text-yellow-400">★ {host.rating}</span>
              <span className="text-white/40">•</span>
              <span className="text-white/60">{host.reviewCount} 評價</span>
            </div>
          </div>
        </div>

        {/* Event name with glow */}
        <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 drop-shadow-[0_0_10px_rgba(147,51,234,0.3)]">
          {listing.eventName}
        </h3>

        {/* Tags with gradient */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-500/30 to-indigo-500/30 text-white border border-purple-500/30">
            <Armchair className="w-4 h-4" />
            {listing.seatGrade}
          </span>
          <span className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl bg-white/10 text-white/80 border border-white/10">
            <Users className="w-4 h-4" />
            二人票
          </span>
        </div>

        {/* Status badges */}
        <div className="flex gap-2 mb-4">
          <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30 backdrop-blur-sm">
            ZAIKO
          </span>
          <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 backdrop-blur-sm">
            ✓ 可協助入場
          </span>
        </div>

        {/* Price with aurora effect */}
        <div className="relative rounded-xl overflow-hidden mb-4">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20" />
          <div className="relative grid grid-cols-2 divide-x divide-white/10 backdrop-blur-sm">
            <div className="p-3 text-center">
              <span className="text-xs text-emerald-300 block mb-1">希望分攤</span>
              <span className="text-2xl font-bold text-white">¥{listing.askingPriceJpy.toLocaleString()}</span>
            </div>
            <div className="p-3 text-center bg-black/20">
              <span className="text-xs text-white/50 block mb-1">定價</span>
              <span className="text-2xl font-medium text-white/70">¥{listing.originalPriceJpy.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-white/60 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🇹🇼</span>
            <span>繁體中文</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>2026/01/17</span>
          </div>
        </div>

        {/* Button with aurora glow */}
        <button className="relative w-full group/btn overflow-hidden rounded-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 group-hover/btn:from-purple-500 group-hover/btn:via-indigo-500 group-hover/btn:to-cyan-500 transition-all" />
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-white/20 to-cyan-600/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700" />
          <span className="relative flex items-center justify-center gap-2 px-4 py-3 font-semibold text-white">
            <Eye className="w-5 h-5" />
            查看詳細
          </span>
        </button>
      </div>
    </div>
  );
}

// V4 - Hybrid 設計 (Glassmorphism Base + Aurora Price)
function HybridCard({ listing, host }: { listing: typeof mockListing; host: typeof mockHost }) {
  return (
    <div className="group relative bg-gray-900/40 backdrop-blur-xl rounded-2xl p-4 flex flex-col h-full border border-white/10 hover:border-pink-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-pink-500/10">
      {/* Gradient border effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />

      {/* Header with glass effect */}
      <div className="flex items-center gap-3 mb-3 pb-3 border-b border-white/10 cursor-pointer group/header hover:bg-white/5 transition-all -mx-4 -mt-4 px-4 pt-4 rounded-t-2xl">
        <div className="relative">
          <img src={host.avatarUrl} className="w-10 h-10 rounded-full ring-2 ring-pink-500/30 group-hover/header:ring-pink-500/60 transition-all" alt="" />
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-white block truncate">{host.username}</span>
          <div className="flex items-center gap-1 text-xs text-pink-400">
            <span>★★★★★</span>
            <span className="text-gray-400">({host.reviewCount})</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-3 mb-4">
        <h3 className="text-lg font-bold text-white line-clamp-2 leading-tight group-hover:text-pink-100 transition-colors">
          {listing.eventName}
        </h3>

        <div className="flex flex-wrap gap-2">
          <span className="flex items-center gap-1.5 text-sm font-medium text-white/90 bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/10">
            <Armchair className="w-4 h-4 text-pink-400" />
            {listing.seatGrade}
          </span>
          <span className="flex items-center gap-1.5 text-sm text-white/70 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
            <Users className="w-4 h-4 text-purple-400" />
            二人票
          </span>
        </div>

        <div className="flex gap-2">
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20">
            ZAIKO
          </span>
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-600 to-green-500 text-white shadow-lg shadow-green-500/20">
            ✓ 可協助入場
          </span>
        </div>

        {/* Price with Aurora effect (from V3) */}
        <div className="relative rounded-xl overflow-hidden mt-1">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20" />
          <div className="relative grid grid-cols-2 divide-x divide-white/10 backdrop-blur-sm">
            <div className="p-3 text-center">
              <span className="text-xs text-emerald-300 block mb-1">希望分攤</span>
              <span className="text-2xl font-bold text-white">¥{listing.askingPriceJpy.toLocaleString()}</span>
            </div>
            <div className="p-3 text-center bg-black/20">
              <span className="text-xs text-white/50 block mb-1">定價</span>
              <span className="text-2xl font-medium text-white/70">¥{listing.originalPriceJpy.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="space-y-2 text-xs text-gray-400 mt-auto">
        <div className="flex items-center justify-between">
          <span className="bg-pink-500/20 px-2 py-1 rounded-lg text-pink-300 font-medium">🇹🇼 繁體中文</span>
          <div className="flex items-center gap-2 text-gray-400">
            <Calendar className="w-3.5 h-3.5" />
            <span>2026/01/17</span>
          </div>
        </div>
        <div className="flex gap-1 flex-wrap">
          {['繁體中文', '日本語', 'English'].map(lang => (
            <span key={lang} className="px-2 py-0.5 rounded-md text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/20">
              {lang}
            </span>
          ))}
        </div>
      </div>

      {/* Button */}
      <div className="mt-4 pt-3">
        <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl font-semibold transition-all text-sm shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-[1.02] active:scale-[0.98]">
          <Eye className="w-4 h-4" />
          查看詳細
        </button>
      </div>
    </div>
  );
}
