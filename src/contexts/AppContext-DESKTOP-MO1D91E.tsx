'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Listing, Application, Review, TicketRequest, TicketType } from '@/types';

// API 回傳的用戶類型
interface ApiUser {
  id: string;
  username: string;
  avatar_url?: string;
  custom_avatar_url?: string;
  rating: number;
  review_count: number;
  is_verified?: boolean;
  line_id?: string;
  discord_id?: string;
  show_line?: boolean;
  show_discord?: boolean;
}

// API 回傳的刊登類型
interface ApiListing {
  id: string;
  host_id: string;
  event_name: string;
  artist_tags: string[];
  event_date: string;
  venue: string;
  meeting_time: string;
  meeting_location: string;
  total_slots: number;
  available_slots: number;
  original_price_jpy: number;
  asking_price_jpy: number;
  ticket_type: 'find_companion' | 'sub_ticket_transfer' | 'ticket_exchange';
  ticket_source?: 'zaiko' | 'lawson';
  seat_grade: string;
  ticket_people_count: number;
  host_nationality: string;
  host_languages: string[];
  identification_features?: string;
  will_assist_entry?: boolean;
  status: 'open' | 'matched' | 'closed';
  description?: string;
  // 換票專用欄位
  exchange_event_name?: string;
  exchange_seat_grade?: string;
  exchange_seat_grades?: string[];
  created_at: string;
  updated_at: string;
  host?: ApiUser;
}

// 轉換 API 資料為前端格式
function convertApiListingToListing(apiListing: ApiListing): Listing {
  return {
    id: apiListing.id,
    hostId: apiListing.host_id,
    eventName: apiListing.event_name,
    artistTags: apiListing.artist_tags,
    eventDate: new Date(apiListing.event_date),
    venue: apiListing.venue,
    meetingTime: new Date(apiListing.meeting_time),
    meetingLocation: apiListing.meeting_location,
    totalSlots: apiListing.total_slots,
    availableSlots: apiListing.available_slots,
    originalPriceJpy: apiListing.original_price_jpy || 0,
    askingPriceJpy: apiListing.asking_price_jpy || 0,
    ticketType: apiListing.ticket_type,
    ticketSource: apiListing.ticket_source || 'zaiko',
    seatGrade: apiListing.seat_grade,
    ticketPeopleCount: apiListing.ticket_people_count || 1,
    hostNationality: apiListing.host_nationality,
    hostLanguages: apiListing.host_languages,
    identificationFeatures: apiListing.identification_features || '',
    willAssistEntry: apiListing.will_assist_entry,
    status: apiListing.status,
    description: apiListing.description || '',
    // 換票專用欄位
    exchangeEventName: apiListing.exchange_event_name,
    exchangeSeatGrade: apiListing.exchange_seat_grade,
    exchangeSeatGrades: apiListing.exchange_seat_grades ||
      (apiListing.exchange_seat_grade ? [apiListing.exchange_seat_grade] : []),
    createdAt: new Date(apiListing.created_at),
    updatedAt: new Date(apiListing.updated_at),
    host: apiListing.host ? {
      id: apiListing.host.id,
      email: '',
      username: apiListing.host.username,
      role: 'user' as const,
      verificationLevel: 'applicant' as const,
      avatarUrl: apiListing.host.avatar_url || '',
      customAvatarUrl: apiListing.host.custom_avatar_url,
      rating: apiListing.host.rating,
      reviewCount: apiListing.host.review_count,
      isVerified: apiListing.host.is_verified || false,
      lineId: apiListing.host.line_id,
      discordId: apiListing.host.discord_id,
      showLine: apiListing.host.show_line,
      showDiscord: apiListing.host.show_discord,
      createdAt: new Date(),
    } : undefined,
  };
}

// API 回傳的求票類型
interface ApiTicketRequest {
  id: string;
  user_id: string;
  event_id?: string;
  event_name: string;
  accepted_types: TicketType[];
  seat_grades: string[];
  quantity: number;
  description?: string;
  ticket_source?: 'zaiko' | 'lawson';
  requester_nationality?: string;
  requester_languages?: string[];
  status: 'open' | 'matched' | 'closed';
  created_at: string;
  updated_at: string;
  user?: ApiUser;
}

