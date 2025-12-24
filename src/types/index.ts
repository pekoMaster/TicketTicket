// 用戶角色
export type UserRole = 'user' | 'sub_admin' | 'super_admin';

// 角色層級（用於權限比較）
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 1,
  sub_admin: 2,
  super_admin: 3,
};

// 驗證層級
// unverified: 未驗證（剛註冊）
// applicant: 已驗證 Email（可申請同行）
// host: 已驗證電話（可發布活動）
export type VerificationLevel = 'unverified' | 'applicant' | 'host';

// 驗證層級資訊
export const VERIFICATION_LEVEL_INFO: Record<VerificationLevel, {
  label: string;
  description: string;
  color: string;
}> = {
  unverified: {
    label: '未驗證',
    description: '請驗證 Email 以使用完整功能',
    color: 'bg-gray-100 text-gray-800',
  },
  applicant: {
    label: '申請者',
    description: '可申請同行，驗證電話後可發布活動',
    color: 'bg-blue-100 text-blue-800',
  },
  host: {
    label: '主辦方',
    description: '已完成所有驗證，可發布活動',
    color: 'bg-green-100 text-green-800',
  },
};

// 用戶型別
export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;                   // 用戶角色
  verificationLevel: VerificationLevel;  // 驗證層級
  avatarUrl?: string;
  customAvatarUrl?: string;        // 用戶上傳的自訂頭像
  rating: number;
  reviewCount: number;
  createdAt: Date;
  isVerified: boolean;             // 舊欄位，向後相容
  // 驗證時間
  emailVerifiedAt?: Date;
  phoneVerifiedAt?: Date;
  // 聯絡資料
  phoneCountryCode?: string;
  phoneNumber?: string;
  // 連結帳號
  lineId?: string;
  discordId?: string;
  showLine?: boolean;
  showDiscord?: boolean;
}

// 常用國碼選項
export const PHONE_COUNTRY_CODES = [
  { value: '+81', label: '+81', country: '日本' },
  { value: '+886', label: '+886', country: '台灣' },
  { value: '+852', label: '+852', country: '香港' },
  { value: '+86', label: '+86', country: '中國' },
  { value: '+82', label: '+82', country: '韓國' },
  { value: '+1', label: '+1', country: '美國/加拿大' },
  { value: '+60', label: '+60', country: '馬來西亞' },
  { value: '+65', label: '+65', country: '新加坡' },
  { value: '+62', label: '+62', country: '印尼' },
  { value: '+66', label: '+66', country: '泰國' },
  { value: '+63', label: '+63', country: '菲律賓' },
  { value: '+61', label: '+61', country: '澳洲' },
  { value: '+44', label: '+44', country: '英國' },
];

// 票券類型（新版）
// find_companion: 尋找同行者（可選擇協助入場）
// sub_ticket_transfer: 子票轉讓（須確認對方持有且可啟用ZAIKO）
// ticket_exchange: 換票（與其他用戶交換票券）
export type TicketType = 'find_companion' | 'sub_ticket_transfer' | 'ticket_exchange';

// 票源類型
// zaiko: ZAIKO 電子票券系統（支援子票）
// lawson: LAWSON 便利商店購票（不支援子票）
export type TicketSource = 'zaiko' | 'lawson';

// 票源資訊
export const TICKET_SOURCE_INFO: Record<TicketSource, {
  label: string;
  color: string;
  darkColor: string;
}> = {
  zaiko: {
    label: 'ZAIKO',
    color: 'bg-blue-100 text-blue-800',
    darkColor: 'dark:bg-blue-900/30 dark:text-blue-300',
  },
  lawson: {
    label: 'LAWSON',
    color: 'bg-green-100 text-green-800',
    darkColor: 'dark:bg-green-900/30 dark:text-green-300',
  },
};

// 座位等級（改為動態字串，由管理員自訂）
export type SeatGrade = string;

// 票種類型（移除家庭票）
export type TicketCountType = 'solo' | 'duo';

// 刊登狀態
export type ListingStatus = 'open' | 'matched' | 'closed';


