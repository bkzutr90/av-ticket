import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import crypto from 'node:crypto';
import { col, strip } from '@/lib/db';
import { isSnowflake } from '@/lib/util';

export const COOKIE = 'sid';
export const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // izin Discord dicek ulang tiap login

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');

// Cookie hanya berisi id acak; yang disimpan di DB hanya hash-nya (_id)
// Index TTL membuat MongoDB menghapus sesi kedaluwarsa sendiri, jadi tidak perlu bersih-bersih manual
let indexReady;
const sessions = async () => {
  const c = await col('web_sessions');
  indexReady ??= c.createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 }).catch((e) => { indexReady = undefined; throw e; });
  await indexReady;
  return c;
};

export async function createSession({ user, guilds }) {
  const id = crypto.randomBytes(32).toString('base64url');
  await (await sessions()).insertOne({
    _id: sha(id), user_id: user.id, username: user.global_name || user.username,
    avatar: user.avatar ?? null, guilds, expires_at: new Date(Date.now() + SESSION_TTL_MS),
  });
  return id;
}

export const getSession = cache(async () => {
  const sid = (await cookies()).get(COOKIE)?.value;
  if (!sid) return null;
  const row = await (await sessions()).findOne({ _id: sha(sid) });
  if (!row || row.expires_at < new Date()) return null;
  return {
    userId: row.user_id, username: row.username, avatar: row.avatar,
    guilds: row.guilds, // hanya server yang boleh dikelola user
  };
});

export async function destroySession() {
  const jar = await cookies();
  const sid = jar.get(COOKIE)?.value;
  if (sid) await (await sessions()).deleteOne({ _id: sha(sid) }).catch(() => {});
  jar.delete(COOKIE);
}

export async function requireUser() {
  const session = await getSession();
  if (!session) redirect('/?error=login_required');
  return session;
}

// Tanpa redirect/throw, aman dipakai di route handler
export async function getGuildAccess(guildId) {
  if (!isSnowflake(guildId)) return null;
  const session = await getSession();
  const guild = session?.guilds.find((g) => g.id === guildId);
  if (!guild) return null;
  const cfg = strip(await (await col('guild_config')).findOne({ guild_id: guildId }));
  if (!cfg) return null; // bot belum di-setup di server ini
  return { session, guild, cfg };
}

// WAJIB dipanggil di setiap page & server action: layout tidak dirender ulang saat navigasi,
// jadi pengecekan di layout saja tidak cukup.
export async function requireGuild(guildId) {
  await requireUser();
  const access = await getGuildAccess(guildId);
  if (!access) notFound();
  return access;
}

export async function guildsWithBot(guildIds) {
  if (!guildIds.length) return new Set();
  const rows = await (await col('guild_config'))
    .find({ guild_id: { $in: guildIds } }, { projection: { guild_id: 1 } }).toArray();
  return new Set(rows.map((r) => r.guild_id));
}
