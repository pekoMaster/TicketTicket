import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabase } from '@/lib/supabase';

// POST: Subscribe to an event
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { eventId } = body;

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    // Get user's webhook URL
    const { data: webhook, error: webhookError } = await supabase
      .from('user_discord_webhooks')
      .select('webhook_url')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (webhookError || !webhook) {
      return NextResponse.json({ error: 'Please set up your Discord webhook first' }, { status: 400 });
    }

    // Check if already subscribed
    const { data: existing } = await supabase
      .from('user_webhook_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Already subscribed to this event' }, { status: 400 });
    }

    // Create subscription
    const { data, error } = await supabase
      .from('user_webhook_subscriptions')
      .insert({
        user_id: userId,
        event_id: eventId,
        webhook_url: webhook.webhook_url,
      })
      .select(`
        *,
        events (
          id,
          name,
          artist,
          event_date
        )
      `)
      .single();

    if (error) {
      console.error('Error creating subscription:', error);
      return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
    }

    return NextResponse.json({ subscription: data });
  } catch (error) {
    console.error('Error in POST /api/webhooks/subscriptions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Unsubscribe from an event
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('user_webhook_subscriptions')
      .delete()
      .eq('user_id', userId)
      .eq('event_id', eventId);

    if (error) {
      console.error('Error deleting subscription:', error);
      return NextResponse.json({ error: 'Failed to delete subscription' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/webhooks/subscriptions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
