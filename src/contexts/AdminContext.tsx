'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { HololiveEvent, UserRole, CurrencyCode } from '@/types';

// API 回傳的活動類型
interface ApiEvent {
  id: string;
  name: string;
  artist: string;
  event_date: string;
  event_end_date?: string;
  venue: string;
  venue_address?: string;
  image_url?: string;
  description?: string;
  ticket_price_tiers: {
    seat_grade: string;
    price_jpy?: number;
  }[];
  category: 'concert' | 'fan_meeting' | 'expo' | 'streaming' | 'other';
  currency?: string;
  is_active: boolean;
  max_tickets_per_person: number;
  max_requests_per_user: number;
  discord_webhook_url?: string;
  created_at: string;
  updated_at: string;
}

// 轉換 API 資料為前端格式
function convertApiEventToEvent(apiEvent: ApiEvent): HololiveEvent {
  return {
    id: apiEvent.id,
    name: apiEvent.name,
    artist: apiEvent.artist,
    eventDate: new Date(apiEvent.event_date),
    eventEndDate: apiEvent.event_end_date ? new Date(apiEvent.event_end_date) : undefined,
    venue: apiEvent.venue,
    venueAddress: apiEvent.venue_address,
    imageUrl: apiEvent.image_url,
    description: apiEvent.description,
    ticketPriceTiers: (apiEvent.ticket_price_tiers || []).map(tier => ({
      seatGrade: tier.seat_grade || '',
      priceJpy: tier.price_jpy,
    })),
    category: apiEvent.category,
    currency: (apiEvent.currency as CurrencyCode) || 'JPY',
    isActive: apiEvent.is_active,
    maxTicketsPerPerson: apiEvent.max_tickets_per_person || 2,
    maxRequestsPerUser: apiEvent.max_requests_per_user || 2,
    discordWebhookUrl: apiEvent.discord_webhook_url,
    createdAt: new Date(apiEvent.created_at),
    updatedAt: new Date(apiEvent.updated_at),
  } as HololiveEvent & { discordWebhookUrl?: string };
}

interface AdminContextType {
  // 活動管理
  events: HololiveEvent[];
  isLoadingEvents: boolean;
  fetchEvents: () => Promise<void>;
  addEvent: (event: Omit<HololiveEvent, 'id' | 'createdAt' | 'updatedAt'>) => Promise<HololiveEvent | null>;
  updateEvent: (id: string, updates: Partial<HololiveEvent> & { discordWebhookUrl?: string }) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  getEvent: (id: string) => HololiveEvent | undefined;

  // 管理員驗證
  isAuthenticated: boolean;
  isLoggingIn: boolean;
  role: UserRole | null;
  isSuperAdmin: boolean;
  login: (password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<HololiveEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // 獲取活動列表
  const fetchEvents = useCallback(async () => {
    setIsLoadingEvents(true);
    try {
      const response = await fetch('/api/events?includeInactive=true', { cache: 'no-store' });
      if (response.ok) {
        const data: ApiEvent[] = await response.json();
        setEvents(data.map(convertApiEventToEvent));
      } else {
        console.error('Failed to fetch events');
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoadingEvents(false);
    }
  }, []);

  // 載入活動資料
  useEffect(() => {
    fetchEvents();

    // 檢查管理員登入狀態
    const authStatus = sessionStorage.getItem('admin-auth');
    const savedRole = sessionStorage.getItem('admin-role') as UserRole | null;
    const savedIsSuperAdmin = sessionStorage.getItem('admin-is-super') === 'true';

    if (authStatus === 'true' && savedRole) {
      setIsAuthenticated(true);
      setRole(savedRole);
      setIsSuperAdmin(savedIsSuperAdmin);
    }
  }, [fetchEvents]);

  // 新增活動
  const addEvent = async (eventData: Omit<HololiveEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<HololiveEvent | null> => {
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: eventData.name,
          artist: eventData.artist,
          eventDate: eventData.eventDate instanceof Date
            ? eventData.eventDate.toISOString().split('T')[0]
            : eventData.eventDate,
          eventEndDate: eventData.eventEndDate instanceof Date
            ? eventData.eventEndDate.toISOString().split('T')[0]
            : eventData.eventEndDate,
          venue: eventData.venue,
          venueAddress: eventData.venueAddress,
          imageUrl: eventData.imageUrl,
          description: eventData.description,
          ticketPriceTiers: eventData.ticketPriceTiers?.map(tier => ({
            seatGrade: tier.seatGrade,
            priceJpy: tier.priceJpy,
          })),
          category: eventData.category,
          currency: eventData.currency || 'JPY',
          isActive: eventData.isActive,
          maxTicketsPerPerson: eventData.maxTicketsPerPerson || 2,
          maxRequestsPerUser: eventData.maxRequestsPerUser || 2,
          discordWebhookUrl: (eventData as { discordWebhookUrl?: string }).discordWebhookUrl,
        }),
      });

