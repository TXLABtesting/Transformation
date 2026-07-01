import { NextRequest, NextResponse } from 'next/server';
import { exchangeCode, fetchUserInfo } from '@/lib/uaepass';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// UAE PASS redirect target: validates state, exchanges the code, loads the
// profile, stores a minimal session cookie, and returns to the app.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const err = url.searchParams.get('error');
  const cookieState = req.cookies.get('uaepass_state')?.value;

  const appUrl = new URL('/', url.origin);

  if (err) {
    appUrl.searchParams.set('login', 'cancelled');
    return NextResponse.redirect(appUrl);
  }
  if (!code || !state || state !== cookieState) {
    appUrl.searchParams.set('login', 'invalid');
    return NextResponse.redirect(appUrl);
  }

  try {
    const tokens = await exchangeCode(code);
    const profile = await fetchUserInfo(tokens.access_token);
    const session = {
      sub: profile.sub,
      name: profile.fullnameAR || profile.fullnameEN || profile.name || '',
      email: profile.email || '',
      at: Date.now(),
    };
    const res = NextResponse.redirect(appUrl);
    // Minimal demo session. In production, sign/encrypt this (e.g. JWT) and
    // map the UAE PASS `sub` to a portal user + role + entity.
    res.cookies.set('uaepass_session', Buffer.from(JSON.stringify(session)).toString('base64'), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 8,
    });
    res.cookies.delete('uaepass_state');
    appUrl.searchParams.set('login', 'ok');
    return res;
  } catch {
    appUrl.searchParams.set('login', 'error');
    return NextResponse.redirect(appUrl);
  }
}
