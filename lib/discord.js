const API = 'https://discord.com/api/v10';
const ADMINISTRATOR = 0x8n;
const MANAGE_GUILD = 0x20n;

export const appUrl = () => (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
export const redirectUri = () => `${appUrl()}/api/auth/callback`;

export function authorizeUrl(state) {
  const p = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    response_type: 'code',
    redirect_uri: redirectUri(),
    scope: 'identify guilds',
    state,
    prompt: 'none',
  });
  return `https://discord.com/oauth2/authorize?${p}`;
}

export async function exchangeCode(code) {
  const res = await fetch(`${API}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID,
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri(),
    }),
  });
  if (!res.ok) throw new Error(`Tukar kode OAuth gagal (${res.status})`);
  return res.json();
}

async function userFetch(path, token) {
  const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Discord ${path} gagal (${res.status})`);
  return res.json();
}
export const fetchMe = (token) => userFetch('/users/@me', token);
export const fetchGuilds = (token) => userFetch('/users/@me/guilds', token);

// Sama dengan aturan bot: /ticket setup butuh Manage Server (Administrator & pemilik otomatis lolos)
export const canManage = (g) =>
  g.owner || (BigInt(g.permissions) & (ADMINISTRATOR | MANAGE_GUILD)) !== 0n;

export const guildIcon = (g) =>
  g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=64` : null;

export const avatarUrl = (u) =>
  u.avatar ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=64` : null;

export function inviteUrl() {
  const perms = process.env.BOT_INVITE_PERMISSIONS || '268561424';
  return `https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&scope=bot%20applications.commands&permissions=${perms}`;
}

// ---------- nama user (opsional, butuh DISCORD_BOT_TOKEN) ----------
const cache = (globalThis.__userCache ??= new Map()); // id -> { name, at }
const TTL = 60 * 60 * 1000;

export async function lookupUsers(ids) {
  const out = {};
  const unique = [...new Set(ids.filter(Boolean))].slice(0, 40);
  const token = process.env.DISCORD_BOT_TOKEN;

  await Promise.all(unique.map(async (id) => {
    const hit = cache.get(id);
    if (hit && Date.now() - hit.at < TTL) { out[id] = hit.name; return; }
    if (!token || !/^\d+$/.test(id)) return;
    try {
      const res = await fetch(`${API}/users/${id}`, { headers: { Authorization: `Bot ${token}` } });
      if (!res.ok) return;
      const u = await res.json();
      const name = u.global_name || u.username;
      cache.set(id, { name, at: Date.now() });
      out[id] = name;
    } catch { /* abaikan, tampilkan ID saja */ }
  }));
  return out;
}

// Nama kalau ada, kalau tidak ID mentah
export const nameOf = (names, id) => (id ? names[id] || id : '-');
