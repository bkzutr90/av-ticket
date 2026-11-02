import { NextResponse } from 'next/server';
import { appUrl, exchangeCode, fetchMe, fetchGuilds, canManage } from '@/lib/discord';
import { createSession, COOKIE, SESSION_TTL_MS } from '@/lib/session';

export const dynamic = 'force-dynamic';

const back = (error) => NextResponse.redirect(new URL(`/?error=${error}`, appUrl()));

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get('error')) return back('denied');

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const saved = req.cookies.get('oauth_state')?.value;
  if (!code || !state || !saved || state !== saved) return back('state');

  try {
    const token = await exchangeCode(code);
    const [user, guilds] = await Promise.all([
      fetchMe(token.access_token), fetchGuilds(token.access_token),
    ]);

    // Simpan hanya server yang boleh dikelola; access token Discord tidak disimpan
    const manageable = guilds.filter(canManage).map((g) => ({ id: g.id, name: g.name, icon: g.icon }));
    const sid = await createSession({ user, guilds: manageable });

    const res = NextResponse.redirect(new URL('/dashboard', appUrl()));
    res.cookies.set(COOKIE, sid, {
      httpOnly: true, sameSite: 'lax', path: '/', maxAge: SESSION_TTL_MS / 1000,
      secure: process.env.NODE_ENV === 'production',
    });
    res.cookies.delete('oauth_state');
    return res;
  } catch (err) {
    console.error('OAuth callback error:', err);
    return back('login');
  }
}
