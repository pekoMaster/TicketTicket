-- ===========================================
-- 論壇功能資料庫結構
-- Forum Feature Database Schema
-- ===========================================

-- 主題表 (Topics)
CREATE TABLE IF NOT EXISTS forum_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('bug', 'feature', 'question', 'discussion')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  
  -- 狀態
  is_pinned BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  
  -- 統計
  view_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  
  -- 時間戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 回覆表 (Replies)
CREATE TABLE IF NOT EXISTS forum_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES forum_topics(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  
  -- 統計
  like_count INTEGER DEFAULT 0,
  
  -- 時間戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 按讚表 (Likes) - 支援主題和回覆
CREATE TABLE IF NOT EXISTS forum_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES forum_topics(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 確保每個用戶對每個目標只能按一次讚
  CONSTRAINT unique_topic_like UNIQUE (user_id, topic_id),
  CONSTRAINT unique_reply_like UNIQUE (user_id, reply_id),
  -- 確保 topic_id 或 reply_id 至少有一個
  CONSTRAINT like_target_check CHECK (
    (topic_id IS NOT NULL AND reply_id IS NULL) OR 
    (topic_id IS NULL AND reply_id IS NOT NULL)
  )
);

-- 投票表 (Polls) - 可選功能
CREATE TABLE IF NOT EXISTS forum_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES forum_topics(id) ON DELETE CASCADE UNIQUE,
  question TEXT NOT NULL,
  is_multiple_choice BOOLEAN DEFAULT FALSE,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 投票選項表
CREATE TABLE IF NOT EXISTS forum_poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES forum_polls(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  vote_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 投票記錄表
CREATE TABLE IF NOT EXISTS forum_poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES forum_polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES forum_poll_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 單選時確保每個用戶只能投一票
  CONSTRAINT unique_single_vote UNIQUE (poll_id, user_id)
);

-- ===========================================
-- 索引 (Indexes)
-- ===========================================

CREATE INDEX IF NOT EXISTS idx_forum_topics_author ON forum_topics(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_topics_category ON forum_topics(category);
CREATE INDEX IF NOT EXISTS idx_forum_topics_created ON forum_topics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_topics_pinned ON forum_topics(is_pinned DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_forum_replies_topic ON forum_replies(topic_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_author ON forum_replies(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_created ON forum_replies(created_at);

CREATE INDEX IF NOT EXISTS idx_forum_likes_topic ON forum_likes(topic_id);
CREATE INDEX IF NOT EXISTS idx_forum_likes_reply ON forum_likes(reply_id);
CREATE INDEX IF NOT EXISTS idx_forum_likes_user ON forum_likes(user_id);

-- ===========================================
-- RLS 政策 (Row Level Security)
-- ===========================================

ALTER TABLE forum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_poll_votes ENABLE ROW LEVEL SECURITY;

-- 主題: 公開可讀，登入用戶可寫，作者可改，管理員可刪
CREATE POLICY "Topics are publicly readable" ON forum_topics
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create topics" ON forum_topics
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their topics" ON forum_topics
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Admins can delete topics" ON forum_topics
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- 回覆: 公開可讀，登入用戶可寫，作者可改，管理員可刪
CREATE POLICY "Replies are publicly readable" ON forum_replies
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create replies" ON forum_replies
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their replies" ON forum_replies
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Admins can delete replies" ON forum_replies
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- 按讚: 公開可讀，用戶管理自己的讚
CREATE POLICY "Likes are publicly readable" ON forum_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their likes" ON forum_likes
  FOR ALL USING (auth.uid() = user_id);

-- 投票: 公開可讀
CREATE POLICY "Polls are publicly readable" ON forum_polls
  FOR SELECT USING (true);

CREATE POLICY "Poll options are publicly readable" ON forum_poll_options
  FOR SELECT USING (true);

CREATE POLICY "Poll votes are publicly readable" ON forum_poll_votes
  FOR SELECT USING (true);

CREATE POLICY "Users can vote" ON forum_poll_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
