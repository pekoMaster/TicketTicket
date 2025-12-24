'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useApp } from '@/contexts/AppContext';
import { useAdmin } from '@/contexts/AdminContext';
import { useTranslations } from 'next-intl';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import AgreementModal from '@/components/ui/AgreementModal';
import {
  TicketType,
  TicketSource,
  TicketCountType,
  TICKET_COUNT_TYPE_INFO,
  TICKET_TYPE_INFO,
  TICKET_SOURCE_INFO,
  NATIONALITY_OPTIONS,
  LANGUAGE_OPTIONS,
  getSeatGradeColor,
} from '@/types';
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
  Info,
  Mail,
  Phone,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { VerificationLevel } from '@/types';

// 穿著快速標籤 keys
const CLOTHING_TAG_KEYS = [
  'tshirt', 'shirt', 'jacket', 'hoodie', 'hoodedJacket', 'suit', 'dress',
  'jeans', 'shorts', 'skirt', 'hat', 'mask', 'glasses', 'backpack',
  'crossbodyBag', 'handbag', 'itaBag', 'merchandise', 'penlight',
];

export default function CreateListingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { addListing, listings } = useApp();
  const { events } = useAdmin();
  const t = useTranslations('create');
  const tCommon = useTranslations('common');

  // 表單狀態
  const [eventName, setEventName] = useState('');
  const [artistTags, setArtistTags] = useState<string[]>([]);
  const [eventDate, setEventDate] = useState('');
  const [venue, setVenue] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [meetingLocation, setMeetingLocation] = useState('');
  const [ticketSource, setTicketSource] = useState<TicketSource>('zaiko'); // 票源預設 ZAIKO
  const [ticketType, setTicketType] = useState<TicketType | ''>('');
  const [seatGrade, setSeatGrade] = useState<string>('');
  const [ticketCountType, setTicketCountType] = useState<TicketCountType | ''>('');
  const [hostNationality, setHostNationality] = useState('');
  const [hostLanguages, setHostLanguages] = useState<string[]>([]);
  const [identificationFeatures, setIdentificationFeatures] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showAgreement, setShowAgreement] = useState(true); // 展示創建警告彈窗
  const [willAssistEntry, setWillAssistEntry] = useState(false); // 協助入場

  // 換票專用欄位
  const [exchangeEventName, setExchangeEventName] = useState('');
  const [exchangeSeatGrades, setExchangeSeatGrades] = useState<string[]>([]);

  // 驗證層級檢查
  const [verificationLevel, setVerificationLevel] = useState<VerificationLevel | null>(null);
  const [isCheckingVerification, setIsCheckingVerification] = useState(true);

  // 檢查用戶驗證層級
  useEffect(() => {
    const checkVerification = async () => {
      if (!session?.user?.dbId) {
        setIsCheckingVerification(false);
        return;
      }

      try {
        const response = await fetch(`/api/users/${session.user.dbId}`);
        if (response.ok) {
          const data = await response.json();
          setVerificationLevel(data.verification_level || 'unverified');
        }
      } catch (error) {
        console.error('Failed to check verification:', error);
      } finally {
        setIsCheckingVerification(false);
      }
    };

    checkVerification();
  }, [session?.user?.dbId]);

  // 計算用戶在每個活動的刊登數量
  const userListingsCountByEvent = useMemo(() => {
    if (!session?.user?.dbId) return {};
    const counts: Record<string, number> = {};
    listings
      .filter((l) => l.hostId === session.user.dbId)
      .forEach((l) => {
        counts[l.eventName] = (counts[l.eventName] || 0) + 1;
      });
    return counts;
  }, [listings, session?.user?.dbId]);

  // 從管理員活動獲取選項（含刊登上限資訊）
  const eventOptions = useMemo(() => {
    return events
      .filter((e) => e.isActive)
      .map((event) => {
        const currentCount = userListingsCountByEvent[event.name] || 0;
        const maxAllowed = event.maxListingsPerUser || 2;
        const isLimitReached = currentCount >= maxAllowed;
        return {
          value: event.name,
          label: isLimitReached
            ? `${event.name} (${t('limitReached', { defaultValue: '已達上限' })})`
            : event.name,
          disabled: isLimitReached,
        };
      });
  }, [events, userListingsCountByEvent, t]);

  // 當選擇活動時，找到對應的管理員活動資料
  const selectedEvent = useMemo(() => {
    return events.find((e) => e.name === eventName);
  }, [events, eventName]);

  // 檢查選擇的活動是否已達上限
  const isEventLimitReached = useMemo(() => {
    if (!selectedEvent || !session?.user?.dbId) return false;
    const currentCount = userListingsCountByEvent[eventName] || 0;
    const maxAllowed = selectedEvent.maxListingsPerUser || 2;
    return currentCount >= maxAllowed;
  }, [selectedEvent, eventName, userListingsCountByEvent, session?.user?.dbId]);

  // 從活動取得可用的座位等級（根據已設定的票價）- 現在返回字串陣列
  const availableSeatGrades = useMemo(() => {
    if (!selectedEvent?.ticketPriceTiers) return [];
    const grades = new Set(selectedEvent.ticketPriceTiers.map(t => t.seatGrade));
    return Array.from(grades);
  }, [selectedEvent]);

  // 換票用：根據選擇的「想換的活動」獲取該活動的可用座位等級
  const exchangeEventSeatGrades = useMemo(() => {
    if (!exchangeEventName) return [];
    const targetEvent = events.find(e => e.name === exchangeEventName);
    if (!targetEvent?.ticketPriceTiers) return [];
    const grades = new Set(targetEvent.ticketPriceTiers.map(t => t.seatGrade));
    return Array.from(grades);
  }, [events, exchangeEventName]);

  // 從活動取得可用的票種類型（根據座位等級）
  const availableTicketCountTypes = useMemo(() => {
    if (!selectedEvent?.ticketPriceTiers || !seatGrade) return [];
    const types = selectedEvent.ticketPriceTiers
      .filter(t => t.seatGrade === seatGrade)
      .map(t => t.ticketCountType);
    return Array.from(new Set(types)) as TicketCountType[];
  }, [selectedEvent, seatGrade]);

  // 察看是否已選擇票種等級（用於啟用刊登類型選擇）
  const selectedPriceTier = useMemo(() => {
    if (!selectedEvent?.ticketPriceTiers || !seatGrade || !ticketCountType) return null;
    return selectedEvent.ticketPriceTiers.find(
      t => t.seatGrade === seatGrade && t.ticketCountType === ticketCountType
    );
  }, [selectedEvent, seatGrade, ticketCountType]);

  // 當座位等級改變時，重置票種類型
  useEffect(() => {
    setTicketCountType('');
  }, [seatGrade]);

  // 當票種類型改變時，檢查是否需要限制票券類型
  useEffect(() => {
    // 如果選了轉讓子票但是一人票，清除選擇（一人票無子票可轉讓）
    if (ticketType === 'sub_ticket_transfer' && ticketCountType === 'solo') {
      setTicketType('');
    }
  }, [ticketCountType, ticketType]);

  // 是否為換票模式
  const isExchangeMode = ticketType === 'ticket_exchange';

  // 表單驗證
  const isFormValid = useMemo(() => {
    // 如果已達上限，表單無效
    if (isEventLimitReached) return false;

    const baseValid = (
      eventName.trim() !== '' &&
      eventDate !== '' &&
      venue.trim() !== '' &&
      meetingTime !== '' &&
      meetingLocation.trim() !== '' &&
      identificationFeatures.trim() !== '' &&
      hostLanguages.length > 0 &&
      ticketType !== '' &&
      seatGrade !== '' &&
      ticketCountType !== '' &&
      hostNationality !== ''
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
      // 一般模式驗證
      return baseValid;
    }
  }, [eventName, eventDate, venue, meetingTime, meetingLocation, identificationFeatures, hostLanguages, ticketType, seatGrade, ticketCountType, hostNationality, isExchangeMode, exchangeEventName, exchangeSeatGrades, isEventLimitReached, events]);

  const handleLanguageToggle = (lang: string) => {
    setHostLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  // 處理活動選擇
  const handleEventSelect = (name: string) => {
    setEventName(name);
    setSeatGrade('');
    setTicketCountType('');
    setTicketType('');

    const event = events.find((e) => e.name === name);
    if (event) {
      if (event.artist) {
        const tags = event.artist.split(',').map((tag) => tag.trim()).filter((tag) => tag);
        setArtistTags(tags);
      } else {
        setArtistTags([]);
      }
      setVenue(event.venue || '');
      setVenueAddress(event.venueAddress || '');
      // 自動填入活動日期
      if (event.eventDate) {
        const dateStr = new Date(event.eventDate).toISOString().split('T')[0];
        setEventDate(dateStr);
      }
    } else {
      setArtistTags([]);
      setVenue('');
      setVenueAddress('');
    }
  };

  // 添加穿著快速標籤
  const handleAddClothingTag = (tag: string) => {
    if (!identificationFeatures.includes(tag)) {
      setIdentificationFeatures((prev) =>
        prev ? `${prev}、${tag}` : tag
      );
    }
  };

  const handleSubmit = async () => {
    if (!session?.user?.dbId || !isFormValid) return;

    setIsSubmitting(true);

    try {
      // 準備提交資料
      const listingData: Parameters<typeof addListing>[0] = {
        eventName,
        artistTags,
        eventDate,
        venue,
        meetingTime: `${eventDate}T${meetingTime.slice(0, 5)}:00+09:00`,
        meetingLocation,
        totalSlots: ticketCountType === 'duo' ? 2 : 1,
        ticketSource,
        ticketType: ticketType as TicketType,
        seatGrade: seatGrade,
        ticketCountType: ticketCountType as TicketCountType,
        hostNationality,
        hostLanguages,
        identificationFeatures,
        description: description || undefined,
        willAssistEntry: ticketType === 'find_companion' ? willAssistEntry : undefined,
      };

      // 如果是換票模式，添加換票相關欄位
      if (isExchangeMode) {
        Object.assign(listingData, {
          exchangeEventName,
          exchangeSeatGrades,
        });
      }

      const result = await addListing(listingData);

      if (result) {
        setShowSuccess(true);
        setTimeout(() => {
          router.push('/');
        }, 2000);
      }
    } catch (error) {
      console.error('Error creating listing:', error);
      // 處理特定錯誤類型
      const err = error as Error & { code?: string; current?: number; max?: number };
      if (err.code === 'MAX_LISTINGS_REACHED') {
        alert(t('alreadyMaxListings', { current: err.current || 2, max: err.max || 2 }));
      } else {
        alert(tCommon('publishFailed'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 票券類型選項
  const ticketTypes: TicketType[] = ['find_companion', 'sub_ticket_transfer', 'ticket_exchange'];

  // 檢查中
  if (isCheckingVerification) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  // 驗證層級不足
  if (verificationLevel && verificationLevel !== 'host') {
    const needsEmailVerification = verificationLevel === 'unverified';
    const needsPhoneVerification = verificationLevel === 'applicant';

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header title={t('title')} showBack />
        <main className="max-w-md mx-auto px-4 py-12">
          <Card className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
              {needsEmailVerification ? (
                <Mail className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              ) : (
                <Phone className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {t('verificationRequired')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {needsEmailVerification
                ? t('needEmailVerification')
                : t('needPhoneVerification')
              }
            </p>

            {/* 驗證進度 */}
            <div className="mb-8 space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${verificationLevel !== 'unverified'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-300 dark:bg-gray-600'
                  }`}>
                  {verificationLevel !== 'unverified' ? <Check className="w-4 h-4" /> : '1'}
                </div>
                <span className={verificationLevel !== 'unverified' ? 'text-green-600 dark:text-green-400' : ''}>
                  {t('stepEmailVerification')}
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="w-6 h-6 rounded-full flex items-center justify-center bg-gray-300 dark:bg-gray-600">
                  2
                </div>
                <span>
                  {t('stepPhoneVerification')}
                </span>
              </div>
            </div>

            <Link href={needsEmailVerification ? '/verify-email' : '/verify-phone'}>
              <Button variant="primary" className="w-full">
                {needsEmailVerification ? t('goVerifyEmail') : t('goVerifyPhone')}
              </Button>
            </Link>
          </Card>
        </main>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="text-center max-w-sm w-full">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('publishSuccess')}</h2>
          <p className="text-gray-500 dark:text-gray-400">{t('redirecting')}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 創建警告彈窗 */}
      <AgreementModal
        isOpen={showAgreement}
        onAgree={() => setShowAgreement(false)}
        onCancel={() => router.back()}
        variant="create"
      />

      <Header title={t('title')} showBack />

      <div className="pt-20 pb-24 px-4">
        <div className="space-y-6 max-w-2xl mx-auto">

          {/* 合規聲明 */}
          <Card className="bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                <p className="font-medium">{t('complianceTitle', { defaultValue: '本平台不是票券交易網站' })}</p>
                <p>{t('complianceDesc', { defaultValue: 'TicketTicket 是粉絲配對社群，旨在幫助粉絲找到同行夥伴或交換座位。請遵守各場館與主辦方的轉讓規定。' })}</p>
                <p className="text-xs text-blue-600 dark:text-blue-300">
                  {t('reportIllegal', { defaultValue: '如發現任何違規轉賣行為，請透過「檢舉」功能向我們回報。' })}
                </p>
              </div>
            </div>
          </Card>

          {/* 活動資訊 */}
          <Card>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('eventInfo')}</h3>

            <div className="space-y-4">
              <Select
                label={t('eventName')}
                placeholder={t('pleaseSelectEvent')}
                options={eventOptions}
                value={eventName}
                onChange={handleEventSelect}
                searchable
                required
              />

              {/* 刊登上限警告 */}
              {isEventLimitReached && selectedEvent && (
                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-red-700 dark:text-red-300 font-medium">
                      {t('listingLimitReached', { defaultValue: '已達此活動的刊登上限' })}
                    </p>
                    <p className="text-red-600 dark:text-red-400 mt-1">
                      {t('listingLimitInfo', {
                        current: userListingsCountByEvent[eventName] || 0,
                        max: selectedEvent.maxListingsPerUser || 2,
                        defaultValue: `您已在此活動發布 ${userListingsCountByEvent[eventName] || 0} 張票券（上限 ${selectedEvent.maxListingsPerUser || 2} 張）`
                      })}
                    </p>
                  </div>
                </div>
              )}

              {/* 藝人標籤預覽 */}
              {artistTags.length > 0 && (
                <div className="mt-2">
                  <label className="text-sm text-gray-500 dark:text-gray-400 mb-1 block">{t('artistGroup')}</label>
                  <div className="flex flex-wrap gap-2">
                    {artistTags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={t('companionDate')}
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  leftIcon={<Calendar className="w-5 h-5" />}
                  required
                />
                <Input
                  label={t('gatherTime')}
                  type="time"
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                  leftIcon={<Clock className="w-5 h-5" />}
                  required
                />
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 -mb-2">{t('japanTimeHint')}</p>
              </div>

              {/* 活動現場地址（唯讀） */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  {t('venueAddress')}
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    value={venueAddress || venue || t('pleaseSelectEvent')}
                    readOnly
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 cursor-not-allowed"
                  />
                </div>
                {!eventName && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('autoFillAfterSelect')}</p>
                )}
              </div>

              {/* 同行集合地點 */}
              <Input
                label={t('meetingPointWithHint', { defaultValue: '同行集合地點（線上交換請直接寫線上）' })}
                placeholder={t('meetingPointPlaceholder')}
                value={meetingLocation}
                onChange={(e) => setMeetingLocation(e.target.value)}
                leftIcon={<MapPin className="w-5 h-5" />}
                required
              />
            </div>
          </Card>

          {/* 票券資訊 */}
          <Card>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-indigo-500" />
              {t('ticketInfo')}
            </h3>

            <div className="space-y-4">
              {/* 票源選擇 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  {t('ticketSource', { defaultValue: '票源' })} <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['zaiko', 'lawson'] as const).map((source) => (
                    <button
                      key={source}
                      type="button"
                      onClick={() => {
                        setTicketSource(source);
                        // 切換到 LAWSON 時，如果選了子票轉讓，清除刊登類型
                        if (source === 'lawson' && ticketType === 'sub_ticket_transfer') {
                          setTicketType('');
                        }
                      }}
                      className={`
                        py-2.5 px-4 rounded-lg border-2 text-sm font-semibold transition-all
                        ${ticketSource === source
                          ? source === 'zaiko'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-200'}
                      `}
                    >
                      {TICKET_SOURCE_INFO[source].label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {ticketSource === 'lawson'
                    ? t('lawsonNote', { defaultValue: 'LAWSON 票券不支援子票轉讓' })
                    : t('zaikoNote', { defaultValue: 'ZAIKO 電子票券系統' })}
                </p>
              </div>

              {/* 座位等級 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  {t('seatGrade')} <span className="text-red-500">*</span>
                </label>
                {!selectedEvent ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('pleaseSelectEvent')}</p>
                ) : availableSeatGrades.length === 0 ? (
                  <p className="text-sm text-amber-600 dark:text-amber-400">{t('noPriceSet')}</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {availableSeatGrades.map((grade) => (
                      <button
                        key={grade}
                        type="button"
                        onClick={() => setSeatGrade(grade)}
                        className={`
                          py-2 px-4 rounded-lg border-2 text-sm font-medium transition-all
                          ${seatGrade === grade
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-200'}
                        `}
                      >
                        {grade}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 票種類型 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  {t('ticketCountType')} <span className="text-red-500">*</span>
                </label>
                {!seatGrade ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('pleaseSelectSeatGrade')}</p>
                ) : availableTicketCountTypes.length === 0 ? (
                  <p className="text-sm text-amber-600 dark:text-amber-400">{t('seatNoPriceSet')}</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {availableTicketCountTypes.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setTicketCountType(type)}
                        className={`
                          py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all
                          ${ticketCountType === type
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-200'}
                        `}
                      >
                        {TICKET_COUNT_TYPE_INFO[type].label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 票券類型選擇 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  {t('listingType')} <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {ticketTypes.map((type) => {
                    const info = TICKET_TYPE_INFO[type];
                    // 必須先選擇活動、座位等級和票種類型（人數）
                    const isPrerequisitesMet = eventName && seatGrade && ticketCountType;

                    // 轉讓子票僅限：1. 二人票以上（一人票無子票可轉讓）2. ZAIKO 票源（LAWSON 不支援子票）
                    const isSubTicketDisabled = type === 'sub_ticket_transfer' && (ticketCountType === 'solo' || ticketSource === 'lawson');
                    const isDisabled = !isPrerequisitesMet || isSubTicketDisabled;

                    // 使用翻譯或預設標籤
                    const label = t(`ticketTypes.${type}`, { defaultValue: info.label });
                    const desc = t(`ticketTypes.${type}Desc`, { defaultValue: info.description });
                    const warning = info.warning ? t(`ticketTypes.${type}Warning`, { defaultValue: info.warning }) : undefined;

                    return (
                      <label
                        key={type}
                        className={`
                          flex items-start gap-3 p-3 rounded-lg border-2 transition-colors
                          ${isDisabled
                            ? 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 cursor-not-allowed opacity-50'
                            : ticketType === type
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 cursor-pointer'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 cursor-pointer'}
                        `}
                      >
                        <input
                          type="radio"
                          name="ticketType"
                          value={type}
                          checked={ticketType === type}
                          onChange={() => !isDisabled && setTicketType(type)}
                          disabled={isDisabled}
                          className="mt-0.5"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{label}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
                          {warning && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-orange-600 dark:text-orange-400">
                              <AlertTriangle className="w-3 h-3" />
                              {warning}
                            </div>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>

                {/* 同行者 - 協助入場 Checkbox */}
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
                        <p className="text-xs text-blue-600 dark:text-blue-300 mt-0.5">
                          {t('willAssistEntryDesc', { defaultValue: '勾選此項表示您會在現場親自協助對方入場' })}
                        </p>
                      </div>
                    </label>
                  </div>
                )}

                {/* 參考原價顯示 - 僅供參考 */}
                {selectedPriceTier?.priceJpy && (
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {t('referencePrice', { defaultValue: '參考原價' })}
                      </span>
                      <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        ¥{selectedPriceTier.priceJpy.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t('referencePriceNote', { defaultValue: '此為管理員設定的票券原價，僅供參考' })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* 換票專用欄位 - 只在換票模式顯示 */}
          {isExchangeMode && (
            <Card>
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
          <Card>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-500" />
              {t('publisherInfo')}
            </h3>

            <div className="space-y-4">
              {/* 國籍 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-1">
                  <Globe className="w-4 h-4" />
                  {t('nationality')} <span className="text-red-500">*</span>
                </label>
                <select
                  value={hostNationality}
                  onChange={(e) => setHostNationality(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-1">
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

              {/* 辨識特徵 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-1">
                  <Shirt className="w-4 h-4" />
                  {t('identificationFeatures')} <span className="text-red-500">*</span>
                </label>
                <Textarea
                  placeholder={t('identificationPlaceholder')}
                  value={identificationFeatures}
                  onChange={(e) => setIdentificationFeatures(e.target.value)}
                  rows={2}
                  maxLength={200}
                  showCount
                />
                {/* 快速標籤 */}
                <div className="mt-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t('quickAdd')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {CLOTHING_TAG_KEYS.map((tagKey) => (
                      <button
                        key={tagKey}
                        type="button"
                        onClick={() => handleAddClothingTag(t(`clothingTags.${tagKey}`))}
                        className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md transition-colors"
                      >
                        + {t(`clothingTags.${tagKey}`)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* 其他注意事項 */}
          <Card>
            <Textarea
              label={t('otherNotes')}
              placeholder={t('otherNotesPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={500}
              showCount
            />
          </Card>
        </div>
      </div>

      {/* 底部提交按鈕 */}
      <div className="fixed bottom-16 left-0 right-0 lg:left-64 lg:bottom-0 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 px-4 py-3 safe-area-bottom">
        <div className="max-w-2xl mx-auto">
          <Button
            fullWidth
            onClick={handleSubmit}
            disabled={!isFormValid}
            loading={isSubmitting}
          >
            {t('publish')}
          </Button>
        </div>
      </div>
    </div>
  );
}
