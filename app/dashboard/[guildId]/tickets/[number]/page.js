import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireGuild } from '@/lib/session';
import { getTicket } from '@/lib/queries';
import { lookupUsers, nameOf } from '@/lib/discord';
import { closerLabel, fmtDate, fmtDuration, getPriority, pad, stars } from '@/lib/util';

export const dynamic = 'force-dynamic';

export default async function TicketDetail({ params }) {
  const { guildId, number } = await params;
  await requireGuild(guildId);

  const n = Number(number);
  if (!Number.isInteger(n) || n < 1) notFound();
  const t = await getTicket(guildId, n);
  if (!t) notFound();

  const staffId = t.claimed_by || t.first_responder;
  const closerId = /^\d+$/.test(t.closed_by || '') ? t.closed_by : null;
  const names = await lookupUsers([t.user_id, staffId, closerId]);
  const pr = getPriority(t.priority);

  let answers = [];
  try { answers = JSON.parse(t.answers || '[]'); } catch { /* data lama/rusak */ }

  const transcriptUrl = `/api/guilds/${guildId}/tickets/${t.number}/transcript`;

  return (
    <>
      <p className="crumb"><Link href={`/dashboard/${guildId}/tickets`}>Semua tiket</Link></p>
      <h2 className="ttitle">
        Tiket #{pad(t.number)} <span className={`pill ${t.status}`}>{t.status === 'open' ? 'Terbuka' : 'Ditutup'}</span>
      </h2>

      <dl className="facts">
        <div><dt>Kategori</dt><dd>{t.category_name || 'Umum'}</dd></div>
        <div><dt>Prioritas</dt><dd><span className="dot" style={{ background: pr.color }} />{pr.label}</dd></div>
        <div><dt>Pembuka</dt><dd>{nameOf(names, t.user_id)}</dd></div>
        <div><dt>Ditangani</dt><dd>{staffId ? nameOf(names, staffId) : '-'}{!t.claimed_by && staffId ? <small>pembalas pertama</small> : null}</dd></div>
        <div><dt>Dibuka</dt><dd>{fmtDate(t.created_at)}</dd></div>
        <div><dt>Respon pertama</dt><dd>{t.first_response_at ? fmtDuration(t.first_response_at - t.created_at) : '-'}</dd></div>
        <div><dt>Ditutup</dt><dd>{t.closed_at ? fmtDate(t.closed_at) : '-'}</dd></div>
        <div><dt>Ditutup oleh</dt><dd>{t.status === 'closed' ? closerLabel(t.closed_by, closerId && nameOf(names, closerId)) : '-'}</dd></div>
      </dl>

      {t.rating && (
        <section>
          <h2>Penilaian</h2>
          <p><span className="stars">{stars(t.rating)}</span> {t.rating}/5</p>
          {t.feedback && <blockquote>{t.feedback}</blockquote>}
        </section>
      )}

      {answers.length > 0 && (
        <section>
          <h2>Jawaban form</h2>
          <dl className="qa">
            {answers.map((x, i) => (
              <div key={i}><dt>{x.q}</dt><dd>{x.a || '-'}</dd></div>
            ))}
          </dl>
        </section>
      )}

      <section>
        <div className="sechead">
          <h2>Transcript</h2>
          {t.has_transcript ? (
            <span className="actions">
              <a href={transcriptUrl} target="_blank" rel="noreferrer">Buka layar penuh</a>
              <a href={`${transcriptUrl}?download=1`}>Unduh HTML</a>
            </span>
          ) : null}
        </div>
        {t.has_transcript ? (
          <iframe className="transcript" src={transcriptUrl} sandbox="" title={`Transcript tiket ${pad(t.number)}`} />
        ) : (
          <p className="empty">
            {t.status === 'open'
              ? 'Transcript dibuat saat tiket ditutup.'
              : 'Transcript tidak tersimpan di database (tiket ditutup sebelum Tahap 4 atau pembuatannya gagal). File HTML-nya masih ada di channel log Discord.'}
          </p>
        )}
      </section>
    </>
  );
}
