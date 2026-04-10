# 檢舉系統 (Reports)

## 功能說明
用戶可以檢舉疑似黃牛、詐欺等行為。管理員可在後台查看並處理檢舉案件。

## 檢舉類型 (ReportType)
| 類型 | 值 | 說明 |
|------|---|------|
| 疑似黃牛 | `scalper` | 加價轉售行為 |
| 票券相關 | `ticket_issue` | 票券真偽或問題 |
| 疑似惡意詐欺 | `fraud` | 詐騙行為 |
| 金額交易相關 | `payment_issue` | 付款問題 |

## 檢舉狀態 (ReportStatus)
- `pending` → `investigating` → `resolved` / `dismissed`

## 相關檔案

### API 路由
- `src/app/api/reports/route.ts` — 檢舉 CRUD

### 元件
- `src/components/ui/ReportModal.tsx` — 檢舉對話框

### 管理後台
- `src/app/admin/page.tsx` — 檢舉列表與處理

### 型別
- `src/types/index.ts` — `Report`, `ReportType`, `ReportStatus`

## 資料庫
- 表: `reports`
- 關聯: `reporter_id → users.id`, `reported_user_id → users.id`
