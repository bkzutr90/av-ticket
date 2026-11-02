import Link from 'next/link';
import { requireUser, guildsWithBot } from '@/lib/session';
import { guildIcon, inviteUrl } from '@/lib/discord';

export const dynamic = 'force-dynamic';

function Icon({ g }) {
  const src = guildIcon(g);
  return src
    ? <img className="gicon" src={src} alt="" width="40" height="40" />
    : <span className="gicon fallback" aria-hidden="true">{g.name.slice(0, 1).toUpperCase()}</span>;
}

export default async function ServersPage() {
  const session = await requireUser();
  const withBot = await guildsWithBot(session.guilds.map((g) => g.id));
  const active = session.guilds.filter((g) => withBot.has(g.id));
  const inactive = session.guilds.filter((g) => !withBot.has(g.id));

  return (
    <>
      <h1>Server kamu</h1>

      {active.length === 0 ? (
        <p className="empty">
          Belum ada server yang memakai bot tiket. Undang bot ke server lalu jalankan
          {' '}<code>/ticket setup</code> di Discord.
        </p>
      ) : (
        <ul className="rows">
          {active.map((g) => (
            <li key={g.id}>
              <Icon g={g} />
              <Link href={`/dashboard/${g.id}`} className="grow">{g.name}</Link>
              <span className="muted">Buka</span>
            </li>
          ))}
        </ul>
      )}

      {inactive.length > 0 && (
        <>
          <h2>Belum memakai bot</h2>
          <p className="muted">Server di bawah ini kamu kelola, tetapi bot belum di-setup.</p>
          <ul className="rows">
            {inactive.map((g) => (
              <li key={g.id}>
                <Icon g={g} />
                <span className="grow">{g.name}</span>
                <a className="btn ghost" href={`${inviteUrl()}&guild_id=${g.id}`} target="_blank" rel="noreferrer">
                  Undang bot
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
