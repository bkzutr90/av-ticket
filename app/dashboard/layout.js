import Link from 'next/link';
import { requireUser } from '@/lib/session';
import { logout } from '@/app/actions';
import { avatarUrl } from '@/lib/discord';

export default async function DashboardLayout({ children }) {
  const session = await requireUser();
  const avatar = avatarUrl({ id: session.userId, avatar: session.avatar });

  return (
    <>
      <header className="topbar">
        <Link href="/dashboard" className="brand">Dasbor Tiket</Link>
        <div className="who">
          {avatar && <img src={avatar} alt="" width="28" height="28" />}
          <span>{session.username}</span>
          <form action={logout}><button className="btn ghost" type="submit">Keluar</button></form>
        </div>
      </header>
      <main className="wrap">{children}</main>
    </>
  );
}
