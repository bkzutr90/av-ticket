import { getGuildAccess } from '@/lib/session';
import { getTranscript } from '@/lib/queries';
import { pad } from '@/lib/util';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  const { guildId, number } = await params;
  const access = await getGuildAccess(guildId);
  if (!access) return new Response('Tidak ditemukan', { status: 404 });

  const n = Number(number);
  if (!Number.isInteger(n) || n < 1) return new Response('Tidak ditemukan', { status: 404 });

  const row = await getTranscript(guildId, n);
  if (!row?.transcript) return new Response('Transcript tidak tersedia', { status: 404 });

  const download = new URL(req.url).searchParams.has('download');
  const headers = {
    'Content-Type': 'text/html; charset=utf-8',
    // Isi chat adalah input user: matikan script & akses ke origin dasbor sepenuhnya
    'Content-Security-Policy': "sandbox; default-src 'none'; img-src https: data:; style-src 'unsafe-inline'",
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'private, no-store',
  };
  if (download) headers['Content-Disposition'] = `attachment; filename="transcript-ticket-${pad(n)}.html"`;
  return new Response(row.transcript, { headers });
}
