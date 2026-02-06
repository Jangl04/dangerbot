const handler = async (m, { conn, command, usedPrefix }) => {
  // 1) Prendo il target: prima menzione, altrimenti autore del messaggio a cui stai rispondendo
  const target =
    (m.mentionedJid && m.mentionedJid[0]) ||
    (m.quoted && (m.quoted.sender || m.quoted.participant));

  if (!target) {
    return m.reply(
      `Uso: ${usedPrefix}${command} @utente\nOppure rispondi a un suo messaggio con ${usedPrefix}${command}`
    );
  }

  // 2) Chi comanda (tu)
  const sender = m.sender;

  // 3) Nomi "carini": se il bot ha getName, usalo, altrimenti fallback sul numero
  const senderName = conn.getName ? await conn.getName(sender) : sender.split("@")[0];
  const targetName = conn.getName ? await conn.getName(target) : target.split("@")[0];

  // 4) Messaggio finale
  const text = `😘 *${senderName}* bacia *${targetName}* 💋`;

  // 5) Taggo entrambi così WhatsApp mostra le menzioni
  await conn.sendMessage(
    m.chat,
    { text, mentions: [sender, target] },
    { quoted: m }
  );
};

handler.help = ["bacia @utente"];
handler.tags = ["fun"];
handler.command = /^bacia$/i;

export default handler;










