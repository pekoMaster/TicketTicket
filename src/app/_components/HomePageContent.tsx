'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useApp } from '@/contexts/AppContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdmin } from '@/contexts/AdminContext';
import { useTranslations } from 'next-intl';
import ListingCard from '@/components/features/ListingCard';
import RequestCard from '@/components/features/RequestCard';
import RequestListItem from '@/components/features/RequestListItem';
import MobileRequestItem from '@/components/features/MobileRequestItem';
import ListingListItem from '@/components/features/ListingListItem';
import MobileListingItem from '@/components/features/MobileListingItem';
import ListingCardSkeleton from '@/components/features/ListingCardSkeleton';
import { LoginPromptModal } from '@/components/onboarding/LoginPromptModal';
import { TutorialOverlay } from '@/components/onboarding';
import {
  Ticket,
  Search,
  SlidersHorizontal,
  Plus,
  ArrowRight,
  TrendingUp,
  X,
  UserCheck,
  Calendar,
  Wallet,
  Globe2,
  Users,
  AlertCircle,
  LayoutGrid,
  List,
  Loader2,
  HandHeart,
  SearchX,
  PartyPopper
} from 'lucide-react';
import Link from 'next/link';
import Select from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import AuroraBackground from '@/components/ui/AuroraBackground';
import {
  TicketType,
  TicketSource,
  TICKET_SOURCE_INFO,
  NATIONALITY_OPTIONS,
  LANGUAGE_OPTIONS,
  Listing,
  TicketRequest,
  CurrencyCode,
} from '@/types';
import { isListingExpired } from '@/lib/listing-utils';

export type SortOption = 'newest' | 'priceLowToHigh' | 'priceHighToLow' | 'eventDate';
export type DateFilter = 'all' | 'week' | 'month' | '3months';

interface HomePageProps {
  initialListings?: Listing[];
  initialRequests?: TicketRequest[];
  initialTotalPages?: number;
}

