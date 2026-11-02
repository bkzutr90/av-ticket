import Link from 'next/link';
import { requireGuild } from '@/lib/session';
import { getStats } from '@/lib/queries';
import { lookupUsers, nameOf } from '@/lib/discord';
import { fmtDuration, stars } from '@/lib/util';

export const dynamic = 'force-dynamic';

const PERIODS = [
  { key: '7', label: '7 hari', days: 7 },
  { key: '30', label: '30 hari', days: 30 },
  { key: '0', label: 'Semua waktu', days: 0 },
];

export default async function Overview({ params, searchParams }) {
  const { guildId } = await params;
  await requireGuild(guildId);
  const { p } = await searchParams;
  const period = PERIODS.find((x) => x.key === p) || PERIODS[1];

  const since = period.days ? Date.now() - period.days * 86400000 : 0;
  const st = await getStats(guildId, since);
  const names = await lookupUsers(st.staff.map((s) => s.staff_id));
  const max = Math.max(1, ...st.categories.map((c) => c.n));

  return (
    <>
      <nav className="chips" aria-label="Rentang waktu">
        {PERIODS.map((x) => (
          <Link key={x.key} href={`?p=${x.key}`} aria-current={x.key === period.key ? 'true' : undefined}>
            {x.label}
          </Link>
        ))}
      </nav>

      {!st.totals.total ? (
        <p className="empty">Belum ada tiket pada rentang ini ({period.label}).</p>
      ) : (
        <>
          <dl className="ledger">
            <div><dt>Total tiket</dt><dd>{st.totals.total}</dd></div>
            <div><dt>Masih terbuka</dt><dd>{st.totals.open ?? 0}</dd></div>
            <div><dt>Sudah ditutup</dt><dd>{st.totals.closed ?? 0}</dd></div>
            <div><dt>Rata-rata respon pertama</dt><dd>{fmtDuration(st.response.avg_ms)}</dd></div>
            <div><dt>Rata-rata waktu penyelesaian</dt><dd>{fmtDuration(st.resolution.avg_ms)}</dd></div>
            <div>
              <dt>Rating</dt>
              <dd>{st.rating.n ? `${st.rating.avg.toFixed(2)} / 5` : '-'}
                <small>{st.rating.n ? `${st.rating.n} penilaian` : 'belum ada'}</small></dd>
            </div>
          </dl>

          <section>
            <h2>Kategori terbanyak</h2>
            <ul className="bars">
              {st.categories.map((c) => (
                <li key={c.name}>
                  <span>{c.name}</span>
                  <span className="bar" style={{ '--w': `${(c.n / max) * 100}%` }} aria-hidden="true" />
                  <b>{c.n}</b>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2>Performa staff</h2>
            {st.staff.length === 0 ? (
              <p className="empty">Belum ada tiket yang di-claim atau dibalas staff.</p>
            ) : (
              <div className="scroll">
                <table>
                  <thead><tr><th>Staff</th><th className="num">Tiket</th><th>Rating</th><th className="num">Respon pertama</th></tr></thead>
                  <tbody>
                    {st.staff.map((s) => (
                      <tr key={s.staff_id}>
                        <td>{nameOf(names, s.staff_id)}</td>
                        <td className="num">{s.n}</td>
                        <td>{s.rating ? <><span className="stars">{stars(Math.round(s.rating))}</span> {s.rating.toFixed(1)}</> : <span className="muted">belum ada</span>}</td>
                        <td className="num">{fmtDuration(s.first_response)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="muted small">
              Staff dihitung dari yang meng-claim tiket, atau yang pertama membalas jika tidak ada claim.
            </p>
          </section>
        </>
      )}
    </>
  );
}