// 轉換 API 資料為前端格式
function convertApiTicketRequestToTicketRequest(apiRequest: ApiTicketRequest): TicketRequest {
  return {
    id: apiRequest.id,
    userId: apiRequest.user_id,
    eventId: apiRequest.event_id,
    eventName: apiRequest.event_name,
    acceptedTypes: apiRequest.accepted_types,
    seatGrades: apiRequest.seat_grades,
    quantity: apiRequest.quantity,
    description: apiRequest.description || '',
    ticketSource: apiRequest.ticket_source,
    requesterNationality: apiRequest.requester_nationality,
    requesterLanguages: apiRequest.requester_languages,
    status: apiRequest.status,
    createdAt: new Date(apiRequest.created_at),
    updatedAt: new Date(apiRequest.updated_at),
    user: apiRequest.user ? {
      id: apiRequest.user.id,
      email: '',
      username: apiRequest.user.username,
      role: 'user' as const,
      verificationLevel: 'applicant' as const,
      avatarUrl: apiRequest.user.avatar_url || '',
      customAvatarUrl: apiRequest.user.custom_avatar_url,
      rating: apiRequest.user.rating,
      reviewCount: apiRequest.user.review_count,
      isVerified: apiRequest.user.is_verified || false,
      createdAt: new Date(),
    } : undefined,
  };
}

interface AppContextType {
  // 刊登
  listings: Listing[];
  isLoadingListings: boolean;
  hasMoreListings: boolean;
  isFetchingNextPage: boolean;
  fetchListings: (reset?: boolean) => Promise<void>;
  loadMoreListings: () => Promise<void>;
  addListing: (listingData: CreateListingData) => Promise<Listing | null>;
  updateListing: (id: string, updates: Partial<Listing>) => Promise<boolean>;
  deleteListing: (id: string) => Promise<boolean>;

  // 求票
  requests: TicketRequest[];
  isLoadingRequests: boolean;
  fetchRequests: (reset?: boolean) => Promise<void>;

  // 申請
  applications: Application[];
  addApplication: (application: Application) => void;
  updateApplication: (id: string, updates: Partial<Application>) => void;

  // 評價
  reviews: Review[];
  addReview: (review: Review) => void;

  // 免責聲明同意
  hasAgreedToDisclaimer: boolean;
  setHasAgreedToDisclaimer: (agreed: boolean) => void;
}

