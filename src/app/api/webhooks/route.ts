import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabase } from '@/lib/supabase';

// GET: Get user's Discord webhook settings
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user's personal webhook
    const { data: webhook, error: webhookError } = await supabase
      .from('user_discord_webhooks')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (webhookError && webhookError.code !== 'PGRST116') {
      console.error('Error fetching webhook:', webhookError);
      return NextResponse.json({ error: 'Failed to fetch webhook' }, { status: 500 });
    }

    // Get user's event subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('user_webhook_subscriptions')
      .select(`
        *,
        events (
          id,
          name,
          artist,
          event_date
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }

    return NextResponse.json({
      webhook: webhook || null,
      subscriptions: subscriptions || [],
    });
  } catch (error) {
    console.error('Error in GET /api/webhooks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create or update user's Discord webhook
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { webhookUrl, webhookName } = body;

    // Validate Discord webhook URL format
    if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
      return NextResponse.json({ error: 'Invalid Discord webhook URL' }, { status: 400 });
    }

    // Check if webhook already exists
    const { data: existing } = await supabase
      .from('user_discord_webhooks')
      .select('id')
      .eq('user_id', userId)
      .single();

    let result;
    if (existing) {
      // Update existing webhook
      result = await supabase
        .from('user_discord_webhooks')
        .update({
          webhook_url: webhookUrl,
          webhook_name: webhookName || null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();
    } else {
      // Insert new webhook
      result = await supabase
        .from('user_discord_webhooks')
        .insert({
          user_id: userId,
          webhook_url: webhookUrl,
          webhook_name: webhookName || null,
        })
        .select()
        .single();
    }

    if (result.error) {
      console.error('Error saving webhook:', result.error);
      return NextResponse.json({ error: 'Failed to save webhook' }, { status: 500 });
    }

    return NextResponse.json({ webhook: result.data });
  } catch (error) {
    console.error('Error in POST /api/webhooks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete user's Discord webhook
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Delete webhook
    const { error } = await supabase
      .from('user_discord_webhooks')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting webhook:', error);
      return NextResponse.json({ error: 'Failed to delete webhook' }, { status: 500 });
    }

    // Also delete all subscriptions
    await supabase
      .from('user_webhook_subscriptions')
      .delete()
      .eq('user_id', userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/webhooks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
