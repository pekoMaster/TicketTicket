import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/auth';

// POST /api/listings/[id]/select - 選擇配對對象
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.dbId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: listingId } = await params;
        const body = await request.json();
        const { applicationId } = body;

        if (!applicationId) {
            return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
        }

        // 獲取刊登資訊
        const { data: listing, error: listingError } = await supabaseAdmin
            .from('listings')
            .select('id, host_id, event_name, status')
            .eq('id', listingId)
            .single();

        if (listingError || !listing) {
            return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
        }

        // 確認用戶是主辦方
        if (listing.host_id !== session.user.dbId) {
            return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
        }

        // 確認還沒有選擇過
        const { data: existingSelection } = await supabaseAdmin
            .from('applications')
            .select('id')
            .eq('listing_id', listingId)
            .eq('status', 'accepted')
            .single();

        if (existingSelection) {
            return NextResponse.json({ error: 'Already selected an applicant' }, { status: 400 });
        }

        // 獲取要選擇的申請
        const { data: application, error: appError } = await supabaseAdmin
            .from('applications')
            .select('id, guest_id, status')
            .eq('id', applicationId)
            .eq('listing_id', listingId)
            .single();

        if (appError || !application) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 });
        }

        if (application.status !== 'pending') {
            return NextResponse.json({ error: 'Application is not pending' }, { status: 400 });
        }

        const now = new Date().toISOString();
        const deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 天後

        // 開始交易：選擇這個申請者
        // 1. 更新選中的申請狀態
        await supabaseAdmin
            .from('applications')
            .update({
                status: 'accepted',
                selected_at: now
            })
            .eq('id', applicationId);

        // 2. 拒絕其他所有申請並標記需要通知
        await supabaseAdmin
            .from('applications')
            .update({
                status: 'rejected',
                rejection_notified: false
            })
            .eq('listing_id', listingId)
            .neq('id', applicationId)
            .eq('status', 'pending');

        // 3. 更新或創建對話狀態為 matched
        const { data: existingConvo } = await supabaseAdmin
            .from('conversations')
            .select('id')
            .eq('listing_id', listingId)
            .eq('guest_id', application.guest_id)
            .single();

        let conversationId: string;

        if (existingConvo) {
            // 更新現有對話
            await supabaseAdmin
                .from('conversations')
                .update({ conversation_type: 'matched' })
                .eq('id', existingConvo.id);
            conversationId = existingConvo.id;
        } else {
            // 創建新對話
            const { data: newConvo } = await supabaseAdmin
                .from('conversations')
                .insert({
                    listing_id: listingId,
                    host_id: listing.host_id,
                    guest_id: application.guest_id,
                    conversation_type: 'matched',
                })
                .select()
                .single();
            conversationId = newConvo?.id;
        }

        // 4. 創建交易確認記錄
        if (conversationId) {
            await supabaseAdmin
                .from('transaction_confirmations')
                .insert({
                    conversation_id: conversationId,
                    listing_id: listingId,
                    host_id: listing.host_id,
                    guest_id: application.guest_id,
                    deadline_at: deadline,
                });
        }

        // 5. 更新刊登狀態為已配對
        await supabaseAdmin
            .from('listings')
            .update({ status: 'matched' })
            .eq('id', listingId);

        // 6. 通知被選中的申請者
        await supabaseAdmin
            .from('notifications')
            .insert({
                user_id: application.guest_id,
                type: 'application_accepted',
                title: '配對成功！',
                message: `恭喜！您對「${listing.event_name}」的申請已被接受`,
                data: {
                    listing_id: listingId,
                    conversation_id: conversationId,
                    event_name: listing.event_name,
                },
                is_read: false,
            });

        // 7. 通知被拒絕的申請者
        const { data: rejectedApps } = await supabaseAdmin
            .from('applications')
            .select('guest_id')
            .eq('listing_id', listingId)
            .eq('status', 'rejected')
            .eq('rejection_notified', false);

        if (rejectedApps && rejectedApps.length > 0) {
            const notifications = rejectedApps.map((app) => ({
                user_id: app.guest_id,
                type: 'application_rejected',
                title: '未配對成功',
                message: `您對「${listing.event_name}」的申請未配對成功`,
                data: {
                    listing_id: listingId,
                    event_name: listing.event_name,
                },
                is_read: false,
            }));

            await supabaseAdmin.from('notifications').insert(notifications);

            // 標記已通知
            await supabaseAdmin
                .from('applications')
                .update({ rejection_notified: true })
                .eq('listing_id', listingId)
                .eq('status', 'rejected');
        }

        return NextResponse.json({
            success: true,
            conversationId,
            message: 'Applicant selected successfully',
        });

    } catch (error) {
        console.error('Error in POST /api/listings/[id]/select:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
