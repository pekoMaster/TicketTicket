import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/auth/link/discord/callback - Handle Discord OAuth callback
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

    // Handle error from Discord
    if (error) {
      console.error('Discord OAuth error:', error);
      return NextResponse.redirect(new URL('/profile/settings?error=discord_denied', request.url));
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/profile/settings?error=discord_invalid', request.url));
    }

    // Verify state
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      if (stateData.userId !== session.user.dbId) {
        return NextResponse.redirect(new URL('/profile/settings?error=discord_invalid', request.url));
      }
      // Check state is not too old (10 minutes)
      if (Date.now() - stateData.timestamp > 10 * 60 * 1000) {
        return NextResponse.redirect(new URL('/profile/settings?error=discord_expired', request.url));
      }
    } catch {
      return NextResponse.redirect(new URL('/profile/settings?error=discord_invalid', request.url));
    }

    // Exchange code for access token
    const clientId = process.env.AUTH_DISCORD_ID;
    const clientSecret = process.env.AUTH_DISCORD_SECRET;
    const baseUrl = process.env.NEXTAUTH_URL || 'https://ticketticket.live';
    const redirectUri = `${baseUrl}/api/auth/link/discord/callback`;

    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
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
      console.error('Discord token error:', errorData);
      return NextResponse.redirect(new URL('/profile/settings?error=discord_token', request.url));
    }

    const tokenData = await tokenResponse.json();

    // Get user profile from Discord
    const profileResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!profileResponse.ok) {
      console.error('Discord profile error:', await profileResponse.text());
      return NextResponse.redirect(new URL('/profile/settings?error=discord_profile', request.url));
    }

    const profileData = await profileResponse.json();

    // Save Discord username to database
    const discordUsername = profileData.global_name || profileData.username || profileData.id;

    const { error: dbError } = await supabaseAdmin
      .from('users')
      .update({
        discord_id: discordUsername,
        show_discord: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.user.dbId);

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.redirect(new URL('/profile/settings?error=discord_db', request.url));
    }

    // Success - redirect back to settings
    return NextResponse.redirect(new URL('/profile/settings?success=discord', request.url));
  } catch (error) {
    console.error('Error in Discord callback:', error);
    return NextResponse.redirect(new URL('/profile/settings?error=discord_error', request.url));
  }
}
