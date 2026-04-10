# TicketTicket — 專案索引 (Project Index)

> VTuber 粉絲票券同行配對平台。支援多語系、多幣值、即時聊天、求票、論壇等功能。

## 技術棧 (Tech Stack)

| 層級 | 技術 |
|------|------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| DB | Supabase (PostgreSQL) |
| Auth | NextAuth.js (Google OAuth) |
| i18n | next-intl (zh-TW, zh-CN, ja, en) |
| Realtime | Supabase Realtime |
| Deploy | Vercel |
| Email | Resend |
| Misc | Firebase (push), Inngest (background jobs), reCAPTCHA v3 |

---

## 目錄結構 (Directory Structure)

```
TicketTicket/
├── CLAUDE.md                  ← 你正在讀的這個檔案
├── .agent/
│   ├── features/              ← 各功能說明文件 (子 CLAUDE.md)
│   └── workflows/             ← 工作流定義
├── messages/                  ← i18n 翻譯 JSON (zh-TW, zh-CN, ja, en)
├── public/                    ← 靜態資源
├── scripts/                   ← 維運腳本
├── sql/                       ← SQL migration
├── discord-bot/               ← 獨立 Discord Bot 模組
├── src/
│   ├── app/                   ← Next.js App Router 頁面
│   │   ├── _components/       ← 首頁專用元件
│   │   ├── admin/             ← 管理後台頁面
│   │   ├── api/               ← API Routes
│   │   ├── chat/              ← 聊天頁
│   │   ├── create/            ← 發布刊登頁
│   │   ├── forum/             ← 論壇頁
│   │   ├── help/              ← 幫助頁
│   │   ├── legal/             ← 法律條款頁
│   │   ├── listing/[id]/      ← 刊登詳情 + 編輯頁
│   │   ├── login/             ← 登入頁
│   │   ├── messages/          ← 訊息列表頁
│   │   ├── notifications/     ← 通知頁
│   │   ├── profile/           ← 個人中心
│   │   ├── request/           ← 求票頁面
│   │   ├── reviews/           ← 評價頁面
│   │   ├── verify-email/      ← Email 驗證
│   │   └── verify-phone/      ← 電話驗證
│   ├── components/
│   │   ├── admin/             ← 管理後台元件 (EventForm)
│   │   ├── features/          ← 業務邏輯元件 (ListingCard, RequestCard 等)
│   │   ├── layout/            ← 佈局元件 (SideNav, BottomNav, MainLayout)
│   │   ├── onboarding/        ← 新手引導元件
│   │   ├── profile/           ← 個人中心元件 + settings/
│   │   ├── providers/         ← Provider 包裝 (SessionProvider, ReCaptcha)
│   │   └── ui/                ← 通用 UI 元件 (Button, Modal, Avatar 等)
│   ├── contexts/              ← React Context 提供者
│   │   ├── AdminContext.tsx    ← 管理後台全域狀態 (活動 CRUD)
│   │   ├── AppContext.tsx      ← 主應用全域狀態 (listings, events, users)
│   │   ├── CurrencyContext.tsx ← 幣值偏好 + 匯率 + 換算
│   │   ├── LanguageContext.tsx ← 語系切換
│   │   ├── NotificationContext.tsx ← 通知 + 未讀計數
│   │   └── ThemeContext.tsx    ← 深/淺色主題
│   ├── hooks/                 ← 自訂 Hooks
│   ├── i18n/                  ← i18n 設定 (config.ts, request.ts)
│   ├── lib/                   ← 共用工具函數庫
│   │   ├── auth-helpers.ts    ← 認證輔助
│   │   ├── currency.ts        ← 幣值工具 (getCurrencySymbol, formatPrice)
│   │   ├── db-queries.ts      ← Supabase 查詢封裝
│   │   ├── email.ts           ← Resend 郵件模板
│   │   ├── event-scraper.ts   ← AI 活動爬蟲 (Gemini)
│   │   ├── firebase.ts        ← Firebase push notification
│   │   ├── supabase.ts        ← Supabase 客戶端 + 型別映射
│   │   └── subscription-notify.ts ← 訂閱通知邏輯
│   ├── types/
│   │   └── index.ts           ← 所有型別定義 (★ 核心檔案)
│   ├── auth.ts                ← NextAuth 設定
│   └── middleware.ts          ← Next.js 中間件
├── next.config.ts
├── package.json
└── vercel.json
```

