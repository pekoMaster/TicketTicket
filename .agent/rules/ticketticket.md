---
trigger: always_on
glob: 
description: 票票網全域代理規則 (Global Rules)
---

# 票票網開發守則 (TicketTicket Development Rules)

1. **功能索引機制 (Feature Indexing)**
   - 必須針對整個票票網的功能建立索引。
   - 每個功能的程式碼說明與關聯檔案，都必須獨立記錄在個別的文件中（請將這些說明文件統一建立於 `.agent/features/` 目錄下）。
   - 在進行任何功能的修改或擴充前，請先查閱對應的功能說明文件。

2. **工作流整合 (Workflow Integration)**
   - 收到新需求時，必定觸發 `/analyze-request` 工作流。
   - 程式碼修改完成後，必定觸發 `/post-mod-check` 工作流。
