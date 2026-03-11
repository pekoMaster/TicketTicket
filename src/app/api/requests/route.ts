import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/requests - 取得求票列表
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const eventName = searchParams.get('eventName');
        const status = searchParams.get('status') || 'open';
        const userId = searchParams.get('userId');

        let query = supabaseAdmin
            .from('ticket_requests')
            .select(`
        *,
        user:users!ticket_requests_user_id_fkey(id, username, avatar_url, custom_avatar_url, rating, review_count)
      `)
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }
        if (eventName) {
            query = query.eq('event_name', eventName);
        }
        if (userId) {
            query = query.eq('user_id', userId);
        }

        const { data: requests, error } = await query;

        if (error) {
            console.error('Failed to fetch ticket requests:', error);
            return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
        }

        return NextResponse.json({ requests });
    } catch (error) {
        console.error('Requests API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/requests - 建立新求票
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.dbId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { eventId, eventName, acceptedTypes, seatGrades, quantity, description, ticketSource, requesterNationality, requesterLanguages } = body;

        // 驗證
        if (!eventName) {
            return NextResponse.json({ error: 'Missing eventName' }, { status: 400 });
        }
        if (!acceptedTypes || !Array.isArray(acceptedTypes) || acceptedTypes.length === 0) {
            return NextResponse.json({ error: 'Must select at least one accepted type' }, { status: 400 });
        }
        if (!seatGrades || !Array.isArray(seatGrades) || seatGrades.length === 0) {
            return NextResponse.json({ error: 'Must select at least one seat grade' }, { status: 400 });
        }

        // 檢查活動的求票上限
        if (eventId) {
            const { data: eventData } = await supabaseAdmin
                .from('events')
                .select('max_requests_per_user')
                .eq('id', eventId)
                .single();

            const maxRequests = eventData?.max_requests_per_user || 2;

            // 計算用戶對此活動已提交的求票數量
            const { count } = await supabaseAdmin
                .from('ticket_requests')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', session.user.dbId)
                .eq('event_name', eventName)
                .in('status', ['open', 'matched']);

            if ((count || 0) >= maxRequests) {
                return NextResponse.json({
                    error: 'Request limit reached',
                    code: 'MAX_REQUESTS_REACHED',
                    current: count,
                    max: maxRequests,
                }, { status: 409 });
            }
        }

        // 建立求票
        const { data: ticketRequest, error: insertError } = await supabaseAdmin
            .from('ticket_requests')
            .insert({
                user_id: session.user.dbId,
                event_id: eventId || null,
                event_name: eventName,
                accepted_types: acceptedTypes,
                seat_grades: seatGrades,
                quantity: Math.min(quantity || 1, 10),
                description: description?.trim() || null,
                ticket_source: ticketSource || null,
                requester_nationality: requesterNationality || null,
                requester_languages: requesterLanguages || null,
                status: 'open',
            })
            .select()
            .single();

        if (insertError) {
            console.error('Failed to create ticket request:', insertError);
            return NextResponse.json({ error: 'Failed to create request' }, { status: 500 });
        }

        return NextResponse.json({ success: true, request: ticketRequest });
    } catch (error) {
        console.error('Request API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
