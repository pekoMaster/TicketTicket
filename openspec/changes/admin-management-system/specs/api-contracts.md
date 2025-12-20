# API 規格

## 認證
所有管理員 API 需要管理員密碼驗證（使用現有 AdminContext）。

---

## 刊登管理 API

### GET /api/admin/listings
取得刊登列表（分頁、搜尋、篩選）

**Query Parameters:**
| 參數 | 類型 | 說明 |
|------|------|------|
| page | number | 頁碼（預設 1） |
| limit | number | 每頁數量（預設 20） |
| search | string | 搜尋關鍵字（活動名稱、主辦方暱稱） |
| status | string | 狀態篩選（open/matched/closed） |
| sortBy | string | 排序欄位（created_at/event_date） |
| sortOrder | string | 排序方向（asc/desc） |

**Response:**
```typescript
{
  listings: {
    id: string;
    event_name: string;
    event_date: string;
    status: string;
    host: {
      id: string;
      username: string;
      email: string;
    };
    total_slots: number;
    available_slots: number;
    applications_count: number;
    created_at: string;
  }[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

---

### PUT /api/admin/listings/[id]
強制編輯刊登

**Request Body:**
```typescript
{
  updates: {
    event_name?: string;
    description?: string;
    meeting_location?: string;
    meeting_time?: string;
    status?: 'open' | 'matched' | 'closed';
  };
  notify: boolean;          // 是否通知相關用戶
  notifyMessage?: string;   // 通知內容
}
```

**Response:**
```typescript
{
  success: boolean;
  listing: Listing;
  notifiedUsers: number;    // 通知的用戶數量
}
```

---

### DELETE /api/admin/listings/[id]
強制移除刊登

**Request Body:**
```typescript
{
  reason: string;           // 移除原因
  notify: boolean;          // 是否通知相關用戶
  notifyMessage?: string;   // 通知內容（預設使用 reason）
}
```

**Response:**
```typescript
{
  success: boolean;
  notifiedUsers: number;
}
```

---

## 會員管理 API

### GET /api/admin/users
取得會員列表

**Query Parameters:**
| 參數 | 類型 | 說明 |
|------|------|------|
| page | number | 頁碼（預設 1） |
| limit | number | 每頁數量（預設 20） |
| search | string | 搜尋關鍵字（暱稱、Email） |
| isBlacklisted | boolean | 只顯示黑名單用戶 |

**Response:**
```typescript
{
  users: {
    id: string;
    username: string;
    email: string;
    avatar_url: string | null;
    custom_avatar_url: string | null;
    rating: number;
    review_count: number;
    listings_count: number;
    is_blacklisted: boolean;
    created_at: string;
  }[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

---

### PUT /api/admin/users/[id]
更新會員資料

**Request Body:**
```typescript
{
  username?: string;
  custom_avatar_url?: string | null;  // null 表示移除頭像
  notify?: boolean;
  notifyMessage?: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  user: User;
}
```

---

### POST /api/admin/users/[id]/blacklist
加入黑名單

**Request Body:**
```typescript
{
  reason: string;
}
```

**Response:**
```typescript
{
  success: boolean;
}
```

---

### DELETE /api/admin/users/[id]/blacklist
移出黑名單

**Response:**
```typescript
{
  success: boolean;
}
```

---

## 通知 API

### POST /api/admin/notify
發送系統通知給用戶

**Request Body:**
```typescript
{
  userIds: string[];        // 要通知的用戶 ID 列表
  listingId?: string;       // 相關刊登 ID（用於建立/找到對話）
  messageType: SystemMessageType;
  content: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  notifiedCount: number;
}
```
