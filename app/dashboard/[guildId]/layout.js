import { requireGuild } from '@/lib/session';
import Tabs from '@/components/Tabs';

export default async function GuildLayout({ children, params }) {
  const { guildId } = await params;
  const { guild } = await requireGuild(guildId);

  return (
    <>
      <p className="crumb"><a href="/dashboard">Semua server</a></p>
      <h1 className="gtitle">{guild.name}</h1>
      <Tabs base={`/dashboard/${guildId}`} />
      {children}
    </>
  );
}
