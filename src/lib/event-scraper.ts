/**
 * 活動網頁爬取解析器
 * 從 hololive 官方活動頁面自動提取活動資訊
 */

import { TicketPriceTier, EventCategory } from '@/types';

// 解析後的活動資料結構
export interface ScrapedEventData {
  name: string;
  artist: string;
  eventDate: string;         // YYYY-MM-DD
  eventEndDate?: string;     // YYYY-MM-DD
  venue: string;
  venueAddress?: string;
  description?: string;
  category: EventCategory;
  ticketPriceTiers: TicketPriceTier[];
  sourceUrl: string;
  // 原始貨幣資訊（供管理員參考）
  originalCurrency?: string;
  rawPriceData?: { label: string; price: number; currency: string }[];
}

/**
 * 從 HTML 文字內容中解析活動資訊
 */
export function parseEventFromHtml(htmlText: string, sourceUrl: string): ScrapedEventData {
  // 提取標題
  const name = extractTitle(htmlText);
  
  // 提取藝人
  const artist = extractArtist(htmlText, name);

  // 提取日期
  const { eventDate, eventEndDate } = extractDates(htmlText);

  // 提取場地資訊
  const { venue, venueAddress } = extractVenue(htmlText);

  // 提取票價
  const { priceTiers, rawPriceData, currency } = extractPrices(htmlText);

  // 提取描述
  const description = extractDescription(htmlText);

  // 判斷分類
  const category = detectCategory(htmlText, name);

  return {
    name,
    artist,
    eventDate,
    eventEndDate,
    venue,
    venueAddress,
    description,
    category,
    ticketPriceTiers: priceTiers,
    sourceUrl,
    originalCurrency: currency,
    rawPriceData,
  };
}

/**
 * 提取活動名稱
 */
