const handler = async (m, { conn, command, usedPrefix }) => {
  if (!m.quoted) {
    return m.reply(`Uso: rispondi a un messaggio e scrivi ${usedPrefix}${command}`);
  }

  const target = (m.quoted.sender || m.quoted.participant);
  const sender = m.sender;

  const senderName = conn.getName ? await conn.getName(sender) : sender.split("@")[0];
  const targetName = conn.getName ? await conn.getName(target) : target.split("@")[0];

  // 1) Reazione 😘 al messaggio citato
  await conn.sendMessage(m.chat, {
    react: { text: "😘", key: m.quoted.key }
  });

  // 2) Testo
  const text = `😘 *${senderName}* bacia *${targetName}* 💋`;
  await conn.sendMessage(m.chat, { text, mentions: [sender, target] }, { quoted: m });
};

handler.help = ["bacia (in risposta)"];
handler.tags = ["fun"];
handler.command = /^bacia$/i;

export default handler;











