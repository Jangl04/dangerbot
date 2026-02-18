// Plugin fatto da deadly

const handler = async (m, { conn }) => {
  if (!m.isGroup) return m.reply('☠️ Questo comando funziona solo nei gruppi.');

  // Metadata del gruppo
  const metadata = await conn.groupMetadata(m.chat);
  const participants = metadata.participants || [];

  // Conteggio admin (senza tag)
  const totalAdmins = participants.filter(p => p.admin).length;

  // Conteggio membri
  const totalMembers = participants.length;

  // Invite link
  let inviteCode;
  try {
    inviteCode = await conn.groupInviteCode(m.chat);
  } catch {
    inviteCode = null;
  }

  const caption = `
🔗 *Link gruppo:* ${inviteCode ? 'https://chat.whatsapp.com/' + inviteCode : '⚠️ Non disponibile'}\n👥 *Membri:* ${totalMembers}
🛡️ *Admin:* ${totalAdmins}\n🆔 *ID Gruppo:* ${m.chat}
`.trim();

  await conn.sendMessage(m.chat, {
    text: caption
  }, { quoted: m });
};

handler.help = ['link'];
handler.tags = ['group'];
handler.command = /^link$/i;
handler.group = true;
handler.botAdmin = true;

export default handler;