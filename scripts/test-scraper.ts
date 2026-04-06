import { parseEventFromHtml } from '../src/lib/event-scraper';

// 模擬從 serendipity 官網抓取的內容（與實際抓取結果相同）
const sampleHtml = `Title: Ticket | hololive English 4th Concert -Serendipity-｜hololive production（ホロライブプロダクション）

OG Description: "hololive production VTuber group ""hololive English"" will hold its fourth full-scale live performance: ""hololive English 4th Concert -Serendipity-""!The event will take place over two days on July 03 – July 04, 2026 (PDT) at the Shrine Auditorium in Lost Angeles, USA!"

Source: https://serendipity.hololivepro.com/ticket/

## VENUE TICKETS
- Front ORCHESTRA & LOGE : 225 USD
- Middle ORCHESTRA / Front BALCONY : 175 USD
- Side ORCHESTRA & BALCONY : 150 USD
- Rear ORCHESTRA / Middle BALCONY : 135 USD
- Rear BALCONY 1 : 110 USD
- Rear BALCONY 2 : 95 USD

## STREAMING TICKETS
SPWN 2026/4/6 13:00 (JST) - 2026/8/5 12:00 (JST)
`;

console.log('=== 正在測試 event-scraper 解析器 ===\n');

const result = parseEventFromHtml(sampleHtml, 'https://serendipity.hololivepro.com/ticket/');

console.log('活動名稱:', result.name);
console.log('藝人:', result.artist);
console.log('活動日期:', result.eventDate);
console.log('結束日期:', result.eventEndDate);
console.log('場地:', result.venue);
console.log('場地地址:', result.venueAddress);
console.log('分類:', result.category);
console.log('貨幣:', result.originalCurrency);
console.log('描述:', result.description?.substring(0, 80) + '...');
console.log('\n票價等級:');
result.ticketPriceTiers.forEach((tier, i) => {
  console.log(`  ${i+1}. ${tier.seatGrade} | ${tier.ticketCountType} | ${tier.priceJpy}`);
});
console.log('\n原始價格資料:');
result.rawPriceData?.forEach(p => {
  console.log(`  ${p.label}: ${p.price} ${p.currency}`);
});

// 驗證
const errors: string[] = [];
if (!result.name) errors.push('❌ 名稱未解析');
if (!result.artist) errors.push('❌ 藝人未解析');
if (!result.eventDate) errors.push('❌ 日期未解析');
if (!result.venue) errors.push('❌ 場地未解析');
if (result.ticketPriceTiers.length === 0) errors.push('❌ 票價未解析');

console.log('\n=== 驗證結果 ===');
if (errors.length === 0) {
  console.log('✅ 所有欄位解析成功！');
} else {
  errors.forEach(e => console.log(e));
}
