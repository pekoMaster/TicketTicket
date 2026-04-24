import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { parseEventWithAI } from '@/lib/event-scraper';

// Vercel 函數最長執行時間（秒）
// 此 route 最壞情況需要輪調所有 Gemini 模型，故拉長至 5 分鐘
// 需要 Vercel Pro/Team 方案；Hobby 限制為 60 秒，升級後自動生效
export const maxDuration = 300;

// 管理員 email 列表
const ADMIN_EMAILS = [
  '16861@gm.ncyu.edu.tw',
  'admin@ticketticket.live',
  'lmmlmm16861@gmail.com',
  'pekopekopekopekomura@gmail.com',
  'lmm16861@gmail.com',
];

/**
 * 取得最新匯率（使用免費 API）
 * 回傳：1 單位外幣 = ? 日圓
 */
async function getExchangeRate(fromCurrency: string): Promise<{ rate: number; source: string } | null> {
  if (fromCurrency === 'JPY') return { rate: 1, source: 'N/A' };

  // 嘗試多個免費匯率 API
  const apis = [
    {
      url: `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`,
      parse: (data: Record<string, unknown>) => {
        const rates = data.rates as Record<string, number>;
        return rates?.JPY;
      },
      source: 'exchangerate-api.com',
    },
    {
      url: `https://open.er-api.com/v6/latest/${fromCurrency}`,
      parse: (data: Record<string, unknown>) => {
        const rates = data.rates as Record<string, number>;
        return rates?.JPY;
      },
      source: 'open.er-api.com',
    },
  ];

  for (const api of apis) {
    try {
      const res = await fetch(api.url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) continue;
      const data = await res.json();
      const rate = api.parse(data);
      if (rate && rate > 0) {
        return { rate, source: api.source };
      }
    } catch {
      continue;
    }
  }

  return null;
}

// POST /api/events/import - 從 URL 匯入活動資料（AI 解析 + 匯率自動換算）
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

    // 抓取網頁內容（30 秒內必須取得原始 HTML）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

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
        return NextResponse.json({ error: '網頁請求逾時（30 秒）' }, { status: 504 });
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

    // 匯率自動換算
    let exchangeInfo: { rate: number; source: string; currency: string; date: string } | null = null;

    if (eventData.originalCurrency && eventData.originalCurrency !== 'JPY' && eventData.ticketPriceTiers.length > 0) {
      const exchangeResult = await getExchangeRate(eventData.originalCurrency);

      if (exchangeResult) {
        const { rate, source } = exchangeResult;
        const today = new Date().toISOString().split('T')[0];

        exchangeInfo = {
          rate,
          source,
          currency: eventData.originalCurrency,
          date: today,
        };

        // 換算票價為 JPY
        eventData.ticketPriceTiers = eventData.ticketPriceTiers.map(tier => ({
          ...tier,
          priceJpy: Math.round(tier.priceJpy! * rate),
        }));

        // 更新 rawPriceData 加入換算後的金額
        if (eventData.rawPriceData) {
          eventData.rawPriceData = eventData.rawPriceData.map(item => ({
            ...item,
            convertedJpy: Math.round(item.price * rate),
          }));
        }

        warnings.push(
          `⚠️ 票價已從 ${eventData.originalCurrency} 自動換算為日圓 (匯率: 1 ${eventData.originalCurrency} = ¥${rate.toFixed(2)}，來源: ${source}，日期: ${today})。請務必確認換算後的金額是否正確！`
        );
      } else {
        warnings.push(
          `❌ 無法取得 ${eventData.originalCurrency} → JPY 匯率！票價以原幣值數字直接填入，請手動換算為日圓。`
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: eventData,
      warnings,
      exchangeInfo,
    });
  } catch (error) {
    console.error('Error in POST /api/events/import:', error);
    return NextResponse.json({ error: '伺服器內部錯誤' }, { status: 500 });
  }
}