---

## 功能索引 (Feature Index)

> 詳細說明文件位於 `.agent/features/` 目錄下，每個檔案對應一個功能模組。

| # | 功能 | 說明文件 | 核心路徑 |
|---|------|---------|---------|
| 1 | 認證與註冊 | [auth.md](.agent/features/auth.md) | `src/auth.ts`, `src/app/login/`, `src/app/verify-*` |
| 2 | 首頁與刊登列表 | [home-listing.md](.agent/features/home-listing.md) | `src/app/page.tsx`, `src/app/_components/`, `src/components/features/Listing*` |
| 3 | 刊登管理 (CRUD) | [listing-crud.md](.agent/features/listing-crud.md) | `src/app/create/`, `src/app/listing/[id]/`, `src/app/api/listings/` |
| 4 | 求票系統 | [ticket-request.md](.agent/features/ticket-request.md) | `src/app/request/`, `src/app/api/requests/`, `src/components/features/Request*` |
| 5 | 聊天與私訊 | [chat.md](.agent/features/chat.md) | `src/app/chat/`, `src/app/messages/`, `src/app/api/conversations/` |
| 6 | 論壇 | [forum.md](.agent/features/forum.md) | `src/app/forum/`, `src/app/api/forum/` |
| 7 | 個人中心 | [profile.md](.agent/features/profile.md) | `src/app/profile/`, `src/components/profile/` |
| 8 | 通知系統 | [notifications.md](.agent/features/notifications.md) | `src/app/notifications/`, `src/contexts/NotificationContext.tsx` |
| 9 | 管理後台 | [admin.md](.agent/features/admin.md) | `src/app/admin/`, `src/components/admin/`, `src/contexts/AdminContext.tsx` |
| 10 | 多語系 (i18n) | [i18n.md](.agent/features/i18n.md) | `src/i18n/`, `messages/`, `src/contexts/LanguageContext.tsx` |
| 11 | 多幣值 | [currency.md](.agent/features/currency.md) | `src/contexts/CurrencyContext.tsx`, `src/lib/currency.ts`, `src/app/api/currency/` |
| 12 | 活動管理 | [events.md](.agent/features/events.md) | `src/app/api/events/`, `src/components/admin/EventForm.tsx` |
| 13 | 評價系統 | [reviews.md](.agent/features/reviews.md) | `src/app/reviews/`, `src/app/api/reviews/`, `src/components/features/Review*` |
| 14 | 檢舉系統 | [reports.md](.agent/features/reports.md) | `src/app/api/reports/`, `src/components/ui/ReportModal.tsx` |
| 15 | 訂閱 & Webhook | [subscriptions.md](.agent/features/subscriptions.md) | `src/app/api/subscriptions/`, `src/app/api/webhooks/` |
| 16 | 佈局與導覽 | [layout.md](.agent/features/layout.md) | `src/components/layout/`, `src/app/layout.tsx` |

---

## 核心命名規則 (Naming Conventions)

### 檔案命名
- **頁面**：`page.tsx`（Next.js App Router 慣例）
- **元件**：PascalCase，例如 `ListingCard.tsx`、`CurrencyBadge.tsx`
- **Context**：PascalCase + `Context` 後綴，例如 `AppContext.tsx`
- **工具函數**：kebab-case，例如 `auth-helpers.ts`、`db-queries.ts`
- **API 路由**：`route.ts`（目錄名即路徑）
- **DESKTOP-MO1D91E 後綴**：為同步衝突產生的副本，**忽略之**

### 型別命名
- **型別**：PascalCase，例如 `CurrencyCode`、`ListingStatus`
- **常數物件**：SCREAMING_SNAKE_CASE，例如 `CURRENCY_INFO`、`TICKET_SOURCE_INFO`
- **型別 + Info 映射**：`Record<SomeType, { label, color, ... }>`

