const handler = async (m, { conn, command, usedPrefix }) => {
  // target: prima menzione, altrimenti reply
  const target =
    (m.mentionedJid && m.mentionedJid[0]) ||
    (m.quoted && (m.quoted.sender || m.quoted.participant));

  if (!target) {
    return m.reply(
      `Uso: ${usedPrefix}${command} @utente\nOppure rispondi a un messaggio con ${usedPrefix}${command}`
    );
  }

  const sender = m.sender;

  const senderName = conn.getName
    ? await conn.getName(sender)
    : sender.split("@")[0];

  const targetName = conn.getName
    ? await conn.getName(target)
    : target.split("@")[0];

  // 👉 reazione SOLO se stai rispondendo a un messaggio
  if (m.quoted?.key) {
    try {
      await conn.sendMessage(m.chat, {
        react: { text: "😏", key: m.quoted.key }
      });
    } catch {}
  }

  // testo (non esplicito)
  const text = `😳 *${senderName}* sta scopando a pecora *${targetName}* 🔥`;

  await conn.sendMessage(
    m.chat,
    { text, mentions: [sender, target] },
    { quoted: m }
  );
};

handler.help = ["scopa @utente"];
handler.tags = ["fun"];
handler.command = ["scopa"];
handler.group = true;
handler.register = true;

export default handler;
