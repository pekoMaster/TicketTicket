import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';

// POST /api/auth/unlink - Unlink a connected account
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.dbId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { provider } = body;

    if (!provider || !['line', 'discord'].includes(provider)) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (provider === 'line') {
      updateData.line_id = null;
      updateData.show_line = false;
    } else if (provider === 'discord') {
      updateData.discord_id = null;
      updateData.show_discord = false;
    }

    const { error: dbError } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', session.user.dbId);

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ error: 'Failed to unlink account' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unlinking account:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