// 創建刊登的資料類型
interface CreateListingData {
  eventName: string;
  artistTags?: string[];
  eventDate: string | null;
  venue: string;
  meetingTime: string | null;
  meetingLocation: string | null;
  totalSlots?: number;
  originalPriceJpy?: number;
  askingPriceJpy?: number;
  ticketSource?: 'zaiko' | 'lawson';
  ticketType: 'find_companion' | 'sub_ticket_transfer' | 'ticket_exchange';
  seatGrade: string;
  ticketPeopleCount: number;
  hostNationality: string;
  hostLanguages?: string[];
  identificationFeatures?: string;
  description?: string;
  willAssistEntry?: boolean;
  // 換票專用欄位
  exchangeEventName?: string;
  exchangeSeatGrade?: string;
  exchangeSeatGrades?: string[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(true);
  const [hasMoreListings, setHasMoreListings] = useState(true);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const currentPageRef = React.useRef(1);
  const isFetchingRef = React.useRef(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [hasAgreedToDisclaimer, setHasAgreedToDisclaimerState] = useState(false);

  // 求票狀態
  const [requests, setRequests] = useState<TicketRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const isFetchingRequestsRef = React.useRef(false);

  // 獲取刊登列表 (初始化或重置)
  const fetchListings = useCallback(async (reset: boolean = true) => {
    // 取得鎖，防止重複並發請求
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (reset) {
      setIsLoadingListings(true);
      currentPageRef.current = 1;
    } else {
      setIsFetchingNextPage(true);
    }
    const pageToFetch = reset ? 1 : currentPageRef.current;

    try {
      const response = await fetch(`/api/listings?page=${pageToFetch}&limit=20`);
      if (response.ok) {
        const result = await response.json();

        // 處理新版 paginated response (有 data 屬性) 或舊版 array response
        let fetchedApiListings: ApiListing[] = [];
        let totalPages = 1;

        if (result.data && Array.isArray(result.data)) {
          fetchedApiListings = result.data;
          totalPages = result.pagination?.totalPages || 1;
        } else if (Array.isArray(result)) {
          fetchedApiListings = result;
        }

        const convertedListings = fetchedApiListings.map(convertApiListingToListing);

        setListings(prev => {
          if (reset) return convertedListings;

          // 過濾掉可能重複的 id，防止 React Keys 重複導致畫面閃爍崩潰
          const prevIds = new Set(prev.map(l => l.id));
          const newUniqueListings = convertedListings.filter(l => !prevIds.has(l.id));

          return [...prev, ...newUniqueListings];
        });

        setHasMoreListings(pageToFetch < totalPages);
        if (!reset) {
          currentPageRef.current += 1;
        } else {
          currentPageRef.current = 2;
        }
      } else {
        console.error('Failed to fetch listings');
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      if (reset) {
        setIsLoadingListings(false);
      } else {
        setIsFetchingNextPage(false);
      }
      isFetchingRef.current = false;
    }
  }, []);

  // 獲取求票列表
  const fetchRequests = useCallback(async (reset: boolean = true) => {
    if (isFetchingRequestsRef.current) return;
    isFetchingRequestsRef.current = true;

    if (reset) {
      setIsLoadingRequests(true);
    }

    try {
      // 求票通常較少，我們可先一次性取得最新 open 的資料
      const response = await fetch(`/api/requests?status=open`);
      if (response.ok) {
        const result = await response.json();
        if (result.requests && Array.isArray(result.requests)) {
          const convertedRequests = result.requests.map(convertApiTicketRequestToTicketRequest);
          setRequests(convertedRequests);
        }
      } else {
        console.error('Failed to fetch requests');
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setIsLoadingRequests(false);
      isFetchingRequestsRef.current = false;
    }
  }, []);

  // 載入更多刊登
  const loadMoreListings = useCallback(async () => {
    if (!hasMoreListings || isLoadingListings || isFetchingNextPage || isFetchingRef.current) return;
    await fetchListings(false);
  }, [fetchListings, hasMoreListings, isLoadingListings, isFetchingNextPage]);

  // 初始化資料
  useEffect(() => {
    // 從 localStorage 讀取同意狀態
    const agreed = localStorage.getItem('disclaimerAgreed') === 'true';
    setHasAgreedToDisclaimerState(agreed);

    // 載入刊登資料與求票資料
    fetchListings();
    fetchRequests();
  }, [fetchListings, fetchRequests]);

  // 設定免責聲明同意狀態
  const setHasAgreedToDisclaimer = (agreed: boolean) => {
    setHasAgreedToDisclaimerState(agreed);
    localStorage.setItem('disclaimerAgreed', String(agreed));
  };

  // 新增刊登
  const addListing = async (listingData: CreateListingData): Promise<Listing | null> => {
    try {
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(listingData),
      });

      if (response.ok) {
        const data: ApiListing = await response.json();
        const newListing = convertApiListingToListing(data);
        setListings((prev) => [newListing, ...prev]);
        return newListing;
      } else {
        const errorData = await response.json();
        console.error('Failed to create listing:', errorData);
        // 拋出帶有錯誤類型的錯誤
        const error = new Error(errorData.message || 'Failed to create listing');
        (error as Error & { code?: string; current?: number; max?: number }).code = errorData.error;
        (error as Error & { code?: string; current?: number; max?: number }).current = errorData.current;
        (error as Error & { code?: string; current?: number; max?: number }).max = errorData.max;
        throw error;
      }
    } catch (error) {
      console.error('Error creating listing:', error);
      throw error;
    }
  };

  // 更新刊登
  const updateListing = async (id: string, updates: Partial<Listing>): Promise<boolean> => {
    try {
      const response = await fetch(`/api/listings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        setListings((prev) =>
          prev.map((listing) =>
            listing.id === id ? { ...listing, ...updates, updatedAt: new Date() } : listing
          )
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating listing:', error);
      return false;
    }
  };

  // 刪除刊登
  const deleteListing = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/listings/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setListings((prev) => prev.filter((listing) => listing.id !== id));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting listing:', error);
      return false;
    }
  };

  // 新增申請
  const addApplication = (application: Application) => {
    setApplications((prev) => [application, ...prev]);
  };

  // 更新申請
  const updateApplication = (id: string, updates: Partial<Application>) => {
    setApplications((prev) =>
      prev.map((app) =>
        app.id === id ? { ...app, ...updates, updatedAt: new Date() } : app
      )
    );
  };

  // 新增評價
  const addReview = (review: Review) => {
    setReviews((prev) => [review, ...prev]);
  };

  return (
    <AppContext.Provider
      value={{
        listings,
        isLoadingListings,
        hasMoreListings,
        isFetchingNextPage,
        fetchListings,
        loadMoreListings,
        addListing,
        updateListing,
        deleteListing,
        requests,
        isLoadingRequests,
        fetchRequests,
        applications,
        addApplication,
        updateApplication,
        reviews,
        addReview,
        hasAgreedToDisclaimer,
        setHasAgreedToDisclaimer,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