// 票券刊登
export interface Listing {
  id: string;
  hostId: string;
  eventName: string;
  artistTags: string[];                     // 藝人/團體標籤
  eventDate: Date;
  venue: string;
  meetingTime: Date;
  meetingLocation: string;
  totalSlots: number;
  availableSlots: number;
  ticketSource: TicketSource;               // 票源 (ZAIKO/LAWSON)
  ticketType: TicketType;
  seatGrade: SeatGrade;                    // 座位等級
  ticketCountType: TicketCountType;        // 票種類型
  hostNationality: string;                 // 持票人國籍
  hostLanguages: string[];                 // 可使用語言
  identificationFeatures: string;          // 辨識特徵（穿著等）
  willAssistEntry?: boolean;               // 是否協助入場（同行者選項）
  status: ListingStatus;
  description?: string;                    // 其他注意事項
  // 換票專用欄位
  exchangeEventName?: string;              // 想換的活動名稱
  exchangeSeatGrade?: string;              // 舊欄位，向後相容
  exchangeSeatGrades?: string[];           // 想換的座位等級（複選）
  createdAt: Date;
  updatedAt: Date;
  host?: User;                             // 刊登者資訊（從 API 載入時附帶）
}

// 申請狀態
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

// 配對申請
export interface Application {
  id: string;
  listingId: string;
  guestId: string;
  status: ApplicationStatus;
  message?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 聊天訊息
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: Date;
  isRead: boolean;
}

// 評價
export interface Review {
  id: string;
  reviewerId: string;
  revieweeId: string;
  listingId: string;
  rating: number;
  comment?: string;
  createdAt: Date;
}

// HOLOLIVE 活動類型
export type EventCategory = 'concert' | 'fan_meeting' | 'expo' | 'streaming' | 'other';

// 票種等級（用於管理員設定可用的座位/票種組合）
export interface TicketPriceTier {
  seatGrade: SeatGrade;
  ticketCountType: TicketCountType;
  priceJpy?: number; // 原價（日圓）
}

// HOLOLIVE 活動
export interface HololiveEvent {
  id: string;
  name: string;                    // 活動名稱
  artist: string;                  // 藝人/團體（如：星街すいせい、hololive）
  eventDate: Date;                 // 活動日期
  eventEndDate?: Date;             // 活動結束日（多日活動）
  venue: string;                   // 場地
  venueAddress?: string;           // 場地地址
  imageUrl?: string;               // 活動圖片 URL
  description?: string;            // 活動描述
  ticketPriceTiers: TicketPriceTier[];  // 票價等級列表
  category: EventCategory;
  isActive: boolean;               // 是否啟用顯示
  maxListingsPerUser: number;      // 每帳號最多可創建刊登數量
  createdAt: Date;
  updatedAt: Date;
}

// 活動分類資訊
export const EVENT_CATEGORY_INFO: Record<EventCategory, {
  label: string;
  color: string;
}> = {
  concert: {
    label: '演唱會',
    color: 'bg-purple-100 text-purple-800',
  },
  fan_meeting: {
    label: '粉絲見面會',
    color: 'bg-pink-100 text-pink-800',
  },
  expo: {
    label: '展覽活動',
    color: 'bg-blue-100 text-blue-800',
  },
  streaming: {
    label: '線上直播',
    color: 'bg-green-100 text-green-800',
  },
  other: {
    label: '其他',
    color: 'bg-gray-100 text-gray-800',
  },
};

// 票券類型資訊（新版）
export const TICKET_TYPE_INFO: Record<TicketType, {
  label: string;
  description: string;
  warning?: string;
  color: string;
}> = {
  find_companion: {
    label: '尋找同行者',
    description: '尋找一起入場的夥伴，費用均攤',
    warning: '使用母票協助他人也請確認本人能到',
    color: 'bg-blue-100 text-blue-800',
  },
  sub_ticket_transfer: {
    label: '子票轉讓',
    description: '轉讓子票，對方需持有並可啟用 ZAIKO',
    warning: '請確認對方已安裝 ZAIKO 並可接收票券',
    color: 'bg-green-100 text-green-800',
  },
  ticket_exchange: {
    label: '換票',
    description: '與其他用戶交換票券',
    warning: '需選擇想換的活動和票種',
    color: 'bg-orange-100 text-orange-800',
  },
};

// 座位等級資訊（預設，用於顯示顏色）
// 由於座位等級現在是動態字串，使用函數取得標籤
export const DEFAULT_SEAT_GRADE_COLORS: Record<string, string> = {
  B: 'bg-gray-100 text-gray-800',
  A: 'bg-blue-100 text-blue-800',
  S: 'bg-purple-100 text-purple-800',
  SS: 'bg-yellow-100 text-yellow-800',
};

// 取得座位等級顯示標籤
export function getSeatGradeLabel(grade: string): string {
  return grade; // 直接返回等級名稱
}

