import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/auth';

// POST /api/inquiries - 創建諮詢對話
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.dbId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { listingId, message } = body;

        if (!listingId) {
            return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 });
        }

        // 獲取刊登資訊
        const { data: listing, error: listingError } = await supabaseAdmin
            .from('listings')
            .select('id, host_id, event_name, status, inquiry_count')
            .eq('id', listingId)
            .single();

        if (listingError || !listing) {
            return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
        }

        // 不能諮詢自己的刊登
        if (listing.host_id === session.user.dbId) {
            return NextResponse.json({ error: 'Cannot inquire on your own listing' }, { status: 400 });
        }

        // 檢查是否已有對話（諮詢或申請）
        const { data: existingConvo } = await supabaseAdmin
            .from('conversations')
            .select('id, conversation_type')
            .eq('listing_id', listingId)
            .eq('guest_id', session.user.dbId)
            .single();

        if (existingConvo) {
            // 已有對話，直接返回
            return NextResponse.json({
                conversationId: existingConvo.id,
                exists: true,
                type: existingConvo.conversation_type
            });
        }

        // 創建新的諮詢對話
        const { data: conversation, error: convoError } = await supabaseAdmin
            .from('conversations')
            .insert({
                listing_id: listingId,
                host_id: listing.host_id,
                guest_id: session.user.dbId,
                conversation_type: 'inquiry',
                inquiry_started_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (convoError) {
            console.error('Error creating conversation:', convoError);
            return NextResponse.json({ error: convoError.message }, { status: 500 });
        }

        // 更新刊登的諮詢人數
        await supabaseAdmin
            .from('listings')
            .update({
                inquiry_count: listing.inquiry_count ? listing.inquiry_count + 1 : 1
            })
            .eq('id', listingId);

        // 如果有初始訊息，發送訊息
        if (message && message.trim()) {
            await supabaseAdmin
                .from('messages')
                .insert({
                    conversation_id: conversation.id,
                    sender_id: session.user.dbId,
                    content: message.trim(),
                });
        }

        // 創建通知給主辦
        await supabaseAdmin
            .from('notifications')
            .insert({
                user_id: listing.host_id,
                type: 'new_inquiry',
                title: '新的諮詢',
                message: `有人對您的「${listing.event_name}」刊登提出問題`,
                data: {
                    listing_id: listingId,
                    conversation_id: conversation.id,
                    event_name: listing.event_name
                },
                is_read: false,
            });

        return NextResponse.json({
            conversationId: conversation.id,
            exists: false,
            type: 'inquiry'
        });

    } catch (error) {
        console.error('Error in POST /api/inquiries:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// GET /api/inquiries?listingId=xxx - 獲取刊登的諮詢數量
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const listingId = searchParams.get('listingId');

        if (!listingId) {
            return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 });
        }

        // 獲取諮詢中的對話數量（不包含已申請或已配對的）
        const { data, error } = await supabaseAdmin
            .from('conversations')
            .select('id', { count: 'exact' })
            .eq('listing_id', listingId)
            .eq('conversation_type', 'inquiry');

        if (error) {
            console.error('Error fetching inquiry count:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            count: data?.length || 0
        });

    } catch (error) {
        console.error('Error in GET /api/inquiries:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
