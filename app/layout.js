import './globals.css';
import { Bricolage_Grotesque, Instrument_Sans } from 'next/font/google';

const head = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-head', display: 'swap' });
const body = Instrument_Sans({ subsets: ['latin'], variable: '--font-body', display: 'swap' });

export const metadata = {
  title: 'Dasbor Tiket',
  description: 'Statistik dan riwayat tiket untuk server Discord kamu.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`${head.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