function extractTitle(text: string): string {
  // 嘗試從 Title 標籤提取完整活動名稱
  // 格式：「Title: XXX | hololive production...」
  // 先嘗試取得 | 前的完整名稱
  const titleMatch = text.match(/Title:\s*(.+?)(?:\s*[|｜])/);
  if (titleMatch) {
    const raw = titleMatch[1].trim();
    // 如果名稱看起來像是頁面類型（Ticket, News 等），嘗試從後面的部分提取
    const pageTypes = ['ticket', 'news', 'merch', 'information', 'video', 'unit'];
    if (pageTypes.includes(raw.toLowerCase())) {
      // 嘗試從 Title 全文中提取完整名稱
      // 格式：「Ticket | hololive English 4th Concert -Serendipity-｜...」
      const fullTitleMatch = text.match(/Title:\s*.+?[|｜]\s*(.+?)\s*[|｜]/);
      if (fullTitleMatch) {
        return fullTitleMatch[1].trim();
      }
    }
    return raw;
  }

  // 嘗試從 h1 或明顯的標題文字提取
  const h1Match = text.match(/^#\s+(.+)$/m);
  if (h1Match) {
    return h1Match[1].trim();
  }

  return '';
}

/**
 * 提取藝人/團體名稱
 */
function extractArtist(text: string, eventName: string): string {
  // 從活動名稱中抽取藝人
  // 例：「hololive English 4th Concert -Serendipity-」→「hololive English」
  
  // 常見 hololive 相關團體名
  const knownArtists = [
    'hololive English',
    'hololive Indonesia',
    'hololive',
    'holoX',
    'holo*27',
    'Moona Hoshinova',
    'Gawr Gura',
    'Calliope Mori',
    'Kiara Takanashi',
    'IRyS',
    'Fauna Ceres',
    'Kronii Ouro',
    'Mumei Nanashi',
    'Baelz Hakos',
    'Suisei Hoshimachi',
    '星街すいせい',
    'Tokino Sora',
    'AZKi',
    'Roboco',
  ];

  for (const artist of knownArtists) {
    if (eventName.toLowerCase().includes(artist.toLowerCase()) || 
        text.toLowerCase().includes(artist.toLowerCase())) {
      return artist;
    }
  }

  // 嘗試從名稱中分割
  const concertPattern = /^(.+?)\s+(?:\d+(?:st|nd|rd|th)\s+)?(?:Concert|Live|Fes|Festival|Tour)/i;
  const match = eventName.match(concertPattern);
  if (match) {
    return match[1].trim();
  }

  return eventName.split(/\s+(?:Concert|Live|Fes)/i)[0]?.trim() || 'hololive';
}

/**
 * 提取日期
 * 策略：優先使用英文月份名稱格式的日期（通常是演出日期），
 * ISO 格式日期只作為備選（通常是售票日期）
 */
function extractDates(text: string): { eventDate: string; eventEndDate?: string } {
  const primaryDates: string[] = [];   // 英文月份格式（演出日期）
  const fallbackDates: string[] = [];  // ISO 格式（售票日期等）

  // 格式：July 03, 2026 / July 03 – July 04, 2026
  const monthDayYear = /(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:\s*[–-]\s*(?:(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+)?(\d{1,2}))?,?\s*(\d{4})/gi;
  let match;
  
  while ((match = monthDayYear.exec(text)) !== null) {
    const fullMatch = match[0];
    const monthMatch = fullMatch.match(/^(January|February|March|April|May|June|July|August|September|October|November|December)/i);
    if (!monthMatch) continue;
    
    const month = monthNameToNumber(monthMatch[1]);
    const year = parseInt(match[3]);
    const day1 = parseInt(match[1]);
    
    if (month && year && day1) {
      primaryDates.push(formatDate(year, month, day1));
      
      if (match[2]) {
        const day2 = parseInt(match[2]);
        const secondMonth = fullMatch.match(/[–-]\s*(January|February|March|April|May|June|July|August|September|October|November|December)/i);
        const month2 = secondMonth ? monthNameToNumber(secondMonth[1]) : month;
        if (month2) {
          primaryDates.push(formatDate(year, month2, day2));
        }
      }
    }
  }

  // 如果已找到英文月份日期，直接使用（這些通常是實際演出日期）
  if (primaryDates.length > 0) {
    const uniqueDates = [...new Set(primaryDates)].sort();
    return {
      eventDate: uniqueDates[0],
      eventEndDate: uniqueDates.length > 1 ? uniqueDates[uniqueDates.length - 1] : undefined,
    };
  }

  // 退回使用 ISO 格式：2026/7/3 或 2026-07-03
  const isoDatePattern = /(\d{4})[/-](\d{1,2})[/-](\d{1,2})/g;
  while ((match = isoDatePattern.exec(text)) !== null) {
    const year = parseInt(match[1]);
    const month = parseInt(match[2]);
    const day = parseInt(match[3]);
    if (year >= 2024 && year <= 2030 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const formatted = formatDate(year, month, day);
      if (!fallbackDates.includes(formatted)) {
        fallbackDates.push(formatted);
      }
    }
  }

  const uniqueDates = [...new Set(fallbackDates)].sort();
  return {
    eventDate: uniqueDates[0] || '',
    eventEndDate: uniqueDates.length > 1 ? uniqueDates[uniqueDates.length - 1] : undefined,
  };
}

/**
 * 提取場地資訊
 */
function extractVenue(text: string): { venue: string; venueAddress?: string } {
  // 嘗試各種場地格式
  
  // 「at the XXX in YYY」格式
  const atThePattern = /at\s+the\s+(.+?)\s+in\s+(.+?)(?:[!.,]|\s*$)/i;
  const atMatch = text.match(atThePattern);
  if (atMatch) {
    return {
      venue: atMatch[1].trim(),
      venueAddress: atMatch[2].trim(),
    };
  }

  // 「at XXX」格式
  const atPattern = /at\s+(?:the\s+)?(.+?)(?:\s+in\s+(.+?))?(?:[!.,]|\s*$)/i;
  const atSimpleMatch = text.match(atPattern);
  if (atSimpleMatch) {
    return {
      venue: atSimpleMatch[1].trim(),
      venueAddress: atSimpleMatch[2]?.trim(),
    };
  }

  // 日本場地名稱
  const jpVenues = [
    '幕張メッセ', '東京ドーム', 'さいたまスーパーアリーナ', 
    '横浜アリーナ', '日本武道館', 'パシフィコ横浜',
    'Makuhari Messe', 'Tokyo Dome', 'Saitama Super Arena',
  ];

  for (const v of jpVenues) {
    if (text.includes(v)) {
      return { venue: v };
    }
  }

  return { venue: '' };
}

/**
 * 提取票價資訊
 */
function extractPrices(text: string): { 
  priceTiers: TicketPriceTier[]; 
  rawPriceData: { label: string; price: number; currency: string }[];
  currency: string;
} {
  const rawPriceData: { label: string; price: number; currency: string }[] = [];
  let currency = 'JPY';

  // USD 格式：「XXX : 225 USD」或「XXX : $225」
  // label 允許含數字（如 Rear BALCONY 1）
  const usdPattern = /([A-Za-z][A-Za-z0-9\s&/]+?)\s*:\s*\$?(\d+(?:,\d{3})*)\s*(?:USD|usd)/g;
  let match;
  
  while ((match = usdPattern.exec(text)) !== null) {
    const label = match[1].trim();
    const price = parseInt(match[2].replace(/,/g, ''));
    if (label && price > 0 && !isDuplicate(rawPriceData, label, price)) {
      rawPriceData.push({ label, price, currency: 'USD' });
      currency = 'USD';
    }
  }

  // $ 格式：「$225」
  if (rawPriceData.length === 0) {
    const dollarPattern = /([A-Za-z\s&/]+?)\s*:\s*\$(\d+(?:,\d{3})*)/g;
    while ((match = dollarPattern.exec(text)) !== null) {
      const label = match[1].trim();
      const price = parseInt(match[2].replace(/,/g, ''));
      if (label && price > 0 && !isDuplicate(rawPriceData, label, price)) {
        rawPriceData.push({ label, price, currency: 'USD' });
        currency = 'USD';
      }
    }
  }

  // JPY 格式：「¥10,000」或「10,000円」
  if (rawPriceData.length === 0) {
    const jpyPattern = /([^\n:]+?)\s*[:：]\s*[¥￥]?\s*(\d{1,3}(?:,\d{3})*)\s*(?:円|JPY|yen)?/g;
    while ((match = jpyPattern.exec(text)) !== null) {
      const label = match[1].trim();
      const price = parseInt(match[2].replace(/,/g, ''));
      if (label && price > 0 && !isDuplicate(rawPriceData, label, price)) {
        rawPriceData.push({ label, price, currency: 'JPY' });
        currency = 'JPY';
      }
    }
  }

  // 轉換為 TicketPriceTier 格式
  const priceTiers: TicketPriceTier[] = rawPriceData.map(item => ({
    seatGrade: item.label,
    ticketCountType: 'solo' as const,
    priceJpy: item.price, // 直接存入數值，管理員可在表單中調整
  }));

  return { priceTiers, rawPriceData, currency };
}

/**
 * 提取描述
 */
function extractDescription(text: string): string {
  // 從 OG Description 或 Description 提取
  const descMatch = text.match(/(?:OG\s+)?Description:\s*"?(.+?)"?\s*$/m);
  if (descMatch) {
    return descMatch[1].replace(/"{2}/g, '"').trim();
  }

  return '';
}

/**
 * 判斷活動分類
 */
function detectCategory(text: string, name: string): EventCategory {
  const combined = `${name} ${text}`.toLowerCase();
  
  if (combined.includes('concert') || combined.includes('live') || combined.includes('ライブ')) {
    return 'concert';
  }
  if (combined.includes('fan meeting') || combined.includes('ファンミ') || combined.includes('meet')) {
    return 'fan_meeting';
  }
  if (combined.includes('expo') || combined.includes('exhibition') || combined.includes('展') || combined.includes('fes')) {
    return 'expo';
  }
  if (combined.includes('stream') || combined.includes('online') || combined.includes('配信')) {
    return 'streaming';
  }
  
  return 'concert'; // 預設演唱會
}

// === 工具函數 ===

function monthNameToNumber(name: string): number | null {
  const months: Record<string, number> = {
    january: 1, february: 2, march: 3, april: 4,
    may: 5, june: 6, july: 7, august: 8,
    september: 9, october: 10, november: 11, december: 12,
  };
  return months[name.toLowerCase()] || null;
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function isDuplicate(
  arr: { label: string; price: number }[], 
  label: string, 
  price: number
): boolean {
  return arr.some(item => item.label === label && item.price === price);
}
