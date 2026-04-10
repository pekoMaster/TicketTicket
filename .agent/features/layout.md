# 佈局與導覽 (Layout & Navigation)

## 功能說明
定義全站的佈局結構，包含側邊導覽（桌面）、底部導覽（手機）、頂部標題列等。

## 佈局層級
```
RootLayout (layout.tsx)
  └── MainLayout
        ├── Header (手機頂部)
        ├── SideNav (桌面左側 w-64, lg:flex)
        ├── BottomNav (手機底部, lg:hidden)
        └── {children} (頁面內容)
```

## 相關檔案

### 佈局元件
- `src/components/layout/MainLayout.tsx` — 主佈局包裝器
- `src/components/layout/SideNav.tsx` — 桌面側邊欄（含導覽項目、Language/Currency Switcher、Discord 連結、版本號）
- `src/components/layout/BottomNav.tsx` — 手機底部導覽列（5 項：首頁、通知、發布、訊息、個人）
- `src/components/layout/Header.tsx` — 手機頂部標題列
- `src/components/layout/LegalFooter.tsx` — 法律條款頁尾
- `src/components/layout/DisclaimerModal.tsx` — 免責聲明彈窗
- `src/components/layout/LanguageModal.tsx` — 語言選擇彈窗

### 根佈局
- `src/app/layout.tsx` — Provider 層級定義、metadata、viewport

### 全域樣式
- `src/app/globals.css` — 全域 CSS（含 Tailwind 指令、自訂動畫）

## Provider 層級（定義於 layout.tsx）
```
NextIntlClientProvider → SessionProvider → ReCaptchaProvider → ThemeProvider
  → LanguageProvider → CurrencyProvider → AppProvider → AdminProvider
    → NotificationProvider → MainLayout
```

## 導覽項目

### SideNav（桌面，7 項）
| 路徑 | 標籤 key | 圖示 | 備註 |
|------|---------|------|------|
| `/` | nav.home | Home | |
| `/create` | nav.create | PlusCircle | data-tutorial |
| `/notifications` | notifications.title | Bell | 未讀紅點 |
| `/messages` | nav.messages | MessageCircle | 未讀計數 |
| `/forum` | nav.forum | MessageSquare | |
| `/profile` | nav.profile | User | |
| `/help` | nav.help | HelpCircle | |

### BottomNav（手機，5 項）
| 路徑 | 標籤 key | 圖示 |
|------|---------|------|
| `/` | nav.home | Home |
| `/notifications` | notifications.title | Bell |
| `/create` | nav.create | PlusCircle |
| `/messages` | nav.messages | MessageCircle |
| `/profile` | nav.profile | User |

### SideNav Footer
- `LanguageSwitcher` — 語系切換按鈕
- `CurrencySwitcher` — 幣值切換按鈕
- Discord 連結
- 版本號顯示 (v1.29)

## 隱藏規則
- 聊天頁 (`/chat`) 隱藏 SideNav 和 BottomNav

## 版本號位置
- `SideNav.tsx` 行內 v 字串（2 處）
- `package.json` version 欄位

## 依賴
- `useNotification()` — 未讀計數
- `LanguageSwitcher` — from `src/components/ui/LanguageSwitcher.tsx`
- `CurrencySwitcher` — from `src/components/ui/CurrencySwitcher.tsx`
