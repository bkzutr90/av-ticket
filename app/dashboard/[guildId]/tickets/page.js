import Link from 'next/link';
import { requireGuild } from '@/lib/session';
import { listTickets, listCategoryNames } from '@/lib/queries';
import { lookupUsers, nameOf } from '@/lib/discord';
import { fmtDate, getPriority, pad, stars } from '@/lib/util';

export const dynamic = 'force-dynamic';

export default async function TicketsPage({ params, searchParams }) {
  const { guildId } = await params;
  await requireGuild(guildId);
  const sp = await searchParams;

  const q = typeof sp.q === 'string' ? sp.q : '';
  const status = typeof sp.status === 'string' ? sp.status : '';
  const category = typeof sp.category === 'string' ? sp.category : '';
  const page = Math.max(1, Number.parseInt(sp.page, 10) || 1);

  const [{ rows, total, pages }, categories] = await Promise.all([
    listTickets(guildId, { q, status, category, page }),
    listCategoryNames(guildId),
  ]);
  const names = await lookupUsers(rows.map((r) => r.user_id));

  const link = (n) => {
    const u = new URLSearchParams();
    if (q) u.set('q', q);
    if (status) u.set('status', status);
    if (category) u.set('category', category);
    if (n > 1) u.set('page', String(n));
    const s = u.toString();
    return s ? `?${s}` : '?';
  };

  return (
    <>
      <form className="filters" method="get">
        <label>
          Nomor tiket atau ID user
          <input name="q" defaultValue={q} placeholder="mis. 42 atau 1234567890123456" inputMode="numeric" />
        </label>
        <label>
          Status
          <select name="status" defaultValue={status}>
            <option value="">Semua</option>
            <option value="open">Terbuka</option>
            <option value="closed">Ditutup</option>
          </select>
        </label>
        <label>
          Kategori
          <select name="category" defaultValue={category}>
            <option value="">Semua</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <button className="btn primary" type="submit">Cari</button>
        {(q || status || category) && <Link className="btn ghost" href="?">Reset</Link>}
      </form>

      <p className="muted small">{total} tiket ditemukan</p>

      {rows.length === 0 ? (
        <p className="empty">Tidak ada tiket yang cocok dengan filter ini.</p>
      ) : (
        <div className="scroll">
          <table>
            <thead>
              <tr><th>Tiket</th><th>Kategori</th><th>Pembuka</th><th>Status</th><th>Rating</th><th>Dibuka</th></tr>
            </thead>
            <tbody>
              {rows.map((t) => {
                const pr = getPriority(t.priority);
                return (
                  <tr key={t.id}>
                    <td>
                      <span className="dot" style={{ background: pr.color }} title={`Prioritas ${pr.label}`} />
                      <Link href={`/dashboard/${guildId}/tickets/${t.number}`}>#{pad(t.number)}</Link>
                    </td>
                    <td>{t.category_name || 'Umum'}</td>
                    <td>{nameOf(names, t.user_id)}</td>
                    <td><span className={`pill ${t.status}`}>{t.status === 'open' ? 'Terbuka' : 'Ditutup'}</span></td>
                    <td>{t.rating ? <span className="stars" title={`${t.rating}/5`}>{stars(t.rating)}</span> : <span className="muted">-</span>}</td>
                    <td>{fmtDate(t.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <nav className="pager" aria-label="Halaman">
          {page > 1 ? <Link href={link(page - 1)}>Sebelumnya</Link> : <span />}
          <span className="muted">Halaman {page} dari {pages}</span>
          {page < pages ? <Link href={link(page + 1)}>Berikutnya</Link> : <span />}
        </nav>
      )}
    </>
  );
}
