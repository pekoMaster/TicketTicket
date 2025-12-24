'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useAdmin } from '@/contexts/AdminContext';
import { useTranslations } from 'next-intl';
import ListingCard from '@/components/features/ListingCard';
import ListingListItem from '@/components/features/ListingListItem';

import { Input } from '@/components/ui/Input';
import {
  Ticket,
  Search,
  Filter,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List,
} from 'lucide-react';
import Link from 'next/link';
import {
  TicketType,
  TicketSource,
  TICKET_TYPE_INFO,
  TICKET_SOURCE_INFO,
  NATIONALITY_OPTIONS,
  LANGUAGE_OPTIONS,
} from '@/types';
import { isListingExpired } from '@/lib/listing-utils';

type SortOption = 'date' | 'newest' | 'price_asc' | 'price_desc';
type DateFilter = 'all' | 'week' | 'month' | '3months';

export default function HomePage() {
  const { listings, isLoadingListings } = useApp();
  const { events } = useAdmin();
  const t = useTranslations('home');
  const tFilter = useTranslations('filter');
  const tTicket = useTranslations('ticketType');
  const tCreate = useTranslations('create');
  const tPrivacy = useTranslations('privacy');
  const tTerms = useTranslations('terms');
  const tTokushoho = useTranslations('tokushoho');

  // 搜尋和篩選狀態
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [selectedTicketType, setSelectedTicketType] = useState<TicketType | ''>('');
  const [selectedTicketSource, setSelectedTicketSource] = useState<TicketSource | ''>('');
  const [hostNameQuery, setHostNameQuery] = useState('');
  const [minRating, setMinRating] = useState('');
  const [selectedNationality, setSelectedNationality] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [willAssistEntry, setWillAssistEntry] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  // 取得所有唯一的活動名稱
  const allEventNames = useMemo(() => {
    const namesSet = new Set<string>();
    listings.forEach((listing) => {
      if (listing.eventName) {
        namesSet.add(listing.eventName);
      }
    });
    // 也加入管理員活動
    events.filter(e => e.isActive).forEach((event) => {
      namesSet.add(event.name);
    });
    return Array.from(namesSet).sort();
  }, [listings, events]);

  // 篩選邏輯
  const filteredListings = useMemo(() => {
    // 首先過濾掉非 open 狀態和已過期的刊登
    let result = listings.filter((l) => l.status === 'open' && !isListingExpired(l));

    // 關鍵字搜尋
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.eventName.toLowerCase().includes(query) ||
          l.venue.toLowerCase().includes(query) ||
          l.description?.toLowerCase().includes(query) ||
          l.host?.username.toLowerCase().includes(query)
      );
    }

    // 活動名稱篩選
    if (selectedEvent) {
      result = result.filter((l) => l.eventName === selectedEvent);
    }

    // 日期篩選
    const now = new Date();
    if (dateFilter === 'week') {
      const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      result = result.filter((l) => new Date(l.eventDate) <= weekLater);
    } else if (dateFilter === 'month') {
      const monthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      result = result.filter((l) => new Date(l.eventDate) <= monthLater);
    } else if (dateFilter === '3months') {
      const threeMonthsLater = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
      result = result.filter((l) => new Date(l.eventDate) <= threeMonthsLater);
    }

    // 票券類型篩選
    if (selectedTicketType) {
      result = result.filter((l) => l.ticketType === selectedTicketType);
    }

    // 票源篩選
    if (selectedTicketSource) {
      result = result.filter((l) => l.ticketSource === selectedTicketSource);
    }

    // 母票協助入場篩選
    if (willAssistEntry) {
      result = result.filter((l) => l.willAssistEntry);
    }

    // 主辦人名稱搜尋
    if (hostNameQuery) {
      const query = hostNameQuery.toLowerCase();
      result = result.filter((l) => l.host?.username.toLowerCase().includes(query));
    }

    // 評分篩選
    if (minRating) {
      const rating = parseInt(minRating);
      result = result.filter((l) => (l.host?.rating || 0) >= rating);
    }

    // 國籍篩選
    if (selectedNationality) {
      result = result.filter((l) => l.hostNationality === selectedNationality);
    }

    // 語言篩選
    if (selectedLanguages.length > 0) {
      result = result.filter((l) =>
        l.hostLanguages && selectedLanguages.some((lang) => l.hostLanguages.includes(lang))
      );
    }

    // 排序
    switch (sortBy) {
      case 'date':
        result.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      /*
      case 'price_asc':
        // Price sorting temporarily disabled or needs correct field
        // result.sort((a, b) => (a.askingPriceTwd || 0) - (b.askingPriceTwd || 0));
        break;
      case 'price_desc':
        // result.sort((a, b) => (b.askingPriceTwd || 0) - (a.askingPriceTwd || 0));
        break;
      */
    }

    return result;
  }, [listings, searchQuery, selectedEvent, dateFilter, selectedTicketType, willAssistEntry, hostNameQuery, minRating, selectedNationality, selectedLanguages, sortBy]);

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedEvent('');
    setDateFilter('all');
    setSelectedTicketType('');
    setHostNameQuery('');
    setMinRating('');
    setSelectedNationality('');
    setSelectedLanguages([]);
    setWillAssistEntry(false);
    setSortBy('date');
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedEvent !== '' ||
    dateFilter !== 'all' ||
    selectedTicketType !== '' ||
    willAssistEntry ||
    hostNameQuery !== '' ||
    minRating !== '' ||
    selectedNationality !== '' ||
    selectedLanguages.length > 0 ||
    sortBy !== 'date';

  const ticketTypes: TicketType[] = ['find_companion', 'sub_ticket_transfer', 'ticket_exchange'];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header - mobile only */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-30 lg:hidden">
        <div className="px-4 py-4">
          <div className="flex items-center gap-2">
            <Ticket className="w-7 h-7 text-indigo-500" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">TicketTicket</h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('subtitle')}</p>
        </div>
      </header>

      {/* Desktop Header */}
      <header className="hidden lg:block bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-6 py-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('subtitle')}</h1>
      </header>

      {/* 搜尋與篩選區 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 lg:px-6 py-4">
        <div className="max-w-7xl mx-auto">
          {/* 搜尋列 */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder={tFilter('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-5 h-5" />}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`
                px-4 py-2.5 rounded-lg border transition-colors flex items-center gap-2
                ${hasActiveFilters ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}
              `}
            >
              <Filter className="w-5 h-5" />
              <span className="hidden sm:inline">
                {showFilters ? tFilter('hideFilters') : tFilter('showFilters')}
              </span>
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {/* 篩選面板 */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* 活動篩選 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">{tFilter('event')}</label>
                  <select
                    value={selectedEvent}
                    onChange={(e) => setSelectedEvent(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                  >
                    <option value="">{tFilter('allEvents')}</option>
                    {allEventNames.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>

                {/* 日期範圍 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">{tFilter('dateRange')}</label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                  >
                    <option value="all">{tFilter('all')}</option>
                    <option value="week">{tFilter('thisWeek')}</option>
                    <option value="month">{tFilter('thisMonth')}</option>
                    <option value="3months">{tFilter('next3Months')}</option>
                  </select>
                </div>

                {/* 票券類型 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">{tFilter('ticketType')}</label>
                  <select
                    value={selectedTicketType}
                    onChange={(e) => setSelectedTicketType(e.target.value as TicketType | '')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                  >
                    <option value="">{tFilter('allTypes')}</option>
                    {ticketTypes.map((type) => (
                      <option key={type} value={type}>{tCreate(`ticketTypes.${type}`)}</option>
                    ))}
                  </select>
                </div>

                {/* 票源 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">{tFilter('ticketSource', { defaultValue: '票源' })}</label>
                  <select
                    value={selectedTicketSource}
                    onChange={(e) => setSelectedTicketSource(e.target.value as TicketSource | '')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                  >
                    <option value="">{tFilter('allSources', { defaultValue: '全部票源' })}</option>
                    <option value="zaiko">{TICKET_SOURCE_INFO.zaiko.label}</option>
                    <option value="lawson">{TICKET_SOURCE_INFO.lawson.label}</option>
                  </select>
                </div>

                {/* 排序 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">{tFilter('sortBy')}</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                  >
                    <option value="date">{tFilter('byDate')}</option>
                    <option value="price_asc">{tFilter('priceLowHigh')}</option>
                    <option value="price_desc">{tFilter('priceHighLow')}</option>
                    <option value="newest">{tFilter('newest')}</option>
                  </select>
                </div>

                {/* 主辦人名稱 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">{tFilter('hostName')}</label>
                  <input
                    type="text"
                    placeholder={tFilter('hostNamePlaceholder')}
                    value={hostNameQuery}
                    onChange={(e) => setHostNameQuery(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                  />
                </div>

                {/* 最低評分 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">{tFilter('minRating')}</label>
                  <select
                    value={minRating}
                    onChange={(e) => setMinRating(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                  >
                    <option value="">{tFilter('allRatings')}</option>
                    <option value="4">{tFilter('stars', { n: 4 })}</option>
                    <option value="3">{tFilter('stars', { n: 3 })}</option>
                    <option value="2">{tFilter('stars', { n: 2 })}</option>
                    <option value="1">{tFilter('stars', { n: 1 })}</option>
                  </select>
                </div>

                {/* 國籍 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">{tFilter('nationality')}</label>
                  <select
                    value={selectedNationality}
                    onChange={(e) => setSelectedNationality(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                  >
                    <option value="">{tFilter('allNationalities')}</option>
                    {NATIONALITY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* 其他選項 (Checkboxes) */}
                <div className="flex items-end">
                  <div className="h-10 flex items-center">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={willAssistEntry}
                        onChange={(e) => setWillAssistEntry(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        {tFilter('willAssistEntry')}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 語言篩選（多選） */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{tFilter('languages')}</label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <button
                      key={lang.value}
                      type="button"
                      onClick={() => toggleLanguage(lang.value)}
                      className={`
                        px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                        ${selectedLanguages.includes(lang.value)
                          ? 'bg-indigo-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}
                      `}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 清除篩選 */}
              {hasActiveFilters && (
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                    {tFilter('activeFilters')}
                  </span>
                  <button
                    onClick={clearFilters}
                    className="text-sm text-red-500 font-medium flex items-center gap-1 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                    {tFilter('clearFilters')}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 結果數量 + 切換按鈕 */}
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {tFilter('foundResults', { count: filteredListings.length })}
            </p>
            {/* PC限定切換按鈕 */}
            <div className="hidden lg:flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('card')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'card' ? 'bg-white dark:bg-gray-600 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                title={t('cardView')}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                title={t('listView')}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 lg:px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {isLoadingListings ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : filteredListings.length > 0 ? (
            <>
              {/* Card View - 手機永遠用卡片，PC根據切換 */}
              <div className={`space-y-4 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-4 lg:space-y-0 ${viewMode === 'list' ? 'lg:hidden' : ''}`}>
                {filteredListings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    host={listing.host}
                  />
                ))}
              </div>
              {/* List View - PC限定 */}
              {viewMode === 'list' && (
                <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="flex flex-col">
                    {filteredListings.map((listing) => (
                      <ListingListItem
                        key={listing.id}
                        listing={listing}
                        host={listing.host}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">{hasActiveFilters ? tFilter('noResults') : t('noListings')}</p>
              {hasActiveFilters ? (
                <button
                  onClick={clearFilters}
                  className="text-indigo-500 dark:text-indigo-400 font-medium mt-2"
                >
                  {tFilter('clearFilters')}
                </button>
              ) : (
                <Link
                  href="/create"
                  className="text-indigo-500 dark:text-indigo-400 font-medium hover:text-indigo-600 dark:hover:text-indigo-300 mt-2 inline-block"
                >
                  {t('createFirst')}
                </Link>
              )}
            </div>
          )}

          {/* 平台說明 */}
          {!hasActiveFilters && filteredListings.length > 0 && (
            <section className="bg-indigo-50 dark:bg-indigo-900/30 rounded-xl p-4 lg:p-6 mt-8">
              <h3 className="font-semibold text-indigo-900 dark:text-indigo-200 mb-2">{t('whatIs')}</h3>
              <ul className="text-sm text-indigo-700 dark:text-indigo-300 space-y-2 lg:flex lg:gap-8 lg:space-y-0">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400">•</span>
                  <span>{t('feature1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400">•</span>
                  <span>{t('feature2')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400">•</span>
                  <span>{t('feature3')}</span>
                </li>
              </ul>
            </section>
          )}
        </div>
      </div>

      {/* Footer with Privacy Policy */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 px-4 py-6 mt-auto">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-indigo-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">TicketTicket</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Link href="/legal/terms" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                {tTerms('title')}
              </Link>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <Link href="/legal/privacy" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                {tPrivacy('title')}
              </Link>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <Link href="/legal/tokushoho" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                {tTokushoho('title')}
              </Link>
            </div>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {tTokushoho('subtitle')}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            © 2025 TicketTicket. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
