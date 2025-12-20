# 資料模型規格

## 黑名單 (Blacklist)

```typescript
interface Blacklist {
  id: string;
  email: string;           // Google 帳號 Email
  reason: string;          // 封鎖原因
  created_at: Date;        // 封鎖時間
  created_by: string;      // 操作管理員（目前固定為 'admin'）
}
```

### SQL Schema
```sql
CREATE TABLE blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT DEFAULT 'admin'
);

CREATE INDEX idx_blacklist_email ON blacklist(email);
```

### 需求
- Blacklist.email SHALL 為唯一值
- Blacklist.email SHALL 為有效的 Email 格式
- Blacklist.reason SHALL NOT 為空字串

---

## 管理員操作日誌 (AdminLog)

```typescript
interface AdminLog {
  id: string;
  action_type: AdminActionType;
  target_type: 'listing' | 'user' | 'blacklist';
  target_id: string;
  details: Record<string, unknown>;  // JSON 格式的詳細資訊
  created_at: Date;
}

type AdminActionType =
  | 'listing_edit'      // 編輯刊登
  | 'listing_delete'    // 刪除刊登
  | 'user_edit'         // 編輯用戶
  | 'user_blacklist'    // 加入黑名單
  | 'user_unblacklist'; // 移出黑名單
```

### SQL Schema
```sql
CREATE TABLE admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_admin_logs_created_at ON admin_logs(created_at DESC);
CREATE INDEX idx_admin_logs_target ON admin_logs(target_type, target_id);
```

### 需求
- AdminLog.details SHALL 包含操作前後的差異（如適用）
- AdminLog.details SHALL 包含是否發送通知的記錄

---

## 系統訊息擴展

現有 `messages` 表新增欄位：

```sql
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_system_message BOOLEAN DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS system_message_type TEXT DEFAULT NULL;
```

### 系統訊息類型
```typescript
type SystemMessageType =
  | 'admin_listing_edited'   // 管理員編輯了刊登
  | 'admin_listing_deleted'  // 管理員刪除了刊登
  | 'admin_user_edited';     // 管理員編輯了用戶資料
```
