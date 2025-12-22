import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/auth';

// GET /api/listings/[id]/applicants - 獲取刊登的所有申請者和諮詢者
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.dbId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: listingId } = await params;

        // 確認用戶是刊登的主辦方
        const { data: listing, error: listingError } = await supabaseAdmin
            .from('listings')
            .select('id, host_id')
            .eq('id', listingId)
            .single();

        if (listingError || !listing) {
            return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
        }

        if (listing.host_id !== session.user.dbId) {
            return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
        }

        // 獲取申請者列表（已申請的）
        const { data: applications, error: appsError } = await supabaseAdmin
            .from('applications')
            .select(`
        id,
        guest_id,
        status,
        message,
        created_at,
        selected_at,
        guest:users!applications_guest_id_fkey (
          id,
          username,
          avatar_url,
          custom_avatar_url,
          rating,
          review_count
        )
      `)
            .eq('listing_id', listingId)
            .order('created_at', { ascending: false });

        if (appsError) {
            console.error('Error fetching applications:', appsError);
        }

        // 獲取諮詢中的對話
        const { data: inquiries, error: inqError } = await supabaseAdmin
            .from('conversations')
            .select(`
        id,
        guest_id,
        conversation_type,
        guest:users!conversations_guest_id_fkey (
          id,
          username,
          avatar_url,
          custom_avatar_url,
          rating,
          review_count
        )
      `)
            .eq('listing_id', listingId)
            .eq('conversation_type', 'inquiry');

        if (inqError) {
            console.error('Error fetching inquiries:', inqError);
        }

        // 為每個諮詢獲取最後一條訊息
        const inquiriesWithLastMessage = await Promise.all(
            (inquiries || []).map(async (inq) => {
                const { data: messages } = await supabaseAdmin
                    .from('messages')
                    .select('content, created_at')
                    .eq('conversation_id', inq.id)
                    .order('created_at', { ascending: false })
                    .limit(1);

                return {
                    ...inq,
                    last_message: messages?.[0] || null,
                };
            })
        );

        return NextResponse.json({
            applications: applications || [],
            inquiries: inquiriesWithLastMessage,
        });

    } catch (error) {
        console.error('Error in GET /api/listings/[id]/applicants:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
