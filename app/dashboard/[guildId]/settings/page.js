import { requireGuild } from '@/lib/session';
import { getGuildCategories, getGuildBlacklist } from '@/lib/queries';
import { lookupUsers, nameOf } from '@/lib/discord';
import { fmtDate } from '@/lib/util';
import { saveAutoClose } from './actions';

export const dynamic = 'force-dynamic';

export default async function SettingsPage({ params, searchParams }) {
  const { guildId } = await params;
  const { cfg } = await requireGuild(guildId);
  const { msg } = await searchParams;

  const [cats, blacklist] = await Promise.all([getGuildCategories(guildId), getGuildBlacklist(guildId)]);
  const names = await lookupUsers(blacklist.map((b) => b.user_id));

  return (
    <>
      {msg === 'saved' && <p className="notice ok" role="status">Pengaturan disimpan.</p>}
      {msg === 'invalid' && <p className="notice err" role="alert">Isi jam dengan angka bulat 0 sampai 720.</p>}

      <section>
        <h2>Auto-close</h2>
        <form className="inline" action={saveAutoClose}>
          <input type="hidden" name="guildId" value={guildId} />
          <label>
            Tutup tiket setelah (jam tanpa aktivitas)
            <input type="number" name="hours" min="0" max="720" step="1" defaultValue={cfg.auto_close_hours} required />
          </label>
          <button className="btn primary" type="submit">Simpan</button>
        </form>
        <p className="muted small">Isi 0 untuk menonaktifkan. Bot mengirim peringatan sebelum tiket ditutup.</p>
      </section>

      <section>
        <h2>Kategori tiket</h2>
        {cats.length === 0 ? (
          <p className="empty">Belum ada kategori, panel memakai tombol tunggal Buka Tiket.</p>
        ) : (
          <ul className="rows plain">
            {cats.map((c) => {
              let q = [];
              try { q = JSON.parse(c.questions || '[]'); } catch { /* abaikan */ }
              return (
                <li key={c.id}>
                  <span className="grow">
                    <b>{c.emoji ? `${c.emoji} ` : ''}{c.name}</b>
                    {c.description ? <span className="muted"> · {c.description}</span> : null}
                    <small className="muted block">{q.length ? q.join(' / ') : 'Form default'}</small>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        <p className="muted small">Kategori, panel, dan blacklist diubah lewat command <code>/ticket</code> di Discord.</p>
      </section>

      <section>
        <h2>Blacklist</h2>
        {blacklist.length === 0 ? (
          <p className="empty">Tidak ada user yang diblokir.</p>
        ) : (
          <div className="scroll">
            <table>
              <thead><tr><th>User</th><th>Alasan</th><th>Sejak</th></tr></thead>
              <tbody>
                {blacklist.map((b) => (
                  <tr key={b.user_id}>
                    <td>{nameOf(names, b.user_id)}</td>
                    <td>{b.reason || <span className="muted">-</span>}</td>
                    <td>{fmtDate(b.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
