const handler = async (m, { conn, command, usedPrefix }) => {
  const target =
    (m.mentionedJid && m.mentionedJid[0]) ||
    (m.quoted && (m.quoted.sender || m.quoted.participant));

  if (!target) {
    return m.reply(`Uso: ${usedPrefix}${command} @utente\nOppure rispondi a un messaggio con ${usedPrefix}${command}`);
  }

  const sender = m.sender;

  const senderName = conn.getName ? await conn.getName(sender) : sender.split("@")[0];
  const targetName = conn.getName ? await conn.getName(target) : target.split("@")[0];

  // Reazione solo se c'è un messaggio citato
  if (m.quoted?.key) {
    await conn.sendMessage(m.chat, {
      react: { text: "😘", key: m.quoted.key }
    });
  }

  const text = `😘 *${senderName}* bacia *${targetName}* 💋`;
  await conn.sendMessage(m.chat, { text, mentions: [sender, target] }, { quoted: m });
};

handler.help = ["bacia @utente / (reply)"];
handler.tags = ["fun"];
handler.command = /^bacia$/i;

export default handler;












