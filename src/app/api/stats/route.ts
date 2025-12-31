import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/stats - 獲取平台統計資料
export async function GET() {
    try {
        // 計算成功同行次數（雙方都確認票券的對話數量）
        const { count: successfulMeetups, error } = await supabaseAdmin
            .from('conversations')
            .select('*', { count: 'exact', head: true })
            .not('host_confirmed_at', 'is', null)
            .not('guest_confirmed_at', 'is', null);

        if (error) {
            console.error('Error fetching stats:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            successfulMeetups: successfulMeetups || 0,
        }, {
            headers: {
                // 快取 5 分鐘，減少資料庫查詢
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
            },
        });
    } catch (error) {
        console.error('Error in GET /api/stats:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
