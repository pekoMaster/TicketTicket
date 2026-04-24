/**
 * 活動網頁 AI 解析器
 * 使用 Google Gemini API 從活動頁面智慧提取活動資訊
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
  originalCurrency?: string;
  rawPriceData?: { label: string; price: number; currency: string }[];
}

// Gemini API 回傳的結構化資料
interface GeminiParsedEvent {
  name: string;
  artist: string;
  eventDate: string;
  eventEndDate?: string;
  venue: string;
  venueAddress?: string;
  description?: string;
  category: string;
  currency: string;
  ticketTiers: {
    seatGrade: string;
    price: number;
  }[];
}

/**
 * 取得所有可用的 Gemini API keys
 */
function getAllGeminiApiKeys(): string[] {
  const keys = [
    process.env.GOOGLE_GEMINI_API_KEY_1,
    process.env.GOOGLE_GEMINI_API_KEY_2,
    process.env.GOOGLE_GEMINI_API_KEY_3,
    process.env.GOOGLE_GEMINI_API_KEY_4,
    process.env.GOOGLE_GEMINI_API_KEY_5,
    process.env.GOOGLE_GEMINI_API_KEY_6,
  ].filter(Boolean) as string[];

  if (keys.length === 0) {
    throw new Error('未設定 GOOGLE_GEMINI_API_KEY，請在環境變數中設定');
  }

  // 洗牌，分散 rate limit
  for (let i = keys.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [keys[i], keys[j]] = [keys[j], keys[i]];
  }

  return keys;
}

// 依優先度排列的模型（主力：Gemini 3 Flash Lite；失敗時輪調到其他可用模型）
// 清單來源：https://ai.google.dev/gemini-api/docs/models
// 策略：flash-lite → flash → pro（由快/便宜到慢/昂貴）
interface ModelConfig {
  name: string;
  timeoutMs: number;  // pro 模型需要更長時間
}

// 適配 Vercel Hobby 60s 總限制：單模型 timeout 壓縮到能容納一次 fallback
// 經驗值：flash-lite 通常 1-3s，flash 3-10s，pro 3-8s（剛測）
const GEMINI_MODELS: ModelConfig[] = [
  { name: 'gemini-3.1-flash-lite-preview', timeoutMs: 15000 },  // 主力
  { name: 'gemini-2.5-flash-lite',          timeoutMs: 15000 },
  { name: 'gemini-3-flash-preview',         timeoutMs: 20000 },
  { name: 'gemini-2.5-flash',               timeoutMs: 20000 },
  { name: 'gemini-3.1-pro-preview',         timeoutMs: 25000 },
  { name: 'gemini-2.5-pro',                 timeoutMs: 25000 },
];

/**
 * 使用 Gemini AI 解析網頁內容（含多 key + 多模型重試）
 */