// 取得座位等級顏色
export function getSeatGradeColor(grade: string): string {
  return DEFAULT_SEAT_GRADE_COLORS[grade] || 'bg-indigo-100 text-indigo-800';
}

// 向後相容：SEAT_GRADE_INFO（已廢棄，請使用 getSeatGradeLabel 和 getSeatGradeColor）
export const SEAT_GRADE_INFO: Record<string, { label: string; color: string }> = {
  B: { label: 'B', color: 'bg-gray-100 text-gray-800' },
  A: { label: 'A', color: 'bg-blue-100 text-blue-800' },
  S: { label: 'S', color: 'bg-purple-100 text-purple-800' },
  SS: { label: 'SS', color: 'bg-yellow-100 text-yellow-800' },
};

// 票種類型資訊（移除家庭票）
export const TICKET_COUNT_TYPE_INFO: Record<TicketCountType, {
  label: string;
  description: string;
  color: string;
}> = {
  solo: { label: '一人票', description: '單人入場', color: 'bg-green-100 text-green-800' },
  duo: { label: '二人票', description: '雙人同行', color: 'bg-blue-100 text-blue-800' },
};

// 常用國籍選項
export const NATIONALITY_OPTIONS = [
  { value: 'TW', label: '台灣 Taiwan' },
  { value: 'JP', label: '日本 Japan' },
  { value: 'HK', label: '香港 Hong Kong' },
  { value: 'CN', label: '中國 China' },
  { value: 'KR', label: '韓國 Korea' },
  { value: 'US', label: '美國 USA' },
  { value: 'MY', label: '馬來西亞 Malaysia' },
  { value: 'SG', label: '新加坡 Singapore' },
  { value: 'ID', label: '印尼 Indonesia' },
  { value: 'TH', label: '泰國 Thailand' },
  { value: 'PH', label: '菲律賓 Philippines' },
  { value: 'AU', label: '澳洲 Australia' },
  { value: 'UK', label: '英國 UK' },
  { value: 'OTHER', label: '其他 Other' },
];

// 常用語言選項
export const LANGUAGE_OPTIONS = [
  { value: 'zh-TW', label: '繁體中文' },
  { value: 'zh-CN', label: '簡體中文' },
  { value: 'ja', label: '日本語' },
  { value: 'en', label: 'English' },
  { value: 'ko', label: '한국어' },
  { value: 'id', label: 'Bahasa Indonesia' },
  { value: 'th', label: 'ภาษาไทย' },
  { value: 'vi', label: 'Tiếng Việt' },
];

// 價格計算工具
export function calculateMaxPrice(originalPriceJPY: number, totalSlots: number): number {
  return Math.round(originalPriceJPY / totalSlots);
}

export function validatePrice(askingPrice: number, maxPrice: number): boolean {
  return askingPrice <= maxPrice;
}

// 檢舉類型
export type ReportType = 'scalper' | 'ticket_issue' | 'fraud' | 'payment_issue';

// 檢舉狀態
export type ReportStatus = 'pending' | 'investigating' | 'resolved' | 'dismissed';

// 檢舉
export interface Report {
  id: string;
  reporterId: string;
  reportedUserId: string;
  conversationId?: string;
  listingId?: string;
  reportType: ReportType;
  reason: string;
  status: ReportStatus;
  adminNotes?: string;
  resolvedBy?: string;
  createdAt: string;
  resolvedAt?: string;
  // 關聯資料（從 API 載入時附帶）
  reporter?: User;
  reportedUser?: User;
}

// 檢舉類型資訊
export const REPORT_TYPE_INFO: Record<ReportType, {
  label: string;
  color: string;
}> = {
  scalper: { label: '疑似黃牛', color: 'bg-red-100 text-red-800' },
  ticket_issue: { label: '票券相關', color: 'bg-orange-100 text-orange-800' },
  fraud: { label: '疑似惡意詐欺', color: 'bg-purple-100 text-purple-800' },
  payment_issue: { label: '金額交易相關', color: 'bg-yellow-100 text-yellow-800' },
};

// 檢舉狀態資訊
export const REPORT_STATUS_INFO: Record<ReportStatus, {
  label: string;
  color: string;
}> = {
  pending: { label: '待處理', color: 'bg-yellow-100 text-yellow-800' },
  investigating: { label: '處理中', color: 'bg-blue-100 text-blue-800' },
  resolved: { label: '已解決', color: 'bg-green-100 text-green-800' },
  dismissed: { label: '已駁回', color: 'bg-gray-100 text-gray-800' },
};
