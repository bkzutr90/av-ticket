'use server';

import { redirect } from 'next/navigation';
import { requireGuild } from '@/lib/session';
import { col } from '@/lib/db';

export async function saveAutoClose(formData) {
  const guildId = String(formData.get('guildId') || '');
  await requireGuild(guildId); // server action = endpoint publik, cek izin lagi di sini

  const hours = Number(formData.get('hours'));
  if (!Number.isInteger(hours) || hours < 0 || hours > 720) {
    redirect(`/dashboard/${guildId}/settings?msg=invalid`);
  }
  await (await col('guild_config')).updateOne({ guild_id: guildId }, { $set: { auto_close_hours: hours } });
  redirect(`/dashboard/${guildId}/settings?msg=saved`);
}
