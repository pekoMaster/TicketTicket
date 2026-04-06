import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { parseEventWithAI } from '@/lib/event-scraper';

// 管理員 email 列表
const ADMIN_EMAILS = [
  '16861@gm.ncyu.edu.tw',
  'admin@ticketticket.live',
  'lmmlmm16861@gmail.com',
  'pekopekopekopekomura@gmail.com',
  'lmm16861@gmail.com',
];

// POST /api/events/import - 從 URL 匯入活動資料（AI 解析）
export async function POST(request: NextRequest) {
  try {
    // 驗證管理員權限
    const session = await auth();
    if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: '請提供有效的 URL' }, { status: 400 });
    }

    // 驗證 URL 格式
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: '無效的 URL 格式' }, { status: 400 });
    }

    // 抓取網頁內容
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    let htmlText: string;
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TicketTicket/1.0; Event Importer)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,ja;q=0.8,zh-TW;q=0.7',
        },
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        return NextResponse.json(
          { error: `無法取得網頁內容 (HTTP ${response.status})` },
          { status: 502 }
        );
      }

      htmlText = await response.text();
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return NextResponse.json({ error: '網頁請求逾時（15 秒）' }, { status: 504 });
      }
      return NextResponse.json(
        { error: `無法取得網頁: ${fetchError instanceof Error ? fetchError.message : '未知錯誤'}` },
        { status: 502 }
      );
    }

    // 使用 Gemini AI 解析活動資料
    let eventData;
    try {
      eventData = await parseEventWithAI(htmlText, url);
    } catch (aiError) {
      console.error('AI parsing error:', aiError);
      return NextResponse.json(
        { error: `AI 解析失敗: ${aiError instanceof Error ? aiError.message : '未知錯誤'}` },
        { status: 500 }
      );
    }

    // 驗證是否提取到基本資訊
    const warnings: string[] = [];
    if (!eventData.name) warnings.push('未能識別活動名稱，請手動填寫');
    if (!eventData.eventDate) warnings.push('未能識別活動日期，請手動選擇');
    if (!eventData.venue) warnings.push('未能識別場地，請手動填寫');
    if (eventData.ticketPriceTiers.length === 0) warnings.push('未能識別票價資訊，請手動新增');
    
    if (eventData.originalCurrency && eventData.originalCurrency !== 'JPY') {
      warnings.push(`票價為 ${eventData.originalCurrency} 計價，已直接以數值存入。如需轉換為日圓，請手動調整金額。`);
    }

    return NextResponse.json({
      success: true,
      data: eventData,
      warnings,
    });
  } catch (error) {
    console.error('Error in POST /api/events/import:', error);
    return NextResponse.json({ error: '伺服器內部錯誤' }, { status: 500 });
  }
}
