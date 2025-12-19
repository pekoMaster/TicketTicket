import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

// GET /api/auth/link/discord - Redirect to Discord OAuth
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.dbId) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const clientId = process.env.AUTH_DISCORD_ID;
    if (!clientId) {
      return NextResponse.json({ error: 'Discord OAuth not configured' }, { status: 500 });
    }

    // Generate state for CSRF protection
    const state = Buffer.from(JSON.stringify({
      userId: session.user.dbId,
      timestamp: Date.now(),
    })).toString('base64');

    // Get callback URL - use NEXTAUTH_URL or fixed domain for production
    const baseUrl = process.env.NEXTAUTH_URL || 'https://ticketticket.live';
    const redirectUri = `${baseUrl}/api/auth/link/discord/callback`;

    // Discord OAuth authorization URL
    const authUrl = new URL('https://discord.com/api/oauth2/authorize');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('scope', 'identify');

    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error('Error initiating Discord OAuth:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
