-- =============================================
-- 修復函數 search_path 安全警告
-- =============================================
-- 設定固定的 search_path 防止潛在的搜索路徑注入攻擊
-- 參考: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

-- 1. update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 2. update_user_rating
CREATE OR REPLACE FUNCTION public.update_user_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  UPDATE users
  SET
    rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM reviews
      WHERE reviewee_id = NEW.reviewee_id
    ),
    review_count = (
      SELECT COUNT(*)
      FROM reviews
      WHERE reviewee_id = NEW.reviewee_id
    )
  WHERE id = NEW.reviewee_id;
  RETURN NEW;
END;
$$;

-- 3. update_notifications_updated_at
CREATE OR REPLACE FUNCTION public.update_notifications_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 4. increment_cancellation_count (如果存在)
-- 這個函數可能是直接在資料庫建立的，以下是修復範本
-- 如果函數不存在，此語句會建立它
CREATE OR REPLACE FUNCTION public.increment_cancellation_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  -- 增加取消次數（根據實際邏輯調整）
  UPDATE users
  SET cancellation_count = COALESCE(cancellation_count, 0) + 1
  WHERE id = OLD.guest_id;
  RETURN OLD;
END;
$$;

-- 5. auto_complete_transactions (如果存在)
-- 這個函數可能用於自動完成交易，以下是修復範本
CREATE OR REPLACE FUNCTION public.auto_complete_transactions()
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  -- 自動完成已過期的交易（根據實際邏輯調整）
  UPDATE conversations
  SET status = 'completed'
  WHERE status = 'pending'
    AND created_at < NOW() - INTERVAL '7 days';
END;
$$;

-- =============================================
-- 注意事項
-- =============================================
-- 如果 increment_cancellation_count 或 auto_complete_transactions
-- 函數已存在且邏輯不同，請先在 Supabase 查詢原始定義：
--
-- SELECT pg_get_functiondef(oid)
-- FROM pg_proc
-- WHERE proname = 'increment_cancellation_count';
--
-- 然後用正確的邏輯替換上面的範本。
