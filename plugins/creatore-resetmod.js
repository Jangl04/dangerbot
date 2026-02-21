import fetch from 'node-fetch'

const handler = async (m, { conn }) => {
  if (!m.isGroup)
    return m.reply('❌ Questo comando funziona solo nei gruppi.');

  const users = global.db.data.users;
  let removed = [];

  for (let jid in users) {
    if (users[jid].premium) {
      users[jid].premium = false;
      users[jid].premiumTime = 0;
      removed.push(jid);
    }
  }

  if (removed.length === 0)
    return m.reply('ℹ️ Non ci sono MODERATOR attivi da rimuovere.');

  // 📸 Thumbnail
  let thumb;
  try {
    const ppUrl = await conn.profilePictureUrl(m.chat, 'image');
    const res = await fetch(ppUrl);
    thumb = await res.buffer();
  } catch {
    const res = await fetch('https://i.ibb.co/3Fh9V6p/avatar-contact.png');
    thumb = await res.buffer();
  }

  const list = removed
    .map((jid, i) => `☠️ ${i + 1}. @${jid.split('@')[0]}`)
    .join('\n');

  const caption = `
☠──────────────☠
RITUALE DI RESET 
☠──────────────☠

🔥 Tutti i MODERATOR sono stati rimossi.

👥 MODERATOR RIMOSSI:
${list}

🔒 Privilegi annullati.
⚡ Azione irreversibile!
`.trim();

  await conn.sendMessage(
    m.chat,
    {
      text: caption,
      mentions: removed,
      contextInfo: {
        jpegThumbnail: thumb
      }
    },
    { quoted: m }
  );
};

handler.help = ['resetmod'];
handler.tags = ['owner'];
handler.command = ['resetmod'];
handler.group = true;
handler.owner = true;

export default handler;