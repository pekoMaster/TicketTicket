# 需求分析 - v1.21 (UI 遮擋與語系未翻譯問題)

## 原始需求記錄
- **UI 遮擋問題**：在「發布」介面中，選擇活動後會出現新選項，但當使用者想要回頭修改活動（點選下拉選單）時，選單會被下方的「可接受的方式」UI 區塊擋住。
- **語系翻譯問題**：偏好設定中的「國籍」與「語言」設定仍然顯示為原始 KEY 值（如 "TW", "zh-TW"），未進行人道化呈現。

## 現狀分析

### 1. UI 遮擋問題 (Z-Index Stack Context)
- **原因分析**：
    - `src/app/create/page.tsx` 中的「活動資訊」卡片與「可接受方式」卡片都使用了 `variant="glass"`。
    - `Card.tsx` 的 `glass` 樣式包含 `backdrop-blur-xl`，這會觸發 CSS 的 Stacking Context（層疊上下文）。
    - 在同一個層次中，DOM 順序靠後的元素會蓋過靠前的元素。
    - 儘管 `Select` 元件內部使用了 `z-50`，但它被限制在第一個 `Card` 的層疊上下文中，因此無法蓋過第二個 `Card`。
- **解決方案預想**：
    - 當 `Select` 開啟時，提升其父級 `Card` 的 `z-index`。
    - 或者為 `Select` 導入 `Portal` (如使用 `headless UI` 或 `radix-ui` 的模式)。

### 2. 語系未翻譯問題
- **原因分析**：
    - 多個組件（如 `src/app/request/page.tsx`, `src/app/listing/[id]/page.tsx` 等）可能直接讀取了資料庫傳回的原始值，或使用了錯誤的查表方式。
    - 在 `src/app/request/page.tsx` 中，使用了 `tCommon('nationalities.' + code)` 這種可能不存在的翻譯鍵。
    - 需要統一使用 `NATIONALITY_OPTIONS` 與 `LANGUAGE_OPTIONS` 進行查表顯示。
- **可能遺漏的位置**：
    - `src/app/request/page.tsx` (求票頁面)
    - `src/app/profile/settings/page.tsx` (個人設定，如果有的話)
    - `src/app/listing/[id]/page.tsx` (刊登詳情頁面)
    - `src/components/features/ListingCard.tsx` (刊登卡片)

## 後續步驟
1. [ ] 修正 `Select.tsx` 與發布頁面的層疊順序問題。
2. [ ] 全面檢查並修正國籍與語言的顯示邏輯，確保使用查表標籤。
3. [ ] 完善 `zh-TW.json` 中的翻譯項（如必要）。

## 待提問事項
1. 除了「發布介面」和「求票介面（偏好設定）」，是否還有其他地方看到未翻譯的 KEY 值？
2. 「個人設定」頁面中目前是否也需要顯示或設定國籍與語言？（目前 API 層級似乎尚未整合這兩項到使用者資訊中）
