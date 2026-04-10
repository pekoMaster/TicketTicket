# 討論區 (Forum)

## 功能說明
社群討論區，用戶可以發文、回覆、按讚、投票。支援分類篩選和置頂。

## 文章分類 (ForumCategory)
| 分類 | 值 | 圖示 |
|------|---|------|
| Bug 回報 | `bug` | 🐛 |
| 功能建議 | `feature` | 💡 |
| 使用問題 | `question` | ❓ |
| 一般討論 | `discussion` | 💬 |

## 相關檔案

### 前端頁面
- `src/app/forum/page.tsx` — 論壇列表
- `src/app/forum/[id]/page.tsx` — 文章詳情 + 回覆
- `src/app/forum/create/page.tsx` — 發文頁

### API 路由
- `src/app/api/forum/route.ts` — 文章 CRUD
- `src/app/api/forum/[id]/route.ts` — 文章詳情
- `src/app/api/forum/[id]/replies/route.ts` — 回覆 CRUD
- `src/app/api/forum/[id]/like/route.ts` — 按讚

### 型別
- `src/types/index.ts` — `ForumTopic`, `ForumReply`, `ForumPoll`, `ForumPollOption`, `ForumLike`, `ForumCategory`, `ForumAuthor`

## 資料庫
- 表: `forum_topics`, `forum_replies`, `forum_likes`, `forum_polls`, `forum_poll_options`, `forum_poll_votes`
