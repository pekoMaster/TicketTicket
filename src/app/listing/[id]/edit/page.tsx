'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useApp } from '@/contexts/AppContext';
import { useAdmin } from '@/contexts/AdminContext';
import { useTranslations } from 'next-intl';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/Card';
import AuroraBackground from '@/components/ui/AuroraBackground';
import Button from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import {
  TicketType,
  TicketSource,
  SeatGrade,
  SEAT_GRADE_INFO,
  TICKET_SOURCE_INFO,
  NATIONALITY_OPTIONS,
  LANGUAGE_OPTIONS,
} from '@/types';
import CurrencyBadge from '@/components/ui/CurrencyBadge';
import { getCurrencySymbol } from '@/lib/currency';
import {
  Calendar,
  MapPin,
  Clock,
  Check,
  AlertTriangle,
  Globe,
  Languages,
  Shirt,
  User,
  Ticket,
  Loader2,
} from 'lucide-react';

// 穿著快速標籤 keys
const CLOTHING_TAG_KEYS = [
  'tshirt', 'shirt', 'jacket', 'hoodie', 'hoodedJacket', 'suit', 'dress',
  'jeans', 'shorts', 'skirt', 'hat', 'mask', 'glasses', 'backpack',
  'crossbodyBag', 'handbag', 'itaBag', 'merchandise', 'penlight',
];

// 可選的票券類型 - 加入 ticket_exchange
const TICKET_TYPES: TicketType[] = ['find_companion', 'sub_ticket_transfer', 'ticket_exchange'];

