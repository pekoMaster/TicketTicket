import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/auth/link/line/callback - Handle LINE OAuth callback
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.dbId) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const { searchParams } = request.nextUrl;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle error from LINE
    if (error) {
      console.error('LINE OAuth error:', error);
      return NextResponse.redirect(new URL('/profile/settings?error=line_denied', request.url));
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/profile/settings?error=line_invalid', request.url));
    }

    // Verify state
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      if (stateData.userId !== session.user.dbId) {
        return NextResponse.redirect(new URL('/profile/settings?error=line_invalid', request.url));
      }
      // Check state is not too old (10 minutes)
      if (Date.now() - stateData.timestamp > 10 * 60 * 1000) {
        return NextResponse.redirect(new URL('/profile/settings?error=line_expired', request.url));
      }
    } catch {
      return NextResponse.redirect(new URL('/profile/settings?error=line_invalid', request.url));
    }

    // Exchange code for access token
    const clientId = process.env.AUTH_LINE_ID;
    const clientSecret = process.env.AUTH_LINE_SECRET;
    const baseUrl = request.nextUrl.origin;
    const redirectUri = `${baseUrl}/api/auth/link/line/callback`;

    const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId!,
        client_secret: clientSecret!,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('LINE token error:', errorData);
      return NextResponse.redirect(new URL('/profile/settings?error=line_token', request.url));
    }

    const tokenData = await tokenResponse.json();

    // Get user profile from LINE
    const profileResponse = await fetch('https://api.line.me/v2/profile', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!profileResponse.ok) {
      console.error('LINE profile error:', await profileResponse.text());
      return NextResponse.redirect(new URL('/profile/settings?error=line_profile', request.url));
    }

    const profileData = await profileResponse.json();

    // Save LINE user ID to database
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .update({
        line_id: profileData.displayName || profileData.userId,
        show_line: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.user.dbId);

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.redirect(new URL('/profile/settings?error=line_db', request.url));
    }

    // Success - redirect back to settings
    return NextResponse.redirect(new URL('/profile/settings?success=line', request.url));
  } catch (error) {
    console.error('Error in LINE callback:', error);
    return NextResponse.redirect(new URL('/profile/settings?error=line_error', request.url));
  }
}
