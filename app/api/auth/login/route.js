import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { authorizeUrl } from '@/lib/discord';

export const dynamic = 'force-dynamic';

export async function GET() {
  const state = crypto.randomBytes(16).toString('hex');
  const res = NextResponse.redirect(authorizeUrl(state));
  res.cookies.set('oauth_state', state, {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: 600,
    secure: process.env.NODE_ENV === 'production',
  });
  return res;
}
