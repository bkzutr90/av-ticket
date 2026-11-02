import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

const ERRORS = {
  login_required: 'Masuk dulu untuk membuka dasbor.',
  state: 'Sesi login kedaluwarsa. Coba masuk lagi.',
  login: 'Login Discord gagal. Coba lagi sebentar lagi.',
  denied: 'Izin di Discord dibatalkan, jadi login tidak dilanjutkan.',
};

export default async function Home({ searchParams }) {
  if (await getSession()) redirect('/dashboard');
  const { error } = await searchParams;

  return (
    <main className="welcome">
      <h1>Dasbor Tiket</h1>
      <p>
        Lihat statistik, cari tiket lama, dan buka transcript untuk server yang kamu kelola.
        Hanya akun dengan izin Manage Server yang bisa masuk.
      </p>
      {error && <p className="notice err" role="alert">{ERRORS[error] || 'Terjadi kesalahan saat login.'}</p>}
      {/* <a>, bukan <Link>: jangan di-prefetch karena rute ini menyetel cookie state */}
      <a className="btn primary" href="/api/auth/login">Masuk dengan Discord</a>
    </main>
  );
}