export default function HomePage({ initialListings = [], initialRequests = [], initialTotalPages = 1 }: HomePageProps) {
  const { data: session, status: sessionStatus } = useSession();
  const { 
    listings, 
    isLoadingListings, 
    hasMoreListings, 
    isFetchingNextPage, 
    loadMoreListings, 
    hasAgreedToDisclaimer, 
    setHasAgreedToDisclaimer, 
    requests, 
    isLoadingRequests,
    setInitialData // 需要在 AppContext 中新增這個方法
  } = useApp();

  // 將伺服器端注入的資料同步到 AppContext
  useEffect(() => {
    if (initialListings.length > 0 || initialRequests.length > 0) {
      setInitialData?.(initialListings, initialRequests, initialTotalPages);
    }
  }, [initialListings, initialRequests, initialTotalPages, setInitialData]);
  const { events } = useAdmin();

  // 取得活動的幣值
  const getEventCurrency = useCallback((eventName: string): CurrencyCode => {
    const event = events.find(e => e.name === eventName);
    return event?.currency || 'JPY';
  }, [events]);

  const t = useTranslations('home');
  const tFilter = useTranslations('filter');
  const tTicket = useTranslations('ticketType');
  const tCreate = useTranslations('create');
  const tPrivacy = useTranslations('privacy');
  const tTerms = useTranslations('terms');
  const tTokushoho = useTranslations('tokushoho');
  const tLegal = useTranslations('legal');
  const tOptions = useTranslations('Options');

  // 新手引導狀態
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  // 檢查是否需要顯示登入提示
  useEffect(() => {
    // 只在客戶端執行
    if (typeof window === 'undefined') return;

    // 等待 session 載入完成
    if (sessionStatus === 'loading') return;

    const hasSeenLoginPrompt = localStorage.getItem('hasSeenLoginPrompt');
    const hasSelectedLanguage = localStorage.getItem('hasSelectedLanguage');

    // 只有在：已選語言 + 沒看過提示 + 明確未登入（不是 loading）
    if (hasSelectedLanguage && !hasSeenLoginPrompt && sessionStatus === 'unauthenticated') {
      setShowLoginPrompt(true);
    }
  }, [sessionStatus]);

  // 檢查是否需要顯示教學（規約視窗關閉後）
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 等待 session 狀態確定
    if (sessionStatus === 'loading') return;

    const hasCompletedTutorial = localStorage.getItem('hasCompletedTutorial');
    const hasSeenLoginPrompt = localStorage.getItem('hasSeenLoginPrompt');

    // 載入中不顯示
    if (isLoadingListings) return;

    // 不要在登入提示顯示時同時顯示教學
    if (showLoginPrompt) return;

    // 必須先同意規約才顯示教學
    if (!hasAgreedToDisclaimer) return;

    // 條件：還沒完成教學 + (已登入 或 訪客已看過登入提示)
    const shouldShowTutorial = !hasCompletedTutorial && (
      sessionStatus === 'authenticated' ||
      (sessionStatus === 'unauthenticated' && hasSeenLoginPrompt)
    );

    if (shouldShowTutorial) {
      // 延遲一下讓頁面渲染完成
      const timer = setTimeout(() => {
        setShowTutorial(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [sessionStatus, isLoadingListings, showLoginPrompt, hasAgreedToDisclaimer]);

  // 搜尋和篩選狀態 — Tab 從 URL ?tab=requests 讀取
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'requests' ? 'requests' : 'listings';
  const [activeDisplayArea, setActiveDisplayArea] = useState<'listings' | 'requests'>(initialTab);

  const handleTabChange = useCallback((tab: 'listings' | 'requests') => {
    setActiveDisplayArea(tab);
    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'requests') {
      params.set('tab', 'requests');
    } else {
      params.delete('tab');
    }
    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }, [searchParams, router, pathname]);
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
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [minPriceFilter, setMinPriceFilter] = useState<string>('');
  const [maxPriceFilter, setMaxPriceFilter] = useState<string>('');

  // 無限滾動狀態
  const [displayCount, setDisplayCount] = useState(10);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const ITEMS_PER_PAGE = 10;

  // Tab 切換 - 動態滑動背景
  const tabListingsRef = useRef<HTMLButtonElement>(null);
  const tabRequestsRef = useRef<HTMLButtonElement>(null);
  const [tabIndicatorStyle, setTabIndicatorStyle] = useState<React.CSSProperties>({ left: 4, width: 0 });

  // 根據 active tab 動態測量按鈕大小並更新 indicator 位置
  useEffect(() => {
    const activeRef = activeDisplayArea === 'listings' ? tabListingsRef : tabRequestsRef;
    if (activeRef.current) {
      setTabIndicatorStyle({
        left: activeRef.current.offsetLeft,
        width: activeRef.current.offsetWidth,
      });
    }
  }, [activeDisplayArea]);

  // 成功同行統計
  const [successfulMeetups, setSuccessfulMeetups] = useState<number | null>(null);

  // 訂閱彈窗狀態
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // 獲取統計資料
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats');
        if (res.ok) {
          const data = await res.json();
          setSuccessfulMeetups(data.successfulMeetups);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };
    fetchStats();
  }, []);

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

    // 價格篩選
    if (minPriceFilter) {
      const minPrice = parseInt(minPriceFilter);
      if (!isNaN(minPrice)) {
        result = result.filter((l) => (l.askingPriceJpy || 0) >= minPrice);
      }
    }

    if (maxPriceFilter) {
      const maxPrice = parseInt(maxPriceFilter);
      if (!isNaN(maxPrice)) {
        result = result.filter((l) => (l.askingPriceJpy || 0) <= maxPrice);
      }
    }

    // 排序
    return result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'eventDate':
          return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
        case 'priceLowToHigh':
          return a.askingPriceJpy - b.askingPriceJpy;
        case 'priceHighToLow':
          return b.askingPriceJpy - a.askingPriceJpy;
        default:
          return 0;
      }
    });
  }, [listings, searchQuery, selectedEvent, dateFilter, selectedTicketType, selectedTicketSource, hostNameQuery, minRating, selectedNationality, selectedLanguages, willAssistEntry, minPriceFilter, maxPriceFilter, sortBy]);

  // 求票的篩選邏輯
  const filteredRequests = useMemo(() => {
    let result = requests.filter((r) => r.status === 'open');

    // 關鍵字搜尋
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.eventName.toLowerCase().includes(query) ||
          r.description?.toLowerCase().includes(query) ||
          r.user?.username.toLowerCase().includes(query)
      );
    }

    // 活動名稱篩選
    if (selectedEvent) {
      result = result.filter((r) => r.eventName === selectedEvent);
    }

    // 日期篩選
    const now = new Date();
    if (dateFilter !== 'all') {
      result = result.filter((r) => {
        const event = events.find(e => e.name === r.eventName);
        if (!event || !event.eventDate) return true; // 若無日期資訊則保留
        const eventDate = new Date(event.eventDate);
        
        if (dateFilter === 'week') {
          const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          return eventDate <= weekLater;
        } else if (dateFilter === 'month') {
          const monthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          return eventDate <= monthLater;
        } else if (dateFilter === '3months') {
          const threeMonthsLater = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
          return eventDate <= threeMonthsLater;
        }
        return true;
      });
    }

    // 票券類型(希望的類型)篩選
    if (selectedTicketType) {
      result = result.filter((r) => r.acceptedTypes.includes(selectedTicketType));
    }

    // 求票者名稱搜尋
    if (hostNameQuery) {
      const query = hostNameQuery.toLowerCase();
      result = result.filter((r) => r.user?.username.toLowerCase().includes(query));
    }

    // 票源篩選
    if (selectedTicketSource) {
      result = result.filter((r) => r.ticketSource === selectedTicketSource);
    }

    // 國籍篩選
    if (selectedNationality) {
      result = result.filter((r) => r.requesterNationality === selectedNationality);
    }

    // 語言篩選
    if (selectedLanguages.length > 0) {
      result = result.filter((r) =>
        r.requesterLanguages &&
        selectedLanguages.some((lang) => r.requesterLanguages?.includes(lang))
      );
    }

    // 評分篩選
    if (minRating) {
      const rating = parseInt(minRating);
      result = result.filter((r) => (r.user?.rating || 0) >= rating);
    }

    // 排序
    return result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'eventDate': {
          const eventA = events.find(e => e.name === a.eventName);
          const eventB = events.find(e => e.name === b.eventName);
          // 若無實體活動日期則排到後面
          const dateA = eventA?.eventDate ? new Date(eventA.eventDate).getTime() : Number.MAX_SAFE_INTEGER;
          const dateB = eventB?.eventDate ? new Date(eventB.eventDate).getTime() : Number.MAX_SAFE_INTEGER;
          return dateA - dateB;
        }
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [requests, events, searchQuery, selectedEvent, dateFilter, selectedTicketType, hostNameQuery, minRating, sortBy]);
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
    setSortBy('newest');
  };

  // 載入更多 (呼叫 AppContext 的 loadMoreListings)
  const loadMore = useCallback(() => {
    if (hasMoreListings && !isLoadingListings && !isFetchingNextPage) {
      loadMoreListings();
    }
  }, [hasMoreListings, isLoadingListings, isFetchingNextPage, loadMoreListings]);

  // IntersectionObserver 監聽底部元素
  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreListings && !isLoadingListings && !isFetchingNextPage) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMoreListings, loadMore, isLoadingListings, isFetchingNextPage]);

  // 當篩選條件改變時，重置顯示數量
  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE);
  }, [searchQuery, selectedEvent, dateFilter, selectedTicketType, willAssistEntry, hostNameQuery, minRating, selectedNationality, selectedLanguages, sortBy]);

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
    sortBy !== 'newest';

  // Count active filters for badge
  const activeFilterCount = [
    searchQuery !== '',
    selectedEvent !== '',
    dateFilter !== 'all',
    selectedTicketType !== '',
    selectedTicketSource !== '',
    willAssistEntry,
    hostNameQuery !== '',
    minRating !== '',
    selectedNationality !== '',
    selectedLanguages.length > 0,
  ].filter(Boolean).length;

  const ticketTypes: TicketType[] = ['find_companion', 'sub_ticket_transfer', 'ticket_exchange'];

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col relative overflow-x-hidden">
      {/* SEO H1 - 螢幕閱讀器專用 */}
      <h1 className="sr-only">TicketTicket - VTuber 演唱會票券同行配對平台</h1>

      {/* Aurora 背景效果 */}
      <AuroraBackground />

      {/* Header - mobile only - Glassmorphism Style */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/10 sticky top-0 z-30 lg:hidden">
        <div className="px-4 py-4">
          <div className="flex items-center gap-2">
            <Ticket className="w-7 h-7 text-pink-500" />
            <span className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">TicketTicket</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('subtitle')}</p>
            {successfulMeetups !== null && successfulMeetups > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full shadow-lg shadow-pink-500/30">
                <PartyPopper className="w-3.5 h-3.5 text-white" />
                <span className="text-xs font-bold text-white">{successfulMeetups}</span>
                <span className="text-xs text-white/80">{t('successfulMeetups', { defaultValue: '次成功同行' })}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Desktop Header - Glassmorphism Style */}
      <header className="hidden lg:block bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/10 px-6 py-6">
        <div className="flex items-center justify-between">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{t('subtitle')}</p>
          {successfulMeetups !== null && successfulMeetups > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 transition-shadow">
              <PartyPopper className="w-5 h-5 text-white" />
              <span className="text-lg font-bold text-white">{successfulMeetups.toLocaleString()}</span>
              <span className="text-sm text-white/90">{t('successfulMeetups', { defaultValue: '次成功同行' })}</span>
            </div>
          )}
        </div>
      </header>

      {/* 搜尋與篩選區 - Glassmorphism Style */}
      <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/10 px-4 lg:px-6 py-4">
        <div className="w-full">
          {/* 搜尋列 */}
          <div className="flex gap-3">
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
                px-4 py-2.5 rounded-xl border transition-all flex items-center gap-2 relative
                ${hasActiveFilters
                  ? 'bg-pink-500/10 dark:bg-pink-500/20 border-pink-300 dark:border-pink-500/30 text-pink-600 dark:text-pink-400'
                  : 'bg-white/80 dark:bg-white/10 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/20'}
              `}
            >
              <div className="relative">
                <SlidersHorizontal className="w-5 h-5" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold bg-pink-600 text-white rounded-full px-1">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline">
                {showFilters ? tFilter('hideFilters') : tFilter('showFilters')}
              </span>
            </button>

            {/* 訂閱按鈕 */}
            {session?.user && (
              <button
                onClick={() => setShowSubscriptionModal(true)}
                className="px-4 py-2.5 rounded-xl border transition-all flex items-center gap-2 bg-indigo-500/10 dark:bg-indigo-500/20 border-indigo-300 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20"
                title={t('subscribeToEvent', { defaultValue: '訂閱活動通知' })}
              >
                {/* Bell missing, removing icon or using another */}
                <span className="hidden sm:inline">
                  {t('subscribeToEvent', { defaultValue: '訂閱' })}
                </span>
              </button>
            )}
          </div>

          {/* 篩選面板 */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-white/10 space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* 活動篩選 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">{tFilter('event')}</label>
                  <Select
                    value={selectedEvent}
                    onChange={(value) => setSelectedEvent(value)}
                    options={[
                      { value: '', label: tFilter('allEvents') },
                      ...allEventNames.map(name => ({ value: name, label: name }))
                    ]}
                  />
                </div>

                {/* 日期範圍 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">{tFilter('dateRange')}</label>
                  <Select
                    value={dateFilter}
                    onChange={(value) => setDateFilter(value as DateFilter)}
                    options={[
                      { value: 'all', label: tFilter('all') },
                      { value: 'week', label: tFilter('thisWeek') },
                      { value: 'month', label: tFilter('thisMonth') },
                      { value: '3months', label: tFilter('next3Months') },
                    ]}
                  />
                </div>

                {/* 票券類型 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">{tFilter('ticketType')}</label>
                  <Select
                    value={selectedTicketType}
                    onChange={(value) => setSelectedTicketType(value as TicketType | '')}
                    options={[
                      { value: '', label: tFilter('allTypes') },
                      ...ticketTypes.map(type => ({ value: type, label: tCreate(`ticketTypes.${type}`) }))
                    ]}
                  />
                </div>

                {/* 票源 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">{tFilter('ticketSource', { defaultValue: '票源' })}</label>
                  <Select
                    value={selectedTicketSource}
                    onChange={(value) => setSelectedTicketSource(value as TicketSource | '')}
                    options={[
                      { value: '', label: tFilter('allSources', { defaultValue: '全部票源' }) },
                      { value: 'zaiko', label: TICKET_SOURCE_INFO.zaiko.label },
                      { value: 'lawson', label: TICKET_SOURCE_INFO.lawson.label },
                    ]}
                  />
                </div>

                {/* 價格範圍 - 僅限讓票區 */}
                {activeDisplayArea === 'listings' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">{tFilter('priceRange')}</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-xs">¥</span>
                        <input
                          type="number"
                          value={minPriceFilter}
                          onChange={(e) => setMinPriceFilter(e.target.value)}
                          placeholder={tFilter('minPrice')}
                          className="w-full pl-6 pr-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                        />
                      </div>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-xs">¥</span>
                        <input
                          type="number"
                          value={maxPriceFilter}
                          onChange={(e) => setMaxPriceFilter(e.target.value)}
                          placeholder={tFilter('maxPrice')}
                          className="w-full pl-6 pr-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">{tFilter('sortBy')}</label>
                  <Select
                    value={sortBy}
                    onChange={(value) => setSortBy(value as SortOption)}
                    options={[
                      { value: 'eventDate', label: tFilter('byDate') },
                      ...(activeDisplayArea === 'listings' ? [
                        { value: 'priceLowToHigh', label: tFilter('priceLowHigh') },
                        { value: 'priceHighToLow', label: tFilter('priceHighLow') },
                      ] : []),
                      { value: 'newest', label: tFilter('newest') },
                    ]}
                  />
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
                  <Select
                    value={minRating}
                    onChange={(value) => setMinRating(value)}
                    options={[
                      { value: '', label: tFilter('allRatings') },
                      { value: '4', label: tFilter('stars', { n: 4 }) },
                      { value: '3', label: tFilter('stars', { n: 3 }) },
                      { value: '2', label: tFilter('stars', { n: 2 }) },
                      { value: '1', label: tFilter('stars', { n: 1 }) },
                    ]}
                  />
                </div>

                {/* 國籍 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">{tFilter('nationality')}</label>
                  <Select
                    value={selectedNationality}
                    onChange={(value) => setSelectedNationality(value)}
                    options={[
                      { value: '', label: tFilter('allNationalities', { defaultValue: '不限國籍' }) },
                      ...NATIONALITY_OPTIONS.map(opt => ({ value: opt.value, label: tOptions(opt.label) }))
                    ]}
                  />
                </div>

                {/* 其他選項 (Checkboxes) */}
                {activeDisplayArea === 'listings' && (
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
                )}
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

          {/* 讓票 / 求票切換 (Segmented Control) */}
          <div className="mt-4 mb-2 flex justify-center lg:justify-start">
            <div className="relative flex items-center p-1 bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-md rounded-xl border border-gray-200/50 dark:border-white/10 shadow-inner">
              <button
                ref={tabListingsRef}
                onClick={() => handleTabChange('listings')}
                className={`relative z-10 flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 whitespace-nowrap ${activeDisplayArea === 'listings'
                  ? 'text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
              >
                <LayoutGrid className="w-4 h-4" />
                {t('viewListings', { defaultValue: '看讓票' })}
              </button>
              <button
                ref={tabRequestsRef}
                onClick={() => handleTabChange('requests')}
                className={`relative z-10 flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 whitespace-nowrap ${activeDisplayArea === 'requests'
                  ? 'text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
              >
                <HandHeart className="w-4 h-4" />
                {t('viewRequests', { defaultValue: '看求票' })}
              </button>

              {/* 滑動背景 - 動態寬度 */}
              <div
                className="absolute top-1 bottom-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg shadow-md transition-all duration-300 ease-in-out"
                style={tabIndicatorStyle}
              />
            </div>
          </div>

          {/* 結果數量 + 切換按鈕 */}
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {tFilter('foundResults', { count: activeDisplayArea === 'listings' ? filteredListings.length : filteredRequests.length })}
            </p>
            {/* PC限定切換按鈕 (列表/卡片) */}
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
        <div className="w-full">
          {/* ======================= 讓票 (Listings) ======================= */}
          {activeDisplayArea === 'listings' && (
            <>
              {/* 手機版：緊湊列表視圖 */}
              <div className="lg:hidden space-y-2">
                {filteredListings.map((listing, index) => (
                  <MobileListingItem
                    key={listing.id}
                    listing={listing}
                    host={listing.host}
                    isFirstItem={index === 0}
                    currency={getEventCurrency(listing.eventName)}
                  />
                ))}
              </div>

              {/* PC版：卡片網格視圖 */}
              <div
                className={`hidden lg:grid lg:gap-4 lg:[grid-template-columns:repeat(auto-fill,minmax(280px,1fr))] ${viewMode === 'list' ? 'lg:hidden' : ''}`}
              >
                {filteredListings.map((listing, index) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    host={listing.host}
                    isFirstCard={index === 0}
                    currency={getEventCurrency(listing.eventName)}
                  />
                ))}
              </div>

              {/* PC版：列表視圖 */}
              <div className={`hidden ${viewMode === 'list' ? 'lg:flex lg:flex-col lg:gap-3' : 'hidden'}`}>
                {filteredListings.map((listing) => (
                  <ListingListItem
                    key={listing.id}
                    listing={listing}
                    host={listing.host}
                    currency={getEventCurrency(listing.eventName)}
                  />
                ))}
              </div>
            </>
          )}

          {/* ======================= 求票 (Requests) ======================= */}
          {activeDisplayArea === 'requests' && (
            <>
              {isLoadingRequests ? (
                <div className={`space-y-4 ${viewMode === 'list' ? '' : 'lg:grid lg:gap-4 lg:space-y-0 lg:[grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]'}`}>
                  {[...Array(6)].map((_, i) => (
                    viewMode === 'list' ? (
                      <div key={i} className="animate-pulse bg-gray-100 dark:bg-gray-800 h-20 rounded-xl mb-3"></div>
                    ) : (
                      <div key={i} className="animate-pulse bg-gray-100 dark:bg-gray-800 h-48 rounded-2xl"></div>
                    )
                  ))}
                </div>
              ) : filteredRequests.length > 0 ? (
                <>
                  {/* 手機版列表 (隱藏於 LG+ 且 viewMode 為 card 時) */}
                  <div className={`flex flex-col gap-3 lg:hidden ${viewMode === 'card' ? 'hidden' : ''}`}>
                    {filteredRequests.map((request, index) => (
                      <MobileRequestItem
                        key={request.id}
                        request={request}
                        user={request.user}
                        isFirstItem={index === 0}
                      />
                    ))}
                  </div>

                  {/* PC版/手機版：卡片網格視圖 */}
                  <div
                    className={`grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))] ${viewMode === 'list' ? 'hidden' : ''}`}
                  >
                    {filteredRequests.map((request, index) => (
                      <RequestCard
                        key={request.id}
                        request={request}
                        isFirstCard={index === 0}
                      />
                    ))}
                  </div>

                  {/* PC版：列表視圖 */}
                  <div className={`hidden ${viewMode === 'list' ? 'lg:flex lg:flex-col lg:gap-3' : 'hidden'}`}>
                    {filteredRequests.map((request) => (
                      <RequestListItem
                        key={request.id}
                        request={request}
                        user={request.user}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-20 bg-white/50 dark:bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-pink-50 dark:bg-pink-900/20 text-pink-500 dark:text-pink-400 mb-4 ring-8 ring-pink-50/50 dark:ring-pink-900/10">
                    <SearchX className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('noRequests', { defaultValue: '目前沒有求票' })}</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-[280px] mx-auto leading-relaxed">{t('tryAdjustingFilters')}</p>
                </div>
              )}
            </>
          )}
          {/* 載入更多觸發點 (僅讓票模式有效) */}
          {activeDisplayArea === 'listings' && (
            <div ref={loadMoreRef} className="py-4">
              {isFetchingNextPage ? (
                <div className="flex justify-center items-center gap-2 text-gray-400 dark:text-gray-500">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">{t('loadingMore', { defaultValue: '載入更多...' })}</span>
                </div>
              ) : !hasMoreListings && filteredListings.length > ITEMS_PER_PAGE ? (
                <p className="text-center text-sm text-gray-400 dark:text-gray-500">
                  {t('noMoreListings', { defaultValue: '已顯示全部刊登' })}
                </p>
              ) : null}
            </div>
          )}
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
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <Link href="/legal/ticket-regulations" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  {tLegal('ticketRegulations')}
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

        {/* 登入提示彈窗 */}
        {showLoginPrompt && (
          <LoginPromptModal
            onClose={() => {
              setShowLoginPrompt(false);
              localStorage.setItem('hasSeenLoginPrompt', 'true');
            }}
          />
        )}

        {/* 新手教學覆蓋層 */}
        {showTutorial && (
          <TutorialOverlay
            hasListings={filteredListings.length > 0}
            onComplete={() => setShowTutorial(false)}
          />
        )}

      </div>
    </main>
  );
}
