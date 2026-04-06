# 活動匯入功能 (Event Import)

## 概述
管理後台「從 URL 匯入活動」功能，自動解析 hololive 官方活動頁面並填入 EventForm。

## 關聯檔案
- `src/lib/event-scraper.ts` — 解析引擎（名稱、日期、場地、票價提取）
- `src/app/api/events/import/route.ts` — POST /api/events/import API
- `src/app/admin/events/new/page.tsx` — 新增活動頁面（含匯入 Modal + prefill 邏輯）
- `scripts/test-scraper.ts` — 解析器測試腳本

## 資料流
```
URL → API fetch → parseEventFromHtml() → ScrapedEventData → EventForm(initialData)
```

## 支援格式
- 英文月份日期：July 03 – July 04, 2026
- USD 票價：Front ORCHESTRA & LOGE : 225 USD
- JPY 票價：¥10,000 円
- 場地：at the XXX in YYY

## 版本
- v1.29 新增