      if (response.ok) {
        const data: ApiEvent = await response.json();
        const newEvent = convertApiEventToEvent(data);
        setEvents((prev) => [...prev, newEvent]);
        return newEvent;
      } else {
        const error = await response.json();
        console.error('Failed to create event:', error);
        return null;
      }
    } catch (error) {
      console.error('Error creating event:', error);
      return null;
    }
  };

  // 更新活動
  const updateEvent = async (id: string, updates: Partial<HololiveEvent> & { discordWebhookUrl?: string }) => {
    try {
      // 只發送有定義的欄位，避免意外覆蓋資料
      const payload: Record<string, unknown> = {};

      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.artist !== undefined) payload.artist = updates.artist;
      if (updates.eventDate !== undefined) {
        payload.eventDate = updates.eventDate instanceof Date
          ? updates.eventDate.toISOString().split('T')[0]
          : updates.eventDate;
      }
      if (updates.eventEndDate !== undefined) {
        payload.eventEndDate = updates.eventEndDate instanceof Date
          ? updates.eventEndDate.toISOString().split('T')[0]
          : updates.eventEndDate;
      }
      if (updates.venue !== undefined) payload.venue = updates.venue;
      if (updates.venueAddress !== undefined) payload.venueAddress = updates.venueAddress;
      if (updates.imageUrl !== undefined) payload.imageUrl = updates.imageUrl;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.ticketPriceTiers !== undefined) {
        payload.ticketPriceTiers = updates.ticketPriceTiers.map(tier => ({
          seatGrade: tier.seatGrade,
          priceJpy: tier.priceJpy,
        }));
      }
      if (updates.category !== undefined) payload.category = updates.category;
      if (updates.currency !== undefined) payload.currency = updates.currency;
      if (updates.isActive !== undefined) payload.isActive = updates.isActive;
      if (updates.maxTicketsPerPerson !== undefined) payload.maxTicketsPerPerson = updates.maxTicketsPerPerson;
      if (updates.maxRequestsPerUser !== undefined) payload.maxRequestsPerUser = updates.maxRequestsPerUser;
      if (updates.discordWebhookUrl !== undefined) payload.discordWebhookUrl = updates.discordWebhookUrl;

      const response = await fetch(`/api/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // 重新獲取活動列表以確保資料同步
        await fetchEvents();
      } else {
        const error = await response.json();
        console.error('Failed to update event:', error);
      }
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  // 刪除活動
  const deleteEvent = async (id: string) => {
    try {
      const response = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setEvents((prev) => prev.filter((e) => e.id !== id));
      }
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  // 取得單一活動
  const getEvent = (id: string): HololiveEvent | undefined => {
    return events.find((e) => e.id === id);
  };

  // 登入 - 透過 API 驗證密碼和角色
  const login = async (password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoggingIn(true);
    try {
      const response = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || '驗證失敗' };
      }

      // 設定狀態
      setIsAuthenticated(true);
      setRole(data.role);
      setIsSuperAdmin(data.isSuperAdmin);

      // 儲存到 sessionStorage
      sessionStorage.setItem('admin-auth', 'true');
      sessionStorage.setItem('admin-role', data.role);
      sessionStorage.setItem('admin-is-super', data.isSuperAdmin ? 'true' : 'false');

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: '網路錯誤，請稍後再試' };
    } finally {
      setIsLoggingIn(false);
    }
  };

  // 登出
  const logout = () => {
    setIsAuthenticated(false);
    setRole(null);
    setIsSuperAdmin(false);
    sessionStorage.removeItem('admin-auth');
    sessionStorage.removeItem('admin-role');
    sessionStorage.removeItem('admin-is-super');
  };

  return (
    <AdminContext.Provider
      value={{
        events,
        isLoadingEvents,
        fetchEvents,
        addEvent,
        updateEvent,
        deleteEvent,
        getEvent,
        isAuthenticated,
        isLoggingIn,
        role,
        isSuperAdmin,
        login,
        logout,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
