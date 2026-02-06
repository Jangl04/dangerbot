const handler = async (m, { conn, command, usedPrefix }) => {
  const target =
    (m.mentionedJid && m.mentionedJid[0]) ||
    (m.quoted && (m.quoted.sender || m.quoted.participant));

  if (!target) {
    return m.reply(
      `Uso: ${usedPrefix}${command} @utente\nOppure rispondi a un suo messaggio con ${usedPrefix}${command}`
    );
  }

  const sender = m.sender;

  const senderName = conn.getName
    ? await conn.getName(sender)
    : sender.split("@")[0];

  const targetName = conn.getName
    ? await conn.getName(target)
    : target.split("@")[0];

  const text = `😘 *${senderName}* bacia *${targetName}* 💋`;

  // 👉 GIF bacio (puoi cambiarla quando vuoi)
  const kissGif = "https://media.tenor.com/6oKZK6a0x7AAAAAC/anime-kiss.gif";

  // 1️⃣ Mando lo sticker
  await conn.sendMessage(
    m.chat,
    {
      sticker: { url: kissGif },
      mentions: [sender, target],
    },
    { quoted: m }
  );

  // 2️⃣ Mando il messaggio testuale
  await conn.sendMessage(
    m.chat,
    {
      text,
      mentions: [sender, target],
    },
    { quoted: m }
  );
};

handler.help = ["bacia @utente"];
handler.tags = ["fun"];
handler.command = /^bacia$/i;

export default handler;







