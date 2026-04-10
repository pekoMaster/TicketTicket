# 票票網功能索引總覽 (TicketTicket Features Index)

這是一份票票網的核心功能索引指南，列出了系統中各個模組的主要邏輯路徑與說明文件。在進行特定模組的功能開發與修復前，請**務必詳閱對應的功能說明檔**，以掌握相關前端路由、元件、Context 以及 Supabase 後端資料庫表的關聯。

> **母索引**: 完整專案架構請見根目錄的 [CLAUDE.md](../../CLAUDE.md)

## 核心功能列表

| # | 功能 | 說明文件 | 簡述 |
|---|------|---------|------|
| 1 | 認證與註冊 | [auth.md](auth.md) | 登入、Email/Phone 驗證、Onboarding |
| 2 | 首頁與刊登列表 | [home-listing.md](home-listing.md) | 首頁卡片展示、排序、篩選、無限滾動 |
| 3 | 刊登管理 CRUD | [listing-crud.md](listing-crud.md) | 發布、編輯、詳情頁、同行申請 |
| 4 | 求票系統 | [ticket-request.md](ticket-request.md) | 求票發布、回應、配對 |
| 5 | 聊天與私訊 | [chat.md](chat.md) | 即時訊息、Supabase Realtime |
| 6 | 討論區 | [forum.md](forum.md) | 社群發文、回覆、投票 |
| 7 | 個人中心 | [profile.md](profile.md) | 帳號設定、我的刊登/申請/求票 |
| 8 | 通知系統 | [notifications.md](notifications.md) | 多頻道通知（Email/Discord/LINE）|
| 9 | 管理後台 | [admin.md](admin.md) | 管理員功能、審核、統計 |
| 10 | 多語系 (i18n) | [i18n.md](i18n.md) | 語系切換與翻譯檔架構 |
| 11 | 多幣值 | [currency.md](currency.md) | 幣值切換、匯率換算、CurrencyBadge |
| 12 | 活動管理 | [events.md](events.md) | 活動 CRUD、AI 匯入、票價等級 |
| 13 | 評價系統 | [reviews.md](reviews.md) | 星級評價、自動評價 |
| 14 | 檢舉系統 | [reports.md](reports.md) | 用戶檢舉、管理員審核 |
| 15 | 訂閱 & Webhook | [subscriptions.md](subscriptions.md) | 活動訂閱、Discord Webhook 通知 |
| 16 | 佈局與導覽 | [layout.md](layout.md) | SideNav、BottomNav、MainLayout |

## 快速定位指南

### 我要改價格相關 → [listing-crud.md](listing-crud.md) + [currency.md](currency.md)
### 我要改首頁卡片 → [home-listing.md](home-listing.md)
### 我要改管理後台 → [admin.md](admin.md) + [events.md](events.md)
### 我要改語系翻譯 → [i18n.md](i18n.md)
### 我要改導覽列 → [layout.md](layout.md)
### 我要改通知 → [notifications.md](notifications.md)
