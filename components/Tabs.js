'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '', label: 'Ringkasan' },
  { href: '/tickets', label: 'Tiket' },
  { href: '/settings', label: 'Pengaturan' },
];

export default function Tabs({ base }) {
  const path = usePathname();
  return (
    <nav className="tabs" aria-label="Bagian server">
      {TABS.map((t) => {
        const href = base + t.href;
        const active = t.href === '' ? path === base : path.startsWith(href);
        return (
          <Link key={t.label} href={href} aria-current={active ? 'page' : undefined}>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
