import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';

// POST /api/requests/[id]/apply - 回應求票（我可以幫忙）
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.dbId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { message } = body;

        // 取得求票資訊
        const { data: ticketRequest, error: requestError } = await supabaseAdmin
            .from('ticket_requests')
            .select('*, user:users!ticket_requests_user_id_fkey(id, username)')
            .eq('id', id)
            .single();

        if (requestError || !ticketRequest) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        // 不能回應自己的求票
        if (ticketRequest.user_id === session.user.dbId) {
            return NextResponse.json({ error: 'Cannot apply to own request' }, { status: 400 });
        }

        // 檢查是否已經回應過
        const { data: existingApp } = await supabaseAdmin
            .from('request_applications')
            .select('id')
            .eq('request_id', id)
            .eq('applicant_id', session.user.dbId)
            .single();

        if (existingApp) {
            return NextResponse.json({ error: 'Already applied' }, { status: 409 });
        }

        // 建立申請
        const { data: application, error: insertError } = await supabaseAdmin
            .from('request_applications')
            .insert({
                request_id: id,
                applicant_id: session.user.dbId,
                message: message?.trim() || null,
                status: 'pending',
            })
            .select()
            .single();

        if (insertError) {
            console.error('Failed to create application:', insertError);
            return NextResponse.json({ error: 'Failed to apply' }, { status: 500 });
        }

        // 建立對話
        const { data: conversation, error: convError } = await supabaseAdmin
            .from('conversations')
            .insert({
                participant_1: ticketRequest.user_id,
                participant_2: session.user.dbId,
                listing_id: null, // 求票沒有關聯的 listing
            })
            .select()
            .single();

        if (convError) {
            console.error('Failed to create conversation:', convError);
            // 不阻斷流程，對話建立失敗不影響申請
        }

        // 發送系統訊息到對話
        if (conversation) {
            const applicantName = session.user.name || '用戶';
            await supabaseAdmin
                .from('messages')
                .insert({
                    conversation_id: conversation.id,
                    sender_id: session.user.dbId,
                    content: message?.trim()
                        ? `[求票回應] ${applicantName} 回應了您的求票請求「${ticketRequest.event_name}」：${message.trim()}`
                        : `[求票回應] ${applicantName} 回應了您的求票請求「${ticketRequest.event_name}」，想與您聯繫！`,
                });
        }

        // 發送通知給求票者
        try {
            const applicantName = session.user.name || '用戶';
            await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/notifications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: ticketRequest.user_id,
                    type: 'new_application',
                    title: '有人回應了您的求票！',
                    message: `${applicantName} 回應了您在「${ticketRequest.event_name}」的求票請求`,
                    link: conversation ? `/chat/${conversation.id}` : `/request/${id}`,
                }),
            });
        } catch (notifError) {
            console.error('Failed to send notification:', notifError);
        }

        return NextResponse.json({
            success: true,
            application,
            conversationId: conversation?.id || null,
        });
    } catch (error) {
        console.error('Request apply API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