export async function parseEventWithAI(htmlText: string, sourceUrl: string): Promise<ScrapedEventData> {
  const keys = getAllGeminiApiKeys();

  // 清理 HTML，移除 script/style/svg 等無用內容，減少 token 使用量
  const cleanedText = cleanHtml(htmlText);

  const prompt = `你是一個活動票務資訊提取專家。請從以下網頁內容中提取活動資訊，並嚴格以 JSON 格式回傳。

注意事項：
1. 如果是 hololive 相關活動，artist 欄位應填入演出團體/藝人名稱（如 "hololive English"、"hololive Indonesia"、"星街すいせい" 等）
2. 日期格式必須為 YYYY-MM-DD
3. 如果活動有多天，eventDate 填第一天，eventEndDate 填最後一天
4. ticketTiers 只填會場票券（非串流票），每個等級的 seatGrade 使用原始名稱
5. category 必須是以下之一：concert, fan_meeting, expo, streaming, other
6. 如果找不到某個欄位，填空字串 ""

請回傳以下 JSON 格式（不要加任何說明文字，只回傳純 JSON）：
{
  "name": "活動完整名稱",
  "artist": "演出藝人/團體",
  "eventDate": "YYYY-MM-DD",
  "eventEndDate": "YYYY-MM-DD 或 null",
  "venue": "場地名稱",
  "venueAddress": "場地地址或所在城市",
  "description": "活動簡短描述（1-2句）",
  "category": "concert",
  "currency": "USD 或 JPY",
  "ticketTiers": [
    { "seatGrade": "座位等級名稱", "price": 數字 }
  ]
}

=== 網頁內容 ===
${cleanedText.substring(0, 8000)}
=== 結束 ===`;

  // 嘗試所有 key + 模型組合
  const errors: string[] = [];

  for (const { name: model, timeoutMs } of GEMINI_MODELS) {
    for (const apiKey of keys) {
      const keyPreview = apiKey.substring(0, 10) + '...';
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 2048,
              responseMimeType: 'application/json',
            },
          }),
          signal: AbortSignal.timeout(timeoutMs),
        });

        if (!response.ok) {
          const errText = await response.text();
          errors.push(`${model}/${keyPreview}: HTTP ${response.status}`);
          console.warn(`Gemini API failed: model=${model}, key=${keyPreview}, status=${response.status}, body=${errText.substring(0, 200)}`);

          // 404 = 模型不存在，換下一個模型（不用再試其他 key）
          if (response.status === 404) break;
          // 其他錯誤（429 rate limit, 500 等）= 換下一個 key
          continue;
        }

        const result = await response.json();
        const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!rawText) {
          errors.push(`${model}: 回傳內容為空`);
          continue;
        }

        // 成功！解析 JSON
        console.log(`Gemini API success: model=${model}`);
        return parseGeminiResponse(rawText, sourceUrl);

      } catch (fetchErr) {
        const msg = fetchErr instanceof Error ? fetchErr.message : '未知錯誤';
        const isTimeout = fetchErr instanceof Error && (fetchErr.name === 'TimeoutError' || fetchErr.name === 'AbortError');
        errors.push(`${model}/${keyPreview}: ${isTimeout ? `timeout ${timeoutMs}ms` : msg}`);
        console.warn(`Gemini API ${isTimeout ? 'timeout' : 'error'}: model=${model}, key=${keyPreview}, msg=${msg}`);
        continue;
      }
    }
  }

  // 所有組合都失敗
  throw new Error(`所有 Gemini API 嘗試都失敗 (${errors.length} 次):\n${errors.slice(0, 5).join('\n')}`);
}

/**
 * 解析 Gemini 回傳的 JSON 為 ScrapedEventData
 */
function parseGeminiResponse(rawText: string, sourceUrl: string): ScrapedEventData {
  // 解析 JSON（可能被包在 markdown code block 裡）
  let parsed: GeminiParsedEvent;
  try {
    const jsonStr = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    parsed = JSON.parse(jsonStr);
  } catch {
    console.error('Failed to parse Gemini response:', rawText);
    throw new Error('AI 回傳的格式無法解析，請重試');
  }

  // 驗證必要欄位
  const validCategories: EventCategory[] = ['concert', 'fan_meeting', 'expo', 'streaming', 'other'];
  const category = validCategories.includes(parsed.category as EventCategory) 
    ? (parsed.category as EventCategory) 
    : 'concert';

  // 轉換票價
  const rawPriceData = (parsed.ticketTiers || []).map(tier => ({
    label: tier.seatGrade,
    price: tier.price,
    currency: parsed.currency || 'JPY',
  }));

  const ticketPriceTiers: TicketPriceTier[] = rawPriceData.map(item => ({
    seatGrade: item.label,
    priceJpy: item.price,
  }));

  return {
    name: parsed.name || '',
    artist: parsed.artist || '',
    eventDate: parsed.eventDate || '',
    eventEndDate: parsed.eventEndDate || undefined,
    venue: parsed.venue || '',
    venueAddress: parsed.venueAddress || undefined,
    description: parsed.description || undefined,
    category,
    ticketPriceTiers,
    sourceUrl,
    originalCurrency: parsed.currency || 'JPY',
    rawPriceData,
  };
}

/**
 * 清理 HTML，移除無用標籤並轉為可讀文字
 */
function cleanHtml(html: string): string {
  let text = html;

  // 移除 script, style, svg, noscript 標籤及其內容
  text = text.replace(/<script[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<svg[\s\S]*?<\/svg>/gi, '');
  text = text.replace(/<noscript[\s\S]*?<\/noscript>/gi, '');

  // 移除 HTML 標籤但保留內容
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/?(p|div|h[1-6]|li|tr|td|th|section|article|header|footer|main|nav)\b[^>]*>/gi, '\n');
  text = text.replace(/<[^>]+>/g, ' ');

  // 解碼常見 HTML entities
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&nbsp;/g, ' ');

  // 清理多餘空白
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\n\s*\n/g, '\n');
  text = text.replace(/^\s+/gm, '');

  return text.trim();
}