### 資料庫欄位
- **DB (Supabase)**：snake_case，例如 `event_name`、`asking_price_jpy`
- **前端型別**：camelCase，例如 `eventName`、`askingPriceJpy`
- **映射函數**：定義在 `AppContext.tsx` 和 `AdminContext.tsx` 中

### 重要命名例外
- `priceJpy` / `askingPriceJpy` / `originalPriceJpy` — 名稱含 "Jpy" 但實際幣值由活動的 `currency` 欄位決定。保留原名以避免大規模重構。

---

## Context Provider 層級 (Provider Hierarchy)

```
NextIntlClientProvider
  └── SessionProvider
        └── ReCaptchaProvider
              └── ThemeProvider
                    └── LanguageProvider
                          └── CurrencyProvider
                                └── AppProvider
                                      └── AdminProvider
                                            └── NotificationProvider
                                                  └── MainLayout
```

定義於 `src/app/layout.tsx`。

---

## API 路由清單 (API Routes)

| 路徑 | 方法 | 用途 |
|------|------|------|
| `/api/auth/*` | - | NextAuth 認證 |
| `/api/events` | GET, POST | 活動列表 / 新增 |
| `/api/events/[id]` | GET, PATCH, DELETE | 活動詳情 / 更新 / 刪除 |
| `/api/events/import` | POST | AI 活動匯入 (Gemini) |
| `/api/listings` | GET, POST | 刊登列表 / 新增 |
| `/api/listings/[id]` | GET, PATCH, DELETE | 刊登詳情 / 更新 / 刪除 |
| `/api/applications/*` | - | 同行申請 |
| `/api/requests/*` | - | 求票系統 |
| `/api/conversations/*` | - | 聊天對話 |
| `/api/currency/rates` | GET | 匯率 (open.er-api.com, 12h cache) |
| `/api/forum/*` | - | 論壇 |
| `/api/notifications/*` | - | 通知 |
| `/api/profile/*` | - | 個人資料 |
| `/api/reports/*` | - | 檢舉 |
| `/api/reviews/*` | - | 評價 |
| `/api/subscriptions/*` | - | 活動訂閱 |
| `/api/webhooks/*` | - | Discord Webhook |
| `/api/translate` | POST | AI 翻譯 (Gemini) |
| `/api/recaptcha` | POST | reCAPTCHA 驗證 |

---

## Supabase 核心表 (Database Tables)

| 表名 | 用途 | 關鍵欄位 |
|------|------|---------|
| `users` | 用戶 | id, username, email, role, verification_level |
| `events` | 活動 | id, name, artist, event_date, venue, currency, ticket_price_tiers |
| `listings` | 刊登 | id, host_id, event_name, asking_price_jpy, original_price_jpy, status |
| `applications` | 同行申請 | id, listing_id, guest_id, status |
| `conversations` | 對話 | id, listing_id |
| `messages` | 訊息 | id, conversation_id, sender_id, content |
| `reviews` | 評價 | id, reviewer_id, reviewee_id, rating |
| `reports` | 檢舉 | id, reporter_id, reported_user_id, report_type |
| `ticket_requests` | 求票 | id, user_id, event_name, accepted_types |
| `request_applications` | 求票回應 | id, request_id, applicant_id |
| `forum_topics` | 論壇主題 | id, author_id, category, title |
| `forum_replies` | 論壇回覆 | id, topic_id, author_id |
| `notifications` | 通知 | id, user_id, type, message |
| `user_discord_webhooks` | Discord Webhook | id, user_id, webhook_url |

---

## 開發規範 (Development Rules)

1. **修改前必讀**：進行任何功能修改前，先查閱 `.agent/features/` 對應的功能文件
2. **工作流**：
   - 收到新需求 → 觸發 `/analyze-request`
   - 修改完成後 → 觸發 `/post-mod-check`（語系檢查 + 版本號）
3. **語系**：所有面向用戶的文字必須使用 `next-intl` 翻譯鍵，翻譯檔位於 `messages/`
4. **版本號**：更新於 `SideNav.tsx` (v字串) 和 `package.json`
5. **環境變數**：定義於 `.env.local`，範本在 `.env.example`
6. **部署**：`git push` → Vercel 自動部署

---

## 當前版本

**v1.29**
