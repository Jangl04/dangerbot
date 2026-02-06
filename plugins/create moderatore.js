const handler = async (m, { conn, command, usedPrefix }) => {
  const target =
    (m.mentionedJid && m.mentionedJid[0]) ||
    (m.quoted && (m.quoted.sender || m.quoted.participant));

  if (!target) {
    return m.reply(`Uso: ${usedPrefix}${command} @utente\nOppure rispondi a un suo messaggio con ${usedPrefix}${command}`);
  }

  const sender = m.sender;
  const senderName = conn.getName ? await conn.getName(sender) : sender.split("@")[0];
  const targetName = conn.getName ? await conn.getName(target) : target.split("@")[0];

  const gifs = [
    "https://media.giphy.com/media/EVODaJHSXZGta/giphy.gif",
    // aggiungine altre qui (meglio giphy o un tuo link “raw” su github)
  ];

  let sentSticker = false;
  for (const url of gifs) {
    try {
      await conn.sendMessage(
        m.chat,
        { sticker: { url }, mentions: [sender, target] },
        { quoted: m }
      );
      sentSticker = true;
      break;
    } catch (e) {
      // prova la prossima
    }
  }

  const text = `😘 *${senderName}* bacia *${targetName}* 💋${sentSticker ? "" : "\n\n(⚠️ sticker non disponibile)"}`;
  await conn.sendMessage(m.chat, { text, mentions: [sender, target] }, { quoted: m });
};

handler.help = ["bacia @utente"];
handler.tags = ["fun"];
handler.command = /^bacia$/i;

export default handler;








