-- 1. Fix Function Search Path Mutable warnings
-- 設置 search_path = '' 避免在執行函數時受到外部變數影響引發安全性風險。
ALTER FUNCTION public.update_ticket_subscriptions_updated_at() SET search_path = '';
ALTER FUNCTION public.update_pubsub_updated_at() SET search_path = '';

-- 2. Fix RLS Policy Always True (notifications)
-- 原本的 Policy 設定對所有的 Insert 都允許 (true)，因為預設角色是 public，所以有安全隱憂。
-- 我們將它限制為只有管理者 (service_role) 能夠新增通知，避免一般人亂塞通知。
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;

CREATE POLICY "Service role can insert notifications" 
ON public.notifications 
FOR INSERT 
TO service_role
WITH CHECK (true);