export default function EditListingPage() {
  // === Hooks ===
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { listings, fetchListings } = useApp();
  const { events } = useAdmin();
  const t = useTranslations('create');
  const tEdit = useTranslations('edit');
  const tCommon = useTranslations('common');

  // === 頁面狀態 ===
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<'Forbidden' | 'Matched' | 'NotFound' | null>(null);
  const [applicantCount, setApplicantCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // === 表單狀態 ===
  const [eventName, setEventName] = useState('');
  const [artistTags, setArtistTags] = useState<string[]>([]);
  const [eventDate, setEventDate] = useState('');
  const [venue, setVenue] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [meetingLocation, setMeetingLocation] = useState('');
  const [seatGrade, setSeatGrade] = useState<SeatGrade | ''>('');
  const [ticketPeopleCount, setTicketPeopleCount] = useState<number>(0);
  const [ticketSource, setTicketSource] = useState<TicketSource>('zaiko');
  const [ticketType, setTicketType] = useState<TicketType | ''>('');
  const [willAssistEntry, setWillAssistEntry] = useState(false);
  const [hostNationality, setHostNationality] = useState('');
  const [hostLanguages, setHostLanguages] = useState<string[]>([]);
  const [identificationFeatures, setIdentificationFeatures] = useState('');
  const [description, setDescription] = useState('');
  const [askingPriceJpy, setAskingPriceJpy] = useState<number>(0);

  // 換票專用欄位
  const [exchangeEventName, setExchangeEventName] = useState('');
  const [exchangeSeatGrades, setExchangeSeatGrades] = useState<string[]>([]);

  // === 取得現有刊登 ===
  const listing = useMemo(() => {
    return listings.find((l) => l.id === params.id);
  }, [listings, params.id]);

  // === 載入刊登資料 ===
  const loadListing = useCallback(async () => {
    // 等待 listings 載入
    if (!listing) {
      await fetchListings();
      return;
    }

    // 檢查擁有者權限
    if (listing.hostId !== session?.user?.dbId) {
      setLoadError('Forbidden');
      setIsLoading(false);
      return;
    }

    // 檢查配對狀態
    if (listing.status === 'matched') {
      setLoadError('Matched');
      setIsLoading(false);
      return;
    }

    // 取得申請人數量
    try {
      const res = await fetch(`/api/listings/${listing.id}/applications`);
      if (res.ok) {
        const data = await res.json();
        setApplicantCount(Array.isArray(data) ? data.length : 0);
      }
    } catch (error) {
      console.error('Error fetching applicants:', error);
    }

    // 填入表單資料
    setEventName(listing.eventName || '');
    setArtistTags(listing.artistTags || []);

    // 處理日期
    if (listing.eventDate) {
      const dateObj = new Date(listing.eventDate);
      setEventDate(dateObj.toISOString().split('T')[0]);
    }

    setVenue(listing.venue || '');

    // 處理集合時間 - 使用 JST 時區避免時差問題
    if (listing.meetingTime) {
      const timeObj = new Date(listing.meetingTime);
      // 轉換為 JST (UTC+9) 時間字串
      const jstTime = timeObj.toLocaleTimeString('ja-JP', {
        timeZone: 'Asia/Tokyo',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      setMeetingTime(jstTime);
    }

    setMeetingLocation(listing.meetingLocation || '');
    setSeatGrade(listing.seatGrade || '');
    setTicketPeopleCount(listing.ticketPeopleCount || 1);
    setTicketSource(listing.ticketSource || 'zaiko');
    setTicketType(listing.ticketType || '');
    setWillAssistEntry(listing.willAssistEntry || false);
    setHostNationality(listing.hostNationality || '');
    setHostLanguages(listing.hostLanguages || []);
    setIdentificationFeatures(listing.identificationFeatures || '');
    setDescription(listing.description || '');
    setAskingPriceJpy(listing.askingPriceJpy || 0);

    // 載入換票資料
    setExchangeEventName(listing.exchangeEventName || '');
    setExchangeSeatGrades(listing.exchangeSeatGrades || []);

    // 嘗試從事件取得 venueAddress
    const matchedEvent = events.find((e) => e.name === listing.eventName);
    if (matchedEvent?.venueAddress) {
      setVenueAddress(matchedEvent.venueAddress);
    }

    setIsLoading(false);
  }, [listing, session?.user?.dbId, fetchListings, events]);

  // 初始化載入
  useEffect(() => {
    if (session?.user?.dbId) {
      loadListing();
    }
  }, [session?.user?.dbId, loadListing]);

  // === 活動選項 ===
  const eventOptions = useMemo(() => {
    const now = new Date();
    return events
      .filter((e) => {
        if (!e.isActive) return false;
        // 使用 eventEndDate（多日活動）或 eventDate（單日活動）判斷過期
        const expirationDate = e.eventEndDate || e.eventDate;
        return expirationDate > now;
      })
      .map((event) => ({
        value: event.name,
        label: event.name,
      }));
  }, [events]);

  // === 選中的活動 ===
  const selectedEvent = useMemo(() => {
    return events.find((e) => e.name === eventName);
  }, [events, eventName]);

  // === 可用座位等級 ===
  const availableSeatGrades = useMemo(() => {
    if (!selectedEvent?.ticketPriceTiers) return [];
    const grades = new Set(selectedEvent.ticketPriceTiers.map((tier) => tier.seatGrade));
    return Array.from(grades) as SeatGrade[];
  }, [selectedEvent]);

  // === 換票用：根據選擇的「想換的活動」獲取該活動的可用座位等級 ===
  const exchangeEventSeatGrades = useMemo(() => {
    if (!exchangeEventName) return [];
    const targetEvent = events.find(e => e.name === exchangeEventName);
    if (!targetEvent?.ticketPriceTiers) return [];
    const grades = new Set(targetEvent.ticketPriceTiers.map(t => t.seatGrade));
    return Array.from(grades);
  }, [events, exchangeEventName]);

  // === 最大購票人數 ===
  const maxPeopleForEvent = useMemo(() => {
    if (!selectedEvent?.maxTicketsPerPerson) return 4; // 無活動資料時預設4人
    if (seatGrade && selectedEvent.ticketPriceTiers) {
      const hasTier = selectedEvent.ticketPriceTiers.some(t => t.seatGrade === seatGrade);
      if (!hasTier) return 0;
    }
    return selectedEvent.maxTicketsPerPerson;
  }, [selectedEvent, seatGrade]);

  // === 已選擇的價格等級 ===
  const selectedPriceTier = useMemo(() => {
    if (!selectedEvent?.ticketPriceTiers || !seatGrade) return null;
    return selectedEvent.ticketPriceTiers.find(tier => tier.seatGrade === seatGrade) || null;
  }, [selectedEvent, seatGrade]);

  // 是否為換票模式
  const isExchangeMode = ticketType === 'ticket_exchange';

  // 目前幣值
  const currency = selectedEvent?.currency || 'JPY';

  // === 表單驗證 ===
  const isFormValid = useMemo(() => {
    const baseValid = (
      eventName.trim() !== '' &&
      eventDate !== '' &&
      venue.trim() !== '' &&
      meetingTime !== '' &&
      seatGrade !== '' &&
      ticketPeopleCount > 0 &&
      ticketType !== '' &&
      hostNationality !== '' &&
      hostLanguages.length > 0 &&
      (ticketType === 'ticket_exchange' ? askingPriceJpy >= 0 : askingPriceJpy > 0)
    );

    if (isExchangeMode) {
      // 換票模式驗證 - 確保選擇的活動和座位等級有效
      const targetEvent = events.find(e => e.name === exchangeEventName);
      const hasValidGrades = exchangeSeatGrades.length > 0 && (
        exchangeSeatGrades.includes('any') ||
        exchangeSeatGrades.every(grade =>
          targetEvent?.ticketPriceTiers?.some(tier => tier.seatGrade === grade)
        )
      );
      return baseValid &&
        exchangeEventName.trim() !== '' &&
        targetEvent !== undefined &&
        hasValidGrades;
    } else {
      return baseValid;
    }
  }, [
    eventName,
    eventDate,
    venue,
    meetingTime,
    seatGrade,
    ticketPeopleCount,
    ticketType,
    hostNationality,
    hostLanguages,
    askingPriceJpy,
    isExchangeMode,
    exchangeEventName,
    exchangeSeatGrades,
    events
  ]);

  // === 事件處理 ===

  // 處理活動選擇
  const handleEventSelect = (name: string) => {
    setEventName(name);
    // 清除依賴欄位
    setSeatGrade('');
    setTicketPeopleCount(0);
    setTicketType('');

    const event = events.find((e) => e.name === name);
    if (event) {
      // 設定藝人標籤
      if (event.artist) {
        const tags = event.artist.split(',').map((tag) => tag.trim()).filter(Boolean);
        setArtistTags(tags);
      } else {
        setArtistTags([]);
      }
      // 設定場地資訊
      setVenue(event.venue || '');
      setVenueAddress(event.venueAddress || '');
    } else {
      setArtistTags([]);
      setVenue('');
      setVenueAddress('');
    }
  };

  // 處理語言切換
  const handleLanguageToggle = (lang: string) => {
    setHostLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  // 添加穿著快速標籤
  const handleAddClothingTag = (tag: string) => {
    if (!identificationFeatures.includes(tag)) {
      setIdentificationFeatures((prev) => (prev ? `${prev}、${tag}` : tag));
    }
  };

  // 處理編輯按鈕點擊
  const handleEditClick = () => {
    if (applicantCount > 0) {
      setShowWarningModal(true);
    } else {
      handleSubmit();
    }
  };

  // 處理提交
  const handleSubmit = async () => {
    setShowWarningModal(false);

    if (!session?.user?.dbId || !isFormValid || !listing) return;

    setIsSubmitting(true);

    try {
      // 準備更新資料 (snake_case for API)
      const updates = {
        event_name: eventName,
        artist_tags: artistTags,
        event_date: eventDate,
        venue,
        meeting_time: `${eventDate}T${meetingTime}:00+09:00`,
        meeting_location: '', // 欄位已移除，固定為空白
        total_slots: ticketPeopleCount || 1,
        ticket_type: ticketType as TicketType,
        seat_grade: seatGrade as SeatGrade,
        ticket_people_count: ticketPeopleCount || 1,
        host_nationality: hostNationality,
        host_languages: hostLanguages,
        identification_features: '', // 欄位已移除，固定為空白
        description: description || null,
        will_assist_entry: ticketType === 'find_companion' ? willAssistEntry : undefined,
        original_price_jpy: selectedPriceTier?.priceJpy || 0,
        asking_price_jpy: askingPriceJpy,
        // 換票欄位
        exchange_event_name: isExchangeMode ? exchangeEventName : null,
        exchange_seat_grades: isExchangeMode ? exchangeSeatGrades : null,
      };

      const response = await fetch(`/api/listings/${listing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updates,
          removeApplicants: applicantCount > 0,
        }),
      });

      if (response.ok) {
        await fetchListings();
        setShowSuccess(true);
        setTimeout(() => {
          router.push(`/listing/${listing.id}`);
        }, 2000);
      } else {
        const errorData = await response.json();
        alert(errorData.error || tCommon('updateFailed'));
      }
    } catch (error) {
      console.error('Error updating listing:', error);
      alert(tCommon('updateFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // === 渲染 ===

  // 載入中畫面
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  // 錯誤畫面
  if (loadError || !listing) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card variant="glass" className="text-center max-w-sm w-full">
          <p className="text-gray-500 dark:text-gray-400">
            {loadError === 'Matched' && tEdit('cannotEditMatched')}
            {loadError === 'Forbidden' && tEdit('forbidden', { defaultValue: '您沒有權限編輯此刊登' })}
            {loadError === 'NotFound' && tEdit('notFound')}
            {!loadError && tEdit('notFound')}
          </p>
          <Button className="mt-4" onClick={() => router.push('/profile')}>
            {tCommon('back')}
          </Button>
        </Card>
      </div>
    );
  }

  // 成功畫面
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card variant="glass" className="text-center max-w-sm w-full">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {tEdit('updateSuccess')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            {tEdit('updateRedirecting')}
          </p>
        </Card>
      </div>
    );
  }

  // 主頁面
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative">
      {/* Aurora 背景效果 */}
      <AuroraBackground />

      <Header title={tEdit('title')} showBack />

      <div className="relative z-10 pt-20 pb-24 px-4">
        <div className="space-y-6 max-w-2xl mx-auto">

          {/* 重要提醒 - Glassmorphism Style */}
          <div className="bg-amber-50/80 dark:bg-amber-500/10 backdrop-blur-xl border border-amber-200/50 dark:border-amber-500/30 rounded-2xl p-5 shadow-lg">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <p className="font-semibold mb-1">{t('importantReminder')}</p>
                <p className="text-amber-700 dark:text-amber-300">{t('platformNotice')}</p>
              </div>
            </div>
          </div>

          {/* 活動資訊 */}
          <Card variant="glass">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {t('eventInfo')}
            </h3>

            <div className="space-y-4">
              {/* 活動名稱 */}
              <Select
                label={t('eventName')}
                placeholder={t('pleaseSelectEvent')}
                options={eventOptions}
                value={eventName}
                onChange={handleEventSelect}
                searchable
                required
              />

              {/* 藝人標籤 */}
              {artistTags.length > 0 && (
                <div className="mt-2">
                  <label className="text-sm text-gray-500 dark:text-gray-400 mb-1 block">
                    {t('artistGroup')}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {artistTags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 協調提示 */}
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4 flex gap-3">
                <Calendar className="w-5 h-5 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700 dark:text-blue-200">
                  <p className="font-medium">{t('coordinationTitle', { defaultValue: '關於集合時間與地點' })}</p>
                  <p className="text-blue-600 dark:text-blue-300 mt-1">
                    {t('coordinationNote', { defaultValue: '活動日期、集合時間與地點由雙方在配對成功後自行協調。' })}
                  </p>
                </div>
              </div>

              {/* 場館名稱（唯讀） */}
              {venue && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{venue}</span>
                </div>
              )}
            </div>
          </Card>

          {/* 票券資訊 */}
          <Card variant="glass">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-indigo-500" />
              {t('ticketInfo')}
            </h3>

            <div className="space-y-4">
              {/* 票源選擇 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('ticketSource', { defaultValue: '票源' })} <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['zaiko', 'lawson'] as const).map((source) => (
                    <button
                      key={source}
                      type="button"
                      onClick={() => {
                        setTicketSource(source);
                      }}
                      className={`
                        py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300
                        ${ticketSource === source
                          ? source === 'zaiko'
                            ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30 scale-105'
                            : 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg shadow-green-500/30 scale-105'
                          : 'bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200'}
                      `}
                    >
                      {TICKET_SOURCE_INFO[source].label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {ticketSource === 'lawson'
                    ? t('lawsonNote', { defaultValue: 'LAWSON 便利商店票券（子票須以實體方式交付）' })
                    : t('zaikoNote', { defaultValue: 'ZAIKO 電子票券系統' })}
                </p>
              </div>

              {/* 座位等級 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('seatGrade')} <span className="text-red-500">*</span>
                </label>
                {!selectedEvent ? (
                  // 無活動資料時顯示預設選項
                  <div className="grid grid-cols-4 gap-2">
                    {(['B', 'A', 'S', 'SS'] as SeatGrade[]).map((grade) => (
                      <button
                        key={grade}
                        type="button"
                        onClick={() => setSeatGrade(grade)}
                        className={`
                          py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-300
                          ${seatGrade === grade
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 scale-105'
                            : 'bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300'}
                        `}
                      >
                        {SEAT_GRADE_INFO[grade]?.label || grade}
                      </button>
                    ))}
                  </div>
                ) : availableSeatGrades.length === 0 ? (
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    {t('noPriceSet')}
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {availableSeatGrades.map((grade) => (
                      <button
                        key={grade}
                        type="button"
                        onClick={() => setSeatGrade(grade)}
                        className={`
                          py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-300
                          ${seatGrade === grade
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 scale-105'
                            : 'bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300'}
                        `}
                      >
                        {SEAT_GRADE_INFO[grade]?.label || grade}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 購票人數 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('ticketPeopleCount', { defaultValue: '購票人數' })} <span className="text-red-500">*</span>
                </label>
                {!seatGrade ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('pleaseSelectSeatGrade')}
                  </p>
                ) : maxPeopleForEvent === 0 ? (
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    {t('seatNoPriceSet')}
                  </p>
                ) : (
                  <select
                    value={ticketPeopleCount || ''}
                    onChange={(e) => setTicketPeopleCount(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                  >
                    <option value="">{t('selectPeopleCount', { defaultValue: '請選擇人數' })}</option>
                    {Array.from({ length: maxPeopleForEvent }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>{n}人票</option>
                    ))}
                  </select>
                )}
              </div>

              {/* 價格設定 */}
              {selectedPriceTier?.priceJpy && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                    {t('priceSettings', { defaultValue: '價格設定' })}
                    {currency !== 'JPY' && <CurrencyBadge currency={currency} />}
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {/* 原始票價（唯讀） */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        {t('originalPrice', { defaultValue: '原始票價' })}
                      </label>
                      <div className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold">
                        {getCurrencySymbol(currency)}{selectedPriceTier.priceJpy.toLocaleString()}
                      </div>
                    </div>
                    {/* 希望價格（可編輯） */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        {t('askingPrice', { defaultValue: '希望價格' })} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">{getCurrencySymbol(currency)}</span>
                        <input
                          type="number"
                          value={askingPriceJpy || ''}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            // 計算最大價格：多人票子票轉讓 = 原價÷人數
                            const priceJpy = selectedPriceTier?.priceJpy || 0;
                            const maxPrice = (ticketPeopleCount >= 2 &&
                              (ticketType === 'sub_ticket_transfer' || ticketType === 'find_companion'))
                              ? Math.floor(priceJpy / ticketPeopleCount)
                              : priceJpy;
                            setAskingPriceJpy(Math.min(value, maxPrice));
                          }}
                          max={(ticketPeopleCount >= 2 &&
                            (ticketType === 'sub_ticket_transfer' || ticketType === 'find_companion'))
                            ? Math.floor((selectedPriceTier?.priceJpy || 0) / ticketPeopleCount)
                            : (selectedPriceTier?.priceJpy || 0)}
                          min={0}
                          className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-semibold"
                          placeholder="0"
                        />
                      </div>
                      {/* 價格上限提示 */}
                      {ticketPeopleCount >= 2 && (ticketType === 'sub_ticket_transfer' || ticketType === 'find_companion') && (
                        <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {t('splitPriceLimit', {
                            defaultValue: `${ticketPeopleCount}人票子票轉讓上限為原價÷${ticketPeopleCount}：`,
                            max: Math.floor((selectedPriceTier?.priceJpy || 0) / ticketPeopleCount).toLocaleString()
                          })}{getCurrencySymbol(currency)}{Math.floor((selectedPriceTier?.priceJpy || 0) / ticketPeopleCount).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 票券類型選擇 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('listingType')} <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {TICKET_TYPES.map((type) => {
                    // 轉讓子票僅限二人票以上（一人票無子票可轉讓）
                    const isSubTicketDisabled = type === 'sub_ticket_transfer' && ticketPeopleCount <= 1;

                    return (
                      <label
                        key={type}
                        className={`
                          flex items-start gap-3 p-3 rounded-lg border-2 transition-colors
                          ${isSubTicketDisabled
                            ? 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 cursor-not-allowed opacity-50'
                            : ticketType === type
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 cursor-pointer'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 cursor-pointer'}
                        `}
                      >
                        <input
                          type="radio"
                          name="ticketType"
                          value={type}
                          checked={ticketType === type}
                          onChange={() => !isSubTicketDisabled && setTicketType(type)}
                          disabled={isSubTicketDisabled}
                          className="mt-0.5"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                            {t(`ticketTypes.${type}`)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {t(`ticketTypes.${type}Desc`)}
                          </p>
                          <div className="flex items-center gap-1 mt-1 text-xs text-orange-600 dark:text-orange-400">
                            <AlertTriangle className="w-3 h-3" />
                            {t(`ticketTypes.${type}Warning`)}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 協助入場 Checkbox */}
              {ticketType === 'find_companion' && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={willAssistEntry}
                      onChange={(e) => setWillAssistEntry(e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div>
                      <p className="font-medium text-blue-800 dark:text-blue-200 text-sm">
                        {t('willAssistEntry', { defaultValue: '我會協助對方入場' })}
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                        {t('willAssistEntryDesc', { defaultValue: '勾選此項表示您會在現場親自協助對方入場' })}
                      </p>
                    </div>
                  </label>
                </div>
              )}
            </div>
          </Card>

          {/* 換票專用欄位 - 只在換票模式顯示 */}
          {isExchangeMode && (
            <Card variant="glass">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <span className="text-orange-500 text-lg">🔄</span>
                {t('exchangeSection', { defaultValue: '換票設定' })}
              </h3>

              <div className="space-y-4">
                {/* 想換的活動 */}
                <Select
                  label={t('exchangeEvent', { defaultValue: '想換的活動' })}
                  placeholder={t('selectExchangeEvent', { defaultValue: '選擇想換的活動' })}
                  options={eventOptions}
                  value={exchangeEventName}
                  onChange={(val) => {
                    setExchangeEventName(val);
                    setExchangeSeatGrades([]); // 重置票種等級選擇
                  }}
                  searchable
                  required
                />

                {/* 想換的票種等級 (可複選) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    {t('exchangeSeatGrade', { defaultValue: '想換的票種等級' })}
                    <span className="text-gray-400 text-xs ml-1">{t('multiSelect', { defaultValue: '(可複選)' })}</span>
                    <span className="text-red-500"> *</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {/* 任意選項 */}
                    <button
                      type="button"
                      onClick={() => {
                        // 選擇「任意」時清除其他選項
                        setExchangeSeatGrades(['any']);
                      }}
                      className={`
                        py-2 px-4 rounded-lg border-2 text-sm font-medium transition-all
                        ${exchangeSeatGrades.includes('any')
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-200'}
                      `}
                    >
                      {t('anyGrade', { defaultValue: '任意' })}
                    </button>
                    {/* 動態票種等級按鈕 */}
                    {exchangeEventSeatGrades.map((grade: string) => {
                      const isSelected = exchangeSeatGrades.includes(grade);
                      return (
                        <button
                          key={grade}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              // 取消選擇
                              setExchangeSeatGrades(prev => prev.filter(g => g !== grade));
                            } else {
                              // 選擇時移除 'any'
                              setExchangeSeatGrades(prev =>
                                [...prev.filter(g => g !== 'any'), grade]
                              );
                            }
                          }}
                          className={`
                            py-2 px-4 rounded-lg border-2 text-sm font-medium transition-all
                            ${isSelected
                              ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-200'}
                          `}
                        >
                          {grade}
                        </button>
                      );
                    })}
                  </div>
                  {exchangeSeatGrades.length > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {t('selectedGrades', { defaultValue: '已選擇' })}: {exchangeSeatGrades.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* 發布者資訊 */}
          <Card variant="glass">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-500" />
              {t('publisherInfo')}
            </h3>

            <div className="space-y-4">
              {/* 國籍 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                  <Globe className="w-4 h-4" />
                  {t('nationality')} <span className="text-red-500">*</span>
                </label>
                <select
                  value={hostNationality}
                  onChange={(e) => setHostNationality(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="">{t('selectNationality')}</option>
                  {NATIONALITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 可用語言 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                  <Languages className="w-4 h-4" />
                  {t('languages')} <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <button
                      key={lang.value}
                      type="button"
                      onClick={() => handleLanguageToggle(lang.value)}
                      className={`
                        px-3 py-1.5 rounded-full text-sm font-medium transition-all
                        ${hostLanguages.includes(lang.value)
                          ? 'bg-indigo-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'}
                      `}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
                {hostLanguages.length === 0 && (
                  <p className="text-red-500 text-sm mt-1">{t('selectAtLeastOneLanguage')}</p>
                )}
              </div>
            </div>
          </Card>

          {/* 其他注意事項 */}
          <Card variant="glass">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Shirt className="w-5 h-5 text-pink-500" />
              {t('otherNotes')}
            </h3>

            <div className="space-y-4">
              <Textarea
                placeholder={t('otherNotesPlaceholder')}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                maxLength={500}
                showCount
              />
            </div>
          </Card>

          {/* 底部按鈕 */}
          <div className="flex gap-4">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              variant="primary"
              fullWidth
              onClick={handleEditClick}
              disabled={!isFormValid || isSubmitting}
              loading={isSubmitting}
            >
              {tEdit('update')}
            </Button>
          </div>
        </div>
      </div>

      {/* 警告 Modal */}
      <Modal
        isOpen={showWarningModal}
        onClose={() => setShowWarningModal(false)}
        title={tEdit('warning')}
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            {tEdit('updateWarning', { count: applicantCount })}
          </p>
          <div className="flex gap-3 justify-end mt-6">
            <Button variant="ghost" onClick={() => setShowWarningModal(false)}>
              {tCommon('cancel')}
            </Button>
            <Button variant="danger" onClick={handleSubmit}>
              {tEdit('stillUpdate')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
