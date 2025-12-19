import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

// GET /api/auth/link/line - Redirect to LINE OAuth
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.dbId) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const clientId = process.env.AUTH_LINE_ID;
    if (!clientId) {
      return NextResponse.json({ error: 'LINE OAuth not configured' }, { status: 500 });
    }

    // Generate state for CSRF protection
    const state = Buffer.from(JSON.stringify({
      userId: session.user.dbId,
      timestamp: Date.now(),
    })).toString('base64');

    // Get callback URL - use NEXTAUTH_URL or fixed domain for production
    const baseUrl = process.env.NEXTAUTH_URL || 'https://ticketticket.live';
    const redirectUri = `${baseUrl}/api/auth/link/line/callback`;

    // LINE OAuth authorization URL
    const authUrl = new URL('https://access.line.me/oauth2/v2.1/authorize');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('scope', 'profile openid');

    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error('Error initiating LINE OAuth:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
