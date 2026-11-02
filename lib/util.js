const TZ = 'Asia/Jakarta';
const dateFmt = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: TZ });

export const fmtDate = (ms) => (ms ? dateFmt.format(new Date(ms)) : '-');

export function fmtDuration(ms) {
  if (ms == null || Number.isNaN(ms)) return '-';
  const m = Math.round(ms / 60000);
  if (m < 1) return '<1 mnt';
  if (m < 60) return `${m} mnt`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  if (h < 24) return rm ? `${h} j ${rm} mnt` : `${h} j`;
  const d = Math.floor(h / 24);
  const rh = h % 24;
  return rh ? `${d} h ${rh} j` : `${d} h`;
}

export const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);
export const pad = (n) => String(n).padStart(4, '0');
export const isSnowflake = (s) => typeof s === 'string' && /^\d{15,25}$/.test(s);

export const PRIORITIES = {
  low: { label: 'Rendah', color: '#3b82c4' },
  normal: { label: 'Normal', color: '#3f9b6b' },
  high: { label: 'Tinggi', color: '#d9822b' },
  urgent: { label: 'Urgent', color: '#d1383d' },
};
export const getPriority = (k) => PRIORITIES[k] || PRIORITIES.normal;

// closed_by berisi ID user, atau penanda khusus dari bot
export const closerLabel = (v, name) =>
  v === 'auto' ? 'Otomatis (tidak aktif)' : v === 'deleted' ? 'Channel dihapus manual' : name || v || '-';
