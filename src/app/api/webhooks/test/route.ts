import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabase } from '@/lib/supabase';

// POST: Send a test webhook
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user's webhook URL
    const { data: webhook, error: webhookError } = await supabase
      .from('user_discord_webhooks')
      .select('webhook_url, webhook_name')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (webhookError || !webhook) {
      return NextResponse.json({ error: 'No webhook configured' }, { status: 400 });
    }

    // Build test embed
    const embed = {
      title: 'Test Notification',
      description: 'This is a test notification from TicketTicket!',
      color: 0x9146FF, // Purple
      fields: [
        {
          name: 'Status',
          value: 'Your webhook is working correctly!',
          inline: false,
        },
        {
          name: 'Webhook Name',
          value: webhook.webhook_name || 'Default',
          inline: true,
        },
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'TicketTicket Notification System',
      },
    };

    const payload = {
      embeds: [embed],
    };

    // Send test webhook
    const response = await fetch(webhook.webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Webhook test failed:', response.status, errorText);
      return NextResponse.json({
        error: 'Webhook test failed',
        details: `Status ${response.status}: ${errorText}`,
      }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Test webhook sent successfully!' });
  } catch (error) {
    console.error('Error in POST /api/webhooks/test:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
