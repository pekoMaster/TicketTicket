
import { Metadata } from 'next';
import HomePageContent from './_components/HomePageContent';
import { getPublicListings, getPublicRequests } from '@/lib/db-queries';
import { unstable_cache } from 'next/cache';

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
};

// 使用 unstable_cache 封裝資料獲取邏輯，實現與 ISR 相同的標籤快取機制
// 這比內部 fetch 更快，且同樣受 revalidateTag('listings') 控制
const getCachedListings = unstable_cache(
  async () => getPublicListings(1, 20),
  ['public-listings'],
  { tags: ['listings'] }
);

const getCachedRequests = unstable_cache(
  async () => getPublicRequests('open'),
  ['public-requests'],
  { tags: ['listings'] }
);

async function getInitialData() {
  try {
    // 同步執行資料庫查詢
    const [listingsData, requestsData] = await Promise.all([
      getCachedListings(),
      getCachedRequests()
    ]);

    return {
      initialListings: listingsData.data || [],
      initialRequests: requestsData.requests || [],
      initialTotalPages: listingsData.pagination?.totalPages || 1
    };
  } catch (error) {
    console.error('Error in SSR getInitialData:', error);
    return { initialListings: [], initialRequests: [], initialTotalPages: 1 };
  }
}

export default async function Page() {
  const data = await getInitialData();
  
  return <HomePageContent {...data} />;
}
