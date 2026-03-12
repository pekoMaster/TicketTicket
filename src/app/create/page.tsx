'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Users,
  Ticket,
  Info,
  Mail,
  Phone,
  Loader2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  HandHelping,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { VerificationLevel } from '@/types';

// 4 步驟流程定義
const STEPS = [
  { id: 1, title: '活動資訊', icon: Calendar },
  { id: 2, title: '票券資訊', icon: Ticket },
  { id: 3, title: '發布者', icon: User },
  { id: 4, title: '確認發佈', icon: Check },
];

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

  // 模式選擇: null = 選擇中, 'listing' = 刊登票券, 'request' = 求票
  const [mode, setMode] = useState<'listing' | null>(null);

  // 步驟狀態
  const [currentStep, setCurrentStep] = useState(1);

  // 表單狀態
  const [eventName, setEventName] = useState('');
  const [artistTags, setArtistTags] = useState<string[]>([]);
  const [venue, setVenue] = useState('');
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
  const [createdListingId, setCreatedListingId] = useState<string | null>(null);
  const [showAgreement, setShowAgreement] = useState(true); // 展示創建警告彈窗
  const [willAssistEntry, setWillAssistEntry] = useState(false); // 協助入場

  // 換票專用欄位
  const [exchangeEventName, setExchangeEventName] = useState('');
  const [exchangeSeatGrades, setExchangeSeatGrades] = useState<string[]>([]);

  // 價格欄位
  const [askingPriceJpy, setAskingPriceJpy] = useState<number>(0);

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
    const now = new Date();
    return events
      .filter((e) => {
        if (!e.isActive) return false;
        // 使用 eventEndDate（多日活動）或 eventDate（單日活動）判斷過期
        const expirationDate = e.eventEndDate || e.eventDate;
        return expirationDate > now;
      })
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
      hostLanguages.length > 0 &&
      ticketType !== '' &&
      seatGrade !== '' &&
      ticketCountType !== '' &&
      hostNationality !== '' &&
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
      // 一般模式驗證
      return baseValid;
    }
  }, [eventName, hostLanguages, ticketType, seatGrade, ticketCountType, hostNationality, askingPriceJpy, isExchangeMode, exchangeEventName, exchangeSeatGrades, isEventLimitReached, events]);

  // 步驟驗證 - 檢查當前步驟是否可以前進
  const canProceedToNextStep = useMemo(() => {
    switch (currentStep) {
      case 1: // 活動資訊
        return eventName.trim() !== '';
      case 2: // 票券資訊
        const priceValid = ticketType === 'ticket_exchange' ? askingPriceJpy >= 0 : askingPriceJpy > 0;
        return seatGrade !== '' && ticketCountType !== '' && ticketType !== '' && priceValid;
      case 3: // 發布者資訊
        return hostNationality !== '' && hostLanguages.length > 0;
      case 4: // 確認發佈
        return isFormValid;
      default:
        return false;
    }
  }, [currentStep, eventName, seatGrade, ticketCountType, ticketType, askingPriceJpy, hostNationality, hostLanguages, isFormValid]);

  // 步驟導航函數
  const nextStep = () => {
    if (canProceedToNextStep && currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

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
    } else {
      setArtistTags([]);
      setVenue('');
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
        eventDate: selectedEvent?.eventDate
          ? new Date(selectedEvent.eventDate).toISOString()
          : new Date().toISOString(), // 從活動取得日期
        venue,
        meetingTime: selectedEvent?.eventDate
          ? new Date(selectedEvent.eventDate).toISOString()
          : new Date().toISOString(), // 預設為活動日期
        meetingLocation: venue || '待協調', // 預設為活動場地
        totalSlots: ticketCountType === 'duo' ? 2 : 1,
        ticketSource,
        ticketType: ticketType as TicketType,
        seatGrade: seatGrade,
        ticketCountType: ticketCountType as TicketCountType,
        hostNationality,
        hostLanguages,
        identificationFeatures: '', // 欄位已移除，固定為空白
        description: description || undefined,
        willAssistEntry: ticketType === 'find_companion' ? willAssistEntry : undefined,
        originalPriceJpy: selectedPriceTier?.priceJpy || 0,
        askingPriceJpy,
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
        setCreatedListingId(result.id);
        setShowSuccess(true);
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
          <Card variant="glass" className="p-8 text-center">
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

  // 模式選擇畫面
  if (mode === null) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative">
        <AuroraBackground />
        <Header title={t('title')} showBack />
        <div className="relative z-10 pt-20 pb-24 px-4">
          <div className="max-w-lg mx-auto space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {t('chooseMode', { defaultValue: '您想做什麼？' })}
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                {t('chooseModeDesc', { defaultValue: '選擇您要讓票還是求票' })}
              </p>
            </div>

            {/* 我有票 */}
            <button
              onClick={() => setMode('listing')}
              className="w-full group"
            >
              <Card variant="glass" className="p-6 text-left transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 border-2 border-transparent hover:border-indigo-500/30">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform">
                    <HandHelping className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                      🎫 {t('modeHaveTicket', { defaultValue: '我有票' })}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('modeHaveTicketDesc', { defaultValue: '找同行夥伴、轉讓子票、交換票券' })}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors mt-2" />
                </div>
              </Card>
            </button>

            {/* 我想要票 */}
            <button
              onClick={() => router.push('/request')}
              className="w-full group"
            >
              <Card variant="glass" className="p-6 text-left transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 border-2 border-transparent hover:border-emerald-500/30">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                    <Search className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                      🙋 {t('modeWantTicket', { defaultValue: '我想要票' })}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('modeWantTicketDesc', { defaultValue: '求同行、求讓票，讓有票的人找到你' })}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 transition-colors mt-2" />
                </div>
              </Card>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card variant="glass" className="text-center max-w-md w-full">
          {/* 成功圖示 */}
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
            <Check className="w-10 h-10 text-white" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            🎉 {t('publishSuccess')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t('publishSuccessDesc', { defaultValue: '您的刊登已成功發佈，等待有緣人申請！' })}
          </p>

          {/* Discord 建議區塊 */}
          <div className="bg-[#5865F2]/10 dark:bg-[#5865F2]/20 rounded-xl p-4 mb-6 border border-[#5865F2]/30">
            <div className="flex items-center justify-center gap-2 mb-3">
              <svg className="w-6 h-6 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              <h3 className="font-semibold text-[#5865F2]">
                {t('discordRecommendTitle', { defaultValue: '📣 即時通知建議' })}
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              {t('discordRecommendDesc', { defaultValue: '連結 Discord 帳號並加入我們的社群，即可在第一時間收到申請通知，不必重新整理網頁！' })}
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <a
                href="/profile/settings"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg font-medium transition-colors text-sm"
              >
                <User className="w-4 h-4" />
                {t('linkDiscord', { defaultValue: '連結 Discord' })}
              </a>
              <a
                href="https://discord.gg/KpPD9cpdH8"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-[#5865F2] border border-[#5865F2]/30 rounded-lg font-medium transition-colors text-sm"
              >
                <Users className="w-4 h-4" />
                {t('joinDiscord', { defaultValue: '加入社群' })}
              </a>
            </div>
          </div>

          {/* Twitter 分享區塊 */}
          <div className="bg-black/5 dark:bg-white/5 rounded-xl p-4 mb-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center gap-2 mb-3">
              <svg className="w-5 h-5 text-black dark:text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {t('shareToTwitter', { defaultValue: '📢 分享到 X (Twitter)' })}
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              {t('shareToTwitterDesc', { defaultValue: '透過 X 分享讓更多人看到你的刊登！' })}
            </p>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                `【譲】${eventName}\n` +
                `【座席】${seatGrade} ${ticketCountType === 'duo' ? '二人票' : '一人票'}\n` +
                `【求】¥${askingPriceJpy.toLocaleString()}（相談可）\n` +
                `リプまたはDMでお願いします🙇\n\n` +
                `https://ticketticket.live/listing/${createdListingId || ''}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black rounded-lg font-medium transition-colors text-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              {t('shareNow', { defaultValue: '立即分享' })}
            </a>
          </div>

          {/* 返回首頁按鈕 */}
          <Button
            variant="primary"
            fullWidth
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400"
          >
            {t('backToHome', { defaultValue: '返回首頁' })}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative">
      {/* Aurora 背景效果 */}
      <AuroraBackground />

      {/* 創建警告彈窗 */}
      <AgreementModal
        isOpen={showAgreement}
        onAgree={() => setShowAgreement(false)}
        onCancel={() => router.back()}
        variant="create"
      />

      <Header title={t('title')} showBack />

      <div className="relative z-10 pt-20 pb-24 px-4">
        <div className="space-y-6 max-w-2xl mx-auto">

          {/* 步驟進度指示器 */}
          <div className="mb-6">
            <div className="flex items-center justify-between relative">
              {/* Progress Line */}
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                />
              </div>

              {STEPS.map((step) => {
                const StepIcon = step.icon;
                const isActive = step.id === currentStep;
                const isCompleted = step.id < currentStep;

                return (
                  <div key={step.id} className="relative z-10 flex flex-col items-center">
                    <button
                      onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                      disabled={step.id > currentStep}
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                        ${isCompleted
                          ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white'
                          : isActive
                            ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/30'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'}
                      `}
                    >
                      {isCompleted ? <Check className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                    </button>
                    <span className={`mt-2 text-xs font-medium ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 合規聲明 - Glassmorphism Style */}
          <div className="bg-blue-50/80 dark:bg-blue-500/10 backdrop-blur-xl border border-blue-200/50 dark:border-blue-500/30 rounded-2xl p-5 shadow-lg">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                <p className="font-semibold">{t('complianceTitle', { defaultValue: '本平台不是票券交易網站' })}</p>
                <p className="text-blue-700 dark:text-blue-300">{t('complianceDesc', { defaultValue: 'TicketTicket 是粉絲配對社群，旨在幫助粉絲找到同行夥伴或交換座位。請遵守各場館與主辦方的轉讓規定。' })}</p>
                <p className="text-xs text-blue-600 dark:text-blue-300/80">
                  {t('reportIllegal', { defaultValue: '如發現任何違規轉賣行為，請透過「檢舉」功能向我們回報。' })}
                </p>
              </div>
            </div>
          </div>

          {/* 步驟 1: 活動資訊 */}
          {currentStep === 1 && (
            <Card variant="glass">
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
          )}

          {/* 步驟 2: 票券資訊 */}
          {currentStep === 2 && (
            <>
              <Card variant="glass">
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
                        ? t('lawsonNote', { defaultValue: 'LAWSON 便利商店票券（子票須以實體方式交付）' })
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

                        // 轉讓子票僅限二人票以上（一人票無子票可轉讓）
                        const isSubTicketDisabled = type === 'sub_ticket_transfer' && ticketCountType === 'solo';
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

                    {/* 價格設定 */}
                    {selectedPriceTier?.priceJpy && (
                      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                          {t('priceSettings', { defaultValue: '價格設定' })}
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          {/* 原始票價（唯讀） */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              {t('originalPrice', { defaultValue: '原始票價' })}
                            </label>
                            <div className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold">
                              ¥{selectedPriceTier.priceJpy.toLocaleString()}
                            </div>
                          </div>
                          {/* 希望價格（可編輯） */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              {t('askingPrice', { defaultValue: '希望價格' })} <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">¥</span>
                              <input
                                type="number"
                                value={askingPriceJpy || ''}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 0;
                                  // 計算最大價格：二人票 + (子票轉讓或尋找同行) = 原價/2
                                  const priceJpy = selectedPriceTier?.priceJpy || 0;
                                  const maxPrice = (ticketCountType === 'duo' && ticketType === 'sub_ticket_transfer')
                                    ? Math.floor(priceJpy / 2)
                                    : priceJpy;
                                  setAskingPriceJpy(Math.min(value, maxPrice));
                                }}
                                max={(ticketCountType === 'duo' && ticketType === 'sub_ticket_transfer')
                                  ? Math.floor((selectedPriceTier?.priceJpy || 0) / 2)
                                  : (selectedPriceTier?.priceJpy || 0)}
                                min={0}
                                className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-semibold"
                                placeholder="0"
                              />
                            </div>
                            {/* 價格上限提示 */}
                            {ticketCountType === 'duo' && ticketType === 'sub_ticket_transfer' && (
                              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                {t('halfPriceLimit', {
                                  defaultValue: '二人票子票/同行上限為原價一半：¥',
                                  max: Math.floor(selectedPriceTier.priceJpy / 2).toLocaleString()
                                })}{Math.floor(selectedPriceTier.priceJpy / 2).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
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
            </>
          )}

          {/* 步驟 3: 發布者資訊 */}
          {currentStep === 3 && (
            <>
              <Card variant="glass">
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
                          {t(`common.nationalities.${opt.value}`, { defaultValue: opt.label })}
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
                          {t(`common.languagesList.${lang.value}`, { defaultValue: lang.label })}
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
            </>
          )}

          {/* 步驟 4: 確認發佈 */}
          {currentStep === 4 && (
            <Card variant="glass">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-500" />
                {t('confirmPublish', { defaultValue: '確認發佈資訊' })}
              </h3>

              <div className="space-y-4">
                {/* 活動資訊摘要 */}
                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl space-y-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('eventInfo')}</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{eventName}</p>
                  {venue && <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1"><MapPin className="w-4 h-4" />{venue}</p>}
                </div>

                {/* 票券資訊摘要 */}
                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl space-y-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('ticketInfo')}</p>
                  <div className="flex flex-wrap gap-2">
                    {seatGrade && <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded text-sm">{seatGrade}</span>}
                    {ticketCountType && <span className="px-2 py-1 bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 rounded text-sm">{TICKET_COUNT_TYPE_INFO[ticketCountType as TicketCountType]?.label}</span>}
                    {ticketType && <span className="px-2 py-1 bg-pink-100 dark:bg-pink-500/20 text-pink-700 dark:text-pink-300 rounded text-sm">{TICKET_TYPE_INFO[ticketType as TicketType]?.label}</span>}
                  </div>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">¥{askingPriceJpy.toLocaleString()}</p>
                </div>

                {/* 換票資訊摘要 - 只在換票模式顯示 */}
                {isExchangeMode && exchangeEventName && (
                  <div className="p-4 bg-orange-50 dark:bg-orange-500/10 rounded-xl border border-orange-200 dark:border-orange-500/30 space-y-2">
                    <p className="text-sm text-orange-600 dark:text-orange-400 flex items-center gap-1">
                      🔄 {t('exchangeTarget', { defaultValue: '想換成' })}
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white">{exchangeEventName}</p>
                    <div className="flex flex-wrap gap-2">
                      {exchangeSeatGrades.map((grade) => (
                        <span key={grade} className="px-2 py-1 bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 rounded text-sm">
                          {grade === 'any' ? t('anyGrade', { defaultValue: '任意' }) : grade}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 發布者資訊摘要 */}
                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl space-y-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('publisherInfo')}</p>
                  <div className="flex flex-wrap gap-2 text-sm">
                    {hostNationality && <span className="flex items-center gap-1 text-gray-700 dark:text-gray-300"><Globe className="w-4 h-4" />{t(`common.nationalities.${hostNationality}`, { defaultValue: hostNationality })}</span>}
                    {hostLanguages.length > 0 && <span className="flex items-center gap-1 text-gray-700 dark:text-gray-300"><Languages className="w-4 h-4" />{hostLanguages.map(l => t(`common.languagesList.${l}`, { defaultValue: l })).join(', ')}</span>}
                  </div>
                </div>

                {/* 提交提醒 */}
                <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-200 dark:border-emerald-500/30">
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">
                    {t('confirmSubmitHint', { defaultValue: '請確認以上資訊正確無誤，點擊下方「發佈」按鈕完成刊登。' })}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* 底部導航列 - Glassmorphism Style */}
      <div className="fixed bottom-16 lg:bottom-0 left-0 lg:left-64 right-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-200/50 dark:border-white/10 px-4 py-4 safe-area-bottom">
        <div className="max-w-2xl mx-auto flex gap-3">
          {/* 上一步按鈕 */}
          {currentStep > 1 && (
            <button
              onClick={prevStep}
              className="flex-1 py-3.5 px-6 rounded-xl font-semibold bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-all flex items-center justify-center gap-2"
            >
              <ChevronLeft className="w-5 h-5" />
              {tCommon('previous', { defaultValue: '上一步' })}
            </button>
          )}

          {/* 下一步或發布按鈕 */}
          {currentStep < 4 ? (
            <button
              onClick={nextStep}
              disabled={!canProceedToNextStep}
              className={`
                flex-1 py-3.5 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2
                ${canProceedToNextStep
                  ? 'bg-gradient-to-r from-cyan-600 to-purple-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-[1.02]'
                  : 'bg-gray-200 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500 cursor-not-allowed'}
              `}
            >
              {tCommon('next', { defaultValue: '下一步' })}
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!isFormValid || isSubmitting}
              className={`
                flex-1 py-3.5 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2
                ${isFormValid && !isSubmitting
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-[1.02]'
                  : 'bg-gray-200 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500 cursor-not-allowed'}
              `}
            >
              {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
              {t('publish')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
